import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';

// Get current file's directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory if it doesn't exist
const iconsDir = path.resolve(__dirname, '../../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to create and save an icon
async function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Load the source image
  const sourceImage = await loadImage(path.join(__dirname, '../../Blue and Orange Modern Gradient iOS Icon (2).png'));
  
  // Draw the image with proper scaling
  ctx.drawImage(sourceImage, 0, 0, size, size);
  
  // Save the file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buffer);
  
  console.log(`Created icon: ${size}x${size}`);
}

// Create icons of different sizes
async function generateIcons() {
  await createIcon(16);
  await createIcon(48);
  await createIcon(128);
  console.log('All icons created successfully!');
}

generateIcons().catch(console.error);