"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiGeralContadores, apiGeralUltimosMovimentosRdLab, apiGeralUltimosMovimentosZeus } from "@/service/visaoGeralApis";
import Swal from "sweetalert2";
import { Carousel } from 'primereact/carousel';

interface ContadoresData {
    contadoresZeus: number;
    contadoresRdLab: number;
}

interface MovimentoRdLab {
    data: string;
    identificacao: number;
    coletor: string;
    n_registro: number;
    codigo: number;
    id_zeus: number;
    cd_piezometro: number;
    nm_piezometro: string;
    nm_colaborador_inspecao?: string;
    //tp_piezometro?: string;
}

interface MovimentoZeus {
    origem: string;
    id: number;
    dt_inspecao: string;
    nivel_estatico: number | null;
    vazao: number | null;
    ds_observacao: string | null;
    colaborador: string;
    cd_piezometro: number;
    cd_empresa: number;
    id_piezometro: string;
    nm_piezometro: string;
    tp_piezometro: string;
}

export default function GeralPage() {
    const router = useRouter();
    const [contadores, setContadores] = useState<ContadoresData>({ contadoresZeus: 0, contadoresRdLab: 0 });
    const [movimentos, setMovimentos] = useState<MovimentoRdLab[]>([]);
    const [movimentosZeus, setMovimentosZeus] = useState<MovimentoZeus[]>([]);

    useEffect(() => {
        Swal.fire({
            title: 'Carregando...',
            text: 'Buscando informações...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        Promise.all([
            getApiGeralContadores(),
            apiGeralUltimosMovimentosRdLab(),
            apiGeralUltimosMovimentosZeus()
        ])
            .then(([resContadores, resMovimentos, resZeus]) => {
                setContadores(resContadores.data);
                setMovimentos(resMovimentos.data || []);
                setMovimentosZeus(resZeus.data || []);
                Swal.close();
            })
            .catch((error) => {
                console.error("Erro ao buscar dados da dashboard:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Falha ao carregar informações da dashboard.'
                });
            });

        return () => {
            Swal.close();
        };
    }, []);

    const handleNavigation = (path: string) => {
        Swal.fire({
            title: 'Carregando...',
            text: 'Acessando módulo...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
        router.push(path);
    };

    const templateMovimento = (movimento: MovimentoRdLab) => {
        const dataFormatada = movimento.data ? movimento.data.split('-').reverse().join('/') : '-';
        const nomeColaborador = movimento.nm_colaborador_inspecao || movimento.coletor;

        return (
            <div className="p-2">
                <div className="surface-card shadow-2 border-round p-3 h-full">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <span className="text-xl font-bold text-900">{movimento.nm_piezometro}</span>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-blue-500"></i>
                            <span className="text-700 font-medium">{dataFormatada}</span>
                        </div>
                    </div>

                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-user text-primary"></i>
                            <span className="text-600">Coletor:</span>
                            <span className="text-900 font-medium">{nomeColaborador}</span>
                        </div>

                        {/* <div className="flex align-items-center gap-2">
                            <i className="pi pi-tag text-primary"></i>
                            <span className="text-600">Tipo:</span>
                            <span className="text-900 font-medium">{movimento.tp_piezometro}</span>
                        </div> */}

                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-hashtag text-primary"></i>
                            <span className="text-600">Registro:</span>
                            <span className="text-900 font-medium">{movimento.n_registro}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const templateMovimentoZeus = (movimento: MovimentoZeus) => {
        const dataFormatada = movimento.dt_inspecao ? movimento.dt_inspecao.split('-').reverse().join('/') : '-';
        const ehNivel = movimento.tp_piezometro === 'PP' || movimento.tp_piezometro === 'PR';
        const ehVazao = movimento.tp_piezometro === 'PC' || movimento.tp_piezometro === 'PV';

        return (
            <div className="p-2">
                <div className="surface-card shadow-2 border-round p-3 h-full">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <span className="text-xl font-bold text-900">{movimento.nm_piezometro}</span>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-blue-500"></i>
                            <span className="text-700 font-medium">{dataFormatada}</span>
                        </div>
                    </div>

                    <div className="flex flex-column gap-2">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-user text-primary"></i>
                            <span className="text-600">Coletor:</span>
                            <span className="text-900 font-medium">{movimento.colaborador}</span>
                        </div>

                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-tag text-primary"></i>
                            <span className="text-600">Tipo:</span>
                            <span className="text-900 font-medium">{movimento.tp_piezometro}</span>
                        </div>

                        {ehNivel && (
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-chart-line text-blue-500"></i>
                                <span className="text-600">Nível Estático:</span>
                                <span className="text-900 font-medium">{movimento.nivel_estatico} m</span>
                            </div>
                        )}

                        {ehVazao && (
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-water text-blue-500"></i>
                                <span className="text-600">Vazão:</span>
                                <span className="text-900 font-medium">{movimento.vazao !== null ? movimento.vazao : '-'}</span>
                            </div>
                        )}

                        {movimento.ds_observacao && (
                            <div className="flex align-items-start gap-2 mt-2 pt-2 border-top-1 border-200">
                                <i className="pi pi-info-circle text-orange-500 mt-1"></i>
                                <span className="text-600 text-sm font-italic">{movimento.ds_observacao}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
                    onClick={() => handleNavigation('/pages/relatorio-nivel-estatico')}
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
                    onClick={() => handleNavigation('/pages/qualidade-agua')}
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
                    onClick={() => handleNavigation('/pages/mapa')}
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

            {/* Carrossel de Últimos Movimentos RD Lab */}
            <div className="col-12">
                <div className="card">
                    <h5>Últimos Movimentos RD Lab</h5>
                    {movimentos.length > 0 ? (
                        <Carousel
                            value={movimentos}
                            numVisible={3}
                            numScroll={1}
                            responsiveOptions={[
                                { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '767px', numVisible: 1, numScroll: 1 }
                            ]}
                            itemTemplate={templateMovimento}
                            circular
                            autoplayInterval={5000}
                        />
                    ) : (
                        <div className="p-4 text-center text-500">
                            Nenhum movimento recente encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Carrossel de Últimos Movimentos Zeus */}
            <div className="col-12">
                <div className="card">
                    <h5>Últimos Movimentos Zeus</h5>
                    {movimentosZeus.length > 0 ? (
                        <Carousel
                            value={movimentosZeus}
                            numVisible={3}
                            numScroll={1}
                            responsiveOptions={[
                                { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
                                { breakpoint: '767px', numVisible: 1, numScroll: 1 }
                            ]}
                            itemTemplate={templateMovimentoZeus}
                            circular
                            autoplayInterval={5000}
                        />
                    ) : (
                        <div className="p-4 text-center text-500">
                            Nenhum movimento recente encontrado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
