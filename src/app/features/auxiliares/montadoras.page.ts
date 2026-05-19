import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-montadoras-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class MontadorasPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Montadoras',
    endpoint: '/api/v1/cadastros/auxiliares/montadoras',
    colunas: [{ field: 'codigo', header: 'Código' }, { field: 'nome', header: 'Nome' }, { field: 'pais', header: 'País' }],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'pais', label: 'País' }
    ],
    demoData: [
      { id: '1', codigo: 'HON', nome: 'Honda', pais: 'Japão' },
      { id: '2', codigo: 'YAM', nome: 'Yamaha', pais: 'Japão' },
      { id: '3', codigo: 'SUZ', nome: 'Suzuki', pais: 'Japão' },
      { id: '4', codigo: 'KAW', nome: 'Kawasaki', pais: 'Japão' },
      { id: '5', codigo: 'BMW', nome: 'BMW Motorrad', pais: 'Alemanha' },
    ]
  };
}
