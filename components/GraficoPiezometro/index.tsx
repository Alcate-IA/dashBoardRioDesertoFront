//CORPO PRINCIPAL DO COMPONENTE DE GRÁFICO PIEZÔMETRO

"use client";
import { useRef } from "react";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ColetaTable from "./ColetaTable";
import AnaliseIA from "./AnaliseIA";

import { usePiezometroData } from "@/hooks/usePiezometroData";
import FilterBar from "./FilterBar";

export default function GraficoPiezometro() {
  const chartRef = useRef<Chart>(null);
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

    // relacionados a analise ia nivel estatico
    analiseIANivelEstatico,
    setAnaliseIANivelEstatico,
    carregandoIANivelEstatico,
  } = usePiezometroData();

  //ESSE CARA É O RESPONSA DE GERAR O PDF 
  const handleGeneratePdf = async () => {
    const chartCanvas = chartRef.current?.getCanvas();
    const analiseIAEl = document.getElementById("textoApareceNoPdf");

    if (!chartCanvas || !analiseIAEl) {
      console.error("Não foi possível encontrar os elementos para gerar o PDF.");
      return;
    }

    const finalPrintContainer = document.createElement("div");
    finalPrintContainer.style.padding = "20px";

    const selectedPiezometer = piezometros.find(p => p.value === filters.idSelecionado);
    const piezometerName = selectedPiezometer ? selectedPiezometer.label : 'Não selecionado';

    const piezometerNameEl = document.createElement("h3");
    piezometerNameEl.textContent = `${piezometerName}:`;
    piezometerNameEl.style.marginBottom = "20px";
    piezometerNameEl.style.color = "#000";

    finalPrintContainer.appendChild(piezometerNameEl);

    const reportContainer = document.createElement("div");
    reportContainer.style.backgroundColor = "#333";
    reportContainer.style.color = "#fff";
    reportContainer.style.padding = "20px";

    const chartHeaderEl = document
      .querySelector(".chart-header")
      ?.cloneNode(true);
    if (chartHeaderEl) {
      reportContainer.appendChild(chartHeaderEl);
    }

    const chartDataURL = chartCanvas.toDataURL("image/png");
    const chartImage = document.createElement("img");
    chartImage.src = chartDataURL;
    chartImage.style.width = "100%";
    reportContainer.appendChild(chartImage);

    finalPrintContainer.appendChild(reportContainer);

    const analiseText = (analiseIAEl as HTMLElement).innerText;
    const analiseContainer = document.createElement('div');
    analiseContainer.style.marginTop = '20px';

    const lines = analiseText.split('\n');
    lines.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line || '\u00A0';
      p.style.color = 'black';
      p.style.margin = '0';
      p.style.breakInside = 'avoid';
      analiseContainer.appendChild(p);
    });
    finalPrintContainer.appendChild(analiseContainer);


    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: 1,
      filename: "grafico-e-analise.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" as const },
    };

    html2pdf().from(finalPrintContainer).set(opt).save();
  };

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
    <div id="dashboard-content" className="col-12">
      <div className="flex justify-content-between align-items-center mb-4">
        <h1>Nível Estático, precipitação e vazão</h1>

        {analiseIANivelEstatico && (
          <button onClick={handleGeneratePdf} className="p-button p-component">
            Exportar PDF
          </button>
        )}
      </div>

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

      {/* GRÁFICO */}
      <div className="chart-container avoid-break">
        <div className="chart-header">
          <div className="chart-title">
            {tabelaDados.length > 0 && filters.tipoSelecionado
              ? `Dados do ${filters.tipoSelecionado === "PP" ||
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
            ref={chartRef}
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

      {/* ANÁLISE DA IA */}
      <div id="analise-ia-container" className="avoid-break mb-5">
        <AnaliseIA
          analise={analiseIANivelEstatico}
          carregando={carregandoIANivelEstatico}
          onSave={(text) => setAnaliseIANivelEstatico(text)}
        />
      </div>

      {/* LISTA DOS DADOS DA TABELA */}

      {tabelaDados.length > 0 && filters.tipoSelecionado && (
        <div className="card avoid-break">
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
        <div className="avoid-break">
          <ColetaTable
            data={coletaDados}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            analisesQuimicas={analisesQuimicas}
            carregandoAnalise={carregandoAnalise}
            buscarAnaliseQuimica={buscarAnaliseQuimica}
          />
        </div>
      )}
    </div>
  );
}