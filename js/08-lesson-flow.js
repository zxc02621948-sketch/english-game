const sp = (w, mode) => renderSpeak(w, mode);
const FORMATS = [
  { id:'readpick',     lv:1, skill:'read',   ok:() => true,                          run: askReadPick },         // 看中選英
  { id:'match',        lv:1, skill:'read',   ok: w => BANK.filter(x => !isFresh(x) && x.id !== w.id).length >= 2, run: askMatch },  // 配對(≥3 個教過的字就出,組數浮動 3~5、只用教過的)
  { id:'speak_shadow', lv:1, skill:'speak',  ok:() => true,                          run: w => sp(w,'shadow') }, // 跟讀說(聽過再說很簡單 → L1 就有)
  { id:'listenpick',   lv:2, skill:'listen', ok: w => w.pos !== 'function',          run: askListenPick },       // 聽選意思(功能詞單獨聽沒意義 → 不出)
  { id:'picture',      lv:2, skill:'read',   ok: w => !!visualOf(w),                 run: askPicture },          // 看圖選
  { id:'listenword',   lv:3, skill:'listen', ok: w => w.pos !== 'function',          run: askListenWord },       // 聽選字(功能詞不出)
  { id:'cloze',        lv:1, skill:'read',   ok: w => patternsForWord(w).length > 0 && BANK.some(o => o.id !== w.id && o.pos === w.pos && !isFresh(o)), run: askClozePick },        // 句中填空
  { id:'category',     lv:2, skill:'read',   tier:1, ok: w => !!categoryQuestionForWord(w), run: askCategoryPick }, // 分類多選(飲料/食物/感受等):至少 2 正解 + 2 誘答才出
  { id:'sentence_speak', lv:2, skill:'speak', tier:2, ok: () => hasFreshBuildSentence(currentSentenceSourceWords()), run: w => askSentenceSpeak(currentSentenceSourceWords(), () => { onCorrect(w); updateBar(); nextQuestion(); }) }, // 整句跟讀(低壓:辨識不穩可自評通過);只在有「新句子」時出
  { id:'speak_direct', lv:3, skill:'speak',  ok:() => true,                          run: w => sp(w,'direct') }, // 直接說
  { id:'speak_blind',  lv:3, skill:'speak',  ok:() => true,                          run: w => sp(w,'blind') },  // 盲聽說
  { id:'speak_pic',    lv:3, skill:'speak',  ok: w => !!visualOf(w),                 run: w => sp(w,'pic') },    // 看圖說
  { id:'sylfill',      lv:4, skill:'write',  ok: w => sylOf(w).length >= 3,          run: askSylFill },          // 音節填空(選擇版)— 只給 3+ 音節的長字(短字如 happy 拆音節反而混亂)
  { id:'syltype',      lv:4, skill:'write',  ok: w => sylOf(w).length >= 3,          run: askSylType },          // 音節克漏字(打字版)— 同上,只長字才分段
  { id:'type',         lv:4, skill:'write',  ok: w => w.en.length > 1,               run: askType },             // 聽寫(單字母不練寫)
  { id:'pictype',      lv:4, skill:'write',  ok: w => !!visualOf(w),                 run: askPicType },          // 看圖寫
  { id:'flashtype',    lv:5, skill:'write',  ok: w => w.en.length > 1,               run: askFlashType },        // 默寫(單字母不練寫)
  { id:'sentence_cloze', lv:6, skill:'write', tier:3, ok: w => (meta.stage || 1) >= 3 && canSentenceCloze(w), run: askSentenceCloze }, // 二王後:句子克漏字打字(先練缺字,不整句默寫)
  { id:'sentence_build', lv:1, skill:'read', tier:1, ok: () => hasFreshBuildSentence(currentSentenceSourceWords()), run: w => askBuildSentence(currentSentenceSourceWords(), () => { onCorrect(w); updateBar(); nextQuestion(); }, null, () => { onWrong(w); nextQuestion(); }) },  // 排詞造句(句型軌;只在有「新句子」時出 → 不狂重播同一句)
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
  [askReadPick,'read'], [askPicture,'read'], [askMatch,'read'], [askClozePick,'read'], [askCategoryPick,'read'],
  [askSylFill,'write'], [askSylType,'write'], [askType,'write'], [askPicType,'write'], [askFlashType,'write'], [askSentenceCloze,'write'],
]);
const skillOn = s => (meta.skills || {})[s] !== false;             // 預設開(使用者面板總開關)
const trackSkillOn = s => skillOn(s) && !(TRACKS[currentTrack] && TRACKS[currentTrack].skills && TRACKS[currentTrack].skills[s] === false);   // 該軌是否練此技能(工作軌關掉 write → 不出默寫、王也不考打字)
const wroteOk = w => !!rec(w).wrote || !trackSkillOn('write');     // 不練默寫的軌:視同已「會寫」,別卡階段完成 / 句子複習門檻
function passRung(w) { onCorrect(w); updateBar(); nextQuestion(); } // 該技能關了 → 該階自動帶過
let lastAsked = {}, lastAskedSkill = {}, lastAskedFormatId = {}, lastFormat = null, currentSkill = null, currentFormatId = null;   // 每字上次題型 + 技能 + 全域上一題格式 → 避免連續同題型(破單調)
function ask(w) {
  if (isFresh(w)) { currentRung = 0; currentSkill = null; currentFormatId = 'teach'; lastFormat = teach; return teach(w); }       // 新字一律先教(認識)
  currentRung = 1;                                                                // 非教 → 算有產出,onCorrect 會 +mastery
  // ★ 複習主軸 = 句子:學會又默寫過的字不再單獨刷,改用「含這個字的句子」複習(creditSentence 會幫它加分 + 排 SRS)。
  //   湊不出含它的句子(還沒句型的動詞、或句型字還沒解鎖)才退回單字題。還沒學會 / 還沒默寫過的字照常走單字題(要靠單字題學起來)。
  if (isLearned(w) && wroteOk(w)) {
    const source = currentSentenceSourceWords();
    const s = sentenceWithWord(w, source) || pickBuildSentence(source);   // 優先「含這個字」的句子;還沒句型的動詞(orphan)退而求其次給一般句子(仍是句子複習、onCorrect 照樣推 SRS,不再單獨刷)。完全沒句子可組(如 stage1 功能詞還沒解鎖)才退單字題。
    if (s && !recentSentences.includes(s.text)) {   // 只在「有新句子」時走句子複習,避免連續重播剛出過的同一句
      currentSkill = 'read';
      // ★ 補考重問是用 run(ww) 呼叫 → 這裡必須存「吃單一個字」的包裝;直接存原始 askBuildSentence 會被當 sourceWords(陣列)傳進去 → sourceWords.map is not a function → 複習卡「回去答題」點了卡死。
      const runSentence = ww => {
        const src2 = currentSentenceSourceWords();
        const s2 = sentenceWithWord(ww, src2) || pickBuildSentence(src2);
        return askBuildSentence(src2, () => { onCorrect(ww); updateBar(); nextQuestion(); }, s2, () => { onWrong(ww); nextQuestion(); });
      };
      lastAsked[wordKey(w)] = runSentence; lastAskedSkill[wordKey(w)] = 'read'; lastAskedFormatId[wordKey(w)] = 'sentence_build'; currentFormatId = 'sentence_build'; lastFormat = runSentence;
      return askBuildSentence(source, () => { onCorrect(w); updateBar(); nextQuestion(); }, s, () => { onWrong(w); nextQuestion(); });
    }
  }
  let pool = FORMATS.filter(f => f.lv <= level && trackSkillOn(f.skill) && f.ok(w) && (f.tier || (f.skill === 'write' ? 3 : f.skill === 'speak' ? 2 : 1)) <= maxRungOf(w));  // 向下取 + 不超過該字上限(功能詞 maxRungOf=1 → 只認題);trackSkillOn:工作軌不出寫題
  if (!clozeReadyForDictation(w)) pool = pool.filter(f => !isHardDictationFormatId(f.id));   // 長字/第三階段字:先通過句子克漏字門檻,再出整字聽寫/默寫/看圖寫
  if (!pool.length) pool = [READPICK];                                            // 保險:至少出看中選英
  const k = wordKey(w);
  if (pool.length > 1) {                                                          // 避免連續同形式 / 同字同題型
    let alt = pool.filter(f => f.skill !== lastAskedSkill[k] && f.run !== lastAsked[k] && f.run !== lastFormat);
    if (!alt.length) alt = pool.filter(f => f.skill !== lastAskedSkill[k] && f.run !== lastFormat);
    if (!alt.length) alt = pool.filter(f => f.skill !== lastAskedSkill[k] && f.run !== lastAsked[k]);
    if (!alt.length) alt = pool.filter(f => f.run !== lastFormat);
    if (!alt.length) alt = pool.filter(f => f.run !== lastAsked[k]);
    if (alt.length) pool = alt;
  }
  // ★ 熟練度 = 出現頻率(不是 gate):靠近該字當前難度的題型抽中機率高,難的不會消失、只是變少;字越熟、難題出現越多。
  const fmtTier = f => f.tier || (f.skill === 'write' ? 3 : f.skill === 'speak' ? 2 : 1);   // 認/讀=1、說=2、寫=3;f.tier 可覆寫(句子=3)
  const target = tierOfMastery(rec(w).mastery || 0);   // 該字現在的難度階(1認 / 2說 / 3寫),跟 mastery 走
  if (!rec(w).wrote && target >= 3 && trackSkillOn('write')) {   // 只在「已練到寫階」且該軌有練寫才強制補寫;工作軌不逼默寫
    const writePool = pool.filter(f => f.skill === 'write');
    const pictureWritePool = visualOf(w) ? writePool.filter(f => f.id === 'pictype') : [];
    if (pictureWritePool.length) pool = pictureWritePool; // 有圖的字第一次硬默寫先看圖寫,避免被一般默寫抽掉
    else if (writePool.length) pool = writePool;
  }
  const wt = f => {
    // 句子題的權重也跟該字難度階走:剛學的字(認階)先練認/聽/說,別一上來就主打句子;到說階才主打排句、寫階才出句子默寫。
    let base;
    if (f.id === 'sentence_build') base = !stageHasRealWords(meta.stage || 1) ? 90 : (target >= 2 ? 40 : 7);   // 純句型階段一律主打;有實詞的階段:該字到說階才主打句子,認階先少出
    else if (f.id === 'sentence_speak') base = ((meta.stage || 1) >= 1 && target >= 2) ? 18 : 3;   // 整句跟讀是練口感,不硬卡;說階以上較常出
    else if (f.id === 'sentence_transform') base = ((meta.stage || 1) >= 2 && target >= 2) ? 20 : 4;   // 轉換題同理(說階以上才常出)
    else if (f.id === 'sentence_cloze') base = ((meta.stage || 1) >= 3 && target >= 3) ? 18 : 0;   // 句子默寫(打字補字)= 寫階才出,別對剛學的字默寫
    else if (f.id === 'category') base = target >= 2 ? 8 : 3;   // 分類題偏驗收概念,認階少量出、說階後較常混入
    else { const d = Math.abs(fmtTier(f) - target); base = d === 0 ? 3 : d === 1 ? 1 : 0.3; }
    const recipe = currentRecipe || lessonRecipeForLevel(level);
    const mul = (recipe.weights && (recipe.weights[f.id] ?? recipe.weights[f.skill])) || 1;
    return base * mul;
  };
  let weights = pool.map(wt), tot = weights.reduce((s, n) => s + n, 0), f = pool[pool.length - 1];
  if (tot <= 0) f = shuffle(pool)[0];
  else {
    let pick = Math.random() * tot;
    for (let i = 0; i < pool.length; i++) { pick -= weights[i]; if (pick <= 0) { f = pool[i]; break; } }
  }
  currentSkill = f.skill; currentFormatId = f.id;
  lastAsked[k] = f.run; lastAskedSkill[k] = f.skill; lastAskedFormatId[k] = f.id; lastFormat = f.run;
  f.run(w);
}

/* ---- 🎯 單字特訓:自選字、聽說讀寫混合、各題可「我學會了」移除(玩法層) ---- */
function startTraining(words) {
  inTraining = true; trainPool = words.slice();
  homeEl.hidden = true; screen.hidden = false;
  trainNext();
}
function trainNext() {
  if (!trainPool.length) return trainingDone();
  const w = shuffle(trainPool)[0];
  current = w; currentRung = 1; inReview = false;   // 特訓不是補考 → 答對正常加熟練度
  trainAsk(w);
}
// 特訓出題:該字適用的「聽說讀寫」題型混出(忽略關卡 lv、排除句子題=特訓練單字),避開連續同題型。
function trainAsk(w) {
  const k = wordKey(w);
  let pool = FORMATS.filter(f => !/^sentence/.test(f.id) && trackSkillOn(f.skill) && f.ok(w) && (f.tier || (f.skill === 'write' ? 3 : f.skill === 'speak' ? 2 : 1)) <= maxRungOf(w));
  if (!clozeReadyForDictation(w)) pool = pool.filter(f => !isHardDictationFormatId(f.id));   // 特訓也尊重長字/第三階段字的克漏字門檻,先不硬默寫
  if (!pool.length) pool = [READPICK];
  if (pool.length > 1) { const alt = pool.filter(f => f.run !== lastFormat); if (alt.length) pool = alt; }
  const f = shuffle(pool)[0];
  currentSkill = f.skill; currentFormatId = f.id; lastAsked[k] = f.run; lastAskedSkill[k] = f.skill; lastAskedFormatId[k] = f.id; lastFormat = f.run;
  f.run(w);
  injectTrainKnown(w);
}
// 每題塞「✓ 我學會了」鈕 → markWordKnown + 移出特訓題庫 + 下一題。
// 跟教卡「我已經會了」一致:左下固定 .sideact 大鈕(顯眼)。說題左下已有「跳過說題」→ 疊在它上面避免重疊。
function injectTrainKnown(w) {
  if (document.getElementById('trainknown')) return;
  const b = document.createElement('button');
  b.id = 'trainknown'; b.className = 'btn sideact';
  b.textContent = '✓ 我學會了,移除';
  b.onclick = () => { markWordKnown(w); trainPool = trainPool.filter(x => x.id !== w.id); trainNext(); };
  if (document.getElementById('skipspeak')) b.style.bottom = 'calc(34px + 76px)';   // 說題左下已有「跳過說題」→ 往上疊
  screen.appendChild(b);   // .sideact 是 fixed,接到 #screen 即可(下一題 shell 重繪會清掉)
}
function trainingDone() {
  inTraining = false; trainPool = [];
  screen.classList.remove('lesson-screen', 'boss-screen', 'start-screen');
  screen.classList.add('done-screen');
  screen.innerHTML = `<main class="done-panel"><div style="text-align:center;font-size:40px">🎯</div>
    <h2 style="text-align:center">特訓完成!</h2>
    <div class="sub" style="text-align:center">選的字都練過 / 標會了。</div>
    <button class="btn" id="tdmore" style="margin-top:14px">再選一批特訓 →</button>
    <button class="btn" id="tdhome" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回主畫面</button></main>`;
  $('tdmore').onclick = showTrainPicker;
  $('tdhome').onclick = showHome;
}

/* ---- 關卡面板 / 過關畫面(玩法層,之後可換成華麗地圖) ---- */
function levelProgressHTML() {
  return levelWords.map(w => `<div class="wordrow"><div class="en">${w.en}</div>
    <div class="bar"><i style="width:${pOf(w)}%"></i></div><div class="pct">${pOf(w)}%</div></div>`).join('');
}
function showStart() {
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen');
  screen.classList.add('start-screen');
  const stage = stageOfLevel(level);
  const recipe = completionRecipe(stagePendingWords(stage)) || lessonRecipeForLevel(level);
  const idx = lessonIndexInStage(level);
  const total = stageMinLevels(stage);
  // 預覽拿掉(浮動關卡 + 越來越多字後沒意義,原描述也是舊模型)→ 直接一個極簡開場
  screen.innerHTML = `<main class="start-panel"><div style="text-align:center;font-size:40px">📚</div>
    <h2 style="text-align:center">第 ${level} 關</h2>
    <div class="sub" style="text-align:center">本階第 ${idx}/${total} 關 · ${recipe.label} · 最多約 ${recipe.questions} 題</div>
    <button class="btn" id="go" style="margin-top:16px">開始 →</button>
    <button class="btn" id="backmap" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button></main>`;
  $('go').onclick = startLevel;
  $('backmap').onclick = showHome;
}
function showDone() {
  screen.classList.remove('lesson-screen', 'boss-screen', 'start-screen');
  screen.classList.add('done-screen');
  if (inRemedial) {                                                              // 舊挑戰失敗惡補流程保留作保險;optional challenge 一般不會扣進度
    inRemedial = false; sfx.done();
    screen.innerHTML = `<main class="done-panel"><div style="text-align:center;font-size:40px">💪</div>
      <h2 style="text-align:center">惡補完成!</h2>
      <div class="sub" style="text-align:center">剛剛卡住的字練過了,回去再挑戰一次。</div>
      <button class="btn" id="reboss" style="margin-top:14px">🎮 再挑戰第 ${meta.stage} 階 →</button>
      <button class="btn" id="tomap" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button></main>`;
    $('reboss').onclick = () => startChallenge(meta.stage);
    $('tomap').onclick = showHome;
    return;
  }
  const newly = levelWords.filter(isLearned);
  const playStage = stageOfLevel(level);
  const ready = playStage === (meta.stage || 1) && stageReady();
  const blocked = !ready && playStage === (meta.stage || 1) && stageDeadlineReached();
  let completedStage = null, nextLevel = null;
  if (ready) {                                                                  // 主線不再被王關卡住:階段學完就直接解鎖下一階,挑戰關變成可選獎勵。
    completedStage = meta.stage || playStage;
    nextLevel = stageDeadlineLevel(completedStage) + 1;
    meta.stage = completedStage + 1;
    meta.stageStartLevel = nextLevel;
    meta.maxLevel = Math.max(meta.maxLevel || 1, nextLevel);
    meta.bossReady = false;
    saveMeta();
  } else if (!blocked && level >= meta.maxLevel) {
    meta.maxLevel = level + 1;
    saveMeta();
  }
  sfx.done(); if (newly.length) setTimeout(() => sfx.coin(), 650);
  const sentenceWords = currentSentenceSourceWords(levelWords);
  const canBuildSentence = !!pickBuildSentence(sentenceWords);
  screen.innerHTML = `<main class="done-panel"><div style="text-align:center;font-size:40px">🎉</div>
    <h2 style="text-align:center">${ready ? `第 ${completedStage} 階完成!` : '過關!'}</h2>
    <div class="sub" style="text-align:center">這關練的字,熟練度都疊上去了:</div>
    ${levelProgressHTML()}
    ${newly.length ? `<div class="sub" style="margin-top:12px">★ <b style="color:#9bd2ff">${newly.map(w=>w.en).join(', ')}</b> 已 100% 學會,存起來——之後關卡會隨機回鍋。</div>` : ''}
    ${ready ? `<div class="sub" style="margin-top:12px;color:#6ee7a8">下一階已解鎖。旁邊的挑戰關是可選獎勵,不會擋主線。</div>` : ''}
    ${blocked ? `<div class="sub" style="margin-top:12px;color:#ffd0d6">還有字沒默寫成功過,先補完這階才會進下一階。</div>` : ''}
    ${canBuildSentence ? `<button class="btn" id="build" style="margin-top:14px;background:#0e2a1f;border-color:#1f5c3f">組句小練習 →</button>` : ''}
    ${ready ? `<button class="btn" id="challenge" style="margin-top:14px;background:#2a0e12;border-color:#e35b6a">🎮 玩第 ${completedStage} 階挑戰關</button>` : ''}
    <button class="btn" id="next" style="margin-top:${ready ? 10 : 14}px${ready ? ';background:#1d2c3a;border-color:#2c3e52' : ''}">${ready ? `前往第 ${nextLevel} 關 →` : blocked ? '補默寫 →' : '下一關 →'}</button>
    <button class="btn" id="tomap" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回地圖</button></main>`;
  if (canBuildSentence) $('build').onclick = () => askBuildSentence(sentenceWords, showDone);
  if ($('challenge')) $('challenge').onclick = () => startChallenge(completedStage);
  $('next').onclick = () => {
    if (ready) { level = nextLevel; return showStart(); }
    if (blocked) return showStart();
    level++; if (level > meta.maxLevel) { meta.maxLevel = level; saveMeta(); } showStart();
  };
  $('tomap').onclick = showHome;
}

/* ---- Boss 戰(第一支王;戰鬥邏輯獨立,觸發點之後可移到任何章末) ---- */
