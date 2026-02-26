import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import path from 'path';

// Unzip the file
const zipPath = '/vercel/share/v0-project/b_0IN29PA8ETO-1772073486546.zip';
const extractPath = '/vercel/share/v0-project/_extracted';

try {
  execSync(`unzip -o "${zipPath}" -d "${extractPath}"`, { encoding: 'utf-8' });
  console.log('Unzip successful!');
} catch (e) {
  console.log('Unzip error:', e.message);
}

// List all files recursively
function listFiles(dir, prefix = '') {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          console.log(`${prefix}${item}/`);
          listFiles(fullPath, prefix + '  ');
        } else {
          console.log(`${prefix}${item} (${stat.size} bytes)`);
        }
      } catch (e) {
        // skip
      }
    }
  } catch (e) {
    console.log('Error listing:', e.message);
  }
}

console.log('\n--- Extracted files ---');
listFiles(extractPath);
