import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ThemeService } from '../../core/theme/theme.service';

interface Preferencias {
  tema: 'light' | 'dark' | 'auto';
  densidade: 'compact' | 'normal' | 'comfortable';
  somBip: boolean;
}

@Component({
  selector: 'chb-preferencias-page',
  standalone: true,
  imports: [ButtonModule, CheckboxModule, FormsModule, SelectButtonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast></p-toast>
    <div class="pref-page">
      <header class="pref-header">
        <h2 class="pref-title">Preferências</h2>
        <p class="pref-desc">Personalize sua experiência no Chocobo ERP</p>
      </header>

      <div class="pref-sections">
        <section class="pref-section">
          <h3 class="pref-section-title">Aparência</h3>
          <div class="pref-field">
            <label class="pref-label">Tema da interface</label>
            <p-selectButton
              [(ngModel)]="prefs().tema"
              (ngModelChange)="onTemaChange($event)"
              [options]="temaOptions"
              optionLabel="label"
              optionValue="value"
              [allowEmpty]="false">
            </p-selectButton>
          </div>
          <div class="pref-field">
            <label class="pref-label">Densidade</label>
            <p-selectButton
              [(ngModel)]="prefs().densidade"
              [options]="densidadeOptions"
              optionLabel="label"
              optionValue="value"
              [allowEmpty]="false">
            </p-selectButton>
            <small class="pref-hint">Compact = mais itens na tela. Comfortable = mais espaço.</small>
          </div>
        </section>

        <section class="pref-section">
          <h3 class="pref-section-title">Sons</h3>
          <div class="pref-field pref-field--inline">
            <p-checkbox
              [(ngModel)]="prefs().somBip"
              [binary]="true"
              inputId="somBip">
            </p-checkbox>
            <label for="somBip" class="pref-label pref-label--inline">
              Som de bip ao escanear código de barras no PDV
            </label>
          </div>
        </section>
      </div>

      <footer class="pref-footer">
        <button
          pButton
          type="button"
          label="Salvar preferências"
          icon="pi pi-save"
          [loading]="salvando()"
          (click)="salvar()">
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .pref-page {
      max-width: 600px;
      padding: 1.5rem 1rem;
      display: grid;
      gap: 1.5rem;
    }
    .pref-header { display: grid; gap: 0.25rem; }
    .pref-title { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--chb-text, #1a1a2e); }
    .pref-desc { margin: 0; color: var(--chb-text-muted, #6c757d); font-size: 0.9rem; }
    .pref-sections { display: grid; gap: 1.25rem; }
    .pref-section {
      padding: 1.25rem;
      border: 1px solid var(--chb-border, #dee2e6);
      border-radius: 0.5rem;
      background: var(--chb-surface, #fff);
      display: grid;
      gap: 1rem;
    }
    .pref-section-title {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 900;
      text-transform: uppercase;
      color: var(--chb-text-muted, #6c757d);
      letter-spacing: 0.04em;
    }
    .pref-field { display: grid; gap: 0.5rem; }
    .pref-field--inline { flex-direction: row; display: flex; align-items: center; gap: 0.75rem; }
    .pref-label { font-size: 0.9rem; font-weight: 600; color: var(--chb-text, #1a1a2e); }
    .pref-label--inline { cursor: pointer; }
    .pref-hint { color: var(--chb-text-muted, #6c757d); font-size: 0.8rem; }
    .pref-footer { padding-top: 0.5rem; }
  `]
})
export class PreferenciasPage {
  private readonly themeService = inject(ThemeService);
  private readonly msg = inject(MessageService);

  readonly salvando = signal(false);

  readonly temaOptions = [
    { label: 'Claro', value: 'light' },
    { label: 'Escuro', value: 'dark' },
    { label: 'Auto', value: 'auto' }
  ];

  readonly densidadeOptions = [
    { label: 'Compacto', value: 'compact' },
    { label: 'Normal', value: 'normal' },
    { label: 'Espaçado', value: 'comfortable' }
  ];

  readonly prefs = signal<Preferencias>(this.carregarPrefs());

  onTemaChange(tema: 'light' | 'dark' | 'auto'): void {
    this.themeService.setTheme(tema);
  }

  salvar(): void {
    this.salvando.set(true);
    localStorage.setItem('chb_prefs', JSON.stringify(this.prefs()));
    setTimeout(() => {
      this.salvando.set(false);
      this.msg.add({ severity: 'success', summary: 'Salvo!', detail: 'Preferências salvas com sucesso.', life: 3000 });
    }, 400);
  }

  private carregarPrefs(): Preferencias {
    try {
      const raw = localStorage.getItem('chb_prefs');
      if (raw) return JSON.parse(raw) as Preferencias;
    } catch { /* ignore */ }
    return { tema: 'auto', densidade: 'normal', somBip: false };
  }
}
