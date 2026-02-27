# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Structured error handling with `SfxError` class (code/message/hint/cause/retryable)
- `--version` / `-V` flag
- `--debug` flag for stack traces on errors
- CI workflow with type checking, tests, and dependency audit
- SECURITY.md, CHANGELOG.md, SCORECARD.md (Shipcheck compliance)
- `verify` script (build + test in one command)

## [0.1.2] - 2026-02-27

### Fixed
- Republished with correct npm scope and metadata

## [0.1.1] - 2026-02-27

### Changed
- Scoped package to `@mcptoolshop/claude-sfx`
- Updated brand logo to centralized brand repo

## [0.1.0] - 2026-02-27

### Added
- 7 core verbs: intake, transform, commit, navigate, execute, move, sync
- Procedural audio synthesis engine (sine, square, sawtooth, triangle, noise)
- ADSR envelopes, FM synthesis, state-variable filter, frequency sweeps
- Loudness limiter with soft-knee compression
- Anti-annoyance: debounce, rate limiting, quiet hours, mute, per-verb disable
- Sound profiles: minimal (default) and retro
- Custom profile support via JSON files
- Ambient drone system for long-running operations
- Session start/end chimes
- Hook handler for Claude Code integration
- WAV export for all sounds
- Zero production dependencies
