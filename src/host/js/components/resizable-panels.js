export class ResizablePanels extends HTMLElement {
    constructor() {
        super();
        this._minimized = new Set();
        this._sizes = [33.33, 33.33, 33.34];
        this._panels = [];
    }

    connectedCallback() {
        // Save panel references before modifying DOM
        this._panels = [
            { title: 'Log', el: this.querySelector('log-panel') },
            { title: 'Debug', el: this.querySelector('debug-panel') },
            { title: 'Resources', el: this.querySelector('resources-panel') }
        ].filter(p => p.el);

        // Store elements in a fragment to preserve them
        const fragment = document.createDocumentFragment();
        this._panels.forEach(p => fragment.appendChild(p.el));

        this.render(fragment);
    }

    toggleMinimize(index) {
        if (this._minimized.has(index)) {
            this._minimized.delete(index);
        } else {
            this._minimized.add(index);
        }
        this.updateLayout();
    }

    updateLayout() {
        const wrappers = this.querySelectorAll('.panel-wrapper');
        const minWidth = 40;

        wrappers.forEach((wrapper, i) => {
            const btn = wrapper.querySelector('.minimize-btn');
            if (this._minimized.has(i)) {
                wrapper.style.flex = `0 0 ${minWidth}px`;
                wrapper.classList.add('minimized');
                if (btn) btn.textContent = '+';
            } else {
                wrapper.style.flex = `1 1 ${this._sizes[i]}%`;
                wrapper.classList.remove('minimized');
                if (btn) btn.textContent = '−';
            }
        });
    }

    startResize(e, index) {
        e.preventDefault();
        const container = this.querySelector('.panels-container');
        const resizer = this.querySelectorAll('.resizer')[index];
        const startX = e.clientX;
        const startSizes = [...this._sizes];

        resizer?.classList.add('dragging');
        container?.classList.add('resizing');

        const onMouseMove = (e) => {
            const containerWidth = container.offsetWidth;
            const delta = e.clientX - startX;
            const deltaPercent = (delta / containerWidth) * 100;

            const leftIndex = index;
            const rightIndex = index + 1;

            if (this._minimized.has(leftIndex) || this._minimized.has(rightIndex)) return;

            const newLeftSize = startSizes[leftIndex] + deltaPercent;
            const newRightSize = startSizes[rightIndex] - deltaPercent;

            if (newLeftSize >= 15 && newRightSize >= 15) {
                this._sizes[leftIndex] = newLeftSize;
                this._sizes[rightIndex] = newRightSize;
                this.updateLayout();
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            resizer?.classList.remove('dragging');
            container?.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    render(fragment) {
        const style = document.createElement('style');
        style.textContent = `
            .panels-container {
                display: flex;
                height: 100%;
                gap: 0;
            }
            .panel-wrapper {
                display: flex;
                flex-direction: column;
                min-width: 40px;
                overflow: hidden;
                background: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                contain: layout style;
            }
            .panel-wrapper.minimized {
                flex: 0 0 40px !important;
            }
            .panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: #f5f5f5;
                border-bottom: 1px solid #e0e0e0;
                font-size: 12px;
                font-weight: 500;
                flex-shrink: 0;
            }
            .panel-wrapper.minimized .panel-header {
                writing-mode: vertical-rl;
                text-orientation: mixed;
                padding: 12px 8px;
                height: 100%;
                border-bottom: none;
                justify-content: flex-start;
                gap: 10px;
            }
            .panel-wrapper.minimized .panel-title {
                transform: rotate(180deg);
            }
            .minimize-btn {
                background: #e0e0e0;
                border: none;
                width: 22px;
                height: 22px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
            }
            .minimize-btn:hover {
                background: #d0d0d0;
            }
            .panel-content {
                flex: 1;
                min-height: 0;
                overflow: auto;
            }
            .panel-content > * {
                height: 100%;
            }
            .panel-wrapper.minimized .panel-content {
                display: none;
            }
            .resizer {
                width: 8px;
                background: transparent;
                cursor: col-resize;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .resizer::before {
                content: '';
                width: 3px;
                height: 30px;
                background: #ddd;
                border-radius: 2px;
                transition: background 0.15s, height 0.15s;
            }
            .resizer:hover::before {
                background: #999;
                height: 50px;
            }
            .resizer.dragging::before {
                background: #666;
                height: 60px;
            }
            .panels-container.resizing .panel-wrapper {
                transition: none;
            }
        `;

        this.innerHTML = '';
        this.appendChild(style);

        const container = document.createElement('div');
        container.className = 'panels-container';
        this.appendChild(container);

        this._panels.forEach((panel, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'panel-wrapper';
            wrapper.style.flex = `1 1 ${this._sizes[i]}%`;

            const header = document.createElement('div');
            header.className = 'panel-header';
            header.innerHTML = `
                <span class="panel-title">${panel.title}</span>
                <button class="minimize-btn" title="Minimize">−</button>
            `;

            const content = document.createElement('div');
            content.className = 'panel-content';
            content.appendChild(panel.el);

            wrapper.appendChild(header);
            wrapper.appendChild(content);

            header.querySelector('.minimize-btn').addEventListener('click', () => {
                this.toggleMinimize(i);
            });

            container.appendChild(wrapper);

            if (i < this._panels.length - 1) {
                const resizer = document.createElement('div');
                resizer.className = 'resizer';
                resizer.addEventListener('mousedown', (e) => this.startResize(e, i));
                container.appendChild(resizer);
            }
        });
    }
}

customElements.define('resizable-panels', ResizablePanels);
