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
    const escaparHtml = (valor: string) =>
        valor
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    const gerarBlobDocx = async (
        html: string,
        headerHTML: string,
        options: any,
        footerHTML: string
    ): Promise<Blob> => {
        const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        // Envolve o HTML em uma estrutura básica padrão para garantir que o conversor interprete corretamente
        const htmlCompleto = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
            </head>
            <body>
                ${html}
            </body>
            </html>
        `;

        try {
            const htmlToDocx = (await import('html-to-docx')).default;
            const buffer = await htmlToDocx(htmlCompleto, headerHTML, options, footerHTML);
            if (buffer instanceof Blob) return buffer;
            return new Blob([buffer], { type: mime });
        } catch (erro) {
            console.error('Erro ao gerar Word com html-to-docx:', erro);
            throw new Error('Não foi possível gerar o arquivo Word.');
        }
    };


    const obterNomePiezometro = () => {
        const piezometro = piezometros.find(p => p.value === idSelecionado);
        return piezometro ? piezometro.label : 'Não selecionado';
    };

    const urlToBase64 = (url: string): Promise<string> => {
        return new Promise(async (resolve) => {
            // Usa o proxy de imagens do próprio app para evitar problemas de CORS no fetch do lado do cliente.
            const proxyUrl = `/imagens-proxy?url=${encodeURIComponent(url)}`;
            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Network response from proxy was not ok.');
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(''); // Resolve com string vazia em caso de erro na leitura
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error(`Failed to convert URL to Base64 via proxy: ${url}`, error);
                resolve(''); // Resolve com string vazia em caso de erro no fetch
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
        containerRelatorio.style.backgroundColor = "#333";
        containerRelatorio.style.color = "#fff";
        containerRelatorio.style.padding = "20px";

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

                // Correção do erro de tipo: passar string em caso de falha
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
            return;
        }

        const urlImagemGrafico = canvasGrafico.toDataURL("image/jpeg", 0.8);
        const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText || '';
        const linhasAnaliseHtml = textoAnalise
            .split('\n')
            .map((linha) => `<p style="margin: 0;">${linha ? escaparHtml(linha) : '&nbsp;'}</p>`)
            .join('');

        let tabelaFotosHtml = '';
        if (fotosInspecao && fotosInspecao.length > 0) {
            const fotosBase64 = await Promise.all(fotosInspecao.map(foto => urlToBase64(foto.caminhoCompleto)));

            const linhasTabelaFotos = fotosInspecao.map((foto, index) => {
                const dataObj = new Date(foto.dataInsercao);
                const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const imgTag = fotosBase64[index]
                    ? `<img src="${fotosBase64[index]}" style="width: 340px; height: auto; display: block; margin: 0 auto;" />`
                    : 'Erro ao carregar imagem';

                return `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 10px; text-align: center; color: #000; vertical-align: middle;">${escaparHtml(String(foto.idPiezometro || 'N/A'))}</td>
                        <td style="border: 1px solid #ccc; padding: 10px; text-align: center; color: #000; vertical-align: middle;">${escaparHtml(dataFormatada)}</td>
                        <td style="border: 1px solid #ccc; padding: 10px; text-align: center; color: #000; vertical-align: middle;">${escaparHtml(horaFormatada)}</td>
                        <td style="border: 1px solid #ccc; padding: 10px; text-align: center; color: #000; vertical-align: middle;">${imgTag}</td>
                    </tr>
                `;
            }).join('');

            tabelaFotosHtml = `
                <div style="margin-top: 30px; page-break-before: auto;">
                    <h4 style="color: #000; margin-bottom: 15px;">Fotos de Inspeção</h4>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
                        <thead>
                            <tr style="background-color: #f4f4f4;">
                                <th style="border: 1px solid #ccc; padding: 8px; color: #000;">Ponto</th>
                                <th style="border: 1px solid #ccc; padding: 8px; color: #000;">Data</th>
                                <th style="border: 1px solid #ccc; padding: 8px; color: #000;">Hora</th>
                                <th style="border: 1px solid #ccc; padding: 8px; color: #000;">Foto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasTabelaFotos}
                        </tbody>
                    </table>
                </div>
            `;
        }

        const htmlString = `
            <div style="font-family: Arial; padding: 20px;">
                <h3 style="color: #000; margin-bottom: 20px;">${escaparHtml(obterNomePiezometro())}:</h3>
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${urlImagemGrafico}" style="width: 600px;" />
                </div>
                <div style="margin-top: 20px; color: #000;">
                    ${linhasAnaliseHtml} 
                </div>
                ${tabelaFotosHtml}
            </div>
        `;

        const opcoes = {
            orientation: 'landscape' as const,
            margins: { top: 720, right: 720, bottom: 720, left: 720, header: 360, footer: 360 },
            header: true,
            footer: true,
            headerType: 'default' as const,
            footerType: 'default' as const
        };

        try {
            const htmlToDocx = (await import('html-to-docx')).default;

            const base64Logo = await convertImageToBase64('/assets/logo-melhor.jpg');

            const headerHTML = `
                <div style="width: 100%; text-align: left;">
                    <img src="${base64Logo}" alt="Rio Deserto" style="height: 75px; width: 264px;" />
                </div>
            `;

            const footerHTML = `
                <div style="width: 100%; text-align: center; font-family: Arial, sans-serif; font-size: 10px; color: #333;">
                    <p style="text-align: center; width: 100%; margin: 0;">Avenida Getúlio Vargas, 515 - 88801 500 - Criciúma - SC - Brasil</p>
                    <p style="text-align: center; width: 100%; margin: 0;">+55 48 3431 9444   <strong>www.riodeserto.com.br</strong></p>
                </div>
            `;

            // Mantém compatibilidade com a tipagem (@types/html-to-docx) e com a assinatura
            // usada anteriormente no projeto: (html, headerHTML, options, footerHTML).
            const blobDocx = await gerarBlobDocx(htmlString, headerHTML, opcoes, footerHTML);
            saveAs(blobDocx, `relatorio-piezometro-${obterNomePiezometro()}.docx`);
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

