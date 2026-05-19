import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DemoApiService {
  private readonly http = inject(HttpClient);

  list<T extends Record<string, unknown>>(endpoint: string, fallback: T[]): Observable<T[]> {
    return this.http.get<unknown>(endpoint).pipe(
      map((payload) => normalizeList(payload, fallback)),
      catchError(() => of(fallback))
    );
  }
}

function normalizeList<T extends Record<string, unknown>>(payload: unknown, fallback: T[]): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    const candidates = [record['results'], record['items'], record['data']];
    const list = candidates.find(Array.isArray);

    if (Array.isArray(list)) {
      return list as T[];
    }
  }

  return fallback;
}
