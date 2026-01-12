import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
});

export const getApiGeralContadores = () => {
    return rota.get("/api/geral/contadores");
};