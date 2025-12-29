import axios from "axios";

export const rota = axios.create({
    baseURL: "http://192.168.100.95:8080",
    // baseURL: "http://localhost:8080",
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