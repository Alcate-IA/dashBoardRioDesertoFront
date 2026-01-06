import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 20000,
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
        const response = await rota.post("https://n8n.alcateia-ia.com/webhook/envio-analise-db", payload, { timeout: 90000 });
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return null;
    }
};

export const getPiezometrosAtivos = (tipos: any = null) => {
    const params: any = {};
    if (tipos && tipos.length > 0) {
        params.tipos = tipos.join(',');
    }
    return rota.get("/piezometros/ativos", { params });
};



// =============================== DEPRECIADAS: 
//essa aqui era usada para uma versão inicial do sistema que qualidade da água foi implementada junta do nível estático e não estamos mais usando, o componente é esse: components/GraficoPiezometro/ColetaTable.tsx, vou deixar aqui para caso de ouver a necessidade de reutiliza-lo


// Usado para dados de coleta simples (GraficoPiezometro - Tabela Coleta)
export const getColetaPorIdDataInicioDataFimApi = (id: number, inicio: string, fim: string) => {
    return rota.get(`/relatorios/coleta/${id}/filtro`, {
        params: {
            mesAnoInicio: inicio,
            mesAnoFim: fim
        }
    });
};