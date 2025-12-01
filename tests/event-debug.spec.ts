import { test, expect } from '@playwright/test';

test('trace exactly what happens during resize after content render', async ({ page }) => {
  // Add console log listener
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'log') {
      logs.push(msg.text());
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForLoadState('networkidle');

  // Inject debugging into the resize handler
  await page.evaluate(() => {
    const resizer = document.getElementById('verticalResizer');
    const bottomPanels = document.getElementById('bottomPanels');

    if (!resizer || !bottomPanels) return;

    // Add a test handler to see if events work
    resizer.addEventListener('mousedown', (e) => {
      console.log('DEBUG: mousedown fired at', e.clientX, e.clientY);
      console.log('DEBUG: bottomPanels height before:', bottomPanels.offsetHeight);
    });

    // Listen for mousemove on document
    document.addEventListener('mousemove', (e) => {
      if (document.body.style.cursor === 'row-resize') {
        console.log('DEBUG: mousemove during resize at', e.clientY);
      }
    });

    document.addEventListener('mouseup', () => {
      if (document.body.style.cursor === 'row-resize') {
        console.log('DEBUG: mouseup, final height:', bottomPanels.offsetHeight);
      }
    });
  });

  // Connect and render content
  await page.locator('#connectBtn').click();

  await page.waitForFunction(() => {
    const sidebar = document.querySelector('tools-sidebar');
    if (!sidebar || !sidebar.shadowRoot) return false;
    return sidebar.shadowRoot.querySelectorAll('.tool-item').length > 0;
  }, { timeout: 10000 });

  await page.evaluate(() => {
    const sidebar = document.querySelector('tools-sidebar');
    if (sidebar && sidebar.shadowRoot) {
      const firstTool = sidebar.shadowRoot.querySelector('.tool-item') as HTMLElement;
      firstTool?.click();
    }
  });

  await page.waitForTimeout(500);

  // Get positions
  const resizer = page.locator('.vertical-resizer');
  const resizerBox = await resizer.boundingBox();

  console.log('Resizer box:', resizerBox);

  // Perform the drag with steps
  const startX = resizerBox!.x + resizerBox!.width / 2;
  const startY = resizerBox!.y + resizerBox!.height / 2;

  console.log('Starting drag at:', startX, startY);

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Move in small steps
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(startX, startY - (i * 15));
    await page.waitForTimeout(50);
  }

  await page.mouse.up();

  // Check the logs
  console.log('Console logs from page:');
  logs.forEach(log => console.log('  ', log));

  // Final check
  const panels = page.locator('resizable-panels');
  const afterBox = await panels.boundingBox();
  console.log('Final panel height:', afterBox?.height);

  // Check what we're looking at now
  const currentState = await page.evaluate(() => {
    const panels = document.getElementById('bottomPanels');
    return {
      styleHeight: panels?.style.height,
      offsetHeight: panels?.offsetHeight,
      computedHeight: panels ? getComputedStyle(panels).height : null
    };
  });

  console.log('Current state:', currentState);
});
