/**
 * Ambient drone system for long-running operations.
 * Starts a low background drone that loops until resolved.
 *
 * Flow: claude-sfx ambient-start → drone plays in background
 *       claude-sfx ambient-resolve → drone stops, stinger plays
 *
 * Implementation: writes a PID file so `ambient-resolve` can find and kill the drone.
 */

import { writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, execSync } from "node:child_process";
import { generateAmbientChunk, generateAmbientResolve } from "./verbs.js";
import { encodeWav } from "./synth.js";
import { playSync, saveWav } from "./player.js";
import type { Profile } from "./profiles.js";

const PID_FILE = join(tmpdir(), "claude-sfx-ambient.pid");
const DRONE_WAV = join(tmpdir(), "claude-sfx-drone.wav");

/** Check if an ambient drone is currently running. */
export function isAmbientRunning(): boolean {
  if (!existsSync(PID_FILE)) return false;
  try {
    const pid = parseInt(readFileSync(PID_FILE, "utf-8").trim(), 10);
    // Check if process is alive (signal 0 = existence check)
    process.kill(pid, 0);
    return true;
  } catch {
    // Process dead or PID file stale — clean up
    try { unlinkSync(PID_FILE); } catch { /* ignore */ }
    return false;
  }
}

/**
 * Start the ambient drone in a background process.
 * The drone loops a WAV file using the system player until killed.
 */
export function startAmbient(profile: Profile): { started: boolean; pid?: number } {
  if (isAmbientRunning()) {
    return { started: false };
  }

  // Generate the drone chunk WAV
  const chunk = generateAmbientChunk(profile);
  const wavData = encodeWav(chunk);
  writeFileSync(DRONE_WAV, wavData);

  // Spawn a looping player process
  const platform = process.platform;
  let child;

  if (platform === "win32") {
    // PowerShell loop: plays the WAV repeatedly until killed
    child = spawn("powershell", [
      "-NoProfile",
      "-Command",
      `while($true){(New-Object Media.SoundPlayer '${DRONE_WAV}').PlaySync()}`,
    ], {
      stdio: "ignore",
      detached: true,
    });
  } else if (platform === "darwin") {
    // macOS: loop with afplay
    child = spawn("bash", [
      "-c",
      `while true; do afplay "${DRONE_WAV}"; done`,
    ], {
      stdio: "ignore",
      detached: true,
    });
  } else {
    // Linux: loop with aplay/paplay
    const player = (() => {
      try { execSync("which paplay", { stdio: "ignore" }); return "paplay"; }
      catch { return "aplay -q"; }
    })();
    child = spawn("bash", [
      "-c",
      `while true; do ${player} "${DRONE_WAV}"; done`,
    ], {
      stdio: "ignore",
      detached: true,
    });
  }

  child.unref();

  if (child.pid) {
    writeFileSync(PID_FILE, String(child.pid));
    return { started: true, pid: child.pid };
  }

  return { started: false };
}

/** Stop the ambient drone and play the resolution stinger. */
export function resolveAmbient(profile: Profile): { resolved: boolean } {
  if (!existsSync(PID_FILE)) {
    return { resolved: false };
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, "utf-8").trim(), 10);

    // Kill the drone process tree
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
      } catch { /* already dead */ }
    } else {
      try {
        // Kill the process group (negative PID)
        process.kill(-pid, "SIGTERM");
      } catch {
        try { process.kill(pid, "SIGTERM"); } catch { /* already dead */ }
      }
    }
  } catch {
    // PID parse error or kill error — move on
  }

  // Clean up
  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
  try { unlinkSync(DRONE_WAV); } catch { /* ignore */ }

  // Play the resolution stinger
  const stinger = generateAmbientResolve(profile);
  playSync(stinger);

  return { resolved: true };
}

/** Stop the ambient drone without playing the stinger. */
export function stopAmbient(): { stopped: boolean } {
  if (!existsSync(PID_FILE)) {
    return { stopped: false };
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, "utf-8").trim(), 10);
    if (process.platform === "win32") {
      try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); }
      catch { /* already dead */ }
    } else {
      try { process.kill(-pid, "SIGTERM"); }
      catch {
        try { process.kill(pid, "SIGTERM"); } catch { /* already dead */ }
      }
    }
  } catch { /* ignore */ }

  try { unlinkSync(PID_FILE); } catch { /* ignore */ }
  try { unlinkSync(DRONE_WAV); } catch { /* ignore */ }

  return { stopped: true };
}
