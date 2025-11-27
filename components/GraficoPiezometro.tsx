'use client';

import { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Chart } from "primereact/chart";

import { getPiezometrosAtivos, getPiezometroPorIdDataInicioDataFimApi } from "@/service/api";
import { formatarData } from "@/utils/formatarData";

export default function GraficoPiezometro() {

    const [piezometros, setPiezometros] = useState([]);
    const [idSelecionado, setIdSelecionado] = useState<number | null>(null);

    const [dataInicio, setDataInicio] = useState<Date | null>(null);
    const [dataFim, setDataFim] = useState<Date | null>(null);

    const [lineData, setLineData] = useState<any>(null);
    const [lineOptions, setLineOptions] = useState<any>({});

    useEffect(() => {
        async function carregarPiezometros() {
            try {
                const resposta = await getPiezometrosAtivos();
                setPiezometros(resposta.data);
            } catch (e) {
                console.error("Erro ao carregar piezômetros", e);
            }
        }
        carregarPiezometros();
    }, []);

    async function buscarGrafico() {
        if (!idSelecionado) {
            alert("Selecione um piezômetro.");
            return;
        }

        if (!dataInicio || !dataFim) {
            alert("Selecione as datas.");
            return;
        }

        const inicioFormatado = formatarData(dataInicio);
        const fimFormatado = formatarData(dataFim);

        try {
            const resposta = await getPiezometroPorIdDataInicioDataFimApi(
                idSelecionado,
                inicioFormatado,
                fimFormatado
            );

            const dados = [...resposta.data].reverse();

            const labels = dados.map((item: any) =>
                new Date(item.mes_ano).toLocaleDateString("pt-BR", {
                    month: "short",
                    year: "numeric"
                })
            );

            const precipitacao = dados.map((item: any) => item.precipitacao);
            const vazao = dados.map((item: any) => item.vazao_bombeamento);
            const nivelEstatico = dados.map((item: any) => item.nivel_estatico);
            const cotaSuperficie = dados.map((item: any) => item.cota_superficie);
            const cotaBase = dados.map((item: any) => item.cota_base);

            setLineData({
                labels,
                datasets: [
                    { label: "Precipitação", data: precipitacao, borderColor: '#2f4860', tension: 0.4, yAxisID: 'y1' },
                    { label: "Vazão Bombeamento", data: vazao, borderColor: '#00bb7e', tension: 0.4, yAxisID: 'y1' },
                    { label: "Nível Estático", data: nivelEstatico, borderColor: '#ff6384', tension: 0.4, yAxisID: 'y' },
                    { label: "Cota Superfície", data: cotaSuperficie, borderColor: '#ff9f40', tension: 0.4, yAxisID: 'y' },
                    { label: "Cota Base", data: cotaBase, borderColor: '#9966ff', tension: 0.4, yAxisID: 'y' },
                ]
            });

            setLineOptions({
                plugins: {
                    legend: { labels: { color: '#000' } }
                },
                scales: {
                    x: { ticks: { color: '#000' } },
                    y: { type: 'linear', position: 'left', ticks: { color: '#000' } },
                    y1: { type: 'linear', position: 'right', ticks: { color: '#000' }, grid: { drawOnChartArea: false } }
                }
            });

        } catch (err) {
            console.error("Erro ao carregar gráfico", err);
        }
    }

    return (
        <div className="card">
            <h5>Relatório Piezômetro</h5>

            {/* FILTROS */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>

                <select
                    value={idSelecionado ?? ""}
                    onChange={(e) => setIdSelecionado(Number(e.target.value))}
                >
                    <option value="">Selecione um piezômetro</option>
                    {piezometros.map((p: any) => (
                        <option key={p.cdPiezometro} value={p.cdPiezometro}>
                            {p.idPiezometro} - {p.nomePiezometro}
                        </option>
                    ))}
                </select>

                <Calendar
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.value)}
                    dateFormat="mm/yy"
                    view="month"
                    placeholder="Início"
                />

                <Calendar
                    value={dataFim}
                    onChange={(e) => setDataFim(e.value)}
                    dateFormat="mm/yy"
                    view="month"
                    placeholder="Fim"
                />

                <button onClick={buscarGrafico}>Buscar</button>
            </div>

            {/* GRÁFICO */}
            {lineData ? (
                <Chart type="line" data={lineData} options={lineOptions} />
            ) : (
                <p>Nenhum gráfico carregado ainda.</p>
            )}
        </div>
    );
}
