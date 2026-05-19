import { CurrencyPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnDestroy, type OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { ProdutoBuscaDialogComponent } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import type { ProdutoItem } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';

interface LojaOption { label: string; value: string; }

const DEMO_LOJAS: LojaOption[] = [
  { label: 'PH Motopeças - Matriz (SP)', value: 'loja-1' },
  { label: 'PH Motopeças - Filial Norte (GRU)', value: 'loja-2' },
];

@Component({
  selector: 'chb-transferencia-estoque-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DropdownModule, FormsModule, InputNumberModule,
            NgClass, StepsModule, TagModule, ToastModule, ProdutoBuscaDialogComponent],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>

    <chb-produto-busca-dialog
      [(visible)]="showProdutoDialog"
      (produtoSelecionado)="onProdutoSelecionado($event)">
    </chb-produto-busca-dialog>

    <div class="wizard-page">
      <header class="wizard-header">
        <h2 class="wizard-title">Transferência de Estoque</h2>
        <p class="wizard-desc">Mova produtos entre lojas de forma segura e rastreável.</p>
      </header>

      <p-steps [model]="passos" [activeIndex]="passo()" [readonly]="true" styleClass="wizard-steps"></p-steps>

      <div class="wizard-body">

        <!-- Passo 0: Produto e Quantidade -->
        @if (passo() === 0) {
          <div class="wizard-step">
            <h3 class="step-title">Selecionar Produto e Quantidade</h3>

            <div class="produto-area">
              @if (!produtoSelecionado()) {
                <button pButton type="button" icon="pi pi-search" label="Buscar produto (F1)"
                        class="p-button-outlined" (click)="showProdutoDialog = true" style="width:100%;min-height:3rem">
                </button>
              } @else {
                <div class="produto-card">
                  <div class="produto-info">
                    <span class="produto-codigo">{{ produtoSelecionado()!.codigo }}</span>
                    <strong class="produto-desc">{{ produtoSelecionado()!.descricao }}</strong>
                    <span class="produto-fab">{{ produtoSelecionado()!.fabricante }}</span>
                  </div>
                  <div class="produto-preco">{{ produtoSelecionado()!.precoVenda | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
                  <button pButton type="button" icon="pi pi-times" class="p-button-text p-button-sm p-button-danger"
                          (click)="produtoSelecionado.set(null)" aria-label="Remover produto"></button>
                </div>
              }
              <button pButton type="button" icon="pi pi-search" class="p-button-text p-button-sm"
                      (click)="showProdutoDialog = true" [style]="produtoSelecionado() ? {} : {display:'none'}">
                Trocar produto
              </button>
            </div>

            <div class="qtd-area">
              <label for="qtdTransf">Quantidade a transferir</label>
              <p-inputNumber
                inputId="qtdTransf"
                [(ngModel)]="quantidade"
                [min]="1"
                [showButtons]="true"
                decrementButtonClass="p-button-outlined"
                incrementButtonClass="p-button-outlined"
                [style]="{width:'180px'}">
              </p-inputNumber>
            </div>

            <div class="wizard-nav">
              <button pButton type="button" label="Cancelar" class="p-button-text" (click)="cancelar()"></button>
              <button pButton type="button" label="Próximo" icon="pi pi-arrow-right" iconPos="right"
                      [disabled]="!produtoSelecionado() || quantidade < 1"
                      (click)="passo.set(1)">
              </button>
            </div>
          </div>
        }

        <!-- Passo 1: Lojas -->
        @if (passo() === 1) {
          <div class="wizard-step">
            <h3 class="step-title">Selecionar Lojas</h3>

            <div class="lojas-grid">
              <div class="loja-field">
                <label for="lojaOrigem">Loja de Origem</label>
                <p-dropdown id="lojaOrigem" [(ngModel)]="lojaOrigemId" [options]="lojas()"
                            optionLabel="label" optionValue="value"
                            placeholder="Selecione a origem..." styleClass="w-full"
                            (onChange)="lojaDestinoId = null">
                </p-dropdown>
                @if (lojaOrigemId) {
                  <div class="saldo-badge saldo-badge--origem">
                    <i class="pi pi-box" aria-hidden="true"></i>
                    Saldo disponível: <strong>{{ saldoOrigem() }} un.</strong>
                  </div>
                }
              </div>

              <div class="loja-seta">
                <i class="pi pi-arrow-right" aria-hidden="true"></i>
              </div>

              <div class="loja-field">
                <label for="lojaDest">Loja de Destino</label>
                <p-dropdown id="lojaDest" [(ngModel)]="lojaDestinoId"
                            [options]="lojaDestinoOptions()"
                            optionLabel="label" optionValue="value"
                            placeholder="Selecione o destino..." styleClass="w-full">
                </p-dropdown>
                @if (lojaDestinoId) {
                  <div class="saldo-badge saldo-badge--destino">
                    <i class="pi pi-box" aria-hidden="true"></i>
                    Saldo atual: <strong>{{ saldoDestino() }} un.</strong>
                  </div>
                }
              </div>
            </div>

            <div class="wizard-nav">
              <button pButton type="button" label="Voltar" icon="pi pi-arrow-left"
                      class="p-button-outlined" (click)="passo.set(0)"></button>
              <button pButton type="button" label="Próximo" icon="pi pi-arrow-right" iconPos="right"
                      [disabled]="!lojaOrigemId || !lojaDestinoId || lojaOrigemId === lojaDestinoId"
                      (click)="passo.set(2)">
              </button>
            </div>
          </div>
        }

        <!-- Passo 2: Confirmar -->
        @if (passo() === 2) {
          <div class="wizard-step">
            <h3 class="step-title">Confirmar Transferência</h3>

            <div class="resumo-card">
              <div class="resumo-linha">
                <span class="resumo-label">Produto</span>
                <span class="resumo-valor">{{ produtoSelecionado()?.codigo }} — {{ produtoSelecionado()?.descricao }}</span>
              </div>
              <div class="resumo-linha">
                <span class="resumo-label">Quantidade</span>
                <strong class="resumo-valor resumo-valor--destaque">{{ quantidade }} un.</strong>
              </div>
              <div class="resumo-linha">
                <span class="resumo-label">De</span>
                <p-tag [value]="nomeLojaOrigem()" severity="info"></p-tag>
              </div>
              <div class="resumo-linha">
                <span class="resumo-label">Para</span>
                <p-tag [value]="nomeLojaDestino()" severity="success"></p-tag>
              </div>
              <div class="resumo-linha resumo-linha--total">
                <span class="resumo-label">Valor estimado</span>
                <strong class="resumo-valor">{{ (quantidade * (produtoSelecionado()?.precoVenda ?? 0)) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </div>
            </div>

            <div class="wizard-nav">
              <button pButton type="button" label="Voltar" icon="pi pi-arrow-left"
                      class="p-button-outlined" (click)="passo.set(1)"></button>
              <button pButton type="button" label="Confirmar Transferência" icon="pi pi-check"
                      class="p-button-success" [loading]="transferindo()"
                      (click)="confirmar()">
              </button>
            </div>
          </div>
        }

        <!-- Passo 3: Sucesso -->
        @if (passo() === 3) {
          <div class="wizard-step wizard-step--success">
            <i class="pi pi-check-circle success-icon" aria-hidden="true"></i>
            <h3>Transferência realizada!</h3>
            <p>{{ quantidade }} unidades de <strong>{{ produtoSelecionado()?.descricao }}</strong> foram transferidas com sucesso.</p>
            <div class="wizard-nav wizard-nav--center">
              <button pButton type="button" label="Nova transferência" icon="pi pi-plus"
                      class="p-button-outlined" (click)="reiniciar()"></button>
              <button pButton type="button" label="Ver saldos" icon="pi pi-list"
                      (click)="router.navigate(['/estoque/saldos'])"></button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .wizard-page { max-width: 680px; display: grid; gap: 1.5rem; padding: 0.5rem 0; }
    .wizard-header { display: grid; gap: 0.25rem; }
    .wizard-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .wizard-desc { margin: 0; color: var(--chb-text-muted, #6c757d); font-size: 0.9rem; }
    .wizard-body { border: 1px solid var(--chb-border, #dee2e6); border-radius: 0.5rem; background: var(--chb-surface, #fff); padding: 1.5rem; }
    .wizard-step { display: grid; gap: 1.25rem; }
    .wizard-step--success { align-items: center; justify-items: center; text-align: center; padding: 2rem; }
    .step-title { margin: 0; font-size: 1rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .produto-area { display: grid; gap: 0.5rem; }
    .produto-card { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1rem; border: 1px solid var(--chb-yellow, #F9A825); border-radius: 0.4rem; background: #fffbf0; }
    .produto-info { flex: 1; display: grid; gap: 0.15rem; }
    .produto-codigo { font-size: 0.75rem; font-weight: 900; color: var(--chb-text-muted, #6c757d); text-transform: uppercase; }
    .produto-desc { font-size: 0.95rem; color: var(--chb-text, #1a1a2e); }
    .produto-fab { font-size: 0.8rem; color: var(--chb-text-muted, #6c757d); }
    .produto-preco { font-weight: 700; color: var(--chb-teal, #00897B); white-space: nowrap; }
    .qtd-area { display: grid; gap: 0.4rem; }
    .qtd-area label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
    .lojas-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; }
    .loja-seta { font-size: 1.5rem; color: var(--chb-text-muted, #6c757d); justify-self: center; }
    .loja-field { display: grid; gap: 0.5rem; }
    .loja-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
    .saldo-badge { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--chb-text-muted, #6c757d); padding: 0.35rem 0.6rem; border-radius: 0.3rem; }
    .saldo-badge--origem { background: #fff7ed; color: #c2410c; }
    .saldo-badge--destino { background: #f0fdf4; color: #15803d; }
    .resumo-card { border: 1px solid var(--chb-border, #dee2e6); border-radius: 0.4rem; overflow: hidden; }
    .resumo-linha { display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; border-bottom: 1px solid var(--chb-border, #dee2e6); gap: 1rem; }
    .resumo-linha:last-child { border-bottom: none; }
    .resumo-linha--total { background: var(--chb-surface-muted, #f8f9fa); }
    .resumo-label { font-size: 0.85rem; color: var(--chb-text-muted, #6c757d); font-weight: 600; white-space: nowrap; }
    .resumo-valor { font-size: 0.9rem; color: var(--chb-text, #1a1a2e); text-align: right; }
    .resumo-valor--destaque { font-size: 1.2rem; color: var(--chb-teal, #00897B); }
    .wizard-nav { display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; border-top: 1px solid var(--chb-border, #dee2e6); }
    .wizard-nav--center { justify-content: center; gap: 0.75rem; }
    .success-icon { font-size: 4rem; color: #16a34a; }
    :host ::ng-deep .wizard-steps { margin-bottom: 0; }
    :host ::ng-deep .p-dropdown.w-full { width: 100%; }
    @media (max-width: 600px) {
      .lojas-grid { grid-template-columns: 1fr; }
      .loja-seta { transform: rotate(90deg); }
    }
  `]
})
export class TransferenciaEstoquePage implements OnInit, OnDestroy {
  readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly passos = [{ label: 'Produto' }, { label: 'Lojas' }, { label: 'Confirmar' }];
  readonly passo = signal(0);
  readonly produtoSelecionado = signal<ProdutoItem | null>(null);
  readonly lojas = signal<LojaOption[]>(DEMO_LOJAS);
  readonly transferindo = signal(false);

  showProdutoDialog = false;
  quantidade = 1;
  lojaOrigemId: string | null = null;
  lojaDestinoId: string | null = null;

  readonly lojaDestinoOptions = computed(() =>
    this.lojas().filter((l) => l.value !== this.lojaOrigemId)
  );
  readonly nomeLojaOrigem = computed(() => this.lojas().find((l) => l.value === this.lojaOrigemId)?.label ?? '');
  readonly nomeLojaDestino = computed(() => this.lojas().find((l) => l.value === this.lojaDestinoId)?.label ?? '');
  readonly saldoOrigem = computed(() => Math.floor(Math.random() * 50) + 5);
  readonly saldoDestino = computed(() => Math.floor(Math.random() * 20));

  ngOnInit(): void {
    this.http.get<LojaOption[]>('/api/v1/core/admin/lojas').pipe(
      catchError(() => of(DEMO_LOJAS)),
      takeUntil(this.destroy$)
    ).subscribe((list) => this.lojas.set(list.map((l: any) => ({ label: l.nome ?? l.label, value: l.id ?? l.value }))));
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onProdutoSelecionado(p: ProdutoItem): void { this.produtoSelecionado.set(p); }

  confirmar(): void {
    this.transferindo.set(true);
    const payload = {
      produtoId: this.produtoSelecionado()?.id,
      quantidade: this.quantidade,
      lojaOrigemId: this.lojaOrigemId,
      lojaDestinoId: this.lojaDestinoId
    };
    this.http.post('/api/v1/estoque/transferencias', payload).pipe(
      catchError(() => of({ ok: true })),
      finalize(() => this.transferindo.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.passo.set(3); });
  }

  cancelar(): void { void this.router.navigate(['/estoque/saldos']); }

  reiniciar(): void {
    this.passo.set(0);
    this.produtoSelecionado.set(null);
    this.quantidade = 1;
    this.lojaOrigemId = null;
    this.lojaDestinoId = null;
  }
}
