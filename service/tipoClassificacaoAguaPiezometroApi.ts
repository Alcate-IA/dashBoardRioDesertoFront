import axios from "axios";

export const rota = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
});

/**
 * Busca um tipo de classificação de água por ID.
 * @param id ID do tipo de classificação
 * @returns Promise com o tipo de classificação
 */
export const buscarTipoClassificacaoPorId = (id: number) => {
    return rota.get(`/api/tipo-classificacao-agua-piezometro/${id}`);
};

/**
 * Lista todos os tipos de classificação de água para piezômetro.
 * @returns Promise com a lista de tipos
 */
export const listarTiposClassificacao = () => {
    return rota.get("/api/tipo-classificacao-agua-piezometro");
};

/**
 * Cria um novo tipo de classificação de água.
 * @param dados Dados do tipo (ex.: nome, descricao)
 * @returns Promise da criação
 */
export const criarTipoClassificacao = (dados: Record<string, unknown>) => {
    return rota.post("/api/tipo-classificacao-agua-piezometro", dados);
};

/**
 * Atualiza um tipo de classificação existente.
 * @param id ID do tipo a ser atualizado
 * @param dados Dados atualizados
 * @returns Promise da atualização
 */
export const atualizarTipoClassificacao = (id: number, dados: Record<string, unknown>) => {
    return rota.put(`/api/tipo-classificacao-agua-piezometro/${id}`, dados);
};

/**
 * Exclui um tipo de classificação.
 * @param id ID do tipo a ser excluído
 * @returns Promise da exclusão
 */
export const excluirTipoClassificacao = (id: number) => {
    return rota.delete(`/api/tipo-classificacao-agua-piezometro/${id}`);
};

/**
 * Lista piezômetros não classificados com tipo de água.
 * @returns Promise com a lista de piezômetros
 */
export const buscarPiezometrosNaoClassificadosComTipoAgua = () => {
    return rota.get("/piezometros/piezometros-nao-classificados-com-tipo-agua");
};

/**
 * Lista piezômetros classificados com tipo de água.
 * @returns Promise com a lista de piezômetros
 */
export const buscarPiezometrosClassificadosComTipoAgua = () => {
    return rota.get("/piezometros/piezometros-classificados-com-tipo-agua");
};

/**
 * Cria classificação de água para um piezômetro.
 * @param dados classificacaoAguaId e piezometroId
 * @returns Promise da criação
 */
export const criarClassificacaoAguaPorPiezometro = (dados: {
    classificacaoAguaId: number;
    piezometroId: number;
}) => {
    return rota.post("/api/classificacao-agua-por-piezometro", dados);
};

/**
 * Atualiza classificação de água por piezômetro.
 * @param id ID da conexão (classificacao-agua-por-piezometro)
 * @param dados classificacaoAguaId e piezometroId
 * @returns Promise da atualização
 */
export const atualizarClassificacaoAguaPorPiezometro = (
    id: number,
    dados: { classificacaoAguaId: number; piezometroId: number }
) => {
    return rota.put(`/api/classificacao-agua-por-piezometro/${id}`, dados);
};

/**
 * Exclui classificação de água por piezômetro (conexão).
 * @param id ID da conexão
 * @returns Promise da exclusão
 */
export const excluirClassificacaoAguaPorPiezometro = (id: number) => {
    return rota.delete(`/api/classificacao-agua-por-piezometro/${id}`);
};
