/* 09-boss-render.js — 王戰渲染層(由 09-boss.js 拆出)：renderBossQ + setupBoss* + bossEnd。邏輯/出題在 09-boss.js。 */
// 渲染一道王戰題。mode: zh 看中文 / listen 聽英文拼 / listen_choice 聽英文選 / pic 看圖 / choice 中文四選一 / grid 九宮格 / category 分類多選 / sentence_cloze 句子克漏字。答完 / 逾時 → cb(ok, input)
function renderBossQ(q, combo, mode, cb) {
  const panic = boss.hp <= boss.maxHp * 0.2;
  const multi = q.ids.length > 1;
  const w = wordById(q.ids[0]);
  let limit = (mode === 'choice' || mode === 'listen_choice') ? 8 : Math.round(q.letters * 1.5 + 4);   // 拼字看字數(放寬);選擇題固定
  if (mode === 'grid') limit = Math.max(9, (q.grid && q.grid.target ? q.grid.target.length : 1) * 3 + 5);
  if (mode === 'category') limit = Math.max(12, (q.categoryPick && q.categoryPick.options ? q.categoryPick.options.length : 4) * 2 + 5);
  if (mode === 'sentence_cloze') limit = Math.max(10, (q.clozeAnswer || '').length * 2 + 5);
  if (mode === 'arrange') limit = Math.max(14, q.en.split(/\s+/).length * 5 + 5);
  if (combo) limit = Math.round(limit * 1.4);                           // 臨死組合更寬鬆(詞多要想)
  const hearts = '❤️'.repeat(boss.you) + '🖤'.repeat(5 - boss.you);
  let prompt, clue;
  if (mode === 'listen')      { prompt = '聽,拼出來!';   clue = `<div style="text-align:center;margin:8px 0"><button class="replay" id="bhear">${ICON.play}再聽</button></div>`; }
  else if (mode === 'listen_choice') { prompt = '聽音,選出英文!'; clue = `<div style="text-align:center;margin:8px 0"><button class="replay" id="bhear">${ICON.play}再聽</button></div>`; }
  else if (mode === 'pic')    { prompt = '看圖,拼出來!';     clue = `<div style="text-align:center;margin:6px 0">${picHTML(w, 110)}</div>`; }
  else if (mode === 'choice') { prompt = '限時選出正確的!';  clue = `<div class="bigzh" style="font-size:26px">${q.zh}</div>`; }
  else if (mode === 'arrange') { prompt = '看中文,排出英文!'; clue = `<div class="bigzh" style="font-size:24px">${q.zh}</div>`; }
  else if (mode === 'grid')   { prompt = q.grid.prompt || '九宮格突襲!'; clue = q.grid.clueHtml || `<div class="bigzh">${q.zh}</div>`; }
  else if (mode === 'category') { prompt = '分類突襲!'; clue = `<div class="boss-category-clue"><div class="bigzh">${q.categoryPick.category.prompt}</div><div class="sub2">選出所有符合分類的英文</div></div>`; }
  else if (mode === 'sentence_cloze') { prompt = '句子克漏字!'; clue = q.clozeHtml; }
  else                        { prompt = q.isSentence ? '限時默寫整句!(用空格分隔)' : multi ? '限時拼出來!(多字用空格)' : '限時拼出來!'; clue = `<div class="bigzh" style="font-size:${q.isSentence ? 22 : 26}px">${q.zh}</div>`; }
  const answer = (mode === 'choice' || mode === 'listen_choice')
    ? `<div class="opts boss-options" id="bopts"></div>`
    : mode === 'arrange'
    ? `<div class="sentence-slots boss-sentence-slots" id="bslots"></div><div class="chunks sentence-bank boss-sentence-bank" id="bbank"></div><button class="btn" id="bsubmit">攻擊!</button>`
    : mode === 'grid'
    ? `<div class="boss-grid-progress" id="bgridseq"></div><div class="boss-grid" id="bgrid"></div>`
    : mode === 'category'
    ? `<div class="opts boss-options boss-category-options" id="bcatopts"></div><button class="btn" id="bsubmit" disabled>攻擊!</button>`
    : mode === 'sentence_cloze'
    ? `<input class="inp" id="binp" autocomplete="off" autocapitalize="off" placeholder="補上空格…"><button class="btn" id="bsubmit">攻擊!</button>`
    : `<input class="inp" id="binp" autocomplete="off" autocapitalize="off" placeholder="${limit} 秒內打出英文${multi ? '(用空格分隔)' : ''}…"><button class="btn" id="bsubmit">攻擊!</button>`;
  screen.classList.add('boss-screen');
  screen.classList.toggle('boss-grid-mode', mode === 'grid');
  screen.classList.toggle('boss-category-mode', mode === 'category');
  screen.innerHTML = `
    <button class="lesson-music-toggle boss-music-toggle" id="bossbgmtoggle" aria-label="背景音樂開關" title="背景音樂">${bgm.isOn() ? ICON.play : ICON.mute}</button>
    <main class="boss-layout">
      <section class="boss-status">
        <div style="text-align:center;font-size:46px">${panic ? '👹' : '👾'}</div>
        <div class="bar" style="height:12px;margin:8px auto"><i style="width:${Math.round(boss.hp / boss.maxHp * 100)}%;background:${panic ? '#e35b6a' : '#f0b86e'}"></i></div>
        <div style="text-align:center;font-size:13px;color:#9fb4c8">挑戰 ${boss.hp}/${boss.maxHp}　　你 ${hearts}</div>
        ${combo ? `<div style="text-align:center;color:#e35b6a;font-weight:700;margin-top:6px">⚠ 臨死反撲!連段 ${combo.idx + 1}/${combo.total} 🔥　全對才打出最後一擊</div>` : ''}
      </section>
      <section class="boss-arena">
        <div class="prompt" id="prompt">${prompt}</div>
        <div class="boss-clue">${clue}</div>
        <div class="bar boss-timer" style="height:6px"><i id="timebar" style="width:100%;background:#5aa9ff"></i></div>
      </section>
      <section class="boss-answer">${answer}</section>
    </main>`;
  bindBgmToggleButton('bossbgmtoggle', 'boss');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const tb = $('timebar');
    if (tb) { tb.style.transition = `width ${limit}s linear`; tb.style.width = '0%'; }
  }));
  let done = false;
  const timer = setTimeout(() => finish(false, ''), limit * 1000);
  function finish(ok, input) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    const tb = $('timebar');
    if (tb) {
      const current = getComputedStyle(tb).width;
      tb.style.transition = 'none';
      tb.style.width = current;
    }
    cb(ok, input);
  }
  if (mode === 'listen' || mode === 'listen_choice') { speak(q.en); $('bhear').onclick = () => speak(q.en); }
  if (mode === 'choice' || mode === 'listen_choice') {
    const box = $('bopts');
    fourOptions(w).forEach(o => {
      const el = document.createElement('div'); el.className = 'opt'; el.textContent = o.en;
      el.onclick = () => finish(o.en === q.en, o.en);
      box.appendChild(el);
    });
  } else if (mode === 'arrange') {
    setupBossArrange(q, finish);
  } else if (mode === 'grid') {
    setupBossGrid(q, finish);
  } else if (mode === 'category') {
    setupBossCategory(q, finish);
  } else if (mode === 'sentence_cloze') {
    $('binp').focus();
    const go = () => finish(isCloseEnough($('binp').value, q.clozeAnswer), $('binp').value);
    $('bsubmit').onclick = go;
    $('binp').onkeydown = e => { if (e.key === 'Enter') go(); };
  } else {
    $('binp').focus();
    const go = () => {
      const typed = $('binp').value.trim().toLowerCase().split(/\s+/);
      const exp = q.en.toLowerCase().split(/\s+/);
      const ok = typed.length === exp.length && exp.every((t, i) => isCloseEnough(typed[i], t));   // 逐詞容錯:手滑一兩字母不扣血
      finish(ok, $('binp').value);
    };
    $('bsubmit').onclick = go;
    $('binp').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
}
function setupBossCategory(q, finish) {
  const pick = q.categoryPick || {}, box = $('bcatopts'), submit = $('bsubmit');
  const selected = new Set(), correct = new Set(pick.correctIds || []);
  let locked = false;
  const update = () => { if (submit) submit.disabled = selected.size === 0; };
  const fail = (el, id) => {
    if (locked) return;
    locked = true;
    if (el) el.classList.add('wrong');
    box.classList.add('locked');
    setTimeout(() => finish(false, { selectedIds:[...selected, id].filter(Boolean) }), 240);
  };
  (pick.options || []).forEach(o => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'opt';
    el.textContent = o.en;
    el.onclick = () => {
      if (locked) return;
      if (!correct.has(o.id)) return fail(el, o.id);   // 挑戰關:踩到分類陷阱就扣血
      if (selected.has(o.id)) { selected.delete(o.id); el.classList.remove('sel'); }
      else { selected.add(o.id); el.classList.add('sel'); }
      update();
    };
    box.appendChild(el);
  });
  if (submit) submit.onclick = () => {
    if (locked) return;
    locked = true;
    box.classList.add('locked');
    const ok = selected.size === correct.size && [...selected].every(id => correct.has(id));
    [...box.children].forEach((el, idx) => {
      const id = (pick.options[idx] || {}).id;
      if (correct.has(id)) el.classList.add('right');
      else if (selected.has(id)) el.classList.add('wrong');
    });
    setTimeout(() => finish(ok, { selectedIds:[...selected] }), ok ? 180 : 300);
  };
  update();
}
function setupBossGrid(q, finish) {
  const grid = q.grid || {}, target = (grid.target || []).map(bossGridNorm);
  const box = $('bgrid'), seq = $('bgridseq');
  let step = 0, locked = false;
  const updateSeq = () => {
    seq.innerHTML = target.map((t, i) => `<span class="${i < step ? 'done' : i === step ? 'now' : ''}">${i < step ? '✓' : i + 1}</span>`).join('');
  };
  const fail = (el, value) => {
    if (locked) return;
    locked = true;
    el.classList.add('wrong');
    setTimeout(() => finish(false, value || ''), 260);
  };
  const pass = el => {
    el.classList.add('hit');
    el.disabled = true;
    step++;
    updateSeq();
    if (step >= target.length) {
      locked = true;
      setTimeout(() => finish(true, target.join(' ')), 220);
    }
  };
  updateSeq();
  shuffle(grid.cells || []).slice(0, 9).forEach(cell => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `boss-grid-cell ${cell.kind === 'visual' ? 'visual' : ''}`;
    if (cell.kind === 'visual') el.innerHTML = cell.html || '';
    else el.textContent = cell.text || '';
    el.onclick = () => {
      if (locked) return;
      const value = bossGridNorm(cell.value || cell.text);
      if (value === target[step]) pass(el);
      else fail(el, value);
    };
    box.appendChild(el);
  });
}
function setupBossArrange(q, finish) {
  const target = q.en.split(/\s+/).filter(Boolean);
  const cards = target.map((text, i) => ({ id: `bc${i}`, text }));
  let slots = Array(cards.length).fill(null);
  let bank = shuffle(cards);
  let draggingId = null;
  const cardById = id => cards.find(c => c.id === id);
  const slotIndexOf = id => slots.findIndex(c => c && c.id === id);
  const removeFromBank = id => {
    const idx = bank.findIndex(c => c.id === id);
    return idx >= 0 ? bank.splice(idx, 1)[0] : null;
  };
  const takeCard = id => {
    const fromBank = removeFromBank(id);
    if (fromBank) return { card: fromBank, fromSlot: -1 };
    const fromSlot = slotIndexOf(id);
    if (fromSlot < 0) return { card: null, fromSlot: -1 };
    const card = slots[fromSlot];
    slots[fromSlot] = null;
    return { card, fromSlot };
  };
  const moveToSlot = (id, idx) => {
    const { card, fromSlot } = takeCard(id);
    if (!card) return;
    const replaced = slots[idx];
    if (replaced && fromSlot >= 0) slots[fromSlot] = replaced;
    else if (replaced) bank.push(replaced);
    slots[idx] = card;
  };
  const returnToBank = id => {
    const { card, fromSlot } = takeCard(id);
    if (!card) return;
    if (fromSlot >= 0) bank.push(card);
    else bank.push(cardById(id) || card);
  };
  const droppedId = e => e.dataTransfer.getData('text/plain') || draggingId;
  const allowDrop = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const dragStart = (e, id) => {
    draggingId = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const makeCard = (card, from, slotIndex = -1) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'opt chunk sentence-card';
    el.textContent = card.text;
    el.draggable = true;
    el.addEventListener('dragstart', e => dragStart(e, card.id));
    el.addEventListener('dragend', () => { draggingId = null; });
    el.onclick = () => {
      if (from === 'bank') {
        const idx = slots.findIndex(c => !c);
        if (idx >= 0) moveToSlot(card.id, idx);
      } else {
        const cardInSlot = slots[slotIndex];
        if (cardInSlot) { slots[slotIndex] = null; bank.push(cardInSlot); }
      }
      render();
    };
    return el;
  };
  const render = () => {
    const slotBox = $('bslots'), bankBox = $('bbank'), submit = $('bsubmit');
    slotBox.innerHTML = '';
    bankBox.innerHTML = '';
    slots.forEach((card, idx) => {
      const slot = document.createElement('div');
      slot.className = card ? 'sentence-slot filled' : 'sentence-slot';
      slot.addEventListener('dragover', allowDrop);
      slot.addEventListener('drop', e => {
        e.preventDefault();
        moveToSlot(droppedId(e), idx);
        draggingId = null;
        render();
      });
      if (card) slot.appendChild(makeCard(card, 'slot', idx));
      slotBox.appendChild(slot);
    });
    bankBox.ondragover = allowDrop;
    bankBox.ondrop = e => {
      e.preventDefault();
      returnToBank(droppedId(e));
      draggingId = null;
      render();
    };
    bank.forEach(card => bankBox.appendChild(makeCard(card, 'bank')));
    submit.disabled = slots.some(slot => !slot);
  };
  render();
  $('bsubmit').onclick = () => {
    const answer = slots.map(card => card && card.text).join(' ');
    finish(answer === q.en, answer);
  };
}
function bossEnd(win) {
  screen.classList.remove('lesson-screen', 'start-screen', 'done-screen');
  screen.classList.add('boss-screen');
  bgm.normal();   // 戰鬥結束 → 回一般 BGM
  if (win) {
    sfx.done();
    const wonStage = (boss && boss.stage) || (meta.stage || 1);
    let reward = 0;
    if (boss.challenge) {
      meta.challengeCleared = meta.challengeCleared || {};
      if (!meta.challengeCleared[wonStage]) {
        reward = 8 + wonStage * 2;
        meta.challengeCleared[wonStage] = true;
        meta.coins = (meta.coins || 0) + reward;
        saveMeta();
      }
    } else if (!boss.replay) {
      const nextLevel = stageDeadlineLevel(wonStage) + 1;
      meta.bossReady = false; meta.stage = (meta.stage || 1) + 1; meta.stageStartLevel = nextLevel; meta.maxLevel = Math.max(meta.maxLevel, nextLevel); saveMeta();   // 打贏 → 下一階段(解鎖下一批字)+ 解鎖王關的下一關
    }
    screen.innerHTML = `<main class="boss-result"><div class="boss-result-inner">
      <div class="boss-result-icon">${boss.challenge ? '🎮' : '🏆'}</div>
      <h2 style="text-align:center;margin:0">${boss.challenge ? '挑戰完成!' : boss.replay ? '回顧完成!' : '擊敗了!'}</h2>
      <div class="sub" style="text-align:center">${
        boss.challenge
          ? (reward ? `第 ${wonStage} 階挑戰通過,獲得 ${reward} 金幣。` : `第 ${wonStage} 階挑戰已通過,這次是回顧練習。`)
          : boss.replay ? `第 ${wonStage} 支王已重新挑戰完成。` : `第 ${wonStage} 支王倒下,下一階段解鎖!`
      }</div>
      <button class="btn" id="bagain">回地圖 →</button>
    </div></main>`;
    $('bagain').onclick = showHome;
  } else {
    sfx.wrong();
    const missed = [...(boss.missed || [])].map(id => BANK.find(w => w.id === id)).filter(Boolean);   // 打輸 → 收集拼錯的字
    if (!boss.replay && !boss.challenge) { missed.forEach(w => { const c = rec(w); c.mastery = Math.max(0, (c.mastery || 0) - 30); c.due = meta.clock || 0; }); save(); }   // optional challenge 不扣進度
    screen.innerHTML = `<main class="boss-result"><div class="boss-result-inner">
      <div class="boss-result-icon">💫</div>
      <h2 style="text-align:center;margin:0">${boss.challenge ? '挑戰失敗' : '被打倒了…'}</h2>
      <div class="sub" style="text-align:center">${boss.challenge || boss.replay ? '這次只是挑戰練習,不會扣進度。' : missed.length ? `卡在這些字:<b style="color:#ffd0d6">${missed.map(w => w.en).join(', ')}</b><br>回去惡補一關,再來戰。` : '回去多練幾關、衝高熟練度再來。'}</div>
      <button class="btn" id="bremedial">${boss.challenge ? `再挑戰第 ${boss.stage} 階 →` : boss.replay ? `再挑戰第 ${boss.stage} 支王 →` : missed.length ? '⚔ 回去惡補這些字 →' : '← 回地圖練一練'}</button>
      <button class="btn" id="bhome" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button>
    </div></main>`;
    $('bremedial').onclick = boss.challenge ? () => startChallenge(boss.stage) : boss.replay ? () => startBoss(boss.stage, true) : missed.length ? () => { remedialWords = missed; inRemedial = true; homeEl.hidden = true; screen.hidden = false; startLevel(); } : showHome;
    $('bhome').onclick = showHome;
  }
}
