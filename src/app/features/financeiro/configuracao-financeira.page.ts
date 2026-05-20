import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface ConfiguracaoFinanceira {
  id?: string;
  jurosAoMesPerc: number;
  multaAtrasoPerc: number;
  diasCarencia: number;
}

const DEMO_CONFIG: ConfiguracaoFinanceira = {
  jurosAoMesPerc: 2.00,
  multaAtrasoPerc: 2.00,
  diasCarencia: 0
};

@Component({
  selector: 'chb-configuracao-financeira',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    InputNumberModule,
    ToastModule
  ],
  template: `
    <p-toast />

    <div class="p-4 max-w-lg mx-auto">
      <p-card header="Configuração Financeira">
        <p class="text-sm text-gray-500 mb-4">
          Parâmetros de juros e multa aplicados automaticamente ao baixar contas em atraso.
        </p>

        @if (loading()) {
          <div class="text-center p-4 text-gray-400">Carregando...</div>
        } @else {
          <div class="flex flex-column gap-4">
            <div class="flex flex-column gap-1">
              <label class="font-medium">Juros ao Mês (%)</label>
              <p-inputNumber
                [(ngModel)]="juros"
                [min]="0" [max]="30" [step]="0.25"
                mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2"
                styleClass="w-full" />
              <small class="text-gray-400">Ex.: 2,00% ao mês = 2,00</small>
            </div>

            <div class="flex flex-column gap-1">
              <label class="font-medium">Multa por Atraso (%)</label>
              <p-inputNumber
                [(ngModel)]="multa"
                [min]="0" [max]="10" [step]="0.25"
                mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2"
                styleClass="w-full" />
              <small class="text-gray-400">Cobrada uma única vez ao vencer</small>
            </div>

            <div class="flex flex-column gap-1">
              <label class="font-medium">Dias de Carência</label>
              <p-inputNumber
                [(ngModel)]="diasCarencia"
                [min]="0" [max]="30" [step]="1"
                mode="decimal" [minFractionDigits]="0" [maxFractionDigits]="0"
                styleClass="w-full" />
              <small class="text-gray-400">Dias após vencimento sem cobrar juros</small>
            </div>

            <p-button
              label="Salvar"
              icon="pi pi-save"
              [loading]="saving()"
              (onClick)="salvar()"
              styleClass="w-full" />
          </div>
        }
      </p-card>
    </div>
  `
})
export class ConfiguracaoFinanceiraPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(MessageService);

  readonly loading = signal(true);
  readonly saving = signal(false);

  juros = 2.00;
  multa = 2.00;
  diasCarencia = 0;

  ngOnInit() {
    this.http.get<ConfiguracaoFinanceira>('/api/v1/financeiro/configuracao')
      .pipe(catchError(() => of(DEMO_CONFIG)))
      .subscribe(cfg => {
        this.juros = cfg.jurosAoMesPerc;
        this.multa = cfg.multaAtrasoPerc;
        this.diasCarencia = cfg.diasCarencia;
        this.loading.set(false);
      });
  }

  salvar() {
    this.saving.set(true);
    this.http.put<ConfiguracaoFinanceira>('/api/v1/financeiro/configuracao', {
      jurosAoMesPerc: this.juros,
      multaAtrasoPerc: this.multa,
      diasCarencia: this.diasCarencia
    }).pipe(
      catchError(() => {
        this.toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a configuração.' });
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(res => {
      if (res !== null) {
        this.toast.add({ severity: 'success', summary: 'Salvo', detail: 'Configuração atualizada com sucesso.' });
      }
    });
  }
}
