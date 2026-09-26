# Claude Certified Architect — Foundations

Anthropic's technical certification for solution architects building production applications with Claude (exam code **CCAR-F**). 60 multiple-choice and multiple-response, scenario-based questions in 120 minutes, proctored and closed-book. Passing score: 720/1000. Candidates answer questions from 4 of 6 randomly selected scenarios. No penalty for guessing.

Part of a four-credential family: [Claude Certified Associate — Foundations (CCAO-F)](certs/ccao-f-associate.md), **Architect — Foundations (CCAR-F)** — this guide, [Architect — Professional (CCAR-P)](certs/ccar-p-architect-professional.md), and [Developer — Foundations (CCDV-F)](certs/ccdv-f-developer.md). Delivered via Pearson VUE (OnVUE online or test center), registered through the Anthropic Partner Academy. Per Exam Guide v1.0 (effective July 2026): $125 per attempt, certification valid 12 months, up to 4 attempts per rolling 12 months (14/30/90-day waits after attempts 1–3). Renewal is free when done on time — review what changed since you certified and pass a non-proctored assessment; let it lapse and the full exam fee applies again. Access remains gated to the Claude Partner Network (registration needs a partner-domain email); the earlier "$99, first 5,000 partner employees free" beta terms are superseded. Delivery moved to Pearson VUE and digital badging to Credly on 2026-06-30. Partner-tier discounts apply at checkout — 50% for Select, Preferred, and Global Premier partners, 100% for Global Premier partners through 2026-12-31 — and candidates must be at least 18.

Target: Solution architect with 6+ months experience with Claude APIs, Agent SDK, Claude Code, and MCP.

---

## Current Model Lineup (September 2026)

The exam is model-agnostic, but scenario questions and code samples assume a current lineup. This guide's samples use **`claude-opus-5-5`**, the docs' current default for most workloads; the few samples that rely on forced `tool_choice` use `claude-sonnet-5`, because both current flagships reject it.

| Model | ID | Context | Max output | Price (in / out per MTok) | Notes |
|-------|-----|---------|-----------|---------------------------|-------|
| Claude Fable 5.1 | `claude-fable-5-1` | 1M | 128k | $10 / $50 (cache reads $0.25) | Most capable widely released model (2026-09-01) — for demanding reasoning and long-horizon agentic work, or when Opus 5.5 at higher effort still falls short; thinking always on; **no forced `tool_choice`**; thinking blocks bound to model + history |
| **Claude Opus 5.5** | `claude-opus-5-5` | 1M | 128k | $4 / $20 (cache reads $0.20) | **Default for most workloads** (2026-09-22): long-running agentic coding and knowledge work; thinking always on and **can't be disabled**; default effort **`medium`**; no forced `tool_choice`; bound thinking blocks |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | 128k | $2 / $10 | Best speed/intelligence balance; still accepts forced `tool_choice`; no mid-conversation system messages, no task budgets; $2 / $10 is now the permanent price (the scheduled rise to $3 / $15 was cancelled) |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200k | 64k | $1 / $5 | Fastest; only current model still using `budget_tokens` thinking; no `effort`; nearest retirement floor in the lineup (2026-10-15) |

Claude Mythos 5.1 (`claude-mythos-5-1`) shares Fable 5.1's specs and pricing and is invitation-only under Project Glasswing, for defensive cybersecurity work. It is the same underlying model served without the dual-use safety measures Fable 5.1 carries; its safeguards depend on the access program, so still handle `refusal` there. **Legacy but still available:** Opus 5, Fable 5, Opus 4.8, Opus 4.7, Opus 4.6, Opus 4.5, Sonnet 4.6, Sonnet 4.5. Opus 4.1 retired on 2026-08-05. Anthropic publishes retirement floors: Fable 5.1 not before 2027-09-01, Opus 5.5 not before 2027-09-22, Opus 5 not before 2027-07-24, Sonnet 5 not before 2027-06-30, Haiku 4.5 not before 2026-10-15 — the only floor inside the next year, with no successor announced, so check the deprecations page before committing new work to it.

Model IDs from the 4.6 generation onward are **dateless but still pinned snapshots**, not evergreen pointers. Query `client.models.list()` / `.retrieve(id)` for live `max_input_tokens`, `max_tokens`, and `capabilities` rather than hardcoding a table like this one.

**What Fable 5.1 and Opus 5.5 change for architects** (Fable 5.1 introduced three breaking changes on 2026-09-01; Opus 5.5 inherited all three on 2026-09-22 — details in Domain 2 §2.3, Domain 4 §4.7, Domain 5 §5.7):

1. `tool_choice: "any"` and `{"type": "tool", ...}` return **400**. Use `auto` plus an explicit instruction, `strict: true`, or structured outputs.
2. Thinking blocks are readable only by some models. Fable 5.1 / Mythos 5.1 read everyone's; Opus 5.5 reads Opus 5 and earlier Opus / Sonnet / Haiku blocks but not Fable or Mythos ones; no older model reads Fable 5.1's or Opus 5.5's. A fallback or router switch to a model that can't read them silently drops them (unbilled) and that model re-plans.
3. Editing, reordering, or removing earlier turns invalidates every later thinking block. Harnesses must be **append-only**: freeze `system` and `tools`, move mid-session changes into `role: "system"` messages (tool definitions included, via inline tools), and trim context server-side (compaction on demand / context editing) rather than on the client.

Opus 5.5 adds three more of its own, none of which break Fable 5.1 code: **thinking can't be disabled** (`{"type": "disabled"}` and `budget_tokens` are a 400 at every effort — lower `effort` instead); the **default effort is `medium`**, one level below Opus 5, so a request that omits `effort` now runs cheaper and shallower than it did (set it explicitly and re-sweep); and on the Claude API and Google Cloud, computer use only through the `computer_toolset_20260801` toolset (`computer_20251124` returns 400). Two behaviour changes arrive with no error: the short text Claude writes between tool calls comes back as `thinking` blocks (empty at the default `display`), and a biology classifier plus a `reasoning_extraction` refusal category join the cybersecurity one.

Fable 5.1 also requires 30-day data retention (no zero-data-retention orgs unless authorized). Priority Tier is not supported on Fable 5.1, Opus 5.5, Opus 5, or Sonnet 5 — and new Priority Tier commitments are no longer sold, so plan capacity around rate limits and the Batch tier instead.

> **Docs (since 2026-07):** Anthropic split its documentation. API docs live at `platform.claude.com/docs/en/*`, Claude Code docs at `code.claude.com/docs/en/*`; the old `docs.anthropic.com` URLs still redirect. The SDK was renamed from "Claude Code SDK" to the **Claude Agent SDK** (`pip install claude-agent-sdk`, `npm install @anthropic-ai/claude-agent-sdk`).
>
> **Program (Exam Guide v1.0, effective July 2026):** four credentials (CCAO-F, CCAR-F, CCAR-P, CCDV-F), proctored via Pearson VUE, registered through the Anthropic Partner Academy. $125 for CCAR-F, 12-month validity — superseding the launch-period "$99 / first 5,000 partner employees free" terms.
>
> Refresh history: [CHANGELOG.md](CHANGELOG.md).

---

## Exam Domains

| Domain | Weight | Deep Dive |
|--------|--------|-----------|
| Agentic Architecture & Orchestration | 27% | [domains/d1-agentic-architecture.md](domains/d1-agentic-architecture.md) |
| Tool Design & MCP Integration | 18% | [domains/d2-tool-design-mcp.md](domains/d2-tool-design-mcp.md) |
| Claude Code Configuration & Workflows | 20% | [domains/d3-claude-code-config.md](domains/d3-claude-code-config.md) |
| Prompt Engineering & Structured Output | 20% | [domains/d4-prompt-engineering.md](domains/d4-prompt-engineering.md) |
| Context Management & Reliability | 15% | [domains/d5-context-reliability.md](domains/d5-context-reliability.md) |

---

## The 6 Exam Scenarios

1. **Customer Support Resolution Agent** — Agent SDK, MCP tools, escalation logic
2. **Code Generation with Claude Code** — CLAUDE.md, plan mode, slash commands
3. **Multi-Agent Research System** — Coordinator-subagent patterns, error handling
4. **Developer Productivity with Claude** — Built-in tools, MCP servers, codebase exploration
5. **Claude Code for CI/CD** — Structured output, batch API, multi-pass review
6. **Structured Data Extraction** — JSON schemas, tool_use, validation-retry

---

## The 10 Critical Anti-Patterns

These show up as wrong answers on the exam:

1. Parsing natural language for loop termination instead of checking `stop_reason`
2. Arbitrary iteration caps as primary stopping mechanism
3. Prompt-based enforcement for critical business rules (should use hooks)
4. Self-reported confidence scores for escalation decisions
5. Sentiment-based escalation (sentiment ≠ complexity)
6. Generic error messages hiding diagnostic context
7. Silently suppressing errors (returning empty results as success)
8. Too many tools per agent (18 vs 4-5 recommended) — see Domain 2 §2.3 for how tool search changes this in the current API
9. Same-session self-review (retains reasoning context bias)
10. Aggregate accuracy metrics masking per-document-type failures

---

## Key Decision Frameworks

| Decision | Option A | Option B |
|----------|----------|----------|
| Enforcement | **Programmatic hooks** — financial/safety | **Prompt-based** — best-effort |
| Execution mode | **Plan mode** — multi-file, architectural | **Direct** — single-file, obvious |
| tool_choice | **"any"** — guarantee tool call | **Forced** — specific tool first. *Both return 400 on Fable 5.1 / Mythos 5.1 / Opus 5.5* — there, `auto` + instruction + `strict: true`, or `output_config.format` |
| API type | **Synchronous** — blocking workflows | **Batch** — latency-tolerant |
| Error handling | **Structured context** — category, retry, partial | Never generic or silent |
| Escalation | **Immediate** — explicit customer request | **Resolve first** — within capability |
| Code review | **Multi-pass** — large PRs | **Single-pass** — small, focused |
| Context passing | **Always explicit** in subagent prompts | Never rely on auto-inheritance |
| Thinking | **Adaptive** (`{"type": "adaptive"}`) on every current model | `budget_tokens` is removed — 400 on Fable 5.x / Opus 5.5 / Opus 5 / Sonnet 5 / 4.7 / 4.8; `disabled` is also a 400 on Fable 5.x and Opus 5.5 (lower `effort` instead) |
| Effort | **Start at the model's default and sweep** — `high` on Fable 5.1 / Opus 5 / Sonnet 5, **`medium` on Opus 5.5** (set it explicitly); `xhigh` for the hardest coding/agentic work, and the recommended start on Opus 4.8 / 4.7 | **`low` / `medium`** — subagents, mechanical and routine tasks |
| Tool exposure | **Load upfront** — under ~10 tools | **Tool search + `defer_loading`** — 10+ tools or multi-server MCP |
| Context reduction | **Clear** (context editing) — verbose tool results | **Compact** — long conversations that need their narrative; prefer **on-demand** compaction (you pick the moment, keep recent turns, run it in the background) over threshold compaction |
| State that must persist | **Memory tool / files** | Never rely on the conversation surviving compaction |
| Agent harness | **Tool Runner / Agent SDK** — you host | **Managed Agents** — Anthropic hosts loop + sandbox |
| Conversation history | **Append-only** — freeze `system`/`tools`, changes via `role: "system"` messages (inline `tool_addition` definitions for tools) | Never edit or snip earlier turns on Fable 5.1 / Opus 5.5 — it invalidates thinking blocks |
| Progress UX between tool calls | **`thinking.display: "updates"`** (beta) or `"summarized"` — Fable 5.x / Opus 5.5 return those notes as `thinking` blocks | Default `"omitted"` — the UI goes quiet between tool calls, with no error |
| Many-agent orchestration (Claude Code) | **Subagents / forks** — a few delegated tasks per turn | **Dynamic workflows** — a script the runtime executes for dozens to hundreds of agents |

---

## 4-Week Study Plan

Assumes daily study, 1.5–2 hours per day.

| Week | Focus | Topics | Daily Goal |
|------|-------|--------|------------|
| 1 | Core Architecture | Agentic loops, `stop_reason`, multi-agent orchestration, hooks, session management, tool design, MCP config | 1 domain section + practice questions |
| 2 | Applied Skills | CLAUDE.md hierarchy, plan mode, CI/CD, Batches API, explicit criteria, few-shot, validation-retry, structured output | 1 domain section + build a small project using each concept |
| 3 | Reliability + Hands-On | Context management, escalation, error propagation, provenance, hands-on exercises across all domains | Review weak areas + build an end-to-end scenario |
| 4 | Exam Prep | Practice exams, anti-pattern drills, scenario walkthroughs, timed question sets | 1 full practice exam per day + targeted review |

---

## Resources

- [Official CCAR-F Exam Guide (PDF, v1.0)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf) — the [March 2026 launch guide](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773274827%2FClaude+Certified+Architect+%E2%80%93+Foundations+Certification+Exam+Guide.pdf) is superseded
- [Anthropic Partner Academy — CCAR-F registration](https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification) · [Prep courses](https://anthropic-partners.skilljar.com/page/claude-certified-architect-foundations-prep-courses) · [Certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications) (renewal, retakes, eligibility)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [Anthropic Skilljar — Building with Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api)
- [12-Week Training Program (GitHub)](https://github.com/SGridworks/claude-certified-architect-training)
- [Building Effective Agents (Anthropic Research)](https://www.anthropic.com/research/building-effective-agents)
- [Claude Partner Network](https://www.anthropic.com/news/claude-partner-network)

**API (platform.claude.com)**

- [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
- [Programmatic tool calling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)
- [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)
- [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)
- [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) · [Preserved thinking](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking) · [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets)
- [Mid-conversation system messages](https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages) (incl. tool changes and defining tools in a message)
- [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) · [Compaction overview](https://platform.claude.com/docs/en/build-with-claude/compaction) · [Compaction on demand](https://platform.claude.com/docs/en/build-with-claude/compaction-on-demand) · [Keeping recent turns](https://platform.claude.com/docs/en/build-with-claude/compaction-keep-recent-turns) · [Compaction and preserved thinking](https://platform.claude.com/docs/en/build-with-claude/compaction-thinking-blocks)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) · [Cache diagnostics](https://platform.claude.com/docs/en/build-with-claude/cache-diagnostics)
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Stop reasons and fallback](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) · [Refusals and fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) · [`ant` CLI](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/quickstart) · [`ant apply`](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/apply) · [Admin API](https://platform.claude.com/docs/en/manage-claude/admin-api)
- [Models overview](https://platform.claude.com/docs/en/models/overview) · [What's new in Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5) · [Opus 5.5 migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide) · [Prompting Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) · [Claude Fable 5.1 migration guide](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide) · [Model deprecations](https://platform.claude.com/docs/en/about-claude/model-deprecations) · [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

**Claude Code (code.claude.com)**

- [Overview](https://code.claude.com/docs/en/overview) · [CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Subagents](https://code.claude.com/docs/en/sub-agents) · [Dynamic workflows](https://code.claude.com/docs/en/workflows) · [Agent teams](https://code.claude.com/docs/en/agent-teams) · [Skills](https://code.claude.com/docs/en/skills) · [Plugins](https://code.claude.com/docs/en/plugins) · [Hooks](https://code.claude.com/docs/en/hooks)
- [MCP](https://code.claude.com/docs/en/mcp) · [Memory and CLAUDE.md](https://code.claude.com/docs/en/memory) · [Routines](https://code.claude.com/docs/en/routines) · [Commands](https://code.claude.com/docs/en/commands) · [Changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)

**Background reading**

- [MCP Introduction](https://modelcontextprotocol.io/introduction)
- [Advanced tool use (Anthropic Engineering)](https://www.anthropic.com/engineering/advanced-tool-use)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
