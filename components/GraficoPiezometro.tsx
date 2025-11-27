'use client';

import { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";

import Swal from "sweetalert2";

import { getPiezometrosAtivos, getPiezometroPorIdDataInicioDataFimApi } from "@/service/api";
import { formatarData } from "@/utils/formatarData";

export default function GraficoPiezometro() {

    const [piezometros, setPiezometros] = useState([]);
    const [idSelecionado, setIdSelecionado] = useState<number | null>(null);

    const [tiposSelecionados, setTiposSelecionados] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const [dataInicio, setDataInicio] = useState<Date | null>(null);
    const [dataFim, setDataFim] = useState<Date | null>(null);

    const [lineData, setLineData] = useState<any>(null);
    const [lineOptions, setLineOptions] = useState<any>({});

    const tiposPiezometros = [
        { label: "PB - Piezômetro de Bacia", value: "PB" },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" }
    ];

    const carregarPiezometrosFiltrados = async (tiposFiltro = []) => {
        setCarregando(true);
        try {
            const resposta = await getPiezometrosAtivos(tiposFiltro);
            const piezometrosFormatados = resposta.data.map((p: any) => ({
                label: `${p.idPiezometro} - ${p.nomePiezometro} (${p.tipoPiezometro})`,
                value: p.cdPiezometro,
                tipo: p.tipoPiezometro
            }));
            
            setPiezometros(piezometrosFormatados);
            
            if (idSelecionado && !piezometrosFormatados.find((p: any) => p.value === idSelecionado)) {
                setIdSelecionado(null);
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
    };

    useEffect(() => {
        carregarPiezometrosFiltrados();
    }, []);

    useEffect(() => {
        carregarPiezometrosFiltrados(tiposSelecionados);
    }, [tiposSelecionados]);

    async function buscarGrafico() {
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

            setLineData({
                labels,
                datasets: [
                    { label: "Precipitação", data: dados.map((i: any) => i.precipitacao), borderColor: '#2f4860', tension: 0.4, yAxisID: 'y1' },
                    { label: "Vazão Bombeamento", data: dados.map((i: any) => i.vazao_bombeamento), borderColor: '#00bb7e', tension: 0.4, yAxisID: 'y1' },
                    { label: "Nível Estático", data: dados.map((i: any) => i.nivel_estatico), borderColor: '#ff6384', tension: 0.4, yAxisID: 'y' },

                    {
                        label: "Cota Superfície",
                        data: dados.map((i: any) => i.cota_superficie),
                        borderColor: '#ff9f40',
                        tension: 0.4,
                        yAxisID: 'y',
                        borderDash: [5, 5], 
                        pointRadius: 0
                    },
                    {
                        label: "Cota Base",
                        data: dados.map((i: any) => i.cota_base),
                        borderColor: '#9966ff',
                        tension: 0.4,
                        yAxisID: 'y',
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            });

            setLineOptions({
                plugins: {
                    legend: { labels: { color: '#000' } }
                },
                scales: {
                    x: { ticks: { color: '#000' } },
                    y: { type: "linear", position: "left", ticks: { color: "#000" } },
                    y1: { type: "linear", position: "right", ticks: { color: "#000" }, grid: { drawOnChartArea: false } }
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

            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
                <MultiSelect
                    value={tiposSelecionados}
                    options={tiposPiezometros}
                    onChange={(e) => setTiposSelecionados(e.value)}
                    placeholder="Filtrar por tipo"
                    display="chip"
                    style={{ width: "300px" }}
                    filter
                    filterPlaceholder="Buscar tipo..."
                    maxSelectedLabels={3}
                />

                <Dropdown
                    value={idSelecionado}
                    options={piezometros}
                    onChange={(e) => setIdSelecionado(e.value)}
                    placeholder={carregando ? "Carregando..." : "Selecione um piezômetro"}
                    style={{ width: "300px" }}
                    filter
                    filterPlaceholder="Buscar..."
                    filterBy="label"
                    showClear
                    disabled={carregando}
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
                    disabled={carregando}
                />
            </div>

            {lineData ? (
                <Chart type="line" data={lineData} options={lineOptions} />
            ) : (
                <p>Nenhum gráfico carregado ainda.</p>
            )}
        </div>
    );
}