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
const BATCHES = [
  ['word_cat','word_book','word_friend','word_happy','word_water'],   // 批1(L1-5)實詞
  ['word_this','word_is','word_a','word_my','word_i','word_am'],      // 批2(L6-10)膠水詞 → 一學會就能造句
  // 批3 吃喝與感受:感受形容詞先(I am hungry/tired…,只需 I/am)→ 吃喝動詞+食物飲料(I eat rice / I drink tea,動詞與受詞同批自給自足)
  ['word_hungry','word_thirsty','word_tired','word_sad','word_eat','word_drink','word_rice','word_bread','word_tea','word_milk'],
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
  const MAX = sentenceFocus ? 4 : 8, ACTIVE_CAP = sentenceFocus ? 2 : 5, clock = meta.clock || 0;
  let _g = false; BANK.forEach(w => { if (w.pos === 'function' && batchOf(w) < (meta.stage || 1) && isFresh(w)) { rec(w).taught = true; _g = true; } }); if (_g) save();   // 功能詞(膠水)沒單獨意義 → 不出教卡;批次一解鎖就靜默標 taught(讓句子組得出),意義交給句子 + teachPattern
  const fresh  = LEARN_ORDER.filter(w => isFresh(w) && batchOf(w) < (meta.stage || 1) && w.pos !== 'function');   // 解鎖批內的新「實詞」(功能詞不走教卡)
  const needsWrite = BANK.filter(w => !isFresh(w) && w.pos !== 'function' && !rec(w).wrote && batchOf(w) < (meta.stage || 1));
  const active = shuffle(BANK.filter(w => !isFresh(w) && !isLearned(w) && w.pos !== 'function')); // 學習中(<100%),主力。功能詞排除 → 不單獨刷,只在句子裡練
  const due    = BANK.filter(w => isLearned(w) && w.pos !== 'function' && (rec(w).due || 0) <= clock) // 到期該複習的學會字(功能詞除外,走句子)
                     .sort((a, b) => (rec(a).due || 0) - (rec(b).due || 0));              // 最逾期先
  const NEW = active.length >= 3 ? 0 : 2;   // ★ 在學的字 ≥3 就先別引新字 → 把在學的練到會再解鎖,別一直冒新字、堆一堆沒練到的(治「認識/學習量比例失衡」)
  const picked = [];
  const add = arr => { for (const w of arr) { if (picked.length >= MAX) break; if (!picked.some(p => p.id === w.id)) picked.push(w); } };
  add(fresh.slice(0, NEW));            // 1. 新字(在學的太多就先不加,先把在學的練完)
  add(active.slice(0, ACTIVE_CAP));    // 2. 學習中(主力)— 優先練這些,這關的重點
  add(needsWrite.slice(0, 2));         // 3. 補默寫:只穿插幾個(打王前要寫對過)
  add(due.slice(0, 2));                // 4. 到期複習:只穿插幾個(舊字主要靠句子複習帶,別灌一堆已會的淹掉學習)
  if (picked.length < 4 && !fresh.length) add(shuffle(BANK.filter(w => isLearned(w) && w.pos !== 'function')));   // 5. 太少且「沒有新字可學了」(純鞏固期)才補學會的字回鍋
  if (!picked.length) add(fresh);      // 極早期保險:還是空 → 多給新字
  return shuffle(picked);
}
// 王可挑戰的條件(內容驅動,取代固定第 5×stage 關):跑夠鞏固關 + 當前批次的實詞都教過 + 寫對過 + 練到「會寫」。
const BOSS_READY_MASTERY = 67;   // 保留給未來調難度;目前王解鎖以「至少默寫成功一次」為主。
const BOSS_READY_MIN_LEVELS = 5;  // 第一階段:每個實詞至少默寫成功一次後,第 5 關可開王(前期別拖太長、避免重複疲乏)。
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
  if (!sw.length) return false;
  const allWrote = sw.every(w => { const c = rec(w); return c.taught && c.wrote; });
  if (!allWrote) return false;
  const allKnown = sw.every(isLearned);                 // 全部已學會(含「我已經會了」跳過的)→ 不必再陪跑鞏固關,直接可打王
  return allKnown || lv >= stageDeadlineLevel();
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
let reviewMiss = {};                                               // 每字「連續答錯次數」(答對歸零)→ 連錯 2 次補考強制走複習卡
let inTraining = false, trainPool = [];                            // 🎯 單字特訓:自選字、聽說讀寫混合、各題可「我學會了」移除;不走主回合 quota/SRS 佇列(見 js/08 trainNext)
function startLevel() {
  meta.clock = (meta.clock || 0) + 1; saveMeta();   // SRS 時鐘:每開一關 +1(見 DESIGN_MASTERY §6)
  plan = levelPlan(level);
  levelWords = (remedialWords && remedialWords.length) ? remedialWords : buildLevel();   // 惡補關:用打輸王時卡住的字
  remedialWords = null;
  quota = {}; lgot = {}; reviewQueue = []; inReview = false; reviewMiss = {};
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
  if (inTraining) return;                                    // 🎯 特訓:熟練度 / 金幣 / SRS 照加,但不碰主回合 quota/queue
  const k = wordKey(w);
  reviewMiss[k] = 0;                                          // 答對 → 連錯次數歸零
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
  if (inTraining) return;                                      // 🎯 特訓:答錯只扣熟練度,不進 reviewQueue(它自己循環)
  reviewMiss[wordKey(w)] = (reviewMiss[wordKey(w)] || 0) + 1;   // 連續答錯 +1(補考時 ≥2 就強制走複習卡)
  reviewQueue.push({ w, run: lastAsked[wordKey(w)], skill: lastAskedSkill[wordKey(w)] });   // 連同剛剛的題型一起記 → 補考用「同一種題型」再考(錯默寫就補默寫,不是換簡單的)
}
// 「我已經會了」:把字直接標成學會(taught + 100% + wrote)→ 不再單獨考,但仍進句子 / SRS;本關這格視為完成。整階都標會 → stageReadyAt 直接放行打王。
function markWordKnown(w) {
  const c = rec(w), wasLearned = isLearned(w);
  c.taught = true; c.mastery = LEARNED; c.wrote = true;
  if (!wasLearned && !c.coined) { meta.coins++; c.coined = true; saveMeta(); }   // 第一次算會 → 給金幣(known 也是會)
  c.ivl = 8; c.due = (meta.clock || 0) + 8;   // 你都說會了 → 停遠一點(別下一關馬上又抓回來複習);之後再用句子輕度抽查
  save();
  const k = wordKey(w);
  if (quota[k] != null) lgot[k] = quota[k];   // 本關這個字直接視為完成,不再考
}
function nextQuestion() {
  if (inTraining) return trainNext();                                                                         // 🎯 特訓:走自己的循環,不碰主回合 quota/review
  if (queue.length) { inReview = false; current = queue.shift(); return ask(current); }                       // 主回合
  if (reviewQueue.length) { inReview = true; const e = reviewQueue.shift(); current = e.w; return reviewThenAsk(e.w, e.run, e.skill); }   // 主回合跑完 → 回顧重答錯題(同題型)
  showDone();
}
// 補考(DESIGN_MASTERY step 2):答錯的題集中到主回合後重答 → 永不卡死。
// 2026-06 UX:先直接補考(手滑打錯的人直接重答即可,不強迫看完整重看卡);補考畫面多一顆「我要複習」可選鈕,想看才走重看流程。
function reviewThenAsk(w, run, skill) {
  currentRung = 1;
  currentSkill = skill || (run && SKILL.get(run)) || null;
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
  b.textContent = '📖 我要複習這個字';
  b.onclick = () => showReviewCard(w, r);
  host.appendChild(b);
}
// 重看卡:字 + 音節 + 念 + 字根(原本強制出現的那張,現在改成「我要複習」才看)→ 看完回去補考
function showReviewCard(w, r) {
  const syls = sylOf(w);
  const sylHTML = syls.map(s => `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  const sylBlock = syls.length > 1
    ? `<div class="syllables teach-syllables" id="syls">${sylHTML}</div><div class="syltip teach-tip">「·」只是音節分隔,拼字沒有點</div>`
    : `<div class="syllables teach-syllables" id="syls" hidden>${sylHTML}</div>`;
  shell('複習一下這個字,再回去答 👇', `
    <div class="teach-layout">
      <div class="teach-main">
        <div class="fullword teach-word">${w.en}</div>
        ${sylBlock}
        <div class="sub2 teach-zh">${w.zh}</div>
      </div>
      <div class="teach-tools"><button class="replay" id="rplay">🔊 念</button></div>
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
