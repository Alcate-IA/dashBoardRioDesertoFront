"use client";

import { useState, useEffect } from "react";
import {
    getPiezometrosRdLab,
    getParametrosLegislacaoBuscaDadosRelacionados
} from '@/service/qualidadeAguaApis';

interface PropriedadesIniciais {
    idPiezometroInicial?: number;
    mesAnoInicioInicial?: string;
    mesAnoFimInicial?: string;
}

/**
 * Hook especializado em gerenciar os estados dos filtros e as opções disponíveis (DROPDOWNS).
 * 
 * Responsável por:
 * 1. Manter o estado de Ponto de Monitoramento, Período e Parâmetros.
 * 2. Buscar dinamicamente os pontos baseado no tipo de filtro (PP, PR, PV, PC).
 * 3. Carregar os parâmetros da legislação que podem ser filtrados.
 */
export const useFiltrosEParametrosQualidadeAgua = ({
    idPiezometroInicial,
    mesAnoInicioInicial,
    mesAnoFimInicial
}: PropriedadesIniciais) => {
    const [tipoFiltroSelecionado, setTipoFiltroSelecionado] = useState<string | null>(null);
    const [situacao, setSituacao] = useState<string | null>('A');
    const [pontoSelecionado, setPontoSelecionado] = useState<number | null>(null);
    const [dataInicio, setDataInicio] = useState<Date | null>(null);
    const [dataFim, setDataFim] = useState<Date | null>(null);
    const [pontos, setPontos] = useState<any[]>([]);
    const [itensSelecionados, setItensSelecionados] = useState<number[]>([]);
    const [parametros, setParametros] = useState<any[]>([]);
    const [estaCarregandoOpcoes, setEstaCarregandoOpcoes] = useState(false);

    const opcoesFiltroSituacao = [
        { label: "Ativo", value: "A" },
        { label: "Inativo", value: "I" },
        { label: "Todos", value: null },
    ];

    // Converte string mm/yyyy para Date
    const converterMesAnoParaData = (mesAno?: string | null): Date | null => {
        if (!mesAno) return null;
        const correspondencia = mesAno.match(/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/);
        if (!correspondencia) return null;
        const [mes, ano] = mesAno.split('/');
        return new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, 1);
    };

    // Busca pontos de monitoramento ao mudar o tipo de filtro
    useEffect(() => {
        const buscarPontos = async () => {
            setEstaCarregandoOpcoes(true);
            try {
                const resposta = await getPiezometrosRdLab(situacao, tipoFiltroSelecionado);
                const formatados = resposta.data.map((item: any) => ({
                    label: item.nm_piezometro,
                    value: item.id_zeus
                }));
                setPontos(formatados);
                
                // Se o ponto selecionado não estiver na nova lista, limpa a seleção
                if (pontoSelecionado && !formatados.find((p: any) => p.value === pontoSelecionado)) {
                    setPontoSelecionado(null);
                }
            } catch (erro) {
                console.error("Erro ao buscar pontos de monitoramento:", erro);
                setPontos([]);
            } finally {
                setEstaCarregandoOpcoes(false);
            }
        };
        buscarPontos();
    }, [tipoFiltroSelecionado, situacao]);

    // Carrega parâmetros da legislação ao montar o componente
    useEffect(() => {
        const carregarParametrosLegislação = async () => {
            try {
                const resposta = await getParametrosLegislacaoBuscaDadosRelacionados();
                const dados = resposta.data;
                const analisesUnicas = Array.from(new Map(dados.map((item: any) => [item.id_analise, item])).values());
                setParametros(analisesUnicas);

                if (itensSelecionados.length === 0) {
                    setItensSelecionados(analisesUnicas.map((p: any) => p.id_analise));
                }
            } catch (erro) {
                console.error("Erro ao carregar parâmetros da legislação:", erro);
            }
        };
        carregarParametrosLegislação();
    }, []);

    // Aplica valores iniciais vindos das props de navegação
    useEffect(() => {
        if (idPiezometroInicial) setPontoSelecionado(idPiezometroInicial);
        const dataInic = converterMesAnoParaData(mesAnoInicioInicial);
        const dataFinal = converterMesAnoParaData(mesAnoFimInicial);
        if (dataInic) setDataInicio(dataInic);
        if (dataFinal) setDataFim(dataFinal);
    }, [idPiezometroInicial, mesAnoInicioInicial, mesAnoFimInicial]);

    return {
        tipoFiltroSelecionado,
        setTipoFiltroSelecionado,
        situacao,
        setSituacao,
        opcoesFiltroSituacao,
        pontoSelecionado,
        setPontoSelecionado,
        dataInicio,
        setDataInicio,
        dataFim,
        setDataFim,
        pontos,
        itensSelecionados,
        setItensSelecionados,
        parametros,
        estaCarregandoOpcoes
    };
};
