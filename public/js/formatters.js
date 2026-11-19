/**
 * Utilitários de Formatação Monetária, Temporal, Documento e Validação (RN-FE-02, RN-FE-04)
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

/**
 * RN-FE-02: Formatação de Moeda (BRL) no padrão brasileiro (ex.: R$ 1.250,50)
 */
export function formatCurrencyBRL(value) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return brlFormatter.format(0);
  }
  return brlFormatter.format(num);
}

/**
 * RN-FE-02: Serialização para a API como Number decimal com até 2 casas (ex.: 1250.50)
 */
export function serializeDecimalAmount(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return NaN;
  }
  const normalized = String(rawValue)
    .replace(/R\$\s?/g, '')
    .replace(/\s+/g, '')
    .trim();

  // Caso possua vírgula como separador decimal brasileiro e pontos de milhar
  let parsed;
  if (normalized.includes(',') && normalized.includes('.')) {
    parsed = Number(normalized.replace(/\./g, '').replace(',', '.'));
  } else if (normalized.includes(',')) {
    parsed = Number(normalized.replace(',', '.'));
  } else {
    parsed = Number(normalized);
  }

  if (Number.isNaN(parsed)) {
    return NaN;
  }

  return Number(parsed.toFixed(2));
}

/**
 * RN-FE-02: Formatação de Datas ISO-8601 no fuso horário local do usuário no formato dd/MM/yyyy HH:mm:ss
 */
export function formatDateTimeBR(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return String(isoString);

  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * RN-FE-04: Máscara visual para Documento CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
 */
export function maskCpfCnpj(rawValue) {
  if (!rawValue) return '';
  const digits = String(rawValue).replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * RN-FE-04: Validação de formato de e-mail válido
 */
export function isValidEmail(email) {
  if (!email) return false;
  const trimmed = String(email).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * RN-FE-11: Validação de URL de Webhook (http:// ou https://)
 */
export function isValidHttpUrl(url) {
  if (!url) return false;
  const trimmed = String(url).trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Gera UUID v4 para Idempotency-Key (RN-FE-08)
 */
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `idem-${crypto.randomUUID()}`;
  }
  const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `idem-${randomHex()}${randomHex()}-${randomHex()}-4${randomHex().slice(1)}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
}

/**
 * Escapa caracteres HTML para evitar XSS na renderização dinâmica
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
