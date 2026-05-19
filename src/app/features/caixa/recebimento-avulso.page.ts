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

import { ClienteBuscaDialogComponent, type ClienteItem } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';

const FORMAS_PGTO = [
  { label: 'Dinheiro', value: 'DINHEIRO' },
  { label: 'Pix', value: 'PIX' },
  { label: 'Cartão de Débito', value: 'CARTAO_DEBITO' },
  { label: 'Cartão de Crédito', value: 'CARTAO_CREDITO' },
  { label: 'Boleto', value: 'BOLETO' },
];

@Component({
  selector: 'chb-recebimento-avulso-page',
  standalone: true,
  imports: [ButtonModule, ClienteBuscaDialogComponent, DropdownModule, FormsModule, InputNumberModule, InputTextModule, InputTextareaModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <chb-cliente-busca-dialog
      [(visible)]="showClienteDialog"
      (clienteSelecionado)="onClienteSelecionado($event)">
    </chb-cliente-busca-dialog>

    <div class="op-page">
      <header class="op-header">
        <h2 class="op-title"><i class="pi pi-plus-circle" aria-hidden="true"></i> Recebimento Avulso</h2>
        <p class="op-desc">Registre um recebimento não vinculado a uma pré-venda.</p>
      </header>
      <div class="op-form">
        <div class="op-field">
          <label for="cliente">Cliente / Pagador</label>
          <div class="cliente-picker">
            <input id="cliente" pInputText [ngModel]="clienteSelecionado()?.razaoSocial ?? ''" readonly placeholder="Selecione o cliente..." />
            <button pButton type="button" icon="pi pi-search" class="p-button-outlined" aria-label="Buscar cliente" (click)="showClienteDialog = true"></button>
          </div>
        </div>
        <div class="op-field">
          <label for="valorRec">Valor *</label>
          <p-inputNumber inputId="valorRec" [(ngModel)]="valor" mode="currency" currency="BRL" locale="pt-BR" [min]="0.01" [style]="{width:'100%'}"></p-inputNumber>
        </div>
        <div class="op-field">
          <label for="formaRec">Forma de Pagamento *</label>
          <p-dropdown id="formaRec" [(ngModel)]="forma" [options]="formas" optionLabel="label" optionValue="value" placeholder="Selecione..." styleClass="w-full"></p-dropdown>
        </div>
        <div class="op-field">
          <label for="descRec">Descrição / Motivo *</label>
          <textarea id="descRec" pInputTextarea [(ngModel)]="descricao" rows="2" placeholder="Ex: Pagamento de parcela..." style="width:100%"></textarea>
        </div>
        <div class="op-actions">
          <button pButton type="button" label="Cancelar" class="p-button-text" (click)="router.navigate(['/caixa/pdv'])"></button>
          <button pButton type="button" label="Registrar Recebimento" icon="pi pi-check"
                  [disabled]="!clienteSelecionado() || !valor || !forma || !descricao" [loading]="salvando()" (click)="salvar()"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .op-page { max-width: 500px; display: grid; gap: 1.5rem; padding: 0.5rem 0; }
    .op-header { display: grid; gap: 0.25rem; }
    .op-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--chb-text); display: flex; align-items: center; gap: 0.5rem; }
    .op-desc { margin: 0; color: var(--chb-text-muted); font-size: 0.9rem; }
    .op-form { border: 1px solid var(--chb-border); border-radius: 0.5rem; background: var(--chb-surface); padding: 1.5rem; display: grid; gap: 1rem; }
    .op-field { display: grid; gap: 0.35rem; }
    .op-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text); }
    .op-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--chb-border); }
    .cliente-picker { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.5rem; }
    :host ::ng-deep .p-dropdown.w-full { width: 100%; }
  `]
})
export class RecebimentoAvulsoPage implements OnDestroy {
  readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  showClienteDialog = false;
  readonly clienteSelecionado = signal<ClienteItem | null>(null);
  valor = 0;
  forma: string | null = null;
  descricao = '';
  readonly formas = FORMAS_PGTO;
  readonly salvando = signal(false);

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onClienteSelecionado(cliente: ClienteItem): void {
    this.clienteSelecionado.set(cliente);
  }

  salvar(): void {
    this.salvando.set(true);
    const sessaoId = localStorage.getItem('chb_sessao_id') ?? 'sessao-demo';
    const payload = {
      tipo: 'RECEITA',
      clienteId: this.clienteSelecionado()?.id ?? null,
      valor: this.valor,
      formaPagamentoId: this.forma,
      descricao: this.descricao
    };
    this.http.post(`/api/v1/caixa/sessoes/${sessaoId}/movimentos`, payload).pipe(
      catchError(() => of({ ok: true })),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.msg.add({ severity: 'success', summary: 'Recebimento registrado!', life: 2500 });
      setTimeout(() => void this.router.navigate(['/caixa/pdv']), 1500);
    });
  }
}
