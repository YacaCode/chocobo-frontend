export type WorkspaceTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type WorkspaceKpi = {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: WorkspaceTone;
};

export type WorkspaceColumn = {
  field: string;
  header: string;
  type?: 'text' | 'money' | 'status' | 'number';
};

export type WorkspaceRow = Record<string, string | number | boolean | null>;

export type WorkspaceQueueItem = {
  title: string;
  detail: string;
  status: string;
  tone: WorkspaceTone;
};

export type WorkspaceAction = {
  label: string;
  icon: string;
  route?: string;
};

export type WorkspaceFormField = {
  label: string;
  value: string;
  kind?: 'text' | 'number' | 'date' | 'textarea';
};

export type WorkspaceConfig = {
  area: string;
  title: string;
  description: string;
  endpoint: string;
  primaryAction: WorkspaceAction;
  secondaryActions: WorkspaceAction[];
  kpis: WorkspaceKpi[];
  columns: WorkspaceColumn[];
  rows: WorkspaceRow[];
  queueTitle: string;
  queue: WorkspaceQueueItem[];
  formTitle: string;
  formFields: WorkspaceFormField[];
  insightTitle: string;
  insights: string[];
};
