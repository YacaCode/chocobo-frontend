import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { DemoApiService } from '../../core/http/demo-api.service';
import { workspaceConfigs } from './workspace.data';
import type { WorkspaceColumn, WorkspaceConfig, WorkspaceRow } from './workspace.types';

@Component({
  selector: 'chb-workspace-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DecimalPipe, FormsModule, InputTextModule, TableModule, TagModule],
  template: `
    <section class="workspace">
      <header class="workspace__header">
        <div>
          <p>{{ resolvedConfig().area }}</p>
          <h2>{{ resolvedConfig().title }}</h2>
          <span>{{ resolvedConfig().description }}</span>
        </div>
        <div class="workspace__actions" aria-label="Acoes da pagina">
          @for (action of resolvedConfig().secondaryActions; track action.label) {
            <button pButton type="button" class="p-button-outlined" [icon]="action.icon" [label]="action.label" (click)="touch(action.label)"></button>
          }
          <button pButton type="button" [icon]="resolvedConfig().primaryAction.icon" [label]="resolvedConfig().primaryAction.label" (click)="touch(resolvedConfig().primaryAction.label)"></button>
        </div>
      </header>

      @if (lastAction(); as action) {
        <p class="workspace__notice">
          {{ action }}
        </p>
      }

      <div class="workspace__kpis" aria-label="Indicadores">
        @for (kpi of resolvedConfig().kpis; track kpi.label) {
          <article class="kpi" [class]="'kpi kpi--' + kpi.tone">
            <i [class]="kpi.icon" aria-hidden="true"></i>
            <div>
              <span>{{ kpi.label }}</span>
              <strong>{{ kpi.value }}</strong>
              <small>{{ kpi.detail }}</small>
            </div>
          </article>
        }
      </div>

      <div class="workspace__grid">
        <article class="panel panel--table">
          <div class="panel__toolbar">
            <div>
              <p>Consulta</p>
              <h3>Registros operacionais</h3>
            </div>
            <span class="p-input-icon-left panel__search">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                pInputText
                type="search"
                placeholder="Filtrar tabela"
                [ngModel]="filter()"
                (ngModelChange)="filter.set($event)" />
            </span>
          </div>

          <p-table
            [value]="filteredRows()"
            [loading]="loading()"
            [rows]="8"
            [paginator]="filteredRows().length > 8"
            responsiveLayout="scroll"
            styleClass="chb-data-table">
            <ng-template pTemplate="header">
              <tr>
                @for (column of resolvedConfig().columns; track column.field) {
                  <th>{{ column.header }}</th>
                }
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row>
              <tr>
                @for (column of resolvedConfig().columns; track column.field) {
                  <td>
                    @if (column.type === 'status') {
                      <p-tag [value]="formatCell(row, column)" [severity]="severity(row[column.field])"></p-tag>
                    } @else {
                      {{ formatCell(row, column) }}
                    }
                  </td>
                }
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td [attr.colspan]="resolvedConfig().columns.length">Nenhum registro encontrado.</td>
              </tr>
            </ng-template>
          </p-table>
        </article>

        <aside class="workspace__side">
          <article class="panel">
            <div class="panel__title">
              <p>{{ resolvedConfig().queueTitle }}</p>
              <h3>Fila de trabalho</h3>
            </div>
            <div class="queue">
              @for (item of resolvedConfig().queue; track item.title) {
                <button type="button" class="queue__item" (click)="touch(item.title)">
                  <span [class]="'queue__dot queue__dot--' + item.tone" aria-hidden="true"></span>
                  <span>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.detail }}</small>
                  </span>
                  <p-tag [value]="item.status" [severity]="severity(item.tone)"></p-tag>
                </button>
              } @empty {
                <p class="panel__empty">Sem pendencias.</p>
              }
            </div>
          </article>

          <article class="panel">
            <div class="panel__title">
              <p>Entrada</p>
              <h3>{{ resolvedConfig().formTitle }}</h3>
            </div>
            <form class="quick-form" (ngSubmit)="saveDraft()">
              @for (field of resolvedConfig().formFields; track field.label) {
                <label>
                  <span>{{ field.label }}</span>
                  @if (field.kind === 'textarea') {
                    <textarea pInputText rows="3" [value]="field.value"></textarea>
                  } @else {
                    <input pInputText [type]="field.kind === 'number' ? 'text' : field.kind || 'text'" [value]="field.value" />
                  }
                </label>
              }
              <button pButton type="submit" icon="pi pi-save" label="Salvar rascunho"></button>
            </form>
          </article>

          <article class="panel">
            <div class="panel__title">
              <p>Notas de negocio</p>
              <h3>{{ resolvedConfig().insightTitle }}</h3>
            </div>
            <ul class="insights">
              @for (insight of resolvedConfig().insights; track insight) {
                <li>{{ insight }}</li>
              }
            </ul>
          </article>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .workspace {
      display: grid;
      gap: 0.85rem;
    }

    .workspace__header,
    .workspace__notice,
    .panel,
    .kpi {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      box-shadow: var(--chb-shadow-soft);
    }

    .workspace__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
    }

    .workspace__header p,
    .panel__title p,
    .panel__toolbar p,
    h2,
    h3 {
      margin: 0;
    }

    .workspace__header p,
    .panel__title p,
    .panel__toolbar p {
      color: var(--chb-text-muted);
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    h2 {
      color: var(--chb-text);
      font-size: 1.35rem;
      line-height: 1.15;
    }

    .workspace__header span {
      display: block;
      max-width: 44rem;
      margin-top: 0.4rem;
      color: var(--chb-text-muted);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .workspace__actions,
    .panel__toolbar {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .workspace__actions {
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .workspace__notice {
      margin: 0;
      border-left: 4px solid var(--chb-yellow);
      color: var(--chb-text);
      font-weight: 700;
      padding: 0.7rem 0.85rem;
      font-size: 0.88rem;
    }

    .workspace__kpis {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.85rem;
    }

    .kpi {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.8rem;
    }

    .kpi i {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.5rem;
      background: var(--chb-navy-50);
      color: var(--chb-navy);
      font-size: 1.15rem;
    }

    .kpi--success i {
      background: #dcfce7;
      color: #166534;
    }

    .kpi--warning i {
      background: var(--chb-yellow-50);
      color: var(--chb-yellow-700);
    }

    .kpi--danger i {
      background: #fee2e2;
      color: #991b1b;
    }

    .kpi span,
    .kpi small {
      display: block;
      color: var(--chb-text-muted);
      font-size: 0.78rem;
      font-weight: 800;
    }

    .kpi strong {
      display: block;
      margin: 0.15rem 0;
      color: var(--chb-text);
      font-size: 1.12rem;
    }

    .workspace__grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(17rem, 20rem);
      gap: 0.85rem;
      align-items: start;
      min-width: 0;
    }

    .panel {
      display: grid;
      gap: 0.75rem;
      padding: 0.85rem;
    }

    .panel--table {
      min-width: 0;
      overflow: hidden;
    }

    .panel__toolbar {
      justify-content: space-between;
      flex-wrap: wrap;
      min-width: 0;
    }

    .panel__search {
      flex: 1 1 14rem;
      width: min(100%, 18rem);
      min-width: 12rem;
    }

    .panel__search input {
      width: 100%;
    }

    h3 {
      color: var(--chb-text);
      font-size: 1.05rem;
    }

    .workspace__side {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    .queue {
      display: grid;
      gap: 0.6rem;
    }

    .queue__item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.75rem;
      align-items: center;
      width: 100%;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      color: inherit;
      cursor: pointer;
      padding: 0.65rem;
      text-align: left;
    }

    .queue__item strong,
    .queue__item small {
      display: block;
    }

    .queue__item strong {
      overflow: hidden;
      color: var(--chb-text);
      font-size: 0.9rem;
      line-height: 1.25;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .queue__item small {
      margin-top: 0.2rem;
      color: var(--chb-text-muted);
      font-size: 0.78rem;
      line-height: 1.35;
    }

    .queue__dot {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 999px;
      background: var(--chb-text-muted);
    }

    .queue__dot--success {
      background: #22c55e;
    }

    .queue__dot--warning {
      background: var(--chb-yellow);
    }

    .queue__dot--danger {
      background: #ef4444;
    }

    .queue__dot--info {
      background: #0ea5e9;
    }

    .quick-form {
      display: grid;
      gap: 0.65rem;
    }

    label {
      display: grid;
      gap: 0.35rem;
      color: var(--chb-text);
      font-size: 0.86rem;
      font-weight: 800;
    }

    input,
    textarea {
      width: 100%;
    }

    textarea {
      resize: vertical;
    }

    .insights {
      display: grid;
      gap: 0.65rem;
      margin: 0;
      padding-left: 1.1rem;
      color: var(--chb-text-muted);
      line-height: 1.45;
    }

    .panel__empty {
      margin: 0;
      color: var(--chb-text-muted);
    }

    :host ::ng-deep .panel--table .chb-data-table table {
      min-width: 42rem;
    }

    @media (max-width: 1280px) {
      .workspace__grid {
        grid-template-columns: 1fr;
      }

      .workspace__side {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 767px) {
      .workspace__header,
      .panel__toolbar {
        align-items: stretch;
        flex-direction: column;
      }

      .workspace__actions {
        justify-content: stretch;
      }

      .workspace__actions button {
        width: 100%;
      }

      .panel__search {
        flex-basis: auto;
        min-width: 0;
        width: 100%;
      }

      .workspace__kpis,
      .workspace__side {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspacePage {
  private readonly api = inject(DemoApiService);

  readonly config = input<WorkspaceConfig | null>(null);
  readonly rows = signal<WorkspaceRow[]>([]);
  readonly loading = signal(false);
  readonly filter = signal('');
  readonly lastAction = signal('');
  readonly resolvedConfig = signal(workspaceConfigs['generic']);
  readonly filteredRows = signal<WorkspaceRow[]>([]);

  constructor() {
    effect(() => {
      const config = this.config() ?? workspaceConfigs['generic'];
      this.resolvedConfig.set(config);
      this.filter.set('');
      this.loading.set(true);

      this.api.list(config.endpoint, config.rows).subscribe((rows) => {
        this.rows.set(rows);
        this.filteredRows.set(rows);
        this.loading.set(false);
      });
    }, { allowSignalWrites: true });

    effect(() => {
      const needle = this.filter().trim().toLowerCase();
      const rows = this.rows();

      this.filteredRows.set(needle
        ? rows.filter((row) => Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(needle)))
        : rows);
    }, { allowSignalWrites: true });
  }

  formatCell(row: WorkspaceRow, column: WorkspaceColumn): string {
    const value = row[column.field];

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (column.type === 'money' && typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    if (column.type === 'number' && typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR').format(value);
    }

    return String(value);
  }

  severity(value: unknown): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const normalized = String(value ?? '').toLowerCase();

    if (['success', 'ativo', 'ativa', 'autorizada', 'ok', 'pronto', 'conferida', 'emitida', 'fechado', 'regular'].some((term) => normalized.includes(term))) {
      return 'success';
    }

    if (['danger', 'risco', 'rejeitada', 'atrasado', 'atraso', 'corrigir', 'bloqueado'].some((term) => normalized.includes(term))) {
      return 'danger';
    }

    if (['warning', 'pendente', 'revisar', 'aberto', 'aberta', 'separacao', 'garantia', 'programado'].some((term) => normalized.includes(term))) {
      return 'warning';
    }

    if (['info', 'demo', 'caixa', 'cotando', 'processar', 'validar'].some((term) => normalized.includes(term))) {
      return 'info';
    }

    return 'secondary';
  }

  touch(label: string): void {
    this.lastAction.set(`${label}: acao registrada localmente para conferencia.`);
  }

  saveDraft(): void {
    this.touch('Rascunho salvo');
  }
}
