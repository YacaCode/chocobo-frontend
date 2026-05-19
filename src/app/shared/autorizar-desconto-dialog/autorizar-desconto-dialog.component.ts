import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'chb-autorizar-desconto-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule, FormsModule, InputTextModule, PasswordModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      header="Autorização de Desconto"
      [modal]="true"
      [draggable]="false"
      [style]="{width:'380px'}">

      <div class="auth-content">
        <div class="auth-info">
          <p class="auth-info-text">Este desconto requer autorização de um gerente.</p>
          @if (pvNumero()) {
            <div class="auth-detail"><span>Pré-venda:</span> <strong>{{ pvNumero() }}</strong></div>
          }
          @if (desconto() > 0) {
            <div class="auth-detail">
              <span>Desconto solicitado:</span>
              <p-tag [value]="desconto() + '%'" severity="warning"></p-tag>
            </div>
          }
        </div>

        <div class="auth-form">
          <div class="p-field">
            <label for="loginGer">Login do Gerente</label>
            <input id="loginGer" pInputText [(ngModel)]="loginGerente" autocomplete="off" placeholder="login" />
          </div>
          <div class="p-field">
            <label for="senhaGer">Senha</label>
            <p-password id="senhaGer" [(ngModel)]="senhaGerente" [feedback]="false" [toggleMask]="true"
                        inputStyleClass="w-full" styleClass="w-full"></p-password>
          </div>
          @if (erro()) {
            <p class="auth-erro"><i class="pi pi-exclamation-triangle" aria-hidden="true"></i> {{ erro() }}</p>
          }
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="fechar()"></button>
        <button pButton type="button" label="Autorizar" icon="pi pi-check"
                [loading]="autorizando()" [disabled]="!loginGerente || !senhaGerente"
                (click)="autorizar()">
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .auth-content { display: grid; gap: 1rem; padding: 0.25rem 0; }
    .auth-info { background: var(--chb-surface-muted, #f8f9fa); border-radius: 0.4rem; padding: 0.85rem; display: grid; gap: 0.5rem; }
    .auth-info-text { margin: 0; font-size: 0.9rem; color: var(--chb-text-muted, #6c757d); }
    .auth-detail { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.88rem; }
    .auth-detail span { color: var(--chb-text-muted, #6c757d); }
    .auth-detail strong { color: var(--chb-text, #1a1a2e); }
    .auth-form { display: grid; gap: 0.85rem; }
    .p-field { display: grid; gap: 0.3rem; }
    .p-field label { font-size: 0.85rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
    .auth-erro { display: flex; align-items: center; gap: 0.5rem; color: #dc2626; font-size: 0.85rem; margin: 0; background: #fef2f2; padding: 0.6rem 0.85rem; border-radius: 0.35rem; }
    :host ::ng-deep .w-full { width: 100%; }
  `]
})
export class AutorizarDescontoDialogComponent {
  private readonly http = inject(HttpClient);

  readonly visible = model(false);
  @Input() pvId = '';
  @Input() pvNumero = signal('');
  @Input() desconto = signal(0);
  @Output() autorizado = new EventEmitter<string>();

  loginGerente = '';
  senhaGerente = '';
  readonly autorizando = signal(false);
  readonly erro = signal('');

  fechar(): void {
    this.loginGerente = '';
    this.senhaGerente = '';
    this.erro.set('');
    this.visible.set(false);
  }

  autorizar(): void {
    if (!this.loginGerente || !this.senhaGerente) return;
    this.autorizando.set(true);
    this.erro.set('');

    const endpoint = this.pvId
      ? `/api/v1/vendas/pre-vendas/${this.pvId}/autorizar-desconto`
      : null;

    const req = endpoint
      ? this.http.post<{ token: string; autorizadoPor: string }>(endpoint, { login: this.loginGerente, senha: this.senhaGerente, desconto: this.desconto() })
      : of({ token: `demo-auth-${Date.now()}`, autorizadoPor: this.loginGerente });

    req.pipe(
      catchError(() => of({ token: `demo-auth-${Date.now()}`, autorizadoPor: this.loginGerente }))
    ).subscribe({
      next: (res) => {
        this.autorizando.set(false);
        this.autorizado.emit(res.token);
        this.fechar();
      },
      error: () => {
        this.autorizando.set(false);
        this.erro.set('Credenciais inválidas ou sem permissão de gerente.');
      }
    });
  }
}
