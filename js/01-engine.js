const SAVE = 'eng_progress_v2';
// 熟練度 = 連續累積 %(取代舊計次;見 DESIGN_MASTERY.md)
const MASTERY_OK = 25, MASTERY_BAD = 20, LEARNED = 100;   // 答對 +25% / 答錯 −20% / 100% = 學會
// 進度:每字一筆 { taught, mastery(0~100) }。教只記 taught、不加 %。難度跟 mastery 走:低→認、中→說、高→寫。
const tierOfMastery = m => m < 34 ? 1 : m < 67 ? 2 : 3;   // 單字 % → 該出第幾階題型
let store = (() => { try { return JSON.parse(localStorage.getItem(SAVE)) || {}; } catch { return {}; } })();
const wordKey = w => w.id || w.en;
const save = () => localStorage.setItem(SAVE, JSON.stringify(store));
function migrateProgressStore() {
  let changed = false;
  BANK.forEach(w => {
    const key = wordKey(w);
    if (store[w.en] && !store[key]) { store[key] = store[w.en]; changed = true; }
    if (key !== w.en && store[w.en]) { delete store[w.en]; changed = true; }
  });
  if (changed) save();
}
migrateProgressStore();
const rec = w => {
  const k = wordKey(w);
  const c = store[k] || (store[k] = { taught:false, mastery:0 });
  if (c.mastery === undefined) {                          // 舊計次資料 → 換算成初始 mastery %,再丟掉 reps/miss
    const max = w.pos === 'function' ? 1 : 3, r = c.reps || [0,0,0,0];
    let got = 0; for (let i = 1; i <= max; i++) got += Math.min(r[i] || 0, 2);
    c.mastery = Math.round(got / (max * 2) * 100);
    delete c.reps; delete c.miss;
  }
  if (c.wrote && c.wrote2 === undefined && c.wroteClock === undefined) c.wrote2 = true;   // 舊存檔自癒:隔關再驗上線前拿到的 wrote 視為已驗(既得權益,別把老玩家整階卡回去)
  return c;
};
// meta:金幣 + 解鎖到第幾關(跟字進度分開存)
let meta = (() => { try { return JSON.parse(localStorage.getItem('eng_meta_v1')) || { coins:0, maxLevel:1 }; } catch { return { coins:0, maxLevel:1 }; } })();
const saveMeta = () => localStorage.setItem('eng_meta_v1', JSON.stringify(meta));
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };   // Fisher-Yates(正規洗牌;舊的 sort(()=>random) 有偏差、短陣列常洗回原序)

// 功能詞(is/a/my…)只要「認得」就好,不考開口說 / 默寫(虛詞念/寫不自然)→ 最高只到階 1;實詞到階 3。
const maxRungOf = w => w.pos === 'function' ? 1 : 3;
// 字「現在要攻第幾階」:沒教→0;認沒滿→1;說沒滿→2;寫沒滿→3;攻完該攻的階→4(學會)。
function rungOf(w) {
  const c = rec(w);
  if (!c.taught) return 0;                                // 沒教 → 教
  if (c.mastery >= LEARNED) return 4;                     // 100% → 學會
  return Math.min(tierOfMastery(c.mastery), maxRungOf(w)); // 難度跟 % 走;功能詞封頂在認
}
const isFresh   = w => !rec(w).taught;          // 沒碰過(連教都還沒)
const isLearned = w => rungOf(w) === 4;         // mastery 到 100% = 學會
// 顯示用熟練度%:就是 mastery 本身(0~100)。
const pOf = w => rec(w).mastery || 0;

// 學習順序 + 分批解鎖(課程結構,見 CURRICULUM.md):批1 實詞 → 批2 膠水詞(解鎖造句)→ 之後交替。階段 N 解鎖批 0..N-1。
// ★ 2026-07-08 重編:10 個「情境批」,每批 = 一個可完成的生活情境,實詞 ≤5、進來當下就有句子可用、後面的批持續回收前面的字。
let BATCHES = [
  ['word_water','word_tea','word_coffee','word_sugar','word_or','word_with','word_please'],       // 批1 ☕ 點飲料:Coffee or tea? / Tea, please. / Coffee with sugar.
  ['word_cat','word_book','word_friend','word_this','word_is','word_a','word_my'],                // 批2 👉 這是什麼:This is a cat. / This is my book. / Is this…?
  ['word_happy','word_sad','word_tired','word_i','word_am'],                                      // 批3 🙂 我的心情:I am happy. / Am I…?
  ['word_hungry','word_eat','word_rice','word_bread'],                                            // 批4 🍚 肚子餓了:I eat rice. / I am hungry. I eat bread.
  ['word_thirsty','word_drink','word_milk'],                                                      // 批5 🥛 口渴了:I drink milk.(回收批1飲料)
  ['word_home','word_house','word_go','word_big','word_small'],                                   // 批6 🏠 我的家:This is my home. / I go home. / This is big.
  ['word_buy','word_get','word_see','word_look','word_at'],                                       // 批7 🛒 上街:I buy a book. / I see a cat. / I look at a house.
  ['word_speak','word_say','word_hello','word_english','word_chinese'],                           // 批8 👋 開口說:I speak English. / I say hello.
  ['word_listen','word_hear','word_music','word_to'],                                             // 批9 👂 用耳朵:I listen to music. / I hear a cat.
  ['word_make','word_good','word_bad','word_beautiful','word_read'],                              // 批10 🍞 在家的一天:I make tea. / I read a book. / This is good.(回收食物飲料/書)
];
// 情境資訊(跟 BATCHES 一一對應):階段收尾的「情境完成卡」+ 首頁/地圖顯示用。sents = 這批的招牌句(手寫、可點念)。
let SCENARIOS = [
  { icon:'☕', title:'點飲料',     done:'你會點飲料了!',           sents:[['Coffee or tea?','咖啡還是茶?'],['Tea, please.','請給我茶。'],['Coffee with sugar.','咖啡加糖。']] },
  { icon:'👉', title:'這是什麼',   done:'你會介紹眼前的東西了!',   sents:[['This is a cat.','這是一隻貓。'],['This is my book.','這是我的書。'],['Is this a cat?','這是一隻貓嗎?']] },
  { icon:'🙂', title:'我的心情',   done:'你會說出自己的感覺了!',   sents:[['I am happy.','我很開心。'],['I am tired.','我很累。'],['Am I happy?','我開心嗎?']] },
  { icon:'🍚', title:'肚子餓了',   done:'肚子餓會用英文講了!',     sents:[['I am hungry.','我很餓。'],['I eat rice.','我吃飯。'],['I am hungry. I eat bread.','我很餓,我吃麵包。']] },
  { icon:'🥛', title:'口渴了',     done:'口渴也會講了!',           sents:[['I am thirsty.','我很渴。'],['I drink milk.','我喝牛奶。'],['I am thirsty. I drink tea.','我很渴,我喝茶。']] },
  { icon:'🏠', title:'我的家',     done:'你會介紹自己的家了!',     sents:[['This is my home.','這是我的家。'],['This is big.','這很大。'],['I go home.','我回家。']] },
  { icon:'🛒', title:'上街',       done:'上街會用的動作都會說了!', sents:[['I buy a book.','我買一本書。'],['I see a cat.','我看見一隻貓。'],['I look at a house.','我看著一棟房子。']] },
  { icon:'👋', title:'開口說',     done:'你會用英文打招呼了!',     sents:[['I say hello.','我打招呼。'],['I speak English.','我會說英文。']] },
  { icon:'👂', title:'用耳朵',     done:'耳朵的動詞都會了!',       sents:[['I listen to music.','我聽音樂。'],['I hear a cat.','我聽見貓的聲音。']] },
  { icon:'🍞', title:'在家的一天', done:'日常軌全部完成!',         sents:[['I make tea.','我泡茶。'],['I read a book.','我讀一本書。'],['This is good.','這很好。']] },
];
const scenarioOf = stage => SCENARIOS[(stage || 1) - 1] || null;   // 沒編情境的軌(工作軌)回 null → 收尾卡走通用文案
let _batchSet, _rest, _batchIndex, LEARN_ORDER;
function rebuildCurriculum() {                                        // 依「當前軌」的 BANK+BATCHES 重算課程衍生表(切軌時要重跑)
  _batchSet = new Set(BATCHES.flat());
  _rest = BANK.filter(w => !_batchSet.has(w.id));                     // 還沒編進 BATCHES 的字 → 每 5 個自動切一批接在後面(擴字庫時再正式分主題)
  _batchIndex = {};
  BATCHES.forEach((b, i) => b.forEach(id => { _batchIndex[id] = i; }));
  _rest.forEach((w, j) => { _batchIndex[w.id] = BATCHES.length + Math.floor(j / 5); });
  LEARN_ORDER = [...BATCHES.flat().map(id => BANK.find(w => w.id === id)).filter(Boolean), ..._rest];
}
rebuildCurriculum();

// ── 多軌課程(daily / work…):內容整組換、進度用 meta.tracks 分軌;store(單字熟練度)、coins、skills 共用 ──
const TRACKS = {};
let currentTrack = 'daily';
const TRACK_META_KEYS = ['stage', 'clock', 'maxLevel', 'stageStartLevel', 'bossReady', 'bossCleared', 'challengeCleared'];
function registerTrack(name, content) { TRACKS[name] = content; }     // content: { bank, batches, patterns, buildIds, transformIds }
function applyTrackContent(name) {                                    // 整組換掉內容全域 + 重算衍生表(讀 BANK/PATTERNS 的舊碼都不用改)
  const t = TRACKS[name]; if (!t) return;
  BANK = t.bank; BATCHES = t.batches; PATTERNS = t.patterns;
  BUILD_SENTENCE_PATTERN_IDS = t.buildIds; TRANSFORM_PATTERN_IDS = t.transformIds;
  SCENARIOS = t.scenarios || [];                                      // 情境卡資料跟軌走(工作軌沒編 → 空,收尾卡走通用文案)
  rebuildCurriculum();
}
function snapshotTrackMeta() {                                        // 把當前軌的進度存回 meta.tracks[currentTrack]
  meta.tracks = meta.tracks || {};
  const t = meta.tracks[currentTrack] = meta.tracks[currentTrack] || {};
  TRACK_META_KEYS.forEach(k => { t[k] = meta[k]; });
  t.level = level;
}
function loadTrackMeta(name) {                                        // 載入某軌進度到 live meta(新軌給預設值)
  meta.tracks = meta.tracks || {};
  const t = meta.tracks[name] || (meta.tracks[name] = { stage: 1, clock: 0, maxLevel: 1, stageStartLevel: 1, bossReady: false, bossCleared: false, challengeCleared: {} });
  TRACK_META_KEYS.forEach(k => { if (t[k] !== undefined) meta[k] = t[k]; });
  level = t.level || 1;
}
function setTrack(name) {                                             // 切軌:存當前 → 換內容 → 載目標(store/coins/skills 不動)
  if (name === currentTrack || !TRACKS[name]) return;
  snapshotTrackMeta();
  currentTrack = name;
  applyTrackContent(name);
  loadTrackMeta(name);
  saveMeta();
}
const batchOf = w => _batchIndex[w.id] || 0;                          // 第幾批
const learnIndex = w => LEARN_ORDER.findIndex(x => x.id === w.id);
const stageHasRealWords = stage => BANK.some(w => batchOf(w) === stage - 1 && w.pos !== 'function');
const ADVANCED_BATCH_START = 2, MICRO_BATCH_SIZE = 2, MICRO_READY_MASTERY = 67;
const isAdvancedWord = w => w && w.pos !== 'function' && batchOf(w) >= ADVANCED_BATCH_START;   // 第三階段後:長字/句子應用變多,改小組鎖定
const isLongWord = w => !!w && ((w.syl && w.syl.length >= 3) || (w.en || '').length >= 8);
const clozeGateNeeded = w => w && w.pos !== 'function' && (isAdvancedWord(w) || isLongWord(w));
const clozeSlotCount = w => Object.keys(rec(w).clozeSlots || {}).length;
function clozeReadyForDictation(w) {
  if (!clozeGateNeeded(w)) return true;
  if (typeof canSentenceCloze === 'function' && !canSentenceCloze(w)) return true;   // 目前還湊不出句子克漏字的字,不要永久卡死
  const c = rec(w);
  return (c.clozeOk || 0) >= 2 && clozeSlotCount(w) >= 2;
}
function microBatchReady(w) {
  if (!isAdvancedWord(w)) return true;
  if (!rec(w).taught) return false;
  if ((rec(w).mastery || 0) < MICRO_READY_MASTERY) return false;
  return clozeReadyForDictation(w);
}
const isHardDictationFormatId = id => ['type', 'pictype', 'flashtype'].includes(id);
// ★ 隔關再驗(2026-07-08):默寫成功一次不算「真的會寫」(失敗N次後硬過一次只是短期記憶)。
//   第一次寫對 → 記 wroteClock;下一關以後(clock 有前進)再寫對一次 → wrote2 = 真的會寫章。階段門檻認 wrote2。
//   needsWriteProof = 這個字現在還欠一次「算數的」默寫:沒寫過,或寫過但複驗時機到了還沒過。
//   (同一關內 wrote 剛拿到、clock 還沒走 → 不逼著馬上重寫,回傳 false,下一關才排。)
const needsWriteProof = w => {
  const c = rec(w);
  if (!c.wrote) return true;
  if (c.wrote2) return false;
  return (meta.clock || 0) > (c.wroteClock || 0);
};

function buildLevel() {
  // ★ 固定 5 關階段中的動態選字:關卡角色決定新字量/題數,內容仍按熟練度挑新字 + 學習中 + 到期複習。
  const recipe = currentRecipe || lessonRecipeForLevel(level);
  const stage = stageOfLevel(level);
  const sentenceFocus = !stageHasRealWords(stage);
  const MAX = sentenceFocus ? 4 : 8, ACTIVE_CAP = sentenceFocus ? 2 : 5, clock = meta.clock || 0;
  let _g = false; BANK.forEach(w => { if (w.pos === 'function' && batchOf(w) < stage && isFresh(w)) { rec(w).taught = true; _g = true; } }); if (_g) save();   // 功能詞(膠水)沒單獨意義 → 不出教卡;批次一解鎖就靜默標 taught(讓句子組得出),意義交給句子 + teachPattern
  const isReplay = (level || 1) < (meta.maxLevel || 1);   // 回去玩「已過的舊關」(不是最前線那關)= 純複習,不引新字(治「這階還沒學完時回舊關卻在學新字」)
  const fresh  = isReplay ? [] : LEARN_ORDER.filter(w => isFresh(w) && batchOf(w) < stage && w.pos !== 'function');   // 解鎖批內的新「實詞」(功能詞不走教卡);複習關不引新字
  const focus = LEARN_ORDER.filter(w => isAdvancedWord(w) && batchOf(w) < stage && !isFresh(w) && !microBatchReady(w));   // 第三階段後:小組沒練穩前,先專注這組,不再開下一組新字
  const needsWrite = trackSkillOn('write') ? BANK.filter(w => !isFresh(w) && w.pos !== 'function' && needsWriteProof(w) && batchOf(w) < stage && clozeReadyForDictation(w)) : [];   // 不練默寫的軌:不排補默寫。needsWriteProof:沒寫過 or 寫過待隔關複驗
  const active = shuffle(BANK.filter(w => !isFresh(w) && !isLearned(w) && w.pos !== 'function' && batchOf(w) < stage && !focus.some(f => f.id === w.id))); // 學習中(<100%),主力。功能詞排除 → 不單獨刷,只在句子裡練
  const due    = BANK.filter(w => isLearned(w) && w.pos !== 'function' && batchOf(w) < stage && (rec(w).due || 0) <= clock) // 到期該複習的學會字(功能詞除外,走句子)
                     .sort((a, b) => (rec(a).due || 0) - (rec(b).due || 0));              // 最逾期先
  const newCap = recipe.newWords == null ? MICRO_BATCH_SIZE : recipe.newWords;
  const activeNewCap = recipe.activeNewCap == null ? 3 : recipe.activeNewCap;
  const NEW = active.length >= activeNewCap ? 0 : newCap;   // ★ 每階前段導入新字;focus 只提高弱字優先度,不再卡住本階剩餘新字
  const picked = [];
  const add = arr => { for (const w of arr) { if (picked.length >= MAX) break; if (!picked.some(p => p.id === w.id)) picked.push(w); } };
  if (recipe.completion) { add(stagePendingWords(stage)); return shuffle(picked); }   // 少量補完:只練本階最後 1-2 個洞,不要再塞已會舊字
  add(focus);                          // 1. 第三階段後的小組鎖定:這組還沒穩,先練它
  add(fresh.slice(0, NEW));            // 2. 新字(在學/焦點太多就先不加,先把在學的練完)
  add(active.slice(0, ACTIVE_CAP));    // 3. 學習中(主力)— 優先練這些,這關的重點
  add(needsWrite.slice(0, 2));         // 4. 補默寫:只穿插幾個;長字/第三階段字要先通過克漏字門檻
  add(due.slice(0, 2));                // 4. 到期複習:只穿插幾個(舊字主要靠句子複習帶,別灌一堆已會的淹掉學習)
  if (picked.length < 4 && !fresh.length) add(shuffle(BANK.filter(w => isLearned(w) && w.pos !== 'function' && batchOf(w) < stage)));   // 5. 太少且「沒有新字可學了」(純鞏固期)才補學會的字回鍋
  if (!picked.length) add(fresh.length ? fresh : shuffle(BANK.filter(w => !isFresh(w) && w.pos !== 'function' && batchOf(w) < stage)));   // 極早期保險:還是空 → 有新字給新字,沒有(複習關/全學會)給已見過的字複習
  return shuffle(picked);
}
// 王可挑戰的條件(內容驅動,取代固定第 5×stage 關):跑夠鞏固關 + 當前批次的實詞都教過 + 寫對過 + 練到「會寫」。
const BOSS_READY_MASTERY = 67;   // 保留給未來調難度;目前王解鎖以「至少默寫成功一次」為主。
const STAGE_MAIN_LEVELS = 5;     // 主線節奏:每階固定 5 關 + 王;每關長短/題型密度由 lesson recipe 決定。
const BOSS_READY_MIN_LEVELS = STAGE_MAIN_LEVELS;
const stageWordCount = stage => BANK.filter(w => batchOf(w) === stage - 1 && w.pos !== 'function').length;
const stageMinLevels = () => STAGE_MAIN_LEVELS;
const stageOfLevel = lv => Math.max(1, Math.floor(((lv || 1) - 1) / STAGE_MAIN_LEVELS) + 1);
const lessonIndexInStage = lv => (((lv || 1) - 1) % STAGE_MAIN_LEVELS) + 1;
const LESSON_RECIPES = [
  { role:'intro', label:'新字導入', questions:6,  newWords:2, activeNewCap:6, weights:{ read:1.25, listen:1.05, speak:0.8, write:0.25, category:0.35, sentence_build:0.35, sentence_speak:0.35, sentence_transform:0.2, sentence_cloze:0 } },
  { role:'recognition', label:'認字聽音', questions:8,  newWords:2, activeNewCap:6, weights:{ read:1.2, listen:1.25, speak:1.0, write:0.45, category:0.75, sentence_build:0.6, sentence_speak:0.65, sentence_transform:0.35, sentence_cloze:0.15 } },
  { role:'cloze', label:'克漏字練習', questions:10, newWords:1, activeNewCap:5, weights:{ read:1.0, listen:1.0, speak:0.9, write:0.75, cloze:1.9, category:0.85, sentence_build:1.2, sentence_speak:1.0, sentence_transform:0.8, sentence_cloze:1.6 } },
  { role:'sentence', label:'句子應用', questions:14, newWords:0, activeNewCap:0, weights:{ read:1.0, listen:0.75, speak:0.75, write:0.9, cloze:1.4, category:1.0, sentence_build:2.2, sentence_speak:1.45, sentence_transform:1.8, sentence_cloze:1.7 } },
  { role:'review', label:'王前整理', questions:10, newWords:0, activeNewCap:0, weights:{ read:0.75, listen:0.9, speak:0.8, write:1.8, cloze:1.2, category:1.25, sentence_build:1.4, sentence_speak:1.1, sentence_transform:1.1, sentence_cloze:1.8 } },
];
const FIRST_LESSON_RECIPE = {
  role:'first_intro',
  label:'飲料短語導入',
  questions:18,
  newWords:4,
  activeNewCap:8,
  weights:{ read:1.05, listen:1.0, speak:0.65, write:0.15, cloze:0.8, category:0.65, sentence_build:1.8, sentence_speak:0.75, sentence_transform:0, sentence_cloze:0 }
};
const lessonRecipeForLevel = lv => (lv === 1 && currentTrack === 'daily') ? FIRST_LESSON_RECIPE : (LESSON_RECIPES[lessonIndexInStage(lv) - 1] || LESSON_RECIPES[0]);   // 飲料首關 18 題 recipe 只給日常;其他軌(工作…)第 1 關用一般 intro(6 題),別把稀疏內容硬拉長
const defaultStageStartLevel = stage => {
  let start = 1;
  for (let s = 1; s < stage; s++) start += stageMinLevels(s);
  return start;
};
const stageStartLevel = () => defaultStageStartLevel(meta.stage || 1);
const stageDeadlineLevel = (stage = meta.stage || 1) => defaultStageStartLevel(stage) + stageMinLevels(stage) - 1;
const stageWordsFor = (stage = meta.stage || 1) => {
  const cur = stage - 1;
  const stageWords = BANK.filter(w => batchOf(w) === cur && w.pos !== 'function');
  return stageWords.length ? stageWords : BANK.filter(w => batchOf(w) < stage && w.pos !== 'function');
};
const wordReadyForBoss = w => rec(w).taught && wroteOk(w) && isLearned(w);   // 不練默寫的軌:wroteOk 視同會寫
const stagePendingWords = (stage = meta.stage || 1) => stageWordsFor(stage).filter(w => !wordReadyForBoss(w));
function stageSentencePatterns(stage = meta.stage || 1) {
  if (typeof buildSentencePatterns !== 'function' || typeof buildSentenceFromPattern !== 'function') return [];
  const sourceWords = BANK.filter(w => batchOf(w) < stage && rec(w).taught);
  return buildSentencePatterns().filter(p => buildSentenceFromPattern(p, sourceWords));
}
function stageSentencesReady(stage = meta.stage || 1) {
  const pats = stageSentencePatterns(stage);
  return !pats.length || pats.every(p => patMastery(p.id) > 0);
}
function completionRecipe(pending) {
  const n = pending.length;
  if (!n || n > 2 || n >= stageWordsFor().length) return null;   // 只有整階原本就 1-2 字時,別一開始就當「補完最後幾個字」
  const missingWrite = pending.some(w => rec(w).taught && needsWriteProof(w));
  return {
    role:'completion',
    label:n === 1 ? '補完最後一個字' : '補完最後兩個字',
    questions:n === 1 ? (missingWrite ? 4 : 3) : (missingWrite ? 6 : 5),
    newWords:0,
    activeNewCap:0,
    completion:true,
    weights:{ read:0.8, listen:0.9, speak:0.55, write:missingWrite ? 2.5 : 1.25, cloze:1.25, category:0.6, sentence_build:0.75, sentence_speak:0.45, sentence_transform:0.6, sentence_cloze:1.4 }
  };
}
function stageReadyAt(lv = level) {
  const stage = stageOfLevel(lv);
  const sw = stageWordsFor(stage);
  if (!sw.length) return false;
  const allWrote = sw.every(w => rec(w).taught && wroteOk(w));
  if (!allWrote) return false;
  const allKnown = sw.every(isLearned);
  // 整階單字都標會/學會時,仍要至少碰過本階可組出的核心句型;否則會把句子應用整段跳掉。
  return (allKnown && stageSentencesReady(stage)) || lv >= stageDeadlineLevel(stage);
}
const stageReady = () => stageReadyAt(level);
const stageDeadlineReached = () => level >= stageStartLevel() + stageMinLevels() - 1;
function normalizeBossGate() {
  const deadline = stageDeadlineLevel();
  meta.bossReady = false;   // 王關已改成 optional challenge,不再作主線門檻。
  if (meta.stage && meta.maxLevel > deadline) meta.maxLevel = deadline;
  saveMeta();
}

// 關卡計畫:難度改由單字 mastery 決定(難度跟%走),關卡不再封頂 → topRung 固定 3。關卡長短/角色由 LESSON_RECIPES 控制。
const levelPlan = lv => ({ topRung: 3 });

let level = 1, levelWords = [], queue = [], current = null;
let plan = null, currentRung = 0;
let quota = {}, lgot = {}, reviewQueue = [], inReview = false;     // 這關每字「要答對幾次 / 已答對幾次」;reviewQueue = 答錯待回顧重答的題
let reviewMiss = {};                                               // 每字「連續答錯次數」(答對歸零)→ 連錯 2 次補考強制走複習卡
let inTraining = false, trainPool = [], trainTotal = 0, trainSkills = new Set(), trainMode = 'weak', lastTrainWordKey = '';   // 🎯 單字特訓:自選字 + 自選技能(trainSkills 可複選:空=混合,或任選 listen/read/speak/write 幾種);各題可「我學會了」移除;不走主回合 quota/SRS。trainTotal=原本選幾個字(進度條用)。trainMode:'weak'=練還不會的字(滿100畢業)/'review'=複習已學會的字(不畢業,靠「移除」退出)
let currentRecipe = null;
let combo = 0;                                                     // 🔥 連擊:主回合連續答對數(答錯/開新關歸零);每 5 連擊 +1 金幣
let levelStartMastery = {};                                        // 本關開始時每字的熟練度快照 → 結算條「舊值 → 新值」長出來的動畫用
function buildLessonQuota(words, recipe) {
  const q = {}, caps = {}, clock = meta.clock || 0;
  const desired = Math.max(words.length, (recipe && recipe.questions) || words.length);
  words.forEach(w => {
    const k = wordKey(w), c = rec(w);
    const freshReal = rungOf(w) === 0 && w.pos !== 'function';
    q[k] = freshReal ? 2 : 1;
    let cap = q[k];
    if (!isLearned(w)) cap += 2;                              // 還沒會:可以多練,撐起正常關卡長度
    if (w.pos !== 'function' && needsWriteProof(w)) cap += 1;  // 缺默寫(含待隔關複驗):補一點寫作機會
    if (isLearned(w) && (c.due || 0) <= clock) cap += 1;       // 到期回顧:最多多抽一次,不要拿已會字硬湊題數
    if (recipe && (recipe.role === 'sentence' || recipe.role === 'review') && !isLearned(w)) cap += 1;
    caps[k] = cap;
  });
  const totalTarget = Math.min(desired, words.reduce((sum, w) => sum + (caps[wordKey(w)] || 0), 0));
  let total = words.reduce((sum, w) => sum + (q[wordKey(w)] || 0), 0);
  const priority = words.slice().sort((a, b) => {
    const score = w => (isFresh(w) ? 4 : 0) + (needsWriteProof(w) && w.pos !== 'function' ? 3 : 0) + (100 - pOf(w)) / 50;
    return score(b) - score(a);
  });
  while (priority.length && total < totalTarget) {
    let added = false;
    for (const w of priority) {
      const k = wordKey(w);
      if ((q[k] || 0) >= (caps[k] || 0)) continue;
      q[k] = (q[k] || 0) + 1;
      total++;
      added = true;
      if (total >= totalTarget) break;
    }
    if (!added) break;
  }
  return q;
}
function startLevel() {
  meta.clock = (meta.clock || 0) + 1; saveMeta();   // SRS 時鐘:每開一關 +1(見 DESIGN_MASTERY §6)
  plan = levelPlan(level);
  const playStage = stageOfLevel(level);
  currentRecipe = completionRecipe(stagePendingWords(playStage)) || lessonRecipeForLevel(level);
  levelWords = (remedialWords && remedialWords.length) ? remedialWords : buildLevel();   // 惡補關:用打輸王時卡住的字
  remedialWords = null;
  quota = {}; lgot = {}; reviewQueue = []; inReview = false; reviewMiss = {}; transformsThisLevel = 0;
  combo = 0;
  quota = buildLessonQuota(levelWords, currentRecipe);
  levelStartMastery = {}; levelWords.forEach(w => { levelStartMastery[wordKey(w)] = pOf(w); });   // 結算動畫的起點
  levelWords.forEach(w => { lgot[wordKey(w)] = 0; }); // 新字至少教+馬上考;其餘題數由本關 recipe 分配
  queue = shuffle([...levelWords]);
  nextQuestion();
}
function onCorrect(w) {
  const wasLearned = isLearned(w);
  if (currentRung === 0) rec(w).taught = true;   // 教:只記「教過了」,不加 %
  else if (!inReview) {                          // ★ 補考(剛看過答案的重答)答對「不補熟練度、不算 wrote」→ 要下次主回合真的一次過才補(治「答錯→補考硬過→分數補回但其實沒會」)
    const c = rec(w);
    c.mastery = Math.min(LEARNED, (c.mastery || 0) + MASTERY_OK);   // 認/說/寫答對 → 熟練度 +MASTERY_OK
    if (currentSkill === 'write' && isHardDictationFormatId(currentFormatId)) {                 // 整字聽寫/看圖寫/默寫對了(克漏字只算鷹架)
      if (!c.wrote) { c.wrote = true; c.wroteClock = meta.clock || 0; }                         // 第一次寫對:記時刻,還不算「真的會寫」
      else if (!c.wrote2 && (meta.clock || 0) > (c.wroteClock || 0)) c.wrote2 = true;           // ★ 隔關再寫對一次 → 蓋「真的會寫」章(階段門檻認這個)
    }
  }
  save();
  if (!wasLearned && isLearned(w) && !rec(w).coined) { meta.coins++; rec(w).coined = true; saveMeta(); save(); }   // 第一次學會 → +1 金幣(coined 標記:扣分後重新學會不重複給)
  if (currentRung >= 1 && isLearned(w)) {                     // 學會的字 → 排下次間隔複習(SRS,見 DESIGN_MASTERY §6)
    const c = rec(w);
    c.ivl = wasLearned ? Math.min((c.ivl || 1) * 2, 30) : 1;  // 複習答對 → 間隔 ×2 封頂 30;剛學會 → 起始 1
    c.due = (meta.clock || 0) + c.ivl; save();
  }
  if (inTraining) return;                                    // 🎯 特訓:熟練度 / 金幣 / SRS 照加,但不碰主回合 quota/queue
  if (currentRung >= 1) {                                    // 🔥 連擊:答對(教不算)+1;每 5 連擊 +1 金幣
    combo++;
    if (combo % 5 === 0) { meta.coins++; saveMeta(); }
    if (typeof updateCombo === 'function') updateCombo();
  }
  const k = wordKey(w);
  reviewMiss[k] = 0;                                          // 答對 → 連錯次數歸零
  if (inReview) { lgot[k] = quota[k]; }                       // 回顧重答答對 → 這題清掉(本關視為完成)
  else {
    lgot[k]++;
    if (lgot[k] < quota[k]) {                                 // 主回合還沒問夠 → 回佇列
      if (currentRung === 0) queue.splice(Math.min(2, queue.length), 0, w);   // 剛教完 → 隔一兩題就考它(別整關先全教再全考)
      else queue.push(w);
    }
  }
}
function onWrong(w) {                              // 答錯 → 熟練度 −MASTERY_BAD(教階不扣;說題被機器聽錯走自評、不會進這裡硬扣)
  if (currentRung >= 1) {
    const c = rec(w);
    c.mastery = Math.max(0, (c.mastery || 0) - MASTERY_BAD);
    c.ivl = 1; c.due = (meta.clock || 0) + 1;     // SRS:答錯 → 間隔歸 1、很快再考(原為學會的話 mastery 掉破→變 active 也會優先回來)
    save();
  }
  if (inTraining) return;                                      // 🎯 特訓:答錯只扣熟練度,不進 reviewQueue(它自己循環)
  combo = 0; if (typeof updateCombo === 'function') updateCombo();   // 🔥 連擊中斷
  reviewMiss[wordKey(w)] = (reviewMiss[wordKey(w)] || 0) + 1;   // 連續答錯 +1(補考時 ≥2 就強制走複習卡)
  reviewQueue.push({ w, run: lastAsked[wordKey(w)], skill: lastAskedSkill[wordKey(w)], formatId: lastAskedFormatId[wordKey(w)] });   // 連同剛剛的題型一起記 → 補考用「同一種題型」再考(錯默寫就補默寫,不是換簡單的)
}
// 「我已經會了」:把字直接標成學會(taught + 100% + wrote)→ 不再單獨考,但仍進句子 / SRS;本關這格視為完成。整階都標會 → stageReadyAt 直接放行打王。
function markWordKnown(w) {
  const c = rec(w), wasLearned = isLearned(w);
  c.taught = true; c.mastery = LEARNED; c.wrote = true; c.wrote2 = true;   // 「我已經會了」= 你說了算 → 免隔關複驗
  if (!wasLearned && !c.coined) { meta.coins++; c.coined = true; saveMeta(); }   // 第一次算會 → 給金幣(known 也是會)
  c.ivl = 8; c.due = (meta.clock || 0) + 8;   // 你都說會了 → 停遠一點(別下一關馬上又抓回來複習);之後再用句子輕度抽查
  save();
  const k = wordKey(w);
  if (quota[k] != null) lgot[k] = quota[k];   // 本關這個字直接視為完成,不再考
}
function nextQuestion() {
  if (inTraining) return trainNext();                                                                         // 🎯 特訓:走自己的循環,不碰主回合 quota/review
  if (queue.length) { inReview = false; current = queue.shift(); return ask(current); }                       // 主回合
  if (reviewQueue.length) { inReview = true; const e = reviewQueue.shift(); current = e.w; return reviewThenAsk(e.w, e.run, e.skill, e.formatId); }   // 主回合跑完 → 回顧重答錯題(同題型)
  showDone();
}
// 補考(DESIGN_MASTERY step 2):答錯的題集中到主回合後重答 → 永不卡死。
// 2026-06 UX:先直接補考(手滑打錯的人直接重答即可,不強迫看完整重看卡);補考畫面多一顆「我要複習」可選鈕,想看才走重看流程。
function reviewThenAsk(w, run, skill, formatId) {
  currentRung = 1;
  currentSkill = skill || (run && SKILL.get(run)) || null;
  currentFormatId = formatId || null;
  const r = run || ask;
  if ((reviewMiss[wordKey(w)] || 0) >= 2) {   // 連錯 ≥2 次 = 真的卡住 → 強制先走一輪複習卡(看字+音節+念+字根)再考
    showReviewCard(w, r);
  } else {                                     // 第一次錯 → 直接補考(手滑不被罰),畫面留「我要複習」可選鈕
    r(w);
    injectReviewButton(w, r);
  }
}
// 在補考題目下方塞一顆「我要複習」鈕(可選);點了走重看卡,看完回來繼續補考
function injectReviewButton(w, r) {
  const host = document.querySelector('.lesson-stage');
  if (!host || document.getElementById('wantreview')) return;
  const b = document.createElement('button');
  b.id = 'wantreview'; b.className = 'reviewlink';
  b.textContent = '我要複習這個字';
  b.onclick = () => showReviewCard(w, r);
  host.appendChild(b);
}
// 重看卡:字 + 音節 + 念 + 字根(原本強制出現的那張,現在改成「我要複習」才看)→ 看完回去補考
function showReviewCard(w, r) {
  const syls = sylOf(w);
  const sylHTML = syls.map(s => `<span class="syl">${s}</span>`).join('<span class="sep" aria-hidden="true"> </span>');
  const sylBlock = syls.length > 1
    ? `<div class="syllables teach-syllables" id="syls">${sylHTML}</div><div class="syltip teach-tip">分段只是幫你聽,拼字不用空格</div>`
    : `<div class="syllables teach-syllables" id="syls" hidden>${sylHTML}</div>`;
  shell('複習一下這個字,再回去答 👇', `
    <div class="teach-layout">
      <div class="teach-main">
        <div class="fullword teach-word">${typeof annotatedWordHTML === 'function' ? annotatedWordHTML(w, { force:true }) : w.en}</div>
        ${sylBlock}
        <div class="sub2 teach-zh">${w.zh}</div>
      </div>
      <div class="teach-tools"><button class="replay" id="rplay">${ICON.play}念</button></div>
      <div class="teach-why">${w.why}</div>
    </div>
    <button class="btn act" id="rback" style="margin-top:14px">看完了,回去答題 →</button>`);
  $('body').classList.add('teach-answer');
  document.querySelector('.lesson').classList.add('teach-lesson');
  speakSyllables(w, 0.9);
  $('rplay').onclick = () => speakSyllables(w, 0.9);
  $('rback').onclick = () => { r(w); injectReviewButton(w, r); };
}

/* ============================================================================
   ★ 玩法層(呈現)★ —— 可換的皮。引擎不依賴這層長什麼樣。
   題型全在這。要再加題型 = 多寫一個 askXxx() 掛進 RUNGS 對應階,引擎不動。
   ============================================================================ */
