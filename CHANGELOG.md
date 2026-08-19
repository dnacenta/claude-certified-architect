# Changelog

Refresh history for this study guide. Each entry records what changed on Anthropic's side and what was updated here in response.

The exam blueprint itself (domains, weights, scenarios) comes from the official Exam Guide and changes rarely; most entries below are about the *platform* the exam tests — models, API surface, and Claude Code.

---

## 2026-08 — Claude Opus 5, tool search, server-side context management

**What changed at Anthropic**

- **Claude Opus 5** (`claude-opus-5`) is the current default for complex agentic coding and enterprise work. Opus 4.8, 4.7, 4.6, Sonnet 4.6, Sonnet 4.5, and Opus 4.5 moved to the legacy list. Claude Mythos 5 joined Fable 5 under Project Glasswing (invitation-only). Sonnet 5 lists at $2 / $10 per MTok.
- **Tool search** is GA on the Claude API and **on by default in Claude Code**. Anthropic's published threshold for tool-selection degradation is now ~30–50 tools, with `defer_loading` as the scaling mechanism.
- **Server-side context management** matured: context editing (`clear_tool_uses_20250919`, `clear_thinking_20251015`), compaction (`compact_20260112`), and the memory tool (`memory_20250818`).
- **Task budgets** (beta) give an agentic loop a ceiling the model can see.
- **Server-side refusal fallbacks** (`fallbacks: "default"`) route around a `refusal` stop reason automatically.
- Claude Code shipped as a **desktop app and on the web/mobile**, alongside the terminal, VS Code, and JetBrains; sessions move between surfaces (`--cloud`, `--teleport`, `/desktop`, Remote Control). Routines run scheduled work in the cloud.
- Claude Code's subagent tool is canonically **`Agent`** (formerly `Task`), with custom subagents defined in `.claude/agents/*.md`.

**What changed here**

- All code samples moved from `claude-opus-4-8` to `claude-opus-5`; added a current model lineup table to the main guide and README.
- **Domain 1**: added server-side refusal fallbacks; a task-budget note under the iteration-cap anti-pattern; a "who runs the loop" comparison (manual loop / Tool Runner / Managed Agents / Agent SDK) including Managed Agents; corrected the `Task` → `Agent` tool naming; forks vs fresh subagents; session portability; hook catalog updated to 31 events (added `DirectoryAdded`).
- **Domain 2**: kept the exam's "4-5 tools" answer and added the tool search reality alongside it; modernised MCP configuration (transport `type`, scopes, `claude mcp add`, OAuth, `alwaysLoad`, `ENABLE_TOOL_SEARCH`, output limits); new §2.6 on Anthropic-defined and server-side tools, parallel tool use, programmatic tool calling, and the MCP connector.
- **Domain 3**: new §3.0 on surfaces, session portability, and the three scheduling mechanisms; plugins and `claude plugin eval`; a full custom-subagent section (`.claude/agents/` frontmatter, built-in agents, permission inheritance, nesting and concurrency limits); expanded CI flag table and managed CI integrations; refreshed bundled-skill list.
- **Domain 4**: new §4.7 on adaptive thinking, `effort`, thinking display, the removal of prefill and sampling parameters, and mid-conversation system messages; new §4.8 on prompt caching; `output_format` marked deprecated; batch extended output (300k) and result ordering.
- **Domain 5**: current context-window sizes and the Opus 4.7 tokenizer change; new §5.7 on context editing vs compaction vs memory tool; new §5.8 on task budgets and refusals as a reliability concern.
- Resources reorganised by source and the stale `docs/en/docs/...` tool-use link fixed. The generated PDF now includes the `certs/` overview guides.

---

## 2026-07 — Pearson VUE program update, four credentials

- Certification family expanded to four credentials (CCAO-F, CCAR-F, CCAR-P, CCDV-F); added overview guides in [`certs/`](certs/).
- Exam delivery moved to Pearson VUE (OnVUE online or test center), registered through the Anthropic Partner Academy. Exam Guide v1.0 (effective July 2026) set a $125 fee for CCAR-F and 12-month validity, superseding the launch-period "$99 / first 5,000 partner employees free" terms.
- Documentation split: API docs to `platform.claude.com`, Claude Code docs to `code.claude.com`.
- Schema, `tool_choice`, and hooks corrections throughout.

## 2026-06 — Opus 4.8 lineup

- Refreshed the model lineup (Fable 5, Sonnet 5) and added the `refusal` and `model_context_window_exceeded` stop reasons.
- Added the landing page and auto-built PDF via GitHub Pages.

## 2026-04 — Docs URL migration, Agent SDK rename

- Migrated documentation URLs; renamed "Claude Code SDK" to **Claude Agent SDK**; expanded the hooks catalog.
