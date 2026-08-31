/* Inlines a page and every local asset it references into one file that can
   be double-clicked, emailed, or dropped in Drive with nothing alongside it.

   Usage:  node tools/build-standalone.js <page.html> <out.html>
           node tools/build-standalone.js --all
*/
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

function build(page, dest) {
  const html = read(page);
  const headStyleM = html.match(/<style>([\s\S]*?)<\/style>/);
  const bodyInner  = html.match(/<body>([\s\S]*)<\/body>/)[1];

  // local stylesheets, in the order the page lists them
  const css = [...html.matchAll(/<link[^>]+href="(assets\/[^"]+\.css)"/g)].map(m => read(m[1]));
  if (headStyleM) css.push(headStyleM[1]);

  // local scripts, in order; the page's own inline script goes last
  const srcs = [...bodyInner.matchAll(/<script src="(assets\/[^"]+\.js)"><\/script>/g)].map(m => m[1]);
  let body = bodyInner;
  srcs.forEach(s => {
    body = body.replace(new RegExp('<script src="' + s.replace(/[.\/]/g, '\\$&') + '"><\\/script>\\s*', 'g'), '');
  });
  const inlineM = body.match(/<script>([\s\S]*)<\/script>/);
  const inline = inlineM ? inlineM[1] : '';
  if (inlineM) body = body.replace(/<script>[\s\S]*<\/script>/, '').trimEnd();

  const guard = (code, where) => {
    if (/<\/script/i.test(code)) throw new Error('script content would close its own tag: ' + where);
    return code;
  };
  const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'The Confederation Problem'])[1];
  const icon  = (html.match(/<link rel="icon"[^>]*>/) || [''])[0];

  const out = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + title + '</title>',
    icon,
    '<style>\n' + css.join('\n\n') + '\n</style>',
    '</head>',
    '<body>',
    body,
    ...srcs.map(s => '<script>\n' + guard(read(s), s) + '\n</script>'),
    inline ? '<script>\n' + guard(inline, page) + '\n</script>' : '',
    '</body>',
    '</html>'
  ].filter(Boolean).join('\n');

  fs.writeFileSync(path.join(ROOT, dest), out);
  const externals = (out.match(/(src|href)="https?:\/\/[^"]+"/g) || []);
  console.log(dest.padEnd(34), (out.length / 1024).toFixed(0).padStart(4) + ' KB',
    ' assets inlined: ' + (css.length + srcs.length),
    externals.length ? '  EXTERNAL: ' + externals.join(', ') : '  no external files');
  return out;
}

if (process.argv[2] === '--all') {
  build('solo.html',    'download/confederation-solo.html');
  build('teacher.html', 'download/confederation-teacher.html');
  build('student.html', 'download/confederation-student.html');
  build('solo.html',    'standalone.html');   // kept for the existing link
} else {
  build(process.argv[2] || 'solo.html', process.argv[3] || 'standalone.html');
}
