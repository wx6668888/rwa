import { createReadStream, mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { Buffer } from 'buffer';
import { readFileSync } from 'fs';

const zipPath = '/vercel/share/v0-project/b_0IN29PA8ETO-1772073486546.zip';
const extractPath = '/vercel/share/v0-project/_extracted';

// Simple ZIP extractor using Node.js built-in zlib
import { inflateRawSync } from 'zlib';

function extractZip(zipFilePath, outputDir) {
  const buf = readFileSync(zipFilePath);
  mkdirSync(outputDir, { recursive: true });

  let offset = 0;
  const files = [];

  while (offset < buf.length - 4) {
    // Look for local file header signature: 0x04034b50
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;

    const compressionMethod = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const uncompressedSize = buf.readUInt32LE(offset + 22);
    const fileNameLen = buf.readUInt16LE(offset + 26);
    const extraFieldLen = buf.readUInt16LE(offset + 28);

    const fileName = buf.toString('utf8', offset + 30, offset + 30 + fileNameLen);
    const dataStart = offset + 30 + fileNameLen + extraFieldLen;

    const fullPath = join(outputDir, fileName);

    if (fileName.endsWith('/')) {
      // Directory
      mkdirSync(fullPath, { recursive: true });
    } else {
      // File
      mkdirSync(dirname(fullPath), { recursive: true });

      if (compressionMethod === 0) {
        // Stored (no compression)
        const data = buf.slice(dataStart, dataStart + compressedSize);
        writeFileSync(fullPath, data);
      } else if (compressionMethod === 8) {
        // Deflated
        const compressedData = buf.slice(dataStart, dataStart + compressedSize);
        try {
          const decompressed = inflateRawSync(compressedData);
          writeFileSync(fullPath, decompressed);
        } catch (e) {
          console.log(`Warning: Could not decompress ${fileName}: ${e.message}`);
        }
      } else {
        console.log(`Unsupported compression method ${compressionMethod} for ${fileName}`);
      }

      files.push({ name: fileName, size: uncompressedSize });
    }

    offset = dataStart + compressedSize;
  }

  return files;
}

try {
  console.log('Extracting ZIP file...');
  const files = extractZip(zipPath, extractPath);
  console.log(`Extracted ${files.length} files\n`);

  // List all files recursively
  function listFiles(dir, prefix = '') {
    try {
      const items = readdirSync(dir).sort();
      for (const item of items) {
        const fullPath = join(dir, item);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            console.log(`${prefix}${item}/`);
            listFiles(fullPath, prefix + '  ');
          } else {
            console.log(`${prefix}${item} (${stat.size} bytes)`);
          }
        } catch (e) { /* skip */ }
      }
    } catch (e) {
      console.log('Error listing:', e.message);
    }
  }

  console.log('--- Extracted files ---');
  listFiles(extractPath);
} catch (e) {
  console.log('Error:', e.message);
}
