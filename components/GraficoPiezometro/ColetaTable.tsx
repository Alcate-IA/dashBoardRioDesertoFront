// Em: src/components/GraficoPiezometro/ColetaTable.tsx
"use client";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import AnaliseQuimica from "./AnaliseQuimica";

interface ColetaTableProps {
  data: any[];
  expandedRows: any;
  onRowToggle: (e: any) => void;
  analisesQuimicas: Record;
  carregandoAnalise: Record;
  buscarAnaliseQuimica: (nRegistro: number) => void;
}

export default function ColetaTable(
  {
    data,
    expandedRows,
    onRowToggle,
    analisesQuimicas,
    carregandoAnalise,
    buscarAnaliseQuimica,
  }: ColetaTableProps
) {
  const formatarData = (dataString: string) => {
    const [ano, mes, dia] = dataString.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const rowExpansionTemplate = (rowData: any) => {
    const nRegistro = rowData.n_registro;
    const analise = analisesQuimicas[nRegistro];
    const carregando = carregandoAnalise[nRegistro] || false;

    return <AnaliseQuimica data={analise} carregando={carregando} />;
  };

  const onRowExpand = (event: any) => {
    const nRegistro = event.data.n_registro;
    buscarAnaliseQuimica(nRegistro);
  };

  return (
    <div className="card mt-4">
      <h5 className="mb-4 text-white">Registros de Coleta Detalhados</h5>
      <DataTable
        value={data}
        expandedRows={expandedRows}
        onRowToggle={onRowToggle}
        onRowExpand={onRowExpand}
        rowExpansionTemplate={rowExpansionTemplate}
        dataKey="n_registro"
        className="p-datatable-sm coleta-table-responsive"
        emptyMessage="Nenhum registro de coleta encontrado"
        paginator
        rows={10}
      >
        <Column expander style={{ width: "3rem" }} />
        <Column field="n_registro" header="Nº REGISTRO" sortable />
        <Column
          field="data"
          header="DATA"
          body={(rowData) => formatarData(rowData.data)}
          sortable
        />
        <Column 
          field="identificacao" 
          header="IDENTIFICAÇÃO" 
          sortable 
          className="hidden md:table-cell"
          headerClassName="hidden md:table-cell"
        />
      </DataTable>
    </div>
  );
}
