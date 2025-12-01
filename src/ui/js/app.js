import './components/live-clock.js';
import './components/stats-grid.js';
import './components/greeting-tool.js';
import './components/calculator-tool.js';
import './components/quick-actions.js';

// Stats tracking
let clickCount = 0;
let calcCount = 0;
let greetCount = 0;

function updateStats() {
    const statsGrid = document.querySelector('stats-grid');
    if (statsGrid) {
        statsGrid.setAttribute('clicks', clickCount);
        statsGrid.setAttribute('calculations', calcCount);
        statsGrid.setAttribute('greetings', greetCount);
    }
}

// Event listeners for component events
document.addEventListener('greet', () => {
    greetCount++;
    clickCount++;
    updateStats();
});

document.addEventListener('calculate', () => {
    calcCount++;
    clickCount++;
    updateStats();
});

document.addEventListener('action', () => {
    clickCount++;
    updateStats();
});

console.log('MCP Dashboard UI loaded successfully!');
