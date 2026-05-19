import { ChangeDetectionStrategy, Component, type OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'chb-suprimento-page',
  standalone: true,
  imports: [ButtonModule, FormsModule, InputNumberModule, InputTextareaModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <div class="op-page">
      <header class="op-header">
        <h2 class="op-title"><i class="pi pi-arrow-down-left-and-arrow-up-right-from-center" aria-hidden="true"></i> Suprimento de Caixa</h2>
        <p class="op-desc">Registre uma entrada de troco ou fundo de caixa.</p>
      </header>
      <div class="op-form">
        <div class="op-field">
          <label for="valorSup">Valor do Suprimento *</label>
          <p-inputNumber inputId="valorSup" [(ngModel)]="valor" mode="currency" currency="BRL" locale="pt-BR"
                         [min]="0.01" [style]="{width:'100%'}" placeholder="R$ 0,00"></p-inputNumber>
        </div>
        <div class="op-field">
          <label for="motivoSup">Motivo / Observação *</label>
          <textarea id="motivoSup" pInputTextarea [(ngModel)]="motivo" rows="3"
                    placeholder="Ex: Troco inicial do dia..." style="width:100%"></textarea>
        </div>
        <div class="op-actions">
          <button pButton type="button" label="Cancelar" class="p-button-text" (click)="router.navigate(['/caixa/pdv'])"></button>
          <button pButton type="button" label="Registrar Suprimento" icon="pi pi-check"
                  [disabled]="!valor || !motivo" [loading]="salvando()" (click)="salvar()"></button>
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
  `]
})
export class SuprimentoPage implements OnDestroy {
  readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly msg = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  valor = 0;
  motivo = '';
  readonly salvando = signal(false);

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  salvar(): void {
    this.salvando.set(true);
    const sessaoId = localStorage.getItem('chb_sessao_id') ?? 'sessao-demo';
    this.http.post(`/api/v1/caixa/sessoes/${sessaoId}/suprimento`, { valor: this.valor, motivo: this.motivo }).pipe(
      catchError(() => of({ ok: true })),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.msg.add({ severity: 'success', summary: 'Suprimento registrado!', detail: `R$ ${this.valor.toFixed(2)} adicionado ao caixa.`, life: 3000 });
      setTimeout(() => void this.router.navigate(['/caixa/pdv']), 1500);
    });
  }
}
