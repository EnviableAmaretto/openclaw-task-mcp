# openclaw-task-mcp

Simple **Node stdio MCP server** for OpenClaw task lifecycle.

Tools:
- `start_task` → `sessions_spawn`
- `list_tasks` → `sessions_list` (subagent-filtered)
- `get_task_status` → `sessions_history` (+ `result` when available)

## Requirements

- Node.js >= 18.19.1
- Reachable OpenClaw Gateway
- Gateway token with permission to invoke tools

## Install

```bash
git clone https://github.com/EnviableAmaretto/openclaw-task-mcp.git
cd openclaw-task-mcp
npm install
npm run hooks:install
```

## MCP config (Claude-code style / SillyTavern-style)

Put base URL and token directly in the MCP server env block:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/openclaw-task-mcp/src/index.js"],
      "env": {
        "OPENCLAW_BASE_URL": "http://127.0.0.1:18789",
        "OPENCLAW_API_TOKEN": "your-gateway-token",
        "OPENCLAW_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

`args[0]` must be the absolute path where **you** cloned this repository on your host.
Examples:
- `/home/sillytavern/SillyTavern/repositories/openclaw-task-mcp/src/index.js`
- `/opt/openclaw-task-mcp/src/index.js`
- `/srv/mcp/openclaw-task-mcp/src/index.js`

No separate HTTP MCP endpoint is needed in this mode; the app launches this process over stdio.

## Local run (manual)

```bash
OPENCLAW_BASE_URL="http://127.0.0.1:18789" \
OPENCLAW_API_TOKEN="YOUR_TOKEN" \
node src/index.js
```

## Tests

```bash
npm test
```

## Quality gates

- Local pre-push hook (`.githooks/pre-push`) runs `npm test`.
- CI (`.github/workflows/ci.yml`) runs `npm ci && npm test` on push/PR.

## Security notes

- Keep token private; do not commit it.
- Prefer private host networking for the OpenClaw URL.
- Rotate token regularly.
