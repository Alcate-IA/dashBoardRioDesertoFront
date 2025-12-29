"use client";

import { useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import Swal from "sweetalert2";
import { salvarAvaliacaoIAQualidadeAgua } from "@/service/qualidadeAguaApis";

interface AnaliseIAProps {
    analise: string | null;
    analiseOriginalIA: string | null;
    carregando: boolean;
    onSave: (text: string) => void;
    idZeus: number | null;
}

export default function AnaliseIA({ analise, analiseOriginalIA, carregando, onSave, idZeus }: AnaliseIAProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState("");

    const handleAvaliar = () => {
        if (!idZeus) {
            Swal.fire({
                icon: 'warning',
                title: 'Atenção',
                text: 'Selecione um ponto para avaliar a análise.'
            });
            return;
        }

        Swal.fire({
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
                const rating = (document.getElementById('swal-rating') as HTMLInputElement).value;
                const comment = (document.getElementById('swal-comment') as HTMLTextAreaElement).value;
                if (!rating || parseInt(rating) < 1 || parseInt(rating) > 10) {
                    Swal.showValidationMessage('Por favor, informe uma nota de 1 a 10');
                    return false;
                }
                return { rating: parseInt(rating), comment };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const editouAnalise = analise !== analiseOriginalIA;

                    const response = await salvarAvaliacaoIAQualidadeAgua({
                        idZeus: idZeus,
                        editouAnalise: editouAnalise,
                        analiseOriginal: analiseOriginalIA,
                        analiseEditada: editouAnalise ? (analise ?? undefined) : undefined,
                        nota: result.value.rating,
                        comentario: result.value.comment
                    });

                    const { title, text } = response.data;

                    Swal.fire({
                        icon: 'success',
                        title: title,
                        text: text,
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (error: any) {
                    console.error('Erro ao salvar avaliação:', error);
                    const { title, text } = error.response?.data || {};
                    Swal.fire({
                        icon: 'error',
                        title: title || 'Erro',
                        text: text || 'Não foi possível salvar a avaliação.'
                    });
                }
            }
        });
    };

    if (carregando) {
        return (
            <div className="card mt-4">
                <div className="flex align-items-center">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
                    <span className="ml-2 font-bold">IA analisando dados...</span>
                </div>
            </div>
        );
    }

    if (analise) {
        const handleEdit = () => {
            setEditedText(analise);
            setIsEditing(true);
        };

        const handleSave = () => {
            onSave(editedText);
            setIsEditing(false);
        };

        const handleCancel = () => {
            setEditedText("");
            setIsEditing(false);
        };

        return (
            <div className="card mt-4">
                <div className="flex justify-content-between align-items-center mb-3">
                    <h5 className="m-0">Análise da IA</h5>
                    {!isEditing ? (
                        <div className="flex gap-2">
                            <Button
                                label="Avaliar"
                                icon="pi pi-star"
                                onClick={handleAvaliar}
                                size="small"
                                severity="info"
                                outlined
                            />
                            <Button
                                label="Editar"
                                icon="pi pi-pencil"
                                onClick={handleEdit}
                                size="small"
                            />
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                label="Salvar"
                                icon="pi pi-check"
                                onClick={handleSave}
                                size="small"
                                severity="success"
                            />
                            <Button
                                label="Cancelar"
                                icon="pi pi-times"
                                onClick={handleCancel}
                                size="small"
                                severity="secondary"
                            />
                        </div>
                    )}
                </div>
                {!isEditing ? (
                    <div id="textoApareceNoPdf" style={{ whiteSpace: 'pre-line' }}>{analise}</div>
                ) : (
                    <InputTextarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        rows={15}
                        className="w-full"
                        autoResize
                    />
                )}
            </div>
        );
    }

    return null;
}
