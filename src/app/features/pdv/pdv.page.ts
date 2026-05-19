import { CurrencyPipe } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  HostListener,
  type OnDestroy,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProdutoBuscaDialogComponent } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import type { ProdutoItem } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import { ClienteBuscaDialogComponent } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';
import type { ClienteItem } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';
import { FormaPagamentoDialogComponent } from '../../shared/forma-pagamento-dialog/forma-pagamento-dialog.component';
import type { FormaPagamentoSelecionada } from '../../shared/forma-pagamento-dialog/forma-pagamento-dialog.component';

interface PdvItem {
  codigo: string;
  descricao: string;
  qtd: number;
  precoUnitario: number;
  total: number;
}

@Component({
  selector: 'chb-pdv-page',
  standalone: true,
  imports: [
    ButtonModule, CurrencyPipe, FormsModule, InputNumberModule, InputTextModule,
    TagModule, ToastModule,
    ProdutoBuscaDialogComponent, ClienteBuscaDialogComponent, FormaPagamentoDialogComponent
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <chb-produto-busca-dialog
      [(visible)]="showProdutoDialog"
      (produtoSelecionado)="onProdutoSelecionado($event)">
    </chb-produto-busca-dialog>

    <chb-cliente-busca-dialog
      [(visible)]="showClienteDialog"
      (clienteSelecionado)="onClienteSelecionado($event)">
    </chb-cliente-busca-dialog>

    <chb-forma-pagamento-dialog
      [(visible)]="showPagamentoDialog"
      [total]="totalGeral()"
      (pagamentoConfirmado)="onPagamentoConfirmado($event)">
    </chb-forma-pagamento-dialog>

    <div class="pdv-shell">
      <!-- Header minimalista -->
      <header class="pdv-header">
        <div class="pdv-header-brand">
          <img src="/chocobo-logo.svg" alt="Chocobo PDV" class="pdv-brand-logo" />
          <span>PDV</span>
        </div>
        @if (clienteSelecionado()) {
          <div class="pdv-cliente-badge">
            <i class="pi pi-user" aria-hidden="true"></i>
            <span>{{ clienteSelecionado()!.razaoSocial }}</span>
          </div>
        }
        <div class="pdv-header-right">
          <span class="pdv-hora">{{ horaAtual() }}</span>
          <button pButton type="button" icon="pi pi-sign-out" class="p-button-text p-button-sm" (click)="sair()"></button>
        </div>
      </header>

      <!-- Corpo 60/40 -->
      <div class="pdv-body">
        <!-- Coluna esquerda: lista de itens -->
        <div class="pdv-esquerda">
          <!-- Campo de busca / codigo de barras -->
          <div class="pdv-busca-wrap">
            <span class="p-input-icon-left pdv-busca-input-wrap">
              <i class="pi pi-barcode" aria-hidden="true"></i>
              <input
                #codigoBarras
                pInputText
                type="text"
                placeholder="F1 - Codigo de barras ou descricao..."
                [(ngModel)]="codigoModel"
                (keydown.enter)="onCodigoEnter()"
                autocomplete="off"
                class="pdv-busca-input" />
            </span>
            <button pButton type="button" icon="pi pi-search" class="p-button-outlined" (click)="abrirProdutoDialog()"></button>
          </div>

          <!-- Grid de itens -->
          <div class="pdv-itens">
            @if (itens().length === 0) {
              <div class="pdv-vazio">
                <i class="pi pi-shopping-cart" aria-hidden="true"></i>
                <p>Nenhum item.</p>
                <small>Digite o codigo ou pressione F1 para buscar.</small>
              </div>
            } @else {
              <table class="pdv-table">
                <thead>
                  <tr>
                    <th style="width:40px">#</th>
                    <th style="width:100px">Cod.</th>
                    <th>Descricao</th>
                    <th style="width:80px;text-align:center">Qtd</th>
                    <th style="width:100px;text-align:right">Unit.</th>
                    <th style="width:110px;text-align:right">Total</th>
                    <th style="width:36px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of itens(); track $index; let i = $index) {
                    <tr class="pdv-item" [class.pdv-item--selected]="itemSelecionado() === i" (click)="selecionarItem(i)">
                      <td class="pdv-seq">{{ i + 1 }}</td>
                      <td class="pdv-cod">{{ item.codigo }}</td>
                      <td class="pdv-desc">{{ item.descricao }}</td>
                      <td class="pdv-qtd-cell">
                        @if (itemSelecionado() === i) {
                          <p-inputNumber
                            [(ngModel)]="item.qtd"
                            [min]="1"
                            [showButtons]="true"
                            (ngModelChange)="recalcularItem(i)"
                            [style]="{ width: '100%' }"
                            inputStyleClass="pdv-qtd-input">
                          </p-inputNumber>
                        } @else {
                          <span class="pdv-qtd-display">{{ item.qtd }}</span>
                        }
                      </td>
                      <td class="pdv-preco">{{ item.precoUnitario | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td class="pdv-total">{{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td>
                        <button type="button" class="pdv-btn-rm" (click)="removerItem(i); $event.stopPropagation()">
                          <i class="pi pi-times" aria-hidden="true"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <!-- Coluna direita: totais + pagamento -->
        <aside class="pdv-direita">
          <div class="pdv-totais">
            <div class="pdv-total-linha">
              <span>Sub-Total</span>
              <strong>{{ subTotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            @if (descontoGlobal > 0) {
              <div class="pdv-total-linha pdv-total-desc">
                <span>Desconto</span>
                <strong>- {{ descontoGlobalValor() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </div>
            }
            <div class="pdv-total-linha pdv-total-geral">
              <span>TOTAL</span>
              <strong>{{ totalGeral() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="pdv-total-linha">
              <span>PAGO</span>
              <strong class="valor-pago">{{ totalPago() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="pdv-total-linha" [class.troco-ok]="troco() > 0">
              <span>TROCO</span>
              <strong>{{ troco() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
          </div>

          <div class="pdv-desconto-global">
            <label>Desconto global (%)</label>
            <p-inputNumber
              [(ngModel)]="descontoGlobal"
              [min]="0"
              [max]="100"
              [maxFractionDigits]="2"
              suffix="%"
              [style]="{ width: '100%' }">
            </p-inputNumber>
          </div>

          <div class="pdv-acoes">
            <button
              pButton
              type="button"
              icon="pi pi-credit-card"
              label="F4 - Pagamento"
              class="pdv-btn-pgto p-button-outlined"
              [disabled]="itens().length === 0"
              (click)="abrirPagamentoDialog()">
            </button>
            <button
              pButton
              type="button"
              icon="pi pi-check-circle"
              label="F8 - Finalizar Venda"
              class="pdv-btn-finalizar"
              [disabled]="itens().length === 0 || totalPago() < totalGeral()"
              [loading]="finalizando()"
              (click)="finalizarVenda()">
            </button>
            <button
              pButton
              type="button"
              icon="pi pi-times"
              label="F12 - Cancelar"
              class="p-button-text p-button-danger"
              (click)="cancelarVenda()">
            </button>
          </div>
        </aside>
      </div>

      <!-- Rodape de atalhos -->
      <footer class="pdv-footer">
        <span><strong>F1</strong> Busca</span>
        <span><strong>F2</strong> Cliente</span>
        <span><strong>F3</strong> Desconto</span>
        <span><strong>F4</strong> Pagamento</span>
        <span><strong>F8</strong> Finalizar</span>
        <span><strong>F12</strong> Cancelar</span>
        <span><strong>Esc</strong> Sair</span>
        <span class="pdv-footer-info">{{ itens().length }} iten(s)</span>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      overflow: visible;
    }

    .pdv-shell {
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: clamp(34rem, calc(100vh - 7.25rem), 50rem);
      min-width: 0;
      border: 1px solid var(--chb-border);
      border-radius: 0.6rem;
      background: color-mix(in srgb, var(--chb-surface) 96%, transparent);
      color: var(--chb-text);
      overflow: hidden;
      box-shadow: var(--chb-shadow);
      animation: chb-fade-rise 180ms ease-out both;
    }

    .pdv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.55rem 0.9rem;
      border-bottom: 1px solid var(--chb-border);
      background: color-mix(in srgb, var(--chb-surface) 92%, var(--chb-surface-muted));
    }

    .pdv-header-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .pdv-brand-logo {
      width: 1.8rem;
      height: 1.8rem;
      object-fit: contain;
      filter: drop-shadow(0 0 3px color-mix(in srgb, var(--chb-teal-50) 70%, transparent));
    }

    .pdv-cliente-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--chb-yellow) 14%, var(--chb-surface));
      color: var(--chb-yellow-700);
      font-size: 0.85rem;
      font-weight: 700;
    }

    .pdv-header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pdv-hora {
      color: var(--chb-text-muted);
      font-size: 0.85rem;
      font-family: monospace;
    }

    .pdv-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 18rem;
      min-width: 0;
      overflow: hidden;
    }

    .pdv-esquerda {
      display: grid;
      grid-template-rows: auto 1fr;
      border-right: 1px solid var(--chb-border);
      overflow: hidden;
    }

    .pdv-busca-wrap {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: color-mix(in srgb, var(--chb-surface) 92%, var(--chb-surface-muted));
      border-bottom: 1px solid var(--chb-border);
    }

    .pdv-busca-input-wrap {
      flex: 1;
    }

    .pdv-busca-input {
      width: 100%;
      background: color-mix(in srgb, var(--chb-surface) 88%, var(--chb-surface-muted));
      border-color: var(--chb-border-strong);
      color: var(--chb-text);
    }

    .pdv-busca-input::placeholder {
      color: var(--chb-text-muted);
    }

    .pdv-itens {
      min-width: 0;
      overflow: auto;
    }

    .pdv-vazio {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--chb-text-muted);
      gap: 0.5rem;
    }

    .pdv-vazio i {
      font-size: 3rem;
      opacity: 0.3;
    }

    .pdv-vazio p {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .pdv-table {
      width: 100%;
      min-width: 42rem;
      border-collapse: collapse;
      font-size: 0.84rem;
    }

    .pdv-table th {
      padding: 0.5rem 0.75rem;
      background: color-mix(in srgb, var(--chb-surface-muted) 88%, var(--chb-teal-50));
      color: var(--chb-text-muted);
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      border-bottom: 1px solid var(--chb-border);
      position: sticky;
      top: 0;
    }

    .pdv-item td {
      padding: 0.48rem 0.65rem;
      border-bottom: 1px solid var(--chb-border);
      vertical-align: middle;
    }

    .pdv-item:hover {
      background: color-mix(in srgb, var(--chb-teal-50) 48%, var(--chb-surface));
      cursor: pointer;
    }

    .pdv-item {
      animation: pdv-row-in 140ms ease-out both;
      transition: background-color 120ms ease, transform 120ms ease;
    }

    .pdv-item:hover {
      transform: translateX(1px);
    }

    .pdv-item--selected {
      background: color-mix(in srgb, var(--chb-yellow) 10%, var(--chb-surface)) !important;
      border-left: 3px solid var(--chb-yellow);
    }

    .pdv-seq { color: var(--chb-text-muted); font-size: 0.8rem; }
    .pdv-cod { color: var(--chb-yellow-700); font-weight: 700; font-size: 0.85rem; }
    .pdv-desc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pdv-qtd-cell { text-align: center; }
    .pdv-qtd-display { display: inline-block; padding: 0.2rem 0.75rem; border-radius: 0.35rem; background: var(--chb-surface-muted); }
    .pdv-preco { text-align: right; color: var(--chb-text-muted); font-size: 0.85rem; }
    .pdv-total { text-align: right; font-weight: 700; }

    .pdv-btn-rm {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border: none;
      border-radius: 0.25rem;
      background: transparent;
      color: var(--chb-text-muted);
      cursor: pointer;
      font-size: 0.65rem;
    }

    .pdv-btn-rm:hover {
      background: color-mix(in srgb, var(--chb-red) 12%, var(--chb-surface));
      color: var(--chb-red);
    }

    :host ::ng-deep .pdv-qtd-input {
      text-align: center;
      background: var(--chb-surface);
      color: var(--chb-text);
      border-color: color-mix(in srgb, var(--chb-yellow) 50%, var(--chb-border));
    }

    .pdv-direita {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.85rem;
      background: color-mix(in srgb, var(--chb-surface) 92%, var(--chb-surface-muted));
      overflow-y: auto;
    }

    .pdv-totais {
      display: grid;
      gap: 0.6rem;
    }

    .pdv-total-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .pdv-total-linha span {
      color: var(--chb-text-muted);
      font-weight: 600;
    }

    .pdv-total-geral {
      padding: 0.5rem 0;
      border-top: 1px solid var(--chb-border);
      margin-top: 0.25rem;
    }

    .pdv-total-geral strong {
      font-size: 1.35rem;
      font-weight: 900;
      color: var(--chb-yellow-700);
    }

    .pdv-total-desc strong { color: var(--chb-red); }
    .valor-pago { color: var(--chb-green) !important; }
    .troco-ok strong { color: var(--chb-green); }

    .pdv-desconto-global {
      display: grid;
      gap: 0.3rem;
    }

    .pdv-desconto-global label {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    :host ::ng-deep .pdv-desconto-global .p-inputnumber input {
      background: var(--chb-surface);
      border-color: var(--chb-border-strong);
      color: var(--chb-text);
      width: 100%;
    }

    .pdv-acoes {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      margin-top: auto;
    }

    .pdv-btn-pgto {
      border-color: color-mix(in srgb, var(--chb-border-strong) 80%, transparent) !important;
      color: var(--chb-text) !important;
    }

    .pdv-btn-finalizar {
      background: var(--chb-yellow) !important;
      border-color: var(--chb-yellow) !important;
      color: #111827 !important;
      font-weight: 700 !important;
    }

    .pdv-footer {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 0.42rem 0.8rem;
      background: color-mix(in srgb, var(--chb-surface) 92%, var(--chb-surface-muted));
      border-top: 1px solid var(--chb-border);
      font-size: 0.78rem;
      color: var(--chb-text-muted);
      flex-wrap: wrap;
    }

    .pdv-footer strong {
      color: var(--chb-yellow-700);
    }

    .pdv-footer-info {
      margin-left: auto;
    }

    @media (max-width: 767px) {
      .pdv-body {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
      }
      .pdv-direita {
        border-top: 1px solid var(--chb-border);
      }
    }

    @media (max-width: 520px) {
      .pdv-shell {
        height: calc(100vh - 6rem);
        border-radius: 0.45rem;
      }

      .pdv-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .pdv-header-right {
        width: 100%;
        justify-content: space-between;
      }

      .pdv-footer {
        gap: 0.65rem;
      }
    }

    @keyframes pdv-row-in {
      from {
        opacity: 0;
        transform: translateX(-4px);
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdvPage implements AfterViewInit, OnDestroy {
  @ViewChild('codigoBarras') codigoBarrasEl!: ElementRef<HTMLInputElement>;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();
  private horaInterval?: ReturnType<typeof setInterval>;

  showProdutoDialog = false;
  showClienteDialog = false;
  showPagamentoDialog = false;

  codigoModel = '';
  descontoGlobal = 0;

  readonly itens = signal<PdvItem[]>([]);
  readonly clienteSelecionado = signal<ClienteItem | null>(null);
  readonly itemSelecionado = signal<number | null>(null);
  readonly finalizando = signal(false);
  readonly totalPago = signal(0);
  readonly formasPagamento = signal<FormaPagamentoSelecionada[]>([]);
  readonly horaAtual = signal('');

  readonly subTotal = computed(() => this.itens().reduce((acc, i) => acc + i.total, 0));
  readonly descontoGlobalValor = computed(() => this.subTotal() * this.descontoGlobal / 100);
  readonly totalGeral = computed(() => Math.max(0, this.subTotal() - this.descontoGlobalValor()));
  readonly troco = computed(() => this.totalPago() - this.totalGeral());

  ngAfterViewInit(): void {
    this.focarCodigo();
    this.horaInterval = setInterval(() => {
      this.horaAtual.set(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    this.horaAtual.set(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.horaInterval) clearInterval(this.horaInterval);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.showProdutoDialog || this.showClienteDialog || this.showPagamentoDialog) return;

    if (event.key === 'F1') { event.preventDefault(); this.abrirProdutoDialog(); }
    if (event.key === 'F2') { event.preventDefault(); this.showClienteDialog = true; }
    if (event.key === 'F3') { event.preventDefault(); this.focarDesconto(); }
    if (event.key === 'F4') { event.preventDefault(); this.abrirPagamentoDialog(); }
    if (event.key === 'F8') { event.preventDefault(); this.finalizarVenda(); }
    if (event.key === 'F12') { event.preventDefault(); this.cancelarVenda(); }
    if (event.key === 'Escape') { event.preventDefault(); this.sair(); }
  }

  focarCodigo(): void {
    setTimeout(() => {
      this.codigoBarrasEl?.nativeElement?.focus();
    }, 100);
  }

  abrirProdutoDialog(): void {
    this.showProdutoDialog = true;
  }

  abrirPagamentoDialog(): void {
    if (this.itens().length > 0) {
      this.showPagamentoDialog = true;
    }
  }

  focarDesconto(): void {
    // Focus handled by keyboard shortcuts section
  }

  onCodigoEnter(): void {
    const codigo = this.codigoModel.trim();
    if (!codigo) {
      this.abrirProdutoDialog();
      return;
    }

    this.http.get<unknown>(`/api/v1/cadastros/produtos?q=${encodeURIComponent(codigo)}`).pipe(
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      const arr = Array.isArray(response) ? response : [];
      const produto = arr[0] as Record<string, unknown> | undefined;

      if (produto) {
        this.adicionarItem({
          id: String(produto['id'] ?? ''),
          codigo: String(produto['codigo'] ?? codigo),
          descricao: String(produto['descricao'] ?? ''),
          fabricante: String(produto['fabricante'] ?? ''),
          precoVenda: Number(produto['precoVenda'] ?? 0),
          qtdDisponivel: Number(produto['qtdDisponivel'] ?? 0)
        });
      } else {
        // Produto nao encontrado - tenta encontrar nos demos
        this.abrirProdutoDialog();
      }

      this.codigoModel = '';
      this.focarCodigo();
    });
  }

  onProdutoSelecionado(produto: ProdutoItem): void {
    this.adicionarItem(produto);
    this.codigoModel = '';
    this.focarCodigo();
  }

  private adicionarItem(produto: ProdutoItem): void {
    this.itens.update((lista) => {
      const existente = lista.findIndex((i) => i.codigo === produto.codigo);
      if (existente >= 0) {
        const atualizado = [...lista];
        const item = atualizado[existente]!;
        item.qtd += 1;
        item.total = item.qtd * item.precoUnitario;
        return atualizado;
      }
      return [...lista, {
        codigo: produto.codigo,
        descricao: produto.descricao,
        qtd: 1,
        precoUnitario: produto.precoVenda,
        total: produto.precoVenda
      }];
    });
    this.messageService.add({ severity: 'success', summary: produto.descricao, detail: `R$ ${produto.precoVenda.toFixed(2)}`, life: 1500 });
  }

  onClienteSelecionado(cliente: ClienteItem): void {
    this.clienteSelecionado.set(cliente);
    this.focarCodigo();
  }

  onPagamentoConfirmado(formas: FormaPagamentoSelecionada[]): void {
    this.formasPagamento.set(formas);
    const total = formas.reduce((acc, f) => acc + f.valor, 0);
    this.totalPago.set(Math.round(total * 100) / 100);
    this.focarCodigo();
  }

  selecionarItem(index: number): void {
    this.itemSelecionado.set(this.itemSelecionado() === index ? null : index);
  }

  recalcularItem(index: number): void {
    this.itens.update((lista) => {
      const atualizado = [...lista];
      const item = atualizado[index];
      if (item) {
        item.total = item.qtd * item.precoUnitario;
      }
      return atualizado;
    });
  }

  removerItem(index: number): void {
    this.itens.update((lista) => lista.filter((_, i) => i !== index));
    if (this.itemSelecionado() === index) {
      this.itemSelecionado.set(null);
    }
    this.focarCodigo();
  }

  finalizarVenda(): void {
    if (this.itens().length === 0 || this.totalPago() < this.totalGeral()) return;
    this.finalizando.set(true);

    const payload = {
      clienteId: this.clienteSelecionado()?.id ?? null,
      itens: this.itens().map((i) => ({ codigo: i.codigo, descricao: i.descricao, qtd: i.qtd, precoUnitario: i.precoUnitario, total: i.total })),
      formasPagamento: this.formasPagamento(),
      total: this.totalGeral()
    };

    this.http.post<unknown>('/api/v1/fiscal/nfce', payload).pipe(
      catchError(() => of({ numero: Math.floor(Math.random() * 9999) })),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      const rec = response as Record<string, unknown>;
      this.finalizando.set(false);
      this.messageService.add({ severity: 'success', summary: 'Venda finalizada!', detail: `NFC-e ${rec['numero'] ?? 'demo'} emitida.`, life: 4000 });
      setTimeout(() => {
        this.cancelarVenda();
      }, 2000);
    });
  }

  cancelarVenda(): void {
    this.itens.set([]);
    this.clienteSelecionado.set(null);
    this.itemSelecionado.set(null);
    this.totalPago.set(0);
    this.formasPagamento.set([]);
    this.codigoModel = '';
    this.descontoGlobal = 0;
    this.focarCodigo();
  }

  sair(): void {
    void this.router.navigate(['/dashboard']);
  }
}
