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
    const escaparHtml = (valor: string) =>
        valor
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');


    /**
     * Obtém apenas os containers de gráficos "válidos" evitando
     * clones gerados pelo Carousel do PrimeReact (que usa itens clonados
     * com a classe `p-carousel-item-cloned` para o modo circular).
     */
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

        // Fallback: grid simples (modo relatório) ou, se por algum motivo
        // a estrutura do Carousel mudar e não encontrarmos o content.
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

    /**
     * Captura o container completo do gráfico (header + gráfico) como imagem.
     * Temporariamente move o container para dentro da viewport para captura correta.
     */
    const capturarContainerCompletoComoImagem = async (container: HTMLElement): Promise<string> => {
        const html2canvas = (await import('html2canvas')).default;
        
        // Salva estilos originais
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
        
        // Move temporariamente para dentro da viewport para captura
        container.style.position = 'fixed';
        container.style.left = '0px';
        container.style.top = '0px';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        container.style.zIndex = '9999';
        container.style.pointerEvents = 'none';
        container.style.display = 'block';
        
        // Aguarda renderização
        await aguardarProximoFrame();
        await aguardarProximoFrame();
        
        try {
            const rect = container.getBoundingClientRect();
            const canvas = await html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 2, // Qualidade melhor
                useCORS: true,
                logging: false,
                width: rect.width || 1200,
                height: rect.height || 600,
                x: 0,
                y: 0
            });
            
            // Converte para JPEG (mais leve que PNG)
            return canvas.toDataURL('image/jpeg', 0.9);
        } catch (erro) {
            console.error('Erro ao capturar container:', erro);
            return '';
        } finally {
            // Restaura estilos originais
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
            const topoConteudoY = 1.0; // espaço para header
            const maxYTexto = pageHeight - 0.8; // espaço pro rodapé

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

            // Página(s) do texto
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

            // Gráficos: 2 por página, capturando o container completo (header + gráfico)
            const containersIndividuais = obterContainersGraficos(containerGraficos);
            const imagensGraficos: Array<{ data: string; width: number; height: number }> = [];

            // Primeiro, captura todas as imagens
            for (let i = 0; i < containersIndividuais.length; i++) {
                const container = containersIndividuais[i];

                // Dá um respiro entre capturas (evita travar navegador/IDE)
                // eslint-disable-next-line no-await-in-loop
                await aguardarProximoFrame();

                const imgData = await capturarContainerCompletoComoImagem(container);
                if (!imgData || imgData.length < 100) continue; // Valida se tem conteúdo

                // Obtém dimensões da imagem
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continua mesmo se falhar
                });

                imagensGraficos.push({
                    data: imgData,
                    width: img.width || 1200,
                    height: img.height || 600
                });
            }

            // Agora adiciona ao PDF: 2 gráficos por página
            const larguraDisponivel = pageWidth - margemX * 2;
            const alturaTotalDisponivel = pageHeight - topoConteudoY - 0.9;
            const espacoEntreGraficos = 0.2; // Espaço entre os dois gráficos (em polegadas)
            const alturaPorGrafico = (alturaTotalDisponivel - espacoEntreGraficos) / 2;

            for (let i = 0; i < imagensGraficos.length; i += 2) {
                pdf.addPage();
                desenharHeaderFooter();

                // Primeiro gráfico (topo)
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

                // Segundo gráfico (se existir)
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

        let htmlGraficos = '';
        const containersIndividuais = obterContainersGraficos(containerGraficos);

        for (const container of containersIndividuais) {
            // eslint-disable-next-line no-await-in-loop
            await aguardarProximoFrame();
            const imgData = await capturarContainerCompletoComoImagem(container);
            if (!imgData || imgData.length < 100) continue; // Valida se tem conteúdo
            
            htmlGraficos += `
                <div style="margin-top: 40px; margin-bottom: 40px; text-align: center; border: none; padding: 0;">
                    <img src="${imgData}" style="max-width: 600px; width: 100%; height: auto; display: block; margin: 0 auto; border: none; box-shadow: none;" />
                </div>
            `;
        }

        const textoAnalise = (elementoAnaliseIA as HTMLElement).innerText || '';
        const linhasAnalise = textoAnalise
            .split('\n')
            .map((linha) => `<p style="margin: 0;">${linha ? escaparHtml(linha) : '&nbsp;'}</p>`)
            .join('');

        const stringHtmlCompleta = `
            <div style="font-family: Arial; padding: 20px;">
                <h3 style="color: #000; margin-bottom: 20px;">${escaparHtml(nomeDoPonto)}:</h3>
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

            // Mantém compatibilidade com a tipagem (@types/html-to-docx) e com a assinatura
            // usada anteriormente no projeto: (html, headerHTML, options, footerHTML).
            const bufferArquivo = await htmlToDocx(stringHtmlCompleta, headerHTML, opcoesWord, footerHTML);

            // A lib pode retornar Buffer/Uint8Array/ArrayBuffer ou já um Blob.
            // Garante Blob final com MIME correto para evitar arquivo inválido no Word.
            const blobDocx =
                bufferArquivo instanceof Blob
                    ? bufferArquivo
                    : new Blob([bufferArquivo], {
                        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    });

            saveAs(blobDocx, "relatorio-qualidade.docx");
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
