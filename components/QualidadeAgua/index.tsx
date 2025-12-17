"use client";

import { useState, useEffect } from "react";
import FilterBar from "./FilterBar";
import GraficosAnalise from "./GraficosAnalise";
import AnaliseIA from "./AnaliseIA"; 
import { getPiezometrosRelatorio, getColetaCompletaPorIdDataInicioDataFimApi } from '@/service/api';

export type QualidadeAguaProps = {
    initialCdPiezometro?: number; 
    initialMesAnoInicio?: string; 
    initialMesAnoFim?: string;    
    autoApply?: boolean;
};

export default function QualidadeAgua({
    initialCdPiezometro,
    initialMesAnoInicio,
    initialMesAnoFim,
    autoApply = false,
}: QualidadeAguaProps = {}) {
    const [tipoFiltroSelecionado, setTipoFiltroSelecionado] = useState<string | null>(null);
    const [pontoSelecionado, setPontoSelecionado] = useState<number | null>(null);
    const [dataInicio, setDataInicio] = useState<Date | null>(null);
    const [dataFim, setDataFim] = useState<Date | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [pontos, setPontos] = useState<any[]>([]);
    
    const [dadosColeta, setDadosColeta] = useState<any>(null);
    const [autoApplied, setAutoApplied] = useState(false);

    const opcoesFiltro = [
        { label: "Todos os Tipos", value: null },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" },
    ];

    useEffect(() => {
        const buscarPiezometros = async () => {
            setCarregando(true);
            try {
                const response = await getPiezometrosRelatorio(tipoFiltroSelecionado);
                const data = response.data;
                const pontosFormatados = data.map((item: any) => ({
                    label: item.nm_piezometro,
                    value: item.id_zeus
                }));
                setPontos(pontosFormatados);
                setPontoSelecionado(null); 
            } catch (error) {
                console.error("Erro ao buscar piezômetros:", error);
                setPontos([]);
            } finally {
                setCarregando(false);
            }
        };
        buscarPiezometros();
    }, [tipoFiltroSelecionado]);

    const parseMesAno = (mesAno?: string | null): Date | null => {
        if (!mesAno) return null;
        const m = mesAno.match(/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/);
        if (!m) return null;
        const [mm, yyyy] = mesAno.split('/');
        return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, 1);
    };

    useEffect(() => {
        if (initialCdPiezometro) setPontoSelecionado(initialCdPiezometro);
        const di = parseMesAno(initialMesAnoInicio);
        const df = parseMesAno(initialMesAnoFim);
        if (di) setDataInicio(di);
        if (df) setDataFim(df);
    }, [initialCdPiezometro, initialMesAnoInicio, initialMesAnoFim]);

    useEffect(() => {
        if (!autoApply || autoApplied) return;
        if (pontoSelecionado && dataInicio && dataFim) {
            handleBuscar();
            setAutoApplied(true);
        }
    }, [autoApply, autoApplied, pontoSelecionado, dataInicio, dataFim]);

    const handleBuscar = async () => {
        if (!pontoSelecionado || !dataInicio || !dataFim) {
            console.warn("Selecione o ponto e as datas.");
            return;
        }

        setCarregando(true);
        setDadosColeta(null);

        const formatMonthYear = (date: Date) => {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${year}`;
        };

        const inicio = formatMonthYear(dataInicio);
        const fim = formatMonthYear(dataFim);

        try {
            const response = await getColetaCompletaPorIdDataInicioDataFimApi(pontoSelecionado, inicio, fim);
            const data = response.data;
            setDadosColeta(data);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="col-12">
            <h1>Qualidade Água</h1>

            <FilterBar
                opcoesFiltro={opcoesFiltro}
                tipoFiltroSelecionado={tipoFiltroSelecionado}
                onTipoFiltroChange={setTipoFiltroSelecionado}
                pontos={pontos}
                pontoSelecionado={pontoSelecionado}
                onPontoChange={setPontoSelecionado}
                carregando={carregando}
                dataInicio={dataInicio}
                dataFim={dataFim}
                onDataInicioChange={setDataInicio}
                onDataFimChange={setDataFim}
                onBuscar={handleBuscar}
            />

            <AnaliseIA carregando={carregando} analise={null} />

            {dadosColeta && dadosColeta.amostras && (
                <div className="mt-5">
                    <GraficosAnalise dados={dadosColeta} />
                </div>
            )}
        </div>
    );
}
