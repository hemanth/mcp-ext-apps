import { test, expect } from '@playwright/test';

test('check if iframe intercepts mouse events during drag', async ({ page }) => {
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

  // Get the iframe bounding box
  const iframeInfo = await page.evaluate(() => {
    const container = document.querySelector('app-container');
    if (!container || !container.shadowRoot) return null;
    const iframe = container.shadowRoot.querySelector('iframe');
    if (!iframe) return null;
    const rect = iframe.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
  });

  console.log('Iframe bounds:', iframeInfo);

  const resizer = page.locator('.vertical-resizer');
  const resizerBox = await resizer.boundingBox();
  console.log('Resizer bounds:', resizerBox);

  // The drag path goes from resizer (y=477) UP through the iframe area
  // When mouse moves over iframe, the iframe might capture the event

  // Let's try: disable pointer events on iframe during drag
  await page.evaluate(() => {
    const container = document.querySelector('app-container');
    if (!container || !container.shadowRoot) return;
    const iframe = container.shadowRoot.querySelector('iframe');
    if (!iframe) return;

    // Disable pointer events on iframe
    iframe.style.pointerEvents = 'none';
    console.log('Disabled pointer events on iframe');
  });

  // Now try the drag
  const panels = page.locator('resizable-panels');
  const initialBox = await panels.boundingBox();
  console.log('Initial panel height:', initialBox?.height);

  const startX = resizerBox!.x + resizerBox!.width / 2;
  const startY = resizerBox!.y + resizerBox!.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Move up through where iframe would be
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(startX, startY - (i * 15));
    await page.waitForTimeout(30);
  }

  await page.mouse.up();

  const afterBox = await panels.boundingBox();
  console.log('Final panel height:', afterBox?.height);

  expect(afterBox!.height).toBeGreaterThan(initialBox!.height);
});
