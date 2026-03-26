/**
 * Extract catalog-matrix.ts data into catalog-matrix.json
 * Uses dynamic import of the TS module via tsx.
 */
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { pathToFileURL } from 'url';

// We'll use a simple approach: read the TS file and eval the arrays
import { readFileSync } from 'fs';

const src = readFileSync('lib/data/catalog-matrix.ts', 'utf-8');

// Strip TS interface/type declarations and export keywords, then eval
let js = src
  .replace(/\/\/ .*$/gm, '')  // remove line comments
  .replace(/export interface[\s\S]*?\n}/gm, '') // remove interfaces
  .replace(/export const /g, 'const ')
  .replace(/: [\w\[\]]+\[\]/g, '') // remove TS type annotations like : string[]
  .replace(/: Record<[^>]+>/g, '')
  .replace(/: \w+/g, (m) => {
    // Keep number/string literals, remove type annotations after =
    return m;
  });

// Actually, simpler: just eval using Function
// Build a result object
const varNames = [];
const matches = src.matchAll(/export const (\w+)/g);
for (const m of matches) {
  varNames.push(m[1]);
}

// Transform TS to evaluable JS
let evalSrc = src
  .replace(/export const /g, 'var ')
  .replace(/: \(.*?\) => void/g, '')
  // Remove type annotations: `: Type` after variable name
  .replace(/\b(var \w+)\s*:\s*[\w<>\[\], |"]+\s*=/g, '$1 =')
  // Remove interface blocks
  .replace(/export interface[\s\S]*?\n\}/g, '')
  // Remove export type
  .replace(/export type .*/g, '');

const result = {};
try {
  const fn = new Function(...varNames.map(n => ''), evalSrc + '\nreturn {' + varNames.join(',') + '};');
  // Actually use eval
  const sandbox = {};
  eval(evalSrc.replace(/^var /gm, 'sandbox.') + '');
  // Simpler: just use Function
} catch(e) {
  console.error('eval failed:', e.message);
}

// Use the simplest possible approach: regex extract each array
function extractConst(name, text) {
  // Find: export const NAME ... = [ ... ];
  // The array could span multiple lines
  const start = text.indexOf(`export const ${name}`);
  if (start === -1) return null;
  
  // Find the opening bracket
  const bracketStart = text.indexOf('[', start);
  if (bracketStart === -1) return null;
  
  // Find matching closing bracket
  let depth = 0;
  let i = bracketStart;
  while (i < text.length) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  
  const arrayStr = text.slice(bracketStart, i + 1);
  
  // Convert TS object literal to JSON
  let jsonStr = arrayStr
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Quote unquoted keys: word: -> "word":
    .replace(/(\b\w+)(\s*):/g, (match, key, space) => {
      // Don't re-quote already quoted keys or numeric contexts
      if (/^"/.test(match)) return match;
      return `"${key}"${space}:`;
    });
  
  try {
    return JSON.parse(jsonStr);
  } catch(e) {
    console.error(`  PARSE ERROR ${name}: ${e.message}`);
    console.error(`  Sample: ${jsonStr.slice(0, 120)}`);
    return null;
  }
}

const data = {};
for (const name of varNames) {
  const val = extractConst(name, src);
  if (val !== null) {
    data[name] = val;
    const len = Array.isArray(val) ? val.length : JSON.stringify(val).slice(0,40);
    console.log(`  OK  ${name}: ${len}`);
  } else {
    console.log(`  MISS ${name}`);
  }
}

writeFileSync('lib/data/json/catalog-matrix.json', JSON.stringify(data, null, 2), 'utf-8');
const size = readFileSync('lib/data/json/catalog-matrix.json').length;
console.log(`\nDone. ${Object.keys(data).length}/${varNames.length} exports. Size: ${size} bytes`);
