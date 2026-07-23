(() => {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
      document.head.appendChild(script);
    });
  }

  let profile = 'nastya';
  try {
    if (localStorage.getItem('hebrewTrainer_activeProfile') === 'lenya') profile = 'lenya';
  } catch (error) {}

  const profileVocab = profile === 'lenya' ? 'lenya-vocab.js' : 'vocab.js';
  const dataAssets = [
    profileVocab,
    'verb-families.js',
    'doc-imports.js',
    'transcriptions.js'
  ];
  window.__PROFILE_ASSETS = [...dataAssets, 'icons/achievement-flowers.webp'];

  Promise.all([
    loadScript('vendor/supabase-2.110.8.min.js'),
    ...dataAssets.map(loadScript)
  ]).then(() => {
    function normalizeHebrew(value) {
      return String(value || '')
        .normalize('NFD')
        .replace(/[\u0591-\u05C7]/g, '')
        .replace(/[^א-ת0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function applyWeeklyLessons(lessons) {
      const weeklyWords = new Set();
      const weeklyVerbs = new Set();
      (lessons || []).forEach(lesson => {
        (lesson.words || []).forEach(word => weeklyWords.add(normalizeHebrew(word)));
        (lesson.verbs || []).forEach(verb => weeklyVerbs.add(normalizeHebrew(verb)));
      });
      window.VOCAB.forEach(word => {
        word.isWeekly = weeklyWords.has(normalizeHebrew(word.h));
      });
      (window.VERB_FAMILIES || []).forEach(family => {
        family.isWeekly = weeklyVerbs.has(normalizeHebrew(family.infinitive));
      });
    }

    if (profile === 'lenya') {
      window.VOCAB = window.LENYA_VOCAB;
      window.VERB_FAMILIES = window.LENYA_VERB_FAMILIES;
      window.VOCAB.push(...(window.LENYA_DOC_IMPORTS || []));
      applyWeeklyLessons(window.LENYA_WEEKLY_LESSONS);
    } else {
      window.VERB_FAMILIES = window.NASTYA_VERB_FAMILIES;
      window.VOCAB.push(...(window.NASTYA_DOC_IMPORTS || []));
      applyWeeklyLessons(window.NASTYA_WEEKLY_LESSONS);
    }
    return loadScript('app.js');
  }).catch(error => {
    console.error(error);
    document.body.classList.add('app-ready');
    const splash = document.getElementById('bootSplash');
    if (splash) {
      splash.innerHTML = '<p>Не удалось загрузить приложение.<br>Проверь интернет и открой ещё раз.</p>';
    }
  });
})();
