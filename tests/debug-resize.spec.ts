import { test, expect } from '@playwright/test';

test('deep debug: why resize fails after content render', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForLoadState('networkidle');

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

  // Check if the mousedown event fires on the resizer
  const mousedownFired = await page.evaluate(() => {
    return new Promise((resolve) => {
      const resizer = document.getElementById('verticalResizer');
      if (!resizer) {
        resolve('resizer not found');
        return;
      }

      let fired = false;
      const originalHandler = (resizer as any)._mousedownHandler;

      // Check what events are registered
      const events = (resizer as any).__events || [];

      resizer.addEventListener('mousedown', () => {
        fired = true;
      }, { once: true });

      // Simulate mousedown
      const rect = resizer.getBoundingClientRect();
      const event = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      resizer.dispatchEvent(event);

      setTimeout(() => resolve(fired), 100);
    });
  });

  console.log('Mousedown event fired on resizer:', mousedownFired);

  // Check if the app-container has an overlay or is capturing events
  const appContainerInfo = await page.evaluate(() => {
    const container = document.querySelector('app-container');
    if (!container || !container.shadowRoot) return 'app-container shadow not found';

    const iframe = container.shadowRoot.querySelector('iframe');
    if (!iframe) return 'no iframe found';

    const iframeRect = iframe.getBoundingClientRect();
    const resizerRect = document.getElementById('verticalResizer')?.getBoundingClientRect();

    return {
      iframeBottom: iframeRect.bottom,
      resizerTop: resizerRect?.top,
      iframeStyle: {
        position: window.getComputedStyle(iframe).position,
        zIndex: window.getComputedStyle(iframe).zIndex,
        pointerEvents: window.getComputedStyle(iframe).pointerEvents
      },
      containerStyle: {
        overflow: window.getComputedStyle(container).overflow,
        contain: window.getComputedStyle(container).contain
      }
    };
  });

  console.log('App container info:', JSON.stringify(appContainerInfo, null, 2));

  // Check the actual resize handler
  const resizeTest = await page.evaluate(() => {
    const resizer = document.getElementById('verticalResizer');
    const bottomPanels = document.getElementById('bottomPanels');

    if (!resizer || !bottomPanels) {
      return 'elements not found';
    }

    const initialHeight = bottomPanels.offsetHeight;

    // Manually set a new height
    bottomPanels.style.height = '400px';

    const afterManualSet = bottomPanels.offsetHeight;

    // Reset
    bottomPanels.style.height = '220px';

    return {
      initialHeight,
      afterManualSet,
      canSetHeightManually: afterManualSet === 400
    };
  });

  console.log('Manual height test:', resizeTest);

  // The real test: Is the iframe capturing mouse events?
  const pointerEventsTest = await page.evaluate(() => {
    const container = document.querySelector('app-container');
    if (!container || !container.shadowRoot) return 'no shadow';

    // Check all elements at the resizer position
    const resizer = document.getElementById('verticalResizer');
    if (!resizer) return 'no resizer';

    const rect = resizer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // What element is at the resizer position?
    const elementAtPoint = document.elementFromPoint(centerX, centerY);

    return {
      elementAtResizerCenter: elementAtPoint?.tagName,
      elementId: (elementAtPoint as HTMLElement)?.id,
      resizerRect: { top: rect.top, bottom: rect.bottom, height: rect.height }
    };
  });

  console.log('Element at resizer position:', pointerEventsTest);
});
