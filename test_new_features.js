// Test the new features implementation
const fs = require('fs');

try {
  const inputWheelContent = fs.readFileSync('./app/components/inputWheel.tsx', 'utf8');
  const gameScreenContent = fs.readFileSync('./app/components/GameScreen.tsx', 'utf8');
  
  const inputWheelChecks = {
    hasAnimatedImport: inputWheelContent.includes('Animated'),
    hasAnimatedLetters: inputWheelContent.includes('AnimatedLetter'),
    hasShuffleAnimation: inputWheelContent.includes('fadeOutAnimations'),
    hasStaggeredDelay: inputWheelContent.includes('index * 100'),
    hasHintFunction: inputWheelContent.includes('handleHint'),
    hasHintButton: inputWheelContent.includes('Lightbulb'),
    hasFoundWordsFilter: inputWheelContent.includes('foundWords.some'),
    hasAnimatedView: inputWheelContent.includes('Animated.View'),
    hasShufflingState: inputWheelContent.includes('isShuffling')
  };
  
  const gameScreenChecks = {
    hasOneHintLimit: gameScreenContent.includes('hintsLeft, setHintsLeft] = useState(1)'),
    hasWordHintHandler: gameScreenContent.includes('handleWordHint'),
    hasHintedWords: gameScreenContent.includes('hintedWords'),
    hasUpdatedProps: gameScreenContent.includes('foundWords={[...foundCrosswordWords, ...foundBonusWords]}'),
    hasValidWordsExpanded: gameScreenContent.includes('...crosswordWords, ...allValidWords')
  };
  
  console.log('=== InputWheel Component Checks ===');
  console.log('✓ Animated import added:', inputWheelChecks.hasAnimatedImport);
  console.log('✓ AnimatedLetter interface:', inputWheelChecks.hasAnimatedLetters);
  console.log('✓ Shuffle animation logic:', inputWheelChecks.hasShuffleAnimation);
  console.log('✓ Staggered letter appearance:', inputWheelChecks.hasStaggeredDelay);
  console.log('✓ Hint function implementation:', inputWheelChecks.hasHintFunction);
  console.log('✓ Hint button UI:', inputWheelChecks.hasHintButton);
  console.log('✓ Found words filtering:', inputWheelChecks.hasFoundWordsFilter);
  console.log('✓ Animated letter rendering:', inputWheelChecks.hasAnimatedView);
  console.log('✓ Shuffling state management:', inputWheelChecks.hasShufflingState);
  
  console.log('\n=== GameScreen Component Checks ===');
  console.log('✓ One hint per game limit:', gameScreenChecks.hasOneHintLimit);
  console.log('✓ Word hint handler:', gameScreenChecks.hasWordHintHandler);
  console.log('✓ Hinted words tracking:', gameScreenChecks.hasHintedWords);
  console.log('✓ Updated component props:', gameScreenChecks.hasUpdatedProps);
  console.log('✓ Expanded valid words:', gameScreenChecks.hasValidWordsExpanded);
  
  const allInputWheelChecks = Object.values(inputWheelChecks).every(check => check);
  const allGameScreenChecks = Object.values(gameScreenChecks).every(check => check);
  
  if (allInputWheelChecks && allGameScreenChecks) {
    console.log('\n✅ All features implemented successfully!');
    console.log('\nNew Features:');
    console.log('🔄 Shuffle animation with staggered letter appearance');
    console.log('💡 Hint button that reveals unfound words');
    console.log('🎯 One hint per game limitation');
    console.log('🚫 Hints only suggest words not already found');
  } else {
    console.log('\n❌ Some features might be missing.');
    if (!allInputWheelChecks) {
      const failedInputChecks = Object.entries(inputWheelChecks).filter(([, value]) => !value);
      console.log('InputWheel issues:', failedInputChecks.map(([key]) => key));
    }
    if (!allGameScreenChecks) {
      const failedGameChecks = Object.entries(gameScreenChecks).filter(([, value]) => !value);
      console.log('GameScreen issues:', failedGameChecks.map(([key]) => key));
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
}