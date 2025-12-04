"use client";

import { Skeleton } from "primereact/skeleton";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { useState } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";

interface AnaliseQuimicaProps {
  data: any;
  carregando: boolean;
}

// Definir tipos para os parâmetros
interface ParametroPortaria {
  nome: string;
  limite: string;
  unidade: string;
  chaveBackend: string;
  tipo: "pH" | "maximo" | "ausente" | "numerico";
  min?: number;
  max?: number;
}

export default function AnaliseQuimica(
  { data, carregando }: AnaliseQuimicaProps
) {
  const [expanded, setExpanded] = useState(false);

  // valores da portaria conforme o anexo que o pessoal do meo ambiente passou
  const parametrosPortaria: Record<string, ParametroPortaria> = {
    pH: {
      nome: "pH",
      limite: "6,0 a 9,0",
      min: 6.0,
      max: 9.0,
      unidade: "",
      chaveBackend: "pH",
      tipo: "pH",
    },
    sulfato: {
      nome: "Sulfatos",
      limite: "250 mg/L (máx)",
      max: 250,
      unidade: "mg/L",
      chaveBackend: "sulfato",
      tipo: "maximo",
    },
    ferroTotal: {
      nome: "Ferro Total",
      limite: "0,30 mg/L (máx)",
      max: 0.3,
      unidade: "mg/L",
      chaveBackend: "ferroTotal",
      tipo: "maximo",
    },
    manganesTotal: {
      nome: "Manganês Total",
      limite: "0,10 mg/L (máx)",
      max: 0.1,
      unidade: "mg/L",
      chaveBackend: "manganesTotal",
      tipo: "maximo",
    },
    durezaTotal: {
      nome: "Dureza Total",
      limite: "300 mg/L (máx)",
      max: 300,
      unidade: "mg/L",
      chaveBackend: "durezaTotal",
      tipo: "maximo",
    },
    coliformesTotais: {
      nome: "Coliformes Totais",
      limite: "Ausente",
      unidade: "",
      chaveBackend: "coliformesTotais",
      tipo: "ausente",
    },
    escherichiaColi: {
      nome: "Análise Microbiológica (E. coli)",
      limite: "Ausente",
      unidade: "",
      chaveBackend: "escherichiaColi",
      tipo: "ausente",
    },
    turbidez: {
      nome: "Turbidez",
      limite: "5,0 NTU (máx)",
      max: 5.0,
      unidade: "NTU",
      chaveBackend: "turbidez",
      tipo: "maximo",
    },
    cor: {
      nome: "Cor",
      limite: "15 Hazen (máx)",
      max: 15,
      unidade: "Hazen",
      chaveBackend: "cor",
      tipo: "maximo",
    },
  };

  const extrairValorNumerico = (valor: string): number | null => {
    if (
      !valor ||
      valor === "ND" ||
      valor === "Ausente" ||
      valor === "< 0,1" ||
      valor === "ND"
    )
      return 0;

    // Remove texto e mantém apenas números e vírgula/ponto
    const match = valor.match(/[0-9,]+(\.[0-9]+)?/);
    if (!match) return null;

    const numeroStr = match[0].replace(",", ".");
    return parseFloat(numeroStr);
  };

  const verificarLimite = (
    parametroChave: string,
    valor: string
  ): {
    atende: boolean;
    mensagem: string;
    status: "ok" | "alerta" | "ausente";
  } => {
    const config = parametrosPortaria[parametroChave];

    // Se não tem valor nos dados
    if (!valor || valor.trim() === "") {
      return {
        atende: false,
        mensagem: "Dado não disponível",
        status: "ausente",
      };
    }

    // Para coliformes totais (deve ser "Ausente")
    if (config.tipo === "ausente") {
      const valorLower = valor.toLowerCase();
      const atende =
        valorLower === "ausente" || valorLower === "0" || valor === "< 0,1";
      return {
        atende,
        mensagem: atende ? "Atende: Ausente" : `Presente: ${valor}`,
        status: atende ? "ok" : "alerta",
      };
    }

    const valorNumerico = extrairValorNumerico(valor);

    if (valorNumerico === null) {
      return {
        atende: true,
        mensagem: `Valor: ${valor}`,
        status: "ok",
      };
    }

    let atende = true;
    let mensagem = `Limite: ${config.limite}`;

    if (config.tipo === "pH") {
      atende =
        valorNumerico >= (config.min || 0) &&
        valorNumerico <= (config.max || 0);
      mensagem = atende
        ? `pH ${valorNumerico} (dentro do limite: ${config.limite})`
        : `pH ${valorNumerico} (fora do limite: ${config.limite})`;
    } else if (config.tipo === "maximo") {
      atende = valorNumerico <= (config.max || 0);
      mensagem = atende
        ? `${valorNumerico} ${config.unidade} (dentro do limite: ${config.limite})`
        : `${valorNumerico} ${config.unidade} (fora do limite: ${config.limite})`;
    }

    return {
      atende,
      mensagem,
      status: atende ? "ok" : "alerta",
    };
  };

  const obterCorCard = (status: "ok" | "alerta" | "ausente") => {
    switch (status) {
      case "ok":
        return "bg-gray-800 border-green-500";
      case "alerta":
        return "bg-red-900/30 border-red-500";
      case "ausente":
        return "bg-yellow-900/30 border-yellow-500";
      default:
        return "bg-gray-900";
    }
  };

  if (carregando) {
    return (
      <div className="p-3">
        <div className="flex flex-column gap-3">
          <Skeleton width="100%" height="1.5rem" />
          <Skeleton width="100%" height="1.5rem" />
          <Skeleton width="100%" height="1.5rem" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-3">
        <p className="text-500">
          Nenhuma análise química disponível para este registro.
        </p>
      </div>
    );
  }

  const { informacoesAmostra, totalParametrosMapeados, totalOutrosDados, analises, outrosDados } = data;

  return (
    <div className="p-3 analise-quimica">
      {/* Informações da Amostra */}
      <div className="mb-4">
        <h6 className="font-bold mb-2 text-white">Informações da Amostra</h6>
        <div className="grid informacoes-amostra">
          <div className="col-12 md:col-6">
            <span className="text-500">Data: </span>
            <span className="font-medium">{informacoesAmostra?.data}</span>
          </div>
          <div className="col-12 md:col-6">
            <span className="text-500">Coletor: </span>
            <span className="font-medium">
              {informacoesAmostra?.coletor || "Não informado"}
            </span>
          </div>
          <div className="col-12 md:col-6">
            <span className="text-500">Parâmetros Mapeados: </span>
            <span className="font-medium">{totalParametrosMapeados}</span>
          </div>
          <div className="col-12 md:col-6">
            <span className="text-500">Outros Dados: </span>
            <span className="font-medium">{totalOutrosDados}</span>
          </div>
          <div className="col-12">
            <span className="text-500">Nome: </span>
            <span className="font-medium nome-identificacao">
              {informacoesAmostra?.nomeIdentificacao}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Limites da Portaria */}
      <div className="mb-4">
        <h6 className="font-bold mb-2 text-white">
          Parâmetros da Portaria GM/MS nº 888/2021
        </h6>
        <div className="grid">
          {Object.entries(parametrosPortaria).map(([chave, parametro]) => {
            const valorNosDados = analises?.[parametro.chaveBackend] || "";
            const { atende, mensagem, status } = verificarLimite(
              chave,
              valorNosDados
            );

            return (
              <div key={chave} className="col-12 md:col-6 lg:col-3 mb-2">
                <div
                  className={`border-1 p-3 border-round analise-card ${obterCorCard(
                    status
                  )}`}
                >
                  <div className="flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="text-white text-sm font-bold">
                        {parametro.nome}
                      </div>
                      <div className="text-500 text-xs">{parametro.limite}</div>
                    </div>

                    {status === "ok" && (
                      <Badge
                        value="OK"
                        severity="success"
                        className="text-xs"
                      />
                    )}
                    {status === "alerta" && (
                      <Badge
                        value="Alerta"
                        severity="danger"
                        className="text-xs"
                      />
                    )}
                    {status === "ausente" && (
                      <Badge
                        value="N/D"
                        severity="warning"
                        className="text-xs"
                      />
                    )}
                  </div>

                  <div className="mt-2">
                    {valorNosDados ? (
                      <div
                        className={`font-bold ${
                          status === "alerta" ? "text-red-300" : "text-white"
                        }`}
                      >
                        {valorNosDados}
                      </div>
                    ) : (
                      <div className="text-yellow-300 text-xs font-medium">
                        <i className="pi pi-exclamation-triangle mr-1"></i>
                        Dado não disponível
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-500 mt-2 mensagem-parametro">{mensagem}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* tab das outras análises */}
      {totalOutrosDados > 0 && (
        <div className="mb-4">
          <Accordion activeIndex={expanded ? 0 : null} onTabChange={(e) => setExpanded(e.index === 0)}>
            <AccordionTab 
              header={
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-chart-bar"></i>
                  <span>Outras Análises Disponíveis</span>
                  <Badge value={totalOutrosDados} severity="info" className="ml-2" />
                </div>
              }
            >
              <div className="grid">
                {Object.entries(outrosDados || {}).map(([simbolo, resultado]) => (
                  <div key={simbolo} className="col-12 md:col-6 lg:col-3 mb-2">
                    <div className="bg-gray-900 border-1 border-gray-700 p-2 border-round outra-analise-card">
                      <div className="text-gray-400 text-xs font-medium mb-1 simbolo-analise">
                        {simbolo}
                      </div>
                      <div className="text-white text-sm resultado-analise">
                        {resultado as string}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      )}
    </div>
  );
}