// Gera supabase/seed.sql a partir de js/seed.js
// Uso: node scripts/gerar-seed.js
const path = require('path');
const fs = require('fs');
require(path.join(__dirname, '..', 'js', 'seed.js'));
const S = globalThis.LAPELA_SEED;

const q = v => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const j = v => `${q(JSON.stringify(v))}::jsonb`;
const out = ['-- Catálogo inicial da Casa Lapela (gerado por scripts/gerar-seed.js)', 'begin;', ''];

for (const c of S.categories)
  out.push(`insert into public.categories (slug, name, sort) values (${q(c.slug)}, ${q(c.name)}, ${c.sort}) on conflict (slug) do nothing;`);
out.push('');

for (const p of S.products) {
  out.push(`insert into public.products (slug, name, category_id, description, price, compare_at_price, fabric, details, art, featured)
select ${q(p.slug)}, ${q(p.name)}, id, ${q(p.description)}, ${p.price}, ${p.compare_at_price || 'null'}, ${q(p.fabric)}, ${j(p.details)}, ${j(p.art)}, ${!!p.featured}
  from public.categories where slug = ${q(p.category)}
on conflict (slug) do nothing;`);
  for (const [size, stock] of Object.entries(p.sizes)) {
    const sku = (p.slug + '-' + (size === 'Único' ? 'U' : size)).toUpperCase();
    out.push(`insert into public.product_variants (product_id, size, sku, stock)
select id, ${q(size)}, ${q(sku)}, ${stock} from public.products where slug = ${q(p.slug)}
on conflict (product_id, size) do nothing;`);
  }
  out.push('');
}

for (const c of S.coupons)
  out.push(`insert into public.coupons (code, percent_off) values (${q(c.code)}, ${c.percent_off}) on conflict (code) do nothing;`);
out.push('', 'commit;', '');

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed.sql'), out.join('\n'));
console.log('supabase/seed.sql gerado com', S.products.length, 'produtos');
