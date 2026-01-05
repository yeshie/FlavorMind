// setup-assets.js - Run this to create placeholder assets
const fs = require('fs');
const path = require('path');

// Create directories
const directories = [
  'assets',
  'assets/icons',
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// Create placeholder icon files (1x1 transparent PNG)
const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const iconFiles = [
  'home.png',
  'memory.png',
  'plus.png',
  'book.png',
  'chart.png',
  'bell.png',
  'user.png',
  'location.png',
  'clock.png',
  'leaf.png',
  'microphone.png',
  'sparkle.png',
  'swap.png',
  'ruler.png',
  'community.png',
];

iconFiles.forEach(file => {
  const filePath = path.join(__dirname, 'assets', 'icons', file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, transparentPng);
    console.log(`✓ Created icon: ${file}`);
  }
});

// Create placeholder app icons
const appIconFiles = [
  'icon.png',
  'splash-icon.png',
  'adaptive-icon.png',
  'favicon.png',
];

appIconFiles.forEach(file => {
  const filePath = path.join(__dirname, 'assets', file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, transparentPng);
    console.log(`✓ Created app icon: ${file}`);
  }
});

console.log('\n✅ Asset setup complete!');
console.log('\nNote: These are placeholder assets. Replace them with actual images for production.');