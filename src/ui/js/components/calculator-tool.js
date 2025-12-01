export class CalculatorTool extends HTMLElement {
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
        btn.addEventListener('click', () => this.calculate());
    }

    calculate() {
        const numA = parseFloat(this.shadowRoot.querySelector('#numA').value) || 0;
        const numB = parseFloat(this.shadowRoot.querySelector('#numB').value) || 0;
        const op = this.shadowRoot.querySelector('#operation').value;
        const output = this.shadowRoot.querySelector('.output');

        let result;
        let symbol;

        switch(op) {
            case 'add':
                result = numA + numB;
                symbol = '+';
                break;
            case 'subtract':
                result = numA - numB;
                symbol = '-';
                break;
            case 'multiply':
                result = numA * numB;
                symbol = '*';
                break;
            case 'divide':
                if (numB === 0) {
                    output.style.display = 'block';
                    output.className = 'output error';
                    output.textContent = 'Error: Cannot divide by zero!';
                    return;
                }
                result = numA / numB;
                symbol = '/';
                break;
        }

        output.style.display = 'block';
        output.className = 'output success';
        output.textContent = `${numA} ${symbol} ${numB} = ${result}`;

        this.dispatchEvent(new CustomEvent('calculate', {
            detail: { a: numA, b: numB, op, result },
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
                    align-items: center;
                }
                input, select {
                    padding: 10px 15px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 14px;
                }
                input {
                    width: 100px;
                }
                input:focus, select:focus {
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
                .output.error {
                    background: #fff0f0;
                    border: 1px solid #ffcccc;
                    color: #cc0000;
                }
            </style>
            <div class="section-title">Calculator Tool</div>
            <div class="input-group">
                <input type="number" id="numA" placeholder="Number A" value="10">
                <select id="operation">
                    <option value="add">+ Add</option>
                    <option value="subtract">- Subtract</option>
                    <option value="multiply">* Multiply</option>
                    <option value="divide">/ Divide</option>
                </select>
                <input type="number" id="numB" placeholder="Number B" value="5">
                <button>Calculate</button>
            </div>
            <div class="output"></div>
        `;
    }
}

customElements.define('calculator-tool', CalculatorTool);
