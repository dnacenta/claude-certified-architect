// Builds the field guide deck from deck/*.yaml: the /deck/ viewer, a print page, and with --pdf
// the 16:9 PDF. Slide types and their fields are documented in deck/README.md.
//
// usage: node scripts/build-deck.mjs [--pdf] [--check] [--out=<dir>] [deck/<file>.yaml ...]
//   --pdf    also write _site/deck_en.pdf
//   --out    write into <dir> instead of _site/
//   --check  render in headless Chrome and report slides whose content overflows (exit 1 if any)
//   files    limit the build to these deck files (default: every deck/*.yaml, in name order)

import { access, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outArg = process.argv.find((a) => a.startsWith("--out="));
const OUT = outArg ? path.resolve(outArg.slice(6)) : path.join(ROOT, "_site");
const DECK_OUT = path.join(OUT, "deck");
const SITE = "https://dnacenta.github.io/claude-certified-architect/";
const BRAND = "CCAR-F field guide deck";

const md = new MarkdownIt({ html: false });
const il = (s) => md.renderInline(String(s ?? "")).trim();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const exists = (p) => access(p).then(() => true, () => false);

// ---- Facts read from the guide itself, so the deck never restates what can drift ----

async function domainInfo() {
  const files = (await readdir(path.join(ROOT, "domains"))).filter((f) => /^d\d-.*\.md$/.test(f)).sort();
  const info = {};
  for (const f of files) {
    const src = await readFile(path.join(ROOT, "domains", f), "utf8");
    const [, n, title, weight] = src.match(/^# Domain (\d): (.+) \((\d+)%\)$/m);
    info[n] = { n: +n, title, weight: +weight, file: f, questions: practice(src) };
  }
  return info;
}

/** The domain file's practice questions: stem, options, answer letter, explanation. */
function practice(src) {
  const section = src.split(/^## Domain \d Practice Questions$/m)[1] ?? "";
  const re = /^\*\*Q(\d+):\*\*\s*([\s\S]+?)\n((?:- [A-D]\) .+\n)+)\s*\n\*\*Answer: ([A-D])\*\*\s*—\s*(.+)$/gm;
  return [...section.matchAll(re)].map((m) => ({
    n: +m[1],
    stem: m[2].trim(),
    options: m[3].trim().split("\n").map((l) => ({ letter: l[2], text: l.slice(5).trim() })),
    answer: m[4],
    why: m[5].trim(),
  }));
}

function tableAfter(src, heading) {
  const rest = src.split(heading)[1] ?? "";
  const lines = rest.split("\n");
  const start = lines.findIndex((l) => l.startsWith("|"));
  const rows = [];
  for (let i = start; i >= 0 && i < lines.length && lines[i].startsWith("|"); i++) rows.push(lines[i]);
  const cells = (l) => l.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim());
  return { lead: lines.slice(0, start).join("\n").trim().split("\n\n")[0], head: cells(rows[0] ?? "||"), rows: rows.slice(2).map(cells) };
}

async function readmeFacts() {
  const src = await readFile(path.join(ROOT, "README.md"), "utf8");
  return {
    lastRefresh: src.match(/Last refresh: ([^*\n]+?)\*\*/)?.[1] ?? "",
    lineup: tableAfter(src, "## Model Lineup Used in This Guide"),
    family: tableAfter(src, "## The Claude Certification Family"),
  };
}

// ---- Pieces ----

function ring(size, stroke, pct, big, sub, fontSize) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<span class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#33332c" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#c9a554" stroke-width="${stroke}" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><span class="rl" style="font-size:${fontSize}px">${big}${sub ? `<span class="rs">${sub}</span>` : ""}</span></span>`;
}

const ICON_OK = `<span class="icon icon-ok"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>`;
const ICON_NO = `<span class="icon icon-no"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg></span>`;
const MARK = `<svg viewBox="0 0 480 480" width="440" height="440" fill="none" stroke-linecap="round" aria-hidden="true"><path d="M240 336 C 220 380, 170 402, 110 430" stroke="#685742" stroke-width="2"/><path d="M240 336 C 262 382, 320 404, 384 438" stroke="#685742" stroke-width="2"/><path d="M196 330 C 176 360, 120 362, 58 374" stroke="#685742" stroke-width="1.4"/><path d="M286 330 C 310 356, 372 354, 430 368" stroke="#685742" stroke-width="1.4"/><path d="M182 172 C 150 142, 118 122, 66 98" stroke="#685742" stroke-width="1.6"/><path d="M300 168 C 332 138, 372 120, 422 100" stroke="#685742" stroke-width="1.6"/><path d="M248 150 C 244 112, 252 80, 268 40" stroke="#685742" stroke-width="1.3"/><path d="M240 336 C 262 382, 320 404, 384 438" stroke="#c9a554" stroke-width="1.6" stroke-dasharray="4 10"/><circle cx="110" cy="430" r="6" fill="#5f875f"/><circle cx="384" cy="438" r="6" fill="#d7c483"/><circle cx="58" cy="374" r="4" fill="#78824b"/><circle cx="430" cy="368" r="4" fill="#78824b"/><circle cx="66" cy="98" r="5" fill="#c9a554"/><circle cx="422" cy="100" r="4" fill="#bb7744"/><circle cx="268" cy="40" r="3.5" fill="#d7c483"/><g transform="translate(105.6 105.6) scale(4.2)"><path d="M17.23 23.4 A15 15 0 0 1 46.77 23.4" stroke="#78824b" stroke-width="4" stroke-dasharray="6.4 5.4" stroke-linecap="butt"/><path d="M7 40 Q19 34 30.5 41.5 V54 Q19 47 7 53 Z" fill="#5f875f"/><path d="M33.5 41.5 Q45 34 57 40 V53 Q45 47 33.5 54 Z" fill="#5f875f"/><circle cx="32" cy="26" r="7" fill="#c9a554"/><circle cx="39.5" cy="13.01" r="4" fill="#d7c483"/><circle cx="19.71" cy="17.4" r="4" fill="#bb7744"/></g></svg>`;

const head = (eyebrow, title, lead) => `<header class="s-head">${eyebrow ? `<p class="s-eyebrow">${il(eyebrow)}</p>` : ""}${title ? `<h2 class="s-title">${il(title)}</h2>` : ""}${lead ? `<p class="s-lead">${il(lead)}</p>` : ""}</header>`;
const points = (list) => `<ul class="pts">${(list ?? []).map((p) => `<li>${il(p)}</li>`).join("")}</ul>`;
const tone = (t) => (t ? ` tone-${t}` : "");
const card = (c) => `<div class="card${tone(c.tone)}">${c.tag ? `<span class="tag">${il(c.tag)}</span>` : ""}${c.title ? `<h3>${il(c.title)}</h3>` : ""}${c.text ? `<p>${il(c.text)}</p>` : ""}${c.points ? points(c.points) : ""}</div>`;
const eyebrowFor = (s, ctx) => s.eyebrow ?? (s.ref ? `${s.ref} · ${ctx.sectionNames?.[s.ref] ?? ""}`.replace(/ · $/, "") : "");

/** The diagram as an <img>, plus its aspect ratio so wide ones can take the full slide width. */
async function figure(id, ctx) {
  if (!id) return { html: "", wide: false };
  const file = path.join(ROOT, "docs", "diagrams", `${id}-dark.svg`);
  if (!(await exists(file))) {
    ctx.missing.add(id);
    return { html: `<div class="figure missing">diagram: ${esc(id)}</div>`, wide: false };
  }
  ctx.diagrams.add(id);
  const head = (await readFile(file, "utf8")).slice(0, 600);
  const [, w, h] = head.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) ?? [0, 4, 3];
  const alt = head.match(/aria-label="([^"]*)"/)?.[1] ?? "";
  return { html: `<div class="figure"><img src="../diagrams/${id}-dark.svg" alt="${alt}"></div>`, wide: w / h > 2.1 };
}

// ---- Slide types ----

const T = {
  async cover(s, ctx) {
    return { cls: "t-cover", foot: false, html: `<div style="display:flex;flex-direction:column;gap:28px">
<p class="s-eyebrow"><span class="dot"></span>Field guide deck · last refresh ${esc(ctx.facts.lastRefresh)}</p>
<h1>Claude Certified Architect<span class="spore-dot"></span></h1>
<p class="sub">— Foundations</p>
<p class="copy">${il(s.copy ?? "The CCAR-F exam one idea per slide: five domains, the wrong answers it tempts you with, and the patterns it rewards.")}</p>
<p class="pills"><span class="pill">Unofficial · not affiliated with Anthropic</span><span class="pill">dnacenta.github.io/claude-certified-architect</span></p>
</div>${MARK}` };
  },

  async glance(s) {
    const stats = s.stats.map((x) => `<div class="stat"><span class="v">${esc(x.value)}${x.unit ? `<small>${esc(x.unit)}</small>` : ""}</span><span class="l">${il(x.label)}</span></div>`).join("");
    return { html: `${head(s.eyebrow, s.title, s.lead)}<div class="s-body"><div class="stats">${stats}</div>${s.note ? `<p class="s-lead" style="margin-top:auto">${il(s.note)}</p>` : ""}</div>` };
  },

  async domains(s, ctx) {
    const cards = Object.values(ctx.domains).map((d) => `<div class="card">${ring(112, 12, d.weight, `${d.weight}%`, `D${d.n}`, 30)}<h3>${esc(d.title)}</h3>${s.blurbs?.[d.n] ? `<p>${il(s.blurbs[d.n])}</p>` : ""}</div>`).join("");
    return { html: `${head(s.eyebrow, s.title, s.lead)}<div class="dmap">${cards}</div>` };
  },

  async cards(s, ctx) {
    const cols = s.columns ?? Math.min(s.cards.length, 3);
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="grid cols-${cols}">${s.cards.map(card).join("")}</div>${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}` };
  },

  async compare(s, ctx) {
    const cols = s.columns.length;
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="grid cols-${cols}">${s.columns.map(card).join("")}</div>${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}` };
  },

  async divider(s, ctx) {
    const d = ctx.domains[ctx.meta.domain];
    const chips = (s.chips ?? []).map((c, i) => `<span class="chip"><b>${esc(c.ref ?? `${d.n}.${i + 1}`)}</b>${il(c.title ?? c)}</span>`).join("");
    return { cls: "t-divider", html: `${ring(340, 22, d.weight, `<span style="font-size:112px;letter-spacing:-5px;font-weight:800">${d.weight}%</span>`, "of the exam", 112)}
<div class="right"><p class="s-eyebrow">${il(s.eyebrow ?? `Domain ${d.n} of 5`)}</p><h1>${esc(d.title)}</h1>${s.blurb ? `<p class="blurb">${il(s.blurb)}</p>` : ""}<div class="chips">${chips}</div></div>` };
  },

  async concept(s, ctx) {
    const fig = await figure(s.diagram, ctx);
    const pts = s.points ? points(s.points) : "<div></div>";
    const body = !fig.html ? `<div class="concept solo">${pts}</div>`
      : fig.wide ? `<div class="concept stack">${fig.html}${s.points ? `<ul class="pts cols-${Math.min(s.points.length, 4)}">${s.points.map((p) => `<li>${il(p)}</li>`).join("")}</ul>` : ""}</div>`
      : `<div class="concept">${pts}${fig.html}</div>`;
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}${body}${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}` };
  },

  async diagram(s, ctx) {
    const fig = await figure(s.diagram, ctx);
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="s-body">${fig.html}${s.caption ? `<p class="caption">${il(s.caption)}</p>` : ""}</div>` };
  },

  async rightwrong(s, ctx) {
    const r = s.right;
    const right = `<div class="card tone-moss right"><span class="label">${ICON_OK}${il(r.label ?? "The right answer")}</span><h3>${il(r.title)}</h3>${r.points ? points(r.points) : ""}${r.note ? `<p class="s-note">${il(r.note)}</p>` : ""}</div>`;
    const wrongs = s.wrong.map((w) => `<div class="card tone-rust wrong">${ICON_NO}<div style="display:flex;flex-direction:column;gap:4px"><h3>${il(w.title)}</h3>${w.text ? `<p>${il(w.text)}</p>` : ""}</div></div>`).join("");
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="rw">${right}<div class="wrongs">${wrongs}</div></div>` };
  },

  async table(s, ctx) {
    const th = s.head.map((h) => `<th>${il(h)}</th>`).join("");
    const rows = s.rows.map((r, i) => `<tr${(s.highlight ?? []).includes(i + 1) ? ' class="hl"' : ""}>${r.map((c) => `<td>${il(c)}</td>`).join("")}</tr>`).join("");
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="s-body"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}</div>` };
  },

  async code(s, ctx) {
    const lang = s.lang && hljs.getLanguage(s.lang) ? s.lang : null;
    const body = lang ? hljs.highlight(s.code.replace(/\n$/, ""), { language: lang }).value : esc(s.code.replace(/\n$/, ""));
    const notes = s.notes ? `<ol class="notes">${s.notes.map((n) => `<li>${il(n)}</li>`).join("")}</ol>` : "<div></div>";
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="codewrap"><pre class="code">${lang ? `<span class="lang">${esc(lang)}</span>` : ""}<code>${body}</code></pre>${notes}</div>` };
  },

  async timeline(s, ctx) {
    return { html: `${head(eyebrowFor(s, ctx), s.title, s.lead)}<div class="tl">${s.steps.map(card).join("")}</div>${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}` };
  },

  async cheatsheet(s, ctx) {
    const d = ctx.domains[ctx.meta.domain];
    const cells = s.cells.map((c, i) => `<div class="card${tone(c.tone)}"><h3><b>${esc(c.ref ?? `${d.n}.${i + 1}`)}</b>${il(c.title)}</h3><p>${il(c.text)}</p></div>`);
    if (s.most_tested) cells.push(`<div class="card tone-gold"><h3><b>★</b>Most tested</h3><p style="color:var(--fg)">${il(s.most_tested)}</p></div>`);
    // Four columns (five above eight cells); the last card stretches over any empty slots in its row.
    const cols = cells.length > 8 ? 5 : 4;
    const rem = cells.length % cols;
    if (rem) cells[cells.length - 1] = cells[cells.length - 1].replace('<div class="card', `<div style="grid-column: span ${cols - rem + 1}" class="card`);
    return { html: `<div class="cs-head"><div class="s-head"><p class="s-eyebrow">Domain ${d.n} · on one page</p><h2 class="s-title">${esc(d.title)}</h2></div>${ring(88, 8, d.weight, `${d.weight}%`, "", 22)}</div><div class="cs" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr))">${cells.join("")}</div>` };
  },

  async lineup(s, ctx) {
    const t = ctx.facts.lineup;
    const th = t.head.map((h) => `<th>${il(h)}</th>`).join("");
    const rows = t.rows.map((r) => `<tr${r[0].startsWith("**") ? ' class="hl"' : ""}>${r.map((c) => `<td>${il(c.replace(/\*\*/g, ""))}</td>`).join("")}</tr>`).join("");
    return { html: `${head(s.eyebrow ?? "Models in the code samples", s.title ?? "The current lineup", t.lead)}<div class="s-body"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}</div>` };
  },

  async family(s, ctx) {
    const cards = ctx.facts.family.rows.map((r) => {
      const main = r[0].startsWith("**");
      const c = r.map((x) => x.replace(/\*\*/g, ""));
      return `<div class="card${main ? " tone-gold" : ""}"><span class="tag">${esc(c[0])}</span><h3>${il(c[1])}</h3><p>${il(c[2])}</p><p style="margin-top:auto;font-family:var(--mono);font-size:15px;color:var(--fg)">${esc(c[3])}</p></div>`;
    }).join("");
    return { html: `${head(s.eyebrow ?? "The certification family", s.title ?? "Four credentials, one program.", s.lead)}<div class="grid cols-4">${cards}</div>${s.note ? `<p class="s-note">${il(s.note)}</p>` : ""}` };
  },

  async quiz(s, ctx) {
    const d = ctx.domains[ctx.meta.domain];
    const qs = d.questions;
    return qs.flatMap((q, i) => {
      const bar = `<span class="q-bar">${qs.map((_, j) => `<span${j <= i ? ' class="on"' : ""}></span>`).join("")}</span>`;
      const opts = q.options.map((o) => `<div class="card opt"><span class="letter">${o.letter}</span><p>${il(o.text)}</p></div>`).join("");
      const question = { section: `Answer on the next slide →`, html: `<div class="q-top"><p class="s-eyebrow"><span class="dot"></span>Practice · Domain ${d.n} · question ${i + 1} of ${qs.length}</p>${bar}</div><p class="q-text${q.stem.length > 150 ? " long" : ""}">${il(q.stem)}</p><div class="opts">${opts}</div>` };
      const pick = q.options.find((o) => o.letter === q.answer);
      const rest = q.options.filter((o) => o !== pick).map((o) => `<p><b>${o.letter}</b><span>${il(o.text)}</span></p>`).join("");
      const extra = s.why_not?.[q.n];
      const answer = { section: `Domain ${d.n} · practice`, html: `<p class="s-eyebrow"><span class="dot"></span>Answer · Domain ${d.n} · question ${i + 1}</p>
<div class="ans"><div class="col"><div class="card tone-gold pick"><span class="letter">${pick.letter}</span><p>${il(pick.text)}</p></div><div class="rest">${rest}</div></div>
<div class="col"><div class="card why"><span class="tag" style="color:var(--moss-text)">Why</span><p>${il(q.why)}</p></div>${extra ? `<div class="card tone-rust"><span class="tag">Why not ${esc(extra.letter)}</span><p>${il(extra.text)}</p></div>` : ""}</div></div>` };
      return [question, answer];
    });
  },

  async closing(s, ctx) {
    return { cls: "t-closing", html: `<p class="s-eyebrow"><span class="dot"></span>${il(s.eyebrow ?? `Last refresh ${ctx.facts.lastRefresh}`)}</p><h1>${il(s.title ?? "Good luck on exam day.")}</h1>${s.lead ? `<p class="s-lead">${il(s.lead)}</p>` : ""}<p class="pills"><span class="pill">Read online · dnacenta.github.io/claude-certified-architect</span><span class="pill">Full text · guide_en.pdf</span><span class="pill">Source · github.com/dnacenta/claude-certified-architect</span></p><p class="s-note">Unofficial community study guide. Claude Certified Architect is a certification program by Anthropic.</p>` };
  },
};

// ---- Build ----

async function render(files) {
  const ctx = { domains: await domainInfo(), facts: await readmeFacts(), missing: new Set(), diagrams: new Set() };
  const slides = [];
  for (const file of files) {
    const doc = YAML.parse(await readFile(file, "utf8"));
    const meta = { label: doc.label ?? "", domain: doc.domain };
    const sectionNames = doc.sections ?? {};
    for (const [k, s] of (doc.slides ?? []).entries()) {
      const make = T[s.type];
      if (!make) throw new Error(`${path.basename(file)} slide ${k + 1}: unknown type "${s.type}"`);
      let out;
      try {
        out = await make(s, { ...ctx, meta, sectionNames });
      } catch (e) {
        throw new Error(`${path.basename(file)} slide ${k + 1} (${s.type}): ${e.message}`);
      }
      for (const o of [out].flat()) {
        const section = o.section ?? [meta.label, s.ref].filter(Boolean).join(" · ");
        slides.push({ ...o, type: s.type, src: `${path.basename(file)} #${k + 1} (${s.type})`, section });
      }
    }
  }
  const html = slides.map((o, i) => `<section class="slide t-${o.type} ${o.cls ?? ""}" id="s${i + 1}" data-src="${esc(o.src)}">${o.html}${o.foot === false ? "" : `<footer class="s-foot"><span>${BRAND}</span><span>${esc(o.section)}${o.section ? " · " : ""}<span class="n">${i + 1}</span></span></footer>`}</section>`);
  return { ctx, html, count: slides.length };
}

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&amp;family=JetBrains+Mono:wght@400;500;700&amp;display=swap">`;

function page(body, cls, title, extraHead = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${FONTS}<link rel="stylesheet" href="deck.css"><link rel="icon" type="image/svg+xml" href="../favicon.svg">${extraHead}</head><body class="${cls}">${body}</body></html>\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const pdf = args.includes("--pdf");
  const check = args.includes("--check");
  let files = args.filter((a) => !a.startsWith("--")).map((f) => path.resolve(f));
  if (!files.length) {
    files = (await readdir(path.join(ROOT, "deck"))).filter((f) => f.endsWith(".yaml")).sort().map((f) => path.join(ROOT, "deck", f));
  }

  const { ctx, html, count } = await render(files);
  await mkdir(DECK_OUT, { recursive: true });
  await mkdir(path.join(OUT, "diagrams"), { recursive: true });
  await cp(path.join(ROOT, "site", "deck.css"), path.join(DECK_OUT, "deck.css"));
  for (const id of ctx.diagrams) {
    await cp(path.join(ROOT, "docs", "diagrams", `${id}-dark.svg`), path.join(OUT, "diagrams", `${id}-dark.svg`));
  }

  const title = "Field guide deck · Claude Certified Architect study guide";
  await writeFile(path.join(DECK_OUT, "print.html"), page(html.join("\n"), "print", title));
  const bar = `<nav class="v-bar" aria-label="Deck"><a href="../">← claude-certified-architect</a><span class="v-links"><a class="v-btn" href="../overview/">Read the full guide</a><a class="v-btn primary" href="../deck_en.pdf">Download the deck (PDF)</a></span></nav>`;
  const frames = html.map((s) => `<div class="v-frame">${s}</div>`).join("\n");
  const fit = `<script>const fit=()=>document.querySelectorAll(".v-frame").forEach(f=>f.style.setProperty("--s",f.clientWidth/1280));addEventListener("resize",fit);fit();</script>`;
  await writeFile(path.join(DECK_OUT, "index.html"), page(`${bar}<main class="v-list">${frames}</main>${fit}`, "viewer", title,
    `<meta name="description" content="The Claude Certified Architect — Foundations study guide as a visual deck: every domain, diagram and practice question."><meta name="theme-color" content="#1a1a1a">`));

  console.log(`deck: ${count} slides from ${files.length} file(s)`);
  if (ctx.missing.size) console.log(`missing diagrams: ${[...ctx.missing].join(", ")}`);
  if (!pdf && !check) return;

  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1280, height: 720 });
  await tab.goto(pathToFileURL(path.join(DECK_OUT, "print.html")).href, { waitUntil: "networkidle0" });
  await tab.evaluate(() => document.fonts.ready);

  let failed = false;
  if (check) {
    const issues = await tab.evaluate(() => [...document.querySelectorAll(".slide")].map((s, i) => {
      const bad = new Set();
      if (s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1) bad.add("slide content overflows");
      s.querySelectorAll(".s-body, .card, .code, .grid, .concept, .rw, .ans, .cs, .tl, .codewrap, .wrongs, .dmap").forEach((el) => {
        if (el.scrollHeight > el.clientHeight + 2) bad.add(`.${el.classList[0]} content is taller than its box`);
        if (el.scrollWidth > el.clientWidth + 2) bad.add(`.${el.classList[0]} content is wider than its box`);
      });
      const foot = s.querySelector(".s-foot");
      if (foot) {
        const top = foot.getBoundingClientRect().top;
        for (const el of s.querySelectorAll(":scope > :not(.s-foot)")) {
          if (el.getBoundingClientRect().bottom > top - 8) bad.add("content runs into the footer");
        }
      }
      return { n: i + 1, src: s.dataset.src, bad: [...bad] };
    }).filter((x) => x.bad.length));
    for (const x of issues) console.log(`OVERFLOW slide ${x.n} ${x.src}: ${x.bad.join("; ")}`);
    console.log(`check: ${issues.length} slide(s) overflow`);
    failed = issues.length > 0 || ctx.missing.size > 0;
  }
  if (pdf) {
    await tab.pdf({ path: path.join(OUT, "deck_en.pdf"), width: "1280px", height: "720px", printBackground: true, preferCSSPageSize: true });
    console.log("wrote _site/deck_en.pdf");
  }
  await browser.close();
  if (failed) process.exit(1);
}

await main();
