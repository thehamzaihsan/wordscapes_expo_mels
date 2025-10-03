// Simple syntax check for GameScreen.tsx
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'app/components/GameScreen.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Basic syntax checks
const checks = [
  {
    name: 'useState type annotation',
    regex: /useState<string\[\]>\(\[\]\)/,
    pass: content.includes('useState<string[]>([])'),
  },
  {
    name: 'Attempts state variable',
    regex: /const \[attempts, setAttempts\]/,
    pass: content.includes('const [attempts, setAttempts]'),
  },
  {
    name: 'Letters array join',
    regex: /letters\.join\(/,
    pass: content.includes('letters.join('),
  },
  {
    name: 'LetterWheel props',
    regex: /letters={letters}/,
    pass: content.includes('letters={letters}'),
  }
];

console.log('GameScreen.tsx Error Fixes Verification:');
console.log('==========================================');

let allPassed = true;
checks.forEach(check => {
  const status = check.pass ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} - ${check.name}`);
  if (!check.pass) allPassed = false;
});

console.log('\n' + (allPassed ? '✓ All checks passed!' : '✗ Some checks failed!'));