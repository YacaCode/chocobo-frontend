import { ChangeDetectionStrategy, Component, Input, type OnDestroy, type OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

export interface CrudAuxiliarConfig {
  titulo: string;
  endpoint: string;
  colunas: { field: string; header: string }[];
  campos: { name: string; label: string; type?: 'text' | 'number' | 'checkbox'; required?: boolean }[];
  demoData?: Record<string, unknown>[];
}

@Component({
  selector: 'chb-crud-auxiliar',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    FormsModule,
    InputNumberModule,
    InputTextModule,
    ReactiveFormsModule,
    SkeletonModule,
    TableModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="crud-aux">
      <div class="crud-aux-toolbar">
        <h2 class="crud-aux-title">{{ config.titulo }}</h2>
        <div class="toolbar-right">
          <span class="p-input-icon-left">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input pInputText [(ngModel)]="searchInput" placeholder="Buscar..." (ngModelChange)="onSearch($event)" aria-label="Buscar" />
          </span>
          <button pButton type="button" icon="pi pi-plus" label="Novo" (click)="abrirDialogNovo()" aria-label="Novo registro"></button>
        </div>
      </div>

      @if (loading() && !itens().length) {
        <div class="skeleton-list">
          @for (i of [1,2,3,4,5]; track i) { <p-skeleton height="3rem" styleClass="mb-1"></p-skeleton> }
        </div>
      } @else if (!filtrados().length) {
        <div class="empty-state">
          <i class="pi pi-inbox" aria-hidden="true"></i>
          <p>Nenhum registro encontrado.</p>
        </div>
      } @else {
        <p-table [value]="filtrados()" [paginator]="true" [rows]="20" dataKey="id" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              @for (col of config.colunas; track col.field) {
                <th [pSortableColumn]="col.field">{{ col.header }} <p-sortIcon [field]="col.field"></p-sortIcon></th>
              }
              <th style="width:80px">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              @for (col of config.colunas; track col.field) {
                <td>{{ item[col.field] }}</td>
              }
              <td>
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text p-button-sm"
                        (click)="abrirDialogEditar(item)" aria-label="Editar"></button>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                        (click)="confirmarExclusao(item)" aria-label="Excluir"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
              [header]="editandoId() ? 'Editar ' + config.titulo : 'Novo ' + config.titulo"
              [modal]="true" [draggable]="false" [style]="{width:'420px'}">
      <form [formGroup]="form" class="dialog-form" (ngSubmit)="salvar()">
        @for (campo of config.campos; track campo.name) {
          <div class="p-field">
            <label [for]="campo.name">{{ campo.label }} @if (campo.required) { * }</label>
            @switch (campo.type ?? 'text') {
              @case ('number') {
                <p-inputNumber [inputId]="campo.name" [formControlName]="campo.name" [useGrouping]="false" [style]="{width:'100%'}"></p-inputNumber>
              }
              @case ('checkbox') {
                <p-checkbox [inputId]="campo.name" [formControlName]="campo.name" [binary]="true"></p-checkbox>
              }
              @default {
                <input [id]="campo.name" pInputText [formControlName]="campo.name" />
              }
            }
            @if (form.get(campo.name)?.invalid && form.get(campo.name)?.touched && campo.required) {
              <small class="p-error">{{ campo.label }} é obrigatório.</small>
            }
          </div>
        }
      </form>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="dialogVisible.set(false)"></button>
        <button pButton type="button" label="Salvar" [loading]="salvando()" (click)="salvar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .crud-aux { display: grid; gap: 1rem; }
    .crud-aux-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 0.5rem 0; }
    .crud-aux-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .toolbar-right { display: flex; align-items: center; gap: 0.75rem; }
    .skeleton-list { display: grid; gap: 0.4rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: var(--chb-text-muted, #6c757d); gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; opacity: 0.4; }
    .empty-state p { margin: 0; font-weight: 600; }
    .dialog-form { display: grid; gap: 1rem; padding: 0.25rem 0; }
    .p-field { display: grid; gap: 0.35rem; }
    .p-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
  `]
})
export class CrudAuxiliarComponent implements OnInit, OnDestroy {
  @Input({ required: true }) config!: CrudAuxiliarConfig;

  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  readonly itens = signal<Record<string, unknown>[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly searchQuery = signal('');
  searchInput = '';

  readonly filtrados = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.itens();
    return this.itens().filter((item) =>
      this.config.colunas.some((col) => String(item[col.field] ?? '').toLowerCase().includes(q))
    );
  });

  form = this.fb.group({});

  ngOnInit(): void {
    const controls: Record<string, unknown[]> = {};
    for (const campo of this.config.campos) {
      controls[campo.name] = [campo.type === 'checkbox' ? false : '', campo.required ? [Validators.required] : []];
    }
    this.form = this.fb.group(controls);
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => this.searchQuery.set(query));
    this.carregar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onSearch(query: string): void { this.search$.next(query); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<Record<string, unknown>[]>(this.config.endpoint).pipe(
      catchError(() => of(this.config.demoData ?? [])),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((list) => this.itens.set(list));
  }

  abrirDialogNovo(): void {
    this.editandoId.set(null);
    this.form.reset();
    for (const campo of this.config.campos) {
      if (campo.type === 'checkbox') this.form.get(campo.name)?.setValue(false);
    }
    this.dialogVisible.set(true);
  }

  abrirDialogEditar(item: Record<string, unknown>): void {
    this.editandoId.set(String(item['id'] ?? ''));
    this.form.patchValue(item as Record<string, unknown>);
    this.dialogVisible.set(true);
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.salvando.set(true);
    const id = this.editandoId();
    const payload = this.form.value;
    const req = id
      ? this.http.put<Record<string, unknown>>(`${this.config.endpoint}/${id}`, payload)
      : this.http.post<Record<string, unknown>>(this.config.endpoint, payload);
    req.pipe(
      catchError(() => of({ ...payload, id: id ?? String(Date.now()) } as Record<string, unknown>)),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((item) => {
      if (id) {
        this.itens.update((list) => list.map((x) => x['id'] === id ? { ...x, ...item } : x));
      } else {
        this.itens.update((list) => [...list, item]);
      }
      this.dialogVisible.set(false);
      this.msg.add({ severity: 'success', summary: 'Salvo!', life: 2500 });
    });
  }

  confirmarExclusao(item: Record<string, unknown>): void {
    const id = String(item['id'] ?? '');
    if (!id) return;
    this.confirmationService.confirm({
      message: 'Deseja excluir este registro auxiliar?',
      header: 'Confirmar exclusao',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.excluir(id)
    });
  }

  private excluir(id: string): void {
    this.salvando.set(true);
    this.http.delete<void>(`${this.config.endpoint}/${id}`).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.itens.update((list) => list.filter((item) => String(item['id'] ?? '') !== id));
      this.msg.add({ severity: 'success', summary: 'Excluido!', life: 2500 });
    });
  }
}
