# Claude Certified Developer — Foundations (CCDV-F)

Overview guide for the **Claude Certified Developer — Foundations** exam — the hands-on implementation credential in the Claude certification family. Facts below are taken from the official Exam Guide v1.1.

> **The blueprint changes on 2026-12-07.** Exams taken on or after that date use the updated v1.1 guide ("Effective December 7, 2026"): 70 items instead of 53, and the same eight domains with very different weights. This page leads with that blueprint; if you test on or before 2026-12-06, the outgoing weights (the v1.1 guide "Effective November 2026") still apply and are shown alongside. Both guides are linked under Resources.

> Looking for the Architect exam? The full deep-dive study guide in this repo covers [CCAR-F](../claude-certified-architect.md). This page is an overview of a sibling certification — with heavy content overlap, mapped below.

---

## What It Validates

That you can build, integrate, and ship production-grade applications, agents, and workflows on the Claude platform at a foundational level: building agents with the Claude Agent SDK and custom agent loops, integrating Claude through the Messages API and SDKs (tool use, streaming, structured output, prompt caching, batch processing, resilient error handling), operating and extending Claude Code (configuration precedence, permission modes, Skills, plugins, hooks, subagents), prompt and context engineering, building evals and diagnosing failures from traces, model/cost/latency optimization, layered deterministic guardrails and credential handling, and building custom tools and MCP servers.

**Intended for:** software engineers, AI/ML engineers, full-stack and backend developers, and solutions engineers. Recommended (not required): 1–5 years of software engineering, 6+ months hands-on with Claude or comparable LLM systems, Python and/or TypeScript, REST APIs and CLI fluency.

**Not intended for:** non-technical users, or roles limited to prompt writing without broader application-development responsibility.

---

## Exam at a Glance

| | |
|---|---|
| Exam code | CCDV-F |
| Items | From 2026-12-07: 70, of which 60 are scored and 10 are unscored (unscored items are not identified and do not affect your score); scenario-based multiple-choice, each item stating how many responses to select. Until 2026-12-06: 53 (multiple-choice and multiple-response) |
| Time limit | 120 minutes |
| Delivery | Proctored — online proctored and/or Pearson VUE test center |
| Passing score | 720 scaled (scale 100–1,000) |
| Exam fee | $125 USD |
| Validity | 12 months from award |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |
| Prerequisites | None — recommended experience only |

---

## Domain Blueprint

CCDV-F has 8 domains against the Architect Foundations exam's 5. From 2026-12-07 the weights are far more even than before: Applications and Integration drops from a third of the exam to a fifth, while Claude Code and Eval, Testing, and Debugging — together under 6% on the outgoing blueprint — rise to 8% and 10%.

| # | Domain | Weight from 2026-12-07 | Weight until 2026-12-06 |
|---|--------|--------|--------|
| 1 | Agents and Workflows | 17% | 14.7% |
| 2 | Applications and Integration | 20% | 33.1% |
| 3 | Claude Code | 8% | 3.1% |
| 4 | Eval, Testing, and Debugging | 10% | 2.6% |
| 5 | Model Selection and Optimization | 12% | 16.8% |
| 6 | Prompt and Context Engineering | 15% | 11.0% |
| 7 | Security and Safety | 8% | 8.1% |
| 8 | Tools and MCP | 10% | 10.6% |

Domain names are unchanged apart from domain 8, which the outgoing guide calls "Tools and MCPs". If you test before the switch, weight your study by the right-hand column — Applications and Integration plus Model Selection and Optimization are about half of that exam.

### What each domain covers

Objectives below follow the December 7 guide (weights in parentheses are the new ones).

1. **Agents and Workflows (17%)** — choosing a workflow or an agentic architecture against business requirements, error tolerance, and audit constraints, including orchestrator/subagent decomposition and a self-hosted harness vs a managed, sandboxed agent runtime; building and correcting Claude Agent SDK agent definitions, custom loops, and hooks so required actions execute deterministically; diagnosing a misbehaving agent from a trace (tool-use loop termination, subagent isolation, memory, context-window management).
2. **Applications and Integration (20%)** — still the largest domain. Messages API mechanics (message structure, tool use, streaming, vision, thinking, prompt caching, structured output, stop reasons, realtime vs batch); how Claude interprets instructions on different surfaces and what crosses the application boundary; configuration and SDLC integration (CLAUDE.md, settings.json, model version pinning, prompt versioning, plugin dependencies, CI); integration resilience (streaming terminal events, retries and fallbacks that distinguish rate-limit, overloaded, invalid-request, and timeout errors, multi-format ingestion through the Files API).
3. **Claude Code (8%)** — operating Claude Code across the CLI, desktop, IDE, web, and mobile surfaces (session management, CLAUDE.md hierarchy and precedence, settings.json, permission modes, headless and streaming modes, built-in commands); choosing, authoring, and packaging the right extension mechanism — Skill, plugin, Rules file, hook, subagent, or slash command.
4. **Eval, Testing, and Debugging (10%)** — designing evaluations (LLM-as-judge harnesses calibrated against human-labeled data, golden sets, regression tests, behavioral checks, defensible metrics); diagnosing failure modes from traces (hallucination, refusal, under-acting, context loss, format drift), isolating integration-layer vs model-output problems, and fixing the cause rather than the symptom.
5. **Model Selection and Optimization (12%)** — generation mechanics (tokens, context windows, sampling and non-determinism) and model options (adaptive thinking, effort levels); model-tier selection across quality, latency, and cost, and planning for behavior change across releases with regression evaluations; cost diagnosis and optimization (prompt caching with single, layered, and rolling breakpoints, batch processing, token budgets).
6. **Prompt and Context Engineering (15%)** — managing context bloat and drift in long-running sessions (compaction, tool-output pruning, subagent isolation, when to start fresh); revising prompts against regression evaluations; structured outputs with strict schema validation and defensive parsing; grounding answers in supplied documents with citations and a "not found" path, and full-context vs retrieval decisions.
7. **Security and Safety (8%)** — prompt-injection and jailbreak defense for agents that process untrusted content; guardrail layering, least privilege, and hooks as deterministic enforcement; API key and credential handling (server-side proxying, workspace-scoped vs admin keys, environment separation, rotation, access monitoring).
8. **Tools and MCP (10%)** — tool design (function schema, descriptions that drive correct invocation, response shaping, error handling, execution side, approval patterns); building, deploying, and integrating MCP servers (resources, tools, prompts, stdio or HTTP transport, authentication); choosing among built-in tools, custom tools, Skills, and MCP servers.

### Sample-question flavor (from the official guide)

The published samples for the December 7 blueprint test streaming event handling (`message_stop` is the terminal event; read the stop reason from `message_delta`), cache-breakpoint placement (layer breakpoints by how often each prefix changes, not one breakpoint after the user's question), and fixing a misused tool through its description and a structured error rather than a system-prompt rule or an extra tool.

---

## Overlap with This Repo's CCAR-F Material

A large share of CCDV-F content is already covered in the Architect guide, at architect altitude:

| CCDV-F domain | Covered in |
|---|---|
| Agents and Workflows | [d1 — Agentic Architecture](../domains/d1-agentic-architecture.md) |
| Tools and MCP | [d2 — Tool Design & MCP](../domains/d2-tool-design-mcp.md) |
| Claude Code | [d3 — Claude Code Configuration](../domains/d3-claude-code-config.md) |
| Prompt and Context Engineering | [d4 — Prompt Engineering](../domains/d4-prompt-engineering.md) + [d5 — Context Management](../domains/d5-context-reliability.md) |
| Applications and Integration / Model Selection | Partially in d1/d4; the API-mechanics and cost-optimization depth is CCDV-F-specific |

The developer exam goes deeper on API mechanics, SDK usage, evals, security, and cost optimization than the Architect Foundations blueprint does. The next tier up is [Developer — Professional (CCDV-P)](ccdv-p-developer-professional.md), which assumes this exam's scope.

---

## How to Prepare (per the official guide)

- Study the blueprint and self-assess against each objective
- Build and ship at least one tool-using Claude agent or workflow, with the Claude Agent SDK or a custom harness, that includes custom tools or an MCP server, structured outputs, prompt caching, an evaluation run against a golden set, and deterministic guardrails
- Review official documentation for the Claude Developer Platform (Messages API, Claude Agent SDK, Claude Managed Agents), Claude Code (Skills, plugins, Rules files, hooks, subagents), and MCP, plus the differences between first-party API and cloud-platform deployments
- Practice the competencies hands-on: diagnosing integration and agent failures from traces and error output, calibrating an LLM-as-judge evaluator against human labels, placing prompt-cache breakpoints, and choosing among tools, Skills, and MCP

---

## Registration and Policies

1. Register from the exam's page on the **Anthropic Partner Academy**: confirm your exam and exam profile, then continue to **Pearson VUE**. Since 2026-11-12, sign-in to Pearson is by single sign-on (SSO) from the Partner Academy (direct sign-in on Pearson's site is no longer available) and you pay at **Pearson's checkout** when you schedule — online proctoring (OnVUE) or a test center. Your price, including any partner discount, locks when you schedule: rescheduling keeps it, canceling releases it.
2. Cancel or reschedule free of charge up to **1 hour** before an OnVUE exam or **48 hours** before a test-center exam; later changes, or not showing up, forfeit the fee. Canceling in time starts an automatic refund of what you paid at Pearson's checkout (7–10 business days). If you paid through the Partner Academy before 2026-11-12, Anthropic refunds you after you cancel, which can take a few extra days.
3. Retakes: up to 4 attempts per rolling 12 months, with waiting periods after each failed attempt (14 / 30 / 90 days), per Pearson VUE program policy. Limits apply per exam; the policies page adds that the waiting period and the attempt count reset when an exam moves to a new version.
4. Renewal: the credential is valid 12 months; renewing on time is free — review what changed since you certified and pass a non-proctored, open-book assessment (retakes allowed; the new 12 months run from your current expiry). If it lapses, the full exam fee applies again. Registration requires a partner-domain email address. Delivery moved to Pearson VUE and digital badging to Credly on 2026-06-30; candidates must be at least 18. Partner-tier discounts apply automatically at Pearson's checkout — 50% for Select, Preferred, and Global Premier partners, 100% for Global Premier partners through 2026-12-31. The FAQ lists the exam and its prep content in English and Japanese (one registration; you pick the language when scheduling), and Japanese editions of both v1.1 exam guides are published (linked under Resources).

---

## Resources

- [Official CCDV-F Exam Guide v1.1, effective December 7, 2026 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946771/Claude_Certified_Developer_-_Foundations_Exam_Guide_Updated_Dec_7.pdf) — use this if you test on or after 2026-12-07 ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946795/Claude_Certified_Developer_-_Foundations_Exam_Guide_Updated_Dec_7_Japanese.pdf))
- [Official CCDV-F Exam Guide v1.1, effective November 2026 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946716/Claude_Certified_Developer_-_Foundations_Exam_Guide.pdf) — the blueprint in force until 2026-12-06 ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946746/Claude_Certified_Developer_-_Foundations_Exam_Guide_Japanese.pdf))
- [Certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications) · [Certification policies](https://anthropic-partners.skilljar.com/page/policies-certifications) · [Pearson SSO and checkout guide (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794424056/Claude_certifications-Pearson_SSO_and_checkout.pdf)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [CCDV-P overview in this repo](ccdv-p-developer-professional.md) — the Professional tier of this track
- [Claude API docs](https://platform.claude.com/docs/en/intro) · [Claude Code docs](https://code.claude.com/docs/en/overview) · [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview) · [MCP](https://modelcontextprotocol.io/docs/getting-started/intro)
