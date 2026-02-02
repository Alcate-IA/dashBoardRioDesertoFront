"use client";

import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { useFiltrosEParametrosQualidadeAgua } from "./useFiltrosEParametrosQualidadeAgua";
import { useExecucaoAnaliseQualidadeAgua } from "./useExecucaoAnaliseQualidadeAgua";

interface PropriedadesGerenciador {
    idPiezometroInicial?: number;
    mesAnoInicioInicial?: string;
    mesAnoFimInicial?: string;
    aplicarAutomaticamente?: boolean;
}

export interface ResultadoPontoQualidadeAgua {
    id: number;
    label: string;
    dadosColeta: any;
    analiseIA: string | null;
    analiseOriginalIA: string | null;
}

/**
 * Hook ORQUESTRADOR da tela de Qualidade da Água.
 * 
 * Este é o "cérebro" principal que conecta as outras ferramentas.
 * Responsável por:
 * 1. Combinar o estado dos filtros com a lógica de execução.
 * 2. Garantir que os resultados sejam limpos quando os filtros mudarem.
 * 3. Gerenciar o gatilho de busca automática.
 */
export const useGerenciadorRelatorioQualidadeAgua = ({
    idPiezometroInicial,
    mesAnoInicioInicial,
    mesAnoFimInicial,
    aplicarAutomaticamente = false
}: PropriedadesGerenciador) => {

    // 1. Ferramenta de Filtros e Opções
    const filtros = useFiltrosEParametrosQualidadeAgua({
        idPiezometroInicial,
        mesAnoInicioInicial,
        mesAnoFimInicial
    });

    // 2. Ferramenta de Execução de APIs e IA
    const execucao = useExecucaoAnaliseQualidadeAgua();

    const [foiAutoAplicado, setFoiAutoAplicado] = useState(false);
    const [resultadosPorPonto, setResultadosPorPonto] = useState<Record<number, ResultadoPontoQualidadeAgua>>({});
    const [estaCarregandoMulti, setEstaCarregandoMulti] = useState(false);

    // Limpa resultados sempre que um filtro mudar (Garante integridade dos dados na tela)
    useEffect(() => {
        execucao.resetarResultados();
        setResultadosPorPonto({});
    }, [
        filtros.tipoFiltroSelecionado,
        filtros.situacao,
        filtros.pontosSelecionados,
        filtros.dataInicio,
        filtros.dataFim,
        filtros.itensSelecionados,
        execucao.resetarResultados
    ]);

    // Função de busca que valida se os campos obrigatórios estão preenchidos
    const aoBuscar = useCallback(async () => {
        if (!filtros.pontosSelecionados?.length || !filtros.dataInicio || !filtros.dataFim) {
            Swal.fire({ icon: "warning", title: "Campos Incompletos", text: "Selecione ao menos um ponto e o período antes de buscar." });
            return;
        }

        const ids = filtros.pontosSelecionados;
        if (ids.length === 1) {
            await execucao.executarBusca(
                ids[0],
                filtros.dataInicio,
                filtros.dataFim,
                filtros.itensSelecionados,
                filtros.parametros
            );
            return;
        }

        setEstaCarregandoMulti(true);
        try {
            const total = ids.length;
            Swal.fire({
                title: 'Carregando...',
                html: `Buscando dados do ponto...<br><span id="swal-ponto-nome"></span><br><strong id="swal-progresso">0/${total} pontos prontos</strong>`,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const novosResultados: Record<number, ResultadoPontoQualidadeAgua> = {};
            for (let i = 0; i < ids.length; i++) {
                const idPonto = ids[i];
                const nome = filtros.pontos.find(p => p.value === idPonto)?.label ?? String(idPonto);

                const container = document.getElementById('swal-ponto-nome');
                const progressoEl = document.getElementById('swal-progresso');
                if (container) container.textContent = `Buscando dados do ponto ${nome}`;
                if (progressoEl) progressoEl.textContent = `${i}/${total} pontos prontos`;

                const resultado = await execucao.executarBuscaUmPonto(
                    idPonto,
                    filtros.dataInicio,
                    filtros.dataFim,
                    filtros.itensSelecionados,
                    filtros.parametros
                );
                novosResultados[idPonto] = {
                    id: idPonto,
                    label: nome,
                    dadosColeta: resultado.dadosColeta,
                    analiseIA: resultado.analiseIA,
                    analiseOriginalIA: resultado.analiseOriginalIA
                };

                if (progressoEl) progressoEl.textContent = `${i + 1}/${total} pontos prontos`;
            }

            setResultadosPorPonto(novosResultados);
            execucao.resetarResultados();
            Swal.close();
        } catch (erro) {
            console.error("Erro ao buscar múltiplos pontos:", erro);
            Swal.fire({ icon: "error", title: "Erro na Busca", text: "Não foi possível carregar os dados." });
        } finally {
            setEstaCarregandoMulti(false);
        }
    }, [filtros, execucao]);

    // Gatilho para busca automática (ex: vindo da navegação de outra tela)
    useEffect(() => {
        if (!aplicarAutomaticamente || foiAutoAplicado) return;

        if (filtros.pontosSelecionados?.length && filtros.dataInicio && filtros.dataFim) {
            aoBuscar();
            setFoiAutoAplicado(true);
        }
    }, [aplicarAutomaticamente, foiAutoAplicado, filtros.pontosSelecionados, filtros.dataInicio, filtros.dataFim, aoBuscar]);

    return {
        // Expondo estados e setters dos filtros
        tipoFiltroSelecionado: filtros.tipoFiltroSelecionado,
        setTipoFiltroSelecionado: filtros.setTipoFiltroSelecionado,
        
        opcoesFiltroSituacao: filtros.opcoesFiltroSituacao,
        situacaoSelecionada: filtros.situacao,
        aoMudarSituacao: filtros.setSituacao,

        pontoSelecionado: filtros.pontoSelecionado,
        pontosSelecionados: filtros.pontosSelecionados,
        aoMudarPontos: filtros.aoMudarPontos,
        dataInicio: filtros.dataInicio,
        setDataInicio: filtros.setDataInicio,
        dataFim: filtros.dataFim,
        setDataFim: filtros.setDataFim,
        pontos: filtros.pontos,
        itensSelecionados: filtros.itensSelecionados,
        setItensSelecionados: filtros.setItensSelecionados,
        parametros: filtros.parametros,
        estaCarregandoOpcoes: filtros.estaCarregandoOpcoes,

        // Expondo resultados e ações da execução
        dadosColeta: execucao.dadosColeta,
        analiseIA: execucao.analiseIA,
        analiseOriginalIA: execucao.analiseOriginalIA,
        setAnaliseIA: execucao.setAnaliseIA,
        estaCarregando: execucao.estaCarregando || estaCarregandoMulti,
        resultadosPorPonto,
        listaPontosProntos: Object.values(resultadosPorPonto).map(r => ({ id: r.id, label: r.label })),
        setAnaliseIAPonto: useCallback((id: number, texto: string | null) => {
            setResultadosPorPonto(prev => {
                const r = prev[id];
                if (!r) return prev;
                return { ...prev, [id]: { ...r, analiseIA: texto, analiseOriginalIA: texto ?? r.analiseOriginalIA } };
            });
        }, []),

        // Ação principal
        aoBuscar
    };
};
