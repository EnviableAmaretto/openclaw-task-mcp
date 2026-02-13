import { describe, it, expect, vi } from "vitest";
import { handleToolCall } from "../src/tools.js";

describe("tools", () => {
  it("start_task maps to sessions_spawn", async () => {
    const client = { invoke: vi.fn().mockResolvedValue({ status: "accepted", sessionId: "abc" }) };
    const out = await handleToolCall(client, "start_task", { title: "build", prompt: "do x" }, "subagent");
    expect(client.invoke).toHaveBeenCalledWith("sessions_spawn", expect.objectContaining({ label: "build", task: "do x" }));
    expect(out.content[0].text).toContain("accepted");
  });

  it("list_tasks filters by subagent tag", async () => {
    const client = {
      invoke: vi.fn().mockResolvedValue({
        items: [
          { id: "a", metadata: { taskType: "subagent" } },
          { id: "b", metadata: { taskType: "other" } },
        ],
      }),
    };
    const out = await handleToolCall(client, "list_tasks", { subagentOnly: true }, "subagent");
    const parsed = JSON.parse(out.content[0].text);
    expect(parsed.count).toBe(1);
  });

  it("get_task_status includes result when available", async () => {
    const client = {
      invoke: vi.fn().mockResolvedValue({
        items: [
          { type: "progress", status: "running" },
          { type: "result", status: "done", result: { ok: true } },
        ],
      }),
    };

    const out = await handleToolCall(client, "get_task_status", { sessionId: "s-1" }, "subagent");
    expect(client.invoke).toHaveBeenCalledWith("sessions_history", expect.objectContaining({ sessionKey: "s-1" }));
    const parsed = JSON.parse(out.content[0].text);
    expect(parsed.status).toBe("done");
    expect(parsed.result).toEqual({ ok: true });
  });
});
