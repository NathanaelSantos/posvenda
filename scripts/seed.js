// Popular o banco com avaliações de exemplo para demonstração do painel de BI.
// Uso:  npm run seed        (adiciona ~50 avaliações fictícias)
//       npm run seed -- 100 (quantidade personalizada)
import { waitForDb } from '../src/db.js';
import { addReview } from '../src/store.js';
import { loadConfig } from '../src/config.js';

const QTD = Number(process.argv[2]) || 50;

const COMENTARIOS_BONS = [
  'Atendimento maravilhoso, super atenciosos!',
  'Móvel de ótima qualidade, chegou no prazo. Recomendo!',
  'A vendedora foi muito paciente e me ajudou a escolher.',
  'Loja linda e organizada, adorei a experiência.',
  'Entrega rápida e montagem impecável. Parabéns!',
  'Preço justo e condições ótimas de pagamento.',
  'Já é a segunda vez que compro, sempre bem atendida.',
  'Equipe nota 10, voltarei com certeza.',
  'Sofá dos sonhos! Superou as expectativas.',
  'Muito satisfeito, indico a todos os amigos.',
];
const COMENTARIOS_MEDIOS = [
  'Bom atendimento, mas a entrega atrasou um pouco.',
  'Produto bom, porém o preço poderia ser melhor.',
  'Gostei, só achei a loja um pouco cheia no dia.',
  'Atendimento ok, esperava um pouco mais de agilidade.',
];
const COMENTARIOS_RUINS = [
  'A entrega atrasou bastante e ninguém avisou.',
  'Tive problema com a montagem, precisou voltar.',
  'Achei o atendimento um pouco corrido.',
];
const NOMES = ['Maria', 'João', 'Fernanda', 'Lucas', 'Patrícia', 'Rafael', 'Juliana', 'Marcos', 'Beatriz', 'André', 'Camila', 'Roberto', ''];

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const inteiro = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const notaAlta = () => (Math.random() < 0.62 ? 5 : Math.random() < 0.7 ? 4 : Math.random() < 0.6 ? 3 : inteiro(1, 2));

async function main() {
  await waitForDb();
  const cfg = await loadConfig();

  let bons = 0, medios = 0, ruins = 0;
  for (let i = 0; i < QTD; i++) {
    const satisfacao = notaAlta();
    const diasAtras = inteiro(0, 44);
    const criadoEm = new Date(Date.now() - diasAtras * 86400000 - inteiro(0, 82800) * 1000);

    let feedback = '';
    if (Math.random() < 0.6) {
      if (satisfacao >= 4) { feedback = rnd(COMENTARIOS_BONS); bons++; }
      else if (satisfacao === 3) { feedback = rnd(COMENTARIOS_MEDIOS); medios++; }
      else { feedback = rnd(COMENTARIOS_RUINS); ruins++; }
    }

    const criterios = {};
    for (const c of cfg.criterios) criterios[c.id] = Math.max(1, Math.min(5, satisfacao + inteiro(-1, 1)));

    await addReview({
      loja: rnd(cfg.lojas),
      vendedor: rnd(cfg.vendedores),
      satisfacao,
      notaVendedor: Math.max(1, Math.min(5, satisfacao + inteiro(-1, 1))),
      notaLoja: Math.max(1, Math.min(5, satisfacao + inteiro(-1, 1))),
      nps: satisfacao >= 5 ? inteiro(9, 10) : satisfacao === 4 ? inteiro(7, 9) : satisfacao === 3 ? inteiro(6, 8) : inteiro(0, 6),
      criterios,
      feedback,
      nome: rnd(NOMES),
      telefone: '',
    }, { criadoEm });
  }

  console.log(`✓ ${QTD} avaliações de exemplo adicionadas no PostgreSQL.`);
  console.log(`  Positivas: ~${bons} · Neutras: ~${medios} · Negativas: ~${ruins}`);
  console.log('  Acesse o painel de BI e use a senha padrão: credmoveis');
  process.exit(0);
}

main().catch((err) => {
  console.error('Falha no seed:', err.message);
  process.exit(1);
});
