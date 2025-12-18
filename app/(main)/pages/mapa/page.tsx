"use client";

import { useState } from 'react';

import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";


export default function MapaPage() {
    const [zoom, setZoom] = useState(100);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 300));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50));
    };

    const handleResetZoom = () => {
        setZoom(100);
    };

    return (
        <div className="col-12">

            <div className="flex justify-content-between align-items-center mb-4">
                <h1 className="m-0">Mapa de Monitoramento Ambiental</h1>
            </div>

            <div className="card filter-bar">
                <div className="filter-item">
                    <span className="filter-label">Período</span>
                    <div className="flex gap-2">
                        <Calendar
                            dateFormat="mm/yy"
                            view="month"
                            placeholder="Início"
                            showIcon
                            panelClassName="calendar-panel-fixed"
                            appendTo="self"
                        />
                        <Calendar
                            dateFormat="mm/yy"
                            view="month"
                            placeholder="Fim"
                            showIcon
                            panelClassName="calendar-panel-fixed"
                            appendTo="self"
                        />
                    </div>
                </div>
                <div className="ml-auto">
                    <Button
                        label="APLICAR"
                        className="p-button-warning font-bold"
                    />
                </div>
            </div>


            <div className="flex gap-2 justify-content-end mb-4">
                <Button
                    icon="pi pi-search-minus"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    tooltip="Diminuir zoom"
                    tooltipOptions={{ position: 'bottom' }}
                />
                <Button
                    icon="pi pi-refresh"
                    onClick={handleResetZoom}
                    tooltip="Resetar zoom"
                    tooltipOptions={{ position: 'bottom' }}
                />
                <Button
                    icon="pi pi-search-plus"
                    onClick={handleZoomIn}
                    disabled={zoom >= 300}
                    tooltip="Aumentar zoom"
                    tooltipOptions={{ position: 'bottom' }}
                />
                <span className="flex align-items-center ml-2 text-sm text-600">
                    {zoom}%
                </span>
            </div>

            <div className="surface-card shadow-2 border-round p-3" style={{ height: 'calc(100vh - 200px)' }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    backgroundColor: '#f8f9fa',
                    padding: '1rem'
                }}>
                    <img
                        src="/assets/Mapa%20Monitoramento%20Ambiental%20-%20Mina%20101-2_page-0001.jpg"
                        alt="Mapa de Monitoramento Ambiental - Mina 101-2"
                        style={{
                            minWidth: `${zoom}%`,
                            width: `${zoom}%`,
                            height: 'auto',
                            display: 'block',
                            transition: 'width 0.2s ease, min-width 0.2s ease'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}