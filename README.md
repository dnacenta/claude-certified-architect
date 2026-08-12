# Claude Certified Architect — Foundations Study Guide

Unofficial study guide for the **Claude Certified Architect — Foundations** (CCAR-F) certification exam by Anthropic.

This guide covers all 5 exam domains with detailed explanations, code examples, anti-patterns, decision frameworks, and practice questions.

It is actively maintained and updated regularly to track changes to Anthropic's models, APIs, and Claude Code. **Last refresh: July 2026** — see the dated notes under [Resources](#resources) for what changed.

## The Claude Certification Family

Anthropic now runs **four** certifications. This repo's deep-dive guide covers CCAR-F; overview guides for the other three (sourced from the official v1.0 exam guides) live in [`certs/`](certs/):

| Code | Credential | Audience | Fee | Guide |
|---|---|---|---|---|
| CCAO-F | Associate — Foundations | Business / productivity users (non-developer) | $99 | [Overview](certs/ccao-f-associate.md) |
| **CCAR-F** | **Architect — Foundations** | **Solution architects** | **$125** | **[Full study guide](claude-certified-architect.md) — this repo's main guide** |
| CCAR-P | Architect — Professional | Senior architects owning the full solution lifecycle | $175 | [Overview](certs/ccar-p-architect-professional.md) |
| CCDV-F | Developer — Foundations | Engineers shipping Claude apps, agents, and workflows | $125 | [Overview](certs/ccdv-f-developer.md) |

All four are 120-minute proctored exams delivered via Pearson VUE, passing score 720/1,000, credentials valid 12 months (Exam Guides v1.0, effective July 2026).

## Read it online

- **Website:** https://dnacenta.github.io/claude-certified-architect/
- **PDF (English):** https://dnacenta.github.io/claude-certified-architect/guide_en.pdf

The landing page and PDF are built and deployed automatically from this repo's markdown on every push to `main` (see [`.github/workflows/pages.yml`](.github/workflows/pages.yml)). The PDF is generated from the source `.md` files, so it never drifts from the guide.

## Exam Overview

- **Format**: 60 multiple-choice, scenario-based questions in 120 minutes (proctored, closed-book)
- **Passing score**: 720/1000
- **Scenarios**: 4 of 6 randomly selected per exam
- **Delivery**: Pearson VUE (OnVUE online or test center), registered via the Anthropic Partner Academy
- **Price / validity**: $125 per attempt; certification valid 12 months (Exam Guide v1.0, effective July 2026)
- **Target audience**: Solution architects with 6+ months experience building with Claude APIs, Agent SDK, Claude Code, and MCP; access is gated to the Claude Partner Network

## Domains

| Domain | Weight | Guide |
|--------|--------|-------|
| Agentic Architecture & Orchestration | 27% | [Domain 1](domains/d1-agentic-architecture.md) |
| Tool Design & MCP Integration | 18% | [Domain 2](domains/d2-tool-design-mcp.md) |
| Claude Code Configuration & Workflows | 20% | [Domain 3](domains/d3-claude-code-config.md) |
| Prompt Engineering & Structured Output | 20% | [Domain 4](domains/d4-prompt-engineering.md) |
| Context Management & Reliability | 15% | [Domain 5](domains/d5-context-reliability.md) |

## Main Reference

See [claude-certified-architect.md](claude-certified-architect.md) for the full overview including exam scenarios, anti-patterns, decision frameworks, a 4-week study plan, and official resources.

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
- [Free CCA-F readiness diagnostic — 10 questions scored by domain](https://www.claudecertifiedarchitects.com/diagnostic/)

> **Note (2026-07):** Anthropic split its documentation. API docs are now at `platform.claude.com/docs/en/*` and Claude Code docs at `code.claude.com/docs/en/*`. The old `docs.anthropic.com/en/docs/*` URLs still redirect. The SDK has also been renamed from "Claude Code SDK" to the **Claude Agent SDK**. Current models: **`claude-fable-5`** (Anthropic's most capable widely released model), **`claude-opus-4-8`** (most capable Opus-tier), `claude-sonnet-5`, and `claude-haiku-4-5`. `claude-opus-4-7` and `claude-sonnet-4-6` are now previous-generation (still active). The code samples in this guide use `claude-opus-4-8`, still the recommended default.
>
> **Program update (2026-07):** the certification family now spans four credentials (CCAO-F, CCAR-F, CCAR-P, CCDV-F), delivered proctored via Pearson VUE and registered through the Anthropic Partner Academy. Exam Guide v1.0 (effective July 2026) sets a $125 exam fee and 12-month certification validity, superseding the launch-period "$99 / first 5,000 partner employees free" terms.

## Credits

This guide was inspired by and based on the exam breakdown by [@hooeem on X](https://x.com/hooeem/status/2033198345045336559). Full credit to them for compiling the domain coverage, scenarios, and key concepts from the official exam guide.

## License

This is an unofficial community study guide. Claude Certified Architect is a certification program by [Anthropic](https://www.anthropic.com).
