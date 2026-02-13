import { z } from "zod";

const envSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  MCP_PATH: z.string().default("/mcp"),
  OPENCLAW_BASE_URL: z.string().url().default("http://127.0.0.1:18789"),
  OPENCLAW_API_TOKEN: z.string().min(1),
  OPENCLAW_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  OPENCLAW_SUBAGENT_TAG: z.string().min(1).default("subagent"),
});

export function loadConfig(env = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  return parsed.data;
}
