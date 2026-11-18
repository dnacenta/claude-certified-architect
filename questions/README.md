# Question bank

Original practice questions for the CCAR-F exam, one YAML file per domain: `d1.yaml` … `d5.yaml`.
They follow the real exam's format: scenario-based items, multiple-choice (one answer from four)
and multiple-response (two answers from five; the stem says "Choose two."). Every question tests one
section of the guide and its explanation stands on that section.

The bank is separate from the practice questions at the end of each domain file, which stay as they
are. Nothing here is taken from Anthropic's official exam guide or its sample questions.

## File shape

```yaml
domain: 1
questions:
  - id: "d1-001"               # unique, never reused or renumbered, even when a question is deleted
    task: "1.3"                # the guide section the question tests (## N.M)
    scenario: 3                # 1–6, the exam scenario it sits in (below)
    stem: "A coordinator agent hands a billing dispute to a subagent. …"
    options:                   # 4 for one answer; 5 for "Choose two."
      - "…"
      - "…"
      - "…"
      - "…"
    correct: [B]               # letters by position in `options`; two letters for "Choose two."
    explanation: "…"           # why the answer is right, naming options by what they say, never by letter
    why_not:                   # optional: rebuttals for the most tempting wrong options, keyed by letter
      C: "…"
    source: "1.3"              # the section the explanation relies on (usually the same as task)
    verified: "2026-11-18"     # the day the content check last passed this question
```

Quote every string. Inline markdown works in `stem`, `options`, `explanation` and `why_not`:
`` `code` ``, `**bold**`, `*italic*`. The YAML guard in `scripts/build-deck.mjs` covers these files too:
YAML 1.1 and 1.2 must read them the same.

## Scenarios

The exam draws 4 of these 6 at random and asks every question inside one of them:

1. Customer Support Resolution Agent
2. Code Generation with Claude Code
3. Multi-Agent Research System
4. Developer Productivity with Claude
5. Claude Code for CI/CD
6. Structured Data Extraction

## Writing questions

- **One idea per question**, from the section named in `task`. Every fact must come from the guide's
  markdown. Prefer facts that stay true; leave out version numbers, prices and dates unless the
  question is about them.
- **The stem sets a scene** inside its scenario in one to three sentences, then asks one clear
  question. Ask for the best action, the cause, or the right design, the way the exam does.
- **Distractors are plausible**: the anti-patterns the guide warns about, half-right ideas, and
  real features used in the wrong place. Each must be wrong for a reason the guide states. No "all of
  the above", "none of the above", or jokes.
- **No tells**: options of similar length and shape; the right one isn't the longest or the only
  hedged one; no option repeats words from the stem that the others lack.
- **Answers spread across positions**: within a file, single-answer questions put the right
  answer on A, B, C and D about equally (within two of each other); "Choose two." pairs vary too.
- **Explanations** say in one to three sentences why the answer is right, naming options by what
  they say ("Passing the facts in the subagent's prompt…"), never by letter, because apps shuffle them.
  A `why_not` answers the one or two distractors a good candidate might pick.
- About one question in five is "Choose two.", with exactly two right options out of five.
- American spelling. Code identifiers in backticks.

## Size

Each domain's share follows its exam weight, at least one and a half times what one 60-question
mock exam takes from it:

| File | Domain | Weight | Mock exam takes | Questions | Most in one scenario |
|---|---|---|---|---|---|
| `d1.yaml` | Agentic Architecture & Orchestration | 27% | 16 | 40 | 12 |
| `d2.yaml` | Tool Design & MCP Integration | 18% | 11 | 27 | 8 |
| `d3.yaml` | Claude Code Configuration & Workflows | 20% | 12 | 30 | 9 |
| `d4.yaml` | Prompt Engineering & Structured Output | 20% | 12 | 30 | 9 |
| `d5.yaml` | Context Management & Reliability | 15% | 9 | 23 | 7 |

The last column keeps any four scenarios drawn able to fill a mock exam: the two left out can never
hold more than a domain's questions minus its mock share.

## Keeping it current

A refresh that changes a fact in a domain file must check the questions whose `source` is that
section, and update `verified` when they still hold.
