/* Catálogo inicial da Casa Lapela.
   Usado pelo modo demonstração e para gerar supabase/seed.sql. */
(typeof window !== 'undefined' ? window : globalThis).LAPELA_SEED = {
  categories: [
    { slug: 'ternos', name: 'Ternos', sort: 1 },
    { slug: 'gravatas', name: 'Gravatas', sort: 2 },
    { slug: 'acessorios', name: 'Acessórios', sort: 3 }
  ],
  coupons: [
    { code: 'BEMVINDO10', percent_off: 10 },
    { code: 'NOIVOS15', percent_off: 15 }
  ],
  products: [
    {
      slug: 'terno-slim-marinho', name: 'Terno Slim Azul-Marinho', category: 'ternos', price: 1890, featured: true,
      fabric: 'Lã fria Super 120s · 260 g/m²',
      description: 'Corte slim com ombro natural e lapela entalhada de 8 cm. O azul-marinho que vai do escritório ao casamento sem mudar de tom.',
      details: { 'Composição': '100% lã fria Super 120s', 'Gramatura': '260 g/m²', 'Caimento': 'Slim', 'Lapela': 'Entalhada, 8 cm', 'Forro': 'Meio-forro em viscose', 'Calça': 'Sem pregas, barra a fazer' },
      art: { kind: 'suit', color: '#1E2A47', pattern: 'plain', lapel: 'notch', tie: '#7A1F2B', tiePattern: 'solid', square: true },
      sizes: { 46: 4, 48: 8, 50: 10, 52: 7, 54: 3, 56: 2 }
    },
    {
      slug: 'terno-risca-giz-chumbo', name: 'Terno Risca de Giz Cinza-Chumbo', category: 'ternos', price: 2290, featured: true,
      fabric: 'Lã Super 130s · 280 g/m²',
      description: 'Risca de giz espaçada em 1,2 cm sobre cinza-chumbo, lapela pontiaguda e dois botões. Presença de reunião de diretoria.',
      details: { 'Composição': '100% lã Super 130s', 'Gramatura': '280 g/m²', 'Caimento': 'Slim', 'Lapela': 'Pontiaguda (peak), 9 cm', 'Forro': 'Forro inteiro em cupro', 'Calça': 'Sem pregas, barra a fazer' },
      art: { kind: 'suit', color: '#3A3E46', pattern: 'pin', lapel: 'peak', tie: '#1E2A47', tiePattern: 'dots', accent: '#D9DCE2' },
      sizes: { 46: 2, 48: 5, 50: 6, 52: 4, 54: 2, 56: 0 }
    },
    {
      slug: 'terno-preto-classico', name: 'Terno Preto Clássico', category: 'ternos', price: 1690,
      fabric: 'Lã com poliéster · 240 g/m²',
      description: 'Preto de corte tradicional, confortável para longas jornadas. A mistura de fibras amassa pouco na mala.',
      details: { 'Composição': '55% poliéster, 45% lã', 'Gramatura': '240 g/m²', 'Caimento': 'Tradicional', 'Lapela': 'Entalhada, 8,5 cm', 'Forro': 'Forro inteiro em viscose', 'Calça': 'Uma prega, barra a fazer' },
      art: { kind: 'suit', color: '#17181C', pattern: 'plain', lapel: 'notch', tie: '#5D6470', tiePattern: 'stripes', accent: '#9AA1AD' },
      sizes: { 46: 5, 48: 9, 50: 12, 52: 9, 54: 6, 56: 4 }
    },
    {
      slug: 'terno-principe-de-gales', name: 'Terno Príncipe de Gales Cinza', category: 'ternos', price: 2490, compare_at_price: 2790, featured: true,
      fabric: 'Lã Super 110s · 290 g/m²',
      description: 'O xadrez Príncipe de Gales em cinza-claro, com fio azul discreto no padrão. Para quem já tem o marinho e o chumbo no armário.',
      details: { 'Composição': '100% lã Super 110s', 'Gramatura': '290 g/m²', 'Caimento': 'Regular', 'Lapela': 'Entalhada, 9 cm', 'Forro': 'Forro inteiro em cupro', 'Calça': 'Sem pregas, barra a fazer' },
      art: { kind: 'suit', color: '#8E939C', pattern: 'check', lapel: 'notch', tie: '#3E5240', tiePattern: 'knit' },
      sizes: { 46: 1, 48: 3, 50: 4, 52: 3, 54: 1, 56: 1 }
    },
    {
      slug: 'terno-linho-areia', name: 'Terno de Linho Areia', category: 'ternos', price: 1990,
      fabric: 'Linho com algodão · 220 g/m²',
      description: 'Tecido leve e respirável para casamento ao ar livre e verão brasileiro. Sem forro, com costuras internas debruadas.',
      details: { 'Composição': '70% linho, 30% algodão', 'Gramatura': '220 g/m²', 'Caimento': 'Regular', 'Lapela': 'Entalhada, 8 cm', 'Forro': 'Sem forro, costuras debruadas', 'Calça': 'Sem pregas, barra a fazer' },
      art: { kind: 'suit', color: '#C7B28C', pattern: 'linen', lapel: 'notch', tie: '#2F4E78', tiePattern: 'stripes', accent: '#E9E2D2', square: true },
      sizes: { 46: 3, 48: 6, 50: 7, 52: 5, 54: 2, 56: 1 }
    },
    {
      slug: 'smoking-preto-lapela-xale', name: 'Smoking Preto Lapela Xale', category: 'ternos', price: 2890, featured: true,
      fabric: 'Lã Super 120s com cetim · 270 g/m²',
      description: 'Lapela xale em cetim de seda, um botão forrado e faixa de cetim na lateral da calça. Para black tie.',
      details: { 'Composição': '100% lã Super 120s; lapela em cetim de seda', 'Gramatura': '270 g/m²', 'Caimento': 'Slim', 'Lapela': 'Xale em cetim', 'Forro': 'Forro inteiro em cupro', 'Calça': 'Faixa lateral em cetim' },
      art: { kind: 'suit', color: '#121318', pattern: 'plain', lapel: 'shawl', tie: '#0B0B0E', tieKind: 'bow', square: true },
      sizes: { 46: 2, 48: 3, 50: 4, 52: 3, 54: 2, 56: 1 }
    },
    {
      slug: 'gravata-seda-bordo', name: 'Gravata de Seda Bordô', category: 'gravatas', price: 189, featured: true,
      fabric: 'Seda pura · 7 cm',
      description: 'Bordô liso em sarja de seda, entretela de lã para um nó firme. Combina com marinho, cinza e preto.',
      details: { 'Composição': '100% seda', 'Largura': '7 cm', 'Comprimento': '148 cm', 'Acabamento': 'Costura à mão' },
      art: { kind: 'tie', color: '#7A1F2B', pattern: 'solid' },
      sizes: { 'Único': 25 }
    },
    {
      slug: 'gravata-poa-marinho', name: 'Gravata Poá Azul-Marinho', category: 'gravatas', price: 169,
      fabric: 'Seda pura · 7 cm',
      description: 'Poá branco miúdo sobre marinho. A estampa mais versátil do guarda-roupa formal.',
      details: { 'Composição': '100% seda', 'Largura': '7 cm', 'Comprimento': '148 cm', 'Acabamento': 'Costura à mão' },
      art: { kind: 'tie', color: '#1E2A47', pattern: 'dots', accent: '#E8E4DA' },
      sizes: { 'Único': 30 }
    },
    {
      slug: 'gravata-listrada-regimental', name: 'Gravata Listrada Regimental', category: 'gravatas', price: 179,
      fabric: 'Seda jacquard · 7,5 cm',
      description: 'Listras diagonais em marinho e dourado, no padrão das gravatas de clube inglesas.',
      details: { 'Composição': '100% seda jacquard', 'Largura': '7,5 cm', 'Comprimento': '148 cm', 'Acabamento': 'Costura à mão' },
      art: { kind: 'tie', color: '#1E2A47', pattern: 'stripes', accent: '#B8913E' },
      sizes: { 'Único': 18 }
    },
    {
      slug: 'gravata-trico-verde-musgo', name: 'Gravata de Tricô Verde-Musgo', category: 'gravatas', price: 199, featured: true,
      fabric: 'Seda em tricô · 6 cm',
      description: 'Ponta reta e textura de tricô. Deixa o terno mais descontraído sem perder a formalidade.',
      details: { 'Composição': '100% seda em tricô', 'Largura': '6 cm', 'Comprimento': '145 cm', 'Ponta': 'Reta' },
      art: { kind: 'tie', color: '#4A5A3A', pattern: 'knit' },
      sizes: { 'Único': 12 }
    },
    {
      slug: 'gravata-paisley-vinho', name: 'Gravata Paisley Vinho e Azul', category: 'gravatas', price: 219, compare_at_price: 249,
      fabric: 'Seda estampada · 7 cm',
      description: 'Paisley em azul-claro sobre fundo vinho. Para quem quer uma gravata que seja lembrada.',
      details: { 'Composição': '100% seda estampada', 'Largura': '7 cm', 'Comprimento': '148 cm', 'Acabamento': 'Costura à mão' },
      art: { kind: 'tie', color: '#4B2338', pattern: 'paisley', accent: '#8FB0D2' },
      sizes: { 'Único': 9 }
    },
    {
      slug: 'gravata-borboleta-cetim-preta', name: 'Gravata-Borboleta de Cetim Preta', category: 'gravatas', price: 149,
      fabric: 'Cetim de seda · regulável',
      description: 'Para dar o laço você mesmo. Acompanha o smoking e qualquer traje black tie.',
      details: { 'Composição': '100% cetim de seda', 'Fecho': 'Regulável, pescoço de 36 a 48 cm', 'Formato': 'Borboleta clássica' },
      art: { kind: 'bow', color: '#141418' },
      sizes: { 'Único': 15 }
    },
    {
      slug: 'lenco-bolso-linho-branco', name: 'Lenço de Bolso Linho Branco', category: 'acessorios', price: 79,
      fabric: 'Linho · 32 × 32 cm',
      description: 'Branco com bainha enrolada à mão. Dobre reto para reuniões ou em pontas para festas.',
      details: { 'Composição': '100% linho', 'Medidas': '32 × 32 cm', 'Bainha': 'Enrolada à mão' },
      art: { kind: 'square', color: '#F1EFEA', accent: '#A7AEB9' },
      sizes: { 'Único': 40 }
    },
    {
      slug: 'lenco-bolso-seda-petroleo', name: 'Lenço de Bolso Seda Azul-Petróleo', category: 'acessorios', price: 99,
      fabric: 'Seda · 33 × 33 cm',
      description: 'Azul-petróleo com borda dourada. Fica bem com cinza e com linho.',
      details: { 'Composição': '100% seda', 'Medidas': '33 × 33 cm', 'Bainha': 'Enrolada à mão' },
      art: { kind: 'square', color: '#1F4E5A', accent: '#D8C48F' },
      sizes: { 'Único': 22 }
    },
    {
      slug: 'abotoaduras-prata-925', name: 'Abotoaduras Prata 925 Lisas', category: 'acessorios', price: 249, featured: true,
      fabric: 'Prata 925 · 15 mm',
      description: 'Discos lisos de prata 925 com trava giratória. Para camisas de punho duplo.',
      details: { 'Material': 'Prata 925', 'Diâmetro': '15 mm', 'Trava': 'Giratória', 'Acompanha': 'Estojo' },
      art: { kind: 'cufflinks', color: '#C8CCD2' },
      sizes: { 'Único': 10 }
    },
    {
      slug: 'prendedor-gravata-dourado', name: 'Prendedor de Gravata Dourado', category: 'acessorios', price: 129,
      fabric: 'Latão banhado · 5,5 cm',
      description: 'Barra fina escovada. Use entre o terceiro e o quarto botão da camisa.',
      details: { 'Material': 'Latão banhado a ouro', 'Comprimento': '5,5 cm', 'Acabamento': 'Escovado' },
      art: { kind: 'clip', color: '#C9A65E' },
      sizes: { 'Único': 14 }
    }
  ]
};
