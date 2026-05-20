import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  type OnDestroy,
  type OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProdutoBuscaDialogComponent } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import type { ProdutoItem } from '../../shared/produto-busca-dialog/produto-busca-dialog.component';
import { ClienteBuscaDialogComponent } from '../../shared/cliente-busca-dialog/cliente-busca-dialog.component';
import { ServicoBuscaDialogComponent } from '../../shared/servico-busca-dialog/servico-busca-dialog.component';
import type { ServicoItem } from '../../shared/servico-busca-dialog/servico-busca-dialog.component';

const DEMO_OS = {
  id: 'os-001', numero: 'OS-0001', clienteId: null, clienteNome: '',
  placa: '', modelo: '', quilometragem: '', cor: '', consultor: 'Admin',
  status: 'ABERTA', dataEntrada: new Date().toISOString(),
  itens: []
};

@Component({
  selector: 'chb-dav-os-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule, ClienteBuscaDialogComponent, ConfirmDialogModule, CurrencyPipe,
    DropdownModule, FormsModule, InputNumberModule, InputTextModule,
    ProdutoBuscaDialogComponent, ServicoBuscaDialogComponent, SkeletonModule, TabViewModule, TagModule, ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <chb-produto-busca-dialog [(visible)]="showProdutoDialog" (produtoSelecionado)="onProdutoSelecionado($event)"></chb-produto-busca-dialog>
    <chb-cliente-busca-dialog [(visible)]="showClienteDialog" (clienteSelecionado)="onClienteSelecionado($event)"></chb-cliente-busca-dialog>
    <chb-servico-busca-dialog [(visible)]="showServicoBuscaDialog" (servicoSelecionado)="onServicoCatalogSelecionado($event)"></chb-servico-busca-dialog>

    @if (loading()) {
      <div style="padding:2rem;text-align:center">
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
        <p-skeleton height="3rem" styleClass="mb-2"></p-skeleton>
        <p-skeleton height="12rem"></p-skeleton>
      </div>
    } @else {
      <!-- Cabeçalho sticky -->
      <div class="os-header">
        <div class="os-header-row">
          <div class="os-numero">
            <span class="os-label">OS Nº</span>
            <span class="os-value">{{ os().numero || 'Nova OS' }}</span>
          </div>
          <p-tag [value]="os().status" [severity]="severidade(os().status)" styleClass="text-sm"></p-tag>
        </div>

        <div class="os-grid">
          <!-- Cliente -->
          <div class="os-field os-field-wide">
            <label class="os-field-label">Cliente *</label>
            <div class="input-btn-group">
              <input pInputText [value]="os().clienteNome || ''"
                     placeholder="Selecione o cliente (F4)..."
                     [readonly]="true" style="flex:1;cursor:pointer"
                     (click)="showClienteDialog = true" />
              <button pButton icon="pi pi-search" class="p-button-outlined p-button-sm"
                      (click)="showClienteDialog = true" pTooltip="F4"></button>
            </div>
          </div>

          <!-- Veículo -->
          <div class="os-field">
            <label class="os-field-label">Placa</label>
            <div class="input-btn-group">
              <input pInputText [(ngModel)]="placaEdit" placeholder="ABC-1234"
                     style="text-transform:uppercase;font-family:monospace;flex:1" />
              <button pButton icon="pi pi-search" class="p-button-outlined p-button-sm"
                      [loading]="buscandoVeiculo()"
                      (click)="buscarVeiculoPorPlaca()" pTooltip="Buscar veículo"></button>
            </div>
          </div>
          <div class="os-field">
            <label class="os-field-label">Modelo / Marca</label>
            <input pInputText [(ngModel)]="modeloEdit" placeholder="Honda CG 160" [readonly]="!!veiculoId()" />
          </div>
          <div class="os-field">
            <label class="os-field-label">Quilometragem</label>
            <input pInputText [(ngModel)]="quilometragemEdit" placeholder="12.500" />
          </div>
          <div class="os-field">
            <label class="os-field-label">Consultor</label>
            <p-dropdown [(ngModel)]="consultorEdit"
                        [options]="consultores()"
                        optionLabel="label" optionValue="value"
                        placeholder="Selecione..." styleClass="w-full"></p-dropdown>
          </div>
        </div>

        <!-- Queixa/Observação -->
        <div class="os-field" style="margin-top:.5rem">
          <label class="os-field-label">Queixa / Defeito Relatado</label>
          <input pInputText [(ngModel)]="queixaEdit" placeholder="Descreva o problema relatado pelo cliente..." />
        </div>
      </div>

      <!-- Abas de itens -->
      <div class="os-body">
        <p-tabView>
          <!-- Tab 1: Peças -->
          <p-tabPanel header="Peças">
            <div class="tab-toolbar">
              <span style="font-size:.85rem;color:var(--chb-text-muted)">{{ pecas().length }} peça(s)</span>
              <button pButton icon="pi pi-plus" label="Adicionar Peça (F1)"
                      class="p-button-outlined p-button-sm"
                      (click)="abrirBuscaProduto('PECA')"></button>
            </div>
            @if (pecas().length === 0) {
              <div class="empty-items">
                <i class="pi pi-cog"></i>
                <span>Nenhuma peça adicionada. Pressione F1 ou clique em Adicionar Peça.</span>
              </div>
            } @else {
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th style="width:80px;text-align:center">Qtd</th>
                    <th style="width:120px;text-align:right">Preço Un.</th>
                    <th style="width:120px;text-align:right">Total</th>
                    <th style="width:100px">Mecânico</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of pecas(); track item.id; let i = $index) {
                    <tr>
                      <td class="cell-mono">{{ item.codigo }}</td>
                      <td>{{ item.descricao }}</td>
                      <td style="text-align:center">
                        <p-inputNumber [(ngModel)]="item.quantidade"
                                       [min]="0.01" [step]="1"
                                       [style]="{width:'70px'}"
                                       (onInput)="recalcular()">
                        </p-inputNumber>
                      </td>
                      <td style="text-align:right">{{ item.precoUnitario | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td style="text-align:right;font-weight:700">{{ item.quantidade * item.precoUnitario | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td><input pInputText [(ngModel)]="item.mecanico" placeholder="—" style="width:90px" /></td>
                      <td>
                        <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                                (click)="removerItem(i, 'PECA')" pTooltip="Remover"></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </p-tabPanel>

          <!-- Tab 2: Serviços -->
          <p-tabPanel header="Serviços">
            <div class="tab-toolbar">
              <span style="font-size:.85rem;color:var(--chb-text-muted)">{{ servicos().length }} serviço(s)</span>
              <div style="display:flex;gap:.5rem">
                <button pButton icon="pi pi-list" label="Buscar Catálogo (F2)"
                        class="p-button-outlined p-button-sm"
                        (click)="abrirBuscaServico()"></button>
                <button pButton icon="pi pi-plus" label="Serviço Manual"
                        class="p-button-outlined p-button-sm"
                        (click)="adicionarServico()"></button>
              </div>
            </div>
            @if (servicos().length === 0) {
              <div class="empty-items">
                <i class="pi pi-wrench"></i>
                <span>Nenhum serviço adicionado. Pressione F2 ou clique em Buscar Catálogo.</span>
              </div>
            } @else {
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width:90px">Código</th>
                    <th>Descrição do Serviço</th>
                    <th style="width:100px;text-align:center">Tempo (h)</th>
                    <th style="width:120px;text-align:right">Preço</th>
                    <th style="width:130px">Mecânico</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of servicos(); track item.id; let i = $index) {
                    <tr>
                      <td class="cell-mono">{{ item.codigo }}</td>
                      <td><input pInputText [(ngModel)]="item.descricao" placeholder="Descreva o serviço" style="width:100%" /></td>
                      <td style="text-align:center">
                        <p-inputNumber [(ngModel)]="item.quantidade"
                                       [min]="0" [step]="0.5"
                                       [style]="{width:'80px'}"
                                       (onInput)="recalcular()">
                        </p-inputNumber>
                      </td>
                      <td style="text-align:right">
                        <p-inputNumber [(ngModel)]="item.precoUnitario"
                                       mode="currency" currency="BRL" locale="pt-BR"
                                       [style]="{width:'110px'}"
                                       (onInput)="recalcular()">
                        </p-inputNumber>
                      </td>
                      <td>
                        <p-dropdown [(ngModel)]="item.mecanico"
                                    [options]="mecanicos()"
                                    optionLabel="label" optionValue="value"
                                    placeholder="—" styleClass="w-full"
                                    [style]="{width:'120px'}"></p-dropdown>
                      </td>
                      <td>
                        <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm"
                                (click)="removerItem(i, 'SERVICO')" pTooltip="Remover"></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </p-tabPanel>
        </p-tabView>
      </div>

      <!-- Painel de totais -->
      <div class="totais-panel">
        <div class="totais-row">
          <span>Subtotal Peças:</span>
          <span>{{ subtotalPecas() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
        <div class="totais-row">
          <span>Subtotal Serviços:</span>
          <span>{{ subtotalServicos() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
        <div class="totais-row totais-total">
          <span>TOTAL</span>
          <span>{{ totalOs() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
        </div>
      </div>

      <!-- Rodapé fixo -->
      <footer class="os-footer">
        <button pButton icon="pi pi-arrow-left" label="Voltar"
                class="p-button-text" (click)="voltar()"></button>
        <div class="footer-right">
          <button pButton icon="pi pi-save" label="Salvar (Ctrl+S)"
                  class="p-button-outlined"
                  [loading]="salvando()"
                  (click)="salvar()"></button>
          @if (os().status === 'ABERTA') {
            <button pButton icon="pi pi-file" label="Gerar Orçamento (F8)"
                    class="p-button-warning"
                    [loading]="salvando()"
                    (click)="gerarOrcamento()"></button>
          }
          @if (os().status === 'APROVADA') {
            <button pButton icon="pi pi-check" label="Finalizar OS"
                    class="p-button-success"
                    [loading]="salvando()"
                    (click)="finalizarOs()"></button>
          }
          @if (os().status !== 'FINALIZADA' && os().status !== 'CANCELADA') {
            <button pButton icon="pi pi-times" label="Cancelar OS"
                    class="p-button-danger p-button-outlined"
                    (click)="cancelarOs()"></button>
          }
        </div>
      </footer>
    }
  `,
  styles: [`
    .os-header { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; margin-bottom:1rem; }
    .os-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; }
    .os-numero { display:flex; align-items:center; gap:.5rem; }
    .os-label { font-size:.72rem; font-weight:900; text-transform:uppercase; color:var(--chb-text-muted); }
    .os-value { font-size:1.2rem; font-weight:700; color:var(--chb-text); }
    .os-grid { display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap:.75rem; }
    .os-field { display:flex; flex-direction:column; gap:.25rem; }
    .os-field-wide { grid-column: span 2; }
    .os-field-label { font-size:.82rem; font-weight:700; color:var(--chb-text-muted); }
    .input-btn-group { display:flex; gap:.35rem; }
    .os-body { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; margin-bottom:1rem; }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; padding:.5rem 0 .75rem; }
    .empty-items { display:flex; align-items:center; gap:.75rem; padding:1.5rem; color:var(--chb-text-muted); }
    .empty-items i { font-size:1.5rem; }
    .items-table { width:100%; border-collapse:collapse; }
    .items-table th { background:var(--chb-surface); border-bottom:2px solid var(--chb-border); padding:.5rem; font-size:.82rem; font-weight:700; color:var(--chb-text-muted); text-align:left; }
    .items-table td { border-bottom:1px solid var(--chb-border); padding:.4rem .5rem; font-size:.9rem; }
    .cell-mono { font-family:monospace; font-weight:700; }
    .totais-panel { background:var(--chb-surface); border:1px solid var(--chb-border); border-radius:.5rem; padding:1rem; margin-bottom:4.5rem; }
    .totais-row { display:flex; justify-content:space-between; padding:.35rem 0; font-size:.9rem; border-bottom:1px solid var(--chb-border); }
    .totais-row:last-child { border-bottom:none; }
    .totais-total { font-size:1.1rem; font-weight:700; padding-top:.5rem; }
    .os-footer { position:fixed; bottom:0; left:0; right:0; z-index:100; display:flex; align-items:center; justify-content:space-between; background:var(--chb-surface); border-top:1px solid var(--chb-border); padding:.75rem 1.5rem; flex-wrap:wrap; gap:.5rem; }
    .footer-right { display:flex; gap:.5rem; flex-wrap:wrap; }
    @media (max-width:768px) {
      .os-grid { grid-template-columns: 1fr 1fr; }
      .os-field-wide { grid-column: span 2; }
    }
  `]
})
export class DavOsFormPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  readonly os = signal<any>({ ...DEMO_OS, numero: 'Nova OS', status: 'ABERTA', itens: [] });
  readonly loading = signal(false);
  readonly salvando = signal(false);

  showProdutoDialog = false;
  showClienteDialog = false;
  showServicoBuscaDialog = false;
  private tipoProduto: 'PECA' | 'SERVICO' = 'PECA';

  // Campos editáveis locais
  placaEdit = '';
  modeloEdit = '';
  quilometragemEdit = '';
  corEdit = '';
  queixaEdit = '';
  consultorEdit = '';

  readonly buscandoVeiculo = signal(false);
  readonly veiculoId = signal<string | null>(null);
  readonly consultores = signal<{label: string; value: string}[]>([]);
  readonly mecanicos = signal<{label: string; value: string}[]>([]);

  readonly pecas = computed(() => (this.os().itens ?? []).filter((i: any) => i.tipo === 'PECA'));
  readonly servicos = computed(() => (this.os().itens ?? []).filter((i: any) => i.tipo === 'SERVICO'));
  readonly subtotalPecas = computed(() =>
    this.pecas().reduce((s: number, i: any) => s + (i.quantidade * i.precoUnitario), 0)
  );
  readonly subtotalServicos = computed(() =>
    this.servicos().reduce((s: number, i: any) => s + (i.quantidade * i.precoUnitario), 0)
  );
  readonly totalOs = computed(() => this.subtotalPecas() + this.subtotalServicos());

  severidade(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warning' | 'danger'> = {
      'ABERTA': 'info', 'ORCAMENTO': 'warning', 'APROVADA': 'success',
      'FINALIZADA': 'secondary', 'CANCELADA': 'danger'
    };
    return map[status] ?? 'secondary';
  }

  ngOnInit(): void {
    this.carregarPessoas();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nova') {
        this.carregarOs(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.control.s', ['$event'])
  onCtrlS(e: KeyboardEvent): void { e.preventDefault(); this.salvar(); }

  @HostListener('document:keydown.f1', ['$event'])
  onF1(e: KeyboardEvent): void { e.preventDefault(); this.abrirBuscaProduto('PECA'); }

  @HostListener('document:keydown.f2', ['$event'])
  onF2(e: KeyboardEvent): void { e.preventDefault(); this.abrirBuscaServico(); }

  @HostListener('document:keydown.f4', ['$event'])
  onF4(e: KeyboardEvent): void { e.preventDefault(); this.showClienteDialog = true; }

  @HostListener('document:keydown.f8', ['$event'])
  onF8(e: KeyboardEvent): void { e.preventDefault(); if (this.os().status === 'ABERTA') this.gerarOrcamento(); }

  carregarPessoas(): void {
    const demo = (items: string[]) => items.map(n => ({ label: n, value: n }));
    this.http.get<any[]>('/api/v1/pessoas/consultores').pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(data => this.consultores.set(data?.map((p: any) => ({ label: p.nome ?? p.razaoSocial ?? String(p), value: p.nome ?? String(p) })) ?? demo(['Ana Consultora', 'João Consultor'])));
    this.http.get<any[]>('/api/v1/pessoas/mecanicos').pipe(catchError(() => of(null)), takeUntil(this.destroy$))
      .subscribe(data => this.mecanicos.set(data?.map((p: any) => ({ label: p.nome ?? p.razaoSocial ?? String(p), value: p.nome ?? String(p) })) ?? demo(['Carlos Mecânico', 'Pedro Mecânico', 'João Elétrico'])));
  }

  buscarVeiculoPorPlaca(): void {
    const placa = this.placaEdit.trim();
    if (!placa) return;
    this.buscandoVeiculo.set(true);
    this.http.get<any[]>(`/api/v1/veiculos/busca?q=${encodeURIComponent(placa)}`)
      .pipe(catchError(() => of(null)), finalize(() => this.buscandoVeiculo.set(false)), takeUntil(this.destroy$))
      .subscribe(data => {
        const v = Array.isArray(data) ? data[0] : data;
        if (v) {
          this.veiculoId.set(v.id ?? null);
          this.modeloEdit = `${v.modeloNome ?? v.modelo ?? ''} ${v.montadora ?? ''}`.trim();
          this.corEdit = v.corNome ?? v.cor ?? '';
          this.msg.add({ severity: 'success', summary: 'Veículo encontrado', detail: `${v.placa} — ${this.modeloEdit}` });
        } else {
          this.msg.add({ severity: 'warn', summary: 'Não encontrado', detail: `Nenhum veículo com placa "${placa}".` });
        }
      });
  }

  abrirBuscaServico(): void { this.showServicoBuscaDialog = true; }

  onServicoCatalogSelecionado(sv: ServicoItem): void {
    const novoItem = {
      id: 'svc-' + Date.now(),
      tipo: 'SERVICO',
      codigo: sv.codigo,
      descricao: sv.nome,
      quantidade: sv.tempoPrevisto ?? 1,
      precoUnitario: sv.preco,
      mecanico: ''
    };
    this.os.update(os => ({ ...os, itens: [...(os.itens ?? []), novoItem] }));
    this.showServicoBuscaDialog = false;
  }

  carregarOs(id: string): void {
    this.loading.set(true);
    this.http.get<any>(`/api/v1/servicos/dav-os/${id}`)
      .pipe(
        catchError(() => of({ ...DEMO_OS, id, itens: [] })),
        finalize(() => this.loading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.os.set(data);
        this.placaEdit = data.placa ?? '';
        this.modeloEdit = data.modelo ?? '';
        this.quilometragemEdit = data.quilometragem ?? '';
        this.corEdit = data.cor ?? '';
        this.queixaEdit = data.queixa ?? '';
      });
  }

  abrirBuscaProduto(tipo: 'PECA' | 'SERVICO'): void {
    this.tipoProduto = tipo;
    this.showProdutoDialog = true;
  }

  onProdutoSelecionado(produto: ProdutoItem): void {
    const novoItem = {
      id: 'item-' + Date.now(),
      tipo: this.tipoProduto,
      codigo: produto.codigo,
      descricao: produto.descricao,
      quantidade: 1,
      precoUnitario: produto.precoVenda ?? 0,
      mecanico: ''
    };
    this.os.update(os => ({ ...os, itens: [...(os.itens ?? []), novoItem] }));
    this.showProdutoDialog = false;
  }

  onClienteSelecionado(cliente: any): void {
    this.os.update(os => ({
      ...os,
      clienteId: cliente.id,
      clienteNome: cliente.razaoSocial ?? cliente.nome ?? cliente.clienteNome
    }));
    this.showClienteDialog = false;
  }

  adicionarServico(): void {
    const novoServico = {
      id: 'svc-' + Date.now(),
      tipo: 'SERVICO',
      codigo: 'SVC',
      descricao: '',
      quantidade: 1,
      precoUnitario: 0,
      mecanico: ''
    };
    this.os.update(os => ({ ...os, itens: [...(os.itens ?? []), novoServico] }));
  }

  removerItem(index: number, tipo: string): void {
    const itemsDoTipo = tipo === 'PECA' ? this.pecas() : this.servicos();
    const item = itemsDoTipo[index];
    this.os.update(os => ({ ...os, itens: (os.itens ?? []).filter((i: any) => i.id !== item.id) }));
  }

  recalcular(): void {
    // signals computed recalculam automaticamente
  }

  salvar(): void {
    const osAtual = this.os();
    const isNova = !osAtual.id || osAtual.id === 'os-001';
    this.salvando.set(true);

    const payload = {
      clienteId: osAtual.clienteId,
      clienteNome: osAtual.clienteNome,
      placa: this.placaEdit,
      modelo: this.modeloEdit,
      quilometragem: this.quilometragemEdit,
      cor: this.corEdit,
      queixa: this.queixaEdit,
      consultor: this.consultorEdit,
      veiculoId: this.veiculoId(),
      itens: osAtual.itens
    };

    const req = isNova
      ? this.http.post<any>('/api/v1/servicos/dav-os', payload)
      : this.http.put<any>(`/api/v1/servicos/dav-os/${osAtual.id}`, payload);

    req.pipe(
      catchError(() => of({ ...osAtual, ...payload, id: osAtual.id ?? 'demo-' + Date.now() })),
      finalize(() => this.salvando.set(false)),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.os.set(data);
      this.msg.add({ severity: 'success', summary: 'OS salva', detail: 'Ordem de serviço salva com sucesso!' });
    });
  }

  gerarOrcamento(): void {
    const id = this.os().id;
    if (!id) { this.salvar(); return; }
    this.salvando.set(true);
    this.http.post<any>(`/api/v1/servicos/dav-os/${id}/gerar-orcamento`, {})
      .pipe(
        catchError(() => of({ ...this.os(), status: 'ORCAMENTO' })),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.os.update(os => ({ ...os, status: data.status ?? 'ORCAMENTO' }));
        this.msg.add({ severity: 'success', summary: 'Orçamento gerado', detail: 'OS avançou para orçamento!' });
      });
  }

  finalizarOs(): void {
    const id = this.os().id;
    this.salvando.set(true);
    this.http.post<any>(`/api/v1/servicos/dav-os/${id}/finalizar`, {})
      .pipe(
        catchError(() => of({ ...this.os(), status: 'FINALIZADA' })),
        finalize(() => this.salvando.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.os.update(os => ({ ...os, status: data.status ?? 'FINALIZADA' }));
        this.msg.add({ severity: 'success', summary: 'OS finalizada', detail: 'Ordem de serviço finalizada!' });
      });
  }

  cancelarOs(): void {
    this.confirm.confirm({
      message: 'Tem certeza que deseja cancelar esta OS? Esta ação não pode ser desfeita.',
      header: 'Cancelar OS',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cancelar',
      rejectLabel: 'Não',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const id = this.os().id;
        this.http.post<any>(`/api/v1/servicos/dav-os/${id}/cancelar`, {})
          .pipe(
            catchError(() => of({ ...this.os(), status: 'CANCELADA' })),
            takeUntil(this.destroy$)
          )
          .subscribe(data => {
            this.os.update(os => ({ ...os, status: data.status ?? 'CANCELADA' }));
            this.msg.add({ severity: 'info', summary: 'OS cancelada', detail: 'Ordem de serviço cancelada.' });
          });
      }
    });
  }

  voltar(): void {
    void this.router.navigate(['/servicos/atendimento']);
  }
}
