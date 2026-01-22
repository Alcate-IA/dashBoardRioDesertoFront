'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateUserId, getSessionId } from '@/utils/tracker';

/**
 * Hook para inicializar o rastreamento de sessão e usuário.
 * Deve ser instanciado nas páginas principais: Geral, Nível Estático, Qualidade da Água e Mapas.
 * 
 * @param contexto Nome da página ou contexto onde o tracker está sendo iniciado.
 */
export const useTracker = (contexto: string) => {
    // Ref para garantir que o log/inicialização ocorra apenas uma vez por montagem
    const jaInicializou = useRef(false);

    useEffect(() => {
        if (jaInicializou.current) return;
        
        try {
            // Garante a criação/recuperação dos IDs
            const userId = getOrCreateUserId();
            const sessionId = getSessionId();

            // Log em desenvolvimento para validação
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Tracker] Iniciado em: ${contexto}`, {
                    userId,
                    sessionId,
                    timestamp: new Date().toISOString()
                });
            }

            jaInicializou.current = true;

        } catch (erro) {
            console.error(`[Tracker] Erro ao inicializar em ${contexto}:`, erro);
        }
    }, [contexto]);
};