"use client";

import { useState } from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

interface AnaliseIAProps {
    analise: string | null;
    carregando: boolean;
    onSave: (text: string) => void;
}

export default function AnaliseIA({ analise, carregando, onSave }: AnaliseIAProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState("");

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
                        <Button
                            label="Editar"
                            icon="pi pi-pencil"
                            onClick={handleEdit}
                            size="small"
                        />
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
