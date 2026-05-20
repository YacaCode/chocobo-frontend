import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-promocoes-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class PromocoesPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Promoções',
    endpoint: '/api/v1/cadastros/promocoes',
    colunas: [
      { field: 'nome', header: 'Nome' },
      { field: 'tipoDesconto', header: 'Tipo' },
      { field: 'valorDesconto', header: 'Desconto' },
      { field: 'dataInicio', header: 'Início' },
      { field: 'dataFim', header: 'Fim' }
    ],
    campos: [
      { name: 'nome', label: 'Nome da Promoção', required: true },
      { name: 'descricao', label: 'Descrição', required: false },
      { name: 'tipoDesconto', label: 'Tipo de Desconto (PERCENTUAL/VALOR)', required: true },
      { name: 'valorDesconto', label: 'Valor do Desconto', type: 'number', required: true },
      { name: 'dataInicio', label: 'Data Início', required: true },
      { name: 'dataFim', label: 'Data Fim', required: true }
    ],
    demoData: [
      { id: '1', nome: 'Desconto Óleo 15%', tipoDesconto: 'PERCENTUAL', valorDesconto: 15, dataInicio: '2026-05-01', dataFim: '2026-05-31' },
      { id: '2', nome: 'Promoção Filtros R$5', tipoDesconto: 'VALOR', valorDesconto: 5, dataInicio: '2026-05-15', dataFim: '2026-06-15' }
    ]
  };
}
