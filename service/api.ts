import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 2000000,
});

export const getHistoricoCompletoApi = (idZeus: number) => {
    return rota.get(`/qualidade-agua/historico-completo/${idZeus}`);
};


export const webHookIAAnaliseQualidade = async (dto: any, cdPiezometro: number | string | null, filtros: string[], historico: any): Promise<string | null> => {
    const payload = {
        cdPiezometro: cdPiezometro,
        historico: historico,
        analiseUsuario: {
            ...dto,
            filtros: filtros
        }
    };
    try {
        const response = await axios.post("https://n8n.alcateia-ia.com/webhook/envio-analise-db-qualidade", payload);
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return null;
    }
};

export const getParametrosLegislacaoBuscaDadosRelacionados = () => {
    return rota.get("/parametros-legislacao/filtros");
};