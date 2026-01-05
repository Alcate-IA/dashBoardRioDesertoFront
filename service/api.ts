import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 2000000,
});

// Busca piezometros para o relatório de coleta (QualidadeAgua)
export const getPiezometrosRelatorio = (tipos: string | string[] | null = null) => {
    const params: any = {};
    if (tipos) {
        params.tipos = Array.isArray(tipos) ? tipos.join(',') : tipos;
    }
    return rota.get("/relatorios/piezometros-ativos", { params });
};


// Usado para dados de coleta simples (GraficoPiezometro - Tabela Coleta)
export const getColetaPorIdDataInicioDataFimApi = (id: number, inicio: string, fim: string) => {
    return rota.get(`/relatorios/coleta/${id}/filtro`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
};

// Usado no relatório de qualidade da água (QualidadeAgua)
export const postColetaCompletaFiltroApi = (idZeus: number, mesAnoInicio: string, mesAnoFim: string, filtros: number[]) => {
    return rota.post("/qualidade-agua/coleta-completa/filtro-analises", {
        idZeus,
        mesAnoInicio,
        mesAnoFim,
        filtros
    });
};

export const getAnaliseQuimicaPorRegistro = (nRegistro: number) => {
    return rota.get(`/relatorios/coleta/analises-quimicas/${nRegistro}`);
};

export const getHistoricoCompletoApi = (idZeus: number) => {
    return rota.get(`/qualidade-agua/historico-completo/${idZeus}`);
};


export const webHookIAAnaliseQualidade = async (dto: any, cdPiezometro: number | string | null, filtros: string[], historico: any): Promise<string | null> => {
    const payload = {
        cdPiezometro: cdPiezometro,
        historico: historico,
        analiseUsuario: {
            ...dto,
            filtros: filtros
        }
    };
    try {
        const response = await axios.post("https://n8n.alcateia-ia.com/webhook/envio-analise-db-qualidade", payload);
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return null;
    }
};

export const getParametrosLegislacaoBuscaDadosRelacionados = () => {
    return rota.get("/parametros-legislacao/filtros");
};