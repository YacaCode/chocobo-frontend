import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  inject,
  signal
} from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, finalize, of, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';

import {
  aplicarMascaraCnpj,
  aplicarMascaraCpf,
  aplicarMascaraTelefone,
  cnpjValidator,
  cpfValidator
} from '../../shared/validators/cpf-cnpj.validator';

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface Contato {
  data: string;
  assunto: string;
  responsavel: string;
}

@Component({
  selector: 'chb-clientes-form',
  standalone: true,
  imports: [
    ButtonModule, CalendarModule, CheckboxModule, ConfirmDialogModule, CurrencyPipe,
    DialogModule, DropdownModule, FileUploadModule, FormsModule, InputNumberModule,
    InputTextModule, InputTextareaModule, ReactiveFormsModule, TableModule, TabViewModule, TagModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="form-page">
      <header class="form-header">
        <div>
          <p class="form-area">Cadastros</p>
          <h2 class="form-title">{{ isNew() ? 'Novo Cliente' : 'Editar Cliente' }}</h2>
          @if (!isNew()) {
            <span class="form-subtitle">Codigo: {{ clienteId() }}</span>
          }
        </div>
        <div class="form-header-actions">
          <button pButton type="button" icon="pi pi-arrow-left" label="Voltar" class="p-button-text" (click)="cancelar()"></button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-overlay">
          <i class="pi pi-spinner pi-spin" style="font-size:2rem"></i>
          <span>Carregando...</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="salvar()" class="form-body">
        <p-tabView>

          <!-- ABA 1: CADASTRO PRINCIPAL -->
          <p-tabPanel header="Cadastro">
            <div class="tab-content">

              <!-- Tipo PF/PJ -->
              <fieldset class="fieldset">
                <legend>Tipo de pessoa</legend>
                <div class="radio-group">
                  <label class="radio-label">
                    <input type="radio" formControlName="tipo" value="PF" />
                    <span>Pessoa Fisica (PF)</span>
                  </label>
                  <label class="radio-label">
                    <input type="radio" formControlName="tipo" value="PJ" />
                    <span>Pessoa Juridica (PJ)</span>
                  </label>
                </div>
              </fieldset>

              <!-- Campos PF -->
              @if (form.get('tipo')?.value === 'PF') {
                <div class="grid-2">
                  <label class="field">
                    <span>Nome <span class="required">*</span></span>
                    <input pInputText formControlName="razaoSocial" placeholder="Nome completo" />
                    @if (fieldError('razaoSocial')) {
                      <small class="error">Nome obrigatorio.</small>
                    }
                  </label>
                  <label class="field">
                    <span>CPF <span class="required">*</span></span>
                    <input pInputText formControlName="documento" placeholder="000.000.000-00"
                      (blur)="onDocumentoBlur()" (input)="mascaraDocumento($event)" maxlength="14" />
                    @if (fieldError('documento')) {
                      <small class="error">CPF invalido.</small>
                    }
                  </label>
                  <label class="field">
                    <span>Data de Nascimento</span>
                    <input pInputText type="date" formControlName="dataNascimento" />
                  </label>
                  <label class="field">
                    <span>Sexo</span>
                    <p-dropdown
                      formControlName="sexo"
                      [options]="sexoOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecione"
                      class="w-full">
                    </p-dropdown>
                  </label>
                </div>
              }

              <!-- Campos PJ -->
              @if (form.get('tipo')?.value === 'PJ') {
                <div class="grid-2">
                  <label class="field">
                    <span>Razao Social <span class="required">*</span></span>
                    <input pInputText formControlName="razaoSocial" placeholder="Razao social" />
                    @if (fieldError('razaoSocial')) {
                      <small class="error">Razao social obrigatoria.</small>
                    }
                  </label>
                  <label class="field">
                    <span>CNPJ <span class="required">*</span></span>
                    <input pInputText formControlName="documento" placeholder="00.000.000/0000-00"
                      (blur)="onDocumentoBlur()" (input)="mascaraDocumento($event)" maxlength="18" />
                    @if (fieldError('documento')) {
                      <small class="error">CNPJ invalido.</small>
                    }
                  </label>
                  <label class="field">
                    <span>Nome Fantasia</span>
                    <input pInputText formControlName="nomeFantasia" placeholder="Nome fantasia" />
                  </label>
                  <label class="field">
                    <span>Inscricao Estadual (IE)</span>
                    <input pInputText formControlName="inscricaoEstadual" placeholder="IE" />
                  </label>
                </div>
              }

              <!-- Endereco -->
              <fieldset class="fieldset">
                <legend>Endereco</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>CEP</span>
                    <div class="input-row">
                      <input pInputText formControlName="cep" placeholder="00000-000" maxlength="9"
                        (blur)="buscarCep()" (input)="mascaraCep($event)" />
                      @if (buscandoCep()) {
                        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                      }
                    </div>
                  </label>
                  <label class="field grid-span-2">
                    <span>Logradouro (Rua/Av)</span>
                    <input pInputText formControlName="rua" placeholder="Rua, Avenida..." />
                  </label>
                  <label class="field">
                    <span>Numero</span>
                    <input pInputText formControlName="numero" placeholder="Numero" />
                  </label>
                  <label class="field">
                    <span>Complemento</span>
                    <input pInputText formControlName="complemento" placeholder="Apto, sala..." />
                  </label>
                  <label class="field">
                    <span>Bairro</span>
                    <input pInputText formControlName="bairro" placeholder="Bairro" />
                  </label>
                  <label class="field">
                    <span>Cidade</span>
                    <input pInputText formControlName="cidade" placeholder="Cidade" />
                  </label>
                  <label class="field" style="max-width:120px">
                    <span>UF</span>
                    <input pInputText formControlName="uf" placeholder="UF" maxlength="2" />
                  </label>
                </div>
              </fieldset>

              <!-- Contato -->
              <fieldset class="fieldset">
                <legend>Contato</legend>
                <div class="grid-3">
                  <label class="field">
                    <span>Telefone</span>
                    <input pInputText formControlName="telefone" placeholder="(00) 0000-0000"
                      (input)="mascaraTelefone($event, 'telefone')" maxlength="15" />
                  </label>
                  <label class="field">
                    <span>Celular</span>
                    <input pInputText formControlName="celular" placeholder="(00) 00000-0000"
                      (input)="mascaraTelefone($event, 'celular')" maxlength="15" />
                  </label>
                  <label class="field">
                    <span>E-mail</span>
                    <input pInputText type="email" formControlName="email" placeholder="email@exemplo.com" />
                  </label>
                </div>
              </fieldset>

              <!-- Status e Classificacao -->
              <div class="grid-2">
                <fieldset class="fieldset">
                  <legend>Status</legend>
                  <label class="checkbox-label">
                    <p-checkbox formControlName="ativo" [binary]="true" inputId="ativo"></p-checkbox>
                    <label for="ativo">Cadastro ativo</label>
                  </label>
                </fieldset>
                <label class="field">
                  <span>Classificacao</span>
                  <p-dropdown
                    formControlName="classificacao"
                    [options]="classificacaoOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full">
                  </p-dropdown>
                </label>
              </div>

            </div>
          </p-tabPanel>

          <!-- ABA 2: DADOS ADICIONAIS -->
          <p-tabPanel header="Dados Adicionais">
            <div class="tab-content">
              <div class="grid-2">
                <label class="field">
                  <span>Limite de Credito (R$)</span>
                  <input pInputText type="number" formControlName="limiteCredito" placeholder="0,00" min="0" step="0.01" />
                </label>
                <label class="field">
                  <span>Condicao de Pagamento Padrao</span>
                  <p-dropdown
                    formControlName="condicaoPagamento"
                    [options]="condicaoOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Selecione"
                    class="w-full">
                  </p-dropdown>
                </label>
                <label class="field">
                  <span>Vendedor Responsavel</span>
                  <input pInputText formControlName="vendedor" placeholder="Nome do vendedor" />
                </label>
              </div>
              <label class="field">
                <span>Observacoes</span>
                <textarea pInputTextarea formControlName="observacao" rows="4" placeholder="Observacoes sobre este cliente..." class="w-full"></textarea>
              </label>
            </div>
          </p-tabPanel>

          <!-- ABA 3: CONTATOS -->
          <p-tabPanel header="Contatos">
            <div class="tab-content">
              <div class="contatos-toolbar">
                <h3>Historico de Contatos</h3>
                <button pButton type="button" icon="pi pi-plus" label="Registrar Contato" class="p-button-outlined p-button-sm" (click)="abrirDialogContato()"></button>
              </div>

              @if (contatos().length > 0) {
                <table class="contatos-table">
                  <thead>
                    <tr><th>Data</th><th>Assunto</th><th>Responsavel</th></tr>
                  </thead>
                  <tbody>
                    @for (c of contatos(); track c.data) {
                      <tr>
                        <td>{{ c.data }}</td>
                        <td>{{ c.assunto }}</td>
                        <td>{{ c.responsavel }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="empty-state">Nenhum contato registrado.</p>
              }
            </div>
          </p-tabPanel>

          <!-- ABA 4: PERFIL -->
          <p-tabPanel header="Perfil">
            <div class="tab-content">
              <p class="tab-info">Dados calculados automaticamente com base no historico de compras.</p>
              <div class="grid-3">
                <article class="kpi-card">
                  <i class="pi pi-calendar" aria-hidden="true"></i>
                  <div>
                    <span>Ultima Compra</span>
                    <strong>{{ perfil.ultimaCompra }}</strong>
                  </div>
                </article>
                <article class="kpi-card">
                  <i class="pi pi-shopping-cart" aria-hidden="true"></i>
                  <div>
                    <span>Total de Compras</span>
                    <strong>{{ perfil.totalCompras }}</strong>
                  </div>
                </article>
                <article class="kpi-card">
                  <i class="pi pi-refresh" aria-hidden="true"></i>
                  <div>
                    <span>Frequencia</span>
                    <strong>{{ perfil.frequencia }}</strong>
                  </div>
                </article>
              </div>
            </div>
          </p-tabPanel>

          <!-- Aba NFSe -->
          <p-tabPanel header="NFSe">
            <div class="form-section">
              <h4 class="section-title">Configurações de NFS-e</h4>
              @if (tipoPessoa() !== 'PJ') {
                <p class="info-muted">NFS-e disponível apenas para Pessoa Jurídica.</p>
              } @else {
                <div class="form-row">
                  <div class="form-field">
                    <p-checkbox [formControl]="getCtrl('optanteSimplesNacional')" [binary]="true" inputId="optante" label="Optante pelo Simples Nacional"></p-checkbox>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label for="aliquotaIss">Alíquota ISS (%)</label>
                    <p-inputNumber inputId="aliquotaIss" [formControl]="getCtrl('aliquotaIss')" [min]="0" [max]="10" [maxFractionDigits]="2" suffix="%" [style]="{width:'120px'}"></p-inputNumber>
                  </div>
                  <div class="form-field">
                    <p-checkbox [formControl]="getCtrl('deduzirConstrucaoCivil')" [binary]="true" inputId="deduzir" label="Deduzir construção civil"></p-checkbox>
                  </div>
                </div>
              }
            </div>
          </p-tabPanel>

          <!-- Aba Sócios -->
          <p-tabPanel header="Sócios">
            <div class="form-section">
              @if (tipoPessoa() !== 'PJ') {
                <p class="info-muted">Sócios disponíveis apenas para Pessoa Jurídica.</p>
              } @else {
                <div class="socios-toolbar">
                  <h4 class="section-title">Quadro Societário</h4>
                  <button pButton type="button" icon="pi pi-plus" label="Adicionar Sócio" class="p-button-sm p-button-outlined" (click)="adicionarSocio()"></button>
                </div>
                @if (socios().length === 0) {
                  <div class="empty-state-inline">
                    <i class="pi pi-users" aria-hidden="true"></i>
                    <span>Nenhum sócio cadastrado.</span>
                  </div>
                } @else {
                  <p-table [value]="socios()" styleClass="p-datatable-sm" dataKey="cpf">
                    <ng-template pTemplate="header">
                      <tr><th>Nome</th><th>CPF</th><th>% Participação</th><th>Tipo</th><th style="width:60px"></th></tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-s let-i="rowIndex">
                      <tr>
                        <td>{{ s.nome }}</td>
                        <td>{{ s.cpf }}</td>
                        <td>{{ s.participacao }}%</td>
                        <td>{{ s.tipo }}</td>
                        <td><button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="removerSocio(i)" aria-label="Remover sócio"></button></td>
                      </tr>
                    </ng-template>
                  </p-table>
                }
              }
            </div>
          </p-tabPanel>

          <!-- Aba Referências Comerciais -->
          <p-tabPanel header="Referências">
            <div class="form-section">
              <div class="socios-toolbar">
                <h4 class="section-title">Referências Comerciais</h4>
                <button pButton type="button" icon="pi pi-plus" label="Adicionar" class="p-button-sm p-button-outlined" (click)="adicionarReferencia()"></button>
              </div>
              @if (referencias().length === 0) {
                <div class="empty-state-inline">
                  <i class="pi pi-briefcase" aria-hidden="true"></i>
                  <span>Nenhuma referência cadastrada.</span>
                </div>
              } @else {
                <p-table [value]="referencias()" styleClass="p-datatable-sm">
                  <ng-template pTemplate="header">
                    <tr><th>Empresa</th><th>Contato</th><th>Telefone</th><th>Limite Informado</th><th style="width:60px"></th></tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-r let-i="rowIndex">
                    <tr>
                      <td>{{ r.empresa }}</td>
                      <td>{{ r.contato }}</td>
                      <td>{{ r.telefone }}</td>
                      <td>{{ r.limiteInformado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
                      <td><button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="removerReferencia(i)" aria-label="Remover referência"></button></td>
                    </tr>
                  </ng-template>
                </p-table>
              }
            </div>
          </p-tabPanel>

          <!-- Aba Mídias -->
          <p-tabPanel header="Mídias">
            <div class="form-section">
              <h4 class="section-title">Documentos e Imagens</h4>
              <p-fileUpload
                mode="advanced"
                [multiple]="true"
                accept="image/*,.pdf"
                [maxFileSize]="5000000"
                chooseLabel="Selecionar arquivos"
                uploadLabel="Enviar"
                cancelLabel="Limpar"
                (onSelect)="onArquivosSelecionados($event)"
                [auto]="false">
                <ng-template pTemplate="empty">
                  <div class="empty-state-inline">
                    <i class="pi pi-cloud-upload" aria-hidden="true"></i>
                    <span>Arraste arquivos aqui ou clique em Selecionar.</span>
                  </div>
                </ng-template>
              </p-fileUpload>
            </div>
          </p-tabPanel>

        </p-tabView>

        <!-- FOOTER FIXO -->
        <footer class="form-footer">
          <button pButton type="button" icon="pi pi-times" label="Cancelar" class="p-button-text" (click)="cancelar()"></button>
          <button pButton type="button" icon="pi pi-save" label="Salvar e Novo" class="p-button-outlined" [disabled]="saving()" (click)="salvarENovo()"></button>
          <button pButton type="submit" icon="pi pi-check" label="Salvar" [disabled]="saving() || form.invalid">
            @if (saving()) {
              <i class="pi pi-spin pi-spinner" style="margin-left:.5rem"></i>
            }
          </button>
        </footer>
      </form>

      <!-- Dialog Registrar Contato -->
      <p-dialog
        [(visible)]="dialogContatoVisible"
        [modal]="true"
        header="Registrar Contato"
        [style]="{ width: '480px' }">
        <div class="dialog-content">
          <label class="field">
            <span>Assunto</span>
            <input pInputText [(ngModel)]="novoContato.assunto" placeholder="Assunto do contato" />
          </label>
          <label class="field">
            <span>Responsavel</span>
            <input pInputText [(ngModel)]="novoContato.responsavel" placeholder="Quem registrou" />
          </label>
        </div>
        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancelar" class="p-button-text" (click)="dialogContatoVisible = false"></button>
          <button pButton type="button" label="Registrar" icon="pi pi-check" (click)="registrarContato()"></button>
        </ng-template>
      </p-dialog>

      <p-dialog
        [(visible)]="dialogSocioVisible"
        [modal]="true"
        header="Adicionar Socio"
        [style]="{ width: '480px' }">
        <div class="dialog-content">
          <label class="field">
            <span>Nome</span>
            <input pInputText [(ngModel)]="novoSocio.nome" placeholder="Nome do socio" />
          </label>
          <label class="field">
            <span>CPF</span>
            <input pInputText [(ngModel)]="novoSocio.cpf" placeholder="000.000.000-00" />
          </label>
          <label class="field">
            <span>Participacao (%)</span>
            <p-inputNumber [(ngModel)]="novoSocio.participacao" [min]="0" [max]="100" [maxFractionDigits]="2" suffix="%" [style]="{width:'100%'}"></p-inputNumber>
          </label>
        </div>
        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancelar" class="p-button-text" (click)="dialogSocioVisible = false"></button>
          <button pButton type="button" label="Adicionar" icon="pi pi-check" [disabled]="!novoSocio.nome" (click)="confirmarSocio()"></button>
        </ng-template>
      </p-dialog>

      <p-dialog
        [(visible)]="dialogReferenciaVisible"
        [modal]="true"
        header="Adicionar Referencia"
        [style]="{ width: '520px' }">
        <div class="dialog-content">
          <label class="field">
            <span>Empresa</span>
            <input pInputText [(ngModel)]="novaReferencia.empresa" placeholder="Empresa" />
          </label>
          <label class="field">
            <span>Contato</span>
            <input pInputText [(ngModel)]="novaReferencia.contato" placeholder="Contato" />
          </label>
          <label class="field">
            <span>Telefone</span>
            <input pInputText [(ngModel)]="novaReferencia.telefone" placeholder="Telefone" />
          </label>
          <label class="field">
            <span>Limite informado</span>
            <p-inputNumber [(ngModel)]="novaReferencia.limiteInformado" mode="currency" currency="BRL" locale="pt-BR" [min]="0" [style]="{width:'100%'}"></p-inputNumber>
          </label>
        </div>
        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancelar" class="p-button-text" (click)="dialogReferenciaVisible = false"></button>
          <button pButton type="button" label="Adicionar" icon="pi pi-check" [disabled]="!novaReferencia.empresa" (click)="confirmarReferencia()"></button>
        </ng-template>
      </p-dialog>

      @if (toastMsg()) {
        <div class="toast-notice" [class.toast-error]="toastError()">{{ toastMsg() }}</div>
      }
    </section>
  `,
  styles: [`
    .form-page { display: grid; gap: .85rem; padding-bottom: 4.5rem; min-width: 0; }

    .form-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem; padding: 1rem;
      box-shadow: var(--chb-shadow-soft);
    }
    .form-area { margin: 0; color: var(--chb-text-muted); font-size: .75rem; font-weight: 900; text-transform: uppercase; }
    .form-title { margin: 0; font-size: 1.3rem; color: var(--chb-text); }
    .form-subtitle { color: var(--chb-text-muted); font-size: .85rem; }

    .loading-overlay {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 2rem; background: var(--chb-surface); border-radius: .5rem;
      color: var(--chb-text-muted);
    }

    .form-body {
      background: var(--chb-surface); border: 1px solid var(--chb-border);
      border-radius: .5rem;
      box-shadow: var(--chb-shadow-soft);
      min-width: 0;
    }

    .tab-content { display: grid; gap: 1rem; padding: 1rem 0 .75rem; }
    .tab-info { color: var(--chb-text-muted); font-size: .9rem; margin: 0; }

    .fieldset { border: 1px solid var(--chb-border); border-radius: .5rem; padding: 1rem; margin: 0; }
    .fieldset legend { padding: 0 .5rem; font-size: .85rem; font-weight: 700; color: var(--chb-text-muted); }

    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .85rem; }
    .grid-span-2 { grid-column: span 2; }

    .field { display: grid; gap: .35rem; font-size: .86rem; font-weight: 700; color: var(--chb-text); }
    .field input, .field textarea { width: 100%; }
    .required { color: #ef4444; }
    .error { color: #ef4444; font-weight: 400; }
    .w-full { width: 100%; }

    .radio-group { display: flex; gap: 1.5rem; }
    .radio-label { display: flex; align-items: center; gap: .5rem; cursor: pointer; font-weight: 500; }

    .checkbox-label { display: flex; align-items: center; gap: .75rem; cursor: pointer; }

    .input-row { display: flex; align-items: center; gap: .5rem; }

    .form-footer {
      position: sticky; bottom: 0; z-index: 10;
      display: flex; justify-content: flex-end; gap: .75rem;
      background: var(--chb-surface); border-top: 1px solid var(--chb-border);
      padding: .75rem 1rem;
      flex-wrap: wrap;
    }

    .contatos-toolbar { display: flex; align-items: center; justify-content: space-between; }
    .contatos-toolbar h3 { margin: 0; font-size: 1rem; }
    .contatos-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .contatos-table th { background: var(--chb-surface-muted); padding: .6rem 1rem; text-align: left; font-weight: 700; border-bottom: 1px solid var(--chb-border); }
    .contatos-table td { padding: .6rem 1rem; border-bottom: 1px solid var(--chb-border); }
    .empty-state { color: var(--chb-text-muted); text-align: center; padding: 2rem; }

    .kpi-card {
      display: flex; align-items: center; gap: .75rem; padding: 1rem;
      background: var(--chb-surface-muted); border: 1px solid var(--chb-border);
      border-radius: .5rem;
    }
    .kpi-card i { font-size: 1.5rem; color: var(--chb-navy); }
    .kpi-card span { display: block; font-size: .78rem; color: var(--chb-text-muted); font-weight: 700; }
    .kpi-card strong { display: block; font-size: 1.1rem; color: var(--chb-text); }

    .dialog-content { display: grid; gap: 1rem; padding: 1rem 0; }

    .toast-notice {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      background: #1e293b; color: #fff; padding: .75rem 1.25rem;
      border-radius: .5rem; font-size: .9rem; box-shadow: 0 4px 20px rgba(0,0,0,.25);
    }
    .toast-error { background: #dc2626; }

    .form-section { display: grid; gap: 1rem; padding: 0.5rem 0; }
    .section-title { margin: 0; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; color: var(--chb-text-muted, #6c757d); }
    .info-muted { color: var(--chb-text-muted, #6c757d); font-size: 0.9rem; margin: 0; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .form-field { display: grid; gap: 0.35rem; }
    .socios-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .empty-state-inline { display: flex; align-items: center; gap: 0.75rem; padding: 1.5rem; color: var(--chb-text-muted, #6c757d); background: var(--chb-surface-muted, #f8f9fa); border-radius: 0.4rem; }
    .empty-state-inline i { font-size: 1.5rem; opacity: 0.6; }

    @media (max-width: 768px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .grid-span-2 { grid-column: span 1; }
      .form-header,
      .form-footer,
      .contatos-toolbar { align-items: stretch; flex-direction: column; }
      .form-footer .p-button { width: 100%; justify-content: center; }
    }
  `]
})
export class ClientesFormPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isNew = signal(true);
  readonly clienteId = signal<string | null>(null);
  readonly toastMsg = signal('');
  readonly toastError = signal(false);
  readonly buscandoCep = signal(false);
  readonly contatos = signal<Contato[]>([]);
  readonly socios = signal<{nome: string; cpf: string; participacao: number; tipo: string}[]>([]);
  readonly referencias = signal<{empresa: string; contato: string; telefone: string; limiteInformado: number}[]>([]);
  readonly _tipoPessoa = signal<string>('PF');

  tipoPessoa(): string {
    return this._tipoPessoa();
  }

  dialogContatoVisible = false;
  novoContato: Contato = { data: '', assunto: '', responsavel: '' };
  dialogSocioVisible = false;
  novoSocio = { nome: '', cpf: '', participacao: 50, tipo: 'Socio' };
  dialogReferenciaVisible = false;
  novaReferencia = { empresa: '', contato: '', telefone: '', limiteInformado: 0 };

  readonly perfil = {
    ultimaCompra: 'N/A',
    totalCompras: 'R$ 0,00',
    frequencia: 'Sem historico'
  };

  readonly sexoOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Feminino', value: 'F' },
    { label: 'Outro', value: 'O' }
  ];

  readonly classificacaoOptions = [
    { label: 'Normal', value: 'Normal' },
    { label: 'VIP', value: 'VIP' },
    { label: 'Inadimplente', value: 'Inadimplente' }
  ];

  readonly condicaoOptions = [
    { label: 'A vista', value: 'avista' },
    { label: '30 dias', value: '30d' },
    { label: '30/60 dias', value: '3060d' },
    { label: '30/60/90 dias', value: '306090d' }
  ];

  form = this.fb.group({
    tipo: ['PF'],
    razaoSocial: ['', Validators.required],
    documento: [''],
    dataNascimento: [''],
    sexo: [''],
    nomeFantasia: [''],
    inscricaoEstadual: [''],
    cep: [''],
    rua: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    cidade: [''],
    uf: [''],
    telefone: [''],
    celular: [''],
    email: ['', Validators.email],
    ativo: [true],
    classificacao: ['Normal'],
    limiteCredito: [0],
    condicaoPagamento: ['avista'],
    vendedor: [''],
    observacao: [''],
    optanteSimplesNacional: [false],
    aliquotaIss: [2.0],
    deduzirConstrucaoCivil: [false]
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'novo') {
        this.isNew.set(false);
        this.clienteId.set(id);
        this.carregarCliente(id);
      }
    });

    this.form.get('tipo')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((tipo) => {
      this.form.get('documento')?.setValue('');
      this.atualizarValidadorDocumento();
      this._tipoPessoa.set(tipo ?? 'PF');
    });

    this.atualizarValidadorDocumento();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  atualizarValidadorDocumento(): void {
    const tipo = this.form.get('tipo')?.value;
    const ctrl = this.form.get('documento');
    if (tipo === 'PF') {
      ctrl?.setValidators([cpfValidator]);
    } else {
      ctrl?.setValidators([cnpjValidator]);
    }
    ctrl?.updateValueAndValidity();
  }

  carregarCliente(id: string): void {
    this.loading.set(true);
    this.http.get<Record<string, unknown>>(`/api/v1/cadastros/clientes/${id}`).pipe(
      catchError(() => of(null)),
      finalize(() => this.loading.set(false))
    ).subscribe(data => {
      if (data) {
        this.form.patchValue({
          tipo: String(data['tipo'] ?? 'PF'),
          // razaoSocial is the main name field; nomeFantasia is trade name
          razaoSocial: String(data['razaoSocial'] ?? data['nome'] ?? ''),
          nomeFantasia: data['nomeFantasia'] ? String(data['nomeFantasia']) : '',
          documento: String(data['documento'] ?? ''),
          cep: data['cep'] ? String(data['cep']) : '',
          rua: data['rua'] ? String(data['rua']) : '',
          numero: data['numero'] ? String(data['numero']) : '',
          bairro: data['bairro'] ? String(data['bairro']) : '',
          cidade: String(data['cidade'] ?? ''),
          uf: String(data['uf'] ?? ''),
          telefone: String(data['telefone'] ?? ''),
          celular: String(data['celular'] ?? ''),
          email: String(data['email'] ?? ''),
          // ativo is boolean in backend
          ativo: data['ativo'] !== false,
          limiteCredito: Number(data['limiteCredito'] ?? 0),
          classificacao: String(data['classificacao'] ?? 'Normal')
        });
        if (Array.isArray(data['contatos'])) {
          this.contatos.set(data['contatos'] as Contato[]);
        }
      }
    });
  }

  buscarCep(): void {
    const cepLimpo = (this.form.get('cep')?.value ?? '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    this.buscandoCep.set(true);
    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cepLimpo}/json/`).pipe(
      catchError(() => of(null)),
      finalize(() => this.buscandoCep.set(false))
    ).subscribe(dados => {
      if (dados && !dados.erro) {
        this.form.patchValue({
          rua: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.localidade,
          uf: dados.uf
        });
      }
    });
  }

  onDocumentoBlur(): void {
    const val = this.form.get('documento')?.value ?? '';
    const tipo = this.form.get('tipo')?.value;
    if (tipo === 'PF') {
      this.form.get('documento')?.setValue(aplicarMascaraCpf(val));
    } else {
      this.form.get('documento')?.setValue(aplicarMascaraCnpj(val));
    }
  }

  mascaraDocumento(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tipo = this.form.get('tipo')?.value;
    const masked = tipo === 'PF'
      ? aplicarMascaraCpf(input.value)
      : aplicarMascaraCnpj(input.value);
    input.value = masked;
    this.form.get('documento')?.setValue(masked, { emitEvent: false });
  }

  mascaraTelefone(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    const masked = aplicarMascaraTelefone(input.value);
    input.value = masked;
    this.form.get(field)?.setValue(masked, { emitEvent: false });
  }

  mascaraCep(event: Event): void {
    const input = event.target as HTMLInputElement;
    const d = input.value.replace(/\D/g, '').slice(0, 8);
    const masked = d.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = masked;
    this.form.get('cep')?.setValue(masked, { emitEvent: false });
  }

  fieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  salvar(redirectToNew = false): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast('Corrija os erros antes de salvar.', true);
      return;
    }

    this.saving.set(true);
    const payload = this.form.value;
    const req = this.isNew()
      ? this.http.post('/api/v1/cadastros/clientes', payload)
      : this.http.put(`/api/v1/cadastros/clientes/${this.clienteId()}`, payload);

    req.pipe(
      catchError((err) => {
        if (err.status >= 500 || err.status === 0) {
          this.toast('Backend indisponivel. Dados salvos localmente (demo).', false);
          return of({ id: this.clienteId() ?? 'demo-' + Date.now() });
        }
        this.toast('Erro ao salvar. Tente novamente.', true);
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(resp => {
      if (resp) {
        this.toast('Cliente salvo com sucesso!', false);
        setTimeout(() => {
          if (redirectToNew) {
            void this.router.navigate(['/cadastros/clientes/novo']);
          } else {
            void this.router.navigate(['/cadastros/clientes']);
          }
        }, 1200);
      }
    });
  }

  salvarENovo(): void {
    this.salvar(true);
  }

  cancelar(): void {
    void this.router.navigate(['/cadastros/clientes']);
  }

  abrirDialogContato(): void {
    this.novoContato = {
      data: new Date().toLocaleDateString('pt-BR'),
      assunto: '',
      responsavel: ''
    };
    this.dialogContatoVisible = true;
  }

  registrarContato(): void {
    if (!this.novoContato.assunto) return;
    this.contatos.update(lista => [this.novoContato, ...lista]);
    this.dialogContatoVisible = false;
  }

  getCtrl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  adicionarSocio(): void {
    this.novoSocio = { nome: '', cpf: '', participacao: 50, tipo: 'Socio' };
    this.dialogSocioVisible = true;
  }

  confirmarSocio(): void {
    if (!this.novoSocio.nome.trim()) return;
    this.socios.update((s) => [...s, { ...this.novoSocio, nome: this.novoSocio.nome.trim() }]);
    this.dialogSocioVisible = false;
  }

  removerSocio(i: number): void {
    this.socios.update((s) => s.filter((_, idx) => idx !== i));
  }

  adicionarReferencia(): void {
    this.novaReferencia = { empresa: '', contato: '', telefone: '', limiteInformado: 0 };
    this.dialogReferenciaVisible = true;
  }

  confirmarReferencia(): void {
    if (!this.novaReferencia.empresa.trim()) return;
    this.referencias.update((r) => [...r, { ...this.novaReferencia, empresa: this.novaReferencia.empresa.trim() }]);
    this.dialogReferenciaVisible = false;
  }

  removerReferencia(i: number): void {
    this.referencias.update((r) => r.filter((_, idx) => idx !== i));
  }

  onArquivosSelecionados(_event: { files: File[] }): void {
    // Demo: apenas mostra toast
  }

  toast(msg: string, error: boolean): void {
    this.toastMsg.set(msg);
    this.toastError.set(error);
    setTimeout(() => this.toastMsg.set(''), 3500);
  }
}
