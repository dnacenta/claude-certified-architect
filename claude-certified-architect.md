# Claude Certified Architect — Foundations

Anthropic's first technical certification for solution architects building production applications with Claude. 60 multiple-choice, scenario-based questions. Passing score: 720/1000. Candidates answer questions from 4 of 6 randomly selected scenarios. No penalty for guessing.

Target: Solution architect with 6+ months experience with Claude APIs, Agent SDK, Claude Code, and MCP. Currently exclusive to Anthropic Partners (free for first 5,000 partner employees).

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

- [Official Exam Guide (PDF)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F8lsy243ftffjjy1cx9lm3o2bw%2Fpublic%2F1773274827%2FClaude+Certified+Architect+%E2%80%93+Foundations+Certification+Exam+Guide.pdf)
- [Anthropic Skilljar — Building with Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api)
- [12-Week Training Program (GitHub)](https://github.com/SGridworks/claude-certified-architect-training)
- [Building Effective Agents (Anthropic Research)](https://www.anthropic.com/research/building-effective-agents)
- [Claude Tool Use Docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)
- [MCP Introduction](https://modelcontextprotocol.io/introduction)
- [Agent SDK Overview](https://docs.anthropic.com/en/docs/agent-sdk/overview)
- [Claude Partner Network](https://www.anthropic.com/news/claude-partner-network)
