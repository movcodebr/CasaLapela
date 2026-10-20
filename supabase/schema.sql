-- =============================================================
-- Casa Lapela — banco de dados (Supabase / PostgreSQL)
-- Rode este arquivo inteiro no SQL Editor do Supabase e depois
-- rode supabase/seed.sql para carregar o catálogo inicial.
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Tabelas ----------

create table if not exists public.categories (
  id    serial primary key,
  slug  text not null unique,
  name  text not null,
  sort  int  not null default 0
);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  category_id      int  not null references public.categories(id),
  description      text not null default '',
  price            numeric(10,2) not null check (price > 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price > price),
  fabric           text not null default '',
  details          jsonb not null default '{}'::jsonb,   -- ficha técnica: {"Composição": "...", ...}
  art              jsonb,                                -- ilustração gerada (cor, padrão, lapela)
  image_url        text,                                 -- foto real; se preenchida, substitui a ilustração
  active           boolean not null default true,
  featured         boolean not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text not null,                 -- 46..56 para ternos, "Único" para gravatas
  sku         text unique,
  stock       int  not null default 0 check (stock >= 0),
  unique (product_id, size)
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.coupons (
  code        text primary key,
  percent_off int  not null check (percent_off between 1 and 90),
  active      boolean not null default true,
  expires_at  timestamptz
);

do $$ begin
  create type public.order_status as enum
    ('aguardando_pagamento','pago','em_separacao','enviado','entregue','cancelado');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  number          bigint generated always as identity (start with 1001) unique,
  user_id         uuid not null references auth.users(id),
  status          public.order_status not null default 'aguardando_pagamento',
  subtotal        numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  shipping_cost   numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  coupon_code     text,
  payment_method  text not null check (payment_method in ('pix','cartao','boleto')),
  shipping        jsonb not null,             -- nome, e-mail, telefone, endereço, observações
  created_at      timestamptz not null default now()
);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_name  text not null,
  size          text not null,
  unit_price    numeric(10,2) not null,
  quantity      int not null check (quantity > 0)
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_variants_product  on public.product_variants(product_id);
create index if not exists idx_orders_user       on public.orders(user_id, created_at desc);
create index if not exists idx_items_order       on public.order_items(order_id);

-- ---------- Funções auxiliares ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Valida cupom sem expor a tabela de cupons
create or replace function public.validate_coupon(p_code text)
returns int language sql stable security definer set search_path = public as $$
  select percent_off from public.coupons
   where upper(code) = upper(trim(p_code))
     and active
     and (expires_at is null or expires_at > now())
$$;

-- Cria o pedido no servidor: confere estoque, calcula preços
-- a partir do banco (o navegador não define valores) e baixa o estoque.
create or replace function public.create_order(
  p_items    jsonb,      -- [{"variant_id": "...", "quantity": 1}, ...]
  p_shipping jsonb,
  p_payment  text,
  p_coupon   text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid      uuid := auth.uid();
  v_order    public.orders;
  v_line     record;
  v_var      record;
  v_subtotal numeric(10,2) := 0;
  v_pct      int := 0;
  v_discount numeric(10,2);
  v_ship     numeric(10,2);
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para finalizar a compra.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sua sacola está vazia.';
  end if;
  if p_payment not in ('pix','cartao','boleto') then
    raise exception 'Forma de pagamento inválida.';
  end if;
  if coalesce(trim(p_shipping->>'name'), '') = '' or coalesce(trim(p_shipping->>'cep'), '') = '' then
    raise exception 'Preencha o endereço de entrega.';
  end if;

  if coalesce(trim(p_coupon), '') <> '' then
    v_pct := public.validate_coupon(p_coupon);
    if v_pct is null then
      raise exception 'Cupom inválido ou expirado.';
    end if;
  end if;

  insert into public.orders (user_id, payment_method, shipping, coupon_code)
  values (v_uid, p_payment, p_shipping, case when v_pct > 0 then upper(trim(p_coupon)) end)
  returning * into v_order;

  for v_line in
    select (e->>'variant_id')::uuid as variant_id, sum((e->>'quantity')::int) as qty
      from jsonb_array_elements(p_items) e
     group by 1
     order by 1
  loop
    if v_line.qty is null or v_line.qty < 1 or v_line.qty > 10 then
      raise exception 'Quantidade inválida.';
    end if;

    select v.id, v.size, v.stock, p.id as product_id, p.name, p.price
      into v_var
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = v_line.variant_id and p.active
       for update of v;

    if not found then
      raise exception 'Um dos produtos da sacola não está mais disponível.';
    end if;
    if v_var.stock < v_line.qty then
      raise exception 'Estoque insuficiente para % (tam. %). Disponível: %.', v_var.name, v_var.size, v_var.stock;
    end if;

    update public.product_variants set stock = stock - v_line.qty where id = v_var.id;

    insert into public.order_items (order_id, product_id, variant_id, product_name, size, unit_price, quantity)
    values (v_order.id, v_var.product_id, v_var.id, v_var.name, v_var.size, v_var.price, v_line.qty);

    v_subtotal := v_subtotal + v_var.price * v_line.qty;
  end loop;

  v_discount := round(v_subtotal * v_pct / 100.0, 2);
  v_ship     := case when v_subtotal >= 999 then 0 else 39.90 end;   -- frete grátis acima de R$ 999

  update public.orders
     set subtotal = v_subtotal, discount = v_discount, shipping_cost = v_ship,
         total = v_subtotal - v_discount + v_ship
   where id = v_order.id
  returning * into v_order;

  return v_order;
end $$;

-- Cancelar devolve o estoque; pedido cancelado não pode ser reaberto
create or replace function public.on_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'cancelado' and new.status <> 'cancelado' then
    raise exception 'Pedido cancelado não pode ser reaberto.';
  end if;
  if new.status = 'cancelado' and old.status <> 'cancelado' then
    update public.product_variants v
       set stock = v.stock + i.qty
      from (select variant_id, sum(quantity) as qty
              from public.order_items
             where order_id = new.id and variant_id is not null
             group by variant_id) i
     where v.id = i.variant_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_order_status on public.orders;
create trigger trg_order_status
  before update of status on public.orders
  for each row execute function public.on_order_status_change();

-- ---------- Segurança (Row Level Security) ----------

alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.profiles         enable row level security;
alter table public.coupons          enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- Catálogo: todos leem; só admin escreve
drop policy if exists "categorias visíveis" on public.categories;
create policy "categorias visíveis" on public.categories for select using (true);
drop policy if exists "admin gerencia categorias" on public.categories;
create policy "admin gerencia categorias" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "produtos ativos visíveis" on public.products;
create policy "produtos ativos visíveis" on public.products for select
  using (active or public.is_admin());
drop policy if exists "admin gerencia produtos" on public.products;
create policy "admin gerencia produtos" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "variantes visíveis" on public.product_variants;
create policy "variantes visíveis" on public.product_variants for select
  using (exists (select 1 from public.products p
                  where p.id = product_id and (p.active or public.is_admin())));
drop policy if exists "admin gerencia variantes" on public.product_variants;
create policy "admin gerencia variantes" on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Perfis: cada um vê e edita o seu (sem poder virar admin)
drop policy if exists "perfil próprio" on public.profiles;
create policy "perfil próprio" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "atualiza perfil próprio" on public.profiles;
create policy "atualiza perfil próprio" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Cupons: só admin lê a tabela; clientes validam pela função
drop policy if exists "admin gerencia cupons" on public.coupons;
create policy "admin gerencia cupons" on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Pedidos: cliente vê os seus; admin vê todos e muda status.
-- Ninguém insere direto: pedidos nascem só pela função create_order.
drop policy if exists "pedidos do cliente" on public.orders;
create policy "pedidos do cliente" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin atualiza pedidos" on public.orders;
create policy "admin atualiza pedidos" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "itens do cliente" on public.order_items;
create policy "itens do cliente" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o
                  where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- Permissões das funções
revoke execute on function public.create_order(jsonb, jsonb, text, text) from public, anon;
grant  execute on function public.create_order(jsonb, jsonb, text, text) to authenticated;
grant  execute on function public.validate_coupon(text) to anon, authenticated;
grant  execute on function public.is_admin() to anon, authenticated;

-- ---------- Newsletter ----------

create table if not exists public.newsletter (
  email       text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at  timestamptz not null default now()
);
alter table public.newsletter enable row level security;
drop policy if exists "qualquer um assina" on public.newsletter;
create policy "qualquer um assina" on public.newsletter for insert to anon, authenticated with check (true);
drop policy if exists "admin lê assinantes" on public.newsletter;
create policy "admin lê assinantes" on public.newsletter for select to authenticated using (public.is_admin());

-- ---------- Pagamento (Mercado Pago) ----------
-- Guarda o id do pagamento no provedor; preenchido pelas Edge Functions.
alter table public.orders add column if not exists payment_id text;
alter table public.orders add column if not exists paid_at timestamptz;

-- ---------- Fotos dos produtos (Supabase Storage) ----------
-- Bucket público para leitura; só administradores enviam ou apagam.
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true)
    on conflict (id) do nothing;

    drop policy if exists "fotos públicas" on storage.objects;
    create policy "fotos públicas" on storage.objects for select using (bucket_id = 'produtos');
    drop policy if exists "admin envia fotos" on storage.objects;
    create policy "admin envia fotos" on storage.objects for insert to authenticated
      with check (bucket_id = 'produtos' and public.is_admin());
    drop policy if exists "admin troca fotos" on storage.objects;
    create policy "admin troca fotos" on storage.objects for update to authenticated
      using (bucket_id = 'produtos' and public.is_admin());
    drop policy if exists "admin apaga fotos" on storage.objects;
    create policy "admin apaga fotos" on storage.objects for delete to authenticated
      using (bucket_id = 'produtos' and public.is_admin());
  end if;
end $$;

-- =============================================================
-- Para tornar uma conta administradora (depois de criá-la no site):
--   update public.profiles set is_admin = true
--    where id = (select id from auth.users where email = 'seu-email@exemplo.com');
-- =============================================================
