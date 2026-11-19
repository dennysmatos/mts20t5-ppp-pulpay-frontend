/**
 * Serviço HTTP e Gestão de Sessão JWT (RN-FE-01, RN-FE-03 e Configuração Desacoplada)
 */

const TOKEN_STORAGE_KEY = 'pulsar_jwt_token';
const MERCHANT_STORAGE_KEY = 'pulsar_merchant';

// Store em memória para compatibilidade com execução de testes automatizados em Node.js
const memoryStorage = new Map();

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (k) => (memoryStorage.has(k) ? memoryStorage.get(k) : null),
    setItem: (k, v) => memoryStorage.set(k, String(v)),
    removeItem: (k) => memoryStorage.delete(k)
  };
}

/**
 * Obtém a URL base da API a partir da variável de ambiente injetada (VITE_API_BASE_URL)
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__PULSAR_CONFIG__) {
    return (
      window.__PULSAR_CONFIG__.VITE_API_BASE_URL ||
      window.__PULSAR_CONFIG__.API_BASE_URL ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }
  if (typeof globalThis !== 'undefined' && globalThis.__PULSAR_CONFIG__) {
    return (
      globalThis.__PULSAR_CONFIG__.VITE_API_BASE_URL ||
      globalThis.__PULSAR_CONFIG__.API_BASE_URL ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * Estado de Autenticação (RN-FE-01)
 */
export const authState = {
  getToken() {
    return getStorage().getItem(TOKEN_STORAGE_KEY) || null;
  },

  getMerchant() {
    try {
      const raw = getStorage().getItem(MERCHANT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  setSession(token, merchant) {
    const store = getStorage();
    if (token) {
      store.setItem(TOKEN_STORAGE_KEY, token);
    }
    if (merchant) {
      store.setItem(MERCHANT_STORAGE_KEY, JSON.stringify(merchant));
    }
  },

  clearSession() {
    const store = getStorage();
    store.removeItem(TOKEN_STORAGE_KEY);
    store.removeItem(MERCHANT_STORAGE_KEY);
  }
};

/**
 * Callback global para interceptação de 401 Unauthorized em rotas protegidas (RN-FE-01)
 */
let onUnauthorizedCallback = null;

export function setOnUnauthorizedHandler(handler) {
  onUnauthorizedCallback = handler;
}

/**
 * Erro customizado de API para tratamento determinístico (RN-FE-03)
 */
export class ApiError extends Error {
  constructor(message, status, errorCode, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = errorCode || 'API_ERROR';
    this.payload = payload;
  }
}

/**
 * Cliente HTTP centralizado com injeção automática de Authorization: Bearer <token>
 * e tratamento determinístico de erros fora da faixa 2xx (RN-FE-01, RN-FE-03)
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const isAuthEndpoint =
    normalizedEndpoint.startsWith('/auth/login') ||
    normalizedEndpoint.startsWith('/auth/register');

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // RN-FE-01: Todas as chamadas para /accounts, /transactions e /webhooks injetam Authorization: Bearer <token>
  const token = authState.getToken();
  if (token && !isAuthEndpoint) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body !== undefined) {
    fetchOptions.body =
      typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (_networkErr) {
    // RN-FE-03: Em falhas de rede ou indisponibilidade do servidor, exibir mensagem amigável sem stack trace
    throw new ApiError(
      'Não foi possível conectar ao servidor do Pulsar Payments. Verifique se a API está em execução e tente novamente.',
      0,
      'NETWORK_ERROR'
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  // RN-FE-01: Interceptação Global de Sessão Expirada (401 UNAUTHORIZED) oriunda de rotas protegidas
  if (response.status === 401 && !isAuthEndpoint) {
    authState.clearSession();
    const expiredMsg = 'Sua sessão expirou ou é inválida. Faça login novamente.';
    if (typeof onUnauthorizedCallback === 'function') {
      onUnauthorizedCallback(expiredMsg, data);
    }
    throw new ApiError(
      expiredMsg,
      401,
      data?.error || 'UNAUTHORIZED',
      data
    );
  }

  // RN-FE-03: Tratamento determinístico para respostas fora da faixa 200-299
  if (!response.ok) {
    if (response.status >= 500) {
      const serverMessage =
        data?.message ||
        'Ocorreu uma falha temporária no servidor do Pulsar Payments. Tente novamente em instantes.';
      throw new ApiError(
        serverMessage,
        response.status,
        data?.error || 'INTERNAL_SERVER_ERROR',
        data
      );
    }

    // Prioriza sempre a propriedade `message` retornada pelo contrato da API ({ error, message })
    const apiMessage =
      data?.message ||
      `Falha ao processar a requisição (Status HTTP ${response.status})`;
    const apiErrorCode = data?.error || `HTTP_${response.status}`;

    throw new ApiError(apiMessage, response.status, apiErrorCode, data);
  }

  return {
    status: response.status,
    data
  };
}
