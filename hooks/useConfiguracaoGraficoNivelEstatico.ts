'use client';

import { useMemo } from 'react';
import { getDatasetInicioMineracao } from "@/utils/anotacaoInicioMineracao";

export interface DatasetGrafico {
    label: string;
    data: (number | null)[];
    borderColor: string;
    tension: number;
    yAxisID: string;
    borderDash?: number[];
    pointRadius?: number;
    order?: number;
    borderWidth?: number;
}

/**
 * Hook especializado em gerar a configuração visual do gráfico de Nível Estático (Chart.js).
 * 
 * Responsável por:
 * 1. Definir cores e estilos para cada tipo de piezômetro (PP, PR, PC, PV).
 * 2. Montar os Datasets com Nível Estático, Cotas, Vazão e Precipitação.
 * 3. Configurar os eixos (Y para Nível/Cota e Y1 para Vazão/Chuva).
 * 4. Adicionar anotações especiais (ex: Linha de Início da Mineração).
 */
export const useConfiguracaoGraficoNivelEstatico = (
    dados: any[],
    tipoPiezometro: string | null,
    porDia: boolean,
    dataInicio: Date | null,
    dataFim: Date | null
) => {

    const configuracao = useMemo(() => {
        if (!dados || dados.length === 0) return { dadosGrafico: null, opcoesGrafico: {} };

        // 1. Gerar os Labels do Eixo X
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

        // 2. Definir Datasets baseado no tipo do Piezômetro
        let datasets: DatasetGrafico[] = [];
        const ehPCouPV = tipoPiezometro === 'PC' || tipoPiezometro === 'PV';

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
                    label: "Vazão Bombeada Mina",
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
                    label: "Vazão Bombeada Mina",
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
            const vazaoCalhaData = dados.map((i: any) => i.vazao_calha);
            const vazaoBombeamentoData = dados.map((i: any) => i.vazao_bombeamento);
            const precipitacaoData = dados.map((i: any) => i.precipitacao);

            datasets = [
                {
                    label: "Vazão",
                    data: vazaoCalhaData,
                    borderColor: '#ff6384',
                    borderWidth: 3,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: "Vazão Bombeada Mina",
                    data: vazaoBombeamentoData,
                    borderColor: '#00bb7e',
                    borderWidth: 1,
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: "Precipitação",
                    data: precipitacaoData,
                    borderColor: '#2f4860',
                    borderWidth: 1,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ];
        }

        // 3. Adicionar Linha Histórica (Início da Mineração) se aplicável
        const datasetMineracao = getDatasetInicioMineracao(labels, dataInicio, dataFim);
        if (datasetMineracao) {
            datasets.push(datasetMineracao as any);
        }

        // 4. Configurar Opções de Escala e Eixos
        const configuracaoEixoY: any = {
            type: "linear",
            display: true,
            position: "left",
            ticks: { color: "#ccc" },
            grid: { color: '#444' },
            title: {
                display: true,
                text: ehPCouPV ? 'Vazão (m³/h)' : 'Nível/Cota (m)',
                color: '#ccc'
            }
        };

        if (ehPCouPV) {
            configuracaoEixoY.beginAtZero = true;
            configuracaoEixoY.suggestedMin = 0;
            configuracaoEixoY.min = 0;
        }

        const opcoesGrafico = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: { labels: { color: '#ccc' } }
            },
            scales: {
                x: {
                    ticks: { color: '#ccc' },
                    grid: { color: '#444' }
                },
                y: configuracaoEixoY,
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    ticks: { color: "#ccc" },
                    grid: { drawOnChartArea: false },
                    title: {
                        display: true,
                        text: ehPCouPV ? 'Vazão Bombeada Mina (m³/h) / Precipitação (mm)' : 'Precipitação (mm) / Vazão Bombeada Mina (m³/h)',
                        color: '#ccc'
                    }
                }
            }
        };

        return {
            dadosGrafico: { labels, datasets },
            opcoesGrafico: opcoesGrafico
        };

    }, [dados, tipoPiezometro, porDia, dataInicio, dataFim]);

    return configuracao;
};
