
const fs = require('fs');
const content = fs.readFileSync('k:\\Kea\\tide-raider-fullstack\\backend\\src\\data\\beachData.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.toLowerCase().includes('bali')) {
        console.log(`Line ${i + 1}: ${line}`);
    }
});
