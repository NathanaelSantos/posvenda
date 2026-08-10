-- Schema inicial do pós-venda Cred Móveis
-- Executado automaticamente na primeira subida do container PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Avaliações enviadas pelos clientes
CREATE TABLE IF NOT EXISTS avaliacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  loja            VARCHAR(120) NOT NULL,
  vendedor        VARCHAR(120) NOT NULL DEFAULT '',
  satisfacao      SMALLINT CHECK (satisfacao IS NULL OR (satisfacao BETWEEN 1 AND 5)),
  nota_vendedor   SMALLINT CHECK (nota_vendedor IS NULL OR (nota_vendedor BETWEEN 1 AND 5)),
  nota_loja       SMALLINT CHECK (nota_loja IS NULL OR (nota_loja BETWEEN 1 AND 5)),
  nps             SMALLINT CHECK (nps IS NULL OR (nps BETWEEN 0 AND 10)),
  criterios       JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback        TEXT NOT NULL DEFAULT '',
  cliente_nome    VARCHAR(120) NOT NULL DEFAULT '',
  cliente_telefone VARCHAR(40) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_criado_em ON avaliacoes (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_loja ON avaliacoes (loja);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_vendedor ON avaliacoes (vendedor);

-- Configuração da aplicação (uma única linha)
CREATE TABLE IF NOT EXISTS app_config (
  id   SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL
);

INSERT INTO app_config (id, data)
VALUES (
  1,
  '{
    "marca": {
      "nome": "Cred Móveis",
      "cidade": "Itabaiana",
      "slogan": "Móveis que fazem do seu lar um lugar melhor"
    },
    "lojas": ["Itabaiana - Centro", "Itabaiana - Avenida"],
    "vendedores": ["Ana Souza", "Bruno Lima", "Carla Menezes", "Diego Santos"],
    "criterios": [
      { "id": "atendimento", "rotulo": "Atendimento" },
      { "id": "produto", "rotulo": "Qualidade do produto" },
      { "id": "entrega", "rotulo": "Prazo de entrega" },
      { "id": "preco", "rotulo": "Preço e condições" }
    ],
    "adminPassword": "credmoveis",
    "sessionSecret": null
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
