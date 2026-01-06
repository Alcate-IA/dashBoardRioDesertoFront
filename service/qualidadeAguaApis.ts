import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 20000,
});

export const salvarAvaliacaoIAQualidadeAgua = async (dados: {
    idZeus: number;
    editouAnalise: boolean;
    analiseOriginal: string | null;
    analiseEditada?: string;
    nota: number;
    comentario: string;
}) => {
    return rota.post("/avaliacoes-analise-ia-qualidade-agua", dados);
};

// Busca piezometros para o relatório de coleta (QualidadeAgua)
export const getPiezometrosRelatorio = (tipos: string | string[] | null = null) => {
    const params: any = {};
    if (tipos) {
        params.tipos = Array.isArray(tipos) ? tipos.join(',') : tipos;
    }
    return rota.get("/relatorios/piezometros-ativos", { params });
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

//pega todos os de um piezometro para mandar os dados como historico para o N8N
export const getHistoricoCompletoApi = (idZeus: number) => {
    return rota.get(`/qualidade-agua/historico-completo/${idZeus}`);
};

export const webHookIAAnaliseQualidade = async (dto: any, cdPiezometro: number | string | null, filtros: string[], historico: any): Promise<any> => {
    const payload = {
        cdPiezometro: cdPiezometro,
        historico: historico,
        analiseUsuario: {
            ...dto,
            filtros: filtros
        }
    };
    try {
        const response = await rota.post("https://n8n.alcateia-ia.com/webhook/envio-analise-db-qualidade", payload, { timeout: 90000 });
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return null;
    }
};

export const getParametrosLegislacaoBuscaDadosRelacionados = () => {
    return rota.get("/parametros-legislacao/filtros");
};


// =============================== DEPRECIADAS: 
//foi substituida pelo postColetaCompletaFiltroApi, era usada quando não tinham os filtros na tela, como inclui os filtros, optei por um post 
export const getAnaliseQuimicaPorRegistro = (nRegistro: number) => {
    return rota.get(`/relatorios/coleta/analises-quimicas/${nRegistro}`);
};