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
  return c;
};
// meta:金幣 + 解鎖到第幾關(跟字進度分開存)
let meta = (() => { try { return JSON.parse(localStorage.getItem('eng_meta_v1')) || { coins:0, maxLevel:1 }; } catch { return { coins:0, maxLevel:1 }; } })();
const saveMeta = () => localStorage.setItem('eng_meta_v1', JSON.stringify(meta));
const shuffle = a => a.slice().sort(() => Math.random() - 0.5);

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
const BATCHES = [
  ['word_cat','word_book','word_friend','word_happy','word_water'],   // 批1(L1-5)實詞
  ['word_this','word_is','word_a','word_my','word_i','word_am'],      // 批2(L6-10)膠水詞 → 一學會就能造句
];
const _batchSet = new Set(BATCHES.flat());
const _rest = BANK.filter(w => !_batchSet.has(w.id));                 // 還沒編進 BATCHES 的字 → 每 5 個自動切一批接在後面(擴字庫時再正式分主題)→ 多王推進 stage 就會陸續解鎖
const _batchIndex = {};
BATCHES.forEach((b, i) => b.forEach(id => { _batchIndex[id] = i; }));
_rest.forEach((w, j) => { _batchIndex[w.id] = BATCHES.length + Math.floor(j / 5); });
const LEARN_ORDER = [...BATCHES.flat().map(id => BANK.find(w => w.id === id)).filter(Boolean), ..._rest];
const batchOf = w => _batchIndex[w.id] || 0;                          // 第幾批
const learnIndex = w => LEARN_ORDER.findIndex(x => x.id === w.id);
const stageHasRealWords = stage => BANK.some(w => batchOf(w) === stage - 1 && w.pos !== 'function');

function buildLevel() {
  // ★ 浮動關卡(SRS,見 DESIGN_MASTERY §6):大小由內容決定,沒固定 5 字。新字 + 學習中 + 到期複習,填到 MAX、超出順延下一關。
  const sentenceFocus = !stageHasRealWords(meta.stage || 1);
  const MAX = sentenceFocus ? 4 : 10, NEW = 2, ACTIVE_CAP = sentenceFocus ? 2 : 5, clock = meta.clock || 0;
  let _g = false; BANK.forEach(w => { if (w.pos === 'function' && batchOf(w) < (meta.stage || 1) && isFresh(w)) { rec(w).taught = true; _g = true; } }); if (_g) save();   // 功能詞(膠水)沒單獨意義 → 不出教卡;批次一解鎖就靜默標 taught(讓句子組得出),意義交給句子 + teachPattern
  const fresh  = LEARN_ORDER.filter(w => isFresh(w) && batchOf(w) < (meta.stage || 1) && w.pos !== 'function');   // 解鎖批內的新「實詞」(功能詞不走教卡)
  const needsWrite = BANK.filter(w => !isFresh(w) && w.pos !== 'function' && !rec(w).wrote && batchOf(w) < (meta.stage || 1));
  const active = shuffle(BANK.filter(w => !isFresh(w) && !isLearned(w) && w.pos !== 'function')); // 學習中(<100%),主力。功能詞排除 → 不單獨刷,只在句子裡練
  const due    = BANK.filter(w => isLearned(w) && w.pos !== 'function' && (rec(w).due || 0) <= clock) // 到期該複習的學會字(功能詞除外,走句子)
                     .sort((a, b) => (rec(a).due || 0) - (rec(b).due || 0));              // 最逾期先
  const picked = [];
  const add = arr => { for (const w of arr) { if (picked.length >= MAX) break; if (!picked.some(p => p.id === w.id)) picked.push(w); } };
  add(fresh.slice(0, NEW));            // 1. 新字(保證進度)
  add(needsWrite);                     // 2. 還沒默寫成功過的字:打王前必須補到
  add(active.slice(0, ACTIVE_CAP));    // 3. 學習中(主力)
  add(due);                            // 4. 到期複習(填到 MAX)
  if (picked.length < 4) add(shuffle(BANK.filter(w => isLearned(w) && w.pos !== 'function')));   // 5. 太少(後半鞏固期、沒新字也沒到期)→ 補學會的實詞回鍋,讓關卡有料 + 句子題有字可組
  if (!picked.length) add(fresh);      // 極早期保險:還是空 → 多給新字
  return shuffle(picked);
}
// 王可挑戰的條件(內容驅動,取代固定第 5×stage 關):跑夠鞏固關 + 當前批次的實詞都教過 + 寫對過 + 練到「會寫」。
const BOSS_READY_MASTERY = 67;   // 保留給未來調難度;目前王解鎖以「至少默寫成功一次」為主。
const BOSS_READY_MIN_LEVELS = 6;  // 第一階段縮短:每個實詞至少默寫成功一次後,第 6 關可開王。
const SENTENCE_STAGE_MIN_LEVELS = 4;   // 只有功能詞/句型的階段:縮短,主打句子練習 + 少量舊字回鍋。
const stageMinLevels = (stage = meta.stage || 1) => stageHasRealWords(stage) ? BOSS_READY_MIN_LEVELS : SENTENCE_STAGE_MIN_LEVELS;
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
function stageReadyAt(lv = level) {
  const sw = stageWordsFor();
  const enoughLevels = lv >= stageDeadlineLevel();
  return enoughLevels && sw.length > 0 && sw.every(w => {
    const c = rec(w);
    return c.taught && c.wrote;
  });
}
const stageReady = () => stageReadyAt(level);
const stageDeadlineReached = () => level >= stageStartLevel() + stageMinLevels() - 1;
function normalizeBossGate() {
  const deadline = stageDeadlineLevel();
  let changedStore = false;
  if ((meta.maxLevel || 1) > deadline && !meta.bossReady) {
    stageWordsFor().forEach(w => {
      const c = rec(w);
      if (!c.wrote && c.taught) {
        c.wrote = true;
        changedStore = true;
      }
    });
  }
  if (changedStore) save();
  if ((meta.maxLevel || 1) >= deadline && stageReadyAt(Math.max(level || 1, meta.maxLevel || 1))) meta.bossReady = true;
  if (meta.stage && meta.maxLevel > deadline) meta.maxLevel = deadline;
  saveMeta();
}

// 關卡計畫:難度改由單字 mastery 決定(難度跟%走),關卡不再封頂 → topRung 固定 3。關卡骨架是未決項,之後再談(見 DESIGN_MASTERY.md)。
const levelPlan = lv => ({ topRung: 3 });

let level = 1, levelWords = [], queue = [], current = null;
let plan = null, currentRung = 0;
let quota = {}, lgot = {}, reviewQueue = [], inReview = false;     // 這關每字「要答對幾次 / 已答對幾次」;reviewQueue = 答錯待回顧重答的題
function startLevel() {
  meta.clock = (meta.clock || 0) + 1; saveMeta();   // SRS 時鐘:每開一關 +1(見 DESIGN_MASTERY §6)
  plan = levelPlan(level);
  levelWords = (remedialWords && remedialWords.length) ? remedialWords : buildLevel();   // 惡補關:用打輸王時卡住的字
  remedialWords = null;
  quota = {}; lgot = {}; reviewQueue = []; inReview = false;
  levelWords.forEach(w => { const k = wordKey(w); lgot[k] = 0; quota[k] = (rungOf(w) === 0 && w.pos !== 'function') ? 2 : 1; }); // 新字:教+馬上考(2);功能詞只教不單獨考(1);複習字:1
  queue = shuffle([...levelWords]);
  nextQuestion();
}
function onCorrect(w) {
  const wasLearned = isLearned(w);
  if (currentRung === 0) rec(w).taught = true;   // 教:只記「教過了」,不加 %
  else {
    const c = rec(w);
    c.mastery = Math.min(LEARNED, (c.mastery || 0) + MASTERY_OK);   // 認/說/寫答對 → 熟練度 +MASTERY_OK
    if (currentSkill === 'write') c.wrote = true;                  // 王考默寫前,至少要真的寫對過一次
  }
  save();
  if (!wasLearned && isLearned(w) && !rec(w).coined) { meta.coins++; rec(w).coined = true; saveMeta(); save(); }   // 第一次學會 → +1 金幣(coined 標記:扣分後重新學會不重複給)
  if (currentRung >= 1 && isLearned(w)) {                     // 學會的字 → 排下次間隔複習(SRS,見 DESIGN_MASTERY §6)
    const c = rec(w);
    c.ivl = wasLearned ? Math.min((c.ivl || 1) * 2, 30) : 1;  // 複習答對 → 間隔 ×2 封頂 30;剛學會 → 起始 1
    c.due = (meta.clock || 0) + c.ivl; save();
  }
  const k = wordKey(w);
  if (inReview) { lgot[k] = quota[k]; }                       // 回顧重答答對 → 這題清掉(本關視為完成)
  else {
    lgot[k]++;
    if (lgot[k] < quota[k] && queue.length > 0) {             // 主回合還沒問夠 → 回佇列
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
  reviewQueue.push({ w, run: lastAsked[wordKey(w)], skill: lastAskedSkill[wordKey(w)] });   // 連同剛剛的題型一起記 → 補考用「同一種題型」再考(錯默寫就補默寫,不是換簡單的)
}
function nextQuestion() {
  if (queue.length) { inReview = false; current = queue.shift(); return ask(current); }                       // 主回合
  if (reviewQueue.length) { inReview = true; const e = reviewQueue.shift(); current = e.w; return reviewThenAsk(e.w, e.run, e.skill); }   // 主回合跑完 → 回顧重答錯題(同題型)
  showDone();
}
// 回顧重答(DESIGN_MASTERY step 2):答錯的題集中到主回合後,先重看一次(字 + 念 + 中文 + 字根)再重答 → 永不卡死
function reviewThenAsk(w, run, skill) {
  const syls = sylOf(w);
  const sylHTML = syls.map(s => `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  const sylBlock = syls.length > 1
    ? `<div class="syllables teach-syllables" id="syls">${sylHTML}</div><div class="syltip teach-tip">「·」只是音節分隔,拼字沒有點</div>`
    : `<div class="syllables teach-syllables" id="syls" hidden>${sylHTML}</div>`;
  shell('剛剛這題錯了 —— 先回顧一下,再試一次 👇', `
    <div class="teach-layout">
      <div class="teach-main">
        <div class="fullword teach-word">${w.en}</div>
        ${sylBlock}
        <div class="sub2 teach-zh">${w.zh}</div>
      </div>
      <div class="teach-tools"><button class="replay" id="rplay">🔊 念</button></div>
      <div class="teach-why">${w.why}</div>
    </div>
    <button class="btn act" id="rready" style="margin-top:14px">再試一次 →</button>`);
  $('body').classList.add('teach-answer');
  document.querySelector('.lesson').classList.add('teach-lesson');
  speakSyllables(w, 0.9);
  $('rplay').onclick = () => speakSyllables(w, 0.9);
  $('rready').onclick = () => { currentRung = 1; currentSkill = skill || (run && SKILL.get(run)) || null; (run || ask)(w); };   // 用剛剛答錯的那種題型再考一次
}

/* ============================================================================
   ★ 玩法層(呈現)★ —— 可換的皮。引擎不依賴這層長什麼樣。
   題型全在這。要再加題型 = 多寫一個 askXxx() 掛進 RUNGS 對應階,引擎不動。
   ============================================================================ */
