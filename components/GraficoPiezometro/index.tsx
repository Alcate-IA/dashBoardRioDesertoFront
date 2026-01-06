//CORPO PRINCIPAL DO COMPONENTE DE GRÁFICO PIEZÔMETRO

"use client";
import { useRef, useState } from "react";
import { Chart } from "primereact/chart";
import AnaliseIA from "./AnaliseIA";
import TabelaDadosPiezometro from "./TabelaDadosPiezometro";
import { SplitButton } from 'primereact/splitbutton';

import { usePiezometroData } from "@/hooks/usePiezometroData";
import BarraFiltros from "./BarraFiltros";
import { saveAs } from 'file-saver';
import Swal from "sweetalert2";

export default function GraficoPiezometro() {
  const chartRef = useRef<Chart>(null);
  const [legendUpdate, setLegendUpdate] = useState(0); // Força re-render da legenda
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

    // relacionados a analise ia nivel estatico
    analiseIANivelEstatico,
    setAnaliseIANivelEstatico,
    analiseOriginalIA,
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

  const handleGenerateWord = async () => {
    const chartCanvas = chartRef.current?.getCanvas();
    const analiseIAEl = document.getElementById("textoApareceNoPdf");

    if (!chartCanvas || !analiseIAEl) {
      console.error("Não foi possível encontrar os elementos para gerar o Word.");
      return;
    }

    const selectedPiezometer = piezometros.find(p => p.value === filters.idSelecionado);
    const piezometerName = selectedPiezometer ? selectedPiezometer.label : 'Não selecionado';

    const chartDataURL = chartCanvas.toDataURL("image/png");

    const analiseText = (analiseIAEl as HTMLElement).innerText;
    const analiseLines = analiseText.split('\n').map(line => `<p style="margin: 0;">${line || '&nbsp;'}</p>`).join('');

    const htmlString = `
      <div style="font-family: Arial; padding: 20px;">
        <h3 style="color: #000; margin-bottom: 20px;">${piezometerName}:</h3>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${chartDataURL}" style="width: 600px;" />
        </div>

        <div style="margin-top: 20px; color: #000;">
          ${analiseLines} 
        </div>
      </div>
    `;

    const opt = {
      orientation: 'landscape' as const,
      margins: { top: 720, right: 720, bottom: 720, left: 720 },
    };

    try {
      const htmlToDocx = (await import('html-to-docx')).default;
      const fileBuffer = await htmlToDocx(htmlString, null, opt);
      saveAs(fileBuffer as Blob, "grafico-e-analise.docx");
    } catch (error) {
      console.error("Erro ao gerar Word:", error);
      Swal.fire({ icon: 'error', title: 'Erro ao gerar Word', text: 'Ocorreu um problema ao tentar exportar para Word.' });
    }
  };



  // Handler de clique na legenda para esconder/mostrar datasets
  const handleLegendClick = (datasetIndex: number) => {
    const chart = chartRef.current?.getChart();
    if (!chart) return;

    const meta = chart.getDatasetMeta(datasetIndex);
    meta.hidden = meta.hidden === null ? true : !meta.hidden;

    chart.update();
    setLegendUpdate(prev => prev + 1); // Força re-render da legenda
  };

  // Renderizar legenda do gráfico
  const renderizarLegendaGrafico = () => {
    if (!lineData) return null;

    const chart = chartRef.current?.getChart();

    return (
      <div className="chart-legend">
        {lineData.datasets.map((dataset: any, index: number) => {
          const label =
            dataset.label === "Cota Superfície" &&
              filters.tipoSelecionado === "PR"
              ? "Cota"
              : dataset.label;

          // Verifica se é uma linha tracejada (Início da Escavação ou outras)
          const isTracejada = dataset.borderDash && dataset.borderDash.length > 0;

          // Verifica se o dataset está oculto
          const isHidden = chart ? chart.getDatasetMeta(index).hidden : false;

          return (
            <div
              key={dataset.label}
              className="legend-item"
              onClick={() => handleLegendClick(index)}
              style={{
                cursor: 'pointer',
                opacity: isHidden ? 0.5 : 1,
                textDecoration: isHidden ? 'line-through' : 'none'
              }}
            >
              {isTracejada ? (
                <div
                  className="legend-line-dashed"
                  style={{
                    width: '20px',
                    height: '2px',
                    background: `repeating-linear-gradient(90deg, ${dataset.borderColor} 0px, ${dataset.borderColor} 4px, transparent 4px, transparent 8px)`,
                    marginRight: '6px'
                  }}
                ></div>
              ) : (
                <div
                  className="legend-color"
                  style={{ backgroundColor: dataset.borderColor }}
                ></div>
              )}
              {label}
            </div>
          );
        })}
      </div>
    );
  };

  const exportItems = [
    {
      label: 'PDF',
      icon: 'pi pi-file-pdf',
      command: handleGeneratePdf
    },
    {
      label: 'Word',
      icon: 'pi pi-file-word',
      command: handleGenerateWord
    }
  ];

  return (
    <div id="dashboard-content" className="col-12">
      <div className="flex justify-content-between align-items-center mb-4">
        <h1>Nível Estático, precipitação e vazão</h1>

        {analiseIANivelEstatico && (
          <SplitButton
            label="Exportar"
            icon="pi pi-download"
            model={exportItems}
            onClick={handleGeneratePdf}
            className="p-button-secondary"
          />
        )}
      </div>

      {/* Barra de Filtros */}
      <BarraFiltros
        opcoesFiltro={opcoesFiltro}
        tipoFiltroSelecionado={filters.tipoFiltroSelecionado}
        aoMudarTipoFiltro={(valor) =>
          updateFilters({ tipoFiltroSelecionado: valor })
        }
        piezometros={piezometros}
        idSelecionado={filters.idSelecionado}
        aoMudarPiezometro={handleSelecionarPiezometro}
        estaCarregando={carregando}
        dataInicio={filters.dataInicio}
        dataFim={filters.dataFim}
        aoMudarDataInicio={(valor) => updateFilters({ dataInicio: valor })}
        aoMudarDataFim={(valor) => updateFilters({ dataFim: valor })}
        porDia={filters.porDia}
        aoMudarPorDia={(valor) => updateFilters({ porDia: valor })}
        aoBuscar={buscarGrafico}
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
          analiseOriginalIA={analiseOriginalIA}
          estaCarregando={carregandoIANivelEstatico}
          aoSalvar={(texto) => setAnaliseIANivelEstatico(texto)}
          cdPiezometro={filters.idSelecionado}
        />
      </div>

      {/* LISTA DOS DADOS DA TABELA */}
      {tabelaDados.length > 0 && filters.tipoSelecionado && (
        <TabelaDadosPiezometro
          dados={tabelaDados}
          tipoSelecionado={filters.tipoSelecionado}
          porDia={filters.porDia}
        />
      )}

    </div>
  );
}