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

Instead of tool_use, you can request JSON output directly. As of late-2025 the parameter is `output_config.format` (the older `output_format` is kept for a transition period, and the previous `structured-outputs-2025-11-13` beta header is no longer required):

```python
response = client.messages.create(
    model="claude-opus-4-7",
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
| `type` | `minimum`, `maximum` |
| `properties`, `required` | `minLength`, `maxLength` |
| `enum` | `pattern` (regex) |
| `items` (for arrays) | `allOf`, `anyOf`, `oneOf` |
| `additionalProperties: false` | `patternProperties` |
| `format` (date, time, email, uri) | `if`/`then`/`else` |

**Implication:** Numeric range validation, string length validation, and complex conditional schemas must be handled in your validation code, not in the schema.

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
| **Correlation** | `custom_id` per request |
| **Multi-turn** | NOT supported in a single batch request |

### Creating a Batch

```python
batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": "invoice-001",
            "params": {
                "model": "claude-opus-4-7",
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
