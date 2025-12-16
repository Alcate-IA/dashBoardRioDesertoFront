//componente antigo, com todo o código do gráfico piezômetro em um único arquivo, vou deixar aqui para referência e possível reutilização futura em alguma situação critica

"use client";

import { useEffect, useState } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import Swal from "sweetalert2";

import {
  getPiezometrosAtivos,
  getPiezometroPorIdDataInicioDataFimApi,
} from "@/service/api";
import { formatarData } from "@/utils/formatarData";

interface GraficoPiezometroProps {
  initialCdPiezometro?: number;
  initialMesAnoInicio?: string;
  initialMesAnoFim?: string;
  autoApply?: boolean;
}

export default function GraficoPiezometro({
  initialCdPiezometro,
  initialMesAnoInicio,
  initialMesAnoFim,
  autoApply, //SCRAP OFF

}: GraficoPiezometroProps) { 
  const [piezometros, setPiezometros] = useState<any[]>([]);
  const [idSelecionado, setIdSelecionado] = useState<number | null | string>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null);

  const [tipoFiltroSelecionado, setTipoFiltroSelecionado] = useState<
    string | null
  >(null);
  const [carregando, setCarregando] = useState(false);

  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [autoApplied, setAutoApplied] = useState(false); //SCRAP

  const [lineData, setLineData] = useState<any>(null);
  const [lineOptions, setLineOptions] = useState<any>({});
  const [summary, setSummary] = useState({
    nivelEstatico: 0,
    cotaSuperficie: 0,
    cotaBase: 0,
    precipitacao: 0,
    vazaoMina: 0,
    vazao: 0,
    total: 0,
  });
  const [tabelaDados, setTabelaDados] = useState<any[]>([]);

  const opcoesFiltro = [
    { label: "Todos os Tipos", value: null },
    { label: "PP - Piezômetro de Profundidade", value: "PP" },
    { label: "PR - Régua", value: "PR" },
    { label: "PV - Ponto de Vazão", value: "PV" },
    { label: "PC - Calhas", value: "PC" },
  ];

  const carregarPiezometrosFiltrados = async (
    tipoFiltro: string | null = null
  ) => {
    setCarregando(true);
    try {
      const filtroArray = tipoFiltro ? [tipoFiltro] : [];
      const resposta = await getPiezometrosAtivos(filtroArray);

      const piezometrosFiltrados = resposta.data.filter(
        (p: any) => p.tipoPiezometro !== "PB"
      );

      const piezometrosFormatados = piezometrosFiltrados.map((p: any) => ({
        label: `${p.idPiezometro} - ${p.nomePiezometro} (${p.tipoPiezometro})`,
        value: p.cdPiezometro,
        tipo: p.tipoPiezometro,
      }));

      setPiezometros(piezometrosFormatados);

      if (
        idSelecionado &&
        !piezometrosFormatados.find((p: any) => p.value === idSelecionado)
      ) {
        setIdSelecionado(null);
        setTipoSelecionado(null);
      }
    } catch (e) {
      console.error("Erro ao carregar piezômetros", e);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível carregar os piezômetros",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarPiezometro = (value: number) => {
    setIdSelecionado(value);
    const piezometroSelecionado = piezometros.find(
      (p: any) => p.value === value
    );
    if (piezometroSelecionado) {
      setTipoSelecionado(piezometroSelecionado.tipo);
    } else {
      setTipoSelecionado(null);
    }
  };

  useEffect(() => {
    carregarPiezometrosFiltrados(null);
  }, []);

  // Parse helper para mm/YYYY -> Date
  const parseMesAno = (mesAno: string | undefined | null): Date | null => {
    if (!mesAno) return null;
    const m = mesAno.match(/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/);
    if (!m) return null;
    const [mm, yyyy] = mesAno.split('/');
    const month = parseInt(mm, 10) - 1;
    const year = parseInt(yyyy, 10);
    return new Date(year, month, 1);
  };

  // Quando filtros iniciais são fornecidos via props, aplicamos nos estados
  useEffect(() => {
    if (initialCdPiezometro) {
      setIdSelecionado(initialCdPiezometro);
    }
    const di = parseMesAno(initialMesAnoInicio);
    const df = parseMesAno(initialMesAnoFim);
    if (di) setDataInicio(di);
    if (df) setDataFim(df);
  }, [initialCdPiezometro, initialMesAnoInicio, initialMesAnoFim]);

  // Quando a lista de piezômetros carrega/atualiza, ajusta o tipo do selecionado
  useEffect(() => {
    if (!idSelecionado) return;
    const piezometroSelecionado = piezometros.find((p: any) => p.value === idSelecionado);
    if (piezometroSelecionado) {
      setTipoSelecionado(piezometroSelecionado.tipo);
    }
  }, [piezometros, idSelecionado]);

  // Auto aplicar a busca quando todos os filtros iniciais estiverem presentes
  useEffect(() => {
    if (!autoApply || autoApplied) return;
    if (idSelecionado && dataInicio && dataFim && tipoSelecionado) {
      buscarGrafico();
      setAutoApplied(true);
    }
  }, [autoApply, autoApplied, idSelecionado, dataInicio, dataFim, tipoSelecionado]);

  useEffect(() => {
    carregarPiezometrosFiltrados(tipoFiltroSelecionado);
  }, [tipoFiltroSelecionado]);

  function eTipoCalhasOuPontoVazao(tipo: string): boolean {
    return tipo === "PC" || tipo === "PV";
  }

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
        text: "A data inicial não pode ser maior que a data final.",
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
        return new Date(Number(ano), Number(mes) - 1).toLocaleDateString(
          "pt-BR",
          {
            month: "short",
            year: "numeric",
          }
        );
      });

      const tipoPiezometro = tipoSelecionado;
      const ehPCouPV = eTipoCalhasOuPontoVazao(tipoPiezometro || "");

      let datasets: any[] = [];

      if (tipoPiezometro === "PP") {
        datasets = [
          {
            label: "Cota Superfície",
            data: dados.map((i: any) => i.cota_superficie),
            borderColor: "#ff9f40",
            tension: 0.4,
            yAxisID: "y",
            borderDash: [5, 5],
            pointRadius: 0,
            order: 1,
          },
          {
            label: "Cota Base",
            data: dados.map((i: any) => i.cota_base),
            borderColor: "#9966ff",
            tension: 0.4,
            yAxisID: "y",
            borderDash: [5, 5],
            pointRadius: 0,
            order: 2,
          },
          {
            label: "Vazão Mina",
            data: dados.map((i: any) => i.vazao_bombeamento),
            borderColor: "#00bb7e",
            borderWidth: 1,
            tension: 0.4,
            yAxisID: "y1",
          },
          {
            label: "Nível Estático",
            data: dados.map((i: any) => i.nivel_estatico),
            borderColor: "#ff6384",
            borderWidth: 3,
            tension: 0.4,
            yAxisID: "y",
            order: 4,
          },
          {
            label: "Precipitação",
            data: dados.map((i: any) => i.precipitacao),
            borderColor: "#2f4860",
            tension: 0.4,
            yAxisID: "y1",
          },
        ];
      } else if (tipoPiezometro === "PR") {
        datasets = [
          {
            label: "Vazão Mina",
            data: dados.map((i: any) => i.vazao_bombeamento),
            borderColor: "#00bb7e",
            tension: 0.4,
            yAxisID: "y1",
          },
          {
            label: "Cota",
            data: dados.map((i: any) => i.cota_superficie),
            borderColor: "#ff9f40",
            borderDash: [5, 5],
            pointRadius: 0,
            tension: 0.4,
            yAxisID: "y",
          },
          {
            label: "Nível Estático",
            data: dados.map((i: any) => i.nivel_estatico),
            borderColor: "#ff6384",
            tension: 0.4,
            yAxisID: "y",
          },
          {
            label: "Precipitação",
            data: dados.map((i: any) => i.precipitacao),
            borderColor: "#2f4860",
            tension: 0.4,
            yAxisID: "y1",
          },
        ];
      } else if (ehPCouPV) {
        datasets = [
          {
            label: "Vazão",
            data: dados.map((i: any) => i.vazao_calha),
            borderColor: "#ff6384",
            borderWidth: 3,
            tension: 0.4,
            yAxisID: "y",
          },
          {
            label: "Vazão Mina",
            data: dados.map((i: any) => i.vazao_bombeamento),
            borderColor: "#00bb7e",
            borderWidth: 1,
            tension: 0.4,
            yAxisID: "y1",
          },
          {
            label: "Precipitação",
            data: dados.map((i: any) => i.precipitacao),
            borderColor: "#2f4860",
            borderWidth: 1,
            tension: 0.4,
            yAxisID: "y1",
          },
        ];
      }

      setLineData({
        labels,
        datasets,
      });

      const total = dados.length;
      const avgPrecip =
        total > 0
          ? dados.reduce(
              (acc: number, curr: any) => acc + (curr.precipitacao || 0),
              0
            ) / total
          : 0;
      const avgVazaoMina =
        total > 0
          ? dados.reduce(
              (acc: number, curr: any) => acc + (curr.vazao_bombeamento || 0),
              0
            ) / total
          : 0;

      let avgNivel = 0;
      let avgCotaSuperficie = 0;
      let avgCotaBase = 0;
      let avgVazao = 0;

      if (tipoPiezometro === "PP") {
        avgNivel =
          total > 0
            ? dados.reduce(
                (acc: number, curr: any) => acc + (curr.nivel_estatico || 0),
                0
              ) / total
            : 0;
        avgCotaSuperficie =
          total > 0
            ? dados.reduce(
                (acc: number, curr: any) => acc + (curr.cota_superficie || 0),
                0
              ) / total
            : 0;
        avgCotaBase =
          total > 0
            ? dados.reduce(
                (acc: number, curr: any) => acc + (curr.cota_base || 0),
                0
              ) / total
            : 0;
      } else if (tipoPiezometro === "PR") {
        avgCotaSuperficie =
          total > 0
            ? dados.reduce(
                (acc: number, curr: any) => acc + (curr.cota_superficie || 0),
                0
              ) / total
            : 0;
        avgNivel =
          total > 0
            ? dados.reduce(
                (acc: number, curr: any) => acc + (curr.nivel_estatico || 0),
                0
              ) / total
            : 0;
      } else if (ehPCouPV) {
        avgVazao =
          total > 0
            ? dados.reduce(
                (acc: number, curr: any) => acc + (curr.vazao_calha || 0),
                0
              ) / total
            : 0;
      }

      setSummary({
        nivelEstatico: parseFloat(avgNivel.toFixed(1)),
        cotaSuperficie: parseFloat(avgCotaSuperficie.toFixed(1)),
        cotaBase: parseFloat(avgCotaBase.toFixed(1)),
        precipitacao: parseFloat(avgPrecip.toFixed(1)),
        vazaoMina: parseFloat(avgVazaoMina.toFixed(1)),
        vazao: parseFloat(avgVazao.toFixed(1)),
        total: total,
      });

      setTabelaDados(dados);

      const yAxisConfig: any = {
        type: "linear",
        display: true,
        position: "left",
        ticks: {
          color: "#ccc",
        },
        grid: {
          color: "#444",
        },
      };

      if (ehPCouPV) {
        yAxisConfig.title = {
          display: true,
          text: "Vazão (m³/h)",
          color: "#ccc",
        };

        yAxisConfig.beginAtZero = true;
        yAxisConfig.suggestedMin = 0;
        yAxisConfig.min = 0;

        setLineOptions({
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          plugins: {
            legend: {
              labels: {
                color: "#ccc",
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#ccc",
              },
              grid: {
                color: "#444",
              },
            },
            y: yAxisConfig,
            y1: {
              type: "linear",
              display: true,
              position: "right",
              ticks: {
                color: "#ccc",
              },
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: "Vazão Mina (m³/h) / Precipitação (mm)",
                color: "#ccc",
              },
            },
          },
        });
      } else if (tipoPiezometro === "PR") {
        yAxisConfig.title = {
          display: true,
          text: "Cota/Nível (m)",
          color: "#ccc",
        };

        setLineOptions({
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          plugins: {
            legend: {
              labels: {
                color: "#ccc",
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#ccc",
              },
              grid: {
                color: "#444",
              },
            },
            y: yAxisConfig,
            y1: {
              type: "linear",
              display: true,
              position: "right",
              ticks: {
                color: "#ccc",
              },
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: "Precipitação (mm) / Vazão Mina (m³/h)",
                color: "#ccc",
              },
            },
          },
        });
      } else if (tipoPiezometro === "PP") {
        yAxisConfig.title = {
          display: true,
          text: "Nível/Cota (m)",
          color: "#ccc",
        };

        setLineOptions({
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          plugins: {
            legend: {
              labels: {
                color: "#ccc",
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#ccc",
              },
              grid: {
                color: "#444",
              },
            },
            y: yAxisConfig,
            y1: {
              type: "linear",
              display: true,
              position: "right",
              ticks: {
                color: "#ccc",
              },
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: "Precipitação (mm) / Vazão Mina (m³/h)",
                color: "#ccc",
              },
            },
          },
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro ao carregar gráfico",
        text: "Não foi possível obter os dados do relatório.",
      });
      console.error("Erro ao carregar gráfico", err);
    }
  }

  const renderizarColunasTabela = () => {
    if (tabelaDados.length === 0 || !tipoSelecionado) return null;

    const ehPCouPV = eTipoCalhasOuPontoVazao(tipoSelecionado);

    let colunas = [
      <Column
        key="data"
        field="mes_ano"
        header="DATA"
        body={(rowData) => {
          const [ano, mes] = rowData.mes_ano.split("-");
          return `${mes}/${ano}`;
        }}
        sortable
      />,
    ];

    if (tipoSelecionado === "PP") {
      colunas.push(
        <Column
          key="nivel_estatico"
          field="nivel_estatico"
          header="N. ESTÁTICO (M)"
          body={(d) => <span className="val-green">{d.nivel_estatico}</span>}
          sortable
        />,
        <Column
          key="cota_superficie"
          field="cota_superficie"
          header="COTA SUPERFÍCIE (M)"
          body={(d) => <span className="val-orange">{d.cota_superficie}</span>}
          sortable
        />,
        <Column
          key="cota_base"
          field="cota_base"
          header="COTA BASE (M)"
          body={(d) => <span className="val-purple">{d.cota_base}</span>}
          sortable
        />,
        <Column
          key="precipitacao"
          field="precipitacao"
          header="PRECIP. (MM)"
          sortable
        />,
        <Column
          key="vazao_bombeamento"
          field="vazao_bombeamento"
          header="VAZÃO MINA (M³/H)"
          body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
          sortable
        />
      );
    } else if (tipoSelecionado === "PR") {
      colunas.push(
        <Column
          key="cota_superficie"
          field="cota_superficie"
          header="COTA (M)"
          body={(d) => <span className="val-orange">{d.cota_superficie}</span>}
          sortable
        />,
        <Column
          key="nivel_estatico"
          field="nivel_estatico"
          header="N. ESTÁTICO (M)"
          body={(d) => <span className="val-green">{d.nivel_estatico}</span>}
          sortable
        />,
        <Column
          key="precipitacao"
          field="precipitacao"
          header="PRECIP. (MM)"
          sortable
        />,
        <Column
          key="vazao_bombeamento"
          field="vazao_bombeamento"
          header="VAZÃO MINA (M³/H)"
          body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
          sortable
        />
      );
    } else if (ehPCouPV) {
      colunas.push(
        <Column
          key="vazao_calha"
          field="vazao_calha"
          header="VAZÃO (M³/H)"
          body={(d) => <span className="val-red">{d.vazao_calha}</span>}
          sortable
        />,
        <Column
          key="precipitacao"
          field="precipitacao"
          header="PRECIP. (MM)"
          sortable
        />,
        <Column
          key="vazao_bombeamento"
          field="vazao_bombeamento"
          header="VAZÃO MINA (M³/H)"
          body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
          sortable
        />
      );
    }

    return colunas;
  };

  const renderizarCards = () => {
    return null;
  };

  const renderizarLegendaGrafico = () => {
    if (!lineData) return null;

    return (
      <div className="chart-legend">
        {lineData.datasets.map((dataset: any) => {
          const label =
            dataset.label === "Cota Superfície" && tipoSelecionado === "PR"
              ? "Cota"
              : dataset.label;

          return (
            <div key={dataset.label} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: dataset.borderColor }}
              ></div>
              {label}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="col-12">
      <div className="card filter-bar">
        <div className="filter-item">
          <span className="filter-label">Visualização</span>
          <Dropdown
            value={tipoFiltroSelecionado}
            options={opcoesFiltro}
            onChange={(e) => setTipoFiltroSelecionado(e.value)}
            placeholder="Selecione o tipo"
            className="w-full md:w-15rem"
            showClear
          />
        </div>

        <div className="filter-item">
          <span className="filter-label">Piezômetro</span>
          <Dropdown
            value={idSelecionado}
            options={piezometros}
            onChange={(e) => handleSelecionarPiezometro(e.value)}
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
            <Calendar
              value={dataInicio}
              onChange={(e:any) => setDataInicio(e.value)}
              dateFormat="mm/yy"
              view="month"
              placeholder="Início"
              showIcon
            />
            <Calendar
              value={dataFim}
              onChange={(e:any) => setDataFim(e.value)}
              dateFormat="mm/yy"
              view="month"
              placeholder="Fim"
              showIcon
            />
          </div>
        </div>

        <div className="ml-auto">
          <Button
            label="APLICAR"
            onClick={buscarGrafico}
            className="p-button-warning font-bold"
            disabled={carregando}
          />
        </div>
      </div>

      {/* CARDS DINÂMICOS */}
      {/* Removido conforme solicitado */}

      {/*GŔAFICO*/}
      <div id="nivel-estatico-scrap" className="chart-container">
        <div className="chart-header">
          <div className="chart-title">
            {tabelaDados.length > 0 && tipoSelecionado
              ? `Dados do ${
                  tipoSelecionado === "PP" || tipoSelecionado === "PR"
                    ? "Piezômetro"
                    : "Recurso Hídrico"
                }`
              : "Níveis Piezométricos e Dados Ambientais"}
          </div>
          {renderizarLegendaGrafico()}
        </div>
        {lineData ? (
          <Chart
            type="line"
            data={lineData}
            options={lineOptions}
            height="400px"
          />
        ) : (
          <div
            className="flex align-items-center justify-content-center"
            style={{ height: "400px", color: "#666" }}
          >
            Selecione os filtros e clique em Aplicar para visualizar os dados
          </div>
        )}
      </div>

      {tabelaDados.length > 0 && tipoSelecionado && (
        <div className="card">
          <h5 className="mb-4 text-white">
            Painel de Dados - {tipoSelecionado}
          </h5>
          <DataTable
            value={tabelaDados}
            paginator
            rows={5}
            className="p-datatable-sm"
            emptyMessage="Nenhum dado encontrado"
          >
            {renderizarColunasTabela()}
          </DataTable>
        </div>
      )}
    </div>
  );
}