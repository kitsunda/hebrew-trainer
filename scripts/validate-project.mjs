import fs from 'node:fs';
import vm from 'node:vm';

const failures = [];
const fail = message => failures.push(message);
const requiredFiles = [
  'index.html',
  'styles.css',
  'bootstrap.js',
  'app.js',
  'sw.js',
  'manifest.webmanifest',
  'vendor/supabase-2.110.8.min.js',
  'vendor/SUPABASE-LICENSE',
  'icons/achievement-flowers.webp'
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) fail(`Нет обязательного файла: ${file}`);
});

for (const file of ['bootstrap.js', 'app.js', 'sw.js']) {
  try {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  } catch (error) {
    fail(`${file}: синтаксическая ошибка — ${error.message}`);
  }
}

const context = { window: {} };
vm.createContext(context);
for (const file of [
  'vocab.js',
  'lenya-vocab.js',
  'verb-families.js',
  'doc-imports.js',
  'transcriptions.js'
]) {
  try {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  } catch (error) {
    fail(`${file}: не удалось прочитать данные — ${error.message}`);
  }
}

const transcriptions = context.window.HEBREW_TRANSCRIPTIONS || {};
const allowedKinds = new Set(['word', 'phrase', 'sentence']);
const allowedTopics = new Set([
  'Глаголы',
  'Грамматика',
  'Повседневное',
  'Фразы',
  'Еда',
  'Работа',
  'Здоровье',
  'Передвижение',
  'Идиомы и сленг',
  'Песни'
]);

function validateWords(profile, base, imports) {
  const all = [...(base || []), ...(imports || [])];
  const exactCards = new Set();
  all.forEach((word, index) => {
    const label = `${profile}, запись ${index + 1}`;
    if (!word || typeof word !== 'object') {
      fail(`${label}: запись не является объектом`);
      return;
    }
    for (const field of ['h', 'r', 'g', 'k']) {
      if (typeof word[field] !== 'string' || !word[field].trim()) {
        fail(`${label}: пустое поле ${field}`);
      }
    }
    if (!allowedKinds.has(word.k)) fail(`${label}: неизвестный тип ${word.k}`);
    if (/[<>]/.test(`${word.h}${word.r}${word.t || ''}`)) {
      fail(`${label}: в тексте есть HTML-символы < или >`);
    }
    const cardKey = `${String(word.h).trim()}|${String(word.r).trim()}`;
    if (exactCards.has(cardKey)) fail(`${label}: точный дубль «${cardKey}»`);
    exactCards.add(cardKey);
    const transcription = String(word.t || transcriptions[String(word.h).trim()] || '').trim();
    if (!transcription) fail(`${label}: нет транскрипции для «${word.h}»`);
  });

  (imports || []).forEach((word, index) => {
    if (!allowedTopics.has(word.g)) {
      fail(`${profile}, новое слово ${index + 1}: неизвестная категория «${word.g}»`);
    }
  });
}

function validateVerbs(profile, families) {
  const ids = new Set();
  (families || []).forEach((family, index) => {
    const label = `${profile}, глагол ${index + 1}`;
    for (const field of ['id', 'meaning', 'infinitive', 'past']) {
      if (typeof family[field] !== 'string' || !family[field].trim()) {
        fail(`${label}: нет обязательного поля ${field}`);
      }
    }
    if (ids.has(family.id)) fail(`${label}: повторяется id ${family.id}`);
    ids.add(family.id);
    if (!family.present && family.infinitive !== 'להיות') {
      fail(`${label}: отсутствует форма настоящего времени`);
    }
    for (const form of ['infinitive', 'past', 'present']) {
      if (!family[form]) continue;
      if (!transcriptions[String(family[form]).trim()]) {
        fail(`${label}: нет транскрипции формы ${form} «${family[form]}»`);
      }
    }
  });
}

validateWords(
  'Настя',
  context.window.VOCAB,
  context.window.NASTYA_DOC_IMPORTS
);
validateWords(
  'Лёня',
  context.window.LENYA_VOCAB,
  context.window.LENYA_DOC_IMPORTS
);
validateVerbs('Настя', context.window.NASTYA_VERB_FAMILIES);
validateVerbs('Лёня', context.window.LENYA_VERB_FAMILIES);

if (failures.length) {
  console.error(`Проверка не пройдена: ${failures.length} ошибок`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Проверка пройдена: код, файлы, категории, дубли, транскрипции и формы глаголов в порядке.');
