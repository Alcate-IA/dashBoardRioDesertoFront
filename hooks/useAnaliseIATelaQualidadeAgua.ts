'use client';

import { useState } from "react";
import Swal from "sweetalert2";
import { salvarAvaliacaoIAQualidadeAgua } from "@/service/qualidadeAguaApis";

/**
 * Hook para gerenciar a lógica de análise de IA na tela de Qualidade da Água.
 * 
 * @param analise Texto da análise atual (pode ter sido editado)
 * @param analiseOriginalIA Texto original retornado pela IA
 * @param aoSalvar Função chamada ao salvar a edição do texto
 * @param idZeus Código de identificação do ponto selecionado
 */
export const useAnaliseIATelaQualidadeAgua = (
    analise: string | null,
    analiseOriginalIA: string | null,
    aoSalvar: (texto: string) => void,
    idZeus: number | null
) => {
    const [estaEditando, setEstaEditando] = useState(false);
    const [textoEditado, setTextoEditado] = useState("");

    const aoAvaliar = () => {
        if (!idZeus) {
            Swal.fire({
                customClass: { container: 'swal-above-modal' },
                icon: 'warning',
                title: 'Atenção',
                text: 'Selecione um ponto para avaliar a análise.'
            });
            return;
        }

        Swal.fire({
            customClass: { container: 'swal-above-modal' },
            title: 'Avaliar Análise da IA',
            html: `
                <div class="flex flex-column gap-3">
                    <div class="flex flex-column align-items-start">
                        <label for="swal-rating" class="mb-2 font-bold">Nota (1 a 10):</label>
                        <input id="swal-rating" type="number" min="1" max="10" class="swal2-input w-full m-0" placeholder="1-10">
                    </div>
                    <div class="flex flex-column align-items-start mt-3">
                        <label for="swal-comment" class="mb-2 font-bold">Comentário:</label>
                        <textarea id="swal-comment" class="swal2-textarea w-full m-0" rows="5" placeholder="Digite seu comentário sobre a análise"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#22C55E',
            cancelButtonColor: '#64748B',
            preConfirm: () => {
                const inputNota = document.getElementById('swal-rating') as HTMLInputElement;
                const inputComentario = document.getElementById('swal-comment') as HTMLTextAreaElement;

                const nota = inputNota.value;
                const comentario = inputComentario.value;

                if (!nota || parseInt(nota) < 1 || parseInt(nota) > 10) {
                    Swal.showValidationMessage('Por favor, informe uma nota de 1 a 10');
                    return false;
                }
                return { nota: parseInt(nota), comentario };
            }
        }).then(async (resultado) => {
            if (resultado.isConfirmed) {
                try {
                    const editouAnalise = analise !== analiseOriginalIA;

                    const resposta = await salvarAvaliacaoIAQualidadeAgua({
                        idZeus: idZeus,
                        editouAnalise: editouAnalise,
                        analiseOriginal: analiseOriginalIA,
                        analiseEditada: editouAnalise ? (analise ?? undefined) : undefined,
                        nota: resultado.value.nota,
                        comentario: resultado.value.comentario
                    });

                    const { title, text } = resposta.data;

                    Swal.fire({
                        customClass: { container: 'swal-above-modal' },
                        icon: 'success',
                        title: title,
                        text: text,
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (erro: any) {
                    console.error('Erro ao salvar avaliação:', erro);
                    const { title, text } = erro.response?.data || {};
                    Swal.fire({
                        customClass: { container: 'swal-above-modal' },
                        icon: 'error',
                        title: title || 'Erro',
                        text: text || 'Não foi possível salvar a avaliação.'
                    });
                }
            }
        });
    };

    const aoEditar = () => {
        setTextoEditado(analise || "");
        setEstaEditando(true);
    };

    const aoSalvarEdicao = () => {
        aoSalvar(textoEditado);
        setEstaEditando(false);
    };

    const aoCancelarEdicao = () => {
        setTextoEditado("");
        setEstaEditando(false);
    };

    return {
        estaEditando,
        textoEditado,
        setTextoEditado,
        aoAvaliar,
        aoEditar,
        aoSalvarEdicao,
        aoCancelarEdicao
    };
};
