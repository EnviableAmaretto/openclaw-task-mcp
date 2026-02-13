import { describe, it, expect, vi } from "vitest";
import { OpenClawClient } from "../src/openclaw-client.js";
import { handleToolCall } from "../src/tools.js";

describe("smoke regression guards", () => {
  it("sends modern and legacy invoke fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: { ok: true } }),
      status: 200,
      statusText: "OK",
    });

    const c = new OpenClawClient({ baseUrl: "http://x" }, fetchImpl);
    await c.invoke("sessions_list", { limit: 1 });

    const [, req] = fetchImpl.mock.calls[0];
    const body = JSON.parse(req.body);
    expect(body.tool).toBe("sessions_list");
    expect(body.params).toEqual({ limit: 1 });
    expect(body.invokeCommand).toBe("sessions_list");
    expect(body.invokeParamsJson).toBe(JSON.stringify({ limit: 1 }));
  });

  it("maps get_task_status to sessions_history(sessionKey)", async () => {
    const client = {
      invoke: vi.fn().mockResolvedValue({ items: [{ status: "done", type: "result", result: { ok: true } }] }),
    };

    await handleToolCall(client, "get_task_status", { sessionId: "s-123" });
    expect(client.invoke).toHaveBeenCalledWith("sessions_history", expect.objectContaining({ sessionKey: "s-123" }));
  });
});
