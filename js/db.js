/* Camada de dados da loja.
   O site usa o banco Supabase configurado em js/config.js.
   O adaptador "preview" existe só para a prévia de layout (window.LAPELA_PREVIEW),
   nunca é usado no site publicado. */
(function () {
  const cfg = window.LAPELA_CONFIG || {};
  const PAYS = ['pix', 'cartao', 'boleto'];
  const FREE_SHIP = 999, SHIP_COST = 39.9;
  const round2 = n => Math.round(n * 100) / 100;
  const clone = o => JSON.parse(JSON.stringify(o));
  const bySize = (a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0);
  const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const baseUrl = () => location.href.split('#')[0].split('?')[0];

  /* ================= Supabase (site real) ================= */
  function supabaseAdapter() {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
    });
    const friendly = m => {
      m = String(m || '');
      if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
      if (/already registered/i.test(m)) return 'Este e-mail já tem cadastro. Entre com sua senha.';
      if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
      if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
      if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
      if (/same.*password|different from the old/i.test(m)) return 'A nova senha precisa ser diferente da atual.';
      if (/duplicate key.*slug/i.test(m)) return 'Já existe um produto com esse nome.';
      if (/duplicate key.*coupons/i.test(m)) return 'Já existe um cupom com esse código.';
      if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com a loja. Confira sua internet e tente de novo.';
      return m;
    };
    const chk = ({ data, error }) => { if (error) throw new Error(friendly(error.message)); return data; };
    const norm = p => ({
      ...p, category: p.category ? p.category.slug : null, price: +p.price,
      compare_at_price: p.compare_at_price ? +p.compare_at_price : null,
      variants: (p.variants || []).sort(bySize)
    });
    const normOrder = o => ({ ...o, items: (o.items || []).map(i => ({ ...i, unit_price: +i.unit_price })) });
    async function profile(user) {
      if (!user) return null;
      const { data } = await sb.from('profiles').select('full_name,is_admin').eq('id', user.id).maybeSingle();
      return { id: user.id, email: user.email, full_name: (data && data.full_name) || (user.user_metadata || {}).full_name || '', is_admin: !!(data && data.is_admin) };
    }
    const PRODUCT_COLS = '*, category:categories(slug,name), variants:product_variants(id,size,stock,sku)';
    const ORDER_COLS = '*, items:order_items(*)';

    return {
      mode: 'supabase',
      payments: !!cfg.MERCADO_PAGO,
      onAuth(cb) { sb.auth.onAuthStateChange((event, session) => cb(event, session)); },
      async listCategories() { return chk(await sb.from('categories').select('slug,name,sort').order('sort')); },
      async listProducts({ includeInactive } = {}) {
        let q = sb.from('products').select(PRODUCT_COLS).order('created_at', { ascending: false });
        if (!includeInactive) q = q.eq('active', true);
        return chk(await q).map(norm);
      },
      async currentUser() { const { data } = await sb.auth.getSession(); return profile(data.session && data.session.user); },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email: String(email).trim(), password });
        if (error) throw new Error(friendly(error.message));
        return profile(data.user);
      },
      async signUp({ email, password, full_name }) {
        const { data, error } = await sb.auth.signUp({
          email: String(email).trim(), password,
          options: { data: { full_name: full_name.trim() }, emailRedirectTo: baseUrl() + '?confirmado=1' }
        });
        if (error) throw new Error(friendly(error.message));
        if (!data.session) return { needsConfirm: true };
        return profile(data.user);
      },
      async signOut() { await sb.auth.signOut(); },
      async resetPassword(email) {
        const { error } = await sb.auth.resetPasswordForEmail(String(email).trim(), { redirectTo: baseUrl() + '?recuperar=1' });
        if (error) throw new Error(friendly(error.message));
      },
      async updatePassword(password) {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw new Error(friendly(error.message));
      },
      async subscribe(email) {
        const { error } = await sb.from('newsletter').insert({ email: String(email).trim().toLowerCase() });
        if (error && error.code !== '23505') throw new Error(/check/i.test(error.message) ? 'Digite um e-mail válido.' : friendly(error.message));
      },
      async validateCoupon(code) {
        const pct = chk(await sb.rpc('validate_coupon', { p_code: code }));
        if (!pct) throw new Error('Cupom inválido ou expirado.');
        return { code: String(code).trim().toUpperCase(), percent_off: pct };
      },
      async createOrder({ items, shipping, payment, coupon }) {
        return chk(await sb.rpc('create_order', { p_items: items, p_shipping: shipping, p_payment: payment, p_coupon: coupon }));
      },
      async startPayment(orderId) {
        const { data, error } = await sb.functions.invoke('criar-pagamento', { body: { order_id: orderId, return_url: baseUrl() } });
        if (error) {
          let msg = 'Não foi possível abrir o pagamento agora.';
          try { const b = await error.context.json(); if (b && b.error) msg = b.error; } catch (_) { }
          throw new Error(msg);
        }
        if (!data || !data.url) throw new Error('Não foi possível abrir o pagamento agora.');
        return data.url;
      },
      async myOrders() {
        const { data } = await sb.auth.getUser();
        return chk(await sb.from('orders').select(ORDER_COLS).eq('user_id', data.user.id).order('created_at', { ascending: false })).map(normOrder);
      },
      async getOrder(id) { return normOrder(chk(await sb.from('orders').select(ORDER_COLS).eq('id', id).single())); },

      /* painel */
      async adminOrders() { return chk(await sb.from('orders').select(ORDER_COLS).order('created_at', { ascending: false })).map(normOrder); },
      async updateOrderStatus(id, status) { chk(await sb.from('orders').update({ status }).eq('id', id)); },
      async listCoupons() { return chk(await sb.from('coupons').select('*').order('code')); },
      async saveCoupon(c) {
        chk(await sb.from('coupons').upsert({ code: c.code, percent_off: c.percent_off, active: c.active, expires_at: c.expires_at || null }));
      },
      async listNewsletter() { return chk(await sb.from('newsletter').select('*').order('created_at', { ascending: false })); },
      async uploadImage(file, name) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${slugify(name || 'produto')}-${Date.now().toString(36)}.${ext}`;
        chk(await sb.storage.from('produtos').upload(path, file, { contentType: file.type, upsert: false }));
        return sb.storage.from('produtos').getPublicUrl(path).data.publicUrl;
      },
      async saveProduct(p) {
        const cat = chk(await sb.from('categories').select('id').eq('slug', p.category).single());
        const row = {
          name: p.name, category_id: cat.id, price: p.price, compare_at_price: p.compare_at_price || null,
          description: p.description, fabric: p.fabric, details: p.details, art: p.art,
          image_url: p.image_url || null, active: p.active, featured: p.featured
        };
        let id = p.id, slug = p.slug;
        if (id) chk(await sb.from('products').update(row).eq('id', id));
        else {
          slug = slugify(p.name);
          id = chk(await sb.from('products').insert({ ...row, slug }).select('id').single()).id;
        }
        for (const v of p.variants) {
          if (v.id) chk(await sb.from('product_variants').update({ stock: v.stock }).eq('id', v.id));
          else chk(await sb.from('product_variants').insert({ product_id: id, size: v.size, stock: v.stock, sku: (slug + '-' + v.size).toUpperCase() }));
        }
      }
    };
  }

  /* ================= Prévia de layout (sem banco) ================= */
  function previewAdapter() {
    const KEY = 'lapela_preview_v2';
    let mem = null;
    function seed() {
      const s = window.LAPELA_SEED, now = Date.now();
      return {
        products: s.products.map((p, i) => ({
          id: 'p-' + p.slug, slug: p.slug, name: p.name, category: p.category, price: p.price, compare_at_price: p.compare_at_price || null,
          description: p.description, fabric: p.fabric, details: p.details || {}, art: p.art, image_url: null, active: true, featured: !!p.featured,
          created_at: new Date(now - i * 864e5).toISOString(),
          variants: Object.entries(p.sizes).map(([size, stock]) => ({ id: 'v-' + p.slug + '-' + size, size, stock }))
        })),
        categories: clone(s.categories), coupons: s.coupons.map(c => ({ ...c, active: true, expires_at: null })),
        users: [{ id: 'u-admin', email: 'admin@casalapela.com.br', password: 'admin123', full_name: 'Equipe Casa Lapela', is_admin: true }],
        newsletter: [], session: null, orders: [], seq: 1000
      };
    }
    const load = () => { if (mem) return mem; try { const r = localStorage.getItem(KEY); if (r) mem = JSON.parse(r); } catch (e) { } return mem || (mem = seed()); };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { } };
    const me = () => { const d = load(), u = d.users.find(u => u.id === d.session); return u ? { id: u.id, email: u.email, full_name: u.full_name, is_admin: !!u.is_admin } : null; };
    const admin = () => { const u = me(); if (!u || !u.is_admin) throw new Error('Acesso restrito à equipe da loja.'); };
    const coupon = code => load().coupons.find(c => c.code === String(code).trim().toUpperCase() && c.active && (!c.expires_at || new Date(c.expires_at) > new Date()));
    return {
      mode: 'preview', payments: false,
      onAuth() { },
      async listCategories() { return clone(load().categories); },
      async listProducts({ includeInactive } = {}) { return clone(load().products.filter(p => includeInactive || p.active)); },
      async currentUser() { return me(); },
      async signIn(email, password) { const d = load(), u = d.users.find(u => u.email === String(email).trim().toLowerCase()); if (!u || u.password !== password) throw new Error('E-mail ou senha incorretos.'); d.session = u.id; save(); return me(); },
      async signUp({ email, password, full_name }) {
        const d = load(); email = String(email).trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Digite um e-mail válido.');
        if (d.users.some(u => u.email === email)) throw new Error('Este e-mail já tem cadastro. Entre com sua senha.');
        if (String(password).length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
        d.users.push({ id: 'u-' + Date.now().toString(36), email, password, full_name: full_name.trim(), is_admin: false });
        d.session = d.users[d.users.length - 1].id; save(); return me();
      },
      async signOut() { load().session = null; save(); },
      async resetPassword() { },
      async updatePassword() { },
      async subscribe(email) { if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Digite um e-mail válido.'); const d = load(); if (!d.newsletter.some(n => n.email === email)) d.newsletter.unshift({ email, created_at: new Date().toISOString() }); save(); },
      async validateCoupon(code) { const c = coupon(code); if (!c) throw new Error('Cupom inválido ou expirado.'); return { code: c.code, percent_off: c.percent_off }; },
      async createOrder({ items, shipping, payment, coupon: code }) {
        const d = load(), u = me();
        if (!u) throw new Error('Entre na sua conta para finalizar a compra.');
        if (!PAYS.includes(payment)) throw new Error('Forma de pagamento inválida.');
        let pct = 0; if (code) { const c = coupon(code); if (!c) throw new Error('Cupom inválido ou expirado.'); pct = c.percent_off; }
        const lines = items.map(it => {
          for (const p of d.products) { const v = p.variants.find(v => v.id === it.variant_id); if (!v) continue; if (v.stock < it.quantity) throw new Error(`Estoque insuficiente para ${p.name} (tam. ${v.size}). Disponível: ${v.stock}.`); return { p, v, q: it.quantity }; }
          throw new Error('Um dos produtos da sacola não está mais disponível.');
        });
        lines.forEach(l => { l.v.stock -= l.q; });
        const subtotal = round2(lines.reduce((s, l) => s + l.p.price * l.q, 0)), discount = round2(subtotal * pct / 100), shipping_cost = subtotal >= FREE_SHIP ? 0 : SHIP_COST;
        const o = { id: 'o-' + Date.now().toString(36), number: ++d.seq, user_id: u.id, status: 'aguardando_pagamento', subtotal, discount, shipping_cost, total: round2(subtotal - discount + shipping_cost), coupon_code: pct ? String(code).toUpperCase() : null, payment_method: payment, shipping, created_at: new Date().toISOString(), items: lines.map(l => ({ product_id: l.p.id, variant_id: l.v.id, product_name: l.p.name, size: l.v.size, unit_price: l.p.price, quantity: l.q })) };
        d.orders.push(o); save(); return clone(o);
      },
      async startPayment() { throw new Error('Na prévia não há cobrança.'); },
      async myOrders() { const u = me(); return clone(load().orders.filter(o => u && o.user_id === u.id)).reverse(); },
      async getOrder(id) { const u = me(), o = load().orders.find(o => o.id === id); if (!o || !u || (o.user_id !== u.id && !u.is_admin)) throw new Error('Pedido não encontrado.'); return clone(o); },
      async adminOrders() { admin(); return clone(load().orders).reverse(); },
      async updateOrderStatus(id, status) {
        admin(); const d = load(), o = d.orders.find(o => o.id === id);
        if (o.status === 'cancelado') throw new Error('Pedido cancelado não pode ser reaberto.');
        if (status === 'cancelado') o.items.forEach(i => d.products.forEach(p => p.variants.forEach(v => { if (v.id === i.variant_id) v.stock += i.quantity; })));
        o.status = status; save();
      },
      async listCoupons() { admin(); return clone(load().coupons); },
      async saveCoupon(c) { admin(); const d = load(), ex = d.coupons.find(x => x.code === c.code); if (ex) Object.assign(ex, c); else d.coupons.push(c); save(); },
      async listNewsletter() { admin(); return clone(load().newsletter); },
      async uploadImage(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Não foi possível ler a foto.')); r.readAsDataURL(file); }); },
      async saveProduct(p) {
        admin(); const d = load(); let prod = p.id && d.products.find(x => x.id === p.id);
        if (!prod) { let slug = slugify(p.name) || 'produto', n = 2; while (d.products.some(x => x.slug === slug)) slug = slugify(p.name) + '-' + n++; prod = { id: 'p-' + slug, slug, created_at: new Date().toISOString(), variants: [] }; d.products.push(prod); }
        Object.assign(prod, { name: p.name, category: p.category, price: p.price, compare_at_price: p.compare_at_price || null, description: p.description, fabric: p.fabric, details: p.details, art: p.art, image_url: p.image_url || null, active: p.active, featured: p.featured });
        p.variants.forEach(v => { const ex = v.id && prod.variants.find(x => x.id === v.id); if (ex) ex.stock = v.stock; else if (!prod.variants.some(x => x.size === v.size)) prod.variants.push({ id: 'v-' + prod.slug + '-' + v.size, size: v.size, stock: v.stock }); });
        save();
      }
    };
  }

  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  if (configured && window.supabase) window.DB = supabaseAdapter();
  else if (window.LAPELA_PREVIEW) window.DB = previewAdapter();
  else window.DB = { mode: configured ? 'offline' : 'unconfigured' };
  window.DB.FREE_SHIP = FREE_SHIP;
  window.DB.SHIP_COST = SHIP_COST;
})();
