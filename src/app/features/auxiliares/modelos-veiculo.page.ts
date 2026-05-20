import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-modelos-veiculo-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class ModelosVeiculoPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Modelos de Veículo',
    endpoint: '/api/v1/veiculos/modelos',
    colunas: [
      { field: 'codigo', header: 'Código' },
      { field: 'nome', header: 'Nome' },
      { field: 'montadoraNome', header: 'Montadora' }
    ],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'montadora', label: 'Montadora (código)', required: false }
    ],
    demoData: [
      { id: '1', codigo: 'FACTOR150', nome: 'Factor 150', montadora: 'YAMAHA', montadoraNome: 'Yamaha' },
      { id: '2', codigo: 'BROS150', nome: 'Bros 150', montadora: 'HONDA', montadoraNome: 'Honda' },
      { id: '3', codigo: 'BROS125', nome: 'Bros 125', montadora: 'HONDA', montadoraNome: 'Honda' },
      { id: '4', codigo: 'BIZ125', nome: 'Biz 125', montadora: 'HONDA', montadoraNome: 'Honda' },
      { id: '5', codigo: 'XRE300', nome: 'XRE 300', montadora: 'HONDA', montadoraNome: 'Honda' },
      { id: '6', codigo: 'FAZER250', nome: 'Fazer 250', montadora: 'YAMAHA', montadoraNome: 'Yamaha' },
      { id: '7', codigo: 'CRYPTON115', nome: 'Crypton 115', montadora: 'YAMAHA', montadoraNome: 'Yamaha' }
    ]
  };
}
