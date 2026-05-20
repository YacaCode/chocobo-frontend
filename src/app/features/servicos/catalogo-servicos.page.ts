import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  type OnDestroy,
  type OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';

const DEMO_CATALOGO = [
  { id: 'sv-001', codigo: 'SV001', nome: 'Troca de Óleo', preco: 45.00, tempoPrevisto: 0.5, comissaoMecanico: 10, comissaoConsultor: 5, ativo: true },
  { id: 'sv-002', codigo: 'SV002', nome: 'Revisão 6.000 km', preco: 180.00, tempoPrevisto: 2.0, comissaoMecanico: 15, comissaoConsultor: 5, ativo: true },
  { id: 'sv-003', codigo: 'SV003', nome: 'Revisão 12.000 km', preco: 320.00, tempoPrevisto: 3.0, comissaoMecanico: 15, comissaoConsultor: 5, ativo: true },
  { id: 'sv-004', codigo: 'SV004', nome: 'Troca de Pneu Dianteiro', preco: 60.00, tempoPrevisto: 0.5, comissaoMecanico: 10, comissaoConsultor: 3, ativo: true },
  { id: 'sv-005', codigo: 'SV005', nome: 'Troca de Pneu Traseiro', preco: 70.00, tempoPrevisto: 1.0, comissaoMecanico: 10, comissaoConsultor: 3, ativo: true },
  { id: 'sv-006', codigo: 'SV006', nome: 'Regulagem de Válvulas', preco: 120.00, tempoPrevisto: 1.5, comissaoMecanico: 12, comissaoConsultor: 5, ativo: true },
  { id: 'sv-007', codigo: 'SV007', nome: 'Limpeza de Carburador', preco: 90.00, tempoPrevisto: 1.0, comissaoMecanico: 12, comissaoConsultor: 5, ativo: false }
];

@Component({
  selector: 'chb-catalogo-servicos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CheckboxModule, CurrencyPipe, DialogModule, FormsModule, InputNumberModule,
    InputTextModule, ReactiveFormsModule, SkeletonModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Dialog criar/editar -->
    <p-dialog [visible]="showDialog()" (visibleChange)="showDialog.set($event)"
              [header]="editandoId() ? 'Editar Serviço' : 'Novo Serviço'"
              [modal]="true" [style]="{width:'520px'}" [closable]="true">
      <form [formGroup]="form" (ngSubmit)="salvarServico()" class="dialog-form">
        <div class="dialog-grid">
          <label class="field">
            <span>Código *</span>
            <input pInputText formControlName="codigo" placeholder="SV001" />
            @if (err('codigo')) { <small class="error">Obrigatório.</small> }
          </label>
          <label class="field grid-span-2">
            <span>Nome do Serviço *</span>
            <input pInputText formControlName="nome" placeholder="Ex: Troca de Óleo" />
            @if (err('nome')) { <small class="error">Obrigatório.</small> }
          </label>
          <label class="field">
            <span>Preço (R$) *</span>
            <p-inputNumber formControlName="preco" mode="currency" currency="BRL" locale="pt-BR"
                           [minFractionDigits]="2" styleClass="w-full"></p-inputNumber>
            @if (err('preco')) { <small class="error">Obrigatório.</small> }
          </label>
          <label class="field">
            <span>Tempo Previsto (h)</span>
            <p-inputNumber formControlName="tempoPrevisto" [minFractionDigits]="1" [maxFractionDigits]="1"
                           [min]="0" [max]="24" styleClass="w-full" placeholder="1.5"></p-inputNumber>
          </label>
          <label class="field">
            <span>Comissão Mecânico %</span>
            <p-inputNumber formControlName="comissaoMecanico" [min]="0" [max]="100"
                           suffix="%" styleClass="w-full"></p-inputNumber>
          </label>
          <label class="field">
            <span>Comissão Consultor %</span>
            <p-inputNumber formControlName="comissaoConsultor" [min]="0" [max]="100"
                           suffix="%" styleClass="w-full"></p-inputNumber>
          </label>
          <div class="field" style="padding-top:.5rem">
            <label class="checkbox-label">
              <p-checkbox formControlName="ativo" [binary]="true" inputId="ativo-sv"></p-checkbox>
              <label for="ativo-sv">Serviço ativo</label>
            </label>
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <button pButton type="button" icon="pi pi-times" label="Cancelar"
                class="p-button-text" (click)="fecharDialog()"></button>
        <button pButton type="button" icon="pi pi-check" label="Salvar"
                [loading]="saving()" (click)="salvarServico()"></button>
      </ng-template>
    </p-dialog>

    <div class="page-toolbar">
      <h2 class="page-title">Catálogo de Serviços</h2>
      <div class="toolbar-actions">
        <input pInputText placeholder="Buscar por código ou nome..."
               [ngModel]="busca()"
               (input)="onBuscaInput($any($event.target).value)" />
        <button pButton icon="pi pi-plus" label="Novo Serviço"
                class="p-button-success" (click)="novoServico()" pTooltip="Ctrl+N"></button>
        <button pButton icon="pi pi-refresh" (click)="carregar()" class="p-button-outlined"></button>
      </div>
    </div>

    @if (loading() && !lista().length) {
      @for (i of [1,2,3,4]; track i) {
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
      }
    } @else {
      <p-table [value]="filtrados()" [paginator]="true" [rows]="20"
               [rowsPerPageOptions]="[10,20,50]" dataKey="id" [rowHover]="true">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="codigo">Código <p-sortIcon field="codigo"></p-sortIcon></th>
            <th pSortableColumn="nome">Nome <p-sortIcon field="nome"></p-sortIcon></th>
            <th pSortableColumn="preco" style="text-align:right">Preço <p-sortIcon field="preco"></p-sortIcon></th>
            <th>Tempo (h)</th>
            <th>Comissão Mec.</th>
            <th>Comissão Cons.</th>
            <th>Situação</th>
            <th style="width:100px">Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-sv>
          <tr>
            <td style="font-family:monospace;font-weight:700">{{ sv.codigo }}</td>
            <td style="font-weight:600">{{ sv.nome }}</td>
            <td style="text-align:right">{{ sv.preco | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
            <td>{{ sv.tempoPrevisto }}h</td>
            <td>{{ sv.comissaoMecanico }}%</td>
            <td>{{ sv.comissaoConsultor }}%</td>
            <td>
              <p-tag [value]="sv.ativo ? 'Ativo' : 'Inativo'"
                     [severity]="sv.ativo ? 'success' : 'secondary'"></p-tag>
            </td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                      (click)="editarServico(sv)" pTooltip="Editar"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger"
                      (click)="deletarServico(sv)" pTooltip="Excluir"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" style="text-align:center;padding:2rem">
              <i class="pi pi-wrench" style="font-size:2rem;color:var(--chb-text-muted)"></i>
              <p style="color:var(--chb-text-muted);margin-top:.5rem">Nenhum serviço encontrado.</p>
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
    .dialog-form { padding:.5rem 0; }
    .dialog-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.85rem; }
    .grid-span-2 { grid-column:span 2; }
    .field { display:grid; gap:.35rem; font-size:.86rem; font-weight:700; color:var(--chb-text); }
    .field input { width:100%; }
    .error { color:#ef4444; font-weight:400; }
    .w-full { width:100%; }
    .checkbox-label { display:flex; align-items:center; gap:.75rem; cursor:pointer; font-weight:600; }
    @media (max-width:600px) { .dialog-grid { grid-template-columns:1fr; } .grid-span-2 { grid-column:span 1; } }
  `]
})
export class CatalogoServicosPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly buscaSubject = new Subject<string>();

  readonly lista = signal<any[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly busca = signal('');
  readonly showDialog = signal(false);
  readonly editandoId = signal<string | null>(null);

  readonly filtrados = computed(() => {
    const b = this.busca().toLowerCase();
    return this.lista().filter(sv =>
      !b || sv.codigo?.toLowerCase().includes(b) || sv.nome?.toLowerCase().includes(b)
    );
  });

  form = this.fb.group({
    codigo: ['', Validators.required],
    nome: ['', Validators.required],
    preco: [0, [Validators.required, Validators.min(0)]],
    tempoPrevisto: [1.0],
    comissaoMecanico: [0],
    comissaoConsultor: [0],
    ativo: [true]
  });

  err(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  ngOnInit(): void {
    this.buscaSubject.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(v => this.busca.set(v));
    this.carregar();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(e: KeyboardEvent): void { if (!this.showDialog()) { e.preventDefault(); this.novoServico(); } }

  onBuscaInput(value: string): void { this.buscaSubject.next(value); }

  carregar(): void {
    this.loading.set(true);
    this.http.get<any[]>('/api/v1/servicos/catalogo')
      .pipe(catchError(() => of(DEMO_CATALOGO)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => this.lista.set(data));
  }

  novoServico(): void {
    this.editandoId.set(null);
    this.form.reset({ preco: 0, tempoPrevisto: 1.0, comissaoMecanico: 0, comissaoConsultor: 0, ativo: true });
    this.showDialog.set(true);
  }

  editarServico(sv: any): void {
    this.editandoId.set(sv.id);
    this.form.patchValue(sv);
    this.showDialog.set(true);
  }

  fecharDialog(): void { this.showDialog.set(false); }

  salvarServico(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.value;
    const id = this.editandoId();
    const req = id
      ? this.http.put<any>(`/api/v1/servicos/catalogo/${id}`, payload)
      : this.http.post<any>('/api/v1/servicos/catalogo', payload);
    req.pipe(
      catchError(() => of({ id: id ?? 'demo-' + Date.now(), ...payload })),
      finalize(() => this.saving.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(saved => {
      if (id) {
        this.lista.update(list => list.map(sv => sv.id === id ? { ...sv, ...saved } : sv));
      } else {
        this.lista.update(list => [...list, saved]);
      }
      this.msg.add({ severity: 'success', summary: 'Salvo!', detail: 'Serviço salvo com sucesso.' });
      this.fecharDialog();
    });
  }

  deletarServico(sv: any): void {
    this.http.delete(`/api/v1/servicos/catalogo/${sv.id}`)
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(() => {
        this.lista.update(list => list.filter(s => s.id !== sv.id));
        this.msg.add({ severity: 'success', summary: 'Excluído', detail: `Serviço ${sv.nome} removido.` });
      });
  }
}
