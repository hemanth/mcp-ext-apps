# MCP Ext Apps
> Sample implementation of [MCP Apps Extension (SEP-1865)](https://github.com/modelcontextprotocol/ext-apps) - interactive HTML/JS UIs through MCP tools.

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
3. Tool returns `text/html+mcp` resource with `ui://` URI
4. Host renders in sandboxed iframe with CSP
5. UI communicates via JSON-RPC 2.0 over `postMessage`

## SEP-1865 Compliance

- `ui://` scheme for resource URIs
- `text/html+mcp` MIME type
- `_meta.ui/resourceUri` in tool responses
- `ui/initialize` handshake protocol
- JSON-RPC 2.0 message format
- Sandboxed iframe with CSP headers

## Scripts

```bash
npm start       # Build + start server
npm run server  # MCP server (port 3001)
npm run host    # Host client (port 8080)
```

## License

MIT
