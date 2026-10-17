import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { CatalogScreen } from '@/feature/catalog/presentation/list/CatalogScreen';
import { initialState } from '@/feature/catalog/presentation/list/CatalogModel';
import { appError } from '@/core/result/AppResult';
it('renders titles as text, native hrefs and typed refresh events', async () => {
  const event = vi.fn();
  const user = userEvent.setup();
  render(
    <CatalogScreen
      state={initialState(
        { ok: true, value: [{ id: 'x', title: '<script>unsafe</script>' }] },
        0,
      )}
      onEvent={event}
      hrefForItem={() => '/catalog/78'}
    />,
  );
  expect(screen.getByRole('link', { name: /<script>unsafe/ })).toHaveAttribute(
    'href',
    '/catalog/78',
  );
  expect(document.querySelector('script')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(event).toHaveBeenCalledWith({ type: 'refresh' });
});
it('shows safe expected error text and omits retry when invalid data is not retryable', () => {
  render(
    <CatalogScreen
      state={initialState({ ok: false, error: appError('DECODING') }, 0)}
      onEvent={vi.fn()}
      hrefForItem={() => ''}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('unexpected response');
  expect(
    screen.queryByRole('button', { name: /Try again/ }),
  ).not.toBeInTheDocument();
});
