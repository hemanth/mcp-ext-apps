import { test, expect } from '@playwright/test';

test.describe('Panel Resize Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('panels should be visible on load', async ({ page }) => {
    // Check that resizable-panels exists
    const panels = page.locator('resizable-panels');
    await expect(panels).toBeVisible();

    // Check initial height
    const panelBox = await panels.boundingBox();
    expect(panelBox?.height).toBeGreaterThan(50);
    console.log('Initial panel height:', panelBox?.height);
  });

  test('vertical resizer should work before content render', async ({ page }) => {
    const resizer = page.locator('.vertical-resizer');
    const panels = page.locator('resizable-panels');

    await expect(resizer).toBeVisible();

    const initialBox = await panels.boundingBox();
    const resizerBox = await resizer.boundingBox();

    console.log('Initial panel height:', initialBox?.height);

    // Drag resizer up to expand panels
    await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y - 100);
    await page.mouse.up();

    const afterBox = await panels.boundingBox();
    console.log('After drag up panel height:', afterBox?.height);

    expect(afterBox!.height).toBeGreaterThan(initialBox!.height);
  });

  test('connect to server and render tool UI', async ({ page }) => {
    const connectBtn = page.locator('#connectBtn');
    await expect(connectBtn).toBeVisible();

    // Connect to server
    await connectBtn.click();

    // Wait for tools to load in sidebar
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('tools-sidebar');
      if (!sidebar || !sidebar.shadowRoot) return false;
      const items = sidebar.shadowRoot.querySelectorAll('.tool-item');
      return items.length > 0;
    }, { timeout: 10000 });

    console.log('Connected and tools loaded');
  });

  test('vertical resizer should work AFTER content render', async ({ page }) => {
    const resizer = page.locator('.vertical-resizer');
    const panels = page.locator('resizable-panels');
    const appContainer = page.locator('app-container');

    // Connect to server first
    await page.locator('#connectBtn').click();

    // Wait for tools to load
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('tools-sidebar');
      if (!sidebar || !sidebar.shadowRoot) return false;
      return sidebar.shadowRoot.querySelectorAll('.tool-item').length > 0;
    }, { timeout: 10000 });

    // Click a tool to render its UI
    await page.evaluate(() => {
      const sidebar = document.querySelector('tools-sidebar');
      if (sidebar && sidebar.shadowRoot) {
        const firstTool = sidebar.shadowRoot.querySelector('.tool-item') as HTMLElement;
        firstTool?.click();
      }
    });

    // Wait for iframe to appear in app-container
    await page.waitForFunction(() => {
      const container = document.querySelector('app-container');
      if (!container || !container.shadowRoot) return false;
      return container.shadowRoot.querySelector('iframe') !== null;
    }, { timeout: 5000 });

    console.log('Content rendered in app-container');

    // Now test vertical resizer
    const initialBox = await panels.boundingBox();
    const resizerBox = await resizer.boundingBox();

    console.log('Panel height after content render:', initialBox?.height);
    console.log('Resizer position:', resizerBox);

    // Get resizable-panels computed styles
    const panelStyles = await panels.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        height: styles.height,
        minHeight: styles.minHeight,
        flexShrink: styles.flexShrink,
        contain: styles.contain,
        display: styles.display
      };
    });
    console.log('Panel styles:', panelStyles);

    // Try to drag resizer up
    await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y - 150);
    await page.mouse.up();

    const afterBox = await panels.boundingBox();
    console.log('After drag up panel height:', afterBox?.height);

    // This is the test that likely fails
    expect(afterBox!.height).toBeGreaterThan(initialBox!.height);
  });

  test('debug: check DOM structure after render', async ({ page }) => {
    // Connect and render
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

    await page.waitForTimeout(1000);

    // Debug: Check the main-content structure
    const structure = await page.evaluate(() => {
      const mainContent = document.querySelector('.main-content');
      if (!mainContent) return 'main-content not found';

      const children = Array.from(mainContent.children).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        height: (el as HTMLElement).offsetHeight,
        computedHeight: window.getComputedStyle(el).height,
        flex: window.getComputedStyle(el).flex
      }));

      return {
        mainContentHeight: mainContent.clientHeight,
        children
      };
    });

    console.log('DOM Structure after render:', JSON.stringify(structure, null, 2));

    // Check if resizer is still in the right place
    const resizerInfo = await page.evaluate(() => {
      const resizer = document.querySelector('.vertical-resizer');
      if (!resizer) return 'resizer not found';

      const rect = resizer.getBoundingClientRect();
      return {
        top: rect.top,
        height: rect.height,
        previousSibling: resizer.previousElementSibling?.tagName,
        nextSibling: resizer.nextElementSibling?.tagName
      };
    });

    console.log('Resizer info:', resizerInfo);
  });
});
