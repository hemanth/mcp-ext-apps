# MCP Ext Apps

Implementation of [MCP Apps Extension (SEP-1865)](https://github.com/anthropics/mcp-sep) - interactive HTML/JS UIs through MCP tools.

https://github.com/user-attachments/assets/dd4c968f-1b82-4975-8b89-374933363a99

## Quick Start

```bash
npm install
npm start
```

Open http://localhost:8080

## How It Works

```
Host Client                              MCP Server
┌────────────────────┐                  ┌──────────────┐
│  tools-sidebar     │ ── call tool ─> │  Tools:      │
│  app-container     │ <── HTML UI ─── │  - dashboard │
│  [sandboxed iframe]│                 │  - clock     │
└────────────────────┘                  └──────────────┘
   localhost:8080                        localhost:3001
```

1. Host connects to MCP server, lists tools
2. User clicks a tool, host calls it via MCP
3. Tool returns HTML/CSS/JS as a resource
4. Host renders it in a sandboxed iframe
5. UI can call other tools via `postMessage`

## Scripts

```bash
npm start       # Build + start server
npm run server  # MCP server (port 3001)
npm run host    # Host client (port 8080)
npm test        # Run Playwright tests
```

## License

MIT
