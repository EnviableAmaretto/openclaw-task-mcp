#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { OpenClawClient } from "./openclaw-client.js";
import { TOOL_DEFS, handleToolCall } from "./tools.js";

const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL || "http://127.0.0.1:18789";
const OPENCLAW_API_TOKEN = process.env.OPENCLAW_API_TOKEN;
const OPENCLAW_TIMEOUT_MS = Number(process.env.OPENCLAW_TIMEOUT_MS || 30000);

const client = new OpenClawClient({
  baseUrl: OPENCLAW_BASE_URL,
  token: OPENCLAW_API_TOKEN,
  timeoutMs: OPENCLAW_TIMEOUT_MS,
});

const server = new Server(
  { name: "openclaw-task-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_DEFS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleToolCall(client, req.params.name, req.params.arguments || {});
  } catch (err) {
    return {
      content: [{ type: "text", text: `ERROR: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
