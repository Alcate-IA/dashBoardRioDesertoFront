//CORPO PRINCIPAL DO COMPONENTE DE GRÁFICO PIEZÔMETRO

"use client";

import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ColetaTable from "./ColetaTable";

import { usePiezometroData } from "@/hooks/usePiezometroData";
import FilterBar from "./FilterBar";

export default function GraficoPiezometro() {
  const {
    filters,
    piezometros,
    carregando,
    lineData,
    lineOptions,
    summary,
    tabelaDados,
    opcoesFiltro,

    updateFilters,
    handleSelecionarPiezometro,
    buscarGrafico,

    // relacionados as dados das coletas
    coletaDados,
    expandedRows,
    setExpandedRows,

    //relacionados as analises quimicas dentro de coletas
    analisesQuimicas,
    carregandoAnalise,
    buscarAnaliseQuimica,
  } = usePiezometroData();

  // Funções auxiliares (mantidas do código original)
  function eTipoCalhasOuPontoVazao(tipo: string): boolean {
    return tipo === "PC" || tipo === "PV";
  }

  // Renderizar colunas da tabela
  const renderizarColunasTabela = () => {
    if (tabelaDados.length === 0 || !filters.tipoSelecionado) return null;

    const ehPCouPV = eTipoCalhasOuPontoVazao(filters.tipoSelecionado);

    let colunas = [
      <Column
        key="data"
        field="mes_ano"
        header="DATA"
        body={(rowData) => {
          const [ano, mes] = rowData.mes_ano.split("-");
          return `${mes}/${ano}`;
        }}
        sortable
      />,
    ];

    if (filters.tipoSelecionado === "PP") {
      colunas.push(
        <Column
          key="nivel_estatico"
          field="nivel_estatico"
          header="N. ESTÁTICO (M)"
          body={(d) => <span className="val-green">{d.nivel_estatico}</span>}
          sortable
        />,
        <Column
          key="cota_superficie"
          field="cota_superficie"
          header="COTA SUPERFÍCIE (M)"
          body={(d) => <span className="val-orange">{d.cota_superficie}</span>}
          sortable
        />,
        <Column
          key="cota_base"
          field="cota_base"
          header="COTA BASE (M)"
          body={(d) => <span className="val-purple">{d.cota_base}</span>}
          sortable
        />,
        <Column
          key="precipitacao"
          field="precipitacao"
          header="PRECIP. (MM)"
          sortable
        />,
        <Column
          key="vazao_bombeamento"
          field="vazao_bombeamento"
          header="VAZÃO MINA (M³/H)"
          body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
          sortable
        />
      );
    } else if (filters.tipoSelecionado === "PR") {
      colunas.push(
        <Column
          key="cota_superficie"
          field="cota_superficie"
          header="COTA (M)"
          body={(d) => <span className="val-orange">{d.cota_superficie}</span>}
          sortable
        />,
        <Column
          key="nivel_estatico"
          field="nivel_estatico"
          header="N. ESTÁTICO (M)"
          body={(d) => <span className="val-green">{d.nivel_estatico}</span>}
          sortable
        />,
        <Column
          key="precipitacao"
          field="precipitacao"
          header="PRECIP. (MM)"
          sortable
        />,
        <Column
          key="vazao_bombeamento"
          field="vazao_bombeamento"
          header="VAZÃO MINA (M³/H)"
          body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
          sortable
        />
      );
    } else if (ehPCouPV) {
      colunas.push(
        <Column
          key="vazao_calha"
          field="vazao_calha"
          header="VAZÃO (M³/H)"
          body={(d) => <span className="val-red">{d.vazao_calha}</span>}
          sortable
        />,
        <Column
          key="precipitacao"
          field="precipitacao"
          header="PRECIP. (MM)"
          sortable
        />,
        <Column
          key="vazao_bombeamento"
          field="vazao_bombeamento"
          header="VAZÃO MINA (M³/H)"
          body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
          sortable
        />
      );
    }

    return colunas;
  };

  // Renderizar legenda do gráfico
  const renderizarLegendaGrafico = () => {
    if (!lineData) return null;

    return (
      <div className="chart-legend">
        {lineData.datasets.map((dataset: any) => {
          const label =
            dataset.label === "Cota Superfície" &&
            filters.tipoSelecionado === "PR"
              ? "Cota"
              : dataset.label;

          return (
            <div key={dataset.label} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: dataset.borderColor }}
              ></div>
              {label}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="col-12">
      {/* Barra de Filtros */}
      <FilterBar
        opcoesFiltro={opcoesFiltro}
        tipoFiltroSelecionado={filters.tipoFiltroSelecionado}
        onTipoFiltroChange={(value) =>
          updateFilters({ tipoFiltroSelecionado: value })
        }
        piezometros={piezometros}
        idSelecionado={filters.idSelecionado}
        onPiezometroChange={handleSelecionarPiezometro}
        carregando={carregando}
        dataInicio={filters.dataInicio}
        dataFim={filters.dataFim}
        onDataInicioChange={(value) => updateFilters({ dataInicio: value })}
        onDataFimChange={(value) => updateFilters({ dataFim: value })}
        onBuscar={buscarGrafico}
      />

      {/* CARDS DINÂMICOS */}

      {/* 
            {renderizarCards()}
                */}

      {/* GRÁFICO */}
      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            {tabelaDados.length > 0 && filters.tipoSelecionado
              ? `Dados do ${
                  filters.tipoSelecionado === "PP" ||
                  filters.tipoSelecionado === "PR"
                    ? "Piezômetro"
                    : "Recurso Hídrico"
                }`
              : "Níveis Piezométricos e Dados Ambientais"}
          </div>
          {renderizarLegendaGrafico()}
        </div>
        {lineData ? (
          <Chart
            type="line"
            data={lineData}
            options={lineOptions}
            height="400px"
          />
        ) : (
          <div
            className="flex align-items-center justify-content-center"
            style={{ height: "400px", color: "#666" }}
          >
            Selecione os filtros e clique em Aplicar para visualizar os dados
          </div>
        )}
      </div>

      {/* LISTA DOS DADOS DA TABELA */}
      {tabelaDados.length > 0 && filters.tipoSelecionado && (
        <div className="card">
          <h5 className="mb-4 text-white">
            Painel de Dados - {filters.tipoSelecionado}
          </h5>
          <DataTable
            value={tabelaDados}
            paginator
            rows={10}
            className="p-datatable-sm"
            emptyMessage="Nenhum dado encontrado"
          >
            {renderizarColunasTabela()}
          </DataTable>
        </div>
      )}

      {/* TABELA DE COLETA */}

      {coletaDados && coletaDados.length > 0 && (
        <ColetaTable
          data={coletaDados}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          analisesQuimicas={analisesQuimicas}
          carregandoAnalise={carregandoAnalise}
          buscarAnaliseQuimica={buscarAnaliseQuimica}
        />
      )}
    </div>
  );
}
