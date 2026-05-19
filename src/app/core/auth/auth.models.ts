export type ChocoboRole =
  | 'Admin'
  | 'Gerente'
  | 'Vendedor'
  | 'Caixa'
  | 'Financeiro'
  | 'Comprador'
  | 'Consultor'
  | 'Mecanico';

export type ChocoboStore = {
  id: string;
  code: string;
  name: string;
  cnpj: string;
  city: string;
  status: 'ATIVA' | 'HOMOLOGACAO';
};

export type ChocoboUser = {
  id: string;
  login: string;
  name: string;
  email: string;
  roles: ChocoboRole[];
};

export type AuthSession = {
  token: string;
  serverUrl: string;
  user: ChocoboUser;
  stores: ChocoboStore[];
  activeStoreId: string | null;
  demoMode: boolean;
  createdAt: string;
};

export type LoginRequest = {
  serverUrl: string;
  username: string;
  password: string;
};

export type LoginResult = {
  session: AuthSession;
  source: 'api' | 'demo';
};
