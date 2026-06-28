let boss = null, remedialWords = null, inRemedial = false;
const BOSS_HP_BASE = 50, BOSS_HP_PER_STAGE = 30;   // 王血:第 N 支 = BASE + (N-1)×PER_STAGE(越後面越肉)
const bossMaxHp = (stage = meta.stage || 1) => BOSS_HP_BASE + (stage - 1) * BOSS_HP_PER_STAGE;
const BOSS_DMG = { choice: 0.05, spell: 0.08, two: 0.12, sentence: 0.2, combo: 0.25 };   // 傷害=總血的這個比例(按題型、不看字數 → 不會爆,也不用 cap)
const BOSS_SENTENCE_PROB = 0.35;   // 學過句子後,王每題有此機率出「排句子」(不是整句默寫);湊不出句自動退回單字。
// 題庫=學過的「實詞」;功能詞 my/I/is… 是膠水,放句子裡練、不在王戰單獨拼(免得「我 / 我的」搞混)。沒學過時(console 測試)fallback 短實詞
const bossPool = () => { const p = BANK.filter(w => !isFresh(w) && w.pos !== 'function'); return p.length ? p : BANK.filter(w => w.pos !== 'function' && (w.syl || [w.en]).length <= 2).slice(0, 8); };
// 從題庫加權抽 n 個字:現正學習(當前批次 batchOf===stage-1)權重高、過去學成的低 → 王偏重考剛學的、舊字少量帶到
const BOSS_CUR_WEIGHT = 4;   // 當前批次相對舊字的權重(4:1 ≈ 八成現學、兩成舊)。可調。
function bossPickWords(n, sourceWords = null) {
  const pool = [...(sourceWords || bossPool())];
  const cur = ((boss && boss.stage) || meta.stage || 1) - 1;
  const wt = w => batchOf(w) === cur ? BOSS_CUR_WEIGHT : 1;
  const picks = [];
  while (picks.length < n && pool.length) {
    let r = Math.random() * pool.reduce((s, w) => s + wt(w), 0), idx = 0;
    for (let i = 0; i < pool.length; i++) { r -= wt(pool[i]); if (r <= 0) { idx = i; break; } }
    picks.push(pool.splice(idx, 1)[0]);
  }
  return picks;
}
function bossAnswerKey(q) {
  return (q && q.en || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function bossQuestion(nWords, avoidKeys = new Set()) {
  const pool = bossPool();
  const count = Math.max(1, Math.min(nWords || 1, pool.length));
  if (count === 1) {
    const source = pool.filter(w => !avoidKeys.has(w.en.toLowerCase()));
    const picks = bossPickWords(1, source.length ? source : pool);
    return { zh: picks.map(w => w.zh).join('　'), en: picks.map(w => w.en).join(' '),
             letters: picks.reduce((s, w) => s + w.en.length, 0), ids: picks.map(w => w.id) };
  }
  let q = null;
  for (let tries = 0; tries < 8; tries++) {
    const picks = bossPickWords(count, pool);
    q = { zh: picks.map(w => w.zh).join('　'), en: picks.map(w => w.en).join(' '),
          letters: picks.reduce((s, w) => s + w.en.length, 0), ids: picks.map(w => w.id) };
    if (!avoidKeys.has(bossAnswerKey(q)) || pool.length <= count) break;
  }
  return q;
}
// 句子題只抽「前面已練過的句型」,且目前用排句子,不做整句默寫。
function bossSentenceQuestion(avoidKeys = new Set()) {
  let fallback = null;
  const sourceWords = sentenceSourceWords();
  const patterns = shuffle(buildSentencePatterns().filter(p => patMastery(p.id) > 0));
  if (!patterns.length) return null;
  for (let tries = 0; tries < 8; tries++) {
    const pattern = patterns[tries % patterns.length];
    const s = pattern ? buildSentenceFromPattern(pattern, sourceWords) : null;
    if (!s) continue;
    const en = s.text.replace(/[.?!,]/g, '').trim();
    const ids = en.split(/\s+/).map(t => (BANK.find(x => x.en.toLowerCase() === t.toLowerCase()) || {}).id || null);
    const q = { zh: s.zh, en, letters: en.replace(/\s/g, '').length, ids, isSentence: true, mode: 'arrange', patternId: s.patternId };
    fallback = q;
    if (!avoidKeys.has(bossAnswerKey(q))) return q;
  }
  return fallback;
}
// 多字題答錯 → 逐格比對,只回傳「真的拼錯的那幾個字」id(不連坐整組;惡補才不會複習你會的)
function bossWrongIds(q, input) {
  if (q.isSentence) return q.ids.filter(id => { const w = wordById(id); return w && w.pos !== 'function'; });
  const typed = (input || '').trim().toLowerCase().split(/\s+/);
  const exp = q.en.toLowerCase().split(' ');
  const wrong = [];
  exp.forEach((w, i) => { if ((typed[i] || '') !== w) wrong.push(q.ids[i]); });
  return wrong;
}
function startBoss(stage = meta.stage || 1, replay = false) { screen.classList.remove('lesson-screen', 'done-screen', 'start-screen'); screen.classList.add('boss-screen'); homeEl.hidden = true; screen.hidden = false; bgm.boss(); const hp = bossMaxHp(stage); boss = { stage, replay, hp, maxHp: hp, you: 5, panicked: false, missed: new Set(), lastAnswerKey: null }; bossTurn(); }  // 王血隨階段變多(bossMaxHp);進場切戰鬥 BGM
const BOSS_PANIC_MAX_HITS = 5;
const bossPanicPower = () => Math.max(0, ((boss && boss.stage) || meta.stage || 1) - 1);
const bossPanicHits = () => Math.min(BOSS_PANIC_MAX_HITS, 2 + Math.floor(bossPanicPower() / 2));   // stage 1-2:2, 3-4:3, 5-6:4, 7+:5
const bossPanicWordCount = () => Math.min(4, 2 + Math.floor(bossPanicPower() / 3));                // stage 1-3:2~3字, 4-6:3~4字, 7+:4字
const BOSS_MODES = ['zh', 'listen', 'pic', 'choice'];   // 王戰提示花樣:看中文 / 聽英文 / 看圖 / 中文四選一。可加減。
// 單字題隨機挑一種提示:沒圖不出看圖、功能詞不出聽、誘答不夠不出四選一;多字題(含臨死組合)一律看中文拼
function pickBossMode(q) {
  if (q.ids.length > 1) return 'zh';
  const w = wordById(q.ids[0]); if (!w) return 'zh';
  let modes = BOSS_MODES.slice();
  if (!visualOf(w)) modes = modes.filter(m => m !== 'pic');
  if (w.pos === 'function') modes = modes.filter(m => m !== 'listen');
  if (fourOptions(w).length < 3) modes = modes.filter(m => m !== 'choice');
  return modes[Math.floor(Math.random() * modes.length)] || 'zh';
}
function bossTurn() {
  if (boss.hp <= 0) return bossEnd(true);
  if (boss.you <= 0) return bossEnd(false);
  if (!boss.panicked && boss.hp <= boss.maxHp * 0.2) { boss.panicked = true; bgm.panic(); }   // 跌破 20% → 同一首暴走(加速+升調),只觸發一次
  if (boss.hp <= boss.maxHp * 0.2) return bossCombo();              // 臨死 → 多題聯合的組合技
  // 綜合考:學過句子後有機率出「句子默寫」,湊不出句就退回單字(血過半時一半機率 2 字)
  const avoid = new Set(boss.lastAnswerKey ? [boss.lastAnswerKey] : []);
  const sq = Math.random() < BOSS_SENTENCE_PROB ? bossSentenceQuestion(avoid) : null;
  const q = sq || bossQuestion((boss.hp <= boss.maxHp * 0.6 && Math.random() < 0.5) ? 2 : 1, avoid);
  boss.lastAnswerKey = bossAnswerKey(q);
  const mode = q.mode || (q.isSentence ? 'arrange' : pickBossMode(q));
  renderBossQ(q, null, mode, (ok, input) => {
    if (ok) {
      const frac = q.isSentence ? BOSS_DMG.sentence : mode === 'choice' ? BOSS_DMG.choice : q.ids.length > 1 ? BOSS_DMG.two : BOSS_DMG.spell;   // 按題型給傷害(總血 %)
      const dmg = Math.max(1, Math.round(boss.maxHp * frac));
      boss.hp = Math.max(0, boss.hp - dmg); sfx.correct();
      $('prompt').textContent = `命中!−${dmg}`; $('prompt').style.color = '#6ee7a8';
    } else {
      bossWrongIds(q, input).forEach(id => boss.missed.add(id));     // 只記真的拼錯的字(逐格比對,不連坐)
      boss.you -= 1; sfx.wrong();
      $('prompt').textContent = '沒打中!你 −1 ❤'; $('prompt').style.color = '#e35b6a';
    }
    setTimeout(bossTurn, 750);
  });
}
// 臨死反撲:連段和每題字數隨王階段成長,「全對才打出最後一擊」;錯任何一題 → 你 −1 ❤、整組作廢重來
function bossCombo() {
  const avoid = new Set(boss.lastAnswerKey ? [boss.lastAnswerKey] : []);
  const hits = bossPanicHits();
  const baseWords = bossPanicWordCount();
  const qs = Array.from({ length: hits }, (_, idx) => {
    const q = ((boss.stage || 1) >= 2 && (idx === 0 || Math.random() < 0.45))
      ? (bossSentenceQuestion(avoid) || bossQuestion(baseWords + (baseWords < 4 && Math.random() < 0.5 ? 1 : 0), avoid))
      : bossQuestion(baseWords + (baseWords < 4 && Math.random() < 0.5 ? 1 : 0), avoid);
    avoid.add(bossAnswerKey(q));
    return q;
  });
  let idx = 0;
  (function step() {
    boss.lastAnswerKey = bossAnswerKey(qs[idx]);
    renderBossQ(qs[idx], { idx, total: hits }, 'zh', (ok, input) => {
      if (!ok) {                                                     // 斷組 → 扣命、整組重來
        bossWrongIds(qs[idx], input).forEach(id => boss.missed.add(id));   // 只記真的拼錯的字
        boss.you -= 1; sfx.wrong();
        $('prompt').textContent = '連段中斷!你 −1 ❤'; $('prompt').style.color = '#e35b6a';
        return setTimeout(bossTurn, 850);
      }
      sfx.correct(); idx++;
      if (idx < hits) {                                              // 還有下一段
        $('prompt').textContent = `連段 ${idx}/${hits} 命中!繼續 🔥`; $('prompt').style.color = '#6ee7a8';
        return setTimeout(step, 650);
      }
      const dmg = Math.max(1, Math.round(boss.maxHp * BOSS_DMG.combo));   // 全對 → 收尾一擊(總血 25%,≥ 臨死門檻 20% 必收掉)
      boss.hp = Math.max(0, boss.hp - dmg);
      $('prompt').textContent = `組合完成!最後一擊 −${dmg} 💥`; $('prompt').style.color = '#6ee7a8';
      setTimeout(bossTurn, 900);
    });
  })();
}
// 渲染一道王戰題。mode: zh 看中文 / listen 聽英文 / pic 看圖 / choice 中文四選一。答完 / 逾時 → cb(ok, input)
function renderBossQ(q, combo, mode, cb) {
  const panic = boss.hp <= boss.maxHp * 0.2;
  const multi = q.ids.length > 1;
  const w = wordById(q.ids[0]);
  let limit = mode === 'choice' ? 8 : Math.round(q.letters * 1.5 + 4);   // 拼字看字數(放寬);四選一固定
  if (mode === 'arrange') limit = Math.max(14, q.en.split(/\s+/).length * 5 + 5);
  if (combo) limit = Math.round(limit * 1.4);                           // 臨死組合更寬鬆(詞多要想)
  const hearts = '❤️'.repeat(boss.you) + '🖤'.repeat(5 - boss.you);
  let prompt, clue;
  if (mode === 'listen')      { prompt = '🔊 聽,拼出來!';   clue = `<div style="text-align:center;margin:8px 0"><button class="replay" id="bhear">🔊 再聽</button></div>`; }
  else if (mode === 'pic')    { prompt = '看圖,拼出來!';     clue = `<div style="text-align:center;margin:6px 0">${picHTML(w, 110)}</div>`; }
  else if (mode === 'choice') { prompt = '限時選出正確的!';  clue = `<div class="bigzh" style="font-size:26px">${q.zh}</div>`; }
  else if (mode === 'arrange') { prompt = '看中文,排出英文!'; clue = `<div class="bigzh" style="font-size:24px">${q.zh}</div>`; }
  else                        { prompt = q.isSentence ? '限時默寫整句!(用空格分隔)' : multi ? '限時拼出來!(多字用空格)' : '限時拼出來!'; clue = `<div class="bigzh" style="font-size:${q.isSentence ? 22 : 26}px">${q.zh}</div>`; }
  const answer = mode === 'choice'
    ? `<div class="opts boss-options" id="bopts"></div>`
    : mode === 'arrange'
    ? `<div class="sentence-slots boss-sentence-slots" id="bslots"></div><div class="chunks sentence-bank boss-sentence-bank" id="bbank"></div><button class="btn" id="bsubmit">攻擊!</button>`
    : `<input class="inp" id="binp" autocomplete="off" autocapitalize="off" placeholder="${limit} 秒內打出英文${multi ? '(用空格分隔)' : ''}…"><button class="btn" id="bsubmit">攻擊!</button>`;
  screen.classList.add('boss-screen');
  screen.innerHTML = `
    <main class="boss-layout">
      <section class="boss-status">
        <div style="text-align:center;font-size:46px">${panic ? '👹' : '👾'}</div>
        <div class="bar" style="height:12px;margin:8px auto"><i style="width:${Math.round(boss.hp / boss.maxHp * 100)}%;background:${panic ? '#e35b6a' : '#f0b86e'}"></i></div>
        <div style="text-align:center;font-size:13px;color:#9fb4c8">王 ${boss.hp}/${boss.maxHp}　　你 ${hearts}</div>
        ${combo ? `<div style="text-align:center;color:#e35b6a;font-weight:700;margin-top:6px">⚠ 臨死反撲!連段 ${combo.idx + 1}/${combo.total} 🔥　全對才打出最後一擊</div>` : ''}
      </section>
      <section class="boss-arena">
        <div class="prompt" id="prompt">${prompt}</div>
        <div class="boss-clue">${clue}</div>
        <div class="bar boss-timer" style="height:6px"><i id="timebar" style="width:100%;background:#5aa9ff;transition:width ${limit}s linear"></i></div>
      </section>
      <section class="boss-answer">${answer}</section>
    </main>`;
  requestAnimationFrame(() => { const tb = $('timebar'); if (tb) tb.style.width = '0%'; });
  let done = false;
  const timer = setTimeout(() => finish(false, ''), limit * 1000);
  function finish(ok, input) { if (done) return; done = true; clearTimeout(timer); cb(ok, input); }
  if (mode === 'listen') { speak(q.en); $('bhear').onclick = () => speak(q.en); }
  if (mode === 'choice') {
    const box = $('bopts');
    fourOptions(w).forEach(o => {
      const el = document.createElement('div'); el.className = 'opt'; el.textContent = o.en;
      el.onclick = () => finish(o.en === q.en, o.en);
      box.appendChild(el);
    });
  } else if (mode === 'arrange') {
    setupBossArrange(q, finish);
  } else {
    $('binp').focus();
    const go = () => finish($('binp').value.trim().toLowerCase() === q.en.toLowerCase(), $('binp').value);
    $('bsubmit').onclick = go;
    $('binp').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
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
    if (!boss.replay) {
      const nextLevel = stageDeadlineLevel(wonStage) + 1;
      meta.bossReady = false; meta.stage = (meta.stage || 1) + 1; meta.stageStartLevel = nextLevel; meta.maxLevel = Math.max(meta.maxLevel, nextLevel); saveMeta();   // 打贏 → 下一階段(解鎖下一批字)+ 解鎖王關的下一關
    }
    screen.innerHTML = `<main class="boss-result"><div class="boss-result-inner">
      <div class="boss-result-icon">🏆</div>
      <h2 style="text-align:center;margin:0">${boss.replay ? '回顧完成!' : '擊敗了!'}</h2>
      <div class="sub" style="text-align:center">${boss.replay ? `第 ${wonStage} 支王已重新挑戰完成。` : `第 ${wonStage} 支王倒下,下一階段解鎖!`}</div>
      <button class="btn" id="bagain">回地圖 →</button>
    </div></main>`;
    $('bagain').onclick = showHome;
  } else {
    sfx.wrong();
    const missed = [...(boss.missed || [])].map(id => BANK.find(w => w.id === id)).filter(Boolean);   // 打輸 → 收集拼錯的字
    if (!boss.replay) { missed.forEach(w => { const c = rec(w); c.mastery = Math.max(0, (c.mastery || 0) - 30); c.due = meta.clock || 0; }); save(); }   // 主線王打輸才扣熟練;回顧重打不懲罰
    screen.innerHTML = `<main class="boss-result"><div class="boss-result-inner">
      <div class="boss-result-icon">💀</div>
      <h2 style="text-align:center;margin:0">被打倒了…</h2>
      <div class="sub" style="text-align:center">${boss.replay ? '這次只是回顧挑戰,不會扣進度。' : missed.length ? `卡在這些字:<b style="color:#ffd0d6">${missed.map(w => w.en).join(', ')}</b><br>回去惡補一關,再來戰。` : '回去多練幾關、衝高熟練度再來。'}</div>
      <button class="btn" id="bremedial">${boss.replay ? `再挑戰第 ${boss.stage} 支王 →` : missed.length ? '⚔ 回去惡補這些字 →' : '← 回地圖練一練'}</button>
      <button class="btn" id="bhome" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button>
    </div></main>`;
    $('bremedial').onclick = boss.replay ? () => startBoss(boss.stage, true) : missed.length ? () => { remedialWords = missed; inRemedial = true; homeEl.hidden = true; screen.hidden = false; startLevel(); } : showHome;
    $('bhome').onclick = showHome;
  }
}

/* ---- 主畫面外殼:左分類 / 中圓形地圖 / 右上金幣(玩法層,可換皮) ---- */
