import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
});

/**
 * Busca a lista de piezômetros que já possuem conexão entre Zeus e Rd Lab.
 * @returns Promise com a lista de conexões
 */
export const buscarPiezometrosConectados = () => {
    return rota.get("/api/conexao-rd-lab-zeus/piezometros-conectados");
};

/**
 * Exclui uma conexão existente.
 * @param idConexao ID da conexão a ser excluída
 * @returns Promise da exclusão
 */
export const excluirConexao = (idConexao: number) => {
    return rota.delete(`/api/conexao-rd-lab-zeus/${idConexao}`);
};

/**
 * Busca a lista de piezômetros do sistema Zeus.
 * @returns Promise com a lista de piezômetros Zeus
 */
export const buscarPiezometrosZeus = () => {
    return rota.get("/api/geral/piezometros-zeus");
};

/**
 * Busca a lista de piezômetros do sistema Rd Lab.
 * @returns Promise com a lista de piezômetros Rd Lab
 */
export const buscarPiezometrosRdLab = () => {
    return rota.get("/api/geral/piezometros-rd-lab");
};

/**
 * Cria uma nova conexão entre Zeus e Rd Lab.
 * @param dados Objeto contendo idZeus, idRdLab e timestamp
 * @returns Promise da criação
 */
export const criarConexao = (dados: {
    idZeus: number;
    idRdLab: number;
    timestamp: string;
}) => {
    return rota.post("/api/conexao-rd-lab-zeus", dados);
};

/**
 * Atualiza uma conexão existente entre Zeus e Rd Lab.
 * @param idConexao ID da conexão a ser atualizada
 * @param dados Objeto contendo idZeus, idRdLab e timestamp
 * @returns Promise da atualização
 */
export const atualizarConexao = (idConexao: number, dados: {
    idZeus: number;
    idRdLab: number;
    timestamp: string;
}) => {
    return rota.put(`/api/conexao-rd-lab-zeus/${idConexao}`, dados);
};
