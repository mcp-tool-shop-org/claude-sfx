import { describe, it, expect, vi, beforeEach } from "vitest";
import { volumeToGain, resolveProfileName, type SfxConfig } from "../src/config.js";

function makeConfig(overrides: Partial<SfxConfig> = {}): SfxConfig {
  return {
    profile: "minimal",
    volume: 80,
    muted: false,
    quietHours: null,
    disabledVerbs: [],
    repoProfiles: {},
    ...overrides,
  };
}

describe("volumeToGain", () => {
  it("0 → 0.0", () => {
    expect(volumeToGain(0)).toBe(0);
  });

  it("100 → 1.0", () => {
    expect(volumeToGain(100)).toBe(1);
  });

  it("50 → 0.5", () => {
    expect(volumeToGain(50)).toBe(0.5);
  });

  it("clamps negative values to 0", () => {
    expect(volumeToGain(-10)).toBe(0);
  });

  it("clamps values above 100 to 1", () => {
    expect(volumeToGain(200)).toBe(1);
  });
});

describe("resolveProfileName", () => {
  it("returns global profile when no cwd", () => {
    const cfg = makeConfig({ profile: "retro" });
    expect(resolveProfileName(cfg)).toBe("retro");
  });

  it("returns global profile when cwd has no override", () => {
    const cfg = makeConfig({ profile: "minimal" });
    expect(resolveProfileName(cfg, "/some/path")).toBe("minimal");
  });

  it("returns repo override when cwd matches", () => {
    const cfg = makeConfig({
      profile: "minimal",
      repoProfiles: { "/my/project": "retro" },
    });
    expect(resolveProfileName(cfg, "/my/project")).toBe("retro");
  });

  it("falls back to global when cwd doesn't match any override", () => {
    const cfg = makeConfig({
      profile: "minimal",
      repoProfiles: { "/other/project": "retro" },
    });
    expect(resolveProfileName(cfg, "/my/project")).toBe("minimal");
  });
});

describe("isQuietTime", () => {
  // We import the function but it depends on Date.now() internally.
  // We test the logic via the guard tests since isQuietTime uses `new Date()`.
  // Here we just verify the null case.
  it("returns false when quietHours is null", async () => {
    const { isQuietTime } = await import("../src/config.js");
    const cfg = makeConfig({ quietHours: null });
    expect(isQuietTime(cfg)).toBe(false);
  });
});
