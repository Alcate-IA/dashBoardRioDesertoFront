"use client";

import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { getParametrosLegislacaoBuscaDadosRelacionados } from "@/service/api";
import { useState, useEffect } from "react";

interface FilterBarProps {
    opcoesFiltro: any[];
    tipoFiltroSelecionado: string | null;
    onTipoFiltroChange: (value: string | null) => void;

    pontos: any[];
    pontoSelecionado: number | null;
    onPontoChange: (value: number) => void;
    carregando: boolean;

    dataInicio: Date | null;
    dataFim: Date | null;
    onDataInicioChange: (value: Date | null) => void;
    onDataFimChange: (value: Date | null) => void;

    onBuscar: () => void;
    itensSelecionados: number[];
    onItensSelecionadosChange: (itens: number[]) => void;
    parametros: any[];
}

export default function FilterBar({
    opcoesFiltro,
    tipoFiltroSelecionado,
    onTipoFiltroChange,

    pontos,
    pontoSelecionado,
    onPontoChange,
    carregando,

    dataInicio,
    dataFim,
    onDataInicioChange,
    onDataFimChange,

    onBuscar,
    itensSelecionados,
    onItensSelecionadosChange,
    parametros,
}: FilterBarProps) {
    const [showFilters, setShowFilters] = useState(false);

    const onToggleSelectAll = (e: any) => {
        if (e.checked) {
            onItensSelecionadosChange(parametros.map(p => p.id_analise));
        } else {
            onItensSelecionadosChange([]);
        }
    };

    const onCheckboxChange = (id: number) => {
        let _selecionados = [...itensSelecionados];
        if (_selecionados.includes(id)) {
            _selecionados = _selecionados.filter(item => item !== id);
        } else {
            _selecionados.push(id);
        }
        onItensSelecionadosChange(_selecionados);
    };

    return (
        <div className="flex flex-column gap-3">
            <div className="card filter-bar">

                <div className="filter-item">
                    <span className="filter-label">Visualização</span>
                    <Dropdown
                        value={tipoFiltroSelecionado}
                        options={opcoesFiltro}
                        onChange={(e) => onTipoFiltroChange(e.value)}
                        placeholder="Selecione o tipo"
                        className="w-full md:w-15rem"
                        showClear
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Ponto de Monitoramento</span>
                    <Dropdown
                        value={pontoSelecionado}
                        options={pontos}
                        onChange={(e) => onPontoChange(e.value)}
                        placeholder={carregando ? "Carregando..." : "Selecione..."}
                        className="w-full md:w-14rem"
                        filter
                        showClear
                        disabled={carregando}
                        panelClassName="dropdown-panel-mobile"
                        appendTo="self"
                    />
                </div>

                <div className="filter-item">
                    <span className="filter-label">Período</span>
                    <div className="flex gap-2">
                        <Calendar
                            value={dataInicio}
                            onChange={(e: any) => onDataInicioChange(e.value)}
                            dateFormat="mm/yy"
                            view="month"
                            placeholder="Início"
                            showIcon
                            panelClassName="calendar-panel-fixed"
                            appendTo="self"
                        />
                        <Calendar
                            value={dataFim}
                            onChange={(e: any) => onDataFimChange(e.value)}
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
                            setShowFilters(!showFilters);
                        }}
                    >
                        {showFilters ? "Fechar Filtros" : "Filtros"}
                    </a>
                    <Button
                        label="APLICAR"
                        onClick={onBuscar}
                        className="p-button-warning font-bold"
                        disabled={carregando}
                    />
                </div>
            </div>

            {showFilters && (
                <div className="card p-3 fadein animation-duration-200">
                    <div className="grid">
                        <div className="col-12 mb-3 flex align-items-center gap-2">
                            <Checkbox
                                inputId="select-all"
                                onChange={onToggleSelectAll}
                                checked={itensSelecionados.length === parametros.length && parametros.length > 0}
                            />
                            <label htmlFor="select-all" className="font-bold cursor-pointer">Selecionar / desmarcar todos</label>
                        </div>
                        {parametros.map((param) => (
                            <div key={param.id_parametro_legislacao} className="col-12 md:col-4 lg:col-3 mb-2 flex align-items-center gap-2">
                                <Checkbox
                                    inputId={`param-${param.id_analise}`}
                                    onChange={() => onCheckboxChange(param.id_analise)}
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
