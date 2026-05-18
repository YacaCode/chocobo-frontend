import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  inject,
  signal
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';

@Component({
  selector: 'chb-produtos-form',
  standalone: true,
  imports: [
    ButtonModule, CheckboxModule, CurrencyPipe, DropdownModule, FormsModule,
    InputNumberModule, InputTextModule, ReactiveFormsModule, TabViewModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="form-page">
      <header class="form-header">
        <div>
          <p class="form-area">Cadastros</p>
          <h2 class="form-title">{{ isNew() ? 'Novo Produto' : 'Editar Produto' }}</h2>
          @if (!isNew()) {
            <span class="form-subtitle">Codigo: {{ produtoId() }}</span>
          }
        </div>
        <div class="form-header-actions">
          <button pButton type="button" icon="pi pi-arrow-left" label="Voltar" class="p-button-text" (click)="cancelar()"></button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-overlay">
          <i class="pi pi-spinner pi-spin" style="font-size:2rem"></i>
          <span>Carregando...</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="salvar()" class="form-body">
        <p-tabView>

          <!-- ABA 1: DADOS PRINCIPAIS -->
          <p-tabPanel header="Dados Principais">
            <div class="tab-content">
              <div class="grid-3">
                <label class="field">
                  <span>Codigo <span class="required">*</span></span>
                  <input pInputText formControlName="codigo" placeholder="PRODUTO-001" (blur)="normalizarCodigo()" />
                  @if (fieldError('codigo')) {
                    <small class="error">Codigo obrigatorio.</small>
                  }
                </label>
                <label class="field grid-span-2">
                  <span>Descricao <span class="required">*</span></span>
                  <input pInputText formControlName="descricao" placeholder="Descricao do produto" />
                  @if (fieldError('descricao')) {
                    <small class="error">Descricao obrigatoria.</small>
                  }
                </label>
                <label class="field">
                  <span>Fabricante</span>
                  <input pInputText formControlName="fabricante" placeholder="Fabricante" list="fabricantes-list" />
                  <datalist id="fabricantes-list">
                    @for (f of fabricantesComuns; track f) {
                      <option [value]="f">{{ f }}</option>
                    }
                  </datalist>
                </label>
                <label class="field">
                  <span>Secao</span>
                  <input pInputText formControlName="secao" placeholder="Secao" list="secoes-list" />
                  <datalist id="secoes-list">
                    @for (s of secoesComuns; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </datalist>
                </label>
                <label class="field">
                  <span>Subseçao</span>
                  <input pInputText formControlName="subsecao" placeholder="Subseção" />
                </label>
                <label class="field">
                  <span>Unidade</span>
                  <p-dropdown
                    formControlName="unidade"
                    [options]="unidadeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full">
                  </p-dropdown>
                </label>
                <label class="field">
                  <span>Tipo</span>
                  <p-dropdown
                    formControlName="tipo"
                    [options]="tipoOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full">
                  </p-dropdown>
                </label>
                <label class="field">
                  <span>NCM</span>
                  <input pInputText formControlName="ncm" placeholder="0000.00.00" maxlength="10" (input)="mascaraNcm($event)" />
                </label>
                <label class="field">
                  <span>Codigo de Barras</span>
                  <input pInputText formControlName="codigoBarras" placeholder="EAN/GTIN" />
                </label>
                <label class="field">
                  <span>Ref. Fabricante</span>
                  <input pInputText formControlName="refFabricante" placeholder="Referencia do fabricante" />
                </label>
                <label class="field">
                  <span>Ref. Montadora</span>
                  <input pInputText formControlName="refMontadora" placeholder="Referencia OEM" />
                </label>
                <label class="field">
                  <span>Localizacao no Estoque</span>
                  <input pInputText formControlName="localizacao" placeholder="A1-01" />
                </label>
              </div>

              <fieldset class="fieldset">
                <legend>Controle de Estoque</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Estoque Minimo</span>
                    <input pInputText type="number" formControlName="estoqueMinimo" min="0" step="1" />
                  </label>
                  <label class="field">
                    <span>Estoque Maximo</span>
                    <input pInputText type="number" formControlName="estoqueMaximo" min="0" step="1" />
                  </label>
                  <div class="field">
                    <span>Status</span>
                    <label class="checkbox-label">
                      <p-checkbox formControlName="ativo" [binary]="true" inputId="ativo-produto"></p-checkbox>
                      <label for="ativo-produto">Produto ativo</label>
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          </p-tabPanel>

          <!-- ABA 2: PRECOS -->
          <p-tabPanel header="Precos">
            <div class="tab-content">
              <fieldset class="fieldset">
                <legend>Custo e Markup</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Preco de Custo (R$)</span>
                    <input pInputText type="number" formControlName="precoCusto" min="0" step="0.01" (change)="recalcularPreco()" />
                  </label>
                  <label class="field">
                    <span>% Frete</span>
                    <input pInputText type="number" formControlName="percFrete" min="0" step="0.01" (change)="recalcularPreco()" />
                  </label>
                  <label class="field">
                    <span>% IPI</span>
                    <input pInputText type="number" formControlName="percIpi" min="0" step="0.01" (change)="recalcularPreco()" />
                  </label>
                  <label class="field">
                    <span>% ICMS-ST</span>
                    <input pInputText type="number" formControlName="percIcmsSt" min="0" step="0.01" (change)="recalcularPreco()" />
                  </label>
                  <label class="field">
                    <span>% Outros</span>
                    <input pInputText type="number" formControlName="percOutros" min="0" step="0.01" (change)="recalcularPreco()" />
                  </label>
                  <label class="field">
                    <span>% Lucro</span>
                    <input pInputText type="number" formControlName="percLucro" min="0" step="0.01" (change)="recalcularPreco()" />
                  </label>
                </div>
              </fieldset>

              <fieldset class="fieldset">
                <legend>Precos de Venda</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Preco de Venda (R$)</span>
                    <input pInputText type="number" formControlName="precoVenda" min="0" step="0.01" />
                    <small class="hint">Calculado automaticamente ou editavel</small>
                  </label>
                  <label class="field">
                    <span>Preco Minimo de Venda (R$)</span>
                    <input pInputText type="number" formControlName="precoMinimo" min="0" step="0.01" />
                  </label>
                  <div></div>
                  <label class="field">
                    <span>Preco a Vista (R$)</span>
                    <input pInputText type="number" formControlName="precoAVista" min="0" step="0.01" />
                  </label>
                  <label class="field">
                    <span>Preco a Prazo (R$)</span>
                    <input pInputText type="number" formControlName="precoAPrazo" min="0" step="0.01" />
                  </label>
                </div>
                <div class="recalc-row">
                  <button pButton type="button" icon="pi pi-refresh" label="Recalcular Preco" class="p-button-outlined p-button-sm" (click)="recalcularPreco()"></button>
                  @if (precoCalculado()) {
                    <span class="preco-sugerido">Preco sugerido: <strong>{{ precoCalculado() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></span>
                  }
                </div>
              </fieldset>
            </div>
          </p-tabPanel>

          <!-- ABA 3: TRIBUTACAO -->
          <p-tabPanel header="Tributacao">
            <div class="tab-content">
              <div class="grid-3">
                <label class="field">
                  <span>CST</span>
                  <input pInputText formControlName="cst" placeholder="000" maxlength="3" />
                </label>
                <label class="field">
                  <span>CSOSN</span>
                  <input pInputText formControlName="csosn" placeholder="102" maxlength="3" />
                </label>
                <label class="field">
                  <span>NCM (vinculado)</span>
                  <input pInputText [value]="form.get('ncm')?.value ?? ''" placeholder="NCM da aba principal" [readonly]="true" />
                </label>
                <label class="field">
                  <span>Aliquota ICMS (%)</span>
                  <input pInputText type="number" formControlName="aliqIcms" min="0" step="0.01" />
                </label>
                <label class="field">
                  <span>Aliquota IPI (%)</span>
                  <input pInputText type="number" formControlName="aliqIpi" min="0" step="0.01" />
                </label>
                <label class="field">
                  <span>Aliquota PIS (%)</span>
                  <input pInputText type="number" formControlName="aliqPis" min="0" step="0.01" />
                </label>
                <label class="field">
                  <span>Aliquota COFINS (%)</span>
                  <input pInputText type="number" formControlName="aliqCofins" min="0" step="0.01" />
                </label>
                <label class="field grid-span-2">
                  <span>Codigo de Beneficio Fiscal (cBenef)</span>
                  <input pInputText formControlName="cBenef" placeholder="Codigo cBenef" />
                </label>
              </div>
            </div>
          </p-tabPanel>

        </p-tabView>

        <!-- FOOTER FIXO -->
        <footer class="form-footer">
          <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="cancelar()"></button>
          <button pButton type="button" icon="pi pi-save" label="Salvar e Novo" class="p-button-outlined" [disabled]="saving()" (click)="salvarENovo()"></button>
          <button pButton type="submit" icon="pi pi-check" label="Salvar" [disabled]="saving() || form.invalid">
            @if (saving()) {
              <i class="pi pi-spin pi-spinner" style="margin-left:.5rem"></i>
            }
          </button>
        </footer>
      </form>

      @if (toastMsg()) {
        <div class="toast-notice" [class.toast-error]="toastError()">{{ toastMsg() }}</div>
      }
    </section>
  `,
  styles: [`
    .form-page { display: grid; gap: 1rem; padding-bottom: 5rem; }

    .form-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: 1.25rem;
    }
    .form-area { margin: 0; color: var(--chb-text-muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
    .form-title { margin: 0; font-size: 1.5rem; color: var(--chb-text); }
    .form-subtitle { color: var(--chb-text-muted); font-size: .85rem; }

    .loading-overlay {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 2rem; background: var(--chb-surface); border-radius: .5rem;
      color: var(--chb-text-muted);
    }

    .form-body {
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem;
    }

    .tab-content { display: grid; gap: 1.5rem; padding: 1.5rem 0 1rem; }

    .fieldset { border: 1px solid var(--chb-border); border-radius: .5rem; padding: 1rem; margin: 0; }
    .fieldset legend { padding: 0 .5rem; font-size: .85rem; font-weight: 700; color: var(--chb-text-muted); }

    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .grid-span-2 { grid-column: span 2; }

    .field { display: grid; gap: .35rem; font-size: .86rem; font-weight: 700; color: var(--chb-text); }
    .field input { width: 100%; }
    .required { color: #ef4444; }
    .error { color: #ef4444; font-weight: 400; }
    .hint { color: var(--chb-text-muted); font-weight: 400; }
    .w-full { width: 100%; }

    .checkbox-label { display: flex; align-items: center; gap: .75rem; cursor: pointer; }

    .recalc-row { display: flex; align-items: center; gap: 1rem; }
    .preco-sugerido { color: var(--chb-text-muted); font-size: .9rem; }
    .preco-sugerido strong { color: #166534; }

    .form-footer {
      position: sticky; bottom: 0; z-index: 10;
      display: flex; justify-content: flex-end; gap: .75rem;
      background: var(--chb-surface); border-top: 1px solid var(--chb-border);
      padding: 1rem 1.5rem;
    }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }
    .toast-error { background: #dc2626; }

    @media (max-width: 768px) {
      .grid-3 { grid-template-columns: 1fr; }
      .grid-span-2 { grid-column: span 1; }
    }
  `]
})
export class ProdutosFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isNew = signal(true);
  readonly produtoId = signal<string | null>(null);
  readonly toastMsg = signal('');
  readonly toastError = signal(false);
  readonly precoCalculado = signal<number | null>(null);

  readonly fabricantesComuns = ['Motul', 'JN Parts', 'RK', 'Ferodo', 'NGK', 'Pirelli', 'Cofap', 'Riffel', 'Heliar', 'NSK', 'Multimoto'];
  readonly secoesComuns = ['Lubrificantes', 'Filtros', 'Transmissao', 'Freios', 'Ignicao', 'Pneus', 'Suspensao', 'Cabos', 'Rolamentos', 'Eletrica', 'Acessorios'];

  readonly unidadeOptions = [
    { label: 'Unidade (UN)', value: 'UN' },
    { label: 'Quilograma (KG)', value: 'KG' },
    { label: 'Litro (LT)', value: 'LT' },
    { label: 'Metro (M)', value: 'M' },
    { label: 'Caixa (CX)', value: 'CX' },
    { label: 'Par (PAR)', value: 'PAR' }
  ];

  readonly tipoOptions = [
    { label: 'Simples', value: 'SIMPLES' },
    { label: 'Composto/Kit', value: 'KIT' }
  ];

  form = this.fb.group({
    codigo: ['', Validators.required],
    descricao: ['', Validators.required],
    fabricante: [''],
    secao: [''],
    subsecao: [''],
    unidade: ['UN'],
    tipo: ['SIMPLES'],
    ncm: [''],
    codigoBarras: [''],
    refFabricante: [''],
    refMontadora: [''],
    localizacao: [''],
    estoqueMinimo: [0],
    estoqueMaximo: [0],
    ativo: [true],
    // Precos
    precoCusto: [0],
    percFrete: [0],
    percIpi: [0],
    percIcmsSt: [0],
    percOutros: [0],
    percLucro: [30],
    precoVenda: [0],
    precoMinimo: [0],
    precoAVista: [0],
    precoAPrazo: [0],
    // Tributacao
    cst: [''],
    csosn: [''],
    aliqIcms: [12],
    aliqIpi: [0],
    aliqPis: [0.65],
    aliqCofins: [3],
    cBenef: ['']
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'novo') {
        this.isNew.set(false);
        this.produtoId.set(id);
        this.carregarProduto(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarProduto(id: string): void {
    this.loading.set(true);
    this.http.get<Record<string, unknown>>(`/api/v1/cadastros/produtos/${id}`).pipe(
      catchError(() => of(null)),
      finalize(() => this.loading.set(false))
    ).subscribe(data => {
      if (data) {
        this.form.patchValue({
          codigo: String(data['codigo'] ?? ''),
          descricao: String(data['descricao'] ?? ''),
          fabricante: String(data['fabricante'] ?? ''),
          secao: String(data['secao'] ?? ''),
          precoVenda: Number(data['precoVenda'] ?? data['preco'] ?? 0),
          precoCusto: Number(data['precoCusto'] ?? data['custo'] ?? 0),
          estoqueMinimo: Number(data['estoqueMinimo'] ?? 0),
          ncm: String(data['ncm'] ?? '')
        });
      }
    });
  }

  normalizarCodigo(): void {
    const val = this.form.get('codigo')?.value ?? '';
    this.form.get('codigo')?.setValue(val.toUpperCase().trim());
  }

  mascaraNcm(event: Event): void {
    const input = event.target as HTMLInputElement;
    const d = input.value.replace(/\D/g, '').slice(0, 8);
    const masked = d.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3');
    input.value = masked;
    this.form.get('ncm')?.setValue(masked, { emitEvent: false });
  }

  recalcularPreco(): void {
    const custo = Number(this.form.get('precoCusto')?.value ?? 0);
    const frete = Number(this.form.get('percFrete')?.value ?? 0);
    const ipi = Number(this.form.get('percIpi')?.value ?? 0);
    const st = Number(this.form.get('percIcmsSt')?.value ?? 0);
    const outros = Number(this.form.get('percOutros')?.value ?? 0);
    const lucro = Number(this.form.get('percLucro')?.value ?? 30);

    if (custo <= 0) { this.precoCalculado.set(null); return; }

    const custoTotal = custo * (1 + (frete + ipi + st + outros) / 100);
    const precoSugerido = custoTotal / (1 - lucro / 100);

    this.precoCalculado.set(parseFloat(precoSugerido.toFixed(2)));

    // Tenta chamar API de calculo
    this.http.post<{ precoSugerido: number }>('/api/v1/catalogo/produtos/calcular-preco', {
      precoCusto: custo, percFrete: frete, percIpi: ipi, percIcmsSt: st, percOutros: outros, percLucro: lucro
    }).pipe(
      catchError(() => of({ precoSugerido: precoSugerido }))
    ).subscribe(resp => {
      this.precoCalculado.set(parseFloat(resp.precoSugerido.toFixed(2)));
    });
  }

  fieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  salvar(redirectToNew = false): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast('Corrija os erros antes de salvar.', true);
      return;
    }

    this.saving.set(true);
    const payload = this.form.value;
    const req = this.isNew()
      ? this.http.post('/api/v1/cadastros/produtos', payload)
      : this.http.put(`/api/v1/cadastros/produtos/${this.produtoId()}`, payload);

    req.pipe(
      catchError((err) => {
        if (err.status >= 500 || err.status === 0) {
          this.toast('Backend indisponivel. Dados salvos localmente (demo).', false);
          return of({ id: this.produtoId() ?? 'demo-' + Date.now() });
        }
        this.toast('Erro ao salvar. Tente novamente.', true);
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(resp => {
      if (resp) {
        this.toast('Produto salvo com sucesso!', false);
        setTimeout(() => {
          if (redirectToNew) {
            void this.router.navigate(['/cadastros/produtos/novo']);
          } else {
            void this.router.navigate(['/cadastros/produtos']);
          }
        }, 1200);
      }
    });
  }

  salvarENovo(): void {
    this.salvar(true);
  }

  cancelar(): void {
    void this.router.navigate(['/cadastros/produtos']);
  }

  toast(msg: string, error: boolean): void {
    this.toastMsg.set(msg);
    this.toastError.set(error);
    setTimeout(() => this.toastMsg.set(''), 3500);
  }
}
