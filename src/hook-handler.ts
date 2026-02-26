/**
 * Hook handler — the bridge between Claude Code hooks and claude-sfx.
 *
 * All hooks route here. Reads JSON from stdin, determines the verb + modifiers,
 * and dispatches to `generateVerb → playSync`. Runs in-process (no child spawn)
 * for minimal latency.
 *
 * Usage (called by Claude Code hooks, not directly by users):
 *   echo '{"tool_name":"Read",...}' | claude-sfx hook-handler PostToolUse
 *   echo '{"session_id":"..."}' | claude-sfx hook-handler SessionStart
 */

import {
  generateVerb,
  generateSessionStart,
  generateSessionEnd,
  type Verb,
  type PlayOptions,
} from "./verbs.js";
import { applyVolume } from "./synth.js";
import { playSync } from "./player.js";
import { resolveProfile } from "./profiles.js";
import { loadConfig, resolveProfileName, volumeToGain } from "./config.js";
import { guardPlay } from "./guard.js";
import { startAmbient, resolveAmbient, isAmbientRunning } from "./ambient.js";

// --- Tool → Verb mapping ---

interface VerbMapping {
  verb: Verb;
  options?: PlayOptions;
}

/** Map a PostToolUse tool_name to a verb + options. */
function mapToolToVerb(toolName: string, input: StdinPayload): VerbMapping | null {
  // Exact matches first
  switch (toolName) {
    case "Read":
      return { verb: "intake" };
    case "Edit":
      return { verb: "transform" };
    case "Write":
    case "NotebookEdit":
      return { verb: "commit" };
    case "Grep":
    case "Glob":
      return { verb: "navigate" };
    case "WebFetch":
    case "WebSearch":
      return { verb: "intake", options: { scope: "remote" } };
    case "TodoWrite":
      return { verb: "commit" };
  }

  // Bash — detect git commands and exit code
  if (toolName === "Bash") {
    return mapBashVerb(input);
  }

  // Task (subagent return) — treat as remote commit
  if (toolName === "Task") {
    return { verb: "commit", options: { scope: "remote" } };
  }

  // MCP tools — treat as remote intake
  if (toolName.startsWith("mcp__")) {
    return { verb: "intake", options: { scope: "remote" } };
  }

  // Unknown tool — skip
  return null;
}

/** Map Bash tool usage to a verb, detecting git commands and exit codes. */
function mapBashVerb(input: StdinPayload): VerbMapping {
  const toolInput = typeof input.tool_input === "object"
    ? JSON.stringify(input.tool_input)
    : String(input.tool_input ?? "");
  const exitCode = input.exit_code ?? 0;
  const status = exitCode === 0 ? "ok" : "err";

  // Git push/pull → sync with direction
  if (/git\s+push/i.test(toolInput)) {
    return { verb: "sync", options: { direction: "up", status } };
  }
  if (/git\s+(pull|fetch)/i.test(toolInput)) {
    return { verb: "sync", options: { direction: "down", status } };
  }
  // Git commit → commit verb
  if (/git\s+commit/i.test(toolInput)) {
    return { verb: "commit", options: { status } };
  }
  // npm/yarn/pnpm install → intake (bringing deps in)
  if (/(?:npm|yarn|pnpm|bun)\s+install/i.test(toolInput)) {
    return { verb: "intake", options: { scope: "remote", status } };
  }
  // Test commands → execute with status
  if (/(?:npm\s+test|pytest|jest|vitest|cargo\s+test|dotnet\s+test)/i.test(toolInput)) {
    return { verb: "execute", options: { status } };
  }
  // Build commands → execute with status
  if (/(?:npm\s+run\s+build|tsc|cargo\s+build|dotnet\s+build|make\b)/i.test(toolInput)) {
    return { verb: "execute", options: { status } };
  }
  // mv/cp/rename → move
  if (/\b(?:mv|cp|rename|move)\b/i.test(toolInput)) {
    return { verb: "move" };
  }
  // rm/del → move with err-ish tone (destructive)
  if (/\b(?:rm|del|rmdir)\b/i.test(toolInput)) {
    return { verb: "move", options: { status: "warn" } };
  }

  // Default bash → execute
  return { verb: "execute", options: { status } };
}

// --- Stdin parsing ---

interface StdinPayload {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_output?: unknown;
  exit_code?: number;
  error_message?: string;
  source?: string;
  reason?: string;
  [key: string]: unknown;
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
    // If stdin is a TTY (no pipe), resolve immediately with empty
    if (process.stdin.isTTY) {
      resolve("");
    }
  });
}

// --- Play helper ---

function playVerb(verb: Verb, options: PlayOptions = {}): void {
  const config = loadConfig();

  // Guard check
  const guard = guardPlay(verb, config);
  if (!guard.allowed) return;

  const profileName = resolveProfileName(config);
  const profile = resolveProfile(profileName);
  let buffer = generateVerb(profile, verb, options);

  const gain = volumeToGain(config.volume);
  if (gain < 1) {
    buffer = applyVolume(buffer, gain);
  }

  playSync(buffer);
}

function playSession(type: "start" | "end"): void {
  const config = loadConfig();
  if (config.muted) return;

  const profileName = resolveProfileName(config);
  const profile = resolveProfile(profileName);
  const gen = type === "start" ? generateSessionStart : generateSessionEnd;
  let buffer = gen(profile);

  const gain = volumeToGain(config.volume);
  if (gain < 1) {
    buffer = applyVolume(buffer, gain);
  }

  playSync(buffer);
}

// --- Main handler ---

export async function handleHook(eventName: string): Promise<void> {
  const raw = await readStdin();
  let payload: StdinPayload = {};
  try {
    if (raw.trim()) {
      payload = JSON.parse(raw);
    }
  } catch {
    // Malformed stdin — not an error, just skip
    return;
  }

  switch (eventName) {
    case "SessionStart":
      playSession("start");
      break;

    case "Stop":
      // Stop any ambient drone on session end
      if (isAmbientRunning()) {
        const config = loadConfig();
        const profile = resolveProfile(resolveProfileName(config));
        resolveAmbient(profile);
      }
      playSession("end");
      break;

    case "PostToolUse": {
      const toolName = payload.tool_name;
      if (!toolName) return;
      const mapping = mapToolToVerb(toolName, payload);
      if (!mapping) return;
      playVerb(mapping.verb, mapping.options ?? {});
      break;
    }

    case "PostToolUseFailure": {
      // Tool failed — play the verb with error status
      const toolName = payload.tool_name;
      if (!toolName) return;
      const mapping = mapToolToVerb(toolName, payload);
      if (!mapping) return;
      const opts = { ...mapping.options, status: "err" as const };
      playVerb(mapping.verb, opts);
      break;
    }

    case "SubagentStart":
      playVerb("move", { scope: "remote" });
      break;

    case "SubagentStop": {
      const exitCode = payload.exit_code ?? 0;
      playVerb("commit", {
        scope: "remote",
        status: exitCode === 0 ? "ok" : "err",
      });
      break;
    }

    default:
      // Unknown event — ignore
      break;
  }
}
