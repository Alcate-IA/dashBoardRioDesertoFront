'use client';

import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    ImageRun,
    AlignmentType,
    Header,
    Footer,
    PageOrientation
} from 'docx';

interface PontoMonitoramento {
    label: string;
    value: number;
}

/**
 * Hook para gerenciar a exportação do relatório de Qualidade da Água para PDF e Word.
 * 
 * Centraliza a lógica de manipulação de DOM e conversão de formatos para manter o componente visual limpo.
 */
export const useExportacaoRelatorioQualidadeAgua = (
    pontos: PontoMonitoramento[],
    pontoSelecionado: number | null
) => {
    const escaparHtml = (valor: string) =>
        valor
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const obterContainersGraficos = (raiz: HTMLElement): HTMLElement[] => {
        const carouselContent = raiz.querySelector('.p-carousel-items-content');

        if (carouselContent) {
            const itensOriginais = carouselContent.querySelectorAll(
                '.p-carousel-item:not(.p-carousel-item-cloned) .chart-container'
            );

            if (itensOriginais.length > 0) {
                return Array.from(itensOriginais) as HTMLElement[];
            }
        }

        return Array.from(raiz.querySelectorAll('.chart-container')) as HTMLElement[];
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

    const aguardarProximoFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const capturarContainerCompletoComoImagem = async (container: HTMLElement): Promise<string> => {
        const html2canvas = (await import('html2canvas')).default;

        const estiloOriginal = {
            position: container.style.position,
            left: container.style.left,
            top: container.style.top,
            opacity: container.style.opacity,
            visibility: container.style.visibility,
            zIndex: container.style.zIndex,
            pointerEvents: container.style.pointerEvents,
            display: container.style.display
        };

        container.style.position = 'fixed';
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        container.style.zIndex = '9999';
        container.style.pointerEvents = 'none';
        container.style.display = 'block';

        await aguardarProximoFrame();
        await aguardarProximoFrame();

        try {
            const rect = container.getBoundingClientRect();
            const canvas = await html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
                width: rect.width || 1200,
                height: rect.height || 600,
                x: 0,
                y: 0
            });

            return canvas.toDataURL('image/jpeg', 0.9);
        } catch (erro) {
            console.error('Erro ao capturar container:', erro);
            return '';
        } finally {
            container.style.position = estiloOriginal.position;
            container.style.left = estiloOriginal.left;
            container.style.top = estiloOriginal.top;
            container.style.opacity = estiloOriginal.opacity;
            container.style.visibility = estiloOriginal.visibility;
            container.style.zIndex = estiloOriginal.zIndex;
            container.style.pointerEvents = estiloOriginal.pointerEvents;
            container.style.display = estiloOriginal.display;
        }
    };

    const gerarPDF = async () => {
        const elementoAnaliseIA = document.getElementById("textoApareceNoPdf");
        const containerGraficos =
            (document.getElementById("analises-export") as HTMLElement | null) ||
            (document.getElementById("analises-scrap") as HTMLElement | null);

        if (!elementoAnaliseIA || !containerGraficos) {
            console.error("Não foi possível encontrar os elementos para gerar o PDF.");
            Swal.fire({
                icon: 'error',
                title: 'Erro na Exportação',
                text: 'Não foi possível encontrar os dados necessários para gerar o PDF.'
            });
            return;
        }

        const pontoEncontrado = pontos.find(p => p.value === pontoSelecionado);
        const nomeDoPonto = pontoEncontrado ? pontoEncontrado.label : 'Ponto Selecionado';

        try {
            const base64Logo = await convertImageToBase64('/assets/logo-melhor.jpg');
            const { jsPDF } = await import('jspdf');

            const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'landscape' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const margemX = 0.5;
            const topoConteudoY = 1.0;
            const maxYTexto = pageHeight - 0.8;

            const desenharHeaderFooter = () => {
                if (base64Logo) {
                    const imgWidth = 2.0;
                    const imgHeight = 0.56;
                    pdf.addImage(base64Logo, 'JPEG', margemX, 0.1, imgWidth, imgHeight);
                }

                pdf.setFontSize(8);
                pdf.setTextColor(51, 51, 51);
                const footerText1 = "Avenida Getúlio Vargas, 515 - 88801 500 - Criciúma - SC - Brasil";
                const footerText2 = "+55 48 3431 9444   www.riodeserto.com.br";

                const textWidth1 = pdf.getStringUnitWidth(footerText1) * 8 / 72;
                const textWidth2 = pdf.getStringUnitWidth(footerText2) * 8 / 72;
                pdf.text(footerText1, (pageWidth - textWidth1) / 2, pageHeight - 0.4);
                pdf.text(footerText2, (pageWidth - textWidth2) / 2, pageHeight - 0.25);
            };

            desenharHeaderFooter();
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(`${nomeDoPonto}:`, margemX, topoConteudoY);

            const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText || '';
            const linhas = textoAnalise.split('\n');

            pdf.setFontSize(10);
            const alturaLinha = 0.18;
            let y = topoConteudoY + 0.35;

            for (const linha of linhas) {
                const texto = linha?.length ? linha : ' ';
                const partes = pdf.splitTextToSize(texto, pageWidth - margemX * 2);

                for (const parte of partes) {
                    if (y > maxYTexto) {
                        pdf.addPage();
                        desenharHeaderFooter();
                        pdf.setTextColor(0, 0, 0);
                        pdf.setFontSize(10);
                        y = topoConteudoY;
                    }
                    pdf.text(parte, margemX, y);
                    y += alturaLinha;
                }
            }

            const containersIndividuais = obterContainersGraficos(containerGraficos);
            const imagensGraficos: Array<{ data: string; width: number; height: number }> = [];

            for (let i = 0; i < containersIndividuais.length; i++) {
                const container = containersIndividuais[i];
                // eslint-disable-next-line no-await-in-loop
                await aguardarProximoFrame();

                const imgData = await capturarContainerCompletoComoImagem(container);
                if (!imgData || imgData.length < 100) continue;

                const img = new Image();
                img.src = imgData;
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });

                imagensGraficos.push({
                    data: imgData,
                    width: img.width || 1200,
                    height: img.height || 600
                });
            }

            const larguraDisponivel = pageWidth - margemX * 2;
            const alturaTotalDisponivel = pageHeight - topoConteudoY - 0.9;
            const espacoEntreGraficos = 0.2;
            const alturaPorGrafico = (alturaTotalDisponivel - espacoEntreGraficos) / 2;

            for (let i = 0; i < imagensGraficos.length; i += 2) {
                pdf.addPage();
                desenharHeaderFooter();

                const img1 = imagensGraficos[i];
                const proporcao1 = img1.width / img1.height;
                let w1 = larguraDisponivel;
                let h1 = alturaPorGrafico;
                if (proporcao1 > larguraDisponivel / alturaPorGrafico) {
                    h1 = larguraDisponivel / proporcao1;
                } else {
                    w1 = alturaPorGrafico * proporcao1;
                }
                const y1 = topoConteudoY;
                pdf.addImage(img1.data, 'JPEG', margemX, y1, w1, h1, undefined, 'FAST');

                if (i + 1 < imagensGraficos.length) {
                    const img2 = imagensGraficos[i + 1];
                    const proporcao2 = img2.width / img2.height;
                    let w2 = larguraDisponivel;
                    let h2 = alturaPorGrafico;
                    if (proporcao2 > larguraDisponivel / alturaPorGrafico) {
                        h2 = larguraDisponivel / proporcao2;
                    } else {
                        w2 = alturaPorGrafico * proporcao2;
                    }
                    const y2 = y1 + h1 + espacoEntreGraficos;
                    pdf.addImage(img2.data, 'JPEG', margemX, y2, w2, h2, undefined, 'FAST');
                }
            }

            pdf.save("relatorio-qualidade.pdf");
        } catch (erro) {
            console.error("Erro ao gerar PDF:", erro);
            Swal.fire({
                icon: 'error',
                title: 'Erro no PDF',
                text: 'Ocorreu um problema ao processar o arquivo PDF.'
            });
        }
    };

    const gerarWord = async () => {
        const elementoAnaliseIA = document.getElementById("textoApareceNoPdf");
        const containerGraficos =
            (document.getElementById("analises-export") as HTMLElement | null) ||
            (document.getElementById("analises-scrap") as HTMLElement | null);

        if (!elementoAnaliseIA || !containerGraficos) {
            console.error("Não foi possível encontrar os elementos para gerar o Word.");
            Swal.fire({
                icon: 'error',
                title: 'Erro na Exportação',
                text: 'Não foi possível encontrar os dados necessários para o Word.'
            });
            return;
        }

        const pontoEncontrado = pontos.find(p => p.value === pontoSelecionado);
        const nomeDoPonto = pontoEncontrado ? pontoEncontrado.label : 'Ponto Selecionado';

        try {
            const base64Logo = await convertImageToBase64('/assets/logo-melhor.jpg');

            const imagensGraficos: Uint8Array[] = [];
            const containersIndividuais = obterContainersGraficos(containerGraficos);

            for (const container of containersIndividuais) {
                await aguardarProximoFrame();
                const imgData = await capturarContainerCompletoComoImagem(container);
                if (!imgData || imgData.length < 100) continue;

                const response = await fetch(imgData);
                const arrayBuffer = await response.arrayBuffer();
                imagensGraficos.push(new Uint8Array(arrayBuffer));
            }

            const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText || '';
            const paragrafosAnalise = textoAnalise.split('\n').map(linha =>
                new Paragraph({
                    children: [new TextRun({ text: linha || ' ', size: 20, font: "Arial" })],
                    spacing: { after: 120 }
                })
            );

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

            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            size: {
                                orientation: PageOrientation.LANDSCAPE,
                            },
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
                                    children: [
                                        new TextRun({
                                            text: "Avenida Getúlio Vargas, 515 - 88801 500 - Criciúma - SC - Brasil",
                                            size: 16,
                                            color: "333333",
                                            font: "Arial"
                                        })
                                    ]
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: "+55 48 3431 9444   www.riodeserto.com.br",
                                            size: 16,
                                            color: "333333",
                                            font: "Arial",
                                            bold: true
                                        })
                                    ]
                                })
                            ]
                        })
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${nomeDoPonto}:`,
                                    bold: true,
                                    size: 28,
                                    font: "Arial"
                                })
                            ],
                            spacing: { after: 200 }
                        }),
                        ...paragrafosAnalise,
                        ...imagensGraficos.map(img =>
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: img,
                                        type: "jpg",
                                        transformation: { width: 900, height: 300 }
                                    })
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 200, after: 200 }
                            })
                        )
                    ]
                }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, "relatorio-qualidade.docx");

        } catch (error) {
            console.error("Erro ao gerar Word com biblioteca docx:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao gerar Word',
                text: 'Ocorreu um problema ao tentar exportar para Word usando a biblioteca nativa.'
            });
        }
    };

    return {
        gerarPDF,
        gerarWord
    };
};
