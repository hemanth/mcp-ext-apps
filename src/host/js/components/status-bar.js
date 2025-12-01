export class StatusBar extends HTMLElement {
    static get observedAttributes() {
        return ['connected'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    get connected() {
        return this.getAttribute('connected') === 'true';
    }

    set connected(value) {
        this.setAttribute('connected', value);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #ccc;
                }
                .status-dot.connected {
                    background: #4a4;
                }
                span {
                    font-size: 14px;
                    color: #666;
                }
            </style>
            <div class="status-dot ${this.connected ? 'connected' : ''}"></div>
            <span>${this.connected ? 'Connected' : 'Disconnected'}</span>
        `;
    }
}

customElements.define('status-bar', StatusBar);
