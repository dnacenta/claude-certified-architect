# Claude Certified Architect — Foundations

Anthropic's technical certification for solution architects building production applications with Claude (exam code **CCAR-F**). 60 multiple-choice, scenario-based questions in 120 minutes, proctored and closed-book. Passing score: 720/1000. Candidates answer questions from 4 of 6 randomly selected scenarios. No penalty for guessing.

Part of a four-credential family: [Claude Certified Associate — Foundations (CCAO-F)](certs/ccao-f-associate.md), **Architect — Foundations (CCAR-F)** — this guide, [Architect — Professional (CCAR-P)](certs/ccar-p-architect-professional.md), and [Developer — Foundations (CCDV-F)](certs/ccdv-f-developer.md). Delivered via Pearson VUE (OnVUE online or test center), registered through the Anthropic Partner Academy. Per Exam Guide v1.0 (effective July 2026): $125 per attempt, certification valid 12 months, up to 4 attempts per rolling 12 months (14/30/90-day waits after attempts 1–3). Access remains gated to the Claude Partner Network; the earlier "$99, first 5,000 partner employees free" beta terms are superseded.

Target: Solution architect with 6+ months experience with Claude APIs, Agent SDK, Claude Code, and MCP.

---

## Current Model Lineup (August 2026)

The exam is model-agnostic, but scenario questions and code samples assume a current lineup. This guide's samples use **`claude-opus-5`**.

| Model | ID | Context | Max output | Price (in / out per MTok) | Notes |
|-------|-----|---------|-----------|---------------------------|-------|
| Claude Fable 5 | `claude-fable-5` | 1M | 128k | $10 / $50 | Most capable widely released model; thinking always on |
| **Claude Opus 5** | `claude-opus-5` | 1M | 128k | $5 / $25 | **Default for complex agentic coding and enterprise work** |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | 128k | $2 / $10 | Best speed/intelligence balance |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200k | 64k | $1 / $5 | Fastest; only current model still using `budget_tokens` thinking |

Claude Mythos 5 (`claude-mythos-5`) shares Fable 5's specs and is invitation-only under Project Glasswing, for defensive cybersecurity work. **Legacy but still available:** Opus 4.8, Opus 4.7, Opus 4.6, Sonnet 4.6, Sonnet 4.5, Opus 4.5.

Model IDs from the 4.6 generation onward are **dateless but still pinned snapshots**, not evergreen pointers. Query `client.models.list()` / `.retrieve(id)` for live `max_input_tokens`, `max_tokens`, and `capabilities` rather than hardcoding a table like this one.

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
| tool_choice | **"any"** — guarantee tool call | **Forced** — specific tool first |
| API type | **Synchronous** — blocking workflows | **Batch** — latency-tolerant |
| Error handling | **Structured context** — category, retry, partial | Never generic or silent |
| Escalation | **Immediate** — explicit customer request | **Resolve first** — within capability |
| Code review | **Multi-pass** — large PRs | **Single-pass** — small, focused |
| Context passing | **Always explicit** in subagent prompts | Never rely on auto-inheritance |
| Thinking | **Adaptive** (`{"type": "adaptive"}`) on every current model | `budget_tokens` is removed — 400 on Fable 5 / Opus 5 / Sonnet 5 / 4.7 / 4.8 |
| Effort | **`xhigh`** — coding and agentic work | **`low`** — subagents, mechanical tasks |
| Tool exposure | **Load upfront** — under ~10 tools | **Tool search + `defer_loading`** — 10+ tools or multi-server MCP |
| Context reduction | **Clear** (context editing) — verbose tool results | **Compact** — long conversations that need their narrative |
| State that must persist | **Memory tool / files** | Never rely on the conversation surviving compaction |
| Agent harness | **Tool Runner / Agent SDK** — you host | **Managed Agents** — Anthropic hosts loop + sandbox |

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

- [Official Exam Guide (PDF, March 2026 — superseded by Exam Guide v1.0, available via the Anthropic Partner Academy)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773274827%2FClaude+Certified+Architect+%E2%80%93+Foundations+Certification+Exam+Guide.pdf)
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
- [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking) · [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets)
- [Context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) · [Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Stop reasons and fallback](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) · [Refusals and fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
- [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)

**Claude Code (code.claude.com)**

- [Overview](https://code.claude.com/docs/en/overview) · [CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Subagents](https://code.claude.com/docs/en/sub-agents) · [Skills](https://code.claude.com/docs/en/skills) · [Plugins](https://code.claude.com/docs/en/plugins) · [Hooks](https://code.claude.com/docs/en/hooks)
- [MCP](https://code.claude.com/docs/en/mcp) · [Memory and CLAUDE.md](https://code.claude.com/docs/en/memory) · [Routines](https://code.claude.com/docs/en/routines)
- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)

**Background reading**

- [MCP Introduction](https://modelcontextprotocol.io/introduction)
- [Advanced tool use (Anthropic Engineering)](https://www.anthropic.com/engineering/advanced-tool-use)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
