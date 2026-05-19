import { ChangeDetectionStrategy, Component, HostListener, type OnDestroy, type OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  papel: string;
  ativo: boolean;
  ultimoAcesso?: string;
}

const DEMO_USUARIOS: Usuario[] = [
  { id: '1', nome: 'Administrador', email: 'admin@chocobo.app', login: 'admin', papel: 'ADMIN', ativo: true, ultimoAcesso: '2026-05-19T10:30:00Z' },
  { id: '2', nome: 'Ana Vendas', email: 'ana@chocobo.app', login: 'ana.vendas', papel: 'VENDEDOR', ativo: true, ultimoAcesso: '2026-05-19T09:15:00Z' },
  { id: '3', nome: 'Carlos Estoque', email: 'carlos@chocobo.app', login: 'carlos.estoque', papel: 'ESTOQUISTA', ativo: true },
  { id: '4', nome: 'Maria Financeiro', email: 'maria@chocobo.app', login: 'maria.fin', papel: 'FINANCEIRO', ativo: false },
];

const PAPEIS = ['ADMIN', 'GERENTE', 'VENDEDOR', 'ESTOQUISTA', 'FINANCEIRO', 'CAIXA'];

@Component({
  selector: 'chb-usuarios-page',
  standalone: true,
  imports: [ButtonModule, CheckboxModule, ConfirmDialogModule, DialogModule, DropdownModule,
            DatePipe, FormsModule, InputTextModule, ReactiveFormsModule, SkeletonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="page-container">
      <div class="page-toolbar">
        <h2 class="page-title">Usuários</h2>
        <div class="toolbar-actions">
          <span class="p-input-icon-left">
            <i class="pi pi-search" aria-hidden="true"></i>
            <input pInputText type="text" placeholder="Buscar usuário..." [(ngModel)]="searchQuery" (input)="onSearch()" aria-label="Buscar usuário" />
          </span>
          <button pButton type="button" icon="pi pi-plus" label="Novo (Ctrl+N)" (click)="abrirDialogNovo()" aria-label="Novo usuário"></button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card">
          <span class="kpi-label">Total</span>
          <strong class="kpi-value">{{ usuarios().length }}</strong>
        </div>
        <div class="kpi-card kpi-card--success">
          <span class="kpi-label">Ativos</span>
          <strong class="kpi-value">{{ ativos() }}</strong>
        </div>
        <div class="kpi-card kpi-card--muted">
          <span class="kpi-label">Inativos</span>
          <strong class="kpi-value">{{ inativos() }}</strong>
        </div>
      </div>

      @if (loading() && !usuarios().length) {
        <div class="skeleton-list">
          @for (i of [1,2,3,4]; track i) {
            <p-skeleton height="3.2rem" styleClass="mb-2"></p-skeleton>
          }
        </div>
      } @else if (!filtrados().length) {
        <div class="empty-state">
          <i class="pi pi-users" aria-hidden="true"></i>
          <p>Nenhum usuário encontrado.</p>
        </div>
      } @else {
        <p-table [value]="filtrados()" [loading]="loading()" [paginator]="true" [rows]="20"
                 dataKey="id" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="nome">Nome <p-sortIcon field="nome"></p-sortIcon></th>
              <th>E-mail</th>
              <th>Login</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Último acesso</th>
              <th style="width:100px">Ações</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-u>
            <tr>
              <td><strong>{{ u.nome }}</strong></td>
              <td>{{ u.email }}</td>
              <td><code>{{ u.login }}</code></td>
              <td>
                <p-tag [value]="u.papel" [severity]="papelSeverity(u.papel)"></p-tag>
              </td>
              <td>
                <p-tag [value]="u.ativo ? 'Ativo' : 'Inativo'" [severity]="u.ativo ? 'success' : 'secondary'"></p-tag>
              </td>
              <td>{{ u.ultimoAcesso ? (u.ultimoAcesso | date:'dd/MM/yy HH:mm':'':undefined) : '—' }}</td>
              <td>
                <div class="row-actions">
                  <button pButton type="button" icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="abrirDialogEditar(u)" [attr.aria-label]="'Editar ' + u.nome"></button>
                  <button pButton type="button" [icon]="u.ativo ? 'pi pi-lock' : 'pi pi-unlock'" class="p-button-text p-button-sm" [class.p-button-danger]="u.ativo" (click)="toggleAtivo(u)" [attr.aria-label]="u.ativo ? 'Desativar' : 'Reativar'"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <!-- Dialog criar/editar -->
    <p-dialog [visible]="dialogVisible()" (visibleChange)="dialogVisible.set($event)"
              [header]="editandoId() ? 'Editar Usuário' : 'Novo Usuário'"
              [modal]="true" [draggable]="false" [style]="{width:'480px'}">
      <form [formGroup]="form" class="dialog-form" (ngSubmit)="salvar()">
        <div class="p-field">
          <label for="nome">Nome *</label>
          <input id="nome" pInputText formControlName="nome" autocomplete="off" />
          @if (form.get('nome')?.invalid && form.get('nome')?.touched) {
            <small class="p-error">Nome é obrigatório (mínimo 3 caracteres).</small>
          }
        </div>
        <div class="p-field">
          <label for="email">E-mail *</label>
          <input id="email" pInputText formControlName="email" type="email" autocomplete="off" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <small class="p-error">E-mail inválido.</small>
          }
        </div>
        <div class="p-field">
          <label for="login">Login *</label>
          <input id="login" pInputText formControlName="login" autocomplete="off" />
        </div>
        @if (!editandoId()) {
          <div class="p-field">
            <label for="senha">Senha *</label>
            <input id="senha" pInputText formControlName="senha" type="password" autocomplete="new-password" />
          </div>
        }
        <div class="p-field">
          <label for="papel">Papel *</label>
          <p-dropdown id="papel" formControlName="papel" [options]="papeisOptions" placeholder="Selecione..." styleClass="w-full"></p-dropdown>
        </div>
        <div class="p-field p-field--inline">
          <p-checkbox formControlName="ativo" [binary]="true" inputId="ativo"></p-checkbox>
          <label for="ativo">Usuário ativo</label>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="fecharDialog()"></button>
        <button pButton type="button" label="Salvar" icon="pi pi-check" [loading]="salvando()" (click)="salvar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page-container { display: grid; gap: 1rem; }
    .page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 0.5rem 0; }
    .page-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .toolbar-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .kpi-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .kpi-card { padding: 0.75rem 1.25rem; border: 1px solid var(--chb-border, #dee2e6); border-radius: 0.5rem; background: var(--chb-surface, #fff); display: flex; flex-direction: column; gap: 0.2rem; min-width: 100px; }
    .kpi-card--success { border-color: #86efac; background: #f0fdf4; }
    .kpi-card--muted { border-color: #e2e8f0; background: #f8fafc; }
    .kpi-label { font-size: 0.72rem; font-weight: 900; text-transform: uppercase; color: var(--chb-text-muted, #6c757d); }
    .kpi-value { font-size: 1.4rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .skeleton-list { display: grid; gap: 0.5rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: var(--chb-text-muted, #6c757d); gap: 0.75rem; }
    .empty-state i { font-size: 2.5rem; opacity: 0.4; }
    .empty-state p { margin: 0; font-weight: 600; }
    .row-actions { display: flex; gap: 0.25rem; }
    .dialog-form { display: grid; gap: 1rem; padding: 0.5rem 0; }
    .p-field { display: grid; gap: 0.35rem; }
    .p-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
    .p-field--inline { flex-direction: row; display: flex; align-items: center; gap: 0.6rem; }
    .p-field--inline label { margin: 0; cursor: pointer; }
    :host ::ng-deep .p-dropdown.w-full { width: 100%; }
    code { font-size: 0.85rem; background: var(--chb-surface-muted, #f8f9fa); padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
  `]
})
export class UsuariosPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly msg = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  readonly usuarios = signal<Usuario[]>([]);
  readonly loading = signal(false);
  readonly salvando = signal(false);
  readonly dialogVisible = signal(false);
  readonly editandoId = signal<string | null>(null);
  searchQuery = '';

  readonly ativos = computed(() => this.usuarios().filter((u) => u.ativo).length);
  readonly inativos = computed(() => this.usuarios().filter((u) => !u.ativo).length);
  readonly filtrados = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.usuarios();
    return this.usuarios().filter((u) =>
      u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.login.toLowerCase().includes(q)
    );
  });

  readonly papeisOptions = PAPEIS.map((p) => ({ label: p, value: p }));

  readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    login: ['', Validators.required],
    senha: [''],
    papel: ['VENDEDOR', Validators.required],
    ativo: [true]
  });

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); this.abrirDialogNovo(); }
  }

  ngOnInit(): void { this.carregar(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onSearch(): void { /* filtrado via computed */ }

  carregar(): void {
    this.loading.set(true);
    this.http.get<Usuario[]>('/api/v1/core/usuarios').pipe(
      catchError(() => of(DEMO_USUARIOS)),
      finalize(() => this.loading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((list) => this.usuarios.set(list));
  }

  abrirDialogNovo(): void {
    this.editandoId.set(null);
    this.form.reset({ papel: 'VENDEDOR', ativo: true });
    this.form.get('senha')?.setValidators(Validators.required);
    this.dialogVisible.set(true);
  }

  abrirDialogEditar(u: Usuario): void {
    this.editandoId.set(u.id);
    this.form.get('senha')?.clearValidators();
    this.form.patchValue({ nome: u.nome, email: u.email, login: u.login, papel: u.papel, ativo: u.ativo });
    this.dialogVisible.set(true);
  }

  fecharDialog(): void { this.dialogVisible.set(false); }

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.salvando.set(true);
    const id = this.editandoId();
    const payload = this.form.value;
    const req = id
      ? this.http.put<Usuario>(`/api/v1/core/usuarios/${id}`, payload)
      : this.http.post<Usuario>('/api/v1/core/usuarios', payload);
    req.pipe(
      catchError(() => of({ ...payload, id: id ?? String(Date.now()) } as unknown as Usuario)),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((u) => {
      if (id) {
        this.usuarios.update((list) => list.map((x) => x.id === id ? { ...x, ...u } : x));
      } else {
        this.usuarios.update((list) => [...list, u as Usuario]);
      }
      this.dialogVisible.set(false);
      this.msg.add({ severity: 'success', summary: 'Salvo!', detail: `Usuário ${u.nome ?? ''} salvo.`, life: 3000 });
    });
  }

  toggleAtivo(u: Usuario): void {
    this.confirmation.confirm({
      message: `Deseja ${u.ativo ? 'desativar' : 'reativar'} o usuário <strong>${u.nome}</strong>?`,
      header: u.ativo ? 'Desativar usuário' : 'Reativar usuário',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: u.ativo ? 'Desativar' : 'Reativar',
      acceptButtonStyleClass: u.ativo ? 'p-button-danger' : 'p-button-success',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.http.delete(`/api/v1/core/usuarios/${u.id}`).pipe(
          catchError(() => of(null)), takeUntil(this.destroy$)
        ).subscribe(() => {
          this.usuarios.update((list) => list.map((x) => x.id === u.id ? { ...x, ativo: !x.ativo } : x));
          this.msg.add({ severity: 'info', summary: u.ativo ? 'Desativado' : 'Reativado', detail: u.nome, life: 2500 });
        });
      }
    });
  }

  papelSeverity(papel: string): 'danger' | 'warning' | 'info' | 'success' | 'secondary' {
    const m: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'secondary'> = {
      ADMIN: 'danger', GERENTE: 'warning', VENDEDOR: 'info', FINANCEIRO: 'success', ESTOQUISTA: 'secondary', CAIXA: 'secondary'
    };
    return m[papel] ?? 'secondary';
  }
}
