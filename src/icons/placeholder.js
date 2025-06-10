// This will generate a placeholder SVG for the extension
// We'll use it to create actual PNG icons for the extension

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const iconsDir = path.resolve(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to create and save an icon
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#FF0000'; // YouTube red
  ctx.fillRect(0, 0, size, size);
  
  // Play triangle
  ctx.fillStyle = '#FFFFFF';
  const triangleSize = size * 0.4;
  const centerX = size / 2;
  const centerY = size / 2;
  
  ctx.beginPath();
  ctx.moveTo(centerX - triangleSize/2, centerY - triangleSize/2);
  ctx.lineTo(centerX + triangleSize/2, centerY);
  ctx.lineTo(centerX - triangleSize/2, centerY + triangleSize/2);
  ctx.closePath();
  ctx.fill();
  
  // Save the file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  
  console.log(`Created icon: ${size}x${size}`);
}

// Create placeholder icon for thumbnails
function createPlaceholder() {
  const width = 640;
  const height = 360;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Gray background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);
  
  // YouTube logo in center
  ctx.fillStyle = '#FF0000';
  const logoSize = width * 0.3;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw rounded rectangle
  ctx.beginPath();
  const radius = 20;
  ctx.moveTo(centerX - logoSize/2 + radius, centerY - logoSize/4);
  ctx.lineTo(centerX + logoSize/2 - radius, centerY - logoSize/4);
  ctx.quadraticCurveTo(centerX + logoSize/2, centerY - logoSize/4, centerX + logoSize/2, centerY - logoSize/4 + radius);
  ctx.lineTo(centerX + logoSize/2, centerY + logoSize/4 - radius);
  ctx.quadraticCurveTo(centerX + logoSize/2, centerY + logoSize/4, centerX + logoSize/2 - radius, centerY + logoSize/4);
  ctx.lineTo(centerX - logoSize/2 + radius, centerY + logoSize/4);
  ctx.quadraticCurveTo(centerX - logoSize/2, centerY + logoSize/4, centerX - logoSize/2, centerY + logoSize/4 - radius);
  ctx.lineTo(centerX - logoSize/2, centerY - logoSize/4 + radius);
  ctx.quadraticCurveTo(centerX - logoSize/2, centerY - logoSize/4, centerX - logoSize/2 + radius, centerY - logoSize/4);
  ctx.closePath();
  ctx.fill();
  
  // Play triangle
  ctx.fillStyle = '#FFFFFF';
  const triangleSize = logoSize * 0.4;
  
  ctx.beginPath();
  ctx.moveTo(centerX - triangleSize/3, centerY - triangleSize/2);
  ctx.lineTo(centerX + triangleSize/2, centerY);
  ctx.lineTo(centerX - triangleSize/3, centerY + triangleSize/2);
  ctx.closePath();
  ctx.fill();
  
  // Save the file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, 'placeholder.png'), buffer);
  
  console.log('Created placeholder thumbnail');
}

// Create icons of different sizes
createIcon(16);
createIcon(48);
createIcon(128);
createPlaceholder();

console.log('All icons created successfully!');