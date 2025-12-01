export class GreetingTool extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    setupListeners() {
        const btn = this.shadowRoot.querySelector('button');
        btn.addEventListener('click', () => this.greet());
    }

    greet() {
        const input = this.shadowRoot.querySelector('input');
        const output = this.shadowRoot.querySelector('.output');
        const name = input.value || 'Friend';

        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `Hello, ${name}!\nWelcome to the MCP Dashboard!\nGreeted at: ${new Date().toLocaleString()}`;

        this.dispatchEvent(new CustomEvent('greet', {
            detail: { name },
            bubbles: true
        }));
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
                .input-group {
                    display: flex;
                    gap: 10px;
                }
                input {
                    flex: 1;
                    padding: 10px 15px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 14px;
                }
                input:focus {
                    outline: none;
                    border-color: #000;
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
            <div class="section-title">Greeting Tool</div>
            <div class="input-group">
                <input type="text" placeholder="Enter your name...">
                <button>Greet Me!</button>
            </div>
            <div class="output"></div>
        `;
    }
}

customElements.define('greeting-tool', GreetingTool);
