import React, { useMemo } from 'react';
import { Chart } from 'primereact/chart';

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
}

export default function GraficosAnalise({ dados }: PropriedadesGrafico) {

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
        // Remover unidades comuns para facilitar o parse
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

        return {};
    };

    const formatarData = (dataStr: string) => {
        if (!dataStr) return '';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const { charts, missingAnalyses } = useMemo(() => {
        if (!dados || !dados.amostras || dados.amostras.length === 0) return { charts: [], missingAnalyses: [] };

        // 1. Processar Legislação (Indexado pelo símbolo normalizado)
        let paramsLegislacao: Map<string, AnaliseLegislacao> = new Map();
        if (dados.legislacoes) {
            // Pega a primeira legislação disponível
            const keys = Object.keys(dados.legislacoes);
            if (keys.length > 0) {
                const leg = dados.legislacoes[keys[0]];
                leg.parametros_legislacao.forEach(p => {
                    paramsLegislacao.set(normalizeSymbol(p.simbolo), p);
                });
            }
        }

        // 2. Ordenar Amostras
        const amostrasOrdenadas = [...dados.amostras].sort((a: any, b: any) => {
            return new Date(a.informacoesAmostra.data).getTime() - new Date(b.informacoesAmostra.data).getTime();
        });
        const datas = amostrasOrdenadas.map((a: any) => formatarData(a.informacoesAmostra.data));

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
        const listaFaltantes: AnaliseLegislacao[] = [];

        // 4. Cruzar dados
        simbolosAmostrasMap.forEach((amostraInfo, normalizedSymbol) => {
            const legParam = paramsLegislacao.get(normalizedSymbol);

            // Dados da amostra (buscando pelo símbolo normalizado)
            const dataValues = amostrasOrdenadas.map((amostra: any) => {
                const analiseEncontrada = amostra.analises?.find((a: any) => normalizeSymbol(a.simbolo) === normalizedSymbol);
                return analiseEncontrada ? parseValor(analiseEncontrada.resultado) : null;
            });

            // Limites da legislação
            const limits = legParam ? parseLegislativeLimit(legParam.parametro) : {};

            const datasets = [
                {
                    label: legParam ? legParam.simbolo : amostraInfo.simbolo, // Prefere o símbolo da legislação se houver
                    data: dataValues,
                    fill: false,
                    borderColor: '#FFC107',
                    backgroundColor: '#FFC107',
                    tension: 0.3,
                    spanGaps: true
                }
            ];

            if (limits.max !== undefined) {
                datasets.push({
                    label: `Máximo (${legParam?.nome_analise || 'Legislação'})`, // Hack para legenda
                    data: new Array(datas.length).fill(limits.max),
                    fill: false,
                    borderColor: '#FF5252', // Vermelho para limite
                    backgroundColor: '#FF5252',
                    tension: 0,
                    pointRadius: 0, // Linha reta sem pontos
                    borderDash: [5, 5], // Tracejado
                    borderWidth: 2
                } as any);
            }

            if (limits.min !== undefined) {
                datasets.push({
                    label: `Mínimo (${legParam?.nome_analise || 'Legislação'})`,
                    data: new Array(datas.length).fill(limits.min),
                    fill: false,
                    borderColor: '#FF5252',
                    backgroundColor: '#FF5252',
                    tension: 0,
                    pointRadius: 0,
                    borderDash: [5, 5],
                    borderWidth: 2
                } as any);
            }

            // Título do gráfico
            const titulo = legParam ? legParam.nome_analise : amostraInfo.nome_analise;
            const subtitle = legParam ? `Parâmetro: ${legParam.parametro}` : 'Sem limite na legislação';

            listaGraficos.push({
                titulo: titulo,
                subtitle: subtitle,
                hasLegislation: !!legParam,
                chartData: {
                    labels: datas,
                    datasets: datasets
                },
                options: {
                    maintainAspectRatio: false,
                    aspectRatio: 0.8,
                    plugins: {
                        legend: {
                            display: true, // Mostrar legenda para ver o que é linha de limite
                            labels: {
                                filter: function (item: any, chart: any) {
                                    // Hack para nao poluir a legenda se não quiser
                                    return true;
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
                }
            });

            // Remove do mapa de legislação para sabermos o que sobrou
            if (legParam) {
                paramsLegislacao.delete(normalizedSymbol);
            }
        });

        // B. O que sobrou na legislação e não está nas amostras
        paramsLegislacao.forEach((value, key) => {
            listaFaltantes.push(value);
        });

        return { charts: listaGraficos, missingAnalyses: listaFaltantes };

    }, [dados]);

    // Extrair nomes das legislações para exibição
    const legislacaoNomes = useMemo(() => {
        if (!dados || !dados.legislacoes) return [];
        return Object.keys(dados.legislacoes);
    }, [dados]);

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
                        {missingAnalyses.map((item, i) => (
                            <span key={i} className="inline-flex align-items-center px-3 py-1 border-round bg-orange-100 text-orange-800 text-sm font-semibold border-1 border-orange-200">
                                {item.nome_analise} ({item.simbolo})
                                <span className="ml-2 text-xs opacity-70 border-left-1 border-orange-300 pl-2 ">{item.parametro}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div id="analises-scrap" className="grid">
                {charts.map((grafico, index) => (
                    <div key={index} className="col-12 md:col-6 lg:col-6">
                        <div className="chart-container h-full surface-card p-3 shadow-2 border-round">
                            <div className="chart-header flex justify-content-between align-items-start mb-3">
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
                ))}
                {charts.length === 0 && (
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
