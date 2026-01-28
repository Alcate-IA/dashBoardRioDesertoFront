"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    postColetaCompletaFiltroApi,
    getHistoricoCompletoApi,
    webHookIAAnaliseQualidade,
} from "@/service/qualidadeAguaApis";
import GraficosAnalise from "@/components/QualidadeAgua/GraficosAnalise";
import AnaliseIA from "@/components/QualidadeAgua/AnaliseIA";
import { ProgressSpinner } from "primereact/progressspinner";

const MES_ANO_INICIO = "10/2008";

function obterMesAnoFim(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    return `${mes}/${ano}`;
}

export interface MovimentoRdLabPopup {
    id_zeus: number;
    nm_piezometro: string;
}

interface DetalheQualidadeAguaRdLabPopupProps {
    movimento: MovimentoRdLabPopup;
}

/**
 * Conteúdo do popup de Qualidade da Água a partir de um card de Últimos Movimentos RD Lab.
 * Busca coleta 10/2008 até a data atual (filtros vazios = todos os dados) e exibe gráficos e análise IA.
 */
export default function DetalheQualidadeAguaRdLabPopup({ movimento }: DetalheQualidadeAguaRdLabPopupProps) {
    const [dadosColeta, setDadosColeta] = useState<any>(null);
    const [analiseIA, setAnaliseIA] = useState<string | null>(null);
    const [analiseOriginalIA, setAnaliseOriginalIA] = useState<string | null>(null);
    const [estaCarregando, setEstaCarregando] = useState(true);
    const [estaCarregandoIA, setEstaCarregandoIA] = useState(false);

    useEffect(() => {
        if (!movimento?.id_zeus) return;

        let cancelado = false;
        setEstaCarregando(true);
        setDadosColeta(null);
        setAnaliseIA(null);
        setAnaliseOriginalIA(null);

        const fimStr = obterMesAnoFim();

        (async () => {
            try {
                const respostaColeta = await postColetaCompletaFiltroApi(
                    movimento.id_zeus,
                    MES_ANO_INICIO,
                    fimStr,
                    []
                );
                if (cancelado) return;

                const dados = respostaColeta.data;
                setDadosColeta(dados);

                if (dados && dados.amostras) {
                    setEstaCarregandoIA(true);
                    const respostaHistorico = await getHistoricoCompletoApi(movimento.id_zeus);
                    if (cancelado) return;
                    const dadosHistorico = respostaHistorico.data;

                    const respostaIA = await webHookIAAnaliseQualidade(
                        dados,
                        movimento.id_zeus,
                        [],
                        dadosHistorico
                    );
                    if (cancelado) return;
                    if (Array.isArray(respostaIA) && respostaIA[0]?.output) {
                        setAnaliseIA(respostaIA[0].output);
                        setAnaliseOriginalIA(respostaIA[0].output);
                    }
                }
            } catch (erro) {
                console.error("Erro ao carregar qualidade da água:", erro);
                if (!cancelado) {
                    Swal.fire({
                        icon: "error",
                        title: "Erro",
                        text: "Não foi possível carregar os dados de qualidade da água.",
                    });
                }
            } finally {
                if (!cancelado) {
                    setEstaCarregando(false);
                    setEstaCarregandoIA(false);
                }
            }
        })();

        return () => {
            cancelado = true;
        };
    }, [movimento?.id_zeus]);

    if (estaCarregando) {
        return (
            <div className="flex flex-column align-items-center justify-content-center p-5 gap-3">
                <span className="font-medium">Carregando dados de qualidade da água...</span>
                <ProgressSpinner style={{ width: "36px", height: "36px" }} strokeWidth="4" />
            </div>
        );
    }

    return (
        <div className="flex flex-column gap-4">
            {dadosColeta && dadosColeta.amostras && (
                <GraficosAnalise dados={dadosColeta} ehRelatorio={false} />
            )}

            <AnaliseIA
                estaCarregando={estaCarregandoIA}
                analise={analiseIA}
                analiseOriginalIA={analiseOriginalIA}
                aoSalvar={(texto) => setAnaliseIA(texto)}
                idZeus={movimento.id_zeus}
            />
        </div>
    );
}
