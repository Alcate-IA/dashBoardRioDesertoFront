import axios from "axios";

export const rota = axios.create({
    baseURL: "http://192.168.100.95:8080",
    //baseURL: "http://localhost:8080",
    timeout: 10000,
});

// Busca piezômetros com opção de filtro por tipos (array de strings)
// Usado em GraficoPiezometro 
export const getPiezometrosAtivos = (tipos: any = null) => {
    const params: any = {};
    if (tipos && tipos.length > 0) {
        params.tipos = tipos.join(',');
    }
    return rota.get("/piezometros/ativos", { params });
};


// Busca piezometros para o relatório de coleta (QualidadeAgua)
export const getPiezometrosRelatorio = (tipos: string | string[] | null = null) => {
    const params: any = {};
    if (tipos) {
        params.tipos = Array.isArray(tipos) ? tipos.join(',') : tipos;
    }
    return rota.get("/relatorios/piezometros-ativos", { params });
};

// Dados de nível estático (GraficoPiezometro)
export const getPiezometroPorIdDataInicioDataFimApi = (id: number | string | null, inicio: string, fim: string) => {
    return rota.get(`/relatorios/piezometro/${id}/filtro`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
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
export const getColetaCompletaPorIdDataInicioDataFimApi = (id: number, inicio: string, fim: string) => {
    return rota.get(`/relatorios/coleta-completa/${id}/filtro`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
};

export const getAnaliseQuimicaPorRegistro = (nRegistro: number) => {
    return rota.get(`/relatorios/coleta/analises-quimicas/${nRegistro}`);
};

export const webHookIAAnaliseNivelEstatico = async (dto: any, cdPiezometro: number | string | null) => {
    const payload = {
        cdPiezometro: cdPiezometro,
        dto: dto
    };
    try {
        await axios.post("https://n8n.alcateia-ia.com/webhook/envio-analise-db", payload);
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
    }
};

export const webHookIAAnaliseQualidade = async (dto: any, cdPiezometro: number | string | null) => {
    const payload = {
        cdPiezometro: cdPiezometro,
        dto: dto
    };
    try {
        await axios.post("aqui vai ser o lnik do cara novooooo", payload);
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
    }
};