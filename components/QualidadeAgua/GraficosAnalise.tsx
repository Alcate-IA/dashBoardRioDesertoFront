import React, { useMemo } from 'react';
import { Chart } from 'primereact/chart';
import { Carousel } from 'primereact/carousel';
import { DATA_INICIO_MINERACAO } from '@/utils/anotacaoInicioMineracao';

interface AnaliseLegislacao {
    simbolo: string;
    nome_analise: string;
    parametro: string;
}

interface PropriedadesGrafico {
    dados: {
        amostras: any[];
        legislacoes?: {
            [key: string]: {
                parametros_legislacao: AnaliseLegislacao[];
            };
        };
    };
    isReport?: boolean;
}

export default function GraficosAnalise({ dados, isReport = false }: PropriedadesGrafico) {

    // Função para parser de valores numéricos
    const parseValor = (valorStr: string) => {
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

    // Helper para normalizar símbolos (ex: "pH." -> "ph", "pH" -> "ph")
    const normalizeSymbol = (s: string) => {
        if (!s) return '';
        return s.trim().toLowerCase().replace(/\.$/, '');
    };

    // Função para parsear os limites da legislação
    const parseLegislativeLimit = (parametro: string): { min?: number, max?: number } => {
        if (!parametro) return {};

        let p = parametro.toLowerCase().trim();

        //REMOVENDO A UNIDADE PARA FACILITAR TALVEZ MUDAR ESSA ABORDAGEM PARA MOSTRAR O VALOR A UNIDADE JUNTO
        p = p.replace('mg/l', '').replace('ausentes em 100 ml', '0').trim();

        const extractNumber = (str: string) => {
            const match = str.match(/[\d]+([.,][\d]+)?/);
            if (match) {
                return parseFloat(match[0].replace(',', '.'));
            }
            return null;
        };

        // Casos com "até", "máx", "inferior a" -> MAX
        if (p.startsWith('máx') || p.startsWith('até') || p.startsWith('inferior a')) {
            const val = extractNumber(p);
            if (val !== null) return { max: val };
        }

        // Casos com "mín", "remoção mínima" -> MIN
        if (p.startsWith('mín') || p.includes('mínima')) {
            const val = extractNumber(p);
            if (val !== null) return { min: val };
        }

        // Casos com "entre X e Y" ou "X a Y" -> MIN e MAX
        if (p.includes('entre') || p.match(/^\d+([.,]\d+)?\s+a\s+\d+([.,]\d+)?/)) {
            // Tenta pegar dois números
            const nums = p.match(/[\d]+([.,][\d]+)?/g);
            if (nums && nums.length >= 2) {
                const v1 = parseFloat(nums[0].replace(',', '.'));
                const v2 = parseFloat(nums[1].replace(',', '.'));
                return { min: Math.min(v1, v2), max: Math.max(v1, v2) };
            }
        }

        const val = extractNumber(p);
        if (val !== null) {
            return { max: val };
        }

        return {};
    };

    const formatarData = (dataStr: string) => {
        if (!dataStr) return '';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    // Função para verificar se a data está próxima de outubro de 2012
    const verificarDataProximaInicioMineracao = (dataStr: string): boolean => {
        if (!dataStr) return false;
        const [ano, mes] = dataStr.split('-');
        return parseInt(ano) === 2012 && parseInt(mes) === 10;
    };

    // Função para obter informações sobre a linha de início da mineração
    const obterInfoInicioMineracao = (datasOriginais: string[]): { mostrar: boolean, indice: number } => {
        // Verifica se alguma data está em outubro de 2012
        const indiceMineracao = datasOriginais.findIndex(d => verificarDataProximaInicioMineracao(d));

        if (indiceMineracao !== -1) {
            return { mostrar: true, indice: indiceMineracao };
        }

        // Se não encontrou data exata, verifica se o intervalo inclui outubro de 2012
        if (datasOriginais.length < 2) return { mostrar: false, indice: -1 };

        const primeiraData = new Date(datasOriginais[0]);
        const ultimaData = new Date(datasOriginais[datasOriginais.length - 1]);

        if (primeiraData <= DATA_INICIO_MINERACAO && ultimaData >= DATA_INICIO_MINERACAO) {
            // Encontra a posição aproximada
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

    const { charts, missingAnalyses } = useMemo(() => {
        if (!dados || !dados.amostras || dados.amostras.length === 0) return { charts: [], missingAnalyses: [] };

        // 1. Processar Legislações (Indexado pelo símbolo normalizado)
        // Agora armazenamos uma lista de { legislationName, param } para cada símbolo
        let paramsLegislacao: Map<string, Array<{ legislationName: string, param: AnaliseLegislacao }>> = new Map();

        // Prepara cores distintas para legislações
        const legislationColors: { [key: string]: string } = {};
        const colors = ['#FF5252', '#9C27B0', '#009688', '#3F51B5', '#E91E63'];

        if (dados.legislacoes) {
            let colorIdx = 0;
            Object.keys(dados.legislacoes).forEach(nomeLegislacao => {
                legislationColors[nomeLegislacao] = colors[colorIdx % colors.length];
                colorIdx++;

                const leg = dados.legislacoes![nomeLegislacao];
                leg.parametros_legislacao.forEach(p => {
                    const norm = normalizeSymbol(p.simbolo);
                    if (!paramsLegislacao.has(norm)) {
                        paramsLegislacao.set(norm, []);
                    }
                    paramsLegislacao.get(norm)?.push({ legislationName: nomeLegislacao, param: p });
                });
            });
        }

        // 2. Ordenar Amostras
        const amostrasOrdenadas = [...dados.amostras].sort((a: any, b: any) => {
            return new Date(a.informacoesAmostra.data).getTime() - new Date(b.informacoesAmostra.data).getTime();
        });
        const datasOriginais = amostrasOrdenadas.map((a: any) => a.informacoesAmostra.data);
        const datas = amostrasOrdenadas.map((a: any) => formatarData(a.informacoesAmostra.data));

        // Obter informações sobre início da mineração
        const infoMineracao = obterInfoInicioMineracao(datasOriginais);

        // 3. Identificar todos os símbolos e nomes de análise únicos presentes nas amostras
        const simbolosAmostrasMap = new Map<string, { simbolo: string, nome_analise: string }>();

        amostrasOrdenadas.forEach((amostra: any) => {
            if (amostra.analises) {
                amostra.analises.forEach((analise: any) => {
                    const norm = normalizeSymbol(analise.simbolo);
                    if (!simbolosAmostrasMap.has(norm)) {
                        simbolosAmostrasMap.set(norm, { simbolo: analise.simbolo, nome_analise: analise.nome_analise });
                    }
                });
            }
        });

        const listaGraficos: any[] = [];


        // 4. Cruzar dados
        simbolosAmostrasMap.forEach((amostraInfo, normalizedSymbol) => {
            const legParamsList = paramsLegislacao.get(normalizedSymbol) || [];

            // Dados da amostra (buscando pelo símbolo normalizado)
            const dataValues = amostrasOrdenadas.map((amostra: any) => {
                const analiseEncontrada = amostra.analises?.find((a: any) => normalizeSymbol(a.simbolo) === normalizedSymbol);
                return analiseEncontrada ? parseValor(analiseEncontrada.resultado) : null;
            });

            // Dataset principal com os dados da amostra
            const datasets = [
                {
                    label: amostraInfo.simbolo,
                    data: dataValues,
                    fill: false,
                    borderColor: '#FFC107',
                    backgroundColor: '#FFC107',
                    tension: 0.3,
                    spanGaps: true
                }
            ];

            // Adicionar limites para CADA legislação que tenha esse parâmetro
            legParamsList.forEach(({ legislationName, param }, index) => {
                const limits = parseLegislativeLimit(param.parametro);

                // Usar cor específica da legislação
                const limitColor = legislationColors[legislationName] || '#FF5252';

                // Offset do tracejado para evitar sobreposição exata quando os valores são iguais
                // Se o dash é [5, 5], um offset de 5 inverte o padrão (espaço onde era linha)
                const dashOffset = index * 5;

                if (limits.max !== undefined) {
                    datasets.push({
                        label: `Máx (${legislationName.substring(0, 15)}...)`, // Encurtar nome se muito longo
                        data: new Array(datas.length).fill(limits.max),
                        fill: false,
                        borderColor: limitColor,
                        backgroundColor: limitColor,
                        tension: 0,
                        pointRadius: 0,
                        borderDash: [5, 5],
                        borderDashOffset: dashOffset,
                        borderWidth: 2
                    } as any);
                }

                if (limits.min !== undefined) {
                    datasets.push({
                        label: `Mín (${legislationName.substring(0, 15)}...)`,
                        data: new Array(datas.length).fill(limits.min),
                        fill: false,
                        borderColor: limitColor,
                        backgroundColor: limitColor,
                        tension: 0,
                        pointRadius: 0,
                        borderDash: [5, 5],
                        borderDashOffset: dashOffset,
                        borderWidth: 2
                    } as any);
                }
            });

            // Título do gráfico: usa o nome da análise da amostra ou da primeira legislação encontrada
            const primeiroLegParam = legParamsList.length > 0 ? legParamsList[0].param : null;
            const titulo = primeiroLegParam ? primeiroLegParam.nome_analise : amostraInfo.nome_analise;

            // Subtítulo: lista os parâmetros de todas as legislações aplicáveis
            const subtitle = legParamsList.length > 0
                ? legParamsList.map(item => `${item.legislationName}: ${item.param.parametro}`).join(' | ')
                : 'Sem limite na legislação';

            const optionsBase: any = {
                maintainAspectRatio: false,
                aspectRatio: 0.8,
                plugins: {
                    legend: {
                        display: true,
                        onClick: (evt: any, legendItem: any, legend: any) => {
                            const chart = legend.chart;
                            const datasetIndex = legendItem.datasetIndex;
                            const meta = chart.getDatasetMeta(datasetIndex);
                            meta.hidden = meta.hidden === null ? true : !meta.hidden;
                            chart.update();
                        },
                        labels: {
                            filter: function (item: any, chart: any) {
                                return true;
                            },
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

            // Adicionar dataset de início da mineração se aplicável
            if (infoMineracao.mostrar) {
                datasets.push({
                    label: 'Início da Escavação',
                    data: new Array(datas.length).fill(null),
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

            listaGraficos.push({
                titulo: titulo,
                subtitle: subtitle,
                hasLegislation: legParamsList.length > 0,
                chartData: {
                    labels: datas,
                    datasets: datasets
                },
                options: optionsBase
            });

            // Remover do mapa de legislação os que foram encontrados nas amostras
            if (legParamsList.length > 0) {
                paramsLegislacao.delete(normalizedSymbol);
            }
        });

        // B. O que sobrou na legislação e não está nas amostras
        const listaFaltantesGrouped: any[] = [];
        paramsLegislacao.forEach((list, key) => {
            if (list.length > 0) {
                listaFaltantesGrouped.push({
                    simbolo: list[0].param.simbolo,
                    nome_analise: list[0].param.nome_analise,
                    legislacoes: list.map(item => ({
                        name: item.legislationName,
                        limit: item.param.parametro
                    }))
                });
            }
        });

        return { charts: listaGraficos, missingAnalyses: listaFaltantesGrouped };

    }, [dados]);

    // Extrair nomes das legislações para exibição
    const legislacaoNomes = useMemo(() => {
        if (!dados || !dados.legislacoes) return [];
        return Object.keys(dados.legislacoes);
    }, [dados]);

    const responsiveOptions = [
        {
            breakpoint: '1400px',
            numVisible: 2,
            numScroll: 1
        },
        {
            breakpoint: '1199px',
            numVisible: 2,
            numScroll: 1
        },
        {
            breakpoint: '767px',
            numVisible: 1,
            numScroll: 1
        }
    ];

    const chartTemplate = (grafico: any) => {
        return (
            <div className="p-2 h-full w-full">
                <div className="chart-container h-full surface-card p-3 shadow-2 border-round relative">
                    <div className="chart-header flex justify-content-between align-items-start mb-3" style={{ minHeight: '60px' }}>
                        <div>
                            <div className="text-xl font-bold text-900">{grafico.titulo}</div>
                            <div className={`text-sm ${grafico.hasLegislation ? 'text-600' : 'text-orange-500'}`}>
                                {grafico.hasLegislation && <i className="pi pi-check-circle text-green-500 mr-1 text-xs"></i>}
                                {!grafico.hasLegislation && <i className="pi pi-info-circle mr-1 text-xs"></i>}
                                {grafico.subtitle}
                            </div>
                        </div>
                    </div>
                    <Chart type="line" data={grafico.chartData} options={grafico.options} height="300px" />
                </div>
            </div>
        );
    };

    if (!dados || !dados.amostras) return null;

    return (
        <div className="flex flex-column gap-4">
            {/* Seção de Informações da Legislação */}
            {legislacaoNomes.length > 0 && (
                <div className="surface-card p-4 shadow-2 border-round border-left-3 border-blue-500 bg-blue-50">
                    <div className="text-blue-900 font-medium text-xl mb-2">
                        <i className="pi pi-book mr-2"></i>
                        Legislações Aplicadas
                    </div>
                    <ul className="m-0 pl-4 text-blue-700">
                        {legislacaoNomes.map((nome, i) => (
                            <li key={i} className="mb-1">{nome}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Seção de Análises Faltantes */}
            {missingAnalyses.length > 0 && (
                <div className="surface-card p-4 shadow-2 border-round border-left-3 border-orange-500 bg-orange-50">
                    <div className="text-orange-900 font-medium text-xl mb-2">
                        <i className="pi pi-exclamation-triangle mr-2"></i>
                        Análises da Legislação Ausentes na Coleta
                    </div>
                    <p className="text-orange-700 mb-3">Os seguintes parâmetros são exigidos pela legislação mas não foram encontrados nas amostras:</p>
                    <div className="flex flex-wrap gap-2">
                        {missingAnalyses.map((item: any, i: number) => (
                            <span key={i} className="inline-flex align-items-center px-3 py-1 border-round bg-orange-100 text-orange-800 text-sm font-semibold border-1 border-orange-200">
                                {item.nome_analise} ({item.simbolo})
                                <span className="ml-2 text-xs opacity-70 border-left-1 border-orange-300 pl-2 ">
                                    {item.legislacoes.map((leg: any) => `${leg.name}: ${leg.limit}`).join(' | ')}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div id="analises-scrap">
                {charts.length > 0 ? (
                    isReport ? (
                        <div className="grid">
                            {charts.map((grafico, index) => (
                                <div key={index} className="col-12 mb-4">
                                    {chartTemplate(grafico)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Carousel
                            value={charts}
                            numVisible={3}
                            numScroll={1}
                            responsiveOptions={responsiveOptions}
                            itemTemplate={chartTemplate}
                            circular
                            autoplayInterval={5000}
                        />
                    )
                ) : (
                    <div className="col-12">
                        <div className="chart-container surface-card p-4 shadow-2 border-round">
                            <p className="text-center text-600">Nenhum dado analítico encontrado para exibir gráficos.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
