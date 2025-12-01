import { test, expect } from '@playwright/test';

test('check if app.js handler is attached', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:8080');
  await page.waitForLoadState('networkidle');

  // Check if the handler exists by looking at event listeners
  const handlerInfo = await page.evaluate(() => {
    const resizer = document.getElementById('verticalResizer');
    const panels = document.getElementById('bottomPanels');

    // Try to trigger mousedown and see if cursor changes
    const rect = resizer!.getBoundingClientRect();
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });

    resizer!.dispatchEvent(mousedownEvent);

    // Check if the handler set cursor
    const cursorAfterMousedown = document.body.style.cursor;

    // Now simulate mousemove
    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top - 100 // 100px up
    });

    document.dispatchEvent(mousemoveEvent);

    const heightAfterMove = panels!.offsetHeight;
    const styleHeightAfterMove = panels!.style.height;

    // Cleanup - trigger mouseup
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    return {
      cursorAfterMousedown,
      heightAfterMove,
      styleHeightAfterMove,
      cursorAfterMouseup: document.body.style.cursor
    };
  });

  console.log('Handler info BEFORE content render:', handlerInfo);

  // Now connect and render content
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

  // Test again AFTER content render
  const handlerInfoAfter = await page.evaluate(() => {
    const resizer = document.getElementById('verticalResizer');
    const panels = document.getElementById('bottomPanels');

    // Reset any previous state
    panels!.style.height = '220px';

    const rect = resizer!.getBoundingClientRect();
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });

    resizer!.dispatchEvent(mousedownEvent);

    const cursorAfterMousedown = document.body.style.cursor;
    const panelClassAfterMousedown = panels!.className;

    // Simulate mousemove
    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top - 100
    });

    document.dispatchEvent(mousemoveEvent);

    const heightAfterMove = panels!.offsetHeight;
    const styleHeightAfterMove = panels!.style.height;

    // Cleanup
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    return {
      cursorAfterMousedown,
      panelClassAfterMousedown,
      heightAfterMove,
      styleHeightAfterMove,
      cursorAfterMouseup: document.body.style.cursor
    };
  });

  console.log('Handler info AFTER content render:', handlerInfoAfter);

  // The key test: does the style.height get set?
  expect(handlerInfoAfter.styleHeightAfterMove).not.toBe('220px');
});
