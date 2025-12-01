# MCP Ext Apps
> An MCP server that serves interactive HTML/JavaScript UIs through tool responses, built with Web Components.

```
                        MCP Protocol (StreamableHTTP)

  Host Client                                           MCP Server
 ┌─────────────────────────┐                     ┌─────────────────────┐
 │                         │   1. Connect        │                     │
 │  ┌─────────────────┐    │  ---------------->  │  Tools:             │
 │  │  <tools-sidebar>│    │                     │  - show-dashboard   │
 │  │                 │    │   2. List Tools     │  - get-time         │
 │  │  > dashboard    │    │  <----------------  │  - greet-user       │
 │  │    get-time     │    │                     │  - calculate        │
 │  │    greet-user   │    │   3. Call Tool      │                     │
 │  │    calculate    │    │  ---------------->  │                     │
 │  └─────────────────┘    │                     │                     │
 │                         │   4. Return HTML    │                     │
 │  ┌─────────────────┐    │  <----------------  │                     │
 │  │ <app-container> │    │                     └─────────────────────┘
 │  │                 │    │
 │  │  ┌───────────┐  │    │  The server returns HTML as a
 │  │  │  UI App   │  │    │  resource with mimeType: text/html
 │  │  └───────────┘  │    │
 │  │                 │    │  The host renders it in an iframe
 │  └─────────────────┘    │  with sandbox="allow-scripts"
 │                         │
 └─────────────────────────┘
    localhost:8080                localhost:3001
```

## Quick Start

```bash
npm install
npm start
```

Then open http://localhost:8080

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Build UI and start MCP server |
| `npm run build` | Build UI with Vite |
| `npm run server` | Start MCP server on port 3001 |
| `npm run host` | Serve host client on port 8080 |

## Project Structure

```
├── src/
│   ├── server.ts              # MCP server with tools
│   ├── host/                  # Host client (Web Components)
│   │   ├── index.html
│   │   ├── css/styles.css
│   │   └── js/
│   │       ├── app.js
│   │       ├── mcp-client.js
│   │       ├── tool-ui.js
│   │       └── components/
│   │           ├── status-bar.js
│   │           ├── tools-sidebar.js
│   │           ├── app-container.js
│   │           └── log-panel.js
│   └── ui/                    # Dashboard UI (Web Components)
│       ├── index.html
│       ├── css/styles.css
│       └── js/
│           ├── app.js
│           └── components/
│               ├── live-clock.js
│               ├── stats-grid.js
│               ├── greeting-tool.js
│               ├── calculator-tool.js
│               └── quick-actions.js
├── public/
│   └── favicon.png
├── dist/                      # Built output
├── vite.config.ts
└── package.json
```

## Web Components

### Host Components

| Component | Description |
|-----------|-------------|
| `<status-bar>` | Connection status indicator |
| `<tools-sidebar>` | Dynamic tool list with selection |
| `<app-container>` | Sandboxed iframe renderer |
| `<log-panel>` | Activity log with timestamps |

### Dashboard Components

| Component | Description |
|-----------|-------------|
| `<live-clock>` | Auto-updating clock |
| `<stats-grid>` | Reactive stats display |
| `<greeting-tool>` | Name greeting form |
| `<calculator-tool>` | Basic calculator |
| `<quick-actions>` | Action buttons |

## Tools

| Tool | Description | Returns |
|------|-------------|---------|
| `show-dashboard` | Interactive dashboard | HTML UI |
| `get-time` | Current server time | JSON |
| `greet-user` | Greet by name | Text |
| `calculate` | Basic math operations | JSON |

## How It Works

1. **Server** exposes tools via MCP StreamableHTTP transport
2. **Host** connects to server, lists available tools
3. **User** clicks a tool in the `<tools-sidebar>`
4. **Host** generates a form UI based on tool schema
5. **User** fills parameters and clicks Execute
6. **Host** calls the tool via MCP
7. **Tool** returns content (text or HTML)
8. **Host** renders HTML responses in `<app-container>` iframe

## MCP Endpoint

```
POST /mcp  - Initialize session, call tools
GET  /mcp  - SSE streaming (with session ID header)
DELETE /mcp - Close session
```

## License

MIT
