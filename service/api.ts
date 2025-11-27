import axios from "axios";

export const rota = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 10000,
});

export const getPiezometrosAtivos = (tipos = null) => {
    const params = {};
    if (tipos && tipos.length > 0) {
        params.tipos = tipos.join(',');
    }
    return rota.get("/piezometros/ativos", { params });
};

export const getPiezometroPorIdDataInicioDataFimApi = (id: number, inicio: string, fim: string) => {
    return rota.get(`/relatorios/piezometro/${id}/filtro`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
};