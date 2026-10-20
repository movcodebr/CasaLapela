/* Configuração da loja.
   SUPABASE_URL e SUPABASE_ANON_KEY: Project Settings → API no painel do Supabase.
   A chave "anon" é pública por natureza: a segurança fica nas regras (RLS) do banco. */
window.LAPELA_CONFIG = {
  SUPABASE_URL: 'https://erhcotgpkgtdbgijtmkk.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_66um_XHXk4jOrtnHF0tqlw_eFZTHs2m',

  // true depois de publicar as funções criar-pagamento e mp-webhook (veja o README)
  MERCADO_PAGO: false,

  // Dados que aparecem no rodapé e nas páginas de ajuda
  STORE: {
    name: 'Casa Lapela',
    whatsapp: '(16) 99999-0000',
    email: 'contato@casalapela.com.br',
    cnpj: '00.000.000/0001-00',
    address: 'Rua Exemplo, 100 – Centro, Cidade/UF',
    hours: 'Seg. a sex., 9h às 18h · sáb., 9h às 13h'
  }
};
