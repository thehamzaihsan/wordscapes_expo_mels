import { generateCrossword } from './hooks/crossword-gen';

function testCrossword() {
  console.log('Testing crossword generation...');
  
  const words = ['CAT', 'DOG', 'BIRD'];
  const result = generateCrossword(words);
  
  if (!result) {
    console.log('No crossword generated');
    return;
  }
  
  console.log('Grid dimensions:', result.length, 'x', result[0].length);
  console.log('Grid:');
  
  for (let i = 0; i < result.length; i++) {
    let row = '';
    for (let j = 0; j < result[i].length; j++) {
      row += result[i][j] || '·';
    }
    console.log(row);
  }
  
  // Check for unnecessary padding
  let hasTopPadding = result[0].every(cell => cell === null);
  let hasBottomPadding = result[result.length - 1].every(cell => cell === null);
  let hasLeftPadding = result.every(row => row[0] === null);
  let hasRightPadding = result.every(row => row[row.length - 1] === null);
  
  console.log('\nPadding analysis:');
  console.log('Top padding:', hasTopPadding);
  console.log('Bottom padding:', hasBottomPadding);
  console.log('Left padding:', hasLeftPadding);
  console.log('Right padding:', hasRightPadding);
}

testCrossword();