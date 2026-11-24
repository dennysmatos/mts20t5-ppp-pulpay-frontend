# Instalação, Execução Local, Testes e Deploy

Este guia apresenta o passo a passo para executar o ecossistema **PulPay (`pulsar payments`)** localmente, rodar a suíte de testes automatizados com cobertura de código e sincronizar a documentação com a aba **Wiki** do GitHub.

---

## 1. Executando o Ecossistema Completo Localmente

### Passo 1 — Iniciar a API Backend (`ppp-pulpay-backend` na porta `3000`)
Em um terminal, acesse o diretório do backend:
```bash
cd ../ppp-pulpay-backend
npm install
npm start
```
- A API estará disponível em `http://localhost:3000`
- Documentação interativa Swagger UI: `http://localhost:3000/api-docs`

### Passo 2 — Iniciar a Aplicação Web Frontend (`ppp-pulpay-frontend` na porta `4000`)
Em outro terminal, acesse o diretório do frontend:
```bash
cd ../ppp-pulpay-frontend
npm install
npm start
```
- A Aplicação Web estará disponível em `http://localhost:4000`
- Healthcheck do Frontend: `http://localhost:4000/health`
- Configuração dinâmica injetada: `http://localhost:4000/config.js`

---

## 2. Variáveis de Ambiente (`.env`)

O arquivo `.env` na raiz do `ppp-pulpay-frontend` (criado a partir do `.env.example`) suporta:

```env
PORT=4000
VITE_API_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
```

> Na **Vercel**, basta configurar a variável de ambiente `VITE_API_BASE_URL` apontando para a URL pública onde o backend (`ppp-pulpay-backend`) estiver hospedado.

---

## 3. Executando os Testes Automatizados e Cobertura

O projeto utiliza o executor nativo `node:test` e `node:assert/strict`:

```bash
# Executa as 3 suítes e 14 testes automatizados
npm test

# Executa os testes gerando o relatório detalhado de cobertura (> 96%)
npm run test:coverage
```

O que é validado automaticamente pela suíte `tests/frontend.test.js`:
1. Formatação monetária `BRL` (`R$ 1.250,50`), serialização decimal com 2 casas e formatação de datas `dd/MM/yyyy HH:mm:ss` (`RN-FE-02`).
2. Máscara dinâmica de CPF/CNPJ (`RN-FE-04`), validação de e-mail, validação de URL de Webhook (`RN-FE-11`), geração de `Idempotency-Key` (`RN-FE-08`) e sanitização `escapeHtml` contra XSS.
3. Ciclo de vida da sessão JWT, injeção automática do header `Authorization: Bearer <token>` e interceptação global de `401 Unauthorized` (`RN-FE-01`).
4. Consumo determinístico da propriedade `message` nos erros `400`, `409`, `422`, `500` e falhas de rede (`RN-FE-03`).
5. Respostas dos endpoints Express (`/health`, `/config.js`, `/api/config`, `/vendor/bulma/bulma.min.css`, `/favicon.svg`), presença de todos os seletores `data-testid`, seção estática *"Quem Somos"* e player de vídeo em loop.

---

## 4. Como Publicar estes Arquivos na Aba "Wiki" do GitHub

O GitHub armazena a aba **Wiki** de cada repositório em um repositório Git dedicado (`mts20t5-ppp-pulpay-frontend.wiki.git`), que é inicializado assim que a primeira página é criada na interface web do GitHub:

1. Acesse o repositório no GitHub (`https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend/wiki`).
2. Clique em **"Create the first page"** e salve a página inicial para o GitHub inicializar o repositório `.wiki.git`.
3. No terminal, clone o repositório da Wiki, copie os arquivos da pasta `wiki/` deste projeto e faça o push:
   ```bash
   git clone https://github.com/dennysmatos/mts20t5-ppp-pulpay-frontend.wiki.git /tmp/pulpay-wiki
   cp wiki/*.md /tmp/pulpay-wiki/
   cd /tmp/pulpay-wiki
   git add .
   git commit -m "docs(wiki): publica documentacao completa da Wiki do PulPay"
   git push origin master
   ```
4. Os arquivos `_Sidebar.md` e `_Footer.md` incluídos na pasta `wiki/` serão reconhecidos automaticamente pelo GitHub para montar o menu lateral e o rodapé de todas as páginas da Wiki.
