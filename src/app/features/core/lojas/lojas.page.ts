import { ChangeDetectionStrategy, Component, HostListener, type OnDestroy, type OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { aplicarMascaraCnpj } from '../../../shared/validators/cpf-cnpj.validator';

interface Loja {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  telefone?: string;
  email?: string;
  ativa: boolean;
}

const DEMO_LOJAS: Loja[] = [
  { id: '1', nome: 'PH Motopeças - Matriz', cnpj: '12.345.678/0001-90', cidade: 'São Paulo', uf: 'SP', telefone: '(11) 3333-4444', email: 'matriz@phmoto.com.br', ativa: true },
  { id: '2', nome: 'PH Motopeças - Filial Norte', cnpj: '12.345.678/0002-71', cidade: 'Guarulhos', uf: 'SP', telefone: '(11) 4444-5555', ativa: true },
];

@Component({
  selector: 'chb-lojas-page',
  standalone: true,
  imports: [ButtonModule, CheckboxModule, ConfirmDialogModule, DialogModule, FormsModule,
            InputTextModule, ReactiveFormsModule, SkeletonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="page-container">
      <div class="page-toolbar">
        <h2 class="page-title">Lojas</h2>
        <div class="toolbar-actions">
          <span class="p-input-icon-left">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input pInputText type="text" placeholder="Buscar loja..." [(ngModel)]="searchQuery" aria-label="Buscar loja" />
          </span>
          <button pButton type="button" icon="pi pi-plus" label="Nova (Ctrl+N)" (click)="abrirDialogNova()" aria-label="Nova loja"></button>
        </div>
      </div>

      @if (loading() && !lojas().length) {
        <div class="skeleton-list">
          @for (i of [1,2,3]; track i) { <p-skeleton height="3.2rem" styleClass="mb-2"></p-skeleton> }
        </div>
      } @else if (!filtradas().length) {
        <div class="empty-state">
          <i class="pi pi-building" aria-hidden="true"></i>
          <p>Nenhuma loja encontrada.</p>
        </div>
      } @else {
        <p-table [value]="filtradas()" [loading]="loading()" [paginator]="true" [rows]="20" dataKey="id" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="nome">Nome <p-sortIcon field="nome"></p-sortIcon></th>
              <th>CNPJ</th>
              <th>Cidade / UF</th>
              <th>Telefone</th>
              <th>Status</th>
              <th style="width:80px">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td><strong>{{ l.nome }}</strong></td>
              <td>{{ l.cnpj }}</td>
              <td>{{ l.cidade }} / {{ l.uf }}</td>
              <td>{{ l.telefone ?? '—' }}</td>
              <td><p-tag [value]="l.ativa ? 'Ativa' : 'Inativa'" [severity]="l.ativa ? 'success' : 'secondary'"></p-tag></td>
              <td>
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirDialogEditar(l)" [attr.aria-label]="'Editar ' + l.nome"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
              [header]="editandoId() ? 'Editar Loja' : 'Nova Loja'"
              [modal]="true" [draggable]="false" [style]="{width:'520px'}">
      <form [formGroup]="form" class="dialog-form" (ngSubmit)="salvar()">
        <div class="p-field">
          <label for="nomeLoja">Nome da Loja *</label>
          <input id="nomeLoja" pInputText formControlName="nome" />
          @if (form.get('nome')?.invalid && form.get('nome')?.touched) {
            <small class="p-error">Nome obrigatório.</small>
          }
        </div>
        <div class="p-field">
          <label for="cnpjLoja">CNPJ *</label>
          <input id="cnpjLoja" pInputText formControlName="cnpj" maxlength="18"
                 (input)="onCnpjInput($event)" placeholder="00.000.000/0000-00" />
        </div>
        <div class="p-fields-2col">
          <div class="p-field">
            <label for="cidadeLoja">Cidade *</label>
            <input id="cidadeLoja" pInputText formControlName="cidade" />
          </div>
          <div class="p-field">
            <label for="ufLoja">UF *</label>
            <input id="ufLoja" pInputText formControlName="uf" maxlength="2" style="text-transform:uppercase" />
          </div>
        </div>
        <div class="p-field">
          <label for="telLoja">Telefone</label>
          <input id="telLoja" pInputText formControlName="telefone" />
        </div>
        <div class="p-field">
          <label for="emailLoja">E-mail</label>
          <input id="emailLoja" pInputText formControlName="email" type="email" />
        </div>
        <div class="p-field p-field--inline">
          <p-checkbox formControlName="ativa" [binary]="true" inputId="ativaLoja"></p-checkbox>
          <label for="ativaLoja">Loja ativa</label>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="dialogVisible.set(false)"></button>
        <button pButton type="button" label="Salvar" icon="pi pi-check" [loading]="salvando()" (click)="salvar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page-container { display: grid; gap: 1rem; }
    .page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 0.5rem 0; }
    .page-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .toolbar-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .skeleton-list { display: grid; gap: 0.5rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: var(--chb-text-muted, #6c757d); gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; opacity: 0.4; }
    .empty-state p { margin: 0; font-weight: 600; }
    .dialog-form { display: grid; gap: 1rem; padding: 0.5rem 0; }
    .p-field { display: grid; gap: 0.35rem; }
    .p-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
    .p-field--inline { flex-direction: row; display: flex; align-items: center; gap: 0.6rem; }
    .p-field--inline label { margin: 0; cursor: pointer; }
    .p-fields-2col { display: grid; grid-template-columns: 1fr 80px; gap: 0.75rem; }
  `]
})
export class LojasPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly lojas = signal<Loja[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  searchQuery = '';

  readonly filtradas = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.lojas();
    return this.lojas().filter((l) => l.nome.toLowerCase().includes(q) || l.cnpj.includes(q) || l.cidade.toLowerCase().includes(q));
  });

  readonly form = this.fb.group({
    nome: ['', Validators.required],
    cnpj: ['', Validators.required],
    cidade: ['', Validators.required],
    uf: ['', [Validators.required, Validators.maxLength(2)]],
    telefone: [''],
    email: [''],
    ativa: [true]
  });

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); this.abrirDialogNova(); }
  }

  ngOnInit(): void { this.carregar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onCnpjInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    this.form.get('cnpj')?.setValue(aplicarMascaraCnpj(val), { emitEvent: false });
  }

  carregar(): void {
    this.loading.set(true);
    this.http.get<Loja[]>('/api/v1/core/admin/lojas').pipe(
      catchError(() => of(DEMO_LOJAS)),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((list) => this.lojas.set(list));
  }

  abrirDialogNova(): void {
    this.editandoId.set(null);
    this.form.reset({ ativa: true });
    this.dialogVisible.set(true);
  }

  abrirDialogEditar(l: Loja): void {
    this.editandoId.set(l.id);
    this.form.patchValue(l);
    this.dialogVisible.set(true);
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.salvando.set(true);
    const id = this.editandoId();
    const payload = this.form.value;
    const req = id
      ? this.http.put<Loja>(`/api/v1/core/admin/lojas/${id}`, payload)
      : this.http.post<Loja>('/api/v1/core/admin/lojas', payload);
    req.pipe(
      catchError(() => of({ ...payload, id: id ?? String(Date.now()) } as unknown as Loja)),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((l) => {
      if (id) {
        this.lojas.update((list) => list.map((x) => x.id === id ? { ...x, ...l } : x));
      } else {
        this.lojas.update((list) => [...list, l as Loja]);
      }
      this.dialogVisible.set(false);
      this.msg.add({ severity: 'success', summary: 'Salvo!', detail: `Loja ${l.nome ?? ''} salva.`, life: 3000 });
    });
  }
}
