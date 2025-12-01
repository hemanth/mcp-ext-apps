export class ResourcesPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._resources = [];
    }

    connectedCallback() {
        this.render();
    }

    set resources(value) {
        this._resources = value || [];
        this.updateContent();
    }

    get resources() {
        return this._resources;
    }

    addResource(resource) {
        this._resources.push(resource);
        this.updateContent();
    }

    clear() {
        this._resources = [];
        this.updateContent();
    }

    updateContent() {
        const content = this.shadowRoot.querySelector('.resources-list');
        if (!content) return;

        if (this._resources.length === 0) {
            content.innerHTML = '<div class="placeholder">No resources loaded</div>';
            return;
        }

        content.innerHTML = this._resources.map((res, index) => `
            <div class="resource-item" data-index="${index}">
                <div class="resource-header">
                    <span class="resource-type">${res.mimeType || 'unknown'}</span>
                    <span class="resource-uri">${res.uri || 'inline'}</span>
                </div>
                <div class="resource-preview">
                    ${this.getPreview(res)}
                </div>
            </div>
        `).join('');
    }

    getPreview(resource) {
        if (resource.mimeType === 'text/html') {
            return `<span class="html-badge">HTML Document</span> (${(resource.text?.length || 0)} chars)`;
        }
        if (resource.mimeType?.startsWith('text/')) {
            const text = resource.text || '';
            return `<pre>${text.substring(0, 100)}${text.length > 100 ? '...' : ''}</pre>`;
        }
        return `<span class="binary-badge">Binary</span>`;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                    overflow: hidden;
                }
                .resources-list {
                    height: 100%;
                    overflow-y: auto;
                    padding: 10px;
                    background: #fafafa;
                    border-radius: 0 0 8px 8px;
                }
                .placeholder {
                    color: #888;
                    text-align: center;
                    padding: 20px;
                    font-size: 12px;
                }
                .resource-item {
                    padding: 8px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    background: #fff;
                }
                .resource-item:last-child {
                    margin-bottom: 0;
                }
                .resource-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }
                .resource-type {
                    background: #333;
                    color: #fff;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-family: monospace;
                }
                .resource-uri {
                    color: #666;
                    font-size: 11px;
                    font-family: monospace;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .resource-preview {
                    font-size: 11px;
                    color: #444;
                }
                .resource-preview pre {
                    margin: 0;
                    padding: 6px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    overflow-x: auto;
                    font-size: 10px;
                }
                .html-badge {
                    background: #4a90d9;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                }
                .binary-badge {
                    background: #888;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                }
            </style>
            <div class="resources-list">
                <div class="placeholder">No resources loaded</div>
            </div>
        `;
    }
}

customElements.define('resources-panel', ResourcesPanel);
