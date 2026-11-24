import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Duplex } from 'node:stream';
import app from '../src/app.js';
import {
  formatCurrencyBRL,
  serializeDecimalAmount,
  formatDateTimeBR,
  maskCpfCnpj,
  isValidEmail,
  isValidHttpUrl,
  generateIdempotencyKey,
  escapeHtml
} from '../public/js/formatters.js';
import {
  apiRequest,
  authState,
  getApiBaseUrl,
  setOnUnauthorizedHandler
} from '../public/js/api.js';

/**
 * Executa requisição contra o app Express em memória (sem abrir socket de rede)
 */
function invokeExpressApp(urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const dummySocket = new Duplex({
      read() {},
      write(_chunk, _encoding, callback) {
        callback();
      }
    });
    dummySocket.remoteAddress = '127.0.0.1';

    const req = new http.IncomingMessage(dummySocket);
    req.method = 'GET';
    req.url = urlPath;
    req.headers = {
      host: 'localhost:4000',
      ...Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
      )
    };

    const res = new http.ServerResponse(req);
    const chunks = [];

    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.write = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding));
      }
      return origWrite(chunk, encoding, cb);
    };

    res.end = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding));
      }
      origEnd(chunk, encoding, cb);
      const rawText = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        text: rawText,
        json: () => JSON.parse(rawText)
      });
    };

    res.on('error', reject);
    app.handle(req, res, reject);
  });
}

describe('RN-FE-02 e Utilitários de Formatação / Validação Client-Side', () => {
  it('deve formatar valores monetários em BRL no padrão pt-BR (R$ 1.250,50) e tratar NaN como R$ 0,00', () => {
    const formatted = formatCurrencyBRL(1250.5);
    assert.ok(formatted.includes('1.250,50'));
    assert.ok(formatted.includes('R$'));

    const fallback = formatCurrencyBRL('invalido');
    assert.ok(fallback.includes('0,00'));
  });

  it('deve serializar valores monetários como Number decimal com até 2 casas', () => {
    assert.equal(serializeDecimalAmount('1250.50'), 1250.5);
    assert.equal(serializeDecimalAmount('R$ 1.250,50'), 1250.5);
    assert.equal(serializeDecimalAmount('250,75'), 250.75);
    assert.equal(serializeDecimalAmount(100), 100);
    assert.equal(serializeDecimalAmount('-50.25'), -50.25);
    assert.ok(Number.isNaN(serializeDecimalAmount('')));
    assert.ok(Number.isNaN(serializeDecimalAmount(null)));
    assert.ok(Number.isNaN(serializeDecimalAmount('abc')));
  });

  it('deve formatar datas ISO-8601 para o padrão dd/MM/yyyy HH:mm:ss', () => {
    const formatted = formatDateTimeBR('2026-11-12T18:05:09.000Z');
    assert.match(formatted, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    assert.equal(formatDateTimeBR(''), '—');
    assert.equal(formatDateTimeBR('data-invalida'), 'data-invalida');
  });

  it('deve aplicar máscara visual para CPF e CNPJ (RN-FE-04)', () => {
    assert.equal(maskCpfCnpj(''), '');
    assert.equal(maskCpfCnpj('12345678901'), '123.456.789-01');
    assert.equal(maskCpfCnpj('12345678000199'), '12.345.678/0001-99');
  });

  it('deve validar formato de e-mail e URL de Webhook HTTP/HTTPS (RN-FE-04, RN-FE-11)', () => {
    assert.equal(isValidEmail('financeiro@lojaestrela.com.br'), true);
    assert.equal(isValidEmail('email-invalido'), false);
    assert.equal(isValidEmail(''), false);

    assert.equal(isValidHttpUrl('https://api.lojaestrela.com.br/webhooks/pulsar'), true);
    assert.equal(isValidHttpUrl('http://localhost:3000/webhook'), true);
    assert.equal(isValidHttpUrl('ftp://invalido.com/webhook'), false);
    assert.equal(isValidHttpUrl(''), false);
    assert.equal(isValidHttpUrl('http://'), false);
  });

  it('deve gerar chaves de idempotência únicas (RN-FE-08) e escapar caracteres HTML contra XSS', () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    assert.notEqual(key1, key2);
    assert.ok(key1.startsWith('idem-'));

    assert.equal(escapeHtml(null), '');
    assert.equal(
      escapeHtml('<script>alert("xss")</script>'),
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });
});

describe('RN-FE-01 e RN-FE-03 — Cliente HTTP, Gestão de Sessão JWT e Interceptação de Erros', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    authState.clearSession();
    setOnUnauthorizedHandler(null);
    delete globalThis.__PULSAR_CONFIG__;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    authState.clearSession();
    setOnUnauthorizedHandler(null);
  });

  it('deve gerenciar ciclo de vida da sessão (token e merchant) e ler VITE_API_BASE_URL', () => {
    assert.equal(authState.isAuthenticated(), false);
    assert.equal(getApiBaseUrl(), 'http://localhost:3000');

    globalThis.__PULSAR_CONFIG__ = { VITE_API_BASE_URL: 'http://localhost:3000/' };
    assert.equal(getApiBaseUrl(), 'http://localhost:3000');

    authState.setSession('jwt-token-123', { _id: 'm1', name: 'Loja QA', email: 'qa@pulsar.com' });
    assert.equal(authState.isAuthenticated(), true);
    assert.equal(authState.getToken(), 'jwt-token-123');
    assert.equal(authState.getMerchant().name, 'Loja QA');

    authState.clearSession();
    assert.equal(authState.isAuthenticated(), false);
    assert.equal(authState.getMerchant(), null);
  });

  it('deve injetar automaticamente Authorization: Bearer <token> nas rotas protegidas', async () => {
    authState.setSession('token-secreto-jwt', { _id: 'm1', name: 'Loja' });

    let capturedHeaders = null;
    globalThis.fetch = async (_url, options) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ total: 0, accounts: [] })
      };
    };

    const res = await apiRequest('/accounts');
    assert.equal(res.status, 200);
    assert.equal(capturedHeaders.Authorization, 'Bearer token-secreto-jwt');
  });

  it('deve interceptar 401 UNAUTHORIZED em rotas protegidas, limpar sessão e acionar callback de redirecionamento', async () => {
    authState.setSession('token-expirado', { _id: 'm1', name: 'Loja' });

    let unauthorizedMsg = null;
    setOnUnauthorizedHandler((msg) => {
      unauthorizedMsg = msg;
    });

    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({
        error: 'UNAUTHORIZED',
        message: 'Token JWT inválido ou expirado'
      })
    });

    await assert.rejects(
      () => apiRequest('/transactions'),
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.message, 'Sua sessão expirou ou é inválida. Faça login novamente.');
        return true;
      }
    );

    assert.equal(authState.isAuthenticated(), false);
    assert.equal(unauthorizedMsg, 'Sua sessão expirou ou é inválida. Faça login novamente.');
  });

  it('deve consumir prioritariamente a propriedade message do contrato de erro da API (400, 409, 422, 500 e erro de rede)', async () => {
    // 422 Unprocessable Entity
    globalThis.fetch = async () => ({
      ok: false,
      status: 422,
      headers: { get: () => 'application/json' },
      json: async () => ({
        error: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente na conta para realizar esta operação (saldo não pode ficar negativo)'
      })
    });

    await assert.rejects(
      () =>
        apiRequest('/transactions', {
          method: 'POST',
          body: { accountId: 'acc1', amount: 9999 }
        }),
      (err) => {
        assert.equal(err.status, 422);
        assert.equal(err.error, 'INSUFFICIENT_FUNDS');
        assert.equal(
          err.message,
          'Saldo insuficiente na conta para realizar esta operação (saldo não pode ficar negativo)'
        );
        return true;
      }
    );

    // 500 Internal Server Error
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({})
    });

    await assert.rejects(
      () => apiRequest('/accounts'),
      (err) => {
        assert.equal(err.status, 500);
        assert.equal(err.error, 'INTERNAL_SERVER_ERROR');
        assert.ok(err.message.includes('falha temporária no servidor'));
        return true;
      }
    );

    // Falha de rede
    globalThis.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };

    await assert.rejects(
      () => apiRequest('/accounts'),
      (err) => {
        assert.equal(err.status, 0);
        assert.equal(err.error, 'NETWORK_ERROR');
        assert.ok(err.message.includes('Não foi possível conectar ao servidor'));
        return true;
      }
    );
  });
});

describe('Servidor Express Web Frontend & Seletores QA (data-testid)', () => {
  it('GET /health deve retornar 200 OK, headers de segurança e expor apiBaseUrl configurada', async () => {
    const res = await invokeExpressApp('/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    const body = res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.apiBaseUrl, 'http://localhost:3000');
  });

  it('GET /config.js e GET /api/config devem injetar VITE_API_BASE_URL sem URLs hardcoded', async () => {
    const resJs = await invokeExpressApp('/config.js');
    assert.equal(resJs.status, 200);
    assert.ok(resJs.text.includes('VITE_API_BASE_URL'));
    assert.ok(resJs.text.includes('http://localhost:3000'));

    const resJson = await invokeExpressApp('/api/config');
    assert.equal(resJson.status, 200);
    assert.equal(resJson.json().VITE_API_BASE_URL, 'http://localhost:3000');

    const resBulma = await invokeExpressApp('/vendor/bulma/bulma.min.css');
    assert.equal(resBulma.status, 200);
    assert.ok(resBulma.text.includes('bulma'));

    const resFavicon = await invokeExpressApp('/favicon.svg');
    assert.equal(resFavicon.status, 200);
    assert.ok(resFavicon.text.includes('<svg'));
  });

  it('Rotas da aplicação (/login, /register, /dashboard, /accounts, /transactions, /webhooks) devem conter os data-testid exigidos, navbar fixa e Dark Theme', async () => {
    for (const route of ['/login', '/register', '/dashboard', '/accounts', '/transactions', '/webhooks']) {
      const res = await invokeExpressApp(route, { Accept: 'text/html' });
      assert.equal(res.status, 200);
      const html = res.text;
      assert.ok(html.includes('/vendor/bulma/bulma.min.css'));
      assert.ok(html.includes('is-fixed-top'), 'Navbar deve estar fixa no topo (is-fixed-top)');
      assert.ok(html.includes('has-navbar-fixed-top'), 'Body/HTML deve conter has-navbar-fixed-top');
      assert.ok(html.includes('data-testid="btn-theme-toggle"'), 'Deve conter botão de alternância Dark/Light Theme');
      assert.ok(html.includes('pulpay-logo-svg'), 'Deve conter o logotipo vetorial PulPay com onda de pulso');
      assert.ok(html.includes('PulPay'), 'Deve conter a tipografia PulPay do brandbook');
      assert.ok(html.includes('Quem Somos'), 'Deve conter a seção estática Quem Somos');
      assert.ok(html.includes('Projeto de Portfólio Pessoal - Turma 5'), 'Deve conter a identificação Projeto de Portfólio Pessoal - Turma 5');
      assert.ok(html.includes('By Dennys Matos'), 'Deve conter a autoria By Dennys Matos');
      assert.ok(html.includes('/media/video_pulpay.mp4'), 'Deve referenciar o vídeo institucional do PulPay');

      const requiredTestIds = [
        'input-name',
        'input-email',
        'input-document',
        'input-password',
        'btn-submit-auth',
        'alert-error-message',
        'btn-new-account',
        'input-account-name',
        'input-initial-balance',
        'select-currency',
        'select-account',
        'select-transaction-type',
        'input-transaction-amount',
        'select-transaction-status',
        'input-idempotency-key',
        'btn-create-transaction',
        'banner-idempotent-replay',
        'input-webhook-url',
        'input-webhook-secret',
        'btn-save-webhook',
        'btn-simulate-webhook',
        'code-hmac-signature'
      ];

      for (const testId of requiredTestIds) {
        assert.ok(
          html.includes(`data-testid="${testId}"`),
          `Esperava encontrar data-testid="${testId}" na rota ${route}`
        );
      }
    }
  });

  it('Fallback 404 JSON quando Accept não inclui HTML', async () => {
    const res = await invokeExpressApp('/rota-inexistente-json', {
      Accept: 'application/json'
    });
    assert.equal(res.status, 404);
    assert.equal(res.json().error, 'NOT_FOUND');
  });
});
