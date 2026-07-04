let boss = null, remedialWords = null, inRemedial = false;
const BOSS_HP_FIRST = 35, BOSS_HP_BASE = 50, BOSS_HP_PER_STAGE = 30;   // 一王只有五個單字,血量獨立壓低;後面王再逐階變肉
const bossMaxHp = (stage = meta.stage || 1) => stage <= 1 ? BOSS_HP_FIRST : BOSS_HP_BASE + (stage - 1) * BOSS_HP_PER_STAGE;
const BOSS_DMG = { choice: 0.07, listen_choice: 0.07, spell: 0.1, listen_spell: 0.1, pic_spell: 0.1, grid: 0.14, category: 0.12, two: 0.14, sentence: 0.18, sentence_cloze: 0.14, combo: 0.25 };   // 傷害=總血比例;九宮格/分類是挑戰關專屬突襲題
const BOSS_SENTENCE_PROB = 0.34;   // 學過句子後,王每題有此機率出句子招式(克漏字/九宮格),湊不出句自動退回單字。
const BOSS_GRID_PROB = 0.12;       // 王專屬九宮格突襲:主要做錯字陷阱 / 圖像陷阱;句子九宮格由句子招式池抽
const BOSS_CATEGORY_PROB = 0.14;   // 分類突襲:選出所有飲料/食物/感受等,做概念驗收而不是純拼寫。
// 題庫=本階實詞為主,舊字只少量混入;功能詞 my/I/is… 放句子裡練,不在王戰單獨拼。
const bossCurrentPool = (stage = (boss && boss.stage) || meta.stage || 1) => stageWordsFor(stage).filter(w => w.pos !== 'function' && !isFresh(w));
const bossOldPool = (stage = (boss && boss.stage) || meta.stage || 1) => BANK.filter(w => !isFresh(w) && w.pos !== 'function' && batchOf(w) < stage - 1);
const bossFallbackPool = () => BANK.filter(w => w.pos !== 'function' && (w.syl || [w.en]).length <= 2).slice(0, 8);
const bossPool = () => { const cur = bossCurrentPool(), old = bossOldPool(); return cur.length ? [...cur, ...old] : (old.length ? old : bossFallbackPool()); };
// 從題庫加權抽 n 個字:本階字大幅優先、同一場已出過的降權,避免一直抽到 cat/water/friend。
const BOSS_CUR_WEIGHT = 14;
const bossCurPoolSize = () => bossCurrentPool().length;
const bossCurWeight = () => bossCurPoolSize() <= 2 ? 5 : BOSS_CUR_WEIGHT;   // 本階只有 1-2 個新字時,別讓整場只剩那幾個字
const bossOldScale = () => bossCurPoolSize() <= 2 ? 1 : 0.45;
const bossSeenCount = w => (boss && boss.seen && boss.seen[wordKey(w)]) || 0;
function bossWeight(w) {
  const cur = ((boss && boss.stage) || meta.stage || 1) - 1;
  let weight = batchOf(w) === cur ? bossCurWeight() : 1;
  if (boss && boss.missed && boss.missed.has(w.id)) weight += 6;
  weight *= 1 / (1 + bossSeenCount(w));
  if (batchOf(w) < cur) weight *= bossOldScale();
  return Math.max(0.1, weight);
}
function bossPickWords(n, sourceWords = null) {
  const pool = [...(sourceWords || bossPool())];
  const picks = [];
  while (picks.length < n && pool.length) {
    let r = Math.random() * pool.reduce((s, w) => s + bossWeight(w), 0), idx = 0;
    for (let i = 0; i < pool.length; i++) { r -= bossWeight(pool[i]); if (r <= 0) { idx = i; break; } }
    picks.push(pool.splice(idx, 1)[0]);
  }
  return picks;
}
function bossRememberQuestion(q) {
  if (!boss || !q || !q.ids) return;
  boss.seen = boss.seen || {};
  q.ids.forEach(id => { const w = wordById(id); if (w && w.pos !== 'function') boss.seen[wordKey(w)] = (boss.seen[wordKey(w)] || 0) + 1; });
}
function bossAnswerKey(q) {
  if (q && q.categoryKey) return q.categoryKey;
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
// 句子題只抽「前面已練過的句型」,且優先把本階新字塞進句子。Boss 驗收層會包成九宮格,不再用教學式拖曳排列。
function bossSentenceBaseQuestion(avoidKeys = new Set()) {
  let fallback = null;
  const sourceWords = sentenceSourceWords(bossPool());
  const curWords = bossCurrentPool();
  const focusWords = (curWords.length > 2 || Math.random() < 0.6) ? shuffle(curWords) : [];   // 本階字很少時,句子不要每題都強塞 home/house
  const patterns = shuffle(buildSentencePatterns().filter(p => patMastery(p.id) > 0));
  if (!patterns.length) return null;
  for (const w of focusWords) {
    for (const pattern of patterns) {
      const s = buildSentenceFromPattern(pattern, sourceWords, w);
      if (!s || !s.text.toLowerCase().split(/[^a-z]+/).filter(Boolean).includes(w.en.toLowerCase())) continue;
      const en = s.text.replace(/[.?!,]/g, '').trim();
      const ids = en.split(/\s+/).map(t => (BANK.find(x => x.en.toLowerCase() === t.toLowerCase()) || {}).id || null);
      const q = { zh: s.zh, en, letters: en.replace(/\s/g, '').length, ids, isSentence: true, mode: 'arrange', patternId: s.patternId };
      fallback = q;
      if (!avoidKeys.has(bossAnswerKey(q))) return q;
    }
  }
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
function bossGridFromSentence(q) {
  if (!q) return null;
  const target = q.en.split(/\s+/).filter(Boolean);
  if (!target.length || target.length > 6) return null;
  const used = new Set(target.map(bossGridNorm));
  const traps = shuffle(['a','my','is','This','I','am', ...bossPool().map(w => w.en)])
    .filter(t => !used.has(bossGridNorm(t))).slice(0, Math.max(0, 9 - target.length));
  const cells = shuffle([...target.map(t => bossGridTextCell(t)), ...traps.map(t => bossGridTextCell(t))]).slice(0, 9);
  return { ...q, mode:'grid', grid:{ prompt:'句子連打!', clueHtml:`<div class="boss-grid-clue"><div class="bigzh" style="font-size:24px;margin:4px 0">${q.zh}</div><div class="sub2">照英文順序點出句子</div></div>`, target:target.map(bossGridNorm), cells } };
}
function bossSentenceClozeQuestion(avoidKeys = new Set()) {
  const q = bossSentenceBaseQuestion(avoidKeys);
  if (!q) return null;
  const tokens = q.en.split(/\s+/).filter(Boolean);
  const candidates = tokens.map((tok, idx) => {
    const w = BANK.find(x => x.en.toLowerCase() === tok.toLowerCase());
    return w && w.pos !== 'function' ? { w, idx } : null;
  }).filter(Boolean);
  if (!candidates.length) return null;
  const cur = ((boss && boss.stage) || meta.stage || 1) - 1;
  const pick = (shuffle(candidates.filter(c => batchOf(c.w) === cur))[0]) || shuffle(candidates)[0];
  const shown = tokens.map((tok, idx) => idx === pick.idx ? '_____' : tok).join(' ');
  return {
    ...q,
    mode:'sentence_cloze',
    clozeAnswer:pick.w.en,
    clozeAnswerId:pick.w.id,
    clozeHtml:`<div class="bigzh" style="font-size:22px;margin:0 0 10px">${q.zh}</div><div class="boss-cloze-line">${shown}</div><div class="sub2">補上空格裡的英文</div>`
  };
}
function bossSentenceQuestion(avoidKeys = new Set(), allowGrid = true) {
  const base = bossSentenceBaseQuestion(avoidKeys);
  if (!base) return null;
  if (!allowGrid) return bossSentenceClozeQuestion(avoidKeys);
  return Math.random() < 0.65
    ? (bossSentenceClozeQuestion(avoidKeys) || bossGridFromSentence(base))
    : (bossGridFromSentence(base) || bossSentenceClozeQuestion(avoidKeys));
}
const GRID_VISUAL_TRAPS = {
  word_cat:['🐯','🐶','🦁'],
  word_water:['🛢️','🥛','🧃'],
  word_home:['🏢','🏫','🏭'],
  word_house:['⛺','🏢','🏰'],
  word_book:['📦','🧱','🪟'],
  word_happy:['😐','😢','😡'],
  word_friend:['👤','👪','🧍']
};
const bossGridNorm = s => (s || '').toLowerCase().replace(/[^a-z]+/g, '');
function bossTypoTraps(w, max = 5) {
  const en = w.en.toLowerCase();
  const real = new Set(BANK.map(x => x.en.toLowerCase()));
  const out = [];
  const indexOrder = en.length >= 3 ? [1, ...Array.from({ length:en.length }, (_, i) => i).filter(i => i !== 1)] : Array.from({ length:en.length }, (_, i) => i);
  for (const i of indexOrder) {
    const letters = i === 1 ? ['o','i','u','r','e','a','n','t','s','l'] : ['a','e','i','o','u','r','n','t','s','l'];
    for (const ch of letters) {
      if (ch === en[i]) continue;
      const v = en.slice(0, i) + ch + en.slice(i + 1);
      if (v !== en && !real.has(v) && !out.includes(v)) out.push(v);
      if (out.length >= max) return out;
    }
  }
  return out;
}
function bossGridTextCell(text, value = text) {
  return { kind:'text', text, value:bossGridNorm(value) };
}
function bossGridVisualCell(html, value) {
  return { kind:'visual', html, value:bossGridNorm(value) };
}
function bossGridWordQuestion(avoidKeys = new Set()) {
  const q = bossQuestion(1, avoidKeys);
  const w = wordById(q.ids[0]);
  if (!w) return null;
  const visualMode = visualOf(w) && Math.random() < 0.4;
  let cells, clueHtml, prompt;
  if (visualMode) {
    const learnedVisuals = shuffle(bossPool().filter(x => x.id !== w.id && visualOf(x))).slice(0, 3).map(x => bossGridVisualCell(picHTML(x, 58), x.en));
    const trapVisuals = shuffle(GRID_VISUAL_TRAPS[wordKey(w)] || ['❓','🌀','⭐']).slice(0, 3).map((v, i) => bossGridVisualCell(`<div class="boss-grid-emoji">${v}</div>`, `trap${i}`));
    cells = shuffle([bossGridVisualCell(picHTML(w, 58), w.en), ...learnedVisuals, ...trapVisuals]).slice(0, 9);
    clueHtml = `<div class="boss-grid-clue"><div class="boss-grid-clue-word">${w.en}</div><div class="sub2">點出對應圖示</div></div>`;
    prompt = '英文找圖!';
  } else if (!trackSkillOn('write')) {
    // 不練寫的軌(工作):王不考「從錯字堆挑對的拼法」—— 那是拼寫辨識,你刻意沒練,送分或靠猜。
    // 改考「意義辨識」:誘答是別的真字(不是同一字的錯字),要真的知道哪個對應這個中文才選得出。
    const distract = shuffle(bossPool().filter(x => x.id !== w.id && x.zh !== w.zh)).slice(0, 8).map(x => bossGridTextCell(x.en));
    cells = shuffle([bossGridTextCell(w.en), ...distract]).slice(0, 9);
    const pic = visualOf(w) && Math.random() < 0.35 ? picHTML(w, 66) : '';
    clueHtml = `<div class="boss-grid-clue">${pic}<div class="bigzh" style="font-size:25px;margin:4px 0">${w.zh}</div><div class="sub2">選出對應的英文</div></div>`;
    prompt = '哪個是這個意思?';
  } else {
    // 練寫的軌(日常):挑正確拼法、避開相似錯字 —— 對它才是合理的辨識驗收。
    const typo = bossTypoTraps(w, 5).map(t => bossGridTextCell(t));
    const old = shuffle(bossPool().filter(x => x.id !== w.id)).slice(0, 3).map(x => bossGridTextCell(x.en));
    cells = shuffle([bossGridTextCell(w.en), ...typo, ...old]).slice(0, 9);
    const pic = visualOf(w) && Math.random() < 0.35 ? picHTML(w, 66) : '';
    clueHtml = `<div class="boss-grid-clue">${pic}<div class="bigzh" style="font-size:25px;margin:4px 0">${w.zh}</div><div class="sub2">避開相似錯字</div></div>`;
    prompt = '找出正確英文!';
  }
  return { zh:q.zh, en:q.en, letters:q.letters, ids:q.ids, mode:'grid', grid:{ prompt, clueHtml, target:[bossGridNorm(w.en)], cells } };
}
function bossGridSentenceQuestion(avoidKeys = new Set()) {
  return bossGridFromSentence(bossSentenceBaseQuestion(avoidKeys));
}
function bossGridQuestion(avoidKeys = new Set()) {
  return bossGridWordQuestion(avoidKeys);
}
function bossCategoryQuestion(avoidKeys = new Set()) {
  const built = buildCategoryQuestion(null, sentenceSourceWords(bossPool()), { minCorrect:2, maxOptions:8 });
  if (!built) return null;
  const correctIds = built.correctIds.slice().sort();
  const key = `category:${built.category.id}:${correctIds.join('|')}`;
  if (avoidKeys.has(key)) return null;
  return {
    zh: built.category.prompt,
    en: built.correct.map(w => w.en).join(', '),
    letters: built.options.reduce((s, w) => s + w.en.length, 0),
    ids: correctIds,
    mode:'category',
    categoryKey:key,
    categoryPick:built
  };
}
// 多字題答錯 → 逐格比對,只回傳「真的拼錯的那幾個字」id(不連坐整組;惡補才不會複習你會的)
function bossWrongIds(q, input) {
  if (q.categoryPick) {
    const selected = new Set((input && input.selectedIds) || []);
    const correct = new Set(q.categoryPick.correctIds);
    return q.categoryPick.options
      .filter(w => (selected.has(w.id) && !correct.has(w.id)) || (!selected.has(w.id) && correct.has(w.id)))
      .map(w => w.id);
  }
  if (q.clozeAnswerId) return [q.clozeAnswerId];
  if (q.isSentence) return q.ids.filter(id => { const w = wordById(id); return w && w.pos !== 'function'; });
  const typed = (input || '').trim().toLowerCase().split(/\s+/);
  const exp = q.en.toLowerCase().split(' ');
  const wrong = [];
  exp.forEach((w, i) => { if (!isCloseEnough(typed[i] || '', w)) wrong.push(q.ids[i]); });   // 在容錯範圍內的詞不算「拼錯」,別冤枉進惡補
  return wrong;
}
function startChallenge(stage) {
  startBoss(stage, true, true);
}
function startBoss(stage = meta.stage || 1, replay = false, challenge = false) {
  screen.classList.remove('lesson-screen', 'done-screen', 'start-screen');
  screen.classList.add('boss-screen');
  homeEl.hidden = true; screen.hidden = false; bgm.boss();
  const hp = bossMaxHp(stage);
  boss = { stage, replay: replay || challenge, challenge, hp, maxHp: hp, you: 5, panicked: false, missed: new Set(), seen: {}, lastAnswerKey: null, lastMode: null };
  bossTurn();
}  // 原 Boss 戰保留為 optional challenge:不擋主線,挑戰輸了不扣進度。
const BOSS_PANIC_MAX_HITS = 5;
const bossPanicPower = () => Math.max(0, ((boss && boss.stage) || meta.stage || 1) - 1);
const bossPanicHits = () => Math.min(BOSS_PANIC_MAX_HITS, 2 + Math.floor(bossPanicPower() / 2));   // stage 1-2:2, 3-4:3, 5-6:4, 7+:5
const bossPanicWordCount = () => Math.min(4, 2 + Math.floor(bossPanicPower() / 3));                // stage 1-3:2~3字, 4-6:3~4字, 7+:4字
const bossPanicSentenceCount = hits => Math.min(hits > 1 ? hits - 1 : hits, Math.max(1, Math.round(hits * Math.min(0.85, 0.55 + bossPanicPower() * 0.06)))); // 反撲以句子驗收為主,但保留一題單字混合;階段越後面句子比例越高
const BOSS_MODES = ['zh', 'listen', 'listen_choice', 'pic', 'choice'];   // 王戰提示花樣:看中文 / 聽英文拼 / 聽英文選 / 看圖 / 中文四選一。
// 單字題隨機挑一種提示:沒圖不出看圖、功能詞不出聽、誘答不夠不出選擇;多字題(含臨死組合)一律看中文拼
function pickBossMode(q) {
  if (q.ids.length > 1) return 'zh';
  const w = wordById(q.ids[0]); if (!w) return 'zh';
  let modes = BOSS_MODES.slice();
  if (!visualOf(w)) modes = modes.filter(m => m !== 'pic');
  if (w.pos === 'function') modes = modes.filter(m => m !== 'listen' && m !== 'listen_choice');
  if (fourOptions(w).length < 3) modes = modes.filter(m => m !== 'choice' && m !== 'listen_choice');
  if (!trackSkillOn('write')) { const rec = modes.filter(m => m === 'choice' || m === 'listen_choice'); if (rec.length) modes = rec; }   // 不練默寫的軌:優先辨識選擇題,不出看中文/聽/看圖「打字」
  return modes[Math.floor(Math.random() * modes.length)] || 'zh';
}
function bossTurn() {
  if (boss.hp <= 0) return bossEnd(true);
  if (boss.you <= 0) return bossEnd(false);
  if (!boss.panicked && boss.hp <= boss.maxHp * 0.2) { boss.panicked = true; bgm.panic(); }   // 跌破 20% → 同一首暴走(加速+升調),只觸發一次
  if (boss.hp <= boss.maxHp * 0.2) return bossCombo();              // 臨死 → 多題聯合的組合技
  // 綜合考:學過句子後有機率出「九宮格句子連打」,湊不出句就退回單字(血過半時一半機率 2 字)
  const avoid = new Set(boss.lastAnswerKey ? [boss.lastAnswerKey] : []);
  const avoidGrid = boss.lastMode === 'grid';
  const noWrite = !trackSkillOn('write');   // 工作軌:不打字默寫 → 句子用九宮格點序、單字用九宮格挑正確拼法(辨識,不是產出)
  const gq = !avoidGrid && Math.random() < BOSS_GRID_PROB ? bossGridQuestion(avoid) : null;
  const sq = !gq && Math.random() < BOSS_SENTENCE_PROB ? (noWrite ? bossGridSentenceQuestion(avoid) : bossSentenceQuestion(avoid, !avoidGrid)) : null;
  const cq = !gq && !sq && Math.random() < BOSS_CATEGORY_PROB ? bossCategoryQuestion(avoid) : null;
  const q = gq || sq || cq || (noWrite ? (bossGridWordQuestion(avoid) || bossGridSentenceQuestion(avoid) || bossQuestion(1, avoid)) : bossQuestion((boss.hp <= boss.maxHp * 0.6 && Math.random() < 0.5) ? 2 : 1, avoid));
  bossRememberQuestion(q);
  boss.lastAnswerKey = bossAnswerKey(q);
  const mode = q.mode || (q.isSentence ? 'arrange' : pickBossMode(q));
  boss.lastMode = mode;
  renderBossQ(q, null, mode, (ok, input) => {
    if (ok) {
      const frac = mode === 'sentence_cloze' ? BOSS_DMG.sentence_cloze
        : q.isSentence ? BOSS_DMG.sentence
        : mode === 'grid' ? BOSS_DMG.grid
        : mode === 'category' ? BOSS_DMG.category
        : mode === 'choice' ? BOSS_DMG.choice
        : mode === 'listen_choice' ? BOSS_DMG.listen_choice
        : mode === 'listen' ? BOSS_DMG.listen_spell
        : mode === 'pic' ? BOSS_DMG.pic_spell
        : q.ids.length > 1 ? BOSS_DMG.two
        : BOSS_DMG.spell;   // 按題型給傷害(總血 %)
      const dmg = Math.max(1, Math.round(boss.maxHp * frac));
      boss.hp = Math.max(0, boss.hp - dmg); sfx.correct();
      $('prompt').textContent = `命中!−${dmg}`; $('prompt').style.color = '#6ee7a8';
    } else {
      bossWrongIds(q, input).forEach(id => boss.missed.add(id));     // 只記真的拼錯的字(逐格比對,不連坐)
      boss.you -= 1; sfx.wrong();
      $('prompt').textContent = '沒打中!你 −1 ❤'; $('prompt').style.color = '#e35b6a';
    }
    scheduleBossTurn(420);
  });
}
function scheduleBossTurn(delay = 420) {
  setTimeout(() => {
    try {
      bossTurn();
    } catch (err) {
      console.error('bossTurn failed', err);
      const prompt = $('prompt');
      if (prompt) {
        prompt.textContent = '題目生成出錯,先跳過這一下';
        prompt.style.color = '#e35b6a';
      }
      setTimeout(() => {
        try { showHome(); }
        catch (homeErr) { console.error('boss recovery failed', homeErr); }
      }, 900);
    }
  }, delay);
}
// 臨死反撲:連段和每題字數隨王階段成長,「全對才打出最後一擊」;錯任何一題 → 你 −1 ❤、整組作廢重來
function bossCombo() {
  const avoid = new Set(boss.lastAnswerKey ? [boss.lastAnswerKey] : []);
  const noWrite = !trackSkillOn('write');   // 工作軌臨死反撲也走辨識題(九宮格),不打字
  const sentenceQ = a => noWrite ? bossGridSentenceQuestion(a) : bossSentenceQuestion(a, true);
  const hits = bossPanicHits();
  const baseWords = bossPanicWordCount();
  let sentenceBudget = sentenceQ(avoid) ? bossPanicSentenceCount(hits) : 0;
  let categoryBudget = bossCategoryQuestion(avoid) ? (hits >= 3 ? 1 : (Math.random() < 0.35 ? 1 : 0)) : 0;
  const qs = Array.from({ length: hits }, (_, idx) => {
    const remaining = hits - idx;
    const mustSentence = sentenceBudget > 0 && sentenceBudget >= remaining;
    const preferSentence = sentenceBudget > 0 && (idx === 0 || mustSentence || Math.random() < 0.72);
    let q = preferSentence ? sentenceQ(avoid) : null;
    if (q) sentenceBudget--;
    else if (categoryBudget > 0 && Math.random() < 0.55) { q = bossCategoryQuestion(avoid); if (q) categoryBudget--; }
    if (!q) q = noWrite ? (bossGridWordQuestion(avoid) || bossGridSentenceQuestion(avoid) || bossQuestion(1, avoid)) : bossQuestion(baseWords + (baseWords < 4 && Math.random() < 0.5 ? 1 : 0), avoid);
    avoid.add(bossAnswerKey(q));
    return q;
  });
  let idx = 0;
  (function step() {
    bossRememberQuestion(qs[idx]);
    boss.lastAnswerKey = bossAnswerKey(qs[idx]);
    renderBossQ(qs[idx], { idx, total: hits }, qs[idx].mode || 'zh', (ok, input) => {
      if (!ok) {                                                     // 斷組 → 扣命、整組重來
        bossWrongIds(qs[idx], input).forEach(id => boss.missed.add(id));   // 只記真的拼錯的字
        boss.you -= 1; sfx.wrong();
        $('prompt').textContent = '連段中斷!你 −1 ❤'; $('prompt').style.color = '#e35b6a';
        return scheduleBossTurn(650);
      }
      sfx.correct(); idx++;
      if (idx < hits) {                                              // 還有下一段
        $('prompt').textContent = `連段 ${idx}/${hits} 命中!繼續 🔥`; $('prompt').style.color = '#6ee7a8';
        return setTimeout(step, 650);
      }
      const dmg = Math.max(1, Math.round(boss.maxHp * BOSS_DMG.combo));   // 全對 → 收尾一擊(總血 25%,≥ 臨死門檻 20% 必收掉)
      boss.hp = Math.max(0, boss.hp - dmg);
      $('prompt').textContent = `組合完成!最後一擊 −${dmg} 💥`; $('prompt').style.color = '#6ee7a8';
      scheduleBossTurn(650);
    });
  })();
}
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

/* ---- 主畫面外殼:左分類 / 中圓形地圖 / 右上金幣(玩法層,可換皮) ---- */
