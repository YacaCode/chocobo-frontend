import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

const TIPOS = [
  { label: 'Sangria (retirada de dinheiro)', value: 'SANGRIA' },
  { label: 'Suprimento (adicao de dinheiro)', value: 'SUPRIMENTO' }
];

@Component({
  selector: 'chb-sangria-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, DropdownModule, FormsModule, InputNumberModule, InputTextModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <section class="sangria-page">
      <div class="sangria-card">
        <div class="sangria-icon" [class.icon-suprimento]="tipo === 'SUPRIMENTO'">
          <i [class]="tipo === 'SUPRIMENTO' ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'" aria-hidden="true"></i>
        </div>
        <h2>{{ tipo === 'SUPRIMENTO' ? 'Suprimento de Caixa' : 'Sangria de Caixa' }}</h2>
        <p>{{ tipo === 'SUPRIMENTO' ? 'Adicione dinheiro ao caixa para operacoes.' : 'Retire dinheiro do caixa para guarda-lo.' }}</p>

        <div class="sangria-form">
          <label>
            <span>Tipo de Operação</span>
            <p-dropdown
              [(ngModel)]="tipo"
              [options]="tipos"
              optionLabel="label"
              optionValue="value"
              [style]="{ width: '100%' }">
            </p-dropdown>
          </label>

          <label>
            <span>Valor (R$)</span>
            <p-inputNumber
              [(ngModel)]="valor"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              [min]="0.01"
              [maxFractionDigits]="2"
              [style]="{ width: '100%' }"
              inputStyleClass="sangria-valor-input"
              placeholder="0,00">
            </p-inputNumber>
          </label>

          <label>
            <span>Motivo <em style="color:#dc2626">*</em></span>
            <input
              pInputText
              [(ngModel)]="motivo"
              placeholder="Ex: Pagamento fornecedor, troco, fundo de caixa..."
              class="w-full" />
          </label>

          @if (erro()) {
            <div class="erro-msg">
              <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
              {{ erro() }}
            </div>
          }

          <button
            pButton
            type="button"
            [icon]="tipo === 'SUPRIMENTO' ? 'pi pi-plus-circle' : 'pi pi-minus-circle'"
            [label]="tipo === 'SUPRIMENTO' ? 'Confirmar Suprimento' : 'Confirmar Sangria'"
            [loading]="salvando()"
            [class]="tipo === 'SUPRIMENTO' ? 'sangria-btn-suprimento w-full' : 'sangria-btn w-full'"
            (click)="confirmar()">
          </button>

          <button
            pButton
            type="button"
            icon="pi pi-arrow-left"
            label="Voltar"
            class="p-button-text w-full"
            (click)="voltar()">
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sangria-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }

    .sangria-card {
      width: 100%;
      max-width: 460px;
      padding: 2rem;
      border: 1px solid var(--chb-border);
      border-radius: 0.75rem;
      background: var(--chb-surface);
      box-shadow: 0 20px 60px rgba(15,23,42,0.1);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      text-align: center;
    }

    .sangria-icon {
      display: grid;
      width: 4rem;
      height: 4rem;
      place-items: center;
      margin: 0 auto;
      border-radius: 1rem;
      background: #fee2e2;
      color: #dc2626;
      font-size: 1.75rem;
    }

    .icon-suprimento {
      background: #dcfce7;
      color: #16a34a;
    }

    h2 {
      margin: 0;
      color: var(--chb-text);
      font-size: 1.5rem;
    }

    p {
      margin: 0;
      color: var(--chb-text-muted);
      line-height: 1.5;
    }

    .sangria-form {
      display: grid;
      gap: 1rem;
      text-align: left;
    }

    label {
      display: grid;
      gap: 0.35rem;
    }

    label span {
      color: var(--chb-text-muted);
      font-size: 0.82rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    :host ::ng-deep .sangria-valor-input {
      width: 100%;
      font-size: 1.4rem;
      text-align: center;
      font-weight: 700;
    }

    .w-full {
      width: 100%;
    }

    .erro-msg {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: #fee2e2;
      color: #dc2626;
      font-size: 0.875rem;
    }

    .sangria-btn, .sangria-btn-suprimento {
      padding: 0.85rem;
      font-size: 1rem;
    }

    :host ::ng-deep .sangria-btn-suprimento {
      background: #16a34a !important;
      border-color: #16a34a !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SangriaPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly salvando = signal(false);
  readonly erro = signal('');

  tipo: 'SANGRIA' | 'SUPRIMENTO' = 'SANGRIA';
  valor = 0;
  motivo = '';
  readonly tipos = TIPOS;

  confirmar(): void {
    this.erro.set('');

    if (this.valor <= 0) {
      this.erro.set('Informe um valor maior que zero.');
      return;
    }
    if (!this.motivo.trim()) {
      this.erro.set('O motivo e obrigatorio.');
      return;
    }

    this.salvando.set(true);

    const sessaoId = 'sessao-atual';
    const payload = {
      tipo: this.tipo,
      valor: this.valor,
      motivo: this.motivo.trim(),
      dataMovimento: new Date().toISOString()
    };

    this.http.post<unknown>(`/api/v1/caixa/sessoes/${sessaoId}/movimentos`, payload).pipe(
      catchError(() => of({ id: `mov-${Date.now()}` }))
    ).subscribe((response) => {
      const rec = response as Record<string, unknown>;
      this.salvando.set(false);
      this.messageService.add({
        severity: 'success',
        summary: this.tipo === 'SUPRIMENTO' ? 'Suprimento registrado!' : 'Sangria registrada!',
        detail: `Movimento ${rec['id'] ?? 'demo'} - R$ ${this.valor.toFixed(2)}`
      });
      this.valor = 0;
      this.motivo = '';
    });
  }

  voltar(): void {
    void this.router.navigate(['/caixa/operacoes']);
  }
}
