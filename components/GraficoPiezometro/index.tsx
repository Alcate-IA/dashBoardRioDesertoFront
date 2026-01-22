//CORPO PRINCIPAL DO COMPONENTE DE GRÁFICO PIEZÔMETRO

"use client";
import { useRef } from "react";
import GraficoTelaNivelEstatico from "./GraficoTelaNivelEstatico";
import AnaliseIA from "./AnaliseIA";
import TabelaDadosPiezometro from "./TabelaDadosPiezometro";
import CarrosselFotosInspecao from "./CarrosselFotosInspecao";
import { SplitButton } from 'primereact/splitbutton';

import { useGerenciadorNivelEstatico } from "@/hooks/useGerenciadorNivelEstatico";
import { useExportacaoRelatorioTelaNivelEstatico } from "@/hooks/useExportacaoRelatorioTelaNivelEstatico";
import BarraFiltros from "./BarraFiltros";

export default function GraficoPiezometro() {
  const chartRef = useRef(null);
  const {
    filtros,
    piezometros,
    estaCarregando,
    estaCarregandoOpcoes,
    dadosGrafico,
    opcoesGrafico,
    tabelaDados,
    opcoesFiltroTipo,
    opcoesFiltroSituacao,
    atualizarFiltros,
    aoSelecionarPiezometro,
    aoBuscar,
    analiseIA,
    setAnaliseIA,
    analiseOriginalIA,
    estaCarregandoIA,
    fotosInspecao,
    estaCarregandoFotos,
  } = useGerenciadorNivelEstatico();

  const { aoGerarPdf, aoGerarWord } = useExportacaoRelatorioTelaNivelEstatico(
    chartRef as any,
    piezometros,
    filtros.idSelecionado,
    fotosInspecao
  );


  const exportItems = [
    {
      label: 'PDF',
      icon: 'pi pi-file-pdf',
      command: aoGerarPdf
    },
    {
      label: 'Word',
      icon: 'pi pi-file-word',
      command: aoGerarWord
    }
  ];

  return (
    <div id="dashboard-content" className="col-12">
      <div className="flex justify-content-between align-items-center mb-4">
        <h1>Nível Estático, precipitação e vazão</h1>

        {analiseIA && (
          <SplitButton
            label="Exportar"
            icon="pi pi-download"
            model={exportItems}
            onClick={aoGerarPdf}
            className="p-button-secondary"
          />
        )}
      </div>

      {/* Barra de Filtros */}
      <BarraFiltros
        opcoesFiltro={opcoesFiltroTipo}
        tipoFiltroSelecionado={filtros.tipoFiltroSelecionado}
        aoMudarTipoFiltro={(valor) =>
          atualizarFiltros({ tipoFiltroSelecionado: valor })
        }
        opcoesFiltroSituacao={opcoesFiltroSituacao}
        situacaoSelecionada={filtros.situacao}
        aoMudarSituacao={(valor) => atualizarFiltros({ situacao: valor })}
        piezometros={piezometros}
        idSelecionado={filtros.idSelecionado}
        aoMudarPiezometro={aoSelecionarPiezometro}
        estaCarregando={estaCarregando || estaCarregandoOpcoes}
        dataInicio={filtros.dataInicio}
        dataFim={filtros.dataFim}
        aoMudarDataInicio={(valor) => atualizarFiltros({ dataInicio: valor })}
        aoMudarDataFim={(valor) => atualizarFiltros({ dataFim: valor })}
        porDia={filtros.porDia}
        aoMudarPorDia={(valor) => atualizarFiltros({ porDia: valor })}
        aoBuscar={aoBuscar}
      />

      {/* GRÁFICO */}
      <GraficoTelaNivelEstatico
        ref={chartRef}
        dadosGrafico={dadosGrafico}
        opcoesGrafico={opcoesGrafico}
        tipoPiezometro={filtros.tipoSelecionado}
        tabelaDados={tabelaDados}
      />

      {/* ANÁLISE DA IA */}
      <div id="analise-ia-container" className="avoid-break mb-5">
        <AnaliseIA
          analise={analiseIA}
          analiseOriginalIA={analiseOriginalIA}
          estaCarregando={estaCarregandoIA}
          aoSalvar={(texto) => setAnaliseIA(texto)}
          cdPiezometro={filtros.idSelecionado}
        />
      </div>

      {/* FOTOS DE INSPEÇÃO */}
      <CarrosselFotosInspecao
        fotos={fotosInspecao}
        estaCarregando={estaCarregandoFotos}
      />

      {/* LISTA DOS DADOS DA TABELA */}
      {tabelaDados.length > 0 && filtros.tipoSelecionado && (
        <TabelaDadosPiezometro
          dados={tabelaDados}
          tipoSelecionado={filtros.tipoSelecionado}
          porDia={filtros.porDia}
        />
      )}

    </div>
  );
}