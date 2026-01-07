'use client';

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
    getPiezometroFiltroComHistoricoApi,
    getPiezometroDiarioApi,
    webHookIAAnaliseNivelEstatico,
    getFotosInspecaoPiezometroApi
} from "@/service/nivelEstaticoApis";
import { formatarData } from "@/utils/formatarData";
import { useFiltrosNivelEstatico } from "./useFiltrosNivelEstatico";
import { useConfiguracaoGraficoNivelEstatico } from "./useConfiguracaoGraficoNivelEstatico";

interface SumarioNivelEstatico {
    nivelEstatico: number;
    cotaSuperficie: number;
    cotaBase: number;
    precipitacao: number;
    vazaoMina: number;
    vazao: number;
    total: number;
}

/**
 * Hook ORQUESTRADOR da tela de Nível Estático.
 * 
 * Este é o "cérebro" principal que conecta todas as ferramentas.
 * Responsável por:
 * 1. Unir a gestão de filtros com a execução das APIs de busca.
 * 2. Processar a integração com a Inteligência Artificial.
 * 3. Calcular o sumário de médias para os cartões de informação.
 * 4. Transformar os dados brutos (mensais ou diários) para o formato da tabela e gráfico.
 */
export const useGerenciadorNivelEstatico = () => {

    // 1. Ferramenta de Filtros
    const {
        filtros,
        piezometros,
        estaCarregandoOpcoes,
        opcoesFiltroTipo,
        atualizarFiltros,
        aoSelecionarPiezometro
    } = useFiltrosNivelEstatico();

    // 2. Estados de Dados e Resultados
    const [estaCarregando, setEstaCarregando] = useState(false);
    const [tabelaDados, setTabelaDados] = useState<any[]>([]);
    const [sumario, setSumario] = useState<SumarioNivelEstatico>({
        nivelEstatico: 0,
        cotaSuperficie: 0,
        cotaBase: 0,
        precipitacao: 0,
        vazaoMina: 0,
        vazao: 0,
        total: 0
    });

    // Estados da IA
    const [analiseIA, setAnaliseIA] = useState<string | null>(null);
    const [analiseOriginalIA, setAnaliseOriginalIA] = useState<string | null>(null);
    const [estaCarregandoIA, setEstaCarregandoIA] = useState(false);

    // Estados de Fotos de Inspeção
    const [fotosInspecao, setFotosInspecao] = useState<any[]>([]);
    const [estaCarregandoFotos, setEstaCarregandoFotos] = useState(false);

    // 3. Ferramenta de Configuração Visual do Gráfico
    const { dadosGrafico, opcoesGrafico } = useConfiguracaoGraficoNivelEstatico(
        tabelaDados,
        filtros.tipoSelecionado,
        filtros.porDia,
        filtros.dataInicio,
        filtros.dataFim
    );

    // Helper para transformar dados diários (que vêm em listas separadas por categoria) em um array unificado por data
    const processarDadosDiarios = (dadosBrutos: any) => {
        if (!dadosBrutos || Array.isArray(dadosBrutos)) return dadosBrutos;

        const {
            precipitacao = [],
            nivel_estatico = [],
            vazao_bombeamento = [],
            vazao_calha = [],
            cota_superficie,
            cota_base
        } = dadosBrutos;

        const mapaPorData: Record<string, any> = {};

        const padronizarData = (dataStr: string) => {
            if (dataStr.includes("-")) return dataStr;
            const [dia, mes, ano] = dataStr.split("/");
            return `${ano}-${mes}-${dia}`;
        };

        const mesclar = (lista: any[], campo: string) => {
            lista.forEach(item => {
                const dt = padronizarData(item.data);
                if (!mapaPorData[dt]) mapaPorData[dt] = { mes_ano: dt };
                mapaPorData[dt][campo] = item[campo];
            });
        };

        mesclar(precipitacao, 'precipitacao');
        mesclar(nivel_estatico, 'nivel_estatico');
        mesclar(vazao_bombeamento, 'vazao_bombeamento');
        mesclar(vazao_calha, 'vazao_calha');

        return Object.values(mapaPorData)
            .map((item: any) => ({
                ...item,
                cota_superficie: item.cota_superficie ?? cota_superficie,
                cota_base: item.cota_base ?? cota_base
            }))
            .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
    };

    // Função de execução da busca principal
    const aoBuscar = useCallback(async () => {
        if (!filtros.idSelecionado) {
            Swal.fire({ icon: "warning", title: "Selecione um piezômetro" });
            return;
        }
        if (!filtros.dataInicio || !filtros.dataFim) {
            Swal.fire({ icon: "warning", title: "Selecione as datas" });
            return;
        }

        try {
            Swal.fire({
                title: 'Carregando...',
                html: 'Buscando dados e solicitando análise da IA...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            setEstaCarregando(true);
            setEstaCarregandoIA(true);
            setAnaliseIA(null);
            setAnaliseOriginalIA(null);

            const inicioStr = formatarData(filtros.dataInicio, filtros.porDia);
            const fimStr = formatarData(filtros.dataFim, filtros.porDia);

            // 0. Chamada de Fotos de Inspeção
            buscarFotosInspecao();

            // 1. Chamada da API Principal
            const api = filtros.porDia
                ? getPiezometroDiarioApi(filtros.idSelecionado, inicioStr, fimStr)
                : getPiezometroFiltroComHistoricoApi(filtros.idSelecionado, inicioStr, fimStr);

            const resposta = await api;
            const dadosBrutosFiltrados = resposta.data.dadosFiltrados || [];
            const historicoIA = resposta.data.historicoCompleto || [];

            // 2. Processamento dos Dados
            let dadosProcessados = filtros.porDia ? processarDadosDiarios(dadosBrutosFiltrados) : dadosBrutosFiltrados;

            // Garantir ordenação cronológica para o gráfico
            dadosProcessados = [...dadosProcessados].sort((a, b) => new Date(a.mes_ano).getTime() - new Date(b.mes_ano).getTime());

            setTabelaDados(dadosProcessados);

            // 3. IA - Análise Automática
            const temDadosParaIA = filtros.porDia
                ? (dadosBrutosFiltrados.nivel_estatico?.length > 0 || dadosBrutosFiltrados.precipitacao?.length > 0)
                : (dadosProcessados.length > 0);

            if (temDadosParaIA) {
                const dadosEntradaIA = filtros.porDia ? dadosBrutosFiltrados : dadosProcessados;
                const respostaIA = await webHookIAAnaliseNivelEstatico(dadosEntradaIA, filtros.idSelecionado, historicoIA);

                if (Array.isArray(respostaIA) && respostaIA[0]?.output) {
                    setAnaliseIA(respostaIA[0].output);
                    setAnaliseOriginalIA(respostaIA[0].output);
                    Swal.close();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'IA Indisponível',
                        text: 'A análise da IA falhou, mas os dados do gráfico foram carregados.'
                    });
                }
            } else {
                Swal.close();
            }

            // 4. Cálculo do Sumário de Médias
            const total = dadosProcessados.length;
            if (total > 0) {
                const soma = (campo: string) => dadosProcessados.reduce((acc: number, obj: any) => acc + (obj[campo] || 0), 0);
                const media = (campo: string) => parseFloat((soma(campo) / total).toFixed(1));

                setSumario({
                    nivelEstatico: media('nivel_estatico'),
                    cotaSuperficie: media('cota_superficie'),
                    cotaBase: media('cota_base'),
                    precipitacao: media('precipitacao'),
                    vazaoMina: media('vazao_bombeamento'),
                    vazao: media('vazao_calha'),
                    total
                });
            }

        } catch (erro) {
            console.error("Erro na busca de Nível Estático:", erro);
            Swal.fire({ icon: "error", title: "Erro na Busca", text: "Não foi possível carregar os dados do relatório." });
        } finally {
            setEstaCarregando(false);
            setEstaCarregandoIA(false);
        }
    }, [filtros]);

    // Função interna para busca de fotos
    const buscarFotosInspecao = useCallback(async () => {
        if (!filtros.idSelecionado) {
            setFotosInspecao([]);
            return;
        }

        setEstaCarregandoFotos(true);
        try {
            const resposta = await getFotosInspecaoPiezometroApi(filtros.idSelecionado);
            setFotosInspecao(resposta.data || []);
        } catch (erro) {
            console.error("Erro ao buscar fotos de inspeção:", erro);
            setFotosInspecao([]);
        } finally {
            setEstaCarregandoFotos(false);
        }
    }, [filtros.idSelecionado]);

    // Limpa os resultados atuais se qualquer filtro for alterado (Garante proteção de dados)
    useEffect(() => {
        setTabelaDados([]);
        setAnaliseIA(null);
        setAnaliseOriginalIA(null);
        setSumario({ nivelEstatico: 0, cotaSuperficie: 0, cotaBase: 0, precipitacao: 0, vazaoMina: 0, vazao: 0, total: 0 });
        setFotosInspecao([]);
    }, [filtros]);

    return {
        // Filtros e Opções
        filtros,
        piezometros,
        estaCarregandoOpcoes,
        opcoesFiltroTipo,
        atualizarFiltros,
        aoSelecionarPiezometro,

        // Resultados e Status
        estaCarregando,
        tabelaDados,
        sumario,
        analiseIA,
        analiseOriginalIA,
        setAnaliseIA,
        estaCarregandoIA,

        // Fotos de Inspeção
        fotosInspecao,
        estaCarregandoFotos,

        // Configuração do Gráfico (Chart.js)
        dadosGrafico,
        opcoesGrafico,

        // Ações
        aoBuscar
    };
};
