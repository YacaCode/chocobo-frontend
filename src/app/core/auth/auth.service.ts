import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import type { Observable } from 'rxjs';

import type { AuthSession, ChocoboRole, ChocoboStore, ChocoboUser, LoginRequest, LoginResult } from './auth.models';

const SESSION_KEY = 'chocobo.auth.session';

const DEMO_STORES: ChocoboStore[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    code: 'MOTOPECAS',
    name: 'PH Motopecas',
    cnpj: '00.000.000/0000-00',
    city: 'Fortaleza / CE',
    status: 'ATIVA'
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    code: 'MOTOSERVICE',
    name: 'PH Motoservice',
    cnpj: '00.000.000/0000-00',
    city: 'Fortaleza / CE',
    status: 'ATIVA'
  }
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionSignal = signal<AuthSession | null>(readStoredSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionSignal()?.token));
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly stores = computed(() => this.sessionSignal()?.stores ?? []);
  readonly activeStore = computed(() => {
    const session = this.sessionSignal();

    if (!session?.activeStoreId) {
      return null;
    }

    return session.stores.find((store) => store.id === session.activeStoreId) ?? null;
  });
  readonly activeRoles = computed(() => this.user()?.roles ?? []);

  login(request: LoginRequest): Observable<LoginResult> {
    const payload = {
      server: request.serverUrl.trim(),
      username: request.username.trim(),
      password: request.password
    };

    return this.http.post<unknown>('/api/v1/auth/login', payload).pipe(
      map((response) => ({
        session: normalizeApiSession(response, payload.server, payload.username),
        source: 'api' as const
      })),
      catchError(() => of({
        session: createDemoSession(payload.server, payload.username),
        source: 'demo' as const
      })),
      tap((result) => this.commitSession({
        ...result.session,
        activeStoreId: null
      }))
    );
  }

  selectStore(storeId: string): void {
    const session = this.sessionSignal();

    if (!session || !session.stores.some((store) => store.id === storeId)) {
      return;
    }

    const selectedSession = {
      ...session,
      activeStoreId: storeId
    };
    this.commitSession(selectedSession);

    if (session.demoMode) {
      return;
    }

    this.http.post<unknown>('/api/v1/core/me/loja-ativa', { lojaId: storeId }).pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      const record = asRecord(response);
      const token = readString(record, ['accessToken', 'token']);
      if (!token) {
        return;
      }

      this.commitSession({
        ...selectedSession,
        token,
        user: normalizeUser(record['usuario'] ?? selectedSession.user)
      });
    });
  }

  clearStoreSelection(): void {
    const session = this.sessionSignal();

    if (!session) {
      return;
    }

    this.commitSession({
      ...session,
      activeStoreId: null
    });
  }

  logout(): void {
    this.sessionSignal.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private commitSession(session: AuthSession): void {
    this.sessionSignal.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (!parsed.token || !parsed.user || !Array.isArray(parsed.stores)) {
      return null;
    }

    return {
      token: String(parsed.token),
      serverUrl: String(parsed.serverUrl ?? ''),
      user: normalizeUser(parsed.user),
      stores: parsed.stores.map((store) => normalizeStore(store)),
      activeStoreId: typeof parsed.activeStoreId === 'string' ? parsed.activeStoreId : null,
      demoMode: Boolean(parsed.demoMode),
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function normalizeApiSession(payload: unknown, serverUrl: string, username: string): AuthSession {
  const record = asRecord(payload);
  const token = readString(record, ['access', 'accessToken', 'token']) || createDemoToken(username);
  const userPayload = asRecord(record['usuario'] ?? record['user']);
  const storesPayload = Array.isArray(record['lojasDisponiveis'])
    ? record['lojasDisponiveis']
    : Array.isArray(record['stores'])
      ? record['stores']
      : DEMO_STORES;

  return {
    token,
    serverUrl,
    user: normalizeUser({ ...userPayload, login: readString(userPayload, ['login', 'username']) || username }),
    stores: storesPayload.map((store) => normalizeStore(store)),
    activeStoreId: null,
    demoMode: false,
    createdAt: new Date().toISOString()
  };
}

function createDemoSession(serverUrl: string, username: string): AuthSession {
  const login = username.trim() || 'ana';

  return {
    token: createDemoToken(login),
    serverUrl: serverUrl || 'http://127.0.0.1:8080',
    user: createDemoUser(login),
    stores: DEMO_STORES,
    activeStoreId: null,
    demoMode: true,
    createdAt: new Date().toISOString()
  };
}

function createDemoUser(login: string): ChocoboUser {
  const normalized = login.toLowerCase();
  const roles: ChocoboRole[] = normalized.includes('caixa')
    ? ['Caixa']
    : normalized.includes('vendedor')
      ? ['Vendedor']
      : normalized.includes('financeiro')
        ? ['Financeiro']
        : ['Admin', 'Gerente'];

  return {
    id: normalized || 'ana',
    login: normalized || 'ana',
    name: normalized === 'ana' ? 'ANA' : titleCase(normalized),
    email: `${normalized || 'ana'}@chocobo.local`,
    roles
  };
}

function normalizeUser(payload: unknown): ChocoboUser {
  const record = asRecord(payload);
  const login = readString(record, ['login', 'username']) || 'ana';
  const rawRoles = Array.isArray(record['roles'])
    ? record['roles']
    : Array.isArray(record['papeis'])
      ? record['papeis']
      : ['Admin'];

  return {
    id: readString(record, ['id', 'uuid']) || login,
    login,
    name: readString(record, ['name', 'nome']) || titleCase(login),
    email: readString(record, ['email']) || `${login}@chocobo.local`,
    roles: rawRoles.map(String).filter(Boolean) as ChocoboRole[]
  };
}

function normalizeStore(payload: unknown): ChocoboStore {
  const record = asRecord(payload);
  const id = readString(record, ['id', 'uuid', 'codigo']) || '1';
  const name = readString(record, ['name', 'nome', 'razao_social']) || 'PH MOTOPECAS';

  return {
    id,
    code: readString(record, ['code', 'codigo']) || id.padStart(2, '0'),
    name,
    cnpj: readString(record, ['cnpj']) || '12.345.678/0001-90',
    city: readString(record, ['city', 'cidade', 'municipio']) || 'Fortaleza / CE',
    status: readString(record, ['status']) === 'HOMOLOGACAO' ? 'HOMOLOGACAO' : 'ATIVA'
  };
}

function createDemoToken(login: string): string {
  const raw = `${login || 'ana'}:${Date.now()}`;
  return typeof btoa === 'function' ? btoa(raw) : raw;
}

function titleCase(value: string): string {
  return value
    .split(/[._ -]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ') || 'Usuario';
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key]) {
      return record[key] as string;
    }

    if (typeof record[key] === 'number') {
      return String(record[key]);
    }
  }

  return '';
}
