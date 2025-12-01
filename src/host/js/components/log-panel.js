export class LogPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    log(message, type = 'info') {
        const container = this.shadowRoot.querySelector('.log-container');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="timestamp">[${time}]</span> ${message}`;
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
    }

    clear() {
        const container = this.shadowRoot.querySelector('.log-container');
        container.innerHTML = '';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .log-container {
                    height: 150px;
                    overflow-y: auto;
                    background: #1a1a1a;
                    border-radius: 8px;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 12px;
                }
                .log-entry {
                    padding: 4px 0;
                    color: #ccc;
                    border-bottom: 1px solid #333;
                }
                .log-entry:last-child {
                    border-bottom: none;
                }
                .log-entry.success {
                    color: #6f6;
                }
                .log-entry.error {
                    color: #f66;
                }
                .log-entry.info {
                    color: #ccc;
                }
                .timestamp {
                    color: #888;
                    margin-right: 8px;
                }
            </style>
            <div class="log-container"></div>
        `;
    }
}

customElements.define('log-panel', LogPanel);
