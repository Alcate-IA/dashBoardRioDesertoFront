"use client";

import { ProgressSpinner } from "primereact/progressspinner";

interface AnaliseIAProps {
    analise: string | null;
    carregando: boolean;
}

export default function AnaliseIA({ analise, carregando }: AnaliseIAProps) {
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
        return (
            <div className="card mt-4">
                <h5>Análise da IA de Nível Estático</h5>
                <p>{analise}</p>
            </div>
        );
    }

    return null;
}
