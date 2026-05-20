import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-cores-veiculo-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class CoresVeiculoPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Cores de Veículo',
    endpoint: '/api/v1/veiculos/cores',
    colunas: [
      { field: 'codigo', header: 'Código' },
      { field: 'nome', header: 'Nome' }
    ],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true }
    ],
    demoData: [
      { id: '1', codigo: 'PRETA', nome: 'Preta' },
      { id: '2', codigo: 'BRANCA', nome: 'Branca' },
      { id: '3', codigo: 'VERMELHA', nome: 'Vermelha' },
      { id: '4', codigo: 'AZUL', nome: 'Azul' },
      { id: '5', codigo: 'PRATA', nome: 'Prata' },
      { id: '6', codigo: 'CINZA', nome: 'Cinza' },
      { id: '7', codigo: 'AMARELA', nome: 'Amarela' },
      { id: '8', codigo: 'VERDE', nome: 'Verde' }
    ]
  };
}
