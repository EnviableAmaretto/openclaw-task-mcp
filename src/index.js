#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { OpenClawClient } from "./openclaw-client.js";
import { TOOL_DEFS, handleToolCall } from "./tools.js";
import { loadConfig } from "./config.js";

function createServer(client, subagentTag) {
  const server = new Server(
    { name: "openclaw-task-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    try {
      return await handleToolCall(client, req.params.name, req.params.arguments || {}, subagentTag);
    } catch (err) {
      return {
        content: [{ type: "text", text: `ERROR: ${err.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

async function main() {
  const cfg = loadConfig();
  const client = new OpenClawClient({
    baseUrl: cfg.OPENCLAW_BASE_URL,
    token: cfg.OPENCLAW_API_TOKEN,
    timeoutMs: cfg.OPENCLAW_TIMEOUT_MS,
  });

  const app = createMcpExpressApp({ host: cfg.HOST });
  const sessions = new Map();

  const handleMcp = async (req, res) => {
    const existing = req.headers["mcp-session-id"];
    if (existing && sessions.has(existing)) {
      const { transport } = sessions.get(existing);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    const server = createServer(client, cfg.OPENCLAW_SUBAGENT_TAG);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => sessions.set(sessionId, { server, transport }),
    });

    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  };

  app.all(cfg.MCP_PATH, async (req, res) => {
    try {
      await handleMcp(req, res);
    } catch (err) {
      res.status(500).json({ error: err.message || "internal error" });
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "openclaw-task-mcp", openclawUrl: cfg.OPENCLAW_BASE_URL });
  });

  app.listen(cfg.PORT, cfg.HOST, () => {
    console.error(`[openclaw-task-mcp] listening on http://${cfg.HOST}:${cfg.PORT}${cfg.MCP_PATH}`);
  });
}

main().catch((e) => {
  console.error(`[openclaw-task-mcp] fatal: ${e.message}`);
  process.exit(1);
});
