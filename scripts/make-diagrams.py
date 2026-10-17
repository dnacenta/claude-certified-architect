"""Draw the guide's diagrams as SVG in the Field Guide style: docs/diagrams/<id>-dark.svg and
<id>-light.svg. Text is drawn as paths, so the files look the same on GitHub, the website, the
deck and the PDF.

usage: pip install fonttools && python3 scripts/make-diagrams.py [id ...]

Fonts (Bricolage Grotesque, JetBrains Mono; both OFL) are downloaded once from google/fonts into
~/.cache/cca-guide-fonts. Each diagram is a function below; labels come from the guide's text.
"""
import math
import sys
import urllib.request
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "diagrams"
CACHE = Path.home() / ".cache" / "cca-guide-fonts"
FONT_URLS = {
    "bricolage.ttf": "https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf",
    "jbmono.ttf": "https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
}

THEMES = {
    "dark": dict(bg="#1a1a1a", card="#222222", card2="#2a2a26", line="#33332c", line2="#3d3d34", ink="#e9e2c4",
                 muted="#c2c2b0", subtle="#8c8c78", gold="#c9a554", goldtext="#d7c483", moss="#5f875f",
                 mosstext="#8fae7f", rust="#bb7744", brown="#685742", olive="#78824b", diamond="#3d3d34",
                 sand="#d7c483", onaccent="#1a1a1a"),
    "light": dict(bg="#fbf9f3", card="#f3efe2", card2="#efe9d6", line="#e0dac6", line2="#d2cab0", ink="#1a1a1a",
                  muted="#4a4840", subtle="#6f6b58", gold="#a8862f", goldtext="#7d5f15", moss="#4b7350",
                  mosstext="#3f6644", rust="#9a5728", brown="#b8a27a", olive="#6d7740", diamond="#e6dfc8",
                  sand="#b39a55", onaccent="#fbf9f3"),
}


def n(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def font_file(name):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / name
    if not path.exists():
        urllib.request.urlretrieve(FONT_URLS[name], path)
    return path


def inst(name, **axes):
    return instantiateVariableFont(TTFont(font_file(name)), axes)


HEAVY = inst("bricolage.ttf", wght=800, opsz=48, wdth=100)
BOLD = inst("bricolage.ttf", wght=700, opsz=24, wdth=100)
BODY = inst("bricolage.ttf", wght=450, opsz=18, wdth=100)
MONO = inst("jbmono.ttf", wght=500)
FONT_KEYS = {id(HEAVY): "h", id(BOLD): "b", id(BODY): "r", id(MONO): "m"}


def measure(f, s, size):
    cmap, hmtx = f.getBestCmap(), f["hmtx"]
    return sum(hmtx[cmap.get(ord(c), cmap[ord("?")])][0] for c in s) * size / f["head"].unitsPerEm


class Fig:
    def __init__(self, w, h, t):
        self.w, self.h, self.t, self.parts = w, h, t, []
        self.glyphs = {}  # (font key, glyph name) -> id; each outline is defined once and reused

    def add(self, s):
        self.parts.append(s)

    def text(self, s, x, y, size=16, font=BODY, color="ink", anchor="start"):
        gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
        key = FONT_KEYS[id(font)]
        k = size / font["head"].unitsPerEm
        w = measure(font, s, size)
        x0 = x - w / 2 if anchor == "middle" else x - w if anchor == "end" else x
        uses, adv = [], 0
        for ch in s:
            name = cmap.get(ord(ch), cmap[ord("?")])
            if (key, name) not in self.glyphs:
                pen = SVGPathPen(gs, ntos=lambda v: str(round(v)))
                gs[name].draw(pen)
                self.glyphs[(key, name)] = (f"{key}{len(self.glyphs)}", pen.getCommands())
            gid, d = self.glyphs[(key, name)]
            if d:
                uses.append(f'<use xlink:href="#{gid}" x="{adv}"/>')
            adv += hmtx[name][0]
        if uses:
            self.add(f'<g fill="{self.t.get(color, color)}" transform="translate({n(x0)} {n(y)}) scale({k:.6g} {-k:.6g})">'
                     f'{"".join(uses)}</g>')
        return w

    def lines(self, rows, cx, cy, size=16, font=BODY, color="ink", lh=1.3, anchor="middle", x=None):
        """Rows of text centred vertically on cy; each row is a str or (str, font, color, size)."""
        rows = [r if isinstance(r, tuple) else (r, font, color, size) for r in rows]
        heights = [r[3] * lh for r in rows]
        y = cy - sum(heights) / 2
        for (s, f, c, sz), h in zip(rows, heights):
            y += h
            self.text(s, cx if x is None else x, y - (h - sz) / 2 - sz * 0.22, sz, f, c, anchor)

    def rect(self, x, y, w, h, fill="card", stroke="line", sw=1, r=16, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        st = f' stroke="{self.t.get(stroke, stroke)}" stroke-width="{n(sw)}"' if stroke else ""
        self.add(f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="{n(r)}" '
                 f'fill="{self.t.get(fill, fill)}"{st}{d}/>')

    def card(self, x, y, w, h, rows, fill="card", stroke="line", sw=1, size=16, font=BOLD, color="ink", r=16):
        self.rect(x, y, w, h, fill, stroke, sw, r)
        self.lines(rows, x + w / 2, y + h / 2, size, font, color)

    def diamond(self, cx, cy, w, h, label):
        pts = f"{n(cx)},{n(cy - h / 2)} {n(cx + w / 2)},{n(cy)} {n(cx)},{n(cy + h / 2)} {n(cx - w / 2)},{n(cy)}"
        self.add(f'<polygon points="{pts}" fill="{self.t["diamond"]}"/>')
        self.text(label, cx, cy + 5, 15, MONO, "ink", "middle")

    def arrow(self, pts, color="subtle", sw=2, head=True, dash=None):
        c = self.t.get(color, color)
        pts = [list(p) for p in pts]
        if head:
            (x0, y0), (x1, y1) = pts[-2], pts[-1]
            L = math.hypot(x1 - x0, y1 - y0)
            ux, uy = (x1 - x0) / L, (y1 - y0) / L
            hl, hw = 10, 5.5
            bx, by = x1 - ux * hl, y1 - uy * hl
            self.add(f'<polygon points="{n(x1)},{n(y1)} {n(bx - uy * hw)},{n(by + ux * hw)} {n(bx + uy * hw)},{n(by - ux * hw)}" fill="{c}"/>')
            pts[-1] = [x1 - ux * (hl - 1), y1 - uy * (hl - 1)]
        d = "M" + " L".join(f"{n(x)} {n(y)}" for x, y in pts)
        da = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{n(sw)}" stroke-linecap="round" stroke-linejoin="round"{da}/>')

    def dot(self, cx, cy, r, color):
        self.add(f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{self.t.get(color, color)}"/>')

    def svg(self, label):
        defs = "".join(f'<path id="{gid}" d="{d}"/>' for gid, d in self.glyphs.values() if d)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
                f'viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" role="img" aria-label="{label}">'
                f'<defs>{defs}</defs><rect width="{self.w}" height="{self.h}" rx="20" fill="{self.t["bg"]}"/>'
                f'{"".join(self.parts)}</svg>\n')


# ---- Diagrams ----

def agentic_loop(t):
    """domains/d1 §1.1 How the Loop Works + The stop_reason Values."""
    f = Fig(1120, 470, t)
    f.arrow([(232, 80), (303, 80)])
    f.arrow([(512, 80), (583, 80)])
    f.arrow([(784, 80), (895, 80)], "moss")
    f.arrow([(684, 136), (684, 235)], "gold")
    f.arrow([(580, 276), (408, 276), (408, 121)], "gold", head=True)
    f.card(24, 40, 208, 80, ["Send the prompt", "+ tool definitions"])
    f.card(304, 40, 208, 80, ["Claude responds"])
    f.diamond(684, 80, 200, 112, "stop_reason?")
    f.card(896, 40, 200, 80, ["Done: present", "the final text"], stroke="moss", sw=1.5)
    f.card(580, 236, 208, 80, ["Run the tool, append", "its tool_result"], fill="card2", stroke="gold", sw=1.5)
    f.text("end_turn", 840, 64, 13, MONO, "mosstext", "middle")
    f.text("tool_use", 698, 192, 13, MONO, "goldtext")
    f.text("loop continues", 420, 216, 13, BODY, "goldtext")
    f.text("THE OTHER FIVE VALUES", 24, 364, 12, MONO, "subtle")
    items = [("stop_sequence", "Ends. A stop string matched."), ("pause_turn", "Send it back. A server tool hit its cap."),
             ("max_tokens", "Hit the limit. May need a continuation."), ("refusal", "Ends. Read stop_details."),
             ("model_context_window_exceeded", "Valid but truncated. Trim or continue.")]
    gap, total = 14, 1072
    u = (total - 4 * gap) / 5.6
    x = 24
    for i, (k, v) in enumerate(items):
        w = u * (1.6 if i == 4 else 1)
        f.rect(x, 378, w, 72, "card", "line", 1, 14)
        f.text(k, x + 14, 404, 12.5, MONO, "goldtext")
        words, row, rows = v.split(), "", []
        for wd in words:
            if measure(BODY, (row + " " + wd).strip(), 14) > w - 28:
                rows.append(row)
                row = wd
            else:
                row = (row + " " + wd).strip()
        rows.append(row)
        for j, r in enumerate(rows[:2]):
            f.text(r, x + 14, 426 + j * 18, 14, BODY, "muted")
        x += w + gap
    return f, "The agentic loop: send the prompt and tools, Claude responds, branch on stop_reason. tool_use runs the tool and loops; end_turn ends."


def hub_and_spoke(t):
    """domains/d1 §1.2 Hub-and-Spoke Architecture + Coordinator Responsibilities."""
    f = Fig(780, 400, t)
    f.arrow([(390, 116), (390, 176)], head=False)
    f.arrow([(130, 176), (650, 176)], head=False)
    for cx in (130, 390, 650):
        f.arrow([(cx, 176), (cx, 239)])
    f.rect(270, 28, 240, 88, "card2", "gold", 1.5)
    f.lines([("Coordinator", BOLD, "ink", 19), ("decomposes · delegates · routes", BODY, "muted", 13.5),
             ("aggregates · re-delegates gaps", BODY, "muted", 13.5)], 390, 72)
    for cx, name in ((130, "Search"), (390, "Analysis"), (650, "Synthesis")):
        f.rect(cx - 106, 240, 212, 80, "card", "line", 1)
        f.lines([("Subagent", MONO, "subtle", 12), (name, BOLD, "ink", 18)], cx, 280)
    f.arrow([(240, 300), (280, 300)], "rust", 1.6, head=False, dash="3 4")
    f.arrow([(500, 300), (540, 300)], "rust", 1.6, head=False, dash="3 4")
    for x in (260, 520):
        f.add(f'<path d="M{x - 5} 295 L{x + 5} 305 M{x + 5} 295 L{x - 5} 305" stroke="{t["rust"]}" stroke-width="2" stroke-linecap="round"/>')
    f.text("Subagents never talk to each other: every message goes through the coordinator.", 390, 366, 15, BODY, "muted", "middle")
    return f, "Hub-and-spoke: one coordinator delegates to Search, Analysis and Synthesis subagents; subagents never talk to each other directly."


def refinement_loop(t):
    """domains/d1 §1.2 Iterative Refinement Loops."""
    f = Fig(1024, 200, t)
    steps = [["Round 1", "coordinator → subagents"], ["Evaluate", "the results"], ["Identify", "the gaps"],
             ["Round 2", "targeted subagents"], ["Final", "synthesis"]]
    w, gap = 168, 34
    for i, (a, b) in enumerate(steps):
        x = 24 + i * (w + gap)
        if i:
            f.arrow([(x - gap, 100), (x - 1, 100)], "gold" if i == 4 else "subtle")
        tone = dict(fill="card2", stroke="gold", sw=1.5) if i == 4 else dict(fill="card", stroke="line", sw=1)
        f.rect(x, 56, w, 88, tone["fill"], tone["stroke"], tone["sw"])
        f.lines([(a, BOLD, "ink", 18), (b, BODY, "muted", 13.5)], x + w / 2, 100)
    f.text("Coverage gaps found in round 1 get a second, narrower pass before synthesis.", 512, 182, 14, BODY, "subtle", "middle")
    return f, "Iterative refinement: round 1, evaluate, identify gaps, a targeted round 2, then final synthesis."


def adaptive_decomposition(t):
    """domains/d1 §1.6 Dynamic Adaptive Decomposition."""
    f = Fig(980, 380, t)
    steps = [("q", "“Why is the app slow?”"), ("s", "Profile CPU usage"),
             ("d", "Database queries are the bottleneck"), ("s", "Analyze query patterns"),
             ("d", "N+1 queries in the user listing endpoint"), ("g", "Generate a fix for those queries")]
    w, h, dx, dy = 360, 46, 116, 58
    for i, (kind, label) in enumerate(steps):
        x, y = 24 + i * dx, 24 + i * dy
        if i:
            px, py = 24 + (i - 1) * dx, 24 + (i - 1) * dy
            f.arrow([(px + 34, py + h), (px + 34, y + h / 2), (x - 1, y + h / 2)], "gold" if kind == "g" else "subtle", 1.8)
        style = {"q": ("card", "line2", 1), "s": ("card", "line", 1), "d": ("card", "sand", 1.2), "g": ("card2", "gold", 1.5)}[kind]
        f.rect(x, y, w, h, style[0], style[1], style[2], 14)
        if kind == "d":
            tw = f.text("DISCOVERY", x + 16, y + 28, 11, MONO, "goldtext")
            f.text(label, x + 26 + tw, y + 29, 15.5, BOLD, "ink")
        else:
            f.text(label, x + 16, y + 29, 15.5, BOLD if kind != "q" else BODY, "ink")
    f.text("Each step is chosen from what the last one revealed.", 24, 362, 14, BODY, "subtle")
    return f, "Dynamic decomposition: from 'Why is the app slow?' each finding picks the next step, ending in a fix for the N+1 queries."


def mcp_architecture(t):
    """domains/d2 §2.4 Architecture."""
    f = Fig(860, 430, t)
    f.rect(24, 24, 560, 176, "card", "line2", 1.2, 22)
    f.text("HOST", 48, 56, 12, MONO, "subtle")
    f.text("The AI application, e.g. Claude Code or an IDE", 98, 56, 14, BODY, "muted")
    for cx in (164, 404):
        f.arrow([(cx, 164), (cx, 279)], "gold")
    for cx, name in ((164, "Client 1"), (404, "Client 2")):
        f.rect(cx - 100, 88, 200, 76, "card2", "line", 1, 16)
        f.lines([("MCP client", MONO, "subtle", 12), (name, BOLD, "ink", 18)], cx, 126)
    f.text("…", 540, 132, 22, BOLD, "subtle", "middle")
    for cx, name in ((164, "GitHub"), (404, "Postgres")):
        f.rect(cx - 100, 280, 200, 84, "card", "moss", 1.5, 16)
        f.lines([("MCP server", MONO, "subtle", 12), (name, BOLD, "ink", 18)], cx, 322)
    f.text("1 : 1", 176, 228, 13, MONO, "goldtext")
    f.text("1 : 1", 416, 228, 13, MONO, "goldtext")
    f.lines([("Each client keeps", BOLD, "ink", 16), ("one connection to", BOLD, "ink", 16), ("one server.", BOLD, "ink", 16)],
            0, 120, x=616, anchor="start")
    f.lines([("Servers provide tools,", BODY, "muted", 15), ("resources and prompts.", BODY, "muted", 15)], 0, 322, x=616, anchor="start")
    return f, "MCP architecture: a host such as Claude Code runs MCP clients, each with a one-to-one connection to an MCP server like GitHub or Postgres."


def claude_md_hierarchy(t):
    """domains/d3 §3.1 Loading Order (Broader → More Specific)."""
    f = Fig(940, 460, t)
    layers = [("Managed policy", "org-wide, set by admins", "an OS-specific system path"),
              ("User", "personal, not version-controlled", "~/.claude/CLAUDE.md"),
              ("Project", "shared via version control", "./CLAUDE.md  or  ./.claude/CLAUDE.md"),
              ("Local project", "personal, gitignored", "./CLAUDE.local.md"),
              ("Directory", "loaded on demand in that directory", "./src/api/CLAUDE.md")]
    f.arrow([(40, 40), (40, 420)], "brown", 1.6)
    f.text("BROADER", 52, 34, 11, MONO, "subtle")
    f.text("MORE SPECIFIC", 52, 446, 11, MONO, "subtle")
    for i, (name, desc, path) in enumerate(layers):
        x, y, h = 76 + i * 14, 44 + i * 76, 64
        w = 940 - 24 - x
        last = i == 4
        f.rect(x, y, w, h, "card2" if last else "card", "gold" if last else "line", 1.5 if last else 1, 16)
        f.rect(x + 16, y + 20, 26, 24, "line2" if not last else "gold", None, 0, 12)
        f.text(str(i + 1), x + 29, y + 37, 13, MONO, "onaccent" if last else "ink", "middle")
        f.text(name, x + 56, y + 30, 18, BOLD, "ink")
        f.text(desc, x + 56, y + 50, 14, BODY, "muted")
        f.text(path, x + w - 20, y + 39, 13, MONO, "goldtext", "end")
    return f, "CLAUDE.md loading order from broader to more specific: managed policy, user, project, local project, directory."


def explore_subagent(t):
    """domains/d3 §3.x Built-in Subagents; domains/d5 large-codebase context."""
    f = Fig(940, 320, t)
    f.arrow([(304, 116), (543, 116)], "subtle")
    f.arrow([(544, 196), (305, 196)], "gold")
    f.text("delegates the search", 424, 102, 13, BODY, "muted", "middle")
    f.text("returns a concise summary", 424, 222, 13, BODY, "goldtext", "middle")
    f.rect(24, 56, 280, 200, "card", "moss", 1.5, 20)
    f.lines([("MAIN CONVERSATION", MONO, "mosstext", 12), ("Context stays", BOLD, "ink", 22), ("clean", BOLD, "ink", 22)], 164, 140)
    f.text("only the summary comes back", 164, 226, 13.5, BODY, "muted", "middle")
    f.rect(544, 56, 372, 200, "card", "line", 1, 20)
    f.text("EXPLORE SUBAGENT", 568, 88, 12, MONO, "subtle")
    f.text("Glob · Grep · Read", 568, 116, 19, BOLD, "ink")
    for i, wdt in enumerate((300, 250, 320, 210, 290, 240)):
        f.rect(568, 136 + i * 16, wdt, 6, "line2", None, 0, 3)
    f.text("Without it, raw file contents and search results would fill the main context window.", 470, 296, 14, BODY, "subtle", "middle")
    return f, "An Explore subagent does the noisy reading with Glob, Grep and Read and returns a concise summary, so the main conversation stays clean."


def independent_review(t):
    """domains/d3 Session Context Isolation for Reviews; domains/d4 Independent Review Instances."""
    f = Fig(940, 280, t)
    f.rect(24, 56, 320, 150, "card", "line", 1, 20)
    f.lines([("SESSION 1 · GENERATION", MONO, "subtle", 12), ("Claude writes", BOLD, "ink", 22), ("the code", BOLD, "ink", 22),
             ("and knows why it made each choice", BODY, "muted", 13.5)], 184, 131)
    f.rect(596, 56, 320, 150, "card2", "gold", 1.5, 20)
    f.lines([("SESSION 2 · REVIEW", MONO, "goldtext", 12), ("Claude reviews", BOLD, "ink", 22), ("the code fresh", BOLD, "ink", 22),
             ("without the reasoning behind it", BODY, "muted", 13.5)], 756, 131)
    f.add(f'<path d="M470 40 L470 222" stroke="{t["rust"]}" stroke-width="1.6" stroke-dasharray="4 6"/>')
    f.arrow([(344, 131), (595, 131)], "gold")
    f.rect(400, 112, 140, 38, "bg", "line2", 1, 19)
    f.text("only the code", 470, 136, 13, MONO, "goldtext", "middle")
    f.text("new session, no shared context", 470, 248, 14, BODY, "subtle", "middle")
    return f, "Independent review: the code goes from the generation session to a fresh review session that shares none of its context."


def meter(f, x, y, w, label, level, color):
    f.text(label, x, y + 12, 12, MONO, "subtle")
    f.rect(x + 110, y + 2, w, 12, "line", None, 0, 6)
    f.rect(x + 110, y + 2, max(12, w * level), 12, color, None, 0, 6)


def sentiment_vs_complexity(t):
    """domains/d5 The Sentiment ≠ Complexity Distinction."""
    f = Fig(980, 360, t)
    cards = [(24, "“I'M SO FRUSTRATED WITH THIS!!!”", ["+ a simple billing error"], 0.95, 0.15, "moss",
              "Resolve", "Don't escalate on caps and exclamation marks."),
             (502, "“…the interaction between your enterprise SLA", ["and the new EU data residency requirements”", "+ a calm tone"],
              0.15, 0.9, "gold", "Escalate", "Policy complexity, despite calm sentiment.")]
    for x, quote, more, tone, cx, col, verdict, why in cards:
        f.rect(x, 24, 454, 312, "card", "line", 1, 22)
        f.text("CUSTOMER", x + 24, 58, 12, MONO, "subtle")
        f.text(quote, x + 24, 88, 17, BOLD, "ink")
        for j, m in enumerate(more):
            f.text(m, x + 24, 112 + j * 24, 15.5 if not m.startswith("+") else 15, BOLD if not m.startswith("+") else BODY,
                   "ink" if not m.startswith("+") else "muted")
        meter(f, x + 24, 172, 300, "TONE", tone, "rust")
        meter(f, x + 24, 202, 300, "COMPLEXITY", cx, "gold")
        f.rect(x + 24, 246, 406, 66, "card2", col, 1.5, 16)
        f.text(verdict, x + 44, 274, 19, BOLD, "ink")
        f.text(why, x + 44, 298, 14, BODY, "muted")
    return f, "Sentiment is not complexity: an angry customer with a simple billing error is resolved; a calm question about SLA and EU data residency may need escalation."


def error_recovery(t):
    """domains/d5 Workflow termination + Subagent Error Recovery."""
    f = Fig(1100, 400, t)
    f.text("WRONG · ONE TIMEOUT ENDS EVERYTHING", 24, 40, 12, MONO, "rust")
    top = [("Get customer info", "success", "card", "line"), ("Search knowledge base", "timeout", "card", "line"),
           ("ABORT the entire workflow", "", "card", "rust")]
    for i, (a, b, fill, stroke) in enumerate(top):
        x = 24 + i * 268
        if i:
            f.arrow([(x - 40, 94), (x - 1, 94)], "rust" if i == 2 else "subtle")
        f.rect(x, 56, 228, 76, fill, stroke, 1.4 if stroke == "rust" else 1, 16)
        f.lines([(a, BOLD, "ink", 16)] + ([(b, MONO, "subtle", 12)] if b else []), x + 114, 94)
    f.text("RIGHT · RECOVER LOCALLY, PROPAGATE ONLY WHAT YOU CAN'T FIX", 24, 196, 12, MONO, "mosstext")
    steps = [("Subagent searches", "“return policy”"), ("Timeout", ""), ("Retry with backoff", "local recovery"),
             ("Success", "second attempt"), ("Return results", "to the coordinator")]
    w, gap = 180, 37
    for i, (a, b) in enumerate(steps):
        x = 24 + i * (w + gap)
        if i:
            f.arrow([(x - gap, 250), (x - 1, 250)], "gold" if i >= 3 else "subtle")
        last = i == 4
        f.rect(x, 212, w, 76, "card2" if last else "card", "gold" if last else ("moss" if i == 2 else "line"),
               1.5 if last or i == 2 else 1, 16)
        f.lines([(a, BOLD, "ink", 16)] + ([(b, BODY if i != 0 else BOLD, "muted", 13)] if b else []), x + w / 2, 250)
    f.text("No retry possible? Continue with partial results, note the gap, and offer alternatives.", 24, 336, 15, BODY, "muted")
    return f, "Error recovery: aborting the whole workflow on one timeout is wrong; a subagent retries locally with backoff and returns results to the coordinator."


def accuracy_breakdown(t):
    """domains/d5 Accuracy by Document Type. One series, direct labels, a dashed reference at the overall value."""
    f = Fig(900, 330, t)
    rows = [("Overall", 97.0, True), ("Standard invoices", 99.5, False), ("Foreign-language docs", 62.0, False),
            ("Handwritten notes", 45.0, False)]
    x0, x1 = 236, 790
    scale = lambda v: x0 + (x1 - x0) * v / 100
    ys = [48, 152, 202, 252]
    f.text("BY DOCUMENT TYPE", 24, 132, 11, MONO, "subtle")
    f.add(f'<path d="M24 112 L{x1 + 60} 112" stroke="{t["line"]}" stroke-width="1"/>')
    for (label, v, overall), y in zip(rows, ys):
        f.text(label, 24, y + 20, 16 if overall else 15, BOLD if overall else BODY, "ink" if overall else "muted")
        f.rect(x0, y + 4, x1 - x0, 24, "card", None, 0, 4)
        f.rect(x0, y + 4, scale(v) - x0, 24, "gold", None, 0, 4)
        f.text(f"{v:g}%", scale(v) + 10, y + 22, 15, BOLD, "ink")
    xr = scale(97)
    f.add(f'<path d="M{n(xr)} 140 L{n(xr)} 286" stroke="{t["muted"]}" stroke-width="1.4" stroke-dasharray="3 4"/>')
    f.text("overall 97%", xr, 304, 12, MONO, "subtle", "middle")
    return f, "Accuracy breakdown: 97% overall, but 99.5% on standard invoices, 62% on foreign-language documents and 45% on handwritten notes."


DIAGRAMS = {
    "agentic-loop": agentic_loop, "hub-and-spoke": hub_and_spoke, "refinement-loop": refinement_loop,
    "adaptive-decomposition": adaptive_decomposition, "mcp-architecture": mcp_architecture,
    "claude-md-hierarchy": claude_md_hierarchy, "explore-subagent": explore_subagent,
    "independent-review": independent_review, "sentiment-vs-complexity": sentiment_vs_complexity,
    "error-recovery": error_recovery, "accuracy-breakdown": accuracy_breakdown,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for key in sys.argv[1:] or DIAGRAMS:
        for theme, colors in THEMES.items():
            fig, label = DIAGRAMS[key](colors)
            (OUT / f"{key}-{theme}.svg").write_text(fig.svg(label))
        print(key)
