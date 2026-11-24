# Design System, Identidade Visual PulPay e UX

A interface do **PulPay (`pulsar payments`)** foi projetada seguindo o Brandbook oficial do projeto, combinando o framework **Bulma CSS v1.0** com um sistema próprio de *Design Tokens* (CSS Custom Properties) em `public/css/styles.css`.

---

## 1. Paleta de Cores Oficial (Brandbook PulPay)

| Nome da Cor | Token CSS | Hexadecimal | Aplicação na Interface |
| :--- | :--- | :---: | :--- |
| **Azul Noturno** | `--pulpay-night-blue`<br>`--pulsar-bg` | `#071024`<br>`#081121` | Background principal no Modo Escuro (padrão de fábrica), barra de navegação fixa e fundo de blocos HMAC |
| **Superfície Noturna** | `--pulsar-surface`<br>`--pulsar-surface-alt` | `#0F1B31`<br>`#162440` | Cards de carteiras, painéis de módulos, KPIs e caixas de filtro |
| **Roxo Cósmico** | `--pulpay-cosmic-purple` | `#8B5CF6` | Início do gradiente principal da marca, botões de ação (`is-link`) e badges de status `REFUNDED` |
| **Azul Elétrico** | `--pulpay-electric-blue` | `#0EA5E9` | Centro do gradiente da marca, bordas interativas em foco/hover e botões secundários |
| **Verde BRL** | `--pulpay-brl-green` | `#10F57A` | Final do gradiente da marca, saldos em Real Brasileiro (`R$`), contornos *neon glow*, badges `PAID` e `ACTIVE` |

---

## 2. Logotipo Vetorial, Favicon e Tipografia

- **Ícone do Aplicativo (`public/favicon.svg`):**
  - Monograma vetorial de alta precisão (`1024x1024`) exibindo a letra **`P`** integrada a uma **Onda de Pulso (ECG)** com gradiente contínuo **Roxo Cósmico → Azul Elétrico → Verde BRL** sobre um container *squircle* em **Azul Noturno** com halo luminoso.
  - Utilizado simultaneamente como **Favicon da aba do navegador**, emblema da barra de navegação fixa e hero badge nos cartões de autenticação e na seção *"Quem Somos"*.
- **Tipografia da Marca:**
  - **`PulPay`:** `"Pul"` em branco extra-bold (`font-weight: 800`) + `"Pay"` preenchido com gradiente Azul Elétrico → Verde BRL (`background-clip: text`).
  - **`pulsar payments`:** `"pulsar"` em negrito + `"payments"` em peso leve, acompanhado da assinatura `GERENCIE SUAS CARTEIRAS BRL, COBRANÇAS, CONCILIAÇÃO E WEBHOOKS`.

---

## 3. Componentes de Experiência do Usuário (UI/UX)

1. **Barra de Navegação Fixa (`is-fixed-top`) com Glassmorphism:**
   - Permanece fixa no topo durante a rolagem com `backdrop-filter: blur(14px)`.
   - Inclui o **botão circular minimalista de tema** (ícone vetorial SVG Sol / Lua), o **chip da Loja autenticada** com indicador verde neon pulsante (exibindo apenas a Razão Social/Nome da Loja e mantendo o e-mail no tooltip) e o botão `"Sair da Conta"` harmônico com o tema escuro.
2. **Menu Mobile Flutuante (*Floating Glass Popover Drawer*):**
   - Em telas `< 1024px`, o botão hambúrguer abre um card flutuante com vidro fosco (`backdrop-filter: blur(18px)`), borda neon Verde BRL, entrada em cascata (*staggered animation*) dos links, indicador vertical luminoso à esquerda e *backdrop* escurecido que fecha o menu automaticamente ao tocar fora ou navegar.
3. **Seção Estática `"Quem Somos"` com Player de Vídeo em Loop Infinito:**
   - Apresenta o contexto didático da **Mentoria 2.0 (Júlio de Lima)** com os badges **`Projeto de Portfólio Pessoal - Turma 5`** e **`By Dennys Matos`**.
   - Conta com o player de vídeo demonstrativo (`/media/video_pulpay.mp4`) configurado em reprodução automática e contínua (`autoplay`, `loop`, `muted`, `playsinline`) e botões dedicados na moldura superior para **Pausar/Reproduzir** e **Ativar Som/Mutar**.
