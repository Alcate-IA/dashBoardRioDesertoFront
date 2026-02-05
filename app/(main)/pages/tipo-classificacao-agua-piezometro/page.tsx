"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import Swal from "sweetalert2";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import {
    listarTiposClassificacao,
    criarTipoClassificacao,
    atualizarTipoClassificacao,
    excluirTipoClassificacao,
    buscarPiezometrosTipoAgua,
    criarClassificacaoAguaPorPiezometro,
    atualizarClassificacaoAguaPorPiezometro,
    excluirClassificacaoAguaPorPiezometro,
    listarLegislacoes,
    criarClassificacaoLegislacao,
    listarLegislacoesPelaClassificacao,
    atualizarClassificacaoLegislacao,
    excluirClassificacaoLegislacao
} from "@/service/tipoClassificacaoAguaPiezometroApi";

type ModoVisualizacao = "tipos" | "piezometros";
type FiltroPiezometros = "classificados" | "naoClassificados" | "todos";

/** Resposta da API: idClassificacao, nomeClassificacao */
interface TipoClassificacaoApi {
    idClassificacao: number;
    nomeClassificacao: string;
}

/** Legislação retornada por /api/legislacoes */
interface Legislacao {
    idLegislacao: number;
    nomeLegislacao: string;
}

/** Item retornado por /api/classificacao-legislacao/legislacoes-pela-classificacao/{id} */
interface ClassificacaoLegislacaoItem {
    idClassificacaoLegislacao: number;
    idLegislacao: number;
    nomeLegislacao: string;
}

interface TipoClassificacao {
    id: number;
    nome: string;
}

interface PiezometroNaoClassificado {
    id_piezometro: string;
    nm_piezometro: string;
    classificacao: string;
    cd_piezometro: number;
}

interface PiezometroClassificado {
    id?: number;
    nm_piezometro: string;
    nome_classificacao: string;
    id_classificacao?: number;
    piezometroId?: number;
    cd_piezometro?: number;
    _key?: string;
}

/** Linha unificada na tabela de piezômetros (classificado ou não) */
interface LinhaPiezometroUnificada {
    _key: string;
    _tipo: "classificado" | "nao_classificado";
    nm_piezometro: string;
    identificacaoDisplay: string;
    classificacaoDisplay: string;
    id_piezometro?: string;
    id?: number;
    piezometroId?: number;
    id_classificacao?: number;
    cd_piezometro?: number;
    nome_classificacao?: string;
    classificacao?: string;
}

interface FormTipoClassificacao {
    id: number;
    nome: string;
}

const CICLO_FILTRO_PIEZOMETROS: FiltroPiezometros[] = ["classificados", "naoClassificados", "todos"];
const ROTULO_FILTRO: Record<FiltroPiezometros, string> = {
    classificados: "Piezômetros classificados",
    naoClassificados: "Piezômetros não classificados",
    todos: "Todos os piezômetros"
};

export default function TipoClassificacaoAguaPiezometroPage() {
    const [tipos, setTipos] = useState<TipoClassificacao[]>([]);
    const [dadosPiezometros, setDadosPiezometros] = useState<{
        classificados: PiezometroClassificado[];
        naoClassificados: PiezometroNaoClassificado[];
    }>({ classificados: [], naoClassificados: [] });
    const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>("tipos");
    const [filtroPiezometros, setFiltroPiezometros] = useState<FiltroPiezometros>("classificados");
    const [carregando, setCarregando] = useState(true);
    const [exibirDialogo, setExibirDialogo] = useState(false);
    const [editando, setEditando] = useState(false);
    const [filtroGlobal, setFiltroGlobal] = useState("");

    const [exibirDialogoClassificar, setExibirDialogoClassificar] = useState(false);
    const [exibirDialogoEditarClassificacao, setExibirDialogoEditarClassificacao] = useState(false);

    const [formulario, setFormulario] = useState<FormTipoClassificacao>({
        id: 0,
        nome: ""
    });

    const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
    /** IDs de legislações selecionadas no modal de novo tipo (apenas ao criar) */
    const [legislacoesSelecionadasNovo, setLegislacoesSelecionadasNovo] = useState<number[]>([]);
    /** Valor do dropdown "Adicionar legislação" (limpo após adicionar) */
    const [legislacaoDropdownValor, setLegislacaoDropdownValor] = useState<number | null>(null);

    /** Legislações já associadas ao tipo em edição (modal editar) */
    const [legislacoesDaClassificacaoEdicao, setLegislacoesDaClassificacaoEdicao] = useState<ClassificacaoLegislacaoItem[]>([]);
    /** ID da classificação-legislação em modo edição (input desbloqueado + botão confirmar) */
    const [editandoLegislacaoId, setEditandoLegislacaoId] = useState<number | null>(null);
    /** Valor selecionado no dropdown ao editar uma legislação */
    const [legislacaoEdicaoValor, setLegislacaoEdicaoValor] = useState<number | null>(null);
    /** Dropdown "Adicionar legislação" no modal de editar */
    const [legislacaoDropdownValorEdicao, setLegislacaoDropdownValorEdicao] = useState<number | null>(null);
    /** Nome original ao abrir o editar (para exibir botão Confirmar só quando mudar) */
    const [nomeOriginalEdicao, setNomeOriginalEdicao] = useState("");

    const [formularioClassificar, setFormularioClassificar] = useState<{
        piezometroId: number;
        nm_piezometro: string;
        classificacaoAguaId: number | null;
    }>({ piezometroId: 0, nm_piezometro: "", classificacaoAguaId: null });

    const [formularioEditarClassificacao, setFormularioEditarClassificacao] = useState<{
        id: number;
        piezometroId: number;
        nm_piezometro: string;
        classificacaoAguaId: number | null;
    }>({ id: 0, piezometroId: 0, nm_piezometro: "", classificacaoAguaId: null });

    const toast = useRef<Toast>(null);

    useEffect(() => {
        carregarTipos();
    }, []);

    const extrairArray = (res: { data?: unknown }): unknown[] => {
        const d = res?.data;
        if (Array.isArray(d)) return [...d];
        if (d && typeof d === "object") {
            const comContent = d as Record<string, unknown>;
            if (Array.isArray(comContent.content)) return [...comContent.content];
            if (Array.isArray(comContent.data)) return [...comContent.data];
        }
        return [];
    };

    const carregarTipos = async () => {
        setCarregando(true);
        try {
            const res = await listarTiposClassificacao();
            const lista = extrairArray(res) as TipoClassificacaoApi[];
            setTipos(
                lista.map((t) => ({
                    id: t.idClassificacao,
                    nome: t.nomeClassificacao ?? ""
                }))
            );
        } catch (erro) {
            console.error("Erro ao carregar tipos:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar tipos de classificação.",
                life: 3000
            });
        } finally {
            setCarregando(false);
        }
    };

    const carregarPiezometrosTipoAgua = async () => {
        setCarregando(true);
        try {
            const res = await buscarPiezometrosTipoAgua();
            const data = res?.data as { classificados?: unknown[]; naoClassificados?: unknown[] } | undefined;
            const classificadosRaw = Array.isArray(data?.classificados) ? data.classificados : [];
            const naoClassificadosRaw = Array.isArray(data?.naoClassificados) ? data.naoClassificados : [];
            const classificadosNorm = (classificadosRaw as Record<string, unknown>[]).map(
                (item: Record<string, unknown>, index: number) =>
                    ({
                        ...item,
                        id: item.id as number,
                        nm_piezometro: item.nm_piezometro as string,
                        nome_classificacao: item.nome_classificacao as string,
                        piezometroId: (item.piezometroId as number) ?? item.cd_piezometro,
                        id_classificacao: item.id_classificacao as number,
                        _key: `c-${item.id ?? index}`
                    }) as PiezometroClassificado
            );
            const naoClassificadosNorm = (naoClassificadosRaw as Record<string, unknown>[]).map(
                (item: Record<string, unknown>) =>
                    ({
                        id_piezometro: item.id_piezometro,
                        nm_piezometro: item.nm_piezometro,
                        classificacao: item.classificacao as string,
                        cd_piezometro: item.cd_piezometro as number
                    }) as PiezometroNaoClassificado
            );
            setDadosPiezometros({ classificados: classificadosNorm, naoClassificados: naoClassificadosNorm });
        } catch (erro) {
            console.error("Erro ao carregar piezômetros:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar piezômetros.",
                life: 3000
            });
        } finally {
            setCarregando(false);
        }
    };

    const listaPiezometrosUnificada = useMemo((): LinhaPiezometroUnificada[] => {
        const { classificados, naoClassificados } = dadosPiezometros;
        if (filtroPiezometros === "classificados") {
            return classificados.map((c) => ({
                _key: c._key ?? `c-${c.id}`,
                _tipo: "classificado" as const,
                nm_piezometro: c.nm_piezometro,
                identificacaoDisplay: (c as { id_piezometro?: string }).id_piezometro ?? c.nm_piezometro,
                classificacaoDisplay: c.nome_classificacao ?? "",
                id_piezometro: (c as { id_piezometro?: string }).id_piezometro ?? c.nm_piezometro,
                id: c.id,
                piezometroId: c.piezometroId ?? c.cd_piezometro,
                id_classificacao: c.id_classificacao,
                nome_classificacao: c.nome_classificacao
            }));
        }
        if (filtroPiezometros === "naoClassificados") {
            return naoClassificados.map((n, i) => ({
                _key: `n-${n.cd_piezometro}-${i}`,
                _tipo: "nao_classificado" as const,
                nm_piezometro: n.nm_piezometro,
                identificacaoDisplay: n.id_piezometro ?? n.nm_piezometro,
                classificacaoDisplay: n.classificacao ?? "Sem classificação",
                id_piezometro: n.id_piezometro,
                cd_piezometro: n.cd_piezometro,
                classificacao: n.classificacao
            }));
        }
        const linhasClass: LinhaPiezometroUnificada[] = classificados.map((c) => ({
            _key: `c-${c.id}`,
            _tipo: "classificado" as const,
            nm_piezometro: c.nm_piezometro,
            identificacaoDisplay: (c as { id_piezometro?: string }).id_piezometro ?? c.nm_piezometro,
            classificacaoDisplay: c.nome_classificacao ?? "",
            id_piezometro: (c as { id_piezometro?: string }).id_piezometro ?? c.nm_piezometro,
            id: c.id,
            piezometroId: c.piezometroId ?? c.cd_piezometro,
            id_classificacao: c.id_classificacao,
            nome_classificacao: c.nome_classificacao
        }));
        const linhasNao: LinhaPiezometroUnificada[] = naoClassificados.map((n, i) => ({
            _key: `n-${n.cd_piezometro}-${i}`,
            _tipo: "nao_classificado" as const,
            nm_piezometro: n.nm_piezometro,
            identificacaoDisplay: n.id_piezometro ?? n.nm_piezometro,
            classificacaoDisplay: n.classificacao ?? "Sem classificação",
            id_piezometro: n.id_piezometro,
            cd_piezometro: n.cd_piezometro,
            classificacao: n.classificacao
        }));
        return [...linhasClass, ...linhasNao];
    }, [dadosPiezometros, filtroPiezometros]);

    const carregarLegislacoes = async () => {
        try {
            const res = await listarLegislacoes();
            const lista = extrairArray(res) as Legislacao[];
            setLegislacoes(Array.isArray(lista) ? lista : []);
        } catch (erro) {
            console.error("Erro ao carregar legislações:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar legislações.",
                life: 3000
            });
        }
    };

    const abrirNovo = () => {
        setFormulario({ id: 0, nome: "" });
        setLegislacoesSelecionadasNovo([]);
        setLegislacaoDropdownValor(null);
        setEditando(false);
        setExibirDialogo(true);
        if (legislacoes.length === 0) carregarLegislacoes();
    };

    const fecharDialogo = () => {
        setExibirDialogo(false);
        setEditandoLegislacaoId(null);
        setLegislacoesDaClassificacaoEdicao([]);
        setLegislacaoDropdownValorEdicao(null);
        setNomeOriginalEdicao("");
    };

    const carregarLegislacoesPelaClassificacao = async (idClassificacao: number) => {
        try {
            const res = await listarLegislacoesPelaClassificacao(idClassificacao);
            const lista = extrairArray(res) as ClassificacaoLegislacaoItem[];
            setLegislacoesDaClassificacaoEdicao(Array.isArray(lista) ? lista : []);
        } catch (erro) {
            console.error("Erro ao carregar legislações da classificação:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar legislações associadas.",
                life: 3000
            });
            setLegislacoesDaClassificacaoEdicao([]);
        }
    };

    const handleEditar = async (tipo: TipoClassificacao) => {
        setFormulario({ id: tipo.id, nome: tipo.nome });
        setNomeOriginalEdicao(tipo.nome);
        setEditando(true);
        setEditandoLegislacaoId(null);
        setLegislacaoEdicaoValor(null);
        setLegislacaoDropdownValorEdicao(null);
        setExibirDialogo(true);
        if (legislacoes.length === 0) await carregarLegislacoes();
        await carregarLegislacoesPelaClassificacao(tipo.id);
    };

    const handleExcluir = (tipo: TipoClassificacao) => {
        Swal.fire({
            title: "Tem certeza?",
            text: `Deseja realmente excluir o tipo "${tipo.nome}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await excluirTipoClassificacao(tipo.id);
                    toast.current?.show({
                        severity: "success",
                        summary: "Sucesso",
                        detail: "Tipo de classificação excluído com sucesso.",
                        life: 3000
                    });
                    carregarTipos();
                } catch (erro) {
                    console.error("Erro ao excluir tipo:", erro);
                    Swal.fire("Erro!", "Não foi possível excluir o tipo de classificação.", "error");
                }
            }
        });
    };

    const handleSalvar = async () => {
        const nomeTrim = formulario.nome?.trim();
        if (!nomeTrim) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Informe o nome do tipo de classificação.",
                life: 3000
            });
            return;
        }

        try {
            // Criar: primeiro POST do tipo, depois associações com legislações
            const res = await criarTipoClassificacao({ nomeClassificacao: nomeTrim });
            const criado = res?.data as { idClassificacao?: number } | undefined;
            const idNovo = criado?.idClassificacao;
            if (idNovo == null) {
                toast.current?.show({
                    severity: "error",
                    summary: "Erro",
                    detail: "Resposta da API sem ID do tipo criado.",
                    life: 5000
                });
                return;
            }

            for (const idLegislacao of legislacoesSelecionadasNovo) {
                await criarClassificacaoLegislacao({
                    idLegislacao,
                    idClassificacaoTipoAgua: idNovo
                });
            }

            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Tipo de classificação criado com sucesso.",
                life: 3000
            });
            fecharDialogo();
            carregarTipos();
        } catch (erro: unknown) {
            console.error("Erro ao salvar tipo:", erro);
            const mensagem =
                axios.isAxiosError(erro) &&
                typeof erro.response?.data === "object" &&
                erro.response?.data !== null &&
                "message" in erro.response.data &&
                typeof (erro.response.data as { message: string }).message === "string"
                    ? (erro.response.data as { message: string }).message
                    : "Falha ao salvar o tipo de classificação.";
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: mensagem,
                life: 6000
            });
        }
    };

    const adicionarLegislacao = (idLegislacao: number | null) => {
        if (idLegislacao && !legislacoesSelecionadasNovo.includes(idLegislacao)) {
            setLegislacoesSelecionadasNovo([...legislacoesSelecionadasNovo, idLegislacao]);
            setLegislacaoDropdownValor(null);
        }
    };

    const removerLegislacao = (idLegislacao: number) => {
        setLegislacoesSelecionadasNovo(legislacoesSelecionadasNovo.filter((id) => id !== idLegislacao));
    };

    const confirmarAlteracaoNome = async () => {
        const nomeTrim = formulario.nome?.trim();
        if (!nomeTrim) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Informe o nome do tipo de classificação.",
                life: 3000
            });
            return;
        }
        try {
            await atualizarTipoClassificacao(formulario.id, { nomeClassificacao: nomeTrim });
            setNomeOriginalEdicao(nomeTrim);
            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Nome atualizado com sucesso.",
                life: 3000
            });
            carregarTipos();
        } catch (erro: unknown) {
            console.error("Erro ao atualizar nome:", erro);
            const mensagem =
                axios.isAxiosError(erro) &&
                typeof erro.response?.data === "object" &&
                erro.response?.data !== null &&
                "message" in erro.response.data &&
                typeof (erro.response.data as { message: string }).message === "string"
                    ? (erro.response.data as { message: string }).message
                    : "Falha ao atualizar o nome.";
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: mensagem,
                life: 6000
            });
        }
    };

    const entrarEdicaoLegislacao = (item: ClassificacaoLegislacaoItem) => {
        setEditandoLegislacaoId(item.idClassificacaoLegislacao);
        setLegislacaoEdicaoValor(item.idLegislacao);
    };

    const cancelarEdicaoLegislacao = () => {
        setEditandoLegislacaoId(null);
        setLegislacaoEdicaoValor(null);
    };

    const confirmarEdicaoLegislacao = async () => {
        if (editandoLegislacaoId == null || legislacaoEdicaoValor == null || formulario.id === 0) return;
        try {
            await atualizarClassificacaoLegislacao(editandoLegislacaoId, {
                idLegislacao: legislacaoEdicaoValor,
                idClassificacaoTipoAgua: formulario.id
            });
            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Legislação atualizada.",
                life: 3000
            });
            cancelarEdicaoLegislacao();
            await carregarLegislacoesPelaClassificacao(formulario.id);
        } catch (erro) {
            console.error("Erro ao atualizar legislação:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao atualizar legislação.",
                life: 3000
            });
        }
    };

    const excluirLegislacaoEdicao = (item: ClassificacaoLegislacaoItem) => {
        Swal.fire({
            title: "Tem certeza?",
            text: `Deseja desassociar a legislação "${item.nomeLegislacao}" deste tipo?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar",
            didOpen: (modal) => {
                const container = modal?.parentElement;
                if (container) (container as HTMLElement).style.zIndex = "10000";
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await excluirClassificacaoLegislacao(item.idClassificacaoLegislacao);
                    toast.current?.show({
                        severity: "success",
                        summary: "Sucesso",
                        detail: "Legislação desassociada.",
                        life: 3000
                    });
                    await carregarLegislacoesPelaClassificacao(formulario.id);
                    if (editandoLegislacaoId === item.idClassificacaoLegislacao) cancelarEdicaoLegislacao();
                } catch (erro) {
                    console.error("Erro ao excluir:", erro);
                    toast.current?.show({
                        severity: "error",
                        summary: "Erro",
                        detail: "Falha ao desassociar legislação.",
                        life: 3000
                    });
                }
            }
        });
    };

    const confirmarAdicionarLegislacaoEdicao = async () => {
        const idLeg = legislacaoDropdownValorEdicao;
        if (idLeg == null || formulario.id === 0) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Selecione uma legislação.",
                life: 3000
            });
            return;
        }
        if (legislacoesDaClassificacaoEdicao.some((l) => l.idLegislacao === idLeg)) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Esta legislação já está associada.",
                life: 3000
            });
            return;
        }
        try {
            await criarClassificacaoLegislacao({
                idLegislacao: idLeg,
                idClassificacaoTipoAgua: formulario.id
            });
            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Legislação associada.",
                life: 3000
            });
            setLegislacaoDropdownValorEdicao(null);
            await carregarLegislacoesPelaClassificacao(formulario.id);
        } catch (erro) {
            console.error("Erro ao associar legislação:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao associar legislação.",
                life: 3000
            });
        }
    };

    const alternarModo = (modo: ModoVisualizacao) => {
        setModoVisualizacao(modo);
        if (modo === "piezometros") carregarPiezometrosTipoAgua();
    };

    const ciclarFiltroPiezometros = () => {
        const idx = CICLO_FILTRO_PIEZOMETROS.indexOf(filtroPiezometros);
        const proximo = CICLO_FILTRO_PIEZOMETROS[(idx + 1) % CICLO_FILTRO_PIEZOMETROS.length];
        setFiltroPiezometros(proximo);
    };

    const abrirClassificar = (linha: LinhaPiezometroUnificada) => {
        if (linha._tipo !== "nao_classificado") return;
        const piezometroId = linha.cd_piezometro;
        if (piezometroId == null) return;
        setFormularioClassificar({
            piezometroId,
            nm_piezometro: linha.nm_piezometro,
            classificacaoAguaId: null
        });
        setExibirDialogoClassificar(true);
    };

    const fecharDialogoClassificar = () => setExibirDialogoClassificar(false);

    const handleSalvarClassificar = async () => {
        if (!formularioClassificar.classificacaoAguaId) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Selecione uma classificação.",
                life: 3000
            });
            return;
        }
        try {
            await criarClassificacaoAguaPorPiezometro({
                classificacaoAguaId: formularioClassificar.classificacaoAguaId,
                piezometroId: formularioClassificar.piezometroId
            });
            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Piezômetro classificado com sucesso.",
                life: 3000
            });
            fecharDialogoClassificar();
            carregarPiezometrosTipoAgua();
        } catch (erro) {
            console.error("Erro ao classificar:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao classificar piezômetro.",
                life: 3000
            });
        }
    };

    const abrirEditarClassificacao = (linha: LinhaPiezometroUnificada) => {
        if (linha._tipo !== "classificado") return;
        setFormularioEditarClassificacao({
            id: linha.id ?? 0,
            piezometroId: linha.piezometroId ?? 0,
            nm_piezometro: linha.nm_piezometro,
            classificacaoAguaId: linha.id_classificacao ?? null
        });
        setExibirDialogoEditarClassificacao(true);
    };

    const fecharDialogoEditarClassificacao = () => setExibirDialogoEditarClassificacao(false);

    const handleSalvarEditarClassificacao = async () => {
        if (!formularioEditarClassificacao.classificacaoAguaId) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Selecione uma classificação.",
                life: 3000
            });
            return;
        }
        try {
            await atualizarClassificacaoAguaPorPiezometro(formularioEditarClassificacao.id, {
                classificacaoAguaId: formularioEditarClassificacao.classificacaoAguaId,
                piezometroId: formularioEditarClassificacao.piezometroId
            });
            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: "Classificação atualizada com sucesso.",
                life: 3000
            });
            fecharDialogoEditarClassificacao();
            carregarPiezometrosTipoAgua();
        } catch (erro) {
            console.error("Erro ao atualizar classificação:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao atualizar classificação.",
                life: 3000
            });
        }
    };

    const handleExcluirClassificacao = (linha: LinhaPiezometroUnificada) => {
        if (linha._tipo !== "classificado") return;
        const idConexao = linha.id;
        if (idConexao == null) {
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "ID da conexão não disponível.",
                life: 3000
            });
            return;
        }
        Swal.fire({
            title: "Tem certeza?",
            text: `Deseja excluir a classificação do piezômetro ${linha.nm_piezometro}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await excluirClassificacaoAguaPorPiezometro(idConexao);
                    toast.current?.show({
                        severity: "success",
                        summary: "Sucesso",
                        detail: "Classificação excluída com sucesso.",
                        life: 3000
                    });
                    carregarPiezometrosTipoAgua();
                } catch (erro) {
                    console.error("Erro ao excluir:", erro);
                    Swal.fire("Erro!", "Não foi possível excluir a classificação.", "error");
                }
            }
        });
    };

    const botoesAcao = (rowData: TipoClassificacao) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                severity="info"
                onClick={() => handleEditar(rowData)}
                tooltip="Editar"
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                onClick={() => handleExcluir(rowData)}
                tooltip="Excluir"
            />
        </div>
    );

    const acoesPiezometro = (rowData: LinhaPiezometroUnificada) => {
        if (rowData._tipo === "nao_classificado") {
            return (
                <Button
                    icon="pi pi-plus"
                    rounded
                    severity="success"
                    onClick={() => abrirClassificar(rowData)}
                    tooltip="Classificar"
                />
            );
        }
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    severity="info"
                    onClick={() => abrirEditarClassificacao(rowData)}
                    tooltip="Editar"
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    severity="danger"
                    onClick={() => handleExcluirClassificacao(rowData)}
                    tooltip="Excluir"
                />
            </div>
        );
    };

    const rodapeDialogo = (
        <div className="flex justify-content-end gap-2">
            {editando ? (
                <Button label="Fechar" icon="pi pi-times" onClick={fecharDialogo} className="p-button-secondary" />
            ) : (
                <>
                    <Button label="Cancelar" icon="pi pi-times" text onClick={fecharDialogo} className="p-button-secondary" />
                    <Button label="Criar" icon="pi pi-check" onClick={handleSalvar} severity="success" />
                </>
            )}
        </div>
    );

    const cabecalhoTipos = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="m-0">Tipos de classificação da água</h5>
            <div className="flex align-items-center gap-2 flex-wrap">
                <Button
                    label="Novo tipo"
                    icon="pi pi-plus"
                    severity="success"
                    onClick={abrirNovo}
                />
                <Button
                    label="Piezômetros"
                    icon="pi pi-list"
                    severity="secondary"
                    onClick={() => alternarModo("piezometros")}
                />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        value={filtroGlobal}
                        onInput={(e) => setFiltroGlobal(e.currentTarget.value)}
                        placeholder="Pesquisar..."
                    />
                </span>
            </div>
        </div>
    );

    const cabecalhoPiezometros = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="m-0">{ROTULO_FILTRO[filtroPiezometros]}</h5>
            <div className="flex align-items-center gap-2 flex-wrap">
                <Button
                    label="Novo tipo"
                    icon="pi pi-plus"
                    severity="success"
                    onClick={abrirNovo}
                    disabled
                />
                <Button
                    label="Tipos de classificação da água"
                    icon="pi pi-list"
                    severity="secondary"
                    onClick={() => alternarModo("tipos")}
                />
                <Button
                    label={ROTULO_FILTRO[filtroPiezometros]}
                    icon="pi pi-refresh"
                    severity="info"
                    onClick={ciclarFiltroPiezometros}
                    tooltip="Clique para alternar: Classificados → Não classificados → Todos"
                />
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        value={filtroGlobal}
                        onInput={(e) => setFiltroGlobal(e.currentTarget.value)}
                        placeholder="Pesquisar..."
                    />
                </span>
            </div>
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <Toast ref={toast} />

                {/* Card com borda branca arredondada: Tipos de classificação */}
                <div className="card card-borda-branca mb-3" style={{ display: modoVisualizacao === "tipos" ? "block" : "none" }}>
                    <DataTable
                        value={tipos}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive datatable-pesquisa-rodape"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
                        globalFilter={filtroGlobal}
                        globalFilterFields={["nome"]}
                        filters={{}}
                        emptyMessage="Nenhum tipo de classificação encontrado."
                        header={cabecalhoTipos}
                        loading={carregando}
                        responsiveLayout="scroll"
                    >
                        <Column field="nome" header="Nome" sortable headerStyle={{ minWidth: "15rem" }} filterField="nome" />
                        <Column body={botoesAcao} header="Ações" exportable={false} style={{ minWidth: "8rem" }} />
                    </DataTable>
                </div>

                {/* Card com borda branca arredondada: Piezômetros (lista unificada) */}
                <div className="card card-borda-branca mb-3" style={{ display: modoVisualizacao === "piezometros" ? "block" : "none" }}>
                    <DataTable
                        value={listaPiezometrosUnificada}
                        dataKey="_key"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive datatable-pesquisa-rodape"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} piezômetros"
                        globalFilter={filtroGlobal}
                        globalFilterFields={["identificacaoDisplay", "classificacaoDisplay"]}
                        filters={{}}
                        emptyMessage="Nenhum piezômetro encontrado."
                        header={cabecalhoPiezometros}
                        loading={carregando}
                        responsiveLayout="scroll"
                    >
                        <Column field="identificacaoDisplay" header="Identificação" sortable headerStyle={{ minWidth: "15rem" }} filterField="identificacaoDisplay" />
                        <Column field="classificacaoDisplay" header="Classificação" sortable headerStyle={{ minWidth: "18rem" }} filterField="classificacaoDisplay" />
                        <Column body={acoesPiezometro} header="Ações" exportable={false} style={{ minWidth: "8rem" }} />
                    </DataTable>
                </div>

                    <Dialog
                        visible={exibirDialogoClassificar}
                        style={{ width: "500px" }}
                        header="Classificar piezômetro"
                        modal
                        className="p-fluid"
                        onHide={fecharDialogoClassificar}
                        footer={
                            <div className="flex justify-content-end gap-2">
                                <Button label="Cancelar" icon="pi pi-times" text onClick={fecharDialogoClassificar} className="p-button-secondary" />
                                <Button label="Classificar" icon="pi pi-check" onClick={handleSalvarClassificar} severity="success" />
                            </div>
                        }
                    >
                        <div className="field mb-3">
                            <label className="font-bold">Piezômetro</label>
                            <InputText value={formularioClassificar.nm_piezometro} readOnly className="p-inputtext-disabled" />
                        </div>
                        <div className="field">
                            <label htmlFor="classificacao-classificar" className="font-bold">Classificação da água</label>
                            <Dropdown
                                id="classificacao-classificar"
                                value={formularioClassificar.classificacaoAguaId}
                                options={tipos}
                                onChange={(e) => setFormularioClassificar({ ...formularioClassificar, classificacaoAguaId: e.value })}
                                optionLabel="nome"
                                optionValue="id"
                                placeholder="Selecione a classificação"
                                filter
                                className={classNames({ "p-invalid": !formularioClassificar.classificacaoAguaId })}
                            />
                        </div>
                    </Dialog>

                    <Dialog
                        visible={exibirDialogoEditarClassificacao}
                        style={{ width: "500px" }}
                        header="Editar classificação"
                        modal
                        className="p-fluid"
                        onHide={fecharDialogoEditarClassificacao}
                        footer={
                            <div className="flex justify-content-end gap-2">
                                <Button label="Cancelar" icon="pi pi-times" text onClick={fecharDialogoEditarClassificacao} className="p-button-secondary" />
                                <Button label="Atualizar" icon="pi pi-check" onClick={handleSalvarEditarClassificacao} severity="success" />
                            </div>
                        }
                    >
                        <div className="field mb-3">
                            <label className="font-bold">Piezômetro</label>
                            <InputText value={formularioEditarClassificacao.nm_piezometro} readOnly className="p-inputtext-disabled" />
                        </div>
                        <div className="field">
                            <label htmlFor="classificacao-editar" className="font-bold">Classificação da água</label>
                            <Dropdown
                                id="classificacao-editar"
                                value={formularioEditarClassificacao.classificacaoAguaId}
                                options={tipos}
                                onChange={(e) => setFormularioEditarClassificacao({ ...formularioEditarClassificacao, classificacaoAguaId: e.value })}
                                optionLabel="nome"
                                optionValue="id"
                                placeholder="Selecione a classificação"
                                filter
                                className={classNames({ "p-invalid": !formularioEditarClassificacao.classificacaoAguaId })}
                            />
                        </div>
                    </Dialog>

                    <Dialog
                        visible={exibirDialogo}
                        style={{ width: "500px" }}
                        header={editando ? "Editar tipo de classificação" : "Novo tipo de classificação"}
                        modal
                        className="p-fluid"
                        footer={rodapeDialogo}
                        onHide={fecharDialogo}
                    >
                        <div className="field">
                            <label htmlFor="nome" className="font-bold">
                                Nome
                            </label>
                            <div className="flex align-items-center gap-2 flex-wrap">
                                <InputText
                                    id="nome"
                                    value={formulario.nome}
                                    onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                                    placeholder="Nome do tipo de classificação"
                                    className={classNames("flex-1 min-w-0", { "p-invalid": !formulario.nome?.trim() })}
                                />
                                {editando &&
                                    formulario.nome?.trim() !== nomeOriginalEdicao &&
                                    formulario.nome?.trim() !== "" && (
                                        <Button
                                            type="button"
                                            label="Confirmar"
                                            icon="pi pi-check"
                                            onClick={confirmarAlteracaoNome}
                                            severity="success"
                                        />
                                    )}
                            </div>
                        </div>
                        {!editando && (
                            <div className="field mt-3">
                                <label className="font-bold">Legislações</label>
                                <p className="text-color-secondary text-sm mt-0 mb-2">
                                    Opcional: associe este tipo de água a uma ou mais legislações.
                                </p>
                                <Dropdown
                                    value={legislacaoDropdownValor}
                                    options={legislacoes.filter((l) => !legislacoesSelecionadasNovo.includes(l.idLegislacao))}
                                    onChange={(e) => adicionarLegislacao(e.value ?? null)}
                                    optionLabel="nomeLegislacao"
                                    optionValue="idLegislacao"
                                    placeholder="Adicionar legislação"
                                    filter
                                    className="w-full"
                                />
                                {legislacoesSelecionadasNovo.length > 0 && (
                                    <ul className="list-none pl-0 mt-2 flex flex-column gap-1">
                                        {legislacoesSelecionadasNovo.map((id) => {
                                            const leg = legislacoes.find((l) => l.idLegislacao === id);
                                            return (
                                                <li
                                                    key={id}
                                                    className="flex align-items-center justify-content-between p-2 surface-100 border-round"
                                                >
                                                    <span>{leg?.nomeLegislacao ?? `ID ${id}`}</span>
                                                    <Button
                                                        type="button"
                                                        icon="pi pi-times"
                                                        rounded
                                                        text
                                                        severity="secondary"
                                                        onClick={() => removerLegislacao(id)}
                                                        tooltip="Remover"
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                        {editando && (
                            <div className="field mt-3">
                                <label className="font-bold">Legislações associadas</label>
                                <p className="text-color-secondary text-sm mt-0 mb-2">
                                    Edite, exclua ou adicione legislações a este tipo.
                                </p>
                                {legislacoesDaClassificacaoEdicao.length > 0 && (
                                    <ul className="list-none pl-0 mt-2 flex flex-column gap-2">
                                        {legislacoesDaClassificacaoEdicao.map((item) => (
                                            <li
                                                key={item.idClassificacaoLegislacao}
                                                className="flex align-items-center gap-2 p-2 surface-100 border-round flex-wrap"
                                            >
                                                {editandoLegislacaoId === item.idClassificacaoLegislacao ? (
                                                    <>
                                                        <Dropdown
                                                            value={legislacaoEdicaoValor}
                                                            options={legislacoes}
                                                            onChange={(e) => setLegislacaoEdicaoValor(e.value ?? null)}
                                                            optionLabel="nomeLegislacao"
                                                            optionValue="idLegislacao"
                                                            placeholder="Selecione a legislação"
                                                            filter
                                                            className="flex-1 min-w-0"
                                                            style={{ minWidth: "12rem" }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            icon="pi pi-check"
                                                            rounded
                                                            severity="success"
                                                            onClick={confirmarEdicaoLegislacao}
                                                            tooltip="Confirmar"
                                                        />
                                                        <Button
                                                            type="button"
                                                            icon="pi pi-times"
                                                            rounded
                                                            text
                                                            severity="secondary"
                                                            onClick={cancelarEdicaoLegislacao}
                                                            tooltip="Cancelar"
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 min-w-0">{item.nomeLegislacao}</span>
                                                        <Button
                                                            type="button"
                                                            icon="pi pi-pencil"
                                                            rounded
                                                            severity="info"
                                                            onClick={() => entrarEdicaoLegislacao(item)}
                                                            tooltip="Editar"
                                                        />
                                                        <Button
                                                            type="button"
                                                            icon="pi pi-trash"
                                                            rounded
                                                            severity="danger"
                                                            onClick={() => excluirLegislacaoEdicao(item)}
                                                            tooltip="Excluir"
                                                        />
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="flex align-items-center gap-2 mt-2 flex-wrap">
                                    <Dropdown
                                        value={legislacaoDropdownValorEdicao}
                                        options={legislacoes.filter(
                                            (l) => !legislacoesDaClassificacaoEdicao.some((a) => a.idLegislacao === l.idLegislacao)
                                        )}
                                        onChange={(e) => setLegislacaoDropdownValorEdicao(e.value ?? null)}
                                        optionLabel="nomeLegislacao"
                                        optionValue="idLegislacao"
                                        placeholder="Adicionar legislação"
                                        filter
                                        className="flex-1 min-w-0"
                                        style={{ minWidth: "12rem" }}
                                    />
                                    <Button
                                        type="button"
                                        label="Confirmar"
                                        icon="pi pi-plus"
                                        onClick={confirmarAdicionarLegislacaoEdicao}
                                        severity="success"
                                    />
                                </div>
                            </div>
                        )}
                    </Dialog>
            </div>
        </div>
    );
}
