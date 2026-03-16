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
  Coordinator with: Task, AskUser
  Search subagent with: search_web, search_docs, search_db
  Analysis subagent with: analyze_text, extract_entities, summarize
  Action subagent with: send_email, create_ticket, update_record
```

### tool_choice Parameter

Controls how Claude interacts with tools:

| Value | Behavior | Use Case |
|-------|----------|----------|
| `"auto"` (default) | Claude may call a tool OR respond with text | General conversation with optional tool use |
| `"any"` | Claude MUST call a tool, but can choose which | Guarantee structured output |
| `{"type": "tool", "name": "specific_tool"}` | Claude MUST call this exact tool | Force a specific operation first |

### When to Use Each

**`"auto"`** — Most conversations. Claude decides whether a tool is needed.

**`"any"`** — When you need guaranteed structured output. Example: You have multiple extraction schemas (invoice, receipt, contract) and you want Claude to pick the right one and always return structured data.

**Forced specification** — When a specific tool must run first. Example: Always call `extract_metadata` before any enrichment step.

```python
# Force Claude to call a specific tool
response = client.messages.create(
    model="claude-opus-4-6",
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

| Transport | How It Works | When to Use |
|-----------|-------------|-------------|
| **stdio** | Standard input/output | Local process communication. No network overhead. Most common for local tools. |
| **Streamable HTTP** | HTTP POST for client→server, optional SSE for streaming | Remote servers, cloud-hosted tools |

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

### Project-Level Configuration (`.mcp.json`)

This file lives in the project root and is version-controlled:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
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
- `${GITHUB_TOKEN}` — Environment variable expansion. The actual secret is NOT in the config file.
- `command` + `args` — How to start the MCP server process (stdio transport)
- Tools from ALL configured servers are discovered at connection and available simultaneously

### User-Level Configuration (`~/.claude.json`)

For personal or experimental servers that shouldn't be in the project's version control:

```json
{
  "mcpServers": {
    "my-personal-tool": {
      "command": "node",
      "args": ["/path/to/my-tool/server.js"]
    }
  }
}
```

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
