# Claude Certified Architect — Foundations

Anthropic's technical certification for solution architects building production applications with Claude (exam code **CCAR-F**). 60 multiple-choice, scenario-based questions in 120 minutes, proctored and closed-book. Passing score: 720/1000. Candidates answer questions from 4 of 6 randomly selected scenarios. No penalty for guessing.

Part of a four-credential family: [Claude Certified Associate — Foundations (CCAO-F)](certs/ccao-f-associate.md), **Architect — Foundations (CCAR-F)** — this guide, [Architect — Professional (CCAR-P)](certs/ccar-p-architect-professional.md), and [Developer — Foundations (CCDV-F)](certs/ccdv-f-developer.md). Delivered via Pearson VUE (OnVUE online or test center), registered through the Anthropic Partner Academy. Per Exam Guide v1.0 (effective July 2026): $125 per attempt, certification valid 12 months, up to 4 attempts per rolling 12 months (14/30/90-day waits after attempts 1–3). Access remains gated to the Claude Partner Network; the earlier "$99, first 5,000 partner employees free" beta terms are superseded.

Target: Solution architect with 6+ months experience with Claude APIs, Agent SDK, Claude Code, and MCP.

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
8. Too many tools per agent (18 vs 4-5 recommended)
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
- [Claude Tool Use Docs](https://platform.claude.com/docs/en/docs/build-with-claude/tool-use)
- [Claude Code Docs](https://code.claude.com/docs/en/overview)
- [MCP Introduction](https://modelcontextprotocol.io/introduction)
- [Claude Agent SDK Overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Claude Partner Network](https://www.anthropic.com/news/claude-partner-network)

> **Note (2026-07):** Anthropic's docs were split into `platform.claude.com` (API) and `code.claude.com` (Claude Code). The SDK was renamed from "Claude Code SDK" to **Claude Agent SDK** (`pip install claude-agent-sdk`, `npm install @anthropic-ai/claude-agent-sdk`). Current models: **`claude-fable-5`** (Anthropic's most capable widely released model; 1M context), **`claude-opus-4-8`** (most capable Opus-tier; 1M context, 128k max output, adaptive-thinking-only, `effort` defaults to `high`), `claude-sonnet-5`, and `claude-haiku-4-5` (`claude-haiku-4-5-20251001`). `claude-opus-4-7` and `claude-sonnet-4-6` are now previous-generation (still active). This guide's code samples use `claude-opus-4-8` as a sensible default.
>
> **Program update (2026-07):** the certification family now spans four credentials (CCAO-F, CCAR-F, CCAR-P, CCDV-F), delivered proctored via Pearson VUE and registered through the Anthropic Partner Academy. Exam Guide v1.0 (effective July 2026) sets a $125 exam fee and 12-month certification validity, superseding the launch-period "$99 / first 5,000 partner employees free" terms.
