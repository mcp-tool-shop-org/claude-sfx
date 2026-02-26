/**
 * Verb generation engine — profile-driven.
 * Reads synthesis parameters from a Profile, applies modifiers, generates audio.
 */

import {
  type ToneParams,
  type Envelope,
  type WhooshParams,
  SAMPLE_RATE,
  generateTone,
  generateWhoosh,
  mixBuffers,
  limitLoudness,
} from "./synth.js";
import type {
  Profile,
  ToneVerbConfig,
  WhooshVerbConfig,
  ChimeConfig,
  AmbientConfig,
} from "./profiles.js";

// --- Status modifiers ---

export type Status = "ok" | "err" | "warn";
export type Scope = "local" | "remote";
export type Direction = "up" | "down";

export interface PlayOptions {
  status?: Status;
  scope?: Scope;
  direction?: Direction;
}

// --- Verb metadata (profile-independent) ---

export type Verb = "intake" | "transform" | "commit" | "navigate" | "execute" | "move" | "sync";

export const VERB_LABELS: Record<Verb, string> = {
  intake: "Intake",
  transform: "Transform",
  commit: "Commit",
  navigate: "Navigate",
  execute: "Execute",
  move: "Move",
  sync: "Sync",
};

export const VERB_DESCRIPTIONS: Record<Verb, string> = {
  intake: "read / open / fetch",
  transform: "edit / format / refactor",
  commit: "write / save / apply",
  navigate: "search / jump / list",
  execute: "run / test / build",
  move: "move / rename / relocate",
  sync: "git push / pull / deploy",
};

export const ALL_VERBS: Verb[] = [
  "intake",
  "transform",
  "commit",
  "navigate",
  "execute",
  "move",
  "sync",
];

// --- Status modifier functions (tone-based) ---

function applyToneStatus(params: ToneParams, status: Status): ToneParams {
  const p = { ...params };
  switch (status) {
    case "ok":
      p.harmonicGain = 0.15;
      break;
    case "err":
      p.frequency *= 0.7;
      if (p.frequencyEnd) p.frequencyEnd *= 0.7;
      p.detune = 3;
      p.duration *= 1.3;
      break;
    case "warn":
      p.tremoloRate = 8;
      p.tremoloDepth = 0.5;
      break;
  }
  return p;
}

function applyToneScope(params: ToneParams, scope: Scope): ToneParams {
  if (scope === "remote") {
    const p = { ...params };
    p.envelope = { ...p.envelope, release: p.envelope.release * 2.5 };
    p.duration *= 1.2;
    return p;
  }
  return params;
}

// --- Status modifier functions (whoosh-based) ---

function applyWhooshStatus(params: WhooshParams, status: Status): WhooshParams {
  const p = { ...params };
  switch (status) {
    case "ok":
      p.freqEnd = Math.min(p.freqEnd * 1.2, 6000);
      break;
    case "err":
      p.freqStart *= 0.6;
      p.freqEnd *= 0.6;
      p.duration *= 1.3;
      p.bandwidth = 1.2;
      break;
    case "warn":
      p.duration *= 0.8;
      p.envelope = { ...p.envelope, attack: 0.01, release: 0.03 };
      break;
  }
  return p;
}

function applyWhooshScope(params: WhooshParams, scope: Scope): WhooshParams {
  if (scope === "remote") {
    const p = { ...params };
    p.duration *= 1.3;
    p.envelope = { ...p.envelope, release: p.envelope.release * 2 };
    return p;
  }
  return params;
}

// --- Config → Params conversion ---

function toneConfigToParams(cfg: ToneVerbConfig): ToneParams {
  return {
    waveform: cfg.waveform,
    frequency: cfg.frequency,
    frequencyEnd: cfg.frequencyEnd,
    duration: cfg.duration,
    envelope: { ...cfg.envelope },
    gain: cfg.gain,
    fmRatio: cfg.fmRatio,
    fmDepth: cfg.fmDepth,
    harmonicGain: cfg.harmonicGain,
  };
}

function whooshConfigToParams(
  cfg: WhooshVerbConfig,
  direction: Direction
): WhooshParams {
  const freqPair = direction === "down" ? cfg.freqDown : cfg.freqUp;
  return {
    duration: cfg.duration,
    freqStart: freqPair[0],
    freqEnd: freqPair[1],
    bandwidth: cfg.bandwidth,
    envelope: { ...cfg.envelope },
    gain: cfg.gain,
  };
}

// --- Main generation ---

/** Generate a verb sound using the given profile. */
export function generateVerb(
  profile: Profile,
  verb: Verb,
  options: PlayOptions = {}
): Float64Array {
  const cfg = profile.verbs[verb];
  if (!cfg) {
    throw new Error(`Profile "${profile.name}" has no config for verb "${verb}"`);
  }

  // Whoosh-based verbs
  if (cfg.type === "whoosh") {
    const dir = options.direction ?? "up";
    let wp = whooshConfigToParams(cfg, dir);
    if (options.status) wp = applyWhooshStatus(wp, options.status);
    if (options.scope) wp = applyWhooshScope(wp, options.scope);
    const whoosh = generateWhoosh(wp);

    // Tonal anchor (sync)
    if (cfg.tonalAnchor) {
      const anchorFreqs = dir === "down" ? cfg.tonalAnchor.freqDown : cfg.tonalAnchor.freqUp;
      const anchor = generateTone({
        waveform: "sine",
        frequency: anchorFreqs[0],
        frequencyEnd: anchorFreqs[1],
        duration: wp.duration,
        envelope: { ...cfg.tonalAnchor.envelope },
        gain: cfg.tonalAnchor.gain,
      });
      return limitLoudness(mixBuffers([whoosh, anchor]));
    }

    return limitLoudness(whoosh);
  }

  // Tone-based verbs
  let params = toneConfigToParams(cfg);
  if (options.status) params = applyToneStatus(params, options.status);
  if (options.scope) params = applyToneScope(params, options.scope);

  const primary = generateTone(params);

  // Noise burst layer (execute)
  if (cfg.noiseBurst) {
    const noise = generateTone({
      waveform: "noise",
      frequency: 0,
      duration: cfg.noiseBurst.duration,
      envelope: { attack: 0.002, decay: 0.03, sustain: 0.0, release: 0.005 },
      gain: cfg.noiseBurst.gain,
    });
    return limitLoudness(mixBuffers([primary, noise]));
  }

  return limitLoudness(primary);
}

// --- Session sounds ---

function generateChime(chime: ChimeConfig): Float64Array {
  const tone1 = generateTone({
    waveform: chime.tone1.waveform,
    frequency: chime.tone1.frequency,
    duration: chime.tone1.duration,
    envelope: { ...chime.tone1.envelope },
    gain: chime.tone1.gain,
    harmonicGain: chime.tone1.harmonicGain,
  });
  const tone2 = generateTone({
    waveform: chime.tone2.waveform,
    frequency: chime.tone2.frequency,
    duration: chime.tone2.duration,
    envelope: { ...chime.tone2.envelope },
    gain: chime.tone2.gain,
    harmonicGain: chime.tone2.harmonicGain,
  });
  const offset = Math.floor(chime.staggerSeconds * SAMPLE_RATE);
  const total = new Float64Array(Math.max(tone1.length, offset + tone2.length));
  total.set(tone1, 0);
  for (let i = 0; i < tone2.length; i++) {
    if (offset + i < total.length) {
      total[offset + i] += tone2[i];
    }
  }
  return limitLoudness(total);
}

export function generateSessionStart(profile: Profile): Float64Array {
  return generateChime(profile.sessionStart);
}

export function generateSessionEnd(profile: Profile): Float64Array {
  return generateChime(profile.sessionEnd);
}

// --- Ambient (long-running thinking) ---

/** Generate a single chunk of the ambient thinking drone. */
export function generateAmbientChunk(profile: Profile): Float64Array {
  const cfg = profile.ambient;
  // Low drone with very gentle fade in/out to allow seamless looping
  return generateTone({
    waveform: cfg.droneWaveform,
    frequency: cfg.droneFreq,
    duration: cfg.chunkDuration,
    envelope: {
      attack: 0.3,
      decay: 0.2,
      sustain: 1.0,
      release: 0.3,
    },
    gain: cfg.droneGain,
    // Subtle tremolo gives the drone "life" instead of a dead flat tone
    tremoloRate: 0.5,
    tremoloDepth: 0.15,
  });
}

/** Generate the resolution stinger (two ascending notes). */
export function generateAmbientResolve(profile: Profile): Float64Array {
  const cfg = profile.ambient;
  const note1 = generateTone({
    waveform: cfg.resolveWaveform,
    frequency: cfg.resolveNote1,
    duration: cfg.resolveDuration,
    envelope: { attack: 0.008, decay: 0.06, sustain: 0.25, release: 0.04 },
    gain: cfg.resolveGain,
    harmonicGain: 0.1,
  });
  const note2 = generateTone({
    waveform: cfg.resolveWaveform,
    frequency: cfg.resolveNote2,
    duration: cfg.resolveDuration * 1.3,
    envelope: { attack: 0.008, decay: 0.08, sustain: 0.25, release: 0.06 },
    gain: cfg.resolveGain * 0.9,
    harmonicGain: 0.1,
  });
  const offset = Math.floor(cfg.resolveDuration * 0.6 * SAMPLE_RATE);
  const total = new Float64Array(offset + note2.length);
  total.set(note1, 0);
  for (let i = 0; i < note2.length; i++) {
    if (offset + i < total.length) {
      total[offset + i] += note2[i];
    }
  }
  return limitLoudness(total);
}
