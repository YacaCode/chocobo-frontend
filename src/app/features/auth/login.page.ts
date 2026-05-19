import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'chb-login-page',
  standalone: true,
  imports: [ButtonModule, FormsModule, InputTextModule, NgClass],
  template: `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="login-title">
        <span class="auth-card__accent" aria-hidden="true"></span>

        <header class="auth-card__brand">
          <span class="auth-card__mark" aria-hidden="true">C</span>
          <div>
            <p>Chocobo</p>
            <h1 id="login-title">Acesso operacional</h1>
          </div>
        </header>

        <form class="auth-form" (ngSubmit)="submit()">
          <label class="auth-field">
            <span>Servidor</span>
            <span class="field-control p-input-icon-left">
              <i class="pi pi-server" aria-hidden="true"></i>
              <input
                pInputText
                type="text"
                autocomplete="url"
                name="server"
                [ngModel]="serverUrl()"
                (ngModelChange)="serverUrl.set($event)" />
            </span>
          </label>

          <label class="auth-field">
            <span>Usuario</span>
            <span class="field-control p-input-icon-left">
              <i class="pi pi-user" aria-hidden="true"></i>
              <input
                pInputText
                type="text"
                autocomplete="username"
                name="username"
                [ngModel]="username()"
                (ngModelChange)="username.set($event)" />
            </span>
          </label>

          <label class="auth-field">
            <span>Senha</span>
            <span class="field-control p-input-icon-left">
              <i class="pi pi-lock" aria-hidden="true"></i>
              <input
                pInputText
                type="password"
                autocomplete="current-password"
                name="password"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)" />
            </span>
          </label>

          @if (message(); as currentMessage) {
            <p class="auth-form__message" [ngClass]="{ 'auth-form__message--error': hasError() }">
              {{ currentMessage }}
            </p>
          }

          <button
            pButton
            type="submit"
            icon="pi pi-arrow-right"
            iconPos="right"
            label="Entrar"
            class="auth-submit"
            [loading]="loading()">
          </button>
        </form>

        <footer class="auth-card__foot">
          <span><i class="pi pi-key"></i> admin / Admin&#64;123</span>
          <span><i class="pi pi-desktop"></i> Desktop</span>
        </footer>
      </section>
    </main>
  `,
  styles: [`
    .auth-page {
      display: grid;
      min-height: 100vh;
      place-items: center;
      background:
        linear-gradient(90deg, color-mix(in srgb, var(--chb-text) 4%, transparent) 1px, transparent 1px),
        linear-gradient(180deg, color-mix(in srgb, var(--chb-text) 4%, transparent) 1px, transparent 1px),
        linear-gradient(135deg, var(--chb-page-bg), color-mix(in srgb, var(--chb-page-bg) 86%, var(--chb-teal-50)));
      background-size: 42px 42px, 42px 42px, auto;
      padding: 1rem;
    }

    .auth-card {
      position: relative;
      display: grid;
      width: min(100%, 27rem);
      gap: 1.2rem;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--chb-border-strong) 70%, transparent);
      border-radius: 0.85rem;
      background: color-mix(in srgb, var(--chb-surface) 96%, transparent);
      box-shadow: var(--chb-shadow);
      padding: 1.35rem;
      animation: chb-fade-rise 200ms ease-out both;
    }

    .auth-card__accent {
      position: absolute;
      inset: 0 0 auto;
      height: 3px;
      background: linear-gradient(90deg, var(--chb-teal), var(--chb-yellow));
    }

    .auth-card__brand {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .auth-card__mark {
      display: grid;
      width: 2.45rem;
      height: 2.45rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 0.55rem;
      background: linear-gradient(135deg, var(--chb-teal), var(--chb-yellow));
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 900;
    }

    .auth-card__brand p,
    h1 {
      margin: 0;
    }

    .auth-card__brand p {
      color: var(--chb-text-muted);
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    h1 {
      color: var(--chb-text);
      font-size: 1.42rem;
      line-height: 1.12;
    }

    .auth-form {
      display: grid;
      gap: 0.78rem;
    }

    .auth-field {
      display: grid;
      gap: 0.35rem;
      color: var(--chb-text);
      font-weight: 800;
    }

    .auth-field > span:first-child {
      color: var(--chb-text-muted);
      font-size: 0.78rem;
    }

    .field-control {
      display: block;
      width: 100%;
    }

    input {
      width: 100%;
    }

    :host ::ng-deep .auth-field .p-inputtext {
      min-height: 2.55rem;
      border-color: var(--chb-border-strong);
      background: color-mix(in srgb, var(--chb-surface) 88%, var(--chb-surface-muted));
      color: var(--chb-text);
      font-weight: 750;
    }

    :host ::ng-deep .auth-field .p-inputtext:hover {
      border-color: rgba(45, 212, 191, 0.55);
      background: var(--chb-surface);
    }

    :host ::ng-deep .auth-field .p-inputtext:focus {
      border-color: #2dd4bf;
      background: var(--chb-surface);
      box-shadow: 0 0 0 0.16rem rgba(45, 212, 191, 0.18);
    }

    .field-control i {
      color: var(--chb-text-muted);
    }

    .auth-form__message {
      margin: 0;
      border: 1px solid color-mix(in srgb, var(--chb-teal) 28%, var(--chb-border));
      border-radius: 0.55rem;
      background: color-mix(in srgb, var(--chb-teal-50) 56%, var(--chb-surface));
      color: var(--chb-teal);
      font-size: 0.84rem;
      font-weight: 750;
      padding: 0.65rem;
    }

    .auth-form__message--error {
      border-color: color-mix(in srgb, var(--chb-red) 34%, var(--chb-border));
      background: color-mix(in srgb, var(--chb-red) 10%, var(--chb-surface));
      color: var(--chb-red);
    }

    :host-context(.dark) .auth-form__message {
      color: #99f6e4;
    }

    :host-context(.dark) .auth-form__message--error {
      color: #fecaca;
    }

    .auth-card__foot {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.65rem;
      border-top: 1px solid color-mix(in srgb, var(--chb-border) 72%, transparent);
      color: var(--chb-text-muted);
      font-size: 0.74rem;
      padding-top: 0.95rem;
    }

    .auth-card__foot span {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    :host ::ng-deep .auth-submit.p-button {
      min-height: 2.65rem;
      justify-content: space-between;
      border: 0;
      border-radius: 0.55rem;
      background: #f59e0b;
      color: #111827;
      padding-inline: 0.9rem;
      font-size: 0.92rem;
      font-weight: 900;
      letter-spacing: 0;
      box-shadow: 0 12px 28px rgba(245, 158, 11, 0.24);
    }

    :host ::ng-deep .auth-submit.p-button .p-button-label {
      flex: 0 0 auto;
      color: #111827;
      font-weight: 900;
    }

    :host ::ng-deep .auth-submit.p-button .p-button-icon {
      color: #111827;
    }

    :host ::ng-deep .auth-submit.p-button:enabled:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }

    @media (max-width: 520px), (max-height: 560px) {
      .auth-card {
        gap: 0.95rem;
        padding: 1rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly serverUrl = signal(this.auth.session()?.serverUrl ?? (this.auth.lastServerUrl() || 'http://127.0.0.1:8080'));
  readonly username = signal('admin');
  readonly password = signal('Admin@123');
  readonly loading = signal(false);
  readonly message = signal('');
  readonly hasError = signal(false);

  submit(): void {
    if (!this.username().trim() || !this.password().trim()) {
      this.hasError.set(true);
      this.message.set('Informe usuario e senha para continuar.');
      return;
    }

    this.loading.set(true);
    this.hasError.set(false);
    this.message.set('');

    this.auth.login({
      serverUrl: this.serverUrl(),
      username: this.username(),
      password: this.password()
    }).subscribe({
      next: (result) => {
        this.loading.set(false);

        if (result.source === 'demo') {
          this.message.set('API indisponivel. Sessao demo local iniciada.');
        }

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl && returnUrl !== '/login' ? returnUrl : '/selecionar-loja');
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
        this.message.set('Nao foi possivel iniciar sessao agora.');
      }
    });
  }
}
