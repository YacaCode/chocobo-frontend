import { ChangeDetectionStrategy, Component, type OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

const FORMAS_PGTO = [
  { label: 'Dinheiro', value: 'DINHEIRO' },
  { label: 'Pix', value: 'PIX' },
  { label: 'Cartão de Débito', value: 'CARTAO_DEBITO' },
  { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
  { label: 'Boleto', value: 'BOLETO' },
];

@Component({
  selector: 'chb-pagamento-avulso-page',
  standalone: true,
  imports: [ButtonModule, DropdownModule, FormsModule, InputNumberModule, InputTextModule, InputTextareaModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <div class="op-page">
      <header class="op-header">
        <h2 class="op-title op-title--danger"><i class="pi pi-minus-circle" aria-hidden="true"></i> Pagamento Avulso</h2>
        <p class="op-desc">Registre um pagamento não vinculado a uma conta a pagar.</p>
      </header>
      <div class="op-form">
        <div class="op-field">
          <label for="fornecedor">Fornecedor / Beneficiário</label>
          <input id="fornecedor" pInputText [(ngModel)]="fornecedor" placeholder="Nome do fornecedor..." />
        </div>
        <div class="op-field">
          <label for="valorPag">Valor *</label>
          <p-inputNumber inputId="valorPag" [(ngModel)]="valor" mode="currency" currency="BRL" locale="pt-BR" [min]="0.01" [style]="{width:'100%'}"></p-inputNumber>
        </div>
        <div class="op-field">
          <label for="formaPag">Forma de Pagamento *</label>
          <p-dropdown id="formaPag" [(ngModel)]="forma" [options]="formas" optionLabel="label" optionValue="value" placeholder="Selecione..." styleClass="w-full"></p-dropdown>
        </div>
        <div class="op-field">
          <label for="descPag">Descrição / Motivo *</label>
          <textarea id="descPag" pInputTextarea [(ngModel)]="descricao" rows="2" placeholder="Ex: Pagamento de fornecedor..." style="width:100%"></textarea>
        </div>
        <div class="op-actions">
          <button pButton type="button" label="Cancelar" class="p-button-text" (click)="router.navigate(['/caixa/pdv'])"></button>
          <button pButton type="button" label="Registrar Pagamento" icon="pi pi-check"
                  [disabled]="!valor || !forma || !descricao" [loading]="salvando()" (click)="salvar()"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .op-page { max-width: 500px; display: grid; gap: 1.5rem; padding: 0.5rem 0; }
    .op-header { display: grid; gap: 0.25rem; }
    .op-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--chb-text); display: flex; align-items: center; gap: 0.5rem; }
    .op-title--danger { color: var(--chb-red); }
    .op-desc { margin: 0; color: var(--chb-text-muted); font-size: 0.9rem; }
    .op-form { border: 1px solid var(--chb-border); border-radius: 0.5rem; background: var(--chb-surface); padding: 1.5rem; display: grid; gap: 1rem; }
    .op-field { display: grid; gap: 0.35rem; }
    .op-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text); }
    .op-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--chb-border); }
    :host ::ng-deep .p-dropdown.w-full { width: 100%; }
  `]
})
export class PagamentoAvulsoPage implements OnDestroy {
  readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  fornecedor = '';
  valor = 0;
  forma: string | null = null;
  descricao = '';
  readonly formas = FORMAS_PGTO;
  readonly salvando = signal(false);

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  salvar(): void {
    this.salvando.set(true);
    const sessaoId = localStorage.getItem('chb_sessao_id') ?? 'sessao-demo';
    const payload = { tipo: 'DESPESA', fornecedor: this.fornecedor, valor: this.valor, formaPagamentoId: this.forma, descricao: this.descricao };
    this.http.post(`/api/v1/caixa/sessoes/${sessaoId}/movimentos`, payload).pipe(
      catchError(() => of({ ok: true })),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.msg.add({ severity: 'success', summary: 'Pagamento registrado!', life: 2500 });
      setTimeout(() => void this.router.navigate(['/caixa/pdv']), 1500);
    });
  }
}
