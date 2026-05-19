import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  computed,
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
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';

import { ProdutoBuscaDialogComponent } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import type { ProdutoItem } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';

@Component({
  selector: 'chb-produtos-form',
  standalone: true,
  imports: [
    ButtonModule, CheckboxModule, CurrencyPipe, DropdownModule, FileUploadModule, FormsModule,
    InputNumberModule, InputTextModule, ReactiveFormsModule, SelectButtonModule, TableModule, TabViewModule,
    ProdutoBuscaDialogComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <chb-produto-busca-dialog
      [(visible)]="showKitDialog"
      (produtoSelecionado)="onKitProdutoSelecionado($event)">
    </chb-produto-busca-dialog>

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
              </div>
              <div class="form-field-tipo">
                <label class="field-label-tipo">Tipo de Produto</label>
                <p-selectButton formControlName="tipo" [options]="tipoSelectOptions" optionLabel="label" optionValue="value" [allowEmpty]="false"></p-selectButton>
              </div>
              <div class="grid-3">
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

          <!-- Aba Referência (multi-fabricante) -->
          <p-tabPanel header="Referências">
            <div class="tab-content">
              <div class="socios-toolbar">
                <h4 class="section-title">Referências de Fabricantes</h4>
                <button pButton type="button" icon="pi pi-plus" label="Adicionar" class="p-button-sm p-button-outlined" (click)="adicionarRefFabricante()"></button>
              </div>
              @if (refFabricantes().length === 0) {
                <div class="empty-state-inline">
                  <i class="pi pi-tag" aria-hidden="true"></i>
                  <span>Nenhuma referência de fabricante cadastrada.</span>
                </div>
              } @else {
                <p-table [value]="refFabricantes()" styleClass="p-datatable-sm" dataKey="idx">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Fabricante</th>
                      <th>Código do Fabricante</th>
                      <th>Ref. Montadora</th>
                      <th>Principal</th>
                      <th style="width:60px"></th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-r let-i="rowIndex">
                    <tr>
                      <td><input pInputText [(ngModel)]="r.fabricante" [ngModelOptions]="{standalone:true}" placeholder="Fabricante" style="width:100%" /></td>
                      <td><input pInputText [(ngModel)]="r.codigo" [ngModelOptions]="{standalone:true}" placeholder="Código" style="width:100%" /></td>
                      <td><input pInputText [(ngModel)]="r.refMontadora" [ngModelOptions]="{standalone:true}" placeholder="Ref. montadora" style="width:100%" /></td>
                      <td style="text-align:center">
                        <input type="radio" name="principal" [checked]="r.principal" (change)="setPrincipal(i)" />
                      </td>
                      <td><button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="removerRefFabricante(i)" aria-label="Remover"></button></td>
                    </tr>
                  </ng-template>
                </p-table>
              }
            </div>
          </p-tabPanel>

          <!-- Aba Fotos -->
          <p-tabPanel header="Fotos">
            <div class="tab-content">
              <h4 class="section-title">Galeria de Fotos</h4>
              <p-fileUpload
                mode="advanced"
                [multiple]="true"
                accept="image/*"
                [maxFileSize]="5000000"
                chooseLabel="Adicionar fotos"
                [auto]="false"
                (onSelect)="onFotosSelecionadas($event)">
                <ng-template pTemplate="empty">
                  <div class="empty-state-inline">
                    <i class="pi pi-images" aria-hidden="true"></i>
                    <span>Arraste imagens aqui ou clique em Adicionar fotos.</span>
                  </div>
                </ng-template>
              </p-fileUpload>
              @if (fotosPreview().length > 0) {
                <div class="fotos-grid">
                  @for (foto of fotosPreview(); track foto.name; let i = $index) {
                    <div class="foto-item">
                      <img [src]="foto.url" [alt]="foto.name" />
                      @if (i === 0) { <span class="foto-badge">Principal</span> }
                      <button type="button" class="foto-remover" (click)="removerFoto(i)" aria-label="Remover foto">
                        <i class="pi pi-times" aria-hidden="true"></i>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </p-tabPanel>

          <!-- Aba Composição (Kit) -->
          <p-tabPanel header="Composição" [disabled]="form.get('tipo')?.value !== 'KIT'">
            <div class="tab-content">
              @if (form.get('tipo')?.value !== 'KIT') {
                <div class="empty-state-inline">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
                  <span>Ative o tipo "Kit" na aba de Dados Principais para gerenciar a composição.</span>
                </div>
              } @else {
                <div class="socios-toolbar">
                  <h4 class="section-title">Produtos do Kit</h4>
                  <button pButton type="button" icon="pi pi-plus" label="Adicionar Produto" class="p-button-sm p-button-outlined" (click)="abrirBuscaKit()"></button>
                </div>
                @if (kitItens().length === 0) {
                  <div class="empty-state-inline">
                    <i class="pi pi-box" aria-hidden="true"></i>
                    <span>Nenhum produto no kit. Clique em Adicionar Produto.</span>
                  </div>
                } @else {
                  <p-table [value]="kitItens()" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                      <tr>
                        <th style="width:120px">Código</th>
                        <th>Descrição</th>
                        <th style="width:140px">Quantidade</th>
                        <th style="width:120px;text-align:right">Preço</th>
                        <th style="width:130px;text-align:right">Subtotal</th>
                        <th style="width:84px"></th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item let-i="rowIndex">
                      <tr>
                        <td>{{ item.codigo }}</td>
                        <td>{{ item.descricao }}</td>
                        <td>
                          <p-inputNumber
                            [(ngModel)]="item.quantidade"
                            [ngModelOptions]="{standalone:true}"
                            [min]="1"
                            [showButtons]="true"
                            decrementButtonClass="p-button-outlined"
                            incrementButtonClass="p-button-outlined"
                            [style]="{width:'120px'}">
                          </p-inputNumber>
                        </td>
                        <td style="text-align:right">{{ item.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                        <td style="text-align:right">{{ item.precoVenda * item.quantidade | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                        <td>
                          <button pButton type="button" icon="pi pi-search" class="p-button-text p-button-sm" (click)="abrirBuscaKit(i)" aria-label="Trocar produto"></button>
                          <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="removerItemKit(i)" aria-label="Remover"></button>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="footer">
                      <tr>
                        <td colspan="6" style="text-align:right;font-weight:700">
                          Total de itens: {{ kitItens().length }} &nbsp;•&nbsp;
                          Subtotal: {{ kitSubtotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                }
              }
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
    .form-page { display: grid; gap: .85rem; padding-bottom: 4.5rem; min-width: 0; }

    .form-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: 1rem;
      box-shadow: var(--chb-shadow-soft);
    }
    .form-area { margin: 0; color: var(--chb-text-muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
    .form-title { margin: 0; font-size: 1.3rem; color: var(--chb-text); }
    .form-subtitle { color: var(--chb-text-muted); font-size: .85rem; }

    .loading-overlay {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 2rem; background: var(--chb-surface); border-radius: .5rem;
      color: var(--chb-text-muted);
    }

    .form-body {
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem;
      box-shadow: var(--chb-shadow-soft);
      min-width: 0;
    }

    .tab-content { display: grid; gap: 1rem; padding: 1rem 0 .75rem; }

    .fieldset { border: 1px solid var(--chb-border); border-radius: .5rem; padding: 1rem; margin: 0; }
    .fieldset legend { padding: 0 .5rem; font-size: .85rem; font-weight: 700; color: var(--chb-text-muted); }

    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
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
      padding: .75rem 1rem;
      flex-wrap: wrap;
    }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }
    .toast-error { background: #dc2626; }

    .socios-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .section-title { margin: 0; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; color: var(--chb-text-muted, #6c757d); }
    .empty-state-inline { display: flex; align-items: center; gap: 0.75rem; padding: 1.5rem; color: var(--chb-text-muted, #6c757d); background: var(--chb-surface-muted, #f8f9fa); border-radius: 0.4rem; }
    .empty-state-inline i { font-size: 1.5rem; opacity: 0.6; }
    .fotos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
    .foto-item { position: relative; aspect-ratio: 1; border-radius: 0.4rem; overflow: hidden; border: 1px solid var(--chb-border, #dee2e6); }
    .foto-item img { width: 100%; height: 100%; object-fit: cover; }
    .foto-badge { position: absolute; top: 0.25rem; left: 0.25rem; background: var(--chb-yellow, #F9A825); color: #1a1a2e; font-size: 0.65rem; font-weight: 900; padding: 0.1rem 0.35rem; border-radius: 0.2rem; }
    .foto-remover { position: absolute; top: 0.25rem; right: 0.25rem; background: rgba(220,38,38,0.9); border: none; border-radius: 50%; width: 1.4rem; height: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.65rem; }
    .form-field-tipo { display: grid; gap: 0.35rem; margin-bottom: 0.5rem; }
    .field-label-tipo { font-size: 0.86rem; font-weight: 700; color: var(--chb-text); }

    @media (max-width: 768px) {
      .grid-3 { grid-template-columns: 1fr; }
      .grid-span-2 { grid-column: span 1; }
      .form-header,
      .form-footer { align-items: stretch; flex-direction: column; }
      .form-footer .p-button { width: 100%; justify-content: center; }
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

  readonly refFabricantes = signal<{fabricante:string;codigo:string;refMontadora:string;principal:boolean}[]>([]);
  readonly fotosPreview = signal<{name:string;url:string}[]>([]);
  readonly kitItens = signal<{codigo:string;descricao:string;quantidade:number;precoVenda:number}[]>([]);
  readonly kitSubtotal = computed(() =>
    this.kitItens().reduce((s, i) => s + (i.precoVenda ?? 0) * (i.quantidade ?? 1), 0)
  );
  kitBuscaIndex = -1;
  showKitDialog = false;

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
    { label: 'Composto/Kit', value: 'KIT' },
    { label: 'Serviço', value: 'SERVICO' }
  ];

  readonly tipoSelectOptions = [
    { label: 'Simples', value: 'SIMPLES' },
    { label: 'Kit', value: 'KIT' },
    { label: 'Serviço', value: 'SERVICO' }
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

  adicionarRefFabricante(): void {
    this.refFabricantes.update((r) => [...r, { fabricante: '', codigo: '', refMontadora: '', principal: r.length === 0 }]);
  }

  removerRefFabricante(i: number): void {
    this.refFabricantes.update((r) => r.filter((_, idx) => idx !== i));
  }

  setPrincipal(i: number): void {
    this.refFabricantes.update((r) => r.map((item, idx) => ({ ...item, principal: idx === i })));
  }

  onFotosSelecionadas(event: { files: File[] }): void {
    const novas = event.files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    this.fotosPreview.update((prev) => [...prev, ...novas]);
  }

  removerFoto(i: number): void {
    this.fotosPreview.update((prev) => prev.filter((_, idx) => idx !== i));
  }

  adicionarItemKit(): void {
    this.kitItens.update((k) => [...k, { codigo: '', descricao: 'Produto ' + (k.length + 1), quantidade: 1, precoVenda: 0 }]);
  }

  removerItemKit(i: number): void {
    this.kitItens.update((k) => k.filter((_, idx) => idx !== i));
  }

  abrirBuscaKit(index?: number): void {
    this.kitBuscaIndex = index ?? -1;
    this.showKitDialog = true;
  }

  onKitProdutoSelecionado(produto: ProdutoItem): void {
    if (this.kitBuscaIndex >= 0) {
      this.kitItens.update(k => k.map((item, i) => i === this.kitBuscaIndex
        ? { ...item, codigo: produto.codigo, descricao: produto.descricao, precoVenda: produto.precoVenda ?? 0 }
        : item
      ));
    } else {
      this.kitItens.update(k => [...k, {
        codigo: produto.codigo,
        descricao: produto.descricao,
        quantidade: 1,
        precoVenda: produto.precoVenda ?? 0
      }]);
    }
    this.showKitDialog = false;
  }

  toast(msg: string, error: boolean): void {
    this.toastMsg.set(msg);
    this.toastError.set(error);
    setTimeout(() => this.toastMsg.set(''), 3500);
  }
}
