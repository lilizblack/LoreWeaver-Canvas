const fs = require('fs');
const content = fs.readFileSync('c:/Users/liliz/Documents/New app/components/SettingsModal.tsx', 'utf8');

let curly = 0;
let paren = 0;
let bracket = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') curly++;
    if (char === '}') curly--;
    if (char === '(') paren++;
    if (char === ')') paren--;
    if (char === '[') bracket++;
    if (char === ']') bracket--;
}

console.log(`Curly: ${curly}, Paren: ${paren}, Bracket: ${bracket}`);
