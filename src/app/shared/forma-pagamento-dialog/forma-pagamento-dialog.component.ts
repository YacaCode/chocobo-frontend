import { CurrencyPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  type OnChanges,
  Output,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';

export type FormaPagamentoTipo =
  | 'DINHEIRO'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO'
  | 'PIX'
  | 'CHEQUE'
  | 'BOLETO'
  | 'CREDIARIO';

export interface FormaPagamentoSelecionada {
  tipo: FormaPagamentoTipo;
  label: string;
  valor: number;
  parcelas?: number;
  numeroCheque?: string;
}

interface FormaPagamentoOpcao {
  tipo: FormaPagamentoTipo;
  label: string;
  icon: string;
  temParcelas: boolean;
  temCheque: boolean;
}

const FORMAS: FormaPagamentoOpcao[] = [
  { tipo: 'DINHEIRO', label: 'Dinheiro', icon: 'pi pi-wallet', temParcelas: false, temCheque: false },
  { tipo: 'CARTAO_DEBITO', label: 'Cartao Debito', icon: 'pi pi-credit-card', temParcelas: false, temCheque: false },
  { tipo: 'CARTAO_CREDITO', label: 'Cartao Credito', icon: 'pi pi-credit-card', temParcelas: true, temCheque: false },
  { tipo: 'PIX', label: 'PIX', icon: 'pi pi-qrcode', temParcelas: false, temCheque: false },
  { tipo: 'CHEQUE', label: 'Cheque', icon: 'pi pi-file', temParcelas: false, temCheque: true },
  { tipo: 'BOLETO', label: 'Boleto', icon: 'pi pi-barcode', temParcelas: false, temCheque: false },
  { tipo: 'CREDIARIO', label: 'Crediario', icon: 'pi pi-calendar', temParcelas: true, temCheque: false }
];

const PARCELAS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}x`, value: i + 1 }));

interface FormaPagamentoRow {
  opcao: FormaPagamentoOpcao;
  valor: number;
  parcelas: number;
  numeroCheque: string;
  ativa: boolean;
}

@Component({
  selector: 'chb-forma-pagamento-dialog',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DialogModule, DropdownModule, FormsModule, InputNumberModule, NgClass, TagModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '560px' }"
      header="Formas de Pagamento"
      (onHide)="onDialogHide()">

      <div class="pgto-container">
        <div class="pgto-totais">
          <div class="pgto-total-linha">
            <span>Total da venda</span>
            <strong>{{ total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
          <div class="pgto-total-linha">
            <span>Total informado</span>
            <strong [class.valor-ok]="totalInformado() >= total" [class.valor-faltando]="totalInformado() < total">
              {{ totalInformado() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
            </strong>
          </div>
          <div class="pgto-total-linha" [class.troco-positivo]="troco() > 0">
            <span>{{ troco() >= 0 ? 'Troco' : 'Faltando' }}</span>
            <strong>{{ troco() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
        </div>

        <div class="pgto-formas">
          @for (row of rows(); track row.opcao.tipo) {
            <div class="pgto-forma" [class.pgto-forma--ativa]="row.ativa">
              <div class="pgto-forma-header" (click)="toggleForma(row)">
                <div class="pgto-forma-info">
                  <i [class]="row.opcao.icon" aria-hidden="true"></i>
                  <span>{{ row.opcao.label }}</span>
                </div>
                <div class="pgto-forma-valor-wrap" (click)="$event.stopPropagation()">
                  <p-inputNumber
                    [(ngModel)]="row.valor"
                    (ngModelChange)="row.ativa = row.valor > 0; calcularTotal()"
                    mode="currency"
                    currency="BRL"
                    locale="pt-BR"
                    [min]="0"
                    [maxFractionDigits]="2"
                    inputStyleClass="pgto-valor-input"
                    placeholder="0,00">
                  </p-inputNumber>
                </div>
              </div>

              @if (row.ativa && row.opcao.temParcelas) {
                <div class="pgto-extras">
                  <label>Parcelas</label>
                  <p-dropdown
                    [(ngModel)]="row.parcelas"
                    [options]="parcelasOptions"
                    optionLabel="label"
                    optionValue="value"
                    [style]="{ width: '100px' }">
                  </p-dropdown>
                </div>
              }

              @if (row.ativa && row.opcao.temCheque) {
                <div class="pgto-extras">
                  <label>Numero do cheque</label>
                  <input pInputText [(ngModel)]="row.numeroCheque" placeholder="000000" style="width:140px" />
                </div>
              }
            </div>
          }
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="fechar()"></button>
        <button
          pButton
          type="button"
          icon="pi pi-check"
          label="Confirmar Pagamento"
          [disabled]="!pagamentoValido()"
          (click)="confirmar()">
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .pgto-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.25rem 0;
    }

    .pgto-totais {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
    }

    .pgto-total-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
    }

    .pgto-total-linha span {
      color: var(--chb-text-muted);
      font-weight: 600;
    }

    .pgto-total-linha strong {
      font-size: 1.05rem;
    }

    .valor-ok {
      color: #16a34a;
    }

    .valor-faltando {
      color: #dc2626;
    }

    .troco-positivo strong {
      color: #16a34a;
    }

    .pgto-formas {
      display: grid;
      gap: 0.5rem;
    }

    .pgto-forma {
      border: 1px solid var(--chb-border);
      border-radius: 0.5rem;
      background: var(--chb-surface);
      transition: border-color 0.15s;
    }

    .pgto-forma--ativa {
      border-color: var(--chb-yellow);
    }

    .pgto-forma-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
    }

    .pgto-forma-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 700;
      color: var(--chb-text);
    }

    .pgto-forma-info i {
      color: var(--chb-text-muted);
    }

    .pgto-extras {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem 0.75rem;
      border-top: 1px dashed var(--chb-border);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--chb-text-muted);
    }

    :host ::ng-deep .pgto-valor-input {
      width: 130px;
      text-align: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormaPagamentoDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() total = 0;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() pagamentoConfirmado = new EventEmitter<FormaPagamentoSelecionada[]>();

  readonly rows = signal<FormaPagamentoRow[]>([]);
  readonly totalInformado = signal(0);
  readonly troco = computed(() => this.totalInformado() - this.total);
  readonly pagamentoValido = computed(() => this.totalInformado() >= this.total && this.total > 0);
  readonly parcelasOptions = PARCELAS_OPTIONS;

  ngOnChanges(): void {
    if (this.visible) {
      this.inicializar();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.visible) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.fechar();
    }
    if (event.key === 'Enter' && this.pagamentoValido()) {
      event.preventDefault();
      this.confirmar();
    }
  }

  private inicializar(): void {
    const novosRows = FORMAS.map((opcao) => ({
      opcao,
      valor: 0,
      parcelas: 1,
      numeroCheque: '',
      ativa: false
    }));

    // Pre-preenche dinheiro com o total
    if (novosRows[0]) {
      novosRows[0].valor = this.total;
      novosRows[0].ativa = true;
    }

    this.rows.set(novosRows);
    this.calcularTotal();
  }

  toggleForma(row: FormaPagamentoRow): void {
    if (!row.ativa && row.valor === 0) {
      row.valor = Math.max(0, this.total - this.totalInformado() + (row.ativa ? row.valor : 0));
    }
    row.ativa = !row.ativa;
    if (!row.ativa) {
      row.valor = 0;
    }
    this.calcularTotal();
  }

  calcularTotal(): void {
    const total = this.rows().reduce((acc, r) => acc + (r.valor || 0), 0);
    this.totalInformado.set(Math.round(total * 100) / 100);
  }

  onDialogHide(): void {
    this.visibleChange.emit(false);
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  confirmar(): void {
    if (!this.pagamentoValido()) return;

    const formas: FormaPagamentoSelecionada[] = this.rows()
      .filter((r) => r.ativa && r.valor > 0)
      .map((r) => ({
        tipo: r.opcao.tipo,
        label: r.opcao.label,
        valor: r.valor,
        parcelas: r.opcao.temParcelas ? r.parcelas : undefined,
        numeroCheque: r.opcao.temCheque ? r.numeroCheque : undefined
      }));

    this.pagamentoConfirmado.emit(formas);
    this.fechar();
  }
}
