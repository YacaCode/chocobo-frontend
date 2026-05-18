import type { HttpInterceptorFn } from '@angular/common/http';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (/^https?:\/\//i.test(request.url) || !request.url.startsWith('/api/')) {
    return next(request);
  }

  return next(request.clone({ url: request.url }));
};
