import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenClawClient } from "../src/openclaw-client.js";

describe("OpenClawClient", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls /tools/invoke with tool/params (plus legacy fields)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: { x: 1 } }),
    });

    const c = new OpenClawClient({ baseUrl: "https://x.test", token: "t" });
    await c.invoke("sessions_list", { limit: 1 });

    expect(fetch).toHaveBeenCalledWith(
      "https://x.test/tools/invoke",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          tool: "sessions_list",
          params: { limit: 1 },
          invokeCommand: "sessions_list",
          invokeParamsJson: JSON.stringify({ limit: 1 }),
        }),
      })
    );
  });

  it("throws on invoke error payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ error: { message: "bad token" } }),
    });

    const c = new OpenClawClient({ baseUrl: "https://x.test", token: "t" });
    await expect(c.invoke("sessions_list", {})).rejects.toThrow("bad token");
  });
});
