export class AppContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._iframe = null;
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

            if (data.type === 'callTool') {
                this.dispatchEvent(new CustomEvent('tool-call', {
                    detail: {
                        toolName: data.toolName,
                        arguments: data.arguments,
                        callback: (result) => {
                            if (!result.html && this._iframe) {
                                this._iframe.contentWindow.postMessage({
                                    type: 'toolResult',
                                    result: result.result,
                                    error: result.error
                                }, '*');
                            }
                        }
                    },
                    bubbles: true
                }));
            }
        };

        window.addEventListener('message', this._messageHandler);
    }

    renderHtml(html) {
        const iframe = document.createElement('iframe');
        iframe.className = 'app-frame';
        iframe.sandbox = 'allow-scripts allow-forms';
        iframe.srcdoc = html;

        const container = this.shadowRoot.querySelector('.container');
        container.innerHTML = '';
        container.appendChild(iframe);
        this._iframe = iframe;

        this.dispatchEvent(new CustomEvent('app-rendered', { bubbles: true }));
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
                }
                .container {
                    height: 100%;
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
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
