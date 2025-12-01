'use client';

import { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

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
    const [summary, setSummary] = useState({
        nivelEstatico: 0,
        precipitacao: 0,
        vazao: 0,
        total: 0
    });
    const [tabelaDados, setTabelaDados] = useState<any[]>([]);

    const tiposPiezometros = [
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" }
    ];

    const carregarPiezometrosFiltrados = async (tiposFiltro = []) => {
        setCarregando(true);
        try {
            const resposta = await getPiezometrosAtivos(tiposFiltro);
            
            // Filtrar piezômetros: excluir os do tipo "PB"
            const piezometrosFiltrados = resposta.data.filter((p: any) => p.tipoPiezometro !== "PB");
            
            const piezometrosFormatados = piezometrosFiltrados.map((p: any) => ({
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

            // Calculate Summary
            const total = dados.length;
            const avgNivel = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.nivel_estatico || 0), 0) / total : 0;
            const avgPrecip = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.precipitacao || 0), 0) / total : 0;
            const avgVazao = total > 0 ? dados.reduce((acc: number, curr: any) => acc + (curr.vazao_bombeamento || 0), 0) / total : 0;

            setSummary({
                nivelEstatico: parseFloat(avgNivel.toFixed(1)),
                precipitacao: parseFloat(avgPrecip.toFixed(1)),
                vazao: parseFloat(avgVazao.toFixed(1)),
                total: total
            });
            setTabelaDados(dados);

            setLineOptions({
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
                    y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        ticks: {
                            color: "#ccc"
                        },
                        grid: {
                            color: '#444'
                        }
                    },
                    y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        ticks: {
                            color: "#ccc"
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
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
        <div className="col-12">
            <div className="card filter-bar">
                <div className="filter-item">
                    <span className="filter-label">Visualização</span>
                    <MultiSelect
                        value={tiposSelecionados}
                        options={tiposPiezometros}
                        onChange={(e) => setTiposSelecionados(e.value)}
                        placeholder="Tipos"
                        display="chip"
                        className="w-full md:w-15rem"
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Piezômetro</span>
                    <Dropdown
                        value={idSelecionado}
                        options={piezometros}
                        onChange={(e) => setIdSelecionado(e.value)}
                        placeholder={carregando ? "Carregando..." : "Selecione..."}
                        className="w-full md:w-14rem"
                        filter
                        showClear
                        disabled={carregando}
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Período</span>
                    <div className="flex gap-2">
                        <Calendar value={dataInicio} onChange={(e) => setDataInicio(e.value)} dateFormat="mm/yy" view="month" placeholder="Início" showIcon />
                        <Calendar value={dataFim} onChange={(e) => setDataFim(e.value)} dateFormat="mm/yy" view="month" placeholder="Fim" showIcon />
                    </div>
                </div>

                <div className="ml-auto">
                    <Button label="APLICAR" onClick={buscarGrafico} className="p-button-warning font-bold" disabled={carregando} />
                </div>
            </div>

            {/* CARDS */}
            <div className="grid mb-4">
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="summary-card">
                        <div className="summary-title">NÍVEL ESTÁTICO MÉDIO <i className="pi pi-chart-line text-yellow-500" /></div>
                        <div className="summary-value">{summary.nivelEstatico}<span className="summary-unit">m</span></div>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="summary-card">
                        <div className="summary-title">PRECIPITAÇÃO MÉDIA <i className="pi pi-cloud text-blue-500" /></div>
                        <div className="summary-value">{summary.precipitacao}<span className="summary-unit">mm</span></div>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="summary-card">
                        <div className="summary-title">VAZÃO MÉDIA <i className="pi pi-sliders-h text-orange-500" /></div>
                        <div className="summary-value">{summary.vazao}<span className="summary-unit">m³/h</span></div>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="summary-card">
                        <div className="summary-title">TOTAL DE MEDIÇÕES <i className="pi pi-file text-green-500" /></div>
                        <div className="summary-value">{summary.total}<span className="summary-unit">reg</span></div>
                    </div>
                </div>
            </div>

            {/*GŔAFICO*/}
            <div className="chart-container">
                <div className="chart-header">
                    <div className="chart-title">Níveis Piezométricos e Dados Ambientais</div>
                    <div className="chart-legend">
                        <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#ff6384' }}></div>Nível Estático</div>
                        <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#ff9f40' }}></div>Nível Superficial</div>
                        <div className="legend-item"><div className="legend-color" style={{ backgroundColor: '#9966ff' }}></div>Nível Base</div>
                    </div>
                </div>
                {lineData ? (
                    <Chart type="line" data={lineData} options={lineOptions} height="400px" />
                ) : (
                    <div className="flex align-items-center justify-content-center" style={{ height: '400px', color: '#666' }}>
                        Selecione os filtros e clique em Aplicar para visualizar os dados
                    </div>
                )}
            </div>

            {tabelaDados.length > 0 && (
                <div className="card">
                    <h5 className="mb-4 text-white">Painel de Dados Detalhados</h5>
                    <DataTable value={tabelaDados} paginator rows={5} className="p-datatable-sm" emptyMessage="Nenhum dado encontrado">
                        <Column field="mes_ano" header="DATA" body={(rowData) => {
                            const [ano, mes] = rowData.mes_ano.split("-");
                            return `${mes}/${ano}`;
                        }} sortable></Column>
                        <Column field="nivel_estatico" header="N. ESTÁTICO (M)" body={(d) => <span className="val-green">{d.nivel_estatico}</span>} sortable></Column>
                        <Column field="cota_superficie" header="N. SUPERFICIAL (M)" body={(d) => <span className="val-orange">{d.cota_superficie}</span>} sortable></Column>
                        <Column field="cota_base" header="N. BASE (M)" body={(d) => <span className="val-purple">{d.cota_base}</span>} sortable></Column>
                        <Column field="precipitacao" header="PRECIP. (MM)" sortable></Column>
                        <Column field="vazao_bombeamento" header="VAZÃO (M³/H)" body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>} sortable></Column>
                    </DataTable>
                </div>
            )}
        </div>
    );
}