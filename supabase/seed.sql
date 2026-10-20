-- Catálogo inicial da Casa Lapela (gerado por scripts/gerar-seed.js)
begin;

insert into public.categories (slug, name, sort) values ('ternos', 'Ternos', 1) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort) values ('gravatas', 'Gravatas', 2) on conflict (slug) do nothing;
insert into public.categories (slug, name, sort) values ('acessorios', 'Acessórios', 3) on conflict (slug) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'terno-slim-marinho', 'Terno Slim Azul-Marinho', id, 'Corte slim com ombro natural e lapela entalhada de 8 cm. O azul-marinho que vai do escritório ao casamento sem mudar de tom.', 1890, null, 'Lã fria Super 120s · 260 g/m²', '{"Composição":"100% lã fria Super 120s","Gramatura":"260 g/m²","Caimento":"Slim","Lapela":"Entalhada, 8 cm","Forro":"Meio-forro em viscose","Calça":"Sem pregas, barra a fazer"}'::jsonb, '{"kind":"suit","color":"#1E2A47","pattern":"plain","lapel":"notch","tie":"#7A1F2B","tiePattern":"solid","square":true}'::jsonb, true
  from public.categories where slug = 'ternos'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '46', 'TERNO-SLIM-MARINHO-46', 4 from public.products where slug = 'terno-slim-marinho'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '48', 'TERNO-SLIM-MARINHO-48', 8 from public.products where slug = 'terno-slim-marinho'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '50', 'TERNO-SLIM-MARINHO-50', 10 from public.products where slug = 'terno-slim-marinho'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '52', 'TERNO-SLIM-MARINHO-52', 7 from public.products where slug = 'terno-slim-marinho'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '54', 'TERNO-SLIM-MARINHO-54', 3 from public.products where slug = 'terno-slim-marinho'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '56', 'TERNO-SLIM-MARINHO-56', 2 from public.products where slug = 'terno-slim-marinho'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'terno-risca-giz-chumbo', 'Terno Risca de Giz Cinza-Chumbo', id, 'Risca de giz espaçada em 1,2 cm sobre cinza-chumbo, lapela pontiaguda e dois botões. Presença de reunião de diretoria.', 2290, null, 'Lã Super 130s · 280 g/m²', '{"Composição":"100% lã Super 130s","Gramatura":"280 g/m²","Caimento":"Slim","Lapela":"Pontiaguda (peak), 9 cm","Forro":"Forro inteiro em cupro","Calça":"Sem pregas, barra a fazer"}'::jsonb, '{"kind":"suit","color":"#3A3E46","pattern":"pin","lapel":"peak","tie":"#1E2A47","tiePattern":"dots","accent":"#D9DCE2"}'::jsonb, true
  from public.categories where slug = 'ternos'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '46', 'TERNO-RISCA-GIZ-CHUMBO-46', 2 from public.products where slug = 'terno-risca-giz-chumbo'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '48', 'TERNO-RISCA-GIZ-CHUMBO-48', 5 from public.products where slug = 'terno-risca-giz-chumbo'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '50', 'TERNO-RISCA-GIZ-CHUMBO-50', 6 from public.products where slug = 'terno-risca-giz-chumbo'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '52', 'TERNO-RISCA-GIZ-CHUMBO-52', 4 from public.products where slug = 'terno-risca-giz-chumbo'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '54', 'TERNO-RISCA-GIZ-CHUMBO-54', 2 from public.products where slug = 'terno-risca-giz-chumbo'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '56', 'TERNO-RISCA-GIZ-CHUMBO-56', 0 from public.products where slug = 'terno-risca-giz-chumbo'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'terno-preto-classico', 'Terno Preto Clássico', id, 'Preto de corte tradicional, confortável para longas jornadas. A mistura de fibras amassa pouco na mala.', 1690, null, 'Lã com poliéster · 240 g/m²', '{"Composição":"55% poliéster, 45% lã","Gramatura":"240 g/m²","Caimento":"Tradicional","Lapela":"Entalhada, 8,5 cm","Forro":"Forro inteiro em viscose","Calça":"Uma prega, barra a fazer"}'::jsonb, '{"kind":"suit","color":"#17181C","pattern":"plain","lapel":"notch","tie":"#5D6470","tiePattern":"stripes","accent":"#9AA1AD"}'::jsonb, false
  from public.categories where slug = 'ternos'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '46', 'TERNO-PRETO-CLASSICO-46', 5 from public.products where slug = 'terno-preto-classico'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '48', 'TERNO-PRETO-CLASSICO-48', 9 from public.products where slug = 'terno-preto-classico'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '50', 'TERNO-PRETO-CLASSICO-50', 12 from public.products where slug = 'terno-preto-classico'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '52', 'TERNO-PRETO-CLASSICO-52', 9 from public.products where slug = 'terno-preto-classico'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '54', 'TERNO-PRETO-CLASSICO-54', 6 from public.products where slug = 'terno-preto-classico'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '56', 'TERNO-PRETO-CLASSICO-56', 4 from public.products where slug = 'terno-preto-classico'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'terno-principe-de-gales', 'Terno Príncipe de Gales Cinza', id, 'O xadrez Príncipe de Gales em cinza-claro, com fio azul discreto no padrão. Para quem já tem o marinho e o chumbo no armário.', 2490, 2790, 'Lã Super 110s · 290 g/m²', '{"Composição":"100% lã Super 110s","Gramatura":"290 g/m²","Caimento":"Regular","Lapela":"Entalhada, 9 cm","Forro":"Forro inteiro em cupro","Calça":"Sem pregas, barra a fazer"}'::jsonb, '{"kind":"suit","color":"#8E939C","pattern":"check","lapel":"notch","tie":"#3E5240","tiePattern":"knit"}'::jsonb, true
  from public.categories where slug = 'ternos'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '46', 'TERNO-PRINCIPE-DE-GALES-46', 1 from public.products where slug = 'terno-principe-de-gales'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '48', 'TERNO-PRINCIPE-DE-GALES-48', 3 from public.products where slug = 'terno-principe-de-gales'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '50', 'TERNO-PRINCIPE-DE-GALES-50', 4 from public.products where slug = 'terno-principe-de-gales'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '52', 'TERNO-PRINCIPE-DE-GALES-52', 3 from public.products where slug = 'terno-principe-de-gales'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '54', 'TERNO-PRINCIPE-DE-GALES-54', 1 from public.products where slug = 'terno-principe-de-gales'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '56', 'TERNO-PRINCIPE-DE-GALES-56', 1 from public.products where slug = 'terno-principe-de-gales'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'terno-linho-areia', 'Terno de Linho Areia', id, 'Tecido leve e respirável para casamento ao ar livre e verão brasileiro. Sem forro, com costuras internas debruadas.', 1990, null, 'Linho com algodão · 220 g/m²', '{"Composição":"70% linho, 30% algodão","Gramatura":"220 g/m²","Caimento":"Regular","Lapela":"Entalhada, 8 cm","Forro":"Sem forro, costuras debruadas","Calça":"Sem pregas, barra a fazer"}'::jsonb, '{"kind":"suit","color":"#C7B28C","pattern":"linen","lapel":"notch","tie":"#2F4E78","tiePattern":"stripes","accent":"#E9E2D2","square":true}'::jsonb, false
  from public.categories where slug = 'ternos'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '46', 'TERNO-LINHO-AREIA-46', 3 from public.products where slug = 'terno-linho-areia'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '48', 'TERNO-LINHO-AREIA-48', 6 from public.products where slug = 'terno-linho-areia'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '50', 'TERNO-LINHO-AREIA-50', 7 from public.products where slug = 'terno-linho-areia'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '52', 'TERNO-LINHO-AREIA-52', 5 from public.products where slug = 'terno-linho-areia'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '54', 'TERNO-LINHO-AREIA-54', 2 from public.products where slug = 'terno-linho-areia'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '56', 'TERNO-LINHO-AREIA-56', 1 from public.products where slug = 'terno-linho-areia'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'smoking-preto-lapela-xale', 'Smoking Preto Lapela Xale', id, 'Lapela xale em cetim de seda, um botão forrado e faixa de cetim na lateral da calça. Para black tie.', 2890, null, 'Lã Super 120s com cetim · 270 g/m²', '{"Composição":"100% lã Super 120s; lapela em cetim de seda","Gramatura":"270 g/m²","Caimento":"Slim","Lapela":"Xale em cetim","Forro":"Forro inteiro em cupro","Calça":"Faixa lateral em cetim"}'::jsonb, '{"kind":"suit","color":"#121318","pattern":"plain","lapel":"shawl","tie":"#0B0B0E","tieKind":"bow","square":true}'::jsonb, true
  from public.categories where slug = 'ternos'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '46', 'SMOKING-PRETO-LAPELA-XALE-46', 2 from public.products where slug = 'smoking-preto-lapela-xale'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '48', 'SMOKING-PRETO-LAPELA-XALE-48', 3 from public.products where slug = 'smoking-preto-lapela-xale'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '50', 'SMOKING-PRETO-LAPELA-XALE-50', 4 from public.products where slug = 'smoking-preto-lapela-xale'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '52', 'SMOKING-PRETO-LAPELA-XALE-52', 3 from public.products where slug = 'smoking-preto-lapela-xale'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '54', 'SMOKING-PRETO-LAPELA-XALE-54', 2 from public.products where slug = 'smoking-preto-lapela-xale'
on conflict (product_id, size) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, '56', 'SMOKING-PRETO-LAPELA-XALE-56', 1 from public.products where slug = 'smoking-preto-lapela-xale'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'gravata-seda-bordo', 'Gravata de Seda Bordô', id, 'Bordô liso em sarja de seda, entretela de lã para um nó firme. Combina com marinho, cinza e preto.', 189, null, 'Seda pura · 7 cm', '{"Composição":"100% seda","Largura":"7 cm","Comprimento":"148 cm","Acabamento":"Costura à mão"}'::jsonb, '{"kind":"tie","color":"#7A1F2B","pattern":"solid"}'::jsonb, true
  from public.categories where slug = 'gravatas'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'GRAVATA-SEDA-BORDO-U', 25 from public.products where slug = 'gravata-seda-bordo'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'gravata-poa-marinho', 'Gravata Poá Azul-Marinho', id, 'Poá branco miúdo sobre marinho. A estampa mais versátil do guarda-roupa formal.', 169, null, 'Seda pura · 7 cm', '{"Composição":"100% seda","Largura":"7 cm","Comprimento":"148 cm","Acabamento":"Costura à mão"}'::jsonb, '{"kind":"tie","color":"#1E2A47","pattern":"dots","accent":"#E8E4DA"}'::jsonb, false
  from public.categories where slug = 'gravatas'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'GRAVATA-POA-MARINHO-U', 30 from public.products where slug = 'gravata-poa-marinho'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'gravata-listrada-regimental', 'Gravata Listrada Regimental', id, 'Listras diagonais em marinho e dourado, no padrão das gravatas de clube inglesas.', 179, null, 'Seda jacquard · 7,5 cm', '{"Composição":"100% seda jacquard","Largura":"7,5 cm","Comprimento":"148 cm","Acabamento":"Costura à mão"}'::jsonb, '{"kind":"tie","color":"#1E2A47","pattern":"stripes","accent":"#B8913E"}'::jsonb, false
  from public.categories where slug = 'gravatas'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'GRAVATA-LISTRADA-REGIMENTAL-U', 18 from public.products where slug = 'gravata-listrada-regimental'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'gravata-trico-verde-musgo', 'Gravata de Tricô Verde-Musgo', id, 'Ponta reta e textura de tricô. Deixa o terno mais descontraído sem perder a formalidade.', 199, null, 'Seda em tricô · 6 cm', '{"Composição":"100% seda em tricô","Largura":"6 cm","Comprimento":"145 cm","Ponta":"Reta"}'::jsonb, '{"kind":"tie","color":"#4A5A3A","pattern":"knit"}'::jsonb, true
  from public.categories where slug = 'gravatas'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'GRAVATA-TRICO-VERDE-MUSGO-U', 12 from public.products where slug = 'gravata-trico-verde-musgo'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'gravata-paisley-vinho', 'Gravata Paisley Vinho e Azul', id, 'Paisley em azul-claro sobre fundo vinho. Para quem quer uma gravata que seja lembrada.', 219, 249, 'Seda estampada · 7 cm', '{"Composição":"100% seda estampada","Largura":"7 cm","Comprimento":"148 cm","Acabamento":"Costura à mão"}'::jsonb, '{"kind":"tie","color":"#4B2338","pattern":"paisley","accent":"#8FB0D2"}'::jsonb, false
  from public.categories where slug = 'gravatas'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'GRAVATA-PAISLEY-VINHO-U', 9 from public.products where slug = 'gravata-paisley-vinho'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'gravata-borboleta-cetim-preta', 'Gravata-Borboleta de Cetim Preta', id, 'Para dar o laço você mesmo. Acompanha o smoking e qualquer traje black tie.', 149, null, 'Cetim de seda · regulável', '{"Composição":"100% cetim de seda","Fecho":"Regulável, pescoço de 36 a 48 cm","Formato":"Borboleta clássica"}'::jsonb, '{"kind":"bow","color":"#141418"}'::jsonb, false
  from public.categories where slug = 'gravatas'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'GRAVATA-BORBOLETA-CETIM-PRETA-U', 15 from public.products where slug = 'gravata-borboleta-cetim-preta'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'lenco-bolso-linho-branco', 'Lenço de Bolso Linho Branco', id, 'Branco com bainha enrolada à mão. Dobre reto para reuniões ou em pontas para festas.', 79, null, 'Linho · 32 × 32 cm', '{"Composição":"100% linho","Medidas":"32 × 32 cm","Bainha":"Enrolada à mão"}'::jsonb, '{"kind":"square","color":"#F1EFEA","accent":"#A7AEB9"}'::jsonb, false
  from public.categories where slug = 'acessorios'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'LENCO-BOLSO-LINHO-BRANCO-U', 40 from public.products where slug = 'lenco-bolso-linho-branco'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'lenco-bolso-seda-petroleo', 'Lenço de Bolso Seda Azul-Petróleo', id, 'Azul-petróleo com borda dourada. Fica bem com cinza e com linho.', 99, null, 'Seda · 33 × 33 cm', '{"Composição":"100% seda","Medidas":"33 × 33 cm","Bainha":"Enrolada à mão"}'::jsonb, '{"kind":"square","color":"#1F4E5A","accent":"#D8C48F"}'::jsonb, false
  from public.categories where slug = 'acessorios'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'LENCO-BOLSO-SEDA-PETROLEO-U', 22 from public.products where slug = 'lenco-bolso-seda-petroleo'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'abotoaduras-prata-925', 'Abotoaduras Prata 925 Lisas', id, 'Discos lisos de prata 925 com trava giratória. Para camisas de punho duplo.', 249, null, 'Prata 925 · 15 mm', '{"Material":"Prata 925","Diâmetro":"15 mm","Trava":"Giratória","Acompanha":"Estojo"}'::jsonb, '{"kind":"cufflinks","color":"#C8CCD2"}'::jsonb, true
  from public.categories where slug = 'acessorios'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'ABOTOADURAS-PRATA-925-U', 10 from public.products where slug = 'abotoaduras-prata-925'
on conflict (product_id, size) do nothing;

insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select 'prendedor-gravata-dourado', 'Prendedor de Gravata Dourado', id, 'Barra fina escovada. Use entre o terceiro e o quarto botão da camisa.', 129, null, 'Latão banhado · 5,5 cm', '{"Material":"Latão banhado a ouro","Comprimento":"5,5 cm","Acabamento":"Escovado"}'::jsonb, '{"kind":"clip","color":"#C9A65E"}'::jsonb, false
  from public.categories where slug = 'acessorios'
on conflict (slug) do nothing;
insert into public.product_variants (product_id, size, sku, stock)
select id, 'Único', 'PRENDEDOR-GRAVATA-DOURADO-U', 14 from public.products where slug = 'prendedor-gravata-dourado'
on conflict (product_id, size) do nothing;

insert into public.coupons (code, percent_off) values ('BEMVINDO10', 10) on conflict (code) do nothing;
insert into public.coupons (code, percent_off) values ('NOIVOS15', 15) on conflict (code) do nothing;

commit;
