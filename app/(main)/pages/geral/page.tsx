"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiGeralContadores } from "@/service/visaoGeralApis";

interface ContadoresData {
    contadoresZeus: number;
    contadoresRdLab: number;
}

export default function GeralPage() {
    const router = useRouter();
    const [contadores, setContadores] = useState<ContadoresData>({ contadoresZeus: 0, contadoresRdLab: 0 });

    useEffect(() => {
        getApiGeralContadores()
            .then((response) => {
                setContadores(response.data);
            })
            .catch((error) => {
                console.error("Erro ao buscar contadores:", error);
            });
    }, []);

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <div className="flex align-items-center justify-content-between">
                        <div>
                            <h5 className="m-0">Visão Geral</h5>
                            <span className="text-500">Bem-vindo ao sistema de monitoramento Rio Deserto</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Nível Estático */}
            <div className="col-12 md:col-6 lg:col-4">
                <div
                    className="card mb-0 hover:surface-100 cursor-pointer transition-duration-200"
                    onClick={() => router.push('/pages/relatorio-nivel-estatico')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Nível Estático</span>
                            <div className="text-900 font-medium text-xl">
                                {contadores.contadoresZeus} Pontos
                            </div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-chart-line text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-blue-500 font-medium">Monitoramento </span>
                    <span className="text-500">de níveis e vazão</span>
                </div>
            </div>

            {/* Card Qualidade da Água */}
            <div className="col-12 md:col-6 lg:col-4">
                <div
                    className="card mb-0 hover:surface-100 cursor-pointer transition-duration-200"
                    onClick={() => router.push('/pages/qualidade-agua')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Qualidade da Água</span>
                            <div className="text-900 font-medium text-xl">{contadores.contadoresRdLab} Pontos</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-filter text-cyan-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-cyan-500 font-medium">Relatórios </span>
                    <span className="text-500">químicos</span>
                </div>
            </div>

            {/* Card Mapa */}
            <div className="col-12 md:col-6 lg:col-4">
                <div
                    className="card mb-0 hover:surface-100 cursor-pointer transition-duration-200"
                    onClick={() => router.push('/pages/mapa')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Mapa</span>
                            <div className="text-900 font-medium text-xl">Geolocalização</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-map-marker text-purple-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-purple-500 font-medium">Visualização </span>
                    <span className="text-500">espacial</span>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <h5>Resumo do Sistema</h5>
                    <p className="line-height-3 m-0">
                        Utilize os cards acima para navegar rapidamente entre os módulos do sistema.
                    </p>

                    <div className="mt-4 p-4 surface-50 border-round border-1 surface-border flex flex-column align-items-center justify-content-center text-500">
                        <i className="pi pi-chart-bar text-3xl mb-2"></i>
                        <span>Gráficos consolidados e alertas do sistema aparecerão aqui.</span>
                        <small className="text-400 mt-1">(Aguardando implementação de API de Resumo)</small>
                    </div>
                </div>
            </div>
        </div>
    );
}
