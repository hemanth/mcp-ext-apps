export class QuickActions extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isDark = false;
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    setupListeners() {
        this.shadowRoot.querySelector('#notifyBtn').addEventListener('click', () => this.showNotification());
        this.shadowRoot.querySelector('#themeBtn').addEventListener('click', () => this.toggleTheme());
        this.shadowRoot.querySelector('#infoBtn').addEventListener('click', () => this.showServerInfo());
    }

    showNotification() {
        const output = this.shadowRoot.querySelector('.output');
        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `Notification: Hello from MCP!\nTime: ${new Date().toLocaleString()}`;

        this.dispatchEvent(new CustomEvent('action', { detail: { type: 'notification' }, bubbles: true }));
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        document.body.style.background = this.isDark ? '#222' : '#f5f5f5';

        const output = this.shadowRoot.querySelector('.output');
        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `Theme changed to: ${this.isDark ? 'Dark' : 'Light'} mode`;

        this.dispatchEvent(new CustomEvent('action', { detail: { type: 'theme', isDark: this.isDark }, bubbles: true }));
    }

    showServerInfo() {
        const output = this.shadowRoot.querySelector('.output');
        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `MCP UI Server Info
--------------------
Server: mcp-ui-server v1.0.0
Protocol: Model Context Protocol
UI Type: HTML/JavaScript
Transport: StreamableHTTP
Status: Connected
--------------------
Rendered at: ${new Date().toLocaleString()}`;

        this.dispatchEvent(new CustomEvent('action', { detail: { type: 'info' }, bubbles: true }));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .section-title {
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #666;
                    margin-bottom: 10px;
                }
                .button-group {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                button {
                    padding: 10px 20px;
                    background: #000;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }
                button:hover {
                    background: #333;
                }
                .output {
                    margin-top: 15px;
                    padding: 15px;
                    border-radius: 6px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    display: none;
                }
                .output.success {
                    background: #f0f0f0;
                    border: 1px solid #ccc;
                }
            </style>
            <div class="section-title">Quick Actions</div>
            <div class="button-group">
                <button id="notifyBtn">Show Notification</button>
                <button id="themeBtn">Toggle Theme</button>
                <button id="infoBtn">Server Info</button>
            </div>
            <div class="output"></div>
        `;
    }
}

customElements.define('quick-actions', QuickActions);
