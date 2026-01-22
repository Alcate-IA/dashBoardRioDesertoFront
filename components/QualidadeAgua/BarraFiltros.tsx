"use client";

import React from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { useBarraFiltrosQualidadeAgua } from "@/hooks/useBarraFiltrosQualidadeAgua";

interface OpcaoFiltro {
    label: string;
    value: string | null;
}

interface OpcaoFiltroSituacao {
    label: string;
    value: string | null;
}

interface PontoMonitoramento {
    label: string;
    value: number;
}

interface ParametroLegislacao {
    id_analise: number;
    id_parametro_legislacao: number;
    nome: string;
    simbolo: string;
}

interface PropriedadesBarraFiltros {
    opcoesFiltro: OpcaoFiltro[];
    tipoFiltroSelecionado: string | null;
    aoMudarTipoFiltro: (valor: string | null) => void;

    opcoesFiltroSituacao: OpcaoFiltroSituacao[];
    situacaoSelecionada: string | null;
    aoMudarSituacao: (valor: string | null) => void;

    pontos: PontoMonitoramento[];
    pontoSelecionado: number | null;
    aoMudarPonto: (valor: number) => void;
    estaCarregando: boolean;

    dataInicio: Date | null;
    dataFim: Date | null;
    aoMudarDataInicio: (valor: Date | null) => void;
    aoMudarDataFim: (valor: Date | null) => void;

    aoBuscar: () => void;
    itensSelecionados: number[];
    aoMudarItensSelecionados: (itens: number[]) => void;
    parametros: ParametroLegislacao[];
}

/**
 * Componente de barra de filtros para a tela de Qualidade da Água.
 * 
 * Permite filtrar por tipo de piezômetro, ponto de monitoramento, período
 * e seleção específica de parâmetros analíticos.
 */
export default function BarraFiltros({
    opcoesFiltroSituacao,
    situacaoSelecionada,
    aoMudarSituacao,
    opcoesFiltro,
    tipoFiltroSelecionado,
    aoMudarTipoFiltro,
    pontos,
    pontoSelecionado,
    aoMudarPonto,
    estaCarregando,
    dataInicio,
    dataFim,
    aoMudarDataInicio,
    aoMudarDataFim,
    aoBuscar,
    itensSelecionados,
    aoMudarItensSelecionados,
    parametros,
}: PropriedadesBarraFiltros) {
    const {
        mostrarFiltrosExtras,
        aoAlternarTodos,
        aoAlternarParametro,
        alternarVisibilidadeFiltros
    } = useBarraFiltrosQualidadeAgua(parametros, itensSelecionados, aoMudarItensSelecionados);

    return (
        <div className="flex flex-column gap-3">
            <div className="card filter-bar">
                <div className="filter-item">
                    <span className="filter-label">Visualização</span>
                    <Dropdown
                        value={tipoFiltroSelecionado}
                        options={opcoesFiltro}
                        onChange={(e) => aoMudarTipoFiltro(e.value)}
                        placeholder="Selecione o tipo"
                        className="w-full md:w-15rem"
                        showClear
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Situação</span>
                    <Dropdown
                        value={situacaoSelecionada}
                        options={opcoesFiltroSituacao}
                        onChange={(e) => aoMudarSituacao(e.value)}
                        placeholder="Selecione a situação"
                        className="w-full md:w-15rem"
                        showClear
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Ponto de Monitoramento</span>
                    <Dropdown
                        value={pontoSelecionado}
                        options={pontos}
                        onChange={(e) => aoMudarPonto(e.value)}
                        placeholder={estaCarregando ? "Carregando..." : "Selecione..."}
                        className="w-full md:w-14rem"
                        filter
                        showClear
                        disabled={estaCarregando}
                        panelClassName="dropdown-panel-mobile"
                        appendTo="self"
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Período</span>
                    <div className="flex gap-2">
                        <Calendar
                            value={dataInicio}
                            onChange={(e: any) => aoMudarDataInicio(e.value)}
                            dateFormat="mm/yy"
                            view="month"
                            placeholder="Início"
                            showIcon
                            panelClassName="calendar-panel-fixed"
                            appendTo="self"
                        />
                        <Calendar
                            value={dataFim}
                            onChange={(e: any) => aoMudarDataFim(e.value)}
                            dateFormat="mm/yy"
                            view="month"
                            placeholder="Fim"
                            showIcon
                            panelClassName="calendar-panel-fixed"
                            appendTo="self"
                        />
                    </div>
                </div>

                <div className="ml-auto flex align-items-center gap-3">
                    <a
                        href="#"
                        className="text-primary font-bold no-underline"
                        onClick={(e) => {
                            e.preventDefault();
                            alternarVisibilidadeFiltros();
                        }}
                    >
                        {mostrarFiltrosExtras ? "Fechar Filtros" : "Filtros"}
                    </a>
                    <Button
                        label="APLICAR"
                        onClick={aoBuscar}
                        className="p-button-warning font-bold"
                        disabled={estaCarregando}
                    />
                </div>
            </div>

            {mostrarFiltrosExtras && (
                <div className="card p-3 fadein animation-duration-200">
                    <div className="grid">
                        <div className="col-12 mb-3 flex align-items-center gap-2">
                            <Checkbox
                                inputId="select-all"
                                onChange={(e) => aoAlternarTodos(e.checked || false)}
                                checked={itensSelecionados.length === parametros.length && parametros.length > 0}
                            />
                            <label htmlFor="select-all" className="font-bold cursor-pointer">Selecionar / desmarcar todos</label>
                        </div>
                        {parametros.map((param) => (
                            <div key={param.id_parametro_legislacao} className="col-12 md:col-4 lg:col-3 mb-2 flex align-items-center gap-2">
                                <Checkbox
                                    inputId={`param-${param.id_analise}`}
                                    onChange={() => aoAlternarParametro(param.id_analise)}
                                    checked={itensSelecionados.includes(param.id_analise)}
                                />
                                <label htmlFor={`param-${param.id_analise}`} className="cursor-pointer">
                                    {param.nome} ({param.simbolo})
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
