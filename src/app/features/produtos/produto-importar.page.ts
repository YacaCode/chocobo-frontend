import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ProgressBarModule } from 'primeng/progressbar';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

type Mapeamento = Record<string, string>;

const CAMPOS_PRODUTO = [
  { label: '(ignorar)', value: '' },
  { label: 'Código', value: 'codigo' },
  { label: 'Descrição', value: 'descricao' },
  { label: 'Fabricante', value: 'fabricante' },
  { label: 'Aplicação', value: 'aplicacao' },
  { label: 'Preço de Compra', value: 'precoCompra' },
  { label: 'Preço de Venda', value: 'precoVenda' },
  { label: 'NCM', value: 'ncm' },
  { label: 'Unidade', value: 'unidade' }
];

@Component({
  selector: 'chb-produto-importar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, CheckboxModule, FileUploadModule, FormsModule,
    ProgressBarModule, RouterLink, StepsModule, TableModule, TagModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <!-- Cabeçalho -->
    <div class="page-header">
      <div>
        <p class="page-area">Cadastros → Produtos</p>
        <h2 class="page-title">Importar Produtos via CSV/Excel</h2>
      </div>
      <button pButton icon="pi pi-arrow-left" label="Voltar" class="p-button-text"
              routerLink="/cadastros/produtos"></button>
    </div>

    <!-- Steps -->
    <div class="steps-container">
      <p-steps [model]="passos" [activeIndex]="passo()" [readonly]="true"></p-steps>
    </div>

    <!-- Conteúdo por passo -->
    <div class="step-content">

      <!-- Passo 0: Upload -->
      @if (passo() === 0) {
        <div class="step-card">
          <h3 class="step-title">Selecionar Arquivo</h3>
          <p class="step-desc">Selecione um arquivo CSV ou Excel (.xlsx) com os dados dos produtos a importar.</p>

          <p-fileUpload
            mode="advanced"
            accept=".csv,.xlsx"
            [maxFileSize]="5000000"
            chooseLabel="Selecionar Arquivo"
            [auto]="false"
            [multiple]="false"
            (onSelect)="onArquivoSelecionado($event)">
            <ng-template pTemplate="empty">
              <div class="upload-empty">
                <i class="pi pi-cloud-upload" style="font-size:3rem;color:var(--chb-text-muted)"></i>
                <p>Arraste um arquivo CSV ou Excel aqui</p>
                <small style="color:var(--chb-text-muted)">Máximo 5 MB</small>
              </div>
            </ng-template>
          </p-fileUpload>

          @if (arquivo()) {
            <div class="arquivo-info">
              <i class="pi pi-file"></i>
              <span>{{ arquivo()!.name }}</span>
              <span style="color:var(--chb-text-muted);font-size:.85rem">({{ (arquivo()!.size / 1024).toFixed(1) }} KB)</span>
            </div>
          }

          <div class="step-footer">
            <button pButton label="Avançar" icon="pi pi-arrow-right" iconPos="right"
                    class="p-button-success"
                    [disabled]="!arquivo()"
                    (click)="avancarPasso()"></button>
          </div>
        </div>
      }

      <!-- Passo 1: Mapeamento -->
      @if (passo() === 1) {
        <div class="step-card">
          <h3 class="step-title">Mapear Colunas</h3>
          <p class="step-desc">Associe cada coluna do arquivo CSV aos campos do produto.</p>

          <div class="mapeamento-grid">
            @for (col of colunas(); track col) {
              <div class="mapeamento-row">
                <span class="col-csv">{{ col }}</span>
                <i class="pi pi-arrow-right" style="color:var(--chb-text-muted)"></i>
                <select class="select-campo" [(ngModel)]="mapeamentoEdit[col]">
                  @for (campo of camposProduto; track campo.value) {
                    <option [value]="campo.value">{{ campo.label }}</option>
                  }
                </select>
              </div>
            }
          </div>

          <div class="preview-title">Prévia (primeiras 5 linhas):</div>
          @if (preview().length > 0) {
            <div style="overflow-x:auto">
              <table class="preview-table">
                <thead>
                  <tr>
                    @for (col of colunas(); track col) {
                      <th>{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of preview(); track $index) {
                    <tr>
                      @for (col of colunas(); track col) {
                        <td>{{ row[col] }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <div class="template-actions">
            <button pButton icon="pi pi-save" label="Salvar Template" class="p-button-text p-button-sm"
                    (click)="salvarTemplate()"></button>
            <button pButton icon="pi pi-refresh" label="Carregar Template" class="p-button-text p-button-sm"
                    [disabled]="!temTemplate()" (click)="carregarTemplate()"></button>
          </div>

          <div class="step-footer">
            <button pButton label="Voltar" icon="pi pi-arrow-left" class="p-button-outlined p-button-secondary"
                    (click)="voltarPasso()"></button>
            <button pButton label="Validar" icon="pi pi-arrow-right" iconPos="right"
                    class="p-button-success" (click)="avancarPasso()"></button>
          </div>
        </div>
      }

      <!-- Passo 2: Validação -->
      @if (passo() === 2) {
        <div class="step-card">
          <h3 class="step-title">Resultado da Validação</h3>

          <div class="validacao-resumo">
            <div class="val-card val-success">
              <i class="pi pi-check-circle"></i>
              <div>
                <span class="val-num">{{ validacao()?.criados ?? 0 }}</span>
                <span>Novos registros</span>
              </div>
            </div>
            <div class="val-card val-warning">
              <i class="pi pi-refresh"></i>
              <div>
                <span class="val-num">{{ validacao()?.atualizados ?? 0 }}</span>
                <span>Atualizações</span>
              </div>
            </div>
            <div class="val-card val-danger">
              <i class="pi pi-times-circle"></i>
              <div>
                <span class="val-num">{{ validacao()?.erros ?? 0 }}</span>
                <span>Erros</span>
              </div>
            </div>
          </div>

          @if (validacao()?.erros && (validacao()?.erros ?? 0) > 0) {
            <p-table [value]="errosValidacao()" [paginator]="true" [rows]="5" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr><th>Linha</th><th>Campo</th><th>Motivo</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-e>
                <tr>
                  <td>{{ e.linha }}</td>
                  <td>{{ e.campo }}</td>
                  <td style="color:#dc2626">{{ e.motivo }}</td>
                </tr>
              </ng-template>
            </p-table>
            <div style="margin-top:.75rem">
              <label class="checkbox-label">
                <p-checkbox [(ngModel)]="ignorarErros" [binary]="true" inputId="ignorar"></p-checkbox>
                <label for="ignorar">Importar mesmo com erros (registros com erro serão ignorados)</label>
              </label>
            </div>
          }

          <div class="step-footer">
            <button pButton label="Voltar" icon="pi pi-arrow-left" class="p-button-outlined p-button-secondary"
                    (click)="voltarPasso()"></button>
            <button pButton label="Confirmar Importação" icon="pi pi-check"
                    class="p-button-success"
                    [disabled]="(validacao()?.erros ?? 0) > 0 && !ignorarErros"
                    [loading]="importando()"
                    (click)="confirmarImportacao()"></button>
          </div>
        </div>
      }

      <!-- Passo 3: Resultado final -->
      @if (passo() === 3) {
        <div class="step-card resultado-card">
          <i class="pi pi-check-circle" style="font-size:4rem;color:#16a34a"></i>
          <h3>Importação concluída!</h3>
          <div class="resultado-resumo">
            <strong>{{ resultado()?.criados ?? 0 }}</strong> produtos criados,
            <strong>{{ resultado()?.atualizados ?? 0 }}</strong> atualizados.
          </div>
          <div class="step-footer">
            <button pButton icon="pi pi-list" label="Ver Produtos Importados" class="p-button-outlined"
                    routerLink="/cadastros/produtos"></button>
            <button pButton icon="pi pi-upload" label="Importar Outro Arquivo" class="p-button-success"
                    (click)="reiniciar()"></button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.85rem 0 1rem; flex-wrap:wrap; }
    .page-area { margin:0; color:var(--chb-text-muted); font-size:.75rem; font-weight:900; text-transform:uppercase; }
    .page-title { margin:0; font-size:1.25rem; font-weight:700; color:var(--chb-text); }
    .steps-container { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1.25rem; margin-bottom:1rem; }
    .step-content { }
    .step-card { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; }
    .step-title { margin:0; font-size:1.1rem; font-weight:700; color:var(--chb-text); }
    .step-desc { margin:0; color:var(--chb-text-muted); font-size:.9rem; }
    .step-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:.5rem; }
    .upload-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:2rem; }
    .arquivo-info { display:flex; align-items:center; gap:.5rem; background:color-mix(in srgb,var(--chb-teal) 8%,var(--chb-surface)); border:1px solid var(--chb-border); border-radius:.4rem; padding:.75rem 1rem; }
    .mapeamento-grid { display:flex; flex-direction:column; gap:.5rem; }
    .mapeamento-row { display:flex; align-items:center; gap:.75rem; }
    .col-csv { font-family:monospace; font-size:.9rem; font-weight:700; min-width:180px; padding:.35rem .6rem; background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.3rem; }
    .select-campo { flex:1; padding:.35rem .5rem; border:1px solid var(--chb-border); border-radius:.3rem; background:var(--chb-surface); color:var(--chb-text); }
    .preview-title { font-size:.82rem; font-weight:700; color:var(--chb-text-muted); margin-top:.5rem; }
    .preview-table { width:100%; border-collapse:collapse; font-size:.82rem; }
    .preview-table th { background:var(--chb-surface); border-bottom:2px solid var(--chb-border); padding:.4rem; text-align:left; color:var(--chb-text-muted); }
    .preview-table td { border-bottom:1px solid var(--chb-border); padding:.35rem .4rem; }
    .template-actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .validacao-resumo { display:flex; gap:1rem; flex-wrap:wrap; }
    .val-card { flex:1; min-width:120px; border-radius:.5rem; padding:1rem; display:flex; align-items:center; gap:.75rem; }
    .val-card i { font-size:1.75rem; }
    .val-num { display:block; font-size:1.4rem; font-weight:700; }
    .val-success { background:rgba(22,163,74,.08); color:#16a34a; }
    .val-warning { background:rgba(234,88,12,.08); color:#ea580c; }
    .val-danger { background:rgba(220,38,38,.08); color:#dc2626; }
    .checkbox-label { display:flex; align-items:center; gap:.75rem; cursor:pointer; }
    .resultado-card { align-items:center; text-align:center; padding:3rem 1.5rem; }
    .resultado-resumo { font-size:1rem; color:var(--chb-text-muted); }
  `]
})
export class ProdutoImportarPage {
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);

  readonly passo = signal(0);
  readonly arquivo = signal<File | null>(null);
  readonly colunas = signal<string[]>([]);
  readonly preview = signal<Record<string, string>[]>([]);
  readonly validacao = signal<{ criados: number; atualizados: number; erros: number } | null>(null);
  readonly errosValidacao = signal<{ linha: number; campo: string; motivo: string }[]>([]);
  readonly resultado = signal<{ criados: number; atualizados: number } | null>(null);
  readonly importando = signal(false);
  readonly temTemplate = signal(!!localStorage.getItem('chb_csv_template'));

  mapeamentoEdit: Mapeamento = {};
  ignorarErros = false;

  readonly camposProduto = CAMPOS_PRODUTO;

  readonly passos = [
    { label: 'Upload' },
    { label: 'Mapeamento' },
    { label: 'Validação' },
    { label: 'Resultado' }
  ];

  onArquivoSelecionado(event: { files: File[] }): void {
    const file = event?.files?.[0];
    if (!file) return;
    this.arquivo.set(file);
    // Simula parsing do CSV para detectar colunas
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      const cols = lines[0].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      this.colunas.set(cols);
      // Auto-detectar mapeamento por nome de coluna
      const mapa: Mapeamento = {};
      cols.forEach(col => {
        const colLower = col.toLowerCase();
        if (colLower.includes('cod') || colLower === 'codigo') mapa[col] = 'codigo';
        else if (colLower.includes('desc')) mapa[col] = 'descricao';
        else if (colLower.includes('fabric')) mapa[col] = 'fabricante';
        else if (colLower.includes('aplic')) mapa[col] = 'aplicacao';
        else if (colLower.includes('compra') || colLower.includes('custo')) mapa[col] = 'precoCompra';
        else if (colLower.includes('venda') || colLower.includes('preco')) mapa[col] = 'precoVenda';
        else if (colLower.includes('ncm')) mapa[col] = 'ncm';
        else if (colLower.includes('un') || colLower.includes('unid')) mapa[col] = 'unidade';
        else mapa[col] = '';
      });
      this.mapeamentoEdit = mapa;
      // Preview das primeiras 5 linhas
      const previewRows = lines.slice(1, 6).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        cols.forEach((col, i) => { row[col] = vals[i] ?? ''; });
        return row;
      });
      this.preview.set(previewRows);
    };
    reader.readAsText(file);
  }

  avancarPasso(): void {
    const p = this.passo();
    if (p === 1) {
      // Simula validação
      const total = Math.max(this.preview().length, 10);
      const criados = Math.floor(total * 0.7);
      const atualizados = Math.floor(total * 0.1);
      const erros = total - criados - atualizados;
      this.validacao.set({ criados, atualizados, erros });
      this.errosValidacao.set(erros > 0 ? [
        { linha: 3, campo: 'precoVenda', motivo: 'Valor inválido: "abc"' },
        { linha: 7, campo: 'ncm', motivo: 'NCM com formato incorreto' }
      ].slice(0, erros) : []);
    }
    this.passo.set(p + 1);
  }

  voltarPasso(): void {
    this.passo.update(p => Math.max(0, p - 1));
  }

  salvarTemplate(): void {
    localStorage.setItem('chb_csv_template', JSON.stringify(this.mapeamentoEdit));
    this.temTemplate.set(true);
    this.msg.add({ severity: 'success', summary: 'Template salvo', detail: 'Mapeamento salvo no navegador.' });
  }

  carregarTemplate(): void {
    const saved = localStorage.getItem('chb_csv_template');
    if (saved) {
      this.mapeamentoEdit = JSON.parse(saved) as Mapeamento;
      this.msg.add({ severity: 'info', summary: 'Template carregado', detail: 'Mapeamento anterior restaurado.' });
    }
  }

  confirmarImportacao(): void {
    this.importando.set(true);
    // Simula importação
    setTimeout(() => {
      const v = this.validacao();
      this.resultado.set({ criados: v?.criados ?? 0, atualizados: v?.atualizados ?? 0 });
      this.importando.set(false);
      this.passo.set(3);
    }, 1500);
  }

  reiniciar(): void {
    this.passo.set(0);
    this.arquivo.set(null);
    this.colunas.set([]);
    this.preview.set([]);
    this.validacao.set(null);
    this.resultado.set(null);
    this.mapeamentoEdit = {};
    this.ignorarErros = false;
  }
}
