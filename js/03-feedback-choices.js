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
  // do/come/bring/take 已移出日常字庫(零基礎給不出自然句子,等有句型再回來)→ 相關對照先拿掉,免得 fourOptions 拿 undefined 當誘答。
};

const confuseNote = (w, picked) => {
  const p = CONFUSE_PAIRS[wordKey(w)];
  return p && picked && wordKey(picked) === p.with ? p.note : '';
};

const CATEGORY_SETS = [
  { id:'drinkable', flag:'drinkable', label:'飲料', prompt:'選出所有可以喝的東西' },
  { id:'sweetenable', flag:'sweetenable', label:'可以加糖的飲料', prompt:'選出所有可以加糖的飲料' },
  { id:'eatable', flag:'eatable', label:'食物', prompt:'選出所有可以吃的東西' },
  { id:'emotion', flag:'emotion', label:'感受', prompt:'選出所有感受或心情' },
  // 「可數/加 a」不做成分類題:英文可數性邊界太模糊(a sugar cube、two sugars、a coffee 都通),
  // 抽成「選出所有可數的字」會冤枉講得通的答案。這個觀念改由句型自然帶:This is a cat.(加 a)vs I drink water.(不加 a)。
  { id:'ownable', flag:'ownable', label:'可以說「我的...」的東西', prompt:'選出所有可以說成 my ___ 的東西' },
];
const hasFlag = (w, flag) => asList(w && w.flags).includes(flag);
function categorySourceWords(baseWords = levelWords) {
  const source = typeof currentSentenceSourceWords === 'function' ? currentSentenceSourceWords(baseWords) : BANK;
  const seen = new Map();
  source.forEach(w => { if (w && w.pos !== 'function' && !isFresh(w)) seen.set(wordKey(w), w); });
  return [...seen.values()];
}
function buildCategoryQuestion(mustInclude = null, sourceWords = categorySourceWords(), opts = {}) {
  const minCorrect = opts.minCorrect || 2;
  const maxOptions = opts.maxOptions || 8;
  const cats = shuffle(CATEGORY_SETS).filter(cat => !mustInclude || hasFlag(mustInclude, cat.flag));
  for (const cat of cats) {
    const positives = shuffle(sourceWords.filter(w => hasFlag(w, cat.flag)));
    const negatives = shuffle(sourceWords.filter(w => !hasFlag(w, cat.flag)));
    if (positives.length < minCorrect || negatives.length < 2) continue;
    const correct = positives.slice(0, Math.min(4, positives.length));
    if (mustInclude && hasFlag(mustInclude, cat.flag) && !correct.some(w => w.id === mustInclude.id)) {
      correct.pop();
      correct.unshift(mustInclude);
    }
    const wrong = negatives.slice(0, Math.max(2, maxOptions - correct.length));
    const options = shuffle([...correct, ...wrong]).slice(0, maxOptions);
    const correctIds = new Set(correct.map(w => w.id));
    if (options.filter(w => correctIds.has(w.id)).length < minCorrect) continue;
    return { category:cat, options, correct, correctIds:[...correctIds] };
  }
  return null;
}
const categoryQuestionForWord = w => buildCategoryQuestion(w, undefined, { maxOptions: 6 });   // 主線分類題最多 6 個 → 一頁塞得下、不用下拉(捲動只當保險)

function wrongHint(w, picked) {
  const diff = confuseNote(w, picked);             // 選到近義字 → 優先教兩者差別
  const pickedLine = picked && picked.en !== w.en
    ? `<div style="margin-bottom:8px">你選的是 <b>${picked.en}</b> = ${picked.zh}</div>`
    : '';
  if (diff) return `${pickedLine}<b style="color:#6ee7a8">${diff}</b>`;
  if (w.why) return `${pickedLine}${w.why}`;
  return `${pickedLine}再聽一次,下一輪補考。`;
}

// 答完收掉「釘在底部固定區、會跟結算列(.why)重疊」的動作鈕:送出 + 特訓「我學會了」。所有結算路徑共用。
function clearBottomActions() {
  ['submit', 'trainknown', 'skipspeak'].forEach(id => { const el = $(id); if (el) el.style.display = 'none'; });
}

// 答完的共用結算:對 → 加分前進;錯 → 給字根 + 繼續
function finish(right, w, picked = null, note = '') {
  clearBottomActions();   // 收掉送出 / 特訓學會鈕,別跟底部結算列重疊
  const why = $('why');
  const wordHTML = typeof annotatedWordHTML === 'function' ? annotatedWordHTML(w) : w.en;
  const forcedWordHTML = typeof annotatedWordHTML === 'function' ? annotatedWordHTML(w, { force:true }) : w.en;
  if (right) {
    if (typeof clearAnnotationErrorHTML === 'function') clearAnnotationErrorHTML();
    sfx.correct();
    onCorrect(w); updateBar();
    why.classList.remove('bad');                   // 對 = 綠框
    why.innerHTML = `<div class="result-head">
      <div class="result-mark">✓</div>
      <div class="result-main">
        <div class="result-word">${wordHTML}<span class="result-eq"> = ${w.zh}</span></div>
        <div class="result-copy">${note ? `<b>${note}</b><br>` : ''}${w.why || '很好,下一題繼續。'}</div>
      </div>
      <button class="replay" id="rehear">${ICON.play}再聽</button>
    </div>
    <button class="btn act" id="cont">繼續 →</button>`;
    why.hidden = false;
    $('rehear').onclick = () => speak(w.en);
    $('cont').onclick = nextQuestion;              // 對 → 自己看完說明按繼續(熟練度上面已加,別重複)
  } else {
    sfx.wrong();
    speak(w.en);                                   // 答錯 → 自動補念一次正確發音(這字之後再出現,也是答錯時才重教)
    const annotNote = typeof takeAnnotationErrorHTML === 'function' ? takeAnnotationErrorHTML() : '';
    why.classList.add('bad');                      // 錯 = 紅框
    why.innerHTML = `<div class="result-head">
      <div class="result-mark">!</div>
      <div class="result-main">
        <div class="result-word">${forcedWordHTML}<span class="result-eq"> = ${w.zh}</span></div>
        <div class="result-copy">${wrongHint(w, picked)}${annotNote}</div>
      </div>
      <button class="replay" id="rehear">${ICON.play}再聽</button>
    </div>
    <button class="btn act" id="cont">繼續 →</button>`;
    why.hidden = false;
    $('rehear').onclick = () => speak(w.en);
    $('cont').onclick = () => { onWrong(w); nextQuestion(); };
  }
}

function finishGroupSuccess(title, copy, onContinue) {
  sfx.correct();
  clearBottomActions();   // 收掉特訓學會鈕等,別跟結算列重疊
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

// 選擇題共用:點 = 選定(高亮 .sel),按「確認」才判分 → 治手滑點到就送出。確認前可改選。
// getText(o) 取選項顯示字;correctText = 正解顯示字(答錯時標綠用)。
function mountChoices(box, opts, getText, w, correctText) {
  let sel = null;
  opts.forEach(o => {
    const el = document.createElement('div'); el.className = 'opt';
    const text = getText(o);
    el.textContent = text;
    el.onclick = () => {
      if (box.classList.contains('locked')) return;
      [...box.children].forEach(c => c.classList.remove('sel'));
      el.classList.add('sel'); sel = { el, o };
      if (o && o.en) speak(SPEAK_AS[o.id] || o.en);     // 選了就念那個字(套 SPEAK_AS:a→uh 不念字母 A)
      const sb = $('submit'); if (sb) sb.disabled = false;
    };
    box.appendChild(el);
  });
  $('body').insertAdjacentHTML('beforeend', '<button class="btn act" id="submit" disabled>確認</button>');
  $('submit').onclick = () => {
    if (!sel || box.classList.contains('locked')) return;
    pickAnswer(box, sel.el, sel.o.en === w.en, w, correctText, sel.o);   // 確認才判分(pickAnswer→finish 會收掉確認鈕、出結算)
  };
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
