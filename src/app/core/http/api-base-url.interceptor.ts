import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';

import { AuthService } from '../auth/auth.service';

const LOCAL_BACKEND_ORIGIN = 'http://127.0.0.1:8080';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (/^https?:\/\//i.test(request.url) || !request.url.startsWith('/api/')) {
    return next(request);
  }

  const auth = inject(AuthService);
  const session = auth.session();
  const loginServerUrl = readLoginServerUrl(request.body);
  const serverUrl = session?.serverUrl || loginServerUrl || auth.lastServerUrl();
  let headers = request.headers.set('Accept', 'application/json');

  if (session?.token) {
    headers = headers.set('Authorization', `Bearer ${session.token}`);
  }

  if (session?.activeStoreId) {
    headers = headers.set('X-Chocobo-Store-Id', session.activeStoreId);
  }

  if (session?.serverUrl) {
    headers = headers.set('X-Chocobo-Server', session.serverUrl);
  }

  if (session?.user?.login) {
    headers = headers.set('X-Chocobo-User', session.user.login);
  }

  const apiBaseUrl = resolveApiBaseUrl(serverUrl);

  return next(request.clone({
    url: apiBaseUrl ? new URL(request.url, apiBaseUrl).toString() : request.url,
    headers
  }));
};

function resolveApiBaseUrl(serverUrl?: string): string | null {
  if (serverUrl && serverUrl.trim()) {
    return normalizeOrigin(serverUrl);
  }

  if (window.location.port === '4300' || window.location.protocol === 'file:') {
    return LOCAL_BACKEND_ORIGIN;
  }

  return null;
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  return `http://${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function readLoginServerUrl(body: unknown): string {
  if (typeof body !== 'object' || body === null) {
    return '';
  }

  const server = (body as Record<string, unknown>)['server'];
  return typeof server === 'string' ? server : '';
}
