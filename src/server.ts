import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { readFileSync } from "fs";
import { z } from "zod";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["mcp-session-id"],
  })
);

// Load UI HTML from dist folder (built by Vite)
const uiHtml = readFileSync("./dist/src/ui/index.html", "utf-8");

// Store active sessions
const sessions = new Map<
  string,
  { transport: StreamableHTTPServerTransport; server: McpServer }
>();

// Create MCP server instance
function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "mcp-ui-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  // Register a tool that returns UI
  server.tool(
    "show-dashboard",
    "Display an interactive dashboard UI",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Here is your interactive dashboard:",
          },
          {
            type: "resource",
            resource: {
              uri: "app://mcp-ui-server/dashboard",
              mimeType: "text/html",
              text: uiHtml,
            },
          },
        ],
      };
    }
  );

  // Register a tool to get current time
  server.tool(
    "get-time",
    "Get the current server time",
    {},
    async () => {
      const now = new Date();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              time: now.toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              formatted: now.toLocaleString(),
            }),
          },
        ],
      };
    }
  );

  // Register a greeting tool with parameters
  server.tool(
    "greet-user",
    "Greet a user by name",
    {
      name: z.string().describe("The name of the user to greet"),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: `Hello, ${name}! Welcome to the MCP UI Server.`,
          },
        ],
      };
    }
  );

  // Register a calculator tool
  server.tool(
    "calculate",
    "Perform a simple calculation",
    {
      operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The operation to perform"),
      a: z.number().describe("First number"),
      b: z.number().describe("Second number"),
    },
    async ({ operation, a, b }) => {
      let result: number;
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) {
            return {
              content: [{ type: "text", text: "Error: Division by zero" }],
              isError: true,
            };
          }
          result = a / b;
          break;
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ operation, a, b, result }),
          },
        ],
      };
    }
  );

  return server;
}

// Handle MCP POST requests (initialize session or send messages)
app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    // Existing session - forward request
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res, req.body);
  } else {
    // New session - create transport and server
    const newSessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessioninitialized: (id) => {
        console.log(`Session initialized: ${id}`);
      },
    });

    const server = createMcpServer();
    sessions.set(newSessionId, { transport, server });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
});

// Handle MCP GET requests (SSE streaming)
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
});

// Handle MCP DELETE requests (close session)
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.close();
    await session.server.close();
    sessions.delete(sessionId);
    console.log(`Session closed: ${sessionId}`);
  }

  res.status(204).send();
});

// Cleanup on shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  for (const [id, session] of sessions) {
    await session.transport.close();
    await session.server.close();
    sessions.delete(id);
  }
  process.exit(0);
});

const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP UI Server running on http://localhost:${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
