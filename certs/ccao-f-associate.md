# Claude Certified Associate — Foundations (CCAO-F)

Overview guide for the **Claude Certified Associate — Foundations** exam — the entry-level, non-developer credential in the Claude certification family. Facts below are taken from the official Exam Guide v1.1.

> **The blueprint changes on 2026-12-07.** Exams taken on or after that date use the updated v1.1 guide ("Effective December 7, 2026"): 70 items instead of 60, and six rebalanced domains instead of seven. This page leads with that blueprint; if you test on or before 2026-12-06, the outgoing one (the v1.1 guide "Effective November 2026") still applies and is summarized under [Until 2026-12-06](#until-2026-12-06). Both guides are linked under Resources.

> Looking for the Architect exam? The full deep-dive study guide in this repo covers [CCAR-F](../claude-certified-architect.md). This page is an overview of a sibling certification.

---

## What It Validates

That you can use Claude effectively as a core productivity tool within a business role: translating business objectives into well-specified Claude interactions, critically evaluating and adapting outputs before use, selecting the right capability, model, and context strategy for a task, designing and maintaining repeatable Claude-supported workflows for yourself and your team, and applying data-sensitivity, governance, and responsible-use judgment in daily work.

**Intended for:** professionals who use Claude as a core productivity tool and build Claude Projects in their day-to-day roles — business analysts, project managers, and operations leads; marketing, communications, HR, and education professionals; consultants and team leads supporting AI adoption; and general knowledge workers. Candidates work regularly in claude.ai (chat, Projects, Artifacts, research, code-executed analysis, Skills, connectors, memory controls) and go beyond basic question-and-answer use.

**Not intended for:** software developers building against APIs or designing agentic systems — that scope belongs to the Developer and Architect credentials.

---

## Exam at a Glance

| | |
|---|---|
| Exam code | CCAO-F |
| Items | From 2026-12-07: 70, of which 60 are scored and 10 are unscored (unscored items are not identified and do not affect your score); scenario-based multiple-choice, each item stating how many responses to select. Until 2026-12-06: 60 (multiple-choice and multiple-response) |
| Time limit | 120 minutes |
| Delivery | Proctored — online proctored and/or Pearson VUE test center |
| Passing score | 720 scaled (scale 100–1,000) |
| Exam fee | $99 USD |
| Validity | 12 months from award |
| Result reporting | Pass/fail with scaled score, plus percent-correct by domain |
| Prerequisites | None — regular, hands-on experience using Claude in a professional setting is recommended, not required |

---

## Domain Blueprint

From 2026-12-07:

| # | Domain | Weight |
|---|--------|--------|
| 1 | Task Definition and Prompting | 15% |
| 2 | Output Evaluation and Quality Control | 20% |
| 3 | Capability, Model, and Context Selection | 15% |
| 4 | Workflow Design and Integration | 18% |
| 5 | Configuration and Knowledge Management | 15% |
| 6 | Responsible Use, Data Protection, and Governance | 17% |

Note the emphasis: output evaluation (20%), workflow design (18%), and responsible use (17%) together make up more than half the exam — this credential tests **judgment about using AI responsibly**, more than prompting technique. Items assess judgment in work scenarios; the guide says they do not require recall of published figures such as pricing, context-window sizes, or rate limits.

### Key objectives per domain

1. **Task Definition and Prompting** — constructing prompts from a business objective, audience, constraints, and source material (role, context, task, output format, and the context Claude lacks by default); decomposing and sequencing large deliverables with validation checkpoints; diagnosing an underperforming prompt as a specification gap and judging when to iterate, restart, or change approach.
2. **Output Evaluation and Quality Control** — evaluating accuracy, completeness, relevance, and fitness for purpose; detecting unsupported content (fabricated citations, confident invented specifics, inconsistencies, bias) and verifying before use; setting review depth and escalation by consequence of error; adapting outputs and choosing formats (inline, artifacts, structured data, code-executed results for exact computation, Skill-produced documents).
3. **Capability, Model, and Context Selection** — choosing among chat, Projects, Artifacts, research, code-executed analysis, Skills, connectors, and memory; matching model tier and effort level to quality, speed, and cost; managing context and memory across long or multi-session work (restart, summarize, persist to a Project, rely on memory, incognito chats).
4. **Workflow Design and Integration** — applying Claude across a research, analysis, or planning deliverable end to end; deciding which workflow steps are AI-executed, human-retained, or human-reviewed (reversibility, stakes, need for human judgment, accountability) and recognizing over-delegation; designing repeatable workflows that can be handed off; communicating what Claude can and cannot reliably do to stakeholders.
5. **Configuration and Knowledge Management** — configuring Projects (instructions, knowledge sources, Skills, scoped memory); managing connectors and knowledge (e.g. Google Drive, Gmail; upload-versus-connector trade-offs; keeping knowledge current); designing persistent instructions; attributing degraded output to the responsible configuration layer and restoring it.
6. **Responsible Use, Data Protection, and Governance** — classifying a use case as appropriate, appropriate with safeguards, or inappropriate (including trust in third-party Skills and connectors and the Anthropic Usage Policy); protecting sensitive data (classification, redaction and anonymization, upload judgment, memory and incognito controls); analyzing usage against organizational AI policy, ethics, and diligence.

Troubleshooting no longer has a domain of its own: prompt diagnosis sits in domain 1 and configuration degradation in domain 5.

### Sample-question flavor (from the official guide)

The published samples for the December 7 blueprint test verifying cited figures and quotations against sources before a brief goes to a client (rather than asking Claude to confirm its own output), tracing degraded Project output to stale knowledge and cross-client memory rather than rewriting unchanged instructions, and de-identifying confidential HR data *before* upload (incognito chats and restricted Projects do not change what is disclosed).

### Until 2026-12-06

The outgoing blueprint has seven domains and 60 items:

| # | Domain | Weight |
|---|--------|--------|
| 1 | Prompting and Task Execution | 14% |
| 2 | Output Evaluation and Validation | 21% |
| 3 | Product and Model Selection | 12% |
| 4 | Workflow Integration and Solution Design | 16% |
| 5 | Configuration and Knowledge Management | 12% |
| 6 | Governance, Risk, and Responsible Use | 15% |
| 7 | Troubleshooting and Optimization | 10% |

The themes are the same as above; the seventh domain covers diagnosing underperforming prompts and poor outputs, adjusting based on feedback, and optimizing workflows.

---

## How to Prepare (per the official guide)

- Study the blueprint and self-assess against each objective
- Review Anthropic's AI Fluency Framework and its four competencies — Delegation, Description, Discernment, and Diligence — which underpin objectives in every domain
- Review official documentation and help-center guidance for claude.ai: prompting, Projects, Artifacts, Skills, research, code-executed analysis, connectors, memory and incognito chats, and the Anthropic Usage Policy
- Build a real workflow: configure a Project with instructions, knowledge sources, and a Skill for a recurring task; connect a workplace data source; review, edit, and delete memories
- Practice the judgment calls: why a prompt produced a generic output, verifying claims and citations before use, which workflow steps a person must retain, and preparing a sensitive dataset for analysis in line with organizational policy

Much of this repo's [Domain 4 (explicit criteria, few-shot)](../domains/d4-prompt-engineering.md) and [Domain 5 (context management, escalation, provenance)](../domains/d5-context-reliability.md) material transfers directly — at a less technical depth.

---

## Registration and Policies

1. Register from the exam's page on the **Anthropic Partner Academy**: confirm your exam and exam profile, then continue to **Pearson VUE**. Since 2026-11-12, sign-in to Pearson is by single sign-on (SSO) from the Partner Academy (direct sign-in on Pearson's site is no longer available) and you pay at **Pearson's checkout** when you schedule — online proctoring (OnVUE) or a test center. Your price, including any partner discount, locks when you schedule: rescheduling keeps it, canceling releases it.
2. Cancel or reschedule free of charge up to **1 hour** before an OnVUE exam or **48 hours** before a test-center exam; later changes, or not showing up, forfeit the fee. Canceling in time starts an automatic refund of what you paid at Pearson's checkout (7–10 business days). If you paid through the Partner Academy before 2026-11-12, Anthropic refunds you after you cancel, which can take a few extra days.
3. Retakes: up to 4 attempts per rolling 12 months, with waiting periods after each failed attempt (14 / 30 / 90 days), per Pearson VUE program policy. Limits apply per exam; the policies page adds that the waiting period and the attempt count reset when an exam moves to a new version.
4. Government-issued photo ID required; the name must exactly match your registration.
5. Renewal: the credential is valid 12 months; renewing on time is free — review what changed since you certified and pass a non-proctored, open-book assessment (retakes allowed; the new 12 months run from your current expiry). If it lapses, the full exam fee applies again. Registration requires a partner-domain email address. Delivery moved to Pearson VUE and digital badging to Credly on 2026-06-30; candidates must be at least 18. Partner-tier discounts apply automatically at Pearson's checkout — 50% for Select, Preferred, and Global Premier partners, 100% for Global Premier partners through 2026-12-31. The FAQ lists the exam and its prep content in English and Japanese (one registration; you pick the language when scheduling), and Japanese editions of both v1.1 exam guides are published (linked under Resources).
6. **Partner Network credit:** CCAO-F does **not** count towards Claude Partner Network tier eligibility — only [CCDV-F](ccdv-f-developer.md), [CCDV-P](ccdv-p-developer-professional.md), CCAR-F, and [CCAR-P](ccar-p-architect-professional.md) do.

---

## Resources

- [Official CCAO-F Exam Guide v1.1, effective December 7, 2026 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946609/Claude_Certified_Associate_-_Foundations_Exam_Guide_Updated_Dec_7.pdf) — use this if you test on or after 2026-12-07 ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946680/Claude_Certified_Associate_-_Foundations_Exam_Guide_Updated_Dec_7_Japanese.pdf))
- [Official CCAO-F Exam Guide v1.1, effective November 2026 (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946524/Claude_Certified_Associate_-_Foundations_Exam_Guide.pdf) — the blueprint in force until 2026-12-06 ([Japanese](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946560/Claude_Certified_Associate_-_Foundations_Exam_Guide_Japanese.pdf))
- [Certification FAQ](https://anthropic-partners.skilljar.com/page/faq-certifications) · [Certification policies](https://anthropic-partners.skilljar.com/page/policies-certifications) · [Pearson SSO and checkout guide (PDF)](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794424056/Claude_certifications-Pearson_SSO_and_checkout.pdf)
- [Pearson VUE — Anthropic certification program](https://www.pearsonvue.com/us/en/anthropic.html)
- [Anthropic Skilljar courses](https://anthropic.skilljar.com/)
