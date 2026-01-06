'use client';

import { useState, useCallback } from "react";
import Swal from "sweetalert2";
import {
    postColetaCompletaFiltroApi,
    getHistoricoCompletoApi,
    webHookIAAnaliseQualidade
} from '@/service/qualidadeAguaApis';

/**
 * Hook especializado em EXECUTAR a lógica de busca e análise (A PARTE PESADA).
 * 
 * Responsável por:
 * 1. Chamar a API de coleta de dados filtrados.
 * 2. Buscar o histórico completo para contexto da IA.
 * 3. Enviar os dados para o Webhook da IA e gerenciar a resposta.
 * 4. Controlar os estados de progresso (loading) e erros da busca.
 */
export const useExecucaoAnaliseQualidadeAgua = () => {
    const [estaCarregando, setEstaCarregando] = useState(false);
    const [dadosColeta, setDadosColeta] = useState<any>(null);
    const [analiseIA, setAnaliseIA] = useState<string | null>(null);
    const [analiseOriginalIA, setAnaliseOriginalIA] = useState<string | null>(null);

    const executarBusca = useCallback(async (
        pontoSelecionado: number,
        dataInicio: Date,
        dataFim: Date,
        itensSelecionados: number[],
        listaParametros: any[]
    ) => {
        if (dataInicio > dataFim) {
            Swal.fire({
                icon: "error",
                title: "Datas inválidas",
                text: "A data inicial não pode ser maior que a data final."
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Carregando...',
                html: 'Buscando dados e analisando...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            setEstaCarregando(true);
            setDadosColeta(null);
            setAnaliseIA(null);
            setAnaliseOriginalIA(null);

            const formatarMesAno = (data: Date) => {
                const mes = (data.getMonth() + 1).toString().padStart(2, '0');
                const ano = data.getFullYear();
                return `${mes}/${ano}`;
            };

            const inicioStr = formatarMesAno(dataInicio);
            const fimStr = formatarMesAno(dataFim);

            // 1. Busca dados das amostras
            const respostaColeta = await postColetaCompletaFiltroApi(pontoSelecionado, inicioStr, fimStr, itensSelecionados);
            const dados = respostaColeta.data;
            setDadosColeta(dados);

            if (dados && dados.amostras) {
                // Prepara contexto para a IA
                const nomesFiltros = listaParametros
                    .filter(p => itensSelecionados.includes(p.id_analise))
                    .map(p => `${p.nome} (${p.simbolo})`);

                // 2. Busca histórico completo para o gráfico e análise
                const respostaHistorico = await getHistoricoCompletoApi(pontoSelecionado);
                const dadosHistorico = respostaHistorico.data;

                // 3. Chama a IA
                let erroIA = false;
                const respostaIA = await webHookIAAnaliseQualidade(dados, pontoSelecionado, nomesFiltros, dadosHistorico);

                if (Array.isArray(respostaIA) && respostaIA[0]?.output) {
                    setAnaliseIA(respostaIA[0].output);
                    setAnaliseOriginalIA(respostaIA[0].output);
                } else {
                    erroIA = true;
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro na Análise',
                        text: 'Houve algum erro com a análise da IA, tente de novo e se o erro persistir nos contate!',
                        confirmButtonText: 'Fechar',
                        confirmButtonColor: '#d33'
                    });
                }

                if (!erroIA) {
                    Swal.close();
                }
            } else {
                Swal.close();
            }

        } catch (erro) {
            console.error("Erro ao executar busca de qualidade da água:", erro);
            Swal.fire({
                icon: "error",
                title: "Erro na Busca",
                text: "Não foi possível carregar os dados ou realizar a análise de IA."
            });
        } finally {
            setEstaCarregando(false);
        }
    }, []);

    const resetarResultados = useCallback(() => {
        setDadosColeta(null);
        setAnaliseIA(null);
        setAnaliseOriginalIA(null);
    }, []);

    return {
        estaCarregando,
        dadosColeta,
        analiseIA,
        analiseOriginalIA,
        setAnaliseIA,
        executarBusca,
        resetarResultados
    };
};
