// Recebe os avisos do Mercado Pago e marca o pedido como pago.
// Deploy: supabase functions deploy mp-webhook --no-verify-jwt
// O aviso em si não é confiável: o pagamento é sempre conferido direto na API do Mercado Pago.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

Deno.serve(async (req) => {
  const token = Deno.env.get('MP_ACCESS_TOKEN');
  if (!token) return new Response('sem token', { status: 500 });

  const url = new URL(req.url);
  let id = url.searchParams.get('data.id') ?? url.searchParams.get('id');
  let type = url.searchParams.get('type') ?? url.searchParams.get('topic');
  try {
    const body = await req.json();
    id = body?.data?.id ?? id;
    type = body?.type ?? body?.topic ?? type;
  } catch { /* aviso sem corpo */ }

  if (type !== 'payment' || !id) return new Response('ignorado', { status: 200 });

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(id))}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return new Response('falha ao consultar pagamento', { status: 502 }); // o Mercado Pago tenta de novo
  const pay = await r.json();

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: order } = await admin.from('orders')
    .select('id,status,total').eq('id', pay.external_reference).maybeSingle();
  if (!order) return new Response('pedido não encontrado', { status: 200 });

  const valorConfere = Math.abs(Number(pay.transaction_amount) - Number(order.total)) < 0.01;
  if (pay.status === 'approved' && order.status === 'aguardando_pagamento' && valorConfere) {
    await admin.from('orders')
      .update({ status: 'pago', payment_id: String(pay.id), paid_at: new Date().toISOString() })
      .eq('id', order.id);
  } else if (!valorConfere) {
    console.error('Valor pago diferente do pedido', pay.id, pay.transaction_amount, order.total);
  }
  return new Response('ok', { status: 200 });
});
