# Claude Certified Architect — Professional (CCAR-P)

Overview guide for the **Claude Certified Architect — Professional** exam — the advanced tier above the Architect Foundations exam this repo covers in depth. Facts below are taken from the official Exam Guide v1.0 (effective July 2026).

> Preparing for Foundations first? Start with the full [CCAR-F study guide](../claude-certified-architect.md) — Anthropic's Professional blueprint assumes you operate comfortably at that level.

---

## What It Validates

That you can design, build, and deliver production-grade AI solutions on the Claude platform as an architect who owns the full lifecycle: selecting models, architectures, and API patterns; prompt and context engineering; integrating Claude into enterprise systems; and incorporating evaluation, security, compliance, and governance into designs — plus the distinctly Professional-level skill of **stakeholder communication and lifecycle management**.

**Intended for:** mid- to senior-level solution architects, AI/ML engineers, and technical leads. Recommended (not required): 3+ years in systems architecture or platform engineering, 6+ months hands-on with Claude (or comparable LLM systems) in production, experience delivering end-to-end systems from discovery through operationalization.

**Not intended for:** entry-level developers, casual users, or roles limited to isolated tasks (e.g. prompt writing) without broader system-design responsibility.

---

## Exam at a Glance

| | |
|---|---|
| Exam code | CCAR-P |
| Items | 63 (multiple-choice and multiple-response; each item states how many responses to select) |
| Time limit | 120 minutes |
| Delivery | Proctored — online proctored and/or Pearson VUE test center |
| Passing score | 720 scaled (scale 100–1,000) |
| Exam fee | $175 USD |
| Validity | 12 months from award |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |
| Prerequisites | None mandatory — recommended experience only |

---

## Domain Blueprint

Seven domains vs Foundations' five. The Foundations themes reappear at higher altitude, and two areas are effectively new: RAG-heavy Integration, and Stakeholder Communication & Lifecycle Management.

| # | Domain | Weight |
|---|--------|--------|
| 1 | Solution Design & Architecture | 17% |
| 2 | Claude Models, Prompting & Context Engineering | 13% |
| 3 | Integration | 19% |
| 4 | Evaluation, Testing & Optimization | 16% |
| 5 | Governance, Safety & Risk Management | 14% |
| 6 | Stakeholder Communication & Lifecycle Management | 14% |
| 7 | Developer Productivity & Operational Enablement | 7% |

### Key objectives per domain

1. **Solution Design & Architecture (17%)** — translating business problems into Claude-based solutions; end-to-end architectures (input → processing → output → feedback loops); choosing among workflow, agentic, and augmented-LLM patterns; multi-agent systems and orchestration; decomposition; aligning to business value pillars (efficiency, cost, performance SLAs).
2. **Claude Models, Prompting & Context Engineering (13%)** — model selection by trade-off; system prompts, templates, guardrails; zero-shot/few-shot/chain-of-thought; context-window and token optimization; prompt reuse (caching, modular prompts, Skills).
3. **Integration (19%)** — the heaviest domain: tool/agent capability-bloat evaluation, authn/authz gap analysis, accuracy-latency trade-offs, observability at scale, **RAG pipeline design** (chunking, indexing, retrieval matched to data shape and query pattern), choosing integration mechanisms (MCP vs API/CLI vs agent-to-agent), progressive-discovery vs monolithic context strategy.
4. **Evaluation, Testing & Optimization (16%)** — evaluation metrics (accuracy, latency, cost, safety, security), eval datasets and test frameworks, A/B testing, diagnosing prompt failure/hallucination/model mismatch, token/latency/cost optimization, logging and observability.
5. **Governance, Safety & Risk Management (14%)** — guardrails and safety controls, LLM failure modes, human-in-the-loop validation, regulatory compliance (GDPR, HIPAA, FedRAMP), ethical AI (bias, fairness, transparency).
6. **Stakeholder Communication & Lifecycle Management (14%)** — structured discovery and requirements gathering, communicating architectural decisions and trade-offs, feedback loops and expectation/SLA alignment, architecture documentation, supporting lifecycle phases (discovery, design, handoff, monitoring, iteration). This domain does not exist on CCAR-F.
7. **Developer Productivity & Operational Enablement (7%)** — configuring Claude tooling for teams (e.g. Claude Code), improving developer workflows with AI-assisted tooling, supporting debugging and operational issues.

### Sample-question flavor (from the official guide)

The published samples test least-privilege tool configuration (remove unneeded refund/delete tools rather than log or confirm), prompt-caching architecture (stable prefix first + caching to cut latency *and* cost), and RAG debugging (confident-but-wrong answers after a document refresh → suspect retrieval/indexing first). Expect judgment-under-tradeoffs questions, not recall.

---

## Relationship to CCAR-F and This Repo

- All five CCAR-F domains reappear inside CCAR-P domains 1–5 — the [existing deep-dives](../claude-certified-architect.md) remain the right base layer.
- Study the deltas on top: **RAG architecture** (chunking/indexing/retrieval strategy), **evaluation frameworks and A/B testing**, **regulated-industry compliance**, and **stakeholder communication / lifecycle management** — none of which the Foundations guide covers today.
- Anthropic recommends sitting CCAR-F first unless you already have deep, current production experience.

---

## How to Prepare (per the official guide)

- Study the blueprint and self-assess against each objective
- Review official documentation for the Claude API, models, prompt engineering, MCP, and Skills
- Build and operate at least one end-to-end Claude solution including RAG, evaluation, and observability
- Practice architectural decision-making: model selection, integration protocols, security trade-offs

---

## Registration and Policies

1. Register via the exam's page on the **Anthropic Partner Academy** (partner-tier discounts apply at checkout), then schedule through **Pearson VUE** — online proctoring or a test center.
2. Cancel/reschedule up to 24 hours before the appointment; changes within 24 hours forfeit the fee.
3. Retakes: up to 4 attempts per rolling 12 months, with waiting periods after each failed attempt (14 / 30 / 90 days), per Pearson VUE program policy.

---

## Resources

- [Official CCAR-P Exam Guide (PDF, v1.0)](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1783542810/Claude+Certified+Architect+%E2%80%93+Professional+Exam+Guide.pdf)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [CCAR-F study guide in this repo](../claude-certified-architect.md) — the base layer
