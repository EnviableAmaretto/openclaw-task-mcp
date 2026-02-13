# AGENTS.md — openclaw-task-mcp

## Non-negotiable pre-commit / pre-push rule

If you change code in this repository, **do not commit** until all checks below pass:

1. **Unit + smoke tests**
   - Run: `npm test`
2. **Launch the MCP server**
   - Run: `npm start`
3. **Real E2E MCP verification against the running server**
   - Perform at least one successful real call through the MCP integration path (not mocked tests only), e.g. `list_tasks` and `get_task_status` flow.

If E2E fails, stop and fix before commit.

## Required evidence in commit message or PR body

Include a short verification block:

- `npm test`: pass/fail
- MCP server launch: pass/fail
- E2E call result: pass/fail + brief output snippet

No evidence = no merge.
