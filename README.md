# openclaw-task-mcp

Streamable HTTP MCP server that wraps OpenClaw `/tools/invoke` for task lifecycle:

- `start_task` → `sessions_spawn`
- `list_tasks` → `sessions_list` (subagent-filtered by default)
- `get_task_status` → `sessions_history` (returns latest status + result when available)

## Requirements

- Node.js **>= 18.19.1**
- OpenClaw endpoint with `POST /tools/invoke`
- API token for OpenClaw

## Setup (generic)

```bash
git clone <YOUR_REPO_URL> openclaw-task-mcp
cd openclaw-task-mcp
npm install
cp .env.example .env
# edit .env
```

## Environment variables

- `HOST` (default `127.0.0.1`)
- `PORT` (default `8787`)
- `MCP_PATH` (default `/mcp`)
- `OPENCLAW_BASE_URL` (default `http://127.0.0.1:18789`)
- `OPENCLAW_API_TOKEN` (**required**)
- `OPENCLAW_TIMEOUT_MS` (default `30000`)
- `OPENCLAW_SUBAGENT_TAG` (default `subagent`)

## Run

```bash
npm start
```

Server URL: `http://HOST:PORT/MCP_PATH` (for example `http://127.0.0.1:8787/mcp`).

## SillyTavern host setup (Streamable HTTP)

1. Start this MCP server on the same host as SillyTavern (or reachable LAN host).
2. In SillyTavern MCP settings, add server type **Streamable HTTP**.
3. URL:
   - local: `http://127.0.0.1:8787/mcp`
   - remote host: `http://<host-ip>:8787/mcp`
4. Save, reconnect, and verify tools: `start_task`, `list_tasks`, `get_task_status`.

## Claude-code-style JSON config

```json
{
  "mcpServers": {
    "openclaw-task-mcp": {
      "transport": "streamable_http",
      "url": "http://127.0.0.1:8787/mcp",
      "headers": {
        "x-client-name": "claude-code"
      }
    }
  }
}
```

## OpenClaw invoke payload used

Requests are sent to:

`POST {OPENCLAW_BASE_URL}/tools/invoke`

with body shape:

```json
{
  "invokeCommand": "sessions_spawn",
  "invokeParamsJson": "{\"label\":\"...\",\"prompt\":\"...\"}"
}
```

and auth header: `Authorization: Bearer <OPENCLAW_API_TOKEN>`.

## Validation and error handling

- Strict input validation with `zod` for all tool params
- Strict env validation at startup (fails fast with actionable message)
- HTTP/network timeout handling for OpenClaw calls
- Structured tool errors returned with `isError: true`

## Security notes

- Never commit `.env` or tokens
- Use least-privilege tokens where possible
- Keep server bound to localhost unless remote access is required
- For remote access, place behind TLS/auth proxy and restrict source IPs
- Rotate tokens regularly

## Tests

Run:

```bash
npm test
```

Covers:
- env validation
- `/tools/invoke` payload + error path
- subagent filtering in `list_tasks`
- result extraction in `get_task_status`
