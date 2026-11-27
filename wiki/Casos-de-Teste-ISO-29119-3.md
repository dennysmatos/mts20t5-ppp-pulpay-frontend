# Especificação de Casos de Teste (ISO/IEC/IEEE 29119-3)

> **Projeto de Portfólio Pessoal - Turma 5** • **Mentoria 2.0 (Júlio de Lima)**  
> **Autor:** Dennys Matos (`By Dennys Matos`)

Este documento apresenta a especificação formal dos **Casos de Teste** da aplicação Web **PulPay (`pulsar payments`)**, estruturada em conformidade com a norma internacional **ISO/IEC/IEEE 29119-3 (*Software and systems engineering — Software testing — Part 3: Test documentation*)**.

Os casos de teste abaixo cobrem as Regras de Negócio do Frontend (`RN-FE-01` a `RN-FE-12`), as Regras Financeiras do Backend (`RN01` a `RN05`) e os Requisitos Funcionais (`RF01` a `RF04`), aplicando técnicas de **Particionamento de Equivalência**, **Análise de Valor Limite (BVA)**, **Transição de Estados** e **Testes de Idempotência e Segurança HMAC**.

---

## Matriz Resumo de Rastreabilidade dos Casos de Teste

| ID | Título do Caso de Teste | Prioridade | Rastreabilidade |
| :---: | :--- | :---: | :--- |
| **CT-01** | Validar que o cadastro de novo lojista é realizado com sucesso ao informar dados válidos e senha com no mínimo 6 caracteres | Alta | `RF01`, `RN-FE-01`, `RN-FE-04`, `RN01` |
| **CT-02** | Validar que o cadastro de lojista é bloqueado ao informar senha com menos de 6 caracteres (Valor Limite = 5 caracteres) | Média | `RF01`, `RN-FE-03`, `RN-FE-04`, `RN01` |
| **CT-03** | Validar que o login é recusado ao informar credenciais inválidas preservando o e-mail preenchido e limpando apenas o campo de senha | Alta | `RF01`, `RN-FE-03`, `RN-FE-05`, `RN01` |
| **CT-04** | Validar que usuários não autenticados são redirecionados imediatamente para `/login` ao tentar acessar rotas privadas (Route Guards) | Alta | `RN-FE-01`, `RN01` |
| **CT-05** | Validar que uma nova carteira operacional em BRL é criada com sucesso ao informar saldo inicial maior ou igual a R$ 0,00 | Alta | `RF02`, `RN-FE-02`, `RN-FE-06`, `RN-FE-07`, `RN02` |
| **CT-06** | Validar que a criação de carteira é bloqueada ao informar saldo inicial negativo (`422 NEGATIVE_BALANCE_NOT_ALLOWED`) | Alta | `RF02`, `RN-FE-03`, `RN-FE-07`, `RN02` |
| **CT-07** | Validar que a criação de carteira é bloqueada ao selecionar moeda diferente de BRL (`422 UNSUPPORTED_CURRENCY`) | Média | `RF02`, `RN-FE-03`, `RN-FE-07`, `RN02` |
| **CT-08** | Validar que uma transação de entrada (`CHARGE` ou `CREDIT`) com status `PAID` credita o valor no saldo da carteira em BRL | Alta | `RF03`, `RN-FE-02`, `RN-FE-08`, `RN-FE-09`, `RN03` |
| **CT-09** | Validar que uma transação de saída (`PAYMENT` ou `DEBIT`) com status `PAID` é bloqueada quando o valor excede o saldo disponível da carteira (`422 INSUFFICIENT_FUNDS`) | Alta | `RF03`, `RN-FE-03`, `RN-FE-08`, `RN02`, `RN03` |
| **CT-10** | Validar que o reenvio de transação com a mesma `Idempotency-Key` retorna `200 OK`, exibe o banner de replay idempotente e não duplica o saldo da carteira | Alta | `RF03`, `RN-FE-08`, `RN04` |
| **CT-11** | Validar que o estorno (`REFUND`) de uma transação com status `PAID` altera seu estado para `REFUNDED` e reverte o impacto financeiro no saldo da carteira | Alta | `RF03`, `RN-FE-09`, `RN-FE-10`, `RN05` |
| **CT-12** | Validar que transações com status `PENDING`, `FAILED` ou `REFUNDED` mantêm a ação de estorno desabilitada na interface (Máquina de Estados) | Média | `RF03`, `RN-FE-09`, `RN-FE-10`, `RN05` |
| **CT-13** | Validar que o cadastro de webhook é bloqueado ao informar uma URL sem protocolo `http://` ou `https://` (`400 INVALID_WEBHOOK_URL`) | Baixa | `RF04`, `RN-FE-03`, `RN-FE-11` |
| **CT-14** | Validar que o simulador de webhook gera a assinatura criptográfica HMAC SHA-256 (`X-Signature: sha256=<64_hex_chars>`) e registra o log de entrega | Alta | `RF04`, `RN-FE-11`, `RN-FE-12`, `RN05` |

---

## Especificação Detalhada dos Casos de Teste

### Caso de Teste 01 — Cadastro de Novo Lojista com Dados Válidos
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 1 <td colspan=2/> |
| **Título** | Validar que o cadastro de novo lojista é realizado com sucesso ao informar dados válidos e senha com no mínimo 6 caracteres <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF01, RN-FE-01, RN-FE-04, RN01 <td colspan=2/> |
| **Pré-Condições** | - Aplicação Web Frontend (`http://localhost:4000` ou `https://pulpay.qatec.com.br`) e API Backend operacionais<br>- Usuário não autenticado (sem sessão JWT ativa)<br>- E-mail informado ainda não cadastrado na base de lojistas <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a aplicação Web do PulPay em `/login` | A tela de autenticação do lojista é apresentada |
| Passo 2 | Clicar na aba `Cadastro (/register)` (`[data-testid="tab-auth-register"]`) | O formulário de registro de novo lojista é apresentado com os campos Razão Social, E-mail, Documento e Senha |
| Passo 3 | Informar uma Razão Social válida no campo `[data-testid="input-name"]` (ex.: `Pulsar Comércio Digital LTDA`) | N/A |
| Passo 4 | Informar um e-mail válido e inédito no campo `[data-testid="input-email"]` (ex.: `contato@pulsardigital.com.br`) | O campo normaliza o endereço de e-mail para letras minúsculas |
| Passo 5 | Informar um CNPJ numérico no campo `[data-testid="input-document"]` (ex.: `12345678000199`) | A máscara visual `12.345.678/0001-99` é aplicada automaticamente no campo |
| Passo 6 | Informar uma senha com 6 ou mais caracteres no campo `[data-testid="input-password"]` (ex.: `Senha@123`) | N/A |
| Passo 7 | Clicar no botão `Registrar Lojista` (`[data-testid="btn-submit-auth"]`) | Uma notificação de sucesso é apresentada com a mensagem `"Lojista registrado com sucesso"` (`201 Created`) e o usuário é redirecionado automaticamente para `/dashboard` |
| <td colspan=3/> |
| **Pós-Condições** | - O token JWT e os dados públicos do lojista ficam armazenados no estado de autenticação da aplicação<br>- O nome da loja passa a ser exibido no badge superior `[data-testid="merchant-header-info"]` <td colspan=2/> |

---

### Caso de Teste 02 — Bloqueio de Cadastro com Senha Fraca (Análise de Valor Limite)
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 2 <td colspan=2/> |
| **Título** | Validar que o cadastro de lojista é bloqueado ao informar senha com menos de 6 caracteres (Valor Limite = 5 caracteres) <td colspan=2/> |
| **Prioridade** | Média <td colspan=2/> |
| **Rastreabilidade** | RF01, RN-FE-03, RN-FE-04, RN01 <td colspan=2/> |
| **Pré-Condições** | - Usuário não autenticado na rota `/register` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela de cadastro em `/register` | O formulário de cadastro de lojista é apresentado |
| Passo 2 | Preencher o campo Razão Social (`[data-testid="input-name"]`) com `Loja Teste QA` | N/A |
| Passo 3 | Preencher o campo E-mail (`[data-testid="input-email"]`) com `qa.limite@pulsar.com.br` | N/A |
| Passo 4 | Digitar uma senha contendo exatamente 5 caracteres no campo `[data-testid="input-password"]` (ex.: `12345`) | A interface exibe feedback imediato abaixo do campo informando `"A senha deve possuir no mínimo 6 caracteres"` |
| Passo 5 | Clicar no botão `Registrar Lojista` (`[data-testid="btn-submit-auth"]`) | O envio é bloqueado com o alerta `[WEAK_PASSWORD] A senha deve possuir no mínimo 6 caracteres` em `[data-testid="alert-error-message"]` |
| <td colspan=3/> |
| **Pós-Condições** | - Nenhum registro é criado para o lojista<br>- O usuário permanece na rota `/register` sem token JWT emitido <td colspan=2/> |

---

### Caso de Teste 03 — Tratamento de Credenciais Inválidas no Login
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 3 <td colspan=2/> |
| **Título** | Validar que o login é recusado ao informar credenciais inválidas preservando o e-mail preenchido e limpando apenas o campo de senha <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF01, RN-FE-03, RN-FE-05, RN01 <td colspan=2/> |
| **Pré-Condições** | - Existir o lojista `financeiro@lojaestrela.com.br` cadastrado na base de dados<br>- Usuário não autenticado na tela `/login` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela de login em `/login` | O formulário de login é apresentado |
| Passo 2 | Informar o e-mail `financeiro@lojaestrela.com.br` no campo `[data-testid="input-email"]` | N/A |
| Passo 3 | Informar uma senha incorreta no campo `[data-testid="input-password"]` (ex.: `SenhaErrada999`) | N/A |
| Passo 4 | Submeter o formulário clicando em `Entrar` (`[data-testid="btn-submit-auth"]`) | O alerta de erro `[data-testid="alert-error-message"]` apresenta a mensagem `"Credenciais inválidas: e-mail ou senha incorretos"` (`401 INVALID_CREDENTIALS`) |
| <td colspan=3/> |
| **Pós-Condições** | - O campo de e-mail (`[data-testid="input-email"]`) mantém o valor `financeiro@lojaestrela.com.br` preenchido<br>- O campo de senha (`[data-testid="input-password"]`) é limpo automaticamente <td colspan=2/> |

---

### Caso de Teste 04 — Proteção de Rotas Privadas (Route Guards)
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 4 <td colspan=2/> |
| **Título** | Validar que usuários não autenticados são redirecionados imediatamente para `/login` ao tentar acessar rotas privadas (Route Guards) <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RN-FE-01, RN01 <td colspan=2/> |
| **Pré-Condições** | - Usuário não autenticado (sem token JWT no `localStorage`) <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar diretamente a URL privada `/dashboard` no navegador | O Route Guard intercepta a navegação e redireciona imediatamente para `/login` |
| Passo 2 | Tentar acessar diretamente as URLs privadas `/accounts`, `/transactions` e `/webhooks` | Em todas as tentativas o usuário é redirecionado imediatamente para `/login` e a tela de autenticação é apresentada |
| <td colspan=3/> |
| **Pós-Condições** | - Nenhuma informação financeira de carteiras, transações ou webhooks é exibida sem autenticação válida <td colspan=2/> |

---

### Caso de Teste 05 — Criação de Nova Carteira Operacional em BRL
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 5 <td colspan=2/> |
| **Título** | Validar que uma nova carteira operacional em BRL é criada com sucesso ao informar saldo inicial maior ou igual a R$ 0,00 <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF02, RN-FE-02, RN-FE-06, RN-FE-07, RN02 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado com token JWT válido | <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar o módulo `Carteiras` (`/accounts`) pelo menu superior (`[data-testid="nav-accounts"]`) | A tela de Gestão de Contas / Carteiras é apresentada |
| Passo 2 | Informar o nome `Carteira Recebíveis PIX` no campo `[data-testid="input-account-name"]` | N/A |
| Passo 3 | Manter a moeda `BRL — Real Brasileiro (Padrão)` selecionada em `[data-testid="select-currency"]` | N/A |
| Passo 4 | Informar o saldo inicial `1000.00` no campo `[data-testid="input-initial-balance"]` | N/A |
| Passo 5 | Clicar no botão `Criar Carteira` (`[data-testid="btn-new-account"]`) | Uma notificação de sucesso é apresentada com a mensagem `"Conta criada com sucesso"` (`201 Created`) |
| <td colspan=3/> |
| **Pós-Condições** | - O novo card da carteira é exibido imediatamente na listagem com badge verde `ACTIVE (Ativa)` e saldo formatado como `R$ 1.000,00` (`[data-testid="account-balance-value"]`)<br>- A nova carteira passa a estar disponível no seletor de carteiras da tela de Transações <td colspan=2/> |

---

### Caso de Teste 06 — Trava contra Criação de Carteira com Saldo Inicial Negativo
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 6 <td colspan=2/> |
| **Título** | Validar que a criação de carteira é bloqueada ao informar saldo inicial negativo (`422 NEGATIVE_BALANCE_NOT_ALLOWED`) <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF02, RN-FE-03, RN-FE-07, RN02 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado na rota `/accounts` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela `Carteiras` (`/accounts`) | O formulário `Criar Nova Carteira` é apresentado |
| Passo 2 | Informar o nome `Carteira Inválida` em `[data-testid="input-account-name"]` | N/A |
| Passo 3 | Informar o valor negativo `-50.00` no campo Saldo Inicial (`[data-testid="input-initial-balance"]`) | N/A |
| Passo 4 | Clicar no botão `Criar Carteira` (`[data-testid="btn-new-account"]`) | O alerta de erro `[data-testid="alert-error-message"]` apresenta a mensagem `"Operação não permitida: o saldo da conta não pode ser negativo"` (`422 NEGATIVE_BALANCE_NOT_ALLOWED`) |
| <td colspan=3/> |
| **Pós-Condições** | - A carteira com saldo negativo não é criada na listagem do lojista <td colspan=2/> |

---

### Caso de Teste 07 — Bloqueio de Criação de Carteira com Moeda Não Suportada
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 7 <td colspan=2/> |
| **Título** | Validar que a criação de carteira é bloqueada ao selecionar moeda diferente de BRL (`422 UNSUPPORTED_CURRENCY`) <td colspan=2/> |
| **Prioridade** | Média <td colspan=2/> |
| **Rastreabilidade** | RF02, RN-FE-03, RN-FE-07, RN02 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado na rota `/accounts` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela `Carteiras` (`/accounts`) | O formulário `Criar Nova Carteira` é apresentado |
| Passo 2 | Selecionar a opção `USD — Dólar Americano (Teste QA 422)` no campo `[data-testid="select-currency"]` | A moeda `USD` fica selecionada |
| Passo 3 | Informar o saldo inicial `100.00` em `[data-testid="input-initial-balance"]` | N/A |
| Passo 4 | Clicar no botão `Criar Carteira` (`[data-testid="btn-new-account"]`) | O alerta de erro `[data-testid="alert-error-message"]` apresenta a mensagem `"Moeda não suportada. O Pulsar Payments opera exclusivamente com BRL"` (`422 UNSUPPORTED_CURRENCY`) |
| <td colspan=3/> |
| **Pós-Condições** | - Nenhuma carteira em moeda estrangeira é criada <td colspan=2/> |

---

### Caso de Teste 08 — Processamento de Transação de Entrada (`CHARGE`) Liquidada (`PAID`)
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 8 <td colspan=2/> |
| **Título** | Validar que uma transação de entrada (`CHARGE` ou `CREDIT`) com status `PAID` credita o valor no saldo da carteira em BRL <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF03, RN-FE-02, RN-FE-08, RN-FE-09, RN03 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado<br>- Carteira ativa com saldo atual de `R$ 1.000,00` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar o módulo `Transações & Conciliação` (`/transactions`) | O formulário `Nova Transação` e a tabela de extrato são apresentados |
| Passo 2 | Selecionar a carteira ativa com saldo de `R$ 1.000,00` em `[data-testid="select-account"]` | O saldo disponível da carteira selecionada (`R$ 1.000,00`) é exibido abaixo do seletor |
| Passo 3 | Selecionar o tipo `CHARGE — Cobrança (+ Crédito)` em `[data-testid="select-transaction-type"]` | N/A |
| Passo 4 | Informar o valor `250.00` no campo `[data-testid="input-transaction-amount"]` | N/A |
| Passo 5 | Manter o status inicial `PAID — Liquidada (Sensibiliza Saldo)` em `[data-testid="select-transaction-status"]` | N/A |
| Passo 6 | Informar a descrição `Pedido #1050 - PIX` em `[data-testid="input-transaction-description"]` | N/A |
| Passo 7 | Clicar no botão `Processar Transação` (`[data-testid="btn-create-transaction"]`) | A mensagem `"Transação processada com sucesso"` (`201 Created`) é apresentada |
| <td colspan=3/> |
| **Pós-Condições** | - A carteira passa a ter saldo atualizado de `R$ 1.250,00`<br>- A transação aparece no topo do extrato com badge verde `PAID`, valor `+ R$ 250,00` em verde e botão `Solicitar Estorno` habilitado <td colspan=2/> |

---

### Caso de Teste 09 — Bloqueio de Débito/Pagamento Acima do Saldo Disponível
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 9 <td colspan=2/> |
| **Título** | Validar que uma transação de saída (`PAYMENT` ou `DEBIT`) com status `PAID` é bloqueada quando o valor excede o saldo disponível da carteira (`422 INSUFFICIENT_FUNDS`) <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF03, RN-FE-03, RN-FE-08, RN02, RN03 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado<br>- Carteira ativa com saldo atual de `R$ 1.250,00` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela `Transações & Conciliação` (`/transactions`) | O formulário `Nova Transação` é apresentado |
| Passo 2 | Selecionar a carteira com saldo de `R$ 1.250,00` em `[data-testid="select-account"]` | Os dados e saldo da carteira são apresentados |
| Passo 3 | Selecionar o tipo de saída `PAYMENT — Pagamento (- Saída)` em `[data-testid="select-transaction-type"]` | N/A |
| Passo 4 | Informar um valor maior que o saldo disponível (ex.: `1250.01` ou `5000.00`) em `[data-testid="input-transaction-amount"]` | N/A |
| Passo 5 | Manter o status inicial `PAID` em `[data-testid="select-transaction-status"]` | N/A |
| Passo 6 | Clicar em `Processar Transação` (`[data-testid="btn-create-transaction"]`) | O alerta de erro `[data-testid="alert-error-message"]` apresenta a mensagem `"Saldo insuficiente na conta para realizar esta operação (saldo não pode ficar negativo)"` (`422 INSUFFICIENT_FUNDS`) |
| <td colspan=3/> |
| **Pós-Condições** | - O saldo da carteira permanece inalterado em `R$ 1.250,00`<br>- Nenhuma transação de débito é registrada <td colspan=2/> |

---

### Caso de Teste 10 — Controle de Idempotência e Prevenção de Duplicidade Financeira
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 10 <td colspan=2/> |
| **Título** | Validar que o reenvio de transação com a mesma `Idempotency-Key` retorna `200 OK`, exibe o banner de replay idempotente e não duplica o saldo da carteira <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF03, RN-FE-08, RN04 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado<br>- Carteira ativa com saldo de `R$ 1.000,00` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela `Transações & Conciliação` (`/transactions`) | O formulário `Nova Transação` é apresentado com um UUID preenchido em `[data-testid="input-idempotency-key"]` |
| Passo 2 | Marcar a caixa de seleção `Manter mesma chave após envio (Modo Teste QA de Replay Idempotente 200 OK)` (`[data-testid="checkbox-keep-idempotency"]`) | A opção permanece marcada para preservar a chave entre cliques |
| Passo 3 | Informar uma cobrança (`CHARGE` + `PAID`) no valor de `100.00` e clicar em `Processar Transação` (`[data-testid="btn-create-transaction"]`) | A primeira execução retorna `201 Created` (`"Transação processada com sucesso"`) e o saldo da carteira sobe para `R$ 1.100,00` |
| Passo 4 | Clicar novamente em `Processar Transação` (`[data-testid="btn-create-transaction"]`) mantendo exatamente a mesma chave em `[data-testid="input-idempotency-key"]` | O banner de aviso `[data-testid="banner-idempotent-replay"]` é apresentado com a mensagem `"Requisição idempotente: retornando transação processada anteriormente"` (`200 OK`, `idempotentReplayed: true`) |
| <td colspan=3/> |
| **Pós-Condições** | - O saldo da carteira permanece em `R$ 1.100,00` (sem crédito duplicado)<br>- Nenhuma nova linha duplicada é criada no extrato de transações <td colspan=2/> |

---

### Caso de Teste 11 — Estorno (`REFUND`) de Transação Liquidada (`PAID`)
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 11 <td colspan=2/> |
| **Título** | Validar que o estorno (`REFUND`) de uma transação com status `PAID` altera seu estado para `REFUNDED` e reverte o impacto financeiro no saldo da carteira <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF03, RN-FE-09, RN-FE-10, RN05 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado<br>- Existir uma transação do tipo `CHARGE` no valor de `R$ 250,00` com status `PAID` vinculada a uma carteira com saldo atual de `R$ 1.250,00` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar a tela `Transações & Conciliação` (`/transactions`) | A listagem de transações apresenta a transação `PAID` de `R$ 250,00` com o botão `Solicitar Estorno` (`[data-testid="btn-refund-<id>"]`) habilitado |
| Passo 2 | Clicar no botão `Solicitar Estorno` da transação | O modal de confirmação `[data-testid="modal-refund"]` é aberto exibindo o impacto financeiro (débito de `R$ 250,00` na carteira) |
| Passo 3 | Informar o motivo `Cancelamento solicitado pelo cliente dentro do prazo de 7 dias` no campo `[data-testid="input-refund-reason"]` | N/A |
| Passo 4 | Clicar no botão `Confirmar Estorno` (`[data-testid="btn-confirm-refund"]`) | O modal é fechado e uma notificação de sucesso é apresentada dizendo `"Estorno de transação realizado com sucesso"` (`200 OK`) |
| <td colspan=3/> |
| **Pós-Condições** | - O status da transação na tabela muda para `REFUNDED` (badge roxo `[data-testid="badge-status-<id>"]`) exibindo a data/hora do estorno e o motivo informado<br>- O saldo da carteira associada é debitado em `R$ 250,00`, retornando para `R$ 1.000,00`<br>- O botão de estorno da transação passa para o estado `Indisponível` (`disabled`) <td colspan=2/> |

---

### Caso de Teste 12 — Bloqueio de Estorno para Transações `PENDING` ou `FAILED` (Máquina de Estados)
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 12 <td colspan=2/> |
| **Título** | Validar que transações com status `PENDING`, `FAILED` ou `REFUNDED` mantêm a ação de estorno desabilitada na interface (Máquina de Estados) <td colspan=2/> |
| **Prioridade** | Média <td colspan=2/> |
| **Rastreabilidade** | RF03, RN-FE-09, RN-FE-10, RN05 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado na rota `/transactions` com uma carteira ativa <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | No formulário `Nova Transação`, selecionar o tipo `CHARGE`, informar o valor `180.00` e selecionar o status inicial `PENDING — Pendente (Não altera saldo)` em `[data-testid="select-transaction-status"]` | N/A |
| Passo 2 | Clicar em `Processar Transação` (`[data-testid="btn-create-transaction"]`) | A transação é criada com badge amarelo `PENDING` e o saldo da carteira não é alterado |
| Passo 3 | Inspecionar a coluna `Ação (Estorno)` da transação `PENDING` recém-criada na tabela | O botão `[data-testid="btn-refund-<id>"]` encontra-se desabilitado (`disabled`) com o texto `Indisponível` e tooltip `"Apenas transações com status PAID podem ser estornadas"` |
| <td colspan=3/> |
| **Pós-Condições** | - O usuário fica impedido pela interface de acionar transições de estado inválidas a partir de `PENDING`, `FAILED` ou `REFUNDED` <td colspan=2/> |

---

### Caso de Teste 13 — Validação de URL de Destino no Cadastro de Webhook
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 13 <td colspan=2/> |
| **Título** | Validar que o cadastro de webhook é bloqueado ao informar uma URL sem protocolo `http://` ou `https://` (`400 INVALID_WEBHOOK_URL`) <td colspan=2/> |
| **Prioridade** | Baixa <td colspan=2/> |
| **Rastreabilidade** | RF04, RN-FE-03, RN-FE-11 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado na rota `/webhooks` <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar o módulo `Webhooks & HMAC` (`/webhooks`) pelo menu superior (`[data-testid="nav-webhooks"]`) | A tela de cadastro e simulação de webhooks é apresentada com todos os 4 eventos pré-selecionados |
| Passo 2 | Informar uma URL com protocolo inválido no campo `[data-testid="input-webhook-url"]` (ex.: `ftp://servidor.loja.com.br/webhook`) | N/A |
| Passo 3 | Clicar no botão `Salvar Webhook` (`[data-testid="btn-save-webhook"]`) | O alerta de erro `[data-testid="alert-error-message"]` apresenta a mensagem `"Informe uma URL válida (http:// ou https://) para o cadastro do webhook"` (`400 INVALID_WEBHOOK_URL`) |
| <td colspan=3/> |
| **Pós-Condições** | - O endpoint inválido não é adicionado à lista de webhooks configurados <td colspan=2/> |

---

### Caso de Teste 14 — Simulação de Disparo de Webhook e Inspeção de Assinatura HMAC SHA-256
Baseado na ISO-29119-3.

| Campo | Descrição | <td colspan=2/> |
| :--- | :--- | :--- |
| **ID** | 14 <td colspan=2/> |
| **Título** | Validar que o simulador de webhook gera a assinatura criptográfica HMAC SHA-256 (`X-Signature: sha256=<64_hex_chars>`) e registra o log de entrega <td colspan=2/> |
| **Prioridade** | Alta <td colspan=2/> |
| **Rastreabilidade** | RF04, RN-FE-11, RN-FE-12, RN05 <td colspan=2/> |
| **Pré-Condições** | - Lojista autenticado na rota `/webhooks`<br>- Existir ao menos um webhook ativo cadastrado (ex.: `https://api.lojaestrela.com.br/webhooks/pulsar`) <td colspan=2/> |
| <td colspan=3/> |
| **Passos** | **Ação** | **Resultados Esperados** |
| Passo 1 | Acessar o painel `Simulador de Disparo de Webhook (Inspeção HMAC)` na rota `/webhooks` | O formulário do simulador é apresentado com o evento padrão `webhook.test` e o objeto JSON de exemplo |
| Passo 2 | Selecionar o webhook cadastrado em `[data-testid="select-simulate-webhook-id"]` e manter o evento `webhook.test` em `[data-testid="select-simulate-event"]` | N/A |
| Passo 3 | Informar um payload JSON válido no campo `[data-testid="textarea-simulate-data"]` | N/A |
| Passo 4 | Clicar no botão `Disparar Simulação HMAC` (`[data-testid="btn-simulate-webhook"]`) | Uma mensagem de sucesso é apresentada dizendo `"Disparo de webhook simulado com assinatura HMAC SHA-256 gerada"` (`200 OK`) e o painel de resultado de segurança é exibido |
| Passo 5 | Inspecionar o bloco `[data-testid="code-hmac-signature"]` e os headers enviados em `[data-testid="sim-headers-pre"]` | A assinatura exibida segue estritamente o formato `sha256=` seguido por 64 caracteres hexadecimais, acompanhada do header `X-Pulsar-Event: webhook.test` |
| <td colspan=3/> |
| **Pós-Condições** | - O histórico de entregas (`deliveryLogs`) do webhook selecionado passa a exibir o novo registro com status `SIMULATED`, código HTTP `200`, data/hora formatada e botão `Copiar` para a assinatura gerada <td colspan=2/> |
