---
name: qmd-brain
description: Semantic search over this agent group's brain/wiki knowledge base using QMD BM25 and vector embeddings.
allowed-tools: Bash(/app/skills/qmd-brain/qmd-brain:*)
---

# QMD Brain Search

Use this skill when a question may be answered by the saved brain/wiki knowledge base.

## Response style

QMD output is retrieval evidence, not the user-facing answer.

- Never expose QMD internal URI handles in replies. They are tool implementation details, not useful citations.
- Prefer article titles, the real subject, and a concise reason the result matters.
- Do not include file paths in WhatsApp-style answers unless the user explicitly asks for the source file or asks where the note lives.
- Lines beginning `File:` in QMD wrapper output are for your internal follow-up reads only. Use them with `qmd-brain get`; do not quote them in normal replies.
- Do not say "I ran qmd" unless the user is explicitly checking tooling. Answer the user's question directly.
- Rank results by usefulness, not just QMD score. Separate exact matches from adjacent/background references.
- For each useful hit, give one short takeaway. Avoid raw snippets unless the wording itself matters.
- If results are weak or broad, say so and explain the narrower query you would try next.
- Before sending any answer, scan it for internal QMD URI handles or file paths. If the user did not explicitly ask for source files, remove them.

Good shape:

```text
Best matches I found:

- AutoHedge — autonomous trading-agent system. Strongest match: strategy, quant, risk, and execution agents for live Solana trading.
- OpenBB — financial data platform. Useful as the data/analytics layer for trading agents, not an autonomous trader by itself.
- Kronos — financial-market foundation model. More research/model layer than usable trading tool.
```

Bad shape:

```text
- AutoHedge — internal QMD handle or file path
```

## Environment

Use the wrapper. It sets the persistent QMD environment and normalizes internal result handles for tool use.

```bash
/app/skills/qmd-brain/qmd-brain search "keyword or phrase"
/app/skills/qmd-brain/qmd-brain query "natural language question"
/app/skills/qmd-brain/qmd-brain vsearch "concept or idea"
/app/skills/qmd-brain/qmd-brain get brain/wiki/file-name.md
/app/skills/qmd-brain/qmd-brain status
```

Do not call `node_modules/.bin/qmd` directly for normal search tasks. The wrapper prevents internal QMD URI handles from leaking into user-facing replies.

## Raw environment

If the wrapper is unavailable, QMD uses these persistent paths:

```bash
export XDG_CACHE_HOME=/workspace/agent/qmd/xdg-cache
export XDG_CONFIG_HOME=/workspace/agent/qmd/xdg-config
```

QMD is installed per group at:

```bash
/workspace/agent/qmd/node_modules/.bin/qmd
```

The brain collection indexes:

```bash
/workspace/agent/brain/wiki
```

Refresh index after wiki changes:

```bash
/app/skills/qmd-brain/qmd-brain update
/app/skills/qmd-brain/qmd-brain embed
```

If `/workspace/agent/qmd/node_modules/.bin/qmd` is missing, say QMD is not installed for this group instead of using a non-persistent global install.
