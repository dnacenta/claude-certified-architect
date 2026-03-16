# Domain 3: Claude Code Configuration & Workflows (20%)

Covers CLAUDE.md hierarchy and loading, custom commands and skills, path-specific rules, plan mode vs direct execution, iterative refinement, and CI/CD integration.

---

## 3.1 CLAUDE.md Hierarchy

### What is CLAUDE.md?

CLAUDE.md files are instruction files that tell Claude Code how to behave in a specific context. They're like `.editorconfig` or `.eslintrc` but for an AI agent — defining coding standards, project conventions, tool restrictions, and workflow rules.

### Loading Order (Broader → More Specific)

Claude Code loads CLAUDE.md files in a hierarchy. More specific files override broader ones:

```
1. Managed Policy (org-wide, admin-controlled)
   └── /etc/claude-code/CLAUDE.md (Linux)
   └── /Library/Application Support/ClaudeCode/CLAUDE.md (macOS)

2. User-Level (personal, NOT version-controlled)
   └── ~/.claude/CLAUDE.md

3. Project-Level (shared via version control)
   └── ./CLAUDE.md  or  ./.claude/CLAUDE.md

4. Directory-Level (loaded on demand)
   └── ./src/api/CLAUDE.md (loaded when Claude reads files in src/api/)
   └── ./tests/CLAUDE.md (loaded when Claude reads files in tests/)
```

**Key distinction:** Project-level CLAUDE.md is committed to git and shared with the team. User-level is personal and local. Directory-level loads dynamically when Claude works in that directory.

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

- First 200 lines loaded at session start
- Machine-local (not version controlled)
- All worktrees in the same git repo share one memory directory
- Claude writes notes here automatically about project patterns, decisions, preferences

---

## 3.2 Custom Slash Commands and Skills

### Commands

Simple reusable prompts stored as markdown files.

**Project commands (shared):**
```
.claude/commands/
  review.md      → /project:review
  deploy.md      → /project:deploy
  test.md        → /project:test
```

**Personal commands (local):**
```
~/.claude/commands/
  my-lint.md     → /user:my-lint
  quick-fix.md   → /user:quick-fix
```

### Skills

More powerful than commands. Skills are structured with YAML frontmatter and support isolation, tool restrictions, and argument handling.

**Location:** `.claude/skills/<skill-name>/SKILL.md`

**Example:**
```yaml
---
name: deploy
description: Deploy the application to a specified environment
context: fork
allowed-tools: Bash, Read
argument-hint: [environment]
disable-model-invocation: true
user-invocable: true
---

# Deploy Skill

Deploy the application to the specified environment: $ARGUMENTS

1. Read the deployment config for the target environment
2. Run pre-deployment checks
3. Execute the deployment script
4. Verify the deployment succeeded
```

### Frontmatter Options

| Option | Values | Purpose |
|--------|--------|---------|
| `context` | `fork` / (default: main) | `fork` runs in isolated subagent context, preventing pollution of main conversation |
| `allowed-tools` | Tool names | Restrict which tools the skill can use |
| `argument-hint` | String | Prompt text showing what arguments are expected |
| `disable-model-invocation` | `true`/`false` | If true, only manual `/skill-name` invocation works. Claude won't auto-trigger it. |
| `user-invocable` | `true`/`false` | If false, only Claude can invoke (background knowledge, not a user command) |

### Substitution Variables

| Variable | Resolves To |
|----------|-------------|
| `$ARGUMENTS` | Full argument string passed by the user |
| `$ARGUMENTS[0]`, `$ARGUMENTS[1]` | Individual arguments |
| `$0` | Alias for full arguments |
| `${CLAUDE_SESSION_ID}` | Current session identifier |
| `${CLAUDE_SKILL_DIR}` | Directory containing the SKILL.md file |

### Context Isolation (`context: fork`)

When a skill runs with `context: fork`:
- It spawns as a subagent with its own context
- It can't see or pollute the main conversation
- Results are returned to the main conversation when the skill completes
- Useful for noisy operations (deployments, large searches) that would clutter the main context

### Bundled Skills

Claude Code ships with built-in skills:
- `/batch` — Process multiple items
- `/claude-api` — Work with the Claude API
- `/debug` — Debug issues
- `/loop` — Iterative refinement
- `/simplify` — Simplify code

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

### Explore Subagent

For codebase exploration that generates verbose output:

```
Main conversation context is preserved
     ↓
Explore subagent runs (Glob, Grep, Read — lots of output)
     ↓
Returns concise summary to main conversation
     ↓
Main context stays clean
```

Without the explore subagent, a deep codebase exploration would fill the main context window with raw file contents and search results.

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
| `--output-format json` | Machine-parseable output | Needed for downstream processing |
| `--json-schema` | Enforce specific output structure | Ensures consistent CI output |

### Example CI Usage

```yaml
# GitHub Actions example
- name: Code Review
  run: |
    claude -p "Review this PR for bugs and security issues" \
      --output-format json \
      --json-schema '{"type":"object","properties":{"issues":{"type":"array"}}}'
```

### Message Batches API

For non-blocking, cost-optimized batch operations:

| Feature | Detail |
|---------|--------|
| Cost savings | 50% compared to synchronous API |
| Processing window | Up to 24 hours, no latency SLA |
| Correlation | `custom_id` per request for matching responses |
| Multi-turn | NOT supported within a single batch request |

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

**Answer: B** — The `-p`/`--print` flag enables non-interactive mode, which is mandatory in CI. Without it, Claude Code hangs waiting for user input.
