const sp = (w, mode) => renderSpeak(w, mode);
const FORMATS = [
  { id:'readpick',     lv:1, skill:'read',   ok:() => true,                          run: askReadPick },         // 看中選英
  { id:'match',        lv:1, skill:'read',   ok: w => BANK.filter(x => !isFresh(x) && x.id !== w.id).length >= 2, run: askMatch },  // 配對(≥3 個教過的字就出,組數浮動 3~5、只用教過的)
  { id:'speak_shadow', lv:1, skill:'speak',  ok:() => true,                          run: w => sp(w,'shadow') }, // 跟讀說(聽過再說很簡單 → L1 就有)
  { id:'listenpick',   lv:2, skill:'listen', ok: w => w.pos !== 'function',          run: askListenPick },       // 聽選意思(功能詞單獨聽沒意義 → 不出)
  { id:'picture',      lv:2, skill:'read',   ok: w => !!visualOf(w),                 run: askPicture },          // 看圖選
  { id:'listenword',   lv:3, skill:'listen', ok: w => w.pos !== 'function',          run: askListenWord },       // 聽選字(功能詞不出)
  { id:'cloze',        lv:3, skill:'read',   ok: w => patternsForWord(w).length > 0, run: askClozePick },        // 句中填空
  { id:'speak_direct', lv:3, skill:'speak',  ok:() => true,                          run: w => sp(w,'direct') }, // 直接說
  { id:'speak_blind',  lv:3, skill:'speak',  ok:() => true,                          run: w => sp(w,'blind') },  // 盲聽說
  { id:'speak_pic',    lv:3, skill:'speak',  ok: w => !!visualOf(w),                 run: w => sp(w,'pic') },    // 看圖說
  { id:'sylfill',      lv:4, skill:'write',  ok: w => sylOf(w).length >= 2,          run: askSylFill },          // 音節填空(選擇版)
  { id:'syltype',      lv:4, skill:'write',  ok: w => sylOf(w).length >= 2,          run: askSylType },          // 音節克漏字(打字版,長字寫階友善)
  { id:'type',         lv:4, skill:'write',  ok: w => w.en.length > 1,               run: askType },             // 聽寫(單字母不練寫)
  { id:'pictype',      lv:4, skill:'write',  ok: w => !!visualOf(w),                 run: askPicType },          // 看圖寫
  { id:'flashtype',    lv:5, skill:'write',  ok: w => w.en.length > 1,               run: askFlashType },        // 默寫(單字母不練寫)
  { id:'sentence_cloze', lv:6, skill:'write', tier:3, ok: w => (meta.stage || 1) >= 3 && canSentenceCloze(w), run: askSentenceCloze }, // 二王後:句子克漏字打字(先練缺字,不整句默寫)
  { id:'sentence_build', lv:3, skill:'read', tier:3, ok: () => !!pickBuildSentence(sentenceSourceWords()), run: w => askBuildSentence(sentenceSourceWords(), () => { onCorrect(w); updateBar(); nextQuestion(); }) },  // 排詞造句(句型軌;湊得出句才出、句型 % 自己一條)
  { id:'sentence_transform', lv:3, skill:'read', tier:3, ok: () => canTransform(), run: w => askTransform(w) },  // ★ 轉換題:把練過的直述句重排成問句(this is ↔ is this);直述句練過(patMastery>0)才出
];
const READPICK = FORMATS[0];
// 這一題出第幾階:沒教→教;學會的字回鍋→隨機產出階複習;否則攻「當前最低未過階」,封頂關卡 topRung。
// → 新字一定先教;低關卡絕不冒出高階題;字超前(低階已過、想攻更高)但關卡還沒解鎖 → 被壓回複習低階 = 向下取。
function chooseRung(w) {
  const base = rungOf(w), cap = Math.min(plan.topRung, maxRungOf(w));          // 關卡天花板 + 這字本身最高階(功能詞封在認)
  if (base === 0) return 0;                                                    // 沒教 → 教
  if (base === 4) return cap >= 1 ? 1 + Math.floor(Math.random() * cap) : 0;   // 學會回鍋 → 複習 1..cap
  return Math.min(base, cap);                                                  // 攻當前階,封頂
}
// 題型 → 技能(認階的聽 / 讀);說 = 說階、寫 = 寫階,在 ask 直接判。給設定面板開關用。
const SKILL = new Map([
  [askListenPick,'listen'], [askListenWord,'listen'],
  [askReadPick,'read'], [askPicture,'read'], [askMatch,'read'], [askClozePick,'read'],
  [askSylFill,'write'], [askSylType,'write'], [askType,'write'], [askPicType,'write'], [askFlashType,'write'], [askSentenceCloze,'write'],
]);
const skillOn = s => (meta.skills || {})[s] !== false;             // 預設開
function passRung(w) { onCorrect(w); updateBar(); nextQuestion(); } // 該技能關了 → 該階自動帶過
let lastAsked = {}, lastAskedSkill = {}, lastFormat = null, currentSkill = null;   // 每字上次題型 + 技能 + 全域上一題格式 → 避免連續同題型(破單調)
function ask(w) {
  if (isFresh(w)) { currentRung = 0; currentSkill = null; lastFormat = teach; return teach(w); }       // 新字一律先教(認識)
  currentRung = 1;                                                                // 非教 → 算有產出,onCorrect 會 +mastery
  let pool = FORMATS.filter(f => f.lv <= level && skillOn(f.skill) && f.ok(w) && (f.tier || (f.skill === 'write' ? 3 : f.skill === 'speak' ? 2 : 1)) <= maxRungOf(w));  // 向下取 + 不超過該字上限(功能詞 maxRungOf=1 → 只認題,不被叫去說/寫)
  if (!pool.length) pool = [READPICK];                                            // 保險:至少出看中選英
  const k = wordKey(w);
  if (pool.length > 1) {                                                          // 避免連續同形式 / 同字同題型
    let alt = pool.filter(f => f.run !== lastAsked[k] && f.run !== lastFormat);
    if (!alt.length) alt = pool.filter(f => f.run !== lastFormat);
    if (!alt.length) alt = pool.filter(f => f.run !== lastAsked[k]);
    if (alt.length) pool = alt;
  }
  if (!rec(w).wrote) {
    const writePool = pool.filter(f => f.skill === 'write');
    if (writePool.length) pool = writePool;
  }
  // ★ 熟練度 = 出現頻率(不是 gate):靠近該字當前難度的題型抽中機率高,難的不會消失、只是變少;字越熟、難題出現越多。
  const fmtTier = f => f.tier || (f.skill === 'write' ? 3 : f.skill === 'speak' ? 2 : 1);   // 認/讀=1、說=2、寫=3;f.tier 可覆寫(句子=3)
  const target = tierOfMastery(rec(w).mastery || 0);
  const wt = f => {
    if (f.id === 'sentence_build') return !stageHasRealWords(meta.stage || 1) ? 90 : (meta.stage || 1) >= 2 ? 40 : 7;   // 句型階段主打句子;有新實詞的階段只提高到穿插練習。
    if (f.id === 'sentence_transform') return (meta.stage || 1) >= 2 ? 20 : 8;   // 直述↔問句轉換:直述句練過才會出(canTransform 守),出現頻率中等
    if (f.id === 'sentence_cloze') return (meta.stage || 1) >= 3 ? 18 : 0;
    const d = Math.abs(fmtTier(f) - target); return d === 0 ? 3 : d === 1 ? 1 : 0.3;
  };
  let tot = pool.reduce((s, c) => s + wt(c), 0), pick = Math.random() * tot, f = pool[pool.length - 1];
  for (const c of pool) { pick -= wt(c); if (pick <= 0) { f = c; break; } }
  currentSkill = f.skill;
  lastAsked[k] = f.run; lastAskedSkill[k] = f.skill; lastFormat = f.run;
  f.run(w);
}

/* ---- 關卡面板 / 過關畫面(玩法層,之後可換成華麗地圖) ---- */
function levelProgressHTML() {
  return levelWords.map(w => `<div class="wordrow"><div class="en">${w.en}</div>
    <div class="bar"><i style="width:${pOf(w)}%"></i></div><div class="pct">${pOf(w)}%</div></div>`).join('');
}
function showStart() {
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen');
  screen.classList.add('start-screen');
  // 預覽拿掉(浮動關卡 + 越來越多字後沒意義,原描述也是舊模型)→ 直接一個極簡開場
  screen.innerHTML = `<main class="start-panel"><div style="text-align:center;font-size:40px">📚</div>
    <h2 style="text-align:center">第 ${level} 關</h2>
    <button class="btn" id="go" style="margin-top:16px">開始 →</button></main>`;
  $('go').onclick = startLevel;
}
function showDone() {
  screen.classList.remove('lesson-screen', 'boss-screen', 'start-screen');
  screen.classList.add('done-screen');
  if (inRemedial) {                                                              // 惡補關打完 → 回去再挑戰王
    inRemedial = false; sfx.done();
    screen.innerHTML = `<main class="done-panel"><div style="text-align:center;font-size:40px">💪</div>
      <h2 style="text-align:center">惡補完成!</h2>
      <div class="sub" style="text-align:center">剛剛卡住的字練過了,回去再戰一次。</div>
      <button class="btn" id="reboss" style="margin-top:14px">⚔ 再挑戰第 ${meta.stage} 支王 →</button>
      <button class="btn" id="tomap" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button></main>`;
    $('reboss').onclick = () => startBoss();
    $('tomap').onclick = showHome;
    return;
  }
  const newly = levelWords.filter(isLearned);
  if (stageReady()) meta.bossReady = true;                                       // 當前批次練到「會寫」→ 王可挑戰(非強制,玩家決定)
  if (!meta.bossReady && !stageDeadlineReached() && level >= meta.maxLevel) meta.maxLevel = level + 1;       // 章末後不再開普通關;補完默寫就開王
  normalizeBossGate();
  sfx.done(); if (newly.length) setTimeout(() => sfx.coin(), 650);
  const sentenceWords = sentenceSourceWords(levelWords);
  const canBuildSentence = !!pickBuildSentence(sentenceWords);
  const ready = meta.bossReady;
  const blocked = !ready && stageDeadlineReached();
  screen.innerHTML = `<main class="done-panel"><div style="text-align:center;font-size:40px">🎉</div>
    <h2 style="text-align:center">過關!</h2>
    <div class="sub" style="text-align:center">這關練的字,熟練度都疊上去了:</div>
    ${levelProgressHTML()}
    ${newly.length ? `<div class="sub" style="margin-top:12px">★ <b style="color:#9bd2ff">${newly.map(w=>w.en).join(', ')}</b> 已 100% 學會,存起來——之後關卡會隨機回鍋。</div>` : ''}
    ${ready ? `<div class="sub" style="margin-top:12px;color:#ffd0d6">這一段已經練到可以打王了 —— 擊敗王才能繼續前進。</div>` : ''}
    ${blocked ? `<div class="sub" style="margin-top:12px;color:#ffd0d6">還有字沒默寫成功過,先補完就會開王。</div>` : ''}
    ${canBuildSentence ? `<button class="btn" id="build" style="margin-top:14px;background:#0e2a1f;border-color:#1f5c3f">組句小練習 →</button>` : ''}
    ${ready ? `<button class="btn" id="boss" style="margin-top:14px;background:#2a0e12;border-color:#e35b6a">⚔ 挑戰第 ${meta.stage} 支王!</button>` : ''}
    <button class="btn" id="next" style="margin-top:${ready ? 10 : 14}px${ready ? ';background:#1d2c3a;border-color:#2c3e52' : ''}">${ready ? '回地圖看王關 →' : blocked ? '補默寫 →' : '下一關 →'}</button>
    <button class="btn" id="tomap" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button></main>`;
  if (canBuildSentence) $('build').onclick = () => askBuildSentence(sentenceWords, showDone);
  if ($('boss')) $('boss').onclick = () => startBoss();
  $('next').onclick = () => {
    if (ready) return showHome();
    if (blocked) return showStart();
    level++; if (level > meta.maxLevel) { meta.maxLevel = level; saveMeta(); } showStart();
  };
  $('tomap').onclick = showHome;
}

/* ---- Boss 戰(第一支王;戰鬥邏輯獨立,觸發點之後可移到任何章末) ---- */
