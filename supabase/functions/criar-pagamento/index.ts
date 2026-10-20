// Cria a cobrança no Mercado Pago (Checkout Pro) para um pedido do cliente logado.
// Deploy: supabase functions deploy criar-pagamento
// Segredo necessário: supabase secrets set MP_ACCESS_TOKEN=APP_USR-...
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Formas de pagamento que ficam fora do checkout conforme a escolha do cliente
const EXCLUDE: Record<string, { id: string }[]> = {
  pix: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }],
  boleto: [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'bank_transfer' }],
  cartao: [{ id: 'ticket' }, { id: 'bank_transfer' }],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const token = Deno.env.get('MP_ACCESS_TOKEN');
    if (!token) return json({ error: 'O pagamento online ainda não foi configurado pela loja.' }, 500);

    const { order_id, return_url } = await req.json();
    if (!order_id) return json({ error: 'Pedido não informado.' }, 400);

    // Lê o pedido como o próprio cliente: as regras do banco garantem que ele só vê os seus.
    const asUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: order, error } = await asUser.from('orders').select('*').eq('id', order_id).single();
    if (error || !order) return json({ error: 'Pedido não encontrado.' }, 404);
    if (order.status !== 'aguardando_pagamento') return json({ error: 'Este pedido não está aguardando pagamento.' }, 400);

    const back = `${String(return_url || '').split('#')[0]}#/pedido/${order.id}`;
    const preference = {
      items: [{
        id: String(order.number),
        title: `Pedido nº ${order.number} – Casa Lapela`,
        quantity: 1,
        unit_price: Number(order.total),
        currency_id: 'BRL',
      }],
      external_reference: order.id,
      payer: { email: order.shipping?.email, name: order.shipping?.name },
      back_urls: { success: back, pending: back, failure: back },
      auto_return: 'approved',
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: 'CASA LAPELA',
      payment_methods: { installments: 10, excluded_payment_types: EXCLUDE[order.payment_method] ?? [] },
    };

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });
    const pref = await r.json();
    if (!r.ok) {
      console.error('Mercado Pago recusou a preferência', pref);
      return json({ error: 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.' }, 502);
    }
    return json({ url: pref.init_point });
  } catch (e) {
    console.error(e);
    return json({ error: 'Erro ao iniciar o pagamento.' }, 500);
  }
});
