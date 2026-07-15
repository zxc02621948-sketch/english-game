function tokenHint(text) {
  const key = (text || '').replace(/[.?!,]/g, '').toLowerCase();
  const w = BANK.find(x => x.en.toLowerCase() === key);
  return w ? w.zh : '';
}
function attrText(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function hintedEnglish(text) {
  return String(text || '').replace(/[A-Za-z]+/g, word => {
    const hint = tokenHint(word);
    const shown = attrText(word);
    return hint ? `<span class="word-hint" data-hint="${attrText(hint)}" title="${attrText(hint)}" tabindex="0">${shown}</span>` : shown;
  });
}

function teachPattern(sentence, then, onKnown) {
  const chunks = sentence.text.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
  shell('先看這個句型', `
    <div class="buildzh">${sentence.zh}</div>
    <div class="buildline">${chunks.map(c => {
      const hint = tokenHint(c);
      return `<div class="opt chunk${hint ? ' word-hint' : ''}"${hint ? ` data-hint="${attrText(hint)}"` : ''}>${attrText(c)}</div>`;
    }).join('')}</div>
    <div class="sub2" style="margin-top:12px">英文照這個順序:<b style="color:#9bd2ff">${sentence.text}</b></div>
    <button class="btn act" id="gotit" style="margin-top:16px">懂了,我來排 →</button>
    ${onKnown ? '<button class="btn sideact" id="patknow">這個句型我已經會了 →</button>' : ''}`);
  $('gotit').onclick = then;
  if (onKnown) { const b = $('patknow'); if (b) b.onclick = onKnown; }   // 已經會這句型 → 標會、跳過排句、continue
}

// 共用拖曳排序引擎:給 cards + 正解 token 順序,渲染 slots/bank + 拖曳/點擊 + 確定;判對錯交給 onCheck 出回饋。
// 排詞造句、轉換題(直述↔問句)都複用這個,拖曳邏輯不重寫。caseInsensitive:轉換題 This↔this 只是大小寫、重點在順序。
function mountArrange({ promptText, zh, introHTML = '', cards, targetTokens, caseInsensitive = false, endMark = '', onCheck }) {
  shell(promptText, `
    ${introHTML}
    <div class="buildzh">${zh}</div>
    <div class="sentence-slots" id="slots"></div>
    <div class="chunks sentence-bank" id="bank"></div>
    <div class="buildactions" id="bactions" style="grid-template-columns:1fr"><button class="btn act" id="check">確定</button></div>`);
  $('body').classList.add('build-answer');
  const _intro = $('body').querySelector('.transform-intro, .respond-scenario');   // 轉換題原句卡 / 回應題情境卡:從作答帶搬到題目帶(stage)→ 作答帶只剩「格子+字塊」,不用上下捲(治情境卡把字卡擠到要往下拉)
  if (_intro) document.querySelector('.lesson-stage').appendChild(_intro);
  let slots = Array(cards.length).fill(null);
  const _norm = t => caseInsensitive ? (t || '').toLowerCase() : t;
  const _target = targetTokens.map(_norm).join(' ');
  let bank = shuffle(cards);
  for (let _t = 0; _t < 12 && cards.length > 1 && bank.map(c => _norm(c.text)).join(' ') === _target; _t++) bank = shuffle(cards);   // 洗出來剛好是正解順序 → 重洗,別直接送正解給人排
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
    el.onclick = () => { if (from === 'bank') { placeFirst(card.id); speakWordText(card.text); } else removeFromSlot(slotIndex); render(); };   // 放進句子時念那個字(套 SPEAK_AS:a→uh 不念字母 A)
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
    if (endMark) {                                                         // 句尾標點放進格子列尾端:問句「?」放大變亮 → 一眼看出這題要排問句(治「沒看清是不是疑問句」)
      const em = document.createElement('div');
      em.className = 'sentence-endmark' + (endMark === '?' ? ' q' : '');
      em.textContent = endMark;
      em.setAttribute('aria-hidden', 'true');
      slotBox.appendChild(em);
    }
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
  const cands = sentenceCandidates(pats, sourceWords, w)
    .filter(s => s && s.text.toLowerCase().split(/[^a-z]+/).filter(Boolean).includes(w.en.toLowerCase()));
  const picked = pickFresh(shuffle(cands));
  if (picked && cands.length === 1 && picked.text === recentSentences[0]) return null;   // 只剩上一題同一句時,別硬為了含這個字重複;交給一般句子池換題
  return picked;   // 避開最近出過的句子
}

// Q1 整段英文 → 選意思(理解/辨識;不逼拼字、兩軌通用)。給一句「學過字組成」的英文,選它的中文意思。
//   答對 creditSentence(推 SRS + 幫組成字加分,跟排詞造句一致)。誘答:① 逐字直翻(把每個字的中文串起來 →
//   治「字都認得、合起來卻讀錯」;跟正解相同就不用)② 其他句子的中文。是排句家族之外的辨識口味 → 也幫破前期單調。
function sentenceMeaningSentence(w) {
  const source = currentSentenceSourceWords();
  return sentenceWithWord(w, source) || pickBuildSentence(source);
}
function canSentenceMeaning(w) {
  return !!sentenceMeaningSentence(w);
}
function literalConcatZh(sentence) {
  const toks = sentence.text.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
  // 逐字直翻誘答:跳過「沒有乾淨中文意思」的文法助詞(zh 是括號註解,如 do 的「(問句/否定)」)→ 不然串出「我(發問用)不喝水」這種亂碼選項
  return toks.map(t => { const m = BANK.find(x => x.en.toLowerCase() === t.toLowerCase()); return m && !/^[（(]/.test(m.zh) ? m.zh : ''; }).join('');
}
function sentenceMeaningKey(text) {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\s,，.。!！?？、;；:："'“”‘’`~～()（）[\]【】{}《》<>-]/g, '')
    .toLowerCase();
}
function askSentenceMeaning(w) {
  const sentence = sentenceMeaningSentence(w);
  if (!sentence) return askReadPick(w);
  rememberSentence(sentence.text);
  const correct = sentence.zh;
  const distractors = [];
  const seen = new Set([sentenceMeaningKey(correct)]);
  const pushDistractor = zh => {
    const key = sentenceMeaningKey(zh);
    if (!key || seen.has(key)) return;
    seen.add(key);
    distractors.push(zh);
  };
  const lit = literalConcatZh(sentence);
  pushDistractor(lit);                                                       // 逐字直翻(最毒誘答;跟正解相同就不放)
  sentenceCandidates(buildSentencePatterns(), currentSentenceSourceWords())
    .map(s => s.zh)
    .forEach(zh => { if (distractors.length < 3) pushDistractor(zh); });
  if (!distractors.length) return askReadPick(w);                           // 湊不到誘答 → 退回看中選英
  const opts = shuffle([correct, ...distractors.slice(0, 3)]);
  // 句子放「題目帶」(stage),作答帶只留選項 → 不會把選項擠到被底部操作列切掉
  shell(`這句話在說什麼?<div class="sentence-cloze-line" style="color:#9bd2ff;font-weight:600;margin-top:12px">${sentence.text}</div><div style="margin-top:8px"><button class="replay" id="hear">${ICON.play} 聽</button></div>`, `
    <div class="opts" id="opts"></div>`);
  $('body').classList.add('choice-answer');
  speakSentence(sentence);
  $('hear').onclick = () => speakSentence(sentence);
  const box = $('opts'); let sel = null;
  opts.forEach(zh => {
    const el = document.createElement('div'); el.className = 'opt'; el.textContent = zh;
    el.onclick = () => {
      if (box.classList.contains('locked')) return;
      [...box.children].forEach(c => c.classList.remove('sel'));
      el.classList.add('sel'); sel = zh;
      const sb = $('submit'); if (sb) sb.disabled = false;
    };
    box.appendChild(el);
  });
  $('body').insertAdjacentHTML('beforeend', '<button class="btn act" id="submit" disabled>確認</button>');
  $('submit').onclick = () => {
    if (sel == null || box.classList.contains('locked')) return;
    box.classList.add('locked');
    const right = sel === correct;
    [...box.children].forEach(c => {
      if (c.textContent === correct) c.classList.add('right');
      else if (c.textContent === sel) c.classList.add('wrong');
    });
    clearBottomActions();
    const why = $('why'); why.className = right ? 'why' : 'why bad';
    why.innerHTML = `<div class="result-head">
      <div class="result-mark">${right ? '✓' : '!'}</div>
      <div class="result-main">
        <div class="result-word">${sentence.text}</div>
        <div class="result-copy">${sentence.zh}</div>
      </div>
      <button class="replay" id="sayit">${ICON.play}再聽</button>
    </div>
    <button class="btn act" id="cont">繼續 →</button>`;
    why.hidden = false;
    $('sayit').onclick = () => speakSentence(sentence);
    if (right) { sfx.correct(); creditSentence(sentence); onCorrect(w); updateBar(); $('cont').onclick = nextQuestion; }
    else { sfx.wrong(); speakSentence(sentence); $('cont').onclick = () => { onWrong(w); nextQuestion(); }; }
  };
}

function askBuildSentence(sourceWords = sentenceSourceWords(), done = showDone, forced = null, onMiss = null) {
  const sentence = forced || pickBuildSentence(sourceWords);
  if (!sentence) {
    shell('組句小練習', `<div class="sub2">這批字還組不出自然句,先繼續練單字。</div><button class="btn act" id="cont">繼續 →</button>`);
    $('cont').onclick = done;
    return;
  }
  rememberSentence(sentence.text);   // 記下這句 → 接下來幾題避開重複
  const target = sentence.text.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
  const endMark = (sentence.text.match(/[.?!]$/) || [''])[0];   // 句尾標點跟著句子:陳述句「.」問句「?」→ 排句時就看得出這句是問是述
  const arrange = () => mountArrange({
    promptText: '看中文,排出英文',
    zh: sentence.zh,
    cards: target.map((text, i) => ({ id: `c${i}`, text })),
    targetTokens: target,
    endMark,
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
          <button class="replay" id="sayit">${ICON.play}再聽整句</button>
          <button class="replay" id="sayslow">慢速</button>
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
          <button class="replay" id="sayit">${ICON.play}聽正解</button>
          <button class="replay" id="sayslow">慢速</button>
        </div>
        <button class="btn act" id="${onMiss ? 'cont' : 'retry'}">${onMiss ? '繼續 →' : '重排一次'}</button>`;
        why.hidden = false;
        $('sayit').onclick = () => speakSentence(sentence);
        $('sayslow').onclick = () => speakSentence(sentence, 0.5);
        if (onMiss) $('cont').onclick = onMiss;
        else $('retry').onclick = retry;
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

// ★ 複合句「你呢?」回應題:朋友先說一句複合自述(I am happy. I drink coffee.)→ 你排出你自己的版本。
//   把 build 的排句流程 + creditSentence 直接重用(走 mountArrange = 真的關卡 UI),差別在複合板模 + 情境 intro。
function askRespond(sourceWords = sentenceSourceWords(), done = showDone, onMiss = null) {
  const mine = pickRespondSentence(sourceWords);
  if (!mine) {
    shell('你呢?', `<div class="sub2">這批字還組不出回應句,先繼續練。</div><button class="btn act" id="cont">繼續 →</button>`);
    $('cont').onclick = done;
    return;
  }
  const friend = pickRespondSentence(sourceWords, mine.text) || mine;
  rememberSentence(mine.text);
  const target = mine.text.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
  const intro = `<div class="respond-scenario" style="background:#14202e;border:1px solid #26384a;border-radius:12px;padding:8px 16px;margin:6px auto 0;max-width:680px;text-align:center">
    <div style="font-size:17px;font-weight:700">${friend.text}</div>
    <div style="font-size:13px;color:#9fb4c8;margin-top:1px">${friend.zh}</div>
    <div style="margin-top:4px;font-size:15px">👉 <b>And you? 你呢?</b></div>
  </div>`;
  const arrange = () => mountArrange({
    promptText: '你呢?看中文,排出你的回答',
    zh: mine.zh,
    introHTML: intro,
    cards: target.map((text, i) => ({ id: `r${i}`, text })),
    targetTokens: target,
    onCheck: (right, { retry }) => {
      const why = $('why');
      speakSentence(mine);
      if (right) {
        sfx.correct(); bumpPat(mine.patternId, 25); creditSentence(mine);
        why.className = 'why';
        why.innerHTML = `<div class="result-head"><div class="result-mark">✓</div><div class="result-main"><div class="result-word">${mine.text}</div><div class="result-copy">${mine.zh}</div></div><button class="replay" id="sayit">${ICON.play}再聽整句</button></div><button class="btn act" id="cont">繼續 →</button>`;
        why.hidden = false;
        $('sayit').onclick = () => speakSentence(mine);
        $('cont').onclick = done;
      } else {
        sfx.wrong(); bumpPat(mine.patternId, -20);
        why.className = 'why bad';
        why.innerHTML = `<div class="result-head"><div class="result-mark">!</div><div class="result-main"><div class="result-word">正解: ${mine.text}</div><div class="result-copy">${mine.zh}</div></div><button class="replay" id="sayit">${ICON.play}聽正解</button></div><button class="btn act" id="${onMiss ? 'cont' : 'retry'}">${onMiss ? '繼續 →' : '重排一次'}</button>`;
        why.hidden = false;
        $('sayit').onclick = () => speakSentence(mine);
        if (onMiss) $('cont').onclick = onMiss; else $('retry').onclick = retry;
      }
    }
  });
  if (patMastery(mine.patternId) === 0) {
    bumpPat(mine.patternId, 10);
    teachPattern(mine, arrange, () => { bumpPat(mine.patternId, LEARNED); done(); });
  } else {
    arrange();
  }
}

// 整句跟讀:Web Speech 對整句仍可能飄,所以這題是低壓練習。兩次抓不到就自評通過,不作為硬考核。
function askSentenceSpeak(sourceWords = sentenceSourceWords(), done = showDone, forced = null) {
  const sentence = forced || pickBuildSentence(sourceWords);
  if (!sentence) {
    shell('整句跟讀', `<div class="sub2">這批字還組不出自然句,先繼續練單字。</div><button class="btn act" id="cont">繼續 →</button>`);
    $('cont').onclick = done;
    return;
  }
  rememberSentence(sentence.text);
  const say = (rate = 0.9) => speakSentence(sentence, rate);
  shell('聽整句,跟著念一次', `
    <div class="sentence-speak-card">
      <div class="sentence-speak-line" id="bigen">${hintedEnglish(sentence.text)}</div>
      <div class="sentence-speak-zh">${sentence.zh}</div>
    </div>
    <div class="speakrow">
      <button class="replay" id="demo">${ICON.play}聽整句</button>
      <button class="replay" id="slow">慢速</button>
    </div>
    <button class="btn act" id="mic">🎤 換我念</button>
    <div class="skipline"><button class="btn sideact" id="skipspeak">跳過說題</button></div>`);
  setTimeout(() => say(), 120);
  $('demo').onclick = () => say();
  $('slow').onclick = () => say(0.55);
  $('skipspeak').onclick = () => {
    if ($('skipchoices')) return;
    $('skipspeak').style.display = 'none';
    $('prompt').textContent = '要怎麼處理這題整句跟讀?';
    $('body').insertAdjacentHTML('beforeend',
      `<div class="skipchoices" id="skipchoices">
         <button class="btn" id="skip1">只跳這題</button>
         <button class="btn danger" id="skipall">以後都跳過說題</button>
       </div>`);
    $('skip1').onclick = () => done();
    $('skipall').onclick = () => { meta.skills = meta.skills || {}; meta.skills.speak = false; saveMeta(); done(); };
  };
  attachSentenceSpeechMic(sentence, done, () => askSentenceSpeak(sourceWords, done, sentence));
}

function attachSentenceSpeechMic(sentence, done, retry) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const finishOk = () => sentenceSpeakResult(sentence, true, done, retry);
  if (!SR) {
    $('prompt').textContent = '這環境沒語音,聽一次整句就過';
    $('mic').textContent = '🔊 聽整句 → 過';
    $('mic').onclick = finishOk;
    return;
  }
  let tries = 0;
  $('mic').onclick = async () => {
    const mic = $('mic');
    if (!mic || mic.disabled) return;
    mic.disabled = true;
    $('prompt').textContent = '正在確認麥克風權限…';
    const canUseMic = await ensureMicAccess();
    if (!canUseMic) {
      $('prompt').textContent = micPermissionHint();
      mic.disabled = false;
      return;
    }
    speechSynthesis.cancel();
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3;
    $('prompt').textContent = '🎤 在聽你念整句…';
    let settled = false, gotResult = false, timeoutId = null, lastHeard = '';
    const finishAttempt = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (ok) finishOk();
      else {
        tries++;
        const be = $('bigen'); if (be) { be.classList.remove('ok'); be.classList.add('bad'); }
        if (tries < 2) {
          const heard = lastHeard ? ` 它聽成: ${lastHeard}` : '';
          $('prompt').textContent = `沒抓到整句,再念一次${heard}`;
          if ($('mic')) $('mic').disabled = false;
        } else {
          offerSentenceSelfAssess(sentence, done, retry, lastHeard);
        }
      }
    };
    const failAttempt = () => {
      try { r.abort(); } catch {}
      finishAttempt(false);
    };
    r.onresult = e => {
      gotResult = true;
      lastHeard = normalizeSpeechText([...e.results].map(result => result[0]?.transcript || '').join(' '));
      finishAttempt(sentenceSpeechMatches(sentence.text, lastHeard));
    };
    r.onnomatch = failAttempt;
    r.onerror = failAttempt;
    r.onend = () => { if (!settled && !gotResult) finishAttempt(false); };
    timeoutId = setTimeout(failAttempt, 7500);
    try { r.start(); } catch { failAttempt(); }
  };
}

function sentenceSpeakResult(sentence, ok, done, retry) {
  ok ? sfx.correct() : sfx.wrong();
  if (ok) { bumpPat(sentence.patternId, 10); creditSentence(sentence); }
  clearBottomActions();
  ['demo', 'slow', 'skipspeak'].forEach(id => { const el = $(id); if (el) (el.closest('.speakrow') || el.closest('.skipline') || el).style.display = 'none'; });
  { const sc = $('skipchoices'); if (sc) sc.style.display = 'none'; }
  if ($('mic')) $('mic').style.display = 'none';
  const be = $('bigen'); if (be) { be.classList.remove('bad'); be.classList.add(ok ? 'ok' : 'bad'); }
  speakSentence(sentence);
  $('prompt').textContent = ok ? '✅ 整句跟讀完成!再聽一次' : '先聽一次正確句子,再自己確認';
  $('body').insertAdjacentHTML('beforeend',
    `<div class="speakrow"><button class="replay" id="again">🔊 再聽整句</button></div>
     <div class="buildactions">
       <button class="btn act" id="cont">繼續 →</button>
       <button class="btn" id="retry" style="background:#1d2c3a;border-color:#2c3e52">🎤 再試一次</button>
     </div>`);
  $('again').onclick = () => speakSentence(sentence);
  $('cont').onclick = done;
  $('retry').onclick = retry;
}

function offerSentenceSelfAssess(sentence, done, retry, lastHeard = '') {
  clearBottomActions();
  if ($('mic')) $('mic').style.display = 'none';
  ['demo', 'slow', 'skipspeak'].forEach(id => { const el = $(id); if (el) (el.closest('.speakrow') || el.closest('.skipline') || el).style.display = 'none'; });
  { const sc = $('skipchoices'); if (sc) sc.style.display = 'none'; }
  speakSentence(sentence);
  const heard = lastHeard ? `<div class="sentence-heard">瀏覽器聽成: ${lastHeard}</div>` : '';
  $('prompt').textContent = '辨識整句也可能抓不準 —— 你自己聽,念順了嗎?';
  $('body').insertAdjacentHTML('beforeend',
    `<div class="speakrow"><button class="replay" id="again">🔊 再聽正解</button></div>
     ${heard}
     <div class="buildactions">
       <button class="btn" id="selfok" style="background:#0e2a1f;border-color:#1f5c3f">✅ 念順了,過</button>
       <button class="btn" id="selfretry" style="background:#1d2c3a;border-color:#2c3e52">🎤 再試一次</button>
     </div>`);
  $('again').onclick = () => speakSentence(sentence);
  $('selfok').onclick = () => { sfx.correct(); bumpPat(sentence.patternId, 8); creditSentence(sentence); done(); };
  $('selfretry').onclick = retry;
}

// ★ 轉換題(招牌:this is ↔ is this):先給排好的直述句 → 把「同一批字」重排成問句,戳「換順序就變問句」的 aha。
// 只用 be 動詞 This is 家族(純重排成立;I see a cat 變問句要 do,不能純重排 → 不放進來)。
let TRANSFORM_PATTERN_IDS = ["pat_this_is_a_noun", "pat_this_is_my_noun", "pat_this_is_adj", "pat_i_am_adj", "pat_you_are_adj", "pat_it_is_a_noun"];   // 2026-07-08 +You are→Are you / It is→Is it(都是純 be 動詞調頭)
function pickTransformSentence(sourceWords = sentenceSourceWords()) {
  const pats = PATTERNS.filter(p => TRANSFORM_PATTERN_IDS.includes(p.id) && p.q && patMastery(p.id) > 0);   // 直述句練過(patMastery>0)才轉換 → 有「我會這句、現在改問句」的對照
  return pickSentenceByPattern(pats, sourceWords, s => s && s.question);   // 依句型平均取(不被 This is a 的多名詞稀釋掉 I am happy);避開最近出過的句子
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
    zh: `<span class="q-badge">❓ 問句</span>${s.questionZh}`,
    introHTML: `<div class="transform-intro"><div class="transform-stmt">${hintedEnglish(s.text)}</div><div class="transform-stmt-zh">${s.zh}</div></div>`,   // 「↓改成問句」箭頭行拿掉:跟標題重複,白佔一行(答題帶還有 ❓問句 徽章當第三保險)
    cards: qTok.map((text, i) => ({ id: `c${i}`, text })),   // 用問句本身的大小寫當字塊(Is/this…)→ 排對就讀成「Is this a cat」,不會出現「is This a cat」那種看起來像排錯的怪樣
    targetTokens: qTok,
    caseInsensitive: true,
    endMark: '?',
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
        <button class="btn act" id="cont">繼續 →</button>`;
        why.hidden = false;
        $('sayit').onclick = sayQ;
        $('cont').onclick = () => { onWrong(w); nextQuestion(); };
      }
    }
  });
}

function recordSentenceClozeResult(w, q, right) {
  if (!right || !w || !q) return;
  const c = rec(w);
  c.clozeOk = (c.clozeOk || 0) + 1;
  c.clozeSlots = c.clozeSlots || {};
  (q.blankKeys || []).forEach(key => { c.clozeSlots[key] = true; });
  save();
}

function sentenceClozeForWord(w) {
  if (!w || w.pos === 'function') return null;
  const pats = PATTERNS.filter(p => patternRequirementsMet(p) &&
    (asList(p.requires).includes(w.id) || Object.values(p.slots).some(slot => wordMatchesSlot(w, slot)))
  ).sort((a, b) => patMastery(b.id) - patMastery(a.id));
  if (!pats.length) return null;
  const pat = shuffle(pats)[0];
  const slotName = Object.keys(pat.slots).find(n => wordMatchesSlot(w, pat.slots[n]));
  const built = buildSentenceFromPattern(pat, sentenceSourceWords(), slotName ? w : null);
  if (!built) return null;
  const full = built.text;
  const tokens = full.replace(/[.?!,]/g, '').split(/\s+/).filter(Boolean);
  const targetIdx = tokens.findIndex(t => t.toLowerCase() === w.en.toLowerCase());
  if (targetIdx < 0) return null;
  const requires = new Set(asList(pat.requires).map(id => (wordById(id) || {}).en).filter(Boolean).map(en => en.toLowerCase()));
  const support = tokens.map((t, i) => ({ t, i })).filter(x => x.i !== targetIdx && requires.has(x.t.toLowerCase()));
  const blankIdxs = [targetIdx, ...(support.length ? [shuffle(support)[0].i] : [])].sort((a, b) => a - b);
  const blankKeys = blankIdxs.map(i => i === targetIdx ? `${pat.id}:${w.id}` : `${pat.id}:${tokens[i].toLowerCase()}`);
  const shown = tokens.map((t, i) => blankIdxs.includes(i)
    ? `<input class="clozeinp" data-i="${i}" size="${Math.max(2, t.length)}" style="--chars:${Math.max(3, t.length)}" autocomplete="off" autocapitalize="off" placeholder="＿">`
    : `<span>${t}</span>`).join(' ') + (/[.?!]$/.test(full) ? full.match(/[.?!]$/)[0] : '');
  return { patternId: pat.id, answers: blankIdxs.map(i => tokens[i]), blankKeys, zh: built.zh, shown, full };
}

function canSentenceCloze(w) {
  return !!sentenceClozeForWord(w);
}

function askSentenceCloze(w) {
  const q = sentenceClozeForWord(w);
  if (!q) return askType(w);
  shell('看句子,補完整英文', `
    <div class="buildzh">${q.zh}</div>
    <div class="speakrow"><button class="replay" id="hearfull">${ICON.play}聽整句</button><button class="replay" id="slowfull">慢聽</button></div>
    <div class="sentence-cloze-line">${q.shown}</div>
    <button class="btn act" id="submit">送出</button>
    <div class="letters" id="letters"></div>`);
  speakSentence({ text: q.full }, 0.9);
  $('hearfull').onclick = () => speakSentence({ text: q.full }, 0.9);
  $('slowfull').onclick = () => speakSentence({ text: q.full }, 0.65);
  const inputs = [...document.querySelectorAll('.clozeinp')];
  if (inputs[0]) inputs[0].focus();
  const go = () => {
    if (!inputs.length || inputs[0].disabled) return;
    const slot = inputs.map((inp, i) => spellCheck(inp.value, q.answers[i]));   // 每格容錯:手滑一兩字母算對,但錯成別的真字判錯
    const right = slot.every(r => r !== false);
    inputs.forEach((inp, i) => {
      inp.disabled = true;
      inp.classList.add(slot[i] !== false ? 'right' : 'wrong');
    });
    if (!right) $('letters').textContent = `正解: ${q.full}`;
    else if (slot.some(r => r === 'typo')) $('letters').textContent = `差一點!正解: ${q.full}`;
    if (!right && typeof rememberAnnotationError === 'function') {
      const targetInput = inputs[q.answers.findIndex(ans => ans.toLowerCase() === w.en.toLowerCase())];
      rememberAnnotationError(w, targetInput ? targetInput.value.trim() : '');
    } else if (typeof clearAnnotationErrorHTML === 'function') clearAnnotationErrorHTML();
    $('submit').disabled = true;
    recordSentenceClozeResult(w, q, right);
    // ★ 句子克漏字「精準打出目標整字」= 真的產出 → 也推 wrote/wrote2(治「打過很多次還說不會寫」)。
    //   條件:整題對 + 目標字那格是精準(typo 容錯過的不算)+ 不在補考(剛看過答案不算)。
    if (right && !inReview && typeof creditWrite === 'function') {
      const ti = q.answers.findIndex(ans => ans.toLowerCase() === w.en.toLowerCase());
      if (ti >= 0 && slot[ti] === true) creditWrite(w);
    }
    bumpPat(q.patternId, right ? 20 : -15);
    finish(right, w);
  };
  $('submit').onclick = go;
  inputs.forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter') go(); });
}
