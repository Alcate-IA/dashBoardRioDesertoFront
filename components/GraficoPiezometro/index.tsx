//CORPO PRINCIPAL DO COMPONENTE DE GRÁFICO PIEZÔMETRO

"use client";
import { useRef, useState, useMemo, useEffect } from "react";
import GraficoTelaNivelEstatico from "./GraficoTelaNivelEstatico";
import AnaliseIA from "./AnaliseIA";
import TabelaDadosPiezometro from "./TabelaDadosPiezometro";
import CarrosselFotosInspecao from "./CarrosselFotosInspecao";
import { SplitButton } from "primereact/splitbutton";
import { TabView, TabPanel } from "primereact/tabview";
import { useTracker } from "@/hooks/useTracker";

import { useGerenciadorNivelEstatico, ResultadoPiezometro } from "@/hooks/useGerenciadorNivelEstatico";
import { useConfiguracaoGraficoNivelEstatico } from "@/hooks/useConfiguracaoGraficoNivelEstatico";
import { useExportacaoRelatorioTelaNivelEstatico } from "@/hooks/useExportacaoRelatorioTelaNivelEstatico";
import BarraFiltros from "./BarraFiltros";

interface ConteudoAbaPiezometroProps {
  resultado: ResultadoPiezometro;
  filtros: { porDia: boolean; dataInicio: Date | null; dataFim: Date | null };
  chartRef: React.RefObject<any>;
  onSalvarAnalise: (id: number, texto: string) => void;
}

function ConteudoAbaPiezometro({ resultado, filtros, chartRef, onSalvarAnalise }: ConteudoAbaPiezometroProps) {
  const tipoGrafico = resultado.tipo === "PB" ? "PP" : resultado.tipo;
  const { dadosGrafico, opcoesGrafico } = useConfiguracaoGraficoNivelEstatico(
    resultado.tabelaDados,
    tipoGrafico,
    filtros.porDia,
    filtros.dataInicio,
    filtros.dataFim
  );
  return (
    <>
      <GraficoTelaNivelEstatico
        ref={chartRef}
        dadosGrafico={dadosGrafico}
        opcoesGrafico={opcoesGrafico}
        tipoPiezometro={resultado.tipo}
        tabelaDados={resultado.tabelaDados}
        mensagemEstadoVazio={resultado.tabelaDados.length === 0 ? "nenhum dado foi encontrado no banco de dados" : undefined}
      />
      <div id="analise-ia-container" className="avoid-break mb-5">
        <AnaliseIA
          analise={resultado.analiseIA}
          analiseOriginalIA={resultado.analiseOriginalIA}
          estaCarregando={false}
          aoSalvar={(texto) => onSalvarAnalise(resultado.id, texto)}
          cdPiezometro={resultado.id}
        />
      </div>
      <CarrosselFotosInspecao fotos={resultado.fotosInspecao} estaCarregando={false} />
      {resultado.tabelaDados.length > 0 && resultado.tipo && (
        <TabelaDadosPiezometro
          dados={resultado.tabelaDados}
          tipoSelecionado={resultado.tipo}
          porDia={filtros.porDia}
        />
      )}
    </>
  );
}

export default function GraficoPiezometro() {
  useTracker("Nível Estático, precipitação e vazão");
  const chartRef = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const {
    filtros,
    piezometros,
    estaCarregando,
    estaCarregandoOpcoes,
    tabelaDados,
    opcoesFiltroTipo,
    opcoesFiltroSituacao,
    atualizarFiltros,
    aoMudarPiezometros,
    aoBuscar,
    analiseIA,
    setAnaliseIA,
    analiseOriginalIA,
    estaCarregandoIA,
    fotosInspecao,
    estaCarregandoFotos,
    resultadosPorPiezometro,
    listaPiezometrosProntos,
    setAnaliseIAPiezometro,
    ultimaBuscaRetornouVazio,
  } = useGerenciadorNivelEstatico();

  const isMulti = listaPiezometrosProntos.length > 1;

  useEffect(() => {
    setActiveTabIndex(0);
  }, [listaPiezometrosProntos.length]);

  const resultadoAtivo = useMemo(() => {
    if (!isMulti || activeTabIndex >= listaPiezometrosProntos.length) return null;
    const id = listaPiezometrosProntos[activeTabIndex]?.id;
    return id != null ? resultadosPorPiezometro[id] : null;
  }, [isMulti, activeTabIndex, listaPiezometrosProntos, resultadosPorPiezometro]);

  const effectiveTabelaDados = isMulti && resultadoAtivo ? resultadoAtivo.tabelaDados : tabelaDados;
  const effectiveAnaliseIA = isMulti && resultadoAtivo ? resultadoAtivo.analiseIA : analiseIA;
  const effectiveAnaliseOriginalIA = isMulti && resultadoAtivo ? resultadoAtivo.analiseOriginalIA : analiseOriginalIA;
  const effectiveFotosInspecao = isMulti && resultadoAtivo ? resultadoAtivo.fotosInspecao : fotosInspecao;
  const effectiveTipo = isMulti && resultadoAtivo ? resultadoAtivo.tipo : filtros.tipoSelecionado;
  const effectiveIdPiezometro = isMulti && resultadoAtivo ? resultadoAtivo.id : (filtros.idsSelecionados?.[0] ?? null);

  const tipoParaGrafico = effectiveTipo === "PB" ? "PP" : effectiveTipo;
  const { dadosGrafico, opcoesGrafico } = useConfiguracaoGraficoNivelEstatico(
    effectiveTabelaDados,
    tipoParaGrafico,
    filtros.porDia,
    filtros.dataInicio,
    filtros.dataFim
  );

  const { aoGerarPdf, aoGerarWord } = useExportacaoRelatorioTelaNivelEstatico(
    chartRef as any,
    piezometros,
    effectiveIdPiezometro,
    effectiveFotosInspecao
  );

  const exportItems = [
    { label: "PDF", icon: "pi pi-file-pdf", command: aoGerarPdf },
    { label: "Word", icon: "pi pi-file-word", command: aoGerarWord },
  ];

  const aoSalvarAnalise = (texto: string) => {
    if (isMulti && resultadoAtivo) {
      setAnaliseIAPiezometro(resultadoAtivo.id, texto);
    } else {
      setAnaliseIA(texto);
    }
  };

  // Modo múltiplos: abas; modo único: bloco único
  const renderConteudo = () => {
    if (isMulti) {
      return (
        <TabView
          activeIndex={activeTabIndex}
          onTabChange={(e) => setActiveTabIndex(e.index)}
          scrollable={listaPiezometrosProntos.length > 3}
          className="mt-3"
        >
          {listaPiezometrosProntos.map((item, idx) => {
            const resultado = resultadosPorPiezometro[item.id];
            if (!resultado) return null;
            return (
              <TabPanel key={item.id} header={item.label}>
                {idx === activeTabIndex && (
                  <ConteudoAbaPiezometro
                    resultado={resultado}
                    filtros={{ porDia: filtros.porDia, dataInicio: filtros.dataInicio, dataFim: filtros.dataFim }}
                    chartRef={chartRef}
                    onSalvarAnalise={setAnaliseIAPiezometro}
                  />
                )}
              </TabPanel>
            );
          })}
        </TabView>
      );
    }

    return (
      <>
        <GraficoTelaNivelEstatico
          ref={chartRef}
          dadosGrafico={dadosGrafico}
          opcoesGrafico={opcoesGrafico}
          tipoPiezometro={filtros.tipoSelecionado}
          tabelaDados={tabelaDados}
          mensagemEstadoVazio={ultimaBuscaRetornouVazio ? "nenhum dado foi encontrado no banco de dados" : undefined}
        />
        <div id="analise-ia-container" className="avoid-break mb-5">
          <AnaliseIA
            analise={effectiveAnaliseIA}
            analiseOriginalIA={effectiveAnaliseOriginalIA}
            estaCarregando={estaCarregandoIA}
            aoSalvar={aoSalvarAnalise}
            cdPiezometro={effectiveIdPiezometro}
          />
        </div>
        <CarrosselFotosInspecao fotos={effectiveFotosInspecao} estaCarregando={estaCarregandoFotos} />
        {effectiveTabelaDados.length > 0 && effectiveTipo && (
          <TabelaDadosPiezometro
            dados={effectiveTabelaDados}
            tipoSelecionado={effectiveTipo}
            porDia={filtros.porDia}
          />
        )}
      </>
    );
  };

  return (
    <div id="dashboard-content" className="col-12">
      <div className="flex justify-content-between align-items-center mb-4">
        <h1>Nível Estático, precipitação e vazão</h1>
        {(effectiveAnaliseIA || (isMulti && listaPiezometrosProntos.some((p) => resultadosPorPiezometro[p.id]?.analiseIA))) && (
          <SplitButton
            label="Exportar"
            icon="pi pi-download"
            model={exportItems}
            onClick={aoGerarPdf}
            className="p-button-secondary"
          />
        )}
      </div>

      <BarraFiltros
        opcoesFiltro={opcoesFiltroTipo}
        tipoFiltroSelecionado={filtros.tipoFiltroSelecionado}
        aoMudarTipoFiltro={(valor) => atualizarFiltros({ tipoFiltroSelecionado: valor })}
        opcoesFiltroSituacao={opcoesFiltroSituacao}
        situacaoSelecionada={filtros.situacao}
        aoMudarSituacao={(valor) => atualizarFiltros({ situacao: valor })}
        piezometros={piezometros}
        idsSelecionados={filtros.idsSelecionados ?? []}
        aoMudarPiezometros={aoMudarPiezometros}
        estaCarregando={estaCarregando || estaCarregandoOpcoes}
        dataInicio={filtros.dataInicio}
        dataFim={filtros.dataFim}
        aoMudarDataInicio={(valor) => atualizarFiltros({ dataInicio: valor })}
        aoMudarDataFim={(valor) => atualizarFiltros({ dataFim: valor })}
        porDia={filtros.porDia}
        aoMudarPorDia={(valor) => atualizarFiltros({ porDia: valor })}
        aoBuscar={aoBuscar}
      />

      {renderConteudo()}
    </div>
  );
}
