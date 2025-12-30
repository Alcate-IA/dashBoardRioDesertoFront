/**
 * Utilitário para adicionar marcador visual de início da mineração (10/2012)
 * nos gráficos de séries temporais.
 * 
 * Conforme T1-263: Linha vertical vermelha indicando o início da escavação
 * da mina em outubro de 2012.
 */

// Data fixa do início da mineração: Outubro de 2012
export const DATA_INICIO_MINERACAO = new Date(2012, 9, 1); // Mês é 0-indexed, então 9 = outubro
export const LABEL_INICIO_MINERACAO = "out. 2012"; // Formato usado nos labels do gráfico

/**
 * Verifica se o intervalo de datas selecionado inclui outubro de 2012
 */
export function intervaloIncluiInicioMineracao(dataInicio: Date | null, dataFim: Date | null): boolean {
    if (!dataInicio || !dataFim) return false;
    
    const inicioMineracao = DATA_INICIO_MINERACAO;
    
    return dataInicio <= inicioMineracao && dataFim >= inicioMineracao;
}

/**
 * Encontra o índice do label "out. 2012" nos labels do gráfico
 */
export function encontrarIndiceLabelMineracao(labels: string[]): number {
    const possiveisLabels = [
        "out. 2012",
        "out. de 2012",
        "outubro 2012",
        "10/2012"
    ];
    
    return labels.findIndex(label => 
        possiveisLabels.some(possivel => 
            label.toLowerCase().includes(possivel.toLowerCase()) ||
            label.toLowerCase() === possivel.toLowerCase()
        )
    );
}

/**
 * Retorna um dataset para aparecer na legenda do gráfico
 * A linha vertical é desenhada como um dataset normal
 */
export function getDatasetInicioMineracao(labels: string[], dataInicio: Date | null, dataFim: Date | null): any | null {
    // Verifica se deve mostrar a linha
    if (!intervaloIncluiInicioMineracao(dataInicio, dataFim)) {
        return null;
    }
    
    // Encontra o índice do label correspondente a outubro de 2012
    const indiceMineracao = encontrarIndiceLabelMineracao(labels);
    
    if (indiceMineracao === -1) {
        return null;
    }
    
    // Cria array de dados com null em todos os pontos
    const data = new Array(labels.length).fill(null);
    
    return {
        label: "Início da Escavação",
        data: data,
        borderColor: '#ff4444',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        tension: 0,
        fill: false,
        showLine: false,
        // Marca o índice para uso na legenda customizada
        _indiceMineracao: indiceMineracao,
        _isLinhaVertical: true
    };
}
