# Guia de Testabilidade QA, Seletores `data-testid` e Heurísticas (Mentoria 2.0)

O **PulPay (`ppp-pulpay-frontend`)** foi construído aplicando **Design for Testability** para viabilizar suites de automação E2E estáveis em **Cypress**, **Playwright** ou **Selenium WebDriver** em conjunto com testes de API.

---

## 1. Catálogo Completo de Seletores Resilientes (`data-testid`)

### 1.1 Barra de Navegação, Tema & Alertas Globais
| Elemento | Atributo `data-testid` | Papel / Comportamento |
| :--- | :--- | :--- |
| Logo / Marca PulPay | `nav-brand` | Navega para `/dashboard` (se autenticado) ou `/login` |
| Link Visão Geral | `nav-dashboard` | Navega para `/dashboard` |
| Link Carteiras | `nav-accounts` | Navega para `/accounts` |
| Link Transações & Conciliação | `nav-transactions` | Navega para `/transactions` |
| Link Webhooks & HMAC | `nav-webhooks` | Navega para `/webhooks` |
| Link Quem Somos | `nav-about` | Rola suavemente até a seção `#quem-somos` |
| Botão Minimalista de Tema | `btn-theme-toggle` | Alterna entre `data-theme="dark"` e `data-theme="light"` |
| Badge do Lojista Logado | `merchant-header-info` | Exibe o nome da Loja autenticada e tooltip com o e-mail |
| Botão Sair da Conta | `btn-logout` | Limpa a sessão JWT e redireciona para `/login` |
| Alerta Global de Erro | `alert-error-message` | `role="alert"` (`aria-live="assertive"`) com a mensagem da API |
| Alerta Global de Sucesso | `alert-success-message` | `role="status"` (`aria-live="polite"`) com feedback de confirmação |
| Banner de Replay Idempotente | `banner-idempotent-replay` | Exibido quando `POST /transactions` retorna `200 OK` (`idempotentReplayed: true`) |

### 1.2 Módulo de Autenticação (`/login` e `/register`)
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| Aba Login | `tab-auth-login` | Alterna formulário para `/login` |
| Aba Cadastro | `tab-auth-register` | Alterna formulário para `/register` |
| Input Razão Social / Nome | `input-name` | Visível apenas em `/register` (aplica `trim`) |
| Input E-mail Corporativo | `input-email` | Normaliza automaticamente para minúsculas |
| Input Documento (CPF/CNPJ) | `input-document` | Visível apenas em `/register` (aplica máscara automática) |
| Input Senha | `input-password` | Feedback imediato se `< 6` caracteres no registro |
| Botão Submeter Autenticação | `btn-submit-auth` | Entra em estado `is-loading` / `disabled` durante o envio |

### 1.3 Módulo de Carteiras (`/accounts`)
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| Input Nome da Carteira | `input-account-name` | Opcional (padrão `"Conta Principal"`) |
| Select Moeda Operacional | `select-currency` | Opções: `BRL` (padrão), `USD` e `EUR` (para testar erro `422`) |
| Input Saldo Inicial | `input-initial-balance` | Numérico decimal (valores `< 0` disparam validação / `422`) |
| Botão Criar Carteira | `btn-new-account` | Submete `POST /accounts` |
| Card de Carteira | `account-card-<id>` | Card individual da carteira com ID `<id>` |
| Status da Carteira | `account-status-<id>` | Badge verde (`ACTIVE`) ou vermelho (`BLOCKED`) |
| Valor do Saldo da Carteira | `account-balance-value` | Saldo formatado em `BRL` (`R$ 1.000,00`) |
| Empty State de Carteiras | `accounts-empty-state` | Exibido quando o lojista possui `total: 0` carteiras |

### 1.4 Módulo de Transações e Conciliação (`/transactions`)
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| Select Carteira | `select-account` | Lista carteiras do lojista (sinalizando contas `BLOCKED`) |
| Select Tipo de Operação | `select-transaction-type` | `CHARGE`, `CREDIT`, `PAYMENT`, `DEBIT` |
| Input Valor da Operação | `input-transaction-amount` | Deve ser `> 0.00` |
| Select Status Inicial | `select-transaction-status` | `PAID`, `PENDING`, `FAILED` (não permite `REFUNDED`) |
| Input Descrição | `input-transaction-description` | Descrição opcional do pedido/operação |
| Input Chave de Idempotência | `input-idempotency-key` | Enviada no header `Idempotency-Key` |
| Checkbox Manter Idempotência | `checkbox-keep-idempotency` | Mantém a mesma chave após envio para testar Replay `200 OK` |
| Botão Processar Transação | `btn-create-transaction` | Submete `POST /transactions` |
| Filtros Combinados | `filter-account`, `filter-status`, `filter-type`, `btn-apply-filters`, `btn-clear-filters` | Acionam `GET /transactions` com query params |
| Badge de Status na Tabela | `badge-status-<id>` | Exibe `PAID`, `PENDING`, `FAILED` ou `REFUNDED` |
| Botão Solicitar Estorno | `btn-refund-<id>` | Habilitado apenas quando `status === 'PAID'` |
| Modal de Confirmação de Estorno | `modal-refund`, `input-refund-reason`, `btn-confirm-refund`, `btn-cancel-refund` | Submete `POST /transactions/:id/refund` |

### 1.5 Módulo de Webhooks, Simulador HMAC (`/webhooks`) e Seção Quem Somos
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| Input URL do Webhook | `input-webhook-url` | Deve iniciar com `http://` ou `https://` |
| Checkboxes de Eventos | `checkbox-event-transaction.paid`, `checkbox-event-transaction.failed`, `checkbox-event-transaction.refunded`, `checkbox-event-webhook.test` | Todos marcados por padrão |
| Input Segredo HMAC | `input-webhook-secret`, `btn-toggle-secret`, `btn-copy-secret` | Permite mostrar/ocultar e copiar o segredo |
| Botão Salvar Webhook | `btn-save-webhook` | Submete `POST /webhooks` |
| Simulador de Webhook | `select-simulate-webhook-id`, `select-simulate-event`, `textarea-simulate-data`, `btn-simulate-webhook` | Submete `POST /webhooks/test` |
| Resultado de Assinatura HMAC | `code-hmac-signature`, `sim-target-url`, `sim-headers-pre`, `sim-payload-pre` | Exibe `sha256=<64_hex_chars>` |
| Seção Quem Somos & Vídeo | `section-about`, `about-portfolio-badge`, `about-author-badge`, `about-video-player`, `btn-video-play-toggle`, `btn-video-mute-toggle` | Valida badges didáticos e controles de loop/pausa/áudio do vídeo |

---

## 2. Aplicação das Heurísticas e Técnicas de Teste (Mentoria 2.0)

1. **Particionamento de Equivalência:**
   - **Moeda de Carteira:** Partição válida (`BRL`) vs. Partições inválidas (`USD`, `EUR` → `422 UNSUPPORTED_CURRENCY`).
   - **URL de Webhook:** Partições válidas (`http://...`, `https://...`) vs. Partições inválidas (`ftp://...`, texto sem protocolo → `400 INVALID_WEBHOOK_URL`).
2. **Análise de Valor Limite (Boundary Value Analysis - BVA):**
   - **Senha no Cadastro (`/register`):** `5` caracteres (rejeitado com feedback imediato e `400 WEAK_PASSWORD`) vs. `6` caracteres (aceito com `201 Created`).
   - **Saldo Inicial (`/accounts`):** `-0.01` (`422 NEGATIVE_BALANCE_NOT_ALLOWED`), `0.00` (`201 Created`), `0.01` (`201 Created`).
   - **Débito em Carteira (`/transactions` com `PAYMENT` + `PAID`):** valor igual ao saldo atual (`201 Created`, saldo resultante `R$ 0,00`) vs. valor `R$ 0,01` acima do saldo atual (`422 INSUFFICIENT_FUNDS`).
3. **Teste de Transição de Estados:**
   - Validar na UI que transações criadas como `PENDING` ou `FAILED` mantêm o botão `[data-testid="btn-refund-<id>"]` desabilitado (`disabled`), enquanto transações `PAID` habilitam o botão e, após o estorno, transitam para `REFUNDED` e desabilitam novo estorno.
4. **Teste de Replay Idempotente:**
   - Marcar `[data-testid="checkbox-keep-idempotency"]`, enviar uma transação (`201 Created`) e clicar novamente em `[data-testid="btn-create-transaction"]`. Verificar que `[data-testid="banner-idempotent-replay"]` fica visível e que o saldo em `[data-testid="account-balance-value"]` não sofreu alteração duplicada.
