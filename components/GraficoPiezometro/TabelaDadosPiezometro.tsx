"use client";

import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface TabelaDado {
    mes_ano: string;
    nivel_estatico?: number;
    cota_superficie?: number;
    cota_base?: number;
    precipitacao?: number;
    vazao_bombeamento?: number;
    vazao_calha?: number;
}

interface PropriedadesTabelaDadosPiezometro {
    dados: TabelaDado[];
    tipoSelecionado: string | null;
    porDia: boolean;
}

/**
 * Componente responsável por renderizar a tabela de resultados do piezômetro.
 * 
 * Segue o princípio de Responsabilidade Única (SRP) ao gerenciar a lógica
 * de exibição das colunas com base no tipo de piezômetro.
 */
export default function TabelaDadosPiezometro({
    dados,
    tipoSelecionado,
    porDia,
}: PropriedadesTabelaDadosPiezometro) {

    const eTipoCalhasOuPontoVazao = (tipo: string): boolean => {
        return tipo === "PC" || tipo === "PV";
    };

    const renderizarColunas = () => {
        if (dados.length === 0 || !tipoSelecionado) return null;

        const ehPCouPV = eTipoCalhasOuPontoVazao(tipoSelecionado);

        let colunas = [
            <Column
                key="data"
                field="mes_ano"
                header="DATA"
                body={(linha) => {
                    if (porDia) {
                        const [ano, mes, dia] = linha.mes_ano.split("-");
                        return `${dia}/${mes}/${ano}`;
                    }
                    const [ano, mes] = linha.mes_ano.split("-");
                    return `${mes}/${ano}`;
                }}
                sortable
            />,
        ];

        if (tipoSelecionado === "PP") {
            colunas.push(
                <Column
                    key="nivel_estatico"
                    field="nivel_estatico"
                    header="N. ESTÁTICO (M)"
                    body={(d) => <span className="val-green">{d.nivel_estatico}</span>}
                    sortable
                />,
                <Column
                    key="cota_superficie"
                    field="cota_superficie"
                    header="COTA SUPERFÍCIE (M)"
                    body={(d) => <span className="val-orange">{d.cota_superficie}</span>}
                    sortable
                />,
                <Column
                    key="cota_base"
                    field="cota_base"
                    header="COTA BASE (M)"
                    body={(d) => <span className="val-purple">{d.cota_base}</span>}
                    sortable
                />,
                <Column
                    key="precipitacao"
                    field="precipitacao"
                    header="PRECIP. (MM)"
                    sortable
                />,
                <Column
                    key="vazao_bombeamento"
                    field="vazao_bombeamento"
                    header="VAZÃO MINA (M³/H)"
                    body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
                    sortable
                />
            );
        } else if (tipoSelecionado === "PR") {
            colunas.push(
                <Column
                    key="cota_superficie"
                    field="cota_superficie"
                    header="COTA (M)"
                    body={(d) => <span className="val-orange">{d.cota_superficie}</span>}
                    sortable
                />,
                <Column
                    key="nivel_estatico"
                    field="nivel_estatico"
                    header="N. ESTÁTICO (M)"
                    body={(d) => <span className="val-green">{d.nivel_estatico}</span>}
                    sortable
                />,
                <Column
                    key="precipitacao"
                    field="precipitacao"
                    header="PRECIP. (MM)"
                    sortable
                />,
                <Column
                    key="vazao_bombeamento"
                    field="vazao_bombeamento"
                    header="VAZÃO MINA (M³/H)"
                    body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
                    sortable
                />
            );
        } else if (ehPCouPV) {
            colunas.push(
                <Column
                    key="vazao_calha"
                    field="vazao_calha"
                    header="VAZÃO (M³/H)"
                    body={(d) => <span className="val-red">{d.vazao_calha}</span>}
                    sortable
                />,
                <Column
                    key="precipitacao"
                    field="precipitacao"
                    header="PRECIP. (MM)"
                    sortable
                />,
                <Column
                    key="vazao_bombeamento"
                    field="vazao_bombeamento"
                    header="VAZÃO MINA (M³/H)"
                    body={(d) => <span className="val-blue">{d.vazao_bombeamento}</span>}
                    sortable
                />
            );
        }

        return colunas;
    };

    return (
        <div className="card avoid-break">
            <h5 className="mb-4 text-white">
                Painel de Dados - {tipoSelecionado}
            </h5>
            <DataTable
                value={dados}
                paginator
                rows={10}
                className="p-datatable-sm"
                emptyMessage="Nenhum dado encontrado"
            >
                {renderizarColunas()}
            </DataTable>
        </div>
    );
}
