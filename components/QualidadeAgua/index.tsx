"use client";

import React from "react";
import BarraFiltros from "./BarraFiltros";
import GraficosAnalise from "./GraficosAnalise";
import AnaliseIA from "./AnaliseIA";
import { SplitButton } from 'primereact/splitbutton';
import { useGerenciadorRelatorioQualidadeAgua } from "@/hooks/useGerenciadorRelatorioQualidadeAgua";
import { useExportacaoRelatorioQualidadeAgua } from "@/hooks/useExportacaoRelatorioQualidadeAgua";

export interface PropriedadesQualidadeAgua {
    idPiezometroInicial?: number;
    mesAnoInicioInicial?: string;
    mesAnoFimInicial?: string;
    aplicarAutomaticamente?: boolean;
    ehRelatorio?: boolean;
}

/**
 * Componente principal da tela de Qualidade da Água.
 * 
 * Atua como um coordenador de layout, delegando a lógica de dados para o hook useQualidadeAguaTela
 * e a lógica de exportação para o hook useExportacaoRelatorioQualidadeAgua.
 */
export default function QualidadeAgua({
    idPiezometroInicial,
    mesAnoInicioInicial,
    mesAnoFimInicial,
    aplicarAutomaticamente = false,
    ehRelatorio = false,
}: PropriedadesQualidadeAgua) {

    // Hook de Lógica de Dados (Orquestrador)
    const {
        opcoesFiltroSituacao,
        situacaoSelecionada,
        aoMudarSituacao,
        tipoFiltroSelecionado,
        setTipoFiltroSelecionado,
        pontoSelecionado,
        setPontoSelecionado,
        dataInicio,
        setDataInicio,
        dataFim,
        setDataFim,
        estaCarregando,
        estaCarregandoOpcoes,
        pontos,
        itensSelecionados,
        setItensSelecionados,
        parametros,
        dadosColeta,
        analiseIA,
        analiseOriginalIA,
        setAnaliseIA,
        aoBuscar
    } = useGerenciadorRelatorioQualidadeAgua({
        idPiezometroInicial,
        mesAnoInicioInicial,
        mesAnoFimInicial,
        aplicarAutomaticamente
    });

    // Hook de Exportação
    const { gerarPDF, gerarWord } = useExportacaoRelatorioQualidadeAgua(pontos, pontoSelecionado);

    const opcoesFiltroTipo = [
        { label: "Todos os Tipos", value: null },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" },
    ];

    const itensExportacao = [
        { label: 'PDF', icon: 'pi pi-file-pdf', command: gerarPDF },
        { label: 'Word', icon: 'pi pi-file-word', command: gerarWord }
    ];

    return (
        <div className="col-12">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1>Qualidade Água</h1>
                {analiseIA && (
                    <SplitButton
                        label="Exportar"
                        icon="pi pi-download"
                        model={itensExportacao}
                        onClick={gerarPDF}
                        className="p-button-secondary"
                    />
                )}
            </div>

            <BarraFiltros
                opcoesFiltroSituacao={opcoesFiltroSituacao}
                situacaoSelecionada={situacaoSelecionada}
                aoMudarSituacao={aoMudarSituacao}
                opcoesFiltro={opcoesFiltroTipo}
                tipoFiltroSelecionado={tipoFiltroSelecionado}
                aoMudarTipoFiltro={setTipoFiltroSelecionado}
                pontos={pontos}
                pontoSelecionado={pontoSelecionado}
                aoMudarPonto={setPontoSelecionado}
                estaCarregando={estaCarregando || estaCarregandoOpcoes}
                dataInicio={dataInicio}
                dataFim={dataFim}
                aoMudarDataInicio={setDataInicio}
                aoMudarDataFim={setDataFim}
                aoBuscar={aoBuscar}
                itensSelecionados={itensSelecionados}
                aoMudarItensSelecionados={setItensSelecionados}
                parametros={parametros}
            />

            {dadosColeta && dadosColeta.amostras && (
                <div className="mt-5">
                    <GraficosAnalise dados={dadosColeta} ehRelatorio={ehRelatorio} />
                </div>
            )}

            <AnaliseIA
                estaCarregando={estaCarregando}
                analise={analiseIA}
                analiseOriginalIA={analiseOriginalIA}
                aoSalvar={(texto) => setAnaliseIA(texto)}
                idZeus={pontoSelecionado}
            />
        </div>
    );
}
