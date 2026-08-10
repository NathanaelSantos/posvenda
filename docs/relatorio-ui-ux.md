# Relatório Técnico de Front-end / UI

**Projeto:** Pós-venda — Cred Móveis Itabaiana  
**Arquivo de estilos:** `public/css/styles.css`  
**Página principal de avaliação:** `public/index.html`  
**Escopo:** interface do formulário de avaliação do cliente e sistema de design compartilhado (login, Área da Loja, BI e QR Code)

---

## 1. Objetivo

Este relatório descreve as decisões de UI/UX implementadas no front-end da aplicação de pós-venda, com foco em:

- centralizar a experiência na tarefa principal (responder a pesquisa);
- padronizar componentes, cores, tipografia e espaçamentos;
- garantir feedback visual em interações (focus, hover, estados ativos);
- manter legibilidade e usabilidade em mobile (QR Code → celular).

---

## 2. Design Tokens (Design System em CSS)

A base visual foi centralizada em **Custom Properties** no seletor `:root`, evitando valores mágicos espalhados e facilitando manutenção.

```css
:root {
  /* Fundos */
  --marfim: #fbf7ef;
  --marfim-2: #f5eee0;
  --bege: #ecdcc4;
  --bege-2: #e2cdaf;
  --bege-quente: #d3b48c;

  /* Marca / acentos */
  --caramelo: #b0824c;
  --caramelo-escuro: #8a5e33;
  --marrom: #43331f;
  --marrom-suave: #6a5843;
  --dourado: #c9a227;

  /* Semânticos */
  --verde: #6f8f57;
  --terracota: #b5654f;

  /* Linhas e elevação */
  --linha: rgba(67, 51, 31, 0.14);
  --linha-forte: rgba(67, 51, 31, 0.28);
  --sombra: 0 10px 30px -12px rgba(67, 51, 31, 0.35);
  --sombra-sutil: 0 2px 10px -4px rgba(67, 51, 31, 0.25);

  /* Raio e tipografia */
  --raio: 16px;
  --raio-sm: 10px;
  --fonte-titulo: Georgia, 'Times New Roman', 'Playfair Display', serif;
  --fonte-corpo: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
```

### Papel de cada token

| Token | Uso principal |
|---|---|
| `--marfim` | fundo da página e campos |
| `--caramelo` / `--caramelo-escuro` | primária da marca, botões, focus ring |
| `--marrom` | títulos e texto principal |
| `--marrom-suave` | texto secundário / legendas |
| `--dourado` | estrelas selecionadas / hover |
| `--linha` / `--linha-forte` | bordas de cards e inputs |
| `--sombra` / `--sombra-sutil` | elevação de cards e botões |
| `--raio` / `--raio-sm` | arredondamento padrão |

---

## 3. Estrutura do Layout

A página de avaliação usa **Single Column Layout**: uma coluna central, sem sidebars, com largura controlada para leitura em mobile.

### Container principal

```css
.container {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 18px 64px;
}

.container-larga {
  max-width: 1180px; /* BI, Área da Loja, QR */
}
```

### Fundo da página

```css
body {
  font-family: var(--fonte-corpo);
  color: var(--marrom-suave);
  background: var(--marfim);
  background-image:
    radial-gradient(1200px 600px at 100% -10%, rgba(211, 180, 140, 0.35), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(236, 220, 196, 0.6), transparent 55%);
  background-attachment: fixed;
  line-height: 1.55;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
```

**Propriedades relevantes e intenção:**

| Propriedade | Função de UI |
|---|---|
| `max-width: 560px` | limita linha de leitura e foca no formulário |
| `margin: 0 auto` | centraliza o bloco na viewport |
| `padding` | respiro lateral e inferior no mobile |
| `min-height: 100vh` | ocupa a altura da tela |
| `background-image` (radial) | profundidade sutil sem imagens pesadas |
| `background-attachment: fixed` | fundo estável durante o scroll |
| `line-height: 1.55` | legibilidade de corpo de texto |

### Objetivos

- Centralizar o conteúdo na tarefa principal.
- Melhorar a leitura em celulares (entrada via QR Code).
- Facilitar adaptação responsiva sem grid complexo.

---

## 4. Remoção de elementos secundários (foco na tarefa)

A interface do cliente não utiliza painéis laterais, menus densos nem widgets paralelos. A hierarquia se resume a:

1. **Topo** — marca + acesso secundário à Área da Loja  
2. **Hero** — pergunta principal  
3. **Card** — formulário em etapas numeradas  
4. **Rodapé** — texto institucional discreto  

### Conceitos aplicados

- **Progressive Disclosure** — seções numeradas (1–6), cada uma com um objetivo claro  
- **Minimal Design** — um card, uma coluna, poucos estilos concorrentes  
- **Visual Hierarchy** — título hero > títulos de bloco > campos > rodapé  

### Resultado

- Maior foco no envio da avaliação  
- Menor distração visual no fluxo pós-compra  

---

## 5. Topo da avaliação (header + CTA secundário)

O link **Área da Loja** foi posicionado no **canto superior direito**, sem competir com o formulário.

```css
.topo-avaliacao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.link-area-loja {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--caramelo-escuro);
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--linha-forte);
  background: rgba(255, 255, 255, 0.65);
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  white-space: nowrap;
}

.link-area-loja:hover {
  background: var(--bege);
  border-color: var(--bege-quente);
  transform: translateY(-1px);
}
```

| Propriedade | Intenção |
|---|---|
| `display: flex` + `justify-content: space-between` | marca à esquerda, ação à direita |
| `border-radius: 999px` | botão “pill”, visual de chip/CTA |
| `flex-shrink: 0` | evita compressão do botão em telas estreitas |
| `transform: translateY(-1px)` no hover | microinteração de elevação |
| `white-space: nowrap` | mantém o rótulo em uma linha |

---

## 6. Card principal do formulário

O formulário (`form#form`) é encapsulado na classe `.card`.

```css
.card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(6px);
  border: 1px solid var(--linha);
  border-radius: var(--raio); /* 16px */
  box-shadow: var(--sombra);
  padding: 26px 24px;
}
```

| Propriedade | Função |
|---|---|
| `background: rgba(255,255,255,0.72)` | superfície clara sem bloco “duro” |
| `backdrop-filter: blur(6px)` | efeito glass sutil sobre o fundo |
| `border` | contorno leve, definição de borda |
| `border-radius: 16px` | cantos suaves, padrão do sistema |
| `box-shadow` | elevação / profundidade do formulário |
| `padding` | whitespace interno consistente |

### Objetivos

- Destacar o formulário como superfície principal  
- Criar profundidade controlada  
- Transmitir organização e confiança  

---

## 7. Espaçamento (Whitespace)

O espaçamento é repetido em faixas próximas de **múltiplos de 8px** (com alguns valores intermediários para densidade de formulário: 10–14px).

### Exemplos no código

```css
/* Container */
padding: 24px 18px 64px;

/* Seções do formulário */
.bloco { margin-bottom: 26px; }

/* Campos empilhados */
.campo + .campo { margin-top: 14px; }

/* Botões */
.btn { padding: 14px 22px; gap: 8px; }

/* Topo */
.topo-avaliacao { gap: 12px; margin-bottom: 22px; }

/* Corpo */
body { line-height: 1.55; }
```

### Benefícios

- Escaneabilidade das etapas  
- Menor fadiga visual  
- Separação clara entre blocos sem linhas excessivas  

---

## 8. Tipografia e hierarquia

```css
h1, h2, h3, h4 {
  font-family: var(--fonte-titulo);
  color: var(--marrom);
  font-weight: 700;
  line-height: 1.2;
}

.hero h1 { font-size: 27px; margin-bottom: 8px; }
.hero p  { font-size: 15px; color: var(--marrom-suave); }

.marca-nome { font-size: 20px; font-weight: 700; }
.marca-sub  {
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--caramelo-escuro);
}

.bloco-titulo {
  font-family: var(--fonte-titulo);
  font-size: 17px;
  font-weight: 700;
}

.bloco-ajuda {
  font-size: 13.5px;
  color: var(--marrom-suave);
}
```

### Hierarquia aplicada

| Nível | Elemento | Características |
|---|---|---|
| 1 | `.hero h1` | 27px, serif, marrom escuro |
| 2 | `.bloco-titulo` | 17px, numeração circular |
| 3 | labels / campos | 14–15px, corpo do sistema |
| 4 | ajuda / rodapé | 12.5–13.5px, cor secundária |

**Objetivo:** destacar a pergunta principal e orientar o olho para cada etapa do formulário.

---

## 9. Numeração de etapas (Visual Hierarchy + Progressive Disclosure)

```css
.bloco-titulo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bloco-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bege);
  color: var(--caramelo-escuro);
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.bloco-ajuda {
  margin: 2px 0 14px 36px; /* alinhado ao texto, após o badge */
}
```

| Propriedade | Função |
|---|---|
| `display: grid` + `place-items: center` | centraliza o número no círculo |
| `border-radius: 50%` | badge circular de etapa |
| `margin-left: 36px` na ajuda | alinhamento ótico com o texto do título |

---

## 10. Campos de formulário

Todos os inputs textuais, selects e textareas compartilham o mesmo base style.

```css
select,
input[type="text"],
input[type="tel"],
input[type="password"],
textarea {
  width: 100%;
  font-family: var(--fonte-corpo);
  font-size: 15px;
  color: var(--marrom);
  background: var(--marfim);
  border: 1.5px solid var(--linha-forte);
  border-radius: var(--raio-sm); /* 10px */
  padding: 12px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

select:focus,
input:focus,
textarea:focus {
  outline: none;
  border-color: var(--caramelo);
  box-shadow: 0 0 0 3px rgba(176, 130, 76, 0.18);
}

textarea {
  resize: vertical;
  min-height: 96px;
}
```

### Estado de foco (Focus Ring)

| Propriedade | Benefício |
|---|---|
| `outline: none` + `box-shadow` em anel | focus visível customizado (acessibilidade) |
| `border-color: var(--caramelo)` | reforço da marca no estado ativo |
| `transition` | mudança suave, sem “pulo” visual |
| `padding: 12px 14px` | área de toque confortável (Fitts’s Law) |

---

## 11. Sistema de avaliação por estrelas

Implementação com `input[type=radio]` ocultos e `label` clicáveis, com técnica **row-reverse** para hover progressivo via CSS puro.

```css
.estrelas {
  display: inline-flex;
  flex-direction: row-reverse;
  gap: 4px;
}

.estrelas input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.estrelas label {
  font-size: 38px;
  line-height: 1;
  color: var(--bege-2);
  cursor: pointer;
  transition: transform 0.1s, color 0.12s;
  user-select: none;
}

.estrelas label:hover {
  transform: scale(1.12);
}

.estrelas input:checked ~ label,
.estrelas label:hover,
.estrelas label:hover ~ label {
  color: var(--dourado);
}

/* Critérios secundários */
.estrelas.sm label { font-size: 27px; }

@media (max-width: 380px) {
  .estrelas.sm label { font-size: 23px; }
}
```

| Propriedade | Função de UX |
|---|---|
| `font-size: 38px` | alvo de toque grande no mobile |
| `flex-direction: row-reverse` | permite preencher estrelas à esquerda no hover com seletores CSS |
| `transform: scale(1.12)` | feedback de hover imediato |
| `color: var(--dourado)` | estado selecionado/hover destacado |
| variante `.sm` | densifica critérios sem perder legibilidade |

---

## 12. Escala NPS (0–10)

```css
.nps {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 6px;
}

.nps label {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 1.5px solid var(--linha-forte);
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: var(--marfim);
  transition: all 0.12s;
}

.nps label:hover {
  border-color: var(--caramelo);
}

.nps input:checked + label {
  background: var(--caramelo);
  border-color: var(--caramelo);
  color: #fff;
  transform: translateY(-2px);
}
```

| Propriedade | Intenção |
|---|---|
| `grid-template-columns: repeat(11, 1fr)` | 11 opções equidistantes (0–10) |
| `aspect-ratio: 1` | células quadradas, fáceis de tocar |
| estado `:checked` com elevação | feedback claro da seleção |

---

## 13. Separação entre seções

As etapas usam espaçamento vertical e, nos critérios, divisores tracejados.

```css
.bloco {
  margin-bottom: 26px;
}

.criterio {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px dashed var(--linha);
}

.criterio:last-child {
  border-bottom: none;
}
```

**Resultado:** percepção de etapas sem poluir com linhas pesadas em todo o card.

---

## 14. Botões

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15.5px;
  font-weight: 700;
  padding: 14px 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.15s, background 0.15s;
  text-decoration: none;
}

.btn-primario {
  background: linear-gradient(135deg, var(--caramelo), var(--caramelo-escuro));
  color: var(--marfim);
  box-shadow: var(--sombra-sutil);
  width: 100%;
}

.btn-primario:hover {
  transform: translateY(-1px);
  box-shadow: var(--sombra);
}

.btn-primario:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secundario {
  background: var(--bege);
  color: var(--caramelo-escuro);
  border: 1px solid var(--linha);
}

.btn-fantasma {
  background: transparent;
  color: var(--caramelo-escuro);
  border: 1.5px solid var(--linha-forte);
}

.btn-sm {
  padding: 9px 16px;
  font-size: 13.5px;
}
```

### Variantes

| Classe | Uso |
|---|---|
| `.btn-primario` | CTA principal (Enviar avaliação, Entrar) |
| `.btn-secundario` | ações auxiliares (exportar, voltar) |
| `.btn-fantasma` | ações terciárias (Sair, ver avaliação) |
| `.btn-sm` | densidade reduzida no topbar admin |

---

## 15. Paleta de cores (identidade visual)

Identidade baseada em **bege quente e marfim**, alinhada à marca Cred Móveis.

| Papel | Token / valor | Uso |
|---|---|---|
| Background | `#fbf7ef` (`--marfim`) | fundo da aplicação |
| Superfície | `rgba(255,255,255,0.72)` | cards / painéis |
| Primária | `#b0824c` (`--caramelo`) | botões, focus, NPS ativo |
| Primária escura | `#8a5e33` (`--caramelo-escuro`) | gradiente e links |
| Texto | `#43331f` (`--marrom`) | títulos |
| Texto secundário | `#6a5843` (`--marrom-suave`) | parágrafos, legendas |
| Destaque estrelas | `#c9a227` (`--dourado`) | rating |
| Sucesso | `#6f8f57` (`--verde`) | KPI/NPS positivo, selo obrigado |
| Alerta / erro | `#b5654f` (`--terracota`) | KPI negativo, avisos |
| Borda | `rgba(67,51,31,0.14–0.28)` | contornos |

---

## 16. Bordas e raios

```css
--raio: 16px;      /* cards, painéis, filtros */
--raio-sm: 10px;   /* inputs, comentários, ícones */

/* Botões e chips */
border-radius: 999px;

/* NPS cells */
border-radius: 9px;

/* Badge de etapa */
border-radius: 50%;
```

Isso cria **consistência visual**: superfícies grandes com 16px, controles médios com 10px, CTAs em formato pill.

---

## 17. Sombras (elevação)

Dois níveis apenas — evita “stack” excessivo de profundidade.

```css
--sombra-sutil: 0 2px 10px -4px rgba(67, 51, 31, 0.25);
--sombra:       0 10px 30px -12px rgba(67, 51, 31, 0.35);
```

| Nível | Aplicação |
|---|---|
| Sutil | botão primário em repouso, KPIs, cards da loja |
| Forte | card principal, hover de botão primário / loja-card |

Tons de sombra derivados do marrom da marca (não preto puro), mantendo coesão cromática.

---

## 18. Feedbacks e estados

### Mensagens

```css
.aviso { display: none; padding: 12px 14px; border-radius: var(--raio-sm); }

.aviso.erro {
  display: block;
  background: rgba(181, 101, 79, 0.14);
  color: #8a3d29;
  border: 1px solid rgba(181, 101, 79, 0.35);
}

.aviso.ok {
  display: block;
  background: rgba(111, 143, 87, 0.16);
  color: #3f5730;
  border: 1px solid rgba(111, 143, 87, 0.4);
}
```

### Loading

```css
.spinner {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}

@keyframes girar {
  to { transform: rotate(360deg); }
}
```

---

## 19. Responsividade

A avaliação é **mobile-first** por natureza (entrada via QR). Ajustes pontuais:

```css
/* Estrelas menores em telas muito estreitas */
@media (max-width: 380px) {
  .estrelas.sm label { font-size: 23px; }
}

/* NPS mais compacto */
@media (max-width: 420px) {
  .nps label { font-size: 12px; }
  .nps { gap: 4px; }
}

/* Botão Área da Loja em telas pequenas */
@media (max-width: 400px) {
  .link-area-loja {
    font-size: 12px;
    padding: 7px 11px;
  }
}

/* BI: painéis empilham em coluna única */
@media (max-width: 900px) {
  .painel,
  .painel.span-4,
  .painel.span-8 {
    grid-column: span 12;
  }
}

/* Hub Área da Loja: 2 colunas → 1 */
@media (max-width: 720px) {
  .loja-grade { grid-template-columns: 1fr; }
}
```

### Estratégia

| Técnica | Implementação |
|---|---|
| Largura fluida | `width: 100%` + `max-width` |
| Grid adaptativo | `repeat(auto-fit, minmax(...))` nos KPIs |
| Breakpoints | 380 / 400 / 420 / 720 / 900 px |
| Touch targets | estrelas 38px, botões com padding generoso |

---

## 20. Áreas administrativas (mesmo sistema visual)

O design system se estende para:

| Tela | Layout | Componentes-chave |
|---|---|---|
| Login | coluna estreita (`.login-wrap`, max 380px) | card + input password + CTA |
| Área da Loja | grid 2 colunas (`.loja-grade`) | cards com hover elevação |
| BI | `.container-larga` + grid 12 colunas | KPIs, painéis, barras, donut SVG |
| QR Code | grid 2 colunas + cartaz imprimível | preview + ações de download |

### Exemplo — cards da Área da Loja

```css
.loja-card {
  display: block;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--linha);
  border-radius: var(--raio);
  box-shadow: var(--sombra-sutil);
  padding: 28px 26px 24px;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.loja-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--sombra);
  border-color: var(--bege-quente);
}
```

---

## 21. Princípios de UI/UX aplicados

| Princípio | Como aparece no produto |
|---|---|
| **Visual Hierarchy** | hero → blocos numerados → campos → CTA full-width |
| **Whitespace** | paddings/margins controlados; seções com respiro |
| **Consistency** | tokens CSS, botões, raios e cores reutilizados |
| **Minimal Design** | single column; sem sidebars no fluxo do cliente |
| **Progressive Disclosure** | etapas 1–6 com um objetivo cada |
| **Fitts’s Law** | estrelas grandes, botões com padding alto, NPS em grid |
| **Hick’s Law** | poucas ações concorrentes na tela do cliente |
| **Feedback Visual** | focus ring, hover, checked, disabled, avisos, spinner |
| **Brand Affinity** | paleta bege/marfim/caramelo alinhada à loja de móveis |

---

## 22. Arquivos de referência

```
public/
├── css/styles.css      # Design system + todos os componentes
├── index.html          # Avaliação (cliente)
├── login.html          # Entrada da equipe
├── obrigado.html       # Confirmação pós-envio
└── js/avaliacao.js     # Interação do formulário

views/
├── loja.html           # Hub Área da Loja
├── bi.html             # Painel de BI
└── qrcode.html         # Geração de QR + cartaz
```

---

## 23. Conclusão

O front-end foi estruturado como um **sistema visual coerente** (tokens + componentes), orientado à conclusão da pesquisa de satisfação em dispositivos móveis. As propriedades CSS listadas neste relatório implementam:

1. **foco na tarefa** (single column + card único);  
2. **interação clara** (estrelas, NPS, focus e hover);  
3. **identidade de marca** (bege quente / marfim / caramelo);  
4. **continuidade** entre a experiência do cliente e a Área da Loja (BI + QR).  

O resultado é uma interface limpa, moderna, acessível ao toque e alinhada ao fluxo real de uso na loja (QR Code → avaliação → análise no painel).

---

*Documento técnico de UI/UX · Cred Móveis Itabaiana — Pós-venda*  
*Fonte de verdade dos estilos: `public/css/styles.css`*
