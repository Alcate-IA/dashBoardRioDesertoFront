"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
    getPiezometroFiltroComHistoricoApi,
    webHookIAAnaliseNivelEstatico,
    getFotosInspecaoPiezometroApi,
} from "@/service/nivelEstaticoApis";
import { useConfiguracaoGraficoNivelEstatico } from "@/hooks/useConfiguracaoGraficoNivelEstatico";
import GraficoTelaNivelEstatico from "@/components/GraficoPiezometro/GraficoTelaNivelEstatico";
import AnaliseIA from "@/components/GraficoPiezometro/AnaliseIA";
import TabelaDadosPiezometro from "@/components/GraficoPiezometro/TabelaDadosPiezometro";
import CarrosselFotosInspecao from "@/components/GraficoPiezometro/CarrosselFotosInspecao";
import { ProgressSpinner } from "primereact/progressspinner";

const MES_ANO_INICIO = "10/2008";

function obterMesAnoFim(): string {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    return `${mes}/${ano}`;
}

export interface MovimentoZeusPopup {
    cd_piezometro: number;
    nm_piezometro: string;
    tp_piezometro: string;
}

interface DetalhePiezometroZeusPopupProps {
    movimento: MovimentoZeusPopup;
}

/**
 * Conteúdo do popup de detalhe do piezômetro a partir de um card de Últimos Movimentos Zeus.
 * Busca histórico 10/2008 até a data atual e exibe gráfico, análise IA, fotos e tabela.
 */
export default function DetalhePiezometroZeusPopup({ movimento }: DetalhePiezometroZeusPopupProps) {
    const chartRef = useRef(null);
    const [tabelaDados, setTabelaDados] = useState<any[]>([]);
    const [analiseIA, setAnaliseIA] = useState<string | null>(null);
    const [analiseOriginalIA, setAnaliseOriginalIA] = useState<string | null>(null);
    const [estaCarregando, setEstaCarregando] = useState(true);
    const [estaCarregandoIA, setEstaCarregandoIA] = useState(false);
    const [fotosInspecao, setFotosInspecao] = useState<any[]>([]);
    const [estaCarregandoFotos, setEstaCarregandoFotos] = useState(false);

    const tipoParaGrafico = movimento.tp_piezometro === "PB" ? "PP" : movimento.tp_piezometro;
    const dataInicioFixo = new Date(2008, 9, 1); // 1º outubro 2008
    const dataFimFixo = new Date();

    const { dadosGrafico, opcoesGrafico } = useConfiguracaoGraficoNivelEstatico(
        tabelaDados,
        tipoParaGrafico,
        false,
        dataInicioFixo,
        dataFimFixo
    );

    const buscarFotos = useCallback(
        async (inicio: string, fim: string) => {
            if (!movimento?.cd_piezometro) return;
            setEstaCarregandoFotos(true);
            try {
                const resposta = await getFotosInspecaoPiezometroApi(
                    movimento.cd_piezometro,
                    inicio,
                    fim
                );
                setFotosInspecao(resposta.data || []);
            } catch {
                setFotosInspecao([]);
            } finally {
                setEstaCarregandoFotos(false);
            }
        },
        [movimento?.cd_piezometro]
    );

    useEffect(() => {
        if (!movimento?.cd_piezometro) return;

        let cancelado = false;
        setEstaCarregando(true);
        setTabelaDados([]);
        setAnaliseIA(null);
        setAnaliseOriginalIA(null);

        const fimStr = obterMesAnoFim();

        (async () => {
            try {
                const resposta = await getPiezometroFiltroComHistoricoApi(
                    movimento.cd_piezometro,
                    MES_ANO_INICIO,
                    fimStr
                );
                if (cancelado) return;

                const dadosFiltrados = resposta.data?.dadosFiltrados || [];
                const historicoIA = resposta.data?.historicoCompleto || [];

                const dadosOrdenados = [...dadosFiltrados].sort(
                    (a: any, b: any) =>
                        new Date(a.mes_ano).getTime() - new Date(b.mes_ano).getTime()
                );
                setTabelaDados(dadosOrdenados);

                // Fotos: mesmo período (formato DD/MM/YYYY para a API de fotos)
                const [mesIni, anoIni] = MES_ANO_INICIO.split("/");
                const [mesFim, anoFim] = fimStr.split("/");
                const ultimoDia = new Date(
                    parseInt(anoFim, 10),
                    parseInt(mesFim, 10),
                    0
                ).getDate();
                const inicioFotos = `01/${mesIni}/${anoIni}`;
                const fimFotos = `${String(ultimoDia).padStart(2, "0")}/${mesFim}/${anoFim}`;
                buscarFotos(inicioFotos, fimFotos);

                if (dadosOrdenados.length > 0) {
                    setEstaCarregandoIA(true);
                    const respostaIA = await webHookIAAnaliseNivelEstatico(
                        dadosOrdenados,
                        movimento.cd_piezometro,
                        historicoIA
                    );
                    if (cancelado) return;
                    if (Array.isArray(respostaIA) && respostaIA[0]?.output) {
                        setAnaliseIA(respostaIA[0].output);
                        setAnaliseOriginalIA(respostaIA[0].output);
                    }
                }
            } catch (erro) {
                console.error("Erro ao carregar detalhe do piezômetro:", erro);
                if (!cancelado) {
                    Swal.fire({
                        icon: "error",
                        title: "Erro",
                        text: "Não foi possível carregar os dados do piezômetro.",
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
    }, [movimento?.cd_piezometro, buscarFotos]);

    if (estaCarregando) {
        return (
            <div className="flex flex-column align-items-center justify-content-center p-5 gap-3">
                <span className="font-medium">Carregando histórico do piezômetro...</span>
                <ProgressSpinner style={{ width: "36px", height: "36px" }} strokeWidth="4" />
            </div>
        );
    }

    return (
        <div className="flex flex-column gap-4">
            <GraficoTelaNivelEstatico
                ref={chartRef}
                dadosGrafico={dadosGrafico}
                opcoesGrafico={opcoesGrafico}
                tipoPiezometro={tipoParaGrafico}
                tabelaDados={tabelaDados}
            />

            <AnaliseIA
                analise={analiseIA}
                analiseOriginalIA={analiseOriginalIA}
                estaCarregando={estaCarregandoIA}
                aoSalvar={(texto) => setAnaliseIA(texto)}
                cdPiezometro={movimento.cd_piezometro}
            />

            <CarrosselFotosInspecao
                fotos={fotosInspecao}
                estaCarregando={estaCarregandoFotos}
            />

            {tabelaDados.length > 0 && movimento.tp_piezometro && (
                <TabelaDadosPiezometro
                    dados={tabelaDados}
                    tipoSelecionado={movimento.tp_piezometro}
                    porDia={false}
                />
            )}
        </div>
    );
}
