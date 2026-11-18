# Claude Certified Developer — Professional (CCDV-P)

Overview guide for the **Claude Certified Developer — Professional** exam — the advanced tier above [Developer — Foundations (CCDV-F)](ccdv-f-developer.md), and the fifth credential in the Claude certification family. Facts below are taken from the official Exam Guide v1.0 (effective November 2026).

> **Rollout is partial as of 2026-11-18.** The certification FAQ lists CCDV-P among five certifications, and it has a registration page, a prep path, a Credly badge, and an exam guide — but it is not yet in the Partner Academy catalog table or on Pearson VUE's public program page, and there is no announcement post. This page does not claim the exam can be booked yet; check the registration page.

> Looking for the Architect exam? The full deep-dive study guide in this repo covers [CCAR-F](../claude-certified-architect.md). This page is an overview of a sibling certification.

---

## What It Validates

That you can operate Claude-powered applications, agents, and workflows **in production at scale**: instrumenting them with tracing, metrics, and logging; diagnosing complex failures and leading incident response; gating releases with evaluation; designing resilient, high-throughput integration layers; controlling cost and latency across a fleet; hardening tool-using agents against adversarial input — plus the distinctly Professional-level skill of **directing fleets of coding agents** that carry out engineering work under supervision.

**Intended for:** senior and staff software engineers, platform and site reliability engineers extending their practice to LLM systems, and solutions engineers accountable for the reliability, quality, cost, and safety of deployed Claude applications. Candidates work daily with the Messages API, Agent SDK, Claude Managed Agents, Claude Code, and MCP, and have built and deployed at least one tool-using agent in production.

**Not intended for:** developers whose experience stops at building and shipping — the guide's line is that Professional candidates "go beyond building and shipping: they operate" — or whose production work is only an LLM-backed chatbot or summarizer.

---

## Exam at a Glance

| | |
|---|---|
| Exam code | CCDV-P |
| Items | 70, of which 60 are scored and 10 are unscored (unscored items are not identified and do not affect your score); scenario-based multiple-choice and multiple-response, each item stating how many responses to select |
| Time limit | 120 minutes |
| Delivery | Proctored — online proctored and/or Pearson VUE test center |
| Passing score | 720 scaled (scale 100–1,000) |
| Exam fee | $175 USD |
| Validity | 12 months from award |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |
| Prerequisites | None — the CCDV-F certification is recommended, not required |

---

## Domain Blueprint

Eight domains, like CCDV-F, but none of the names carry over: where Foundations is about building and shipping, every Professional domain is about running the result — reliability, observability, incidents, evaluation gates, cost, guardrails, and agent fleets.

| # | Domain | Weight |
|---|--------|--------|
| 1 | Advanced Agent Architecture and Orchestration | 17% |
| 2 | Production Integration, Reliability, and Knowledge Grounding | 20% |
| 3 | Observability and Production Monitoring | 12% |
| 4 | Advanced Debugging and Incident Response | 10% |
| 5 | Evaluation Engineering and Quality Assurance | 12% |
| 6 | Cost and Latency Optimization at Scale | 8% |
| 7 | Runtime Guardrails and Production Security | 11% |
| 8 | Agent Fleet Operations for Software Delivery | 10% |

### Key objectives per domain

1. **Advanced Agent Architecture and Orchestration (17%)** — multi-agent orchestration (supervisor/worker hierarchies, parallel subagent dispatch, context-isolation boundaries, approval flows); durable execution (session persistence, checkpointing, resumability, memory that survives restart and model version change); deciding from production data whether to move a running system between workflow and agentic patterns; context and memory policy for long-running agents (compaction and editing, persistent memory, cache-safe instruction changes, keeping large tool catalogs out of the context window).
2. **Production Integration, Reliability, and Knowledge Grounding (20%)** — the heaviest domain: resilience patterns (retry and backoff, circuit breakers, graceful degradation, cross-model/region/platform fallbacks that distinguish rate limits from safety refusals from context-window stops); scale and throughput (rate-limit strategy, queueing and backpressure, batch pipelines, multi-tenant quota and isolation); production MCP and change management (remote MCP deployment and authentication, tool and schema versioning, model migrations, prompt versioning, progressive rollout with rollback); **retrieval and grounding at scale** (agentic search vs RAG, chunking and embedding, hybrid search, reranking, source citation, diagnosing retrieval failures by stage).
3. **Observability and Production Monitoring (12%)** — instrumentation (distributed traces for agent loops and tool calls, token and cost metrics, cache-performance diagnostics, structured logs, content capture under privacy constraints such as zero-data-retention); SLIs, SLOs, alerting, and dashboards, including drift after model updates; trace analysis at scale (sampling, aggregation, failure-cohort analysis).
4. **Advanced Debugging and Incident Response (10%)** — isolating the origin of multi-turn, multi-agent, and non-deterministic failures among model output, agent harness, tools, and data (with refusals as a failure class); incident response (triage, mitigation, rollback, communication) and turning incidents into regression evaluations, monitoring coverage, and postmortem findings.
5. **Evaluation Engineering and Quality Assurance (12%)** — offline evaluation systems (golden sets, regression suites, CI/CD evaluation gates, groundedness metrics, release criteria, keeping suites valid against contamination and saturation); LLM-as-judge engineering (calibration against human labels, rubric design, position effects, judge drift across model versions); online quality measurement (live-traffic sampling, A/B testing, feedback loops).
6. **Cost and Latency Optimization at Scale (8%)** — fleet-level cost architecture (modeling and forecasting, model routing and cascades, caching strategy, batch-vs-realtime economics, per-tenant budgets); latency engineering (time-to-first-token vs total latency, streaming, parallel tool execution, cache checkpointing, effort-level tuning).
7. **Runtime Guardrails and Production Security (11%)** — layered guardrail systems (input/output filtering, PII redactors, hook-based policy enforcement, sandboxing, approval gates, deterministic enforcement for irreversible actions); threat defense and adversarial testing (prompt injection, tool and memory poisoning, exfiltration paths, red-team design, secure MCP configuration, drawing on the OWASP Top 10 for LLM Applications and the NIST AI Risk Management Framework); identity, secrets, and audit (workload identity federation replacing static API keys, least-privilege tool permissioning, audit logging).
8. **Agent Fleet Operations for Software Delivery (10%)** — parallel agents on isolated worktrees with a merge and conflict strategy; verification and AI code review operations (shadow mode first, calibration against human review before merge gating); unattended and event-driven agents (goal-, schedule-, or event-driven runs with checkpointing, notification, and escalation); organization-wide coding-agent configuration (managed settings and policies, MCP allowlists, telemetry, gateway routing). This domain has no counterpart on CCDV-F.

### Sample-question flavor (from the official guide)

The published samples test fallback design (branch on the stop condition — retry rate limits, raise the output budget on length stops, route refusals to a safety path — rather than one retry path for everything), LLM-as-judge calibration (randomize response order and re-measure agreement with human labels before the judge gates releases), and exfiltration defense (recipient allowlisting or approval on the email tool plus least-privilege data scoping, rather than a stronger prompt). Expect judgment-under-tradeoffs questions, not recall.

---

## Relationship to CCDV-F and This Repo

- The official guide treats the scope of CCDV-F as assumed knowledge for this exam — start from the [CCDV-F overview](ccdv-f-developer.md) and the deep-dives it maps to: [d1 — Agentic Architecture](../domains/d1-agentic-architecture.md), [d2 — Tool Design & MCP](../domains/d2-tool-design-mcp.md), [d3 — Claude Code Configuration](../domains/d3-claude-code-config.md).
- Study the deltas on top: **observability and SLOs**, **incident response**, **evaluation gates in CI/CD**, **fleet-level cost and latency**, **runtime guardrails and red-teaming**, and **operating fleets of coding agents** — production-operations material that goes beyond this repo's Architect Foundations focus.
- Anthropic recommends, but does not require, holding CCDV-F first.
- On the architect track, the equivalent tier is [Architect — Professional (CCAR-P)](ccar-p-architect-professional.md).

---

## How to Prepare (per the official guide)

- Study the blueprint and self-assess against each objective
- Review the CCDV-F exam guide — its scope is assumed knowledge
- Review official documentation for the Claude API, Agent SDK, Claude Managed Agents, Claude Code (hooks, Skills, plugins, headless operation), and MCP, plus the differences between first-party API and cloud-platform deployments
- Operate at least one tool-using Claude agent in production, with distributed tracing and cost telemetry, SLIs and SLOs, an evaluation suite that gates releases, layered guardrails, and an incident-response and postmortem practice
- Practice the Professional competencies: diagnosing multi-agent failures from traces, calibrating an LLM-as-judge evaluator, designing fallbacks and backpressure, red-teaming a tool-using agent, and running parallel and unattended coding agents

---

## Registration and Policies

1. Register from the exam's page on the **Anthropic Partner Academy**: confirm your exam and exam profile, then continue to **Pearson VUE**. Sign-in to Pearson is by single sign-on (SSO) from the Partner Academy, and you pay at **Pearson's checkout** when you schedule — online proctoring (OnVUE) or a test center. Your price, including any partner discount, locks when you schedule: rescheduling keeps it, canceling releases it.
2. Cancel or reschedule free of charge up to **1 hour** before an OnVUE exam or **48 hours** before a test-center exam; later changes, or not showing up, forfeit the fee. Canceling in time starts an automatic refund of what you paid at Pearson's checkout (7–10 business days).
3. Retakes: up to 4 attempts per rolling 12 months, with waiting periods after each failed attempt (14 / 30 / 90 days); limits apply per exam.
4. Renewal: the credential is valid 12 months; renewing on time is free — review what changed since you certified and pass a non-proctored assessment on the Partner Academy. If it lapses, the full exam fee applies again. Government-issued photo ID is required, and the name must exactly match your registration. A Japanese edition of the exam guide is published (linked under Resources).
5. **Partner Network credit:** the FAQ lists CCDV-P among the exams that count towards Claude Partner Network eligibility, with CCDV-F, CCAR-F, and CCAR-P ([CCAO-F](ccao-f-associate.md) does not).

---

## Resources

- [Official CCDV-P Exam Guide v1.0 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794947325/Claude_Certified_Developer-Professional_Exam_Guide.pdf) ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794947417/Claude_Certified_Developer-Professional_Exam_Guide_Japanese.pdf))
- [CCDV-P registration page](https://anthropic-partners.skilljar.com/claude-certified-developer-professional-certification) · [prep path](https://anthropic-partners.skilljar.com/path/claude-certified-developer-professional) · [Credly badge](https://www.credly.com/org/anthropic/badge/claude-certified-developer-professional)
- [Certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications) · [Certification policies](https://anthropic-partners.skilljar.com/page/policies-certifications)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [CCDV-F overview in this repo](ccdv-f-developer.md) — the base layer
