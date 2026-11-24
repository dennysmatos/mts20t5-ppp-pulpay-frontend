import express from 'express';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');

// Headers de segurança HTTP (Boas práticas OWASP / Mercado)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos públicos (CSS, JS, HTML e vendor/bulma)
const publicDir = path.resolve(__dirname, '../public');
const bulmaStaticFile = path.join(publicDir, 'vendor/bulma/bulma.min.css');
const bulmaNodeModulesFile = path.resolve(
  __dirname,
  '../node_modules/bulma/css/bulma.min.css'
);

app.get('/vendor/bulma/bulma.min.css', (_req, res) => {
  const target = fs.existsSync(bulmaStaticFile)
    ? bulmaStaticFile
    : bulmaNodeModulesFile;
  const css = fs.readFileSync(target, 'utf-8');
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.status(200).send(css);
});

app.use(express.static(publicDir, { index: false }));

// Endpoint de configuração dinâmica do ambiente (RN-FE: Configuração de Ambiente Desacoplada)
app.get('/config.js', (_req, res) => {
  const apiBaseUrl =
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3000';

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(
    `window.__PULSAR_CONFIG__ = ${JSON.stringify({
      VITE_API_BASE_URL: apiBaseUrl,
      API_BASE_URL: apiBaseUrl
    })};\n`
  );
});

// Endpoint JSON opcional para inspeção da configuração
app.get('/api/config', (_req, res) => {
  const apiBaseUrl =
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3000';

  res.status(200).json({
    VITE_API_BASE_URL: apiBaseUrl,
    API_BASE_URL: apiBaseUrl
  });
});

// Healthcheck da aplicação Web Frontend
app.get('/health', (_req, res) => {
  const apiBaseUrl =
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3000';

  res.status(200).json({
    status: 'ok',
    service: 'Pulsar Payments Web Frontend',
    apiBaseUrl,
    timestamp: new Date().toISOString()
  });
});

// Rotas da aplicação Web (SPA / Route Guards tratados no Frontend conforme RN-FE-01)
const indexFile = path.join(publicDir, 'index.html');

const serveIndexHtml = (_req, res) => {
  const html = fs.readFileSync(indexFile, 'utf-8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};

const appRoutes = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/accounts',
  '/transactions',
  '/webhooks'
];

app.get(appRoutes, serveIndexHtml);

// Fallback para rotas SPA
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    return serveIndexHtml(req, res);
  }
  return res.status(404).json({
    error: 'NOT_FOUND',
    message: `Rota ${req.method} ${req.originalUrl} não encontrada na aplicação Web`
  });
});

export default app;
