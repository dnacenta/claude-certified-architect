# Domain 3: Claude Code Configuration & Workflows (20%)

Covers CLAUDE.md hierarchy and loading, custom commands and skills, path-specific rules, plan mode vs direct execution, iterative refinement, and CI/CD integration.

---

## 3.0 Surfaces: Where Claude Code Runs

Claude Code is no longer just a CLI. Every surface connects to the **same engine**, so CLAUDE.md files, settings, skills, and MCP servers work identically across all of them — which is the architecturally relevant point: configuration is portable, and so is a session.

| Surface | What it is | Install / entry point |
|---------|-----------|----------------------|
| **Terminal** | Full-featured CLI | `curl -fsSL https://claude.ai/install.sh \| bash`, then `claude` |
| **VS Code / Cursor** | Extension with inline diffs, @-mentions, plan review | Extensions marketplace |
| **JetBrains** | Plugin for IntelliJ, PyCharm, WebStorm (requires the CLI) | JetBrains Marketplace |
| **Desktop app** | Standalone app: visual diffs, parallel sessions, scheduled tasks, cloud sessions | macOS / Windows download |
| **Web** | Browser sessions with no local setup; long-running tasks on repos you don't have locally | [claude.ai/code](https://claude.ai/code) |
| **Mobile** | iOS / Android app for the same cloud sessions | Claude app |

### Session Portability

| Goal | Mechanism |
|------|-----------|
| Start locally, finish in the cloud | `claude --cloud "<task>"` |
| Pull a web/cloud session into the terminal | `claude --teleport` |
| Hand the current terminal session to the desktop app | `/desktop` |
| Drive a running local session from a phone or another browser | Remote Control |
| Push external events (Telegram, Discord, iMessage, webhooks) into a session | Channels |
| Route work from team chat | `@Claude` in Slack |

### Scheduling

Three distinct mechanisms — the exam-relevant distinction is *where they run*:

| Mechanism | Runs | Use for |
|-----------|------|---------|
| **Routines** (`/schedule`, web, or desktop) | In the cloud — keeps running with your machine off; can also trigger on API calls or GitHub events | Morning PR reviews, overnight CI failure analysis, weekly dependency audits |
| **Desktop scheduled tasks** | On your machine, with local file and tool access | Anything that needs the local filesystem or private network |
| **`/loop`** | Inside the current CLI session | Quick polling within one sitting |

---

## 3.1 CLAUDE.md Hierarchy

### What is CLAUDE.md?

CLAUDE.md files are instruction files that tell Claude Code how to behave in a specific context. They're like `.editorconfig` or `.eslintrc` but for an AI agent — defining coding standards, project conventions, tool restrictions, and workflow rules.

### Loading Order (Broader → More Specific)

Claude Code loads CLAUDE.md files in a hierarchy. More specific files override broader ones:

```
1. Managed Policy (org-wide, admin-controlled)
   └── /etc/claude-code/CLAUDE.md                           (Linux, WSL)
   └── /Library/Application Support/ClaudeCode/CLAUDE.md    (macOS)
   └── C:\Program Files\ClaudeCode\CLAUDE.md                (Windows)

2. User-Level (personal, NOT version-controlled)
   └── ~/.claude/CLAUDE.md

3. Project-Level (shared via version control)
   └── ./CLAUDE.md  or  ./.claude/CLAUDE.md

4. Local project (personal, gitignored)
   └── ./CLAUDE.local.md

5. Directory-Level (loaded on demand)
   └── ./src/api/CLAUDE.md (loaded when Claude reads files in src/api/)
   └── ./tests/CLAUDE.md (loaded when Claude reads files in tests/)
```

**Key distinction:** Project-level CLAUDE.md is committed to git and shared with the team. User-level is personal and local. `CLAUDE.local.md` is personal per project (gitignore it). Directory-level loads dynamically when Claude works in that directory.

### AGENTS.md Interop

During normal sessions Claude Code reads `CLAUDE.md`, **not** `AGENTS.md` — though `/init` does read an existing `AGENTS.md` when scaffolding. If your repo already uses `AGENTS.md` for other coding agents, keep one source of truth by importing it:

```markdown
# CLAUDE.md
@AGENTS.md

## Claude-specific overrides
Use plan mode for changes under `src/billing/`.
```

### @import Syntax

CLAUDE.md files can import other files for modular configuration:

```markdown
# Project Configuration

@docs/coding-standards.md
@docs/api-conventions.md
@~/.claude/my-personal-preferences.md

See @README.md for project overview.
```

**Resolution rules:**
- Relative paths resolve relative to the file containing the import
- `@~/` resolves to the user's home directory
- Maximum import depth: 5 hops (to prevent circular imports)
- Imported files can themselves contain @imports (up to depth limit)

### .claude/rules/ Directory

For topic-specific rules organized as separate files:

```
.claude/
  rules/
    testing.md       — Testing conventions
    api-design.md    — API endpoint patterns
    security.md      — Security requirements
    typescript.md    — TypeScript-specific rules
```

**Without frontmatter:** Rules load unconditionally at session start.
**With frontmatter:** Rules load conditionally based on file paths.

### Auto Memory

Claude Code maintains automatic memory at:
```
~/.claude/projects/<project>/memory/MEMORY.md
```

- **First 200 lines OR 25 KB** (whichever comes first) loaded at session start
- Machine-local (not version controlled)
- All worktrees in the same git repo share one memory directory
- Claude writes notes here automatically about project patterns, decisions, preferences
- Requires Claude Code v2.1.59 or later
- `autoMemoryEnabled: false` disables it; `autoMemoryDirectory` relocates it
- Topic files (e.g., `debugging.md`, `api-conventions.md`) alongside `MEMORY.md` are loaded on demand — the 200-line cap applies only to `MEMORY.md` itself
- Subagents can maintain their own auto memory

### Monorepo and Multi-Directory Controls

| Setting / flag | Purpose |
|----------------|---------|
| `claudeMdExcludes` (in settings) | Glob-list of CLAUDE.md files to skip — useful when another team's nested CLAUDE.md would otherwise load |
| `--add-dir <path>` | Grant Claude access to additional working directories |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` | Also load CLAUDE.md / rules from `--add-dir` paths |
| `CLAUDE_CODE_NEW_INIT=1` | Interactive multi-phase `/init` that scaffolds CLAUDE.md, skills, and hooks |

---

## 3.2 Skills (and Legacy Slash Commands)

> **Major change (2026):** Custom slash commands have been **merged into skills**. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and behave the same way. The old `/project:name` and `/user:name` namespacing is gone — commands are just `/name`, and higher-priority locations win when names collide.

### Skill Locations (Priority: Enterprise > Personal > Project > Plugin)

| Location | Path | Applies to |
|----------|------|------------|
| Enterprise | Managed settings path | All users in the org |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project only |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where the plugin is enabled (namespaced `plugin-name:skill-name`) |

Legacy `.claude/commands/*.md` still works and supports the same frontmatter — but skills add a directory for supporting files, dynamic context injection, and subagent execution. When a skill and a command share a name, the skill wins. Claude Code skills follow the open [Agent Skills](https://agentskills.io) standard.

### Example SKILL.md

```yaml
---
name: deploy
description: Deploy the application to a specified environment
context: fork
agent: Explore
allowed-tools: Bash(git *) Bash(npm run deploy *)
argument-hint: [environment]
disable-model-invocation: true
---

# Deploy Skill

Deploy the application to $ARGUMENTS.

1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

### Frontmatter Reference (Current)

| Field | Purpose |
|-------|---------|
| `name` | `/slash-command` name (defaults to directory name; lowercase, digits, hyphens, max 64 chars) |
| `description` | When to use the skill — Claude uses this to decide whether to auto-load. Capped at 1,536 chars combined with `when_to_use` |
| `when_to_use` | Additional trigger phrases / example requests, appended to `description` |
| `argument-hint` | Hint shown in autocomplete, e.g. `[issue-number]` |
| `arguments` | Named positional arguments for `$name` substitution |
| `disable-model-invocation` | `true` → only the user can invoke via `/name`; Claude can't auto-trigger |
| `user-invocable` | `false` → hidden from `/` menu; Claude can still invoke (background knowledge) |
| `allowed-tools` | Tools pre-approved while this skill is active |
| `model` | Model override for this skill's turn |
| `effort` | `low` / `medium` / `high` / `xhigh` / `max` — effort-level override |
| `context` | `fork` runs the skill in an isolated subagent |
| `agent` | Which subagent type executes when `context: fork` (e.g. `Explore`, `Plan`, `general-purpose`) |
| `hooks` | Hooks scoped to this skill's lifecycle |
| `paths` | Glob patterns — auto-load only when working with matching files |
| `shell` | `bash` (default) or `powershell` for inline command injection |

### Substitution Variables

| Variable | Resolves To |
|----------|-------------|
| `$ARGUMENTS` | Full argument string passed by the user |
| `$ARGUMENTS[N]` / `$N` | 0-indexed positional argument (`$0`, `$1`, …) |
| `$name` | Named argument declared in `arguments:` frontmatter |
| `${CLAUDE_SESSION_ID}` | Current session identifier |
| `${CLAUDE_SKILL_DIR}` | Directory containing the SKILL.md file |

### Dynamic Context Injection

Skills can preprocess shell output and file contents before Claude sees them:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## PR context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

`` !`cmd` `` runs the command *before* the skill body is sent. Multi-line blocks use ```` ```! ````. File inclusion with `@path` also works. Disable globally with `"disableSkillShellExecution": true`.

### Context Isolation (`context: fork`)

- Spawns the skill as a subagent with its own context
- The `agent:` field picks the execution environment (built-in `Explore`, `Plan`, `general-purpose`, or a custom `.claude/agents/*` subagent)
- CLAUDE.md still loads; main conversation history does not
- Useful for noisy operations (deep research, deployments) that would pollute the main context

### Skill Lifecycle and Compaction

When invoked, a skill's rendered body enters the conversation as a single message and stays there. Claude Code does **not** re-read the file on later turns — write standing instructions, not one-time steps. Auto-compaction re-attaches the most recently invoked skills (first 5 000 tokens of each, 25 000-token combined budget), dropping older ones if you used many.

### Bundled Skills

Claude Code ships with a set of bundled skills that varies by release. Recent versions include:
- `/claude-api` — Build and migrate Claude API / Anthropic SDK apps
- `/code-review` — Multi-agent review of pending changes or a PR (`ultra` runs it in the cloud)
- `/security-review` — Security review of the pending changes on the branch
- `/simplify` — Reuse / simplification / efficiency cleanups on changed code
- `/dataviz` — Charts and dashboards with consistent design
- `/design` — Multi-artboard visual design canvas
- `/init` — Scaffold a CLAUDE.md for the codebase
- `/run` — Launch the project's app to confirm a change works
- `/loop` — Run a prompt or slash command on a recurring interval
- `/schedule` — Create and manage cloud routines
- `/update-config` — Configure settings.json, hooks, and permissions
- `/fewer-permission-prompts` — Build a permission allowlist from your usage
- `/doctor` — Diagnose Claude Code setup problems

Check `/help` in your installed version (or the commands page in the docs) for the current list — the set changes release to release.

### Plugins

A **plugin** is a distributable bundle of skills, subagents, hooks, and MCP servers, installed from a marketplace and enabled per project. Plugin-provided items are namespaced (`plugin-name:skill-name` for skills, `plugin:<plugin>:<server>` for MCP servers) so they can't collide with your own. Plugins sit at the lowest priority in the skill resolution order (Enterprise > Personal > Project > Plugin).

Plugins are also the unit that `claude plugin eval` tests: you write an eval suite against the plugin's skills and run it in a sandbox or in CI, and it emits a JSON report. That is the packaging answer to "how does a team ship and regression-test its Claude Code conventions?"

---

## 3.3 Path-Specific Rules

### Conditional Rule Loading

Rules in `.claude/rules/` can specify which files they apply to using glob patterns in YAML frontmatter:

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "src/api/**/*.test.ts"
---

# API Development Rules

All API endpoints must:
- Use Zod for request validation
- Return standardized error responses
- Include rate limiting middleware
- Have corresponding integration tests
```

```yaml
---
paths:
  - "**/*.test.tsx"
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# Testing Conventions

- Use React Testing Library, not Enzyme
- Test behavior, not implementation
- Mock external APIs, not internal modules
- Each test file must have a describe block matching the component/function name
```

### When Path-Specific Rules Beat Directory CLAUDE.md

**Scenario:** Testing conventions that apply to test files scattered throughout the entire codebase.

**Directory CLAUDE.md approach:**
```
src/
  components/
    CLAUDE.md  ← Would need testing rules here
    Button.test.tsx
  api/
    CLAUDE.md  ← And here
    users.test.ts
  utils/
    CLAUDE.md  ← And here
    format.test.ts
```

**Path-specific rules approach:**
```
.claude/
  rules/
    testing.md  ← One file with paths: ["**/*.test.*"]
```

The rules approach is superior because:
- Single source of truth for testing conventions
- Applies everywhere test files exist, even new directories
- No need to duplicate CLAUDE.md files across directories

---

## 3.4 Plan Mode vs Direct Execution

### Permission Modes (Current)

Plan mode is now one entry in a broader permission-mode system. Start in a specific mode with `--permission-mode <mode>`, or cycle modes with **Shift+Tab** in an interactive session.

| Mode | Behavior |
|------|----------|
| `default` | Standard permission prompts |
| `acceptEdits` | Auto-accept file edits; still prompt for other tools |
| `plan` | Exploration-only: Claude designs an approach and presents it before touching files |
| `auto` | Classifier decides per-tool whether to prompt — see `claude auto-mode defaults` |
| `dontAsk` | Never prompt for the pre-approved list |
| `bypassPermissions` | Skip all prompts (dangerous; use only for short, contained tasks) |

### When to Use Plan Mode

| Indicator | Example |
|-----------|---------|
| Multi-file changes | Refactoring auth across 15 files |
| Architectural decisions | Choosing between REST and GraphQL |
| Multiple valid approaches | Several ways to implement caching |
| Large scope | Library migration affecting 45+ files |
| Unclear requirements | "Make the app faster" — needs investigation first |

In plan mode, Claude:
1. Explores the codebase (Glob, Grep, Read)
2. Identifies affected files and patterns
3. Designs an approach
4. Presents the plan for approval
5. Only implements after user approval

### When to Use Direct Execution

| Indicator | Example |
|-----------|---------|
| Single-file fix | Bug fix with clear stack trace |
| Obvious scope | Adding a null check |
| Clear instructions | "Add a `createdAt` field to the User model" |
| Small, contained | Fixing a typo, updating a constant |

### Built-in Subagents

Four subagents ship with Claude Code and are registered by default in interactive sessions:

| Agent | Purpose | Tools |
|-------|---------|-------|
| **Explore** | Fast file discovery and codebase search | Read-only; skips CLAUDE.md and git status |
| **Plan** | Research for plan mode before proposing changes | Read-only; skips CLAUDE.md and git status |
| **general-purpose** | Multi-step tasks needing exploration *and* action | All subagent tools |
| **claude** | Catch-all fallback | All subagent tools |

The Explore agent is the canonical context-preservation move:

```
Main conversation context is preserved
     ↓
Explore subagent runs (Glob, Grep, Read — lots of output)
     ↓
Returns concise summary to main conversation
     ↓
Main context stays clean
```

Without it, a deep codebase exploration would fill the main context window with raw file contents and search results.

### Custom Subagents (`.claude/agents/`)

Custom subagents are markdown files with YAML frontmatter, resolved in the order: managed settings > `--agents` CLI JSON > project (`.claude/agents/`) > user (`~/.claude/agents/`) > plugin.

```yaml
---
name: db-reader
description: Execute read-only database queries        # how Claude decides to delegate
tools: Read, Grep, Bash                                # allowlist
disallowedTools: Write, Edit                           # denylist, applied after `tools`
model: sonnet                                          # inherit | sonnet | opus | haiku | full ID
effort: low                                            # low | medium | high | xhigh | max
permissionMode: plan                                   # default | acceptEdits | auto | dontAsk | bypassPermissions | plan
maxTurns: 10
skills: [api-conventions]                              # preloaded skill content
mcpServers: [github]
memory: project                                        # user | project | local — persistent across sessions
isolation: worktree                                    # run in its own git worktree
background: false
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: ./scripts/validate-readonly-query.sh
---

Execute SELECT queries only. Never issue writes.
```

**Three ways to invoke:** name it in natural language ("use the db-reader to…"), `@`-mention it to guarantee that specific agent runs, or start a whole session as it with `claude --agent db-reader`.

**What a fresh subagent loads:** its own system prompt, the delegation prompt, the CLAUDE.md hierarchy, a git status snapshot, preloaded skills, and environment details. **What stays out:** your conversation history, the main session's auto memory, and other subagents' results — which is exactly the "context does not inherit" rule from Domain 1 §1.3.

**Constraints worth remembering:** permission modes flow *down* — if the parent runs `bypassPermissions`, `acceptEdits`, or `auto`, the subagent inherits it and cannot override. Subagents nest 3 deep by default and 20 can run concurrently. Completed subagents can be resumed by ID or name via `SendMessage`, retaining their prior context; one-shot agents (Explore, Plan) cannot be resumed.

**Prompt-injection note:** Claude Code scans subagent reports for instruction-shaped patterns before the parent reads them, escaping text that imitates harness output. It's a mitigation, not a permission boundary — every tool call still goes through the session's permission checks.

### Combining Modes

Plan mode for investigation → Direct execution for implementation:

```
1. Enter plan mode
2. Explore the codebase
3. Design the approach
4. Present plan to user
5. User approves
6. Exit plan mode
7. Implement directly, file by file
```

---

## 3.5 Iterative Refinement Techniques

### 1. Concrete Examples

When prose instructions produce inconsistent results, provide 2-3 input/output examples:

```
Instead of: "Format dates consistently"

Use: "Format dates as YYYY-MM-DD. Examples:
  Input: 'January 5th, 2024' → Output: '2024-01-05'
  Input: '12/31/23' → Output: '2023-12-31'
  Input: 'Mar 2024' → Output: '2024-03-01'"
```

### 2. TDD Iteration

Write tests first, then iterate by sharing test failures:

```
1. Write the test: expect(validateEmail("bad")).toBe(false)
2. Run tests → FAIL
3. Share failure with Claude
4. Claude fixes the implementation
5. Run tests → PASS or new failures
6. Repeat until green
```

### 3. Interview Pattern

Claude asks clarifying questions before implementing:

```
User: "Add authentication to the app"
Claude: "Before I implement, a few questions:
  - JWT or session-based?
  - Do you need refresh tokens?
  - What's the session duration?
  - Should I add role-based access control?"
```

### 4. Multiple vs Independent Issues

**Multiple interacting issues:** Address in a single message because fixes may conflict.

```
"The auth middleware has two issues:
1. It doesn't check token expiry
2. It returns 500 instead of 401 for invalid tokens
Fix both together."
```

**Independent issues:** Fix sequentially to keep each change clean and reviewable.

---

## 3.6 CI/CD Integration

### CLI Flags for CI

| Flag | Purpose | Critical? |
|------|---------|-----------|
| `-p` / `--print` | Non-interactive mode | **MUST use in CI** or the process hangs waiting for input |
| `--output-format` | `text`, `json`, or `stream-json` for machine-parseable output | Needed for downstream processing |
| `--input-format stream-json` | Stream input events back into the agent | For pipeline composition |
| `--json-schema '{...}'` | Validate final output against a JSON Schema (print mode only) | Enforces CI output shape |
| `--max-turns N` | Hard cap on agentic turns; exits with error if hit | Guardrail |
| `--max-budget-usd X` | Stop once API spend hits $X (print mode only) | Cost guardrail |
| `--bare` | Skip auto-discovery (hooks, skills, plugins, MCP, auto memory, CLAUDE.md) — fast scripted starts | Low-overhead scripted calls |
| `--no-session-persistence` | Don't save the session to disk | Ephemeral CI runs |
| `--fallback-model sonnet` | Auto-fall back when the primary model is overloaded | Reliability |
| `--include-hook-events` | Emit all hook lifecycle events into the stream | Observability |
| `--include-partial-messages` | Emit partial streaming events | Debugging |
| `--permission-mode <mode>` | Start in `default` / `acceptEdits` / `plan` / `auto` / `dontAsk` / `bypassPermissions` | See §3.4 |
| `--permission-prompt-tool <mcp>` | Delegate permission prompts to an MCP tool in headless mode | Non-interactive approvals |
| `--session-id`, `--resume`, `--continue`, `--fork-session` | Session lifecycle control | Multi-step pipelines |
| `--setting-sources user,project,local` | Restrict which settings layers are loaded | Reproducible runs |
| `--effort <level>` | `low` / `medium` / `high` / `xhigh` / `max` / `ultracode` | Tune cost vs quality per run |
| `--agent <name>` / `--agents '<json>'` | Run the session as a named subagent, or define subagents inline | Specialized CI jobs |
| `--append-subagent-system-prompt` | Append text to every subagent's prompt (non-interactive only) | Consistent citation/format rules |
| `--forward-subagent-text` | Emit subagent messages into the stream | Observability across delegated work |
| `--system-prompt` / `--system-prompt-file` / `--append-system-prompt` | Replace or extend the system prompt | Purpose-built CI personas |
| `--exclude-dynamic-system-prompt-sections` | Move per-machine sections out of the system prompt | Prompt-cache reuse across runners |
| `--strict-mcp-config` | Use only the servers from `--mcp-config` | Hermetic MCP surface |
| `--init` / `--init-only` | Run Setup / SessionStart hooks (and exit) | Warm a CI workspace before the real run |
| `--bg` / `--background` + `--exec` | Start as a background agent; run a shell command as a background job | Long tasks that shouldn't block |
| `--environment ccpool_*` / `--ref` | Target a self-hosted environment; check out a named ref | Fleet / remote execution |
| `--betas` | Send beta headers with API requests | Opt into preview features |

### Example CI Usage

```yaml
# GitHub Actions example
- name: Code Review
  run: |
    claude -p "Review this PR for bugs and security issues" \
      --output-format json \
      --json-schema '{"type":"object","properties":{"issues":{"type":"array"}}}'
```

### Managed CI Integrations

You don't always wire the CLI up by hand:

| Integration | What it does |
|-------------|--------------|
| **GitHub Actions** | Run Claude Code in a workflow — PR review, issue triage, `@claude` mentions |
| **GitLab CI/CD** | Same model on GitLab pipelines |
| **GitHub Code Review** | Automatic review on every PR, no workflow file to maintain |
| **Routines** | Cloud-scheduled runs that can also fire on GitHub events or API calls |

The `-p` + `--output-format json` pattern below is still the right primitive when you need full control; these integrations are the managed path.

### Message Batches API

For non-blocking, cost-optimized batch operations:

| Feature | Detail |
|---------|--------|
| Cost savings | 50% compared to synchronous API |
| Processing window | Up to 24 hours, no latency SLA |
| Correlation | `custom_id` per request for matching responses — results arrive in **any order**, so key by `custom_id`, never by position |
| Multi-turn | NOT supported within a single batch request |
| Extended output | Up to 300k output tokens on Opus 5 / 4.8 / 4.7 / 4.6 and Sonnet 5 / 4.6 with beta header `output-300k-2026-03-24` (vs 128k synchronous) |

**Good for:**
- Overnight code analysis reports
- Weekly audit summaries
- Nightly test generation
- Batch document processing

**NOT good for:**
- Pre-merge checks (blocking, needs immediate response)
- Real-time user interactions
- Anything requiring tool calling loops within a single request

### Handling Batch Failures

```python
# Process batch results
for result in batch_results:
    if result.status == "failed":
        failed_ids.append(result.custom_id)

# Resubmit only failures
resubmit_batch = [r for r in original_requests if r.custom_id in failed_ids]
```

### Session Context Isolation for Reviews

**Problem:** The same Claude session that wrote code is less effective at reviewing it because it retains the reasoning context (it already "knows" why it made each decision, making it less likely to question them).

**Solution:** Use independent review instances that don't have the generation context.

```
Generation session: Claude writes the code
                          ↓
               (new session, no shared context)
                          ↓
Review session: Claude reviews the code fresh
```

---

## Domain 3 Practice Questions

**Q1:** A team wants testing conventions to apply to all `*.test.ts` files throughout their codebase, which has tests scattered across many directories. What is the most maintainable approach?
- A) Add a CLAUDE.md in every directory that contains test files
- B) Create a single rule file in `.claude/rules/` with `paths: ["**/*.test.ts"]` frontmatter
- C) Add testing rules to the project-level CLAUDE.md
- D) Create a `tests/` directory and put all tests there with a CLAUDE.md

**Answer: B** — Path-specific rules in `.claude/rules/` are superior to directory-level CLAUDE.md when conventions span multiple directories. A single rule file with glob patterns covers all matching files without duplication.

**Q2:** When should Claude Code use plan mode instead of direct execution?
- A) When fixing a single bug with a clear stack trace
- B) When migrating a library that affects 45+ files across the project
- C) When adding a null check to a function
- D) When updating a configuration constant

**Answer: B** — Plan mode is for multi-file changes with architectural implications and multiple valid approaches. A library migration affecting 45+ files clearly fits. The other options are small, obvious-scope changes suited for direct execution.

**Q3:** A CI pipeline needs to run Claude Code for automated code review. Which flag is essential?
- A) `--verbose`
- B) `-p` / `--print`
- C) `--force`
- D) `--no-cache`

**Answer: B** — The `-p`/`--print` flag enables non-interactive mode, which is mandatory in CI. Without it, Claude Code hangs waiting for user input. Pair it with `--output-format json` (or `stream-json`) and `--max-turns` / `--max-budget-usd` for production-grade guardrails.
