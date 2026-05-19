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
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { InputTextareaModule } from 'primeng/inputtextarea';

@Component({
  selector: 'chb-fornecedores-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CheckboxModule, DropdownModule, InputTextModule, InputTextareaModule,
    ReactiveFormsModule, TabViewModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <section class="form-page">
      <header class="form-header">
        <div>
          <p class="form-area">Cadastros</p>
          <h2 class="form-title">{{ isNew() ? 'Novo Fornecedor' : 'Editar Fornecedor' }}</h2>
        </div>
        <button pButton icon="pi pi-arrow-left" label="Voltar" class="p-button-text" (click)="voltar()"></button>
      </header>

      @if (loading()) {
        <div class="loading-state"><i class="pi pi-spin pi-spinner" style="font-size:2rem"></i></div>
      }

      <form [formGroup]="form" (ngSubmit)="salvar()" class="form-body">
        <p-tabView>

          <!-- Aba 1: Dados Principais -->
          <p-tabPanel header="Dados Principais">
            <div class="tab-content">
              <fieldset class="fieldset">
                <legend>Dados da Empresa</legend>
                <div class="grid-3">
                  <label class="field grid-span-2">
                    <span>Razão Social *</span>
                    <input pInputText formControlName="razaoSocial" placeholder="Razão Social do fornecedor" />
                    @if (err('razaoSocial')) { <small class="error">Obrigatório.</small> }
                  </label>
                  <label class="field">
                    <span>CNPJ *</span>
                    <input pInputText formControlName="cnpj" placeholder="00.000.000/0001-00"
                           (input)="mascaraCnpj($event)" maxlength="18" />
                    @if (err('cnpj')) { <small class="error">Obrigatório.</small> }
                  </label>
                  <label class="field">
                    <span>Inscrição Estadual</span>
                    <input pInputText formControlName="ie" placeholder="Inscrição Estadual" />
                  </label>
                  <label class="field">
                    <span>Inscrição Municipal</span>
                    <input pInputText formControlName="im" placeholder="Inscrição Municipal" />
                  </label>
                </div>
              </fieldset>

              <fieldset class="fieldset">
                <legend>Endereço</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>CEP</span>
                    <div class="input-btn-group">
                      <input pInputText formControlName="cep" placeholder="00000-000" maxlength="9"
                             (blur)="buscarCep()" (input)="mascaraCep($event)" style="flex:1" />
                      <button pButton type="button" icon="pi pi-search" class="p-button-outlined p-button-sm"
                              (click)="buscarCep()" [loading]="buscandoCep()"></button>
                    </div>
                  </label>
                  <label class="field grid-span-2">
                    <span>Logradouro</span>
                    <input pInputText formControlName="logradouro" placeholder="Rua, Avenida..." />
                  </label>
                  <label class="field">
                    <span>Número</span>
                    <input pInputText formControlName="numero" placeholder="123" />
                  </label>
                  <label class="field">
                    <span>Complemento</span>
                    <input pInputText formControlName="complemento" placeholder="Sala, Bloco..." />
                  </label>
                  <label class="field">
                    <span>Bairro</span>
                    <input pInputText formControlName="bairro" placeholder="Bairro" />
                  </label>
                  <label class="field">
                    <span>Cidade</span>
                    <input pInputText formControlName="cidade" placeholder="Cidade" />
                  </label>
                  <label class="field">
                    <span>UF</span>
                    <p-dropdown formControlName="uf" [options]="ufs" placeholder="UF" styleClass="w-full"></p-dropdown>
                  </label>
                </div>
              </fieldset>

              <fieldset class="fieldset">
                <legend>Contato</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Telefone</span>
                    <input pInputText formControlName="telefone" placeholder="(00) 3333-4444" />
                  </label>
                  <label class="field">
                    <span>Celular</span>
                    <input pInputText formControlName="celular" placeholder="(00) 99999-0000" />
                  </label>
                  <label class="field">
                    <span>E-mail</span>
                    <input pInputText formControlName="email" placeholder="contato@fornecedor.com" type="email" />
                  </label>
                  <label class="field">
                    <span>Site</span>
                    <input pInputText formControlName="site" placeholder="www.fornecedor.com" />
                  </label>
                </div>
              </fieldset>

              <fieldset class="fieldset">
                <legend>Financeiro</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Representante</span>
                    <input pInputText formControlName="representante" placeholder="Nome do representante" />
                  </label>
                  <label class="field">
                    <span>Condição de Pagamento</span>
                    <p-dropdown formControlName="condicaoPagamento" [options]="condicoesPagamento"
                                optionLabel="label" optionValue="value"
                                placeholder="Selecione..." styleClass="w-full">
                    </p-dropdown>
                  </label>
                  <label class="field">
                    <span>Limite de Crédito (R$)</span>
                    <input pInputText type="number" formControlName="limiteCredito" min="0" step="0.01" />
                  </label>
                </div>
                <div style="margin-top:.75rem">
                  <label class="checkbox-label">
                    <p-checkbox formControlName="ativo" [binary]="true" inputId="ativo-forn"></p-checkbox>
                    <label for="ativo-forn">Fornecedor ativo</label>
                  </label>
                </div>
              </fieldset>
            </div>
          </p-tabPanel>

          <!-- Aba 2: Dados Adicionais -->
          <p-tabPanel header="Dados Adicionais">
            <div class="tab-content">
              <fieldset class="fieldset">
                <legend>Dados Bancários</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Banco</span>
                    <input pInputText formControlName="banco" placeholder="Nome do banco" />
                  </label>
                  <label class="field">
                    <span>Agência</span>
                    <input pInputText formControlName="agencia" placeholder="0000" />
                  </label>
                  <label class="field">
                    <span>Conta</span>
                    <input pInputText formControlName="conta" placeholder="00000-0" />
                  </label>
                  <label class="field">
                    <span>Tipo de Conta</span>
                    <p-dropdown formControlName="tipoConta" [options]="tiposConta"
                                optionLabel="label" optionValue="value"
                                placeholder="Selecione..." styleClass="w-full">
                    </p-dropdown>
                  </label>
                  <label class="field">
                    <span>PIX</span>
                    <input pInputText formControlName="pix" placeholder="Chave PIX" />
                  </label>
                </div>
              </fieldset>
              <fieldset class="fieldset">
                <legend>Observações</legend>
                <textarea pTextarea formControlName="observacoes" rows="4"
                          placeholder="Observações gerais sobre o fornecedor..."
                          style="width:100%"></textarea>
              </fieldset>
            </div>
          </p-tabPanel>

        </p-tabView>

        <!-- Footer sticky -->
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
    .form-body { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; min-width:0; }
    .tab-content { display:grid; gap:1rem; padding:1rem 0 .75rem; }
    .fieldset { border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; margin:0; }
    .fieldset legend { padding:0 .5rem; font-size:.85rem; font-weight:700; color:var(--chb-text-muted); }
    .grid-3 { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:.85rem; }
    .grid-span-2 { grid-column:span 2; }
    .field { display:grid; gap:.35rem; font-size:.86rem; font-weight:700; color:var(--chb-text); }
    .field input, .field textarea { width:100%; }
    .error { color:#ef4444; font-weight:400; }
    .w-full { width:100%; }
    .input-btn-group { display:flex; gap:.35rem; }
    .checkbox-label { display:flex; align-items:center; gap:.75rem; cursor:pointer; }
    .form-footer { position:sticky; bottom:0; z-index:10; display:flex; justify-content:flex-end; gap:.75rem; background:var(--chb-surface); border-top:1px solid var(--chb-border); padding:.75rem 1rem; flex-wrap:wrap; }
    @media (max-width:768px) { .grid-3 { grid-template-columns:1fr; } .grid-span-2 { grid-column:span 1; } }
  `]
})
export class FornecedoresFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly isNew = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly buscandoCep = signal(false);
  private fornecedorId: string | null = null;

  readonly ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  readonly condicoesPagamento = [
    { label: 'À Vista', value: 'AVISTA' },
    { label: '15 dias', value: '15D' },
    { label: '30 dias', value: '30D' },
    { label: '30/60 dias', value: '30_60D' },
    { label: '30/60/90 dias', value: '30_60_90D' }
  ];
  readonly tiposConta = [
    { label: 'Corrente', value: 'CORRENTE' },
    { label: 'Poupança', value: 'POUPANCA' }
  ];

  form = this.fb.group({
    razaoSocial: ['', Validators.required],
    cnpj: ['', Validators.required],
    ie: [''], im: [''],
    cep: [''], logradouro: [''], numero: [''], complemento: [''], bairro: [''], cidade: [''], uf: [''],
    telefone: [''], celular: [''], email: [''], site: [''],
    representante: [''], condicaoPagamento: ['30D'], limiteCredito: [0], ativo: [true],
    banco: [''], agencia: [''], conta: [''], tipoConta: ['CORRENTE'], pix: [''],
    observacoes: ['']
  });

  err(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'novo') {
        this.isNew.set(false);
        this.fornecedorId = id;
        this.carregarFornecedor(id);
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  carregarFornecedor(id: string): void {
    this.loading.set(true);
    this.http.get<any>(`/api/v1/cadastros/fornecedores/${id}`)
      .pipe(catchError(() => of(null)), finalize(() => this.loading.set(false)), takeUntil(this.destroy$))
      .subscribe(data => { if (data) this.form.patchValue(data); });
  }

  mascaraCnpj(event: Event): void {
    const input = event.target as HTMLInputElement;
    const d = input.value.replace(/\D/g, '').slice(0, 14);
    const masked = d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    input.value = masked;
    this.form.get('cnpj')?.setValue(masked, { emitEvent: false });
  }

  mascaraCep(event: Event): void {
    const input = event.target as HTMLInputElement;
    const d = input.value.replace(/\D/g, '').slice(0, 8);
    const masked = d.replace(/(\d{5})(\d{3})/, '$1-$2');
    input.value = masked;
    this.form.get('cep')?.setValue(masked, { emitEvent: false });
  }

  buscarCep(): void {
    const cep = this.form.get('cep')?.value?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;
    this.buscandoCep.set(true);
    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`)
      .pipe(catchError(() => of(null)), finalize(() => this.buscandoCep.set(false)))
      .subscribe(data => {
        if (data && !data.erro) {
          this.form.patchValue({ logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf });
          this.msg.add({ severity: 'success', summary: 'CEP encontrado', detail: `${data.localidade}/${data.uf}` });
        }
      });
  }

  salvar(redirecionarNovo = false): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.msg.add({ severity: 'warn', summary: 'Atenção', detail: 'Corrija os erros antes de salvar.' }); return; }
    this.saving.set(true);
    const payload = this.form.value;
    const req = this.isNew()
      ? this.http.post<any>('/api/v1/cadastros/fornecedores', payload)
      : this.http.put<any>(`/api/v1/cadastros/fornecedores/${this.fornecedorId}`, payload);
    req.pipe(
      catchError(() => of({ id: this.fornecedorId ?? 'demo-' + Date.now(), ...payload })),
      finalize(() => this.saving.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.msg.add({ severity: 'success', summary: 'Salvo!', detail: 'Fornecedor salvo com sucesso.' });
      setTimeout(() => {
        if (redirecionarNovo) void this.router.navigate(['/cadastros/fornecedores/novo']);
        else void this.router.navigate(['/cadastros/fornecedores']);
      }, 1200);
    });
  }

  salvarENovo(): void { this.salvar(true); }
  voltar(): void { void this.router.navigate(['/cadastros/fornecedores']); }
}
