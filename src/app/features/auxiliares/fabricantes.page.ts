import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-fabricantes-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class FabricantesPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Fabricantes',
    endpoint: '/api/v1/cadastros/auxiliares/fabricantes',
    colunas: [{ field: 'codigo', header: 'Código' }, { field: 'nome', header: 'Nome' }, { field: 'pais', header: 'País' }],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'pais', label: 'País' }
    ],
    demoData: [
      { id: '1', codigo: 'NGKBR', nome: 'NGK Brasil', pais: 'Brasil' },
      { id: '2', codigo: 'MAHLE', nome: 'Mahle Metal Leve', pais: 'Brasil' },
      { id: '3', codigo: 'DAYCO', nome: 'Dayco', pais: 'EUA' },
      { id: '4', codigo: 'GATES', nome: 'Gates', pais: 'EUA' },
      { id: '5', codigo: 'COBRQ', nome: 'Cobreq', pais: 'Brasil' },
    ]
  };
}
