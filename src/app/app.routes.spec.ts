import '@angular/compiler';

import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

describe('app routes', () => {
  it('mantem dashboard como entrada operacional autenticada', () => {
    expect(routes[0]).toMatchObject({
      path: '',
      pathMatch: 'full',
      redirectTo: 'dashboard'
    });

    expect(routes.some((route) => route.path === 'login')).toBe(true);
    expect(routes.some((route) => route.path === 'dashboard')).toBe(true);
    expect(routes.some((route) => route.path === 'vendas/pdv')).toBe(true);
    expect(routes.some((route) => route.path === 'health')).toBe(true);
  });
});
