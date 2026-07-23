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
    if (profile === 'lenya') {
      window.VOCAB = window.LENYA_VOCAB;
      window.VERB_FAMILIES = window.LENYA_VERB_FAMILIES;
      (window.LENYA_DOC_IMPORTS || []).forEach(word => { word.isWeekly = true; });
      window.VOCAB.push(...(window.LENYA_DOC_IMPORTS || []));
    } else {
      window.VERB_FAMILIES = window.NASTYA_VERB_FAMILIES;
      (window.NASTYA_DOC_IMPORTS || []).forEach(word => { word.isWeekly = true; });
      window.VOCAB.push(...(window.NASTYA_DOC_IMPORTS || []));
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
