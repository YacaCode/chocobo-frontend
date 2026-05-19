import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CrudAuxiliarComponent, type CrudAuxiliarConfig } from '../../shared/crud-auxiliar/crud-auxiliar.component';

@Component({
  selector: 'chb-ncm-page',
  standalone: true,
  imports: [CrudAuxiliarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<chb-crud-auxiliar [config]="config"></chb-crud-auxiliar>`
})
export class NcmPage {
  readonly config: CrudAuxiliarConfig = {
    titulo: 'NCM',
    endpoint: '/api/v1/cadastros/auxiliares/ncm',
    colunas: [
      { field: 'codigo', header: 'Codigo' },
      { field: 'descricao', header: 'Descricao' },
      { field: 'aliquotaNacional', header: 'Aliq. nacional' }
    ],
    campos: [
      { name: 'codigo', label: 'Codigo', required: true },
      { name: 'descricao', label: 'Descricao', required: true },
      { name: 'aliquotaNacional', label: 'Aliquota nacional' }
    ],
    demoData: [
      { id: '1', codigo: '27101932', descricao: 'Oleos lubrificantes sem aditivos', aliquotaNacional: '13,45%' },
      { id: '2', codigo: '84212300', descricao: 'Filtros de oleo ou combustivel', aliquotaNacional: '14,80%' },
      { id: '3', codigo: '40103900', descricao: 'Correias de transmissao de borracha', aliquotaNacional: '15,20%' },
      { id: '4', codigo: '85111000', descricao: 'Velas de ignicao', aliquotaNacional: '16,05%' },
      { id: '5', codigo: '87141000', descricao: 'Partes e acessorios de motocicletas', aliquotaNacional: '18,60%' }
    ]
  };
}
