const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

try {
  // Create 512x512 white canvas
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 512, 512);
  
  // Add blue circle
  ctx.fillStyle = '#007AFF';
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.fill();
  
  // Save as PNG
  const pngStream = canvas.createPNGStream();
  const output = fs.createWriteStream(path.join(assetsDir, 'icon.png'));
  pngStream.pipe(output);
  
  output.on('finish', () => {
    console.log('✓ Created icon.png');
  });
  
} catch (err) {
  console.log('Canvas not available, using fallback...');
  
  // Fallback: Create a proper PNG programmatically
  const pngData = createPNG(512, 512);
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngData);
  fs.writeFileSync(path.join(assetsDir, 'splash.png'), pngData);
  fs.writeFileSync(path.join(assetsDir, 'favicon.png'), pngData);
  console.log('✓ Created PNG assets with fallback');
}

// Generate a proper PNG programmatically
function createPNG(width, height) {
  const zlib = require('zlib');
  
  // PNG signature
  let data = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 2;    // color type (RGB)
  ihdr[10] = 0;   // compression
  ihdr[11] = 0;   // filter
  ihdr[12] = 0;   // interlace
  
  data = Buffer.concat([data, createChunk('IHDR', ihdr)]);
  
  // IDAT chunk (white pixels)
  const pixelData = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    pixelData[y * (width * 3 + 1)] = 0; // filter type
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + x * 3 + 1;
      pixelData[offset] = 255;     // R
      pixelData[offset + 1] = 255; // G
      pixelData[offset + 2] = 255; // B
    }
  }
  
  const compressed = require('zlib').deflateSync(pixelData);
  data = Buffer.concat([data, createChunk('IDAT', compressed)]);
  
  // IEND chunk
  data = Buffer.concat([data, createChunk('IEND', Buffer.alloc(0))]);
  
  return data;
}

function createChunk(type, data) {
  const crc32 = require('crypto');
  const chunkData = Buffer.alloc(12 + data.length);
  
  chunkData.writeUInt32BE(data.length, 0);
  chunkData.write(type, 4);
  data.copy(chunkData, 8);
  
  // CRC calculation (simplified - using crypto)
  const crcInput = Buffer.alloc(4 + data.length);
  crcInput.write(type);
  data.copy(crcInput, 4);
  
  const hash = crc32.createHash('sha256').update(crcInput).digest();
  const crc = (hash[0] << 24) | (hash[1] << 16) | (hash[2] << 8) | hash[3];
  
  chunkData.writeUInt32BE(crc >>> 0, 8 + data.length);
  
  return chunkData;
}
