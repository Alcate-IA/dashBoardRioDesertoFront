'use client';

import React from 'react';
import GraficoPiezometro from "@/components/GraficoPiezometro/index";

/**
 * Página principal do Dashboard (Home).
 */
const Dashboard = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <GraficoPiezometro />
            </div>
        </div>
    );
};

export default Dashboard;
