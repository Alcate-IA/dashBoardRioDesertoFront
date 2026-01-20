"use client";

import React from 'react';
import { Chart } from 'primereact/chart';
import { Carousel } from 'primereact/carousel';
import { useGraficosAnaliseTelaQualidadeAgua, DadosQualidadeAgua } from '@/hooks/useGraficosAnaliseTelaQualidadeAgua';

interface PropriedadesGrafico {
    dados: DadosQualidadeAgua;
    ehRelatorio?: boolean;
}

/**
 * Componente que renderiza os gráficos de análise de qualidade da água.
 * 
 * Utiliza um carrossel para navegação entre os diferentes parâmetros analisados
 * e destaca os limites das legislações aplicáveis.
 */
export default function GraficosAnalise({ dados, ehRelatorio = false }: PropriedadesGrafico) {
    const {
        listaGraficos,
        analisesAusentes,
        nomesLegislacoes
    } = useGraficosAnaliseTelaQualidadeAgua(dados);

    const opcoesResponsividade = [
        { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
        { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
        { breakpoint: '767px', numVisible: 1, numScroll: 1 }
    ];

    const pluginBackground = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart: any) => {
            const { ctx } = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };

    const templateGrafico = (grafico: any) => {
        return (
            <div className="p-2 h-full w-full">
                <div className="chart-container h-full surface-card p-3 shadow-2 border-round relative">
                    <div className="chart-header flex justify-content-between align-items-start mb-3" style={{ minHeight: '60px' }}>
                        <div>
                            <div className="text-xl font-bold text-900">{grafico.titulo}</div>
                            <div className={`text-sm ${grafico.temLegislacao ? 'text-600' : 'text-orange-500'}`}>
                                {grafico.temLegislacao && <i className="pi pi-check-circle text-green-500 mr-1 text-xs"></i>}
                                {!grafico.temLegislacao && <i className="pi pi-info-circle mr-1 text-xs"></i>}
                                {grafico.subtitulo}
                            </div>
                        </div>
                    </div>
                    <Chart type="line" data={grafico.dadosGrafico} options={grafico.opcoes} plugins={[pluginBackground]} height="300px" />
                </div>
            </div>
        );
    };

    if (!dados || !dados.amostras) return null;

    return (
        <div className="flex flex-column gap-4">
            {/* Seção de Legislações Aplicadas */}
            {nomesLegislacoes.length > 0 && (
                <div className="surface-card p-4 shadow-2 border-round border-left-3 border-blue-500 bg-blue-50">
                    <div className="text-blue-900 font-medium text-xl mb-2">
                        <i className="pi pi-book mr-2"></i>
                        Legislações Aplicadas
                    </div>
                    <ul className="m-0 pl-4 text-blue-700">
                        {nomesLegislacoes.map((nome, i) => (
                            <li key={i} className="mb-1">{nome}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Seção de Análises Ausentes */}
            {analisesAusentes.length > 0 && (
                <div className="surface-card p-4 shadow-2 border-round border-left-3 border-orange-500 bg-orange-50">
                    <div className="text-orange-900 font-medium text-xl mb-2">
                        <i className="pi pi-exclamation-triangle mr-2"></i>
                        Análises da Legislação Ausentes na Coleta
                    </div>
                    <p className="text-orange-700 mb-3">Os seguintes parâmetros são exigidos pela legislação mas não foram encontrados nas amostras:</p>
                    <div className="flex flex-wrap gap-2">
                        {analisesAusentes.map((item, i) => (
                            <span key={i} className="inline-flex align-items-center px-3 py-1 border-round bg-orange-100 text-orange-800 text-sm font-semibold border-1 border-orange-200">
                                {item.nome_analise} ({item.simbolo})
                                <span className="ml-2 text-xs opacity-70 border-left-1 border-orange-300 pl-2 ">
                                    {item.legislacoes.map((leg: any) => `${leg.nome}: ${leg.limite}`).join(' | ')}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Renderização dos Gráficos */}

            {/* 
                Container auxiliar apenas para exportação:
                - Renderiza todos os gráficos em grid, sem Carousel
                - Fica fora da tela, mas com DOM e canvas prontos para captura
            */}
            {listaGraficos.length > 0 && (
                <div
                    id="analises-export"
                    style={{
                        position: 'fixed',
                        left: '-10000px',
                        top: 0,
                        width: '1400px',
                        opacity: 0,
                        pointerEvents: 'none',
                        zIndex: -1,
                        visibility: 'hidden',
                    }}
                >
                    <div className="grid" style={{ width: '1400px' }}>
                        {listaGraficos.map((grafico, index) => (
                            <div key={`export-${index}`} className="col-12 mb-4" style={{ width: '100%' }}>
                                <div className="p-2" style={{ width: '100%' }}>
                                    <div className="chart-container surface-card p-3 shadow-2 border-round relative" style={{ width: '100%', minHeight: '400px' }}>
                                        <div className="chart-header flex justify-content-between align-items-start mb-3" style={{ minHeight: '60px' }}>
                                            <div>
                                                <div className="text-xl font-bold text-900">{grafico.titulo}</div>
                                                <div className={`text-sm ${grafico.temLegislacao ? 'text-600' : 'text-orange-500'}`}>
                                                    {grafico.temLegislacao && <i className="pi pi-check-circle text-green-500 mr-1 text-xs"></i>}
                                                    {!grafico.temLegislacao && <i className="pi pi-info-circle mr-1 text-xs"></i>}
                                                    {grafico.subtitulo}
                                                </div>
                                            </div>
                                        </div>
                                        <Chart type="line" data={grafico.dadosGrafico} options={grafico.opcoes} plugins={[pluginBackground]} height="300px" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div id="analises-scrap">
                {listaGraficos.length > 0 ? (
                    ehRelatorio ? (
                        <div className="grid">
                            {listaGraficos.map((grafico, index) => (
                                <div key={index} className="col-12 mb-4">
                                    {templateGrafico(grafico)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Carousel
                            value={listaGraficos}
                            numVisible={3}
                            numScroll={1}
                            responsiveOptions={opcoesResponsividade}
                            itemTemplate={templateGrafico}
                            circular
                            autoplayInterval={5000}
                        />
                    )
                ) : (
                    <div className="col-12">
                        <div className="chart-container surface-card p-4 shadow-2 border-round">
                            <p className="text-center text-600">Nenhum dado analítico encontrado para exibir gráficos.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
