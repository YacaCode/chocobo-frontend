import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-grupos-mercadoria-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class GruposMercadoriaPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Grupos de Mercadoria',
    endpoint: '/api/v1/cadastros/grupos-mercadoria',
    colunas: [
      { field: 'codigo', header: 'Código' },
      { field: 'nome', header: 'Nome' }
    ],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true }
    ],
    demoData: [
      { id: '1', codigo: 'PECAS', nome: 'Peças e Componentes' },
      { id: '2', codigo: 'SERVICOS', nome: 'Serviços' },
      { id: '3', codigo: 'ACESS', nome: 'Acessórios' },
      { id: '4', codigo: 'CONSUM', nome: 'Consumíveis' },
      { id: '5', codigo: 'PNEUS', nome: 'Pneus e Câmaras' }
    ]
  };
}
