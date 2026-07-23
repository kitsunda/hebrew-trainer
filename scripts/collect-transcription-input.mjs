import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);

for (const file of ['vocab.js', 'lenya-vocab.js', 'verb-families.js', 'doc-imports.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}

const words = [
  ...(context.window.VOCAB || []),
  ...(context.window.LENYA_VOCAB || []),
  ...(context.window.NASTYA_DOC_IMPORTS || []),
  ...(context.window.LENYA_DOC_IMPORTS || []),
];

for (const family of [
  ...(context.window.NASTYA_VERB_FAMILIES || []),
  ...(context.window.LENYA_VERB_FAMILIES || []),
]) {
  for (const key of ['infinitive', 'past', 'present']) {
    if (family[key]) words.push({ h: family[key], t: '' });
  }
}

const known = {};
const hebrew = new Set();
for (const word of words) {
  const h = String(word.h || '').trim();
  if (!h) continue;
  hebrew.add(h);
  const t = String(word.t || '').trim();
  if (t && !known[h]) known[h] = t;
}

fs.writeFileSync(
  '/private/tmp/hebrew-transcription-input.json',
  JSON.stringify({ hebrew: [...hebrew], known }, null, 2),
);

console.log(`Collected ${hebrew.size} unique Hebrew prompts; ${Object.keys(known).length} have human transcriptions.`);
