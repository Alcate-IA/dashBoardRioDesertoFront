'use client';

import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { getPiezometros } from "@/service/nivelEstaticoApis";

export interface PiezometroOpcao {
    label: string;
    value: number;
    tipo: string;
}

export interface FiltrosNivelEstatico {
    /** Um ou mais piezômetros selecionados (vazio = nenhum). */
    idsSelecionados: number[];
    /** Tipo do primeiro selecionado (para compatibilidade e gráfico). */
    tipoSelecionado: string | null;
    tipoFiltroSelecionado: string | null;
    dataInicio: Date | null;
    dataFim: Date | null;
    porDia: boolean;
    situacao: string | null;
}

/**
 * Hook especializado em gerenciar os filtros e as opções de piezômetros para a tela de Nível Estático.
 * 
 * Responsável por:
 * 1. Manter o estado dos filtros (Piezômetro, Período, Tipo de Visualização).
 * 2. Buscar as opções de piezômetros ativos no banco de dados.
 * 3. Filtrar a lista de piezômetros por categoria (PP, PR, PV, PC).
 */
export const useFiltrosNivelEstatico = () => {
    const [filtros, setFiltros] = useState<FiltrosNivelEstatico>({
        idsSelecionados: [],
        tipoSelecionado: null,
        tipoFiltroSelecionado: null,
        dataInicio: null,
        dataFim: null,
        porDia: false,
        situacao: 'A'
    });

    const [piezometros, setPiezometros] = useState<PiezometroOpcao[]>([]);
    const [estaCarregandoOpcoes, setEstaCarregandoOpcoes] = useState(false);

    // Opções constantes para o dropdown de categoria/tipo
    const opcoesFiltroTipo = [
        { label: "Todos os Tipos", value: null },
        { label: "PP - Piezômetro de Profundidade", value: "PP" },
        { label: "PR - Régua", value: "PR" },
        { label: "PV - Ponto de Vazão", value: "PV" },
        { label: "PC - Calhas", value: "PC" },
        { label: "PB - Piezômetro de Bacia", value: "PB" },
    ];

    const opcoesFiltroSituacao = [
        { label: "Ativo", value: "A" },
        { label: "Inativo", value: "I" },
        { label: "Todos", value: null },
    ];

    // Carrega a lista de piezômetros baseada na categoria selecionada
    const carregarPiezometros = useCallback(async (tipoCategoria: string | null, situacao: string | null) => {
        setEstaCarregandoOpcoes(true);
        try {
            const filtroArray = tipoCategoria ? [tipoCategoria] : null;
            const resposta = await getPiezometros(situacao, filtroArray);

            const formatados = resposta.data.map((p: any) => ({
                label: `${p.idPiezometro} - ${p.nomePiezometro} (${p.tipoPiezometro || 'N/A'})`,
                value: p.cdPiezometro,
                tipo: p.tipoPiezometro
            }));

            setPiezometros(formatados);

            // Se algum piezômetro selecionado não existir na nova lista (após mudar categoria), removemos da seleção
            setFiltros(prev => {
                const idsValidos = prev.idsSelecionados.filter(id => formatados.some((p: any) => p.value === id));
                const mudou = idsValidos.length !== prev.idsSelecionados.length;
                const tipo = idsValidos.length > 0
                    ? (formatados.find((p: any) => p.value === idsValidos[0])?.tipo ?? null)
                    : null;
                return mudou ? { ...prev, idsSelecionados: idsValidos, tipoSelecionado: tipo } : prev;
            });
        } catch (erro) {
            console.error("Erro ao carregar piezômetros para o filtro:", erro);
            Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível carregar a lista de piezômetros." });
        } finally {
            setEstaCarregandoOpcoes(false);
        }
    }, []);

    // Atualiza a lista sempre que o filtro de categoria mudar
    useEffect(() => {
        carregarPiezometros(filtros.tipoFiltroSelecionado, filtros.situacao);
    }, [filtros.tipoFiltroSelecionado, filtros.situacao, carregarPiezometros]);

    // Atualiza o estado dos filtros de forma genérica
    const atualizarFiltros = useCallback((novosFiltros: Partial<FiltrosNivelEstatico>) => {
        setFiltros(prev => ({ ...prev, ...novosFiltros }));
    }, []);

    /** Atualiza a lista de piezômetros selecionados (múltipla escolha). Define também o tipo pelo primeiro da lista. */
    const aoMudarPiezometros = useCallback((ids: number[] | null) => {
        const lista = ids && ids.length > 0 ? ids : [];
        const primeiro = lista[0];
        const encontrado = piezometros.find(p => p.value === primeiro);
        atualizarFiltros({
            idsSelecionados: lista,
            tipoSelecionado: encontrado?.tipo ?? null
        });
    }, [piezometros, atualizarFiltros]);

    return {
        filtros,
        piezometros,
        estaCarregandoOpcoes,
        opcoesFiltroTipo,
        opcoesFiltroSituacao,
        atualizarFiltros,
        aoMudarPiezometros
    };
};
