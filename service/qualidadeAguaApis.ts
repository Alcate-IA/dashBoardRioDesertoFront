import axios from "axios";

const API_BASE_URL = process.env.API_BASE_URL;

export const rota = axios.create({
    baseURL: API_BASE_URL,
    timeout: 1000000,
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