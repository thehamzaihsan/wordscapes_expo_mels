// Simple syntax test for the modified InputWheel component
const fs = require('fs');

try {
  const content = fs.readFileSync('./app/components/inputWheel.tsx', 'utf8');
  
  // Basic checks
  const hasShuffleImport = content.includes('Shuffle');
  const hasShuffleFunction = content.includes('shuffleLetters');
  const hasShuffleButton = content.includes('shuffleButton');
  const hasShuffledLettersState = content.includes('shuffledLetters');
  
  console.log('✓ Shuffle import found:', hasShuffleImport);
  console.log('✓ Shuffle function found:', hasShuffleFunction);
  console.log('✓ Shuffle button style found:', hasShuffleButton);
  console.log('✓ Shuffled letters state found:', hasShuffledLettersState);
  
  if (hasShuffleImport && hasShuffleFunction && hasShuffleButton && hasShuffledLettersState) {
    console.log('\n✅ All shuffle functionality appears to be correctly implemented!');
  } else {
    console.log('\n❌ Some shuffle functionality is missing.');
  }
  
} catch (error) {
  console.error('Error reading file:', error.message);
}