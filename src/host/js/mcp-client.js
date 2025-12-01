const MCP_SERVER = 'http://localhost:3001/mcp';

let sessionId = null;

export async function sendRequest(method, params = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
    };

    if (sessionId) {
        headers['mcp-session-id'] = sessionId;
    }

    const response = await fetch(MCP_SERVER, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
        }),
    });

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            const newSessionId = response.headers.get('mcp-session-id');
            if (newSessionId) {
                sessionId = newSessionId;
            }
            return data;
        }
    }

    throw new Error('No data in response');
}

export async function initialize() {
    const result = await sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'simple-host', version: '1.0.0' },
    });
    await sendRequest('notifications/initialized', {});
    return result;
}

export async function listTools() {
    const result = await sendRequest('tools/list', {});
    return result.result.tools || [];
}

export async function callTool(name, args) {
    const result = await sendRequest('tools/call', { name, arguments: args });
    return result.result;
}

export async function disconnect() {
    if (sessionId) {
        await fetch(MCP_SERVER, {
            method: 'DELETE',
            headers: { 'mcp-session-id': sessionId },
        });
        sessionId = null;
    }
}

export function getSessionId() {
    return sessionId;
}
