import axios from "axios";

export const rota = axios.create({
    baseURL: "http://192.168.100.95:8080",
    // baseURL: "http://localhost:8080",
    timeout: 400000,
});

export const salvarAvaliacaoIA = async (dados: {
    cdPiezometro: number;
    editouAnalise: boolean;
    analiseOriginal: string | null;
    analiseEditada?: string;
    nota: number;
    comentario: string;
}) => {
    return rota.post("/avaliacoes-analise-ia-nivel-estatico", dados);
};
