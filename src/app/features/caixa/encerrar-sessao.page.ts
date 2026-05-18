import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'chb-encerrar-sessao-page',
  standalone: true,
  imports: [ButtonModule, CurrencyPipe, FormsModule, InputNumberModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <section class="encerrar-page">
      <div class="encerrar-card">
        <div class="encerrar-icon">
          <i class="pi pi-lock" aria-hidden="true"></i>
        </div>
        <h2>Encerramento de Caixa</h2>
        <p>Confira os valores e registre a contagem final antes de encerrar o turno.</p>

        <div class="encerrar-resumo">
          <div class="resumo-linha">
            <span>Sessao</span>
            <strong>caixa01 / {{ dataHoje() }}</strong>
          </div>
          <div class="resumo-linha">
            <span>Saldo inicial</span>
            <strong>{{ saldoInicial() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
          <div class="resumo-linha">
            <span>Entradas (vendas + suprimentos)</span>
            <strong>{{ totalEntradas() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
          <div class="resumo-linha">
            <span>Saidas (sangrias)</span>
            <strong class="valor-saida">- {{ totalSaidas() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
          <div class="resumo-linha resumo-esperado">
            <span>VALOR ESPERADO</span>
            <strong>{{ valorEsperado() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </div>
        </div>

        <div class="encerrar-form">
          <label>
            <span>Valor Conferido (contagem fisica - R$)</span>
            <p-inputNumber
              [(ngModel)]="valorConferido"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              [min]="0"
              [maxFractionDigits]="2"
              [style]="{ width: '100%' }"
              inputStyleClass="conferido-input"
              placeholder="0,00">
            </p-inputNumber>
          </label>

          <div class="divergencia-wrap" [class.divergencia-ok]="divergencia() === 0" [class.divergencia-erro]="Math.abs(divergencia()) > 0">
            <div class="divergencia-linha">
              <span>Divergencia</span>
              <strong>{{ divergencia() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </div>
            @if (Math.abs(divergencia()) > 0) {
              <small>{{ divergencia() > 0 ? 'Sobra no caixa' : 'Falta no caixa' }}</small>
            } @else {
              <small>Conferencia OK</small>
            }
          </div>

          <button
            pButton
            type="button"
            icon="pi pi-lock"
            label="Confirmar Encerramento"
            [loading]="encerrando()"
            class="encerrar-btn w-full"
            (click)="encerrar()">
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
    .encerrar-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }

    .encerrar-card {
      width: 100%;
      max-width: 480px;
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

    .encerrar-icon {
      display: grid;
      width: 4rem;
      height: 4rem;
      place-items: center;
      margin: 0 auto;
      border-radius: 1rem;
      background: var(--chb-yellow-50);
      color: var(--chb-yellow-700);
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

    .encerrar-resumo {
      display: grid;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      border: 1px solid var(--chb-border);
      text-align: left;
    }

    .resumo-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .resumo-linha span {
      color: var(--chb-text-muted);
    }

    .resumo-linha strong {
      color: var(--chb-text);
    }

    .valor-saida {
      color: #dc2626 !important;
    }

    .resumo-esperado {
      padding-top: 0.5rem;
      border-top: 1px solid var(--chb-border);
      font-size: 1rem;
    }

    .resumo-esperado strong {
      font-size: 1.15rem;
      font-weight: 900;
    }

    .encerrar-form {
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

    :host ::ng-deep .conferido-input {
      width: 100%;
      font-size: 1.4rem;
      text-align: center;
      font-weight: 700;
    }

    .divergencia-wrap {
      display: grid;
      gap: 0.3rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: var(--chb-surface-muted);
      border: 1px solid var(--chb-border);
    }

    .divergencia-ok {
      border-color: #16a34a;
      background: #f0fdf4;
    }

    .divergencia-erro {
      border-color: #dc2626;
      background: #fff1f2;
    }

    .divergencia-linha {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .divergencia-linha span {
      color: var(--chb-text-muted);
      font-size: 0.875rem;
    }

    .divergencia-ok .divergencia-linha strong { color: #16a34a; font-size: 1.1rem; }
    .divergencia-erro .divergencia-linha strong { color: #dc2626; font-size: 1.1rem; }
    .divergencia-ok small { color: #16a34a; font-size: 0.78rem; font-weight: 700; }
    .divergencia-erro small { color: #dc2626; font-size: 0.78rem; font-weight: 700; }

    .w-full {
      width: 100%;
    }

    .encerrar-btn {
      padding: 0.85rem;
      font-size: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EncerrarSessaoPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  protected readonly Math = Math;

  readonly encerrando = signal(false);
  readonly saldoInicial = signal(500);
  readonly totalEntradas = signal(9884);
  readonly totalSaidas = signal(1200);
  readonly valorEsperado = computed(() => this.saldoInicial() + this.totalEntradas() - this.totalSaidas());

  valorConferido = 0;

  readonly divergencia = computed(() => this.valorConferido - this.valorEsperado());

  dataHoje(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  encerrar(): void {
    if (this.encerrando()) return;
    this.encerrando.set(true);

    const payload = {
      valorConferido: this.valorConferido,
      divergencia: this.divergencia(),
      dataEncerramento: new Date().toISOString()
    };

    this.http.post<unknown>('/api/v1/caixa/encerrar', payload).pipe(
      catchError(() => of({ status: 'ENCERRADO' }))
    ).subscribe(() => {
      this.encerrando.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Caixa encerrado!',
        detail: `Divergencia: R$ ${this.divergencia().toFixed(2)}`
      });
      setTimeout(() => {
        void this.router.navigate(['/dashboard']);
      }, 2000);
    });
  }

  voltar(): void {
    void this.router.navigate(['/caixa/operacoes']);
  }
}
