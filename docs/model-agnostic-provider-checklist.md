# NanoClaw implementation checklist: model-agnostic provider architecture

This checklist implements the plan in `docs/model-agnostic-provider-plan.md`.

## Objective

End state:

- one canonical per-group prompt file: `groups/<folder>/CLAUDE.md`
- no duplicated editable prompt files
- Claude Code keeps working with no user workflow change
- all providers consume the same logical prompt bundle
- `provider-container-registry` remains limited to mounts/env/auth bootstrapping

---

## Phase 0 — Guardrails and inventory

- [ ] Audit current prompt-related files in real groups:
  - [ ] `groups/*/CLAUDE.md`
  - [ ] `groups/*/CLAUDE.local.md`
  - [ ] `groups/*/.claude-shared.md`
  - [ ] `groups/*/.claude-fragments/`
- [ ] Classify each group into one of:
  - [ ] generated-wrapper `CLAUDE.md` + real `CLAUDE.local.md`
  - [ ] real user-authored `CLAUDE.md`
  - [ ] both contain meaningful content
  - [ ] neither contains meaningful content
- [ ] Add a temporary migration report command/script, e.g.:
  - [ ] `scripts/audit-group-prompt-files.ts`
- [ ] Document exact detection rules for “generated wrapper” vs “real content”

### Files likely involved

- `scripts/`
- `groups/*`
- `docs/model-agnostic-provider-plan.md`

---

## Phase 1 — Introduce shared prompt bundle API

### Add new shared prompt modules

- [ ] Create host-side/shared composition module:
  - [ ] `src/prompt-compose.ts`
- [ ] Create runner/provider-side prompt bundle loader:
  - [ ] `container/agent-runner/src/prompt-bundle.ts`

### Define API

- [ ] Add a neutral prompt bundle interface, e.g.:

```ts
export interface PromptBundle {
  baseInstructions: string;
  claudeUsesWorkspacePrompt: boolean;
}
```

- [ ] Ensure this API does **not** mention provider-specific file names beyond compatibility behavior.

### Composition inputs

- [ ] Compose from:
  - [ ] `container/CLAUDE.md`
  - [ ] module/skill instruction fragments
  - [ ] canonical group file `groups/<folder>/CLAUDE.md`
  - [ ] runtime addenda (identity, destinations, main-group capabilities)

### Separation of concerns

- [ ] Confirm `src/providers/provider-container-registry.ts` remains untouched in purpose:
  - [ ] mounts only
  - [ ] env only
  - [ ] auth/bootstrap only
  - [ ] no prompt semantics

### Tests

- [ ] Add composition tests:
  - [ ] order is deterministic
  - [ ] global base included
  - [ ] group file included
  - [ ] runtime addenda included
  - [ ] no duplicate sections

### Files to update/add

- `src/prompt-compose.ts` (new)
- `container/agent-runner/src/prompt-bundle.ts` (new)
- tests under `src/` and/or `container/agent-runner/src/`

---

## Phase 2 — Refactor provider prompt loading

## Claude provider

- [ ] Inspect current Claude prompt path in:
  - [ ] `container/agent-runner/src/providers/claude.ts`
- [ ] Make Claude use the shared prompt-bundle contract without double-injecting content.
- [ ] Preserve Claude Code native workspace behavior where needed.
- [ ] Ensure Claude does **not** receive duplicate prompt content from both:
  - [ ] auto-loaded workspace `CLAUDE.md`
  - [ ] injected `baseInstructions`

## Codex provider

- [ ] Refactor:
  - [ ] `container/agent-runner/src/providers/codex.ts`
- [ ] Remove direct file reading from provider implementation.
- [ ] Replace with shared prompt bundle consumption.

## OpenCode provider

- [ ] Refactor:
  - [ ] `container/agent-runner/src/providers/opencode.ts`
- [ ] Remove direct file reading from provider implementation.
- [ ] Replace with shared prompt bundle consumption.

## Future-proofing

- [ ] Add provider-level rule in code comments/docs:
  - [ ] providers must not read prompt files directly
  - [ ] providers consume prompt bundle only

### Tests

- [ ] Add/adjust provider tests for:
  - [ ] Codex sees group personality from canonical `CLAUDE.md`
  - [ ] OpenCode sees same content
  - [ ] Claude behavior remains correct

### Files to update

- `container/agent-runner/src/providers/claude.ts`
- `container/agent-runner/src/providers/codex.ts`
- `container/agent-runner/src/providers/opencode.ts`
- provider tests

---

## Phase 3 — Make `CLAUDE.md` canonical again

### Migration rules

- [ ] For groups where `CLAUDE.md` is generated wrapper and `CLAUDE.local.md` has real content:
  - [ ] move `CLAUDE.local.md` content into `CLAUDE.md`
- [ ] For groups where both files contain meaningful content:
  - [ ] merge carefully
  - [ ] add conflict markers or migration report if needed
- [ ] For groups with only real `CLAUDE.md`:
  - [ ] leave intact
- [ ] For empty/inert groups:
  - [ ] create minimal canonical `CLAUDE.md`

### Migration tooling

- [ ] Create migration script, e.g.:
  - [ ] `scripts/migrate-group-prompts-to-claude-md.ts`
- [ ] Support dry-run mode
- [ ] Support per-group migration
- [ ] Support all-groups migration
- [ ] Emit a human-readable migration report

### Special cases

- [ ] Handle groups like `whatsapp_jhomabot` where personality currently lives in `CLAUDE.local.md`
- [ ] Preserve formatting and comments
- [ ] Preserve existing behavior for groups with custom personalities

### Acceptance checks

- [ ] Each migrated group has exactly one meaningful editable prompt file: `CLAUDE.md`
- [ ] Group behavior matches pre-migration behavior

### Files to update/add

- `scripts/migrate-group-prompts-to-claude-md.ts` (new)
- `groups/*/CLAUDE.md`
- optionally archive/remove `groups/*/CLAUDE.local.md`

---

## Phase 4 — Remove visible composition clutter

- [ ] Stop relying on visible group-level wrapper/symlink files for the user-facing prompt model.
- [ ] Phase out:
  - [ ] `groups/*/CLAUDE.local.md`
  - [ ] `groups/*/.claude-shared.md`
  - [ ] visible `groups/*/.claude-fragments/` as part of the normal mental model
- [ ] Move internal-only composition artifacts into a hidden/internal path if still needed.

### Host-side composition cleanup

- [ ] Refactor or replace:
  - [ ] `src/claude-md-compose.ts`
- [ ] Ensure the host no longer rewrites user-owned canonical `CLAUDE.md`
- [ ] If internal artifacts remain necessary, ensure they are not presented as the user-edited prompt source

### Mount cleanup

- [ ] Update mount behavior in:
  - [ ] `src/container-runner.ts`
- [ ] Preserve compatibility mounts needed for Claude Code
- [ ] Remove mounts that only served the old visible-wrapper approach, if possible

### Files to update

- `src/claude-md-compose.ts`
- `src/container-runner.ts`
- possibly `src/group-init.ts`

---

## Phase 5 — Group initialization and creation flow

- [ ] Update new-group initialization to write canonical editable `CLAUDE.md`
- [ ] Stop seeding new personality into `CLAUDE.local.md`
- [ ] Ensure group creation tools and restore scripts write the right file

### Files to update

- `src/group-init.ts`
- `scripts/restore-legacy-group.ts`
- `src/modules/group-management/register-group.ts`
- any setup/init scripts that currently seed `CLAUDE.local.md`

### Acceptance checks

- [ ] New groups come up with one editable prompt file only
- [ ] Restored legacy groups preserve personality correctly

---

## Phase 6 — Docs, skills, and developer guidance

- [ ] Update user-facing docs to say:
  - [ ] edit `groups/<folder>/CLAUDE.md`
  - [ ] provider compatibility is internal
- [ ] Remove outdated guidance about editing `CLAUDE.local.md`
- [ ] Update any skill text referencing old prompt layout

### Files likely needing updates

- `container/CLAUDE.md`
- `container/skills/self-customize/SKILL.md`
- `container/skills/welcome/SKILL.md`
- `src/group-init.ts` comments
- `src/container-runner.ts` comments
- provider comments
- any docs that mention `CLAUDE.local.md`

---

## Phase 7 — Validation matrix

### Provider validation

- [ ] Claude group reads canonical `CLAUDE.md`
- [ ] Codex group reads canonical `CLAUDE.md`
- [ ] OpenCode group reads canonical `CLAUDE.md`
- [ ] Same group personality produces equivalent behavior across providers

### Functional validation

- [ ] Existing WhatsApp groups preserve personalities
- [ ] Main group still works
- [ ] Restored legacy groups still work
- [ ] No provider boot/auth regressions from unrelated container-config logic

### Regression checks

- [ ] `provider-container-registry` still only controls mounts/env/auth
- [ ] no provider directly reads `CLAUDE.md` / `CLAUDE.local.md` on its own
- [ ] no duplicate prompt content is injected
- [ ] no double-loading for Claude

### Suggested commands

- [ ] host tests
- [ ] runner/provider tests
- [ ] targeted group smoke tests
- [ ] real provider smoke tests for at least Claude and Codex

---

## Nice-to-have follow-up

- [ ] Consider optional `AGENTS.md` compatibility import later
- [ ] Only do this if it can be added without introducing a second editable source of truth
- [ ] If ever added, document conflict policy clearly

---

## Done criteria

The work is complete when all of the following are true:

- [ ] `groups/<folder>/CLAUDE.md` is the only canonical editable per-group prompt file
- [ ] `CLAUDE.local.md` is no longer required for normal operation
- [ ] `.claude-shared.md` is no longer part of the visible user-facing prompt model
- [ ] Claude Code still works with no user workflow change
- [ ] Codex/OpenCode/other providers use the same logical prompt bundle
- [ ] prompt semantics are centralized
- [ ] provider-container config remains separate from prompt composition
- [ ] no duplicated user-edited prompt files remain
