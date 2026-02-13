import { z } from "zod";

const invokeResponseSchema = z.object({
  ok: z.boolean().optional(),
  data: z.unknown().optional(),
  result: z.unknown().optional(),
  error: z.unknown().optional(),
}).passthrough();

export class OpenClawClient {
  constructor({ baseUrl, token, timeoutMs = 30000 }, fetchImpl = fetch) {
    this.baseUrl = (baseUrl || "http://127.0.0.1:18789").replace(/\/$/, "");
    this.token = token;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async invoke(invokeCommand, params = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await this.fetchImpl(`${this.baseUrl}/tools/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ invokeCommand, invokeParamsJson: JSON.stringify(params) }),
        signal: controller.signal,
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      const data = invokeResponseSchema.parse(json);

      if (!res.ok) {
        const msg = data?.error?.message || data?.error || data?.message || `${res.status} ${res.statusText}`;
        throw new Error(`OpenClaw invoke failed (${invokeCommand}): ${msg}`);
      }

      if (data.error) {
        const msg = data?.error?.message || data.error;
        throw new Error(`OpenClaw invoke error (${invokeCommand}): ${msg}`);
      }

      return data.data ?? data.result ?? data;
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error(`OpenClaw invoke timeout after ${this.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
