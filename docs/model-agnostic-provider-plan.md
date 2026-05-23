# NanoClaw plan: model-agnostic provider architecture with a single prompt file

## Goal

Make NanoClaw work consistently across Claude Code, Codex, OpenCode, and future providers with:

- **one canonical per-group prompt file**
- **no duplicated user-edited files**
- **full Claude Code compatibility with no workflow changes**
- **provider-agnostic prompt composition in code, not in workspace file conventions**

## Core decision

Use **`groups/<folder>/CLAUDE.md` as the single canonical human-edited per-group file**.

This is the simplest approach because:

- Claude Code already expects `CLAUDE.md`
- the original NanoClaw/provider-branch model already centered on `CLAUDE.md`
- Codex and other providers can consume the same file through a shared prompt composer
- it removes the current confusing three-file model:
  - `CLAUDE.md`
  - `CLAUDE.local.md`
  - `.claude-shared.md`

## Non-goals

- Do **not** require users to maintain both `CLAUDE.md` and `CLAUDE.local.md`
- Do **not** make `AGENTS.md` mandatory
- Do **not** make provider implementations each read different prompt files directly
- Do **not** expose prompt-composition plumbing as multiple visible files in each group

---

# Target architecture

## 1) Single visible per-group prompt file

### Canonical per-group file

- `groups/<folder>/CLAUDE.md`

This becomes the **only** per-group file users edit for:

- personality
- role
- long-lived behavior
- group-specific memory, if desired

### Shared/global base

- `container/CLAUDE.md`

This remains the global NanoClaw base instruction set.

### Hidden/internal composition artifacts

If needed, internal generated artifacts should live in a hidden runtime/internal location such as:

- `groups/<folder>/.nanoclaw/`
- or outside the group folder entirely

But these should **not** be part of the normal user mental model.

---

## 2) Separation of concerns: container setup vs prompt composition

NanoClaw already has a useful provider-specific layer for **host-side spawn concerns**:

- `src/providers/provider-container-registry.ts`
- provider registrations like `src/providers/codex.ts`

That layer should remain responsible for things like:

- auth/config mounts
- env passthrough
- per-session provider directories
- provider-specific host/container bootstrapping

Examples:

- Codex mounts a per-session `.codex` directory and passes `CODEX_MODEL`
- OpenCode may mount XDG/config directories or pass `OPENCODE_*`
- Claude may need no special container contribution at all

### Important boundary

This provider container registry should **not** become the place where NanoClaw decides:

- which prompt files are canonical
- how global and per-group instructions are merged
- whether `CLAUDE.local.md` or `AGENTS.md` exists
- how providers achieve prompt parity

Those concerns belong in one shared prompt-composition layer.

---

## 3) Prompt composition happens in code

Instead of relying on visible wrapper files and symlinks, create one shared prompt composer used by **all providers**.

Suggested modules:

- host-side composition: `src/prompt-compose.ts`
- runner/provider-side loader: `container/agent-runner/src/prompt-bundle.ts`

The composer should build the effective instructions from:

1. `container/CLAUDE.md`
2. enabled module/skill fragments
3. `groups/<folder>/CLAUDE.md`
4. runtime addenda such as:
   - assistant identity
   - destinations
   - main-group capabilities
   - provider-neutral runtime hints

The output should be a single object, e.g.:

```ts
interface PromptBundle {
  baseInstructions: string;
}
```

Providers should consume `PromptBundle`, not workspace files.

---

## 4) Providers stop reading files directly

### Problem today

Prompt behavior is split across provider implementations:

- Claude relies on `CLAUDE.md` auto-loading behavior
- Codex currently has custom file-loading logic
- OpenCode has separate file-loading logic
- future providers would likely repeat the pattern

This is the real maintenance problem.

### Target rule

No provider should directly decide:

- which prompt files exist
- whether `CLAUDE.local.md` exists
- whether `AGENTS.md` exists
- how prompt fragments are stitched together

Instead every provider should do:

- ask for the shared composed prompt bundle
- pass `baseInstructions` into its own API

### Providers to refactor

- `container/agent-runner/src/providers/claude.ts`
- `container/agent-runner/src/providers/codex.ts`
- `container/agent-runner/src/providers/opencode.ts`
- any future provider files

---

# Claude Code compatibility

## Requirement

Claude Code must continue working **with no user workflow change**.

### That means

Users should still be able to:

- open `groups/<folder>/CLAUDE.md`
- edit it directly
- have Claude-based groups behave as expected

### Important implication

Do **not** make `CLAUDE.md` a generated compatibility wrapper anymore.

Instead:

- `CLAUDE.md` becomes real user-owned content again
- any composition needed for non-Claude providers happens in code
- if Claude-specific import behavior is needed, it should be handled without forcing extra user-facing files in each group

---

# What to remove or phase out

## Remove as user-facing concepts

### `CLAUDE.local.md`

This should no longer be the canonical group file.

### `.claude-shared.md`

This is an implementation detail and should not remain part of the normal visible group prompt model.

### visible wrapper-style `CLAUDE.md`

The current generated wrapper approach is too confusing once multiple providers are involved.

---

# Migration strategy

## Phase 1 — Introduce shared prompt composer

Add a neutral prompt composition module used by all providers.

### Deliverables

- shared prompt bundle module
- tests for composition order
- no behavior regression for Claude, Codex, or OpenCode
- explicit documentation that `provider-container-registry` remains responsible only for mounts/env/auth bootstrapping

### Acceptance criteria

- same composed prompt can be produced for all providers
- provider-specific file loading starts shrinking
- provider container config remains orthogonal to prompt composition

---

## Phase 2 — Make `CLAUDE.md` canonical again

For each group:

1. if `CLAUDE.local.md` exists and contains meaningful content
   - merge it into `CLAUDE.md`
2. if existing `CLAUDE.md` is only a generated wrapper
   - replace it with real merged editable content
3. preserve user-authored content
4. remove the need for `CLAUDE.local.md` in normal operation

### Migration rules

For a given group:

- if `CLAUDE.md` is generated wrapper and `CLAUDE.local.md` has the real content:
  - move `CLAUDE.local.md` content into `CLAUDE.md`
- if both contain meaningful manual content:
  - create a one-time merge with clear conflict markers or migration notes
- after successful migration:
  - `CLAUDE.md` is the only editable prompt file

### Example: JhomaBot

Current:

- `CLAUDE.local.md` contains the real personality
- `CLAUDE.md` is generated wrapper

After migration:

- personality moves into `groups/whatsapp_jhomabot/CLAUDE.md`
- `CLAUDE.local.md` is removed or archived
- `.claude-shared.md` is removed from user-facing layout

---

## Phase 3 — Refactor provider implementations

Once the shared bundle exists and group files are migrated:

- Codex consumes composed instructions
- OpenCode consumes composed instructions
- Claude consumes the same logical prompt bundle, while preserving Claude Code compatibility
- host-side provider container registrations continue to handle only mounts/env/auth setup

### Important note about Claude provider

If Claude Code already auto-loads `CLAUDE.md`, we should avoid duplicating the same content into both:

- provider-injected `baseInstructions`
- auto-loaded workspace prompt

So the Claude provider needs special care:

### Preferred rule

- **Claude provider:** rely on `CLAUDE.md` native behavior where possible
- **Codex/OpenCode/others:** inject the composed `baseInstructions`

But composition ownership should still be centralized so behavior remains aligned.

In practice, this means the shared prompt system may expose:

```ts
interface PromptBundle {
  baseInstructions: string;
  claudeUsesWorkspacePrompt: boolean;
}
```

Or equivalent behavior flags.

---

## Phase 4 — Remove visible composition clutter

After migration:

- stop relying on `.claude-shared.md` inside each group folder
- stop presenting `.claude-fragments` as part of user-facing prompt architecture
- keep any necessary implementation details hidden/internal

### Desired visible group layout

Minimal and understandable:

- `groups/<folder>/CLAUDE.md`
- `groups/<folder>/container.json`
- normal workspace files

That’s it.

---

## Phase 5 — Update docs and skills

Update docs to say:

- edit `CLAUDE.md` for per-group personality and instructions
- there is only one canonical per-group prompt file
- provider compatibility is handled by NanoClaw internally

Files likely needing updates:

- setup docs
- self-customize skill
- welcome skill
- contributor docs
- comments in prompt/provider code

---

# Optional future AGENTS.md support

`AGENTS.md` can still be supported later, but it should be treated as an **optional compatibility input**, not the primary architecture.

## If added later

Possible policy:

- NanoClaw may import `AGENTS.md` if present
- but `CLAUDE.md` remains canonical unless a future migration is explicitly chosen
- never require both to be edited

### Rule

There must still be **only one human-edited source of truth per group**.

If `AGENTS.md` support is added, NanoClaw must:

- choose one canonical file
- clearly warn on duplicates/conflicts

---

# Why this is simpler than the current model

Because it restores the simplest mental model:

## User mental model

> “If I want to change this group’s personality, I edit `groups/<folder>/CLAUDE.md`."

That’s easy to explain, easy to remember, and already aligned with Claude Code.

## Internal architecture

> “All providers use a shared prompt-composition pipeline, while provider container registrations handle only mounts/env/auth bootstrapping."

That’s easy to maintain.

## What it avoids

- no duplicate editable files
- no provider-specific prompt file drift
- no visible wrapper/symlink confusion
- no unnecessary `AGENTS.md` migration risk right now

---

# Acceptance criteria

1. Every group has exactly **one canonical editable prompt file**: `CLAUDE.md`
2. `CLAUDE.local.md` is no longer required in normal operation
3. `.claude-shared.md` is no longer part of the visible user-facing prompt model
4. Claude Code continues to work with no user workflow changes
5. Codex/OpenCode/other providers see the same group personality/instructions
6. No provider directly owns file-path prompt logic
7. `provider-container-registry` stays limited to container/env/auth concerns and does not own prompt semantics
8. No duplicated prompt content across multiple editable files

---

# Suggested implementation order

1. build shared prompt composer
2. define canonical prompt bundle interface and separation from provider container config
3. refactor Codex/OpenCode to consume shared bundle
4. carefully align Claude provider with shared model without double-injecting prompt content
5. migrate group content from `CLAUDE.local.md` into `CLAUDE.md`
6. remove visible composition clutter from group folders
7. update docs/skills/tests

---

# Final recommendation

For NanoClaw, the simplest and most maintainable provider-agnostic architecture is:

- **canonical per-group file:** `groups/<folder>/CLAUDE.md`
- **shared global base:** `container/CLAUDE.md`
- **single prompt composer in code**
- **all providers consume the same logical prompt bundle**
- **no duplicated user-edited files**
- **full Claude Code compatibility preserved**

This is simpler than moving to `AGENTS.md` right now, and better aligned with how NanoClaw originally worked while still fixing provider drift cleanly.
