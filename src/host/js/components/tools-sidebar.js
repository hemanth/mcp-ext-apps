export class ToolsSidebar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._tools = [];
        this._selectedTool = null;
    }

    connectedCallback() {
        this.render();
    }

    set tools(value) {
        this._tools = value || [];
        this.render();
    }

    get tools() {
        return this._tools;
    }

    set selectedTool(value) {
        this._selectedTool = value;
        this.render();
    }

    selectTool(tool) {
        this._selectedTool = tool.name;
        this.render();
        this.dispatchEvent(new CustomEvent('tool-select', {
            detail: { tool },
            bubbles: true
        }));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .sidebar-header {
                    padding: 15px 20px;
                    font-weight: 600;
                    border-bottom: 1px solid #e0e0e0;
                    background: #fafafa;
                }
                .tools-list {
                    overflow-y: auto;
                }
                .tool-item {
                    padding: 12px 20px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                }
                .tool-item:hover {
                    background: #f5f5f5;
                }
                .tool-item.active {
                    background: #e8e8e8;
                    border-left: 3px solid #000;
                }
                .tool-name {
                    font-weight: 500;
                    font-size: 14px;
                }
                .tool-desc {
                    font-size: 12px;
                    color: #666;
                    margin-top: 4px;
                }
                .placeholder {
                    padding: 20px;
                    color: #666;
                    text-align: center;
                }
            </style>
            <div class="sidebar-header">Available Tools</div>
            <div class="tools-list">
                ${this._tools.length === 0
                    ? '<div class="placeholder">Connect to server to see tools</div>'
                    : this._tools.map(tool => `
                        <div class="tool-item ${this._selectedTool === tool.name ? 'active' : ''}" data-tool="${tool.name}">
                            <div class="tool-name">${tool.name}</div>
                            <div class="tool-desc">${tool.description || ''}</div>
                        </div>
                    `).join('')
                }
            </div>
        `;

        // Add click listeners
        this.shadowRoot.querySelectorAll('.tool-item').forEach(item => {
            item.addEventListener('click', () => {
                const toolName = item.dataset.tool;
                const tool = this._tools.find(t => t.name === toolName);
                if (tool) this.selectTool(tool);
            });
        });
    }
}

customElements.define('tools-sidebar', ToolsSidebar);
