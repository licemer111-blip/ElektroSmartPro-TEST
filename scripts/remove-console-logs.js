/**
 * Script to remove all console.log(...) statements from specified files.
 * Preserves console.error(...) and console.warn(...).
 * Handles multi-line console.log statements.
 */
const fs = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, '..');

const files = [
  'app/dashboard/team/actions.ts',
  'app/dashboard/settings/actions.ts',
  'app/dashboard/projects/[id]/members-actions.ts'
];

let totalRemoved = 0;

for (const file of files) {
  const fullPath = path.join(basePath, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const output = [];
  let i = 0;
  let removed = 0;

  while (i < lines.length) {
    // Check if this line has a console.log call (but not console.error/warn)
    const match = lines[i].match(/^(\s*)console\.log\s*\(/);
    if (match) {
      // Count parentheses to find end of the statement (handles multi-line)
      let parenDepth = 0;
      let j = i;
      let foundEnd = false;
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inTemplate = false;

      while (j < lines.length && !foundEnd) {
        const line = lines[j];
        const startIdx = (j === i) ? line.indexOf('console.log') : 0;

        for (let k = startIdx; k < line.length; k++) {
          const ch = line[k];
          const prev = k > 0 ? line[k - 1] : '';

          // Handle escape sequences
          if (prev === '\\' && (inSingleQuote || inDoubleQuote || inTemplate)) {
            continue;
          }

          // Toggle string states
          if (!inDoubleQuote && !inTemplate && ch === "'") {
            inSingleQuote = !inSingleQuote;
            continue;
          }
          if (!inSingleQuote && !inTemplate && ch === '"') {
            inDoubleQuote = !inDoubleQuote;
            continue;
          }
          if (!inSingleQuote && !inDoubleQuote && ch === '`') {
            inTemplate = !inTemplate;
            continue;
          }

          // Skip content inside strings
          if (inSingleQuote || inDoubleQuote || inTemplate) {
            continue;
          }

          if (ch === '(') parenDepth++;
          if (ch === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              foundEnd = true;
              break;
            }
          }
        }
        j++;
      }

      if (foundEnd) {
        removed++;
        // Skip all lines that were part of this console.log statement
        // j is already past the last line of the statement
        i = j;
        continue;
      }
    }

    output.push(lines[i]);
    i++;
  }

  fs.writeFileSync(fullPath, output.join('\n'), 'utf8');
  console.log(`✅ ${file}: removed ${removed} console.log statements`);
  totalRemoved += removed;
}

console.log(`\n🎉 Total: removed ${totalRemoved} console.log statements from ${files.length} files`);
