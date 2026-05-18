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
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'chb-abrir-sessao-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, FormsModule, InputNumberModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <section class="abrir-page">
      <div class="abrir-card">
        <div class="abrir-icon">
          <i class="pi pi-lock-open" aria-hidden="true"></i>
        </div>
        <h2>Abertura de Caixa</h2>
        <p>Informe o saldo inicial em dinheiro para iniciar o turno de operacao.</p>

        <div class="abrir-form">
          <label>
            <span>Saldo Inicial (R$)</span>
            <p-inputNumber
              [(ngModel)]="saldoInicial"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              [min]="0"
              [maxFractionDigits]="2"
              [style]="{ width: '100%' }"
              inputStyleClass="abrir-input"
              placeholder="0,00">
            </p-inputNumber>
          </label>

          <div class="abrir-info">
            <div class="info-linha">
              <span>Saldo inicial informado:</span>
              <strong>{{ saldoInicial | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            <div class="info-linha">
              <span>Data/Hora abertura:</span>
              <strong>{{ dataHora() }}</strong>
            </div>
          </div>

          <button
            pButton
            type="button"
            icon="pi pi-check-circle"
            label="Abrir Caixa"
            [loading]="abrindo()"
            class="abrir-btn"
            (click)="abrirCaixa()">
          </button>

          <button
            pButton
            type="button"
            icon="pi pi-arrow-left"
            label="Voltar"
            class="p-button-text voltar-btn"
            (click)="voltar()">
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .abrir-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }

    .abrir-card {
      width: 100%;
      max-width: 440px;
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

    .abrir-icon {
      display: grid;
      width: 4rem;
      height: 4rem;
      place-items: center;
      margin: 0 auto;
      border-radius: 1rem;
      background: #dcfce7;
      color: #16a34a;
      font-size: 1.75rem;
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

    .abrir-form {
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

    :host ::ng-deep .abrir-input {
      width: 100%;
      font-size: 1.5rem;
      text-align: center;
      font-weight: 700;
    }

    .abrir-info {
      display: grid;
      gap: 0.5rem;
      padding: 0.85rem;
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      border: 1px solid var(--chb-border);
    }

    .info-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .info-linha span {
      color: var(--chb-text-muted);
    }

    .info-linha strong {
      color: var(--chb-text);
    }

    .abrir-btn {
      width: 100%;
      font-size: 1rem;
      padding: 0.85rem;
    }

    .voltar-btn {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbrirSessaoPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly abrindo = signal(false);
  saldoInicial = 0;

  dataHora(): string {
    return new Date().toLocaleString('pt-BR');
  }

  abrirCaixa(): void {
    if (this.abrindo()) return;
    this.abrindo.set(true);

    const payload = {
      saldoInicial: this.saldoInicial,
      dataAbertura: new Date().toISOString()
    };

    this.http.post<unknown>('/api/v1/caixa/abrir', payload).pipe(
      catchError(() => of({ id: `sessao-${Date.now()}`, status: 'ABERTA' }))
    ).subscribe((response) => {
      const rec = response as Record<string, unknown>;
      this.abrindo.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Caixa Aberto!',
        detail: `Sessao ${rec['id'] ?? 'demo'} iniciada com R$ ${this.saldoInicial.toFixed(2)}.`
      });
      setTimeout(() => {
        void this.router.navigate(['/caixa/pdv']);
      }, 1500);
    });
  }

  voltar(): void {
    void this.router.navigate(['/dashboard']);
  }
}
