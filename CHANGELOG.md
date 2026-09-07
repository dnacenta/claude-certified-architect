# Changelog

Refresh history for this study guide. Each entry records what changed on Anthropic's side and what was updated here in response.

The exam blueprint itself (domains, weights, scenarios) comes from the official Exam Guide and changes rarely; most entries below are about the *platform* the exam tests — models, API surface, and Claude Code.

---

## 2026-09 — Claude Fable 5.1, preserved thinking, dynamic workflows

**What changed at Anthropic**

- **Claude Fable 5.1** (`claude-fable-5-1`, released 2026-09-01) is the most capable widely released model; **Claude Mythos 5.1** is its Project Glasswing twin and, unlike Mythos 5, runs safety classifiers. Fable 5 joins Opus 4.8/4.7/4.6/4.5 and Sonnet 4.6/4.5 on the legacy list; Opus 4.1 retired 2026-08-05. Same $10/$50 pricing as Fable 5, cache reads down to $0.25/MTok. Anthropic now publishes per-model retirement floors.
- Three **breaking changes on Fable 5.1**: forced `tool_choice` (`any` / `tool`) returns 400; thinking blocks are readable only by the producing model or a newer one (a fallback to an older model drops them, unbilled); and **editing earlier turns invalidates later thinking blocks** — harnesses must keep history append-only or trim on the server. New organizations (created on or after 2026-08-31) already get a 400 on edited history.
- Additive on Fable 5.1 / Mythos 5.1 (beta): per-message `effort` inside a `role: "system"` message (also on Opus 5), turn-scoped system messages (`clear_at: "next_user_message"`), `thinking.display: "updates"` progress notes, `tool_addition` / `tool_removal` blocks, and content provenance.
- **Task budgets are not supported on Sonnet 5** (the docs' feature table); a budget that is too small produces refusal-like scoping-down. Prompt-cache minimums are model-dependent (512 tokens on Opus 5 / Fable 5.x, up to 4,096 on Opus 4.6 and Haiku 4.5). Effort guidance changed: start at `high` and sweep on Opus 5 / Fable 5.1; `xhigh` remains the starting point on Opus 4.8/4.7.
- The **Admin API** landed in every SDK (`client.beta.organization`) and the **`ant` CLI** (`ant auth login`, `ant beta:agents create < agent.yaml`) is now the recommended control plane for Managed Agents. The Python SDK crossed to 1.x.
- Claude Code (v2.1.236 → v2.1.263): **dynamic workflows** (`Workflow` tool, `/workflows`, `/workflow-authoring`, `/deep-research`, `ultracode`) and experimental **agent teams**; `PreModelSwitch` / `PostModelSwitch` hooks (33 events); `subagent_type: "fork"` with fork mode on by default, `/fork` now copying a session into a background session and `/branch` for in-place branching; background-session lifecycle (`claude --bg`, `claude agents`, `attach` / `logs` / `stop` / `respawn` / `rm`); `--restricted`, `--permission-prompts none`, `--safe-mode`, `--append-subagent-system-prompt-file`; `/skill-doctor`, `/diff`, `/advisor`, `/fast`, `/feedback`; `managedMcpServers`, `promptCacheTtl`, `modelPicker`, `modelPricing`, output-cap settings; auto memory as one typed file per memory behind a `MEMORY.md` index.
- Certification program: the Partner Academy FAQ confirms **free on-time renewal** via a non-proctored assessment (a lapsed credential means the full exam again) and partner-domain-email registration. The v1.0 CCAR-F Exam Guide PDF is now linked directly.

**What changed here**

- README and main guide: lineup table led by Fable 5.1 with the three breaking changes summarised; retirement floors; renewal policy; official v1.0 exam guide and Partner Academy links; decision-framework rows for `tool_choice` (per-model), effort (start at `high`), append-only history, and subagents vs workflows; models-docs URL updated to `platform.claude.com/docs/en/models/overview`.
- **Domain 1**: fallback consequences on Fable 5.1; task-budget availability corrected (no Sonnet 5) and too-small-budget behaviour; `ant` CLI flow for Managed Agents; a subagents / skills / agent teams / workflows comparison; `subagent_type: "fork"`, `/fork` vs `/subtask` vs `/branch`; hook catalog 31 → 33 (`PreModelSwitch`, `PostModelSwitch`); background-session commands.
- **Domain 2**: Fable 5.1 forced-tool-use box and replacement patterns; `managedMcpServers` scope; `ToolSearch`, `SendMessage` / `ListAgents`, and `Workflow` in the built-in tools table; new section on `tool_addition` / `tool_removal`; new practice question Q5.
- **Domain 3**: background sessions, `/fork`, `/loop` self-pacing; typed auto-memory files; refreshed bundled-skill list; `experimental.cacheTtl`; new "Agent Teams and Dynamic Workflows" section; new CI flags (`--permission-prompts none`, `--restricted`, `--safe-mode`, `--append-subagent-system-prompt-file`); new cost/cache/fleet settings table.
- **Domain 4**: Fable 5.1 row in the thinking table; rewritten effort guidance with per-message effort; `display: "updates"`; turn-scoped and tool-change system messages; new "Preserved Thinking" section; caching table with per-model minimums, pricing, and cache diagnostics; extra silent invalidators.
- **Domain 5**: Fable 5.1 in the context table and tokenizer note; compaction availability and `instructions`; new "Compaction Shapes That Stay Valid" section; task-budget corrections; Mythos 5.1 refusals; new practice question Q7.
- `certs/`: renewal policy added to each overview.

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
