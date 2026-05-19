import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-unidades-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class UnidadesPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Unidades de Medida',
    endpoint: '/api/v1/cadastros/auxiliares/unidades',
    colunas: [{ field: 'sigla', header: 'Sigla' }, { field: 'descricao', header: 'Descrição' }],
    campos: [
      { name: 'sigla', label: 'Sigla', required: true },
      { name: 'descricao', label: 'Descrição', required: true }
    ],
    demoData: [
      { id: '1', sigla: 'UN', descricao: 'Unidade' },
      { id: '2', sigla: 'PC', descricao: 'Peça' },
      { id: '3', sigla: 'KG', descricao: 'Quilograma' },
      { id: '4', sigla: 'L', descricao: 'Litro' },
      { id: '5', sigla: 'MT', descricao: 'Metro' },
      { id: '6', sigla: 'CX', descricao: 'Caixa' },
    ]
  };
}
