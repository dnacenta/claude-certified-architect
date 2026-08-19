# Domain 5: Context Management & Reliability (15%)

Covers conversation context management, escalation patterns, error propagation, large codebase context strategies, human review workflows, and information provenance.

---

## 5.1 Conversation Context Management

### The Context Window Is Finite

Claude has a limited context window. Every message, tool result, and system prompt consumes tokens. Long conversations degrade as earlier information gets compressed or lost.

Current sizes, because "1M tokens" changes the shape of the problem without eliminating it:

| Model | Context window | Max output |
|-------|----------------|-----------|
| Claude Fable 5 / Opus 5 / Sonnet 5 | 1M tokens | 128k |
| Claude Opus 4.8 / 4.7 / 4.6, Sonnet 4.6 | 1M tokens | 128k |
| Claude Haiku 4.5 | 200k tokens | 64k |

Two traps that come with a 1M window:

1. **A bigger window is not free.** Every token in it is billed on every turn, and the "lost in the middle" effect below gets *worse* with length, not better. Filling a 1M window because you can is a cost and a quality regression.
2. **Token counts changed.** Opus 4.7 introduced a new tokenizer, carried by Opus 4.8, Opus 5, and Fable 5: the same text produces roughly 30% more tokens than on pre-4.7 models. Any budget, chunk size, or threshold calibrated on an older model needs re-baselining with `messages.count_tokens` — never with `tiktoken`.

### Progressive Summarization Risks

When context is compressed (via `/compact` or automatic compression), the system summarizes earlier conversation. This introduces risks:

**What gets lost in summarization:**
- Exact numerical values (`$149.99` becomes "approximately $150")
- Specific dates (`2024-01-15` becomes "mid-January")
- Precise percentages (`23.7%` becomes "about 24%")
- Order numbers, customer IDs, reference codes
- Exact error messages and stack traces

**Solution: Case Facts Block**

Extract critical transactional data into a persistent structured block that survives summarization:

```
CASE FACTS (do not summarize):
- Customer ID: #12345
- Order: #67890
- Order date: 2024-01-15
- Total: $149.99
- Issue: Damaged product on arrival
- Refund requested: Full refund ($149.99)
```

### The "Lost in the Middle" Effect

Models process the **beginning** and **end** of long inputs more reliably than the **middle**. Information placed in the middle of a large context is more likely to be overlooked.

**Mitigation strategies:**
1. Place key findings summaries at the **beginning** of aggregated inputs
2. Use explicit section headers to create navigation structure
3. Keep critical information out of the middle of long documents
4. If you must include lots of content, bookend the important parts

### Tool Output Trimming

Tool results can be verbose. A customer order lookup might return 40 fields when you only need 5.

**Bad:** Return all 40 fields, consuming context for nothing.

**Good:** Trim to relevant fields before returning to Claude:

```json
{
  "order_id": "67890",
  "status": "delivered",
  "delivery_date": "2024-01-20",
  "total": 149.99,
  "items": ["Widget Pro (x2)"]
}
```

### What Survives /compact

| Survives | May Be Lost |
|----------|-------------|
| CLAUDE.md (re-read from disk) | Earlier conversation details |
| System prompts | Specific tool results |
| Recent messages | Nuanced reasoning from earlier turns |
| Auto-memory (MEMORY.md) | Exact quotes and numbers from early context |

---

## 5.2 Escalation Patterns

### When to Escalate Immediately

| Trigger | Why | Action |
|---------|-----|--------|
| Customer explicitly requests a human | Respecting user autonomy | Escalate immediately, no further investigation |
| Policy gap or exception | Agent can't make policy decisions | Escalate with structured context |
| No progress after reasonable attempts | Agent is stuck | Escalate with summary of what was tried |

### When NOT to Escalate

| Bad Trigger | Why It's Wrong |
|-------------|----------------|
| High sentiment/emotion | Sentiment ≠ complexity. An angry customer may have a simple issue. |
| Self-reported low confidence | Claude's confidence scores are poorly calibrated. A "low confidence" response might be correct, while a "high confidence" response might be wrong. |
| Long conversation | Length doesn't indicate need for escalation. Some issues legitimately take multiple turns. |

### The Sentiment ≠ Complexity Distinction

This is a specifically tested concept:

```
"I'M SO FRUSTRATED WITH THIS!!!" + simple billing error
→ Agent can resolve. Don't escalate based on caps and exclamation marks.

"I have a question about the interaction between your enterprise SLA
and the new EU data residency requirements" + calm tone
→ May need escalation due to policy complexity, despite calm sentiment.
```

### Multiple Customer Matches

When a customer lookup returns multiple matches:

**Wrong:** Pick the most likely match using heuristics.
**Right:** Ask the customer for additional identifying information to disambiguate.

```
"I found multiple accounts matching that name. Could you provide
your email address or the last four digits of your phone number
so I can locate the right account?"
```

### Structured Escalation Handoff

When escalating, provide a structured summary because the human agent typically can't see the conversation transcript:

```
ESCALATION SUMMARY
==================
Customer: Jane Doe (#12345)
Contact: jane@example.com | 555-0123
Issue type: Refund request — damaged product
Order: #67890 ($149.99, delivered 2024-01-20)

Actions taken by agent:
1. Verified customer identity
2. Confirmed order and delivery details
3. Customer provided photos of damage
4. Refund amount ($149.99) exceeds automated approval limit ($100)

Recommended action: Manual approval for full refund + replacement
Urgency: Standard (customer is frustrated but not at risk of churn)
```

---

## 5.3 Error Propagation

### Structured Error Context

When errors occur, propagate them with full context:

```json
{
  "failure_type": "timeout",
  "service": "knowledge_base_search",
  "attempted_query": "return policy for electronics over $500",
  "timeout_duration_ms": 30000,
  "partial_results": null,
  "alternative_approaches": [
    "Try searching with simpler terms",
    "Check the FAQ section directly",
    "Ask the customer for the specific product"
  ],
  "is_retryable": true,
  "retry_after_ms": 5000
}
```

This gives Claude enough information to make an intelligent recovery decision.

### Anti-Patterns

**1. Generic error messages:**
```json
{ "error": "Operation failed" }
```
Claude can't recover intelligently because it doesn't know what failed or why.

**2. Silent suppression:**
```json
{ "results": [] }  // Returned when the search engine was actually down
```
Claude will confidently tell the user "I couldn't find any information about that" when the truth is "I wasn't able to search." These are fundamentally different situations.

**3. Workflow termination:**
```
Step 1: Get customer info → Success
Step 2: Search knowledge base → Timeout
Step 3: ABORT ENTIRE WORKFLOW
```
Better: Continue with partial results, note the gap, and offer alternatives.

### Access Failure vs Empty Result

| Situation | HTTP Status | Meaning | Agent Response |
|-----------|-------------|---------|---------------|
| Valid search, no matches | 200 + empty array | No relevant content exists | "I didn't find any matching articles" |
| Search service down | 503 / timeout | Search didn't execute | "I wasn't able to search right now, let me try another approach" |

### Subagent Error Recovery

Subagents should implement **local recovery** for transient failures:

```
Subagent: Search for "return policy"
  → Timeout
  → Retry with backoff (local recovery)
  → Success on second attempt
  → Return results to coordinator
```

Only propagate errors the subagent cannot resolve. When propagating, include:
- What was attempted
- What partial results were obtained
- What the failure was
- Whether it's retryable

---

## 5.4 Large Codebase Context Management

### Context Degradation in Extended Sessions

In long sessions, Claude's reliability degrades:
- References "typical patterns" instead of specific code found earlier
- Gives inconsistent answers about the same code
- Forgets earlier discoveries
- Starts making assumptions instead of checking

### Mitigation Strategies

**1. Scratchpad Files**

Persist findings to files that survive context compression:

```
# scratchpad.md
## Auth System Findings
- Entry point: src/auth/middleware.ts:23
- Uses JWT with RS256
- Token expiry: 1 hour
- Refresh token: 7 days
- Role check: src/auth/roles.ts:45
- Known issue: No token revocation mechanism
```

When context is compressed, Claude can re-read the scratchpad to recover findings.

**2. Subagent Delegation**

Isolate verbose exploration in subagents:

```
Main context: Clean, focused on the task
  ↓
Explore subagent: Reads 50 files, searches codebase extensively
  ↓
Returns: Concise summary of findings
  ↓
Main context: Receives only the summary, stays clean
```

**3. `/compact` Proactive Use**

During extended sessions, proactively compact context before it degrades naturally. Better to compact with a structured summary than to let automatic compression lose information unpredictably.

**4. Crash Recovery Pattern**

For long-running multi-agent workflows:

```python
# Each agent exports state to a known location
agent.save_state("/tmp/workflow/agent-1-state.json")

# Coordinator maintains a manifest
manifest = {
    "agent-1": {"status": "complete", "state": "/tmp/workflow/agent-1-state.json"},
    "agent-2": {"status": "in_progress", "state": "/tmp/workflow/agent-2-state.json"},
    "agent-3": {"status": "pending"}
}

# On resume, coordinator loads manifest and picks up where it left off
```

---

## 5.5 Human Review Workflows

### Stratified Random Sampling

Don't just sample randomly from all outputs. Stratify by risk or category:

```
Category A (high-risk): Sample 20% of outputs
Category B (medium-risk): Sample 10% of outputs
Category C (low-risk): Sample 5% of outputs
```

This concentrates human review effort on areas most likely to have errors.

### Field-Level Confidence Scores

Instead of a single confidence score for the entire extraction, provide per-field confidence:

```json
{
  "vendor_name": { "value": "Acme Corp", "confidence": 0.99 },
  "total_amount": { "value": 149.99, "confidence": 0.95 },
  "purchase_order": { "value": "PO-2024-001", "confidence": 0.72 },
  "tax_id": { "value": "12-3456789", "confidence": 0.45 }
}
```

**Calibration:** Confidence scores must be calibrated against labeled validation sets. A 0.9 confidence should mean the field is correct ~90% of the time. Without calibration, confidence scores are meaningless.

### Accuracy by Document Type

**The hidden failure pattern:**

```
Overall accuracy: 97% ← Looks great!

Breakdown:
  Standard invoices: 99.5% ← Excellent
  Handwritten notes: 45%  ← Terrible
  Foreign language docs: 62% ← Bad
```

Aggregate metrics mask poor performance on specific document types. Always break down accuracy by type and field.

### Per-Document-Type Reporting

Report accuracy metrics for each document type AND each field within that type:

```
Standard Invoices:
  vendor_name: 99.8%
  total_amount: 99.2%
  line_items: 97.5%
  tax_id: 94.1%

Handwritten Notes:
  vendor_name: 85.0%
  total_amount: 42.0% ← Critical failure
  line_items: 38.0% ← Critical failure
```

This reveals where the system actually needs improvement rather than hiding behind an aggregate number.

---

## 5.6 Information Provenance

### Claim-Source Mappings

When subagents produce findings, they should output structured provenance:

```json
{
  "claim": "Revenue increased 15% year-over-year in Q4 2024",
  "evidence": "Q4 earnings report, page 3, paragraph 2",
  "source_url": "https://example.com/earnings/q4-2024",
  "document_name": "Q4 2024 Earnings Report",
  "publication_date": "2025-01-15",
  "source_type": "primary"
}
```

### Handling Conflicting Data

When sources disagree, **annotate the conflict** rather than silently picking one:

```json
{
  "field": "Q4 revenue",
  "values": [
    {
      "value": "$2.3B",
      "source": "Company press release (2025-01-15)",
      "note": "Preliminary figures"
    },
    {
      "value": "$2.28B",
      "source": "SEC filing (2025-02-28)",
      "note": "Audited figures"
    }
  ],
  "resolution": "SEC filing is the authoritative source (audited)",
  "conflict_type": "minor_discrepancy"
}
```

**Anti-pattern:** Silently selecting one value without noting the disagreement. This hides potential data quality issues.

### Temporal Data

Include publication and collection dates to prevent temporal confusion:

```json
{
  "claim": "Unemployment rate is 3.7%",
  "data_as_of": "2024-11-01",
  "source_published": "2024-12-06",
  "retrieved_on": "2025-01-10"
}
```

Without dates, a reader might think two different unemployment figures from different months represent a contradiction when they're actually both correct for their respective time periods.

### Synthesis Output Quality

When producing research synthesis:

1. **Distinguish certainty levels:**
   - "Well-established: Revenue grew 15% (confirmed by SEC filing and two analyst reports)"
   - "Contested: Market share estimates range from 12% to 18% depending on methodology"
   - "Single-source: Only one report mentions the planned acquisition"

2. **Preserve source characterization:**
   - Don't merge or reinterpret what sources say
   - Quote or closely paraphrase the original claim
   - Note the source's own caveats and qualifications

3. **Render appropriately by content type:**
   - Financial data → tables with source attribution
   - News/events → chronological prose
   - Technical specifications → structured lists
   - Disputed claims → side-by-side comparison

---

## 5.7 Server-Side Context Management

Sections 5.1 and 5.4 cover context management as something *you* do — case-facts blocks, scratchpads, trimming, delegating to subagents. The API now offers three server-side mechanisms that do part of this work for you. They are complementary, not alternatives, and knowing which one solves which problem is the point.

| Mechanism | What it does | Where state goes |
|-----------|--------------|------------------|
| **Context editing** | *Clears* old tool results or thinking blocks before the model sees them | Deleted — gone |
| **Compaction** | *Summarizes* earlier context when it approaches a threshold | Replaced by a summary in the conversation |
| **Memory tool** | Lets Claude read and write persistent files | Outside the conversation, survives everything |

### Context Editing (beta `context-management-2025-06-27`)

Clears, does not summarize.

```python
client.beta.messages.create(
    model="claude-opus-5",
    betas=["context-management-2025-06-27"],
    context_management={"edits": [
        {"type": "clear_thinking_20251015",
         "keep": {"type": "thinking_turns", "value": 2}},
        {"type": "clear_tool_uses_20250919",
         "trigger": {"type": "input_tokens", "value": 30000},
         "keep": {"type": "tool_uses", "value": 3},
         "clear_at_least": {"type": "input_tokens", "value": 5000},
         "exclude_tools": ["web_search"]},
    ]},
    tools=[...], messages=[...],
)
```

- `clear_tool_uses_20250919` — clears old tool results (`clear_tool_inputs: true` also clears the parameters). Default trigger: 100,000 input tokens; default `keep`: 3.
- `clear_thinking_20251015` — clears thinking blocks. When combining both, **`clear_thinking` must be listed first**.
- `clear_at_least` exists to protect the prompt cache: clearing a trivial amount invalidates the cache for no benefit.
- The response reports what happened in `context_management.applied_edits`.

### Compaction (beta `compact-2026-01-12`)

Summarizes rather than clears. Available on Fable 5, Opus 5, Opus 4.8/4.7/4.6, Sonnet 5, and Sonnet 4.6; default trigger around 150k tokens.

> **The critical integration detail:** append the **whole `response.content`** back to your `messages` on every turn, not just the extracted text. The compaction blocks in the response are what the API uses to replace compacted history on the next request. Pulling out the text string and appending that silently destroys the compaction state — and it fails quietly, which is the worst failure mode for something you only notice at turn 90.

Client-side SDK compaction (`compaction_control` on the tool runner) is **deprecated** in favor of this.

### Memory Tool (`memory_20250818`)

A client-side tool — Anthropic defines the interface, you implement the file operations. Declared as `{"type": "memory_20250818", "name": "memory"}`, no `input_schema`.

Its role in this domain: it's the persistence layer that makes clearing safe. Combine it with context editing and Claude receives a warning to write anything important to memory *before* its tool results are cleared. That is the API-level version of the scratchpad pattern in §5.4.

### Choosing

| Situation | Mechanism |
|-----------|-----------|
| Agentic loop with dozens of verbose tool results | Context editing (`clear_tool_uses`) |
| Extended thinking plus a need to keep cache hits high | Context editing (`clear_thinking`) |
| Long research/analysis conversation that must keep its narrative | Compaction |
| Findings that must survive across sessions, not just turns | Memory tool |
| Facts that must never be paraphrased | Case-facts block (§5.1) — no mechanism protects exact numbers better than restating them |

---

## 5.8 Bounding and Recovering Long Runs

### Task Budgets vs `max_tokens`

`max_tokens` is a ceiling the model can't see; hitting it truncates output mid-thought. A **task budget** (`output_config.task_budget`, beta `task-budgets-2026-03-13`, minimum 20,000) is a ceiling the model *can* see, so it paces itself and lands the work. Available on Claude Opus 5, Fable 5, Sonnet 5, and Opus 4.8/4.7. The budget counts what Claude generates plus the tool results it reads this turn — not the full history you resend. Leave `remaining` unset in a normal loop; only pass it when you rewrite or compact history yourself and the server can no longer derive prior spend.

Managed Agents **session budgets** are a different thing: hard, dollar-denominated, platform-enforced caps on one session. A task budget is advisory and token-denominated.

### Refusals Are a Reliability Concern, Not Just a Safety One

A `refusal` arrives as HTTP 200 with `stop_reason: "refusal"` and a `stop_details.category`. Code that reads `content` without checking `stop_reason` treats a refusal as a successful empty answer — the same class of bug as treating a failed search as zero results (§5.3). For production paths, enable server-side fallback (`betas=["server-side-fallback-2026-07-01"]`, `fallbacks="default"`) so the request is re-routed by category rather than dropped. See Domain 1 §1.1.

---

## Domain 5 Practice Questions

**Q1:** An agent is processing a customer support request. After context compression, the customer's order number ($149.99 order #67890) was summarized as "a recent order." What should have been done to prevent this?
- A) Increase the context window size
- B) Extract critical transactional data into a persistent case facts block
- C) Disable context compression
- D) Repeat the order details in every message

**Answer: B** — Extracting transactional facts (amounts, order numbers, dates) into a structured block that persists through compression prevents loss of critical details.

**Q2:** A customer says "I AM SO ANGRY RIGHT NOW!!!" about a simple billing charge of $5. Should the agent escalate to a human?
- A) Yes, high sentiment indicates a complex issue
- B) Yes, capital letters indicate urgency
- C) No, sentiment intensity does not indicate issue complexity — the billing issue is simple and resolvable
- D) No, but reduce the agent's confidence score

**Answer: C** — Sentiment ≠ complexity. An angry customer with a simple $5 billing issue doesn't need human escalation. The agent should resolve the simple issue while acknowledging the customer's frustration.

**Q3:** An extraction system reports 97% overall accuracy. A stakeholder asks if it's ready for production. What additional information is needed?
- A) The system is ready at 97%
- B) Check if accuracy is consistent across all document types and fields
- C) Run more documents through to increase the sample size
- D) Compare against competitor systems

**Answer: B** — Aggregate accuracy can mask poor performance on specific document types. 97% overall might hide 45% accuracy on handwritten documents. Break down by type and field before declaring production readiness.

**Q4:** Two research subagents return different values for the same metric. What should the coordinator do?
- A) Average the two values
- B) Use the most recent value
- C) Annotate the conflict with source attribution and let the user decide
- D) Discard both and search again

**Answer: C** — Conflicting data should be annotated with source attribution rather than silently resolved. This preserves transparency and lets downstream consumers evaluate the discrepancy.

**Q5:** A long-running agent enables server-side compaction. The integration appends only `response.content[0].text` to its message history each turn. What goes wrong?

- A) Nothing — text is all the API needs
- B) Compaction state is lost silently, because the compaction blocks in `response.content` are what the API uses to replace compacted history
- C) The request fails with a 400 on the first compaction
- D) Compaction triggers too early

**Answer: B** — Append the whole `response.content`, not the extracted text. Dropping the non-text blocks destroys the compaction state without raising an error, so the failure only surfaces deep into a long conversation.

**Q6:** An agentic workflow keeps getting truncated mid-task when it hits `max_tokens`. Which mechanism lets the model pace itself instead?

- A) Raise `max_tokens` and hope for the best
- B) A task budget (`output_config.task_budget`), which the model can see and plan around
- C) A lower `effort` setting
- D) An iteration cap in the client loop

**Answer: B** — `max_tokens` is an enforced ceiling the model is unaware of; a task budget injects a countdown the model sees during generation, so it finishes gracefully. Lower `effort` reduces spend but does not communicate a ceiling, and a client-side iteration cap is the anti-pattern from Domain 1 §1.1.
