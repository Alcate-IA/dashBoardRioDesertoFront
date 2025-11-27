'use client';

import { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";

import Swal from "sweetalert2";


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
                setPiezometros(
                    resposta.data.map((p: any) => ({
                        label: `${p.idPiezometro} - ${p.nomePiezometro}`,
                        value: p.cdPiezometro
                    }))
                );
            } catch (e) {
                console.error("Erro ao carregar piezômetros", e);
            }
        }
        carregarPiezometros();
    }, []);

async function buscarGrafico() {
    if (!idSelecionado) {
        Swal.fire({
            icon: "warning",
            title: "Selecione um piezômetro",
        });
        return;
    }

    if (!dataInicio || !dataFim) {
        Swal.fire({
            icon: "warning",
            title: "Selecione as datas",
        });
        return;
    }

    // 🔥 Validação das datas
    if (dataInicio > dataFim) {
        Swal.fire({
            icon: "error",
            title: "Datas inválidas",
            text: "A data inicial não pode ser maior que a data final.",
            confirmButtonColor: "#3085d6"
        });
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

        let dados = [...resposta.data].sort((a: any, b: any) => {
            return new Date(a.mes_ano).getTime() - new Date(b.mes_ano).getTime();
        });

        const labels = dados.map((item: any) => {
            const [ano, mes] = item.mes_ano.split("-");
            return new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric"
            });
        });

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
                { label: "Cota Base", data: cotaBase, borderColor: '#9966ff', tension: 0.4, yAxisID: 'y' }
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
        Swal.fire({
            icon: "error",
            title: "Erro ao carregar gráfico",
            text: "Não foi possível obter os dados do relatório."
        });
        console.error("Erro ao carregar gráfico", err);
    }
}

    return (
        <div className="card">
            <h5>Relatório Piezômetro</h5>

            {/* FILTROS */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>

                <Dropdown
                    value={idSelecionado}
                    options={piezometros}
                    onChange={(e) => setIdSelecionado(e.value)}
                    placeholder="Selecione um piezômetro"
                    style={{ width: "250px" }}
                />

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

                <Button 
                    label="Buscar" 
                    icon="pi pi-search" 
                    onClick={buscarGrafico}
                    severity="info"
                    rounded
                />
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