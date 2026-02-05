import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
});

export const getApiGeralContadores = () => {
    return rota.get("/api/geral/contadores");
};

export const apiGeralUltimosMovimentosRdLab = () => {
    return rota.get("/api/geral/ultimos-movimentos-rd-lab");
};

export const apiGeralUltimosMovimentosZeus = () => {
    return rota.get("/api/geral/ultimos-movimentos-zeus");
};

export const apiDadosDaVazaoDaMina = () => {
    return rota.get("/api/vazao-mina/estatisticas");
};

export const apiPiozometrosAtrasados = () => {
    return rota.get("/api/inspecao-piezometro-freq/atrasados");
};

export const apiGraficoVazaoPrecipitacao = () => {
    return rota.get("/api/geral/grafico-vazao-x-precipitacao");
};