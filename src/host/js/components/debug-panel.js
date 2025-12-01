export class DebugPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._entries = [];
    }

    connectedCallback() {
        this.render();
    }

    logRequest(method, params) {
        this._entries.push({
            type: 'request',
            timestamp: new Date().toLocaleTimeString(),
            method,
            data: params
        });
        this.updateContent();
    }

    logResponse(method, data) {
        this._entries.push({
            type: 'response',
            timestamp: new Date().toLocaleTimeString(),
            method,
            data
        });
        this.updateContent();
    }

    clear() {
        this._entries = [];
        this.updateContent();
    }

    updateContent() {
        const content = this.shadowRoot.querySelector('.debug-content');
        if (!content) return;

        content.innerHTML = this._entries.map(entry => `
            <div class="entry ${entry.type}">
                <div class="entry-header">
                    <span class="badge ${entry.type}">${entry.type === 'request' ? 'REQ' : 'RES'}</span>
                    <span class="method">${entry.method}</span>
                    <span class="timestamp">${entry.timestamp}</span>
                </div>
                <pre class="entry-data">${JSON.stringify(entry.data, null, 2)}</pre>
            </div>
        `).join('');

        content.scrollTop = content.scrollHeight;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                }
                .debug-content {
                    height: 100%;
                    overflow-y: auto;
                    padding: 8px;
                    background: #1a1a1a;
                    font-family: monospace;
                    font-size: 10px;
                    border-radius: 0 0 8px 8px;
                }
                .entry {
                    margin-bottom: 8px;
                    padding: 6px;
                    border-radius: 4px;
                    background: #252525;
                }
                .entry:last-child {
                    margin-bottom: 0;
                }
                .entry-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                .badge {
                    padding: 1px 5px;
                    border-radius: 3px;
                    font-size: 9px;
                    font-weight: 600;
                }
                .badge.request {
                    background: #4a90d9;
                    color: white;
                }
                .badge.response {
                    background: #5a5;
                    color: white;
                }
                .method {
                    color: #fff;
                    font-weight: 500;
                    font-size: 11px;
                }
                .timestamp {
                    color: #888;
                    font-size: 10px;
                    margin-left: auto;
                }
                .entry-data {
                    margin: 0;
                    padding: 6px;
                    background: #1a1a1a;
                    border-radius: 4px;
                    color: #aaa;
                    white-space: pre-wrap;
                    word-break: break-all;
                    max-height: 80px;
                    overflow-y: auto;
                    font-size: 10px;
                }
            </style>
            <div class="debug-content"></div>
        `;

        this.updateContent();
    }
}

customElements.define('debug-panel', DebugPanel);
