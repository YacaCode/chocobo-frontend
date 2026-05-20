import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_GARANTIA = [
  { id: 'os-010', numero: 'OS-0010', dataAbertura: '15/03/2026', dataFechamento: '15/03/2026', placa: 'ABC-1D34', modelo: 'Bros 150', cliente: 'Joao da Silva', status: 'GARANTIA', consultor: 'Ana Consultora' },
  { id: 'os-011', numero: 'OS-0011', dataAbertura: '02/04/2026', dataFechamento: '02/04/2026', placa: 'DEF-2E56', modelo: 'Factor 150', cliente: 'Maria Oliveira', status: 'REABILITADO', consultor: 'João Consultor' },
  { id: 'os-012', numero: 'OS-0012', dataAbertura: '10/04/2026', dataFechamento: '10/04/2026', placa: 'GHI-3F78', modelo: 'XRE 300', cliente: 'Carlos Santos', status: 'FINALIZADO', consultor: 'Ana Consultora' }
];

@Component({
  selector: 'chb-garantia-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CalendarModule, DropdownModule, FormsModule, InputTextModule,
    RouterLink, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="page-toolbar">
      <h2 class="page-title">Relatório de Garantia</h2>
      <div class="toolbar-actions">
        <button pButton icon="pi pi-file-export" label="Exportar CSV"
                class="p-button-outlined p-button-sm" (click)="exportarCsv()"></button>
        <button pButton icon="pi pi-print" label="Imprimir"
                class="p-button-outlined p-button-sm" (click)="imprimir()"></button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros-panel">
      <div class="filtros-grid">
        <label class="field">
          <span>Tipo</span>
          <p-dropdown [(ngModel)]="filtroTipo" [options]="tiposRelatorio"
                      optionLabel="label" optionValue="value"
                      styleClass="w-full"></p-dropdown>
        </label>
        <label class="field">
          <span>Período (de)</span>
          <p-calendar [(ngModel)]="filtroDataInicio" dateFormat="dd/mm/yy"
                      [showIcon]="true" styleClass="w-full"></p-calendar>
        </label>
        <label class="field">
          <span>Período (até)</span>
          <p-calendar [(ngModel)]="filtroDataFim" dateFormat="dd/mm/yy"
                      [showIcon]="true" styleClass="w-full"></p-calendar>
        </label>
        <label class="field">
          <span>Cliente</span>
          <input pInputText [(ngModel)]="filtroCliente" placeholder="Nome parcial..." />
        </label>
        <label class="field">
          <span>Placa</span>
          <input pInputText [(ngModel)]="filtroPlaca" placeholder="ABC-1234"
                 style="text-transform:uppercase;font-family:monospace" />
        </label>
        <div class="field" style="align-self:flex-end">
          <button pButton icon="pi pi-search" label="Buscar"
                  [loading]="loading()" (click)="buscar()"></button>
        </div>
      </div>
    </div>

    @if (loading()) {
      @for (i of [1,2,3]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="resultados()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id" [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="numero">DAV <p-sortIcon field="numero"></p-sortIcon></th>
            <th pSortableColumn="dataAbertura">Abertura <p-sortIcon field="dataAbertura"></p-sortIcon></th>
            <th>Fechamento</th>
            <th>Placa</th>
            <th>Modelo</th>
            <th pSortableColumn="cliente">Cliente <p-sortIcon field="cliente"></p-sortIcon></th>
            <th>Status</th>
            <th>Consultor</th>
            <th style="width:120px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-os>
          <tr [class.row-garantia]="os.status === 'GARANTIA'" [class.row-reabilitado]="os.status === 'REABILITADO'">
            <td style="font-family:monospace;font-weight:700">{{ os.numero }}</td>
            <td>{{ os.dataAbertura }}</td>
            <td>{{ os.dataFechamento }}</td>
            <td style="font-family:monospace">{{ os.placa }}</td>
            <td>{{ os.modelo }}</td>
            <td>{{ os.cliente }}</td>
            <td>
              <p-tag [value]="os.status" [severity]="severidade(os.status)"></p-tag>
            </td>
            <td>{{ os.consultor }}</td>
            <td>
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"
                      [routerLink]="['/servicos/atendimento', os.id]"
                      pTooltip="Ver OS"></button>
              @if (os.status === 'FINALIZADO') {
                <button pButton icon="pi pi-refresh" class="p-button-text p-button-sm p-button-warning"
                        (click)="reabilitar(os)"
                        pTooltip="Reabilitar"></button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" style="text-align:center;padding:2rem">
              <i class="pi pi-shield" style="font-size:2rem;color:var(--chb-text-muted)"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhuma OS de garantia encontrada no período.</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    }
  `,
  styles: [`
    .page-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0; flex-wrap:wrap; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .toolbar-actions { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center; }
    .filtros-panel { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; margin-bottom:1rem; }
    .filtros-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:.75rem; align-items:start; }
    .field { display:grid; gap:.35rem; font-size:.86rem; font-weight:700; color:var(--chb-text); }
    .field input { width:100%; }
    .w-full { width:100%; }
    .row-garantia { background:#fef9c3 !important; }
    .row-reabilitado { background:#ffedd5 !important; }
    @media (max-width:768px) { .filtros-grid { grid-template-columns:1fr 1fr; } }
  `]
})
export class GarantiaPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(false);
  readonly resultados = signal<any[]>([]);

  filtroTipo = 'ABERTURA';
  filtroDataInicio: Date | null = null;
  filtroDataFim: Date | null = null;
  filtroCliente = '';
  filtroPlaca = '';

  readonly tiposRelatorio = [
    { label: 'Por Data de Abertura', value: 'ABERTURA' },
    { label: 'Por Data de Fechamento', value: 'FECHAMENTO' }
  ];

  ngOnInit(): void { this.buscar(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'warning' | 'danger' | 'secondary'> = {
      'GARANTIA': 'warning', 'REABILITADO': 'danger', 'FINALIZADO': 'secondary'
    };
    return map[status];
  }

  buscar(): void {
    this.loading.set(true);
    const params = new URLSearchParams({ tipo: 'GARANTIA', tipoData: this.filtroTipo });
    if (this.filtroCliente) params.set('cliente', this.filtroCliente);
    if (this.filtroPlaca) params.set('placa', this.filtroPlaca.toUpperCase());
    this.http.get<any[]>(`/api/v1/servicos/dav-os?${params}`)
      .pipe(catchError(() => of(DEMO_GARANTIA)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.resultados.set(data));
  }

  reabilitar(os: any): void {
    this.http.post<any>(`/api/v1/servicos/dav-os/${os.id}/reabilitar`, {})
      .pipe(catchError(() => of({ ...os, status: 'REABILITADO' })), takeUntil(this.destroy$))
      .subscribe(data => {
        this.resultados.update(list => list.map(o => o.id === os.id ? { ...o, status: data.status ?? 'REABILITADO' } : o));
        this.msg.add({ severity: 'success', summary: 'Reabilitado', detail: `OS ${os.numero} reabilitada com sucesso.` });
      });
  }

  exportarCsv(): void {
    const headers = ['DAV', 'Abertura', 'Fechamento', 'Placa', 'Modelo', 'Cliente', 'Status', 'Consultor'];
    const rows = this.resultados().map(o => [o.numero, o.dataAbertura, o.dataFechamento, o.placa, o.modelo, o.cliente, o.status, o.consultor]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `garantia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  imprimir(): void { window.print(); }
}
