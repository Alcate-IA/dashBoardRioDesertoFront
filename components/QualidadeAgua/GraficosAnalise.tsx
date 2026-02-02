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

    const estiloCardGrafico = {
        backgroundColor: 'rgba(31, 41, 55, 0.98)',
        border: '1px solid #4b5563',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    };

    const templateGrafico = (grafico: any) => {
        return (
            <div className="p-2 h-full w-full">
                <div className="chart-container h-full p-3 relative" style={estiloCardGrafico}>
                    <div className="chart-header flex justify-content-between align-items-start mb-3" style={{ minHeight: '60px' }}>
                        <div>
                            <div className="text-xl font-bold" style={{ color: '#f9fafb' }}>{grafico.titulo}</div>
                            <div className="text-sm" style={{ color: grafico.temLegislacao ? '#9ca3af' : '#fb923c' }}>
                                {grafico.temLegislacao && <i className="pi pi-check-circle text-green-400 mr-1 text-xs"></i>}
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

    const estiloCardLegislacao = {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid #3b82f6',
        borderLeft: '4px solid #3b82f6',
        borderRadius: '8px',
        padding: '1rem 1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    };
    const estiloCardAusentes = {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        border: '1px solid #f97316',
        borderLeft: '4px solid #f97316',
        borderRadius: '8px',
        padding: '1rem 1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    };
    const estiloParametro = {
        backgroundColor: 'rgba(124, 45, 18, 0.9)',
        border: '1px solid #ea580c',
        borderRadius: '6px',
        color: '#fed7aa',
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: 600,
    };

    return (
        <div className="flex flex-column gap-4">
            {/* Seção de Legislações Aplicadas - card destacado */}
            {nomesLegislacoes.length > 0 && (
                <div style={estiloCardLegislacao} className="qualidade-agua-card">
                    <div className="font-medium text-xl mb-2" style={{ color: '#93c5fd' }}>
                        <i className="pi pi-book mr-2"></i>
                        Legislações Aplicadas
                    </div>
                    <ul className="m-0 pl-4" style={{ color: '#bfdbfe' }}>
                        {nomesLegislacoes.map((nome, i) => (
                            <li key={i} className="mb-1">{nome}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Seção de Análises Ausentes - card destacado com parâmetros em quadrados visíveis */}
            {analisesAusentes.length > 0 && (
                <div style={estiloCardAusentes} className="qualidade-agua-card">
                    <div className="font-medium text-xl mb-2" style={{ color: '#fdba74' }}>
                        <i className="pi pi-exclamation-triangle mr-2"></i>
                        Análises da Legislação Ausentes na Coleta
                    </div>
                    <p className="mb-3" style={{ color: '#fed7aa', fontSize: '0.9375rem' }}>
                        Os seguintes parâmetros são exigidos pela legislação mas não foram encontrados nas amostras:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {analisesAusentes.map((item, i) => (
                            <span
                                key={i}
                                style={estiloParametro}
                                className="inline-flex align-items-center flex-wrap"
                            >
                                <span>{item.nome_analise} ({item.simbolo})</span>
                                <span className="ml-2 text-xs pl-2" style={{ color: '#fcd34d', borderLeft: '1px solid rgba(234, 88, 12, 0.6)' }}>
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
                        <div className="chart-container p-4" style={estiloCardGrafico}>
                            <p className="text-center" style={{ color: '#9ca3af' }}>Nenhum dado analítico encontrado para exibir gráficos.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
