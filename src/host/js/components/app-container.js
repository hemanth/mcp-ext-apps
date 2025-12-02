// SEP-1865 compliant app container
export class AppContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._iframe = null;
        this._messageId = 0;
        this._pendingRequests = new Map();
    }

    connectedCallback() {
        this.render();
        this.setupMessageHandler();
    }

    disconnectedCallback() {
        window.removeEventListener('message', this._messageHandler);
    }

    setupMessageHandler() {
        this._messageHandler = async (event) => {
            if (!this._iframe || event.source !== this._iframe.contentWindow) {
                return;
            }

            const data = event.data;

            // Validate JSON-RPC 2.0 format
            if (data.jsonrpc !== '2.0') {
                return;
            }

            // Handle requests from guest UI
            if (data.method) {
                await this.handleGuestRequest(data);
            }

            // Handle responses (for pending requests)
            if (data.id && this._pendingRequests.has(data.id)) {
                const { resolve } = this._pendingRequests.get(data.id);
                this._pendingRequests.delete(data.id);
                resolve(data.result || data.error);
            }
        };

        window.addEventListener('message', this._messageHandler);
    }

    async handleGuestRequest(request) {
        const { id, method, params } = request;

        switch (method) {
            case 'ui/initialize':
                // Respond to initialization handshake (SEP-1865)
                this.sendResponse(id, {
                    protocolVersion: '2025-06-18',
                    hostCapabilities: {
                        tools: { call: true },
                    },
                    hostInfo: {
                        name: 'mcp-ext-apps-host',
                        version: '1.0.0',
                    },
                    hostContext: {
                        theme: 'light',
                        displayMode: 'inline',
                        viewport: {
                            width: this._iframe?.offsetWidth || 800,
                            height: this._iframe?.offsetHeight || 600,
                        },
                    },
                });
                break;

            case 'tools/call':
                // Forward tool call to host
                this.dispatchEvent(new CustomEvent('tool-call', {
                    detail: {
                        toolName: params.name,
                        arguments: params.arguments,
                        callback: (result) => {
                            if (!result.html) {
                                this.sendResponse(id, {
                                    content: result.error
                                        ? [{ type: 'text', text: result.error }]
                                        : [{ type: 'text', text: result.result }],
                                    isError: !!result.error,
                                });
                            }
                        }
                    },
                    bubbles: true
                }));
                break;

            default:
                // Unknown method
                this.sendError(id, -32601, `Method not found: ${method}`);
        }
    }

    sendResponse(id, result) {
        if (!this._iframe) return;
        this._iframe.contentWindow.postMessage({
            jsonrpc: '2.0',
            id,
            result,
        }, '*');
    }

    sendError(id, code, message) {
        if (!this._iframe) return;
        this._iframe.contentWindow.postMessage({
            jsonrpc: '2.0',
            id,
            error: { code, message },
        }, '*');
    }

    sendNotification(method, params) {
        if (!this._iframe) return;
        this._iframe.contentWindow.postMessage({
            jsonrpc: '2.0',
            method,
            params,
        }, '*');
    }

    renderHtml(html, toolInput = null) {
        const iframe = document.createElement('iframe');
        iframe.className = 'app-frame';
        // SEP-1865: sandbox with required permissions
        // allow-scripts: for JS execution
        // allow-same-origin: for postMessage to work correctly
        // allow-forms: for form submission (e.g., tool parameter forms)
        iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';

        // Apply CSP via srcdoc wrapper (SEP-1865 default CSP)
        const csp = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'none'; object-src 'none'; base-uri 'self';";

        // Wrap HTML with CSP meta tag
        const wrappedHtml = html.includes('<head>')
            ? html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`)
            : `<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}"></head><body>${html}</body></html>`;

        iframe.srcdoc = wrappedHtml;

        const container = this.shadowRoot.querySelector('.container');
        container.innerHTML = '';
        container.appendChild(iframe);
        this._iframe = iframe;

        // Send tool input notification after iframe loads (SEP-1865)
        if (toolInput) {
            iframe.onload = () => {
                this.sendNotification('ui/notifications/tool-input', {
                    toolName: toolInput.toolName,
                    arguments: toolInput.arguments,
                });
            };
        }

        this.dispatchEvent(new CustomEvent('app-rendered', { bubbles: true }));
    }

    // Send tool result notification (SEP-1865)
    sendToolResult(result) {
        this.sendNotification('ui/notifications/tool-result', result);
    }

    showPlaceholder() {
        const container = this.shadowRoot.querySelector('.container');
        container.innerHTML = `
            <div class="placeholder">
                <h2>No App Loaded</h2>
                <p>Connect to server and click a tool to render its UI</p>
            </div>
        `;
        this._iframe = null;
    }

    get iframe() {
        return this._iframe;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    flex: 1;
                    min-height: 0;
                    contain: layout style;
                }
                .container {
                    height: 100%;
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                }
                .placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #999;
                }
                .placeholder h2 {
                    margin: 0 0 10px 0;
                    font-weight: 500;
                }
                .placeholder p {
                    margin: 0;
                    font-size: 14px;
                }
                .app-frame {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
            <div class="container">
                <div class="placeholder">
                    <h2>No App Loaded</h2>
                    <p>Connect to server and click a tool to render its UI</p>
                </div>
            </div>
        `;
    }
}

customElements.define('app-container', AppContainer);
