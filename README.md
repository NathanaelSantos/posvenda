# 🛋️ Pós-venda — Cred Móveis Itabaiana

Site de pós-venda para o cliente avaliar a experiência de compra. O cliente escaneia um **QR Code**, responde a pesquisa e a equipe acompanha tudo em um **painel de BI** alimentado por **PostgreSQL**.

Arquitetura em containers Docker:

| Serviço | Tecnologia | Função |
|---|---|---|
| **frontend** | nginx | HTML/CSS/JS + proxy `/api` |
| **backend** | Node.js / Express | API REST, auth, QR Code, agregações BI |
| **db** | PostgreSQL 16 | Avaliações e configuração |

Paleta da marca: **bege quente e marfim**. Tipografia: **Inter**.

---

## ✨ O que o site faz

| Página | Endereço | Para quem |
|---|---|---|
| **Avaliação** | `/` | Cliente (destino do QR Code) |
| **Obrigado** | `/obrigado` | Cliente (após enviar) |
| **Área da Loja** | `/loja` | Equipe (hub QR + BI, com senha) |
| **Painel de BI** | `/bi` | Equipe / gestor (com senha) |
| **Gerar QR Code** | `/qrcode` | Equipe (com senha) |
| **Login** | `/login` | Equipe |

**O painel de BI** lê as avaliações do **PostgreSQL** (não de arquivo JSON): KPIs, NPS, rankings, série temporal, comentários, filtros e exportação CSV.

---

## 🐳 Subir com Docker (recomendado)

Pré-requisitos: [Docker](https://docs.docker.com/get-docker/) e Docker Compose.

```bash
# 1. (Opcional) copiar variáveis de ambiente
cp .env.example .env

# 2. Subir front + back + banco
docker compose up --build -d

# 3. (Opcional) popular com avaliações de exemplo
docker compose exec backend node scripts/seed.js
```

Abra no navegador:

- Site (frontend): **http://localhost:8080/**
- Área da Loja / BI: **http://localhost:8080/login** (senha padrão: `credmoveis`)
- API health: **http://localhost:3000/api/health**

### Comandos úteis

```bash
docker compose logs -f          # logs
docker compose ps               # status
docker compose down             # para os containers
docker compose down -v          # para e apaga o volume do banco
```

### Variáveis (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `POSTGRES_USER` | `posvenda` | Usuário do banco |
| `POSTGRES_PASSWORD` | `posvenda` | Senha do banco |
| `POSTGRES_DB` | `posvenda` | Nome do banco |
| `FRONTEND_PORT` | `8080` | Porta do nginx no host |
| `BACKEND_PORT` | `3000` | Porta da API no host |
| `ADMIN_PASSWORD` | `credmoveis` | Senha do painel |
| `SESSION_SECRET` | (exemplo) | Segredo do cookie de sessão |

---

## 💻 Desenvolvimento local (sem Docker full stack)

1. Suba só o Postgres (Docker ou local):

```bash
docker compose up -d db
```

2. Configure a URL do banco e rode a API (que também pode servir o front estático):

```bash
# Windows PowerShell
$env:DATABASE_URL="postgres://posvenda:posvenda@localhost:5432/posvenda"
$env:SERVE_STATIC="true"
npm install
npm run seed   # opcional
npm start
```

Acesse **http://localhost:3000/**.

---

## 🌐 Publicar front no GitHub Pages

O GitHub Pages serve apenas arquivos estáticos. Neste projeto, ele publica a pasta `public/` como front, mas a API Express e o PostgreSQL precisam continuar hospedados em outro lugar para envio de avaliações, login, BI, QR Code e exportação CSV funcionarem.

O deploy foi configurado com GitHub Actions em `.github/workflows/pages.yml`. Ele roda:

```bash
npm run build:pages
```

e publica somente a saída `dist/`, gerada a partir de `public/`. Isso evita expor código de backend, banco, `.env`, `data/` ou `node_modules`.

Passos seguros:

1. Suba estas alterações para o repositório.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **GitHub Actions**.
4. Aguarde o workflow **Deploy GitHub Pages** terminar.

Para o repositório `NathanaelSantos/posvenda`, o endereço padrão tende a ser:

```text
https://nathanaelsantos.github.io/posvenda/
```

Se a API estiver hospedada fora do Pages, preencha `apiBaseUrl` em `public/js/site-settings.js`, por exemplo:

```js
window.POSVENDA_CONFIG = {
  apiBaseUrl: 'https://sua-api.exemplo.com',
};
```

No backend, libere apenas a origem do Pages:

```env
ALLOWED_ORIGINS=https://nathanaelsantos.github.io
CROSS_SITE_COOKIES=true
```

Use `CROSS_SITE_COOKIES=true` somente com backend em HTTPS, pois cookies `SameSite=None` precisam ser seguros.

### Usar Google Sheets no lugar da API

Se quiser gravar as avaliaÃ§Ãµes direto em uma planilha e tambÃ©m usar a Ãrea da Loja / BI, publique o Google Apps Script de `docs/google-apps-script.js` como Web App e cole a URL `/exec` em `public/js/site-settings.js`:

```js
window.POSVENDA_CONFIG = {
  apiBaseUrl: '',
  sheetsEndpoint: 'https://script.google.com/macros/s/SEU_ID/exec',
  lojaConfig: {
    // marca, lojas, vendedores e criterios usados pelo front estatico
  },
};
```

Nesse modo, a pÃ¡gina de avaliaÃ§Ã£o, login, Ãrea da Loja, BI e configuraÃ§Ãµes funcionam no GitHub Pages sem VPS.

Use estes cabeÃ§alhos na planilha:

```text
id | criadoEm | loja | vendedor | satisfacao | notaVendedor | notaLoja | nps | criterios | feedback | nome | telefone
```

No Apps Script, salve o `id` na primeira coluna:

```js
sheet.appendRow([
  body.id || Utilities.getUuid(),
  new Date(),
  body.loja || '',
  body.vendedor || '',
  body.satisfacao || '',
  body.notaVendedor || '',
  body.notaLoja || '',
  body.nps || '',
  JSON.stringify(body.criterios || {}),
  body.feedback || '',
  body.nome || '',
  body.telefone || '',
]);
```

Para habilitar o painel:

1. Abra a planilha no Google Sheets.
2. Acesse **ExtensÃµes -> Apps Script**.
3. Substitua o cÃ³digo pelo conteÃºdo de `docs/google-apps-script.js`.
4. Ajuste `ADMIN_SECRET` no topo do script se quiser trocar a senha do painel.
5. Clique em **Implantar -> Gerenciar implantaÃ§Ãµes -> Editar**.
6. Crie uma nova versÃ£o e mantenha:

```text
Executar como: Eu
Quem tem acesso: Qualquer pessoa
```

Depois disso, o login, a Ãrea da Loja, o BI, exportaÃ§Ã£o CSV e configuraÃ§Ã£o de lojas/vendedores passam a usar a planilha.

---

## 🗄️ Modelo de dados (PostgreSQL)

Script de criação: `db/init.sql` (aplicado na primeira subida do container `db`).

### `avaliacoes`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | PK |
| `criado_em` | TIMESTAMPTZ | Data/hora |
| `loja` | VARCHAR | Unidade |
| `vendedor` | VARCHAR | Nome do vendedor |
| `satisfacao` | SMALLINT 1–5 | Satisfação geral |
| `nota_vendedor` | SMALLINT 1–5 | |
| `nota_loja` | SMALLINT 1–5 | |
| `nps` | SMALLINT 0–10 | |
| `criterios` | JSONB | Notas por critério |
| `feedback` | TEXT | Comentário |
| `cliente_nome` / `cliente_telefone` | VARCHAR | Opcionais |

### `app_config`

Uma linha (`id = 1`) com JSONB: marca, lojas, vendedores, critérios e segredos.

---

## 📁 Estrutura

```
pos-venda-web/
├── docker-compose.yml     # front + back + db
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf             # estáticos + proxy /api → backend
├── db/init.sql            # schema PostgreSQL
├── server.js              # API Express
├── src/
│   ├── db.js              # pool pg
│   ├── store.js           # avaliações (PostgreSQL)
│   ├── config.js          # config (PostgreSQL)
│   ├── bi.js              # agregações do painel
│   └── auth.js            # sessão por cookie
├── public/                # front estático (nginx)
│   ├── index.html, login.html, bi.html, loja.html, qrcode.html
│   ├── css/  js/  img/
├── scripts/seed.js
└── .env.example
```

---

## 🔐 Segurança

- Troque `ADMIN_PASSWORD` e `SESSION_SECRET` antes de usar em produção.
- O cookie de sessão é `httpOnly` + `SameSite=Lax`.
- Em produção, coloque HTTPS na frente (reverse proxy / load balancer).

---

## 📱 Fluxo na loja

1. `docker compose up --build -d`
2. Entre em `/login` → Área da Loja
3. Gere o **QR Code** com o link público (ex.: `http://SEU_IP:8080/`)
4. Cliente avalia → dados gravam no **PostgreSQL**
5. Painel de **BI** consome os dados do banco via `/api/bi`

---

*Feito para a Cred Móveis Itabaiana · Móveis que fazem do seu lar um lugar melhor.*
