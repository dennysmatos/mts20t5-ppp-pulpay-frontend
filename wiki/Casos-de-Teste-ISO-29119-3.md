# Especificação de Casos de Teste (ISO/IEC/IEEE 29119-3)

> **Projeto de Portfólio Pessoal - Turma 5** • **Mentoria 2.0 (Júlio de Lima)**  
> **Autor:** Dennys Matos (`By Dennys Matos`)

Este documento apresenta a especificação formal dos **Casos de Teste** da aplicação Web **PulPay (`pulsar payments`)**, estruturada em conformidade com a norma internacional **ISO/IEC/IEEE 29119-3 (*Software and systems engineering — Software testing — Part 3: Test documentation*)**.

Os casos de teste abaixo cobrem as Regras de Negócio do Frontend (`RN-FE-01` a `RN-FE-12`), as Regras Financeiras do Backend (`RN01` a `RN05`) e os Requisitos Funcionais (`RF01` a `RF04`), aplicando técnicas de **Particionamento de Equivalência**, **Análise de Valor Limite (BVA)**, **Transição de Estados** e **Testes de Idempotência e Segurança HMAC**.

---

## Matriz Resumo de Rastreabilidade dos Casos de Teste

<table>
  <thead>
    <tr>
      <th width="80" align="center">ID</th>
      <th align="left">Título do Caso de Teste</th>
      <th width="110" align="center">Prioridade</th>
      <th width="230" align="left">Rastreabilidade</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><strong><code>CT&#8209;01</code></strong></td>
      <td>Validar que o cadastro de novo lojista é realizado com sucesso ao informar dados válidos e senha com no mínimo 6 caracteres</td>
      <td align="center">Alta</td>
      <td><code>RF01</code>, <code>RN&#8209;FE&#8209;01</code>, <code>RN&#8209;FE&#8209;04</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;02</code></strong></td>
      <td>Validar que o cadastro de lojista é bloqueado ao informar senha com menos de 6 caracteres (Valor Limite = 5 caracteres)</td>
      <td align="center">Média</td>
      <td><code>RF01</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;04</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;03</code></strong></td>
      <td>Validar que o login é recusado ao informar credenciais inválidas preservando o e-mail preenchido e limpando apenas o campo de senha</td>
      <td align="center">Alta</td>
      <td><code>RF01</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;05</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;04</code></strong></td>
      <td>Validar que usuários não autenticados são redirecionados imediatamente para <code>/login</code> ao tentar acessar rotas privadas (Route Guards)</td>
      <td align="center">Alta</td>
      <td><code>RN&#8209;FE&#8209;01</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;05</code></strong></td>
      <td>Validar que uma nova carteira operacional em BRL é criada com sucesso ao informar saldo inicial maior ou igual a R$ 0,00</td>
      <td align="center">Alta</td>
      <td><code>RF02</code>, <code>RN&#8209;FE&#8209;02</code>, <code>RN&#8209;FE&#8209;06</code>, <code>RN&#8209;FE&#8209;07</code>, <code>RN02</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;06</code></strong></td>
      <td>Validar que a criação de carteira é bloqueada ao informar saldo inicial negativo (<code>422 NEGATIVE_BALANCE_NOT_ALLOWED</code>)</td>
      <td align="center">Alta</td>
      <td><code>RF02</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;07</code>, <code>RN02</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;07</code></strong></td>
      <td>Validar que a criação de carteira é bloqueada ao selecionar moeda diferente de BRL (<code>422 UNSUPPORTED_CURRENCY</code>)</td>
      <td align="center">Média</td>
      <td><code>RF02</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;07</code>, <code>RN02</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;08</code></strong></td>
      <td>Validar que uma transação de entrada (<code>CHARGE</code> ou <code>CREDIT</code>) com status <code>PAID</code> credita o valor no saldo da carteira em BRL</td>
      <td align="center">Alta</td>
      <td><code>RF03</code>, <code>RN&#8209;FE&#8209;02</code>, <code>RN&#8209;FE&#8209;08</code>, <code>RN&#8209;FE&#8209;09</code>, <code>RN03</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;09</code></strong></td>
      <td>Validar que uma transação de saída (<code>PAYMENT</code> ou <code>DEBIT</code>) com status <code>PAID</code> é bloqueada quando o valor excede o saldo disponível da carteira (<code>422 INSUFFICIENT_FUNDS</code>)</td>
      <td align="center">Alta</td>
      <td><code>RF03</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;08</code>, <code>RN02</code>, <code>RN03</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;10</code></strong></td>
      <td>Validar que o reenvio de transação com a mesma <code>Idempotency&#8209;Key</code> retorna <code>200 OK</code>, exibe o banner de replay idempotente e não duplica o saldo da carteira</td>
      <td align="center">Alta</td>
      <td><code>RF03</code>, <code>RN&#8209;FE&#8209;08</code>, <code>RN04</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;11</code></strong></td>
      <td>Validar que o estorno (<code>REFUND</code>) de uma transação com status <code>PAID</code> altera seu estado para <code>REFUNDED</code> e reverte o impacto financeiro no saldo da carteira</td>
      <td align="center">Alta</td>
      <td><code>RF03</code>, <code>RN&#8209;FE&#8209;09</code>, <code>RN&#8209;FE&#8209;10</code>, <code>RN05</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;12</code></strong></td>
      <td>Validar que transações com status <code>PENDING</code>, <code>FAILED</code> ou <code>REFUNDED</code> mantêm a ação de estorno desabilitada na interface (Máquina de Estados)</td>
      <td align="center">Média</td>
      <td><code>RF03</code>, <code>RN&#8209;FE&#8209;09</code>, <code>RN&#8209;FE&#8209;10</code>, <code>RN05</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;13</code></strong></td>
      <td>Validar que o cadastro de webhook é bloqueado ao informar uma URL sem protocolo <code>http://</code> ou <code>https://</code> (<code>400 INVALID_WEBHOOK_URL</code>)</td>
      <td align="center">Baixa</td>
      <td><code>RF04</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;11</code></td>
    </tr>
    <tr>
      <td align="center"><strong><code>CT&#8209;14</code></strong></td>
      <td>Validar que o simulador de webhook gera a assinatura criptográfica HMAC SHA-256 (<code>X&#8209;Signature: sha256=&lt;64_hex_chars&gt;</code>) e registra o log de entrega</td>
      <td align="center">Alta</td>
      <td><code>RF04</code>, <code>RN&#8209;FE&#8209;11</code>, <code>RN&#8209;FE&#8209;12</code>, <code>RN05</code></td>
    </tr>
  </tbody>
</table>

---

## Especificação Detalhada dos Casos de Teste

### Caso de Teste 01 — Cadastro de Novo Lojista com Dados Válidos
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">1</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o cadastro de novo lojista é realizado com sucesso ao informar dados válidos e senha com no mínimo 6 caracteres</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF01</code>, <code>RN&#8209;FE&#8209;01</code>, <code>RN&#8209;FE&#8209;04</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Aplicação Web Frontend (<code>http://localhost:4000</code> ou <code>https://pulpay.qatec.com.br</code>) e API Backend operacionais<br/>
        • Usuário não autenticado (sem sessão JWT ativa)<br/>
        • E-mail informado ainda não cadastrado na base de lojistas
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a aplicação Web do PulPay em <code>/login</code></td>
      <td>A tela de autenticação do lojista é apresentada</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Clicar na aba <code>Cadastro (/register)</code> (<code>[data&#8209;testid="tab&#8209;auth&#8209;register"]</code>)</td>
      <td>O formulário de registro de novo lojista é apresentado com os campos Razão Social, E-mail, Documento e Senha</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar uma Razão Social válida no campo <code>[data&#8209;testid="input&#8209;name"]</code> (ex.: <code>Pulsar Comércio Digital LTDA</code>)</td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Informar um e-mail válido e inédito no campo <code>[data&#8209;testid="input&#8209;email"]</code> (ex.: <code>contato@pulsardigital.com.br</code>)</td>
      <td>O campo normaliza o endereço de e-mail para letras minúsculas</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;5</strong></td>
      <td>Informar um CNPJ numérico no campo <code>[data&#8209;testid="input&#8209;document"]</code> (ex.: <code>12345678000199</code>)</td>
      <td>A máscara visual <code>12.345.678/0001&#8209;99</code> é aplicada automaticamente no campo</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;6</strong></td>
      <td>Informar uma senha com 6 ou mais caracteres no campo <code>[data&#8209;testid="input&#8209;password"]</code> (ex.: <code>Senha@123</code>)</td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;7</strong></td>
      <td>Clicar no botão <code>Registrar Lojista</code> (<code>[data&#8209;testid="btn&#8209;submit&#8209;auth"]</code>)</td>
      <td>Uma notificação de sucesso é apresentada com a mensagem <code>"Lojista registrado com sucesso"</code> (<code>201 Created</code>) e o usuário é redirecionado automaticamente para <code>/dashboard</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • O token JWT e os dados públicos do lojista ficam armazenados no estado de autenticação da aplicação<br/>
        • O nome da loja passa a ser exibido no badge superior <code>[data&#8209;testid="merchant&#8209;header&#8209;info"]</code>
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 02 — Bloqueio de Cadastro com Senha Fraca (Análise de Valor Limite)
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">2</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o cadastro de lojista é bloqueado ao informar senha com menos de 6 caracteres (Valor Limite = 5 caracteres)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Média</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF01</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;04</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Usuário não autenticado na rota <code>/register</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela de cadastro em <code>/register</code></td>
      <td>O formulário de cadastro de lojista é apresentado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Preencher o campo Razão Social (<code>[data&#8209;testid="input&#8209;name"]</code>) com <code>Loja Teste QA</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Preencher o campo E-mail (<code>[data&#8209;testid="input&#8209;email"]</code>) com <code>qa.limite@pulsar.com.br</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Digitar uma senha contendo exatamente 5 caracteres no campo <code>[data&#8209;testid="input&#8209;password"]</code> (ex.: <code>12345</code>)</td>
      <td>A interface exibe feedback imediato abaixo do campo informando <code>"A senha deve possuir no mínimo 6 caracteres"</code></td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;5</strong></td>
      <td>Clicar no botão <code>Registrar Lojista</code> (<code>[data&#8209;testid="btn&#8209;submit&#8209;auth"]</code>)</td>
      <td>O envio é bloqueado com o alerta <code>[WEAK_PASSWORD] A senha deve possuir no mínimo 6 caracteres</code> em <code>[data&#8209;testid="alert&#8209;error&#8209;message"]</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • Nenhum registro é criado para o lojista<br/>
        • O usuário permanece na rota <code>/register</code> sem token JWT emitido
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 03 — Tratamento de Credenciais Inválidas no Login
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">3</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o login é recusado ao informar credenciais inválidas preservando o e-mail preenchido e limpando apenas o campo de senha</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF01</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;05</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Existir o lojista <code>financeiro@lojaestrela.com.br</code> cadastrado na base de dados<br/>
        • Usuário não autenticado na tela <code>/login</code>
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela de login em <code>/login</code></td>
      <td>O formulário de login é apresentado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Informar o e-mail <code>financeiro@lojaestrela.com.br</code> no campo <code>[data&#8209;testid="input&#8209;email"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar uma senha incorreta no campo <code>[data&#8209;testid="input&#8209;password"]</code> (ex.: <code>SenhaErrada999</code>)</td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Submeter o formulário clicando em <code>Entrar</code> (<code>[data&#8209;testid="btn&#8209;submit&#8209;auth"]</code>)</td>
      <td>O alerta de erro <code>[data&#8209;testid="alert&#8209;error&#8209;message"]</code> apresenta a mensagem <code>"Credenciais inválidas: e-mail ou senha incorretos"</code> (<code>401 INVALID_CREDENTIALS</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • O campo de e-mail (<code>[data&#8209;testid="input&#8209;email"]</code>) mantém o valor <code>financeiro@lojaestrela.com.br</code> preenchido<br/>
        • O campo de senha (<code>[data&#8209;testid="input&#8209;password"]</code>) é limpo automaticamente
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 04 — Proteção de Rotas Privadas (Route Guards)
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">4</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que usuários não autenticados são redirecionados imediatamente para <code>/login</code> ao tentar acessar rotas privadas (Route Guards)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RN&#8209;FE&#8209;01</code>, <code>RN01</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Usuário não autenticado (sem token JWT no <code>localStorage</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar diretamente a URL privada <code>/dashboard</code> no navegador</td>
      <td>O Route Guard intercepta a navegação e redireciona imediatamente para <code>/login</code></td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Tentar acessar diretamente as URLs privadas <code>/accounts</code>, <code>/transactions</code> e <code>/webhooks</code></td>
      <td>Em todas as tentativas o usuário é redirecionado imediatamente para <code>/login</code> e a tela de autenticação é apresentada</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">• Nenhuma informação financeira de carteiras, transações ou webhooks é exibida sem autenticação válida</td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 05 — Criação de Nova Carteira Operacional em BRL
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">5</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que uma nova carteira operacional em BRL é criada com sucesso ao informar saldo inicial maior ou igual a R$ 0,00</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF02</code>, <code>RN&#8209;FE&#8209;02</code>, <code>RN&#8209;FE&#8209;06</code>, <code>RN&#8209;FE&#8209;07</code>, <code>RN02</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Lojista autenticado com token JWT válido</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar o módulo <code>Carteiras</code> (<code>/accounts</code>) pelo menu superior (<code>[data&#8209;testid="nav&#8209;accounts"]</code>)</td>
      <td>A tela de Gestão de Contas / Carteiras é apresentada</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Informar o nome <code>Carteira Recebíveis PIX</code> no campo <code>[data&#8209;testid="input&#8209;account&#8209;name"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Manter a moeda <code>BRL — Real Brasileiro (Padrão)</code> selecionada em <code>[data&#8209;testid="select&#8209;currency"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Informar o saldo inicial <code>1000.00</code> no campo <code>[data&#8209;testid="input&#8209;initial&#8209;balance"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;5</strong></td>
      <td>Clicar no botão <code>Criar Carteira</code> (<code>[data&#8209;testid="btn&#8209;new&#8209;account"]</code>)</td>
      <td>Uma notificação de sucesso é apresentada com a mensagem <code>"Conta criada com sucesso"</code> (<code>201 Created</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • O novo card da carteira é exibido imediatamente na listagem com badge verde <code>ACTIVE (Ativa)</code> e saldo formatado como <code>R$ 1.000,00</code> (<code>[data&#8209;testid="account&#8209;balance&#8209;value"]</code>)<br/>
        • A nova carteira passa a estar disponível no seletor de carteiras da tela de Transações
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 06 — Trava contra Criação de Carteira com Saldo Inicial Negativo
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">6</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que a criação de carteira é bloqueada ao informar saldo inicial negativo (<code>422 NEGATIVE_BALANCE_NOT_ALLOWED</code>)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF02</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;07</code>, <code>RN02</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Lojista autenticado na rota <code>/accounts</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela <code>Carteiras</code> (<code>/accounts</code>)</td>
      <td>O formulário <code>Criar Nova Carteira</code> é apresentado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Informar o nome <code>Carteira Inválida</code> em <code>[data&#8209;testid="input&#8209;account&#8209;name"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar o valor negativo <code>-50.00</code> no campo Saldo Inicial (<code>[data&#8209;testid="input&#8209;initial&#8209;balance"]</code>)</td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Clicar no botão <code>Criar Carteira</code> (<code>[data&#8209;testid="btn&#8209;new&#8209;account"]</code>)</td>
      <td>O alerta de erro <code>[data&#8209;testid="alert&#8209;error&#8209;message"]</code> apresenta a mensagem <code>"Operação não permitida: o saldo da conta não pode ser negativo"</code> (<code>422 NEGATIVE_BALANCE_NOT_ALLOWED</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">• A carteira com saldo negativo não é criada na listagem do lojista</td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 07 — Bloqueio de Criação de Carteira com Moeda Não Suportada
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">7</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que a criação de carteira é bloqueada ao selecionar moeda diferente de BRL (<code>422 UNSUPPORTED_CURRENCY</code>)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Média</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF02</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;07</code>, <code>RN02</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Lojista autenticado na rota <code>/accounts</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela <code>Carteiras</code> (<code>/accounts</code>)</td>
      <td>O formulário <code>Criar Nova Carteira</code> é apresentado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Selecionar a opção <code>USD — Dólar Americano (Teste QA 422)</code> no campo <code>[data&#8209;testid="select&#8209;currency"]</code></td>
      <td>A moeda <code>USD</code> fica selecionada</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar o saldo inicial <code>100.00</code> em <code>[data&#8209;testid="input&#8209;initial&#8209;balance"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Clicar no botão <code>Criar Carteira</code> (<code>[data&#8209;testid="btn&#8209;new&#8209;account"]</code>)</td>
      <td>O alerta de erro <code>[data&#8209;testid="alert&#8209;error&#8209;message"]</code> apresenta a mensagem <code>"Moeda não suportada. O Pulsar Payments opera exclusivamente com BRL"</code> (<code>422 UNSUPPORTED_CURRENCY</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">• Nenhuma carteira em moeda estrangeira é criada</td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 08 — Processamento de Transação de Entrada (`CHARGE`) Liquidada (`PAID`)
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">8</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que uma transação de entrada (<code>CHARGE</code> ou <code>CREDIT</code>) com status <code>PAID</code> credita o valor no saldo da carteira em BRL</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF03</code>, <code>RN&#8209;FE&#8209;02</code>, <code>RN&#8209;FE&#8209;08</code>, <code>RN&#8209;FE&#8209;09</code>, <code>RN03</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Lojista autenticado<br/>
        • Carteira ativa com saldo atual de <code>R$ 1.000,00</code>
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar o módulo <code>Transações &amp; Conciliação</code> (<code>/transactions</code>)</td>
      <td>O formulário <code>Nova Transação</code> e a tabela de extrato são apresentados</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Selecionar a carteira ativa com saldo de <code>R$ 1.000,00</code> em <code>[data&#8209;testid="select&#8209;account"]</code></td>
      <td>O saldo disponível da carteira selecionada (<code>R$ 1.000,00</code>) é exibido abaixo do seletor</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Selecionar o tipo <code>CHARGE — Cobrança (+ Crédito)</code> em <code>[data&#8209;testid="select&#8209;transaction&#8209;type"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Informar o valor <code>250.00</code> no campo <code>[data&#8209;testid="input&#8209;transaction&#8209;amount"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;5</strong></td>
      <td>Manter o status inicial <code>PAID — Liquidada (Sensibiliza Saldo)</code> em <code>[data&#8209;testid="select&#8209;transaction&#8209;status"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;6</strong></td>
      <td>Informar a descrição <code>Pedido #1050 - PIX</code> em <code>[data&#8209;testid="input&#8209;transaction&#8209;description"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;7</strong></td>
      <td>Clicar no botão <code>Processar Transação</code> (<code>[data&#8209;testid="btn&#8209;create&#8209;transaction"]</code>)</td>
      <td>A mensagem <code>"Transação processada com sucesso"</code> (<code>201 Created</code>) é apresentada</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • A carteira passa a ter saldo atualizado de <code>R$ 1.250,00</code><br/>
        • A transação aparece no topo do extrato com badge verde <code>PAID</code>, valor <code>+ R$ 250,00</code> em verde e botão <code>Solicitar Estorno</code> habilitado
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 09 — Bloqueio de Débito/Pagamento Acima do Saldo Disponível
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">9</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que uma transação de saída (<code>PAYMENT</code> ou <code>DEBIT</code>) com status <code>PAID</code> é bloqueada quando o valor excede o saldo disponível da carteira (<code>422 INSUFFICIENT_FUNDS</code>)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF03</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;08</code>, <code>RN02</code>, <code>RN03</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Lojista autenticado<br/>
        • Carteira ativa com saldo atual de <code>R$ 1.250,00</code>
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela <code>Transações &amp; Conciliação</code> (<code>/transactions</code>)</td>
      <td>O formulário <code>Nova Transação</code> é apresentado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Selecionar a carteira com saldo de <code>R$ 1.250,00</code> em <code>[data&#8209;testid="select&#8209;account"]</code></td>
      <td>Os dados e saldo da carteira são apresentados</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Selecionar o tipo de saída <code>PAYMENT — Pagamento (- Saída)</code> em <code>[data&#8209;testid="select&#8209;transaction&#8209;type"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Informar um valor maior que o saldo disponível (ex.: <code>1250.01</code> ou <code>5000.00</code>) em <code>[data&#8209;testid="input&#8209;transaction&#8209;amount"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;5</strong></td>
      <td>Manter o status inicial <code>PAID</code> em <code>[data&#8209;testid="select&#8209;transaction&#8209;status"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;6</strong></td>
      <td>Clicar em <code>Processar Transação</code> (<code>[data&#8209;testid="btn&#8209;create&#8209;transaction"]</code>)</td>
      <td>O alerta de erro <code>[data&#8209;testid="alert&#8209;error&#8209;message"]</code> apresenta a mensagem <code>"Saldo insuficiente na conta para realizar esta operação (saldo não pode ficar negativo)"</code> (<code>422 INSUFFICIENT_FUNDS</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • O saldo da carteira permanece inalterado em <code>R$ 1.250,00</code><br/>
        • Nenhuma transação de débito é registrada
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 10 — Controle de Idempotência e Prevenção de Duplicidade Financeira
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">10</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o reenvio de transação com a mesma <code>Idempotency&#8209;Key</code> retorna <code>200 OK</code>, exibe o banner de replay idempotente e não duplica o saldo da carteira</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF03</code>, <code>RN&#8209;FE&#8209;08</code>, <code>RN04</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Lojista autenticado<br/>
        • Carteira ativa com saldo de <code>R$ 1.000,00</code>
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela <code>Transações &amp; Conciliação</code> (<code>/transactions</code>)</td>
      <td>O formulário <code>Nova Transação</code> é apresentado com um UUID preenchido em <code>[data&#8209;testid="input&#8209;idempotency&#8209;key"]</code></td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Marcar a caixa de seleção <code>Manter mesma chave após envio (Modo Teste QA de Replay Idempotente 200 OK)</code> (<code>[data&#8209;testid="checkbox&#8209;keep&#8209;idempotency"]</code>)</td>
      <td>A opção permanece marcada para preservar a chave entre cliques</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar uma cobrança (<code>CHARGE</code> + <code>PAID</code>) no valor de <code>100.00</code> e clicar em <code>Processar Transação</code> (<code>[data&#8209;testid="btn&#8209;create&#8209;transaction"]</code>)</td>
      <td>A primeira execução retorna <code>201 Created</code> (<code>"Transação processada com sucesso"</code>) e o saldo da carteira sobe para <code>R$ 1.100,00</code></td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Clicar novamente em <code>Processar Transação</code> (<code>[data&#8209;testid="btn&#8209;create&#8209;transaction"]</code>) mantendo exatamente a mesma chave em <code>[data&#8209;testid="input&#8209;idempotency&#8209;key"]</code></td>
      <td>O banner de aviso <code>[data&#8209;testid="banner&#8209;idempotent&#8209;replay"]</code> é apresentado com a mensagem <code>"Requisição idempotente: retornando transação processada anteriormente"</code> (<code>200 OK</code>, <code>idempotentReplayed: true</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • O saldo da carteira permanece em <code>R$ 1.100,00</code> (sem crédito duplicado)<br/>
        • Nenhuma nova linha duplicada é criada no extrato de transações
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 11 — Estorno (`REFUND`) de Transação Liquidada (`PAID`)
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">11</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o estorno (<code>REFUND</code>) de uma transação com status <code>PAID</code> altera seu estado para <code>REFUNDED</code> e reverte o impacto financeiro no saldo da carteira</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF03</code>, <code>RN&#8209;FE&#8209;09</code>, <code>RN&#8209;FE&#8209;10</code>, <code>RN05</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Lojista autenticado<br/>
        • Existir uma transação do tipo <code>CHARGE</code> no valor de <code>R$ 250,00</code> com status <code>PAID</code> vinculada a uma carteira com saldo atual de <code>R$ 1.250,00</code>
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar a tela <code>Transações &amp; Conciliação</code> (<code>/transactions</code>)</td>
      <td>A listagem de transações apresenta a transação <code>PAID</code> de <code>R$ 250,00</code> com o botão <code>Solicitar Estorno</code> (<code>[data&#8209;testid="btn&#8209;refund&#8209;&lt;id&gt;"]</code>) habilitado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Clicar no botão <code>Solicitar Estorno</code> da transação</td>
      <td>O modal de confirmação <code>[data&#8209;testid="modal&#8209;refund"]</code> é aberto exibindo o impacto financeiro (débito de <code>R$ 250,00</code> na carteira)</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar o motivo <code>Cancelamento solicitado pelo cliente dentro do prazo de 7 dias</code> no campo <code>[data&#8209;testid="input&#8209;refund&#8209;reason"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Clicar no botão <code>Confirmar Estorno</code> (<code>[data&#8209;testid="btn&#8209;confirm&#8209;refund"]</code>)</td>
      <td>O modal é fechado e uma notificação de sucesso é apresentada dizendo <code>"Estorno de transação realizado com sucesso"</code> (<code>200 OK</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">
        • O status da transação na tabela muda para <code>REFUNDED</code> (badge roxo <code>[data&#8209;testid="badge&#8209;status&#8209;&lt;id&gt;"]</code>) exibindo a data/hora do estorno e o motivo informado<br/>
        • O saldo da carteira associada é debitado em <code>R$ 250,00</code>, retornando para <code>R$ 1.000,00</code><br/>
        • O botão de estorno da transação passa para o estado <code>Indisponível</code> (<code>disabled</code>)
      </td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 12 — Bloqueio de Estorno para Transações `PENDING` ou `FAILED` (Máquina de Estados)
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">12</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que transações com status <code>PENDING</code>, <code>FAILED</code> ou <code>REFUNDED</code> mantêm a ação de estorno desabilitada na interface (Máquina de Estados)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Média</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF03</code>, <code>RN&#8209;FE&#8209;09</code>, <code>RN&#8209;FE&#8209;10</code>, <code>RN05</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Lojista autenticado na rota <code>/transactions</code> com uma carteira ativa</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>No formulário <code>Nova Transação</code>, selecionar o tipo <code>CHARGE</code>, informar o valor <code>180.00</code> e selecionar o status inicial <code>PENDING — Pendente (Não altera saldo)</code> em <code>[data&#8209;testid="select&#8209;transaction&#8209;status"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Clicar em <code>Processar Transação</code> (<code>[data&#8209;testid="btn&#8209;create&#8209;transaction"]</code>)</td>
      <td>A transação é criada com badge amarelo <code>PENDING</code> e o saldo da carteira não é alterado</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Inspecionar a coluna <code>Ação (Estorno)</code> da transação <code>PENDING</code> recém-criada na tabela</td>
      <td>O botão <code>[data&#8209;testid="btn&#8209;refund&#8209;&lt;id&gt;"]</code> encontra-se desabilitado (<code>disabled</code>) com o texto <code>Indisponível</code> e tooltip <code>"Apenas transações com status PAID podem ser estornadas"</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">• O usuário fica impedido pela interface de acionar transições de estado inválidas a partir de <code>PENDING</code>, <code>FAILED</code> ou <code>REFUNDED</code></td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 13 — Validação de URL de Destino no Cadastro de Webhook
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">13</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o cadastro de webhook é bloqueado ao informar uma URL sem protocolo <code>http://</code> ou <code>https://</code> (<code>400 INVALID_WEBHOOK_URL</code>)</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Baixa</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF04</code>, <code>RN&#8209;FE&#8209;03</code>, <code>RN&#8209;FE&#8209;11</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">• Lojista autenticado na rota <code>/webhooks</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar o módulo <code>Webhooks &amp; HMAC</code> (<code>/webhooks</code>) pelo menu superior (<code>[data&#8209;testid="nav&#8209;webhooks"]</code>)</td>
      <td>A tela de cadastro e simulação de webhooks é apresentada com todos os 4 eventos pré-selecionados</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Informar uma URL com protocolo inválido no campo <code>[data&#8209;testid="input&#8209;webhook&#8209;url"]</code> (ex.: <code>ftp://servidor.loja.com.br/webhook</code>)</td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Clicar no botão <code>Salvar Webhook</code> (<code>[data&#8209;testid="btn&#8209;save&#8209;webhook"]</code>)</td>
      <td>O alerta de erro <code>[data&#8209;testid="alert&#8209;error&#8209;message"]</code> apresenta a mensagem <code>"Informe uma URL válida (http:// ou https://) para o cadastro do webhook"</code> (<code>400 INVALID_WEBHOOK_URL</code>)</td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">• O endpoint inválido não é adicionado à lista de webhooks configurados</td>
    </tr>
  </tbody>
</table>

---

### Caso de Teste 14 — Simulação de Disparo de Webhook e Inspeção de Assinatura HMAC SHA-256
Baseado na ISO-29119-3.

<table>
  <tbody>
    <tr>
      <th width="140" align="left">ID</th>
      <td colspan="2">14</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td colspan="2">Validar que o simulador de webhook gera a assinatura criptográfica HMAC SHA-256 (<code>X&#8209;Signature: sha256=&lt;64_hex_chars&gt;</code>) e registra o log de entrega</td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td colspan="2">Alta</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td colspan="2"><code>RF04</code>, <code>RN&#8209;FE&#8209;11</code>, <code>RN&#8209;FE&#8209;12</code>, <code>RN05</code></td>
    </tr>
    <tr>
      <th align="left">Pré&#8209;Condições</th>
      <td colspan="2">
        • Lojista autenticado na rota <code>/webhooks</code><br/>
        • Existir ao menos um webhook ativo cadastrado (ex.: <code>https://api.lojaestrela.com.br/webhooks/pulsar</code>)
      </td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th width="140" align="left">Passos</th>
      <th width="44%" align="left">Ação</th>
      <th align="left">Resultados Esperados</th>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;1</strong></td>
      <td>Acessar o painel <code>Simulador de Disparo de Webhook (Inspeção HMAC)</code> na rota <code>/webhooks</code></td>
      <td>O formulário do simulador é apresentado com o evento padrão <code>webhook.test</code> e o objeto JSON de exemplo</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;2</strong></td>
      <td>Selecionar o webhook cadastrado em <code>[data&#8209;testid="select&#8209;simulate&#8209;webhook&#8209;id"]</code> e manter o evento <code>webhook.test</code> em <code>[data&#8209;testid="select&#8209;simulate&#8209;event"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;3</strong></td>
      <td>Informar um payload JSON válido no campo <code>[data&#8209;testid="textarea&#8209;simulate&#8209;data"]</code></td>
      <td>N/A</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;4</strong></td>
      <td>Clicar no botão <code>Disparar Simulação HMAC</code> (<code>[data&#8209;testid="btn&#8209;simulate&#8209;webhook"]</code>)</td>
      <td>Uma mensagem de sucesso é apresentada dizendo <code>"Disparo de webhook simulado com assinatura HMAC SHA-256 gerada"</code> (<code>200 OK</code>) e o painel de resultado de segurança é exibido</td>
    </tr>
    <tr>
      <td><strong>Passo&nbsp;5</strong></td>
      <td>Inspecionar o bloco <code>[data&#8209;testid="code&#8209;hmac&#8209;signature"]</code> e os headers enviados em <code>[data&#8209;testid="sim&#8209;headers&#8209;pre"]</code></td>
      <td>A assinatura exibida segue estritamente o formato <code>sha256=</code> seguido por 64 caracteres hexadecimais, acompanhada do header <code>X&#8209;Pulsar&#8209;Event: webhook.test</code></td>
    </tr>
    <tr>
      <td colspan="3"></td>
    </tr>
    <tr>
      <th align="left">Pós&#8209;Condições</th>
      <td colspan="2">• O histórico de entregas (<code>deliveryLogs</code>) do webhook selecionado passa a exibir o novo registro com status <code>SIMULATED</code>, código HTTP <code>200</code>, data/hora formatada e botão <code>Copiar</code> para a assinatura gerada</td>
    </tr>
  </tbody>
</table>
