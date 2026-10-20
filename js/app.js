/* Casa Lapela — loja de ternos e gravatas (SPA com rotas por #hash) */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const money = v => BRL.format(Number(v) || 0);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateBR = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const bySize = (a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0);
  const firstName = u => ((u && u.full_name) || 'cliente').split(' ')[0];
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const CFG = window.LAPELA_CONFIG || {};
  const STORE = CFG.STORE || {};

  const STATUS = {
    aguardando_pagamento: ['Aguardando pagamento', 'warn'],
    pago: ['Pago', 'ok'],
    em_separacao: ['Em separação', 'info'],
    enviado: ['Enviado', 'info'],
    entregue: ['Entregue', 'ok'],
    cancelado: ['Cancelado', 'bad']
  };
  const PAY = { pix: 'PIX', cartao: 'Cartão de crédito', boleto: 'Boleto' };
  // Paletó | tórax (cm) | calça | cintura (cm) — drop 6
  const SIZE_GUIDE = [[46, 92, 40, 80], [48, 96, 42, 84], [50, 100, 44, 88], [52, 104, 46, 92], [54, 108, 48, 96], [56, 112, 50, 100]];
  const LOOKS = [
    { name: 'Reunião de diretoria', note: 'Risca de giz cinza-chumbo, gravata poá e prendedor dourado. Sério sem ser pesado.', slugs: ['terno-risca-giz-chumbo', 'gravata-poa-marinho', 'prendedor-gravata-dourado'] },
    { name: 'Casamento de dia', note: 'Linho areia, listras regimentais e lenço azul-petróleo. Fresco para cerimônia ao ar livre.', slugs: ['terno-linho-areia', 'gravata-listrada-regimental', 'lenco-bolso-seda-petroleo'] },
    { name: 'Black tie', note: 'Smoking com lapela xale, laço de cetim e abotoaduras de prata.', slugs: ['smoking-preto-lapela-xale', 'gravata-borboleta-cetim-preta', 'abotoaduras-prata-925'] }
  ];
  const PATTERNS = {
    suit: [['plain', 'Liso'], ['pin', 'Risca de giz'], ['check', 'Príncipe de Gales'], ['linen', 'Linho']],
    tie: [['solid', 'Lisa'], ['dots', 'Poá'], ['stripes', 'Listrada'], ['knit', 'Tricô'], ['paisley', 'Paisley']],
    square: [['solid', 'Liso']]
  };
  const kindFor = cat => cat === 'ternos' ? 'suit' : cat === 'gravatas' ? 'tie' : 'square';
  const ICON = {
    tape: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  const S = { products: [], categories: [], user: null, cart: store.get('lapela_cart', []), coupon: null };

  /* ---------- utilidades ---------- */
  function toast(msg, kind) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast' + (kind ? ' ' + kind : ''); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 4500);
  }
  const art = p => p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : LapelaArt.svg(p.art || {}, p.name);
  const catName = slug => (S.categories.find(c => c.slug === slug) || {}).name || '';
  const bySlug = slug => S.products.find(p => p.slug === slug);
  const go = h => { if (location.hash === h) render(); else location.hash = h; };
  const loading = () => `<section class="wrap empty"><p class="muted">Carregando…</p></section>`;
  const notFound = () => `<section class="wrap empty"><p class="eyebrow">Erro 404</p><h1>Página não encontrada</h1><p class="muted">O endereço pode ter mudado ou a peça saiu da coleção.</p><a class="btn" href="#/loja">Ver a loja</a></section>`;
  const fld = (id, label, cls, value, attrs) => `<label class="f ${cls || ''}" for="${id}"><span>${label}</span><input id="${id}" name="${id.replace(/^[a-z]+-/, '')}" value="${esc(value || '')}" ${attrs || ''}></label>`;
  const pill = st => { const [l, k] = STATUS[st] || [st, 'info']; return `<span class="pill ${k}">${l}</span>`; };
  function tape() { let s = ''; for (let i = 0; i <= 60; i++) s += `<span>${i * 5}</span>`; return `<div class="tape" aria-hidden="true">${s}</div>`; }
  const sizeTable = () => `<div class="tbl-wrap"><table class="tbl guide"><thead><tr><th>Paletó</th><th>Tórax</th><th>Calça</th><th>Cintura</th></tr></thead><tbody>${SIZE_GUIDE.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]} cm</td><td>${r[2]}</td><td>${r[3]} cm</td></tr>`).join('')}</tbody></table></div>`;
  function stockText(v) {
    if (!v) return 'Escolha um tamanho.';
    if (v.stock <= 0) return 'Esgotado neste tamanho.';
    if (v.stock <= 3) return `Últimas ${v.stock} ${v.stock === 1 ? 'unidade' : 'unidades'} neste tamanho.`;
    return 'Em estoque. Despacho em até 2 dias úteis.';
  }
  function card(p) {
    const out = p.variants.every(v => v.stock <= 0);
    const off = p.compare_at_price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
    const sizes = p.variants.length > 1 ? `<div class="card-sizes">${p.variants.map(v => `<span class="${v.stock <= 0 ? 'off' : ''}">${esc(v.size)}</span>`).join('')}</div>` : '';
    return `<a class="card" href="#/p/${esc(p.slug)}">
      <div class="card-art">${art(p)}${off ? `<span class="tag">−${off}%</span>` : ''}${out ? '<span class="tag tag-out">Esgotado</span>' : ''}${sizes}</div>
      <div class="card-body"><p class="mono">${esc(catName(p.category))}</p><h3>${esc(p.name)}</h3>
      <p class="price">${p.compare_at_price ? `<s>${money(p.compare_at_price)}</s>` : ''}${money(p.price)}</p></div></a>`;
  }

  /* ---------- sacola ---------- */
  function saveCart() { store.set('lapela_cart', S.cart); renderCartBadge(); }
  function cartLines() {
    return S.cart.map(c => {
      const p = S.products.find(p => p.id === c.product_id), v = p && p.variants.find(v => v.id === c.variant_id);
      return p && v ? { ...c, p, v } : null;
    }).filter(Boolean);
  }
  const cartSubtotal = () => cartLines().reduce((s, l) => s + l.p.price * l.qty, 0);
  function totals(sub, pct) {
    const discount = Math.round(sub * (pct || 0)) / 100;
    const shipping = sub === 0 || sub >= DB.FREE_SHIP ? 0 : DB.SHIP_COST;
    return { subtotal: sub, discount, shipping, total: Math.max(0, sub - discount + shipping) };
  }
  function canAdd(v, qty) {
    const ex = S.cart.find(c => c.variant_id === v.id), cur = ex ? ex.qty : 0;
    if (cur + qty > v.stock) return `Temos só ${v.stock} em estoque nesse tamanho${cur ? ` e ${cur} já estão na sacola` : ''}.`;
    if (cur + qty > 10) return 'O limite é de 10 unidades por item.';
    return '';
  }
  function addToCart(p, v, qty) {
    const err = canAdd(v, qty);
    if (err) { toast(err, 'bad'); return false; }
    const ex = S.cart.find(c => c.variant_id === v.id);
    if (ex) ex.qty += qty; else S.cart.push({ variant_id: v.id, product_id: p.id, qty });
    saveCart(); return true;
  }
  function renderCartBadge() { const n = S.cart.reduce((s, c) => s + c.qty, 0), b = $('#cart-count'); b.textContent = n; b.hidden = !n; }
  function openCart() { renderCart(); $('#cart').hidden = false; document.body.classList.add('locked'); $('#cart-close').focus(); }
  function closeCart() { $('#cart').hidden = true; document.body.classList.remove('locked'); }
  function renderCart() {
    const lines = cartLines(), sub = cartSubtotal(), box = $('#cart-body');
    if (!lines.length) { box.innerHTML = `<div class="empty small-empty"><p>Sua sacola está vazia.</p><a class="btn ghost" href="#/loja" data-close>Explorar a loja</a></div>`; return; }
    const left = Math.max(0, DB.FREE_SHIP - sub);
    box.innerHTML = `
      <div class="ship-note"><p>${left ? `Faltam <b>${money(left)}</b> para o frete grátis.` : 'Seu pedido tem <b>frete grátis</b>.'}</p>
      <div class="ship-bar"><i style="width:${Math.min(100, sub / DB.FREE_SHIP * 100)}%"></i></div></div>
      <div class="cart-items">${lines.map(l => `
        <div class="line">
          <a class="line-art" href="#/p/${esc(l.p.slug)}" data-close>${art(l.p)}</a>
          <div class="line-mid"><a href="#/p/${esc(l.p.slug)}" data-close class="line-name">${esc(l.p.name)}</a>
            <p class="mono">Tam. ${esc(l.v.size)} · ${money(l.p.price)}</p>
            <div class="qty sm"><button type="button" data-dec="${esc(l.variant_id)}" aria-label="Diminuir quantidade">−</button><span>${l.qty}</span><button type="button" data-inc="${esc(l.variant_id)}" aria-label="Aumentar quantidade">+</button></div></div>
          <div class="line-end"><b class="price">${money(l.p.price * l.qty)}</b><button type="button" class="link" data-rm="${esc(l.variant_id)}">Remover</button></div>
        </div>`).join('')}</div>
      <div class="cart-foot"><div class="sum-row total"><span>Subtotal</span><span>${money(sub)}</span></div>
      <p class="muted small">Frete e cupom calculados no próximo passo.</p>
      <a class="btn wide" href="#/checkout" data-close>Finalizar compra</a></div>`;
  }
  function bindCart() {
    const el = $('#cart');
    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('[data-close]') || e.target.closest('#cart-close')) { closeCart(); return; }
      const b = e.target.closest('[data-inc],[data-dec],[data-rm]');
      if (!b) return;
      const id = b.dataset.inc || b.dataset.dec || b.dataset.rm, item = S.cart.find(c => c.variant_id === id);
      if (!item) return;
      if (b.dataset.rm) S.cart = S.cart.filter(c => c !== item);
      else if (b.dataset.dec) { item.qty -= 1; if (item.qty < 1) S.cart = S.cart.filter(c => c !== item); }
      else { const l = cartLines().find(l => l.variant_id === id), err = l && canAdd(l.v, 1); if (err) { toast(err, 'bad'); return; } item.qty += 1; }
      saveCart(); renderCart();
    });
    $('#cart-btn').addEventListener('click', openCart);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#cart').hidden) closeCart(); });
  }

  /* ---------- início ---------- */
  function lookCard(look) {
    const items = look.slugs.map(bySlug).filter(Boolean);
    if (items.length < 2) return '';
    const suit = items.find(p => p.category === 'ternos');
    const total = items.reduce((s, p) => s + p.price, 0);
    const sizes = suit ? suit.variants.filter(v => v.stock > 0) : [];
    return `<article class="look" data-look="${esc(look.name)}">
      <div class="look-art"><a class="look-main" href="#/p/${esc(items[0].slug)}">${art(items[0])}</a>
        <div class="look-side">${items.slice(1).map(p => `<a href="#/p/${esc(p.slug)}">${art(p)}</a>`).join('')}</div></div>
      <div class="look-body">
        <h3>${esc(look.name)}</h3><p class="muted">${esc(look.note)}</p>
        <ul class="look-list">${items.map(p => `<li><a href="#/p/${esc(p.slug)}">${esc(p.name)}</a><span>${money(p.price)}</span></li>`).join('')}</ul>
        <div class="look-buy">
          ${suit ? `<label class="f"><span>Tamanho do paletó</span><select data-look-size aria-label="Tamanho do paletó">${sizes.length ? sizes.map(v => `<option value="${esc(v.id)}">${esc(v.size)}</option>`).join('') : '<option value="">Esgotado</option>'}</select></label>` : ''}
          <button class="btn" type="button" data-add-look ${suit && !sizes.length ? 'disabled' : ''}>Levar o look · ${money(total)}</button>
        </div>
      </div></article>`;
  }
  function bindLooks(root) {
    $$('[data-add-look]', root).forEach(b => b.addEventListener('click', () => {
      const el = b.closest('.look'), look = LOOKS.find(l => l.name === el.dataset.look);
      const items = look.slugs.map(bySlug).filter(Boolean), sel = $('[data-look-size]', el);
      const picks = items.map(p => ({ p, v: p.category === 'ternos' ? p.variants.find(v => v.id === (sel && sel.value)) : p.variants.find(v => v.stock > 0) }));
      const bad = picks.find(x => !x.v || canAdd(x.v, 1));
      if (bad) { toast(`${bad.p.name}: ${bad.v ? canAdd(bad.v, 1) : 'esgotado.'}`, 'bad'); return; }
      picks.forEach(x => addToCart(x.p, x.v, 1));
      toast(`Look "${look.name}" adicionado à sacola.`); openCart();
    }));
  }
  function viewHome(v) {
    const feat = S.products.filter(p => p.featured).slice(0, 8);
    const hero = bySlug('terno-slim-marinho') || S.products.find(p => p.category === 'ternos');
    const heroTie = bySlug('gravata-seda-bordo') || S.products.find(p => p.category === 'gravatas');
    const heroAcc = bySlug('abotoaduras-prata-925') || S.products.find(p => p.category === 'acessorios');
    v.innerHTML = `
      <section class="hero"><div class="wrap hero-in">
        <div class="hero-copy">
          <p class="eyebrow">Alfaiataria pronta para vestir</p>
          <h1>O terno certo começa <em>na medida.</em></h1>
          <p class="lede">Ternos em lã fria e linho, gravatas de seda pura e acessórios para fechar o visual. Você escolhe o tamanho, a gente ajusta barra e manga sem custo.</p>
          <div class="row"><a class="btn on-ink" href="#/loja?cat=ternos">Ver ternos ${ICON.arrow}</a><a class="btn ghost on-ink" href="#/looks">Looks prontos</a></div>
        </div>
        <div class="hero-board" aria-hidden="true">
          ${hero ? `<a class="hb-main" href="#/p/${esc(hero.slug)}" tabindex="-1">${art(hero)}</a>` : ''}
          ${heroTie ? `<a class="hb-tie" href="#/p/${esc(heroTie.slug)}" tabindex="-1">${art(heroTie)}</a>` : ''}
          ${heroAcc ? `<a class="hb-acc" href="#/p/${esc(heroAcc.slug)}" tabindex="-1">${art(heroAcc)}</a>` : ''}
          <span class="hb-note">tórax 100 · manga 64 · tam. 50</span>
        </div>
      </div>${tape()}</section>
      <section class="perks"><div class="wrap perks-in">
        <div class="perk">${ICON.tape}<div><b>Ajuste incluso</b><span>Barra e manga sob medida</span></div></div>
        <div class="perk">${ICON.truck}<div><b>Frete grátis</b><span>Acima de ${money(DB.FREE_SHIP)}</span></div></div>
        <div class="perk">${ICON.card}<div><b>10x sem juros</b><span>Ou PIX e boleto</span></div></div>
        <div class="perk">${ICON.swap}<div><b>Troca em 30 dias</b><span>Primeira troca sem custo</span></div></div>
      </div></section>
      <section class="wrap section cats">${S.categories.map(c => {
        const p = S.products.find(p => p.category === c.slug && p.featured) || S.products.find(p => p.category === c.slug);
        const n = S.products.filter(p => p.category === c.slug).length;
        return `<a class="cat cat-${esc(c.slug)}" href="#/loja?cat=${esc(c.slug)}"><div class="cat-art">${p ? art(p) : ''}</div><div class="cat-body"><h2>${esc(c.name)}</h2><span class="mono">${n} ${n === 1 ? 'peça' : 'peças'}</span><span class="cat-go">Ver ${esc(c.name.toLowerCase())} ${ICON.arrow}</span></div></a>`;
      }).join('')}</section>
      <section class="wrap section">
        <div class="sec-head"><div><p class="eyebrow">Mais vendidos</p><h2>Destaques da casa</h2></div><a class="more" href="#/loja">Ver todas as peças ${ICON.arrow}</a></div>
        <div class="grid">${feat.map(card).join('')}</div>
      </section>
      <section class="looks-band"><div class="wrap section">
        <div class="sec-head"><div><p class="eyebrow">Looks prontos</p><h2>Terno, gravata e acessório que já conversam</h2></div><a class="more" href="#/looks">Ver todos ${ICON.arrow}</a></div>
        <div class="looks">${LOOKS.slice(0, 2).map(lookCard).join('')}</div>
      </div></section>
      <section class="wrap section guide-sec">
        <div class="guide-copy"><p class="eyebrow">Guia de medidas</p><h2>Ache seu tamanho em um minuto</h2>
          <ol class="steps"><li><span><b>Meça o tórax</b> na altura das axilas, com a fita rente ao corpo, sem apertar.</span></li>
          <li><span><b>Divida por dois.</b> 100 cm de tórax veste paletó 50.</span></li>
          <li><span><b>A calça vem seis números abaixo</b> (drop 6). Entre dois tamanhos, fique com o maior: o ajuste é por nossa conta.</span></li></ol></div>
        ${sizeTable()}
      </section>
      <section class="news"><div class="wrap news-in">
        <div><h2>Novidades e cupons por e-mail</h2><p class="muted">Lançamentos e promoções, sem excesso de mensagens.</p></div>
        <form id="news-form" class="news-form" novalidate><input id="news-email" type="email" autocomplete="email" placeholder="seu@email.com" aria-label="Seu e-mail" required><button class="btn" type="submit">Assinar</button></form>
      </div></section>`;
    bindLooks(v);
    $('#news-form').addEventListener('submit', async e => {
      e.preventDefault();
      const i = $('#news-email');
      if (!/^\S+@\S+\.\S+$/.test(i.value.trim())) { toast('Digite um e-mail válido.', 'bad'); i.focus(); return; }
      try { await DB.subscribe(i.value.trim()); i.value = ''; toast('Inscrição feita. Obrigado!'); } catch (err) { toast(err.message, 'bad'); }
    });
  }

  function viewLooks(v) {
    v.innerHTML = `<section class="wrap section"><div class="sec-head"><div><p class="eyebrow">Looks prontos</p><h1>Combinações da casa</h1><p class="muted lede-sm">Escolha o tamanho do paletó e leve as três peças de uma vez.</p></div></div>
      <div class="looks looks-page">${LOOKS.map(lookCard).join('')}</div></section>`;
    bindLooks(v);
  }

  function viewShop(v, q) {
    const cat = q.get('cat') || '', term0 = q.get('q') || '';
    v.innerHTML = `<section class="shop-head"><div class="wrap"><p class="eyebrow">Loja</p><h1>${term0 ? `Busca: “${esc(term0)}”` : cat ? esc(catName(cat)) : 'Todas as peças'}</h1></div></section>
      <section class="wrap section shop">
      <div class="filters">
        <div class="chips">${[['', 'Todas'], ...S.categories.map(c => [c.slug, c.name])].map(([s, n]) => `<a class="chip ${s === cat && !term0 ? 'on' : ''}" href="#/loja${s ? '?cat=' + s : ''}">${esc(n)}</a>`).join('')}</div>
        <div class="filter-tools"><span class="mono" id="shop-count"></span>
        <input id="f-q" type="search" placeholder="Filtrar" aria-label="Filtrar peças" value="${esc(term0)}">
        <select id="f-sort" aria-label="Ordenar"><option value="rel">Destaques</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option><option value="new">Novidades</option></select></div>
      </div>
      <div class="grid" id="shop-grid"></div></section>`;
    const apply = () => {
      const term = $('#f-q').value.trim(), sort = $('#f-sort').value;
      let list = S.products.filter(p => (!cat || p.category === cat) && (!term || norm(`${p.name} ${p.fabric} ${p.description} ${catName(p.category)}`).includes(norm(term))));
      if (sort === 'asc') list.sort((a, b) => a.price - b.price);
      else if (sort === 'desc') list.sort((a, b) => b.price - a.price);
      else if (sort === 'new') list.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      $('#shop-grid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty small-empty grid-empty"><p>Nenhuma peça encontrada para “${esc(term)}”.</p><a class="btn ghost" href="#/loja">Ver todas</a></div>`;
      $('#shop-count').textContent = `${list.length} ${list.length === 1 ? 'peça' : 'peças'}`;
    };
    $('#f-q').addEventListener('input', apply);
    $('#f-sort').addEventListener('change', apply);
    apply();
  }

  function viewProduct(v, slug) {
    const p = bySlug(slug);
    if (!p) { v.innerHTML = notFound(); return; }
    const vars = p.variants, isSuit = p.category === 'ternos', single = vars.length === 1, soldOut = vars.every(x => x.stock <= 0);
    const look = LOOKS.find(l => l.slugs.includes(p.slug));
    const related = S.products.filter(x => x.category !== p.category && !(look && look.slugs.includes(x.slug))).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 4);
    v.innerHTML = `
      <section class="wrap pdp">
        <div class="pdp-art">${art(p)}</div>
        <div class="pdp-info">
          <nav class="crumbs" aria-label="Caminho"><a href="#/">Início</a> / <a href="#/loja?cat=${esc(p.category)}">${esc(catName(p.category))}</a></nav>
          <div class="pdp-title"><h1>${esc(p.name)}</h1><p class="mono">${esc(p.fabric)}</p></div>
          <div class="pdp-price"><p class="price big">${p.compare_at_price ? `<s>${money(p.compare_at_price)}</s>` : ''}${money(p.price)}</p><p class="muted small">ou 10x de ${money(p.price / 10)} sem juros${p.price >= DB.FREE_SHIP ? ' · frete grátis' : ''}</p></div>
          <p class="pdp-desc">${esc(p.description)}</p>
          <fieldset class="sizes"><legend><span>${single ? 'Tamanho único' : 'Tamanho do paletó'}</span>${isSuit ? '<button type="button" class="link" id="open-guide">Guia de medidas</button>' : ''}</legend>
            <div class="size-grid">${vars.map(x => `<label class="size ${x.stock <= 0 ? 'off' : ''}"><input type="radio" name="size" value="${esc(x.id)}" ${x.stock <= 0 ? 'disabled' : ''} ${single && x.stock > 0 ? 'checked' : ''}><span>${esc(x.size)}</span></label>`).join('')}</div>
            <p class="mono" id="stock-note" aria-live="polite">${single ? stockText(vars[0]) : 'Escolha um tamanho.'}</p></fieldset>
          <div class="buy-row">
            <div class="qty"><button type="button" data-q="-1" aria-label="Diminuir quantidade">−</button><input id="pdp-qty" type="text" inputmode="numeric" value="1" aria-label="Quantidade"><button type="button" data-q="1" aria-label="Aumentar quantidade">+</button></div>
            <button class="btn" id="add-btn" type="button" ${soldOut ? 'disabled' : ''}>${soldOut ? 'Esgotado' : 'Adicionar à sacola'}</button>
          </div>
          <div class="acc">
            <details open><summary>Ficha técnica</summary><table class="specs"><tbody>${Object.entries(p.details || {}).map(([k, val]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(val)}</td></tr>`).join('')}</tbody></table></details>
            ${isSuit ? '<details><summary>Ajuste de barra e manga</summary><p>Incluso no preço. Informe a medida desejada nas observações do pedido, ou envie a peça como chegou e ajuste depois com a gente em até 30 dias.</p></details>' : ''}
            <details><summary>Entrega e trocas</summary><p>Despacho em até 2 dias úteis após a confirmação do pagamento. Frete grátis acima de ${money(DB.FREE_SHIP)}. Troca em até 30 dias, com a primeira troca de tamanho sem custo. <a href="#/ajuda/trocas">Ver política</a>.</p></details>
          </div>
        </div>
      </section>
      ${look ? `<section class="looks-band"><div class="wrap section"><div class="sec-head"><div><p class="eyebrow">Compre o look</p><h2>${esc(look.name)}</h2></div></div><div class="looks">${lookCard(look)}</div></div></section>` : ''}
      ${related.length ? `<section class="wrap section"><div class="sec-head"><h2>Para completar o visual</h2></div><div class="grid">${related.map(card).join('')}</div></section>` : ''}
      ${isSuit ? `<dialog id="guide" aria-labelledby="guide-t"><div class="dlg-head"><h2 id="guide-t">Guia de medidas</h2><button type="button" class="icon-btn" data-close-dlg aria-label="Fechar">✕</button></div><p class="muted small">Medidas do corpo, não da peça. Calças em drop 6.</p>${sizeTable()}</dialog>` : ''}`;

    const sel = () => { const r = $('input[name=size]:checked', v); return r && vars.find(x => x.id === r.value); };
    $$('input[name=size]', v).forEach(r => r.addEventListener('change', () => { $('#stock-note').textContent = stockText(sel()); }));
    const qty = $('#pdp-qty');
    $$('[data-q]', v).forEach(b => b.addEventListener('click', () => { qty.value = Math.min(10, Math.max(1, (parseInt(qty.value, 10) || 1) + Number(b.dataset.q))); }));
    if (isSuit) $('#open-guide').addEventListener('click', () => $('#guide').showModal());
    $('#add-btn').addEventListener('click', () => {
      const x = sel(), grid = $('.size-grid', v);
      if (!x) { toast('Escolha um tamanho antes de adicionar.', 'bad'); grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 500); return; }
      const n = Math.min(10, Math.max(1, parseInt(qty.value, 10) || 1));
      if (addToCart(p, x, n)) { toast(`${p.name} (tam. ${x.size}) foi para a sacola.`); openCart(); }
    });
    bindLooks(v);
  }

  /* ---------- compra ---------- */
  function viewCheckout(v) {
    const lines = cartLines();
    if (!lines.length) { v.innerHTML = `<section class="wrap empty"><h1>Sua sacola está vazia</h1><a class="btn" href="#/loja">Ver a loja</a></section>`; return; }
    if (!S.user) {
      v.innerHTML = `<section class="wrap narrow"><p class="eyebrow">Finalizar compra</p><h1>Entre para concluir o pedido</h1><p class="muted">Sua sacola continua guardada. Depois de entrar, você volta direto para cá.</p><div class="row"><a class="btn" href="#/conta?next=checkout">Entrar</a><a class="btn ghost" href="#/conta?tab=criar&next=checkout">Criar conta</a></div></section>`;
      return;
    }
    const u = S.user, last = store.get('lapela_ship', {});
    v.innerHTML = `<section class="wrap checkout">
      <form id="ck" novalidate>
        <ol class="ck-steps" aria-label="Etapas"><li class="done">Sacola</li><li class="on">Entrega e pagamento</li><li>Confirmação</li></ol>
        <h1>Entrega e pagamento</h1>
        <fieldset class="block"><legend class="h">Endereço de entrega</legend><div class="form-grid">
          ${fld('ck-name', 'Nome completo', 'c6', last.name || u.full_name, 'autocomplete="name" required')}
          ${fld('ck-email', 'E-mail', 'c3', last.email || u.email, 'type="email" autocomplete="email" required')}
          ${fld('ck-phone', 'Celular', 'c3', last.phone, 'type="tel" autocomplete="tel" required placeholder="(00) 90000-0000"')}
          ${fld('ck-cep', 'CEP', 'c2', last.cep, 'inputmode="numeric" autocomplete="postal-code" required placeholder="00000-000" maxlength="9"')}
          ${fld('ck-street', 'Endereço', 'c4', last.street, 'autocomplete="address-line1" required')}
          ${fld('ck-number', 'Número', 'c2', last.number, 'required')}
          ${fld('ck-complement', 'Complemento', 'c2', last.complement, 'autocomplete="address-line2"')}
          ${fld('ck-district', 'Bairro', 'c2', last.district, 'required')}
          ${fld('ck-city', 'Cidade', 'c4', last.city, 'autocomplete="address-level2" required')}
          ${fld('ck-uf', 'UF', 'c2', last.uf, 'maxlength="2" autocomplete="address-level1" required')}
          <label class="f c6" for="ck-notes"><span>Observações e medidas para ajuste (opcional)</span><textarea id="ck-notes" name="notes" rows="2" placeholder="Ex.: barra com 102 cm, manga com 63 cm"></textarea></label>
        </div></fieldset>
        <fieldset class="block"><legend class="h">Forma de pagamento</legend>
          <div class="pay">${Object.entries(PAY).map(([k, n], i) => `<label for="pay-${k}"><input type="radio" id="pay-${k}" name="pay" value="${k}" ${i === 0 ? 'checked' : ''}><span><b>${n}</b><small>${k === 'pix' ? 'Aprovação na hora' : k === 'cartao' ? 'Até 10x sem juros' : 'Vence em 3 dias úteis'}</small></span></label>`).join('')}</div>
          <p class="muted small">${DB.payments ? 'Ao confirmar, você vai para o ambiente seguro do Mercado Pago para pagar.' : 'Ao confirmar, o pedido fica reservado e nossa equipe envia os dados para pagamento pelo WhatsApp ou e-mail informados.'}</p>
        </fieldset>
      </form>
      <aside class="summary" id="summary" aria-label="Resumo do pedido"></aside>
    </section>`;
    renderSummary();

    const f = $('#ck');
    f.addEventListener('input', e => { if (e.target.value && e.target.value.trim()) e.target.classList.remove('invalid'); });
    f.elements.cep.addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 8); e.target.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; });
    f.elements.cep.addEventListener('blur', async e => {
      const c = e.target.value.replace(/\D/g, '');
      if (c.length !== 8) return;
      try {
        const d = await (await fetch(`https://viacep.com.br/ws/${c}/json/`)).json();
        if (d.erro) { toast('CEP não encontrado. Confira os números.', 'bad'); return; }
        [['street', 'logradouro'], ['district', 'bairro'], ['city', 'localidade'], ['uf', 'uf']].forEach(([k, src]) => { if (!f.elements[k].value) f.elements[k].value = d[src] || ''; });
      } catch (_) { /* sem acesso ao ViaCEP: preenchimento manual */ }
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      $$('.invalid', f).forEach(i => i.classList.remove('invalid'));
      const g = n => f.elements[n].value.trim();
      const bad = $$('[required]', f).filter(i => !i.value.trim());
      if (g('cep') && g('cep').replace(/\D/g, '').length !== 8) bad.push(f.elements.cep);
      if (g('email') && !/^\S+@\S+\.\S+$/.test(g('email'))) bad.push(f.elements.email);
      if (g('phone') && g('phone').replace(/\D/g, '').length < 10) bad.push(f.elements.phone);
      if (bad.length) { bad.forEach(i => i.classList.add('invalid')); bad[0].focus(); toast('Confira os campos destacados.', 'bad'); return; }
      const shipping = { name: g('name'), email: g('email'), phone: g('phone'), cep: g('cep'), street: g('street'), number: g('number'), complement: g('complement'), district: g('district'), city: g('city'), uf: g('uf').toUpperCase(), notes: g('notes') };
      store.set('lapela_ship', { ...shipping, notes: '' });
      const btn = $('#ck-submit'); btn.disabled = true; btn.textContent = 'Enviando pedido…';
      let order;
      try {
        order = await DB.createOrder({ items: cartLines().map(l => ({ variant_id: l.variant_id, quantity: l.qty })), shipping, payment: f.elements.pay.value, coupon: S.coupon ? S.coupon.code : null });
      } catch (err) {
        toast(err.message, 'bad'); btn.disabled = false; btn.textContent = 'Confirmar pedido';
        await loadProducts(); renderSummary(); return;
      }
      S.cart = []; S.coupon = null; saveCart();
      if (DB.payments) {
        btn.textContent = 'Abrindo pagamento…';
        try { location.href = await DB.startPayment(order.id); return; } catch (err) { toast(err.message + ' Você pode pagar pela página do pedido.', 'bad'); }
      }
      await loadProducts();
      go('#/pedido/' + order.id);
    });
  }
  function renderSummary() {
    const box = $('#summary'); if (!box) return;
    const lines = cartLines(), t = totals(cartSubtotal(), S.coupon && S.coupon.percent_off);
    box.innerHTML = `<h2 class="h3">Resumo do pedido</h2>
      <div class="sum-lines">${lines.map(l => `<div class="sum-line"><div class="thumb">${art(l.p)}</div><span>${l.qty}× ${esc(l.p.name)} <span class="mono">tam. ${esc(l.v.size)}</span></span><span class="price">${money(l.p.price * l.qty)}</span></div>`).join('')}</div>
      <div class="coupon"><input id="cp-code" placeholder="Cupom de desconto" aria-label="Cupom de desconto" value="${esc(S.coupon ? S.coupon.code : '')}" ${S.coupon ? 'disabled' : ''}><button type="button" class="btn ghost sm" id="cp-btn">${S.coupon ? 'Remover' : 'Aplicar'}</button></div>
      <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      ${t.discount ? `<div class="sum-row good"><span>Cupom ${esc(S.coupon.code)} (${S.coupon.percent_off}%)</span><span>− ${money(t.discount)}</span></div>` : ''}
      <div class="sum-row"><span>Frete</span><span>${t.shipping ? money(t.shipping) : 'Grátis'}</span></div>
      <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>
      <p class="muted small">ou 10x de ${money(t.total / 10)} no cartão</p>
      <button class="btn wide" type="submit" form="ck" id="ck-submit">Confirmar pedido</button>
      <p class="secure">${ICON.card}<span>Os valores são conferidos no servidor da loja antes da cobrança.</span></p>`;
    $('#cp-btn').addEventListener('click', async () => {
      if (S.coupon) { S.coupon = null; renderSummary(); return; }
      const code = $('#cp-code').value.trim();
      if (!code) { $('#cp-code').focus(); return; }
      try { S.coupon = await DB.validateCoupon(code); toast(`Cupom ${S.coupon.code} aplicado: ${S.coupon.percent_off}% de desconto.`); } catch (e) { toast(e.message, 'bad'); }
      renderSummary();
    });
    $('#cp-code').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#cp-btn').click(); } });
  }

  async function viewOrder(v, id, q) {
    if (!S.user) { go('#/conta'); return; }
    v.innerHTML = loading();
    const o = await DB.getOrder(id), sh = o.shipping || {};
    const waiting = o.status === 'aguardando_pagamento';
    const back = q.has('collection_status') || q.has('status') || q.has('payment_id');
    const steps = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue'], cur = steps.indexOf(o.status);
    v.innerHTML = `<section class="wrap narrow-lg section order">
      <p class="eyebrow">Pedido nº ${esc(o.number)}</p>
      <h1>${waiting ? (back ? 'Recebemos seu pagamento?' : 'Pedido recebido. Obrigado!') : 'Detalhes do pedido'}</h1>
      <p class="row"><span>${pill(o.status)}</span><span class="muted">${dateBR(o.created_at)} · ${PAY[o.payment_method] || ''}</span></p>
      ${o.status !== 'cancelado' ? `<ol class="track">${['Pedido feito', 'Pago', 'Em separação', 'Enviado', 'Entregue'].map((s, i) => `<li class="${i <= Math.max(cur, 0) ? 'done' : ''}">${s}</li>`).join('')}</ol>` : ''}
      ${waiting ? (DB.payments
        ? `<div class="paybox"><b>${back ? 'Confirmação a caminho' : 'Falta o pagamento'}</b><p>${back ? 'Se você acabou de pagar, a confirmação do Mercado Pago chega em alguns instantes. Atualize esta página para ver o novo status.' : 'Seu pedido está reservado. Conclua o pagamento para despacharmos.'}</p><div class="row"><button class="btn sm" type="button" id="pay-now">${back ? 'Tentar pagar de novo' : 'Pagar agora'}</button>${back ? '<button class="btn ghost sm" type="button" id="refresh">Atualizar</button>' : ''}</div></div>`
        : `<div class="paybox"><b>Próximo passo</b><p>Seu pedido está reservado por 3 dias úteis. Nossa equipe envia os dados para pagamento via ${PAY[o.payment_method] || 'PIX'} pelo WhatsApp ${esc(sh.phone)} ou pelo e-mail ${esc(sh.email)}.</p></div>`) : ''}
      <div class="order-grid">
        <div><h2 class="h3">Itens</h2>
          ${o.items.map(i => `<div class="sum-line"><span>${i.quantity}× ${esc(i.product_name)} <span class="mono">tam. ${esc(i.size)}</span></span><span class="price">${money(i.unit_price * i.quantity)}</span></div>`).join('')}
          <div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
          ${Number(o.discount) ? `<div class="sum-row good"><span>Cupom ${esc(o.coupon_code)}</span><span>− ${money(o.discount)}</span></div>` : ''}
          <div class="sum-row"><span>Frete</span><span>${Number(o.shipping_cost) ? money(o.shipping_cost) : 'Grátis'}</span></div>
          <div class="sum-row total"><span>Total</span><span>${money(o.total)}</span></div></div>
        <div><h2 class="h3">Entrega</h2>
          <p>${esc(sh.name)}<br>${esc(sh.street)}, ${esc(sh.number)}${sh.complement ? ' – ' + esc(sh.complement) : ''}<br>${esc(sh.district)} · ${esc(sh.city)}/${esc(sh.uf)}<br>CEP ${esc(sh.cep)}</p>
          <p class="muted small">${esc(sh.email)} · ${esc(sh.phone)}</p>
          ${sh.notes ? `<p class="note">Observações: ${esc(sh.notes)}</p>` : ''}</div>
      </div>
      <div class="row"><a class="btn ghost" href="#/conta">Meus pedidos</a><a class="btn" href="#/loja">Continuar comprando</a></div>
    </section>`;
    const pay = $('#pay-now');
    if (pay) pay.addEventListener('click', async () => {
      pay.disabled = true; pay.textContent = 'Abrindo pagamento…';
      try { location.href = await DB.startPayment(o.id); } catch (e) { toast(e.message, 'bad'); pay.disabled = false; pay.textContent = 'Pagar agora'; }
    });
    const rf = $('#refresh'); if (rf) rf.addEventListener('click', () => render());
  }

  /* ---------- conta ---------- */
  async function viewAccount(v, q) {
    const next = q.get('next'), nx = next ? '&next=' + encodeURIComponent(next) : '';
    let tab = q.get('tab') || 'entrar';
    if (tab === 'nova-senha' && S.user) {
      v.innerHTML = `<section class="wrap narrow"><p class="eyebrow">Sua conta</p><h1>Crie uma nova senha</h1>
        <form id="pw" class="auth-card" novalidate>${fld('pw-password', 'Nova senha', '', '', 'type="password" autocomplete="new-password" required minlength="6"')}<p class="muted small">Mínimo de 6 caracteres.</p><button class="btn wide" type="submit">Salvar nova senha</button></form></section>`;
      $('#pw').addEventListener('submit', async e => {
        e.preventDefault(); const val = e.target.elements.password.value;
        if (val.length < 6) { toast('A senha precisa ter pelo menos 6 caracteres.', 'bad'); return; }
        try { await DB.updatePassword(val); toast('Senha alterada.'); go('#/conta'); } catch (err) { toast(err.message, 'bad'); }
      });
      return;
    }
    if (S.user && next) { go('#/' + next); return; }
    if (!S.user) {
      if (!['entrar', 'criar', 'recuperar'].includes(tab)) tab = 'entrar';
      const title = { entrar: 'Entrar', criar: 'Criar conta', recuperar: 'Recuperar senha' }[tab];
      v.innerHTML = `<section class="wrap auth">
        <div class="auth-side"><p class="eyebrow">Sua conta</p><h1>${title}</h1><ul class="ticks"><li>Acompanhe seus pedidos</li><li>Endereço salvo para a próxima compra</li><li>Cupons exclusivos por e-mail</li></ul></div>
        <div class="auth-main">
        ${tab !== 'recuperar' ? `<nav class="tabs"><a href="#/conta?tab=entrar${nx}" class="${tab === 'entrar' ? 'on' : ''}">Entrar</a><a href="#/conta?tab=criar${nx}" class="${tab === 'criar' ? 'on' : ''}">Criar conta</a></nav>` : ''}
        <form id="auth" class="auth-card" novalidate>
          ${tab === 'recuperar' ? '<p class="muted">Digite o e-mail da sua conta. Enviamos um link para você criar uma nova senha.</p>' : ''}
          ${tab === 'criar' ? fld('au-full_name', 'Nome completo', '', '', 'autocomplete="name" required') : ''}
          ${fld('au-email', 'E-mail', '', '', 'type="email" autocomplete="email" required')}
          ${tab !== 'recuperar' ? fld('au-password', 'Senha', '', '', `type="password" autocomplete="${tab === 'criar' ? 'new-password' : 'current-password'}" required minlength="6"`) : ''}
          ${tab === 'criar' ? '<p class="muted small">Mínimo de 6 caracteres. Ao criar a conta você concorda com os <a href="#/ajuda/termos">termos de uso</a> e a <a href="#/ajuda/privacidade">política de privacidade</a>.</p>' : ''}
          <button class="btn wide" type="submit">${tab === 'criar' ? 'Criar conta' : tab === 'recuperar' ? 'Enviar link' : 'Entrar'}</button>
          ${tab === 'entrar' ? `<a class="link" href="#/conta?tab=recuperar${nx}">Esqueci minha senha</a>` : ''}
          ${tab === 'recuperar' ? `<a class="link" href="#/conta?tab=entrar${nx}">Voltar para entrar</a>` : ''}
          ${DB.mode === 'preview' && tab === 'entrar' ? `<p class="muted small demo-hint">Prévia: painel com <span class="mono">admin@casalapela.com.br</span> / <span class="mono">admin123</span>.</p>` : ''}
        </form></div></section>`;
      $('#auth').addEventListener('submit', async e => {
        e.preventDefault();
        const f = e.target, btn = $('button[type=submit]', f), val = n => (f.elements[n] ? f.elements[n].value : '');
        if ($$('[required]', f).some(i => !i.value.trim())) { toast('Preencha todos os campos.', 'bad'); return; }
        btn.disabled = true;
        try {
          if (tab === 'recuperar') { await DB.resetPassword(val('email')); toast('Se houver uma conta com esse e-mail, o link chega em instantes.'); go('#/conta?tab=entrar' + nx); return; }
          if (tab === 'criar') {
            const r = await DB.signUp({ email: val('email'), password: val('password'), full_name: val('full_name') });
            if (r && r.needsConfirm) { v.innerHTML = `<section class="wrap narrow"><p class="eyebrow">Quase lá</p><h1>Confirme seu e-mail</h1><p class="muted">Enviamos um link para <b>${esc(val('email'))}</b>. Abra o e-mail e toque no link para ativar a conta. Depois é só entrar.</p><a class="btn" href="#/conta?tab=entrar${nx}">Entrar</a></section>`; return; }
            S.user = r;
          } else S.user = await DB.signIn(val('email'), val('password'));
          renderHeader(); toast(`Olá, ${firstName(S.user)}!`);
          go(next ? '#/' + next : '#/conta');
        } catch (err) { toast(err.message, 'bad'); btn.disabled = false; }
      });
      return;
    }
    v.innerHTML = loading();
    const orders = await DB.myOrders();
    v.innerHTML = `<section class="wrap narrow-lg section">
      <div class="sec-head"><div><p class="eyebrow">Sua conta</p><h1>Olá, ${esc(firstName(S.user))}</h1><p class="muted">${esc(S.user.email)}</p></div>
        <div class="row">${S.user.is_admin ? '<a class="btn ghost sm" href="#/admin">Painel do lojista</a>' : ''}<a class="btn ghost sm" href="#/conta?tab=nova-senha">Alterar senha</a><button class="btn ghost sm" id="logout" type="button">Sair</button></div></div>
      <h2 class="h3">Meus pedidos</h2>
      ${orders.length ? `<div class="orders">${orders.map(o => `<a class="order-row" href="#/pedido/${esc(o.id)}"><div><b>Pedido nº ${esc(o.number)}</b><p class="mono">${dateBR(o.created_at)} · ${o.items.reduce((s, i) => s + i.quantity, 0)} itens</p></div>${pill(o.status)}<b class="price">${money(o.total)}</b></a>`).join('')}</div>`
        : `<div class="empty small-empty"><p class="muted">Você ainda não fez pedidos.</p><a class="btn" href="#/loja">Ver a loja</a></div>`}
    </section>`;
    $('#logout').addEventListener('click', async () => { await DB.signOut(); S.user = null; renderHeader(); toast('Você saiu da sua conta.'); go('#/'); });
  }

  /* ---------- páginas de ajuda ---------- */
  function viewHelp(v, page) {
    const s = STORE, contact = `${s.whatsapp ? `WhatsApp ${esc(s.whatsapp)}` : ''}${s.email ? ` · ${esc(s.email)}` : ''}`;
    const pages = {
      medidas: ['Guia de medidas', `<p>Todas as medidas são do corpo, não da peça. Use uma fita métrica flexível e meça por cima de uma camisa fina.</p>
        <h2>Paletó</h2><p>Meça o tórax na altura das axilas, passando pela parte mais larga das costas. Divida por dois para achar o número: 100 cm de tórax veste 50.</p>
        <h2>Calça</h2><p>Nossos ternos seguem o drop 6: a calça vem seis números abaixo do paletó. Meça a cintura na altura do umbigo.</p>${sizeTable()}
        <h2>Barra e manga</h2><p>O ajuste é incluso. Informe as medidas desejadas nas observações do pedido, ou envie a peça como chegou e ajuste depois com a gente em até 30 dias.</p>`],
      trocas: ['Trocas e devoluções', `<p>Você tem <b>7 dias corridos</b> a partir do recebimento para desistir da compra, com reembolso integral, como garante o Código de Defesa do Consumidor (art. 49).</p>
        <p>Para troca de tamanho ou modelo, o prazo é de <b>30 dias</b>. A primeira troca de tamanho tem frete por nossa conta.</p>
        <h2>Condições</h2><ul><li>A peça deve estar sem uso, com etiqueta e na embalagem original.</li><li>Peças com barra ou manga já ajustadas não são trocadas por tamanho, mas seguem cobertas em caso de defeito.</li><li>Defeitos de fabricação são cobertos por 90 dias.</li></ul>
        <h2>Como pedir</h2><p>Fale com a gente informando o número do pedido: ${contact}. Respondemos em até 1 dia útil com o código de postagem.</p>`],
      privacidade: ['Política de privacidade', `<p>Esta política explica como a ${esc(s.name || 'loja')} trata seus dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
        <h2>Dados que coletamos</h2><ul><li>Nome, e-mail e senha (guardada de forma criptografada) para criar sua conta.</li><li>Endereço, telefone e itens comprados para entregar seus pedidos.</li><li>E-mail para a newsletter, só se você assinar.</li></ul>
        <h2>Para que usamos</h2><p>Para processar e entregar pedidos, prestar atendimento, cumprir obrigações fiscais e, com sua autorização, enviar novidades. Não vendemos seus dados.</p>
        <h2>Pagamentos</h2><p>Os dados de cartão são digitados no ambiente do Mercado Pago e nunca passam pelos nossos servidores.</p>
        <h2>Seus direitos</h2><p>Você pode pedir acesso, correção ou exclusão dos seus dados e cancelar a newsletter a qualquer momento pelo e-mail ${esc(s.email || '')}.</p>`],
      termos: ['Termos de uso', `<p>Ao usar este site você concorda com estes termos. Preços e estoque podem mudar sem aviso; o valor que vale é o confirmado no fechamento do pedido.</p>
        <h2>Pedidos</h2><p>O pedido é confirmado após a aprovação do pagamento. Pedidos não pagos em 3 dias úteis podem ser cancelados e os itens voltam ao estoque.</p>
        <h2>Entrega</h2><p>Despachamos em até 2 dias úteis após a confirmação. O prazo de transporte depende do CEP e é informado no envio.</p>
        <h2>Contato</h2><p>${contact}${s.cnpj ? ` · CNPJ ${esc(s.cnpj)}` : ''}</p>`],
      contato: ['Fale conosco', `<dl class="contact">${s.whatsapp ? `<div><dt>WhatsApp</dt><dd>${esc(s.whatsapp)}</dd></div>` : ''}${s.email ? `<div><dt>E-mail</dt><dd>${esc(s.email)}</dd></div>` : ''}${s.hours ? `<div><dt>Horário</dt><dd>${esc(s.hours)}</dd></div>` : ''}${s.address ? `<div><dt>Endereço</dt><dd>${esc(s.address)}</dd></div>` : ''}</dl>
        <p class="muted">Para trocas, tenha o número do pedido em mãos. Ele aparece em <a href="#/conta">Minha conta</a>.</p>`]
    };
    const pg = pages[page];
    if (!pg) { v.innerHTML = notFound(); return; }
    v.innerHTML = `<section class="wrap help"><nav class="help-nav" aria-label="Ajuda">${Object.entries(pages).map(([k, [t]]) => `<a href="#/ajuda/${k}" class="${k === page ? 'on' : ''}">${t}</a>`).join('')}</nav>
      <article class="prose"><p class="eyebrow">Ajuda</p><h1>${pg[0]}</h1>${pg[1]}</article></section>`;
  }

  /* ---------- painel do lojista ---------- */
  async function viewAdmin(v, q) {
    if (!S.user) { go('#/conta?next=admin'); return; }
    if (!S.user.is_admin) { v.innerHTML = `<section class="wrap empty"><h1>Acesso restrito</h1><p class="muted">Esta área é só para a equipe da loja.</p></section>`; return; }
    const tab = ['pedidos', 'produtos', 'cupons', 'assinantes'].includes(q.get('tab')) ? q.get('tab') : 'pedidos';
    v.innerHTML = loading();
    const [orders, products] = await Promise.all([DB.adminOrders(), DB.listProducts({ includeInactive: true })]);
    products.forEach(p => p.variants.sort(bySize));
    const confirmed = orders.filter(o => !['cancelado', 'aguardando_pagamento'].includes(o.status));
    const revenue = confirmed.reduce((s, o) => s + Number(o.total), 0);
    const pending = orders.filter(o => o.status === 'aguardando_pagamento').length;
    const toShip = orders.filter(o => ['pago', 'em_separacao'].includes(o.status)).length;
    const low = products.filter(p => p.active).reduce((n, p) => n + p.variants.filter(x => x.stock <= 2).length, 0);
    const T = { pedidos: 'Pedidos', produtos: 'Produtos e estoque', cupons: 'Cupons', assinantes: 'Newsletter' };
    v.innerHTML = `<section class="wrap section admin">
      <div class="sec-head"><div><p class="eyebrow">Painel do lojista</p><h1>${T[tab]}</h1></div>${tab === 'produtos' ? '<button class="btn sm" id="new-prod" type="button">Novo produto</button>' : ''}</div>
      <div class="stats">
        <div class="stat"><span class="mono">Faturamento confirmado</span><b>${money(revenue)}</b><small>${confirmed.length} pedidos pagos</small></div>
        <div class="stat ${pending ? 'attn' : ''}"><span class="mono">Aguardando pagamento</span><b>${pending}</b><small>${orders.length} pedidos no total</small></div>
        <div class="stat ${toShip ? 'attn' : ''}"><span class="mono">Para despachar</span><b>${toShip}</b><small>pagos ou em separação</small></div>
        <div class="stat ${low ? 'attn' : ''}"><span class="mono">Estoque baixo</span><b>${low}</b><small>tamanhos com 2 ou menos</small></div>
      </div>
      <nav class="tabs">${Object.entries(T).map(([k, n]) => `<a href="#/admin${k === 'pedidos' ? '' : '?tab=' + k}" class="${tab === k ? 'on' : ''}">${n}</a>`).join('')}</nav>
      <div id="admin-body" class="admin-body"></div></section>
      <dialog id="prod-dlg" aria-label="Produto"></dialog>`;
    if (tab === 'pedidos') adminOrders(orders, q.get('st') || '');
    else if (tab === 'produtos') adminProducts(products);
    else if (tab === 'cupons') await adminCoupons();
    else await adminNews();
  }
  function adminOrders(orders, st) {
    const box = $('#admin-body');
    const list = st ? orders.filter(o => o.status === st) : orders;
    box.innerHTML = `<div class="chips">${[['', 'Todos'], ...Object.entries(STATUS).map(([k, [n]]) => [k, n])].map(([k, n]) => `<a class="chip ${k === st ? 'on' : ''}" href="#/admin${k ? '?st=' + k : ''}">${n} <span class="mono">${k ? orders.filter(o => o.status === k).length : orders.length}</span></a>`).join('')}</div>
      ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>
      ${list.map(o => `<tr><td><a href="#/pedido/${esc(o.id)}">${esc(o.number)}</a></td><td class="nowrap">${dateBR(o.created_at)}</td>
        <td>${esc(o.shipping && o.shipping.name)}<br><span class="mono">${esc(o.shipping && o.shipping.phone)} · ${esc(o.shipping && o.shipping.city)}/${esc(o.shipping && o.shipping.uf)}</span>${o.shipping && o.shipping.notes ? `<br><span class="note-sm">${esc(o.shipping.notes)}</span>` : ''}</td>
        <td class="items">${o.items.map(i => `${i.quantity}× ${esc(i.product_name)} <span class="mono">(${esc(i.size)})</span>`).join('<br>')}</td>
        <td>${PAY[o.payment_method] || ''}${o.coupon_code ? `<br><span class="mono">${esc(o.coupon_code)}</span>` : ''}${o.payment_id ? `<br><span class="mono">MP ${esc(o.payment_id)}</span>` : ''}</td>
        <td class="r price">${money(o.total)}</td>
        <td><select data-status="${esc(o.id)}" aria-label="Status do pedido ${esc(o.number)}" ${o.status === 'cancelado' ? 'disabled' : ''}>${Object.entries(STATUS).map(([k, [n]]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div><p class="muted small">Cancelar um pedido devolve os itens ao estoque. Pedido cancelado não pode ser reaberto.</p>`
      : `<div class="empty small-empty"><p>Nenhum pedido ${st ? 'com esse status' : 'ainda'}.</p></div>`}`;
    $$('[data-status]', box).forEach(s => s.addEventListener('change', async () => {
      try { await DB.updateOrderStatus(s.dataset.status, s.value); toast('Status do pedido atualizado.'); await loadProducts(); render(); }
      catch (e) { toast(e.message, 'bad'); render(); }
    }));
  }
  function adminProducts(products) {
    $('#admin-body').innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Produto</th><th>Categoria</th><th class="r">Preço</th><th>Estoque por tamanho</th><th>Status</th><th><span class="sr">Ações</span></th></tr></thead><tbody>
      ${products.map(p => `<tr><td><div class="prod-cell"><div class="thumb">${art(p)}</div><div><b>${esc(p.name)}</b>${p.featured ? '<br><span class="mono">Destaque</span>' : ''}</div></div></td><td>${esc(catName(p.category))}</td><td class="r price">${money(p.price)}</td>
        <td><div class="stks">${p.variants.map(x => `<span class="stk ${x.stock <= 0 ? 'zero' : x.stock <= 2 ? 'low' : ''}">${esc(x.size)}<b>${x.stock}</b></span>`).join('')}</div></td>
        <td>${p.active ? '<span class="pill ok">Na loja</span>' : '<span class="pill">Oculto</span>'}</td>
        <td><button class="btn ghost sm" data-edit="${esc(p.id)}" type="button">Editar</button></td></tr>`).join('')}
      </tbody></table></div>`;
    $$('[data-edit]').forEach(b => b.addEventListener('click', () => productDialog(products.find(p => p.id === b.dataset.edit))));
    $('#new-prod').addEventListener('click', () => productDialog(null));
  }
  async function adminCoupons() {
    const box = $('#admin-body'), list = await DB.listCoupons();
    box.innerHTML = `<form id="cp-form" class="inline-form" novalidate>
        ${fld('cpn-code', 'Código', '', '', 'required placeholder="NATAL20" maxlength="30"')}
        ${fld('cpn-pct', 'Desconto (%)', '', '', 'type="number" min="1" max="90" required')}
        ${fld('cpn-exp', 'Válido até (opcional)', '', '', 'type="date"')}
        <button class="btn" type="submit">Criar cupom</button></form>
      ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th class="r">Desconto</th><th>Validade</th><th>Status</th><th><span class="sr">Ações</span></th></tr></thead><tbody>
      ${list.map(c => { const exp = c.expires_at && new Date(c.expires_at) < new Date(); return `<tr><td class="mono strong">${esc(c.code)}</td><td class="r">${c.percent_off}%</td><td>${c.expires_at ? dateBR(c.expires_at) : 'Sem prazo'}</td>
        <td>${exp ? '<span class="pill bad">Expirado</span>' : c.active ? '<span class="pill ok">Ativo</span>' : '<span class="pill">Pausado</span>'}</td>
        <td><button class="btn ghost sm" type="button" data-toggle="${esc(c.code)}">${c.active ? 'Pausar' : 'Ativar'}</button></td></tr>`; }).join('')}
      </tbody></table></div>` : '<p class="muted">Nenhum cupom ainda.</p>'}`;
    $('#cp-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target;
      const code = f.elements.code.value.trim().toUpperCase().replace(/\s+/g, ''), pct = parseInt(f.elements.pct.value, 10), exp = f.elements.exp.value;
      if (!code) { toast('Dê um código ao cupom.', 'bad'); return; }
      if (!(pct >= 1 && pct <= 90)) { toast('O desconto vai de 1% a 90%.', 'bad'); return; }
      if (list.some(c => c.code === code)) { toast('Já existe um cupom com esse código.', 'bad'); return; }
      try { await DB.saveCoupon({ code, percent_off: pct, active: true, expires_at: exp ? new Date(exp + 'T23:59:59-03:00').toISOString() : null }); toast(`Cupom ${code} criado.`); render(); } catch (err) { toast(err.message, 'bad'); }
    });
    $$('[data-toggle]', box).forEach(b => b.addEventListener('click', async () => {
      const c = list.find(x => x.code === b.dataset.toggle);
      try { await DB.saveCoupon({ ...c, active: !c.active }); toast(c.active ? 'Cupom pausado.' : 'Cupom ativado.'); render(); } catch (err) { toast(err.message, 'bad'); }
    }));
  }
  async function adminNews() {
    const box = $('#admin-body'), list = await DB.listNewsletter();
    box.innerHTML = list.length ? `<div class="row between"><p class="muted">${list.length} ${list.length === 1 ? 'assinante' : 'assinantes'}</p><button class="btn ghost sm" type="button" id="copy-mails">Copiar e-mails</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>E-mail</th><th>Desde</th></tr></thead><tbody>${list.map(n => `<tr><td>${esc(n.email)}</td><td>${dateBR(n.created_at)}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty small-empty"><p class="muted">Ninguém assinou a newsletter ainda.</p></div>';
    const b = $('#copy-mails');
    if (b) b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(list.map(n => n.email).join(', ')); toast('E-mails copiados.'); } catch (_) { toast('Não foi possível copiar. Selecione na tabela.', 'bad'); } });
  }
  function productDialog(p) {
    const d = $('#prod-dlg'), isNew = !p;
    p = p || { name: '', category: 'ternos', price: '', compare_at_price: '', fabric: '', description: '', details: {}, art: { kind: 'suit', color: '#2B3A55', pattern: 'plain', lapel: 'notch', tie: '#7A1F2B' }, active: true, featured: false, image_url: '', variants: SIZE_GUIDE.map(r => ({ size: String(r[0]), stock: 0 })) };
    const a = p.art || {};
    const patOpts = cat => PATTERNS[kindFor(cat)].map(([k, n]) => `<option value="${k}" ${k === a.pattern ? 'selected' : ''}>${n}</option>`).join('');
    const stockRow = x => `<label class="f stock-f"><span>Tam. ${esc(x.size)}</span><input type="number" min="0" step="1" value="${x.stock}" data-vid="${esc(x.id || '')}" data-size="${esc(x.size)}" aria-label="Estoque do tamanho ${esc(x.size)}"></label>`;
    d.innerHTML = `<form id="pf" novalidate>
      <div class="dlg-head"><h2>${isNew ? 'Novo produto' : 'Editar produto'}</h2><button type="button" class="icon-btn" data-close-dlg aria-label="Fechar">✕</button></div>
      <div class="pf-layout"><div class="pf-side"><div class="pf-preview" id="pf-preview">${art(p)}</div>
        <label class="btn ghost sm upload" for="pf-file">Enviar foto<input type="file" id="pf-file" accept="image/jpeg,image/png,image/webp" hidden></label>
        <button type="button" class="link" id="pf-clear-img" ${p.image_url ? '' : 'hidden'}>Usar ilustração</button></div>
      <div class="form-grid">
        ${fld('pf-name', 'Nome', 'c6', p.name, 'required')}
        <label class="f c2" for="pf-category"><span>Categoria</span><select id="pf-category" name="category">${S.categories.map(c => `<option value="${c.slug}" ${c.slug === p.category ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
        ${fld('pf-price', 'Preço (R$)', 'c2', p.price, 'inputmode="decimal" required')}
        ${fld('pf-compare', 'Preço "de" (opcional)', 'c2', p.compare_at_price || '', 'inputmode="decimal"')}
        ${fld('pf-fabric', 'Tecido e medida', 'c6', p.fabric, 'placeholder="Lã fria Super 120s · 260 g/m²"')}
        <label class="f c6" for="pf-description"><span>Descrição</span><textarea id="pf-description" name="description" rows="3">${esc(p.description)}</textarea></label>
        <label class="f c6" for="pf-details"><span>Ficha técnica (uma linha por item: Nome: valor)</span><textarea id="pf-details" name="details" rows="4">${esc(Object.entries(p.details || {}).map(([k, v]) => k + ': ' + v).join('\n'))}</textarea></label>
        <label class="f c3" for="pf-color"><span>Cor da ilustração</span><input type="color" id="pf-color" name="color" value="${esc(a.color || '#2B3A55')}"></label>
        <label class="f c3" for="pf-pattern"><span>Padrão</span><select id="pf-pattern" name="pattern">${patOpts(p.category)}</select></label>
        <input type="hidden" id="pf-image" name="image" value="${esc(p.image_url || '')}">
        <label class="check c3" for="pf-active"><input type="checkbox" id="pf-active" name="active" ${p.active ? 'checked' : ''}> Visível na loja</label>
        <label class="check c3" for="pf-featured"><input type="checkbox" id="pf-featured" name="featured" ${p.featured ? 'checked' : ''}> Destaque na página inicial</label>
        <div class="c6"><p class="f-label">Estoque</p><div class="stock-grid" id="pf-stock">${[...p.variants].sort(bySize).map(stockRow).join('')}</div>
          <div class="row add-size"><input id="pf-newsize" placeholder="Novo tamanho (ex.: 58 ou Único)" aria-label="Novo tamanho"><button type="button" class="btn ghost sm" id="pf-addsize">Adicionar tamanho</button></div></div>
      </div></div>
      <div class="row end"><button type="button" class="btn ghost" data-close-dlg>Cancelar</button><button class="btn" type="submit">Salvar produto</button></div>
    </form>`;
    d.showModal();
    const f = $('#pf', d);
    const KEEP = { suit: ['suit'], tie: ['tie', 'bow'], square: ['square', 'cufflinks', 'clip'] };
    const artNow = () => { const k = kindFor(f.elements.category.value); return { ...a, kind: KEEP[k].includes(a.kind) ? a.kind : k, color: f.elements.color.value, pattern: f.elements.pattern.value }; };
    const preview = () => { $('#pf-preview', d).innerHTML = art({ name: f.elements.name.value, image_url: f.elements.image.value, art: artNow() }); $('#pf-clear-img', d).hidden = !f.elements.image.value; };
    f.elements.category.addEventListener('change', () => { f.elements.pattern.innerHTML = patOpts(f.elements.category.value); preview(); });
    f.elements.color.addEventListener('input', preview);
    f.elements.pattern.addEventListener('change', preview);
    $('#pf-clear-img', d).addEventListener('click', () => { f.elements.image.value = ''; preview(); });
    $('#pf-file', d).addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast('A foto pode ter até 5 MB.', 'bad'); return; }
      toast('Enviando foto…');
      try { f.elements.image.value = await DB.uploadImage(file, f.elements.name.value); preview(); toast('Foto enviada. Salve o produto para publicar.'); } catch (err) { toast(err.message, 'bad'); }
      e.target.value = '';
    });
    $('#pf-addsize', d).addEventListener('click', () => {
      const s = $('#pf-newsize', d).value.trim();
      if (!s) return;
      if ($$('[data-size]', d).some(i => i.dataset.size.toLowerCase() === s.toLowerCase())) { toast('Esse tamanho já existe.', 'bad'); return; }
      $('#pf-stock', d).insertAdjacentHTML('beforeend', stockRow({ size: s, stock: 0 }));
      $('#pf-newsize', d).value = '';
    });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const num = s => { s = String(s).trim(); return parseFloat(/,/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s); };
      const price = num(f.elements.price.value), compare = f.elements.compare.value.trim() ? num(f.elements.compare.value) : null, name = f.elements.name.value.trim();
      if (!name) { toast('Dê um nome ao produto.', 'bad'); f.elements.name.focus(); return; }
      if (!(price > 0)) { toast('Informe um preço válido, ex.: 1890 ou 1.890,00.', 'bad'); f.elements.price.focus(); return; }
      if (compare != null && !(compare > price)) { toast('O preço "de" precisa ser maior que o preço atual.', 'bad'); return; }
      const details = {};
      f.elements.details.value.split('\n').forEach(l => { const i = l.indexOf(':'); if (i > 0) details[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
      const variants = $$('[data-size]', d).map(i => ({ id: i.dataset.vid || null, size: i.dataset.size, stock: Math.max(0, parseInt(i.value, 10) || 0) }));
      if (!variants.length) { toast('Adicione pelo menos um tamanho.', 'bad'); return; }
      const btn = $('button[type=submit]', f); btn.disabled = true;
      try {
        await DB.saveProduct({ id: p.id, slug: p.slug, name, category: f.elements.category.value, price, compare_at_price: compare, fabric: f.elements.fabric.value.trim(), description: f.elements.description.value.trim(), details, art: artNow(), image_url: f.elements.image.value, active: f.elements.active.checked, featured: f.elements.featured.checked, variants });
        d.close(); toast('Produto salvo.'); await loadProducts(); render();
      } catch (err) { toast(err.message, 'bad'); btn.disabled = false; }
    });
  }

  /* ---------- loja sem banco ---------- */
  function viewSetup(v) {
    v.innerHTML = `<section class="wrap narrow-lg section prose"><p class="eyebrow">Configuração</p><h1>${DB.mode === 'offline' ? 'Não foi possível conectar ao banco' : 'Falta conectar o banco de dados'}</h1>
      ${DB.mode === 'offline' ? '<p>A biblioteca do Supabase não carregou. Confira sua conexão e recarregue a página.</p>' : `<p>A loja está pronta, mas ainda não sabe qual banco usar. Para deixá-la funcionando:</p>
      <ol><li>Crie um projeto grátis em supabase.com.</li><li>No <b>SQL Editor</b>, rode <code>supabase/schema.sql</code> e depois <code>supabase/seed.sql</code>.</li><li>Em <b>Project Settings → API</b>, copie a Project URL e a chave anon para <code>js/config.js</code>.</li><li>Publique os arquivos de novo.</li></ol><p class="muted">O passo a passo completo está no README.md do projeto.</p>`}</section>`;
  }

  /* ---------- roteador ---------- */
  function parseRoute() {
    const h = location.hash.replace(/^#/, '') || '/';
    const i = h.indexOf('?'), path = i < 0 ? h : h.slice(0, i), qs = i < 0 ? '' : h.slice(i + 1);
    return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs) };
  }
  function renderHeader() {
    $('#acct-label').textContent = S.user ? firstName(S.user) : 'Entrar';
    $('#admin-link').hidden = !(S.user && S.user.is_admin);
    renderCartBadge();
  }
  function renderFooter() {
    const s = STORE;
    $('#foot-contact').innerHTML = [s.whatsapp && `<p>WhatsApp ${esc(s.whatsapp)}</p>`, s.email && `<p>${esc(s.email)}</p>`, s.hours && `<p class="muted">${esc(s.hours)}</p>`].filter(Boolean).join('');
    $('#foot-legal').textContent = [`© ${new Date().getFullYear()} ${s.name || 'Casa Lapela'}`, s.cnpj && `CNPJ ${s.cnpj}`, s.address].filter(Boolean).join(' · ');
  }
  async function render() {
    closeCart();
    const { parts, q } = parseRoute(), v = $('#view');
    $$('.nav a').forEach(a => a.classList.toggle('on', (parts[0] === 'loja' && a.dataset.cat === (q.get('cat') || '')) || (parts[0] === 'looks' && a.dataset.cat === 'looks')));
    window.scrollTo(0, 0);
    if (!DB.listProducts) { viewSetup(v); return; }
    try {
      switch (parts[0]) {
        case undefined: viewHome(v); break;
        case 'loja': viewShop(v, q); break;
        case 'looks': viewLooks(v); break;
        case 'p': viewProduct(v, decodeURIComponent(parts[1] || '')); break;
        case 'checkout': viewCheckout(v); break;
        case 'pedido': await viewOrder(v, parts[1], q); break;
        case 'conta': await viewAccount(v, q); break;
        case 'ajuda': viewHelp(v, parts[1]); break;
        case 'admin': await viewAdmin(v, q); break;
        default: v.innerHTML = notFound();
      }
      document.title = (($('h1', v) || {}).textContent || 'Casa Lapela') + (parts[0] ? ' · Casa Lapela' : ' · Ternos, gravatas e acessórios');
      if (!parts[0]) document.title = 'Casa Lapela · Ternos, gravatas e acessórios';
    } catch (e) {
      v.innerHTML = `<section class="wrap empty"><h1>Não foi possível abrir esta página</h1><p class="muted">${esc(e.message)}</p><a class="btn" href="#/">Voltar ao início</a></section>`;
    }
  }
  async function loadProducts() {
    S.products = (await DB.listProducts()).map(p => ({ ...p, variants: [...p.variants].sort(bySize) }));
    const before = S.cart.length;
    S.cart = S.cart.filter(c => S.products.some(p => p.id === c.product_id && p.variants.some(v => v.id === c.variant_id)));
    if (S.cart.length !== before) saveCart();
  }

  function bindSearch() {
    const bar = $('#search-bar'), btn = $('#search-btn');
    btn.addEventListener('click', () => { bar.hidden = !bar.hidden; btn.setAttribute('aria-expanded', String(!bar.hidden)); if (!bar.hidden) $('#search-q').focus(); });
    bar.addEventListener('submit', e => { e.preventDefault(); const t = $('#search-q').value.trim(); bar.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (t) go('#/loja?q=' + encodeURIComponent(t)); });
  }
  document.addEventListener('click', e => { const c = e.target.closest('[data-close-dlg]'); if (c) { const d = c.closest('dialog'); if (d) d.close(); } });

  async function boot() {
    bindCart(); bindSearch(); renderFooter();
    if (DB.mode === 'preview') $('#preview-bar').hidden = false;
    if (!DB.listProducts) { renderCartBadge(); render(); return; }
    const url = new URLSearchParams(location.search);
    try {
      S.categories = await DB.listCategories();
      await loadProducts();
      S.user = await DB.currentUser();
    } catch (e) {
      $('#view').innerHTML = `<section class="wrap empty"><h1>Não foi possível carregar a loja</h1><p class="muted">${esc(e.message)}</p><button class="btn" type="button" onclick="location.reload()">Tentar de novo</button></section>`;
      return;
    }
    DB.onAuth(async (event) => {
      if (event === 'PASSWORD_RECOVERY') go('#/conta?tab=nova-senha');
      if (event === 'SIGNED_OUT') { S.user = null; renderHeader(); }
    });
    if (url.has('recuperar') || url.has('confirmado') || url.has('code')) {
      history.replaceState(null, '', location.pathname + location.hash);
      if (url.has('recuperar') && S.user) location.hash = '#/conta?tab=nova-senha';
      else if (url.has('confirmado') && S.user) { toast('E-mail confirmado. Bem-vindo à Casa Lapela!'); if (!location.hash) location.hash = '#/conta'; }
    }
    renderHeader();
    window.addEventListener('hashchange', render);
    render();
  }
  boot();
})();
