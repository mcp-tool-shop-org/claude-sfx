import { describe, it, expect } from "vitest";
import {
  getBuiltinProfile,
  listBuiltinProfiles,
  resolveProfile,
  DEFAULT_PROFILE_NAME,
  type Profile,
} from "../src/profiles.js";
import { ALL_VERBS } from "../src/verbs.js";

describe("built-in profiles", () => {
  it("lists minimal and retro", () => {
    const names = listBuiltinProfiles();
    expect(names).toContain("minimal");
    expect(names).toContain("retro");
    expect(names).toHaveLength(2);
  });

  it("default profile name is minimal", () => {
    expect(DEFAULT_PROFILE_NAME).toBe("minimal");
  });

  it("getBuiltinProfile returns undefined for unknown names", () => {
    expect(getBuiltinProfile("nonexistent")).toBeUndefined();
  });

  for (const name of ["minimal", "retro"]) {
    describe(`profile: ${name}`, () => {
      const profile = getBuiltinProfile(name)!;

      it("exists", () => {
        expect(profile).toBeDefined();
      });

      it("has correct name", () => {
        expect(profile.name).toBe(name);
      });

      it("has a description", () => {
        expect(profile.description.length).toBeGreaterThan(0);
      });

      it("has configs for all 7 verbs", () => {
        for (const verb of ALL_VERBS) {
          expect(profile.verbs[verb]).toBeDefined();
        }
      });

      it("tone verbs have correct type", () => {
        const toneVerbs = ["intake", "transform", "commit", "navigate", "execute"];
        for (const verb of toneVerbs) {
          expect(profile.verbs[verb].type).toBe("tone");
        }
      });

      it("whoosh verbs have correct type", () => {
        const whooshVerbs = ["move", "sync"];
        for (const verb of whooshVerbs) {
          expect(profile.verbs[verb].type).toBe("whoosh");
        }
      });

      it("sync has a tonal anchor", () => {
        const sync = profile.verbs.sync;
        expect(sync.type).toBe("whoosh");
        if (sync.type === "whoosh") {
          expect(sync.tonalAnchor).toBeDefined();
        }
      });

      it("execute has a noise burst", () => {
        const exec = profile.verbs.execute;
        expect(exec.type).toBe("tone");
        if (exec.type === "tone") {
          expect(exec.noiseBurst).toBeDefined();
        }
      });

      it("has session start config", () => {
        expect(profile.sessionStart).toBeDefined();
        expect(profile.sessionStart.tone1).toBeDefined();
        expect(profile.sessionStart.tone2).toBeDefined();
        expect(profile.sessionStart.staggerSeconds).toBeGreaterThan(0);
      });

      it("has session end config", () => {
        expect(profile.sessionEnd).toBeDefined();
        expect(profile.sessionEnd.tone1).toBeDefined();
        expect(profile.sessionEnd.tone2).toBeDefined();
      });

      it("session start is ascending (tone2 > tone1)", () => {
        expect(profile.sessionStart.tone2.frequency).toBeGreaterThan(
          profile.sessionStart.tone1.frequency
        );
      });

      it("session end is descending (tone1 > tone2)", () => {
        expect(profile.sessionEnd.tone1.frequency).toBeGreaterThan(
          profile.sessionEnd.tone2.frequency
        );
      });

      it("has ambient config", () => {
        expect(profile.ambient).toBeDefined();
        expect(profile.ambient.droneFreq).toBeGreaterThan(0);
        expect(profile.ambient.chunkDuration).toBeGreaterThan(0);
      });

      it("all verb gains are between 0 and 1", () => {
        for (const verb of ALL_VERBS) {
          const cfg = profile.verbs[verb];
          expect(cfg.gain).toBeGreaterThan(0);
          expect(cfg.gain).toBeLessThanOrEqual(1);
        }
      });

      it("all verb durations are positive and reasonable", () => {
        for (const verb of ALL_VERBS) {
          const cfg = profile.verbs[verb];
          expect(cfg.duration).toBeGreaterThan(0);
          expect(cfg.duration).toBeLessThan(2); // No verb should be >2s
        }
      });
    });
  }
});

describe("resolveProfile", () => {
  it("resolves minimal by name", () => {
    const profile = resolveProfile("minimal");
    expect(profile.name).toBe("minimal");
  });

  it("resolves retro by name", () => {
    const profile = resolveProfile("retro");
    expect(profile.name).toBe("retro");
  });

  it("throws for unknown profile name", () => {
    expect(() => resolveProfile("nonexistent")).toThrow(/Unknown profile/);
  });
});
