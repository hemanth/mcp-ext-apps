export class LiveClock extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.intervalId = null;
    }

    connectedCallback() {
        this.render();
        this.startClock();
    }

    disconnectedCallback() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    startClock() {
        this.updateTime();
        this.intervalId = setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const clockEl = this.shadowRoot.querySelector('.clock');
        if (clockEl) {
            clockEl.textContent = new Date().toLocaleTimeString();
        }
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
                .clock {
                    font-size: 48px;
                    font-weight: 300;
                    font-family: monospace;
                    color: #000;
                }
            </style>
            <div class="section-title">Live Clock</div>
            <div class="clock">--:--:--</div>
        `;
    }
}

customElements.define('live-clock', LiveClock);
