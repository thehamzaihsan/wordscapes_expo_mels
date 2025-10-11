const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'images', 'default_background.jpg');
const destPath = path.join(__dirname, 'assets', 'images', 'default_background.jpg');

try {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log('Successfully copied default_background.jpg to assets/images/');
  } else {
    console.log('Source file does not exist:', sourcePath);
  }
} catch (error) {
  console.error('Error copying file:', error);
}