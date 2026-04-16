const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\liliz\\Documents\\New app\\tmp_backup.json', 'utf8'));
const kingsman = data.documents.find(doc => doc.name.includes('K7p4pc3Y8C61L3bILpcd'));
const loreNodes = kingsman.fields.loreNodes;

fs.writeFileSync('C:\\Users\\liliz\\Documents\\New app\\extracted_loreNodes.json', JSON.stringify({ loreNodes }, null, 2));
console.log('Extracted loreNodes perfectly.');
