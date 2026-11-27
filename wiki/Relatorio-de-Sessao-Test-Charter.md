# Relatório de Sessão (Test Charter - SBTM)

Inspirado no artigo de Jon Bach sobre Session-Based Test Management (2000/2001).

---

## Sessão 01: Transações, Idempotência e Estornos

<table>
  <thead>
    <tr>
      <th width="240" align="left">Data e Hora do Início</th>
      <th width="220" align="left">Nome do Testador</th>
      <th align="left">Módulo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>25 de novembro de 2026 07:40 PM</td>
      <td>Dennys Matos</td>
      <td>Transações e Conciliação</td>
    </tr>
  </tbody>
</table>

### Test Charter
Explore a funcionalidade de processamento de transações, chave de idempotência e estorno de valores  
Com a heurística de Sabedoria em Testes com foco em Adotar a Abordagem Contrária e Análise de Valor Limite  
Para descobrir se o software lida bem com situações onde o lojista tenta movimentar valores acima do saldo disponível, repetir chaves de idempotência com dados divergentes ou forçar estornos que deixariam a carteira negativa.

### Tamanho da Sessão
20 minutos

### Notas*
- **(I)** Iniciei a sessão logado com a Loja Estrela LTDA, que já possuía uma Carteira Principal BRL com saldo de R$ 1.250,00.
- **(I)** Marquei a opção de manter a mesma chave de idempotência após o envio e fiz uma cobrança (CHARGE) paga no valor de R$ 100,00. O saldo subiu para R$ 1.350,00. Em seguida, alterei o valor no formulário para R$ 900,00 e o tipo para DEBIT, mantendo a mesma chave, e cliquei em processar novamente. O sistema retornou o aviso amarelo de requisição idempotente com a transação original de R$ 100,00, ignorando completamente os novos parâmetros digitados na tela.
- **(R)** Se o usuário mantiver uma chave de idempotência preenchida manualmente e mudar o valor ou o tipo da operação achando que está fazendo um novo lançamento, a aplicação vai devolver sucesso (200 OK) referente à transação antiga sem avisar que o payload enviado agora era diferente do original.
- **(I)** Tentei esvaziar a carteira fazendo um pagamento (PAYMENT) com status PAID de exatamente R$ 1.350,00. A operação passou normalmente e zerou o saldo da carteira.
- **(I)** Com o saldo da carteira zerado (R$ 0,00), fui na tabela de extrato e cliquei em Solicitar Estorno na cobrança antiga de R$ 250,00 que estava com status PAID. O sistema bloqueou a ação e exibiu a mensagem da API informando que não havia saldo suficiente na conta para estornar aquela cobrança sem negativar a carteira.
- **(R)** Quando o lojista digita manualmente um valor negativo ou zero no campo de valor da transação e tenta submeter, o formulário permite o clique no botão e depende do retorno 422 da API em vez de travar o envio antes da requisição sair do navegador.

*(\*) Podem ser (I)nformações ou (R)iscos.*

### Defeitos
- **[DEF-01 / Issue #1](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/1)** ([Gestão de Defeitos](Gestao-de-Defeitos-ISO-29119-3)): No campo de valor da transação, ao tentar enviar um valor negativo como -10.00, o texto de ajuda em vermelho aparece abaixo do campo, mas a requisição HTTP ainda assim é disparada para o backend em vez de ser interrompida na validação local do formulário.
- **[DEF-02 / Issue #2](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/2)** ([Gestão de Defeitos](Gestao-de-Defeitos-ISO-29119-3)): Na tabela de extrato, quando uma transação é filtrada por um status específico e um novo lançamento é feito com outro status, a lista recarrega mantendo o filtro ativo e o usuário não vê a transação que acabou de criar na tabela.

### Perguntas
- Quando uma requisição repetida chega com a mesma chave de idempotência, mas com valor ou tipo de operação diferentes da transação original, o sistema deveria retornar a transação antiga (200 OK) ou rejeitar com erro de conflito (409/422)?
- O checkbox de manter a mesma chave de idempotência deveria ficar visível para o lojista final em produção ou apenas em ambiente de homologação e testes?

---

## Sessão 02: Gestão de Carteiras e Simulador de Webhooks HMAC

<table>
  <thead>
    <tr>
      <th width="240" align="left">Data e Hora do Início</th>
      <th width="220" align="left">Nome do Testador</th>
      <th align="left">Módulo</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>25 de novembro de 2026 08:15 PM</td>
      <td>Dennys Matos</td>
      <td>Carteiras e Webhooks</td>
    </tr>
  </tbody>
</table>

### Test Charter
Explore a criação de carteiras financeiras e o simulador de disparo de webhooks  
Com a heurística de Particionamento de Equivalência e entradas fora do padrão esperado  
Para descobrir se a interface trata adequadamente moedas não suportadas, nomes em branco, URLs sem protocolo válido e payloads JSON malformados durante a simulação de assinaturas HMAC.

### Tamanho da Sessão
15 minutos

### Notas*
- **(I)** Criei uma nova carteira deixando o campo de nome totalmente vazio e com saldo inicial de R$ 0,00. O sistema cadastrou a carteira assumindo o nome padrão Conta Principal, mesmo já existindo outra carteira com título parecido na conta do lojista.
- **(I)** Selecionei a moeda USD no seletor de criação de carteira e cliquei em criar. O alerta vermelho exibiu a mensagem retornada pela API (422 UNSUPPORTED_CURRENCY) informando que a plataforma opera exclusivamente com BRL.
- **(I)** No módulo de Webhooks, desmarquei todos os quatro checkboxes de eventos e cadastrei uma URL válida. Mesmo enviando a lista de eventos vazia pelo formulário, o backend cadastrou o webhook com todos os quatro eventos habilitados por padrão.
- **(R)** O lojista pode criar dezenas de carteiras com exatamente o mesmo nome (Conta Principal), o que dificulta identificar qual carteira está sendo selecionada no dropdown da tela de transações, já que o seletor exibe apenas o nome e o saldo, sem mostrar parte do ID da conta.
- **(I)** No simulador de disparo de webhook, apaguei uma chave do JSON no campo de texto e tentei simular. A validação local impediu a chamada para a API e destacou o campo informando que o JSON era inválido.

*(\*) Podem ser (I)nformações ou (R)iscos.*

### Defeitos
- **[DEF-03 / Issue #3](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/3)** ([Gestão de Defeitos](Gestao-de-Defeitos-ISO-29119-3)): No cadastro de webhook, quando o usuário desmarca todos os checkboxes de eventos na tela e clica em Salvar Webhook, o formulário não exibe erro de campo obrigatório e acaba salvando o webhook com todos os eventos marcados por conta do comportamento padrão da API.
- **[DEF-04 / Issue #4](https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/issues/4)** ([Gestão de Defeitos](Gestao-de-Defeitos-ISO-29119-3)): Ao clicar no botão Copiar do segredo HMAC com o campo de segredo vazio, o sistema copia o segredo padrão da plataforma para a área de transferência, expondo qual é a chave padrão utilizada pelo servidor.

### Perguntas
- Deveria ser permitido cadastrar mais de uma carteira com exatamente o mesmo nome para o mesmo lojista?
- No simulador de webhook, deveria ser permitido disparar uma simulação quando o lojista ainda não possui nenhum endpoint de webhook cadastrado na conta?
