import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("config", () => {
  it("loads valid config", () => {
    const cfg = loadConfig({ OPENCLAW_API_TOKEN: "x" });
    expect(cfg.PORT).toBe(8787);
    expect(cfg.MCP_PATH).toBe("/mcp");
  });

  it("throws on missing token", () => {
    expect(() => loadConfig({})).toThrow(/OPENCLAW_API_TOKEN/);
  });
});
