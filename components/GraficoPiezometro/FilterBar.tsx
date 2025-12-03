//ISOLEI A BARRA DE FILTROS EM UM COMPONENTE PRÓPRIO PARA MELHOR ORGANIZAÇÃO DO CÓDIGO

'use client';

import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

interface FilterBarProps {
    opcoesFiltro: Array<{ label: string; value: string | null }>;
    tipoFiltroSelecionado: string | null;
    onTipoFiltroChange: (value: string | null) => void;
    
    piezometros: Array<{ label: string; value: number; tipo: string }>;
    idSelecionado: number | null;
    onPiezometroChange: (value: number) => void;
    carregando: boolean;
    
    dataInicio: Date | null;
    dataFim: Date | null;
    onDataInicioChange: (value: Date | null) => void;
    onDataFimChange: (value: Date | null) => void;
    
    onBuscar: () => void;
}

export default function FilterBar({
    opcoesFiltro,
    tipoFiltroSelecionado,
    onTipoFiltroChange,
    
    piezometros,
    idSelecionado,
    onPiezometroChange,
    carregando,
    
    dataInicio,
    dataFim,
    onDataInicioChange,
    onDataFimChange,
    
    onBuscar
}: FilterBarProps) {
    return (
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
                <span className="filter-label">Piezômetro</span>
                <Dropdown
                    value={idSelecionado}
                    options={piezometros}
                    onChange={(e) => onPiezometroChange(e.value)}
                    placeholder={carregando ? "Carregando..." : "Selecione..."}
                    className="w-full md:w-14rem"
                    filter
                    showClear
                    disabled={carregando}
                />
            </div>

            <div className="filter-item">
                <span className="filter-label">Período</span>
                <div className="flex gap-2">
                    <Calendar 
                        value={dataInicio} 
                        onChange={(e) => onDataInicioChange(e.value)} 
                        dateFormat="mm/yy" 
                        view="month" 
                        placeholder="Início" 
                        showIcon 
                    />
                    <Calendar 
                        value={dataFim} 
                        onChange={(e) => onDataFimChange(e.value)} 
                        dateFormat="mm/yy" 
                        view="month" 
                        placeholder="Fim" 
                        showIcon 
                    />
                </div>
            </div>

            <div className="ml-auto">
                <Button 
                    label="APLICAR" 
                    onClick={onBuscar} 
                    className="p-button-warning font-bold" 
                    disabled={carregando} 
                />
            </div>
        </div>
    );
}