import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 2000000,
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


// =============================== DEPRECIADAS: 
//foi substituida pelo postColetaCompletaFiltroApi, era usada quando não tinham os filtros na tela, como inclui os filtros, optei por um post 
export const getAnaliseQuimicaPorRegistro = (nRegistro: number) => {
    return rota.get(`/relatorios/coleta/analises-quimicas/${nRegistro}`);
};