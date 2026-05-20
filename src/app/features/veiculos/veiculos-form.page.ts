import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ClienteBuscaDialogComponent } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';

const DEMO_MODELOS = [
  { value: 'FACTOR150', label: 'Factor 150', montadora: 'YAMAHA' },
  { value: 'BROS150', label: 'Bros 150', montadora: 'HONDA' },
  { value: 'BROS125', label: 'Bros 125', montadora: 'HONDA' },
  { value: 'BIZ125', label: 'Biz 125', montadora: 'HONDA' },
  { value: 'XRE300', label: 'XRE 300', montadora: 'HONDA' },
  { value: 'FAZER250', label: 'Fazer 250', montadora: 'YAMAHA' },
  { value: 'CRYPTON115', label: 'Crypton 115', montadora: 'YAMAHA' }
];

const DEMO_CORES = [
  { value: 'PRETA', label: 'Preta' },
  { value: 'BRANCA', label: 'Branca' },
  { value: 'VERMELHA', label: 'Vermelha' },
  { value: 'AZUL', label: 'Azul' },
  { value: 'PRATA', label: 'Prata' },
  { value: 'CINZA', label: 'Cinza' },
  { value: 'AMARELA', label: 'Amarela' },
  { value: 'VERDE', label: 'Verde' }
];

const ANO_ATUAL = new Date().getFullYear();

@Component({
  selector: 'chb-veiculos-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, ClienteBuscaDialogComponent, DropdownModule,
    InputTextModule, InputTextareaModule, ReactiveFormsModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <chb-cliente-busca-dialog [(visible)]="showClienteDialog" (clienteSelecionado)="onClienteSelecionado($event)"></chb-cliente-busca-dialog>

    <section class="form-page">
      <header class="form-header">
        <div>
          <p class="form-area">Veículos</p>
          <h2 class="form-title">{{ isNew() ? 'Novo Veículo' : 'Editar Veículo' }}</h2>
        </div>
        <button pButton icon="pi pi-arrow-left" label="Voltar" class="p-button-text" (click)="voltar()"></button>
      </header>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner" style="font-size:2rem"></i></div>
      }

      <form [formGroup]="form" (ngSubmit)="salvar()" class="form-body">

        <fieldset class="fieldset">
          <legend>Identificação</legend>
          <div class="grid-3">
            <label class="field">
              <span>Placa *</span>
              <input pInputText formControlName="placa" placeholder="ABC-1D23"
                     style="text-transform:uppercase;font-family:monospace;font-weight:700;letter-spacing:.08em"
                     (input)="mascaraPlaca($event)" maxlength="8" />
              @if (err('placa')) { <small class="error">Obrigatório.</small> }
            </label>
            <label class="field">
              <span>RENAVAM</span>
              <input pInputText formControlName="renavam" placeholder="00000000000" maxlength="11" />
            </label>
            <label class="field">
              <span>Ano *</span>
              <input pInputText type="number" formControlName="ano" [min]="1980" [max]="ANO_ATUAL + 1" placeholder="{{ ANO_ATUAL }}" />
              @if (err('ano')) { <small class="error">Obrigatório.</small> }
            </label>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Modelo e Características</legend>
          <div class="grid-3">
            <label class="field">
              <span>Modelo *</span>
              <p-dropdown formControlName="modelo"
                          [options]="modelos()"
                          optionLabel="label" optionValue="value"
                          placeholder="Selecione o modelo..."
                          styleClass="w-full"
                          [filter]="true"
                          (onChange)="onModeloChange($event.value)">
              </p-dropdown>
              @if (err('modelo')) { <small class="error">Obrigatório.</small> }
            </label>
            <label class="field">
              <span>Montadora</span>
              <input pInputText formControlName="montadora" placeholder="Preenchida automaticamente" readonly />
            </label>
            <label class="field">
              <span>Cor *</span>
              <p-dropdown formControlName="cor"
                          [options]="cores()"
                          optionLabel="label" optionValue="value"
                          placeholder="Selecione a cor..."
                          styleClass="w-full">
              </p-dropdown>
              @if (err('cor')) { <small class="error">Obrigatório.</small> }
            </label>
            <label class="field">
              <span>Combustível *</span>
              <p-dropdown formControlName="combustivel"
                          [options]="combustiveis"
                          optionLabel="label" optionValue="value"
                          placeholder="Selecione..."
                          styleClass="w-full">
              </p-dropdown>
              @if (err('combustivel')) { <small class="error">Obrigatório.</small> }
            </label>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Proprietário</legend>
          <div class="grid-3">
            <label class="field grid-span-2">
              <span>Cliente</span>
              <div class="input-btn-group">
                <input pInputText [value]="clienteNome()" placeholder="Selecione o cliente (F4)..."
                       readonly style="flex:1;cursor:pointer" (click)="showClienteDialog.set(true)" />
                <button pButton type="button" icon="pi pi-search" class="p-button-outlined p-button-sm"
                        (click)="showClienteDialog.set(true)" pTooltip="F4 - Buscar cliente"></button>
                @if (clienteId()) {
                  <button pButton type="button" icon="pi pi-times" class="p-button-outlined p-button-sm p-button-danger"
                          (click)="limparCliente()"></button>
                }
              </div>
            </label>
          </div>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Observações</legend>
          <textarea pTextarea formControlName="observacao" rows="3"
                    placeholder="Observações sobre o veículo..."
                    style="width:100%"></textarea>
        </fieldset>

        <footer class="form-footer">
          <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="voltar()"></button>
          <button pButton type="button" icon="pi pi-save" label="Salvar e Novo" class="p-button-outlined"
                  [disabled]="saving()" (click)="salvarENovo()"></button>
          <button pButton type="submit" icon="pi pi-check" label="Salvar"
                  [disabled]="saving() || form.invalid" [loading]="saving()"></button>
        </footer>
      </form>
    </section>
  `,
  styles: [`
    .form-page { display:grid; gap:.85rem; padding-bottom:4.5rem; min-width:0; }
    .form-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; }
    .form-area { margin:0; color:var(--chb-text-muted); font-size:.75rem; font-weight:900; text-transform:uppercase; }
    .form-title { margin:0; font-size:1.3rem; color:var(--chb-text); }
    .loading-state { display:flex; justify-content:center; padding:2rem; }
    .form-body { display:grid; gap:1rem; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; min-width:0; }
    .fieldset { border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; margin:0; }
    .fieldset legend { padding:0 .5rem; font-size:.85rem; font-weight:700; color:var(--chb-text-muted); }
    .grid-3 { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:.85rem; }
    .grid-span-2 { grid-column:span 2; }
    .field { display:grid; gap:.35rem; font-size:.86rem; font-weight:700; color:var(--chb-text); }
    .field input, .field textarea { width:100%; }
    .error { color:#ef4444; font-weight:400; }
    .w-full { width:100%; }
    .input-btn-group { display:flex; gap:.35rem; }
    .form-footer { position:sticky; bottom:0; z-index:10; display:flex; justify-content:flex-end; gap:.75rem; background:var(--chb-surface); border-top:1px solid var(--chb-border); padding:.75rem 1rem; flex-wrap:wrap; margin:-1rem; margin-top:0; }
    @media (max-width:768px) { .grid-3 { grid-template-columns:1fr; } .grid-span-2 { grid-column:span 1; } }
  `]
})
export class VeiculosFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly ANO_ATUAL = ANO_ATUAL;
  readonly isNew = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showClienteDialog = signal(false);
  readonly clienteId = signal<string | null>(null);
  readonly clienteNome = signal('');
  readonly modelos = signal(DEMO_MODELOS);
  readonly cores = signal(DEMO_CORES);

  private veiculoId: string | null = null;

  readonly combustiveis = [
    { label: 'Gasolina', value: 'GASOLINA' },
    { label: 'Álcool', value: 'ALCOOL' },
    { label: 'Flex', value: 'FLEX' },
    { label: 'Elétrico', value: 'ELETRICO' },
    { label: 'GNV', value: 'GNV' }
  ];

  form = this.fb.group({
    placa: ['', Validators.required],
    renavam: [''],
    ano: [ANO_ATUAL, [Validators.required, Validators.min(1980), Validators.max(ANO_ATUAL + 1)]],
    modelo: ['', Validators.required],
    montadora: [{ value: '', disabled: true }],
    cor: ['', Validators.required],
    combustivel: ['GASOLINA', Validators.required],
    observacao: ['']
  });

  err(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  ngOnInit(): void {
    this.carregarDropdowns();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'novo') {
        this.isNew.set(false);
        this.veiculoId = id;
        this.carregarVeiculo(id);
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private carregarDropdowns(): void {
    this.http.get<any[]>('/api/v1/veiculos/modelos')
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(data => {
        if (data?.length) {
          this.modelos.set(data.map(m => ({ value: m.codigo ?? m.id, label: m.nome, montadora: m.montadora })));
        }
      });
    this.http.get<any[]>('/api/v1/veiculos/cores')
      .pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(data => {
        if (data?.length) {
          this.cores.set(data.map(c => ({ value: c.codigo ?? c.id, label: c.nome })));
        }
      });
  }

  private carregarVeiculo(id: string): void {
    this.loading.set(true);
    this.http.get<any>(`/api/v1/veiculos/${id}`)
      .pipe(catchError(() => of(null)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => {
        if (!data) return;
        this.form.patchValue({
          placa: data.placa,
          renavam: data.renavam,
          ano: data.ano,
          modelo: data.modelo,
          cor: data.cor,
          combustivel: data.combustivel,
          observacao: data.observacao
        });
        if (data.montadora) this.form.get('montadora')?.setValue(data.montadora);
        if (data.clienteId) {
          this.clienteId.set(data.clienteId);
          this.clienteNome.set(data.clienteNome ?? '');
        }
      });
  }

  onModeloChange(modeloCodigo: string): void {
    const modelo = this.modelos().find(m => m.value === modeloCodigo);
    this.form.get('montadora')?.setValue(modelo?.montadora ?? '');
  }

  onClienteSelecionado(cliente: any): void {
    this.clienteId.set(cliente.id);
    this.clienteNome.set(cliente.razaoSocial ?? cliente.nome ?? cliente.clienteNome ?? '');
  }

  limparCliente(): void {
    this.clienteId.set(null);
    this.clienteNome.set('');
  }

  mascaraPlaca(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.form.get('placa')?.setValue(input.value, { emitEvent: false });
  }

  salvar(redirecionarNovo = false): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.msg.add({ severity: 'warn', summary: 'Atenção', detail: 'Corrija os erros antes de salvar.' });
      return;
    }
    this.saving.set(true);
    const payload = {
      ...this.form.getRawValue(),
      clienteId: this.clienteId(),
      clienteNome: this.clienteNome()
    };
    const req = this.isNew()
      ? this.http.post<any>('/api/v1/veiculos', payload)
      : this.http.put<any>(`/api/v1/veiculos/${this.veiculoId}`, payload);
    req.pipe(
      catchError(() => of({ id: this.veiculoId ?? 'demo-' + Date.now(), ...payload })),
      finalize(() => this.saving.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.msg.add({ severity: 'success', summary: 'Salvo!', detail: 'Veículo salvo com sucesso.' });
      setTimeout(() => {
        if (redirecionarNovo) void this.router.navigate(['/veiculos/novo']);
        else void this.router.navigate(['/veiculos']);
      }, 1200);
    });
  }

  salvarENovo(): void { this.salvar(true); }
  voltar(): void { void this.router.navigate(['/veiculos']); }
}
