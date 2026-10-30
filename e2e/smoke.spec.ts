import { expect, test, type Page } from '@playwright/test';

test('loads, works offline after first visit', async ({ page, context }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content.Security.Policy/i.test(m.text()))
      violations.push(m.text());
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  // Pre-paint theme script ran, i.e. it is allowed by the CSP hash
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('./methodik');
  await expect(page.getByRole('heading', { name: 'Methods' })).toBeVisible();
  expect(violations).toEqual([]);
});

/** Click the Trail Making circles labelled 1…n in order */
async function connect(page: Page, n: number) {
  for (let k = 1; k <= n; k++) {
    await page
      .locator('svg g[role="button"]')
      .filter({ has: page.locator('text', { hasText: new RegExp(`^${k}$`) }) })
      .click();
  }
}

test('Trail Making A: full run is saved and shown in results', async ({ page }) => {
  await page.goto('./tests/trail-making-a');
  const next = page.getByRole('button', { name: /^(Next|Start)$/ });
  while ((await next.textContent())?.trim() !== 'Start') await next.click();
  await next.click();

  await connect(page, 8);
  await expect(page.locator('svg g[role="button"]')).toHaveCount(25, { timeout: 10_000 });
  await connect(page, 25);
  await expect(page.getByRole('heading', { name: 'Test complete!' })).toBeVisible();

  await page.goto('./ergebnisse');
  await expect(page.getByText('Trail Making A').first()).toBeVisible();
});

test('language switch persists', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('radio', { name: 'de' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});
