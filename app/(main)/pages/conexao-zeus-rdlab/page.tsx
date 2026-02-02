"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import Swal from "sweetalert2";
import axios from "axios";
import {
    buscarPiezometrosConectados,
    buscarPiezometrosSemConexao,
    buscarPiezometrosZeus,
    buscarPiezometrosRdLab,
    excluirConexao,
    criarConexao,
    atualizarConexao
} from "@/service/cadastroConexaoRdLabZeusApi";

interface ConexaoConectada {
    id_piezometro: string;
    nm_piezometro: string;
    codigo: number;
    id_conexao: number;
    identificacao: string;
    id_rd_lab: number;
    id_zeus: number;
    cd_piezometro: number;
}

interface PiezometroZeus {
    cd_piezometro: number;
    id_piezometro: string;
    nm_piezometro: string;
}

interface PiezometroRdLab {
    codigo: number;
    identificacao: string;
}

interface PiezometroSemConexao {
    id_piezometro: string;
    nm_piezometro: string;
    cd_piezometro: number;
}

interface FormConexao {
    idConexao: number;
    idZeus: number | null;
    idRdLab: number | null;
}

export default function ConexaoZeusRdLabPage() {
    const [conexoes, setConexoes] = useState<ConexaoConectada[]>([]);
    const [naoConectados, setNaoConectados] = useState<PiezometroSemConexao[]>([]);
    const [listandoConectados, setListandoConectados] = useState(true);
    const [piezometrosZeus, setPiezometrosZeus] = useState<PiezometroZeus[]>([]);
    const [piezometrosRdLab, setPiezometrosRdLab] = useState<PiezometroRdLab[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [exibirDialogo, setExibirDialogo] = useState(false);
    const [editando, setEditando] = useState(false);
    const [filtroGlobal, setFiltroGlobal] = useState("");

    const [formulario, setFormulario] = useState<FormConexao>({
        idConexao: 0,
        idZeus: null,
        idRdLab: null
    });

    const toast = useRef<Toast>(null);

    useEffect(() => {
        carregarDadosIniciais();
    }, []);

    const extrairArray = (res: { data?: unknown }): unknown[] => {
        const d = res?.data;
        if (Array.isArray(d)) return [...d];
        if (d && typeof d === "object" && "content" in d && Array.isArray((d as { content: unknown[] }).content))
            return [...(d as { content: unknown[] }).content];
        return [];
    };

    const carregarDadosIniciais = async () => {
        setCarregando(true);
        try {
            const [resConectados, resZeus, resRdLab] = await Promise.all([
                buscarPiezometrosConectados(),
                buscarPiezometrosZeus(),
                buscarPiezometrosRdLab()
            ]);

            setConexoes(extrairArray(resConectados) as ConexaoConectada[]);
            const zeusData = extrairArray(resZeus) as PiezometroZeus[];
            const zeusMapeado = zeusData.map((p: PiezometroZeus) => ({
                ...p,
                labelCompleto: `${p.nm_piezometro} - ${p.id_piezometro}`
            }));
            setPiezometrosZeus(zeusMapeado);
            setPiezometrosRdLab((extrairArray(resRdLab) as PiezometroRdLab[]) || []);
        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            toast.current?.show({
                severity: "error",
                summary: "Erro",
                detail: "Falha ao carregar dados de conexões.",
                life: 3000
            });
        } finally {
            setCarregando(false);
        }
    };

    const abrirNovo = () => {
        setFormulario({
            idConexao: 0,
            idZeus: null,
            idRdLab: null
        });
        setEditando(false);
        setExibirDialogo(true);
    };

    const abrirConectar = (piezometro: PiezometroSemConexao) => {
        setFormulario({
            idConexao: 0,
            idZeus: piezometro.cd_piezometro,
            idRdLab: null
        });
        setEditando(false);
        setExibirDialogo(true);
    };

    const alternarLista = async () => {
        if (listandoConectados) {
            setCarregando(true);
            try {
                const res = await buscarPiezometrosSemConexao();
                setNaoConectados(extrairArray(res) as PiezometroSemConexao[]);
                setListandoConectados(false);
            } catch (erro) {
                console.error("Erro ao carregar piezômetros sem conexão:", erro);
                toast.current?.show({
                    severity: "error",
                    summary: "Erro",
                    detail: "Falha ao carregar piezômetros sem conexão.",
                    life: 3000
                });
            } finally {
                setCarregando(false);
            }
        } else {
            setCarregando(true);
            try {
                const [resConectados] = await Promise.all([
                    buscarPiezometrosConectados()
                ]);
                setConexoes(extrairArray(resConectados) as ConexaoConectada[]);
                setListandoConectados(true);
            } catch (erro) {
                console.error("Erro ao carregar conexões:", erro);
                toast.current?.show({
                    severity: "error",
                    summary: "Erro",
                    detail: "Falha ao carregar conexões.",
                    life: 3000
                });
            } finally {
                setCarregando(false);
            }
        }
    };

    const fecharDialogo = () => {
        setExibirDialogo(false);
    };

    const handleEditar = (conexao: ConexaoConectada) => {
        setFormulario({
            idConexao: conexao.id_conexao,
            idZeus: conexao.cd_piezometro,
            idRdLab: conexao.codigo
        });
        setEditando(true);
        setExibirDialogo(true);
    };

    const handleExcluir = (conexao: ConexaoConectada) => {
        Swal.fire({
            title: "Tem certeza?",
            text: `Deseja realmente excluir a conexão do piezômetro ${conexao.nm_piezometro}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await excluirConexao(conexao.id_conexao);
                    toast.current?.show({
                        severity: "success",
                        summary: "Sucesso",
                        detail: "Conexão excluída com sucesso.",
                        life: 3000
                    });
                    carregarDadosIniciais();
                } catch (erro) {
                    console.error("Erro ao excluir conexão:", erro);
                    Swal.fire("Erro!", "Não foi possível excluir a conexão.", "error");
                }
            }
        });
    };

    const handleSalvar = async () => {
        if (!formulario.idZeus || !formulario.idRdLab) {
            toast.current?.show({
                severity: "warn",
                summary: "Atenção",
                detail: "Por favor, selecione ambos os piezômetros.",
                life: 3000
            });
            return;
        }

        try {
            const dadosParaSalvar = {
                idZeus: formulario.idZeus!,
                idRdLab: formulario.idRdLab!,
                timestamp: new Date().toISOString()
            };

            if (editando) {
                await atualizarConexao(formulario.idConexao, dadosParaSalvar);
            } else {
                await criarConexao(dadosParaSalvar);
            }

            toast.current?.show({
                severity: "success",
                summary: "Sucesso",
                detail: editando ? "Conexão atualizada com sucesso." : "Conexão realizada com sucesso.",
                life: 3000
            });

            fecharDialogo();
            if (listandoConectados) {
                carregarDadosIniciais();
            } else {
                const res = await buscarPiezometrosSemConexao();
                setNaoConectados(extrairArray(res) as PiezometroSemConexao[]);
            }
        } catch (erro: unknown) {
            console.error("Erro ao salvar conexão:", erro);
            const mensagem =
                axios.isAxiosError(erro) &&
                erro.response?.status === 409 &&
                typeof erro.response?.data?.message === "string"
                    ? erro.response.data.message
                    : "Falha ao salvar a conexão.";
            toast.current?.show({
                severity: "error",
                summary: "Conflito",
                detail: mensagem,
                life: 6000
            });
        }
    };

    const botoesAcao = (rowData: ConexaoConectada) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    severity="info"
                    onClick={() => handleEditar(rowData)}
                    tooltip="Editar Conexão"
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    severity="danger"
                    onClick={() => handleExcluir(rowData)}
                    tooltip="Excluir Conexão"
                />
            </div>
        );
    };

    const botaoConectar = (rowData: PiezometroSemConexao) => {
        return (
            <Button
                icon="pi pi-plus"
                rounded
                severity="success"
                onClick={() => abrirConectar(rowData)}
                tooltip="Conectar"
            />
        );
    };

    const cabecalho = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">
                {listandoConectados ? "Conexões Zeus - Rd Lab" : "Piezômetros Zeus sem conexão"}
            </h5>
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

    const toolbarEsquerda = () => {
        return (
            <div className="flex gap-2 align-items-center">
                <Button
                    label="Nova Conexão"
                    icon="pi pi-plus"
                    severity="success"
                    onClick={abrirNovo}
                />
                <Button
                    label={listandoConectados ? "Listar não conectados" : "Listar conectados"}
                    icon={listandoConectados ? "pi pi-list" : "pi pi-check-circle"}
                    severity={listandoConectados ? "warning" : "success"}
                    onClick={alternarLista}
                />
            </div>
        );
    };

    const rodapeDialogo = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                text
                onClick={fecharDialogo}
                className="p-button-secondary"
            />
            <Button
                label={editando ? "Atualizar" : "Conectar"}
                icon="pi pi-check"
                onClick={handleSalvar}
                severity="success"
            />
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />

                    <Toolbar className="mb-4" left={toolbarEsquerda}></Toolbar>

                    {/* Tabela de conexões (conectados) */}
                    <div style={{ display: listandoConectados ? "block" : "none" }}>
                        <DataTable
                            value={conexoes}
                            dataKey="id_conexao"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} conexões"
                            globalFilter={filtroGlobal}
                            filters={{}}
                            emptyMessage="Nenhuma conexão encontrada."
                            header={cabecalho}
                            loading={carregando}
                            responsiveLayout="scroll"
                        >
                            <Column
                                field="nm_piezometro"
                                header="Nome Zeus"
                                sortable
                                headerStyle={{ minWidth: "12rem" }}
                            />
                            <Column
                                field="id_piezometro"
                                header="Descrição Zeus"
                                sortable
                                headerStyle={{ minWidth: "15rem" }}
                            />
                            <Column
                                field="identificacao"
                                header="Rd Lab (Identificação)"
                                sortable
                                headerStyle={{ minWidth: "15rem" }}
                            />
                            <Column
                                body={botoesAcao}
                                exportable={false}
                                style={{ minWidth: "8rem" }}
                            />
                        </DataTable>
                    </div>

                    {/* Tabela de piezômetros sem conexão */}
                    <div style={{ display: listandoConectados ? "none" : "block" }}>
                        <DataTable
                            value={naoConectados}
                            dataKey="cd_piezometro"
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} piezômetros"
                            globalFilter={filtroGlobal}
                            filters={{}}
                            emptyMessage="Nenhum piezômetro sem conexão."
                            header={cabecalho}
                            loading={carregando}
                            responsiveLayout="scroll"
                        >
                            <Column
                                field="nm_piezometro"
                                header="Nome Zeus"
                                sortable
                                headerStyle={{ minWidth: "12rem" }}
                            />
                            <Column
                                field="id_piezometro"
                                header="Descrição Zeus"
                                sortable
                                headerStyle={{ minWidth: "15rem" }}
                            />
                            <Column
                                field="cd_piezometro"
                                header="Código"
                                sortable
                                headerStyle={{ minWidth: "8rem" }}
                            />
                            <Column
                                body={botaoConectar}
                                header=""
                                exportable={false}
                                style={{ minWidth: "4rem" }}
                            />
                        </DataTable>
                    </div>

                    <Dialog
                        visible={exibirDialogo}
                        style={{ width: "500px" }}
                        header={editando ? "Editar Conexão" : "Nova Conexão"}
                        modal
                        className="p-fluid"
                        footer={rodapeDialogo}
                        onHide={fecharDialogo}
                    >
                        <div className="field mb-4">
                            <label htmlFor="zeus" className="font-bold">
                                Zeus:
                            </label>
                            <Dropdown
                                id="zeus"
                                value={formulario.idZeus}
                                options={piezometrosZeus}
                                onChange={(e) => setFormulario({ ...formulario, idZeus: e.value })}
                                optionLabel="labelCompleto"
                                optionValue="cd_piezometro"
                                placeholder="Selecione um piezômetro Zeus"
                                filter
                                disabled={editando}
                                className={classNames({ "p-invalid": !formulario.idZeus })}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="rdlab" className="font-bold">
                                Rd Lab:
                            </label>
                            <Dropdown
                                id="rdlab"
                                value={formulario.idRdLab}
                                options={piezometrosRdLab}
                                onChange={(e) => setFormulario({ ...formulario, idRdLab: e.value })}
                                optionLabel="identificacao"
                                optionValue="codigo"
                                placeholder="Selecione um piezômetro Rd Lab"
                                filter
                                className={classNames({ "p-invalid": !formulario.idRdLab })}
                            />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
