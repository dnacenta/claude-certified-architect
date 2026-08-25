# Domain 4: Prompt Engineering & Structured Output (20%)

Covers writing explicit criteria, few-shot prompting, getting guaranteed structured output via tool_use and JSON schemas, validation-retry loops, batch processing, and multi-pass review architecture.

---

## 4.1 Explicit Criteria

### The Problem with Vague Instructions

Vague instructions produce inconsistent results because the model interprets them differently each time.

**Bad (vague):**
```
"Be conservative when flagging issues."
"Only report high-confidence findings."
"Use your best judgment on severity."
```

**Good (explicit):**
```
"Flag a comment as outdated ONLY when the claimed behavior directly
contradicts the actual code behavior. Do NOT flag comments that are
merely incomplete or could be more detailed."
```

### Explicit Criteria Structure

For each type of judgment the model must make, define:
1. **What qualifies** — Specific conditions that trigger the judgment
2. **What doesn't qualify** — Boundary cases that should NOT trigger it
3. **Examples** — Concrete input/output pairs showing the boundary

```
Flag as SECURITY ISSUE when:
  - User input is passed to SQL queries without parameterization
  - User input is rendered in HTML without escaping
  - Credentials are hardcoded in source files

Do NOT flag:
  - ORM queries (already parameterized)
  - Rendering user input in server-side templates with auto-escaping
  - Credentials loaded from environment variables
```

### False Positive Impact

High false positive rates in one category undermine trust in ALL categories, even accurate ones. Developers start ignoring all warnings.

**Solution:** When a category has high false positives, temporarily disable it and improve the criteria prompts before re-enabling. Don't let one noisy category degrade the value of accurate ones.

---

## 4.2 Few-Shot Prompting

### When to Use Few-Shot

- Ambiguous scenarios where prose instructions aren't precise enough
- Tasks where the format or reasoning pattern needs demonstration
- Reducing hallucination in extraction tasks
- Showing how to handle edge cases

### How Many Examples

**2-4 targeted examples** is the sweet spot. Too few may not cover the pattern. Too many wastes context and may overfit to the examples.

### What Good Examples Include

Each example should demonstrate:
1. **Input** — What the model receives
2. **Output** — What it should produce
3. **Reasoning** — WHY this output is correct (not just what to do, but why)

```
Example 1:
Input: "// Returns the user's full name"
Code: function getName(user) { return user.firstName; }
Output: {
  "issue": "Comment claims full name but function only returns firstName",
  "severity": "medium",
  "location": "line 1",
  "reasoning": "The comment says 'full name' but the code returns only
    firstName, not firstName + lastName. This is a factual contradiction."
}

Example 2:
Input: "// Validates the input"
Code: function validate(input) { return input.length > 0 && input.length < 100; }
Output: null
Reasoning: "The comment says 'validates input' and the function does validate
  input. The comment is vague but not wrong — it doesn't claim specific
  validation rules that contradict the implementation."
```

### Few-Shot Enables Generalization

Good examples teach the pattern, not just the specific cases. The model should generalize to novel situations by understanding the reasoning behind each example.

---

## 4.3 Structured Output via tool_use

### The Problem

When you need Claude to return structured data (JSON), free-form text generation can produce:
- Malformed JSON
- Missing required fields
- Unexpected field names
- Wrong data types

### Solution 1: tool_use with Schema

Define a tool that represents your desired output structure:

```json
{
  "name": "extract_invoice_data",
  "description": "Extract structured data from an invoice document",
  "input_schema": {
    "type": "object",
    "properties": {
      "vendor_name": {
        "type": "string",
        "description": "The company or person who issued the invoice"
      },
      "invoice_number": {
        "type": "string",
        "description": "The unique invoice identifier"
      },
      "line_items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "description": { "type": "string" },
            "quantity": { "type": "number" },
            "unit_price": { "type": "number" },
            "total": { "type": "number" }
          },
          "required": ["description", "quantity", "unit_price", "total"]
        }
      },
      "total_amount": { "type": "number" },
      "currency": {
        "type": "string",
        "enum": ["USD", "EUR", "GBP", "other"]
      }
    },
    "required": ["vendor_name", "invoice_number", "line_items", "total_amount", "currency"]
  }
}
```

Use `tool_choice: {"type": "tool", "name": "extract_invoice_data"}` to force Claude to call this tool, guaranteeing structured output.

### Solution 2: Strict Mode

Add `"strict": true` to the tool definition for guaranteed schema compliance:

```json
{
  "name": "extract_invoice_data",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": { ... },
    "required": ["vendor_name", "invoice_number", "line_items", "total_amount", "currency"],
    "additionalProperties": false
  }
}
```

**Strict mode requirements:**
- `additionalProperties: false` must be set
- ALL properties must be listed in `required`

### Solution 3: output_config (Direct JSON Output)

Instead of tool_use, you can request JSON output directly. The parameter is `output_config.format`. The older top-level `output_format` is **deprecated** — don't use it in new code — and the previous `structured-outputs-2025-11-13` beta header is no longer required:

```python
response = client.messages.create(
    model="claude-opus-5",
    messages=[{"role": "user", "content": "Extract data from this invoice: ..."}],
    output_config={
        "format": {
            "type": "json_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "vendor_name": { "type": "string" },
                    "total_amount": { "type": "number" }
                },
                "required": ["vendor_name", "total_amount"],
                "additionalProperties": false
            }
        }
    }
)
```

> **SDK helper:** `client.messages.parse()` (Python/TypeScript) wraps this pattern — pass a Pydantic model or Zod schema and it sends `output_config.format`, validates the response against your schema, and returns the parsed object via `response.parsed_output`. Prefer it over hand-parsing JSON when using structured outputs.

### Schema Compliance vs Semantic Correctness

**Important exam concept:** Structured output guarantees **schema compliance** (correct types, required fields present, valid enums) but does NOT guarantee **semantic correctness**.

Schema compliance: ✅ `"total_amount": 150.00` (correct type, field exists)
Semantic error: ❌ `"total_amount": 150.00` when line items sum to 175.00

You still need validation logic to catch semantic errors.

### Schema Design Patterns

**Required vs Optional Fields:**
```json
{
  "purchase_order_number": {
    "type": ["string", "null"],
    "description": "PO number if present on the invoice, null if not found"
  }
}
```

Use nullable fields when source documents may not contain the information. Making everything required can force Claude to fabricate data.

**Enum with "other":**
```json
{
  "document_type": {
    "type": "string",
    "enum": ["invoice", "receipt", "contract", "purchase_order", "other"]
  },
  "document_type_detail": {
    "type": ["string", "null"],
    "description": "If document_type is 'other', describe the document type"
  }
}
```

**Enum with "unclear":**
```json
{
  "payment_status": {
    "type": "string",
    "enum": ["paid", "unpaid", "partial", "unclear"]
  }
}
```

Adding `"unclear"` as an option prevents Claude from guessing when the information is ambiguous.

### JSON Schema Limitations in Strict Mode

Strict mode supports a subset of JSON Schema:

| Supported | NOT Supported |
|-----------|--------------|
| `type` (object, array, string, integer, number, boolean, null) | `minimum`, `maximum`, `multipleOf` |
| `properties`, `required` | `minLength`, `maxLength` |
| `enum`, `const` | `pattern` (regex), `patternProperties` |
| `items` (for arrays) | `oneOf`, `if`/`then`/`else` |
| `anyOf`, `allOf`, `$ref`/`$defs` | Recursive schemas |
| `additionalProperties: false` (required on every object) | `additionalProperties` set to anything other than `false` |
| `format` (`date-time`, `time`, `date`, `duration`, `email`, `hostname`, `uri`, `ipv4`, `ipv6`, `uuid`) | Complex array constraints |

> Earlier versions of structured outputs did not support `anyOf`/`allOf` — they do now. The Python and TypeScript SDKs strip unsupported constraints from the schema they send and validate them client-side instead.

**Implication:** Numeric range validation, string length validation, regex patterns, and complex conditional schemas must be handled in your validation code, not in the schema.

---

## 4.4 Validation-Retry Loops

### The Pattern

```python
max_retries = 3

for iteration in range(max_retries):
    response = extract_data(document, prompt)
    errors = validate(response)

    if not errors:
        return response  # Success

    # Append specific errors to prompt for next attempt
    prompt += f"""
    Your previous extraction had these validation errors:
    {json.dumps(errors, indent=2)}

    Please correct these specific issues and try again.
    """

raise ExtractionError(f"Failed after {max_retries} attempts: {errors}")
```

### What Validation Catches

**Schema validation** (can catch reliably):
- Missing required fields
- Wrong data types
- Invalid enum values
- Malformed dates or emails

**Semantic validation** (needs custom logic):
- Line items don't sum to total
- Dates are in the future when they shouldn't be
- Referenced entities don't exist
- Cross-field contradictions

### Self-Correction Patterns

**Calculated vs Stated:**
```json
{
  "stated_total": 150.00,
  "calculated_total": 175.00,
  "conflict_detected": true,
  "conflict_note": "Stated total ($150) doesn't match sum of line items ($175)"
}
```

By extracting both the stated value and a calculated value, you can detect discrepancies automatically.

### When Retries Don't Work

Retries are ineffective when the information is **absent from the source document**. If the invoice doesn't have a PO number, retrying won't make one appear.

**Solution:** Use nullable/optional fields and accept null for missing data rather than retrying.

### Tracking False Positives

Add a `detected_pattern` field to track which code constructs trigger findings:

```json
{
  "issue": "Potential SQL injection",
  "detected_pattern": "string concatenation in query",
  "file": "users.py",
  "line": 42
}
```

This allows analysis of dismissal patterns — if developers consistently dismiss "string concatenation in query" findings, the prompt criteria for that pattern may need refinement.

---

## 4.5 Batch Processing

### Message Batches API

| Feature | Detail |
|---------|--------|
| **Cost** | 50% savings vs synchronous |
| **Latency** | Up to 24 hours, no SLA |
| **Correlation** | `custom_id` per request — results come back in **any order**, so key by `custom_id`, never by position |
| **Multi-turn** | NOT supported in a single batch request |
| **Max output** | 128k normally; up to **300k** with beta header `output-300k-2026-03-24` on Opus 5 / 4.8 / 4.7 / 4.6 and Sonnet 5 / 4.6 |
| **Result states** | `succeeded`, `errored`, `canceled`, `expired` — poll `batches.retrieve(id).processing_status` until `"ended"`, then stream `batches.results(id)` |

### Creating a Batch

```python
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "invoice-001",
            "params": {
                "model": "claude-opus-5",
                "max_tokens": 4096,
                "messages": [
                    {"role": "user", "content": f"Extract data from: {invoice_001_text}"}
                ],
                "tools": [extract_tool],
                "tool_choice": {"type": "tool", "name": "extract_invoice_data"}
            }
        },
        {
            "custom_id": "invoice-002",
            "params": { ... }
        }
    ]
)
```

### When to Use Batch vs Synchronous

| Synchronous | Batch |
|-------------|-------|
| Pre-merge code review checks | Overnight code analysis |
| Real-time user interactions | Weekly audit reports |
| Blocking CI steps | Nightly test generation |
| Interactive debugging | Bulk document processing |

### Failure Handling

Don't resubmit the entire batch when some requests fail. Use `custom_id` to identify and resubmit only failures:

```python
failed = [r for r in results if r.status == "failed"]
resubmit = [orig for orig in original if orig.custom_id in [f.custom_id for f in failed]]
```

### Pre-Batch Refinement

Always refine your prompts on a small sample before batch-processing large volumes. This catches prompt issues before you waste credits on 10,000 documents.

---

## 4.6 Multi-Pass Review

### The Self-Review Problem

When Claude generates code and then reviews it in the same session, it retains the reasoning context from generation. It "remembers" why it made each decision, making it less likely to question those decisions.

This is called **reasoning context bias**.

### The Solution: Independent Review Instances

```
Session 1: Claude generates code
                    ↓
            (completely separate session)
                    ↓
Session 2: Claude reviews the code
           (no knowledge of why decisions were made)
```

### Multi-Pass Architecture for Large PRs

**Pass 1 — Per-file local analysis:**
- Review each file independently
- Consistent depth across all files
- Catches: bugs, style issues, type errors, security vulnerabilities
- Separate prompt for each file

**Pass 2 — Cross-file integration:**
- Review how files interact with each other
- Different prompt focused on integration concerns
- Catches: data flow issues, interface mismatches, missing error handling at boundaries
- Receives results from Pass 1 for context

### Why Not Single-Pass?

For large PRs (10+ files), single-pass review suffers from:

1. **Attention dilution** — Model focuses on early files, gives less attention to later ones
2. **Inconsistent standards** — Different quality of review across files
3. **Missing integration issues** — Can't see cross-file problems when reviewing one file at a time in a single pass

---

## 4.7 Thinking, Effort, and the Current Request Surface

The request shape for prompting Claude changed substantially across the 4.6 → 5 generations. Several parameters that older material treats as standard now return **400** on current models.

### Adaptive Thinking Replaced Thinking Budgets

```python
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "high"},
    messages=[...],
)
```

| Model | Thinking config | Omitting `thinking` | `budget_tokens` | `temperature` / `top_p` / `top_k` |
|-------|-----------------|---------------------|-----------------|-----------------------------------|
| Claude Fable 5 | `{"type": "adaptive"}` or omit | Runs adaptive (always on) | **400** | **400** |
| Claude Opus 5 | `{"type": "adaptive"}` or omit | Runs **adaptive** by default | **400** | **400** |
| Claude Opus 4.8 / 4.7 | `{"type": "adaptive"}` | Runs **without** thinking | **400** | **400** |
| Claude Sonnet 5 | `{"type": "adaptive"}` | Runs adaptive | **400** | **400** |
| Claude Haiku 4.5 | `{"type": "enabled", "budget_tokens": N}` | No thinking | Required for thinking | Allowed |

The subtlety worth flagging: on **Opus 4.8/4.7 you must set `adaptive` explicitly** or you get no thinking at all, while on **Opus 5 thinking is on by default**. Code carried forward from 4.8 that disables thinking will behave differently on Opus 5.

### Effort

`effort` is GA (no beta header) and lives **inside `output_config`**, not at the top level:

```python
output_config={"effort": "xhigh"}   # low | medium | high | xhigh | max
```

It defaults to `high` on the Claude API (equivalent to omitting it); Claude Code defaults to `xhigh`. `xhigh` is the sweet spot for most coding and agentic work on the current frontier models. Use `low` for subagents and mechanical tasks — lower effort means fewer, more-consolidated tool calls and terser output; use `max` when correctness matters more than cost. Effort matters more on these models than on any prior generation, so **re-tune it when you migrate**, don't carry the old value across.

### Thinking Display

`display: "omitted"` is now the **default** on Fable 5, Opus 5, Opus 4.8/4.7, and Sonnet 5 — a silent change from Opus 4.6 and Sonnet 4.6, where it was `"summarized"`. Thinking still happens and is still billed identically; only visibility changes. If you stream reasoning to users, the default looks like a long pause before any output, so set `display: "summarized"` explicitly. The raw chain of thought is never exposed on any model.

### Assistant Prefill Is Gone

Prefilling the last assistant turn to force a response format returns **400** on Fable 5, Opus 5, Sonnet 5, and the whole 4.6/4.7/4.8 family. Use structured outputs (`output_config.format`) or system-prompt instructions instead. This retires a prompt-engineering technique that a lot of older material still recommends.

### Mid-Conversation System Messages

On Claude Opus 5, Opus 4.8, and Fable 5 (not Sonnet 5, no beta header) you can append `{"role": "system", "content": "..."}` to the **`messages` array** rather than editing the top-level `system` field. This is the prompt-injection-safe operator channel, and — because it doesn't touch the cached prefix — the cheap one. Constraints: it must follow a `user` message (or an assistant message ending in server-tool use), can't be `messages[0]`, and must either be last or be followed by an assistant turn.

---

## 4.8 Prompt Caching

Caching is a prompt-*structure* problem, which is why it belongs here rather than in an ops runbook.

**Prefix match:** the cache keys on an exact prefix. Any byte change anywhere in the prefix invalidates everything after it. Render order is **`tools` → `system` → `messages`**, so a tool list that reorders between requests invalidates the system prompt and the whole conversation behind it.

**Design rule:** stable content first (frozen system prompt, deterministically ordered tool list), volatile content (timestamps, per-request IDs, the actual question) after the last `cache_control` breakpoint.

| Mechanic | Detail |
|----------|--------|
| Breakpoints | Max 4 per request (`cache_control: {"type": "ephemeral"}`) |
| Minimum prefix | ~1024 tokens — shorter prefixes silently don't cache |
| Verification | `usage.cache_read_input_tokens`. Zero across repeated requests means something is invalidating the prefix |
| Pre-warming | `max_tokens: 0` warms a cache entry without generating |

**Silent invalidators to audit for:** `datetime.now()` in the system prompt, JSON serialized with non-deterministic key order, a tool set that varies per request, a session ID or user name interpolated into the prefix, and switching `speed` (fast mode) mid-conversation.

**Interaction with tool search:** deferred tools are excluded from the system-prompt prefix and discovered tools are appended inline, so `defer_loading` *preserves* the cache. A tool with `defer_loading: true` cannot also carry `cache_control` — put the breakpoint on a non-deferred tool.

---

## Domain 4 Practice Questions

**Q1:** A code review system flags "use your best judgment" as a criterion for reporting issues. What should be changed?
- A) Add more examples of past reviews
- B) Replace with explicit criteria defining exactly what qualifies as a reportable issue
- C) Increase the model's temperature for more nuanced judgment
- D) Add a confidence score threshold

**Answer: B** — Vague instructions like "use your best judgment" produce inconsistent results. Replace with explicit criteria that define exactly what qualifies and what doesn't.

**Q2:** An invoice extraction system uses strict mode but sometimes returns a total that doesn't match the sum of line items. What's happening?
- A) Strict mode is broken
- B) The schema is misconfigured
- C) Strict mode guarantees schema compliance, not semantic correctness
- D) The model needs fine-tuning

**Answer: C** — Strict mode ensures the output conforms to the JSON schema (correct types, required fields) but cannot validate semantic correctness (whether the math adds up). Custom validation logic is needed for that.

**Q3:** A batch processing job has 1,000 documents. 50 fail. What's the correct approach?
- A) Resubmit the entire batch of 1,000
- B) Use `custom_id` to identify and resubmit only the 50 failed documents
- C) Switch to synchronous processing
- D) Increase the batch timeout

**Answer: B** — Use `custom_id` to correlate requests with responses and resubmit only the failures. Resubmitting the entire batch wastes credits and reprocesses already-successful documents.

**Q4:** An extraction service written for an older model sets `thinking={"type": "enabled", "budget_tokens": 8000}` and `temperature=0`. It is being moved to Claude Opus 5. What happens?

- A) It works unchanged; both parameters are still supported
- B) Both parameters return a 400 — use `thinking={"type": "adaptive"}` and control depth with `output_config.effort`
- C) `budget_tokens` is ignored silently and `temperature` still applies
- D) It works, but thinking is disabled

**Answer: B** — `budget_tokens` and the sampling parameters (`temperature` / `top_p` / `top_k`) are removed on Fable 5, Opus 5, Sonnet 5, and the 4.7/4.8 family, and return a 400. Adaptive thinking plus `effort` replaces the fixed-thinking-budget concept. Assistant prefills also 400 on these models.
