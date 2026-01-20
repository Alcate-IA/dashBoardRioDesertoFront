'use client';

import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

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

    const gerarPDF = async () => {
        const elementoAnaliseIA = document.getElementById("textoApareceNoPdf");
        const containerGraficos = document.getElementById("analises-scrap");

        if (!elementoAnaliseIA || !containerGraficos) {
            console.error("Não foi possível encontrar os elementos para gerar o PDF.");
            Swal.fire({
                icon: 'error',
                title: 'Erro na Exportação',
                text: 'Não foi possível encontrar os dados necessários para gerar o PDF.'
            });
            return;
        }

        const containerImpressaoFinal = document.createElement("div");
        containerImpressaoFinal.style.padding = "0.5in";
        containerImpressaoFinal.style.width = "10in";
        containerImpressaoFinal.style.backgroundColor = "#fff";
        containerImpressaoFinal.style.margin = "0 auto";

        const pontoEncontrado = pontos.find(p => p.value === pontoSelecionado);
        const nomeDoPonto = pontoEncontrado ? pontoEncontrado.label : 'Ponto Selecionado';

        const tituloPonto = document.createElement("h3");
        tituloPonto.textContent = `${nomeDoPonto}:`;
        tituloPonto.style.marginBottom = "20px";
        tituloPonto.style.color = "#000";

        containerImpressaoFinal.appendChild(tituloPonto);

        const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText;
        const containerAnalise = document.createElement('div');
        containerAnalise.style.marginBottom = '20px';
        containerAnalise.style.width = '100%';

        const linhas = textoAnalise.split('\n');
        linhas.forEach(linha => {
            const p = document.createElement('p');
            p.textContent = linha || '\u00A0';
            p.style.color = 'black';
            p.style.margin = '0';
            p.style.lineHeight = '1.5';
            containerAnalise.appendChild(p);
        });
        containerImpressaoFinal.appendChild(containerAnalise);

        const containersIndividuais = containerGraficos.querySelectorAll('.chart-container');

        containersIndividuais.forEach((container) => {
            const cloneContainer = container.cloneNode(true) as HTMLElement;

            cloneContainer.classList.remove('h-full');
            cloneContainer.style.height = 'auto';
            cloneContainer.style.width = '100%';
            cloneContainer.style.display = 'block';

            const canvasOriginal = container.querySelector('canvas');
            const canvasClonado = cloneContainer.querySelector('canvas');

            if (canvasOriginal && canvasClonado) {
                const imagem = document.createElement('img');
                imagem.src = canvasOriginal.toDataURL("image/png");
                imagem.style.width = '100%';
                imagem.style.height = 'auto';
                imagem.style.display = 'block';
                const pai = canvasClonado.parentNode as HTMLElement;
                if (pai) {
                    pai.replaceChild(imagem, canvasClonado);
                    pai.style.height = 'auto';
                    pai.style.width = '100%';
                    pai.style.position = 'static';
                    pai.className = '';
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

            cloneContainer.style.width = '90%';
            cloneContainer.style.margin = '0';
            cloneContainer.style.textAlign = 'left';

            wrapper.appendChild(cloneContainer);
            containerImpressaoFinal.appendChild(wrapper);
        });

        try {
            const html2pdf = (await import("html2pdf.js")).default;

            const configuracoes = {
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

            html2pdf().from(containerImpressaoFinal).set(configuracoes).save();
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
        const containerGraficos = document.getElementById("analises-scrap");

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

        let htmlGraficos = '';
        const containersIndividuais = containerGraficos.querySelectorAll('.chart-container');

        containersIndividuais.forEach((container) => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                const dataUrlGrafico = canvas.toDataURL("image/png");
                htmlGraficos += `
                    <div style="margin-top: 40px; margin-bottom: 40px; text-align: center;">
                        <img src="${dataUrlGrafico}" style="width: 600px;" />
                    </div>
                `;
            }
        });

        const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText;
        const linhasAnalise = textoAnalise.split('\n').map(linha => `<p style="margin: 0;">${linha || '&nbsp;'}</p>`).join('');

        const stringHtmlCompleta = `
            <div style="font-family: Arial; padding: 20px;">
                <h3 style="color: #000; margin-bottom: 20px;">${nomeDoPonto}:</h3>
                <div style="margin-bottom: 20px; color: #000;">
                    ${linhasAnalise}
                </div>
                ${htmlGraficos}
            </div>
        `;

        const opcoesWord = {
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

            const bufferArquivo = await htmlToDocx(stringHtmlCompleta, headerHTML, opcoesWord, footerHTML);
            saveAs(bufferArquivo as Blob, "relatorio-qualidade.docx");
        } catch (error) {
            console.error("Erro ao gerar Word:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao gerar Word',
                text: 'Ocorreu um problema ao tentar exportar para Word.'
            });
        }
    };

    return {
        gerarPDF,
        gerarWord
    };
};
