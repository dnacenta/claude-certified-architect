// Builds the full-text PDF (_site/guide_en.pdf): a cover, the overview, the five domains and the
// three cert overviews, rendered from the markdown in the light print theme (pdf/print.css).
//
// usage: node scripts/build-pdf.mjs

import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "_site");
const DIAGRAMS = pathToFileURL(path.join(ROOT, "docs", "diagrams")).href;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const md = new MarkdownIt({
  html: true,
  highlight: (code, lang) => `<pre><code class="hljs">${lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : esc(code)}</code></pre>`,
});

const list = async (dir) => (await readdir(path.join(ROOT, dir))).filter((f) => f.endsWith(".md")).sort().map((f) => `${dir}/${f}`);

async function main() {
  const readme = await readFile(path.join(ROOT, "README.md"), "utf8");
  const refresh = readme.match(/Last refresh: ([^*\n]+?)\*\*/)?.[1] ?? "";
  const cover = (await readFile(path.join(ROOT, "pdf", "cover.html"), "utf8")).replaceAll("{{last_refresh}}", refresh);

  const files = ["claude-certified-architect.md", ...(await list("domains")).filter((f) => /\/d\d-/.test(f)), ...(await list("certs"))];
  const parts = [];
  for (const f of files) {
    const html = md.render(await readFile(path.join(ROOT, f), "utf8"))
      // Diagrams are <picture> blocks for GitHub's light and dark modes; print takes the light one.
      .replace(/<picture>[\s\S]*?\/diagrams\/([a-z0-9-]+)-light\.svg"[^>]*?alt="([^"]*)"[\s\S]*?<\/picture>/g,
        (_, id, alt) => `<p class="diagram"><img src="${DIAGRAMS}/${id}-light.svg" alt="${alt}"></p>`);
    parts.push(html);
  }

  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Claude Certified Architect — Foundations</title>
<link rel="stylesheet" href="${pathToFileURL(path.join(ROOT, "pdf", "print.css")).href}"></head>
<body>${cover}<div class="page-break"></div>${parts.join('<div class="page-break"></div>')}</body></html>`;

  await mkdir(OUT, { recursive: true });
  const tmp = await mkdtemp(path.join(os.tmpdir(), "guide-pdf-"));
  const htmlFile = path.join(tmp, "guide.html");
  await writeFile(htmlFile, page);

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const tab = await browser.newPage();
  await tab.goto(pathToFileURL(htmlFile).href, { waitUntil: "networkidle0", timeout: 120000 });
  await tab.evaluate(() => document.fonts.ready);
  await tab.pdf({
    path: path.join(OUT, "guide_en.pdf"),
    format: "A4",
    margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    printBackground: true,
  });
  await browser.close();
  await rm(tmp, { recursive: true, force: true });
  console.log(`wrote _site/guide_en.pdf from ${files.length} files`);
}

await main();
