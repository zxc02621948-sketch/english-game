const asList = v => Array.isArray(v) ? v : (v ? [v] : []);
const wordById = id => BANK.find(w => w.id === id);
const savedRec = w => w ? (store[wordKey(w)] || store[w.en]) : null;
const wordIsTaught = w => !!(savedRec(w) && savedRec(w).taught);

function patternRequirementsMet(pattern) {
  return asList(pattern.requires).every(id => wordIsTaught(wordById(id)));
}

function wordMatchesSlot(word, slot) {
  if (!word) return false;
  if (slot.pos && word.pos !== slot.pos) return false;
  return asList(slot.flags).every(flag => asList(word.flags).includes(flag));
}

function getEligibleWords(slot, sourceWords = BANK) {
  return sourceWords.filter(word => wordMatchesSlot(word, slot));
}

function wordZhForSlot(word, slot) {
  const zh = word ? word.zh : "";
  return asList(slot && slot.flags).includes("descriptive") ? zh.replace(/的$/, "") : zh;
}

function buildSentenceFromPattern(pattern, sourceWords = BANK, mustInclude = null) {
  if (!patternRequirementsMet(pattern)) return null;
  const sourceIds = new Set(sourceWords.map(w => w && w.id).filter(Boolean));
  if (sourceIds.size && !asList(pattern.requires).every(id => sourceIds.has(id))) return null;
  const picks = {};
  let placedMust = false;                                       // 複習用:把指定的字(mustInclude)強制塞進它能填的第一個 slot,讓句子保證含這個字
  for (const [name, slot] of Object.entries(pattern.slots)) {
    const used = new Set(Object.values(picks).map(w => w.id));
    const candidates = getEligibleWords(slot, sourceWords).filter(w => !used.has(w.id));
    if (!candidates.length) return null;
    if (mustInclude && !placedMust && candidates.some(c => c.id === mustInclude.id)) {
      picks[name] = mustInclude; placedMust = true;
    } else {
      picks[name] = shuffle(candidates)[0];
    }
  }
  const fill = s => s.replace(/\{(\w+)\}/g, (_, name) => picks[name] ? picks[name].en : "");
  const fillZh = s => s.replace(/\{(\w+)\}/g, (_, name) => picks[name] ? wordZhForSlot(picks[name], pattern.slots[name]) : "");
  return {
    patternId: pattern.id, text: fill(pattern.text), zh: fillZh(pattern.zh), words: picks,
    question: pattern.q ? fill(pattern.q) : null,           // 問句形(同一批選字重排;沒 q 的句型 = null)→ 轉換題用
    questionZh: pattern.qzh ? fillZh(pattern.qzh) : null
  };
}

let BUILD_SENTENCE_PATTERN_IDS = ["pat_drink_or_drink", "pat_drink_please", "pat_drink_with_sugar", "pat_this_is_a_noun", "pat_this_is_my_noun", "pat_this_is_adj", "pat_i_am_adj", "pat_i_see_a_noun", "pat_i_buy_a_noun", "pat_i_read_noun", "pat_i_drink_noun", "pat_i_eat_noun", "pat_i_look_at_noun", "pat_i_make_noun", "pat_i_get_noun", "pat_i_speak_language"];
const buildSentencePatterns = () => PATTERNS.filter(p => BUILD_SENTENCE_PATTERN_IDS.includes(p.id));

function learnedByRecord(c) {
  return c && (c.mastery || 0) >= LEARNED;
}

// 句型熟練度(第二條軌,DESIGN_MASTERY §2):跟單字 mastery 分開,存同一個 store(pattern id = pat_xxx,不撞 word_xxx)。
const bumpPat = (patId, d) => { const c = store[patId] || (store[patId] = { mastery: 0 }); c.mastery = Math.max(0, Math.min(LEARNED, (c.mastery || 0) + d)); save(); };
const patMastery = patId => (store[patId] && store[patId].mastery) || 0;

// 句子答對 → 連帶幫組成的字加熟練度 + 排 SRS(靠排詞自然學會字)。不碰本關佇列/quota,那是單字題的事。
function creditWord(w) {
  const wasLearned = isLearned(w), c = rec(w);
  c.mastery = Math.min(LEARNED, (c.mastery || 0) + MASTERY_OK);
  if (!wasLearned && isLearned(w) && !c.coined) { meta.coins++; c.coined = true; saveMeta(); }   // 第一次學會 → 金幣
  if (isLearned(w)) { c.ivl = wasLearned ? Math.min((c.ivl || 1) * 2, 30) : 1; c.due = (meta.clock || 0) + c.ivl; }   // 學會 → 排間隔複習(會把字推遠 → 之後少被單獨刷)
  save();
}

function creditSentence(sentence) {
  const ids = new Set();
  sentence.text.replace(/[.?!,]/g, '').split(/\s+/).forEach(tok => {
    const m = BANK.find(x => x.en.toLowerCase() === tok.toLowerCase());
    if (m) ids.add(m.id);
  });
  ids.forEach(id => creditWord(wordById(id)));
}

// 念整句:先把有念法覆寫的字(冠詞 a → uh,免得被念成字母「A」)換掉再念
function speakSentence(sentence, rate) {
  speak(sentence.text.replace(/[A-Za-z]+/g, m => {
    const w = BANK.find(x => x.en.toLowerCase() === m.toLowerCase());
    return (w && SPEAK_AS[w.id]) ? SPEAK_AS[w.id] : m;
  }), rate);
}
// 念單一個 token(排詞塊、選項…),一樣套 SPEAK_AS → 「a」念 schwa「uh」不念成字母 A
function speakWordText(text, rate) {
  const w = BANK.find(x => x.en.toLowerCase() === (text || '').toLowerCase());
  speak(w && SPEAK_AS[w.id] ? SPEAK_AS[w.id] : text, rate);
}

function sentenceSourceWords(baseWords = levelWords) {
  const out = new Map();
  baseWords.forEach(w => { if (w) out.set(wordKey(w), w); });
  BANK.forEach(w => {
    const c = savedRec(w);
    if (c && (c.taught || learnedByRecord(c))) out.set(wordKey(w), w);
  });
  return [...out.values()];
}
function currentSentenceSourceWords(baseWords = levelWords) {
  const stage = typeof stageOfLevel === 'function' ? stageOfLevel(level) : (meta.stage || 1);
  return sentenceSourceWords(baseWords).filter(w => batchOf(w) < stage);
}

// 防句子重複:記最近出過的幾句,抽題時避開(治「一關 4 題出現 3 次 I am happy」)。I am 家族只有 happy → 沒避開就一直重複。
let recentSentences = [];
const rememberSentence = text => { if (text) recentSentences = [text, ...recentSentences.filter(t => t !== text)].slice(0, 6); };
const uniqueSentences = list => {
  const seen = new Set();
  return list.filter(s => {
    if (!s || !s.text || seen.has(s.text)) return false;
    seen.add(s.text);
    return true;
  });
};
function sentenceVariants(pattern, sourceWords = sentenceSourceWords(), mustInclude = null, tries = 10) {
  const out = [];
  for (let i = 0; i < tries; i++) out.push(buildSentenceFromPattern(pattern, sourceWords, mustInclude));
  return uniqueSentences(out);
}
function sentenceCandidates(patterns, sourceWords = sentenceSourceWords(), mustInclude = null, tries = 10) {
  return uniqueSentences(patterns.flatMap(p => sentenceVariants(p, sourceWords, mustInclude, tries)));
}
function pickFresh(list) {
  if (!list || !list.length) return null;
  const last = recentSentences[0];
  return list.find(s => !recentSentences.includes(s.text))
    || list.find(s => s.text !== last)
    || list[0]
    || null;
}

// 依「句型」平均取句子:不被「可填字多的句型」(This is a {noun} 有 cat/book/friend/house 四個)稀釋掉「只有一個變化的句型」(招牌的 I am happy 只有 happy)。
// 先挑句型(優先「還有沒出過的句子」的句型)→ 再從那句型挑 fresh。每個句型機會均等,I am happy 不會被埋到抽不到。
// 句型「跟本階有關」= requires 裡有本階的字,或 slot 收得進本階已教的字 → 句子題偏重它們(2026-07-08 治「第4階還在狂出請給我茶」)
function patternTouchesStage(p, stage) {
  const cur = (stage || 1) - 1;
  if (asList(p.requires).some(id => { const w = wordById(id); return w && batchOf(w) === cur; })) return true;
  return Object.values(p.slots || {}).some(slot => BANK.some(w => batchOf(w) === cur && rec(w).taught && wordMatchesSlot(w, slot)));
}
function pickSentenceByPattern(patterns, sourceWords = sentenceSourceWords(), filter) {
  const groups = patterns
    .map(p => ({ id: p.id, p, list: (() => { const l = sentenceCandidates([p], sourceWords); return filter ? l.filter(filter) : l; })() }))
    .filter(g => g.list.length);
  if (!groups.length) return null;
  const lastText = recentSentences[0];                                   // 上一題句子 → 找出它的句型
  const lastPat = lastText && groups.find(g => g.list.some(s => s.text === lastText));
  let pool = lastPat && groups.length > 1 ? groups.filter(g => g.id !== lastPat.id) : groups;   // 均勻挑句型,但避開「上一題的句型」→ 不會同句型連發、也不被多變化句型稀釋掉單變化的
  // ★ 偏重本階:池裡有「跟本階有關」的句型 → 7 成機率只從那群挑;3 成照舊(舊句型仍回鍋複習,只是不再霸屏)
  const stage = typeof stageOfLevel === 'function' ? stageOfLevel(level) : (meta.stage || 1);
  const curPool = pool.filter(g => patternTouchesStage(g.p, stage));
  if (curPool.length && curPool.length < pool.length && Math.random() < 0.7) pool = curPool;
  // 同句型內也優先「含本階字」的句子(I am ___ 在第4階優先填 hungry 不是 happy);pickFresh 的避重複照舊 → 不會同一句連發
  const curEns = new Set(BANK.filter(w => batchOf(w) === stage - 1).map(w => w.en.toLowerCase()));
  const containsCur = s => s.text.toLowerCase().split(/[^a-z']+/).some(t => curEns.has(t));
  const list = shuffle(shuffle(pool)[0].list).sort((a, b) => containsCur(b) - containsCur(a));
  return pickFresh(list);
}
function pickBuildSentence(sourceWords = sentenceSourceWords()) {
  return pickSentenceByPattern(buildSentencePatterns(), sourceWords);
}
// 有沒有「新的」可組句子(避開最近出過的)→ 給 FORMATS.ok 判斷:只剩剛出過的同一句時就別再 offer 句子題,交給單字題換口味(治「一關狂重播同一句」)。
const hasFreshBuildSentence = (sourceWords = sentenceSourceWords()) =>
  sentenceCandidates(buildSentencePatterns(), sourceWords).some(s => !recentSentences.includes(s.text));

// ── 複合句「你呢?」回應題(sentence_respond)── 用複合板模(兩子句),不進 build 池;工作軌沒這些板模 → 自然不出。
let RESPOND_PATTERN_IDS = ["pat_resp_feel_drink", "pat_resp_feel_eat"];
const respondPatterns = () => PATTERNS.filter(p => RESPOND_PATTERN_IDS.includes(p.id));
function pickRespondSentence(sourceWords = sentenceSourceWords(), avoidText) {
  // 用 pickSentenceByPattern:先均勻挑板模(drink/eat)再挑句 → 兩種都會出,不被變化多的 drink 稀釋掉 eat。
  return pickSentenceByPattern(respondPatterns(), sourceWords, avoidText ? (s => s.text !== avoidText) : undefined);
}
const canRespond = (sourceWords = sentenceSourceWords()) => !!pickRespondSentence(sourceWords);
