import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-tipos-produto-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class TiposProdutoPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Tipos de Produto',
    endpoint: '/api/v1/cadastros/tipos-produto',
    colunas: [
      { field: 'codigo', header: 'Código' },
      { field: 'nome', header: 'Nome' }
    ],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true }
    ],
    demoData: [
      { id: '1', codigo: 'PRODUTO', nome: 'Produto' },
      { id: '2', codigo: 'SERVICO', nome: 'Serviço' },
      { id: '3', codigo: 'CONJUNTO', nome: 'Conjunto/Kit' },
      { id: '4', codigo: 'BRINDE', nome: 'Brinde/Promocional' }
    ]
  };
}
