function shell(promptText, bodyHTML) {
  screen.classList.remove('boss-screen', 'done-screen', 'start-screen');
  screen.classList.add('lesson-screen');
  screen.innerHTML = `
    <div class="toprow"><button class="xexit" id="xexit" aria-label="離開">✕</button><div class="bar"><i id="bar"></i></div></div>
    <div class="count" id="count"></div>
    <main class="lesson">
      <section class="lesson-stage"><div class="prompt" id="prompt">${promptText}</div></section>
      <section class="lesson-answer" id="body">${bodyHTML}</section>
    </main>
    <div class="why" id="why" hidden></div>`;
  $('xexit').onclick = confirmExit;
  updateBar();
}
// 中途按 X:確認後回主畫面(本關沒完成 → 不過關、不解王;已答對的字熟練度本來就即時存,不動)
function confirmExit() {
  const ov = document.createElement('div');
  ov.className = 'ovl';
  ov.innerHTML = `<div class="ovlbox">
    <div class="ovltitle">確定要離開?</div>
    <div class="ovlsub">這一關還沒完成,離開後要重新開始。</div>
    <button class="btn" id="ovlquit" style="background:#2a0e12;border-color:#e35b6a">離開本關</button>
    <button class="btn" id="ovlstay" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">繼續練習</button>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });   // 點黑底空白處 = 取消
  $('ovlstay').onclick = () => ov.remove();
  $('ovlquit').onclick = () => { ov.remove(); speechSynthesis && speechSynthesis.cancel(); showHome(); };
}
function updateBar() {
  // 上方進度條 = 這關「已答對題數 / 總共要答的題數」,每答對一題就前進一格;答完整關 = 100%(不再等整個字練完才跳一大格)
  const need = levelWords.reduce((s, w) => s + (quota[wordKey(w)] || 0), 0);
  const got  = levelWords.reduce((s, w) => s + Math.min(lgot[wordKey(w)] || 0, quota[wordKey(w)] || 0), 0);
  const pct = need ? Math.round(got / need * 100) : 0;
  const bar = $('bar'); if (bar) bar.style.width = pct + '%';
  const c = $('count'); if (c) c.textContent = `${pct}%`;
}

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
const BUILD_SENTENCE_PATTERN_IDS = ["pat_this_is_a_noun", "pat_this_is_my_noun", "pat_this_is_adj", "pat_i_am_adj", "pat_i_see_a_noun", "pat_i_buy_a_noun", "pat_i_read_noun", "pat_i_drink_noun", "pat_i_eat_noun"];
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
function sentenceSourceWords(baseWords = levelWords) {
  const out = new Map();
  baseWords.forEach(w => { if (w) out.set(wordKey(w), w); });
  BANK.forEach(w => {
    const c = savedRec(w);
    if (c && (c.taught || learnedByRecord(c))) out.set(wordKey(w), w);
  });
  return [...out.values()];
}
// 防句子重複:記最近出過的幾句,抽題時避開(治「一關 4 題出現 3 次 I am happy」)。I am 家族只有 happy → 沒避開就一直重複。
let recentSentences = [];
const rememberSentence = text => { if (text) recentSentences = [text, ...recentSentences.filter(t => t !== text)].slice(0, 3); };
const pickFresh = list => list.find(s => !recentSentences.includes(s.text)) || list[0] || null;   // 優先沒最近出過的;真的只剩重複的才回退
function pickBuildSentence(sourceWords = sentenceSourceWords()) {
  return pickFresh(shuffle(buildSentencePatterns().map(p => buildSentenceFromPattern(p, sourceWords)).filter(Boolean)));
}
// 玩法層:容易混淆的近義 / 對照字 + 選錯時教的差別(不放進 BANK,跟 SPEECH_ALIASES 同層,避免單字資料變肥)
const CONFUSE_PAIRS = {
  word_home:   { with:"word_house",  note:"home 是有歸屬感的『家』;house 是建築物『房子』。" },
  word_house:  { with:"word_home",   note:"house 是建築物;home 是你歸屬、回去的家。" },
  word_look:   { with:"word_see",    note:"look 是主動把眼睛轉過去看(動作);see 是『看見』的結果。" },
  word_see:    { with:"word_look",   note:"see 是看見(結果);look 是主動去看(動作)。" },
  word_listen: { with:"word_hear",   note:"listen 是專心聽(動作);hear 是『聽見』的結果。" },
  word_hear:   { with:"word_listen", note:"hear 是聽見(結果);listen 是主動專心聽。" },
  word_speak:  { with:"word_say",    note:"speak 是開口說話 / 說某語言;say 是說出具體內容。" },
  word_say:    { with:"word_speak",  note:"say 重點是說的內容;speak 重點是開口這個動作。" },
  word_make:   { with:"word_do",     note:"make 是做出一個成品;do 是執行一件事。" },
  word_do:     { with:"word_make",   note:"do 是做某件事;make 是做出某個東西。" },
  word_bring:  { with:"word_take",   note:"bring 是帶『來』這裡;take 是帶『走』離開。" },
  word_take:   { with:"word_bring",  note:"take 是拿走 / 帶走;bring 是帶來這裡。" },
  word_come:   { with:"word_go",     note:"come 是往這裡來;go 是往別處去。" },
  word_go:     { with:"word_come",   note:"go 是離開往別處;come 是靠近往這來。" },
};
const confuseNote = (w, picked) => {
  const p = CONFUSE_PAIRS[wordKey(w)];
  return p && picked && wordKey(picked) === p.with ? p.note : '';
};
function wrongHint(w, picked) {
  const diff = confuseNote(w, picked);             // 選到近義字 → 優先教兩者差別
  const pickedLine = picked && picked.en !== w.en
    ? `<div style="margin-bottom:8px">你選的是 <b>${picked.en}</b> = ${picked.zh}</div>`
    : '';
  if (diff) return `${pickedLine}<b style="color:#6ee7a8">${diff}</b>`;
  if (w.why) return `${pickedLine}${w.why}`;
  return `${pickedLine}再聽一次,下一輪補考。`;
}

// 答完的共用結算:對 → 加分前進;錯 → 給字根 + 繼續
function finish(right, w, picked = null) {
  { const sb = $('submit'); if (sb) sb.style.display = 'none'; }   // 答完收掉送出鈕(它釘在底部固定區,別跟結算列重疊)
  const why = $('why');
  if (right) {
    sfx.correct();
    onCorrect(w); updateBar();
    why.classList.remove('bad');                   // 對 = 綠框
    why.innerHTML = `<div class="result-head">
      <div class="result-mark">✓</div>
      <div class="result-main">
        <div class="result-word">${w.en}<span class="result-eq"> = ${w.zh}</span></div>
        <div class="result-copy">${w.why || '很好,下一題繼續。'}</div>
      </div>
      <button class="replay" id="rehear">🔊 再聽</button>
    </div>
    <button class="btn act" id="cont">繼續 →</button>`;
    why.hidden = false;
    $('rehear').onclick = () => speak(w.en);
    $('cont').onclick = nextQuestion;              // 對 → 自己看完說明按繼續(熟練度上面已加,別重複)
  } else {
    sfx.wrong();
    speak(w.en);                                   // 答錯 → 自動補念一次正確發音(這字之後再出現,也是答錯時才重教)
    why.classList.add('bad');                      // 錯 = 紅框
    why.innerHTML = `<div class="result-head">
      <div class="result-mark">!</div>
      <div class="result-main">
        <div class="result-word">${w.en}<span class="result-eq"> = ${w.zh}</span></div>
        <div class="result-copy">${wrongHint(w, picked)}</div>
      </div>
      <button class="replay" id="rehear">🔊 再聽</button>
    </div>
    <button class="btn act" id="cont">繼續 →</button>`;
    why.hidden = false;
    $('rehear').onclick = () => speak(w.en);
    $('cont').onclick = () => { onWrong(w); nextQuestion(); };
  }
}
function finishGroupSuccess(title, copy, onContinue) {
  sfx.correct();
  const why = $('why');
  why.className = 'why';
  why.innerHTML = `<div class="result-head compact">
    <div class="result-mark">✓</div>
    <div class="result-main">
      <div class="result-word">${title}</div>
      <div class="result-copy">${copy}</div>
    </div>
  </div>
  <button class="btn act" id="cont">繼續 →</button>`;
  why.hidden = false;
  $('cont').onclick = onContinue;
}
// 選擇題共用:標出對/錯的卡再結算
function pickAnswer(box, el, right, w, correctText, picked = null) {
  if (box.classList.contains('locked')) return;
  box.classList.add('locked');
  if (right) el.classList.add('right');
  else { el.classList.add('wrong'); [...box.children].forEach(c => { if (c.textContent === correctText) c.classList.add('right'); }); }
  finish(right, w, picked);
}
function fourOptions(w) {
  const opts = [];
  const push = o => { if (o && o.en !== w.en && o.zh !== w.zh && !opts.some(x => x.en === o.en)) opts.push(o); };  // 誘答中文不能跟正解一樣(避免「是」對 is/am 兩個都對)
  const pair = CONFUSE_PAIRS[wordKey(w)];                              // 有近義對 → 先保證它入選當誘答(但要教過的)
  if (pair && !isFresh(wordById(pair.with))) push(wordById(pair.with));
  shuffle(BANK.filter(x => x.en !== w.en && !isFresh(x) && x.pos === w.pos)).forEach(push);   // 誘答只用「教過的字」、優先同詞性
  shuffle(BANK.filter(x => x.en !== w.en && !isFresh(x))).forEach(push);                       // 教過的(任何詞性)補
  return shuffle([w, ...opts.slice(0, 3)]);                            // 不夠就少幾個選項,絕不拉沒教過的字進來
}

// Web Speech 會把短字/同音字聽錯。這是玩法層辨識別名,不放進 BANK,避免單字資料變肥。
// 念法覆寫:有些字單獨念跟在句子裡不一樣(冠詞 a 念 schwa /ə/「ㄜ」、不是字母名)。教 / 念時用。跟 SPEECH_ALIASES 同層,不進 BANK。
