"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
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
    buscarPiezometrosNaoClassificadosComTipoAgua,
    buscarPiezometrosClassificadosComTipoAgua,
    criarClassificacaoAguaPorPiezometro,
    atualizarClassificacaoAguaPorPiezometro,
    excluirClassificacaoAguaPorPiezometro
} from "@/service/tipoClassificacaoAguaPiezometroApi";

type ModoVisualizacao = "tipos" | "nao-classificados" | "classificados";

/** Resposta da API: idClassificacao, nomeClassificacao */
interface TipoClassificacaoApi {
    idClassificacao: number;
    nomeClassificacao: string;
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

interface FormTipoClassificacao {
    id: number;
    nome: string;
}

export default function TipoClassificacaoAguaPiezometroPage() {
    const [tipos, setTipos] = useState<TipoClassificacao[]>([]);
    const [naoClassificados, setNaoClassificados] = useState<PiezometroNaoClassificado[]>([]);
    const [classificados, setClassificados] = useState<PiezometroClassificado[]>([]);
    const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>("tipos");
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

    const carregarNaoClassificados = async () => {
        setCarregando(true);
        try {
            const res = await buscarPiezometrosNaoClassificadosComTipoAgua();
            setNaoClassificados(extrairArray(res) as PiezometroNaoClassificado[]);
        } catch (erro) {
            console.error("Erro ao carregar piezômetros não classificados:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar piezômetros não classificados.",
                life: 3000
            });
        } finally {
            setCarregando(false);
        }
    };

    const carregarClassificados = async () => {
        setCarregando(true);
        try {
            const res = await buscarPiezometrosClassificadosComTipoAgua();
            const lista = extrairArray(res) as (PiezometroClassificado & { id?: number; id_classificacao?: number; piezometroId?: number; cd_piezometro?: number })[];
            setClassificados(
                lista.map((item, index) => ({
                    ...item,
                    _key: item.id != null ? `id-${item.id}` : `${item.nm_piezometro}-${index}`,
                    piezometroId: item.piezometroId ?? item.cd_piezometro
                }))
            );
        } catch (erro) {
            console.error("Erro ao carregar piezômetros classificados:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar piezômetros classificados.",
                life: 3000
            });
        } finally {
            setCarregando(false);
        }
    };

    const abrirNovo = () => {
        setFormulario({ id: 0, nome: "" });
        setEditando(false);
        setExibirDialogo(true);
    };

    const fecharDialogo = () => {
        setExibirDialogo(false);
    };

    const handleEditar = (tipo: TipoClassificacao) => {
        setFormulario({ id: tipo.id, nome: tipo.nome });
        setEditando(true);
        setExibirDialogo(true);
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
            const dados = { nomeClassificacao: nomeTrim };

            if (editando) {
                await atualizarTipoClassificacao(formulario.id, dados);
                toast.current?.show({
                    severity: "success",
                    summary: "Sucesso",
                    detail: "Tipo de classificação atualizado com sucesso.",
                    life: 3000
                });
            } else {
                await criarTipoClassificacao(dados);
                toast.current?.show({
                    severity: "success",
                    summary: "Sucesso",
                    detail: "Tipo de classificação criado com sucesso.",
                    life: 3000
                });
            }

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

    const alternarModo = (modo: ModoVisualizacao) => {
        setModoVisualizacao(modo);
        if (modo === "nao-classificados") carregarNaoClassificados();
        else if (modo === "classificados") carregarClassificados();
    };

    const abrirClassificar = (piezometro: PiezometroNaoClassificado) => {
        setFormularioClassificar({
            piezometroId: piezometro.cd_piezometro,
            nm_piezometro: piezometro.nm_piezometro,
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
            carregarNaoClassificados();
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

    const abrirEditarClassificacao = (row: PiezometroClassificado) => {
        const idClassificacao = row.id_classificacao ?? tipos.find((t) => t.nome === row.nome_classificacao)?.id ?? null;
        setFormularioEditarClassificacao({
            id: row.id ?? 0,
            piezometroId: row.piezometroId ?? row.cd_piezometro ?? 0,
            nm_piezometro: row.nm_piezometro,
            classificacaoAguaId: idClassificacao
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
            carregarClassificados();
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

    const handleExcluirClassificacao = (row: PiezometroClassificado) => {
        const idConexao = row.id;
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
            text: `Deseja excluir a classificação do piezômetro ${row.nm_piezometro}?`,
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
                    carregarClassificados();
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

    const botaoClassificar = (rowData: PiezometroNaoClassificado) => (
        <Button
            icon="pi pi-plus"
            rounded
            severity="success"
            onClick={() => abrirClassificar(rowData)}
            tooltip="Classificar"
        />
    );

    const botoesAcaoClassificados = (rowData: PiezometroClassificado) => (
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

    const toolbarEsquerda = () => (
        <div className="flex gap-2 align-items-center flex-wrap">
            <Button
                label="Novo tipo"
                icon="pi pi-plus"
                severity="success"
                onClick={abrirNovo}
                disabled={modoVisualizacao !== "tipos"}
            />
            <Button
                label="Tipos de classificação da água"
                icon="pi pi-list"
                severity={modoVisualizacao === "tipos" ? "info" : "secondary"}
                onClick={() => alternarModo("tipos")}
            />
            <Button
                label="Piezômetros não classificados"
                icon="pi pi-minus-circle"
                severity={modoVisualizacao === "nao-classificados" ? "info" : "secondary"}
                onClick={() => alternarModo("nao-classificados")}
            />
            <Button
                label="Piezômetros classificados"
                icon="pi pi-check-circle"
                severity={modoVisualizacao === "classificados" ? "info" : "secondary"}
                onClick={() => alternarModo("classificados")}
            />
        </div>
    );

    const rodapeDialogo = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={fecharDialogo} className="p-button-secondary" />
            <Button label={editando ? "Atualizar" : "Criar"} icon="pi pi-check" onClick={handleSalvar} severity="success" />
        </div>
    );

    const cabecalhoTipos = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Tipos de classificação da água</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setFiltroGlobal(e.currentTarget.value)}
                    placeholder="Pesquisar..."
                />
            </span>
        </div>
    );

    const cabecalhoNaoClassificados = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Piezômetros não classificados</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setFiltroGlobal(e.currentTarget.value)}
                    placeholder="Pesquisar..."
                />
            </span>
        </div>
    );

    const cabecalhoClassificados = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Piezômetros classificados</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setFiltroGlobal(e.currentTarget.value)}
                    placeholder="Pesquisar..."
                />
            </span>
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={toolbarEsquerda} />

                    {/* Tabela de tipos de classificação */}
                    <div style={{ display: modoVisualizacao === "tipos" ? "block" : "none" }}>
                        <DataTable
                            value={tipos}
                            dataKey="id"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tipos"
                            globalFilter={filtroGlobal}
                            filters={{}}
                            emptyMessage="Nenhum tipo de classificação encontrado."
                            header={cabecalhoTipos}
                            loading={carregando}
                            responsiveLayout="scroll"
                        >
                            <Column field="nome" header="Nome" sortable headerStyle={{ minWidth: "15rem" }} />
                            <Column body={botoesAcao} header="Ações" exportable={false} style={{ minWidth: "8rem" }} />
                        </DataTable>
                    </div>

                    {/* Tabela de piezômetros não classificados */}
                    <div style={{ display: modoVisualizacao === "nao-classificados" ? "block" : "none" }}>
                        <DataTable
                            value={naoClassificados}
                            dataKey="cd_piezometro"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} piezômetros"
                            globalFilter={filtroGlobal}
                            filters={{}}
                            emptyMessage="Nenhum piezômetro encontrado."
                            header={cabecalhoNaoClassificados}
                            loading={carregando}
                            responsiveLayout="scroll"
                        >
                            <Column field="nm_piezometro" header="Nome" sortable headerStyle={{ minWidth: "12rem" }} />
                            <Column field="id_piezometro" header="Identificação" sortable headerStyle={{ minWidth: "15rem" }} />
                            <Column field="classificacao" header="Classificação" sortable headerStyle={{ minWidth: "12rem" }} />
                            <Column body={botaoClassificar} header="Ações" exportable={false} style={{ minWidth: "4rem" }} />
                        </DataTable>
                    </div>

                    {/* Tabela de piezômetros classificados */}
                    <div style={{ display: modoVisualizacao === "classificados" ? "block" : "none" }}>
                        <DataTable
                            value={classificados}
                            dataKey="_key"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} piezômetros"
                            globalFilter={filtroGlobal}
                            filters={{}}
                            emptyMessage="Nenhum piezômetro encontrado."
                            header={cabecalhoClassificados}
                            loading={carregando}
                            responsiveLayout="scroll"
                        >
                            <Column field="nm_piezometro" header="Nome" sortable headerStyle={{ minWidth: "12rem" }} />
                            <Column field="nome_classificacao" header="Classificação" sortable headerStyle={{ minWidth: "18rem" }} />
                            <Column body={botoesAcaoClassificados} header="Ações" exportable={false} style={{ minWidth: "8rem" }} />
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
                            <InputText
                                id="nome"
                                value={formulario.nome}
                                onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                                placeholder="Nome do tipo de classificação"
                                className={classNames({ "p-invalid": !formulario.nome?.trim() })}
                            />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
