"use client";

import { useState, useEffect } from "react";
import FilterBar from "./FilterBar";
import GraficosAnalise from "./GraficosAnalise";
import AnaliseIA from "./AnaliseIA";
import { postColetaCompletaFiltroApi, webHookIAAnaliseQualidade, getParametrosLegislacaoBuscaDadosRelacionados, getHistoricoCompletoApi } from '@/service/api';
import Swal from "sweetalert2";
import { SplitButton } from 'primereact/splitbutton';
import { saveAs } from 'file-saver';
import { getPiezometrosRelatorio } from '@/service/qualidadeAguaApis';


export type QualidadeAguaProps = {
    initialCdPiezometro?: number;
    initialMesAnoInicio?: string;
    initialMesAnoFim?: string;
    autoApply?: boolean;
    isReport?: boolean;
};

export default function QualidadeAgua({
    initialCdPiezometro,
    initialMesAnoInicio,
    initialMesAnoFim,
    autoApply = false,
    isReport = false,
}: QualidadeAguaProps = {}) {
    const [tipoFiltroSelecionado, setTipoFiltroSelecionado] = useState<string | null>(null);
    const [pontoSelecionado, setPontoSelecionado] = useState<number | null>(null);
    const [dataInicio, setDataInicio] = useState<Date | null>(null);
    const [dataFim, setDataFim] = useState<Date | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [pontos, setPontos] = useState<any[]>([]);
    const [itensSelecionados, setItensSelecionados] = useState<number[]>([]);
    const [parametros, setParametros] = useState<any[]>([]);

    const [dadosColeta, setDadosColeta] = useState<any>(null);
    const [autoApplied, setAutoApplied] = useState(false);
    const [analiseIA, setAnaliseIA] = useState<string | null>(null);
    const [analiseOriginalIA, setAnaliseOriginalIA] = useState<string | null>(null);

    const opcoesFiltro = [
        { label: "Todos os Tipos", value: null },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" },
    ];

    useEffect(() => {
        const buscarPiezometros = async () => {
            setCarregando(true);
            try {
                const response = await getPiezometrosRelatorio(tipoFiltroSelecionado);
                const data = response.data;
                const pontosFormatados = data.map((item: any) => ({
                    label: item.nm_piezometro,
                    value: item.id_zeus
                }));
                setPontos(pontosFormatados);
                setPontoSelecionado(null);
            } catch (error) {
                console.error("Erro ao buscar piezômetros:", error);
                setPontos([]);
            } finally {
                setCarregando(false);
            }
        };
        buscarPiezometros();
    }, [tipoFiltroSelecionado]);

    useEffect(() => {
        const carregarParametros = async () => {
            try {
                const response = await getParametrosLegislacaoBuscaDadosRelacionados();
                const dados = response.data;
                const uniqueAnalyses = Array.from(new Map(dados.map((item: any) => [item.id_analise, item])).values());
                setParametros(uniqueAnalyses);

                if (itensSelecionados.length === 0) {
                    setItensSelecionados(uniqueAnalyses.map((p: any) => p.id_analise));
                }
            } catch (error) {
                console.error("Erro ao carregar parâmetros da legislação:", error);
            }
        };
        carregarParametros();
    }, []);

    useEffect(() => {
        setDadosColeta(null);
        setAnaliseIA(null);
        setAnaliseOriginalIA(null);
    }, [tipoFiltroSelecionado, pontoSelecionado, dataInicio, dataFim, itensSelecionados]);

    const parseMesAno = (mesAno?: string | null): Date | null => {
        if (!mesAno) return null;
        const m = mesAno.match(/^(0[1-9]|1[0-2])\/(19|20)\d{2}$/);
        if (!m) return null;
        const [mm, yyyy] = mesAno.split('/');
        return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, 1);
    };

    useEffect(() => {
        if (initialCdPiezometro) setPontoSelecionado(initialCdPiezometro);
        const di = parseMesAno(initialMesAnoInicio);
        const df = parseMesAno(initialMesAnoFim);
        if (di) setDataInicio(di);
        if (df) setDataFim(df);
    }, [initialCdPiezometro, initialMesAnoInicio, initialMesAnoFim]);

    useEffect(() => {
        if (!autoApply || autoApplied) return;
        if (pontoSelecionado && dataInicio && dataFim) {
            handleBuscar();
            setAutoApplied(true);
        }
    }, [autoApply, autoApplied, pontoSelecionado, dataInicio, dataFim]);

    const handleGeneratePdf = async () => {
        const analiseIAEl = document.getElementById("textoApareceNoPdf");
        const chartsContainer = document.getElementById("analises-scrap");

        if (!analiseIAEl || !chartsContainer) {
            console.error("Não foi possível encontrar os elementos para gerar o PDF.");
            return;
        }

        const finalPrintContainer = document.createElement("div");
        finalPrintContainer.style.padding = "0.5in";
        finalPrintContainer.style.width = "10in";
        finalPrintContainer.style.backgroundColor = "#fff";
        finalPrintContainer.style.margin = "0 auto";

        const selectedPoint = pontos.find(p => p.value === pontoSelecionado);
        const pointName = selectedPoint ? selectedPoint.label : 'Ponto Selecionado';

        const pointNameEl = document.createElement("h3");
        pointNameEl.textContent = `${pointName}:`;
        pointNameEl.style.marginBottom = "20px";
        pointNameEl.style.color = "#000";

        finalPrintContainer.appendChild(pointNameEl);

        const analiseText = (analiseIAEl as HTMLElement).innerText;
        const analiseContainer = document.createElement('div');
        analiseContainer.style.marginBottom = '20px';
        analiseContainer.style.width = '100%';

        const lines = analiseText.split('\n');
        lines.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line || '\u00A0';
            p.style.color = 'black';
            p.style.margin = '0';
            p.style.lineHeight = '1.5';
            analiseContainer.appendChild(p);
        });
        finalPrintContainer.appendChild(analiseContainer);

        const chartContainers = chartsContainer.querySelectorAll('.chart-container');

        chartContainers.forEach((container, index) => {
            const containerClone = container.cloneNode(true) as HTMLElement;

            containerClone.classList.remove('h-full');
            containerClone.style.height = 'auto';
            containerClone.style.width = '100%';
            containerClone.style.display = 'block';

            const originalCanvas = container.querySelector('canvas');
            const clonedCanvas = containerClone.querySelector('canvas');

            if (originalCanvas && clonedCanvas) {
                const img = document.createElement('img');
                img.src = originalCanvas.toDataURL("image/png");
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                const parent = clonedCanvas.parentNode as HTMLElement;
                if (parent) {
                    parent.replaceChild(img, clonedCanvas);
                    parent.style.height = 'auto';
                    parent.style.width = '100%';
                    parent.style.position = 'static';
                    parent.className = '';
                }
            }

            const wrapper = document.createElement('div');
            wrapper.style.width = '100%';
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.flexDirection = 'column';
            wrapper.style.paddingTop = '40px';
            wrapper.style.paddingBottom = '40px';
            wrapper.style.pageBreakBefore = 'always';
            wrapper.style.pageBreakInside = 'avoid';

            containerClone.style.width = '90%';
            containerClone.style.margin = '0';
            containerClone.style.textAlign = 'left';

            wrapper.appendChild(containerClone);
            finalPrintContainer.appendChild(wrapper);
        });


        const html2pdf = (await import("html2pdf.js")).default;

        const opt = {
            margin: 0,
            filename: "relatorio-qualidade.pdf",
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                letterRendering: true,
                useCORS: true,
                windowWidth: 1400
            },
            jsPDF: { unit: "in", format: "letter", orientation: "landscape" as const },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        html2pdf().from(finalPrintContainer).set(opt).save();
    };

    const handleGenerateWord = async () => {
        const analiseIAEl = document.getElementById("textoApareceNoPdf");
        const chartsContainer = document.getElementById("analises-scrap");

        if (!analiseIAEl || !chartsContainer) {
            console.error("Não foi possível encontrar os elementos para gerar o Word.");
            return;
        }

        const selectedPoint = pontos.find(p => p.value === pontoSelecionado);
        const pointName = selectedPoint ? selectedPoint.label : 'Ponto Selecionado';

        let chartsHtml = '';
        const chartContainers = chartsContainer.querySelectorAll('.chart-container');

        chartContainers.forEach((container) => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                const chartDataURL = canvas.toDataURL("image/png");
                chartsHtml += `
                    <div style="margin-top: 40px; margin-bottom: 40px; text-align: center;">
                        <img src="${chartDataURL}" style="width: 600px;" />
                    </div>
                `;
            }
        });

        const analiseText = (analiseIAEl as HTMLElement).innerText;
        const analiseLines = analiseText.split('\n').map(line => `<p style="margin: 0;">${line || '&nbsp;'}</p>`).join('');

        const htmlString = `
            <div style="font-family: Arial; padding: 20px;">
                <h3 style="color: #000; margin-bottom: 20px;">${pointName}:</h3>
                <div style="margin-bottom: 20px; color: #000;">
                    ${analiseLines}
                </div>
                ${chartsHtml}
            </div>
        `;

        const opt = {
            orientation: 'landscape' as const,
            margins: { top: 720, right: 720, bottom: 720, left: 720 },
        };

        try {
            const htmlToDocx = (await import('html-to-docx')).default;
            const fileBuffer = await htmlToDocx(htmlString, null, opt);
            saveAs(fileBuffer as Blob, "relatorio-qualidade.docx");
        } catch (error) {
            console.error("Erro ao gerar Word:", error);
            Swal.fire({ icon: 'error', title: 'Erro ao gerar Word', text: 'Ocorreu um problema ao tentar exportar para Word.' });
        }
    };

    const handleBuscar = async () => {
        if (!pontoSelecionado || !dataInicio || !dataFim) {
            console.warn("Selecione o ponto e as datas.");
            Swal.fire({ icon: "warning", title: "Selecione o ponto e as datas" });
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

        try {
            Swal.fire({
                title: 'Carregando...',
                html: 'Buscando dados e analisando...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            setCarregando(true);
            setDadosColeta(null);
            setAnaliseIA(null);
            setAnaliseOriginalIA(null);

            const formatMonthYear = (date: Date) => {
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${month}/${year}`;
            };

            const inicio = formatMonthYear(dataInicio);
            const fim = formatMonthYear(dataFim);

            const response = await postColetaCompletaFiltroApi(pontoSelecionado, inicio, fim, itensSelecionados);
            const data = response.data;
            setDadosColeta(data);

            if (data && data.amostras) {
                const filtrosStrings = parametros
                    .filter(p => itensSelecionados.includes(p.id_analise))
                    .map(p => `${p.nome} (${p.simbolo})`);

                const historyResponse = await getHistoricoCompletoApi(pontoSelecionado);
                const historicoData = historyResponse.data;

                const iaResponse = await webHookIAAnaliseQualidade(data, pontoSelecionado, filtrosStrings, historicoData) as any;
                if (typeof iaResponse === 'string') {
                    setAnaliseIA(iaResponse);
                    setAnaliseOriginalIA(iaResponse);
                } else if (iaResponse && iaResponse[0] && iaResponse[0].output) {
                    setAnaliseIA(iaResponse[0].output);
                    setAnaliseOriginalIA(iaResponse[0].output);
                } else if (iaResponse && iaResponse.output) {
                    setAnaliseIA(iaResponse.output);
                    setAnaliseOriginalIA(iaResponse.output);
                } else {
                    const stringified = JSON.stringify(iaResponse);
                    setAnaliseIA(stringified);
                    setAnaliseOriginalIA(stringified);
                }
            }

            Swal.close();

        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            Swal.fire({
                icon: "error",
                title: "Erro",
                text: "Não foi possível carregar os dados."
            });
        } finally {
            setCarregando(false);
        }
    };

    const exportItems = [
        {
            label: 'PDF',
            icon: 'pi pi-file-pdf',
            command: handleGeneratePdf
        },
        {
            label: 'Word',
            icon: 'pi pi-file-word',
            command: handleGenerateWord
        }
    ];

    return (
        <div className="col-12">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1>Qualidade Água</h1>
                {analiseIA && (
                    <SplitButton
                        label="Exportar"
                        icon="pi pi-download"
                        model={exportItems}
                        onClick={handleGeneratePdf}
                        className="p-button-secondary"
                    />
                )}
            </div>

            <FilterBar
                opcoesFiltro={opcoesFiltro}
                tipoFiltroSelecionado={tipoFiltroSelecionado}
                onTipoFiltroChange={setTipoFiltroSelecionado}
                pontos={pontos}
                pontoSelecionado={pontoSelecionado}
                onPontoChange={setPontoSelecionado}
                carregando={carregando}
                dataInicio={dataInicio}
                dataFim={dataFim}
                onDataInicioChange={setDataInicio}
                onDataFimChange={setDataFim}
                onBuscar={handleBuscar}
                itensSelecionados={itensSelecionados}
                onItensSelecionadosChange={setItensSelecionados}
                parametros={parametros}
            />

            {dadosColeta && dadosColeta.amostras && (
                <div className="mt-5">
                    <GraficosAnalise dados={dadosColeta} isReport={isReport} />
                </div>
            )}

            <AnaliseIA
                carregando={carregando}
                analise={analiseIA}
                analiseOriginalIA={analiseOriginalIA}
                onSave={(text) => setAnaliseIA(text)}
                idZeus={pontoSelecionado}
            />
        </div>
    );
}
