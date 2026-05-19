const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.txt')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('i-and-js')) {
          console.log(`Found "i-and-js" in file: ${fullPath}`);
        }
      }
    }
  }
}

searchDir(path.join(__dirname, '..'));
