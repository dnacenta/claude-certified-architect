# Claude Certified Developer — Foundations (CCDV-F)

Overview guide for the **Claude Certified Developer — Foundations** exam — the hands-on implementation credential in the Claude certification family. Facts below are taken from the official Exam Guide v1.0 (effective July 2026).

> Looking for the Architect exam? The full deep-dive study guide in this repo covers [CCAR-F](../claude-certified-architect.md). This page is an overview of a sibling certification — with heavy content overlap, mapped below.

---

## What It Validates

That you can build, integrate, and ship production-grade applications, agents, and workflows on the Claude platform at a foundational level: building agents with the Claude Agent SDK and custom agent loops, integrating Claude through the API and client SDKs (streaming, error handling, multi-format input), operating Claude Code (Skills, CLAUDE.md, settings.json, plugins), prompt and context engineering, designing and running evals, model/cost/latency optimization, secure-by-design practices and hook-based guardrails, and building custom tools and MCP servers.

**Intended for:** AI/ML engineers, technical leads, and senior software engineers. Recommended (not required): 1–5 years of software engineering, 6+ months hands-on with Claude or comparable LLM systems, Python and/or TypeScript, REST APIs and CLI fluency.

**Not intended for:** non-technical users, or roles limited to prompt writing without broader application-development responsibility.

---

## Exam at a Glance

| | |
|---|---|
| Exam code | CCDV-F |
| Items | 53 (multiple-choice and multiple-response; each item states how many responses to select) |
| Time limit | 120 minutes |
| Delivery | Proctored — online proctored and/or Pearson VUE test center |
| Passing score | 720 scaled (scale 100–1,000) |
| Exam fee | $125 USD |
| Validity | 12 months from award |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |
| Prerequisites | None mandatory — recommended experience only |

---

## Domain Blueprint

Unlike the Architect Foundations exam (5 evenly weighted domains), CCDV-F has 8 domains with very uneven weights — a third of the exam is Applications and Integration:

| # | Domain | Weight |
|---|--------|--------|
| 1 | Agents and Workflows | 14.7% |
| 2 | Applications and Integration | 33.1% |
| 3 | Claude Code | 3.1% |
| 4 | Eval, Testing, and Debugging | 2.6% |
| 5 | Model Selection and Optimization | 16.8% |
| 6 | Prompt and Context Engineering | 11.0% |
| 7 | Security and Safety | 8.1% |
| 8 | Tools and MCPs | 10.6% |

### What each domain covers

1. **Agents and Workflows (14.7%)** — workflow-vs-agent decision criteria, manager/supervisor hierarchies, subagents; building with the Claude Agent SDK, custom loops and harnesses, hosted vs self-hosted deployment, hooks for deterministic actions; agent design patterns (tool-use loops, sub-agents, memory, context-window management) and frameworks.
2. **Applications and Integration (33.1%)** — the big one. Requirements and systems-lifecycle basics; Claude API mechanics (messages, tools, streaming, vision, thinking, caching, third-party vendors, batch vs realtime); software-engineering foundations (REST, JSON, async, version control, refactoring); application design (how Claude interprets instructions across Claude Code / Desktop / claude.ai / API / SDKs, content boundaries, schema design, session hygiene); configuration management (CLAUDE.md, settings.json, model pinning, prompt versioning).
3. **Claude Code (3.1%)** — core components (Rules, Skills, Commands, Agents, Agent Memory), session management, slash commands, headless mode, streaming mode, auto-mode, the CLAUDE.md hierarchy, settings.json.
4. **Eval, Testing, and Debugging (2.6%)** — error-type identification, recovery strategies, trace analysis, isolating integration-layer vs model-output problems.
5. **Model Selection and Optimization (16.8%)** — LLM fundamentals (tokens, context windows, sampling, non-determinism), model options (fast mode, extended/adaptive thinking, effort levels), model-tier tradeoffs and breaking changes across releases, token budgeting, prompt caching for cost.
6. **Prompt and Context Engineering (11.0%)** — context-drift/bloat prevention (tool-output pruning, compaction), context isolation via subagents, prompt engineering principles, structured-output patterns, defensive parsing, skepticism toward confident output.
7. **Security and Safety (8.1%)** — prompt-injection awareness and mitigation, jailbreak defense, untrusted input, PII, guardrail layering, hooks as safety controls, secrets and key management.
8. **Tools and MCPs (10.6%)** — tool use and function calling, tool-description writing, client-side vs server-side tools, approval patterns, MCP server authoring and deployment, stdio vs socket transports.

---

## Overlap with This Repo's CCAR-F Material

A large share of CCDV-F content is already covered in the Architect guide, at architect altitude:

| CCDV-F domain | Covered in |
|---|---|
| Agents and Workflows | [d1 — Agentic Architecture](../domains/d1-agentic-architecture.md) |
| Tools and MCPs | [d2 — Tool Design & MCP](../domains/d2-tool-design-mcp.md) |
| Claude Code | [d3 — Claude Code Configuration](../domains/d3-claude-code-config.md) |
| Prompt and Context Engineering | [d4 — Prompt Engineering](../domains/d4-prompt-engineering.md) + [d5 — Context Management](../domains/d5-context-reliability.md) |
| Applications and Integration / Model Selection | Partially in d1/d4; the API-mechanics and cost-optimization depth is CCDV-F-specific |

The developer exam goes deeper on API mechanics, SDK usage, evals, security, and cost optimization than the Architect Foundations blueprint does.

---

## How to Prepare (per the official guide)

- Study the blueprint and self-assess against each skill
- Build and ship at least one real Claude application end-to-end: API integration, an agent loop or Agent SDK build, custom tools or an MCP server, and an eval
- Review official documentation for the Claude API, Agent SDK, Claude Code, and MCP
- Practice cost levers hands-on: model-tier selection, prompt caching, batch processing

---

## Registration and Policies

1. Register via the exam's page on the **Anthropic Partner Academy** (partner-tier discounts apply at checkout), then schedule through **Pearson VUE** — online proctoring or a test center.
2. Cancel/reschedule up to 24 hours before the appointment; changes within 24 hours forfeit the fee.
3. Retakes: up to 4 attempts per rolling 12 months, with waiting periods after each failed attempt (14 / 30 / 90 days), per Pearson VUE program policy.

---

## Resources

- [Official CCDV-F Exam Guide (PDF, v1.0)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1783542875/Claude+Certified+Developer+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [Claude API docs](https://platform.claude.com/docs/en/overview) · [Claude Code docs](https://code.claude.com/docs/en/overview) · [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) · [MCP](https://modelcontextprotocol.io/introduction)
