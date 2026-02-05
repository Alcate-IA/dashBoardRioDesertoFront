"use client";

import React, { useState, useMemo, useEffect } from "react";
import BarraFiltros from "./BarraFiltros";
import GraficosAnalise from "./GraficosAnalise";
import AnaliseIA from "./AnaliseIA";
import { SplitButton } from 'primereact/splitbutton';
import { TabView, TabPanel } from 'primereact/tabview';
import { useGerenciadorRelatorioQualidadeAgua, ResultadoPontoQualidadeAgua } from "@/hooks/useGerenciadorRelatorioQualidadeAgua";
import { useExportacaoRelatorioQualidadeAgua, ConteudoAbaExportacaoQualidade } from "@/hooks/useExportacaoRelatorioQualidadeAgua";
import { useTracker } from '@/hooks/useTracker';
import Swal from 'sweetalert2';

export interface PropriedadesQualidadeAgua {
    idPiezometroInicial?: number;
    mesAnoInicioInicial?: string;
    mesAnoFimInicial?: string;
    aplicarAutomaticamente?: boolean;
    ehRelatorio?: boolean;
}

interface ConteudoAbaPontoProps {
    resultado: ResultadoPontoQualidadeAgua;
    ehRelatorio?: boolean;
    onSalvarAnalise: (id: number, texto: string) => void;
}

function ConteudoAbaPonto({ resultado, ehRelatorio, onSalvarAnalise }: ConteudoAbaPontoProps) {
    return (
        <>
            {resultado.dadosColeta && resultado.dadosColeta.amostras && (
                <div className="mt-3">
                    <GraficosAnalise dados={resultado.dadosColeta} ehRelatorio={ehRelatorio} />
                </div>
            )}
            <AnaliseIA
                estaCarregando={false}
                analise={resultado.analiseIA}
                analiseOriginalIA={resultado.analiseOriginalIA}
                aoSalvar={(texto) => onSalvarAnalise(resultado.id, texto)}
                idZeus={resultado.id}
            />
        </>
    );
}

/**
 * Componente principal da tela de Qualidade da Água.
 *
 * Atua como um coordenador de layout, delegando a lógica de dados para o hook useGerenciadorRelatorioQualidadeAgua
 * e a lógica de exportação para o hook useExportacaoRelatorioQualidadeAgua.
 */
export default function QualidadeAgua({
    idPiezometroInicial,
    mesAnoInicioInicial,
    mesAnoFimInicial,
    aplicarAutomaticamente = false,
    ehRelatorio = false,
}: PropriedadesQualidadeAgua) {
    useTracker('Qualidade Água');

    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const {
        opcoesFiltroSituacao,
        situacaoSelecionada,
        aoMudarSituacao,
        tipoFiltroSelecionado,
        setTipoFiltroSelecionado,
        pontoSelecionado,
        pontosSelecionados,
        aoMudarPontos,
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
        aoBuscar,
        resultadosPorPonto,
        listaPontosProntos,
        setAnaliseIAPonto,
    } = useGerenciadorRelatorioQualidadeAgua({
        idPiezometroInicial,
        mesAnoInicioInicial,
        mesAnoFimInicial,
        aplicarAutomaticamente
    });

    const isMulti = listaPontosProntos.length > 1;

    useEffect(() => {
        setActiveTabIndex(0);
    }, [listaPontosProntos.length]);

    const resultadoAtivo = useMemo(() => {
        if (!isMulti || activeTabIndex >= listaPontosProntos.length) return null;
        const id = listaPontosProntos[activeTabIndex]?.id;
        return id != null ? resultadosPorPonto[id] : null;
    }, [isMulti, activeTabIndex, listaPontosProntos, resultadosPorPonto]);

    const effectiveDadosColeta = isMulti && resultadoAtivo ? resultadoAtivo.dadosColeta : dadosColeta;
    const effectiveAnaliseIA = isMulti && resultadoAtivo ? resultadoAtivo.analiseIA : analiseIA;
    const effectiveAnaliseOriginalIA = isMulti && resultadoAtivo ? resultadoAtivo.analiseOriginalIA : analiseOriginalIA;
    const effectivePontoSelecionado = isMulti && resultadoAtivo ? resultadoAtivo.id : pontoSelecionado;

    const { gerarPDF, gerarWord, capturarConteudoAtual, gerarPDFTodasAbas, gerarWordTodasAbas } = useExportacaoRelatorioQualidadeAgua(
        pontos,
        effectivePontoSelecionado
    );

    const opcoesFiltroTipo = [
        { label: "Todos os Tipos", value: null },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" },
    ];

    const coletarConteudoAbas = async (): Promise<ConteudoAbaExportacaoQualidade[]> => {
        const conteudos: ConteudoAbaExportacaoQualidade[] = [];
        for (let i = 0; i < listaPontosProntos.length; i++) {
            setActiveTabIndex(i);
            await new Promise((r) => setTimeout(r, 450));
            const { textoAnalise, imagensBase64 } = await capturarConteudoAtual();
            conteudos.push({
                nomePonto: listaPontosProntos[i].label,
                textoAnalise,
                imagensBase64,
            });
        }
        return conteudos;
    };

    const aoGerarPdfTodasAbasClick = async () => {
        if (listaPontosProntos.length <= 1) {
            Swal.fire({ icon: 'info', title: 'Uma aba apenas', text: "Use 'PDF aba atual' ou selecione vários pontos e aplique." });
            return;
        }
        Swal.fire({
            title: 'Exportando...',
            html: 'Coletando conteúdo de todas as abas e gerando o PDF.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            const conteudos = await coletarConteudoAbas();
            await gerarPDFTodasAbas(conteudos);
            Swal.close();
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Erro ao exportar PDF de todas as abas' });
        }
    };

    const aoGerarWordTodasAbasClick = async () => {
        if (listaPontosProntos.length <= 1) {
            Swal.fire({ icon: 'info', title: 'Uma aba apenas', text: "Use 'Word aba atual' ou selecione vários pontos e aplique." });
            return;
        }
        Swal.fire({
            title: 'Exportando...',
            html: 'Coletando conteúdo de todas as abas e gerando o Word.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });
        try {
            const conteudos = await coletarConteudoAbas();
            await gerarWordTodasAbas(conteudos);
            Swal.close();
        } catch (e) {
            console.error(e);
            Swal.fire({ icon: 'error', title: 'Erro ao exportar Word de todas as abas' });
        }
    };

    const itensExportacao = [
        { label: 'PDF aba atual', icon: 'pi pi-file-pdf', command: gerarPDF },
        { label: 'Word aba atual', icon: 'pi pi-file-word', command: gerarWord },
        { label: 'PDF todas as abas', icon: 'pi pi-file-pdf', command: aoGerarPdfTodasAbasClick },
        { label: 'Word todas as abas', icon: 'pi pi-file-word', command: aoGerarWordTodasAbasClick },
    ];

    const temAnaliseParaExportar =
        effectiveAnaliseIA ||
        (isMulti && listaPontosProntos.some((p) => resultadosPorPonto[p.id]?.analiseIA));

    const aoSalvarAnalise = (texto: string) => {
        if (isMulti && resultadoAtivo) {
            setAnaliseIAPonto(resultadoAtivo.id, texto);
        } else {
            setAnaliseIA(texto);
        }
    };

    const renderConteudo = () => {
        if (isMulti) {
            return (
                <TabView
                    activeIndex={activeTabIndex}
                    onTabChange={(e) => setActiveTabIndex(e.index)}
                    scrollable={listaPontosProntos.length > 3}
                    className="qualidade-agua-tabview mt-3"
                >
                    {listaPontosProntos.map((item, idx) => {
                        const resultado = resultadosPorPonto[item.id];
                        if (!resultado) return null;
                        return (
                            <TabPanel key={item.id} header={item.label}>
                                {idx === activeTabIndex && (
                                    <ConteudoAbaPonto
                                        resultado={resultado}
                                        ehRelatorio={ehRelatorio}
                                        onSalvarAnalise={setAnaliseIAPonto}
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
                {effectiveDadosColeta && effectiveDadosColeta.amostras && (
                    <div className="mt-5">
                        <GraficosAnalise dados={effectiveDadosColeta} ehRelatorio={ehRelatorio} />
                    </div>
                )}
                <AnaliseIA
                    estaCarregando={estaCarregando}
                    analise={effectiveAnaliseIA}
                    analiseOriginalIA={effectiveAnaliseOriginalIA}
                    aoSalvar={aoSalvarAnalise}
                    idZeus={effectivePontoSelecionado}
                />
            </>
        );
    };

    return (
        <div className="col-12">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1>Qualidade Água</h1>
                {temAnaliseParaExportar && (
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
                pontosSelecionados={pontosSelecionados ?? []}
                aoMudarPontos={aoMudarPontos}
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

            {renderConteudo()}
        </div>
    );
}
