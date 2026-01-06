'use client';

import { useMemo } from 'react';
import { DATA_INICIO_MINERACAO } from '@/utils/anotacaoInicioMineracao';

export interface AnaliseLegislacao {
    simbolo: string;
    nome_analise: string;
    parametro: string;
}

export interface DadoAmostra {
    informacoesAmostra: {
        data: string;
    };
    analises: Array<{
        simbolo: string;
        nome_analise: string;
        resultado: string;
    }>;
}

export interface DadosQualidadeAgua {
    amostras: DadoAmostra[];
    legislacoes?: {
        [key: string]: {
            parametros_legislacao: AnaliseLegislacao[];
        };
    };
}

export interface LimiteLegislacao {
    min?: number;
    max?: number;
}

/**
 * Hook para processar e organizar dados de qualidade da água para exibição em gráficos.
* muita coisa daqui tem que ir para o backend, algumas regras de negócio aqui, tenho uma ideia de como fazer mais vai levar um tempo
* imagino que com isso esse cara vai ficar melhor 
*/
export const useGraficosAnaliseTelaQualidadeAgua = (dados: DadosQualidadeAgua) => {

    const converterParaNumero = (valorStr: string) => {
        if (!valorStr) return null;
        if (valorStr.trim().toUpperCase() === 'ND') return null;

        let valorLimpo = valorStr.replace(',', '.');

        if (valorLimpo.includes(' a ')) {
            valorLimpo = valorLimpo.split(' a ')[0];
        }

        valorLimpo = valorLimpo.replace(/[<>]/g, '').trim();

        const numero = parseFloat(valorLimpo);
        return isNaN(numero) ? null : numero;
    };

    const normalizarSimbolo = (simbolo: string) => {
        if (!simbolo) return '';
        return simbolo.trim().toLowerCase().replace(/\.$/, '');
    };

    const analisarLimiteLegislacao = (parametro: string): LimiteLegislacao => {
        if (!parametro) return {};

        let p = parametro.toLowerCase().trim();
        p = p.replace('mg/l', '').replace('ausentes em 100 ml', '0').trim();

        const extrairNumero = (texto: string) => {
            const correspondencia = texto.match(/[\d]+([.,][\d]+)?/);
            if (correspondencia) {
                return parseFloat(correspondencia[0].replace(',', '.'));
            }
            return null;
        };

        if (p.startsWith('máx') || p.startsWith('até') || p.startsWith('inferior a')) {
            const valor = extrairNumero(p);
            if (valor !== null) return { max: valor };
        }

        if (p.startsWith('mín') || p.includes('mínima')) {
            const valor = extrairNumero(p);
            if (valor !== null) return { min: valor };
        }

        if (p.includes('entre') || p.match(/^\d+([.,]\d+)?\s+a\s+\d+([.,]\d+)?/)) {
            const numeros = p.match(/[\d]+([.,][\d]+)?/g);
            if (numeros && numeros.length >= 2) {
                const v1 = parseFloat(numeros[0].replace(',', '.'));
                const v2 = parseFloat(numeros[1].replace(',', '.'));
                return { min: Math.min(v1, v2), max: Math.max(v1, v2) };
            }
        }

        const valor = extrairNumero(p);
        return valor !== null ? { max: valor } : {};
    };

    const formatarDataParaExibicao = (dataStr: string) => {
        if (!dataStr) return '';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const verificarProximidadeInicioMineracao = (dataStr: string): boolean => {
        if (!dataStr) return false;
        const [ano, mes] = dataStr.split('-');
        return parseInt(ano) === 2012 && parseInt(mes) === 10;
    };

    const obterInformacaoInicioMineracao = (datasOriginais: string[]): { mostrar: boolean, indice: number } => {
        const indiceMineracao = datasOriginais.findIndex(d => verificarProximidadeInicioMineracao(d));

        if (indiceMineracao !== -1) {
            return { mostrar: true, indice: indiceMineracao };
        }

        if (datasOriginais.length < 2) return { mostrar: false, indice: -1 };

        const primeiraData = new Date(datasOriginais[0]);
        const ultimaData = new Date(datasOriginais[datasOriginais.length - 1]);

        if (primeiraData <= DATA_INICIO_MINERACAO && ultimaData >= DATA_INICIO_MINERACAO) {
            for (let i = 0; i < datasOriginais.length - 1; i++) {
                const dataAtual = new Date(datasOriginais[i]);
                const proximaData = new Date(datasOriginais[i + 1]);

                if (dataAtual <= DATA_INICIO_MINERACAO && proximaData >= DATA_INICIO_MINERACAO) {
                    return { mostrar: true, indice: i };
                }
            }
        }

        return { mostrar: false, indice: -1 };
    };

    const { listaGraficos, analisesAusentes } = useMemo(() => {
        if (!dados || !dados.amostras || dados.amostras.length === 0) return { listaGraficos: [], analisesAusentes: [] };

        let paramsLegislacao: Map<string, Array<{ nomeLegislacao: string, param: AnaliseLegislacao }>> = new Map();
        const coresLegislacao: { [key: string]: string } = {};
        const cores = ['#FF5252', '#9C27B0', '#009688', '#3F51B5', '#E91E63'];

        if (dados.legislacoes) {
            let indexCor = 0;
            Object.keys(dados.legislacoes).forEach(nomeLegislacao => {
                coresLegislacao[nomeLegislacao] = cores[indexCor % cores.length];
                indexCor++;

                const leg = dados.legislacoes![nomeLegislacao];
                leg.parametros_legislacao.forEach(p => {
                    const norm = normalizarSimbolo(p.simbolo);
                    if (!paramsLegislacao.has(norm)) {
                        paramsLegislacao.set(norm, []);
                    }
                    paramsLegislacao.get(norm)?.push({ nomeLegislacao: nomeLegislacao, param: p });
                });
            });
        }

        const amostrasOrdenadas = [...dados.amostras].sort((a, b) => {
            return new Date(a.informacoesAmostra.data).getTime() - new Date(b.informacoesAmostra.data).getTime();
        });

        const datasOriginais = amostrasOrdenadas.map(a => a.informacoesAmostra.data);
        const datasFormatadas = amostrasOrdenadas.map(a => formatarDataParaExibicao(a.informacoesAmostra.data));
        const infoMineracao = obterInformacaoInicioMineracao(datasOriginais);

        const simbolosAmostrasMap = new Map<string, { simbolo: string, nome_analise: string }>();

        amostrasOrdenadas.forEach((amostra) => {
            if (amostra.analises) {
                amostra.analises.forEach((analise) => {
                    const norm = normalizarSimbolo(analise.simbolo);
                    if (!simbolosAmostrasMap.has(norm)) {
                        simbolosAmostrasMap.set(norm, { simbolo: analise.simbolo, nome_analise: analise.nome_analise });
                    }
                });
            }
        });

        const lista: any[] = [];

        simbolosAmostrasMap.forEach((amostraInfo, simboloNormalizado) => {
            const listaParamsLeg = paramsLegislacao.get(simboloNormalizado) || [];

            const valoresDados = amostrasOrdenadas.map((amostra) => {
                const analiseEncontrada = amostra.analises?.find((a) => normalizarSimbolo(a.simbolo) === simboloNormalizado);
                return analiseEncontrada ? converterParaNumero(analiseEncontrada.resultado) : null;
            });

            const datasets = [
                {
                    label: amostraInfo.simbolo,
                    data: valoresDados,
                    fill: false,
                    borderColor: '#FFC107',
                    backgroundColor: '#FFC107',
                    tension: 0.3,
                    spanGaps: true
                }
            ];

            listaParamsLeg.forEach(({ nomeLegislacao, param }, index) => {
                const limites = analisarLimiteLegislacao(param.parametro);
                const corLimite = coresLegislacao[nomeLegislacao] || '#FF5252';
                const dashOffset = index * 5;

                if (limites.max !== undefined) {
                    datasets.push({
                        label: `Máx (${nomeLegislacao.substring(0, 15)}...)`,
                        data: new Array(datasFormatadas.length).fill(limites.max),
                        fill: false,
                        borderColor: corLimite,
                        backgroundColor: corLimite,
                        tension: 0,
                        pointRadius: 0,
                        borderDash: [5, 5],
                        borderDashOffset: dashOffset,
                        borderWidth: 2
                    } as any);
                }

                if (limites.min !== undefined) {
                    datasets.push({
                        label: `Mín (${nomeLegislacao.substring(0, 15)}...)`,
                        data: new Array(datasFormatadas.length).fill(limites.min),
                        fill: false,
                        borderColor: corLimite,
                        backgroundColor: corLimite,
                        tension: 0,
                        pointRadius: 0,
                        borderDash: [5, 5],
                        borderDashOffset: dashOffset,
                        borderWidth: 2
                    } as any);
                }
            });

            const primeiroParamLeg = listaParamsLeg.length > 0 ? listaParamsLeg[0].param : null;
            const titulo = primeiroParamLeg ? primeiroParamLeg.nome_analise : amostraInfo.nome_analise;

            const subtitulo = listaParamsLeg.length > 0
                ? listaParamsLeg.map(item => `${item.nomeLegislacao}: ${item.param.parametro}`).join(' | ')
                : 'Sem limite na legislação';

            const opcoesBase: any = {
                maintainAspectRatio: false,
                aspectRatio: 0.8,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            usePointStyle: false,
                            generateLabels: function (chart: any) {
                                const datasets = chart.data.datasets;
                                return datasets.map((dataset: any, i: number) => {
                                    const meta = chart.getDatasetMeta(i);
                                    return {
                                        text: dataset.label,
                                        fillStyle: dataset._isLinhaVertical ? 'transparent' : dataset.backgroundColor,
                                        strokeStyle: dataset.borderColor,
                                        lineWidth: dataset.borderWidth || 2,
                                        lineDash: dataset.borderDash || [],
                                        hidden: meta.hidden,
                                        datasetIndex: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#aaa' },
                        grid: { color: '#333', drawBorder: false }
                    },
                    y: {
                        ticks: { color: '#aaa' },
                        grid: { color: '#333', drawBorder: false }
                    }
                }
            };

            if (infoMineracao.mostrar) {
                datasets.push({
                    label: 'Início da Escavação',
                    data: new Array(datasFormatadas.length).fill(null),
                    borderColor: '#ff4444',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    showLine: false,
                    _indiceMineracao: infoMineracao.indice,
                    _isLinhaVertical: true
                } as any);
            }

            lista.push({
                titulo: titulo,
                subtitulo: subtitulo,
                temLegislacao: listaParamsLeg.length > 0,
                dadosGrafico: {
                    labels: datasFormatadas,
                    datasets: datasets
                },
                opcoes: opcoesBase
            });

            if (listaParamsLeg.length > 0) {
                paramsLegislacao.delete(simboloNormalizado);
            }
        });

        const listaAusentesGrouped: any[] = [];
        paramsLegislacao.forEach((listaParametros, chave) => {
            if (listaParametros.length > 0) {
                listaAusentesGrouped.push({
                    simbolo: listaParametros[0].param.simbolo,
                    nome_analise: listaParametros[0].param.nome_analise,
                    legislacoes: listaParametros.map(item => ({
                        nome: item.nomeLegislacao,
                        limite: item.param.parametro
                    }))
                });
            }
        });

        return { listaGraficos: lista, analisesAusentes: listaAusentesGrouped };
    }, [dados]);

    const nomesLegislacoes = useMemo(() => {
        if (!dados || !dados.legislacoes) return [];
        return Object.keys(dados.legislacoes);
    }, [dados]);

    return {
        listaGraficos,
        analisesAusentes,
        nomesLegislacoes
    };
};
