import './components/live-clock.js';
import './components/stats-grid.js';
import './components/greeting-tool.js';
import './components/calculator-tool.js';
import './components/quick-actions.js';

// SEP-1865 MCP Host Bridge
class McpHostBridge {
    constructor() {
        this._messageId = 0;
        this._pendingRequests = new Map();
        this._initialized = false;
        this._hostContext = null;

        window.addEventListener('message', this._handleMessage.bind(this));
    }

    _handleMessage(event) {
        const data = event.data;
        if (data.jsonrpc !== '2.0') return;

        // Handle responses
        if (data.id && this._pendingRequests.has(data.id)) {
            const { resolve, reject } = this._pendingRequests.get(data.id);
            this._pendingRequests.delete(data.id);
            if (data.error) {
                reject(new Error(data.error.message));
            } else {
                resolve(data.result);
            }
        }

        // Handle notifications from host
        if (data.method) {
            this._handleNotification(data.method, data.params);
        }
    }

    _handleNotification(method, params) {
        switch (method) {
            case 'ui/notifications/tool-input':
                console.log('Received tool input:', params);
                document.dispatchEvent(new CustomEvent('mcp:tool-input', { detail: params }));
                break;
            case 'ui/notifications/tool-result':
                console.log('Received tool result:', params);
                document.dispatchEvent(new CustomEvent('mcp:tool-result', { detail: params }));
                break;
        }
    }

    async initialize() {
        const result = await this._sendRequest('ui/initialize', {
            capabilities: {},
            clientInfo: { name: 'mcp-dashboard', version: '1.0.0' },
        });
        this._initialized = true;
        this._hostContext = result.hostContext;
        console.log('MCP UI initialized:', result);

        // Send initialized notification
        this._sendNotification('ui/notifications/initialized', {});

        return result;
    }

    async callTool(name, args = {}) {
        return this._sendRequest('tools/call', { name, arguments: args });
    }

    _sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            const id = ++this._messageId;
            this._pendingRequests.set(id, { resolve, reject });

            window.parent.postMessage({
                jsonrpc: '2.0',
                id,
                method,
                params,
            }, '*');

            // Timeout after 30s
            setTimeout(() => {
                if (this._pendingRequests.has(id)) {
                    this._pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }

    _sendNotification(method, params) {
        window.parent.postMessage({
            jsonrpc: '2.0',
            method,
            params,
        }, '*');
    }

    get hostContext() {
        return this._hostContext;
    }
}

// Global MCP bridge instance
window.mcpBridge = new McpHostBridge();

// Stats tracking
let clickCount = 0;
let calcCount = 0;
let greetCount = 0;

function updateStats() {
    const statsGrid = document.querySelector('stats-grid');
    if (statsGrid) {
        statsGrid.setAttribute('clicks', clickCount);
        statsGrid.setAttribute('calculations', calcCount);
        statsGrid.setAttribute('greetings', greetCount);
    }
}

// Event listeners for component events
document.addEventListener('greet', () => {
    greetCount++;
    clickCount++;
    updateStats();
});

document.addEventListener('calculate', () => {
    calcCount++;
    clickCount++;
    updateStats();
});

document.addEventListener('action', () => {
    clickCount++;
    updateStats();
});

// Initialize MCP bridge when loaded
window.mcpBridge.initialize().catch(err => {
    console.log('MCP initialization skipped (not in MCP host):', err.message);
});

console.log('MCP Dashboard UI loaded (SEP-1865 compliant)');
