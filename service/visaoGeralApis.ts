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