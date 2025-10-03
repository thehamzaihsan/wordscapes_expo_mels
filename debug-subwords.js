// Debug script to test subword generation
console.log('🧪 Testing Subword Generation');
console.log('==============================\n');

// Test the canFormWord logic manually
function canFormWord(baseWord, word) {
  const baseLetters = baseWord.toLowerCase().split('');
  const wordLetters = word.toLowerCase().split('');
  
  // Create a frequency map of base word letters
  const letterCount = new Map();
  for (const letter of baseLetters) {
    letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
  }
  
  console.log(`Testing "${word}" from "${baseWord}"`);
  console.log(`Base letters: ${baseLetters.join(', ')}`);
  console.log(`Word letters: ${wordLetters.join(', ')}`);
  console.log(`Letter counts:`, Object.fromEntries(letterCount));
  
  // Check if word can be formed
  for (const letter of wordLetters) {
    const count = letterCount.get(letter) || 0;
    console.log(`  Need "${letter}": have ${count}`);
    if (count === 0) {
      console.log(`  ❌ Missing letter "${letter}"`);
      return false;
    }
    letterCount.set(letter, count - 1);
  }
  
  console.log(`  ✅ Can form "${word}"`);
  return true;
}

// Test expected words for "planet"
const baseWord = "planet";
const expectedWords = [
  "plane", "plant", "plan", "plate", "late", "net", "ten", 
  "pen", "pet", "let", "tan", "pan", "lap", "tap", "pat", 
  "ant", "leap", "petal", "pale", "tape", "neat", "lean", 
  "lane", "pane", "at", "tea", "eat"
];

console.log(`\n🎯 Testing subwords for "${baseWord.toUpperCase()}"`);
console.log('Expected words:', expectedWords.join(', '));
console.log('\n📋 Testing each word:\n');

const validWords = [];
for (const word of expectedWords) {
  const isValid = canFormWord(baseWord, word);
  if (isValid) {
    validWords.push(word);
  }
  console.log('---');
}

console.log('\n📊 Results:');
console.log(`✅ Valid words (${validWords.length}):`, validWords.join(', '));
console.log(`❌ Invalid words (${expectedWords.length - validWords.length}):`, 
  expectedWords.filter(w => !validWords.includes(w)).join(', '));

console.log('\n💡 The issue might be:');
console.log('1. Word list doesn\'t contain these common words');
console.log('2. Word validation is too restrictive');
console.log('3. Profanity filter is blocking valid words');
console.log('4. Length requirements are excluding words');

console.log('\n🔧 Solutions applied:');
console.log('• Enhanced fallback word list with common words');
console.log('• Relaxed word validation (allow 2+ letters)');
console.log('• Disabled profanity filter temporarily');
console.log('• Reduced minimum word requirements');
console.log('• Added debug logging');