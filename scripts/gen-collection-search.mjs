import fs from 'node:fs';
import { collectionIndex } from './lib/collection-search.mjs';

const entries = collectionIndex(process.cwd());
fs.writeFileSync('content/search-entries.json', JSON.stringify(entries) + '\n');
console.log(`Collection search: ${entries.length} entries`);
