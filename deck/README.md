# The field guide deck

The deck is the visual edition of this guide: 16:9 slides in the Field Guide style, built from the
YAML files in this folder by `scripts/build-deck.mjs`. CI publishes it as `deck_en.pdf` and as a
viewer at `/deck/` on the website. The full text stays in the markdown files, the website and
`guide_en.pdf`.

```sh
npm ci
npx playwright-core install --only-shell chromium   # once: the headless Chrome for --check and PDFs
node scripts/build-deck.mjs --check              # build + report slides whose content overflows
node scripts/build-deck.mjs --check deck/01-d1.yaml   # just one file
node scripts/build-deck.mjs --pdf                # also write _site/deck_en.pdf
```

The full-text PDF comes from `scripts/build-pdf.mjs`, and the diagrams from
`scripts/make-diagrams.py` (see its docstring).

Files are read in name order: `00-intro.yaml`, `01-d1.yaml` … `05-d5.yaml`, `99-close.yaml`.

## Keeping it current

The deck restates the guide, so a refresh that changes a fact in the markdown must change the
slide that shows it. Some facts are never written here and stay current on their own:

- domain titles and weights come from each domain file's `# Domain N: Title (NN%)` heading
- practice questions and answers come from each domain file's "Practice Questions" section
- the model lineup and the certification family come from the README tables
- the last-refresh date comes from the README's "Last refresh" line

Prefer stable facts on slides. Leave out version numbers, prices and dates unless the slide is
about them.

## File shape

```yaml
label: Domain 1          # footer label
domain: 1                # links divider, quiz and cheatsheet to domains/d1-*.md
sections:                # optional: names that complete a slide's eyebrow from its ref
  "1.1": The agentic loop
slides:
  - type: concept
    ref: "1.1"           # eyebrow becomes "1.1 · The agentic loop" unless `eyebrow` is set
    title: "The loop ends on `stop_reason`, never on text."
    points: [...]
```

Text fields take inline markdown: `` `code` ``, `**bold**`, `*italic*`. Quote any YAML string
that contains `: `, starts with a backtick, quote or `*`, or begins with `-`.

## Slide types

| type | fields | use for |
|---|---|---|
| `cover` | `copy`? | the first slide |
| `glance` | `eyebrow`, `title`, `stats: [{value, unit?, label}]` (4), `note`? | big-number facts |
| `domains` | `eyebrow`, `title`, `lead`?, `blurbs: {1: text, …}`? | the five weighted domains |
| `divider` | `eyebrow`?, `blurb`, `chips: [text]` | the first slide of a domain |
| `concept` | `ref`, `title`, `points` (≤ 4), `diagram`?, `note`? | one idea; with a diagram it sits on the right |
| `diagram` | `ref`, `title`, `diagram`, `caption`? | a diagram that needs the whole slide |
| `rightwrong` | `ref`, `title`, `right: {title, points, note?, label?}`, `wrong: [{title, text}]` (2–3) | the exam's traps vs the right pattern |
| `compare` | `ref`, `title`, `columns: [{tag?, title, points?, text?, tone?}]` (2–3) | side-by-side choices |
| `cards` | `ref`/`eyebrow`, `title`, `lead`?, `columns`?, `cards: [{tag?, title?, text?, points?, tone?}]`, `note`? | grids: scenarios, lists of options |
| `table` | `ref`, `title`, `head`, `rows` (≤ 6), `highlight: [row numbers]`?, `note`? | short reference tables |
| `code` | `ref`, `title`, `lang`, `code` (≤ 14 lines), `notes` (≤ 4) | shapes the exam tests |
| `timeline` | `eyebrow`, `title`, `steps: [{tag, title, text?/points?}]` | the study plan |
| `quiz` | `why_not: {<question n>: {letter, text}}`? | expands to question + answer slides for every practice question |
| `cheatsheet` | `cells: [{title, text, ref?}]` (7), `most_tested`? | the last slide of a domain |
| `lineup` | `eyebrow`?, `title`?, `note`? | model table from the README |
| `family` | `eyebrow`?, `title`?, `lead`?, `note`? | certification cards from the README |
| `closing` | `eyebrow`?, `title`?, `lead`? | the last slide |

`tone` is `gold` (the key item), `moss` (right), `rust` (wrong), or empty.

`diagram` names a file pair in `docs/diagrams/` (`<id>-dark.svg` is used here, `<id>-light.svg`
in the light PDF). Available: `agentic-loop`, `hub-and-spoke`, `refinement-loop`,
`adaptive-decomposition`, `mcp-architecture`, `claude-md-hierarchy`, `explore-subagent`,
`independent-review`, `sentiment-vs-complexity`, `error-recovery`, `accuracy-breakdown`.

## Writing slides

- One idea per slide. The title states the takeaway as a sentence, not a topic.
- Points: four at most, about 18 words each. Card text: about 25 words.
- Every fact comes from the guide's markdown. American spelling.
- Run `--check` until it reports 0 overflowing slides.
