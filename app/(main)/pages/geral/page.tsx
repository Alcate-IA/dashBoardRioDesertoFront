"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiGeralContadores, apiGeralUltimosMovimentosRdLab, apiGeralUltimosMovimentosZeus, apiDadosDaVazaoDaMina, apiPiozometrosAtrasados, apiGraficoVazaoPrecipitacao } from "@/service/visaoGeralApis";
import Swal from "sweetalert2";
import { Carousel } from 'primereact/carousel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import DetalhePiezometroZeusPopup from '@/components/DetalhePiezometroZeusPopup';

interface ContadoresData {
    contadoresZeus: number;
    contadoresRdLab: number;
    contadoresZeusAtivos: number;
    contadoresZeusInativos: number;
    contadoresRdLabAtivos: number;
    contadoresRdLabInativos: number;
}

interface MovimentoRdLab {
    data: string;
    identificacao: number;
    coletor: string;
    n_registro: number;
    codigo: number;
    id_zeus: number;
    cd_piezometro: number;
    nm_piezometro: string;
    nm_colaborador_inspecao?: string;
    //tp_piezometro?: string;
}

interface MovimentoZeusDados {
    menor_leitura: boolean;
    maior_leitura: boolean;
    media: boolean;
}

interface MovimentoZeus {
    origem: string;
    id: number;
    dt_inspecao: string;
    nivel_estatico: number | null;
    vazao: number | null;
    ds_observacao: string | null;
    colaborador: string;
    cd_piezometro: number;
    cd_empresa: number;
    id_piezometro: string;
    nm_piezometro: string;
    tp_piezometro: string;
    dados?: MovimentoZeusDados;
}

interface DadosVazaoMina {
    ultima_data: string;
    media_3_meses_anteriores: number;
    ultima_vazao: number;
    primeira_data: string;
    total_registros: number;
    meses_considerados_para_media: string[];
    minimo_vazao: number;
    maximo_vazao: number;
    media_vazao: number;
}

interface EstatisticasVazao {
    classificacao_tendencia: string;
    media_variacao_percent: number;
    maior_variacao_percent: number;
    menor_variacao_percent: number;
    mes_atual_nome: string;
    mes_anterior_nome: string;
    dados: {
        tendencia: boolean;
        contagem: {
            positivas: number;
            negativas: number;
            total: number;
        };
    };
}

interface PiezometroAtrasado {
    cdPiezometro: number;
    nmPiezometro: string;
    frequenciaDescricao: string;
    dtUltimaInspecao: string;
    origem: string;
    situacao: string;
    diasAtrasado: number;
}

interface DadosGraficoVazaoPrecipitacao {
    mes_ano: string;
    vazao_bombeamento: number;
    precipitacao: number;
}


export default function GeralPage() {
    const router = useRouter();
    const [contadores, setContadores] = useState<ContadoresData>({
        contadoresZeus: 0,
        contadoresRdLab: 0,
        contadoresRdLabAtivos: 0,
        contadoresRdLabInativos: 0,
        contadoresZeusAtivos: 0,
        contadoresZeusInativos: 0
    });
    const [movimentos, setMovimentos] = useState<MovimentoRdLab[]>([]);
    const [movimentosZeus, setMovimentosZeus] = useState<MovimentoZeus[]>([]);
    const [dadosVazaoDaMina, setDadosVazaoDaMina] = useState<DadosVazaoMina | null>(null);
    const [estatisticasVazao, setEstatisticasVazao] = useState<EstatisticasVazao | null>(null);
    const [atrasados, setAtrasados] = useState<PiezometroAtrasado[]>([]);
    const [analiseIa, setAnaliseIa] = useState<string | null>(null);
    const [graficoData, setGraficoData] = useState<any>(null);
    const [graficoOptions, setGraficoOptions] = useState<any>(null);
    const [popupPiezometroZeus, setPopupPiezometroZeus] = useState<MovimentoZeus | null>(null);

    useEffect(() => {
        Swal.fire({
            title: 'Carregando...',
            text: 'Buscando informações...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        Promise.all([
            getApiGeralContadores(),
            apiGeralUltimosMovimentosRdLab(),
            apiGeralUltimosMovimentosZeus(),
            apiDadosDaVazaoDaMina(),
            apiPiozometrosAtrasados(),
            apiGraficoVazaoPrecipitacao()
        ])
            .then(([resContadores, resMovimentos, resZeus, resDadosVazaoDaMina, resAtrasados, resGrafico]) => {
                setContadores(resContadores.data);
                setMovimentos(resMovimentos.data || []);
                setMovimentosZeus(resZeus.data || []);
                setDadosVazaoDaMina(resDadosVazaoDaMina.data?.resultado || null);
                setEstatisticasVazao(resDadosVazaoDaMina.data?.analisesSazonais || null);
                setAnaliseIa(JSON.parse(resDadosVazaoDaMina.data.analiseIa.resposta_raw)[0].output || null);

                // Configuração do Gráfico de Vazão e Precipitação
                const dadosGraficoVazao = resGrafico.data || [];
                if (dadosGraficoVazao.length > 0) {
                    const dadosOrdenados = [...dadosGraficoVazao].sort((a: DadosGraficoVazaoPrecipitacao, b: DadosGraficoVazaoPrecipitacao) => new Date(a.mes_ano).getTime() - new Date(b.mes_ano).getTime());

                    const labels = dadosOrdenados.map((h: DadosGraficoVazaoPrecipitacao) => {
                        const [ano, mes] = h.mes_ano.split('-');
                        return `${mes}/${ano}`;
                    });

                    const datasets = [
                        {
                            label: 'Vazão da Mina',
                            data: dadosOrdenados.map((h: DadosGraficoVazaoPrecipitacao) => h.vazao_bombeamento),
                            borderColor: '#00bb7e',
                            backgroundColor: '#00bb7e',
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Precipitação',
                            data: dadosOrdenados.map((h: DadosGraficoVazaoPrecipitacao) => h.precipitacao),
                            borderColor: '#9e4f9eff',
                            backgroundColor: '#9e4f9eff',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ];

                    setGraficoData({ labels, datasets });
                    setGraficoOptions({
                        maintainAspectRatio: false,
                        aspectRatio: 0.6,
                        plugins: {
                            legend: { labels: { color: '#ffffff' } }
                        },
                        scales: {
                            x: { ticks: { color: '#ffffff' }, grid: { color: '#ebedef' } },
                            y: { type: 'linear', display: true, position: 'left', ticks: { color: '#ffffff' }, grid: { color: '#ebedef' }, title: { display: true, text: 'Vazão (m³/h)', color: '#ffffff' } },
                            y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#ffffff' }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Precipitação (mm)', color: '#ffffff' } }
                        }
                    });
                }

                const normalizedAtrasados = (resAtrasados.data || []).map((item: PiezometroAtrasado) => {
                    if (item.frequenciaDescricao?.toUpperCase() === 'NÃO DEFINIDA') {
                        return { ...item, situacao: 'NÃO DEFINIDA' };
                    }
                    return item;
                });
                setAtrasados(normalizedAtrasados);

                Swal.close();
            })
            .catch((error) => {
                console.error("Erro ao buscar dados da dashboard:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Falha ao carregar informações da dashboard.'
                });
            });

        return () => {
            Swal.close();
        };
    }, []);

    const handleNavigation = (path: string) => {
        Swal.fire({
            title: 'Carregando...',
            text: 'Acessando módulo...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        router.push(path);
    };

    const templateMovimento = (movimento: MovimentoRdLab) => {
        const dataFormatada = movimento.data ? movimento.data.split('-').reverse().join('/') : '-';
        const nomeColaborador = movimento.nm_colaborador_inspecao || movimento.coletor;

        return (
            <div className="p-2">
                <div className="surface-card shadow-2 border-round p-3 h-full">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <span className="text-xl font-bold text-900">{movimento.nm_piezometro}</span>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-blue-500"></i>
                            <span className="text-700 font-medium">{dataFormatada}</span>
                        </div>
                    </div>

                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-user text-primary"></i>
                            <span className="text-600">Coletor:</span>
                            <span className="text-900 font-medium">{nomeColaborador}</span>
                        </div>

                        {/* <div className="flex align-items-center gap-2">
                            <i className="pi pi-tag text-primary"></i>
                            <span className="text-600">Tipo:</span>
                            <span className="text-900 font-medium">{movimento.tp_piezometro}</span>
                        </div> */}

                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-hashtag text-primary"></i>
                            <span className="text-600">Registro:</span>
                            <span className="text-900 font-medium">{movimento.n_registro}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const templateMovimentoZeus = (movimento: MovimentoZeus) => {
        const dataFormatada = movimento.dt_inspecao ? movimento.dt_inspecao.split('-').reverse().join('/') : '-';
        const ehNivel = movimento.tp_piezometro === 'PP' || movimento.tp_piezometro === 'PR' || movimento.tp_piezometro === 'PB';
        const ehVazao = movimento.tp_piezometro === 'PC' || movimento.tp_piezometro === 'PV';

        return (
            <div className="p-2">
                <div className="surface-card shadow-2 border-round p-3 h-full transition-colors transition-duration-150 flex flex-column">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <span className="text-xl font-bold text-900">{movimento.nm_piezometro}</span>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-blue-500"></i>
                            <span className="text-700 font-medium">{dataFormatada}</span>
                        </div>
                    </div>

                    <div className="flex align-items-center gap-3 flex-grow-1">
                        <div className="flex flex-column gap-2 flex-1">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-user text-primary"></i>
                                <span className="text-600">Coletor:</span>
                                <span className="text-900 font-medium">{movimento.colaborador}</span>
                            </div>

                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-tag text-primary"></i>
                                <span className="text-600">Tipo:</span>
                                <span className="text-900 font-medium">{movimento.tp_piezometro}</span>
                            </div>

                            {ehNivel && (
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-chart-line text-blue-500"></i>
                                    <span className="text-600">Nível Estático:</span>
                                    <span className="text-900 font-medium">{movimento.nivel_estatico} m</span>
                                </div>
                            )}

                            {ehVazao && (
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-water text-blue-500"></i>
                                    <span className="text-600">Vazão:</span>
                                    <span className="text-900 font-medium">{movimento.vazao !== null ? movimento.vazao : '-'} m³/h</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="p-button p-button-outlined p-button-sm flex-shrink-0 ml-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPopupPiezometroZeus(movimento);
                            }}
                        >
                            Analisar
                        </button>
                    </div>

                    {(movimento.ds_observacao || (movimento.dados && (movimento.dados.maior_leitura || movimento.dados.menor_leitura))) && (
                        <div className="mt-3 pt-3 border-top-1 border-200 flex flex-column gap-2">
                            {movimento.ds_observacao && (
                                <div className="flex align-items-start gap-2">
                                    <i className="pi pi-info-circle text-orange-500 mt-1"></i>
                                    <span className="text-600 text-sm font-italic">{movimento.ds_observacao}</span>
                                </div>
                            )}
                            {movimento.dados && (movimento.dados.maior_leitura || movimento.dados.menor_leitura) && (
                                <div className="flex flex-wrap gap-2">
                                    {movimento.dados.maior_leitura && (
                                        <span className="inline-flex align-items-center gap-1 px-2 py-1 border-round bg-red-100 text-red-700 text-xs font-bold">
                                            <i className="pi pi-exclamation-circle text-red-700"></i>
                                            Maior leitura já vista
                                        </span>
                                    )}
                                    {movimento.dados.menor_leitura && (
                                        <span className="inline-flex align-items-center gap-1 px-2 py-1 border-round bg-red-100 text-red-700 text-xs font-bold">
                                            <i className="pi pi-exclamation-circle text-red-700"></i>
                                            Menor leitura já vista
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderVazaoTags = (dados: DadosVazaoMina) => {
        const { ultima_vazao, maximo_vazao, minimo_vazao, media_vazao } = dados;
        const tags = [];

        // 1. Extremos
        if (ultima_vazao >= maximo_vazao) {
            tags.push({ text: 'Maior de todas', color: 'bg-red-100 text-red-700', icon: 'pi-exclamation-circle' });
        } else if (ultima_vazao <= minimo_vazao) {
            tags.push({ text: 'Menor de todas', color: 'bg-green-100 text-green-700', icon: 'pi-check-circle' });
        }

        // 3. Proximidade
        const distMax = Math.abs(maximo_vazao - ultima_vazao);
        const distMin = Math.abs(minimo_vazao - ultima_vazao);
        const distAvg = Math.abs(media_vazao - ultima_vazao);
        const minDist = Math.min(distMax, distMin, distAvg);

        if (minDist === distMax && ultima_vazao !== maximo_vazao) {
            tags.push({ text: 'Próx. da maior', color: 'bg-pink-100 text-pink-700', icon: 'pi-chart-line' });
        } else if (minDist === distAvg) {
            tags.push({ text: 'Próx. da média', color: 'bg-cyan-100 text-cyan-700', icon: 'pi-minus' });
        } else if (minDist === distMin && ultima_vazao !== minimo_vazao) {
            tags.push({ text: 'Próx. da menor', color: 'bg-teal-100 text-teal-700', icon: 'pi-chart-line' });
        }

        return (
            <div className="flex flex-wrap gap-2 justify-content-end">
                {tags.map((tag, index) => (
                    <span key={index} className={`inline-flex align-items-center gap-1 px-2 py-1 border-round text-xs font-bold ${tag.color}`}>
                        <i className={`pi ${tag.icon}`}></i>
                        {tag.text}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h5 className="m-0">Visão Geral</h5>
                            <span className="text-500">Bem-vindo ao sistema de monitoramento Rio Deserto</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Nível Estático */}
            <div className="col-12 md:col-6 lg:col-4">
                <div
                    className="card mb-0 hover:surface-100 cursor-pointer transition-duration-200"
                    onClick={() => handleNavigation('/pages/relatorio-nivel-estatico')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Nível Estático</span>
                            <div className="text-900 font-medium text-xl">
                                {contadores.contadoresZeus} Pontos
                            </div>
                            <span className="text-400 text-sm">Ativos: {contadores.contadoresZeusAtivos} Inativos: {contadores.contadoresZeusInativos} </span>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-chart-line text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-blue-500 font-medium">Monitoramento </span>
                    <span className="text-500">de níveis e vazão</span>
                </div>
            </div>

            {/* Card Qualidade da Água */}
            <div className="col-12 md:col-6 lg:col-4">
                <div
                    className="card mb-0 hover:surface-100 cursor-pointer transition-duration-200"
                    onClick={() => handleNavigation('/pages/qualidade-agua')}>
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Qualidade da Água</span>
                            <div className="text-900 font-medium text-xl">{contadores.contadoresRdLab} Pontos</div>
                            <span className="text-400 text-sm">Ativos: {contadores.contadoresRdLabAtivos} Inativos: {contadores.contadoresRdLabInativos} </span>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-filter text-cyan-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-cyan-500 font-medium">Relatórios </span>
                    <span className="text-500">químicos</span>
                </div>
            </div>

            {/* Card Mapa */}
            <div className="col-12 md:col-6 lg:col-4">
                <div
                    className="card mb-0 hover:surface-100 cursor-pointer transition-duration-200"
                    onClick={() => handleNavigation('/pages/mapa')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Mapa</span>
                            <div className="text-900 font-medium text-xl">Geolocalização</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-map-marker text-purple-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-purple-500 font-medium">Visualização </span>
                    <span className="text-500">espacial</span>
                </div>
            </div>

            {/* Estatísticas Vazão da Mina */}
            {dadosVazaoDaMina && (
                <div className="col-12">
                    <div className="card">
                        <h5>
                            Estatísticas de Vazão da Mina
                        </h5>
                        <div className="grid">
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full">
                                    <div className="flex justify-content-between mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Última Vazão</span>
                                            <div className="text-900 font-medium text-xl">{dadosVazaoDaMina.ultima_vazao} m³/h</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                            <i className="pi pi-chart-line text-blue-500 text-xl" />
                                        </div>
                                    </div>
                                    <div className="flex align-items-center justify-content-between">
                                        <div>
                                            <span className="text-500">Data: </span>
                                            <span className="text-blue-500 font-medium">{dadosVazaoDaMina.ultima_data.split('-').reverse().join('/')}</span>
                                        </div>
                                        {renderVazaoTags(dadosVazaoDaMina)}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full">
                                    <div className="flex justify-content-between mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Média (3 Meses)</span>
                                            <div className="text-900 font-medium text-xl">{dadosVazaoDaMina.media_3_meses_anteriores.toFixed(2)} m³/h</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                            <i className="pi pi-chart-bar text-orange-500 text-xl" />
                                        </div>
                                    </div>
                                    <span className="text-500">Média Geral: </span>
                                    <span className="text-orange-500 font-medium">{dadosVazaoDaMina.media_vazao.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full">
                                    <div className="flex justify-content-between mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Leituras Extremas</span>
                                            <span className="text-500">Maior leitura: </span>
                                            <span className="text-orange-500 font-medium">{dadosVazaoDaMina.maximo_vazao} m³/h</span>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                            <i className="pi pi-sort-alt text-cyan-500 text-xl" />
                                        </div>
                                    </div>
                                    <span className="text-500">Menor leitura: </span>
                                    <span className="text-cyan-500 font-medium">{dadosVazaoDaMina.minimo_vazao} m³/h</span>
                                </div>
                            </div>
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full">
                                    <div className="flex justify-content-between mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Histórico</span>
                                            <div className="text-900 font-medium text-xl">{dadosVazaoDaMina.total_registros} Registros</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                            <i className="pi pi-calendar-plus text-purple-500 text-xl" />
                                        </div>
                                    </div>
                                    <span className="text-500">Desde: </span>
                                    <span className="text-purple-500 font-medium">{dadosVazaoDaMina.primeira_data.split('-').reverse().join('/')}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h5 className="mt-4">Gráfico de vazão da mina e precipitação</h5>
                            {graficoData && (
                                <div className="surface-card shadow-2 p-3 border-round">
                                    <Chart type="line" data={graficoData} options={graficoOptions} style={{ height: '350px' }} />
                                </div>
                            )}
                        </div>


                        {/* Análise Preditiva IA e Estatísticas de Tendência */}
                        <div className="grid mt-4">
                            {/* Análise IA */}
                            {analiseIa && (
                                <div className="col-12 lg:col-6">
                                    <div className="p-4 surface-50 border-round-xl border-1 surface-border h-full">
                                        <div className="flex align-items-center gap-2 mb-2">
                                            <i className="pi pi-sparkles text-purple-600 text-xl"></i>
                                            <span className="font-bold text-900 text-lg">Tendência hídrica para poços (cheias/secas) por IA:</span>
                                        </div>
                                        <span className="m-0 text-700 line-height-3 text-justify">
                                            {analiseIa}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Estatísticas de Tendência */}
                            {estatisticasVazao && (
                                <div className="col-12 lg:col-6">
                                    <div className="p-4 surface-50 border-round-xl border-1 surface-border h-full">
                                        <div className="flex align-items-center gap-2 mb-3">
                                            <i className={`pi ${estatisticasVazao.dados.tendencia ? 'pi-arrow-up-right text-green-600' : 'pi-arrow-down-right text-red-600'} text-xl`}></i>
                                            <span className="font-bold text-900 text-lg">
                                                Estatísticas de Tendência ({estatisticasVazao.mes_anterior_nome.toLowerCase()}-{estatisticasVazao.mes_atual_nome.toLowerCase()}): {estatisticasVazao.classificacao_tendencia}
                                            </span>
                                        </div>

                                        <div className="grid">
                                            <div className="col-6">
                                                <div className="flex flex-column gap-1">
                                                    <span className="text-500 text-sm">Variação Média</span>
                                                    <span className={`font-bold ${estatisticasVazao.media_variacao_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {estatisticasVazao.media_variacao_percent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="flex flex-column gap-1">
                                                    <span className="text-500 text-sm">Variações Positivas</span>
                                                    <span className="font-bold text-900">
                                                        {estatisticasVazao.dados.contagem.positivas} de {estatisticasVazao.dados.contagem.total} meses
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-6 mt-2">
                                                <div className="flex flex-column gap-1">
                                                    <span className="text-500 text-sm">Maior Variação</span>
                                                    <span className="font-bold text-green-600">
                                                        +{estatisticasVazao.maior_variacao_percent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-6 mt-2">
                                                <div className="flex flex-column gap-1">
                                                    <span className="text-500 text-sm">Menor Variação</span>
                                                    <span className="font-bold text-red-600">
                                                        {estatisticasVazao.menor_variacao_percent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabela de Piezômetros Atrasados */}
            <div className="col-12">
                <div className="card">
                    <h5>Inspeções de Piezômetros</h5>
                    <DataTable
                        value={atrasados}
                        paginator
                        rows={10}
                        dataKey="cdPiezometro"
                        emptyMessage="Nenhum piezômetro encontrado."
                        responsiveLayout="stack"
                        className="p-datatable-sm"
                        sortMode="multiple"
                        filterDisplay="menu"
                    >
                        <Column field="nmPiezometro" header="Piezômetro" sortable filter filterPlaceholder="Filtrar por nome" style={{ minWidth: '14rem' }}></Column>
                        <Column field="frequenciaDescricao" header="Frequência" sortable filter={false} showFilterMenu={false} style={{ minWidth: '10rem' }}></Column>
                        <Column
                            field="dtUltimaInspecao"
                            header="Última Inspeção"
                            sortable
                            filter={false}
                            showFilterMenu={false}
                            style={{ minWidth: '10rem' }}
                            body={(rowData: PiezometroAtrasado) => {
                                return rowData.dtUltimaInspecao ? rowData.dtUltimaInspecao.split('T')[0].split('-').reverse().join('/') : '-';
                            }}
                        ></Column>
                        <Column
                            field="situacao"
                            header="Situação"
                            sortable
                            style={{ minWidth: '8rem' }}
                            body={(rowData: PiezometroAtrasado) => {
                                if (rowData.situacao.toUpperCase() === 'NÃO DEFINIDA') {
                                    return <Tag value="NÃO DEFINIDA" style={{ backgroundColor: '#94a3b8', color: '#ffffff' }} />;
                                }
                                const severity = rowData.situacao.toLowerCase() === 'em dia' ? 'success' : 'danger';
                                return <Tag value={rowData.situacao.toUpperCase()} severity={severity} />;
                            }}
                        ></Column>
                        <Column
                            field="diasAtrasado"
                            header="Dias Atrasado"
                            sortable
                            style={{ minWidth: '8rem' }}
                            body={(rowData: PiezometroAtrasado) => {
                                const color = rowData.diasAtrasado > 0 ? 'text-red-600 font-bold' : 'text-green-600';
                                return <span className={color}>{rowData.diasAtrasado}</span>;
                            }}
                        ></Column>
                    </DataTable>
                </div>
            </div>

            {/* Carrossel de Últimos Movimentos RD Lab */}
            <div className="col-12">
                <div className="card">
                    <h5>Últimos Movimentos RD Lab</h5>
                    {movimentos.length > 0 ? (
                        <Carousel
                            value={movimentos}
                            numVisible={3}
                            numScroll={1}
                            responsiveOptions={[
                                { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '767px', numVisible: 1, numScroll: 1 }
                            ]}
                            itemTemplate={templateMovimento}
                            circular
                            autoplayInterval={5000}
                        />
                    ) : (
                        <div className="p-4 text-center text-500">
                            Nenhum movimento recente encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Carrossel de Últimos Movimentos Zeus */}
            <div className="col-12">
                <div className="card">
                    <h5>Últimos Movimentos Zeus</h5>
                    {movimentosZeus.length > 0 ? (
                        <Carousel
                            value={movimentosZeus}
                            numVisible={3}
                            numScroll={1}
                            responsiveOptions={[
                                { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '767px', numVisible: 1, numScroll: 1 }
                            ]}
                            itemTemplate={templateMovimentoZeus}
                            circular
                            autoplayInterval={5000}
                        />
                    ) : (
                        <div className="p-4 text-center text-500">
                            Nenhum movimento recente encontrado.
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                header={popupPiezometroZeus ? `${popupPiezometroZeus.nm_piezometro} — Histórico (10/2008 até hoje)` : ''}
                visible={!!popupPiezometroZeus}
                onHide={() => setPopupPiezometroZeus(null)}
                style={{ width: '92vw', maxWidth: 'none', height: '90vh', maxHeight: '90vh' }}
                contentStyle={{ maxHeight: 'calc(90vh - 8rem)', overflow: 'auto' }}
                className="p-dialog-analise-zeus"
                maximizable
                blockScroll
                dismissableMask
            >
                {popupPiezometroZeus && (
                    <DetalhePiezometroZeusPopup
                        movimento={{
                            cd_piezometro: popupPiezometroZeus.cd_piezometro,
                            nm_piezometro: popupPiezometroZeus.nm_piezometro,
                            tp_piezometro: popupPiezometroZeus.tp_piezometro,
                        }}
                    />
                )}
            </Dialog>
        </div>
    );
}
