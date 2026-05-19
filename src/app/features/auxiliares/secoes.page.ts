import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-secoes-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class SecoesPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Seções',
    endpoint: '/api/v1/cadastros/auxiliares/secoes',
    colunas: [{ field: 'codigo', header: 'Código' }, { field: 'nome', header: 'Nome' }],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true }
    ],
    demoData: [
      { id: '1', codigo: '01', nome: 'Motor e Acessórios' },
      { id: '2', codigo: '02', nome: 'Elétrica' },
      { id: '3', codigo: '03', nome: 'Freios' },
      { id: '4', codigo: '04', nome: 'Transmissão' },
      { id: '5', codigo: '05', nome: 'Lataria e Estética' },
      { id: '6', codigo: '06', nome: 'Pneus e Rodas' },
    ]
  };
}
