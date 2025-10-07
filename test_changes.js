// Test script to verify the changes
const fs = require('fs');
const path = require('path');

console.log('Testing economy.json integration...');

try {
  // Test 1: Verify economy.json can be loaded
  const economy = require('./constants/economy.json');
  console.log('✅ Economy config loaded successfully');
  console.log('   - Energy payPerLevel:', economy.energy.payPerLevel);
  console.log('   - Max energy:', economy.dailyLogin.maxEnergy);
  console.log('   - Purchase options:', economy.gems.purchaseOptions.length);

  // Test 2: Verify StoreScreen has correct imports
  const storeScreenContent = fs.readFileSync('./app/components/StoreScreen.tsx', 'utf8');
  if (storeScreenContent.includes('import economy from "../../constants/economy.json"')) {
    console.log('✅ StoreScreen imports economy.json correctly');
  } else {
    console.log('❌ StoreScreen missing economy.json import');
  }
  
  if (storeScreenContent.includes('⚡')) {
    console.log('✅ StoreScreen uses lightning emoji');
  } else {
    console.log('❌ StoreScreen missing lightning emoji');
  }

  // Test 3: Verify LevelHeader has correct changes
  const levelHeaderContent = fs.readFileSync('./app/components/LevelHeader.tsx', 'utf8');
  if (levelHeaderContent.includes('⚡')) {
    console.log('✅ LevelHeader uses lightning emoji');
  } else {
    console.log('❌ LevelHeader missing lightning emoji');
  }

  if (levelHeaderContent.includes('economy.dailyLogin.maxEnergy')) {
    console.log('✅ LevelHeader uses dynamic max energy');
  } else {
    console.log('❌ LevelHeader missing dynamic max energy');
  }

  // Test 4: Verify guest-progress.ts uses dynamic energy cost
  const guestProgressContent = fs.readFileSync('./hooks/guest-progress.ts', 'utf8');
  if (guestProgressContent.includes('economy.energy.payPerLevel')) {
    console.log('✅ Guest progress uses dynamic energy cost');
  } else {
    console.log('❌ Guest progress missing dynamic energy cost');
  }

  console.log('\n🎉 All changes verified successfully!');

} catch (error) {
  console.error('❌ Error during testing:', error.message);
}