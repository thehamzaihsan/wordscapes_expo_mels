// Verification script for the fixes
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying fixes in GameScreen.tsx and game-manager.ts...\n');

// Check GameScreen.tsx
const gameScreenPath = path.join(__dirname, 'app/components/GameScreen.tsx');
const gameScreenContent = fs.readFileSync(gameScreenPath, 'utf8');

const gameScreenChecks = [
  {
    name: 'useState properly typed for letters',
    check: gameScreenContent.includes('useState<string[]>([])'),
    expected: true
  },
  {
    name: 'Attempts state variable exists',
    check: gameScreenContent.includes('[attempts, setAttempts]'),
    expected: true
  },
  {
    name: 'Letters joined for display',
    check: gameScreenContent.includes('letters.join('),
    expected: true
  },
  {
    name: 'Dependency array includes diff',
    check: gameScreenContent.includes('}, [diff])'),
    expected: true
  },
  {
    name: 'No duplicate styles',
    check: !gameScreenContent.includes('// container: {'),
    expected: true
  }
];

// Check game-manager.ts
const gameManagerPath = path.join(__dirname, 'hooks/game-manager.ts');
const gameManagerContent = fs.readFileSync(gameManagerPath, 'utf8');

const gameManagerChecks = [
  {
    name: 'Correct words import',
    check: gameManagerContent.includes('import wordsArray from \'an-array-of-english-words\''),
    expected: true
  },
  {
    name: 'Words array type safety',
    check: gameManagerContent.includes('const words: string[] = Array.isArray(wordsArray)'),
    expected: true
  },
  {
    name: 'Fallback word list enhanced',
    check: gameManagerContent.includes('\'water\', \'fire\', \'earth\''),
    expected: true
  },
  {
    name: 'Word list validation',
    check: gameManagerContent.includes('if (words.length === 0)'),
    expected: true
  },
  {
    name: 'getRandomWords safety check',
    check: gameManagerContent.includes('if (count >= wordsList.length)'),
    expected: true
  }
];

// Run checks
let allPassed = true;

console.log('📱 GameScreen.tsx checks:');
gameScreenChecks.forEach(check => {
  const result = check.check === check.expected;
  const status = result ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!result) allPassed = false;
});

console.log('\n🎮 game-manager.ts checks:');
gameManagerChecks.forEach(check => {
  const result = check.check === check.expected;
  const status = result ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!result) allPassed = false;
});

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All fixes verified successfully!');
} else {
  console.log('⚠️  Some issues may still exist.');
}
console.log('='.repeat(50));