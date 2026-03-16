# Domain 1: Agentic Architecture & Orchestration (27%)

The heaviest domain on the exam. Covers 7 task statements focused on how agentic systems are built, how loops operate, how agents coordinate, and how enforcement works.

---

## 1.1 The Agentic Loop Lifecycle

At its core, an agentic system is a loop. Claude receives a prompt with tools, decides whether to call a tool or respond, and the loop continues until Claude signals it's done.

### How the Loop Works

```
User sends prompt with tool definitions
         ↓
    Claude responds
         ↓
  Check stop_reason
         ↓
┌─────────────────────────────────────┐
│ "tool_use"  → Execute tool          │
│              → Return tool_result   │
│              → Send next request    │
│              → Loop continues       │
│                                     │
│ "end_turn"  → Claude is done        │
│              → Present final text   │
│              → Loop ends            │
│                                     │
│ "pause_turn"→ Server-side sampling  │
│               hit 10-iteration cap  │
│              → Send response back   │
│              → Loop continues       │
│                                     │
│ "max_tokens"→ Hit token limit       │
│              → May need continuation│
└─────────────────────────────────────┘
```

### The `stop_reason` Values

| Value | Meaning | Action |
|-------|---------|--------|
| `"tool_use"` | Claude wants to call a tool | Execute it, return result, continue loop |
| `"end_turn"` | Claude has finished reasoning | Present the final text response |
| `"pause_turn"` | Server-side tool loop hit 10-iteration limit | Send response back to continue |
| `"max_tokens"` | Response hit the max_tokens limit | May need to request continuation |

### API Response Structure

When Claude wants to use a tool, the response contains both text and a tool_use block:

```json
{
  "id": "msg_01Aq9w938a90dw8q",
  "model": "claude-opus-4-6",
  "stop_reason": "tool_use",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "I'll check the current weather in San Francisco for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lq9",
      "name": "get_weather",
      "input": { "location": "San Francisco, CA", "unit": "celsius" }
    }
  ]
}
```

The `content` array can contain multiple blocks — Claude may explain what it's doing (text) and call a tool (tool_use) in the same response. It can also call multiple tools simultaneously by including multiple tool_use blocks.

### Returning Tool Results

Tool results must reference the exact `tool_use_id` from Claude's request:

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
      "content": "15 degrees celsius, partly cloudy"
    }
  ]
}
```

For multiple simultaneous tool calls, return multiple `tool_result` blocks in the same message, each matching its `tool_use_id`.

### Error Results

When a tool execution fails:

```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
  "is_error": true,
  "content": "API timeout after 30 seconds"
}
```

Setting `is_error: true` helps Claude understand the tool failed and reason about recovery strategies.

### Model-Driven Decision Making

The exam tests that you understand: **Claude decides** which tool to call and when to stop. You don't pre-configure decision trees or fixed tool sequences. The model reasons about what information it needs, selects the appropriate tool, processes the result, and decides the next step.

This is fundamentally different from traditional workflow automation where steps are predetermined.

### Anti-Patterns (These Are Wrong Answers)

1. **Parsing natural language** for loop termination — "If Claude says 'I'm done', exit the loop." Wrong. Always check `stop_reason`.
2. **Arbitrary iteration caps** as primary stopping — "Run max 5 loops then stop." Wrong as a primary mechanism. You may use safety caps, but `stop_reason` drives the loop.
3. **Checking for text content** as completion — "If the response has text, it's done." Wrong. Responses can contain both text and tool_use blocks.

---

## 1.2 Multi-Agent Orchestration

### Hub-and-Spoke Architecture

The standard pattern for multi-agent systems is hub-and-spoke: one coordinator agent manages multiple specialized subagents.

```
                    ┌──────────────┐
                    │  Coordinator │
                    │    Agent     │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ Subagent │   │ Subagent │   │ Subagent │
     │  Search  │   │ Analysis │   │ Synthesis│
     └──────────┘   └──────────┘   └──────────┘
```

### Coordinator Responsibilities

The coordinator:
- **Decomposes** the task into subtasks
- **Delegates** to appropriate subagents
- **Routes** all inter-subagent communication (subagents never talk to each other directly)
- **Aggregates** results from subagents
- **Handles errors** from subagent failures
- **Evaluates** synthesis quality and re-delegates if gaps exist

### Subagent Isolation

**Critical concept:** Subagents have isolated context. They do NOT inherit the coordinator's conversation history. Everything a subagent needs must be explicitly passed in its prompt.

This means:
- The coordinator must include all relevant context in the subagent's task description
- Subagents can't reference earlier parts of the main conversation
- Each subagent starts fresh with only what the coordinator provides

### Dynamic Subagent Selection

Not every query needs every subagent. The coordinator should:
- Assess what the query actually requires
- Only invoke relevant subagents
- Not route everything through a full pipeline

Example: A research query about a single topic doesn't need web search + document analysis + synthesis if a single focused search would suffice.

### Decomposition Risks

**Overly narrow decomposition:** The exam specifically tests this. Example scenario: coordinator is asked to research "creative industries" and decomposes it into only visual arts subtasks, missing music, writing, film, and design.

The fix: broader initial decomposition with explicit coverage checks.

### Iterative Refinement Loops

The coordinator evaluates synthesis output and identifies gaps:

```
Coordinator → Subagents (round 1)
         ↓
   Evaluate results
         ↓
   Identify gaps
         ↓
Coordinator → Subagents (round 2, targeted)
         ↓
   Final synthesis
```

---

## 1.3 Subagent Spawning and Context Passing

### The Task/Agent Tool

Subagents are spawned using the Task tool (or Agent tool in the SDK). The coordinator must have `"Task"` in its `allowedTools` to spawn subagents.

### Context Must Be Explicit

This is tested heavily: **context does not automatically inherit.** When the coordinator spawns a subagent, it must include everything the subagent needs in the prompt.

Bad:
```
"Analyze the customer's issue"
# Subagent has no idea who the customer is or what the issue is
```

Good:
```
"Customer #12345 reported that their order #67890 (placed 2024-01-15,
total $149.99) arrived damaged. They are requesting a full refund.
Analyze the order history and return policy applicability."
```

### Parallel Subagent Execution

To run subagents in parallel, emit multiple Task/Agent tool calls in a **single coordinator response**. Not across separate turns — that would be sequential.

```json
{
  "content": [
    {
      "type": "tool_use",
      "name": "Task",
      "input": { "prompt": "Search for recent papers on...", "subagent_type": "search" }
    },
    {
      "type": "tool_use",
      "name": "Task",
      "input": { "prompt": "Analyze the document at...", "subagent_type": "analysis" }
    }
  ]
}
```

### AgentDefinition in the SDK

```python
from claude_agent_sdk import AgentDefinition

agents = {
    "code-reviewer": AgentDefinition(
        description="Expert code reviewer for Python and TypeScript",
        prompt="Analyze code quality, identify bugs, suggest improvements.",
        tools=["Read", "Glob", "Grep"],
    ),
    "test-writer": AgentDefinition(
        description="Test generation specialist",
        prompt="Write comprehensive unit tests for the provided code.",
        tools=["Read", "Write", "Bash"],
    )
}
```

### fork_session

Creates independent branches from a shared analysis baseline. Useful when you want to explore divergent approaches from the same starting point without the branches influencing each other.

### Structured Context Passing

Best practice: separate content from metadata when passing context between agents.

```json
{
  "findings": [
    {
      "claim": "Revenue increased 15% YoY",
      "evidence": "Q4 earnings report, page 3",
      "source_url": "https://example.com/earnings",
      "document_name": "Q4 2024 Earnings Report",
      "publication_date": "2025-01-15"
    }
  ]
}
```

This preserves attribution and allows the receiving agent to evaluate source quality.

---

## 1.4 Workflow Enforcement and Handoff

### The Critical Distinction

This is one of the most heavily tested concepts on the exam:

| Enforcement Type | When to Use | Guarantee Level |
|-----------------|-------------|-----------------|
| **Programmatic** (hooks, prerequisites) | Financial/safety consequences | Deterministic — 100% enforced |
| **Prompt-based** (instructions) | Best-effort acceptable | Probabilistic — non-zero failure rate |

### Example: Financial Operations

Scenario: A customer support agent must verify identity before processing refunds.

**Wrong approach (prompt-based):**
```
"Always verify the customer's identity before processing any refund."
```
This will work most of the time, but has a non-zero failure rate. For financial operations, "most of the time" is not acceptable.

**Correct approach (programmatic):**
A PreToolUse hook on `process_refund` that checks whether `get_customer` has been called and returned a verified customer ID. If not, the hook blocks the refund with exit code 2.

### Handoff to Humans

When an agent escalates to a human, the human agent typically does NOT have access to the full conversation transcript. The handoff must include a structured summary:

```
Customer: Jane Doe (#12345)
Issue: Damaged product received
Order: #67890, $149.99, placed 2024-01-15
Root cause: Shipping damage
Actions taken: Verified order, confirmed damage via photos
Recommended action: Full refund + replacement shipment
Refund amount: $149.99
```

---

## 1.5 Agent SDK Hooks

### Hook Lifecycle

The complete lifecycle of events in a Claude Code session:

```
SessionStart
  → UserPromptSubmit
    → [Agentic Loop]:
        PreToolUse
          → PermissionRequest
            → PostToolUse / PostToolUseFailure
              → SubagentStart / SubagentStop
                → TaskCompleted
    → Stop
  → PostCompact
→ SessionEnd
```

### Hook Types

| Type | How It Works | Use Case |
|------|-------------|----------|
| `command` | Runs a shell command. Exit 0 = pass, exit 2 = block | File validation, linting gates |
| `http` | POST to a URL endpoint | External audit logging, webhooks |
| `prompt` | Single LLM call for yes/no decision | Context-dependent approval |
| `agent` | Multi-turn subagent with tool access | Complex compliance checks |

### PreToolUse Hooks

Intercept outgoing tool calls before execution. Can allow, deny, or modify.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": { "tool_name": "process_refund" },
        "hook": {
          "type": "command",
          "command": "check-refund-authorization.sh"
        }
      }
    ]
  }
}
```

**Decision control output:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Customer identity not yet verified",
    "additionalContext": "Call get_customer first to verify identity"
  }
}
```

The `permissionDecision` values:
- `"allow"` — Proceed with the tool call
- `"deny"` — Block the tool call, provide reason
- `"ask"` — Prompt the user for permission

### PostToolUse Hooks

Intercept tool results before Claude processes them. Useful for:
- Normalizing timestamps, date formats, status codes
- Scrubbing sensitive data from results
- Adding metadata to results

### Hook Configuration Locations

| Location | Scope | Shared? |
|----------|-------|---------|
| `~/.claude/settings.json` | All projects for this user | No (personal) |
| `.claude/settings.json` | This project | Yes (version control) |
| `.claude/settings.local.json` | This project, this machine | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin-managed) |

---

## 1.6 Task Decomposition Strategies

### Prompt Chaining (Fixed Sequential)

For predictable, multi-aspect tasks where you know the steps upfront:

```
Step 1: Analyze each file individually (local analysis)
Step 2: Cross-file integration pass (data flow, consistency)
Step 3: Generate final report
```

Each step's output feeds into the next. The sequence is predetermined.

### Dynamic Adaptive Decomposition

For open-ended investigation where subtasks emerge from discoveries:

```
Initial query: "Why is the app slow?"
  → Profile CPU usage
    → Discovery: database queries are the bottleneck
      → Analyze query patterns
        → Discovery: N+1 queries in the user listing endpoint
          → Generate fix for specific queries
```

The subtasks are generated based on what each step reveals.

### Multi-Pass Review Architecture

For code review of large PRs:

**Pass 1 — Per-file local analysis:**
- Each file reviewed independently
- Consistent depth across all files
- Catches local issues (bugs, style, types)

**Pass 2 — Cross-file integration:**
- Separate pass looking at how files interact
- Catches data flow issues, interface mismatches, cross-file consistency
- Different prompt focused on integration concerns

**Why two passes?** Single-pass review of large PRs leads to:
- Attention dilution (model focuses on early files, skimps on later ones)
- Contradictory findings (inconsistent standards across files)
- Missed integration issues (can't see cross-file problems when reviewing one file)

---

## 1.7 Session Management

### Resuming Sessions

`--resume <session-name>` continues a named prior conversation with full context.

**When to resume:**
- Ongoing investigation where tool results are still valid
- Iterative development within the same session

**When to start fresh:**
- Tool results are stale (files changed, services restarted)
- Context has drifted too far from current task
- In these cases, pass a structured summary of prior findings rather than resuming

### fork_session

Creates independent branches from a shared analysis baseline. Each branch can explore a different approach without contaminating the others.

**Use case:** Testing two different refactoring strategies from the same starting point.

### Informing Resumed Sessions

When resuming a session after file changes, you must explicitly tell Claude what changed:

```
"Since our last session, I've updated auth.py to use JWT tokens instead of
session cookies. Please re-analyze the authentication flow with these changes."
```

Don't assume the resumed session will notice changes on its own — tool results from the previous session may reflect old file contents.

---

## Domain 1 Practice Questions

**Q1:** An agentic loop is processing customer requests. After Claude responds, what should the system check to determine the next action?
- A) Whether the response contains text content
- B) The `stop_reason` field in the response
- C) The length of the response
- D) Whether Claude expressed confidence in its answer

**Answer: B** — The `stop_reason` field determines whether to continue the loop (`tool_use`), end it (`end_turn`), or handle edge cases (`pause_turn`, `max_tokens`).

**Q2:** A coordinator agent needs to pass customer information to a subagent. What is the correct approach?
- A) The subagent will automatically inherit the coordinator's conversation context
- B) Include all relevant customer information explicitly in the subagent's prompt
- C) Store the information in a shared database that both agents access
- D) Use environment variables to pass the context

**Answer: B** — Subagents have isolated context and do not inherit the coordinator's conversation. Context must be explicitly passed in the prompt.

**Q3:** A financial services application needs to ensure identity verification occurs before any refund processing. Which enforcement mechanism should be used?
- A) Add instructions to the system prompt requiring verification first
- B) Use a PreToolUse hook that blocks `process_refund` until verification is complete
- C) Train the model on examples where verification comes first
- D) Set a high temperature to encourage creative verification approaches

**Answer: B** — Financial operations require deterministic, programmatic enforcement. Prompt-based instructions have a non-zero failure rate and are inappropriate for financial/safety-critical workflows.
