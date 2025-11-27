import axios from "axios";

export const rota = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 10000,
});

export const getPiezometrosAtivos = () => rota.get("/piezometros/ativos");


export const getPiezometroPorIdDataInicioDataFimApi = (id: number, inicio: string, fim: string) => {
    return rota.get(`/relatorios/piezometro/${id}/filtro`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
};
