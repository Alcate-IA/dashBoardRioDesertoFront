import axios from "axios";

export const rota = axios.create({
    baseURL: "http://192.168.100.95:8080",
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
export const getPiezometrosRelatorio = () => {
    return rota.get("/relatorios/piezometros-ativos");
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