import fs from "fs";
import path from "path";

// A 1x1 blue PNG buffer as emergency placeholder, or let's create a 192x192 PNG buffer
// Minimal valid PNG format:
// 8-byte signature: 137 80 78 71 13 10 26 10
// IHDR chunk: 13 bytes data + 4 bytes length + 4 bytes 'IHDR' + 4 bytes CRC
// IDAT chunk: zlib compressed image data
// IEND chunk: 0 bytes data + 4 bytes length + 4 bytes 'IEND' + 4 bytes CRC
import zlib from "zlib";

function createSolidPng(width: number, height: number, r: number, g: number, b: number) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: 2 (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const pubDir = path.resolve("./public");
const icon192 = createSolidPng(192, 192, 37, 99, 235); // #2563eb
const icon512 = createSolidPng(512, 512, 37, 99, 235);

fs.writeFileSync(path.join(pubDir, "icon-192.png"), icon192);
fs.writeFileSync(path.join(pubDir, "icon-512.png"), icon512);
console.log("Icons created successfully");
