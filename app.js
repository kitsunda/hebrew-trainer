const TOPIC_GROUPS = [
  {key:'verbs', label:'Глаголы'},
  {key:'grammar', label:'Грамматика'},
  {key:'everyday', label:'Повседневное'},
  {key:'phrases', label:'Фразы'},
  {key:'food', label:'Еда'},
  {key:'work', label:'Работа'},
  {key:'health', label:'Здоровье'},
  {key:'transport', label:'Передвижение'},
  {key:'idioms', label:'Идиомы и сленг'},
  {key:'songs', label:'Песни'},
];
function hebrewFontSize(text){
  const len = (text||'').length;
  if(len<=10) return 'clamp(30px,6vw,42px)';
  if(len<=20) return 'clamp(24px,5vw,34px)';
  if(len<=36) return 'clamp(19px,4vw,27px)';
  if(len<=60) return 'clamp(16px,3.2vw,21px)';
  return 'clamp(14px,2.6vw,18px)';
}
function russianFontSize(text){
  const len = (text||'').length;
  if(len<=14) return '22px';
  if(len<=28) return '19px';
  if(len<=50) return '16.5px';
  return '14.5px';
}
function russianPromptFontSize(text){
  const len = (text||'').length;
  if(len<=14) return 'clamp(28px,6vw,38px)';
  if(len<=28) return 'clamp(24px,5vw,32px)';
  if(len<=50) return 'clamp(20px,4.2vw,27px)';
  return 'clamp(17px,3.5vw,22px)';
}
function hebrewTokens(value){
  return (value||'').match(/[א-ת]+/g) || [];
}
function looksLikeReadyPhrase(word){
  const h = (word?.h||'').trim();
  const tokens = hebrewTokens(h);
  const opener = /^(אני|אתה|את|הוא|היא|אנחנו|אתם|אתן|הם|הן|יש|אין|מה|מי|איך|איפה|מתי|למה|כמה|זה|זאת|אלה|אל|לא|בבקשה|תודה|ברוך)(?:\s|$)/;
  return word?.k==='phrase' || /[?!؟]/.test(h) || (tokens.length>=2 && tokens.length<=8 && opener.test(h));
}
function looksLikeLongExample(word){
  const h = (word?.h||'').trim();
  const tokens = hebrewTokens(h);
  return word?.k==='sentence' || tokens.length>8 || (tokens.length>=5 && h.length>38);
}
function groupOf(topic, word){
  const t = (topic||'').toLowerCase();
  const h = (word?.h||'').trim();
  const r = (word?.r||'').toLowerCase();
  const all = `${t} ${h} ${r}`;
  const tokens = hebrewTokens(h);
  const oneHebrewWord = tokens.length===1 && h.replace(/[\s־–—-]/g,'').length<18;
  const hebrewInfinitive = oneHebrewWord && /^ל[א-ת]{2,}$/.test(tokens[0]);
  const russianInfinitive = /(?:^|[—–,:;\s-])(\S+(?:ть|ться))(?:$|[\s,;.])/.test(r);
  const explicitlyVerb = /глагол|инфинитив|биньян/.test(t);
  const lenyaSource = /^л[её]ня:/.test(t);

  // Метка из исходного словаря надёжнее тематических совпадений: «работать»
  // остаётся глаголом, а не уезжает в «Работу». Для слов без метки требуем
  // одновременно и ивритский, и русский признак инфинитива, чтобы «память»
  // или «власть» не становились глаголами только из-за окончания «-ть».
  if(explicitlyVerb || (!lenyaSource && hebrewInfinitive && russianInfinitive)) return 'verbs';
  if(/песня|молитва|строк[аи] песни|текст песни|^песня|(?:^|\s)שיר(?:\s|$)|מילים לשיר/.test(all)) return 'songs';
  if(/идиом|сленг|устойчив|переносн|ביטוי|סלנג|дословно|в контексте|что ты ко мне привязался/.test(all)) return 'idioms';
  if(/здоров|тел[оа]|врач|лекар|боль|привив|болез|симптом|ухо|уши|рецепт|רופא|בריאות|חיסון|כאב|אוזן|אוזניים|מרשם/.test(all)) return 'health';
  if(/работ|банк|финанс|деньг|зарплат|должност|офис|клиент|аудитори|себестоим|професси|עבודה|בנק|כסף|משכורת|תפקיד|קהל יעד|מחיר עלות/.test(all)) return 'work';
  if(/еда|покупк|продукт|ресторан|завтрак|обед|ужин|мяс|хлеб|сыр|стакан|напит|готов|жар|кухн|магазин|соломинк|אוכל|קניות|לחם|בשר|מסעדה|ארוח|כוס|קשית|מטבח|חנות/.test(all)) return 'food';
  if(/переезд|переезж|дорог|машин|автобус|поезд|самол|такси|улиц|город|пляж|путешеств|гулять|вернут|возвращ|приех|приход|направлен|снаружи|заграниц|נסיעה|אוטובוס|רכבת|מכונית|עיר|חוף|לחזור|להחזיר|לעבור דירה|חוץ לארץ/.test(all)) return 'transport';
  if(/грамматик|предлог|местоим|суффикс|связк|пассив|степен|спряжен|конструкц|модаль|союз|потому что|так как|кроме|слишком|чем\.\.|עברית דקדוק|מפני ש|חוץ מ|מאשר/.test(all)) return 'grammar';
  if(looksLikeReadyPhrase(word) || /^фразы$/.test(t)) return 'phrases';
  // В словаре Лёни русское слово вроде «есть» или «переехать» может входить
  // в перевод целой фразы. Поэтому глаголом считаем только одиночный
  // ивритский инфинитив, подтверждённый русским инфинитивом.
  if(lenyaSource && hebrewInfinitive && russianInfinitive) return 'verbs';
  return 'everyday';
}

/* В исходных конспектах несколько ивритских фраз развернулись при копировании
   из RTL-документов. Исправляем только проверенные случаи: обычный порядок
   вопросительных слов, подлежащего и сказуемого, а также согласование. */
const HEBREW_TEXT_CORRECTIONS = new Map([
  ['שירותים איפה?', 'איפה שירותים?'],
  ['שתיתי אני - שתה הוא', 'אני שתיתי — הוא שתה'],
  ['שתיתי אני - שתית את', 'אני שתיתי — את שתית'],
  ['בניתי אני - בנית את', 'אני בניתי — את בנית'],
  ['הצליח הוא', 'הוא הצליח'],
  ['היגן הוא', 'הוא הגן'],
  ['אשמח אני', 'אני אשמח'],
  ['נזכרתי אני', 'אני נזכרתי'],
  ['המתין הוא', 'הוא המתין'],
  ['החלטתי אני', 'אני החלטתי'],
  ['השתגעתי אני', 'אני השתגעתי'],
  ['חגג הוא', 'הוא חגג'],
  ['חגגתי אני', 'אני חגגתי'],
  ['ליטף הוא', 'הוא ליטף'],
  ['ניידת את?', 'את ניידת?'],
  ['בשמן חביתה טיגנתי', 'טיגנתי חביתה בשמן'],
  ['לוחמים חיילים', 'חיילים לוחמים'],
  ['הוא לוחם חייל', 'הוא חייל לוחם'],
  ['מופתע היה', 'היה מופתע'],
  ['אחרת אני מתנהג', 'אני מתנהג אחרת'],
  ['חזרה לשגרה שמח!', 'חזרה שמחה לשגרה!'],
  ['מה היה היום שקודם?', 'איזה יום היה אתמול?'],
  ['מה את מתחפשת?', 'למה את מתחפשת?'],
  ['מהם שעות הפעילות של הסניף?', 'מהן שעות הפעילות של הסניף?'],
  ['מהו מועד חיוב של כרטיס האשראי שלי?', 'מהו מועד החיוב של כרטיס האשראי שלי?'],
  ['מה את עושה מזה עניין כזה?', 'למה את עושה מזה כזה עניין?'],
  ['למה אכלת את כל כך הרבה פיצה? - כי את שכנעת אותי!!!', 'למה אכלת כל כך הרבה פיצה? — כי את שכנעת אותי!'],
  ['יש לך רופאה קבוע?', 'יש לך רופאה קבועה?'],
  ['דירה הזאת, בת כמה חדרים?', 'כמה חדרים יש בדירה הזאת?'],
  ['נסעתי לירושלים, שמעתי מוזיקה כל דרך', 'נסעתי לירושלים ושמעתי מוזיקה כל הדרך'],
]);
VOCAB.forEach(word=>{
  const corrected = HEBREW_TEXT_CORRECTIONS.get((word.h||'').trim());
  if(corrected) word.h = corrected;
});

VOCAB.forEach((w,i)=>{
  w.id = i;
  w.group = groupOf(w.g, w);
  // Старые записи смешивали инфинитивы, отдельные спряжения, существительные
  // и целые предложения. Они остаются контекстом, но больше не считаются
  // самостоятельными глаголами и не попадают в очередь карточек.
  w.isLegacyVerb = w.group==='verbs';
  // Длинные предложения остаются в базе как контекст для карточек,
  // но не превращаются в отдельные пункты тренировки.
  w.isExample = looksLikeLongExample(w);
});

const VERB_FORM_SPECS = [
  {key:'infinitive', label:'ИНФИНИТИВ'},
  {key:'past', label:'ОН · ПРОШЕДШЕЕ'},
  {key:'present', label:'Я · НАСТОЯЩЕЕ · М.Р.'},
];
const VERB_FAMILIES = Array.isArray(window.VERB_FAMILIES) ? window.VERB_FAMILIES : [];
const IRREGULAR_PRESENT_1S = {
  'быть':'есть','есть':'ем','идти':'иду','ехать':'еду','пить':'пью','спать':'сплю',
  'жить':'живу','хотеть':'хочу','мочь':'могу','уметь':'умею','дать':'даю','взять':'беру',
  'сесть':'сажусь','лечь':'ложусь','стоять':'стою','летать':'летаю','сказать':'говорю',
  'писать':'пишу','читать':'читаю','любить':'люблю','купить':'покупаю','продать':'продаю',
  'открыть':'открываю','закрыть':'закрываю','помочь':'помогаю','звонить':'звоню',
  'приходить':'прихожу','возвращаться':'возвращаюсь','учиться':'учусь','слышать':'слышу',
  'приносить':'приношу','вставать':'встаю','платить':'плачу','видеть':'вижу','ждать':'жду',
  'помнить':'помню','брать':'беру','выходить':'выхожу','оставаться':'остаюсь','петь':'пою',
  'искать':'ищу','готовить':'готовлю','варить':'варю','жарить':'жарю','делить':'делю',
  'смеяться':'смеюсь','расти':'расту','падать':'падаю','плавать':'плаваю','танцевать':'танцую',
  'смотреть':'смотрю','играть':'играю','приобретать':'приобретаю','начинать':'начинаю',
  'сравнивать':'сравниваю','использовать':'использую','заказывать':'заказываю','приглашать':'приглашаю',
  'успевать':'успеваю','рекомендовать':'рекомендую','предлагать':'предлагаю','защищать':'защищаю',
  'возвращать':'возвращаю','напоминать':'напоминаю','поднимать':'поднимаю','останавливать':'останавливаю',
  'объяснять':'объясняю','соглашаться':'соглашаюсь','ценить':'ценю','скрывать':'скрываю',
  'помогать':'помогаю','отдыхать':'отдыхаю',
};
const IRREGULAR_PAST_3S = {
  'быть':'был','есть':'ел','идти':'шёл','ехать':'ехал','пить':'пил','спать':'спал',
  'жить':'жил','хотеть':'хотел','мочь':'мог','уметь':'умел','дать':'дал','взять':'взял',
  'сесть':'сел','лечь':'лёг','сказать':'сказал','прийти':'пришёл','уйти':'ушёл',
  'найти':'нашёл','увидеть':'увидел','купить':'купил','продать':'продал',
  'умереть':'умер','расти':'рос','прийти':'пришёл','вернуться':'вернулся',
};
function verbSense(meaning, tense){
  const clean = String(meaning||'').replace(/\([^)]*\)/g,'').trim();
  const parts = clean.split(/\s*(?:\/|;|,|—)\s*/).map(x=>x.trim()).filter(Boolean);
  return (tense==='past' ? parts[parts.length-1] : parts[0]) || clean;
}
function russianPresent1s(infinitive){
  const v = infinitive.toLowerCase().trim();
  if(IRREGULAR_PRESENT_1S[v]) return IRREGULAR_PRESENT_1S[v];
  if(!/ть$/.test(v)) return v;
  const stem = v.slice(0,-2);
  if(stem.endsWith('и')) return stem.slice(0,-1)+'ю';
  return stem+'ю';
}
function russianPast3s(infinitive){
  const v = infinitive.toLowerCase().trim();
  if(IRREGULAR_PAST_3S[v]) return IRREGULAR_PAST_3S[v];
  if(!/ть$/.test(v)) return v;
  const stem = v.slice(0,-2);
  return stem+'л';
}
function verbFormTranslation(family, form){
  if(form.key==='infinitive') return verbSense(family.meaning,'infinitive');
  if(form.key==='past') return russianPast3s(verbSense(family.meaning,'past'));
  return russianPresent1s(verbSense(family.meaning,'infinitive'));
}
const VERB_CARDS = [];
VERB_FAMILIES.forEach(family=>{
  VERB_FORM_SPECS.forEach(form=>{
    const hebrew = family[form.key];
    if(!hebrew) return; // למשל, у להיות нет обычной формы настоящего времени.
    VERB_CARDS.push({
      id:`verb:${family.id}:${form.key}`,
      h:hebrew,
      t:'',
      r:verbFormTranslation(family, form),
      g:'глаголы',
      k:'word',
      group:'verbs',
      isExample:false,
      isLegacyVerb:false,
      isWeekly:Boolean(family.isWeekly),
      verbFamilyId:family.id,
      verbForm:form.key,
      formLabel:form.label,
    });
  });
});
VOCAB.push(...VERB_CARDS);
const TRANSCRIPTIONS = window.HEBREW_TRANSCRIPTIONS || {};
VOCAB.forEach(word=>{
  const transcription = String(word.t || TRANSCRIPTIONS[String(word.h || '').trim()] || '').trim();
  word.t = transcription.replace(/[hH]/g, match=>match==='H'?'Х':'х');
});

/* Контекст усиливает запоминание почти так же сильно, как активное вспоминание
   (Broek et al., 2022) — при повторе показываем фразу/предложение, где то же
   слово встречается на иврите, если такая нашлась в датасете. */
const CONTEXT_CANDIDATES = VOCAB.filter(w=>(w.isExample || w.k!=='word') && w.h.length>=6);
VOCAB.forEach(w=>{
  w.ctx = null;
  if(w.k==='word' && w.h.length>=2){
    const match = CONTEXT_CANDIDATES.find(p=>p.h!==w.h && p.h.includes(w.h));
    if(match) w.ctx = match.id;
  }
});

const GROUP_COUNTS = {};
VOCAB.forEach(w=>{
  if(!w.isExample && !w.isLegacyVerb && w.group!=='verbs') GROUP_COUNTS[w.group] = (GROUP_COUNTS[w.group]||0)+1;
});
GROUP_COUNTS.verbs = VERB_FAMILIES.length;
const LEARNING_VOCAB = VOCAB.filter(w=>!w.isExample && !w.isLegacyVerb);
const LEARNING_BY_ID = new Map(LEARNING_VOCAB.map(w=>[String(w.id),w]));
const VERB_CARD_IDS_BY_FAMILY = new Map();
VERB_CARDS.forEach(w=>{
  const ids = VERB_CARD_IDS_BY_FAMILY.get(w.verbFamilyId) || [];
  ids.push(w.id);
  VERB_CARD_IDS_BY_FAMILY.set(w.verbFamilyId, ids);
});
const TOTAL_LEARNING_UNITS = LEARNING_VOCAB.filter(w=>!w.verbFamilyId).length + VERB_FAMILIES.length;

const STORE_PREFIX = 'hebrewTrainer_v1_';
const PROFILE_NAMES = {nastya:'Настя', lenya:'Лёня'};
const SUPABASE_URL = 'https://uplxewnckhvaoarqmutp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_unv0cdILHE0EP_OPyYfiiw_efsGWPS2';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let activeProfile = localStorage.getItem('hebrewTrainer_activeProfile');
let cloudSaveTimer = null;
function localStoreKey(){ return `${STORE_PREFIX}${activeProfile||'nastya'}`; }
const DEFAULT_STATE = {
  boxes:{}, xp:0, streak:0, bestStreak:0, dayStreak:0, lastDate:null, selectedTopics:null,
  lastGoalDate:null, shields:1, achievements:{}, announcedCollectibles:[], totalCorrectEver:0,
  due:{}, wrongStreaks:{}, reviewStats:{}, mnemonics:{}, vocabVersion:0, verbFamiliesVersion:0,
  cardUpdatedAt:{}, updatedAt:null
};
function normalizeState(candidate){
  if(!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Некорректный формат прогресса');
  const normalized = {
    ...DEFAULT_STATE,
    ...candidate,
    boxes:{...(candidate.boxes||{})},
    achievements:{...(candidate.achievements||{})},
    announcedCollectibles:Array.isArray(candidate.announcedCollectibles) ? candidate.announcedCollectibles : [],
    due:{...(candidate.due||{})},
    wrongStreaks:{...(candidate.wrongStreaks||{})},
    reviewStats:{...(candidate.reviewStats||{})},
    mnemonics:{...(candidate.mnemonics||{})},
    cardUpdatedAt:{...(candidate.cardUpdatedAt||{})}
  };
  if((normalized.verbFamiliesVersion||0)<1){
    const cardsByForm = new Map();
    VERB_CARDS.forEach(card=>{
      const ids = cardsByForm.get(card.h) || [];
      ids.push(card.id);
      cardsByForm.set(card.h, ids);
    });
    VOCAB.filter(w=>w.isLegacyVerb).forEach(oldWord=>{
      const oldKey = String(oldWord.id);
      const oldBox = Number(normalized.boxes[oldKey]||0);
      if(oldBox<1) return;
      hebrewTokens(oldWord.h).forEach(token=>{
        (cardsByForm.get(token)||[]).forEach(newId=>{
          normalized.boxes[newId] = Math.max(Number(normalized.boxes[newId]||0), oldBox);
          if(normalized.due[oldKey] && !normalized.due[newId]) normalized.due[newId] = normalized.due[oldKey];
        });
      });
    });
    normalized.verbFamiliesVersion = 1;
  }
  return normalized;
}
function stateTime(state){
  return Date.parse(state?.updatedAt||0)||0;
}
function mergeCardMaps(local, cloud, field){
  const result = {};
  const keys = new Set([
    ...Object.keys(local[field]||{}),
    ...Object.keys(cloud[field]||{})
  ]);
  keys.forEach(key=>{
    const localHas = Object.prototype.hasOwnProperty.call(local[field]||{},key);
    const cloudHas = Object.prototype.hasOwnProperty.call(cloud[field]||{},key);
    if(!localHas){ result[key] = cloud[field][key]; return; }
    if(!cloudHas){ result[key] = local[field][key]; return; }
    const localCardTime = Date.parse(local.cardUpdatedAt?.[key]||0)||stateTime(local);
    const cloudCardTime = Date.parse(cloud.cardUpdatedAt?.[key]||0)||stateTime(cloud);
    result[key] = localCardTime>=cloudCardTime ? local[field][key] : cloud[field][key];
  });
  return result;
}
function mergeStates(localCandidate, cloudCandidate){
  const local = normalizeState(localCandidate||{});
  const cloud = normalizeState(cloudCandidate||{});
  const localIsNewer = stateTime(local)>=stateTime(cloud);
  const newer = localIsNewer ? local : cloud;
  const older = localIsNewer ? cloud : local;
  const cardUpdatedAt = {...older.cardUpdatedAt,...newer.cardUpdatedAt};
  Object.keys(older.cardUpdatedAt||{}).forEach(key=>{
    const olderTime = Date.parse(older.cardUpdatedAt[key]||0)||0;
    const newerTime = Date.parse(newer.cardUpdatedAt?.[key]||0)||0;
    if(olderTime>newerTime) cardUpdatedAt[key] = older.cardUpdatedAt[key];
  });
  const mergedTime = Math.max(stateTime(local),stateTime(cloud));
  return normalizeState({
    ...older,
    ...newer,
    boxes:mergeCardMaps(local,cloud,'boxes'),
    due:mergeCardMaps(local,cloud,'due'),
    wrongStreaks:mergeCardMaps(local,cloud,'wrongStreaks'),
    reviewStats:mergeCardMaps(local,cloud,'reviewStats'),
    mnemonics:{...older.mnemonics,...newer.mnemonics},
    achievements:{...older.achievements,...newer.achievements},
    announcedCollectibles:[...new Set([
      ...(older.announcedCollectibles||[]),
      ...(newer.announcedCollectibles||[])
    ])],
    cardUpdatedAt,
    xp:Math.max(Number(local.xp)||0,Number(cloud.xp)||0),
    bestStreak:Math.max(Number(local.bestStreak)||0,Number(cloud.bestStreak)||0),
    totalCorrectEver:Math.max(Number(local.totalCorrectEver)||0,Number(cloud.totalCorrectEver)||0),
    vocabVersion:Math.max(Number(local.vocabVersion)||0,Number(cloud.vocabVersion)||0),
    verbFamiliesVersion:Math.max(Number(local.verbFamiliesVersion)||0,Number(cloud.verbFamiliesVersion)||0),
    updatedAt:mergedTime ? new Date(mergedTime).toISOString() : null
  });
}
function stateContent(state){
  const comparable = normalizeState(state||{});
  comparable.updatedAt = null;
  comparable.announcedCollectibles = [...comparable.announcedCollectibles].sort();
  return JSON.stringify(comparable);
}
function loadState(){
  try{
    const raw = localStorage.getItem(localStoreKey()) || (activeProfile==='nastya' ? localStorage.getItem('hebrewTrainer_v1') : null);
    if(raw) return normalizeState(JSON.parse(raw));
  }catch(e){}
  return normalizeState({});
}
let STATE = loadState();
function saveState(){
  STATE.updatedAt = new Date().toISOString();
  localStorage.setItem(localStoreKey(), JSON.stringify(STATE));
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveStateToCloud, 500);
}
let pendingCloudSync = false;
async function saveStateToCloud(){
  if(!activeProfile) return;
  const localSnapshot = normalizeState(JSON.parse(JSON.stringify(STATE)));
  try{
    for(let attempt=0;attempt<3;attempt++){
      const {data:cloudRow,error:readError} = await supabaseClient
        .from('trainer_progress')
        .select('state,updated_at')
        .eq('profile_id',activeProfile)
        .maybeSingle();
      if(readError) throw readError;
      const cloudState = cloudRow?.state
        ? {...cloudRow.state,updatedAt:cloudRow.state.updatedAt||cloudRow.updated_at}
        : null;
      const merged = cloudState ? mergeStates(localSnapshot,cloudState) : localSnapshot;
      const writeStamp = new Date().toISOString();
      merged.updatedAt = writeStamp;
      let writeError = null;
      let saved = false;
      if(cloudRow){
        const {data,error} = await supabaseClient
          .from('trainer_progress')
          .update({state:merged,updated_at:writeStamp})
          .eq('profile_id',activeProfile)
          .eq('updated_at',cloudRow.updated_at)
          .select('profile_id')
          .maybeSingle();
        writeError = error;
        saved = !!data && !error;
      } else {
        const {error} = await supabaseClient
          .from('trainer_progress')
          .insert({profile_id:activeProfile,state:merged,updated_at:writeStamp});
        writeError = error;
        saved = !error;
      }
      if(saved){
        STATE = mergeStates(STATE,merged);
        localStorage.setItem(localStoreKey(),JSON.stringify(STATE));
        pendingCloudSync = false;
        return;
      }
      if(writeError && writeError.code!=='23505') throw writeError;
    }
    throw new Error('Прогресс изменился на другом устройстве во время сохранения');
  }catch(error){
    pendingCloudSync = true;
    console.error('Не удалось сохранить прогресс в облако', error);
  }
}
async function loadStateFromCloud(){
  if(!activeProfile) return;
  const app = document.getElementById('appWrap');
  try{
    const {data, error} = await supabaseClient.from('trainer_progress').select('state,updated_at').eq('profile_id', activeProfile).maybeSingle();
    if(error){ console.error('Не удалось загрузить прогресс из облака', error); return; }
    if(data?.state){
      const needsLenyaReset = activeProfile === 'lenya' && data.state.vocabVersion !== 1;
      const needsVerbMigration = data.state.verbFamiliesVersion !== 1;
      const cloudState = {...data.state,updatedAt:data.state.updatedAt||data.updated_at};
      const mergedState = needsLenyaReset
        ? normalizeState({vocabVersion:1})
        : mergeStates(STATE,cloudState);
      const needsCloudWrite = stateContent(mergedState)!==stateContent(cloudState);
      STATE = mergedState;
      localStorage.setItem(localStoreKey(), JSON.stringify(STATE));
      selectedTopics = new Set(migratedTopics(STATE.selectedTopics));
      renderTopics(); renderPoolHint(); renderStats(); renderGarden();
      if(needsLenyaReset || needsVerbMigration || needsCloudWrite){
        await saveStateToCloud();
      }
    } else {
      await saveStateToCloud();
    }
  } finally {
    app.classList.remove('cloud-loading');
  }
}
window.addEventListener('online',()=>{
  if(pendingCloudSync) saveStateToCloud();
});

function exportProgress(){
  const payload = { app:'hebrew-trainer', version:1, exportedAt:new Date().toISOString(), state:STATE };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hebrew-trainer-progress-${todayStr()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Прогресс скачан');
}
async function importProgress(file){
  try{
    const parsed = JSON.parse(await file.text());
    const candidate = parsed && parsed.app==='hebrew-trainer' ? parsed.state : parsed;
    STATE = normalizeState(candidate);
    saveState();
    selectedTopics = new Set(migratedTopics(STATE.selectedTopics));
    renderTopics(); renderPoolHint(); renderStats(); renderGarden();
    showToast('Прогресс загружен');
  }catch(e){
    showToast('Не удалось загрузить файл');
  }
}

/* ---------- SRS scheduling ----------
   Основано на исследованиях в "Запоминание слов — что работает": главное не точная
   схема интервалов, а сам факт растянутых во времени повторов (Nakata) + активное
   вспоминание вместо перечитывания (Dunlosky et al. 2013). */
const SRS_INTERVAL_DAYS = [0,1,3,7,16,35];
function addDaysStr(dateStr, days){
  const [y,m,dd] = dateStr.split('-').map(Number);
  const d = new Date(y, m-1, dd);
  d.setDate(d.getDate()+days);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function dueOf(id){ return STATE.due[id] || null; }
function reviewStatsOf(id){
  return STATE.reviewStats[String(id)] || {attempts:0,correct:0,wrong:0,lapses:0,lastReviewed:null,lastResult:null};
}
function wasSeen(id){
  const stats = reviewStatsOf(id);
  return boxOf(id)>0 || stats.attempts>0 || !!dueOf(id);
}
function isDueToday(id){
  const d = dueOf(id);
  return wasSeen(id) && (!d || d <= todayStr());
}
function recordReview(id, isCorrect){
  const key = String(id);
  const stats = reviewStatsOf(id);
  STATE.reviewStats[key] = {
    ...stats,
    attempts:stats.attempts+1,
    correct:stats.correct+(isCorrect?1:0),
    wrong:stats.wrong+(isCorrect?0:1),
    lapses:stats.lapses+(isCorrect?0:1),
    lastReviewed:todayStr(),
    lastResult:isCorrect?'correct':'wrong'
  };
}
function scheduleAfterAnswer(id, isCorrect){
  if(isCorrect){
    const box = boxOf(id);
    const baseInterval = SRS_INTERVAL_DAYS[box] || SRS_INTERVAL_DAYS[SRS_INTERVAL_DAYS.length-1];
    const lapsePenalty = Math.max(.55, 1-Math.min(.45, reviewStatsOf(id).lapses*.08));
    const interval = Math.max(1, Math.round(baseInterval*lapsePenalty));
    STATE.due[id] = addDaysStr(todayStr(), interval);
    STATE.wrongStreaks[id] = 0;
  } else {
    STATE.due[id] = todayStr();
    STATE.wrongStreaks[id] = (STATE.wrongStreaks[id]||0)+1;
  }
}

function boxOf(id){ return STATE.boxes[id]||0; }
function setBox(id, val){ STATE.boxes[id] = Math.max(0, Math.min(5,val)); }

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000); }
function pluralDays(n){
  const n10=n%10, n100=n%100;
  if(n100>=11&&n100<=14) return 'дней';
  if(n10===1) return 'день';
  if(n10>=2&&n10<=4) return 'дня';
  return 'дней';
}
function pluralWords(n){
  const n10=n%10, n100=n%100;
  if(n100>=11&&n100<=14) return 'слов';
  if(n10===1) return 'слово';
  if(n10>=2&&n10<=4) return 'слова';
  return 'слов';
}
/* Дневная цель упрощена по просьбе: не счётчик слов, а факт «сыграл хотя бы одну
   сессию сегодня» — вызывается один раз при завершении сессии (finishSession). */
function completeDailyGoalIfNeeded(){
  const today = todayStr();
  if(STATE.lastGoalDate === today) return;
  if(STATE.lastGoalDate){
    let gap = daysBetween(STATE.lastGoalDate, today) - 1;
    while(gap>0 && STATE.shields>0){ STATE.shields--; gap--; }
    STATE.dayStreak = gap>0 ? 1 : (STATE.dayStreak||0)+1;
  } else {
    STATE.dayStreak = 1;
  }
  STATE.lastGoalDate = today;
  if(STATE.dayStreak>0 && STATE.dayStreak%7===0) STATE.shields = Math.min(2, STATE.shields+1);
  saveState();
  queueToast(`Сегодняшняя серия засчитана! ${STATE.dayStreak} ${pluralDays(STATE.dayStreak)} подряд`, 'goal');
}

function levelInfo(xp){
  let lvl = 1, need = 150, total = 0;
  while(xp >= total+need){ total+=need; lvl++; need = 150 + (lvl-1)*40; }
  return { lvl, into: xp-total, need };
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- header stats ---------- */
function masteredCount(ids){
  const cards = ids
    ? ids.map(id=>LEARNING_BY_ID.get(String(id))).filter(Boolean)
    : LEARNING_VOCAB;
  const ordinary = cards.filter(w=>!w.verbFamilyId && boxOf(w.id)>=1).length;
  const families = new Set(cards.filter(w=>w.verbFamilyId).map(w=>w.verbFamilyId));
  let learnedFamilies = 0;
  families.forEach(familyId=>{
    const formIds = VERB_CARD_IDS_BY_FAMILY.get(familyId)||[];
    if(formIds.length && formIds.every(id=>boxOf(id)>=1)) learnedFamilies++;
  });
  return ordinary + learnedFamilies;
}
function isLearnedForReverse(w){
  if(!w.verbFamilyId) return boxOf(w.id)>=1;
  const formIds = VERB_CARD_IDS_BY_FAMILY.get(w.verbFamilyId)||[];
  return formIds.length>0 && formIds.every(id=>boxOf(id)>=1);
}
function renderStats(){
  const mastered = masteredCount();
  const streak = STATE.dayStreak||0;
  document.getElementById('statsHeroNumber').innerHTML = `
    <div class="stats-overview">
      <div class="stat-main">
        <span class="stat-main-num">${mastered}</span>
        <span class="stat-main-label"><strong>из ${TOTAL_LEARNING_UNITS}</strong> слов помню</span>
      </div>
      <div class="stat-streak">
        <span class="stat-streak-num">${streak}</span>
        <span class="stat-streak-label">${streak>0? pluralDays(streak)+' подряд' : 'дней подряд'}</span>
      </div>
    </div>
  `;
}

/* ---------- setup panel ---------- */
function migratedTopics(saved){
  if(!Array.isArray(saved)) return TOPIC_GROUPS.map(g=>g.key);
  const next = new Set(saved.filter(key=>TOPIC_GROUPS.some(g=>g.key===key)));
  if(saved.includes('lexicon')){ next.add('everyday'); next.add('phrases'); next.add('transport'); }
  if(saved.includes('bank')) next.add('work');
  return next.size ? [...next] : TOPIC_GROUPS.map(g=>g.key);
}
let selectedTopics = new Set(migratedTopics(STATE.selectedTopics));
/* Режим/длина сессии/дневная норма слов больше не выбираются пользователем —
   по просьбе упрощено до одного пути: карточки, 20 слов за раз. */
const selectedMode = 'flash';
const selectedLength = 20;

/* Детерминированная раскладка карты тем: три художественно контролируемых размера,
   чтобы большая категория не съедала экран, а маленькая не исчезала. */
const TOPIC_COLORS = {
  verbs:'var(--color-coral)', grammar:'var(--color-yellow)', everyday:'var(--color-blue)',
  phrases:'var(--color-orange)', food:'var(--color-yellow)', work:'var(--color-blue)',
  health:'var(--color-coral)', transport:'var(--color-mint)', idioms:'var(--color-blue)', songs:'var(--color-lilac)'
};
function blobColorFor(key){ return TOPIC_COLORS[key] || 'var(--color-lilac)'; }
const TOPIC_BLOB_SIZES = [220,190,240,210,225,215,195,230,245,205];
function renderTopics(){
  const el = document.getElementById('topics');
  const visible = TOPIC_GROUPS;
  const blobRadii = [
    '46% 54% 61% 39% / 54% 42% 58% 46%',
    '58% 42% 47% 53% / 39% 61% 43% 57%',
    '38% 62% 54% 46% / 64% 36% 58% 42%',
    '67% 33% 51% 49% / 45% 55% 40% 60%',
    '49% 51% 34% 66% / 58% 42% 65% 35%'
  ];
  const blobBackgrounds = [
    'radial-gradient(ellipse 70% 78% at 32% 42%, var(--blob-color) 0 22%, color-mix(in srgb,var(--blob-color) 72%,transparent) 48%, transparent 100%), radial-gradient(ellipse 54% 56% at 70% 64%, color-mix(in srgb,var(--blob-color) 58%,transparent) 0 18%, transparent 100%)',
    'radial-gradient(ellipse 68% 74% at 62% 38%, var(--blob-color) 0 24%, color-mix(in srgb,var(--blob-color) 74%,transparent) 50%, transparent 100%), radial-gradient(ellipse 50% 58% at 30% 68%, color-mix(in srgb,var(--blob-color) 54%,transparent) 0 20%, transparent 100%)',
    'radial-gradient(ellipse 72% 76% at 42% 56%, var(--blob-color) 0 23%, color-mix(in srgb,var(--blob-color) 73%,transparent) 48%, transparent 100%), radial-gradient(ellipse 48% 52% at 78% 34%, color-mix(in srgb,var(--blob-color) 52%,transparent) 0 18%, transparent 100%)',
    'radial-gradient(ellipse 70% 80% at 68% 58%, var(--blob-color) 0 25%, color-mix(in srgb,var(--blob-color) 74%,transparent) 50%, transparent 100%), radial-gradient(ellipse 54% 54% at 28% 30%, color-mix(in srgb,var(--blob-color) 56%,transparent) 0 19%, transparent 100%)',
    'radial-gradient(ellipse 68% 76% at 48% 40%, var(--blob-color) 0 21%, color-mix(in srgb,var(--blob-color) 72%,transparent) 46%, transparent 100%), radial-gradient(ellipse 52% 56% at 74% 70%, color-mix(in srgb,var(--blob-color) 56%,transparent) 0 18%, transparent 100%)'
  ];
  const blobTransforms = ['rotate(-7deg) scale(1.04,.9)','rotate(6deg) scale(.96,1.05)','rotate(-3deg) scale(1.08,.94)','rotate(8deg) scale(.98,1.04)','rotate(-5deg) scale(1.02,.92)'];
  const weeklyIds = LEARNING_VOCAB.filter(w=>w.isWeekly).map(w=>w.id);
  const weeklyCount = weeklyIds.length;
  const weeklyLearned = masteredCount(weeklyIds);
  /* Если недельных слов нет, не оставляем наверху пустое место под их облако. */
  const firstTopicTop = weeklyCount ? 230 : 18;
  const topicLayouts = [
    {side:'left'}, {side:'right'}, {side:'left'}, {side:'right'}, {side:'left'},
    {side:'right'}, {side:'left'}, {side:'right'}, {side:'left'}, {side:'right'}
  ].map((layout,index)=>({...layout,top:firstTopicTop+(index*190)}));
  const weeklyStyle = '--blob-top:42px; --blob-size:260px; --blob-color:var(--color-lilac); --topic-progress:'+(weeklyCount ? (weeklyLearned/weeklyCount).toFixed(3) : '0')+'; --topic-final-opacity:1; --topic-delay:0s; --topic-drift:8s; --blob-transform:rotate(-4deg) scale(1.03,.92); --blob-radius:58% 42% 52% 48% / 46% 57% 43% 54%; --blob-background:radial-gradient(ellipse 72% 76% at 38% 42%, var(--blob-color) 0 23%, color-mix(in srgb,var(--blob-color) 74%,transparent) 46%, transparent 100%), radial-gradient(ellipse 52% 56% at 72% 62%, color-mix(in srgb,var(--blob-color) 56%,transparent) 0 18%, transparent 100%)';
  const weeklyCloud = weeklyCount ? `<button class="topic-blob weekly-topic topic-center on" data-key="weekly" aria-label="Начать тему «Слова этой недели» — ${weeklyCount} ${pluralWords(weeklyCount)}" style="${weeklyStyle}">
    <span class="topic-name">Слова этой недели</span>
    <span class="topic-meta">${weeklyLearned} из ${weeklyCount}</span>
  </button>` : '';
  const weeklyBlob = weeklyCount ? `<div class="topic-color-blob topic-color-center" style="${weeklyStyle}" aria-hidden="true"></div>` : '';
  const colorBlobs = [];
  const topicClouds = visible.map(g=>{
    const index = visible.indexOf(g);
    const on = true;
    const count = GROUP_COUNTS[g.key]||0;
    const ids = LEARNING_VOCAB.filter(w=>w.group===g.key).map(w=>w.id);
    const learned = masteredCount(ids);
    const progress = count ? learned/count : 0;
    const size = TOPIC_BLOB_SIZES[index%TOPIC_BLOB_SIZES.length];
    const color = blobColorFor(g.key);
    const finalOpacity = on ? 1 : .46;
    const layout = topicLayouts[index];
    const positionClass = layout.side==='right' ? 'topic-right' : (layout.side==='center' ? 'topic-center' : 'topic-left');
    const style = `--blob-top:${layout.top}px; --blob-size:${size}px; --blob-color:${color}; --topic-progress:${progress.toFixed(3)}; --topic-final-opacity:${finalOpacity.toFixed(3)}; --topic-delay:${((index+1)*.045).toFixed(2)}s; --topic-drift:${7+(index%4)}s; --blob-transform:${blobTransforms[index%blobTransforms.length]}; --blob-radius:${blobRadii[index%blobRadii.length]}; --blob-background:${blobBackgrounds[index%blobBackgrounds.length]}`;
    colorBlobs.push(`<div class="topic-color-blob topic-color-${layout.side}" style="${style}" aria-hidden="true"></div>`);
    return `<button class="topic-blob on ${positionClass}" data-key="${g.key}" aria-label="Начать тему «${g.label}» — ${count} ${pluralWords(count)}" style="${style}">
      <span class="topic-name">${g.label}</span>
      <span class="topic-meta">${learned} из ${count}</span>
    </button>`;
  }).join('');
  el.style.setProperty('--topic-count', String(visible.length + (weeklyCount ? 1 : 0)));
  el.innerHTML = `<div class="topic-color-field" aria-hidden="true">${weeklyBlob}${colorBlobs.join('')}</div>${weeklyCloud}${topicClouds}`;
  el.querySelectorAll('.topic-blob').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      chip.classList.add('launching');
      setTimeout(()=>startSession(chip.dataset.key), reduceMotion ? 0 : 160);
    });
  });
}
function currentPool(topicKey=null){
  if(topicKey==='weekly') return LEARNING_VOCAB.filter(w=>w.isWeekly);
  return topicKey ? LEARNING_VOCAB.filter(w=>w.group===topicKey) : LEARNING_VOCAB;
}
function renderPoolHint(){
  document.getElementById('poolHint').textContent = '';
  document.getElementById('startBtn').disabled = LEARNING_VOCAB.length===0;
}

/* ---------- сад достижений ---------- */
/* Один сад вместо отдельных «коллекции» и «ачивок»: каждый цветок — это разовая
   награда за конкретное условие (счёт слов, стрик, поведение). Пока цветок не
   распустился, его вид — секрет (показываем силуэт-бутон и «?»); какой именно
   вид достанется — определено заранее детерминированно по id (не Math.random),
   просто скрыто от игрока до момента открытия. «Цена» растёт от одного
   правильного ответа до полного набора слов, попеременно чередуя счётные
   условия (сколько слов выучено) и поведенческие (серия дней, идеальная
   сессия, ночная сессия, марафон) — чтобы сад открывался и от объёма, и от
   регулярности занятий, а не только от одного показателя. */
function buildFlowerSVG(petals, color, bud){
  const cx=32, cy=36;
  if(bud){
    return `<svg viewBox="0 0 64 64"><path d="M32 20 Q40 30 32 48 Q24 30 32 20 Z" fill="${color}"/><path d="M32 48 L32 58" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  let shapes = `<path d="M32 36 L32 58" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  for(let i=0;i<petals;i++){
    const angle = (360/petals)*i;
    shapes += `<ellipse cx="${cx}" cy="${cy-13}" rx="6" ry="11" fill="${color}" transform="rotate(${angle} ${cx} ${cy})"/>`;
  }
  shapes += `<circle cx="${cx}" cy="${cy}" r="6" fill="var(--color-bg)"/>`;
  return `<svg viewBox="0 0 64 64">${shapes}</svg>`;
}
const FLOWER_NAMES = ['Aurora Bloom','Sunny Disc','Mindful Lotus','Focus Bell','Curious Star','Harmony Clover','Wisdom Flame','Patience Pebble','Courage Bloom','Gratitude Glow','Dreamweaver','Golden Hour','Silent Whisper','Bold Compass','Gentle Cloud','Deep Breath','Inner Light','Little Spark','Inner Garden','New Path','Morning Dew','Higher Mind','Bright Steps','Soft Landing','Clear Sky','Wild Spirit','Still Water','True North','Inner Garden','Lightness','Focus Flow','Rising Sun','Kindred Soul','Third Eye','Balance Point','Fire Within','Quiet Power','Soul Star','Magic Hour','Grateful Heart','Flowing Grace','Moonlit Path','Seed of Hope','Radiant You','Zen Garden','Infinite Calm','Joyful Heart','Open Sky','Ember Glow','Blooming Self'];
const GARDEN = FLOWER_NAMES.map((name, index)=>{
  const target = (index + 1) * 25;
  return {id:'flower'+(index+1), name, imageIndex:index, petals:6, color:'var(--color-green)', costLabel:target+' слов', desc:'Выучи '+target+' слов', cost:()=>masteredCount()>=target, progress:()=>({current:Math.min(masteredCount(),target), target, label:Math.min(masteredCount(),target)+' из '+target+' слов'})};
});
function unlockFlag(id){
  if(STATE.achievements[id]) return;
  STATE.achievements[id] = todayStr();
  saveState();
}
function gardenProgress(f){
  if(f.progress) return f.progress();
  if(/^m\d+$/.test(f.id)){
    const target = Number(f.id.slice(1));
    return {current:Math.min(masteredCount(), target), target, label:`${Math.min(masteredCount(), target)} из ${target} слов`};
  }
  if(f.id.startsWith('streak')){
    const target = Number(f.id.slice(6));
    return {current:Math.min(STATE.dayStreak||0, target), target, label:`${Math.min(STATE.dayStreak||0, target)} из ${target} дней`};
  }
  if(f.id==='sprout') return {current:Math.min(STATE.totalCorrectEver||0,1), target:1, label:`${Math.min(STATE.totalCorrectEver||0,1)} из 1 ответа`};
  const unlocked = STATE.announcedCollectibles.includes(f.id);
  return {current:unlocked?1:0, target:1, label:unlocked?'открыто':'ещё впереди'};
}
function renderGarden(justUnlocked=[]){
  const unlockedFlowers = GARDEN.filter(f=>STATE.announcedCollectibles.includes(f.id));
  const grid = document.getElementById('gardenGrid');
  grid.innerHTML = unlockedFlowers.map(f=>{
    const col = f.imageIndex % 10;
    const row = Math.floor(f.imageIndex / 10);
    return `<div class="showcase-item unlocked ${justUnlocked.includes(f.id)?'just-unlocked':''}" title="${f.desc}">
      <div class="showcase-icon" style="--flower-x:${(col*11.111).toFixed(3)}%;--flower-y:${(row*25).toFixed(3)}%;"></div>
    </div>`;
  }).join('');
  grid.classList.toggle('has-new-flower', justUnlocked.length>0);
  grid.style.display = unlockedFlowers.length ? 'flex' : 'none';
  const next = GARDEN.find(f=>!STATE.announcedCollectibles.includes(f.id));
  const nextEl = document.getElementById('gardenNext');
  if(!next){ nextEl.innerHTML = '<span>Сад полностью распустился</span>'; return; }
  const nextProgress = gardenProgress(next);
  const remaining = nextProgress.target-nextProgress.current;
  nextEl.innerHTML = `<span>Чтобы расцвёл следующий цветок, выучи ещё ${remaining} ${pluralWords(remaining)}</span>`;
}
function checkGarden(){
  let unlockedNew = false;
  const justUnlocked = [];
  GARDEN.forEach(f=>{
    if(!STATE.announcedCollectibles.includes(f.id) && f.cost()){
      STATE.announcedCollectibles.push(f.id);
      justUnlocked.push(f.id);
      saveState();
      queueToast(`Сад: распустился цветок «${f.name}»`, 'achv');
      unlockedNew = true;
    }
  });
  if(unlockedNew) renderGarden(justUnlocked);
}

renderTopics(); renderPoolHint(); renderStats(); renderGarden();

/* ---------- session engine ---------- */
let session = null;

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
/* Исследовательски обоснованная очередь:
   1) просроченные повторения раньше новых слов;
   2) среди повторений раньше идут самые просроченные и трудные;
   3) за одну сессию добавляется не больше шести новых слов;
   4) в общей тренировке темы чередуются, а формы одного глагола не стоят рядом.
   Мы намеренно не показываем будущие карточки раньше срока: если всё сделано,
   лучше закончить короткую сессию, чем превратить spacing в перечитывание. */
const MAX_NEW_PER_SESSION = 6;
function overdueDays(id){
  const due = dueOf(id);
  return due ? Math.max(0, daysBetween(due, todayStr())) : 0;
}
function difficultyScore(w){
  const stats = reviewStatsOf(w.id);
  return overdueDays(w.id)*10 + stats.lapses*4 + stats.wrong*1.5 + (5-boxOf(w.id))*2;
}
function compareReviewPriority(a,b){
  const priority = difficultyScore(b)-difficultyScore(a);
  if(priority) return priority;
  const aLast = reviewStatsOf(a.id).lastReviewed||'';
  const bLast = reviewStatsOf(b.id).lastReviewed||'';
  if(aLast!==bLast) return aLast<bLast?-1:1;
  return String(a.id).localeCompare(String(b.id));
}
function roundRobinByGroup(cards, limit){
  const buckets = new Map();
  shuffle(cards).forEach(card=>{
    const key = card.group||'other';
    if(!buckets.has(key)) buckets.set(key,[]);
    buckets.get(key).push(card);
  });
  const keys = shuffle([...buckets.keys()]);
  const result = [];
  while(result.length<limit && keys.length){
    for(let i=0;i<keys.length && result.length<limit;){
      const bucket = buckets.get(keys[i]);
      const card = bucket.shift();
      if(card) result.push(card);
      if(!bucket.length) keys.splice(i,1); else i++;
    }
  }
  return result;
}
function takeNewCards(cards, limit, topicKey){
  if(limit<=0) return [];
  if(topicKey) return shuffle(cards).slice(0,limit);
  const weekly = cards.filter(w=>w.isWeekly);
  const other = cards.filter(w=>!w.isWeekly);
  const weeklyLimit = Math.min(weekly.length, Math.ceil(limit*.6));
  const selected = roundRobinByGroup(weekly, weeklyLimit);
  return selected.concat(roundRobinByGroup(other, limit-selected.length));
}
function interleaveSelectedCards(cards, topicKey){
  const remaining = cards.slice();
  const result = [];
  while(remaining.length){
    const previous = result[result.length-1];
    const previousKey = previous && (previous.verbFamilyId || (!topicKey && previous.group));
    let pickIndex = remaining.findIndex((card,index)=>{
      if(index>5) return false;
      const key = card.verbFamilyId || (!topicKey && card.group);
      return !previousKey || key!==previousKey;
    });
    if(pickIndex<0) pickIndex=0;
    result.push(remaining.splice(pickIndex,1)[0]);
  }
  return result;
}
function buildQueue(pool, n, topicKey=null){
  const reviews = pool.filter(w=>isDueToday(w.id)).sort(compareReviewPriority);
  const unseen = pool.filter(w=>!wasSeen(w.id));
  const selectedReviews = reviews.slice(0,n);
  const newSlots = Math.min(MAX_NEW_PER_SESSION, n-selectedReviews.length);
  const selectedNew = takeNewCards(unseen,newSlots,topicKey);
  return interleaveSelectedCards(selectedReviews.concat(selectedNew),topicKey);
}

function startSession(topicKey=null){
  const pool = currentPool(topicKey);
  if(!pool.length) return;
  const n = selectedLength === 'весь набор' ? pool.length : selectedLength;
  const queue = buildQueue(pool, n, topicKey);
  if(!queue.length){
    showToast(topicKey ? 'В этой теме на сегодня всё повторено' : 'На сегодня всё повторено');
    return;
  }
  session = { queue, pool, topicKey, i:0, mode:selectedMode, correct:0, wrong:0, xpStart:STATE.xp, missed:[], requeues:{}, fullDeck:selectedLength==='весь набор' };
  document.getElementById('setup').style.display = 'none';
  document.getElementById('summary').style.display = 'none';
  document.getElementById('session').style.display = 'flex';
  document.body.classList.add('session-active');
  renderQuestion();
}
document.getElementById('startBtn').addEventListener('click', ()=>startSession());
document.getElementById('exitBtn').addEventListener('click', endSession);

function updateSessionProgress(){
  const pct = Math.round((session.i+1)/session.queue.length*100);
  document.getElementById('sessProgFill').style.width = pct+'%';
  document.getElementById('sessionCount').textContent = `${Math.min(session.i+1,session.queue.length)} / ${session.queue.length}`;
}

function renderQuestion(){
  if(!session) return;
  if(session.i >= session.queue.length){ return finishSession(); }
  updateSessionProgress();
  const w = session.queue[session.i];
  const stage = document.getElementById('stage');
  stage.className = 'stage question-enter';
  const groupLabel = session.topicKey==='weekly'
    ? 'Слова этой недели'
    : (TOPIC_GROUPS.find(g=>g.key===w.group)?.label || '');
  const cardLabel = w.formLabel || groupLabel;
  if(session.mode==='flash') renderFlash(stage, w, cardLabel);
  else if(session.mode==='mc') renderMC(stage, w, cardLabel);
  else renderType(stage, w, cardLabel);
}

function afterAnswer(isCorrect, w, xpGain){
  const stage = document.getElementById('stage');
  stage.classList.remove('question-enter');
  stage.classList.add(isCorrect?'correct':'wrong');
  if(isCorrect){
    STATE.streak++; STATE.bestStreak = Math.max(STATE.bestStreak, STATE.streak);
    setBox(w.id, boxOf(w.id)+1); recordReview(w.id,true); session.correct++;
    session.missed = session.missed.filter(card=>String(card.id)!==String(w.id));
    scheduleAfterAnswer(w.id, true);
    const before = levelInfo(STATE.xp);
    STATE.xp += xpGain;
    const after = levelInfo(STATE.xp);
    if(after.lvl>before.lvl) queueToast(`Новый уровень: ${after.lvl}`, 'gold');
    STATE.totalCorrectEver++;
    const hour = new Date().getHours();
    if(hour<5) unlockFlag('night_owl');
  } else {
    STATE.streak = 0; setBox(w.id, Math.max(0, boxOf(w.id)-1));
    recordReview(w.id,false);
    scheduleAfterAnswer(w.id, false);
    session.wrong++;
    if(!session.missed.some(card=>String(card.id)===String(w.id))) session.missed.push(w);
    const key = String(w.id);
    if((session.requeues[key]||0)<1){
      session.requeues[key] = (session.requeues[key]||0)+1;
      const returnAt = Math.min(session.queue.length, session.i+4);
      session.queue.splice(returnAt,0,w);
    }
  }
  STATE.cardUpdatedAt[String(w.id)] = new Date().toISOString();
  saveState(); renderStats();
  checkGarden();
  setTimeout(()=>{ session.i++; renderQuestion(); }, isCorrect?550:900);
}

/* flashcards */
function mnemonicHintHtml(w){
  const m = STATE.mnemonics[w.id];
  return m ? `<div class="mnemonic-hint">💡 ${escapeHtml(m)}</div>` : '';
}
function escapeHtml(value){
  const node = document.createElement('span');
  node.textContent = String(value);
  return node.innerHTML;
}
function contextLineHtml(w){
  if(!w.ctx) return '';
  const c = VOCAB[w.ctx];
  if(!c) return '';
  return `<div class="context-line"><span class="font-hebrew">${c.h}</span><span class="context-sep">—</span>${c.r}</div>`;
}
function mnemonicPromptHtml(w){
  if(STATE.mnemonics[w.id]) return '';
  if((STATE.wrongStreaks[w.id]||0) < 3) return '';
  return `<div class="mnemonic-prompt">
    <p>Это слово пока не запоминается — добавь свою подсказку</p>
    <div class="mnemonic-form">
      <input class="mnemonic-input" id="mnemonicInput" placeholder="например: похоже на…">
      <button class="mnemonic-save" id="mnemonicSave">Сохранить</button>
    </div>
  </div>`;
}
function attachMnemonicSave(w){
  const saveBtn = document.getElementById('mnemonicSave');
  if(!saveBtn) return;
  saveBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const input = document.getElementById('mnemonicInput');
    const val = input.value.trim();
    if(val){
      STATE.mnemonics[w.id] = val;
      STATE.cardUpdatedAt[String(w.id)] = new Date().toISOString();
      saveState();
      renderQuestion();
    }
  });
}
const CARD_FEEDBACK_QUEUE_KEY = 'hebrewTrainer_pendingCardFeedback';
function cardFeedbackSignature(w){
  const source = `${w.h}|${w.t}|${w.r}`;
  let hash = 2166136261;
  for(let i=0;i<source.length;i++){
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash>>>0).toString(36);
}
function cardFeedbackStorageKey(w){
  return `hebrewTrainer_cardFeedback:${activeProfile}:${w.id}:${cardFeedbackSignature(w)}`;
}
function pendingCardFeedback(){
  try{
    const parsed = JSON.parse(localStorage.getItem(CARD_FEEDBACK_QUEUE_KEY)||'[]');
    return Array.isArray(parsed) ? parsed : [];
  }catch(error){ return []; }
}
function savePendingCardFeedback(items){
  localStorage.setItem(CARD_FEEDBACK_QUEUE_KEY, JSON.stringify(items));
}
async function submitCardFeedback(report){
  const {error} = await supabaseClient.from('card_feedback').insert(report);
  if(error && error.code!=='23505') throw error;
}
async function flushPendingCardFeedback(){
  if(!navigator.onLine) return;
  const queued = pendingCardFeedback();
  if(!queued.length) return;
  const remaining = [];
  for(const report of queued){
    try{ await submitCardFeedback(report); }
    catch(error){ remaining.push(report); }
  }
  savePendingCardFeedback(remaining);
}
window.addEventListener('online', flushPendingCardFeedback);
function attachCardFeedback(w, reverse, groupLabel){
  const button = document.getElementById('reportCardError');
  if(!button) return;
  const storageKey = cardFeedbackStorageKey(w);
  try{
    if(localStorage.getItem(storageKey)==='1'){
      button.textContent = 'Отправлено на проверку';
      button.disabled = true;
      return;
    }
  }catch(error){}
  button.addEventListener('click', async event=>{
    event.stopPropagation();
    button.disabled = true;
    button.textContent = 'Отправляю…';
    const context = w.ctx ? VOCAB[w.ctx] : null;
    const report = {
      profile_id:activeProfile,
      card_id:String(w.id),
      card_data:{
        hebrew:w.h,
        transcription:w.t,
        translation:w.r,
        example:context ? {hebrew:context.h, transcription:context.t||'', translation:context.r} : null,
        group:w.group,
        groupLabel,
        formLabel:w.formLabel||null,
        direction:reverse?'russian_to_hebrew':'hebrew_to_russian',
        sourceHebrew:w.source_h||null,
        sourceTranscription:w.source_t||null,
        sourceTranslation:w.source_r||null
      },
      page_url:`${location.origin}${location.pathname}`
    };
    try{
      await submitCardFeedback(report);
      try{ localStorage.setItem(storageKey,'1'); }catch(error){}
      button.textContent = 'Отправлено на проверку';
      queueToast('Спасибо — проверю эту карточку', 'achv');
    }catch(error){
      const queued = pendingCardFeedback();
      if(!queued.some(item=>item.profile_id===report.profile_id && item.card_id===report.card_id)){
        queued.push(report);
        savePendingCardFeedback(queued);
      }
      try{ localStorage.setItem(storageKey,'1'); }catch(storageError){}
      button.textContent = 'Отправим, когда появится интернет';
      queueToast('Сохранили — отправим при подключении', 'achv');
    }
  });
  flushPendingCardFeedback();
}
function renderFlash(stage, w, groupLabel){
  const reverse = isLearnedForReverse(w);
  const frontHtml = reverse
    ? `<div class="hebrew-word reverse-front" style="font-size:${russianPromptFontSize(w.r)}">${w.r}</div>`
    : `<div class="hebrew-word font-hebrew" style="font-size:${hebrewFontSize(w.h)}">${w.h}</div>`;
  stage.classList.add('flash-stage');
  stage.style.setProperty('--stage-color', blobColorFor(w.group));
  stage.innerHTML = `
    <div class="flip-zone${reverse?' reverse-card':''}" id="flipZone" role="button" tabindex="0" aria-label="Перевернуть карточку" aria-expanded="false">
      <div class="flash-focus">
        <div class="flash-word-stack">
          ${frontHtml}
          <div class="card-back" id="cardBack" aria-hidden="true">
            ${reverse? `<div class="back-hebrew font-hebrew" style="font-size:${hebrewFontSize(w.h)}">${w.h}</div>` : ''}
            ${w.t? `<div class="translit">${w.t}</div>` : ''}
            <div class="russian-word" style="font-size:${russianFontSize(w.r)}">${w.r}</div>
            ${contextLineHtml(w)}
            ${mnemonicHintHtml(w)}
            <button class="report-card-error" id="reportCardError" type="button">Кажется, здесь ошибка</button>
          </div>
        </div>
      </div>
    </div>
    <div class="know-row" id="knowRow" style="display:none;">
      <button class="know-btn no" id="btnNo">Ещё учу</button>
      <button class="know-btn yes" id="btnYes">Знаю</button>
    </div>
    <div id="mnemonicWrap" style="display:none;">${mnemonicPromptHtml(w)}</div>
  `;
  const zone = document.getElementById('flipZone');
  const toggleCard = ()=>{
    zone.classList.toggle('revealed');
    const shown = zone.classList.contains('revealed');
    zone.setAttribute('aria-expanded', String(shown));
    document.getElementById('cardBack').setAttribute('aria-hidden', String(!shown));
    document.getElementById('knowRow').style.display = shown ? 'flex':'none';
    document.getElementById('mnemonicWrap').style.display = shown ? 'block':'none';
  };
  zone.addEventListener('click', toggleCard);
  zone.addEventListener('keydown', event=>{
    if(event.key==='Enter' || event.key===' '){ event.preventDefault(); toggleCard(); }
  });
  document.getElementById('btnYes').addEventListener('click', (e)=>{ e.stopPropagation(); afterAnswer(true, w, 3); });
  document.getElementById('btnNo').addEventListener('click', (e)=>{ e.stopPropagation(); afterAnswer(false, w, 0); });
  attachMnemonicSave(w);
  attachCardFeedback(w, reverse, groupLabel);
}

/* multiple choice */
function renderMC(stage, w, groupLabel){
  const distractPool = session.pool.filter(x=>x.id!==w.id && x.r!==w.r);
  const samePool = distractPool.filter(x=>x.group===w.group);
  const src = samePool.length>=3 ? samePool : distractPool;
  const distractors = [];
  const usedIdx = new Set();
  while(distractors.length<3 && usedIdx.size<src.length){
    const idx = Math.floor(Math.random()*src.length);
    if(usedIdx.has(idx)) continue;
    usedIdx.add(idx); distractors.push(src[idx]);
  }
  const options = [...distractors, w].sort(()=>Math.random()-0.5);
  const checkMark = `<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M4 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const crossMark = `<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>`;
  stage.style.setProperty('--stage-color', blobColorFor(w.group));
  stage.innerHTML = `
    <span class="topic-tag">${groupLabel}</span>
    ${mnemonicHintHtml(w)}
    <div class="mc-prompt font-hebrew" style="font-size:${hebrewFontSize(w.h)}">${w.h}</div>
    <div class="mc-list" id="mcGrid">
      ${options.map(o=>`<button class="mc-opt" data-id="${o.id}"><span>${o.r}</span></button>`).join('')}
    </div>
    <div id="mcContext"></div>
  `;
  document.querySelectorAll('.mc-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.mc-opt').forEach(b=>b.disabled=true);
      const isCorrect = Number(btn.dataset.id)===w.id;
      btn.classList.add(isCorrect?'correct':'wrong');
      btn.insertAdjacentHTML('beforeend', isCorrect?checkMark:crossMark);
      if(!isCorrect){
        const rightBtn = document.querySelector(`.mc-opt[data-id="${w.id}"]`);
        if(rightBtn){ rightBtn.classList.add('correct'); rightBtn.insertAdjacentHTML('beforeend', checkMark); }
      }
      document.getElementById('mcContext').innerHTML = contextLineHtml(w);
      afterAnswer(isCorrect, w, 5);
    });
  });
}

/* typing mode */
function normalizeTranslit(s){
  return s.toLowerCase()
    .replace(/ё/g,'е')
    .replace(/[^a-zа-я0-9\s]/gi,'')
    .replace(/\s+/g,' ')
    .trim();
}
function levenshtein(a,b){
  const dp = Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);
  for(let j=0;j<=b.length;j++) dp[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++){
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  }
  return dp[a.length][b.length];
}
function renderType(stage, w, groupLabel){
  const hasTranslit = !!w.t;
  const promptText = hasTranslit ? w.r : w.h;
  const subText = hasTranslit ? 'напиши произношение на иврите (кириллицей)' : 'напиши перевод на русский';
  const promptClass = hasTranslit ? 'type-prompt' : 'type-prompt font-hebrew';
  const promptSize = hasTranslit ? russianFontSize(promptText) : hebrewFontSize(promptText);
  stage.style.setProperty('--stage-color', blobColorFor(w.group));
  stage.innerHTML = `
    <span class="topic-tag">${groupLabel}</span>
    ${mnemonicHintHtml(w)}
    <div class="${promptClass}" style="font-size:${promptSize}">${promptText}</div>
    <div class="type-sub">${subText}</div>
    <input class="type-input" id="typeInput" autocomplete="off" spellcheck="false" placeholder="${hasTranslit?'произношение…':'перевод…'}">
    <div class="type-actions">
      <button class="type-submit" id="typeSubmit">Проверить</button>
      <button class="type-reveal" id="typeReveal">Показать ответ</button>
    </div>
    <div class="reveal-answer" id="revealBox" style="display:none;"></div>
  `;
  const input = document.getElementById('typeInput');
  input.focus();
  let answered = false;
  function submit(reveal){
    if(answered) return; answered = true;
    const val = normalizeTranslit(input.value);
    const target = normalizeTranslit(hasTranslit ? w.t : w.r);
    const dist = levenshtein(val, target);
    const isCorrect = !reveal && (val===target || (target.length>4 && dist<=1));
    input.classList.add(isCorrect?'correct':'wrong');
    input.disabled = true;
    document.getElementById('revealBox').style.display = 'block';
    document.getElementById('revealBox').innerHTML = (hasTranslit
      ? `${w.h} — <b>${w.t}</b>`
      : `<span class="font-hebrew">${w.h}</span> — <b>${w.r}</b>`) + contextLineHtml(w);
    afterAnswer(isCorrect, w, 8);
  }
  document.getElementById('typeSubmit').addEventListener('click', ()=>submit(false));
  document.getElementById('typeReveal').addEventListener('click', ()=>submit(true));
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') submit(false); });
}

/* ---------- summary ---------- */
function finishSession(){
  document.body.classList.remove('session-active');
  document.getElementById('session').style.display = 'none';
  const s = document.getElementById('summary');
  s.style.display = 'flex';
  const xpGained = STATE.xp - session.xpStart;
  const total = session.correct+session.wrong;
  const acc = total? Math.round(session.correct/total*100) : 0;
  if(session.wrong===0 && total>=10) unlockFlag('perfect_session');
  if(session.fullDeck) unlockFlag('full_deck');
  completeDailyGoalIfNeeded();
  saveState(); renderStats();
  checkGarden();
  const summaryColor = acc>=70 ? 'var(--color-mint)' : 'var(--color-orange)';
  s.innerHTML = `
    <div class="summary-cloud" style="--summary-color:${summaryColor}">
      <p class="eyebrow">Сессия завершена</p>
      <h2>${acc}%</h2>
      <div class="summary-grid">
        <div class="summary-stat"><span class="n">${session.correct}</span><span class="l">верно</span></div>
        <div class="summary-stat"><span class="n">${session.wrong}</span><span class="l">ошибок</span></div>
        <div class="summary-stat"><span class="n">+${xpGained}</span><span class="l">опыта</span></div>
      </div>
    </div>
    <div class="summary-actions">
      ${session.missed.length? '<button class="summary-action" style="--action-color:var(--color-coral)" id="retryMissed">Повторить ошибки</button>' : ''}
      <button class="summary-action" style="--action-color:var(--color-blue)" id="newSession">На главную</button>
    </div>
  `;
  if(session.missed.length){
    document.getElementById('retryMissed').addEventListener('click', ()=>{
      const missed = session.missed;
      session = { queue: missed, pool: session.pool, topicKey:session.topicKey, i:0, mode:session.mode, correct:0, wrong:0, xpStart:STATE.xp, missed:[], requeues:{}, fullDeck:false };
      s.style.display='none';
      document.getElementById('session').style.display='flex';
      document.body.classList.add('session-active');
      renderQuestion();
    });
  }
  document.getElementById('newSession').addEventListener('click', endSession);
}

function endSession(){
  document.body.classList.remove('session-active');
  session = null;
  document.getElementById('session').style.display = 'none';
  document.getElementById('summary').style.display = 'none';
  document.getElementById('setup').style.display = 'flex';
  renderStats(); renderPoolHint(); renderGarden();
}

/* ---------- toast queue ---------- */
let toastQueue = [];
let toastBusy = false;
function queueToast(msg, tone){
  toastQueue.push({msg, tone: tone||'gold'});
  processToastQueue();
}
function processToastQueue(){
  if(toastBusy || !toastQueue.length) return;
  toastBusy = true;
  const {msg, tone} = toastQueue.shift();
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast-tone-'+tone;
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=>{ toastBusy = false; processToastQueue(); }, 400);
  }, 2200);
}
function showToast(msg){ queueToast(msg, 'gold'); }

function isStandaloneApp(){
  return window.navigator.standalone===true || window.matchMedia('(display-mode: standalone)').matches;
}
function isIOSSafari(){
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const alternateBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && /Safari/.test(ua) && !alternateBrowser;
}
function setupInstallHint(){
  const hint = document.getElementById('installHint');
  const close = document.getElementById('installHintClose');
  if(!hint || !close || isStandaloneApp() || !isIOSSafari()) return;
  let dismissed = false;
  try{ dismissed = localStorage.getItem('hebrewTrainer_installHintSeen')==='1'; }catch(error){}
  if(dismissed) return;
  const showTimer = setTimeout(()=>hint.classList.add('show'),1400);
  close.addEventListener('click',()=>{
    clearTimeout(showTimer);
    hint.classList.remove('show');
    try{ localStorage.setItem('hebrewTrainer_installHintSeen','1'); }catch(error){}
  });
}
function finishBootSplash(){
  const elapsed = performance.now();
  setTimeout(()=>document.body.classList.add('app-ready'), Math.max(0,420-elapsed));
}
if(document.readyState==='complete') finishBootSplash();
else window.addEventListener('load',finishBootSplash,{once:true});
setTimeout(()=>document.body.classList.add('app-ready'),2600);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./'})
      .then(()=>navigator.serviceWorker.ready)
      .then(registration=>{
        registration.active?.postMessage({
          type:'CACHE_URLS',
          urls:window.__PROFILE_ASSETS||[]
        });
      })
      .catch(error=>console.warn('Офлайн-режим не включился',error));
  },{once:true});
}

function applyProfileUI(){
  const gate = document.getElementById('profileGate');
  const app = document.getElementById('appWrap');
  const switcher = document.getElementById('profileSwitch');
  const hasProfile = !!activeProfile;
  gate.style.display = hasProfile ? 'none' : 'grid';
  app.style.display = hasProfile ? '' : 'none';
  if(hasProfile){
    switcher.textContent = PROFILE_NAMES[activeProfile] || activeProfile;
    app.classList.add('cloud-loading');
    loadStateFromCloud();
  }
}
document.querySelectorAll('[data-profile]').forEach(button=>{
  button.addEventListener('click', ()=>{
    activeProfile = button.dataset.profile;
    localStorage.setItem('hebrewTrainer_activeProfile', activeProfile);
    location.reload();
  });
});
document.getElementById('profileSwitch').addEventListener('click', ()=>{
  activeProfile = null;
  localStorage.removeItem('hebrewTrainer_activeProfile');
  applyProfileUI();
});
applyProfileUI();
setupInstallHint();
