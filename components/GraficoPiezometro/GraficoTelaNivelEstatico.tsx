"use client";

import React, { forwardRef, useState } from "react";
import { Chart } from "primereact/chart";

interface PropriedadesGrafico {
    dadosGrafico: any;
    opcoesGrafico: any;
    tipoPiezometro: string | null;
    tabelaDados: any[];
    /** Quando informada, substitui a mensagem padrão do estado vazio (ex.: após aplicar e API retornar vazio). */
    mensagemEstadoVazio?: string;
}

/**
 * Componente responsável por renderizar o gráfico principal e sua legenda customizada.
 * 
 */

const GraficoTelaNivelEstatico = forwardRef<Chart, PropriedadesGrafico>(
    ({ dadosGrafico, opcoesGrafico, tipoPiezometro, tabelaDados, mensagemEstadoVazio }, ref) => {
        const [atualizacaoLegenda, setAtualizacaoLegenda] = useState(0);

        const aoClicarNaLegenda = (indiceDataset: number) => {
            // @ts-ignore - Acessando a instância do chart via ref
            const instanciaChart = (ref as React.MutableRefObject<Chart>)?.current?.getChart();
            if (!instanciaChart) return;

            const meta = instanciaChart.getDatasetMeta(indiceDataset);
            meta.hidden = meta.hidden === null ? true : !meta.hidden;

            instanciaChart.update();
            setAtualizacaoLegenda((prev) => prev + 1);
        };

        const renderizarLegenda = () => {
            if (!dadosGrafico) return null;

            // @ts-ignore
            const instanciaChart = (ref as React.MutableRefObject<Chart>)?.current?.getChart();

            return (
                <div className="chart-legend">
                    {dadosGrafico.datasets.map((dataset: any, indice: number) => {
                        const rotulo =
                            dataset.label === "Cota Superfície" && tipoPiezometro === "PR"
                                ? "Cota"
                                : dataset.label;

                        const eTracejada = dataset.borderDash && dataset.borderDash.length > 0;
                        const estaOculto = instanciaChart
                            ? instanciaChart.getDatasetMeta(indice).hidden
                            : false;

                        return (
                            <div
                                key={dataset.label}
                                className="legend-item"
                                onClick={() => aoClicarNaLegenda(indice)}
                                style={{
                                    cursor: "pointer",
                                    opacity: estaOculto ? 0.5 : 1,
                                    textDecoration: estaOculto ? "line-through" : "none",
                                }}
                            >
                                {eTracejada ? (
                                    <div
                                        className="legend-line-dashed"
                                        style={{
                                            width: "20px",
                                            height: "2px",
                                            background: `repeating-linear-gradient(90deg, ${dataset.borderColor} 0px, ${dataset.borderColor} 4px, transparent 4px, transparent 8px)`,
                                            marginRight: "6px",
                                        }}
                                    ></div>
                                ) : (
                                    <div
                                        className="legend-color"
                                        style={{ backgroundColor: dataset.borderColor }}
                                    ></div>
                                )}
                                {rotulo}
                            </div>
                        );
                    })}
                </div>
            );
        };

        return (
            <div className="chart-container avoid-break">
                <div className="chart-header">
                    <div className="chart-title">
                        {tabelaDados.length > 0 && tipoPiezometro
                            ? `Dados do ${tipoPiezometro === "PP" || tipoPiezometro === "PR" || tipoPiezometro === "PB"
                                ? "Piezômetro"
                                : "Recurso Hídrico"
                            }`
                            : "Níveis Piezométricos e Dados Ambientais"}
                    </div>
                    {renderizarLegenda()}
                </div>

                {dadosGrafico ? (
                    <Chart
                        ref={ref}
                        type="line"
                        data={dadosGrafico}
                        options={opcoesGrafico}
                        height="400px"
                    />
                ) : (
                    <div
                        className="flex align-items-center justify-content-center"
                        style={{ height: "400px", color: "#666" }}
                    >
                        {mensagemEstadoVazio ?? "Selecione os filtros e clique em Aplicar para visualizar os dados"}
                    </div>
                )}
            </div>
        );
    }
);

GraficoTelaNivelEstatico.displayName = "GraficoTelaNivelEstatico";

export default GraficoTelaNivelEstatico;
