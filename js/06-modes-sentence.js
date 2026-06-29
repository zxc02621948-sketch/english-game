function teachPattern(sentence, then, onKnown) {
  const chunks = sentence.text.replace(/[.?!]/g, '').split(/\s+/).filter(Boolean);
  shell('先看這個句型', `
    <div class="buildzh">${sentence.zh}</div>
    <div class="buildline">${chunks.map(c => `<div class="opt chunk">${c}</div>`).join('')}</div>
    <div class="sub2" style="margin-top:12px">英文照這個順序:<b style="color:#9bd2ff">${sentence.text}</b></div>
    <button class="btn act" id="gotit" style="margin-top:16px">懂了,我來排 →</button>
    ${onKnown ? '<button class="btn sideact" id="patknow">這個句型我已經會了 →</button>' : ''}`);
  $('gotit').onclick = then;
  if (onKnown) { const b = $('patknow'); if (b) b.onclick = onKnown; }   // 已經會這句型 → 標會、跳過排句、continue
}

// 共用拖曳排序引擎:給 cards + 正解 token 順序,渲染 slots/bank + 拖曳/點擊 + 確定;判對錯交給 onCheck 出回饋。
// 排詞造句、轉換題(直述↔問句)都複用這個,拖曳邏輯不重寫。caseInsensitive:轉換題 This↔this 只是大小寫、重點在順序。
function mountArrange({ promptText, zh, introHTML = '', cards, targetTokens, caseInsensitive = false, onCheck }) {
  shell(promptText, `
    ${introHTML}
    <div class="buildzh">${zh}</div>
    <div class="sentence-slots" id="slots"></div>
    <div class="chunks sentence-bank" id="bank"></div>
    <div class="buildactions" id="bactions" style="grid-template-columns:1fr"><button class="btn act" id="check">確定</button></div>`);
  let slots = Array(cards.length).fill(null);
  let bank = shuffle(cards);
  let draggingId = null;

  const cardById = id => cards.find(c => c.id === id);
  const slotIndexOf = id => slots.findIndex(c => c && c.id === id);
  const removeFromBank = id => { const idx = bank.findIndex(c => c.id === id); return idx >= 0 ? bank.splice(idx, 1)[0] : null; };
  const takeCard = id => {
    const fromBank = removeFromBank(id);
    if (fromBank) return { card: fromBank, fromSlot: -1 };
    const fromSlot = slotIndexOf(id);
    if (fromSlot < 0) return { card: null, fromSlot: -1 };
    const card = slots[fromSlot];
    slots[fromSlot] = null;
    return { card, fromSlot };
  };
  const removeFromSlot = idx => { const card = slots[idx]; if (!card) return; slots[idx] = null; bank.push(card); };
  const moveToSlot = (id, idx) => {
    const { card, fromSlot } = takeCard(id);
    if (!card) return;
    const replaced = slots[idx];
    if (replaced && fromSlot >= 0) slots[fromSlot] = replaced;
    else if (replaced) bank.push(replaced);
    slots[idx] = card;
  };
  const placeFirst = id => { const idx = slots.findIndex(c => !c); if (idx >= 0) moveToSlot(id, idx); };
  const returnToBank = id => {
    const { card, fromSlot } = takeCard(id);
    if (!card) return;
    if (fromSlot >= 0) bank.push(card);
    else bank.push(cardById(id) || card);
  };
  const allowDrop = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const droppedId = e => e.dataTransfer.getData('text/plain') || draggingId;
  const dragStart = (e, id) => { draggingId = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); };

  const makeCard = (card, from, slotIndex = -1) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'opt chunk sentence-card';
    el.textContent = card.text;
    el.dataset.id = card.id;
    el.draggable = true;
    el.addEventListener('dragstart', e => dragStart(e, card.id));
    el.addEventListener('dragend', () => { draggingId = null; });
    el.onclick = () => { if (from === 'bank') placeFirst(card.id); else removeFromSlot(slotIndex); render(); };
    return el;
  };

  const render = () => {
    const slotBox = $('slots'), bankBox = $('bank');
    slotBox.innerHTML = '';
    bankBox.innerHTML = '';
    slots.forEach((card, idx) => {
      const slot = document.createElement('div');
      slot.className = card ? 'sentence-slot filled' : 'sentence-slot';
      slot.addEventListener('dragover', allowDrop);
      slot.addEventListener('drop', e => { e.preventDefault(); moveToSlot(droppedId(e), idx); draggingId = null; render(); });
      if (card) slot.appendChild(makeCard(card, 'slot', idx));
      slotBox.appendChild(slot);
    });
    bankBox.ondragover = allowDrop;
    bankBox.ondrop = e => { e.preventDefault(); returnToBank(droppedId(e)); draggingId = null; render(); };
    bank.forEach(card => bankBox.appendChild(makeCard(card, 'bank')));
    $('check').disabled = slots.some(slot => !slot);
  };

  render();

  const norm = t => caseInsensitive ? (t || '').toLowerCase() : t;
  const retry = () => {
    const why = $('why'); why.hidden = true; why.className = 'why';
    $('bactions').style.display = '';
    $('prompt').textContent = promptText;
    slots = Array(cards.length).fill(null);
    bank = shuffle(cards);
    render();
  };
  $('check').onclick = () => {
    const placed = slots.map(card => card && card.text);
    const right = placed.map(norm).join(' ') === targetTokens.map(norm).join(' ');
    $('bactions').style.display = 'none';
    document.querySelectorAll('.sentence-card').forEach(el => { el.draggable = false; el.style.pointerEvents = 'none'; });
    onCheck(right, { retry });
  };
}

// 複習用:組一句「保證含 w」的句子(w 當 slot 受詞,或 w 是句型的 requires 動詞)→ 學會的字靠句子複習,不再單獨刷。湊不出(如還沒句型的動詞)回 null。
function sentenceWithWord(w, sourceWords = sentenceSourceWords()) {
  const pats = shuffle(buildSentencePatterns().filter(p =>
    patternRequirementsMet(p) &&
    (asList(p.requires).includes(w.id) || Object.values(p.slots).some(slot => wordMatchesSlot(w, slot)))
  ));
  const cands = pats.map(p => buildSentenceFromPattern(p, sourceWords, w))
    .filter(s => s && s.text.toLowerCase().split(/[^a-z]+/).filter(Boolean).includes(w.en.toLowerCase()));
  return pickFresh(cands);   // 避開最近出過的句子
}

function askBuildSentence(sourceWords = sentenceSourceWords(), done = showDone, forced = null) {
  const sentence = forced || pickBuildSentence(sourceWords);
  if (!sentence) {
    shell('組句小練習', `<div class="sub2">這批字還組不出自然句,先繼續練單字。</div><button class="btn act" id="cont">繼續 →</button>`);
    $('cont').onclick = done;
    return;
  }
  rememberSentence(sentence.text);   // 記下這句 → 接下來幾題避開重複
  const target = sentence.text.replace(/[.?!]/g, '').split(/\s+/).filter(Boolean);
  const arrange = () => mountArrange({
    promptText: '看中文,排出英文',
    zh: sentence.zh,
    cards: target.map((text, i) => ({ id: `c${i}`, text })),
    targetTokens: target,
    onCheck: (right, { retry }) => {
      const why = $('why');
      speakSentence(sentence);
      if (right) {
        sfx.correct(); bumpPat(sentence.patternId, 25); creditSentence(sentence);
        why.className = 'why';
        why.innerHTML = `<div class="result-head">
          <div class="result-mark">✓</div>
          <div class="result-main">
            <div class="result-word">${sentence.text}</div>
            <div class="result-copy">${sentence.zh}</div>
          </div>
          <button class="replay" id="sayit">🔊 再聽整句</button>
          <button class="replay" id="sayslow">🐢 慢速</button>
        </div>
        <button class="btn act" id="cont">繼續 →</button>`;
        why.hidden = false;
        $('sayit').onclick = () => speakSentence(sentence);
        $('sayslow').onclick = () => speakSentence(sentence, 0.5);
        $('cont').onclick = done;
      } else {
        sfx.wrong(); bumpPat(sentence.patternId, -20);
        why.className = 'why bad';
        why.innerHTML = `<div class="result-head">
          <div class="result-mark">!</div>
          <div class="result-main">
            <div class="result-word">正解: ${sentence.text}</div>
            <div class="result-copy">${sentence.zh}</div>
          </div>
          <button class="replay" id="sayit">🔊 聽正解</button>
          <button class="replay" id="sayslow">🐢 慢速</button>
        </div>
        <button class="btn act" id="retry">重排一次</button>`;
        why.hidden = false;
        $('sayit').onclick = () => speakSentence(sentence);
        $('sayslow').onclick = () => speakSentence(sentence, 0.5);
        $('retry').onclick = retry;
      }
    }
  });

  if (patMastery(sentence.patternId) === 0) {
    bumpPat(sentence.patternId, 10);
    teachPattern(sentence, arrange, () => { bumpPat(sentence.patternId, LEARNED); done(); });   // 「這句型我已經會了」→ 句型標滿、跳過排句、直接 continue
  } else {
    arrange();
  }
}

// ★ 轉換題(招牌:this is ↔ is this):先給排好的直述句 → 把「同一批字」重排成問句,戳「換順序就變問句」的 aha。
// 只用 be 動詞 This is 家族(純重排成立;I see a cat 變問句要 do,不能純重排 → 不放進來)。
const TRANSFORM_PATTERN_IDS = ["pat_this_is_a_noun", "pat_this_is_my_noun", "pat_this_is_adj", "pat_i_am_adj"];
function pickTransformSentence(sourceWords = sentenceSourceWords()) {
  const pats = PATTERNS.filter(p => TRANSFORM_PATTERN_IDS.includes(p.id) && p.q && patMastery(p.id) > 0);   // 直述句練過(patMastery>0)才轉換 → 有「我會這句、現在改問句」的對照
  return pickFresh(shuffle(pats.map(p => buildSentenceFromPattern(p, sourceWords)).filter(Boolean)));   // 避開最近出過的句子(I am 只有 happy,沒避開會一直重複)
}
function canTransform() { return !!pickTransformSentence(); }
function askTransform(w, done) {
  const s = pickTransformSentence();
  const cont = done || (() => { onCorrect(w); updateBar(); nextQuestion(); });
  if (!s) return askBuildSentence(sentenceSourceWords(), cont);                       // 湊不出問句 → 退回一般排句
  rememberSentence(s.text);   // 記下這句 → 接下來幾題避開重複(I am happy 連出三次就是這裡沒擋)
  const stmt = s.text.replace(/[.?!]/g, '').split(/\s+/).filter(Boolean);             // This is a cat / I am happy
  const qTok = s.question.replace(/[.?!]/g, '').split(/\s+/).filter(Boolean);         // Is this a cat / Am I happy
  const beVerb = stmt[1] || 'is';                                                     // 被提到句首的 be 動詞(is/am),aha 文案動態用
  const sayQ = () => speakSentence({ text: s.question });
  mountArrange({
    promptText: '改成問句 —— 同一批字,重新排',
    zh: s.questionZh,
    introHTML: `<div class="transform-intro"><div class="transform-stmt">${s.text}</div><div class="transform-stmt-zh">${s.zh}</div><div class="transform-arrow">↓ 改成問句</div></div>`,
    cards: stmt.map((text, i) => ({ id: `c${i}`, text })),
    targetTokens: qTok,
    caseInsensitive: true,
    onCheck: (right, { retry }) => {
      const why = $('why');
      sayQ();
      if (right) {
        sfx.correct(); bumpPat(s.patternId, 15); creditSentence(s);
        why.className = 'why';
        why.innerHTML = `<div class="result-head">
          <div class="result-mark">✓</div>
          <div class="result-main">
            <div class="result-word">${s.question}</div>
            <div class="result-copy">同樣的字,把 <b>${beVerb}</b> 移到最前面,「${s.zh}」就變問句「${s.questionZh}」。</div>
          </div>
          <button class="replay" id="sayit">🔊 再聽</button>
        </div>
        <button class="btn act" id="cont">繼續 →</button>`;
        why.hidden = false;
        $('sayit').onclick = sayQ;
        $('cont').onclick = cont;
      } else {
        sfx.wrong(); bumpPat(s.patternId, -10);
        why.className = 'why bad';
        why.innerHTML = `<div class="result-head">
          <div class="result-mark">!</div>
          <div class="result-main">
            <div class="result-word">正解: ${s.question}</div>
            <div class="result-copy">問句把 be 動詞 <b>${beVerb}</b> 放到最前面。</div>
          </div>
          <button class="replay" id="sayit">🔊 聽正解</button>
        </div>
        <button class="btn act" id="retry">重排一次</button>`;
        why.hidden = false;
        $('sayit').onclick = sayQ;
        $('retry').onclick = retry;
      }
    }
  });
}

function sentenceClozeForWord(w) {
  if (!w || w.pos === 'function') return null;
  const pats = patternsForWord(w).sort((a, b) => patMastery(b.id) - patMastery(a.id));
  if (!pats.length) return null;
  const pat = shuffle(pats)[0];
  const slotName = Object.keys(pat.slots).find(n => wordMatchesSlot(w, pat.slots[n]));
  if (!slotName) return null;
  const filled = s => s.replace(new RegExp(`\\{${slotName}\\}`), w.en).replace(/\{\w+\}/g, '');
  const filledZh = s => s.replace(new RegExp(`\\{${slotName}\\}`), wordZhForSlot(w, pat.slots[slotName])).replace(/\{\w+\}/g, '');
  const full = filled(pat.text);
  const tokens = full.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
  const targetIdx = tokens.findIndex(t => t.toLowerCase() === w.en.toLowerCase());
  if (targetIdx < 0) return null;
  const requires = new Set(asList(pat.requires).map(id => (wordById(id) || {}).en).filter(Boolean).map(en => en.toLowerCase()));
  const support = tokens.map((t, i) => ({ t, i })).filter(x => x.i !== targetIdx && requires.has(x.t.toLowerCase()));
  const blankIdxs = [targetIdx, ...(support.length ? [shuffle(support)[0].i] : [])].sort((a, b) => a - b);
  const shown = tokens.map((t, i) => blankIdxs.includes(i)
    ? `<input class="clozeinp" data-i="${i}" size="${Math.max(2, t.length)}" style="--chars:${Math.max(3, t.length)}" autocomplete="off" autocapitalize="off" placeholder="＿">`
    : `<span>${t}</span>`).join(' ') + (/[.?!]$/.test(full) ? full.match(/[.?!]$/)[0] : '');
  return { patternId: pat.id, answers: blankIdxs.map(i => tokens[i]), zh: filledZh(pat.zh), shown, full };
}

function canSentenceCloze(w) {
  return !!sentenceClozeForWord(w);
}

function askSentenceCloze(w) {
  const q = sentenceClozeForWord(w);
  if (!q) return askType(w);
  shell('看句子,補完整英文', `
    <div class="buildzh">${q.zh}</div>
    <div class="sentence-cloze-line">${q.shown}</div>
    <button class="btn act" id="submit">送出</button>
    <div class="letters" id="letters"></div>`);
  const inputs = [...document.querySelectorAll('.clozeinp')];
  if (inputs[0]) inputs[0].focus();
  const clean = s => (s || '').normalize('NFKC').trim().toLowerCase();
  const go = () => {
    if (!inputs.length || inputs[0].disabled) return;
    const right = inputs.every((inp, i) => clean(inp.value) === clean(q.answers[i]));
    inputs.forEach((inp, i) => {
      const ok = clean(inp.value) === clean(q.answers[i]);
      inp.disabled = true;
      inp.classList.add(ok ? 'right' : 'wrong');
    });
    if (!right) $('letters').textContent = `正解: ${q.full}`;
    $('submit').disabled = true;
    bumpPat(q.patternId, right ? 20 : -15);
    finish(right, w);
  };
  $('submit').onclick = go;
  inputs.forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter') go(); });
}
