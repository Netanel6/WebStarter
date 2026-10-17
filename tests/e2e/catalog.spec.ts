import { expect, test, type APIRequestContext } from '@playwright/test';
const control = async (
  request: APIRequestContext,
  scenario: Record<string, unknown>,
) => {
  const response = await request.post('http://127.0.0.1:4318/control', {
    data: scenario,
  });
  expect(response.ok()).toBeTruthy();
};
const token = (id: string) =>
  id
    .split('')
    .map((unit) => unit.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
test.beforeEach(async ({ request }) => {
  await control(request, { kind: 'success' });
});

test('SSR content, no hydration fetch, explicit refresh and real detail links', async ({
  page,
  request,
}) => {
  const apiRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/catalog')) apiRequests.push(req.url());
  });
  const response = await page.goto('/catalog');
  expect(await response?.text()).toContain('Field notes');
  await expect(
    page.getByRole('heading', { name: 'Field notes', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Refresh', exact: true }),
  ).toBeEnabled();
  expect(apiRequests).toHaveLength(0);
  expect(
    (await (await request.get('http://127.0.0.1:4318/stats')).json()).count,
  ).toBe(1);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Collection updated.');
  expect(apiRequests).toHaveLength(1);
  await page.getByRole('link', { name: /Field notes/ }).click();
  await expect(page).toHaveURL(`/catalog/${token('field-notes')}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Field notes',
  );
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Field notes',
  );
  await page.getByRole('link', { name: /Back to the collection/ }).click();
  await expect(
    page.getByRole('heading', { name: 'The collection', exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Field notes',
  );
});

test('fresh server snapshots replace controller state on navigation', async ({
  page,
  request,
}) => {
  await page.goto('/catalog');
  await page.getByRole('link', { name: /Field notes/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Field notes',
  );
  await control(request, {
    kind: 'success',
    items: [{ id: 'new', title: 'New object' }],
  });
  await page.getByRole('link', { name: /Back to the collection/ }).click();
  await expect(page.getByRole('heading', { name: 'New object' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Field notes' })).toHaveCount(
    0,
  );
});

test('refresh failure retains content; retry recovers; no-store is explicit', async ({
  page,
  request,
}) => {
  await page.goto('/catalog');
  await control(request, { kind: 'server' });
  const responsePromise = page.waitForResponse('**/api/catalog');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(503);
  expect(response.headers()['cache-control']).toBe('no-store');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'temporarily unavailable',
  );
  await expect(
    page.getByRole('heading', { name: 'Field notes', exact: true }),
  ).toBeVisible();
  await control(request, { kind: 'empty' });
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A little room for something new' }),
  ).toBeVisible();
});

test('rate-limited retry is gated and initial error matches handler semantics', async ({
  page,
  request,
}) => {
  await control(request, { kind: 'rate' });
  await page.goto('/catalog');
  await expect(
    page.getByRole('button', { name: 'Try again shortly' }),
  ).toBeDisabled();
  const result = await request.get('/api/catalog');
  expect(result.status()).toBe(429);
  expect((await result.json()).error).toMatchObject({
    code: 'RATE_LIMITED',
    retryable: true,
    retryAfterSeconds: 1,
  });
  await control(request, { kind: 'success' });
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Field notes', exact: true }),
  ).toBeVisible();
});

test('initial malformed and empty responses are rendered safely', async ({
  page,
  request,
}) => {
  await control(request, { kind: 'malformed' });
  await page.goto('/catalog');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'unexpected response',
  );
  await expect(page.getByRole('button', { name: /Try again/ })).toHaveCount(0);
  expect((await (await request.get('/api/catalog')).json()).error.code).toBe(
    'DECODING',
  );
  await control(request, { kind: 'empty' });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'A little room for something new' }),
  ).toBeVisible();
});

test('missing item differs from upstream 404; opaque IDs survive direct URLs', async ({
  page,
  request,
}) => {
  await page.goto(`/catalog/${token('not-here')}`);
  await expect(
    page.getByRole('heading', { name: 'This object isn’t here' }),
  ).toBeVisible();
  await control(request, { kind: 'missing-service' });
  await page.goto(`/catalog/${token('field-notes')}`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'service could not be found',
  );
  await expect(
    page.getByRole('heading', { name: 'This object isn’t here' }),
  ).toHaveCount(0);
  const id = ' עברית / ?#% ';
  await control(request, {
    kind: 'success',
    items: [{ id, title: 'Opaque identifier' }],
  });
  await page.goto(`/catalog/${token(id)}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Opaque identifier',
  );
});

test('browser navigation, keyboard and responsive RTL/dark layout', async ({
  page,
  context,
  browserName,
}) => {
  await page.goto('/catalog');
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab',
  );
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const link = page.getByRole('link', { name: /Field notes/ });
  const popupPromise = context.waitForEvent('page');
  await link.click({ modifiers: ['ControlOrMeta'] });
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await expect(popup.getByRole('heading', { level: 1 })).toHaveText(
    'Field notes',
  );
  await popup.close();
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() =>
      document.documentElement.setAttribute('dir', 'rtl'),
    );
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await expect(
      page.getByRole('heading', { name: 'The collection', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test('client HTML, RSC and bundles do not expose server configuration', async ({
  page,
  request,
}) => {
  const forbidden = ['web-starter-secret-sentinel', '127.0.0.1:4318'];
  const response = await page.goto('/catalog');
  const html = await response!.text();
  for (const value of forbidden) expect(html).not.toContain(value);
  const scripts = await page
    .locator('script[src]')
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLScriptElement).src),
    );
  for (const url of scripts) {
    const text = await (await request.get(url)).text();
    for (const value of forbidden) expect(text).not.toContain(value);
  }
  const json = await (await request.get('/api/catalog')).text();
  for (const value of forbidden) expect(json).not.toContain(value);
});
