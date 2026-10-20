// Monta dist/casa-lapela.html: a loja em um único arquivo, em modo demonstração.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');
const body = html.split('<!--BODY-->')[1].split('<!--/BODY-->')[0];
const fonts = html.match(/<link rel="stylesheet" href="(https:\/\/fonts[^"]+)">/)[1];
const js = ['js/seed.js', 'js/art.js', 'js/db.js', 'js/app.js'].map(read).join('\n');
const out = `<title>Casa Lapela</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="${fonts}">
<style>
${read('css/styles.css')}
</style>
${body}
<script>window.LAPELA_CONFIG = { STORE: { name: "Casa Lapela", whatsapp: "(16) 99999-0000", email: "contato@casalapela.com.br", hours: "Seg. a sex., 9h às 18h" } }; window.LAPELA_PREVIEW = true;</script>
<script>
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'casa-lapela.html'), out);
console.log('dist/casa-lapela.html', (out.length / 1024).toFixed(1) + ' KB');
