const fs = require('fs');
const content = fs.readFileSync('build_errors.txt', 'utf16le');
const errors = content.split('\n').filter(line => line.includes('error TS'));
fs.writeFileSync('errors.json', JSON.stringify(errors, null, 2));
console.log(`Wrote ${errors.length} errors`);
