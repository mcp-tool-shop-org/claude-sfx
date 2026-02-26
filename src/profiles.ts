/**
 * Profile system — configurable sound palettes.
 * Each profile defines synthesis parameters for every verb + session sounds.
 * Profiles are JSON-serializable, so users can create their own.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Waveform, Envelope } from "./synth.js";

// --- Profile schema ---

/** Synthesis params for a tone-based verb (intake, transform, commit, navigate, execute). */
export interface ToneVerbConfig {
  type: "tone";
  waveform: Waveform;
  frequency: number;
  frequencyEnd?: number;
  duration: number;
  envelope: Envelope;
  gain: number;
  fmRatio?: number;
  fmDepth?: number;
  harmonicGain?: number;
  /** If true, mix a short noise burst underneath (execute verb). */
  noiseBurst?: {
    duration: number;
    gain: number;
  };
}

/** Synthesis params for a whoosh-based verb (move, sync). */
export interface WhooshVerbConfig {
  type: "whoosh";
  duration: number;
  /** Freq pair for direction=up. [start, end] */
  freqUp: [number, number];
  /** Freq pair for direction=down. [start, end] */
  freqDown: [number, number];
  bandwidth: number;
  envelope: Envelope;
  gain: number;
  /** Optional tonal anchor mixed underneath (sync verb). */
  tonalAnchor?: {
    freqUp: [number, number];
    freqDown: [number, number];
    envelope: Envelope;
    gain: number;
  };
}

export type VerbConfig = ToneVerbConfig | WhooshVerbConfig;

/** A two-tone chime (session start/end). */
export interface ChimeConfig {
  tone1: {
    waveform: Waveform;
    frequency: number;
    duration: number;
    envelope: Envelope;
    gain: number;
    harmonicGain?: number;
  };
  tone2: {
    waveform: Waveform;
    frequency: number;
    duration: number;
    envelope: Envelope;
    gain: number;
    harmonicGain?: number;
  };
  /** Offset in seconds before tone2 starts. */
  staggerSeconds: number;
}

/** Long-running ambient drone config. */
export interface AmbientConfig {
  /** Low drone frequency */
  droneFreq: number;
  droneWaveform: Waveform;
  droneGain: number;
  /** Seconds per loop chunk (the drone is generated in chunks). */
  chunkDuration: number;
  /** Resolution stinger: two ascending notes. */
  resolveNote1: number;
  resolveNote2: number;
  resolveWaveform: Waveform;
  resolveDuration: number;
  resolveGain: number;
}

/** Complete profile definition. */
export interface Profile {
  name: string;
  description: string;
  verbs: Record<string, VerbConfig>;
  sessionStart: ChimeConfig;
  sessionEnd: ChimeConfig;
  ambient: AmbientConfig;
}

// --- Built-in profiles ---

const MINIMAL_PROFILE: Profile = {
  name: "minimal",
  description: "Tasteful UI tones — subtle, professional, daily-driver",
  verbs: {
    intake: {
      type: "tone",
      waveform: "sine",
      frequency: 440,
      frequencyEnd: 620,
      duration: 0.15,
      envelope: { attack: 0.02, decay: 0.06, sustain: 0.4, release: 0.04 },
      gain: 0.6,
    },
    transform: {
      type: "tone",
      waveform: "sine",
      frequency: 520,
      duration: 0.1,
      envelope: { attack: 0.005, decay: 0.03, sustain: 0.2, release: 0.03 },
      gain: 0.55,
      fmRatio: 1.5,
      fmDepth: 30,
    },
    commit: {
      type: "tone",
      waveform: "sine",
      frequency: 840,
      duration: 0.08,
      envelope: { attack: 0.005, decay: 0.03, sustain: 0.2, release: 0.03 },
      gain: 0.6,
    },
    navigate: {
      type: "tone",
      waveform: "sine",
      frequency: 1050,
      duration: 0.2,
      envelope: { attack: 0.003, decay: 0.15, sustain: 0.0, release: 0.05 },
      gain: 0.5,
    },
    execute: {
      type: "tone",
      waveform: "sine",
      frequency: 620,
      duration: 0.1,
      envelope: { attack: 0.005, decay: 0.03, sustain: 0.2, release: 0.03 },
      gain: 0.5,
      noiseBurst: { duration: 0.04, gain: 0.25 },
    },
    move: {
      type: "whoosh",
      duration: 0.25,
      freqUp: [600, 2800],
      freqDown: [2800, 600],
      bandwidth: 0.8,
      envelope: { attack: 0.04, decay: 0.08, sustain: 0.5, release: 0.1 },
      gain: 0.6,
    },
    sync: {
      type: "whoosh",
      duration: 0.32,
      freqUp: [400, 3200],
      freqDown: [3200, 400],
      bandwidth: 0.6,
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.45, release: 0.12 },
      gain: 0.55,
      tonalAnchor: {
        freqUp: [350, 700],
        freqDown: [700, 350],
        envelope: { attack: 0.03, decay: 0.1, sustain: 0.15, release: 0.08 },
        gain: 0.2,
      },
    },
  },
  sessionStart: {
    tone1: {
      waveform: "sine",
      frequency: 523,
      duration: 0.18,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.3, release: 0.06 },
      gain: 0.5,
      harmonicGain: 0.1,
    },
    tone2: {
      waveform: "sine",
      frequency: 659,
      duration: 0.22,
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.08 },
      gain: 0.45,
      harmonicGain: 0.1,
    },
    staggerSeconds: 0.07,
  },
  sessionEnd: {
    tone1: {
      waveform: "sine",
      frequency: 659,
      duration: 0.15,
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.04 },
      gain: 0.45,
    },
    tone2: {
      waveform: "sine",
      frequency: 523,
      duration: 0.25,
      envelope: { attack: 0.01, decay: 0.12, sustain: 0.2, release: 0.1 },
      gain: 0.4,
    },
    staggerSeconds: 0.08,
  },
  ambient: {
    droneFreq: 150,
    droneWaveform: "sine",
    droneGain: 0.12,
    chunkDuration: 2.0,
    resolveNote1: 523,
    resolveNote2: 659,
    resolveWaveform: "sine",
    resolveDuration: 0.15,
    resolveGain: 0.45,
  },
};

const RETRO_PROFILE: Profile = {
  name: "retro",
  description: "8-bit micro-chirps — fun but controlled",
  verbs: {
    intake: {
      type: "tone",
      waveform: "square",
      frequency: 480,
      frequencyEnd: 720,
      duration: 0.1,
      envelope: { attack: 0.005, decay: 0.04, sustain: 0.3, release: 0.02 },
      gain: 0.4,
    },
    transform: {
      type: "tone",
      waveform: "square",
      frequency: 560,
      duration: 0.07,
      envelope: { attack: 0.003, decay: 0.03, sustain: 0.15, release: 0.02 },
      gain: 0.38,
      fmRatio: 2,
      fmDepth: 50,
    },
    commit: {
      type: "tone",
      waveform: "square",
      frequency: 880,
      duration: 0.06,
      envelope: { attack: 0.002, decay: 0.02, sustain: 0.1, release: 0.02 },
      gain: 0.42,
    },
    navigate: {
      type: "tone",
      waveform: "square",
      frequency: 1100,
      duration: 0.12,
      envelope: { attack: 0.002, decay: 0.08, sustain: 0.0, release: 0.03 },
      gain: 0.38,
    },
    execute: {
      type: "tone",
      waveform: "square",
      frequency: 660,
      duration: 0.08,
      envelope: { attack: 0.002, decay: 0.03, sustain: 0.15, release: 0.02 },
      gain: 0.38,
      noiseBurst: { duration: 0.03, gain: 0.3 },
    },
    move: {
      type: "whoosh",
      duration: 0.18,
      freqUp: [800, 3500],
      freqDown: [3500, 800],
      bandwidth: 1.0,
      envelope: { attack: 0.02, decay: 0.06, sustain: 0.4, release: 0.06 },
      gain: 0.45,
    },
    sync: {
      type: "whoosh",
      duration: 0.22,
      freqUp: [500, 4000],
      freqDown: [4000, 500],
      bandwidth: 0.8,
      envelope: { attack: 0.03, decay: 0.06, sustain: 0.35, release: 0.08 },
      gain: 0.42,
      tonalAnchor: {
        freqUp: [400, 800],
        freqDown: [800, 400],
        envelope: { attack: 0.02, decay: 0.06, sustain: 0.1, release: 0.05 },
        gain: 0.18,
      },
    },
  },
  sessionStart: {
    tone1: {
      waveform: "square",
      frequency: 523,
      duration: 0.1,
      envelope: { attack: 0.005, decay: 0.04, sustain: 0.2, release: 0.03 },
      gain: 0.4,
    },
    tone2: {
      waveform: "square",
      frequency: 659,
      duration: 0.12,
      envelope: { attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.04 },
      gain: 0.38,
    },
    staggerSeconds: 0.06,
  },
  sessionEnd: {
    tone1: {
      waveform: "square",
      frequency: 659,
      duration: 0.08,
      envelope: { attack: 0.005, decay: 0.04, sustain: 0.15, release: 0.02 },
      gain: 0.38,
    },
    tone2: {
      waveform: "square",
      frequency: 523,
      duration: 0.14,
      envelope: { attack: 0.005, decay: 0.06, sustain: 0.15, release: 0.05 },
      gain: 0.35,
    },
    staggerSeconds: 0.06,
  },
  ambient: {
    droneFreq: 120,
    droneWaveform: "square",
    droneGain: 0.08,
    chunkDuration: 2.0,
    resolveNote1: 523,
    resolveNote2: 784,
    resolveWaveform: "square",
    resolveDuration: 0.1,
    resolveGain: 0.35,
  },
};

const BUILTIN_PROFILES: Record<string, Profile> = {
  minimal: MINIMAL_PROFILE,
  retro: RETRO_PROFILE,
};

// --- Profile loading ---

/** Get a built-in profile by name. */
export function getBuiltinProfile(name: string): Profile | undefined {
  return BUILTIN_PROFILES[name];
}

/** List all built-in profile names. */
export function listBuiltinProfiles(): string[] {
  return Object.keys(BUILTIN_PROFILES);
}

/** Load a profile from a JSON file path. */
export function loadProfileFromFile(filePath: string): Profile {
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Profile;
  // Basic validation
  if (!parsed.name || !parsed.verbs || !parsed.sessionStart || !parsed.sessionEnd) {
    throw new Error(`Invalid profile: missing required fields in ${filePath}`);
  }
  return parsed;
}

/**
 * Resolve a profile by name.
 * 1. Check built-in profiles
 * 2. Check profiles/ directory next to the package
 * 3. Treat as absolute/relative file path
 */
export function resolveProfile(nameOrPath: string): Profile {
  // Built-in?
  const builtin = getBuiltinProfile(nameOrPath);
  if (builtin) return builtin;

  // Check profiles/ directory relative to this package
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const profilesDir = join(__dirname, "..", "profiles");
  const inProfilesDir = join(profilesDir, `${nameOrPath}.json`);
  if (existsSync(inProfilesDir)) {
    return loadProfileFromFile(inProfilesDir);
  }

  // Treat as file path
  if (existsSync(nameOrPath)) {
    return loadProfileFromFile(nameOrPath);
  }

  throw new Error(
    `Unknown profile "${nameOrPath}". Built-in: ${listBuiltinProfiles().join(", ")}`
  );
}

export const DEFAULT_PROFILE_NAME = "minimal";
