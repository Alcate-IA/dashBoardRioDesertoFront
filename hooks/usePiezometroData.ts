//funções do hook de piezômetro

'use client';

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { getPiezometroFiltroComHistoricoApi, getPiezometroDiarioApi, webHookIAAnaliseNivelEstatico, getPiezometrosAtivos } from "@/service/nivelEstaticoApis";
import { formatarData } from "@/utils/formatarData";
import { getDatasetInicioMineracao } from "@/utils/anotacaoInicioMineracao";

interface PiezometroOption {
    label: string;
    value: number;
    tipo: string;
}

interface Filters {
    idSelecionado: number | null;
    tipoSelecionado: string | null;
    tipoFiltroSelecionado: string | null;
    dataInicio: Date | null;
    dataFim: Date | null;
    porDia: boolean;
}

interface Summary {
    nivelEstatico: number;
    cotaSuperficie: number;
    cotaBase: number;
    precipitacao: number;
    vazaoMina: number;
    vazao: number;
    total: number;
}

interface TabelaDado {
    mes_ano: string;
    nivel_estatico?: number;
    cota_superficie?: number;
    cota_base?: number;
    precipitacao?: number;
    vazao_bombeamento?: number;
    vazao_calha?: number;
}

interface ChartDataset {
    label: string;
    data: number[];
    borderColor: string;
    tension: number;
    yAxisID: string;
    borderDash?: number[];
    pointRadius?: number;
    order?: number;
    borderWidth?: number;
}

interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export const usePiezometroData = () => {
    // Estados
    const [filters, setFilters] = useState<Filters>({
        idSelecionado: null,
        tipoSelecionado: null,
        tipoFiltroSelecionado: null,
        dataInicio: null,
        dataFim: null,
        porDia: false
    });
    const [piezometros, setPiezometros] = useState<PiezometroOption[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [lineData, setLineData] = useState<ChartData | null>(null);
    const [lineOptions, setLineOptions] = useState<any>({});
    const [summary, setSummary] = useState<Summary>({
        nivelEstatico: 0,
        cotaSuperficie: 0,
        cotaBase: 0,
        precipitacao: 0,
        vazaoMina: 0,
        vazao: 0,
        total: 0
    });

    const [tabelaDados, setTabelaDados] = useState<TabelaDado[]>([]);
    const [analiseIANivelEstatico, setAnaliseIANivelEstatico] = useState<string | null>(null);
    const [analiseOriginalIA, setAnaliseOriginalIA] = useState<string | null>(null);
    const [carregandoIANivelEstatico, setCarregandoIANivelEstatico] = useState<boolean>(false);


    // Opções de filtro (constante)
    const opcoesFiltro = [
        { label: "Todos os Tipos", value: null },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" }
    ];

    // Funções auxiliares
    const eTipoCalhasOuPontoVazao = (tipo: string): boolean => {
        return tipo === 'PC' || tipo === 'PV';
    };

    const transformarDadosDiarios = (dados: any) => {
        if (!dados || Array.isArray(dados)) return dados;

        const {
            precipitacao = [],
            nivel_estatico = [],
            vazao_bombeamento = [],
            vazao_calha = [],
            cota_superficie,
            cota_base
        } = dados;

        const mapaDados: Record<string, any> = {};

        const converterData = (dataRes: string) => {
            if (dataRes.includes("-")) return dataRes;
            const [dia, mes, ano] = dataRes.split("/");
            return `${ano}-${mes}-${dia}`;
        };

        (precipitacao || []).forEach((item: any) => {
            const dt = converterData(item.data);
            if (!mapaDados[dt]) mapaDados[dt] = { mes_ano: dt };
            mapaDados[dt].precipitacao = item.precipitacao;
        });

        (nivel_estatico || []).forEach((item: any) => {
            const dt = converterData(item.data);
            if (!mapaDados[dt]) mapaDados[dt] = { mes_ano: dt };
            mapaDados[dt].nivel_estatico = item.nivel_estatico;
        });

        (vazao_bombeamento || []).forEach((item: any) => {
            const dt = converterData(item.data);
            if (!mapaDados[dt]) mapaDados[dt] = { mes_ano: dt };
            mapaDados[dt].vazao_bombeamento = item.vazao_bombeamento;
        });

        (vazao_calha || []).forEach((item: any) => {
            const dt = converterData(item.data);
            if (!mapaDados[dt]) mapaDados[dt] = { mes_ano: dt };
            mapaDados[dt].vazao_calha = item.vazao_calha;
        });

        return Object.values(mapaDados).map((item: any) => ({
            ...item,
            cota_superficie: item.cota_superficie ?? cota_superficie,
            cota_base: item.cota_base ?? cota_base
        })).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
    };

    // Carregar piezômetros filtrados
    const carregarPiezometrosFiltrados = useCallback(async (tipoFiltro: string | null = null) => {
        setCarregando(true);
        try {
            const filtroArray = tipoFiltro ? [tipoFiltro] : [];
            const resposta = await getPiezometrosAtivos(filtroArray);

            const piezometrosFiltrados = resposta.data.filter((p: any) => p.tipoPiezometro !== "PB");

            const piezometrosFormatados = piezometrosFiltrados.map((p: any) => ({
                label: `${p.idPiezometro} - ${p.nomePiezometro} (${p.tipoPiezometro})`,
                value: p.cdPiezometro,
                tipo: p.tipoPiezometro
            }));

            setPiezometros(piezometrosFormatados);

            // Resetar seleção se o piezômetro selecionado não estiver mais na lista
            if (filters.idSelecionado && !piezometrosFormatados.find((p: any) => p.value === filters.idSelecionado)) {
                setFilters(prev => ({ ...prev, idSelecionado: null, tipoSelecionado: null }));
            }
        } catch (e) {
            console.error("Erro ao carregar piezômetros", e);
            Swal.fire({
                icon: "error",
                title: "Erro",
                text: "Não foi possível carregar os piezômetros"
            });
        } finally {
            setCarregando(false);
        }
    }, [filters.idSelecionado]);

    // Atualizar filtros
    const updateFilters = useCallback((newFilters: Partial<Filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Selecionar piezômetro
    const handleSelecionarPiezometro = useCallback((value: number) => {
        const piezometroSelecionado = piezometros.find((p) => p.value === value);
        updateFilters({
            idSelecionado: value,
            tipoSelecionado: piezometroSelecionado?.tipo || null
        });
    }, [piezometros, updateFilters]);

    // Buscar dados do gráfico
    const buscarGrafico = useCallback(async () => {
        const { idSelecionado, tipoSelecionado, dataInicio, dataFim, porDia } = filters;

        if (!idSelecionado) {
            Swal.fire({ icon: "warning", title: "Selecione um piezômetro" });
            return;
        }

        if (!dataInicio || !dataFim) {
            Swal.fire({ icon: "warning", title: "Selecione as datas" });
            return;
        }

        if (dataInicio > dataFim) {
            Swal.fire({
                icon: "error",
                title: "Datas inválidas",
                text: "A data inicial não pode ser maior que a data final."
            });
            return;
        }

        const inicioFormatado = formatarData(dataInicio, porDia);
        const fimFormatado = formatarData(dataFim, porDia);

        try {
            Swal.fire({
                title: 'Carregando...',
                html: 'Buscando dados e analisando...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            setCarregando(true);
            setCarregandoIANivelEstatico(true);
            setAnaliseIANivelEstatico(null);
            setAnaliseOriginalIA(null);

            const apiCall = porDia
                ? getPiezometroDiarioApi(idSelecionado, inicioFormatado, fimFormatado)
                : getPiezometroFiltroComHistoricoApi(idSelecionado, inicioFormatado, fimFormatado);

            const resposta = await apiCall;

            const rawDadosFiltrados = resposta.data.dadosFiltrados || [];
            const historicoCompleto = resposta.data.historicoCompleto || [];

            let dadosFiltrados = rawDadosFiltrados;

            if (porDia) {
                dadosFiltrados = transformarDadosDiarios(rawDadosFiltrados);
            }

            // Para a IA, mandamos o raw se for porDia, ou o array se for mensal
            const dadosParaIA = porDia ? rawDadosFiltrados : dadosFiltrados;

            // Verificação se tem dados para a IA
            const temDadosIA = porDia
                ? (
                    (rawDadosFiltrados.nivel_estatico && rawDadosFiltrados.nivel_estatico.length > 0) ||
                    (rawDadosFiltrados.precipitacao && rawDadosFiltrados.precipitacao.length > 0) ||
                    (rawDadosFiltrados.vazao_calha && rawDadosFiltrados.vazao_calha.length > 0)
                )
                : (dadosFiltrados && dadosFiltrados.length > 0);

            let houveErroIA = false;
            if (temDadosIA) {
                const iaResponse = await webHookIAAnaliseNivelEstatico(dadosParaIA, idSelecionado, historicoCompleto);
                if (Array.isArray(iaResponse) && iaResponse[0]?.output) {
                    setAnaliseIANivelEstatico(iaResponse[0].output);
                    setAnaliseOriginalIA(iaResponse[0].output);
                } else {
                    houveErroIA = true;
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro na Análise',
                        text: 'houve algum erro com a análise da IA, tente de novo e se o erro persistir nos contate!',
                        confirmButtonText: 'Fechar',
                        confirmButtonColor: '#d33'
                    });
                }
            }

            let dados = [...dadosFiltrados].sort((a: any, b: any) => {
                return new Date(a.mes_ano).getTime() - new Date(b.mes_ano).getTime();
            });

            const labels = dados.map((item: any) => {
                if (porDia) {
                    const [ano, mes, dia] = item.mes_ano.split("-");
                    return `${dia}/${mes}/${ano}`;
                }
                const [ano, mes] = item.mes_ano.split("-");
                return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", {
                    month: "short",
                    year: "numeric"
                });
            });

            const tipoPiezometro = tipoSelecionado;
            const ehPCouPV = eTipoCalhasOuPontoVazao(tipoPiezometro || '');

            let datasets: ChartDataset[] = [];

            if (tipoPiezometro === 'PP') {
                datasets = [
                    {
                        label: "Cota Superfície",
                        data: dados.map((i: any) => i.cota_superficie),
                        borderColor: '#ff9f40',
                        tension: 0.4,
                        yAxisID: 'y',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        order: 1
                    },
                    {
                        label: "Cota Base",
                        data: dados.map((i: any) => i.cota_base),
                        borderColor: '#9966ff',
                        tension: 0.4,
                        yAxisID: 'y',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        order: 2
                    },
                    {
                        label: "Vazão Mina",
                        data: dados.map((i: any) => i.vazao_bombeamento),
                        borderColor: '#00bb7e',
                        borderWidth: 1,
                        tension: 0.4,
                        yAxisID: 'y1',
                    },
                    {
                        label: "Nível Estático",
                        data: dados.map((i: any) => i.nivel_estatico),
                        borderColor: '#ff6384',
                        borderWidth: 3,
                        tension: 0.4,
                        yAxisID: 'y',
                        order: 4
                    },
                    {
                        label: "Precipitação",
                        data: dados.map((i: any) => i.precipitacao),
                        borderColor: '#2f4860',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ];
            } else if (tipoPiezometro === 'PR') {
                datasets = [
                    {
                        label: "Vazão Mina",
                        data: dados.map((i: any) => i.vazao_bombeamento),
                        borderColor: '#00bb7e',
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: "Cota",
                        data: dados.map((i: any) => i.cota_superficie),
                        borderColor: '#ff9f40',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: "Nível Estático",
                        data: dados.map((i: any) => i.nivel_estatico),
                        borderColor: '#ff6384',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: "Precipitação",
                        data: dados.map((i: any) => i.precipitacao),
                        borderColor: '#2f4860',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ];
            } else if (ehPCouPV) {
                datasets = [
                    {
                        label: "Vazão",
                        data: dados.map((i: any) => i.vazao_calha),
                        borderColor: '#ff6384',
                        borderWidth: 3,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: "Vazão Mina",
                        data: dados.map((i: any) => i.vazao_bombeamento),
                        borderColor: '#00bb7e',
                        borderWidth: 1,
                        tension: 0.4,
                        yAxisID: 'y1'
                    },
                    {
                        label: "Precipitação",
                        data: dados.map((i: any) => i.precipitacao),
                        borderColor: '#2f4860',
                        borderWidth: 1,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ];
            }

            // Adiciona o dataset de início da escavação se o intervalo incluir 10/2012
            const datasetMineracao = getDatasetInicioMineracao(labels, dataInicio, dataFim);
            if (datasetMineracao) {
                datasets.push(datasetMineracao as any);
            }

            setLineData({
                labels,
                datasets
            });

            const total = dados.length;
            const avgPrecip = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.precipitacao || 0), 0) / total : 0;
            const avgVazaoMina = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.vazao_bombeamento || 0), 0) / total : 0;

            let avgNivel = 0;
            let avgCotaSuperficie = 0;
            let avgCotaBase = 0;
            let avgVazao = 0;

            if (tipoPiezometro === 'PP') {
                avgNivel = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.nivel_estatico || 0), 0) / total : 0;
                avgCotaSuperficie = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.cota_superficie || 0), 0) / total : 0;
                avgCotaBase = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.cota_base || 0), 0) / total : 0;
            } else if (tipoPiezometro === 'PR') {
                avgCotaSuperficie = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.cota_superficie || 0), 0) / total : 0;
                avgNivel = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.nivel_estatico || 0), 0) / total : 0;
            } else if (ehPCouPV) {
                avgVazao = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.vazao_calha || 0), 0) / total : 0;
            }

            setSummary({
                nivelEstatico: parseFloat(avgNivel.toFixed(1)),
                cotaSuperficie: parseFloat(avgCotaSuperficie.toFixed(1)),
                cotaBase: parseFloat(avgCotaBase.toFixed(1)),
                precipitacao: parseFloat(avgPrecip.toFixed(1)),
                vazaoMina: parseFloat(avgVazaoMina.toFixed(1)),
                vazao: parseFloat(avgVazao.toFixed(1)),
                total: total
            });

            setTabelaDados(dados);

            const yAxisConfig: any = {
                type: "linear",
                display: true,
                position: "left",
                ticks: {
                    color: "#ccc"
                },
                grid: {
                    color: '#444'
                }
            };

            if (ehPCouPV) {
                yAxisConfig.title = {
                    display: true,
                    text: 'Vazão (m³/h)',
                    color: '#ccc'
                };

                yAxisConfig.beginAtZero = true;
                yAxisConfig.suggestedMin = 0;
                yAxisConfig.min = 0;

                const optionsBase = {
                    maintainAspectRatio: false,
                    aspectRatio: 0.6,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ccc'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ccc'
                            },
                            grid: {
                                color: '#444'
                            }
                        },
                        y: yAxisConfig,
                        y1: {
                            type: "linear",
                            display: true,
                            position: "right",
                            ticks: {
                                color: "#ccc"
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Vazão Mina (m³/h) / Precipitação (mm)',
                                color: '#ccc'
                            }
                        }
                    }
                };
                setLineOptions(optionsBase);
            } else if (tipoPiezometro === 'PR') {
                yAxisConfig.title = {
                    display: true,
                    text: 'Cota/Nível (m)',
                    color: '#ccc'
                };

                const optionsBase = {
                    maintainAspectRatio: false,
                    aspectRatio: 0.6,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ccc'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ccc'
                            },
                            grid: {
                                color: '#444'
                            }
                        },
                        y: yAxisConfig,
                        y1: {
                            type: "linear",
                            display: true,
                            position: "right",
                            ticks: {
                                color: "#ccc"
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Precipitação (mm) / Vazão Mina (m³/h)',
                                color: '#ccc'
                            }
                        }
                    }
                };
                setLineOptions(optionsBase);
            } else if (tipoPiezometro === 'PP') {
                yAxisConfig.title = {
                    display: true,
                    text: 'Nível/Cota (m)',
                    color: '#ccc'
                };

                const optionsBase = {
                    maintainAspectRatio: false,
                    aspectRatio: 0.6,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ccc'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ccc'
                            },
                            grid: {
                                color: '#444'
                            }
                        },
                        y: yAxisConfig,
                        y1: {
                            type: "linear",
                            display: true,
                            position: "right",
                            ticks: {
                                color: "#ccc"
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: 'Precipitação (mm) / Vazão Mina (m³/h)',
                                color: '#ccc'
                            }
                        }
                    }
                };
                setLineOptions(optionsBase);
            }

            if (!houveErroIA) {
                Swal.close();
            }

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Erro ao carregar gráfico",
                text: "Não foi possível obter os dados do relatório."
            });
            console.error("Erro ao carregar gráfico", err);
        } finally {
            setCarregando(false);
            setCarregandoIANivelEstatico(false);
        }
    }, [filters]);



    // Efeitos
    useEffect(() => {
        carregarPiezometrosFiltrados(null);
    }, []);

    useEffect(() => {
        carregarPiezometrosFiltrados(filters.tipoFiltroSelecionado);
    }, [filters.tipoFiltroSelecionado, carregarPiezometrosFiltrados]);

    // Limpar dados quando os filtros mudarem
    useEffect(() => {
        setLineData(null);
        setSummary({
            nivelEstatico: 0,
            cotaSuperficie: 0,
            cotaBase: 0,
            precipitacao: 0,
            vazaoMina: 0,
            vazao: 0,
            total: 0
        });
        setTabelaDados([]);
        setAnaliseIANivelEstatico(null);
        setAnaliseOriginalIA(null);
        setCarregandoIANivelEstatico(false);
    }, [filters]);

    return {
        // Estados
        filters,
        piezometros,
        carregando,
        lineData,
        lineOptions,
        summary,
        tabelaDados,
        opcoesFiltro,

        // Funções
        updateFilters,
        handleSelecionarPiezometro,
        buscarGrafico,

        // relacionados a analise ia nivel estatico
        analiseIANivelEstatico,
        setAnaliseIANivelEstatico,
        analiseOriginalIA,
        carregandoIANivelEstatico,
    };
};