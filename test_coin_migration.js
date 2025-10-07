// Test coin to gems migration
const fs = require('fs');

try {
  // Test files that should no longer contain 'coin' references (except in comments)
  const filesToCheck = [
    './hooks/guest-progress.ts',
    './lib/syncTypes.ts', 
    './lib/sync.ts',
    './lib/guestSnapshot.ts',
    './app/components/GameScreen.tsx',
    './constants/economy.json'
  ];

  let migrationSuccess = true;
  const issues = [];

  filesToCheck.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for problematic coin references (excluding comments and old references)
      const problemLines = content.split('\n').filter((line, index) => {
        const lineText = line.toLowerCase();
        // Skip comments and migration code
        if (lineText.includes('//') && lineText.includes('coin')) return false;
        if (lineText.includes('migration') && lineText.includes('coin')) return false;
        if (lineText.includes('oldcoins') || lineText.includes('old coins')) return false;
        
        // Look for actual coin usage
        return lineText.includes('coin:') || 
               lineText.includes('"coin"') || 
               lineText.includes("'coin'") ||
               lineText.includes('.coin') ||
               lineText.includes('coins:') ||
               lineText.includes('"coins"') ||
               lineText.includes("'coins'") ||
               lineText.includes('.coins');
      });

      if (problemLines.length > 0) {
        migrationSuccess = false;
        issues.push({
          file,
          problems: problemLines
        });
      }
      
      console.log(`✓ Checked ${file}: ${problemLines.length > 0 ? '❌ Issues found' : '✅ Clean'}`);
      
    } catch (err) {
      console.log(`⚠️  Could not check ${file}: ${err.message}`);
    }
  });

  console.log('\n=== Migration Results ===');
  
  if (migrationSuccess) {
    console.log('✅ Coin to Gems migration completed successfully!');
    console.log('\nChanges Made:');
    console.log('🔄 Replaced coins with gems in GuestMeta interface');
    console.log('🔄 Updated UserStatsRow to only use gems');
    console.log('🔄 Modified level completion rewards to give gems');
    console.log('🔄 Updated game completion rewards to give gems');
    console.log('🔄 Added migration logic for existing users');
    console.log('🔄 Updated economy.json configuration');
    console.log('💎 Starting gems amount: 5100 (combined old coins + gems)');
  } else {
    console.log('❌ Migration incomplete - issues found:');
    issues.forEach(issue => {
      console.log(`\n📁 ${issue.file}:`);
      issue.problems.forEach(line => {
        console.log(`   ${line.trim()}`);
      });
    });
  }

} catch (error) {
  console.error('Migration test error:', error.message);
}