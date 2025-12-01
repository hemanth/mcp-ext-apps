export class StatsGrid extends HTMLElement {
    static get observedAttributes() {
        return ['clicks', 'calculations', 'greetings'];
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

    get clicks() {
        return this.getAttribute('clicks') || '0';
    }

    get calculations() {
        return this.getAttribute('calculations') || '0';
    }

    get greetings() {
        return this.getAttribute('greetings') || '0';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                }
                .stat-card {
                    background: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 32px;
                    font-weight: 600;
                    color: #000;
                }
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }
            </style>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${this.clicks}</div>
                    <div class="stat-label">Button Clicks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.calculations}</div>
                    <div class="stat-label">Calculations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.greetings}</div>
                    <div class="stat-label">Greetings</div>
                </div>
            </div>
        `;
    }
}

customElements.define('stats-grid', StatsGrid);
