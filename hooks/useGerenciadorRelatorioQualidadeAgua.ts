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

    // Limpa resultados sempre que um filtro mudar (Garante integridade dos dados na tela)
    useEffect(() => {
        execucao.resetarResultados();
    }, [
        filtros.tipoFiltroSelecionado,
        filtros.situacao,
        filtros.pontoSelecionado,
        filtros.dataInicio,
        filtros.dataFim,
        filtros.itensSelecionados,
        execucao.resetarResultados
    ]);

    // Função de busca que valida se os campos obrigatórios estão preenchidos
    const aoBuscar = useCallback(async () => {
        if (!filtros.pontoSelecionado || !filtros.dataInicio || !filtros.dataFim) {
            Swal.fire({ icon: "warning", title: "Campos Incompletos", text: "Selecione o ponto e o período antes de buscar." });
            return;
        }

        await execucao.executarBusca(
            filtros.pontoSelecionado,
            filtros.dataInicio,
            filtros.dataFim,
            filtros.itensSelecionados,
            filtros.parametros
        );
    }, [filtros, execucao]);

    // Gatilho para busca automática (ex: vindo da navegação de outra tela)
    useEffect(() => {
        if (!aplicarAutomaticamente || foiAutoAplicado) return;

        if (filtros.pontoSelecionado && filtros.dataInicio && filtros.dataFim) {
            aoBuscar();
            setFoiAutoAplicado(true);
        }
    }, [aplicarAutomaticamente, foiAutoAplicado, filtros.pontoSelecionado, filtros.dataInicio, filtros.dataFim, aoBuscar]);

    return {
        // Expondo estados e setters dos filtros
        tipoFiltroSelecionado: filtros.tipoFiltroSelecionado,
        setTipoFiltroSelecionado: filtros.setTipoFiltroSelecionado,
        
        opcoesFiltroSituacao: filtros.opcoesFiltroSituacao,
        situacaoSelecionada: filtros.situacao,
        aoMudarSituacao: filtros.setSituacao,

        pontoSelecionado: filtros.pontoSelecionado,
        setPontoSelecionado: filtros.setPontoSelecionado,
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
        estaCarregando: execucao.estaCarregando,

        // Ação principal
        aoBuscar
    };
};
