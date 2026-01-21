'use client';

import { RefObject } from "react";
import { Chart } from "primereact/chart";
import { saveAs } from 'file-saver';
import Swal from "sweetalert2";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    Header,
    Footer,
    PageOrientation,
    Table,
    TableRow,
    TableCell,
    WidthType
} from 'docx';

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
    const escaparHtml = (valor: string) =>
        valor
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const obterNomePiezometro = () => {
        const piezometro = piezometros.find(p => p.value === idSelecionado);
        return piezometro ? piezometro.label : 'Não selecionado';
    };

    const urlToBase64 = (url: string): Promise<string> => {
        return new Promise(async (resolve) => {
            const proxyUrl = `/imagens-proxy?url=${encodeURIComponent(url)}`;
            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Network response from proxy was not ok.');
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error(`Failed to convert URL to Base64 via proxy: ${url}`, error);
                resolve('');
            }
        });
    };

    const convertImageToBase64 = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Erro ao converter imagem:", error);
            return "";
        }
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

        const containerImpressao = document.createElement("div");
        containerImpressao.style.padding = "20px";

        const tituloPiezometro = document.createElement("h3");
        tituloPiezometro.textContent = `${obterNomePiezometro()}:`;
        tituloPiezometro.style.marginBottom = "20px";
        tituloPiezometro.style.color = "#000";
        containerImpressao.appendChild(tituloPiezometro);

        const containerRelatorio = document.createElement("div");
        containerRelatorio.style.backgroundColor = "#000"; // Cor de fundo do gráfico no app
        containerRelatorio.style.color = "#fff";
        containerRelatorio.style.padding = "20px 20px 10px 20px";

        const cabecalhoGrafico = document.querySelector(".chart-header")?.cloneNode(true);
        if (cabecalhoGrafico) {
            containerRelatorio.appendChild(cabecalhoGrafico);
        }

        const urlImagemGrafico = canvasGrafico.toDataURL("image/jpeg", 0.8);
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

        if (fotosInspecao && fotosInspecao.length > 0) {
            const containerFotos = document.createElement('div');
            containerFotos.style.marginTop = '30px';
            containerFotos.style.breakInside = 'avoid';

            const tituloFotos = document.createElement('h4');
            tituloFotos.textContent = 'Fotos de Inspeção';
            tituloFotos.style.marginBottom = '15px';
            tituloFotos.style.color = '#000';
            containerFotos.appendChild(tituloFotos);

            const tabela = document.createElement('table');
            tabela.style.width = '100%';
            tabela.style.borderCollapse = 'collapse';
            tabela.style.border = '1px solid #ccc';

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

            const tbody = document.createElement('tbody');
            const fotosBase64 = await Promise.all(fotosInspecao.map(foto => urlToBase64(foto.caminhoCompleto)));

            fotosInspecao.forEach((foto, index) => {
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
                    td.style.verticalAlign = 'middle';
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

                const imgFoto = document.createElement('img');
                imgFoto.src = fotosBase64[index];
                imgFoto.style.width = '340px';
                imgFoto.style.height = 'auto';
                imgFoto.style.display = 'block';
                imgFoto.style.margin = '0 auto';

                tr.appendChild(criarCelula(fotosBase64[index] ? imgFoto : 'Erro ao carregar'));
                tbody.appendChild(tr);
            });
            tabela.appendChild(tbody);
            containerFotos.appendChild(tabela);
            containerImpressao.appendChild(containerFotos);
        }

        try {
            const html2pdf = (await import("html2pdf.js")).default;
            const base64Logo = await convertImageToBase64('/assets/logo-melhor.jpg');

            const opcoes = {
                margin: [0.8, 0.5, 0.8, 0.5] as [number, number, number, number],
                filename: `relatorio-piezometro-${obterNomePiezometro()}.pdf`,
                image: { type: "jpeg" as const, quality: 0.98 },
                html2canvas: { scale: 2, letterRendering: true, useCORS: true },
                jsPDF: { unit: "in", format: "letter", orientation: "landscape" as const },
            };

            await html2pdf().from(containerImpressao).set(opcoes).toPdf().get('pdf').then((pdf: any) => {
                const totalPages = pdf.internal.getNumberOfPages();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    if (base64Logo) {
                        const imgWidth = 2.0;
                        const imgHeight = 0.56;
                        pdf.addImage(base64Logo, 'JPEG', 0.5, 0.1, imgWidth, imgHeight);
                    }
                    pdf.setFontSize(8);
                    pdf.setTextColor(51, 51, 51);
                    const footerText1 = "Avenida Getúlio Vargas, 515 - 88801 500 - Criciúma - SC - Brasil";
                    const footerText2 = "+55 48 3431 9444   www.riodeserto.com.br";
                    const textWidth1 = pdf.getStringUnitWidth(footerText1) * 8 / 72;
                    const textWidth2 = pdf.getStringUnitWidth(footerText2) * 8 / 72;
                    const x1 = (pageWidth - textWidth1) / 2;
                    const x2 = (pageWidth - textWidth2) / 2;
                    pdf.text(footerText1, x1, pageHeight - 0.4);
                    pdf.text(footerText2, x2, pageHeight - 0.25);
                }
                pdf.save(opcoes.filename);
            });
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
            Swal.fire({
                icon: 'error',
                title: 'Erro na exportação',
                text: 'Certifique-se de que o gráfico e a análise estão visíveis.'
            });
            return;
        }

        try {
            // 1. Prepara dados das imagens
            const base64Logo = await convertImageToBase64('/assets/logo-melhor.jpg');
            const urlImagemGrafico = canvasGrafico.toDataURL("image/jpeg", 0.8);

            // Converte gráfico para Uint8Array
            const graficoResponse = await fetch(urlImagemGrafico);
            const graficoBuffer = await graficoResponse.arrayBuffer();

            // 2. Prepara parágrafos da análise
            const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText || '';
            const paragrafosAnalise = textoAnalise.split('\n').map(linha =>
                new Paragraph({
                    children: [new TextRun({ text: linha || ' ', size: 20, font: "Arial" })],
                    spacing: { after: 120 }
                })
            );

            // 3. Prepara tabela de fotos (se existirem)
            let tabelaFotos: Table | null = null;
            if (fotosInspecao && fotosInspecao.length > 0) {
                const fotosBase64 = await Promise.all(fotosInspecao.map(foto => urlToBase64(foto.caminhoCompleto)));

                const rows = await Promise.all(fotosInspecao.map(async (foto, index) => {
                    const dataObj = new Date(foto.dataInsercao);
                    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    let celulaFoto: TableCell;
                    if (fotosBase64[index]) {
                        const fotoResponse = await fetch(fotosBase64[index]);
                        const fotoBuffer = await fotoResponse.arrayBuffer();
                        celulaFoto = new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: new Uint8Array(fotoBuffer),
                                            type: "jpg",
                                            transformation: { width: 340, height: 255 }
                                        })
                                    ],
                                    alignment: AlignmentType.CENTER
                                })
                            ]
                        });
                    } else {
                        celulaFoto = new TableCell({
                            children: [new Paragraph({ children: [new TextRun("Erro ao carregar imagem")], alignment: AlignmentType.CENTER })]
                        });
                    }

                    return new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun(String(foto.idPiezometro || 'N/A'))], alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun(dataFormatada)], alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun(horaFormatada)], alignment: AlignmentType.CENTER })] }),
                            celulaFoto
                        ]
                    });
                }));

                tabelaFotos = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Ponto", bold: true })], alignment: AlignmentType.CENTER }),], shading: { fill: "F4F4F4" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data", bold: true })], alignment: AlignmentType.CENTER }),], shading: { fill: "F4F4F4" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hora", bold: true })], alignment: AlignmentType.CENTER }),], shading: { fill: "F4F4F4" } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Foto", bold: true })], alignment: AlignmentType.CENTER }),], shading: { fill: "F4F4F4" } }),
                            ]
                        }),
                        ...rows
                    ]
                });
            }

            // 4. Monta o logo para o Header
            let headerChildren: any[] = [];
            if (base64Logo) {
                const logoResponse = await fetch(base64Logo);
                const logoBuffer = await logoResponse.arrayBuffer();
                headerChildren.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: new Uint8Array(logoBuffer),
                                type: "jpg",
                                transformation: { width: 200, height: 56 }
                            })
                        ],
                        alignment: AlignmentType.LEFT
                    })
                );
            }

            // 5. Constrói o documento
            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            size: { orientation: PageOrientation.LANDSCAPE },
                            margin: { top: 720, right: 720, bottom: 720, left: 720 }
                        }
                    },
                    headers: {
                        default: new Header({
                            children: headerChildren
                        })
                    },
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "Avenida Getúlio Vargas, 515 - 88801 500 - Criciúma - SC - Brasil", size: 16, color: "333333", font: "Arial" })]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: "+55 48 3431 9444   www.riodeserto.com.br", size: 16, color: "333333", font: "Arial", bold: true })]
                                })
                            ]
                        })
                    },
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: `${obterNomePiezometro()}:`, bold: true, size: 28, font: "Arial" })],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: new Uint8Array(graficoBuffer),
                                    type: "jpg",
                                    transformation: { width: 1000, height: 250 }
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 }
                        }),
                        ...paragrafosAnalise,
                        ...(tabelaFotos ? [
                            new Paragraph({
                                children: [new TextRun({ text: "Fotos de Inspeção", bold: true, size: 24, font: "Arial" })],
                                spacing: { before: 600, after: 300 }
                            }),
                            tabelaFotos
                        ] : [])
                    ]
                }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `relatorio-piezometro-${obterNomePiezometro()}.docx`);

        } catch (erro) {
            console.error("Erro ao gerar Word com biblioteca docx:", erro);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao gerar Word',
                text: 'Ocorreu um problema ao tentar exportar para Word usando a biblioteca nativa.'
            });
        }
    };

    return {
        aoGerarPdf,
        aoGerarWord
    };
};
