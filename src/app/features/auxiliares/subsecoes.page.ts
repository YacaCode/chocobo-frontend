import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-subsecoes-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class SubsecoesPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Subseções',
    endpoint: '/api/v1/cadastros/subsecoes',
    colunas: [
      { field: 'codigo', header: 'Código' },
      { field: 'nome', header: 'Nome' },
      { field: 'secao', header: 'Seção' }
    ],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'secao', label: 'Seção (código)', required: false }
    ],
    demoData: [
      { id: '1', codigo: 'LUB-SIN', nome: 'Sintéticos', secao: 'LUBRIFICANTES' },
      { id: '2', codigo: 'LUB-SEM', nome: 'Semissintéticos', secao: 'LUBRIFICANTES' },
      { id: '3', codigo: 'LUB-MIN', nome: 'Minerais', secao: 'LUBRIFICANTES' },
      { id: '4', codigo: 'FIL-OLE', nome: 'Filtros de Óleo', secao: 'FILTROS' },
      { id: '5', codigo: 'FIL-AR', nome: 'Filtros de Ar', secao: 'FILTROS' },
      { id: '6', codigo: 'FRE-PAS', nome: 'Pastilhas', secao: 'FREIOS' },
      { id: '7', codigo: 'FRE-DIS', nome: 'Discos', secao: 'FREIOS' }
    ]
  };
}
