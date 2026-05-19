import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'chb-forbidden-page',
  standalone: true,
  imports: [ButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-page">
      <div class="error-mascote">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="140" height="140">
          <ellipse cx="60" cy="78" rx="28" ry="22" fill="#F9A825"/>
          <circle cx="60" cy="44" r="20" fill="#F9A825"/>
          <circle cx="67" cy="40" r="4" fill="#1A237E"/>
          <circle cx="68.5" cy="38.5" r="1.5" fill="white"/>
          <path d="M72 47 L84 49 L72 51 Z" fill="#FF8F00"/>
          <path d="M52 30 Q56 17 61 25 Q66 17 70 25" stroke="#F9A825" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          <path d="M32 70 Q16 60 22 75 Q27 88 37 80" fill="#FFB300"/>
          <path d="M88 70 Q104 60 98 75 Q93 88 83 80" fill="#FFB300"/>
          <line x1="50" y1="99" x2="47" y2="113" stroke="#FF8F00" stroke-width="3" stroke-linecap="round"/>
          <line x1="61" y1="101" x2="61" y2="116" stroke="#FF8F00" stroke-width="3" stroke-linecap="round"/>
          <line x1="72" y1="99" x2="75" y2="113" stroke="#FF8F00" stroke-width="3" stroke-linecap="round"/>
          <!-- Braços cruzados (recusa) -->
          <path d="M38 68 L50 72 L44 80" stroke="#FF8F00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M82 68 L70 72 L76 80" stroke="#FF8F00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="error-code">403</p>
      <h1 class="error-title">Acesso negado</h1>
      <p class="error-desc">O Chocobo não vai deixar você passar por aqui. Você não tem permissão.</p>
      <a pButton routerLink="/dashboard" label="Voltar ao início" icon="pi pi-home" class="p-button-outlined p-button-secondary"></a>
    </div>
  `,
  styles: [`
    :host { display: flex; justify-content: center; align-items: center; min-height: 70vh; }
    .error-page { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; padding: 2rem; }
    .error-mascote { margin-bottom: 0.5rem; filter: drop-shadow(0 4px 12px rgba(249,168,37,0.3)); }
    .error-code { font-size: 5rem; font-weight: 900; color: #dc2626; margin: 0; line-height: 1; }
    .error-title { font-size: 1.4rem; font-weight: 700; color: var(--chb-text, #1a1a2e); margin: 0; }
    .error-desc { color: var(--chb-text-muted, #6c757d); max-width: 340px; margin: 0; font-size: 0.95rem; }
  `]
})
export class ForbiddenPage {}
