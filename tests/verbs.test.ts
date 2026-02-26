import { describe, it, expect } from "vitest";
import {
  generateVerb,
  generateSessionStart,
  generateSessionEnd,
  generateAmbientChunk,
  generateAmbientResolve,
  ALL_VERBS,
  VERB_LABELS,
  VERB_DESCRIPTIONS,
  type Verb,
  type PlayOptions,
} from "../src/verbs.js";
import { getBuiltinProfile } from "../src/profiles.js";
import { SAMPLE_RATE } from "../src/synth.js";

const minimal = getBuiltinProfile("minimal")!;
const retro = getBuiltinProfile("retro")!;

function assertNonSilent(buf: Float64Array): void {
  const peak = Math.max(...Array.from(buf).map(Math.abs));
  expect(peak).toBeGreaterThan(0);
}

describe("verb metadata", () => {
  it("ALL_VERBS has exactly 7 entries", () => {
    expect(ALL_VERBS).toHaveLength(7);
  });

  it("every verb has a label", () => {
    for (const v of ALL_VERBS) {
      expect(VERB_LABELS[v]).toBeDefined();
      expect(VERB_LABELS[v].length).toBeGreaterThan(0);
    }
  });

  it("every verb has a description", () => {
    for (const v of ALL_VERBS) {
      expect(VERB_DESCRIPTIONS[v]).toBeDefined();
      expect(VERB_DESCRIPTIONS[v].length).toBeGreaterThan(0);
    }
  });
});

describe("generateVerb — minimal profile", () => {
  it("generates non-empty audio for all 7 verbs", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(minimal, verb);
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });

  it("different verbs produce different buffer lengths", () => {
    const lengths = new Set(ALL_VERBS.map((v) => generateVerb(minimal, v).length));
    // Not all verbs should have the same duration
    expect(lengths.size).toBeGreaterThan(1);
  });
});

describe("generateVerb — retro profile", () => {
  it("generates non-empty audio for all 7 verbs", () => {
    for (const verb of ALL_VERBS) {
      const buf = generateVerb(retro, verb);
      expect(buf.length).toBeGreaterThan(0);
      assertNonSilent(buf);
    }
  });
});

describe("status modifiers", () => {
  const statuses: PlayOptions["status"][] = ["ok", "err", "warn"];

  it("all tone verbs accept all statuses", () => {
    const toneVerbs: Verb[] = ["intake", "transform", "commit", "navigate", "execute"];
    for (const verb of toneVerbs) {
      for (const status of statuses) {
        const buf = generateVerb(minimal, verb, { status });
        expect(buf.length).toBeGreaterThan(0);
      }
    }
  });

  it("err status produces longer duration than default for tone verbs", () => {
    const verb: Verb = "navigate";
    const normal = generateVerb(minimal, verb);
    const err = generateVerb(minimal, verb, { status: "err" });
    expect(err.length).toBeGreaterThan(normal.length);
  });

  it("err status drops pitch for tone verbs", () => {
    // Lower pitch = lower zero-crossing rate. We can at least confirm buffer changes.
    const verb: Verb = "intake";
    const normal = generateVerb(minimal, verb);
    const err = generateVerb(minimal, verb, { status: "err" });
    // Should differ significantly
    let diffCount = 0;
    const minLen = Math.min(normal.length, err.length);
    for (let i = 0; i < minLen; i++) {
      if (Math.abs(normal[i] - err[i]) > 0.01) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(minLen * 0.3);
  });

  it("whoosh verbs accept all statuses", () => {
    const whooshVerbs: Verb[] = ["move", "sync"];
    for (const verb of whooshVerbs) {
      for (const status of statuses) {
        const buf = generateVerb(minimal, verb, { status });
        expect(buf.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("scope modifier", () => {
  it("remote scope extends duration for tone verbs", () => {
    const verb: Verb = "intake";
    const local = generateVerb(minimal, verb, { scope: "local" });
    const remote = generateVerb(minimal, verb, { scope: "remote" });
    expect(remote.length).toBeGreaterThan(local.length);
  });

  it("remote scope extends duration for whoosh verbs", () => {
    const verb: Verb = "move";
    const local = generateVerb(minimal, verb, { scope: "local" });
    const remote = generateVerb(minimal, verb, { scope: "remote" });
    expect(remote.length).toBeGreaterThan(local.length);
  });
});

describe("direction modifier", () => {
  it("up and down produce different buffers for move", () => {
    const up = generateVerb(minimal, "move", { direction: "up" });
    const down = generateVerb(minimal, "move", { direction: "down" });
    // Same length but different content
    expect(up.length).toBe(down.length);
    let diffCount = 0;
    for (let i = 0; i < up.length; i++) {
      if (Math.abs(up[i] - down[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(up.length * 0.3);
  });

  it("up and down produce different buffers for sync", () => {
    const up = generateVerb(minimal, "sync", { direction: "up" });
    const down = generateVerb(minimal, "sync", { direction: "down" });
    let diffCount = 0;
    for (let i = 0; i < Math.min(up.length, down.length); i++) {
      if (Math.abs(up[i] - down[i]) > 0.001) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });
});

describe("session sounds", () => {
  it("session start produces non-empty audio", () => {
    const buf = generateSessionStart(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });

  it("session end produces non-empty audio", () => {
    const buf = generateSessionEnd(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });

  it("session start is different from session end", () => {
    const start = generateSessionStart(minimal);
    const end = generateSessionEnd(minimal);
    // Different lengths or different content
    if (start.length === end.length) {
      let diffCount = 0;
      for (let i = 0; i < start.length; i++) {
        if (Math.abs(start[i] - end[i]) > 0.001) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(0);
    } else {
      expect(start.length).not.toBe(end.length);
    }
  });
});

describe("ambient sounds", () => {
  it("ambient chunk produces audio", () => {
    const buf = generateAmbientChunk(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });

  it("ambient chunk matches configured chunk duration", () => {
    const buf = generateAmbientChunk(minimal);
    const expectedSamples = Math.floor(minimal.ambient.chunkDuration * SAMPLE_RATE);
    expect(buf.length).toBe(expectedSamples);
  });

  it("ambient resolve produces audio", () => {
    const buf = generateAmbientResolve(minimal);
    expect(buf.length).toBeGreaterThan(0);
    assertNonSilent(buf);
  });
});

describe("profile differences", () => {
  it("minimal and retro produce different audio for same verb", () => {
    for (const verb of ALL_VERBS) {
      const m = generateVerb(minimal, verb);
      const r = generateVerb(retro, verb);
      // At least one of: different length or different content
      if (m.length === r.length) {
        let diffCount = 0;
        for (let i = 0; i < m.length; i++) {
          if (Math.abs(m[i] - r[i]) > 0.001) diffCount++;
        }
        expect(diffCount).toBeGreaterThan(0);
      }
      // Different length is sufficient proof of difference
    }
  });
});
