/**
 * Remove all console.log(...) statements from specified files.
 * Keeps console.error(...) and console.warn(...).
 * Handles multi-line console.log statements.
 * Cleans up empty else blocks left behind.
 */
const fs = require('fs');
const path = require('path');

const FILES = [
  'hooks/use-project-data-sync.ts',
  'components/settings/region-grid-selector.tsx',
  'app/dashboard/projects/[id]/actions.ts',
  'app/api/livekit/auth/route.ts',
  'components/project/copilot-session.tsx',
  'app/dashboard/settings/ai-actions.ts',
  'app/dashboard/settings/finance-actions.ts',
  'app/dashboard/catalog/ai-catalog-actions.ts',
  'hooks/use-project-presence.ts',
  'components/pwa/pwa-provider.tsx',
  'components/settings/pwa-install-button.tsx',
  'app/dashboard/catalog/category-actions.ts',
  'app/dashboard/settings/generate-catalog-action.ts',
  'app/api/pdf/route.ts',
  'app/dashboard/assemblies/ai-actions.ts',
];

let totalRemoved = 0;

for (const file of FILES) {
  const filePath = path.resolve(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  SKIP: ${file} (not found)`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let removed = 0;
  
  // Strategy: Process line by line, detect console.log statements
  // Handle both single-line and multi-line cases
  const lines = content.split('\n');
  const outputLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this line starts a console.log statement
    if (trimmed.match(/^console\.log\s*\(/) || trimmed.match(/^\/\/.*$/) === null && trimmed.includes('console.log(') && !trimmed.includes('console.error') && !trimmed.includes('console.warn')) {
      // More precise check: does this line contain console.log( but NOT console.error or console.warn?
      const logMatch = line.match(/console\.log\s*\(/);
      if (logMatch && !line.match(/console\.error/) && !line.match(/console\.warn/)) {
        // Check if statement is complete (balanced parentheses)
        let fullStatement = line;
        let parenCount = 0;
        let foundOpen = false;
        
        for (const ch of fullStatement) {
          if (ch === '(') { parenCount++; foundOpen = true; }
          if (ch === ')') parenCount--;
        }
        
        let endLine = i;
        
        // If parens not balanced, consume more lines
        while (foundOpen && parenCount > 0 && endLine + 1 < lines.length) {
          endLine++;
          fullStatement += '\n' + lines[endLine];
          for (const ch of lines[endLine]) {
            if (ch === '(') parenCount++;
            if (ch === ')') parenCount--;
          }
        }
        
        // Check if console.log is the ENTIRE statement on this line
        // (not part of a larger expression like someFunc(console.log(...)))
        const beforeLog = line.substring(0, logMatch.index).trim();
        
        // If there's meaningful code before console.log on the same line, skip removal
        if (beforeLog && !beforeLog.match(/^(\/\/|\/\*|\*|else|if|{|}|;)?\s*$/)) {
          outputLines.push(line);
          i++;
          continue;
        }
        
        // Remove the console.log statement (all lines it spans)
        removed++;
        
        // Check if removing leaves an empty line gap - remove extra blank line
        // But keep at least one blank line if there was content before and after
        i = endLine + 1;
        
        // Skip trailing blank line if the next line is also blank
        if (i < lines.length && lines[i].trim() === '' && outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
          i++;
        }
        
        continue;
      }
    }
    
    outputLines.push(line);
    i++;
  }
  
  content = outputLines.join('\n');
  
  // Clean up: remove empty else blocks that only contained console.log
  // Pattern: } else {\n  (only whitespace)\n  }
  content = content.replace(/\}\s*else\s*\{\s*\n(\s*\n)*\s*\}/g, '}');
  
  // Clean up: remove empty if blocks with only whitespace (rare but possible)
  // Don't do this - too risky. Only handle else blocks.
  
  // Clean up excessive blank lines (3+ consecutive -> 2)
  content = content.replace(/\n{3,}/g, '\n\n');
  
  if (removed > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}: removed ${removed} console.log statements`);
    totalRemoved += removed;
  } else {
    console.log(`ℹ️  ${file}: no console.log found`);
  }
}

console.log(`\n🎉 Total: removed ${totalRemoved} console.log statements from ${FILES.length} files`);
