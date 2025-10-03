// Test script to verify word formation logic
console.log('🧪 Testing word formation for WILDLIFE level');

// WILDLIFE letters: ["W", "I", "L", "D", "L", "I", "F", "E"]
const wildlifeLetters = ["W", "I", "L", "D", "L", "I", "F", "E"];
const baseWord = "WILDLIFE";

console.log('Base word:', baseWord);
console.log('Available letters:', wildlifeLetters);

// Function to test if a word can be formed
function canFormWord(availableLetters, targetWord) {
  const letterCounts = availableLetters.reduce((acc, letter) => {
    const lowerLetter = letter.toLowerCase();
    acc[lowerLetter] = (acc[lowerLetter] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Letter counts:', letterCounts);
  
  const wordLetters = targetWord.toLowerCase().split('');
  console.log(`Testing word "${targetWord}":`, wordLetters);
  
  for (const letter of wordLetters) {
    if ((letterCounts[letter] || 0) === 0) {
      console.log(`❌ Missing letter "${letter}" for "${targetWord}"`);
      return false;
    }
    letterCounts[letter]--;
    console.log(`✓ Used letter "${letter}", remaining:`, letterCounts[letter]);
  }
  
  console.log(`✅ "${targetWord}" can be formed!`);
  return true;
}

// Test specific words
const testWords = ['WILL', 'FILL', 'LIFE', 'FILE', 'WILD', 'DELL', 'WELL', 'FELL'];

console.log('\n🎯 Testing words:');
testWords.forEach(word => {
  console.log(`\n--- Testing "${word}" ---`);
  const result = canFormWord(wildlifeLetters, word);
  console.log(`Result: ${result ? '✅ VALID' : '❌ INVALID'}\n`);
});

console.log('\n📊 Summary:');
console.log('WILDLIFE contains letters: W(1), I(2), L(2), D(1), F(1), E(1)');
console.log('WILL needs: W(1), I(1), L(2) ✅ Available!');
console.log('FILL needs: F(1), I(1), L(2) ✅ Available!');
console.log('Both should be valid bonus words.');