import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeFiles(dir) {
  const files = fs.readdirSync(dir, { recursive: true });
  let count = 0;

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && /\.(tsx?|css)$/.test(file)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const normalized = content.normalize('NFC');
        
        if (content !== normalized) {
          fs.writeFileSync(fullPath, normalized, 'utf8');
          console.log(`✅ Fixed: ${file}`);
          count++;
        }
      } catch (err) {
        console.error(`❌ Error: ${file}`, err.message);
      }
    }
  });

  console.log(`\n✅ Total files fixed: ${count}`);
}

normalizeFiles(path.join(__dirname, 'src'));
