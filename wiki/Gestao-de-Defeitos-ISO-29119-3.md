# Gestão e Relatório de Defeitos (ISO/IEC/IEEE 29119-3)

> **Projeto de Portfólio Pessoal - Turma 5** • **Mentoria 2.0 (Júlio de Lima)**  
> **Autor:** Dennys Matos (`By Dennys Matos`)

Este documento consolida os **Relatórios de Defeitos (Incidentes de Teste)** identificados durante as sessões de testes exploratórios ([Relatório de Sessão - Test Charter SBTM](Relatorio-de-Sessao-Test-Charter)) e a execução dos [Casos de Teste (ISO/IEC/IEEE 29119-3)](Casos-de-Teste-ISO-29119-3).

Todos os defeitos estão formalmente registrados e rastreados na aba **[Issues do GitHub](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues)** seguindo o modelo da norma **ISO/IEC/IEEE 29119-3** e boas práticas de ferramentas de gestão de defeitos.

---

## Matriz de Rastreabilidade de Defeitos (GitHub Issues)

<table>
  <thead>
    <tr>
      <th width="90" align="center">ID</th>
      <th width="110" align="center">GitHub Issue</th>
      <th align="left">Título do Defeito</th>
      <th width="100" align="center">Prioridade</th>
      <th width="100" align="center">Severidade</th>
      <th width="190" align="left">Rastreabilidade</th>
      <th width="110" align="center">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><strong><code>DEF&#8209;01</code></strong></td>
      <td align="center"><a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/5"><strong>Issue&nbsp;#5</strong></a></td>
      <td>Formulário de nova transação dispara requisição HTTP para a API mesmo após validação local detectar valor menor ou igual a zero</td>
      <td align="center">Média</td>
      <td align="center">Baixa</td>
      <td><a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;08</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S01</code></a>, <code>RN&#8209;FE&#8209;08</code></td>
      <td align="center">Aberto</td>
    </tr>
    <tr>
      <td align="center"><strong><code>DEF&#8209;02</code></strong></td>
      <td align="center"><a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/6"><strong>Issue&nbsp;#6</strong></a></td>
      <td>Transação recém-criada não é exibida na tabela de extrato quando há um filtro de status divergente ativo</td>
      <td align="center">Baixa</td>
      <td align="center">Baixa</td>
      <td><a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;08</code></a>, <a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;12</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S01</code></a></td>
      <td align="center">Aberto</td>
    </tr>
    <tr>
      <td align="center"><strong><code>DEF&#8209;03</code></strong></td>
      <td align="center"><a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/7"><strong>Issue&nbsp;#7</strong></a></td>
      <td>Formulário de cadastro de webhook permite submissão com todos os checkboxes de eventos desmarcados</td>
      <td align="center">Média</td>
      <td align="center">Média</td>
      <td><a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;13</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S02</code></a>, <code>RN&#8209;FE&#8209;11</code></td>
      <td align="center">Aberto</td>
    </tr>
    <tr>
      <td align="center"><strong><code>DEF&#8209;04</code></strong></td>
      <td align="center"><a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/8"><strong>Issue&nbsp;#8</strong></a></td>
      <td>Botão Copiar do campo Segredo HMAC copia chave padrão da plataforma quando o input está em branco</td>
      <td align="center">Média</td>
      <td align="center">Média</td>
      <td><a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;14</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S02</code></a>, <code>RN&#8209;FE&#8209;11</code></td>
      <td align="center">Aberto</td>
    </tr>
  </tbody>
</table>

---

## Detalhamento dos Defeitos (Modelo ISO/IEC/IEEE 29119-3)

### Defeito 01 (`DEF-01` — [GitHub Issue #5](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/5))
Baseado na ISO-29119-3 e em ferramentas de gestão de defeitos.

<table>
  <tbody>
    <tr>
      <th width="200" align="left">ID</th>
      <td><code>DEF&#8209;01</code> (<a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/5">GitHub Issue #5</a>)</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td>Formulário de nova transação dispara requisição HTTP para a API mesmo após validação local detectar valor menor ou igual a zero</td>
    </tr>
    <tr>
      <th align="left">Testador</th>
      <td>Dennys Matos</td>
    </tr>
    <tr>
      <th align="left">Data e Hora</th>
      <td>25 de novembro de 2026 07:48 PM</td>
    </tr>
    <tr>
      <th align="left">Resultado Esperado</th>
      <td>Quando o lojista informar um valor menor ou igual a zero (ex.: <code>-10.00</code> ou <code>0.00</code>) no campo Valor da Operação (<code>[data&#8209;testid="input&#8209;transaction&#8209;amount"]</code>), a validação client-side deve exibir a mensagem de erro abaixo do campo e interromper imediatamente o envio (<code>return</code>), evitando tráfego de rede desnecessário para a API Backend.</td>
    </tr>
    <tr>
      <th align="left">Resultado Atual</th>
      <td>A função <code>handleCreateTransactionSubmit</code> em <code>public/js/app.js</code> chama <code>setFieldError</code> quando <code>amount &lt;= 0</code>, mas não executa <code>return</code>. Com isso, a requisição <code>POST /transactions</code> continua sendo disparada para o servidor até receber o erro <code>422 INVALID_TRANSACTION_AMOUNT</code>.</td>
    </tr>
    <tr>
      <th align="left">Evidências</th>
      <td>
        • Código-fonte: <code>public/js/app.js</code> (bloco de validação <code>if (amount &lt;= 0)</code> sem instrução de retorno)<br/>
        • Relatório de Sessão Exploratória: <a href="Relatorio-de-Sessao-Test-Charter">Sessão 01 (Transações, Idempotência e Estornos)</a><br/>
        • Issue no GitHub: <a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/5">https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/5</a>
      </td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td>Média</td>
    </tr>
    <tr>
      <th align="left">Severidade</th>
      <td>Baixa</td>
    </tr>
    <tr>
      <th align="left">Informações sobre o Software</th>
      <td>PulPay Web Frontend v1.0.0 • Node.js / Express • Ambiente Local (<code>http://localhost:4000</code>) e Produção Vercel (<code>https://pulpay.qatec.com.br</code>) • Navegador Chrome 131 (macOS)</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td>
        • Regras de Negócio: <a href="Regras-de-Negocio-e-Contratos"><code>RN&#8209;FE&#8209;03</code></a>, <a href="Regras-de-Negocio-e-Contratos"><code>RN&#8209;FE&#8209;08</code></a>, <code>RN03</code><br/>
        • Casos de Teste / Sessão: <a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;08</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S01</code></a>
      </td>
    </tr>
    <tr>
      <th align="left">Status</th>
      <td>Aberto (Novo)</td>
    </tr>
  </tbody>
</table>

---

### Defeito 02 (`DEF-02` — [GitHub Issue #6](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/6))
Baseado na ISO-29119-3 e em ferramentas de gestão de defeitos.

<table>
  <tbody>
    <tr>
      <th width="200" align="left">ID</th>
      <td><code>DEF&#8209;02</code> (<a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/6">GitHub Issue #6</a>)</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td>Transação recém-criada não é exibida na tabela de extrato quando há um filtro de status divergente ativo</td>
    </tr>
    <tr>
      <th align="left">Testador</th>
      <td>Dennys Matos</td>
    </tr>
    <tr>
      <th align="left">Data e Hora</th>
      <td>25 de novembro de 2026 07:55 PM</td>
    </tr>
    <tr>
      <th align="left">Resultado Esperado</th>
      <td>Ao criar uma nova transação cujo tipo ou status difere do filtro ativo na barra de conciliação (ou ao concluir um novo lançamento), a interface deve limpar os filtros divergentes ou sinalizar claramente ao usuário que o registro criado está oculto pelo filtro atual.</td>
    </tr>
    <tr>
      <th align="left">Resultado Atual</th>
      <td>Se o lojista filtrar o extrato por status <code>PENDING</code> (<code>[data&#8209;testid="filter&#8209;status"]</code>) e em seguida criar uma nova transação com status <code>PAID</code>, a aplicação exibe a notificação de sucesso e atualiza o saldo da carteira, mas recarrega a tabela mantendo o filtro <code>status=PENDING</code>, fazendo parecer que a transação recém-criada não foi registrada no extrato.</td>
    </tr>
    <tr>
      <th align="left">Evidências</th>
      <td>
        • Código-fonte: <code>public/js/app.js</code> (chamada <code>fetchAndRenderTransactions(currentFilters)</code> ao final de <code>handleCreateTransactionSubmit</code>)<br/>
        • Relatório de Sessão Exploratória: <a href="Relatorio-de-Sessao-Test-Charter">Sessão 01 (Transações, Idempotência e Estornos)</a><br/>
        • Issue no GitHub: <a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/6">https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/6</a>
      </td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td>Baixa</td>
    </tr>
    <tr>
      <th align="left">Severidade</th>
      <td>Baixa</td>
    </tr>
    <tr>
      <th align="left">Informações sobre o Software</th>
      <td>PulPay Web Frontend v1.0.0 • Node.js / Express • Ambiente Local (<code>http://localhost:4000</code>) e Produção Vercel (<code>https://pulpay.qatec.com.br</code>) • Navegador Chrome 131 (macOS)</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td>
        • Regras de Negócio: <a href="Regras-de-Negocio-e-Contratos"><code>RN&#8209;FE&#8209;08</code></a>, <a href="Regras-de-Negocio-e-Contratos"><code>RN&#8209;FE&#8209;09</code></a><br/>
        • Casos de Teste / Sessão: <a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;08</code></a>, <a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;12</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S01</code></a>
      </td>
    </tr>
    <tr>
      <th align="left">Status</th>
      <td>Aberto (Novo)</td>
    </tr>
  </tbody>
</table>

---

### Defeito 03 (`DEF-03` — [GitHub Issue #7](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/7))
Baseado na ISO-29119-3 e em ferramentas de gestão de defeitos.

<table>
  <tbody>
    <tr>
      <th width="200" align="left">ID</th>
      <td><code>DEF&#8209;03</code> (<a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/7">GitHub Issue #7</a>)</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td>Formulário de cadastro de webhook permite submissão com todos os checkboxes de eventos desmarcados</td>
    </tr>
    <tr>
      <th align="left">Testador</th>
      <td>Dennys Matos</td>
    </tr>
    <tr>
      <th align="left">Data e Hora</th>
      <td>25 de novembro de 2026 08:22 PM</td>
    </tr>
    <tr>
      <th align="left">Resultado Esperado</th>
      <td>Conforme a regra <code>RN&#8209;FE&#8209;11</code> (que estabelece a seleção de um ou mais eventos no campo obrigatório <em>Eventos Assinados *</em>), caso o lojista desmarque todos os quatro checkboxes de eventos, o frontend deve exibir um alerta de validação impedindo o envio com array vazio.</td>
    </tr>
    <tr>
      <th align="left">Resultado Atual</th>
      <td>Quando o usuário desmarca todos os checkboxes (<code>transaction.paid</code>, <code>transaction.failed</code>, <code>transaction.refunded</code>, <code>webhook.test</code>) e clica em <code>Salvar Webhook</code> (<code>[data&#8209;testid="btn&#8209;save&#8209;webhook"]</code>), a requisição <code>POST /webhooks</code> é enviada com <code>events: []</code> e o backend assume silenciosamente todos os 4 eventos marcados por padrão, contrariando a seleção feita na tela.</td>
    </tr>
    <tr>
      <th align="left">Evidências</th>
      <td>
        • Código-fonte: <code>public/js/app.js</code> (função <code>handleCreateWebhookSubmit</code> não valida <code>selectedEvents.length === 0</code>)<br/>
        • Relatório de Sessão Exploratória: <a href="Relatorio-de-Sessao-Test-Charter">Sessão 02 (Gestão de Carteiras e Simulador de Webhooks HMAC)</a><br/>
        • Issue no GitHub: <a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/7">https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/7</a>
      </td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td>Média</td>
    </tr>
    <tr>
      <th align="left">Severidade</th>
      <td>Média</td>
    </tr>
    <tr>
      <th align="left">Informações sobre o Software</th>
      <td>PulPay Web Frontend v1.0.0 • Node.js / Express • Ambiente Local (<code>http://localhost:4000</code>) e Produção Vercel (<code>https://pulpay.qatec.com.br</code>) • Navegador Chrome 131 (macOS)</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td>
        • Regras de Negócio: <code>RF04</code>, <a href="Regras-de-Negocio-e-Contratos"><code>RN&#8209;FE&#8209;11</code></a><br/>
        • Casos de Teste / Sessão: <a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;13</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S02</code></a>
      </td>
    </tr>
    <tr>
      <th align="left">Status</th>
      <td>Aberto (Novo)</td>
    </tr>
  </tbody>
</table>

---

### Defeito 04 (`DEF-04` — [GitHub Issue #8](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/8))
Baseado na ISO-29119-3 e em ferramentas de gestão de defeitos.

<table>
  <tbody>
    <tr>
      <th width="200" align="left">ID</th>
      <td><code>DEF&#8209;04</code> (<a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/8">GitHub Issue #8</a>)</td>
    </tr>
    <tr>
      <th align="left">Título</th>
      <td>Botão Copiar do campo Segredo HMAC copia chave padrão da plataforma quando o input está em branco</td>
    </tr>
    <tr>
      <th align="left">Testador</th>
      <td>Dennys Matos</td>
    </tr>
    <tr>
      <th align="left">Data e Hora</th>
      <td>25 de novembro de 2026 08:27 PM</td>
    </tr>
    <tr>
      <th align="left">Resultado Esperado</th>
      <td>Quando o campo opcional Segredo HMAC (<code>[data&#8209;testid="input&#8209;webhook&#8209;secret"]</code>) estiver vazio, o botão <code>Copiar</code> (<code>[data&#8209;testid="btn&#8209;copy&#8209;secret"]</code>) deve alertar que não há segredo digitado para copiar, sem expor no código cliente uma string literal de segredo fallback do servidor.</td>
    </tr>
    <tr>
      <th align="left">Resultado Atual</th>
      <td>Ao clicar em <code>Copiar</code> com o campo <code>[data&#8209;testid="input&#8209;webhook&#8209;secret"]</code> vazio, o listener em <code>public/js/app.js</code> executa fallback para a string literal <code>whsec_pulsar_hmac_secret_2026</code> e a copia para a área de transferência do usuário.</td>
    </tr>
    <tr>
      <th align="left">Evidências</th>
      <td>
        • Código-fonte: <code>public/js/app.js</code> (listener de <code>btn-copy-secret</code>)<br/>
        • Relatório de Sessão Exploratória: <a href="Relatorio-de-Sessao-Test-Charter">Sessão 02 (Gestão de Carteiras e Simulador de Webhooks HMAC)</a><br/>
        • Issue no GitHub: <a href="https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/8">https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/8</a>
      </td>
    </tr>
    <tr>
      <th align="left">Prioridade</th>
      <td>Média</td>
    </tr>
    <tr>
      <th align="left">Severidade</th>
      <td>Média</td>
    </tr>
    <tr>
      <th align="left">Informações sobre o Software</th>
      <td>PulPay Web Frontend v1.0.0 • Node.js / Express • Ambiente Local (<code>http://localhost:4000</code>) e Produção Vercel (<code>https://pulpay.qatec.com.br</code>) • Navegador Chrome 131 (macOS)</td>
    </tr>
    <tr>
      <th align="left">Rastreabilidade</th>
      <td>
        • Regras de Negócio: <code>RF04</code>, <a href="Regras-de-Negocio-e-Contratos"><code>RN&#8209;FE&#8209;11</code></a>, <code>RN05</code><br/>
        • Casos de Teste / Sessão: <a href="Casos-de-Teste-ISO-29119-3"><code>CT&#8209;14</code></a>, <a href="Relatorio-de-Sessao-Test-Charter"><code>SBTM&#8209;S02</code></a>
      </td>
    </tr>
    <tr>
      <th align="left">Status</th>
      <td>Aberto (Novo)</td>
    </tr>
  </tbody>
</table>
