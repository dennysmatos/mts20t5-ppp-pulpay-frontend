# Guia de Testabilidade QA, Seletores `data-testid` e Heurísticas (Mentoria 2.0)

O **PulPay (`ppp-pulpay-frontend`)** foi construído aplicando **Design for Testability** para viabilizar suites de automação E2E estáveis em **Cypress**, **Playwright** ou **Selenium WebDriver** em conjunto com testes de API.

---

## 1. Catálogo Completo de Seletores Resilientes (`data-testid`)

### 1.1 Barra de Navegação, Tema & Alertas Globais
| Elemento | Atributo `data-testid` | Papel / Comportamento |
| :--- | :--- | :--- |
| **Logo / Marca PulPay** | `nav&#8209;brand` | Navega para `/dashboard` (se autenticado) ou `/login` |
| **Link Visão Geral** | `nav&#8209;dashboard` | Navega para `/dashboard` |
| **Link Carteiras** | `nav&#8209;accounts` | Navega para `/accounts` |
| **Link Transações & Conciliação** | `nav&#8209;transactions` | Navega para `/transactions` |
| **Link Webhooks & HMAC** | `nav&#8209;webhooks` | Navega para `/webhooks` |
| **Link Quem Somos** | `nav&#8209;about` | Rola suavemente até a seção `#quem-somos` |
| **Botão Minimalista de Tema** | `btn&#8209;theme&#8209;toggle` | Alterna entre `data-theme="dark"` e `data-theme="light"` |
| **Badge do Lojista Logado** | `merchant&#8209;header&#8209;info` | Exibe o nome da Loja autenticada e tooltip com o e-mail |
| **Botão Sair da Conta** | `btn&#8209;logout` | Limpa a sessão JWT e redireciona para `/login` |
| **Alerta Global de Erro** | `alert&#8209;error&#8209;message` | `role="alert"` (`aria-live="assertive"`) com a mensagem da API |
| **Alerta Global de Sucesso** | `alert&#8209;success&#8209;message` | `role="status"` (`aria-live="polite"`) com feedback de confirmação |
| **Banner de Replay Idempotente** | `banner&#8209;idempotent&#8209;replay` | Exibido quando `POST /transactions` retorna `200 OK` (`idempotentReplayed: true`) |

### 1.2 Módulo de Autenticação (`/login` e `/register`)
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| **Aba Login** | `tab&#8209;auth&#8209;login` | Alterna formulário para `/login` |
| **Aba Cadastro** | `tab&#8209;auth&#8209;register` | Alterna formulário para `/register` |
| **Input Razão Social / Nome** | `input&#8209;name` | Visível apenas em `/register` (aplica `trim`) |
| **Input E-mail Corporativo** | `input&#8209;email` | Normaliza automaticamente para minúsculas |
| **Input Documento (CPF/CNPJ)** | `input&#8209;document` | Visível apenas em `/register` (aplica máscara automática) |
| **Input Senha** | `input&#8209;password` | Feedback imediato se `< 6` caracteres no registro |
| **Botão Submeter Autenticação** | `btn&#8209;submit&#8209;auth` | Entra em estado `is-loading` / `disabled` durante o envio |

### 1.3 Módulo de Carteiras (`/accounts`)
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| **Input Nome da Carteira** | `input&#8209;account&#8209;name` | Opcional (padrão `"Conta Principal"`) |
| **Select Moeda Operacional** | `select&#8209;currency` | Opções: `BRL` (padrão), `USD` e `EUR` (para testar erro `422`) |
| **Input Saldo Inicial** | `input&#8209;initial&#8209;balance` | Numérico decimal (valores `< 0` disparam validação / `422`) |
| **Botão Criar Carteira** | `btn&#8209;new&#8209;account` | Submete `POST /accounts` |
| **Card de Carteira** | `account&#8209;card&#8209;<id>` | Card individual da carteira com ID `<id>` |
| **Status da Carteira** | `account&#8209;status&#8209;<id>` | Badge verde (`ACTIVE`) ou vermelho (`BLOCKED`) |
| **Valor do Saldo da Carteira** | `account&#8209;balance&#8209;value` | Saldo formatado em `BRL` (`R$ 1.000,00`) |
| **Empty State de Carteiras** | `accounts&#8209;empty&#8209;state` | Exibido quando o lojista possui `total: 0` carteiras |

### 1.4 Módulo de Transações e Conciliação (`/transactions`)
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| **Select Carteira** | `select&#8209;account` | Lista carteiras do lojista (sinalizando contas `BLOCKED`) |
| **Select Tipo de Operação** | `select&#8209;transaction&#8209;type` | `CHARGE`, `CREDIT`, `PAYMENT`, `DEBIT` |
| **Input Valor da Operação** | `input&#8209;transaction&#8209;amount` | Deve ser `> 0.00` |
| **Select Status Inicial** | `select&#8209;transaction&#8209;status` | `PAID`, `PENDING`, `FAILED` (não permite `REFUNDED`) |
| **Input Descrição** | `input&#8209;transaction&#8209;description` | Descrição opcional do pedido/operação |
| **Input Chave de Idempotência** | `input&#8209;idempotency&#8209;key` | Enviada no header `Idempotency-Key` |
| **Checkbox Manter Idempotência** | `checkbox&#8209;keep&#8209;idempotency` | Mantém a mesma chave após envio para testar Replay `200 OK` |
| **Botão Processar Transação** | `btn&#8209;create&#8209;transaction` | Submete `POST /transactions` |
| **Filtros Combinados** | `filter&#8209;account`, `filter&#8209;status`, `filter&#8209;type`, `btn&#8209;apply&#8209;filters`, `btn&#8209;clear&#8209;filters` | Acionam `GET /transactions` com query params |
| **Badge de Status na Tabela** | `badge&#8209;status&#8209;<id>` | Exibe `PAID`, `PENDING`, `FAILED` ou `REFUNDED` |
| **Botão Solicitar Estorno** | `btn&#8209;refund&#8209;<id>` | Habilitado apenas quando `status === 'PAID'` |
| **Modal de Confirmação de Estorno** | `modal&#8209;refund`, `input&#8209;refund&#8209;reason`, `btn&#8209;confirm&#8209;refund`, `btn&#8209;cancel&#8209;refund` | Submete `POST /transactions/:id/refund` |

### 1.5 Módulo de Webhooks, Simulador HMAC (`/webhooks`) e Seção Quem Somos
| Elemento | Atributo `data-testid` | Observações de Teste |
| :--- | :--- | :--- |
| **Input URL do Webhook** | `input&#8209;webhook&#8209;url` | Deve iniciar com `http://` ou `https://` |
| **Checkboxes de Eventos** | `checkbox&#8209;event&#8209;transaction.paid`, `checkbox&#8209;event&#8209;transaction.failed`, `checkbox&#8209;event&#8209;transaction.refunded`, `checkbox&#8209;event&#8209;webhook.test` | Todos marcados por padrão |
| **Input Segredo HMAC** | `input&#8209;webhook&#8209;secret`, `btn&#8209;toggle&#8209;secret`, `btn&#8209;copy&#8209;secret` | Permite mostrar/ocultar e copiar o segredo |
| **Botão Salvar Webhook** | `btn&#8209;save&#8209;webhook` | Submete `POST /webhooks` |
| **Simulador de Webhook** | `select&#8209;simulate&#8209;webhook&#8209;id`, `select&#8209;simulate&#8209;event`, `textarea&#8209;simulate&#8209;data`, `btn&#8209;simulate&#8209;webhook` | Submete `POST /webhooks/test` |
| **Resultado de Assinatura HMAC** | `code&#8209;hmac&#8209;signature`, `sim&#8209;target&#8209;url`, `sim&#8209;headers&#8209;pre`, `sim&#8209;payload&#8209;pre` | Exibe `sha256=<64_hex_chars>` |
| **Seção Quem Somos & Vídeo** | `section&#8209;about`, `about&#8209;portfolio&#8209;badge`, `about&#8209;author&#8209;badge`, `about&#8209;video&#8209;player`, `btn&#8209;video&#8209;play&#8209;toggle`, `btn&#8209;video&#8209;mute&#8209;toggle` | Valida badges didáticos e controles de loop/pausa/áudio do vídeo |

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

---

## 3. Especificação Formal de Casos de Teste (ISO/IEC/IEEE 29119-3)

Para consultar os **14 Casos de Teste** detalhados passo a passo com Pré-Condições, Ações, Resultados Esperados, Pós-Condições e Matriz de Rastreabilidade seguindo a norma **ISO-29119-3**, acesse a página dedicada da Wiki:

- **[Casos de Teste (ISO/IEC/IEEE 29119-3)](Casos-de-Teste-ISO-29119-3)**

