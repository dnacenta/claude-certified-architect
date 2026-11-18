# Claude Certified Architect — Professional (CCAR-P)

Overview guide for the **Claude Certified Architect — Professional** exam — the advanced tier above the Architect Foundations exam this repo covers in depth. Facts below are taken from the official Exam Guide v1.1.

> **The blueprint changes on 2026-12-07.** Exams taken on or after that date use the updated v1.1 guide ("Effective December 7, 2026"): 70 items instead of 63, and the same seven domains with new weights and rewritten objectives. This page leads with that blueprint; if you test on or before 2026-12-06, the outgoing weights (the v1.1 guide "Effective November 2026") still apply and are shown alongside. Both guides are linked under Resources.

> Preparing for Foundations first? Start with the full [CCAR-F study guide](../claude-certified-architect.md) — Anthropic's Professional blueprint assumes you operate comfortably at that level.

---

## What It Validates

That you can design, build, and deliver production-grade AI solutions on the Claude platform as an architect who owns the full lifecycle: selecting models, architectures, deployment surfaces, and API patterns; prompt and context engineering; integrating Claude into enterprise systems; and incorporating evaluation, security, compliance, and governance into designs — plus the distinctly Professional-level skill of **stakeholder communication and lifecycle management**.

**Intended for:** mid- to senior-level solution architects, AI/ML engineers, technical leads, and senior software engineers. Recommended (not required): 3+ years in systems architecture or platform engineering, 6+ months hands-on with Claude (or comparable LLM systems) in production, experience delivering end-to-end systems from discovery through operationalization.

**Not intended for:** entry-level developers, casual users, or roles limited to isolated tasks (e.g. prompt writing) without broader system-design responsibility.

---

## Exam at a Glance

| | |
|---|---|
| Exam code | CCAR-P |
| Items | From 2026-12-07: 70, of which 60 are scored and 10 are unscored (unscored items are not identified and do not affect your score); scenario-based multiple-choice, each item stating how many responses to select. Until 2026-12-06: 63 (multiple-choice and multiple-response) |
| Time limit | 120 minutes |
| Delivery | Proctored — online proctored and/or Pearson VUE test center |
| Passing score | 720 scaled (scale 100–1,000) |
| Exam fee | $175 USD |
| Validity | 12 months from award |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |
| Prerequisites | None — the CCAR-F certification is recommended, not required |

---

## Domain Blueprint

Seven domains vs Foundations' five. The Foundations themes reappear at higher altitude, alongside areas that are effectively new: retrieval-heavy Integration, deployment-surface selection, and Stakeholder Communication and Lifecycle Management. From 2026-12-07 the last of those halves in weight (14% to 7%), with the difference spread across Integration, Governance, Solution Design, Evaluation, and Developer Productivity.

| # | Domain | Weight from 2026-12-07 | Weight until 2026-12-06 |
|---|--------|--------|--------|
| 1 | Solution Design and Architecture | 18% | 17% |
| 2 | Claude Models, Prompting, and Context Engineering | 13% | 13% |
| 3 | Integration | 21% | 19% |
| 4 | Evaluation, Testing, and Optimization | 17% | 16% |
| 5 | Governance, Safety, and Risk Management | 16% | 14% |
| 6 | Stakeholder Communication and Lifecycle Management | 7% | 14% |
| 7 | Developer Productivity and Operational Enablement | 8% | 7% |

The domains themselves are unchanged (the outgoing guide writes the names with "&").

### Key objectives per domain

Objectives below follow the December 7 guide (weights in parentheses are the new ones).

1. **Solution Design and Architecture (18%)** — deciding what to delegate to Claude, retain for humans, or handle collaboratively (reversibility, stakes, accountability); evaluating end-to-end architectures (input → processing → output → feedback) and finding the component that fails first; choosing among workflow, agentic, augmented-LLM, and Skills-based patterns; orchestrator/subagent decomposition; value-based decisions under a cost or SLA ceiling; selecting a deployment surface (Anthropic API, Amazon Bedrock, Google Vertex AI, Microsoft Foundry) and an agent runtime (Messages API loop, self-hosted Agent SDK or headless Claude Code, Claude Managed Agents).
2. **Claude Models, Prompting, and Context Engineering (13%)** — model-tier selection under binding latency, cost, and quality constraints; system-prompt diagnosis and revision; prompting technique selection (zero-shot, few-shot, prompted reasoning vs native thinking, structured output); context composition and token economics; cache breakpoints and modular or Skill-based packaging; reasoning effort and context lifecycle (context editing, memory tool, compaction).
3. **Integration (21%)** — the heaviest domain: least-privilege tool configuration, authn/authz posture, relieving the binding accuracy or latency constraint, instrumentation and monitoring gaps, **retrieval architecture selection** (pre-built RAG pipeline vs agentic search with tools vs full-corpus context, plus contextual-retrieval and fallback configuration), choosing connection mechanisms (MCP vs direct API/CLI vs agent-to-agent handoff), progressive discovery vs monolithic context loading, and production reliability controls (rate-limit handling, retry and backoff, idempotency for side-effecting tools, fallback routing).
4. **Evaluation, Testing, and Optimization (17%)** — evaluation coverage gaps (accuracy, groundedness, latency, cost, safety, security), deriving evaluations from business processes, LLM-as-judge design and bias (position, verbosity, self-preference, judge drift), experimental design for comparing configurations, root-cause isolation from logs and traces, cost and latency optimization from telemetry, and model version migration (pin, re-tune, re-baseline, or defer).
5. **Governance, Safety, and Risk Management (16%)** — guardrail placement, prompt-injection surface and controls (retrieved documents, tool results, MCP server responses, third-party Skills), risk assessment and ranking, human-in-the-loop checkpoints for irreversible or high-stakes actions, architectural controls for compliance obligations (data residency, retention and zero-data-retention, PII redaction, audit logging, tenant isolation), and bias source identification and mitigation.
6. **Stakeholder Communication and Lifecycle Management (7%)** — spotting commitments in discovery notes or a draft SLA that the architecture cannot meet, reviewing architecture decision records so trade-offs and residual risk are explicit, and checking operational handoff packages for missing assumptions, dependencies, or runbook elements. This domain does not exist on CCAR-F.
7. **Developer Productivity and Operational Enablement (8%)** — packaging and distributing Claude Code workflows across an organization (plugins, marketplace, managed settings), configuring the Claude Agent SDK or Claude Code (permission modes, hooks, subagent definitions, headless or CI operation), and preserving human accountability for AI-generated code.

Until 2026-12-06 the outgoing objectives cover the same ground with a different emphasis: domain 6 carries twice the weight (structured discovery and requirements gathering, communicating decisions and trade-offs, architecture documentation, lifecycle phases), domain 3 centers on RAG pipeline design (chunking, indexing, retrieval), and domain 5 names regulatory regimes (GDPR, HIPAA, FedRAMP).

### Sample-question flavor (from the official guide)

The published samples for the December 7 blueprint test deployment-surface selection under a data-residency constraint (the binding constraint decides, and you accept feature lag and ownership of the agent runtime), retry safety (an idempotency key for a side-effecting payments tool, rather than tuning timeouts or prompting), and human-in-the-loop gate placement (gate the irreversible billing change, not every tool call). Expect judgment-under-tradeoffs questions, not recall.

---

## Relationship to CCAR-F and This Repo

- The official guide treats the scope of CCAR-F as assumed knowledge for this exam — the [existing deep-dives](../claude-certified-architect.md) remain the right base layer.
- Study the deltas on top: **retrieval architecture** (RAG pipeline vs agentic search vs full-corpus context), **regulated-industry compliance controls**, and **stakeholder communication / lifecycle management** — none of which the Foundations guide covers today — plus deployment surfaces and agent runtimes, evaluation design (LLM-as-judge bias, experimental design), and model version migration.
- Anthropic recommends, but does not require, holding CCAR-F first.
- On the developer track, the equivalent tier is [Developer — Professional (CCDV-P)](ccdv-p-developer-professional.md).

---

## How to Prepare (per the official guide)

- Study the blueprint and self-assess against each objective
- Review the CCAR-F exam guide — its scope is assumed knowledge
- Review official documentation for the Claude Developer Platform, Agent Skills, Claude Code and the Claude Agent SDK, Claude Managed Agents, and MCP, plus the feature-availability and data-handling differences across the Anthropic API, Amazon Bedrock, Google Vertex AI, and Microsoft Foundry
- Design and deliver at least one end-to-end Claude solution in production: model and deployment-surface selection, retrieval or tool integration, an evaluation suite, observability, and layered guardrails
- Practice reviewing artifacts produced by others — architecture diagrams, configuration files, logs and traces, evaluation results, code — since exam scenarios present such artifacts and expect you to reason from them

---

## Registration and Policies

1. Register from the exam's page on the **Anthropic Partner Academy**: confirm your exam and exam profile, then continue to **Pearson VUE**. Since 2026-11-12, sign-in to Pearson is by single sign-on (SSO) from the Partner Academy (direct sign-in on Pearson's site is no longer available) and you pay at **Pearson's checkout** when you schedule — online proctoring (OnVUE) or a test center. Your price, including any partner discount, locks when you schedule: rescheduling keeps it, canceling releases it.
2. Cancel or reschedule free of charge up to **1 hour** before an OnVUE exam or **48 hours** before a test-center exam; later changes, or not showing up, forfeit the fee. Canceling in time starts an automatic refund of what you paid at Pearson's checkout (7–10 business days). If you paid through the Partner Academy before 2026-11-12, Anthropic refunds you after you cancel, which can take a few extra days.
3. Retakes: up to 4 attempts per rolling 12 months, with waiting periods after each failed attempt (14 / 30 / 90 days), per Pearson VUE program policy. Limits apply per exam; the policies page adds that the waiting period and the attempt count reset when an exam moves to a new version.
4. Renewal: the credential is valid 12 months; renewing on time is free — review what changed since you certified and pass a non-proctored, open-book assessment (retakes allowed; the new 12 months run from your current expiry). If it lapses, the full exam fee applies again. Registration requires a partner-domain email address. Delivery moved to Pearson VUE and digital badging to Credly on 2026-06-30; candidates must be at least 18. Partner-tier discounts apply automatically at Pearson's checkout — 50% for Select, Preferred, and Global Premier partners, 100% for Global Premier partners through 2026-12-31. The FAQ lists the exam and its prep content in English and Japanese (one registration; you pick the language when scheduling), and Japanese editions of both v1.1 exam guides are published (linked under Resources).

---

## Resources

- [Official CCAR-P Exam Guide v1.1, effective December 7, 2026 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946420/Claude_Certified_Architect_-_Professional_Exam_Guide_Updated_Dec_7.pdf) — use this if you test on or after 2026-12-07 ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946484/Claude_Certified_Architect_-_Professional_Exam_Guide_Updated_Dec_7_Japanese.pdf))
- [Official CCAR-P Exam Guide v1.1, effective November 2026 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946331/Claude_Certified_Architect_-_Professional_Exam_Guide.pdf) — the blueprint in force until 2026-12-06 ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946377/Claude_Certified_Architect_-_Professional_Exam_Guide_Japanese.pdf))
- [Certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications) · [Certification policies](https://anthropic-partners.skilljar.com/page/policies-certifications) · [Pearson SSO and checkout guide (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794424056/Claude_certifications-Pearson_SSO_and_checkout.pdf)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [CCAR-F study guide in this repo](../claude-certified-architect.md) — the base layer
- [CCDV-P overview in this repo](ccdv-p-developer-professional.md) — the Professional tier of the developer track
