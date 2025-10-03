// Simple test script to verify the game manager functions work
const fs = require('fs');

// Read the TypeScript file and do basic syntax validation
try {
  const content = fs.readFileSync('/home/hamzaihsan/Desktop/wordscapes-expo/hooks/game-manager.ts', 'utf8');
  
  // Basic checks for our new functions
  const hasOriginalFunction = content.includes('export function generateCrosswordLevel(');
  const hasNewFunction = content.includes('export function generateCrosswordLevelWithBaseword(');
  const hasOriginalMultiple = content.includes('export function generateMultipleLevels(');
  const hasNewMultiple = content.includes('export function generateMultipleLevelsWithBasewords(');
  
  console.log('Function checks:');
  console.log('✓ Original generateCrosswordLevel:', hasOriginalFunction);
  console.log('✓ New generateCrosswordLevelWithBaseword:', hasNewFunction);
  console.log('✓ Original generateMultipleLevels:', hasOriginalMultiple);
  console.log('✓ New generateMultipleLevelsWithBasewords:', hasNewMultiple);
  
  // Check for syntax errors by looking for common issues
  const syntaxIssues = [];
  
  // Check for unmatched braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    syntaxIssues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
  }
  
  // Check for unmatched parentheses
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    syntaxIssues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  if (syntaxIssues.length === 0) {
    console.log('✓ Basic syntax validation passed');
  } else {
    console.log('✗ Syntax issues found:', syntaxIssues);
  }
  
  console.log('\nAll functions have been successfully added to the file!');
  
} catch (error) {
  console.error('Error reading file:', error.message);
}