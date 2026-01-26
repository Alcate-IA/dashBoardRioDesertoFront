import { v4 as uuidv4 } from 'uuid';

/**
 * Define um cookie no navegador.
 * @param name Nome do cookie
 * @param value Valor do cookie
 * @param days Dias para expiração
 */
function setCookie(name: string, value: string, days: number): void {
    if (typeof document === 'undefined') return;
    
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
}

/**
 * Obtém o valor de um cookie pelo nome.
 * @param name Nome do cookie
 * @returns Valor do cookie ou null
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Recupera ou cria um ID único para o usuário (User ID).
 * Estratégia:
 * 1. Tenta ler do Cookie (persistência de longo prazo).
 * 2. Tenta ler do LocalStorage (persistência local).
 * 3. Se não encontrar, gera um novo UUID e salva em ambos.
 * 
 * @returns ID do usuário (ex: usr_uuid-v4)
 */
export const getOrCreateUserId = (): string | null => {
    // Segurança para SSR (Server Side Rendering)
    if (typeof window === 'undefined') return null;

    // 1. Cookie (dura anos)
    let userId = getCookie('user_id');
  
    // 2. localStorage (dura até limpar cache)
    if (!userId) {
        userId = localStorage.getItem('user_id');
    }
  
    // 3. Se não existe, cria novo
    if (!userId) {
        userId = `usr_${uuidv4()}`;
        
        // Salva em todos os lugares
        setCookie('user_id', userId, 365 * 5); // 5 anos
        localStorage.setItem('user_id', userId);
    } else {
        // Sincronização: Se existe em um mas não no outro, restaura para garantir persistência.
        if (!getCookie('user_id')) setCookie('user_id', userId, 365 * 5);
        if (!localStorage.getItem('user_id')) localStorage.setItem('user_id', userId);
    }
  
    return userId;
};

/**
 * Recupera ou cria um ID para a sessão atual (Session ID).
 * Estratégia:
 * 1. Tenta ler do SessionStorage.
 * 2. Se não encontrar, gera um novo ID baseado em timestamp e random.
 * 
 * @returns ID da sessão (ex: sess_timestamp_random)
 */
export const getSessionId = (): string | null => {
    if (typeof window === 'undefined') return null;

    // Sempre nova por sessão (aba do navegador)
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
};