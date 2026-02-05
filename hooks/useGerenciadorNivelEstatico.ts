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

interface SumarioNivelEstatico {
    nivelEstatico: number;
    cotaSuperficie: number;
    cotaBase: number;
    precipitacao: number;
    vazaoMina: number;
    vazao: number;
    total: number;
}

export interface ResultadoPiezometro {
    id: number;
    label: string;
    tipo: string | null;
    tabelaDados: any[];
    analiseIA: string | null;
    analiseOriginalIA: string | null;
    fotosInspecao: any[];
    sumario: SumarioNivelEstatico;
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
        opcoesFiltroSituacao,
        atualizarFiltros,
        aoMudarPiezometros
    } = useFiltrosNivelEstatico();

    // 2. Estados de Dados e Resultados (modo único piezômetro)
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

    // Resultados por piezômetro (modo múltiplos)
    const [resultadosPorPiezometro, setResultadosPorPiezometro] = useState<Record<number, ResultadoPiezometro>>({});

    // True quando o usuário clicou em Aplicar e a API retornou vazio (dadosFiltrados vazio)
    const [ultimaBuscaRetornouVazio, setUltimaBuscaRetornouVazio] = useState(false);

    // Configuração do gráfico é feita no componente (permite usar dados da aba ativa em modo múltiplos)

    const processarDadosDiarios = (dadosBrutos: any) => {
        if (!dadosBrutos || Array.isArray(dadosBrutos)) return dadosBrutos;

        // Garantir que todas as listas sejam arrays, mesmo se vierem como null
        const precipitacao = Array.isArray(dadosBrutos.precipitacao) ? dadosBrutos.precipitacao : [];
        const nivel_estatico = Array.isArray(dadosBrutos.nivel_estatico) ? dadosBrutos.nivel_estatico : [];
        const vazao_bombeamento = Array.isArray(dadosBrutos.vazao_bombeamento) ? dadosBrutos.vazao_bombeamento : [];
        const vazao_calha = Array.isArray(dadosBrutos.vazao_calha) ? dadosBrutos.vazao_calha : [];
        const cota_superficie = dadosBrutos.cota_superficie;
        const cota_base = dadosBrutos.cota_base;

        const mapaPorData: Record<string, any> = {};

        const padronizarData = (dataStr: string) => {
            if (dataStr.includes("-")) return dataStr;
            const [dia, mes, ano] = dataStr.split("/");
            return `${ano}-${mes}-${dia}`;
        };

        const mesclar = (lista: any[], campo: string) => {
            if (!lista || lista.length === 0) {
                return;
            }
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

        const resultado = Object.values(mapaPorData)
            .map((item: any) => ({
                ...item,
                ...(cota_superficie !== null && cota_superficie !== undefined && { cota_superficie }),
                ...(cota_base !== null && cota_base !== undefined && { cota_base })
            }))
            .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));

        return resultado;
    };

    const sumarioVazio = (): SumarioNivelEstatico => ({
        nivelEstatico: 0,
        cotaSuperficie: 0,
        cotaBase: 0,
        precipitacao: 0,
        vazaoMina: 0,
        vazao: 0,
        total: 0
    });

    /** Busca dados de um único piezômetro (API + IA + fotos) e retorna resultado. */
    const buscarUmPiezometro = useCallback(async (
        cdPiezometro: number,
        nomeExibicao: string,
        f: { dataInicio: Date | null; dataFim: Date | null; porDia: boolean }
    ): Promise<ResultadoPiezometro> => {
        const inicioStr = formatarData(f.dataInicio!, f.porDia);
        const fimStr = formatarData(f.dataFim!, f.porDia);
        const inicioFotos = formatarData(f.dataInicio!, true);
        const fimFotos = formatarData(f.dataFim!, true);

        const api = f.porDia
            ? getPiezometroDiarioApi(cdPiezometro, inicioStr, fimStr)
            : getPiezometroFiltroComHistoricoApi(cdPiezometro, inicioStr, fimStr);

        const resposta = await api;
        const dadosBrutosFiltrados = resposta.data.dadosFiltrados || [];
        const historicoIA = resposta.data.historicoCompleto || [];

        let dadosProcessados = f.porDia ? processarDadosDiarios(dadosBrutosFiltrados) : dadosBrutosFiltrados;
        dadosProcessados = [...(Array.isArray(dadosProcessados) ? dadosProcessados : [])].sort(
            (a, b) => new Date(a.mes_ano).getTime() - new Date(b.mes_ano).getTime()
        );

        let analiseIAVal: string | null = null;
        const temDadosParaIA = f.porDia
            ? (dadosBrutosFiltrados?.nivel_estatico?.length > 0 || dadosBrutosFiltrados?.precipitacao?.length > 0)
            : (dadosProcessados.length > 0);

        if (temDadosParaIA) {
            const dadosEntradaIA = f.porDia ? dadosBrutosFiltrados : dadosProcessados;
            const respostaIA = await webHookIAAnaliseNivelEstatico(dadosEntradaIA, cdPiezometro, historicoIA);
            if (Array.isArray(respostaIA) && respostaIA[0]?.output) {
                analiseIAVal = respostaIA[0].output;
            }
        }

        const total = dadosProcessados.length;
        let sumarioVal = sumarioVazio();
        if (total > 0) {
            const soma = (campo: string) => dadosProcessados.reduce((acc: number, obj: any) => acc + (obj[campo] || 0), 0);
            const media = (campo: string) => parseFloat((soma(campo) / total).toFixed(1));
            sumarioVal = {
                nivelEstatico: media('nivel_estatico'),
                cotaSuperficie: media('cota_superficie'),
                cotaBase: media('cota_base'),
                precipitacao: media('precipitacao'),
                vazaoMina: media('vazao_bombeamento'),
                vazao: media('vazao_calha'),
                total
            };
        }

        let fotos: any[] = [];
        try {
            const resFotos = await getFotosInspecaoPiezometroApi(cdPiezometro, inicioFotos, fimFotos);
            fotos = resFotos.data || [];
        } catch {
            fotos = [];
        }

        const tipo = piezometros.find(p => p.value === cdPiezometro)?.tipo ?? null;
        return {
            id: cdPiezometro,
            label: nomeExibicao,
            tipo,
            tabelaDados: dadosProcessados,
            analiseIA: analiseIAVal,
            analiseOriginalIA: analiseIAVal,
            fotosInspecao: fotos,
            sumario: sumarioVal
        };
    }, [piezometros]);

    // Função de execução da busca principal (um ou vários piezômetros)
    const aoBuscar = useCallback(async () => {
        const ids = filtros.idsSelecionados ?? [];
        if (ids.length === 0) {
            Swal.fire({ icon: "warning", title: "Selecione ao menos um piezômetro" });
            return;
        }
        if (!filtros.dataInicio || !filtros.dataFim) {
            Swal.fire({ icon: "warning", title: "Selecione as datas" });
            return;
        }

        setEstaCarregando(true);
        setEstaCarregandoIA(ids.length === 1);

        try {
            if (ids.length === 1) {
                // Fluxo único: mesmo comportamento de antes + tranca com SweetAlert
                const id = ids[0];
                const nome = piezometros.find(p => p.value === id)?.label ?? String(id);
                Swal.fire({
                    title: 'Carregando...',
                    html: `Buscando dados do piezômetro <strong>${nome}</strong>...`,
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                setAnaliseIA(null);
                setAnaliseOriginalIA(null);
                const resultado = await buscarUmPiezometro(id, nome, filtros);

                setTabelaDados(resultado.tabelaDados);
                setAnaliseIA(resultado.analiseIA);
                setAnaliseOriginalIA(resultado.analiseOriginalIA);
                setFotosInspecao(resultado.fotosInspecao);
                setSumario(resultado.sumario);
                setResultadosPorPiezometro({ [id]: resultado });
                setUltimaBuscaRetornouVazio(resultado.tabelaDados.length === 0);
                Swal.close();
            } else {
                // Múltiplos: sequencial com progresso no SweetAlert
                const total = ids.length;
                Swal.fire({
                    title: 'Carregando...',
                    html: `Buscando dados do piezômetro...<br><span id="swal-piezometro-nome"></span><br><strong id="swal-progresso">0/${total} piezômetros prontos</strong>`,
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                const novosResultados: Record<number, ResultadoPiezometro> = {};
                for (let i = 0; i < ids.length; i++) {
                    const id = ids[i];
                    const nome = piezometros.find(p => p.value === id)?.label ?? String(id);

                    const container = document.getElementById('swal-piezometro-nome');
                    const progressoEl = document.getElementById('swal-progresso');
                    if (container) container.textContent = `Buscando dados do piezômetro ${nome}`;
                    if (progressoEl) progressoEl.textContent = `${i}/${total} piezômetros prontos`;

                    const resultado = await buscarUmPiezometro(id, nome, filtros);
                    novosResultados[id] = resultado;

                    if (progressoEl) progressoEl.textContent = `${i + 1}/${total} piezômetros prontos`;
                }

                setResultadosPorPiezometro(novosResultados);
                setTabelaDados([]);
                setAnaliseIA(null);
                setAnaliseOriginalIA(null);
                setFotosInspecao([]);
                setSumario(sumarioVazio());
                const todosVazios = Object.values(novosResultados).every(r => r.tabelaDados.length === 0);
                setUltimaBuscaRetornouVazio(todosVazios);
                Swal.close();
            }
        } catch (erro) {
            console.error("Erro na busca de Nível Estático:", erro);
            Swal.fire({ icon: "error", title: "Erro na Busca", text: "Não foi possível carregar os dados do relatório." });
        } finally {
            setEstaCarregando(false);
            setEstaCarregandoIA(false);
        }
    }, [filtros, piezometros, buscarUmPiezometro]);

    // Limpa os resultados atuais se qualquer filtro for alterado (Garante proteção de dados)
    useEffect(() => {
        setTabelaDados([]);
        setAnaliseIA(null);
        setAnaliseOriginalIA(null);
        setSumario(sumarioVazio());
        setFotosInspecao([]);
        setResultadosPorPiezometro({});
        setUltimaBuscaRetornouVazio(false);
    }, [filtros]);

    return {
        // Filtros e Opções
        filtros,
        piezometros,
        estaCarregandoOpcoes,
        opcoesFiltroTipo,
        opcoesFiltroSituacao,
        atualizarFiltros,
        aoMudarPiezometros,

        // Resultados e Status (modo único)
        estaCarregando,
        tabelaDados,
        sumario,
        analiseIA,
        analiseOriginalIA,
        setAnaliseIA,
        estaCarregandoIA,

        // Fotos de Inspeção (modo único)
        fotosInspecao,
        estaCarregandoFotos,

        // Resultados por piezômetro (modo múltiplos) e lista para abas
        resultadosPorPiezometro,
        listaPiezometrosProntos: Object.values(resultadosPorPiezometro).map(r => ({ id: r.id, label: r.label })),

        // Estado vazio: true quando a última busca retornou sem dados no BD
        ultimaBuscaRetornouVazio,

        // Ações
        aoBuscar,

        /** Atualiza a análise IA de um piezômetro no modo múltiplos (edição na aba). */
        setAnaliseIAPiezometro: useCallback((id: number, texto: string | null) => {
            setResultadosPorPiezometro(prev => {
                const r = prev[id];
                if (!r) return prev;
                return { ...prev, [id]: { ...r, analiseIA: texto, analiseOriginalIA: texto ?? r.analiseOriginalIA } };
            });
        }, [])
    };
};
