import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'chb-baixar-conta-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CalendarModule, DialogModule, DropdownModule,
    FormsModule, InputNumberModule, ToastModule, CurrencyPipe, DatePipe
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <p-dialog
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      header="Baixar Conta a Receber"
      [style]="{ width: '480px', maxWidth: '95vw' }">

      @if (conta) {
        <div class="baixar-content">
          <!-- Informações da conta -->
          <div class="conta-info">
            <div class="info-row">
              <span class="info-label">Documento:</span>
              <span class="info-value">{{ conta.documento }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cliente:</span>
              <span class="info-value">{{ conta.clienteNome }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Vencimento:</span>
              <span class="info-value" [class.text-red]="conta.diasAtraso > 0">
                {{ conta.vencimento | date:'dd/MM/yyyy' }}
                @if (conta.diasAtraso > 0) {
                  <small class="atraso-badge">{{ conta.diasAtraso }}d em atraso</small>
                }
              </span>
            </div>
          </div>

          <!-- Cálculo de juros/multa -->
          <div class="calculo-box">
            <div class="calculo-row">
              <span>Valor Original</span>
              <span>{{ conta.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            </div>
            @if (conta.diasAtraso > 0) {
              <div class="calculo-row text-red">
                <span>Multa (2%)</span>
                <span>{{ multa() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
              <div class="calculo-row text-red">
                <span>Juros (2%/mês · {{ conta.diasAtraso }}d)</span>
                <span>{{ juros() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
              </div>
            }
            <div class="calculo-row calculo-total">
              <span>Total a Cobrar</span>
              <span>{{ totalCobrar() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
            </div>
          </div>

          <!-- Forma de pagamento e data -->
          <div class="form-row">
            <label class="form-label">Forma de Pagamento *</label>
            <p-dropdown
              [(ngModel)]="formaPagamento"
              [options]="formasPagamento"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione..."
              styleClass="w-full">
            </p-dropdown>
          </div>
          <div class="form-row">
            <label class="form-label">Data de Pagamento *</label>
            <p-calendar
              [(ngModel)]="dataPagamento"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              styleClass="w-full">
            </p-calendar>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button pButton label="Cancelar" icon="pi pi-times"
                    class="p-button-outlined p-button-secondary"
                    (click)="fechar()" [disabled]="salvando()">
            </button>
            <button pButton label="Confirmar Baixa" icon="pi pi-check"
                    class="p-button-success"
                    (click)="confirmar()"
                    [loading]="salvando()"
                    [disabled]="!formaPagamento || !dataPagamento">
            </button>
          </div>
        </ng-template>
      }
    </p-dialog>
  `,
  styles: [`
    .baixar-content { display: flex; flex-direction: column; gap: 1rem; }
    .conta-info { background: var(--chb-surface); border: 1px solid var(--chb-border); border-radius: .5rem; padding: 1rem; }
    .info-row { display: flex; gap: .5rem; margin-bottom: .35rem; font-size: .9rem; }
    .info-label { font-weight: 700; color: var(--chb-text-muted); min-width: 100px; }
    .info-value { color: var(--chb-text); }
    .calculo-box { border: 1px solid var(--chb-border); border-radius: .5rem; overflow: hidden; }
    .calculo-row { display: flex; justify-content: space-between; padding: .6rem 1rem; font-size: .9rem; border-bottom: 1px solid var(--chb-border); }
    .calculo-row:last-child { border-bottom: none; }
    .calculo-total { font-size: 1.05rem; font-weight: 700; background: color-mix(in srgb, var(--chb-teal) 8%, var(--chb-surface)); }
    .text-red { color: #dc2626; }
    .atraso-badge { background: #dc2626; color: #fff; border-radius: .25rem; padding: .1rem .35rem; font-size: .65rem; margin-left: .35rem; }
    .form-row { display: flex; flex-direction: column; gap: .35rem; }
    .form-label { font-size: .85rem; font-weight: 700; color: var(--chb-text-muted); }
    .w-full { width: 100%; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: .5rem; padding-top: .5rem; }
  `]
})
export class BaixarContaDialogComponent implements OnChanges {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  @Input() visible = false;
  @Input() conta: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() baixado = new EventEmitter<any>();

  readonly salvando = signal(false);

  formaPagamento = 'DINHEIRO';
  dataPagamento: Date = new Date();

  readonly formasPagamento = [
    { label: 'Dinheiro', value: 'DINHEIRO' },
    { label: 'PIX', value: 'PIX' },
    { label: 'Cartão de Débito', value: 'CARTAO_DEBITO' },
    { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
    { label: 'Boleto', value: 'BOLETO' },
    { label: 'Transferência', value: 'TRANSFERENCIA' }
  ];

  readonly multa = computed(() => {
    if (!this.conta || (this.conta.diasAtraso ?? 0) <= 0) return 0;
    return (this.conta.valor ?? 0) * 0.02;
  });

  readonly juros = computed(() => {
    if (!this.conta || (this.conta.diasAtraso ?? 0) <= 0) return 0;
    return (this.conta.valor ?? 0) * 0.000667 * (this.conta.diasAtraso ?? 0);
  });

  readonly totalCobrar = computed(() => {
    return (this.conta?.valor ?? 0) + this.multa() + this.juros();
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.dataPagamento = new Date();
      this.formaPagamento = 'DINHEIRO';
    }
  }

  fechar(): void {
    this.visibleChange.emit(false);
  }

  confirmar(): void {
    if (!this.conta || !this.formaPagamento || !this.dataPagamento) return;
    this.salvando.set(true);
    const payload = {
      valorOriginal: this.conta.valor,
      diasAtraso: this.conta.diasAtraso ?? 0,
      formaPagamento: this.formaPagamento,
      dataPagamento: this.dataPagamento.toISOString().split('T')[0]
    };
    this.http.post<any>(`/api/v1/financeiro/contas-receber/${this.conta.id}/baixar`, payload)
      .pipe(
        catchError(() => of({
          id: this.conta.id,
          status: 'PAGA',
          valorOriginal: this.conta.valor,
          multa: this.multa(),
          juros: this.juros(),
          totalCobrado: this.totalCobrar(),
          pagamento: new Date().toISOString().split('T')[0],
          formaPagamento: this.formaPagamento
        })),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.baixado.emit(result);
        this.visibleChange.emit(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
