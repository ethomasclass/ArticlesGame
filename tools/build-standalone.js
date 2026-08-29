/* Inlines solo.html and its assets into one self-contained page.
   Used for the shareable single-player build; the classroom version needs
   real hosting because it talks to Firestore. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

let html = read('solo.html');

// pull out just the page content; the Artifact host supplies the skeleton
const headStyle = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const bodyInner = html.match(/<body>([\s\S]*)<\/body>/)[1];

const SCRIPTS = ['assets/game-data.js','assets/engine.js','assets/map-data.js',
                 'assets/map.js','assets/debrief.js'];

// strip the <script src> tags and keep the page's own inline script
let body = bodyInner;
SCRIPTS.forEach(s => { body = body.replace(new RegExp('<script src="' + s + '"><\\/script>\\s*', 'g'), ''); });
const inlineScript = body.match(/<script>([\s\S]*)<\/script>/)[1];
body = body.replace(/<script>[\s\S]*<\/script>/, '').trimEnd();

const guard = code => {
  if (/<\/script/i.test(code)) throw new Error('script content would close its own tag');
  return code;
};

const out = [
  '<title>The Confederation Problem</title>',
  '<style>\n' + read('assets/styles.css') + '\n</style>',
  '<style>\n' + headStyle + '\n</style>',
  body,
  ...SCRIPTS.map(s => '<script>\n' + guard(read(s)) + '\n</script>'),
  '<script>\n' + guard(inlineScript) + '\n</script>'
].join('\n\n');

const dest = process.argv[2] || path.join(ROOT, 'standalone.html');
fs.writeFileSync(dest, out);
console.log('wrote', dest, (out.length / 1024).toFixed(0) + ' KB');
console.log('no external requests:', !/https?:\/\//.test(out.replace(/https?:\/\/www\.w3\.org/g,'')) ? 'confirmed' : 'CHECK');
