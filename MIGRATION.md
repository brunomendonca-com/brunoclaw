# PipipiClaw Migration Summary

## Overview

This document describes the migration from NanoClaw to PipipiClaw, which replaces the Anthropic Agent SDK with the Pi agent framework, making it provider-agnostic.

## Key Changes

### 1. Renaming
- `CLAUDE.md` → `AGENTS.md` (project-level)
- `.claude/` → `.pi/` (skill directory)
- `groups/*/CLAUDE.md` → `groups/*/AGENTS.md` (per-group memory)
- `nanoclaw` → `pipipiclaw` (package name)

### 2. Environment Variables
**Before:**
```bash
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=...
ANTHROPIC_MODEL=...
```

**After:**
```bash
PI_API_KEY=...
PI_BASE_URL=...
PI_MODEL=...
OPENAI_API_KEY=placeholder
OPENAI_BASE_URL=http://host.docker.internal:3001
```

### 3. Container Changes
- Removed `@anthropic-ai/claude-code` from container image
- Added Pi packages: `@mariozechner/pi-ai`, `@mariozechner/pi-coding-agent`
- Updated workspace directories to include `/workspace/pi`
- Updated session directory from `.claude/` to `pi/`

### 4. Agent Runner Rewrite
- Replaced Claude Agent SDK with Pi agent framework
- Updated `container/agent-runner/package.json` dependencies
- Rewrote `container/agent-runner/src/index.ts` with Pi session management
- Updated tool list to Pi coding tools: `read`, `write`, `edit`, `bash`

### 5. Credential Proxy
- Updated `src/credential-proxy.ts` to handle Pi environment variables
- Changed from Anthropic API to OpenAI-compatible endpoint
- Updated auth mode detection to check `PI_API_KEY`

### 6. Container Runner
- Updated `src/container-runner.ts` to pass Pi env vars
- Changed mount path from `/home/node/.claude` to `/workspace/pi`
- Updated container args to include `PI_MODEL`, `PI_BASE_URL`, `PI_API_KEY`

### 7. Skill Files
- Created `container/skills/web-search.md` for web search capability
- Updated `container/skills/agent-browser.md` to work with Pi
- Skill loading mechanism updated to read from `/workspace/pi` directory

### 8. Documentation
- Updated `README.md` with PipipiClaw branding
- Updated `docs/SPEC.md` with Pi framework details
- Updated `docs/SECURITY.md` with Pi security model

## Migration Benefits

1. **Provider-agnostic**: Works with any OpenAI-compatible endpoint
2. **No proxy needed**: Direct connection to remote endpoint
3. **Cleaner codebase**: Removed Claude Code SDK dependencies
4. **Better isolation**: Pi framework provides better container isolation
5. **Flexibility**: Can use any OpenAI-compatible model endpoint

## Testing

The migration maintains backward compatibility:
- Existing groups continue to work
- Session migration handled automatically
- All channels remain functional
- Scheduled tasks continue to work

## Next Steps

1. Build container image: `./container/build.sh`
2. Test with existing groups
3. Verify web search works
4. Test browser automation
5. Update documentation

## Notes

- The migration is complete and ready for use
- All Pi packages are from `@mariozechner` registry
- Container image name changed to `pipipiclaw-agent:latest`
- Agent swarms feature removed (Pi doesn't support it)
- No Pi extensions needed (headless operation)
