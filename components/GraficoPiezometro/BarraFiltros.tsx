"use client";

import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

interface OpcaoFiltro {
    label: string;
    value: string | null;
}

interface OpcaoFiltroSituacao {
    label: string;
    value: string | null;
}

interface OpcaoPiezometro {
    label: string;
    value: number;
}

interface PropriedadesBarraFiltros {
    opcoesFiltro: OpcaoFiltro[];
    tipoFiltroSelecionado: string | null;
    aoMudarTipoFiltro: (valor: string | null) => void;

    opcoesFiltroSituacao: OpcaoFiltroSituacao[];
    situacaoSelecionada: string | null;
    aoMudarSituacao: (valor: string | null) => void;

    piezometros: OpcaoPiezometro[];
    idsSelecionados: number[];
    aoMudarPiezometros: (valor: number[] | null) => void;
    estaCarregando: boolean;

    dataInicio: Date | null;
    dataFim: Date | null;
    aoMudarDataInicio: (valor: Date | null) => void;
    aoMudarDataFim: (valor: Date | null) => void;

    porDia: boolean;
    aoMudarPorDia: (valor: boolean) => void;

    aoBuscar: () => void;
}

/**
 * Componente de barra de filtros para o gráfico de piezômetros.
 *  */
export default function BarraFiltros({
    opcoesFiltroSituacao,
    situacaoSelecionada,
    aoMudarSituacao,
    opcoesFiltro,
    tipoFiltroSelecionado,
    aoMudarTipoFiltro,
    piezometros,
    idsSelecionados,
    aoMudarPiezometros,
    estaCarregando,
    dataInicio,
    dataFim,
    aoMudarDataInicio,
    aoMudarDataFim,
    porDia,
    aoMudarPorDia,
    aoBuscar,
}: PropriedadesBarraFiltros) {
    return (
        <div className="card filter-bar">
            <div className="filter-bar-row">
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

                <div className="filter-item filter-item-piezometro">
                    <span className="filter-label">Piezômetro(s)</span>
                    <div className="piezometro-campo-wrapper">
                        <MultiSelect
                            value={idsSelecionados}
                            options={piezometros}
                            onChange={(e) => aoMudarPiezometros(e.value)}
                            placeholder={estaCarregando ? "Carregando..." : "Selecione um ou mais..."}
                            className="w-full md:w-18rem piezometro-select-sem-chip"
                            filter
                            showClear
                            disabled={estaCarregando}
                            panelClassName="dropdown-panel-mobile"
                            selectedItemsLabel={
                                idsSelecionados.length > 1 ? "{0} piezômetros selecionados" : undefined
                            }
                        />
                    </div>
                </div>

                <div className="filter-item">
                <span className="filter-label">Período</span>
                <div className="flex gap-2">
                    <Calendar
                        value={dataInicio}
                        onChange={(e: any) => aoMudarDataInicio(e.value)}
                        dateFormat={porDia ? "dd/mm/yy" : "mm/yy"}
                        view={porDia ? "date" : "month"}
                        placeholder="Início"
                        showIcon
                        panelClassName="calendar-panel-fixed"
                        appendTo="self"
                    />
                    <Calendar
                        value={dataFim}
                        onChange={(e: any) => aoMudarDataFim(e.value)}
                        dateFormat={porDia ? "dd/mm/yy" : "mm/yy"}
                        view={porDia ? "date" : "month"}
                        placeholder="Fim"
                        showIcon
                        panelClassName="calendar-panel-fixed"
                        appendTo="self"
                    />
                </div>
            </div>

            <div className="filter-item" style={{ flexDirection: 'row', alignItems: 'center', paddingTop: '1.25rem' }}>
                <Checkbox
                    inputId="porDia"
                    checked={porDia}
                    onChange={(e) => aoMudarPorDia(e.checked || false)}
                />
                <label htmlFor="porDia" className="ml-2 cursor-pointer font-bold" style={{ color: '#ccc' }}>
                    Por dia
                </label>
            </div>

                <div className="ml-auto">
                    <Button
                        label="APLICAR"
                        onClick={aoBuscar}
                        className="p-button-warning font-bold"
                        disabled={estaCarregando}
                    />
                </div>
            </div>

            {idsSelecionados.length > 0 && (
                <div className="filter-bar-selecionados-row">
                    <ul className="lista-piezometros-selecionados">
                        {idsSelecionados.map((id) => {
                            const item = piezometros.find((p) => p.value === id);
                            const label = item?.label ?? String(id);
                            return (
                                <li key={id}>
                                    <span>{label}</span>
                                    <button
                                        type="button"
                                        className="p-button p-button-text p-button-rounded p-button-icon-only p-button-sm"
                                        onClick={() => aoMudarPiezometros(idsSelecionados.filter((x) => x !== id))}
                                        aria-label="Remover piezômetro"
                                    >
                                        <i className="pi pi-times" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
