// Builds the study guide website into _site/: the landing page from site/landing.html and one
// reader page per markdown file, all in the Field Guide style (site/style.css).
//
// usage: node scripts/build-site.mjs

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "_site");
const REPO = "https://github.com/dnacenta/claude-certified-architect";
const SITE = "https://dnacenta.github.io/claude-certified-architect/";

// Reader pages, in reading order. `out` is the page's directory under _site/.
const PAGES = [
  { src: "claude-certified-architect.md", out: "overview/", group: "Guide" },
  { src: "domains/d1-agentic-architecture.md", out: "domains/d1-agentic-architecture/", group: "Domains" },
  { src: "domains/d2-tool-design-mcp.md", out: "domains/d2-tool-design-mcp/", group: "Domains" },
  { src: "domains/d3-claude-code-config.md", out: "domains/d3-claude-code-config/", group: "Domains" },
  { src: "domains/d4-prompt-engineering.md", out: "domains/d4-prompt-engineering/", group: "Domains" },
  { src: "domains/d5-context-reliability.md", out: "domains/d5-context-reliability/", group: "Domains" },
  { src: "certs/ccao-f-associate.md", out: "certs/ccao-f-associate/", group: "Other certifications" },
  { src: "certs/ccdv-f-developer.md", out: "certs/ccdv-f-developer/", group: "Other certifications" },
  { src: "certs/ccar-p-architect-professional.md", out: "certs/ccar-p-architect-professional/", group: "Other certifications" },
  { src: "CHANGELOG.md", out: "changelog/", group: "Guide" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Relative URL from one output directory to another ("" is the site root). */
function rel(fromDir, toDir) {
  const r = path.posix.relative(fromDir || ".", toDir || ".");
  return r === "" ? "./" : `${r}/`;
}

/** Title, nav label, eyebrow and H1 text from the page's first heading. */
function describe(page, h1) {
  let m;
  if ((m = h1.match(/^Domain (\d): (.+) \((\d+%)\)$/))) {
    return { ...page, title: m[2], nav: m[2], badge: `D${m[1]}`, eyebrow: `Domain ${m[1]} · ${m[3]} of the exam`, h1: m[2] };
  }
  if ((m = h1.match(/^Claude Certified (.+) \(([A-Z-]+)\)$/))) {
    return { ...page, title: h1, nav: m[1], badge: m[2], eyebrow: `Other certification · ${m[2]}`, h1 };
  }
  if (page.src === "CHANGELOG.md") return { ...page, title: "Changelog", nav: "Changelog", eyebrow: "Refresh history", h1 };
  return { ...page, title: h1, nav: "Overview", eyebrow: "Overview · CCAR-F", h1 };
}

function markdown(page, pages) {
  const slugger = new GithubSlugger();
  const md = new MarkdownIt({
    html: true,
    highlight(code, lang) {
      const label = lang ? `<span class="code-lang" aria-hidden="true">${esc(lang)}</span>` : "";
      const body = lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        : esc(code);
      return `<pre class="code">${label}<code class="hljs">${body}</code></pre>`;
    },
  }).use(anchor, {
    level: [2, 3, 4],
    slugify: (s) => slugger.slug(s),
    permalink: anchor.permalink.linkInsideHeader({ symbol: "#", placement: "after", ariaHidden: true, class: "h-anchor" }),
  });

  // Links between the repo's markdown files become links between pages; anything else in the
  // repo points at GitHub.
  const bySrc = new Map(pages.map((p) => [p.src, p]));
  const defaultLink = md.renderer.rules.link_open ?? ((t, i, o, e, self) => self.renderToken(t, i, o));
  md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
    const href = tokens[idx].attrGet("href") ?? "";
    if (href && !/^[a-z]+:|^#|^\/\//i.test(href)) {
      const [file, hash] = href.split("#");
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(page.src), file));
      const to = target === "README.md" ? { out: "" } : bySrc.get(target);
      const kind = /\.[a-z0-9]+$/i.test(target) ? "blob" : "tree";
      const url = to ? rel(page.out, to.out) : `${REPO}/${kind}/main/${target.replace(/\/$/, "")}`;
      tokens[idx].attrSet("href", hash ? `${url}#${hash}` : url);
    }
    return defaultLink(tokens, idx, opts, env, self);
  };
  md.renderer.rules.table_open = () => '<div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table>\n';
  md.renderer.rules.table_close = () => "</table></div>\n";

  return md;
}

function headerHtml(root) {
  return `<header class="fg-header">
  <a href="${root}" class="fg-brand">${MARK}<span class="fg-wordmark">claude<span class="fg-hyphen">-</span>certified<span class="fg-hyphen">-</span>architect</span></a>
  <nav aria-label="Site" class="fg-nav">
    <span class="fg-navlinks">
      <a href="${root}overview/" class="fg-navlink">Guide</a>
      <a href="${root}changelog/" class="fg-navlink">Changelog</a>
      <a href="${REPO}" class="fg-navlink">GitHub</a>
    </span>
    <a href="${root}guide_en.pdf" class="fg-btn fg-btn-primary fg-btn-sm">PDF</a>
  </nav>
</header>`;
}

function footerHtml(root) {
  return `<footer class="fg-footer">
  <div class="fg-footer-inner">
    <div class="fg-footer-note">
      <span class="fg-footer-mark">claude<span class="fg-hyphen">-</span>certified<span class="fg-hyphen">-</span>architect</span>
      <span class="fg-mono">Unofficial community study guide. Claude Certified Architect is a certification program by <a href="https://www.anthropic.com">Anthropic</a>.</span>
    </div>
    <nav aria-label="Elsewhere" class="fg-footer-links">
      <a href="${REPO}" class="fg-footer-link">Source</a>
      <a href="${root}changelog/" class="fg-footer-link">Changelog</a>
      <a href="https://claude.com/partners" class="fg-footer-link">Partner network</a>
      <a href="https://anthropic.skilljar.com/claude-with-the-anthropic-api" class="fg-footer-link">Anthropic Academy</a>
      <a href="https://pulse-null.com" class="fg-footer-link">pulse-null.com</a>
    </nav>
  </div>
</footer>`;
}

// The Open Book mark, inline so it inherits nothing and needs no request.
const MARK = `<svg class="fg-mark" viewBox="0 0 64 64" width="32" height="32" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#1a1a1a"/><path d="M17.23 23.4 A15 15 0 0 1 46.77 23.4" fill="none" stroke="#78824b" stroke-width="4" stroke-dasharray="6.4 5.4"/><path d="M7 40 Q19 34 30.5 41.5 V54 Q19 47 7 53 Z" fill="#5f875f"/><path d="M33.5 41.5 Q45 34 57 40 V53 Q45 47 33.5 54 Z" fill="#5f875f"/><circle cx="32" cy="26" r="7" fill="#c9a554"/><circle cx="39.5" cy="13.01" r="4" fill="#d7c483"/><circle cx="19.71" cy="17.4" r="4" fill="#bb7744"/></svg>`;

function shell({ root, outDir, title, description, body, bodyClass = "" }) {
  const url = SITE + outDir;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#1a1a1a">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="claude-certified-architect: unofficial study guide for Claude Certified Architect — Foundations">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}og-image.png">
<link rel="icon" href="${root}favicon.ico" sizes="32x32">
<link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&amp;family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&amp;display=swap">
<link rel="stylesheet" href="${root}style.css">
</head>
<body class="fg-page ${bodyClass}">
<a href="#main" class="fg-skip">Skip to content</a>
${headerHtml(root)}
${body}
${footerHtml(root)}
</body>
</html>
`;
}

const plain = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function firstParagraph(html) {
  const m = html.match(/<p>([\s\S]*?)<\/p>/);
  const text = m ? plain(m[1]).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'") : "";
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, "")}…` : text;
}

function sideNav(page, pages) {
  const groups = [...new Set(pages.map((p) => p.group))];
  const items = groups.map((g) => {
    const links = pages.filter((p) => p.group === g).map((p) => {
      const cur = p === page ? ' aria-current="page"' : "";
      const badge = p.badge ? `<span class="rd-badge">${p.badge}</span>` : "";
      return `<li><a href="${rel(page.out, p.out)}"${cur}>${badge}<span>${esc(p.nav)}</span></a></li>`;
    }).join("");
    return `<p class="fg-eyebrow">${g}</p><ul>${links}</ul>`;
  }).join("");
  return `<details class="rd-contents" open><summary>Contents</summary><nav aria-label="Guide contents">${items}</nav></details>`;
}

function pager(page, pages) {
  const i = pages.indexOf(page);
  const link = (p, dir) => p
    ? `<a class="rd-page rd-page-${dir}" href="${rel(page.out, p.out)}"><span class="fg-eyebrow">${dir === "prev" ? "Previous" : "Next"}</span><span>${esc(p.nav)}</span></a>`
    : "<span></span>";
  return `<nav class="rd-pager" aria-label="Pages">${link(pages[i - 1], "prev")}${link(pages[i + 1], "next")}</nav>`;
}

async function buildPage(page, pages) {
  const src = await readFile(path.join(ROOT, page.src), "utf8");
  const md = markdown(page, pages);
  const body = src.replace(/^# .*\n/, ""); // the H1 is drawn by the page head
  const env = {};
  const tokens = md.parse(body, env);
  const toc = [];
  tokens.forEach((t, i) => {
    if (t.type === "heading_open" && t.tag === "h2") {
      toc.push({ id: t.attrGet("id"), text: tokens[i + 1].children.filter((c) => c.type === "text" || c.type === "code_inline").map((c) => c.content).join("") });
    }
  });
  let html = md.renderer.render(tokens, md.options, env);
  // Practice answers fold away so the questions can be tried first.
  html = html.replace(/<p><strong>Answer: ([^<]+)<\/strong>([\s\S]*?)<\/p>/g,
    '<details class="answer"><summary>Show answer</summary><p><strong>Answer: $1</strong>$2</p></details>');

  const root = rel(page.out, "");
  const tocHtml = toc.length > 1
    ? `<aside class="rd-toc" aria-label="On this page"><p class="fg-eyebrow">On this page</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol></aside>`
    : "";
  const main = `<div class="rd">
<aside class="rd-side">${sideNav(page, pages)}</aside>
<main id="main" class="rd-main">
<article class="prose">
<p class="fg-eyebrow rd-eyebrow">${esc(page.eyebrow)}</p>
<h1>${esc(page.h1)}</h1>
${html}
</article>
${pager(page, pages)}
</main>
${tocHtml}
</div>
<script>if (matchMedia("(max-width: 999px)").matches) document.querySelector(".rd-contents").open = false;</script>`;
  const title = `${page.title} · Claude Certified Architect study guide`;
  await mkdir(path.join(OUT, page.out), { recursive: true });
  await writeFile(path.join(OUT, page.out, "index.html"),
    shell({ root, outDir: page.out, title, description: firstParagraph(html), body: main, bodyClass: "fg-reader" }));
}

async function main() {
  const readme = await readFile(path.join(ROOT, "README.md"), "utf8");
  const lastRefresh = readme.match(/Last refresh: ([^*\n]+?)\*\*/)?.[1] ?? "";

  const pages = [];
  for (const p of PAGES) {
    const src = await readFile(path.join(ROOT, p.src), "utf8");
    pages.push(describe(p, src.match(/^# (.+)$/m)[1].trim()));
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const f of ["style.css", "og-image.png", "favicon.svg", "favicon.ico", "apple-touch-icon.png"]) {
    await cp(path.join(ROOT, "site", f), path.join(OUT, f));
  }

  const landing = (await readFile(path.join(ROOT, "site", "landing.html"), "utf8"))
    .replaceAll("{{last_refresh}}", esc(lastRefresh));
  await writeFile(path.join(OUT, "index.html"), shell({
    root: "./",
    outDir: "",
    title: "Claude Certified Architect — Foundations · Study Guide",
    description: "Free, open-source study guide for the Claude Certified Architect — Foundations certification. All 5 domains, code examples, anti-patterns, and practice questions.",
    body: landing,
    bodyClass: "fg-landing",
  }));

  for (const p of pages) await buildPage(p, pages);

  await writeFile(path.join(OUT, "404.html"), shell({
    root: SITE,
    outDir: "404.html",
    title: "Page not found · Claude Certified Architect study guide",
    description: "This page does not exist.",
    body: `<main id="main" class="fg-sec fg-notfound"><div class="fg-stack" style="gap:20px"><p class="fg-eyebrow">404</p><h1 class="fg-h2">Nothing grows here.</h1><p class="fg-lead">The page you asked for doesn't exist. Try the <a href="${SITE}overview/">guide</a> or the <a href="${SITE}">front page</a>.</p></div></main>`,
  }));

  console.log(`built ${pages.length + 2} pages into _site/ (last refresh: ${lastRefresh || "unknown"})`);
}

await main();
