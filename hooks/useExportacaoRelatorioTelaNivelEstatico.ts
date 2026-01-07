'use client';

import { RefObject } from "react";
import { Chart } from "primereact/chart";
import { saveAs } from 'file-saver';
import Swal from "sweetalert2";

interface PiezometroOption {
    label: string;
    value: number;
}

/**
 * Hook customizado para gerenciar a exportação de relatórios (PDF e Word) na tela de Nível Estático.
 * Se refere ao: components/GraficoPiezometro/AnaliseIA.tsx
 */
export const useExportacaoRelatorioTelaNivelEstatico = (
    chartRef: RefObject<Chart>,
    piezometros: PiezometroOption[],
    idSelecionado: number | null,
    fotosInspecao: any[] = []
) => {

    const obterNomePiezometro = () => {
        const piezometro = piezometros.find(p => p.value === idSelecionado);
        return piezometro ? piezometro.label : 'Não selecionado';
    };

    const aoGerarPdf = async () => {
        const canvasGrafico = chartRef.current?.getCanvas();
        const elementoAnaliseIA = document.getElementById("textoApareceNoPdf");

        if (!canvasGrafico || !elementoAnaliseIA) {
            console.error("Não foi possível encontrar os elementos para gerar o PDF.");
            Swal.fire({
                icon: 'error',
                title: 'Erro na exportação',
                text: 'Certifique-se de que o gráfico e a análise estão visíveis.'
            });
            return;
        }

        // Criar container temporário para impressão
        const containerImpressao = document.createElement("div");
        containerImpressao.style.padding = "20px";

        const tituloPiezometro = document.createElement("h3");
        tituloPiezometro.textContent = `${obterNomePiezometro()}:`;
        tituloPiezometro.style.marginBottom = "20px";
        tituloPiezometro.style.color = "#000";
        containerImpressao.appendChild(tituloPiezometro);

        const containerRelatorio = document.createElement("div");
        containerRelatorio.style.backgroundColor = "#333";
        containerRelatorio.style.color = "#fff";
        containerRelatorio.style.padding = "20px";

        const cabecalhoGrafico = document.querySelector(".chart-header")?.cloneNode(true);
        if (cabecalhoGrafico) {
            containerRelatorio.appendChild(cabecalhoGrafico);
        }

        const urlImagemGrafico = canvasGrafico.toDataURL("image/png");
        const imagemGrafico = document.createElement("img");
        imagemGrafico.src = urlImagemGrafico;
        imagemGrafico.style.width = "100%";
        containerRelatorio.appendChild(imagemGrafico);

        containerImpressao.appendChild(containerRelatorio);

        const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText;
        const containerAnalise = document.createElement('div');
        containerAnalise.style.marginTop = '20px';

        textoAnalise.split('\n').forEach(linha => {
            const p = document.createElement('p');
            p.textContent = linha || '\u00A0';
            p.style.color = 'black';
            p.style.margin = '0';
            p.style.breakInside = 'avoid';
            containerAnalise.appendChild(p);
        });
        containerImpressao.appendChild(containerAnalise);

        // Adicionar Tabela de Fotos de Inspeção se houver fotos
        if (fotosInspecao && fotosInspecao.length > 0) {
            const containerFotos = document.createElement('div');
            containerFotos.style.marginTop = '30px';
            containerFotos.style.breakBefore = 'page'; // Força que as fotos comecem em uma nova página se necessário

            const tituloFotos = document.createElement('h4');
            tituloFotos.textContent = 'Fotos de Inspeção';
            tituloFotos.style.marginBottom = '15px';
            tituloFotos.style.color = '#000';
            containerFotos.appendChild(tituloFotos);

            const tabela = document.createElement('table');
            tabela.style.width = '100%';
            tabela.style.borderCollapse = 'collapse';
            tabela.style.border = '1px solid #ccc';

            // Cabeçalho da Tabela
            const thead = document.createElement('thead');
            const trHeader = document.createElement('tr');
            ['Ponto', 'Data', 'Hora', 'Foto'].forEach(texto => {
                const th = document.createElement('th');
                th.textContent = texto;
                th.style.border = '1px solid #ccc';
                th.style.padding = '8px';
                th.style.backgroundColor = '#f4f4f4';
                th.style.color = '#000';
                trHeader.appendChild(th);
            });
            thead.appendChild(trHeader);
            tabela.appendChild(thead);

            // Corpo da Tabela
            const tbody = document.createElement('tbody');
            fotosInspecao.forEach(foto => {
                const tr = document.createElement('tr');

                const dataObj = new Date(foto.dataInsercao);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                const criarCelula = (conteudo: string | HTMLElement) => {
                    const td = document.createElement('td');
                    td.style.border = '1px solid #ccc';
                    td.style.padding = '10px';
                    td.style.textAlign = 'center';
                    td.style.color = '#000';
                    if (typeof conteudo === 'string') {
                        td.textContent = conteudo;
                    } else {
                        td.appendChild(conteudo);
                    }
                    return td;
                };

                tr.appendChild(criarCelula(foto.idPiezometro || 'N/A'));
                tr.appendChild(criarCelula(dataFormatada));
                tr.appendChild(criarCelula(horaFormatada));

                // Célula da Foto (Placeholder por enquanto)
                const divFoto = document.createElement('div');
                divFoto.style.width = '120px';
                divFoto.style.height = '80px';
                divFoto.style.backgroundColor = '#f0f0f0';
                divFoto.style.border = '1px dashed #ccc';
                divFoto.style.display = 'flex';
                divFoto.style.alignItems = 'center';
                divFoto.style.justifyContent = 'center';
                divFoto.style.margin = '0 auto';

                const iconPlaceholder = document.createElement('span');
                iconPlaceholder.textContent = '📸'; // Emoji de câmera como placeholder
                divFoto.appendChild(iconPlaceholder);

                tr.appendChild(criarCelula(divFoto));

                tbody.appendChild(tr);
            });
            tabela.appendChild(tbody);
            containerFotos.appendChild(tabela);
            containerImpressao.appendChild(containerFotos);
        }

        try {
            const html2pdf = (await import("html2pdf.js")).default;
            const opcoes = {
                margin: 1,
                filename: `relatorio-piezometro-${obterNomePiezometro()}.pdf`,
                image: { type: "jpeg" as const, quality: 0.98 },
                html2canvas: { scale: 2, letterRendering: true },
                jsPDF: { unit: "in", format: "letter", orientation: "landscape" as const },
            };

            await html2pdf().from(containerImpressao).set(opcoes).save();
        } catch (erro) {
            console.error("Erro ao gerar PDF:", erro);
            Swal.fire({ icon: 'error', title: 'Erro ao gerar PDF' });
        }
    };

    const aoGerarWord = async () => {
        const canvasGrafico = chartRef.current?.getCanvas();
        const elementoAnaliseIA = document.getElementById("textoApareceNoPdf");

        if (!canvasGrafico || !elementoAnaliseIA) {
            console.error("Não foi possível encontrar os elementos para gerar o Word.");
            return;
        }

        const urlImagemGrafico = canvasGrafico.toDataURL("image/png");
        const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText;
        const linhasAnaliseHtml = textoAnalise.split('\n')
            .map(linha => `<p style="margin: 0;">${linha || '&nbsp;'}</p>`)
            .join('');

        const htmlString = `
            <div style="font-family: Arial; padding: 20px;">
                <h3 style="color: #000; margin-bottom: 20px;">${obterNomePiezometro()}:</h3>
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${urlImagemGrafico}" style="width: 600px;" />
                </div>
                <div style="margin-top: 20px; color: #000;">
                    ${linhasAnaliseHtml} 
                </div>
            </div>
        `;

        const opcoes = {
            orientation: 'landscape' as const,
            margins: { top: 720, right: 720, bottom: 720, left: 720 },
        };

        try {
            const htmlToDocx = (await import('html-to-docx')).default;
            const bufferArquivo = await htmlToDocx(htmlString, null, opcoes);
            saveAs(bufferArquivo as Blob, `relatorio-piezometro-${obterNomePiezometro()}.docx`);
        } catch (erro) {
            console.error("Erro ao gerar Word:", erro);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao gerar Word',
                text: 'Ocorreu um problema ao tentar exportar para Word.'
            });
        }
    };

    return {
        aoGerarPdf,
        aoGerarWord
    };
};
