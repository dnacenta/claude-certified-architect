# Domain 2: Tool Design & MCP Integration (18%)

Covers how to design tool interfaces that LLMs can reliably use, how to handle errors from tools, how to distribute tools across agents, and how MCP servers are configured and operate.

---

## 2.1 Tool Interface Design

### Tool Descriptions Are Everything

Tool descriptions are the **primary mechanism** Claude uses to decide which tool to call. The description is not just documentation — it's the selection criteria.

**Bad description (leads to unreliable selection):**
```json
{
  "name": "search",
  "description": "Search for things"
}
```

**Good description:**
```json
{
  "name": "search_knowledge_base",
  "description": "Search the internal knowledge base for support articles, FAQs, and troubleshooting guides. Use this when the customer asks a question that may have an existing documented answer. Input should be a natural language query describing the customer's issue. Returns matching articles ranked by relevance with titles, snippets, and article IDs."
}
```

### What to Include in Tool Descriptions

1. **Purpose** — What the tool does and when to use it
2. **Input format** — What the input should look like, with examples
3. **Output format** — What the tool returns
4. **Edge cases** — What happens with invalid inputs or no results
5. **Differentiation** — When to use THIS tool vs similar tools

### The Full Tool Definition Schema

```json
{
  "name": "get_weather",
  "description": "Get the current weather in a given location. Returns temperature, conditions, humidity, and wind speed. Use this when the user asks about current weather conditions. For forecasts, use get_forecast instead.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city and state/country, e.g. 'San Francisco, CA' or 'London, UK'"
      },
      "unit": {
        "type": "string",
        "enum": ["celsius", "fahrenheit"],
        "description": "Temperature unit. Defaults to celsius if not specified."
      }
    },
    "required": ["location"]
  }
}
```

### Strict Mode

Strict mode guarantees Claude's tool inputs conform exactly to the schema:

```json
{
  "name": "extract_invoice",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "vendor_name": { "type": "string" },
      "invoice_number": { "type": "string" },
      "total_amount": { "type": "number" },
      "currency": { "type": "string", "enum": ["USD", "EUR", "GBP"] }
    },
    "required": ["vendor_name", "invoice_number", "total_amount", "currency"],
    "additionalProperties": false
  }
}
```

**Requirements for strict mode:**
- `additionalProperties: false` must be set
- All properties must be in `required`
- Only a subset of JSON Schema is supported (see Domain 4)

### Anti-Pattern: Ambiguous Tool Overlap

Having two tools with near-identical descriptions causes misrouting:

```
Tool 1: "analyze_content" — "Analyze content for insights"
Tool 2: "analyze_document" — "Analyze a document for insights"
```

Claude can't reliably distinguish between these. Fix: rename to clearly differentiate purpose, or merge into one tool.

---

## 2.2 Structured Error Responses

### MCP Error Structure

When tools fail, the error response should be structured, not a generic string:

```json
{
  "isError": true,
  "errorCategory": "transient",
  "isRetryable": true,
  "description": "Database connection timed out after 30 seconds. The query was for customer #12345's order history.",
  "partial_results": null,
  "attempted_action": "SELECT * FROM orders WHERE customer_id = 12345"
}
```

### Error Categories

| Category | Retryable? | Examples | Agent Action |
|----------|-----------|----------|-------------|
| **Transient** | Yes | Timeouts, service unavailability, rate limits | Retry with backoff |
| **Validation** | No (without input changes) | Invalid email format, missing required field | Fix input, retry |
| **Business** | No | Refund exceeds policy limit, account frozen | Escalate or inform user |
| **Permission** | No | Insufficient access, expired token | Escalate |

### What the Agent Should Do with Errors

1. **Transient errors:** Subagents should implement local recovery (retry with backoff). Only propagate if recovery fails.
2. **Validation errors:** Claude should examine the error, fix the input, and retry.
3. **Business errors:** Claude should explain the policy to the user or escalate.
4. **Permission errors:** Claude should escalate to a human.

### Anti-Patterns (Wrong Answers)

1. **Generic error messages:** `"Operation failed"` — hides the cause and prevents intelligent recovery
2. **Silent suppression:** Returning `{ "results": [] }` when the search engine is down. This makes it look like there are no results when actually the search didn't work. The agent will confidently tell the user "I found nothing" when the truth is "I couldn't search."
3. **Generic status messages:** `"search unavailable"` without context about what was attempted
4. **Terminating on single failure:** Killing an entire multi-step workflow because one step failed, instead of using partial results or trying alternatives

### Distinguishing Empty from Failed

This is a specific exam concept:

| Situation | What Happened | Correct Response |
|-----------|--------------|-----------------|
| Search returns `[]` with status 200 | Valid query, no matches | "No results found for that query" |
| Search returns timeout error | Query didn't execute | "I wasn't able to search right now, let me try again" |

These must be handled differently. The first is information. The second is an error.

---

## 2.3 Tool Distribution and tool_choice

### The 4-5 Tool Maximum

Each agent should have **4-5 tools maximum**. Giving an agent 18 tools degrades selection reliability — Claude may pick the wrong tool, call unnecessary tools, or struggle to reason about which to use.

**Solution for complex systems:** Distribute tools across specialized subagents.

```
Instead of:
  One agent with 18 tools

Do:
  Coordinator with: Agent, AskUser
  Search subagent with: search_web, search_docs, search_db
  Analysis subagent with: analyze_text, extract_entities, summarize
  Action subagent with: send_email, create_ticket, update_record
```

This is the exam's answer, and the underlying principle (one agent, one focused job) is still correct. The current numbers from Anthropic's docs are worth knowing alongside it.

### Beyond the Exam Guide: Tool Search

Anthropic's current published guidance is that **tool-selection accuracy degrades once an agent exceeds roughly 30–50 available tools**, and that a typical multi-server MCP setup (GitHub, Slack, Sentry, Grafana, Splunk) burns ~55k tokens of context in tool definitions before any work happens. The fix is no longer "split into subagents" alone — it's the **tool search tool**, which is GA on the Claude API.

```json
"tools": [
  { "type": "tool_search_tool_regex_20251119", "name": "tool_search_tool_regex" },
  { "name": "get_weather", "description": "...", "input_schema": { ... },
    "defer_loading": true }
]
```

How it works:

1. You still send **every** tool definition on every request. `defer_loading` controls what enters the *context window*, not what you transmit.
2. Non-deferred tools load into context immediately; deferred ones don't.
3. When Claude needs something else, it calls the search tool. The API returns `tool_reference` blocks and expands them into full definitions inline — the system-prompt prefix is untouched, so **prompt caching survives**.
4. Two variants: `tool_search_tool_regex_20251119` (Claude writes Python `re.search()` patterns, max 200 chars) and `tool_search_tool_bm25_20251119` (natural-language queries, max 500 chars). Both search names, descriptions, argument names, and argument descriptions.

| Rule | Detail |
|------|--------|
| Never defer everything | At least one tool must have `defer_loading: false`, normally the search tool itself. Otherwise: **400, "All tools cannot be deferred"** |
| Keep a hot set | Leave your **3–5 most-used tools** non-deferred so Claude can call them without a search round-trip |
| Limits | Up to 10,000 deferred tools per request; searches return 5 matches by default (Claude may set `limit`, 1–10,000) |
| Cache | A tool with `defer_loading: true` can't also carry `cache_control` — 400. Put the breakpoint on a non-deferred tool |
| Composability | Works with `strict: true`; the grammar builds from the full toolset |
| MCP | Don't set `defer_loading` per tool — set it on the `mcp_toolset` entry's `default_config` |

**When to use it:** 10+ tools, tool definitions over 10k tokens, accuracy dropping as the toolset grows, or aggregating multiple MCP servers. **When not to:** fewer than 10 tools, every tool used every request, or definitions totalling under ~100 tokens.

Reconciling the two: the exam's "4-5 tools" is about how many tools are *in front of the model at decision time*. Tool search doesn't raise that number — it keeps it at 3–5 while letting the catalog behind it grow to thousands.

### tool_choice Parameter

Controls how Claude interacts with tools:

| Value | Behavior | Use Case |
|-------|----------|----------|
| `"auto"` (default) | Claude may call a tool OR respond with text | General conversation with optional tool use |
| `"any"` | Claude MUST call a tool, but can choose which | Guarantee structured output |
| `{"type": "tool", "name": "specific_tool"}` | Claude MUST call this exact tool | Force a specific operation first |
| `"none"` | Claude cannot call any tool; text only | Force a text answer while keeping tool definitions in context |

Any `tool_choice` value can also carry `"disable_parallel_tool_use": true` to cap Claude at a single tool call per response (by default it may emit several `tool_use` blocks at once).

### When to Use Each

**`"auto"`** — Most conversations. Claude decides whether a tool is needed.

**`"any"`** — When you need guaranteed structured output. Example: You have multiple extraction schemas (invoice, receipt, contract) and you want Claude to pick the right one and always return structured data.

**Forced specification** — When a specific tool must run first. Example: Always call `extract_metadata` before any enrichment step.

**`"none"`** — When a turn must produce prose (e.g., a final summarization pass) without stripping the tool definitions from the request.

```python
# Force Claude to call a specific tool
response = client.messages.create(
    model="claude-opus-5",
    messages=[...],
    tools=[...],
    tool_choice={"type": "tool", "name": "extract_metadata"}
)
```

---

## 2.4 MCP Server Configuration

### What is MCP?

The Model Context Protocol is an open standard for connecting AI models to external data sources and tools. It provides a standardized way for Claude to interact with databases, APIs, file systems, and other services.

### Architecture

```
┌─────────────────────────────────────┐
│              Host                   │
│         (Claude Code)               │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Client 1 │  │ Client 2 │  ...  │
│  └─────┬────┘  └─────┬────┘       │
└────────┼──────────────┼────────────┘
         │              │
         ↓              ↓
   ┌──────────┐   ┌──────────┐
   │ Server 1 │   │ Server 2 │
   │ (GitHub)  │   │ (Postgres)│
   └──────────┘   └──────────┘
```

- **Host**: The AI application (Claude Code, an IDE) that coordinates MCP clients
- **Client**: A component within the host that maintains a 1:1 connection to an MCP server
- **Server**: A program that provides context (tools, resources, prompts) to the client

### Transport Types

| Transport | `type` in config | How It Works | When to Use |
|-----------|------------------|--------------|-------------|
| **stdio** | `"stdio"` (implied when the entry has `command`) | Standard input/output | Local process communication. No network overhead. Most common for local tools. |
| **Streamable HTTP** | `"http"` (alias: `"streamable-http"`) | HTTP POST for client→server, optional SSE for streaming | Remote servers, cloud-hosted tools. The only remote transport that supports OAuth |
| **SSE** (legacy) | `"sse"` | Server-Sent Events endpoint | Services that still expose only an SSE endpoint |
| **WebSocket** | `"ws"` | Persistent bidirectional connection | Remote servers that push events unprompted. Header-only auth, no OAuth |

> **Config gotcha:** an entry with a `url` but no `type` is a configuration error — Claude Code reads a typeless entry as a stdio server, skips it, and reports `has a "url" but no "type"`. Always set `type` on remote servers.

### MCP Protocol Details

- Uses **JSON-RPC 2.0** message format
- Lifecycle:
  1. `initialize` — Capability negotiation (what the server supports)
  2. `notifications/initialized` — Server confirms ready
  3. `tools/list` — Client discovers available tools
  4. `tools/call` — Client invokes a tool

### Server Primitives

| Primitive | What It Is | Example |
|-----------|-----------|---------|
| **Tools** | Executable functions | `search_database`, `create_issue` |
| **Resources** | Data sources (read-only content catalogs) | File listings, database schemas |
| **Prompts** | Interaction templates | Pre-built prompt workflows |

### Client Primitives

| Primitive | What It Is |
|-----------|-----------|
| **Sampling** | Server requests an LLM completion from the client |
| **Elicitation** | Server requests user input from the client |
| **Roots** | Server asks the client which URIs or filesystem boundaries it may operate within |

### Installation Scopes

Three scopes, and the file a server lands in depends on the scope — not on which file you happened to edit.

| Scope | Loads in | Shared with the team? | Stored in |
|-------|----------|----------------------|-----------|
| **Local** (default) | Current project only | No | `~/.claude.json`, keyed by project path |
| **Project** | Current project only | Yes, via version control | `.mcp.json` in the project root |
| **User** | All your projects | No | `~/.claude.json` |

Note the naming trap: MCP *local scope* lives in `~/.claude.json` (home directory), while general *local settings* live in `.claude/settings.local.json` (project directory). They are unrelated files.

Adding servers from the CLI:

```bash
# Remote HTTP server, shared with the team
claude mcp add --transport http --scope project shared-api https://example.com/mcp

# Remote server with a static auth header
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer $TOKEN"

# Local stdio server — everything after -- is passed to the server untouched
claude mcp add airtable --env AIRTABLE_API_KEY=YOUR_KEY -- npx -y @example/mcp-server

# Paste a config block written for another MCP client
claude mcp add-json example '{"type":"http","url":"https://mcp.example.com/mcp"}'
```

### Project-Level Configuration (`.mcp.json`)

This file lives in the project root and is version-controlled:

```json
{
  "mcpServers": {
    "shared-api": {
      "type": "http",
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${API_TOKEN}" },
      "timeout": 600000
    },
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

**Key details:**
- `${DATABASE_URL}` — Environment variable expansion. The actual secret is NOT in the config file. Use `${VAR:-default}` when the variable may be unset.
- `command` + `args` — How to start the MCP server process (stdio transport)
- `timeout` — per-server tool execution timeout in milliseconds; overrides `MCP_TOOL_TIMEOUT` for that server
- Claude Code **prompts for approval** before using project-scoped servers from `.mcp.json` in interactive sessions. `claude -p`, Agent SDK sessions, and cloud sessions can't show that prompt and load them without asking — use `disabledMcpjsonServers` or `--setting-sources` to keep a server out of headless runs
- Some server names are reserved (`workspace`, `claude-in-chrome`, `computer-use`, `Claude Preview`, `Claude Browser`) and will be skipped with a warning

### Authentication for Remote Servers

HTTP and SSE servers support **OAuth** — run `/mcp` in-session (or `claude mcp add` then authenticate) and Claude Code handles the browser flow and token refresh. For services without OAuth, pass a static token via `headers`, or generate one at connect time with `headersHelper` (a command whose stdout becomes the header value) when the credential is short-lived. WebSocket servers are header-only.

### Tool Search Is On by Default in Claude Code

MCP tool definitions are **deferred** by default: only tool names and server instructions load at session start, and Claude searches for the rest on demand. That is why Claude Code imposes no per-server tool cap — the practical limit is your context budget.

| `ENABLE_TOOL_SEARCH` | Behavior |
|---|---|
| (unset) | All MCP tools deferred, loaded on demand |
| `true` | Force deferral (sends the beta header even through proxies) |
| `auto` / `auto:N` | Load upfront while deferred definitions total under 10% (or N%) of the context window; defer once past it |
| `false` | Load every MCP tool upfront |

Set `"alwaysLoad": true` on a server entry to exempt it from deferral when Claude needs its tools on every turn. Server authors should write good **server instructions** — with tool search on, those instructions are how Claude decides whether to search your server at all. Claude Code truncates tool descriptions and server instructions at 2 KB each.

### Output Limits

Claude Code warns when MCP tool output exceeds **10,000 tokens** and truncates at **25,000 tokens** by default. Raise the ceiling with `MAX_MCP_OUTPUT_TOKENS`; the warning threshold is fixed. This is the mechanical reason tool-output trimming (Domain 5) matters — a chatty server can silently lose the tail of its own response.

### MCP Resources

Resources expose content catalogs to reduce exploratory tool calls. Instead of Claude blindly searching, it can browse available resources:

```json
{
  "resources": [
    {
      "uri": "file:///project/docs/api-reference.md",
      "name": "API Reference",
      "mimeType": "text/markdown"
    }
  ]
}
```

---

## 2.5 Built-in Tools

Claude Code's built-in tools and when to use each:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Grep** | Search file contents for patterns | Finding function definitions, error messages, imports, string patterns |
| **Glob** | Find files by name/extension | Locating files: `**/*.test.ts`, `src/**/config.*` |
| **Read** | Load full file contents | Reading a specific file after finding it with Grep/Glob |
| **Write** | Create new files | Creating new files that don't exist |
| **Edit** | Targeted modifications | Changing specific sections of existing files (uses unique text matching) |
| **Bash** | Run terminal commands | git, npm, running scripts, system commands |
| **WebSearch / WebFetch** | Search the web; fetch and read a URL | Looking up current docs, checking an API's behavior |
| **Agent** | Spawn a subagent | Delegating bounded or noisy work (see Domain 1 §1.3) |
| **Skill** | Invoke a skill by name | Running a packaged workflow |
| **NotebookEdit** | Edit Jupyter notebook cells | `.ipynb` files |
| **AskUserQuestion** | Ask the user a blocking question | Decisions only the user can make |

### Codebase Exploration Pattern

The correct pattern for exploring an unfamiliar codebase:

```
1. Grep for entry points (main functions, route definitions, exports)
2. Read the entry point files
3. Follow imports — Grep for referenced modules
4. Read those files
5. Build understanding iteratively
```

**Anti-pattern:** Reading all files upfront. This wastes context and doesn't build understanding.

### When Edit Fails

The Edit tool works by matching unique text strings. If the text isn't unique in the file, the edit fails.

**Fallback:** Use Read to get the full file, then Write to replace the entire file with the modified version.

---

## 2.6 Anthropic-Defined and Server-Side Tools

Not every tool is one you write. Some are **Anthropic-defined** (schema-less: you declare a `type` and a `name`, and Claude knows the interface), and some are **server-side** (they execute on Anthropic's infrastructure — results come back as content blocks in the same response, with no client-side execution loop).

| Tool | `type` | Client- or server-side | Result block |
|------|--------|------------------------|--------------|
| Web search | `web_search_20260209` | Server | `web_search_tool_result` |
| Web fetch | `web_fetch_20260209` | Server | `web_fetch_tool_result` |
| Code execution | `code_execution_20260521` | Server | `bash_code_execution_tool_result` (`.content.stdout`) |
| Tool search (regex / BM25) | `tool_search_tool_regex_20251119` / `..._bm25_20251119` | Server | `tool_search_tool_result` |
| Memory | `memory_20250818` | Client (you implement the file ops) | standard `tool_result` |
| Bash | `bash_20250124` | Client | standard `tool_result` |
| Text editor | `text_editor_20250728` | Client | standard `tool_result` |

Details worth carrying into an exam or a design review:

- **Version the type string.** `web_search_20260209` / `web_fetch_20260209` add dynamic filtering and need Opus 4.6+ / Sonnet 4.6+; older models use the basic `web_search_20250305` / `web_fetch_20250910`. Don't also declare `code_execution` alongside the `_20260209` variants — they run code under the hood, and a second execution environment confuses the model.
- **Web fetch only fetches URLs already present in the conversation.** It is not a crawler.
- **Server-tool errors do not raise.** They return HTTP 200 with an error object inside the result block (e.g. `{"error_code": "max_uses_exceeded"}`). For web search, a success `content` is a *list* and an error `content` is an *object* — branch on that before indexing. This is the same "empty vs failed" distinction from §2.2, at the API layer.
- **`pause_turn`** is how a server-side tool loop tells you it hit its internal cap. Send the response back to continue (Domain 1 §1.1).
- **Bash and text editor are schema-less.** Declaring a custom tool of your own named `"bash"` with an `input_schema` creates a *different* tool.
- **Advisor tool:** its `model` must be at least as capable as the request's top-level `model` (e.g. executor `claude-sonnet-5` → advisor `claude-opus-5`). An invalid pair returns 400.

### Parallel Tool Use

By default Claude may emit several `tool_use` blocks in one assistant message. Execute them concurrently and return **all** `tool_result` blocks in a **single** user message. Splitting them across multiple messages silently teaches Claude to stop making parallel calls. For a tool that failed, return its `tool_result` with `is_error: true` — never drop it.

### Programmatic Tool Calling

Claude can call *your* custom tool from inside the code execution sandbox instead of round-tripping through the conversation — useful when a tool returns large results that would otherwise flood the context. Declare `{"type": "code_execution_20260120", "name": "code_execution"}` and set `"allowed_callers": ["code_execution_20260120"]` on the custom tool. When responding to a pending programmatic call, the user message must contain **only** `tool_result` blocks — no text. Not compatible with `strict: true`, `disable_parallel_tool_use`, forced `tool_choice`, or MCP tools.

### MCP from the API Side: the MCP Connector

Domain 2's MCP material is written from Claude Code's perspective (a host that manages its own clients). The Messages API can also connect to remote MCP servers directly. It needs **both halves** — passing `mcp_servers` alone is a validation error:

```python
client.beta.messages.create(
    model="claude-opus-5",
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{"type": "url", "url": "https://mcp.example.com/mcp", "name": "example"}],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "example"}],
    messages=[...],
)
```

Set `defer_loading` once on the `mcp_toolset` entry's `default_config` (or per tool in `configs`) rather than on individual tool definitions.

---

## Domain 2 Practice Questions

**Q1:** An agent has 18 tools configured and is frequently selecting the wrong tool. What is the most effective solution?
- A) Improve all 18 tool descriptions to be more detailed
- B) Distribute the tools across specialized subagents with 4-5 tools each
- C) Set tool_choice to "any" to force tool usage
- D) Add examples to the system prompt showing correct tool selection

**Answer: B** — The 4-5 tool maximum per agent is the key architectural principle. Even with better descriptions, 18 tools degrades selection reliability.

**Q2:** A search tool returns an empty array. What should the agent communicate to the user?
- A) "The search service is currently unavailable"
- B) "No results were found matching your query"
- C) Check the response status to distinguish between "no results" and "search failed"
- D) Retry the search with different parameters

**Answer: C** — The agent must distinguish between a valid empty result (status 200, no matches) and a failed search (error/timeout). These require fundamentally different responses.

**Q3:** Where should MCP server credentials be stored in a project using `.mcp.json`?
- A) Directly in the `.mcp.json` file
- B) In environment variables referenced via `${VAR_NAME}` syntax
- C) In a separate `.mcp-secrets.json` file
- D) In the project's `package.json`

**Answer: B** — `.mcp.json` supports environment variable expansion. Credentials should never be committed to version control.

**Q4:** A platform team aggregates six MCP servers, exposing about 200 tools. Tool definitions consume ~55k tokens before any work starts, and tool selection has become unreliable. What is the current recommended fix?

- A) Raise `max_tokens` so there is room for the definitions
- B) Enable the tool search tool and mark all but 3-5 frequently used tools `defer_loading: true`
- C) Set `tool_choice: "any"` so Claude is forced to commit to a tool
- D) Set `defer_loading: true` on every tool including the search tool

**Answer: B** — Tool search keeps only a small hot set plus the search tool in context and loads the rest on demand via `tool_reference` blocks, cutting definition tokens by ~85% while preserving prompt caching. D is a 400 error: at least one tool must stay non-deferred. Splitting across subagents (§2.3) is still valid, but tool search is what makes a 200-tool catalog workable inside one agent.
