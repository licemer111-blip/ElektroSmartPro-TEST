const { readFileSync, writeFileSync } = require('fs');

const src = readFileSync('lib/data/catalog-matrix.ts', 'utf-8');
const varNames = [...src.matchAll(/export const (\w+)/g)].map(m => m[1]);

function extractConst(name, text) {
  const start = text.indexOf('export const ' + name);
  if (start === -1) return null;
  const bracketStart = text.indexOf('[', start);
  if (bracketStart === -1) return null;
  let depth = 0, i = bracketStart;
  while (i < text.length) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') { depth--; if (depth === 0) break; }
    i++;
  }
  const arrayStr = text.slice(bracketStart, i + 1);
  // Convert TS object literal keys to JSON: word: -> "word":
  const jsonStr = arrayStr
    .replace(/,(\s*[}\]])/g, (_, s) => s)
    .replace(/([{,]\s*)(\w+)(\s*):/g, (_, pre, key, sp) => `${pre}"${key}"${sp}:`);
  try { return JSON.parse(jsonStr); }
  catch(e) {
    process.stderr.write('ERR ' + name + ': ' + e.message.slice(0,80) + '\n');
    return null;
  }
}

const data = {};
for (const name of varNames) {
  const val = extractConst(name, src);
  if (val !== null) { data[name] = val; process.stdout.write('OK  ' + name + '\n'); }
  else process.stdout.write('MISS ' + name + '\n');
}

writeFileSync('lib/data/json/catalog-matrix.json', JSON.stringify(data, null, 2), 'utf-8');
const size = readFileSync('lib/data/json/catalog-matrix.json').length;
process.stdout.write('\nDone: ' + Object.keys(data).length + '/' + varNames.length + ' exports. Size: ' + size + ' bytes\n');
