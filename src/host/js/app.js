import './components/status-bar.js';
import './components/tools-sidebar.js';
import './components/app-container.js';
import './components/log-panel.js';
import './components/debug-panel.js';
import './components/resources-panel.js';
import './components/resizable-panels.js';
import * as mcpClient from './mcp-client.js';
import { generateToolFormHtml } from './tool-ui.js';

let tools = [];
let selectedTool = null;

// DOM elements
const statusBar = document.getElementById('statusBar');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const toolsSidebar = document.getElementById('toolsSidebar');
const appContainer = document.getElementById('appContainer');

// These need to be functions to get fresh references after resizable-panels moves them
const getLogPanel = () => document.getElementById('logPanel');
const getDebugPanel = () => document.getElementById('debugPanel');
const getResourcesPanel = () => document.getElementById('resourcesPanel');

// Setup debug callback
mcpClient.setDebugCallback((type, method, data) => {
    const debugPanel = getDebugPanel();
    if (type === 'request') {
        debugPanel?.logRequest(method, data);
    } else {
        debugPanel?.logResponse(method, data);
    }
});

// Logging
function log(message, type = 'info') {
    const logPanel = getLogPanel();
    logPanel?.log(message, type);
}

// Status management
function updateStatus(connected) {
    statusBar.connected = connected;
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
}

// Connection
async function connect() {
    try {
        log('Connecting to MCP server...');
        const result = await mcpClient.initialize();
        log(`Connected to ${result.result.serverInfo.name} v${result.result.serverInfo.version}`, 'success');
        updateStatus(true);

        tools = await mcpClient.listTools();
        log(`Found ${tools.length} tools`, 'success');
        toolsSidebar.tools = tools;
    } catch (err) {
        log(`Connection failed: ${err.message}`, 'error');
        updateStatus(false);
    }
}

async function disconnect() {
    try {
        await mcpClient.disconnect();
        log('Disconnected from server', 'info');
    } catch (err) {
        log(`Disconnect error: ${err.message}`, 'error');
    }

    tools = [];
    updateStatus(false);
    toolsSidebar.tools = [];
    appContainer.showPlaceholder();
}

// Tool selection handler
toolsSidebar.addEventListener('tool-select', (e) => {
    const tool = e.detail.tool;
    selectedTool = tool;
    log(`Selected tool: ${tool.name}`);
    const html = generateToolFormHtml(tool);
    appContainer.renderHtml(html);
});

// Tool execution
async function executeTool(toolName, args) {
    try {
        log(`Calling tool: ${toolName} with args: ${JSON.stringify(args)}`);
        const result = await mcpClient.callTool(toolName, args);
        log(`Tool ${toolName} executed successfully`, 'success');

        const content = result?.content || [];
        let resultText = '';

        for (const item of content) {
            if (item.type === 'resource') {
                const resourcesPanel = getResourcesPanel();
                resourcesPanel?.addResource(item.resource);
                // SEP-1865: check for text/html+mcp or text/html
                if (item.resource?.mimeType === 'text/html+mcp' || item.resource?.mimeType === 'text/html') {
                    appContainer.renderHtml(item.resource.text);
                    return { html: true };
                }
            }
            if (item.type === 'text') {
                resultText += item.text;
            }
        }

        return { result: resultText };
    } catch (err) {
        log(`Tool call failed: ${err.message}`, 'error');
        return { error: err.message };
    }
}

// Tool call handler from app container
appContainer.addEventListener('tool-call', async (e) => {
    const { toolName, arguments: args, callback } = e.detail;
    log(`App requested tool call: ${toolName}`);
    const result = await executeTool(toolName, args);
    callback(result);
});

// Button handlers
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

// Vertical resizer for app container / bottom panels
const verticalResizer = document.getElementById('verticalResizer');
const bottomPanels = document.getElementById('bottomPanels');

verticalResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bottomPanels.offsetHeight;
    const mainContent = document.querySelector('.main-content');
    const maxHeight = mainContent.offsetHeight - 100;
    const minHeight = 50;

    // Disable pointer events on iframe to prevent it from capturing mouse events during drag
    const iframe = appContainer.shadowRoot?.querySelector('iframe');
    if (iframe) {
        iframe.style.pointerEvents = 'none';
    }

    verticalResizer.classList.add('dragging');
    bottomPanels.classList.add('resizing');

    const onMouseMove = (e) => {
        const delta = startY - e.clientY;
        const newHeight = Math.max(minHeight, Math.min(startHeight + delta, maxHeight));
        bottomPanels.style.height = newHeight + 'px';
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        verticalResizer.classList.remove('dragging');
        bottomPanels.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Re-enable pointer events on iframe
        if (iframe) {
            iframe.style.pointerEvents = '';
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
});
