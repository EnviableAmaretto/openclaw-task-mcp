import { z } from "zod";

const startTaskSchema = z.object({
  title: z.string().min(1).max(200),
  prompt: z.string().min(1),
  requesterSession: z.string().min(1).max(200).optional(),
  channel: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const listTasksSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  subagentOnly: z.boolean().default(true),
});

const getTaskStatusSchema = z.object({
  sessionId: z.string().min(1).optional(),
  sessionKey: z.string().min(1).optional(),
  includeResult: z.boolean().default(true),
}).refine((v) => Boolean(v.sessionId || v.sessionKey), {
  message: "sessionId or sessionKey is required",
});

export const TOOL_DEFS = [
  {
    name: "start_task",
    description: "Start a subagent task via OpenClaw sessions_spawn",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        prompt: { type: "string" },
        requesterSession: { type: "string" },
        channel: { type: "string" },
        metadata: { type: "object" },
      },
      required: ["title", "prompt"],
    },
  },
  {
    name: "list_tasks",
    description: "List tasks via sessions_list, filtered to subagent by default",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 50 },
        cursor: { type: "string" },
        subagentOnly: { type: "boolean", default: true },
      },
    },
  },
  {
    name: "get_task_status",
    description: "Get task status from sessions_history and include result when available",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        includeResult: { type: "boolean", default: true },
      },
      required: ["sessionId"],
    },
  },
];

function asText(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function listFromResponse(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.items)) return resp.items;
  if (Array.isArray(resp?.sessions)) return resp.sessions;
  return [];
}

export async function handleToolCall(client, name, rawArgs = {}, subagentTag = "subagent") {
  if (name === "start_task") {
    const args = startTaskSchema.parse(rawArgs);
    const result = await client.invoke("sessions_spawn", {
      label: args.title,
      task: args.prompt,
      requesterSession: args.requesterSession,
      channel: args.channel,
      metadata: { ...(args.metadata || {}), taskType: subagentTag },
    });
    return asText(result);
  }

  if (name === "list_tasks") {
    const args = listTasksSchema.parse(rawArgs);
    const result = await client.invoke("sessions_list", {
      limit: args.limit,
      cursor: args.cursor,
    });

    const sessions = listFromResponse(result);
    const filtered = args.subagentOnly
      ? sessions.filter((s) => s?.metadata?.taskType === subagentTag || String(s?.label || "").includes(subagentTag))
      : sessions;

    return asText({ items: filtered, count: filtered.length });
  }

  if (name === "get_task_status") {
    const args = getTaskStatusSchema.parse(rawArgs);
    const sessionKey = args.sessionKey || args.sessionId;
    const history = await client.invoke("sessions_history", {
      sessionKey,
      limit: 200,
    });

    const items = listFromResponse(history);
    const last = items[items.length - 1] || null;
    const resultEntry = [...items].reverse().find((i) => i?.type === "result" || i?.result !== undefined) || null;

    return asText({
      sessionId: sessionKey,
      status: last?.status || "unknown",
      lastEvent: last,
      eventCount: items.length,
      result: args.includeResult ? (resultEntry?.result ?? resultEntry) : undefined,
    });
  }

  throw new Error(`Unknown tool: ${name}`);
}
