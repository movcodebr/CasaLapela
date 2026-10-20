# Casa Lapela — loja de ternos e gravatas

E-commerce completo: HTML, CSS e JavaScript no navegador, banco de dados **Supabase** (PostgreSQL + login + fotos) e pagamento pelo **Mercado Pago** (PIX, cartão em até 10x e boleto). Hospeda em qualquer serviço estático: Netlify, Vercel ou GitHub Pages.

O site não tem modo de demonstração: sem o banco configurado ele mostra uma tela pedindo a configuração, em vez de uma loja falsa.

## O que a loja faz

**Para o cliente**
- Vitrine com destaques, categorias, busca no cabeçalho, filtros e ordenação.
- Página do produto com tamanhos (46 a 56) e estoque real, guia de medidas, ficha técnica.
- **Looks prontos**: terno + gravata + acessório, adicionados de uma vez.
- Sacola com barra de frete grátis (acima de R$ 999).
- Checkout com CEP automático (ViaCEP), cupom, observações para ajuste de barra e manga.
- Pagamento no Mercado Pago, com confirmação automática do pedido.
- Conta: cadastro com confirmação por e-mail, login, **esqueci minha senha**, troca de senha, histórico e acompanhamento do pedido.
- Newsletter, páginas de trocas (com o direito de arrependimento do CDC), privacidade (LGPD), termos e contato.

**Para a equipe** (`#/admin`, só para contas administradoras)
- Faturamento, pedidos aguardando pagamento, pedidos para despachar, alerta de estoque baixo.
- Pedidos filtrados por status; mudar status; cancelar devolve o estoque.
- Produtos: criar, editar, preço, estoque por tamanho, ocultar, destacar, **enviar foto**.
- Cupons: criar com validade, pausar e reativar.
- Lista de assinantes da newsletter, com botão para copiar os e-mails.

## Estrutura

```
index.html                      página única (rotas por #hash)
css/styles.css                  visual
js/config.js                    ← você edita: Supabase, Mercado Pago, dados da loja
js/app.js                       telas e regras
js/db.js                        acesso ao banco
js/art.js                       ilustrações das peças (usadas quando não há foto)
js/seed.js                      catálogo inicial
supabase/schema.sql             tabelas, segurança, funções, bucket de fotos
supabase/seed.sql               16 produtos e 2 cupons iniciais
supabase/functions/             criar-pagamento e mp-webhook (Mercado Pago)
```

## Colocar no ar

### 1. Banco de dados (Supabase, plano grátis)
1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor**: rode `supabase/schema.sql` inteiro e depois `supabase/seed.sql`.
3. **Project Settings → API**: copie a *Project URL* e a chave *anon public* para `js/config.js`.
4. **Authentication → URL Configuration**: em *Site URL* coloque o endereço do site (ex.: `https://casalapela.netlify.app`) e adicione o mesmo endereço em *Redirect URLs*. É o que faz os links de confirmação e de nova senha voltarem para a loja.
5. Abra a loja, crie sua conta e torne-a administradora no SQL Editor:
   ```sql
   update public.profiles set is_admin = true
    where id = (select id from auth.users where email = 'seu-email@exemplo.com');
   ```

### 2. Pagamento (Mercado Pago)
1. Crie uma aplicação em <https://www.mercadopago.com.br/developers/panel> e copie o **Access Token** de produção (comece com o de teste para validar).
2. Instale a CLI do Supabase e publique as funções:
   ```bash
   supabase login
   supabase link --project-ref SEU_PROJECT_REF
   supabase secrets set MP_ACCESS_TOKEN=APP_USR-...
   supabase functions deploy criar-pagamento
   supabase functions deploy mp-webhook --no-verify-jwt
   ```
3. Em `js/config.js`, troque `MERCADO_PAGO: false` por `true`.

Como funciona: o cliente confirma o pedido → a função `criar-pagamento` cria a cobrança com o **total calculado pelo banco** → o cliente paga no Mercado Pago → o Mercado Pago avisa a função `mp-webhook`, que **confere o pagamento direto na API** e o valor antes de marcar o pedido como pago. O token do Mercado Pago fica só no servidor.

Sem o Mercado Pago ligado, a loja funciona normalmente: o pedido fica reservado como "Aguardando pagamento" e a equipe combina o pagamento com o cliente e muda o status no painel.

### 3. Dados da loja
Em `js/config.js`, preencha `STORE`: WhatsApp, e-mail, CNPJ, endereço e horário. Eles aparecem no rodapé e nas páginas de ajuda. Revise os textos de trocas, privacidade e termos em `js/app.js` (função `viewHelp`) com as regras reais da sua empresa.

### 4. Hospedagem
- **Netlify**: arraste a pasta em <https://app.netlify.com/drop>.
- **GitHub Pages**: suba a pasta num repositório e ative em *Settings → Pages*.

Depois de publicar, confira se o endereço final é o mesmo cadastrado no passo 1.4.

## Segurança

- Preço, desconto e frete são calculados **no banco** (`create_order`); o navegador só informa tamanhos e quantidades.
- O estoque é travado durante a compra: duas pessoas não levam a última peça.
- Cada cliente só vê os próprios pedidos e não consegue se tornar administrador.
- Só administradores enviam fotos, editam produtos, cupons e status.
- A chave *anon* do `config.js` é pública por natureza; a proteção está nas regras do banco.

## E-mails

O Supabase envia os e-mails de confirmação e de nova senha. Para personalizar o texto em português, edite os modelos em **Authentication → Email Templates**. Para volume real, configure um SMTP próprio em **Project Settings → Auth → SMTP** (o envio padrão do Supabase tem limite baixo por hora).
