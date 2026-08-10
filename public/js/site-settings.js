// Configuracoes publicas do front estatico.
window.POSVENDA_CONFIG = {
  apiBaseUrl: '',
  sheetsEndpoint: 'https://script.google.com/macros/s/AKfycbxx1iq9OQANkudcmTBZkwlNUPU0kpDwuAtDcfTzS1Wf8FwgfLnd3pHZCFHKVVhHsK7X5A/exec',
  lojaConfig: {
    marca: {
      nome: 'Cred Moveis',
      cidade: 'Itabaiana',
      slogan: 'Moveis que fazem do seu lar um lugar melhor',
    },
    lojas: ['Itabaiana - Centro', 'Itabaiana - Avenida'],
    vendedores: ['Ana Souza', 'Bruno Lima', 'Carla Menezes', 'Diego Santos'],
    criterios: [
      { id: 'atendimento', rotulo: 'Atendimento' },
      { id: 'produto', rotulo: 'Qualidade do produto' },
      { id: 'entrega', rotulo: 'Prazo de entrega' },
      { id: 'preco', rotulo: 'Preco e condicoes' },
    ],
  },
};
