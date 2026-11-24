/**
 * Pulsar Payments — Frontend Web Application Controller
 * Implementa todas as Regras de Negócio RN-FE-01 a RN-FE-12 e Padrão QA 2.0
 */

import { apiRequest, authState, setOnUnauthorizedHandler } from './api.js';
import {
  escapeHtml,
  formatCurrencyBRL,
  formatDateTimeBR,
  generateIdempotencyKey,
  isValidEmail,
  isValidHttpUrl,
  maskCpfCnpj,
  serializeDecimalAmount
} from './formatters.js';

// ============================================================================
// ESTADO LOCAL DA APLICAÇÃO
// ============================================================================
const appState = {
  currentPath: window.location.pathname || '/login',
  authMode: 'login', // 'login' | 'register'
  accounts: [],
  transactions: [],
  webhooks: [],
  expandedWebhookLogs: new Set(),
  pendingRefundTx: null
};

const PRIVATE_ROUTES = ['/dashboard', '/accounts', '/transactions', '/webhooks'];
const PUBLIC_AUTH_ROUTES = ['/login', '/register'];
const THEME_STORAGE_KEY = 'pulsar_theme_preference';

// ============================================================================
// GESTÃO DE TEMA (LIGHT / DARK THEME)
// ============================================================================
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  // Identidade visual oficial PulPay tem o Azul Noturno (Dark Mode) como padrão de fábrica
  return 'dark';
}

function applyTheme(theme) {
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', normalized);
  localStorage.setItem(THEME_STORAGE_KEY, normalized);

  const iconEl = document.getElementById('theme-toggle-icon');
  const btnEl = document.getElementById('btn-theme-toggle');
  if (iconEl) {
    if (normalized === 'dark') {
      iconEl.textContent = '☀️';
      btnEl?.setAttribute('title', 'Alternar para Modo Claro');
      btnEl?.setAttribute('aria-label', 'Alternar para Modo Claro');
    } else {
      iconEl.textContent = '🌙';
      btnEl?.setAttribute('title', 'Alternar para Modo Escuro');
      btnEl?.setAttribute('aria-label', 'Alternar para Modo Escuro');
    }
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ============================================================================
// ELEMENTOS DO DOM & HELPERS DE UI
// ============================================================================
const $ = (id) => document.getElementById(id);

function showErrorAlert(message, errorCode = null) {
  const alertEl = $('global-error-alert');
  const codeEl = $('global-error-code');
  const textEl = $('global-error-text');

  if (!alertEl || !textEl) return;

  codeEl.textContent = errorCode ? `[${errorCode}]` : 'Atenção:';
  textEl.textContent = message;
  alertEl.classList.remove('is-hidden');
}

function hideErrorAlert() {
  const alertEl = $('global-error-alert');
  if (alertEl) {
    alertEl.classList.add('is-hidden');
  }
}

function showSuccessAlert(message) {
  const alertEl = $('global-success-alert');
  const textEl = $('global-success-text');
  if (!alertEl || !textEl) return;

  textEl.textContent = message;
  alertEl.classList.remove('is-hidden');
}

function hideSuccessAlert() {
  const alertEl = $('global-success-alert');
  if (alertEl) {
    alertEl.classList.add('is-hidden');
  }
}

function showIdempotentBanner(message) {
  const bannerEl = $('banner-idempotent-replay');
  const textEl = $('banner-idempotent-text');
  if (!bannerEl || !textEl) return;

  textEl.textContent =
    message ||
    'Requisição idempotente: retornando transação processada anteriormente';
  bannerEl.classList.remove('is-hidden');
}

function hideIdempotentBanner() {
  const bannerEl = $('banner-idempotent-replay');
  if (bannerEl) {
    bannerEl.classList.add('is-hidden');
  }
}

function clearAllAlerts() {
  hideErrorAlert();
  hideSuccessAlert();
  hideIdempotentBanner();
}

/**
 * RN-FE-03: Botões de submissão entram em estado loading / disabled durante requisições
 */
function setButtonLoading(btnEl, isLoading) {
  if (!btnEl) return;
  if (isLoading) {
    btnEl.classList.add('is-loading');
    btnEl.disabled = true;
  } else {
    btnEl.classList.remove('is-loading');
    btnEl.disabled = false;
  }
}

function setFieldError(inputEl, helpEl, message) {
  if (inputEl) {
    if (message) {
      inputEl.classList.add('is-danger', 'field-error-highlight');
    } else {
      inputEl.classList.remove('is-danger', 'field-error-highlight');
    }
  }
  if (helpEl) {
    if (message) {
      helpEl.textContent = message;
      helpEl.classList.remove('is-hidden');
    } else {
      helpEl.textContent = '';
      helpEl.classList.add('is-hidden');
    }
  }
}

async function copyTextToClipboard(text, successMsg = 'Copiado para a área de transferência!') {
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    showSuccessAlert(successMsg);
  } catch {
    showErrorAlert('Não foi possível copiar automaticamente.');
  }
}

// ============================================================================
// RN-FE-01: ROTEAMENTO E PROTEÇÃO DE ROTAS PRIVADAS (ROUTE GUARDS)
// ============================================================================
function updateNavbarState(activePath) {
  const isAuth = authState.isAuthenticated();
  const merchant = authState.getMerchant();

  const authLinks = $('nav-authenticated-links');
  const merchantInfo = $('nav-merchant-info');
  const guestLinks = $('nav-guest-links');
  const merchantNameEl = $('merchant-display-name');

  if (isAuth) {
    authLinks?.classList.remove('is-hidden');
    merchantInfo?.classList.remove('is-hidden');
    guestLinks?.classList.add('is-hidden');
    if (merchantNameEl && merchant) {
      merchantNameEl.textContent = merchant.name || 'Lojista';
      merchantNameEl.setAttribute(
        'title',
        merchant.email ? `${merchant.name} (${merchant.email})` : merchant.name
      );
    }
  } else {
    authLinks?.classList.add('is-hidden');
    merchantInfo?.classList.add('is-hidden');
    guestLinks?.classList.remove('is-hidden');
  }

  document.querySelectorAll('.navbar-menu .navbar-item[data-nav]').forEach((el) => {
    if (el.getAttribute('data-nav') === activePath) {
      el.classList.add('is-active');
    } else {
      el.classList.remove('is-active');
    }
  });
}

function hideAllViews() {
  ['view-auth', 'view-dashboard', 'view-accounts', 'view-transactions', 'view-webhooks'].forEach(
    (id) => {
      $(id)?.classList.add('is-hidden');
    }
  );
}

export async function navigateTo(targetPath, options = { replace: false, preserveAlerts: false }) {
  let path = targetPath.split('?')[0] || '/';
  if (path === '/') {
    path = authState.isAuthenticated() ? '/dashboard' : '/login';
  }

  const isAuth = authState.isAuthenticated();

  // RN-FE-01: Usuários não autenticados que tentarem acessar rotas privadas -> /login
  if (!isAuth && PRIVATE_ROUTES.includes(path)) {
    path = '/login';
    options.replace = true;
  }

  // RN-FE-01: Usuários já autenticados que acessarem /login ou /register -> /dashboard
  if (isAuth && PUBLIC_AUTH_ROUTES.includes(path)) {
    path = '/dashboard';
    options.replace = true;
  }

  if (!PRIVATE_ROUTES.includes(path) && !PUBLIC_AUTH_ROUTES.includes(path)) {
    path = isAuth ? '/dashboard' : '/login';
  }

  if (window.location.pathname !== path) {
    if (options.replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
  }

  appState.currentPath = path;

  if (!options.preserveAlerts) {
    clearAllAlerts();
  }

  updateNavbarState(path);
  hideAllViews();

  if (path === '/login' || path === '/register') {
    setupAuthView(path === '/register' ? 'register' : 'login');
    $('view-auth')?.classList.remove('is-hidden');
    return;
  }

  if (path === '/dashboard') {
    $('view-dashboard')?.classList.remove('is-hidden');
    await loadDashboardData();
    return;
  }

  if (path === '/accounts') {
    $('view-accounts')?.classList.remove('is-hidden');
    await loadAccountsView();
    return;
  }

  if (path === '/transactions') {
    $('view-transactions')?.classList.remove('is-hidden');
    await loadTransactionsView();
    return;
  }

  if (path === '/webhooks') {
    $('view-webhooks')?.classList.remove('is-hidden');
    await loadWebhooksView();
  }
}

// ============================================================================
// 2. MÓDULO DE AUTENTICAÇÃO (/login e /register) - RN-FE-04 e RN-FE-05
// ============================================================================
function setupAuthView(mode) {
  appState.authMode = mode;

  const tabLogin = $('tab-login');
  const tabRegister = $('tab-register');
  const fieldName = $('field-register-name');
  const fieldDoc = $('field-register-document');
  const titleEl = $('auth-title');
  const submitBtn = $('btn-submit-auth');
  const switchPrompt = $('auth-switch-prompt');

  // Limpa destaques de erro nos campos
  setFieldError($('input-name'), $('help-name'), null);
  setFieldError($('input-email'), $('help-email'), null);
  setFieldError($('input-password'), $('help-password'), null);

  if (mode === 'register') {
    tabLogin?.classList.remove('is-active');
    tabRegister?.classList.add('is-active');
    fieldName?.classList.remove('is-hidden');
    fieldDoc?.classList.remove('is-hidden');
    if (titleEl) titleEl.textContent = 'Cadastro de Novo Lojista';
    if (submitBtn) submitBtn.textContent = 'Registrar Lojista';
    if (switchPrompt) {
      switchPrompt.innerHTML =
        'Já possui cadastro? <a href="/login" data-nav="/login" class="has-text-link has-text-weight-semibold">Acesse sua conta</a>';
    }
  } else {
    tabRegister?.classList.remove('is-active');
    tabLogin?.classList.add('is-active');
    fieldName?.classList.add('is-hidden');
    fieldDoc?.classList.add('is-hidden');
    if (titleEl) titleEl.textContent = 'Acesso do Lojista';
    if (submitBtn) submitBtn.textContent = 'Entrar';
    if (switchPrompt) {
      switchPrompt.innerHTML =
        'Ainda não possui conta? <a href="/register" data-nav="/register" class="has-text-link has-text-weight-semibold">Cadastre seu lojista</a>';
    }
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  hideErrorAlert();
  hideSuccessAlert();

  const mode = appState.authMode;
  const nameInput = $('input-name');
  const emailInput = $('input-email');
  const docInput = $('input-document');
  const passwordInput = $('input-password');
  const submitBtn = $('btn-submit-auth');

  setFieldError(nameInput, $('help-name'), null);
  setFieldError(emailInput, $('help-email'), null);
  setFieldError(passwordInput, $('help-password'), null);

  const rawName = (nameInput?.value || '').trim();
  const normalizedEmail = (emailInput?.value || '').trim().toLowerCase();
  if (emailInput && emailInput.value !== normalizedEmail && normalizedEmail) {
    emailInput.value = normalizedEmail;
  }
  const rawDocument = (docInput?.value || '').trim();
  const rawPassword = passwordInput?.value || '';

  if (mode === 'login') {
    // RN-FE-05: E-mail e Senha são obrigatórios
    let hasValidationError = false;
    if (!normalizedEmail) {
      setFieldError(emailInput, $('help-email'), 'Informe o e-mail para autenticação.');
      hasValidationError = true;
    }
    if (!rawPassword) {
      setFieldError(passwordInput, $('help-password'), 'Informe sua senha para autenticação.');
      hasValidationError = true;
    }
    if (hasValidationError) {
      showErrorAlert(
        'Os campos email e password são obrigatórios para autenticação',
        'VALIDATION_ERROR'
      );
      return;
    }

    setButtonLoading(submitBtn, true);
    try {
      const { data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password: rawPassword
        }
      });

      // RN-FE-05: 200 OK - Salvar sessão (token e merchant), exibir feedback e redirecionar para /dashboard
      authState.setSession(data.token, data.merchant);
      showSuccessAlert(data.message || 'Autenticação realizada com sucesso');
      passwordInput.value = '';
      await navigateTo('/dashboard', { replace: true, preserveAlerts: true });
    } catch (err) {
      // RN-FE-05: 401 INVALID_CREDENTIALS - Exibir alerta de erro sem limpar e-mail, limpando apenas senha
      if (err.status === 401 || err.error === 'INVALID_CREDENTIALS') {
        if (passwordInput) passwordInput.value = '';
        showErrorAlert(
          err.message || 'Credenciais inválidas: e-mail ou senha incorretos',
          err.error || 'INVALID_CREDENTIALS'
        );
      } else {
        showErrorAlert(err.message, err.error);
      }
    } finally {
      setButtonLoading(submitBtn, false);
    }
    return;
  }

  // Modo Registro (/register) - RN-FE-04
  let hasRegisterError = false;

  if (!rawName) {
    setFieldError(nameInput, $('help-name'), 'A Razão Social / Nome do lojista é obrigatória.');
    hasRegisterError = true;
  }

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    setFieldError(emailInput, $('help-email'), 'Informe um endereço de e-mail válido.');
    hasRegisterError = true;
  }

  if (!rawPassword || rawPassword.length < 6) {
    setFieldError(
      passwordInput,
      $('help-password'),
      'A senha deve possuir no mínimo 6 caracteres'
    );
    hasRegisterError = true;
  }

  if (hasRegisterError) {
    const errMsg =
      !rawName || !normalizedEmail || !rawPassword
        ? 'Os campos name, email e password são obrigatórios'
        : rawPassword.length < 6
          ? 'A senha deve possuir no mínimo 6 caracteres'
          : 'Verifique os campos destacados no formulário.';
    showErrorAlert(errMsg, rawPassword && rawPassword.length < 6 ? 'WEAK_PASSWORD' : 'VALIDATION_ERROR');
    return;
  }

  setButtonLoading(submitBtn, true);
  try {
    const payload = {
      name: rawName,
      email: normalizedEmail,
      password: rawPassword
    };
    if (rawDocument) {
      payload.document = rawDocument;
    }

    const { data } = await apiRequest('/auth/register', {
      method: 'POST',
      body: payload
    });

    // RN-FE-04: 201 Created - Autenticar automaticamente, exibir "Lojista registrado com sucesso" e redirecionar para /dashboard
    authState.setSession(data.token, data.merchant);
    showSuccessAlert(data.message || 'Lojista registrado com sucesso');
    passwordInput.value = '';
    await navigateTo('/dashboard', { replace: true, preserveAlerts: true });
  } catch (err) {
    // RN-FE-04: 409 EMAIL_ALREADY_EXISTS - Destacar o campo de e-mail e exibir a mensagem
    if (err.status === 409 || err.error === 'EMAIL_ALREADY_EXISTS') {
      const duplicateMsg =
        err.message || 'Já existe um lojista cadastrado com este e-mail';
      setFieldError(emailInput, $('help-email'), duplicateMsg);
      showErrorAlert(duplicateMsg, 'EMAIL_ALREADY_EXISTS');
    } else {
      showErrorAlert(err.message, err.error);
    }
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================================================
// DASHBOARD (/dashboard)
// ============================================================================
async function loadDashboardData() {
  const merchant = authState.getMerchant();
  const welcomeEl = $('dashboard-merchant-welcome');
  if (welcomeEl && merchant) {
    welcomeEl.textContent = `Bem-vindo(a), ${merchant.name} • CNPJ/CPF: ${merchant.document || 'Não informado'}`;
  }

  try {
    const [accRes, txRes, whRes] = await Promise.all([
      apiRequest('/accounts'),
      apiRequest('/transactions'),
      apiRequest('/webhooks')
    ]);

    appState.accounts = accRes.data?.accounts || [];
    appState.transactions = txRes.data?.transactions || [];
    appState.webhooks = whRes.data?.webhooks || [];

    renderDashboardMetrics();
    renderAccountSelectOptions();
  } catch (err) {
    if (err.status !== 401) {
      showErrorAlert(err.message, err.error);
    }
  }
}

function renderDashboardMetrics() {
  const totalBalance = appState.accounts
    .filter((a) => a.status === 'ACTIVE')
    .reduce((acc, item) => acc + Number(item.balance || 0), 0);

  const paidCount = appState.transactions.filter((t) => t.status === 'PAID').length;

  const balanceEl = $('kpi-total-balance');
  const accountsEl = $('kpi-total-accounts');
  const txEl = $('kpi-total-transactions');
  const paidBreakdownEl = $('kpi-paid-breakdown');
  const whEl = $('kpi-total-webhooks');

  if (balanceEl) balanceEl.textContent = formatCurrencyBRL(totalBalance);
  if (accountsEl) accountsEl.textContent = String(appState.accounts.length);
  if (txEl) txEl.textContent = String(appState.transactions.length);
  if (paidBreakdownEl) paidBreakdownEl.textContent = `${paidCount} liquidadas (PAID)`;
  if (whEl) whEl.textContent = String(appState.webhooks.length);

  // Lista compacta de carteiras no Dashboard
  const dashAccContainer = $('dashboard-accounts-list');
  if (dashAccContainer) {
    if (appState.accounts.length === 0) {
      dashAccContainer.innerHTML = `
        <div class="empty-state p-4">
          <p class="has-text-weight-semibold mb-2">Nenhuma carteira cadastrada</p>
          <p class="is-size-7 mb-3">Crie sua primeira carteira operacional BRL para movimentar valores.</p>
          <a href="/accounts" data-nav="/accounts" class="button is-small is-primary">Criar Carteira</a>
        </div>
      `;
    } else {
      dashAccContainer.innerHTML = appState.accounts
        .map((acc) => {
          const id = acc._id || acc.id;
          const isBlocked = acc.status === 'BLOCKED';
          const statusClass = isBlocked ? 'is-account-blocked' : 'is-account-active';
          return `
            <div class="box p-3 mb-2" data-testid="dash-account-item-${escapeHtml(id)}">
              <div class="level is-mobile mb-1">
                <div class="level-left">
                  <div>
                    <p class="has-text-weight-bold">${escapeHtml(acc.name)}</p>
                    <p class="is-size-7 is-monospace has-text-grey">${escapeHtml(id)}</p>
                  </div>
                </div>
                <div class="level-right has-text-right">
                  <div>
                    <span class="tag ${statusClass} is-small mb-1">${escapeHtml(acc.status)}</span>
                    <p class="has-text-weight-bold is-size-6">${formatCurrencyBRL(acc.balance)}</p>
                  </div>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // Lista compacta das últimas 5 transações no Dashboard
  const dashTxContainer = $('dashboard-transactions-list');
  if (dashTxContainer) {
    if (appState.transactions.length === 0) {
      dashTxContainer.innerHTML = `
        <div class="empty-state p-4">
          <p class="has-text-weight-semibold mb-2">Nenhuma movimentação registrada</p>
          <p class="is-size-7 mb-3">Registre cobranças (CHARGE) ou pagamentos (PAYMENT) com proteção de idempotência.</p>
          <a href="/transactions" data-nav="/transactions" class="button is-small is-link">Registrar Transação</a>
        </div>
      `;
    } else {
      const recent = [...appState.transactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      dashTxContainer.innerHTML = `
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable is-size-7">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Status</th>
                <th class="has-text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${recent
                .map((tx) => {
                  const formattedVal = formatTransactionSignedAmount(tx);
                  return `
                    <tr>
                      <td>${formatDateTimeBR(tx.createdAt)}</td>
                      <td><span class="is-monospace has-text-weight-semibold">${escapeHtml(tx.type)}</span></td>
                      <td>${escapeHtml(tx.description || '—')}</td>
                      <td>${renderStatusBadgeHtml(tx)}</td>
                      <td class="has-text-right ${formattedVal.cssClass}">${formattedVal.text}</td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}

// ============================================================================
// 3. MÓDULO DE CONTAS / CARTEIRAS (/accounts) - RN-FE-06 e RN-FE-07
// ============================================================================
async function loadAccountsView() {
  try {
    const { data } = await apiRequest('/accounts');
    appState.accounts = data?.accounts || [];
    renderAccountsList();
    renderAccountSelectOptions();
  } catch (err) {
    if (err.status !== 401) {
      showErrorAlert(err.message, err.error);
    }
  }
}

function renderAccountsList() {
  const container = $('accounts-list-container');
  const countBadge = $('accounts-count-badge');
  if (countBadge) countBadge.textContent = String(appState.accounts.length);
  if (!container) return;

  // RN-FE-06: Caso a lista retorne vazia (total: 0), exibir Empty State orientando o lojista
  if (appState.accounts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" data-testid="accounts-empty-state">
        <p class="title is-5 mb-2">Nenhuma carteira encontrada (total: 0)</p>
        <p class="subtitle is-6 has-text-grey mb-4">
          Você ainda não possui carteiras operacionais. Utilize o formulário ao lado para criar sua primeira carteira em BRL!
        </p>
      </div>
    `;
    return;
  }

  // RN-FE-06: Apresentar em cards todas as carteiras contendo Nome (name), ID (_id), Moeda (BRL), Status (ACTIVE ou BLOCKED) e Saldo Atual (balance)
  container.innerHTML = `
    <div class="columns is-multiline">
      ${appState.accounts
        .map((acc) => {
          const id = acc._id || acc.id;
          const isActive = acc.status === 'ACTIVE';
          const badgeClass = isActive ? 'is-account-active' : 'is-account-blocked';
          const badgeLabel = isActive ? 'ACTIVE (Ativa)' : 'BLOCKED (Bloqueada)';

          return `
            <div class="column is-6">
              <div class="pulsar-card p-4" data-testid="account-card-${escapeHtml(id)}">
                <div class="level is-mobile mb-2">
                  <div class="level-left">
                    <span class="tag is-dark is-small is-monospace">${escapeHtml(acc.currency || 'BRL')}</span>
                  </div>
                  <div class="level-right">
                    <span class="tag ${badgeClass}" data-testid="account-status-${escapeHtml(id)}">
                      ${escapeHtml(badgeLabel)}
                    </span>
                  </div>
                </div>

                <h3 class="title is-5 mb-1" data-testid="account-name-${escapeHtml(id)}">
                  ${escapeHtml(acc.name)}
                </h3>
                <p class="is-size-7 is-monospace has-text-grey mb-3" title="ID da Carteira">
                  ID: <span data-testid="account-id-${escapeHtml(id)}">${escapeHtml(id)}</span>
                </p>

                <div class="box has-background-light p-3 mb-3">
                  <p class="is-size-7 has-text-grey text-uppercase has-text-weight-semibold">Saldo Atual Disponível</p>
                  <p class="title is-4 mb-0 has-text-success-dark" data-testid="account-balance-value" data-account-balance-id="${escapeHtml(id)}">
                    ${formatCurrencyBRL(acc.balance)}
                  </p>
                </div>

                <div class="is-flex is-justify-content-space-between is-align-items-center is-size-7 has-text-grey">
                  <span>Criada em: ${formatDateTimeBR(acc.createdAt)}</span>
                  <button
                    type="button"
                    class="button is-small is-ghost p-0 btn-inspect-account"
                    data-account-id="${escapeHtml(id)}"
                    data-testid="btn-inspect-account-${escapeHtml(id)}"
                  >
                    🔍 Atualizar saldo
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;

  // Listener para consultar conta individual (GET /accounts/:id)
  container.querySelectorAll('.btn-inspect-account').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const accountId = btn.getAttribute('data-account-id');
      if (!accountId) return;
      try {
        const { data } = await apiRequest(`/accounts/${accountId}`);
        if (data?.account) {
          const idx = appState.accounts.findIndex((a) => (a._id || a.id) === accountId);
          if (idx >= 0) {
            appState.accounts[idx] = data.account;
          }
          renderAccountsList();
          renderAccountSelectOptions();
          showSuccessAlert(
            `Saldo da carteira "${data.account.name}" sincronizado: ${formatCurrencyBRL(data.account.balance)}`
          );
        }
      } catch (err) {
        showErrorAlert(err.message, err.error);
      }
    });
  });
}

async function handleCreateAccountSubmit(event) {
  event.preventDefault();
  hideErrorAlert();
  hideSuccessAlert();

  const nameInput = $('input-account-name');
  const currencySelect = $('select-currency');
  const balanceInput = $('input-initial-balance');
  const helpBalance = $('help-initial-balance');
  const submitBtn = $('btn-new-account');

  setFieldError(balanceInput, helpBalance, null);

  const rawName = (nameInput?.value || '').trim();
  const currency = (currencySelect?.value || 'BRL').trim();
  const rawBalance = balanceInput?.value;

  const parsedBalance =
    rawBalance === '' || rawBalance === undefined || rawBalance === null
      ? 0
      : serializeDecimalAmount(rawBalance);

  if (Number.isNaN(parsedBalance)) {
    const invalidMsg = 'O saldo inicial (initialBalance) deve ser um valor numérico válido';
    setFieldError(balanceInput, helpBalance, invalidMsg);
    showErrorAlert(invalidMsg, 'INVALID_BALANCE');
    return;
  }

  // RN-FE-07: Trava de Saldo Inicial Negativo
  if (parsedBalance < 0) {
    setFieldError(
      balanceInput,
      helpBalance,
      'Operação não permitida: o saldo da conta não pode ser negativo'
    );
  }

  setButtonLoading(submitBtn, true);
  try {
    const payload = {
      initialBalance: parsedBalance,
      currency
    };
    if (rawName) {
      payload.name = rawName;
    }

    const { data } = await apiRequest('/accounts', {
      method: 'POST',
      body: payload
    });

    // RN-FE-07: Após 201 Created, atualizar imediatamente a listagem de contas e o seletor de carteiras
    showSuccessAlert(data?.message || 'Conta criada com sucesso');
    if (nameInput) nameInput.value = '';
    if (balanceInput) balanceInput.value = '0.00';
    if (currencySelect) currencySelect.value = 'BRL';
    setFieldError(balanceInput, helpBalance, null);

    await loadAccountsView();
  } catch (err) {
    if (err.error === 'NEGATIVE_BALANCE_NOT_ALLOWED') {
      setFieldError(balanceInput, helpBalance, err.message);
    }
    showErrorAlert(err.message, err.error);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================================================
// 4. MÓDULO DE TRANSAÇÕES E CONCILIAÇÃO (/transactions) - RN-FE-08, 09, 10
// ============================================================================
function renderAccountSelectOptions() {
  const txSelect = $('select-account');
  const filterSelect = $('filter-account');

  const currentTxAccount = txSelect?.value || '';
  const currentFilterAccount = filterSelect?.value || '';

  if (txSelect) {
    const optionsHtml = [
      '<option value="">Selecione uma carteira...</option>',
      ...appState.accounts.map((acc) => {
        const id = acc._id || acc.id;
        const isBlocked = acc.status === 'BLOCKED';
        const blockedSuffix = isBlocked ? ' [BLOQUEADA - Indisponível]' : '';
        return `<option value="${escapeHtml(id)}" data-status="${escapeHtml(acc.status)}">${escapeHtml(acc.name)} — ${formatCurrencyBRL(acc.balance)}${blockedSuffix}</option>`;
      })
    ].join('');
    txSelect.innerHTML = optionsHtml;

    if (currentTxAccount && appState.accounts.some((a) => (a._id || a.id) === currentTxAccount)) {
      txSelect.value = currentTxAccount;
    } else if (appState.accounts.length > 0) {
      const firstActive = appState.accounts.find((a) => a.status === 'ACTIVE') || appState.accounts[0];
      txSelect.value = firstActive._id || firstActive.id;
    }
    updateSelectedAccountBalanceHint();
  }

  if (filterSelect) {
    const filterOptionsHtml = [
      '<option value="">Todas as carteiras</option>',
      ...appState.accounts.map((acc) => {
        const id = acc._id || acc.id;
        return `<option value="${escapeHtml(id)}">${escapeHtml(acc.name)} (${formatCurrencyBRL(acc.balance)})</option>`;
      })
    ].join('');
    filterSelect.innerHTML = filterOptionsHtml;
    if (currentFilterAccount) {
      filterSelect.value = currentFilterAccount;
    }
  }
}

function updateSelectedAccountBalanceHint() {
  const txSelect = $('select-account');
  const hintEl = $('selected-account-balance-hint');
  if (!txSelect || !hintEl) return;

  const selectedId = txSelect.value;
  const account = appState.accounts.find((a) => (a._id || a.id) === selectedId);
  if (!account) {
    hintEl.textContent = 'Selecione uma carteira ativa para movimentar.';
    hintEl.className = 'help has-text-grey';
    return;
  }

  if (account.status === 'BLOCKED') {
    hintEl.textContent = `⚠️ Atenção: Carteira BLOQUEADA (BLOCKED). Movimentações retornarão 422 ACCOUNT_BLOCKED.`;
    hintEl.className = 'help is-danger has-text-weight-semibold';
  } else {
    hintEl.textContent = `Saldo disponível na carteira selecionada: ${formatCurrencyBRL(account.balance)}`;
    hintEl.className = 'help has-text-success-dark has-text-weight-semibold';
  }
}

async function loadTransactionsView(filters = {}) {
  try {
    const accRes = await apiRequest('/accounts');
    appState.accounts = accRes.data?.accounts || [];
    renderAccountSelectOptions();

    const idempotencyInput = $('input-idempotency-key');
    if (idempotencyInput && !idempotencyInput.value.trim()) {
      idempotencyInput.value = generateIdempotencyKey();
    }

    await fetchAndRenderTransactions(filters);
  } catch (err) {
    if (err.status !== 401) {
      showErrorAlert(err.message, err.error);
    }
  }
}

async function fetchAndRenderTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.accountId) params.set('accountId', filters.accountId);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);

  const queryString = params.toString();
  const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';

  const { data } = await apiRequest(endpoint);
  appState.transactions = data?.transactions || [];
  renderTransactionsTable();
}

/**
 * RN-FE-09: Semântica Visual de Valores e Estados
 * - Entrada (CHARGE, CREDIT): sinal positivo (+ R$ ...) e cor verde quando PAID
 * - Saída (PAYMENT, DEBIT): sinal negativo (- R$ ...) e cor neutra/laranja quando PAID
 */
function formatTransactionSignedAmount(tx) {
  const isCredit = tx.type === 'CHARGE' || tx.type === 'CREDIT';
  const sign = isCredit ? '+' : '-';
  const formatted = `${sign} ${formatCurrencyBRL(tx.amount)}`;

  if (tx.status === 'PAID') {
    return {
      text: formatted,
      cssClass: isCredit ? 'amount-credit-paid' : 'amount-debit-paid'
    };
  }

  return {
    text: formatted,
    cssClass: 'amount-neutral'
  };
}

/**
 * RN-FE-09: Badges de status distintos:
 * - PAID: Verde (Liquidada)
 * - PENDING: Amarelo (Pendente — não sensibiliza saldo)
 * - FAILED: Vermelho (Falhou — não sensibiliza saldo)
 * - REFUNDED: Roxo/Cinza (Estornada — exibir refundReason e data refundedAt em detalhes/tooltip)
 */
function renderStatusBadgeHtml(tx) {
  const id = tx._id || tx.id;
  const status = tx.status;

  if (status === 'PAID') {
    return `<span class="tag is-status-paid" data-testid="badge-status-${escapeHtml(id)}" title="Liquidada — Sensibilizou o saldo da carteira">PAID</span>`;
  }
  if (status === 'PENDING') {
    return `<span class="tag is-status-pending" data-testid="badge-status-${escapeHtml(id)}" title="Pendente — Não sensibiliza o saldo da carteira">PENDING</span>`;
  }
  if (status === 'FAILED') {
    return `<span class="tag is-status-failed" data-testid="badge-status-${escapeHtml(id)}" title="Falhou — Não sensibiliza o saldo da carteira">FAILED</span>`;
  }
  if (status === 'REFUNDED') {
    const tooltip = `Estornada em ${formatDateTimeBR(tx.refundedAt)} — Motivo: ${tx.refundReason || 'Não informado'}`;
    return `<span class="tag is-status-refunded" data-testid="badge-status-${escapeHtml(id)}" title="${escapeHtml(tooltip)}">REFUNDED</span>`;
  }

  return `<span class="tag is-light" data-testid="badge-status-${escapeHtml(id)}">${escapeHtml(status)}</span>`;
}

function renderTransactionsTable() {
  const container = $('transactions-list-container');
  const countBadge = $('transactions-count-badge');
  if (countBadge) countBadge.textContent = String(appState.transactions.length);
  if (!container) return;

  if (appState.transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" data-testid="transactions-empty-state">
        <p class="title is-6 mb-1">Nenhuma transação encontrada para os filtros selecionados</p>
        <p class="is-size-7 has-text-grey">Utilize o painel ao lado para registrar uma nova cobrança ou pagamento.</p>
      </div>
    `;
    return;
  }

  const accountMap = new Map(appState.accounts.map((a) => [a._id || a.id, a]));
  const sorted = [...appState.transactions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  container.innerHTML = `
    <div class="table-container">
      <table class="table is-fullwidth is-hoverable is-size-7" data-testid="transactions-table">
        <thead>
          <tr>
            <th>Data / Hora</th>
            <th>Carteira</th>
            <th>Tipo</th>
            <th>Descrição &amp; Idempotência</th>
            <th>Status</th>
            <th class="has-text-right">Valor (BRL)</th>
            <th class="has-text-centered">Ação (Estorno)</th>
          </tr>
        </thead>
        <tbody>
          ${sorted
            .map((tx) => {
              const id = tx._id || tx.id;
              const account = accountMap.get(tx.accountId);
              const accountName = account ? account.name : tx.accountId;
              const amountInfo = formatTransactionSignedAmount(tx);
              const canRefund = tx.status === 'PAID';

              const refundDetailsHtml =
                tx.status === 'REFUNDED'
                  ? `<div class="mt-1 p-1 has-background-link-light is-rounded" style="border-radius: 4px;" data-testid="refund-details-${escapeHtml(id)}">
                      <span class="has-text-weight-semibold">Estornada em:</span> ${formatDateTimeBR(tx.refundedAt)}<br/>
                      <span class="has-text-weight-semibold">Motivo:</span> ${escapeHtml(tx.refundReason || '—')}
                    </div>`
                  : '';

              // RN-FE-10: Botão "Solicitar Estorno" habilitado exclusivamente para PAID; desabilitado com tooltip para os demais
              const refundButtonHtml = canRefund
                ? `<button
                    type="button"
                    class="button is-small is-warning is-light has-text-weight-semibold btn-open-refund"
                    data-tx-id="${escapeHtml(id)}"
                    data-testid="btn-refund-${escapeHtml(id)}"
                    title="Solicitar estorno desta transação liquidada"
                  >
                    ↩️ Solicitar Estorno
                  </button>`
                : `<button
                    type="button"
                    class="button is-small is-light"
                    disabled
                    data-testid="btn-refund-${escapeHtml(id)}"
                    title="Apenas transações com status PAID podem ser estornadas"
                  >
                    Indisponível
                  </button>`;

              return `
                <tr data-testid="transaction-row-${escapeHtml(id)}">
                  <td class="is-nowrap">${formatDateTimeBR(tx.createdAt)}</td>
                  <td>
                    <span class="has-text-weight-semibold">${escapeHtml(accountName)}</span>
                  </td>
                  <td>
                    <span class="tag is-light is-monospace has-text-weight-bold">${escapeHtml(tx.type)}</span>
                  </td>
                  <td>
                    <div>${escapeHtml(tx.description || 'Sem descrição')}</div>
                    ${
                      tx.idempotencyKey
                        ? `<div class="is-size-7 has-text-grey is-monospace">Key: ${escapeHtml(tx.idempotencyKey)}</div>`
                        : ''
                    }
                    ${refundDetailsHtml}
                  </td>
                  <td>${renderStatusBadgeHtml(tx)}</td>
                  <td class="has-text-right is-nowrap ${amountInfo.cssClass}" data-testid="transaction-amount-${escapeHtml(id)}">
                    ${amountInfo.text}
                  </td>
                  <td class="has-text-centered">
                    ${refundButtonHtml}
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.btn-open-refund').forEach((btn) => {
    btn.addEventListener('click', () => {
      const txId = btn.getAttribute('data-tx-id');
      openRefundModal(txId);
    });
  });
}

async function handleCreateTransactionSubmit(event) {
  event.preventDefault();
  hideErrorAlert();
  hideSuccessAlert();
  hideIdempotentBanner();

  const accountSelect = $('select-account');
  const typeSelect = $('select-transaction-type');
  const amountInput = $('input-transaction-amount');
  const statusSelect = $('select-transaction-status');
  const descInput = $('input-transaction-description');
  const idemInput = $('input-idempotency-key');
  const keepIdemCheckbox = $('checkbox-keep-idempotency');
  const submitBtn = $('btn-create-transaction');

  setFieldError(accountSelect, $('help-tx-account'), null);
  setFieldError(amountInput, $('help-tx-amount'), null);

  const accountId = (accountSelect?.value || '').trim();
  const type = (typeSelect?.value || 'CHARGE').trim();
  const status = (statusSelect?.value || 'PAID').trim();
  const description = (descInput?.value || '').trim();
  const amount = serializeDecimalAmount(amountInput?.value);

  if (!accountId) {
    const msg = 'O campo accountId é obrigatório para criar uma transação';
    setFieldError(accountSelect, $('help-tx-account'), msg);
    showErrorAlert(msg, 'MISSING_ACCOUNT_ID');
    return;
  }

  if (Number.isNaN(amount)) {
    const msg = 'O valor da transação (amount) é obrigatório e deve ser numérico';
    setFieldError(amountInput, $('help-tx-amount'), msg);
    showErrorAlert(msg, 'INVALID_AMOUNT');
    return;
  }

  // RN-FE-08: Valor estritamente maior que zero (> 0.00)
  if (amount <= 0) {
    setFieldError(
      amountInput,
      $('help-tx-amount'),
      'O valor da transação (amount) deve ser maior que zero'
    );
  }

  // RN-FE-08: Validação de Saldo Disponível em Operações de Saída (PAYMENT / DEBIT) quando PAID
  const selectedAccount = appState.accounts.find((a) => (a._id || a.id) === accountId);
  if (
    selectedAccount &&
    status === 'PAID' &&
    (type === 'PAYMENT' || type === 'DEBIT') &&
    amount > Number(selectedAccount.balance)
  ) {
    setFieldError(
      amountInput,
      $('help-tx-amount'),
      'Saldo insuficiente na conta para realizar esta operação (saldo não pode ficar negativo)'
    );
  }

  // Garante uma Idempotency-Key no envio (RN-FE-08)
  let idempotencyKey = (idemInput?.value || '').trim();
  if (!idempotencyKey) {
    idempotencyKey = generateIdempotencyKey();
    if (idemInput) idemInput.value = idempotencyKey;
  }

  setButtonLoading(submitBtn, true);
  try {
    const { status: httpStatus, data } = await apiRequest('/transactions', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey
      },
      body: {
        accountId,
        type,
        amount,
        status,
        description
      }
    });

    // Atualiza o saldo da carteira localmente se accountBalance veio na resposta
    if (selectedAccount && typeof data?.accountBalance === 'number') {
      selectedAccount.balance = data.accountBalance;
    }

    // RN-FE-08: Tratamento de Resposta e Replay Idempotente
    if (httpStatus === 200 || data?.idempotentReplayed === true) {
      showIdempotentBanner(
        data?.message ||
          'Requisição idempotente: retornando transação processada anteriormente'
      );
    } else {
      showSuccessAlert(data?.message || 'Transação processada com sucesso');
    }

    // Exibe resumo caso webhookDeliveries contenha disparos realizados (RN-FE-08)
    const deliveriesBox = $('tx-webhook-deliveries-box');
    const deliveriesContent = $('tx-webhook-deliveries-content');
    if (deliveriesBox && deliveriesContent) {
      const deliveries = data?.webhookDeliveries || [];
      if (deliveries.length > 0) {
        deliveriesContent.innerHTML = deliveries
          .map(
            (d) => `
            <div class="mb-1">
              • Evento <code>${escapeHtml(d.event)}</code> enviado para <strong>${escapeHtml(d.targetUrl)}</strong>
              (Status: ${escapeHtml(d.statusCode)} ${escapeHtml(d.status)})
            </div>`
          )
          .join('');
        deliveriesBox.classList.remove('is-hidden');
      } else {
        deliveriesBox.classList.add('is-hidden');
      }
    }

    // Se não estiver em modo de manter mesma chave para teste de replay, gera um novo UUID para a próxima tentativa
    if (!keepIdemCheckbox?.checked && idemInput) {
      idemInput.value = generateIdempotencyKey();
    }

    // Recarrega carteiras e extrato preservando filtros atuais
    const currentFilters = getCurrentTransactionFilters();
    const accRes = await apiRequest('/accounts');
    appState.accounts = accRes.data?.accounts || [];
    renderAccountSelectOptions();
    await fetchAndRenderTransactions(currentFilters);
  } catch (err) {
    showErrorAlert(err.message, err.error);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function getCurrentTransactionFilters() {
  return {
    accountId: $('filter-account')?.value || '',
    status: $('filter-status')?.value || '',
    type: $('filter-type')?.value || ''
  };
}

// ============================================================================
// RN-FE-10: MODAL E FLUXO DE CONFIRMAÇÃO DE ESTORNO (POST /transactions/:id/refund)
// ============================================================================
function openRefundModal(transactionId) {
  const tx = appState.transactions.find((t) => (t._id || t.id) === transactionId);
  if (!tx || tx.status !== 'PAID') return;

  appState.pendingRefundTx = tx;

  const modal = $('modal-refund');
  const idInput = $('refund-transaction-id');
  const idDisplay = $('refund-tx-id-display');
  const typeDisplay = $('refund-tx-type-display');
  const amountDisplay = $('refund-tx-amount-display');
  const reasonInput = $('input-refund-reason');
  const impactTitle = $('refund-impact-title');
  const impactDesc = $('refund-impact-description');

  if (idInput) idInput.value = tx._id || tx.id;
  if (idDisplay) idDisplay.textContent = tx._id || tx.id;
  if (typeDisplay) typeDisplay.textContent = tx.type;
  if (amountDisplay) amountDisplay.textContent = formatCurrencyBRL(tx.amount);
  if (reasonInput) reasonInput.value = '';

  const isCredit = tx.type === 'CHARGE' || tx.type === 'CREDIT';
  if (isCredit) {
    // RN-FE-10: Estorno de CHARGE / CREDIT debitará o valor da carteira
    if (impactTitle) {
      impactTitle.textContent = '⚠️ Estorno de Entrada (CHARGE / CREDIT) — Débito na Carteira';
    }
    if (impactDesc) {
      impactDesc.textContent = `Este estorno DEBITARÁ ${formatCurrencyBRL(tx.amount)} do saldo da carteira associada. Exige saldo disponível suficiente (caso contrário a API retornará 422 INSUFFICIENT_FUNDS_FOR_REFUND).`;
    }
  } else {
    // RN-FE-10: Estorno de PAYMENT / DEBIT devolverá (creditará) o valor para a carteira
    if (impactTitle) {
      impactTitle.textContent = 'ℹ️ Estorno de Saída (PAYMENT / DEBIT) — Crédito na Carteira';
    }
    if (impactDesc) {
      impactDesc.textContent = `Este estorno DEVOLVERÁ (creditará) + ${formatCurrencyBRL(tx.amount)} para o saldo da carteira associada.`;
    }
  }

  modal?.classList.add('is-active');
}

function closeRefundModal() {
  appState.pendingRefundTx = null;
  $('modal-refund')?.classList.remove('is-active');
}

async function handleRefundSubmit(event) {
  event.preventDefault();
  hideErrorAlert();
  hideSuccessAlert();

  const txId = $('refund-transaction-id')?.value;
  const reason = ($('input-refund-reason')?.value || '').trim();
  const confirmBtn = $('btn-confirm-refund');

  if (!txId) return;

  setButtonLoading(confirmBtn, true);
  try {
    const body = {};
    if (reason) body.reason = reason;

    const { data } = await apiRequest(`/transactions/${txId}/refund`, {
      method: 'POST',
      body
    });

    closeRefundModal();
    showSuccessAlert(data?.message || 'Estorno de transação realizado com sucesso');

    // RN-FE-10: Atualizar status do item para REFUNDED e sincronizar saldo da carteira com accountBalance
    if (data?.transaction) {
      const idx = appState.transactions.findIndex((t) => (t._id || t.id) === txId);
      if (idx >= 0) {
        appState.transactions[idx] = data.transaction;
      }
      const acc = appState.accounts.find((a) => (a._id || a.id) === data.transaction.accountId);
      if (acc && typeof data.accountBalance === 'number') {
        acc.balance = data.accountBalance;
      }
    }

    const accRes = await apiRequest('/accounts');
    appState.accounts = accRes.data?.accounts || [];
    renderAccountSelectOptions();
    await fetchAndRenderTransactions(getCurrentTransactionFilters());
  } catch (err) {
    closeRefundModal();
    showErrorAlert(err.message, err.error);
  } finally {
    setButtonLoading(confirmBtn, false);
  }
}

// ============================================================================
// 5. MÓDULO DE WEBHOOKS E SIMULADOR HMAC (/webhooks) - RN-FE-11 e RN-FE-12
// ============================================================================
async function loadWebhooksView() {
  try {
    const { data } = await apiRequest('/webhooks');
    appState.webhooks = data?.webhooks || [];
    renderWebhooksList();
    renderWebhookSimulatorSelect();
  } catch (err) {
    if (err.status !== 401) {
      showErrorAlert(err.message, err.error);
    }
  }
}

function renderWebhookSimulatorSelect() {
  const selectEl = $('select-simulate-webhook-id');
  if (!selectEl) return;

  const currentVal = selectEl.value;
  const optionsHtml = [
    '<option value="">Automático (Webhook ativo mais recente)</option>',
    ...appState.webhooks.map((wh) => {
      const id = wh._id || wh.id;
      return `<option value="${escapeHtml(id)}">${escapeHtml(wh.url)} (${escapeHtml(id.slice(0, 8))}...)</option>`;
    })
  ].join('');

  selectEl.innerHTML = optionsHtml;
  if (currentVal && appState.webhooks.some((w) => (w._id || w.id) === currentVal)) {
    selectEl.value = currentVal;
  }
}

function renderWebhooksList() {
  const container = $('webhooks-list-container');
  const countBadge = $('webhooks-count-badge');
  if (countBadge) countBadge.textContent = String(appState.webhooks.length);
  if (!container) return;

  if (appState.webhooks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" data-testid="webhooks-empty-state">
        <p class="title is-6 mb-1">Nenhum endpoint de webhook cadastrado</p>
        <p class="is-size-7 has-text-grey">Cadastre uma URL HTTP/HTTPS acima para receber eventos assinados com HMAC SHA-256.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.webhooks
    .map((wh) => {
      const id = wh._id || wh.id;
      const logs = Array.isArray(wh.deliveryLogs) ? wh.deliveryLogs : [];
      const isExpanded = appState.expandedWebhookLogs.has(id);

      const eventsBadges = (wh.events || [])
        .map((ev) => `<span class="tag is-info is-light is-monospace mr-1 mb-1">${escapeHtml(ev)}</span>`)
        .join('');

      const logsTableHtml =
        logs.length === 0
          ? `<p class="is-size-7 has-text-grey p-3">Nenhuma entrega registrada em <code>deliveryLogs</code> até o momento.</p>`
          : `
            <div class="table-container mt-2">
              <table class="table is-fullwidth is-striped is-size-7" data-testid="webhook-logs-table-${escapeHtml(id)}">
                <thead>
                  <tr>
                    <th>ID do Evento</th>
                    <th>Evento (<code>event</code>)</th>
                    <th>Assinatura HMAC (<code>signature</code>)</th>
                    <th>HTTP</th>
                    <th>Status</th>
                    <th>Data/Hora (<code>attemptedAt</code>)</th>
                  </tr>
                </thead>
                <tbody>
                  ${[...logs]
                    .reverse()
                    .map((log) => {
                      const logId = log._id || log.payload?.id || '—';
                      const sig = log.signature || '';
                      return `
                        <tr data-testid="delivery-log-row-${escapeHtml(logId)}">
                          <td class="is-monospace">${escapeHtml(logId)}</td>
                          <td><span class="tag is-light is-monospace">${escapeHtml(log.event)}</span></td>
                          <td class="is-monospace">
                            <div class="is-flex is-align-items-center">
                              <code class="mr-2" style="word-break: break-all;">${escapeHtml(sig)}</code>
                              <button
                                type="button"
                                class="button is-small is-white btn-copy-log-sig"
                                data-sig="${escapeHtml(sig)}"
                                title="Copiar assinatura HMAC"
                                data-testid="btn-copy-sig-${escapeHtml(logId)}"
                              >
                                📋 Copiar
                              </button>
                            </div>
                          </td>
                          <td><span class="tag is-success is-light has-text-weight-bold">${escapeHtml(log.statusCode || 200)}</span></td>
                          <td><span class="tag is-dark is-small">${escapeHtml(log.status || 'SIMULATED')}</span></td>
                          <td class="is-nowrap">${formatDateTimeBR(log.attemptedAt)}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `;

      return `
        <div class="box mb-3" data-testid="webhook-item-${escapeHtml(id)}">
          <div class="level is-mobile mb-2">
            <div class="level-left">
              <div>
                <p class="has-text-weight-bold is-size-6 is-monospace" data-testid="webhook-url-${escapeHtml(id)}">
                  ${escapeHtml(wh.url)}
                </p>
                <p class="is-size-7 has-text-grey is-monospace">ID: ${escapeHtml(id)} • Criado em: ${formatDateTimeBR(wh.createdAt)}</p>
              </div>
            </div>
            <div class="level-right">
              <span class="tag ${wh.active ? 'is-account-active' : 'is-light'} mr-2">
                ${wh.active ? 'ATIVO' : 'INATIVO'}
              </span>
              <button
                type="button"
                class="button is-small is-link is-light btn-toggle-webhook-logs"
                data-webhook-id="${escapeHtml(id)}"
                data-testid="btn-toggle-logs-${escapeHtml(id)}"
              >
                ${isExpanded ? '🔼 Ocultar Logs' : `🔽 Inspecionar Entregas (${logs.length})`}
              </button>
            </div>
          </div>

          <div class="mb-2">
            ${eventsBadges}
          </div>

          <div
            id="webhook-logs-panel-${escapeHtml(id)}"
            class="${isExpanded ? '' : 'is-hidden'} mt-3 pt-3"
            style="border-top: 1px dashed #cbd5e1;"
            data-testid="webhook-logs-panel-${escapeHtml(id)}"
          >
            <p class="has-text-weight-bold is-size-7 mb-2">Histórico de Entregas (<code>deliveryLogs</code>)</p>
            ${logsTableHtml}
          </div>
        </div>
      `;
    })
    .join('');

  // Toggle expandir/recolher deliveryLogs
  container.querySelectorAll('.btn-toggle-webhook-logs').forEach((btn) => {
    btn.addEventListener('click', () => {
      const whId = btn.getAttribute('data-webhook-id');
      if (!whId) return;
      if (appState.expandedWebhookLogs.has(whId)) {
        appState.expandedWebhookLogs.delete(whId);
      } else {
        appState.expandedWebhookLogs.add(whId);
      }
      renderWebhooksList();
    });
  });

  // Botões de copiar assinatura nos logs
  container.querySelectorAll('.btn-copy-log-sig').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sig = btn.getAttribute('data-sig');
      copyTextToClipboard(sig, 'Assinatura HMAC copiada para a área de transferência!');
    });
  });
}

async function handleCreateWebhookSubmit(event) {
  event.preventDefault();
  hideErrorAlert();
  hideSuccessAlert();

  const urlInput = $('input-webhook-url');
  const helpUrl = $('help-webhook-url');
  const secretInput = $('input-webhook-secret');
  const submitBtn = $('btn-save-webhook');

  setFieldError(urlInput, helpUrl, null);

  const rawUrl = (urlInput?.value || '').trim();
  const rawSecret = (secretInput?.value || '').trim();

  const selectedEvents = Array.from(
    document.querySelectorAll('#form-create-webhook input[name="events"]:checked')
  ).map((el) => el.value);

  // RN-FE-11: URL obrigatória e deve iniciar com http:// ou https://
  if (!rawUrl || !isValidHttpUrl(rawUrl)) {
    const invalidMsg =
      'Informe uma URL válida (http:// ou https://) para o cadastro do webhook';
    setFieldError(urlInput, helpUrl, invalidMsg);
    showErrorAlert(invalidMsg, 'INVALID_WEBHOOK_URL');
    return;
  }

  setButtonLoading(submitBtn, true);
  try {
    const payload = {
      url: rawUrl,
      events: selectedEvents
    };
    if (rawSecret) {
      payload.secret = rawSecret;
    }

    const { data } = await apiRequest('/webhooks', {
      method: 'POST',
      body: payload
    });

    showSuccessAlert(data?.message || 'Webhook registrado com sucesso');
    if (urlInput) urlInput.value = '';
    if (secretInput) secretInput.value = '';
    if (data?.webhook?._id) {
      appState.expandedWebhookLogs.add(data.webhook._id);
    }

    await loadWebhooksView();
  } catch (err) {
    if (err.error === 'INVALID_WEBHOOK_URL') {
      setFieldError(urlInput, helpUrl, err.message);
    }
    showErrorAlert(err.message, err.error);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function handleSimulateWebhookSubmit(event) {
  event.preventDefault();
  hideErrorAlert();
  hideSuccessAlert();

  const webhookIdSelect = $('select-simulate-webhook-id');
  const eventSelect = $('select-simulate-event');
  const dataTextarea = $('textarea-simulate-data');
  const helpJson = $('help-simulate-json');
  const submitBtn = $('btn-simulate-webhook');

  setFieldError(dataTextarea, helpJson, null);

  const webhookId = (webhookIdSelect?.value || '').trim();
  const eventName = (eventSelect?.value || 'webhook.test').trim();
  const rawJson = (dataTextarea?.value || '').trim();

  let parsedData = { message: 'Disparo de teste do Pulsar Payments' };
  if (rawJson) {
    try {
      parsedData = JSON.parse(rawJson);
    } catch {
      const jsonErrMsg = 'O campo data deve conter um objeto JSON válido.';
      setFieldError(dataTextarea, helpJson, jsonErrMsg);
      showErrorAlert(jsonErrMsg, 'INVALID_JSON');
      return;
    }
  }

  setButtonLoading(submitBtn, true);
  try {
    const body = {
      event: eventName,
      data: parsedData
    };
    if (webhookId) {
      body.webhookId = webhookId;
    }

    const { data } = await apiRequest('/webhooks/test', {
      method: 'POST',
      body
    });

    showSuccessAlert(
      data?.message || 'Disparo de webhook simulado com assinatura HMAC SHA-256 gerada'
    );

    // RN-FE-12: Exibição do Resultado de Segurança (Inspeção HMAC)
    const resultPanel = $('simulation-result-panel');
    const targetUrlEl = $('sim-target-url');
    const hmacCodeEl = $('code-hmac-signature');
    const headersPre = $('sim-headers-pre');
    const payloadPre = $('sim-payload-pre');

    if (targetUrlEl) targetUrlEl.value = data?.targetUrl || '';
    if (hmacCodeEl) {
      hmacCodeEl.textContent =
        data?.headers?.['X-Signature'] || data?.deliveryLog?.signature || '';
    }
    if (headersPre) {
      headersPre.textContent = JSON.stringify(data?.headers || {}, null, 2);
    }
    if (payloadPre) {
      payloadPre.textContent = JSON.stringify(data?.payload || {}, null, 2);
    }

    resultPanel?.classList.remove('is-hidden');

    if (data?.webhookId) {
      appState.expandedWebhookLogs.add(data.webhookId);
    }
    await loadWebhooksView();
  } catch (err) {
    showErrorAlert(err.message, err.error);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// ============================================================================
// INICIALIZAÇÃO DE EVENTOS GLOBAIS
// ============================================================================
function bindGlobalEvents() {
  // RN-FE-01: Interceptação global de 401 UNAUTHORIZED oriunda de rotas protegidas
  setOnUnauthorizedHandler((expiredMessage) => {
    navigateTo('/login', { replace: true, preserveAlerts: true });
    showErrorAlert(expiredMessage, 'UNAUTHORIZED');
  });

  // Navegação SPA via links [data-nav]
  document.body.addEventListener('click', (event) => {
    const navLink = event.target.closest('[data-nav]');
    if (navLink) {
      event.preventDefault();
      const target = navLink.getAttribute('data-nav');
      if (target) {
        navigateTo(target);
      }
    }
  });

  // Suporte aos botões Voltar/Avançar do navegador
  window.addEventListener('popstate', () => {
    navigateTo(window.location.pathname, { replace: true });
  });

  // Menu mobile Bulma com Floating Glass Drawer + Backdrop
  const burgerBtn = $('navbar-burger-btn');
  const navbarMenu = $('pulsarNavbar');
  const mobileBackdrop = $('mobile-nav-backdrop');

  const closeMobileMenu = () => {
    burgerBtn?.classList.remove('is-active');
    burgerBtn?.setAttribute('aria-expanded', 'false');
    navbarMenu?.classList.remove('is-active');
    mobileBackdrop?.classList.remove('is-active');
  };

  burgerBtn?.addEventListener('click', () => {
    const willOpen = !navbarMenu?.classList.contains('is-active');
    burgerBtn.classList.toggle('is-active', willOpen);
    burgerBtn.setAttribute('aria-expanded', String(willOpen));
    navbarMenu?.classList.toggle('is-active', willOpen);
    mobileBackdrop?.classList.toggle('is-active', willOpen);
  });

  mobileBackdrop?.addEventListener('click', closeMobileMenu);

  // Fecha o drawer mobile automaticamente ao clicar em qualquer rota [data-nav], link Quem Somos ou botão Sair
  document.body.addEventListener('click', (event) => {
    if (
      event.target.closest('[data-nav]') ||
      event.target.closest('#btn-logout') ||
      event.target.closest('#nav-about-link')
    ) {
      closeMobileMenu();
    }
  });

  // Rolagem suave para a seção estática Quem Somos (#quem-somos)
  $('nav-about-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    const aboutSection = $('quem-somos');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Alternância de Tema (Light / Dark Mode)
  $('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // Botões de fechar alertas
  $('btn-close-error-alert')?.addEventListener('click', hideErrorAlert);
  $('btn-close-success-alert')?.addEventListener('click', hideSuccessAlert);
  $('btn-close-idempotent-banner')?.addEventListener('click', hideIdempotentBanner);

  // Logout
  $('btn-logout')?.addEventListener('click', () => {
    authState.clearSession();
    navigateTo('/login', { replace: true });
    showSuccessAlert('Sessão encerrada com sucesso.');
  });

  // RN-FE-04: Máscara visual em tempo real para CPF/CNPJ e feedback imediato de senha (< 6 caracteres)
  const docInput = $('input-document');
  docInput?.addEventListener('input', () => {
    docInput.value = maskCpfCnpj(docInput.value);
  });

  const passwordInput = $('input-password');
  passwordInput?.addEventListener('input', () => {
    if (appState.authMode === 'register') {
      const val = passwordInput.value || '';
      if (val.length > 0 && val.length < 6) {
        setFieldError(
          passwordInput,
          $('help-password'),
          'A senha deve possuir no mínimo 6 caracteres'
        );
      } else {
        setFieldError(passwordInput, $('help-password'), null);
      }
    } else {
      setFieldError(passwordInput, $('help-password'), null);
    }
  });

  const emailInput = $('input-email');
  emailInput?.addEventListener('blur', () => {
    if (emailInput.value) {
      emailInput.value = emailInput.value.trim().toLowerCase();
    }
  });

  // Submissão de Login / Cadastro
  $('form-auth')?.addEventListener('submit', handleAuthSubmit);

  // Dashboard
  $('btn-refresh-dashboard')?.addEventListener('click', loadDashboardData);

  // Carteiras (/accounts)
  $('form-create-account')?.addEventListener('submit', handleCreateAccountSubmit);
  $('btn-refresh-accounts')?.addEventListener('click', loadAccountsView);
  $('btn-toggle-new-account')?.addEventListener('click', () => {
    $('input-account-name')?.focus();
  });

  // Transações (/transactions)
  $('select-account')?.addEventListener('change', updateSelectedAccountBalanceHint);
  $('btn-generate-idempotency')?.addEventListener('click', () => {
    const idemInput = $('input-idempotency-key');
    if (idemInput) {
      idemInput.value = generateIdempotencyKey();
    }
  });
  $('form-create-transaction')?.addEventListener('submit', handleCreateTransactionSubmit);
  $('btn-refresh-transactions')?.addEventListener('click', () => {
    fetchAndRenderTransactions(getCurrentTransactionFilters());
  });

  // Filtros de Transações (RN-FE-09)
  $('form-filter-transactions')?.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAndRenderTransactions(getCurrentTransactionFilters());
  });
  $('btn-clear-filters')?.addEventListener('click', () => {
    if ($('filter-account')) $('filter-account').value = '';
    if ($('filter-status')) $('filter-status').value = '';
    if ($('filter-type')) $('filter-type').value = '';
    fetchAndRenderTransactions({});
  });

  // Modal de Estorno (RN-FE-10)
  $('btn-close-refund-modal')?.addEventListener('click', closeRefundModal);
  $('btn-cancel-refund')?.addEventListener('click', closeRefundModal);
  $('modal-refund-bg')?.addEventListener('click', closeRefundModal);
  $('form-refund-transaction')?.addEventListener('submit', handleRefundSubmit);

  // Webhooks (/webhooks) - RN-FE-11 e RN-FE-12
  $('form-create-webhook')?.addEventListener('submit', handleCreateWebhookSubmit);
  $('form-simulate-webhook')?.addEventListener('submit', handleSimulateWebhookSubmit);
  $('btn-refresh-webhooks')?.addEventListener('click', loadWebhooksView);

  // Mostrar/ocultar/copiar Segredo HMAC (RN-FE-11)
  $('btn-toggle-secret')?.addEventListener('click', () => {
    const secretInput = $('input-webhook-secret');
    const toggleBtn = $('btn-toggle-secret');
    if (!secretInput || !toggleBtn) return;

    if (secretInput.type === 'password') {
      secretInput.type = 'text';
      toggleBtn.textContent = '🙈 Ocultar';
    } else {
      secretInput.type = 'password';
      toggleBtn.textContent = '👁️ Mostrar';
    }
  });

  $('btn-copy-secret')?.addEventListener('click', () => {
    const secretVal =
      $('input-webhook-secret')?.value.trim() || 'whsec_pulsar_hmac_secret_2026';
    copyTextToClipboard(secretVal, 'Segredo HMAC copiado para a área de transferência!');
  });

  $('btn-copy-simulated-hmac')?.addEventListener('click', () => {
    const hmacText = $('code-hmac-signature')?.textContent?.trim();
    copyTextToClipboard(hmacText, 'Assinatura X-Signature copiada!');
  });
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getInitialTheme());
  bindGlobalEvents();
  navigateTo(window.location.pathname || '/', { replace: true });
});
