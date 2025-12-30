import axios from "axios";

export const rota = axios.create({
    baseURL: "http://192.168.100.95:8080",
    // baseURL: "http://localhost:8080",
    timeout: 1000000,
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

export const getPiezometroFiltroComHistoricoApi = (cdPiezometro: number | string | null, inicio: string, fim: string) => {
    return rota.get(`/relatorio-nivel-estatico/piezometro/${cdPiezometro}/filtro-com-historico`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
};

export const getPiezometroDiarioApi = (cdPiezometro: number | string | null, inicio: string, fim: string) => {
    return rota.get(`/relatorio-nivel-estatico/piezometro/${cdPiezometro}/diario`, {
        params: {
            dataInicio: inicio,
            dataFim: fim
        }
    });
};


export const webHookIAAnaliseNivelEstatico = async (dto: any, cdPiezometro: number | string | null, historico: any) => {
    const payload = {
        cdPiezometro: cdPiezometro,
        dados: dto,
        historico: historico
    };
    try {
        const response = await axios.post("https://n8n.alcateia-ia.com/webhook/envio-analise-db", payload);
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return null;
    }
};