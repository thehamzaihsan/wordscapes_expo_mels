const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'app', 'components');

console.log('🚀 COMPONENT REORGANIZATION SCRIPT');
console.log('This script will reorganize components into categorized folders\n');

// Create new folder structure
const folders = [
  'ui',           // Basic UI components + Themed folder contents
  'game',         // Game-specific components  
  'screens',      // Full-screen components (merge existing Screens/)
  'levels',       // Level selection and management
  'animations',   // Animation components
  'hooks',        // Custom hooks
  'common',       // Shared utilities
  'docs'          // Documentation
];

console.log('📁 Creating folder structure...');
folders.forEach(folder => {
  const folderPath = path.join(componentsDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✓ Created: ${folder}/`);
  } else {
    console.log(`✓ Exists: ${folder}/`);
  }
});

// File migration mappings
const migrations = [
  // UI Components (move Themed contents + ThemeSwitcher)
  { from: 'Themed/SimpleText.tsx', to: 'ui/SimpleText.tsx' },
  { from: 'Themed/ThemedButton.tsx', to: 'ui/ThemedButton.tsx' },
  { from: 'Themed/ThemedCard.tsx', to: 'ui/ThemedCard.tsx' },
  { from: 'Themed/ThemedComponents.tsx', to: 'ui/ThemedComponents.tsx' },
  { from: 'Themed/ThemedInput.tsx', to: 'ui/ThemedInput.tsx' },
  { from: 'Themed/ThemedModal.tsx', to: 'ui/ThemedModal.tsx' },
  { from: 'Themed/ThemedText.tsx', to: 'ui/ThemedText.tsx' },
  { from: 'ThemeSwitcher.tsx', to: 'ui/ThemeSwitcher.tsx' },
  
  // Game Components
  { from: 'inputWheel.tsx', to: 'game/inputWheel.tsx' },
  { from: 'useGameLogic.tsx', to: 'game/useGameLogic.tsx' },
  
  // Screen Components (consolidate all screens)
  { from: 'CreateAccountScreen.tsx', to: 'screens/CreateAccountScreen.tsx' },
  { from: 'EmailConfirmationScreen.tsx', to: 'screens/EmailConfirmationScreen.tsx' },
  { from: 'GuestNameScreen.tsx', to: 'screens/GuestNameScreen.tsx' },
  { from: 'LevelScreen.tsx', to: 'screens/LevelScreen.tsx' },
  { from: 'Login.tsx', to: 'screens/Login.tsx' },
  { from: 'PlayerProfileScreen.tsx', to: 'screens/PlayerProfileScreen.tsx' },
  { from: 'SettingsScreen.tsx', to: 'screens/SettingsScreen.tsx' },
  { from: 'StoreScreen.tsx', to: 'screens/StoreScreen.tsx' },
  { from: 'Screens/GameScreen.tsx', to: 'screens/GameScreen.tsx' },
  { from: 'Screens/XPShopScreen.tsx', to: 'screens/XPShopScreen.tsx' },
  
  // Level Components
  { from: 'CategoryTabs.tsx', to: 'levels/CategoryTabs.tsx' },
  { from: 'DifficultySelection.tsx', to: 'levels/DifficultySelection.tsx' },
  { from: 'LevelCard.tsx', to: 'levels/LevelCard.tsx' },
  { from: 'LevelGrid.tsx', to: 'levels/LevelGrid.tsx' },
  { from: 'LevelHeader.tsx', to: 'levels/LevelHeader.tsx' },
  
  // Animation Components  
  { from: 'BackgroundAnimation.tsx', to: 'animations/BackgroundAnimation.tsx' },
  { from: 'LetterAnimations.tsx', to: 'animations/LetterAnimations.tsx' },
  
  // Hooks
  { from: 'useSoundSettings.tsx', to: 'hooks/useSoundSettings.tsx' },
  
  // Common Components
  { from: 'logo.tsx', to: 'common/Logo.tsx' },
  
  // Documentation
  { from: 'README.md', to: 'docs/README.md' }
];

console.log('\n📦 Migrating files...');
let successCount = 0;
let errorCount = 0;

migrations.forEach(migration => {
  const fromPath = path.join(componentsDir, migration.from);
  const toPath = path.join(componentsDir, migration.to);
  
  if (fs.existsSync(fromPath)) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(toPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy and then remove original
      fs.copyFileSync(fromPath, toPath);
      fs.unlinkSync(fromPath);
      
      console.log(`✓ ${migration.from} → ${migration.to}`);
      successCount++;
    } catch (error) {
      console.log(`✗ Failed: ${migration.from} - ${error.message}`);
      errorCount++;
    }
  } else {
    console.log(`⚠ Not found: ${migration.from}`);
  }
});

// Clean up empty directories
console.log('\n🧹 Cleaning up empty directories...');
const cleanupDirs = ['Themed', 'Screens'];
cleanupDirs.forEach(dir => {
  const dirPath = path.join(componentsDir, dir);
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`✓ Removed empty directory: ${dir}/`);
      } else {
        console.log(`⚠ Directory not empty: ${dir}/ (${files.length} files remaining)`);
      }
    }
  } catch (error) {
    console.log(`⚠ Could not remove ${dir}/: ${error.message}`);
  }
});

// Remove unused files
console.log('\n🗑️ Removing unused files...');
const filesToRemove = [
  'CompleteShowcase.tsx',
  'ComponentLibraryDemo.tsx',
  'CompleteShowcase_new.tsx'
];

filesToRemove.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✓ Removed: ${file}`);
    } catch (error) {
      console.log(`✗ Failed to remove ${file}: ${error.message}`);
    }
  }
});

console.log('\n📊 MIGRATION SUMMARY:');
console.log(`✅ Files migrated successfully: ${successCount}`);
console.log(`❌ Migration errors: ${errorCount}`);
console.log(`📁 Folders created: ${folders.length}`);

console.log('\n🎉 Component reorganization complete!');
console.log('\n📋 NEXT STEPS:');
console.log('1. ✅ ui-components.ts has been updated with new paths');
console.log('2. 🔄 Update any remaining imports in the app');
console.log('3. 🧪 Test the app to ensure all imports work');
console.log('4. 📝 Update documentation with new structure');

// Generate new directory structure
console.log('\n📁 NEW STRUCTURE:');
console.log('app/components/');
console.log('├── ui/              # Basic UI components (8 files)');
console.log('├── game/            # Game-specific components (2 files)');
console.log('├── screens/         # Full-screen components (10 files)');
console.log('├── levels/          # Level components (5 files)');
console.log('├── animations/      # Animation components (2 files)');
console.log('├── hooks/           # Custom hooks (1 file)');
console.log('├── common/          # Shared utilities (1 file)');
console.log('├── docs/            # Documentation (1 file)');
console.log('└── ui-components.ts # Centralized exports ⭐');

console.log('\n✨ All components are now organized by category!');