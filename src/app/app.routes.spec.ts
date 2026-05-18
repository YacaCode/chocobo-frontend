import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

describe('app routes', () => {
  it('mantem a rota de health como entrada operacional', () => {
    expect(routes[0]).toMatchObject({
      path: '',
      pathMatch: 'full',
      redirectTo: 'health'
    });

    expect(routes.some((route) => route.path === 'health')).toBe(true);
  });
});
