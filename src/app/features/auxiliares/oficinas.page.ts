import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-oficinas-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class OficinasPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'Oficinas',
    endpoint: '/api/v1/servicos/oficinas',
    colunas: [
      { field: 'codigo', header: 'Código' },
      { field: 'nome', header: 'Nome' },
      { field: 'responsavel', header: 'Responsável' }
    ],
    campos: [
      { name: 'codigo', label: 'Código', required: true },
      { name: 'nome', label: 'Nome', required: true },
      { name: 'responsavel', label: 'Responsável', required: false }
    ],
    demoData: [
      { id: '1', codigo: 'OF-001', nome: 'Oficina Principal', responsavel: 'Carlos Mecânico' },
      { id: '2', codigo: 'OF-002', nome: 'Oficina Elétrica', responsavel: 'João Elétrico' },
      { id: '3', codigo: 'OF-003', nome: 'Oficina Funilaria', responsavel: 'Pedro Funileiro' }
    ]
  };
}
