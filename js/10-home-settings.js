const homeEl = document.getElementById('home');
const bossLevelForStage = stage => defaultStageStartLevel(stage) + stageMinLevels(stage) - 1;
const challengeCleared = stage => !!(meta.challengeCleared && meta.challengeCleared[stage]);
const latestChallengeStage = () => Math.max(0, (meta.stage || 1) - 1);
function homeStageSummary() {
  const lv = Math.max(1, meta.maxLevel || 1);
  const stage = typeof stageOfLevel === 'function' ? stageOfLevel(lv) : (meta.stage || 1);
  const stageStart = defaultStageStartLevel(stage);
  const stageSize = Math.max(1, stageMinLevels(stage) || 5);
  const stageEnd = stageStart + stageSize - 1;
  const step = Math.max(1, Math.min(stageSize, lv - stageStart + 1));
  const pct = Math.round(step / stageSize * 100);
  const recipe = typeof lessonRecipeForLevel === 'function' ? lessonRecipeForLevel(lv) : null;
  const orderedStageWords = (Array.isArray(LEARN_ORDER) && typeof batchOf === 'function')
    ? LEARN_ORDER.filter(w => w && w.pos !== 'function' && batchOf(w) === stage - 1)
    : [];
  const words = (orderedStageWords.length ? orderedStageWords : (typeof stageWordsFor === 'function' ? stageWordsFor(stage) : BANK))
    .filter(w => w && w.pos !== 'function');
  const topic = words.slice(0, 4).map(w => w.zh || w.en).join('・') || (currentTrack === 'work' ? '職場高頻' : '高頻日常');
  const keyOf = typeof wordKey === 'function' ? wordKey : w => w.id || w.en;
  const learnedAt = typeof LEARNED === 'number' ? LEARNED : 100;
  const stat = w => store[keyOf(w)] || {};
  const allWords = BANK.filter(w => w && w.pos !== 'function');
  const touched = allWords.filter(w => stat(w).taught).length;
  const learned = allWords.filter(w => (stat(w).mastery || 0) >= learnedAt).length;
  const weak = allWords.filter(w => stat(w).taught && (stat(w).mastery || 0) < learnedAt).length;
  return {
    lv, stage, stageStart, stageEnd, stageSize, step, pct, topic,
    nextLabel: recipe && recipe.label ? recipe.label : '下一關',
    trackLabel: currentTrack === 'work' ? '工作英文' : '日常單字',
    trackSub: currentTrack === 'work' ? '工作英文・職場高頻' : '日常單字・高頻日常',
    touched, learned, weak, wordTotal: allWords.length
  };
}
function mapSVG() {
  const total = meta.maxLevel + 2;                       // 已解鎖 + 下一關 + 2 個鎖著
  const W = 720, compact = total <= 8, mid = total <= 14;
  const pad = compact ? 38 : mid ? 52 : 70;
  const gap = compact ? 66 : mid ? 78 : 96;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const pt = i => {
    const drift = Math.sin(i * 0.94 - 1.05) * (compact ? 94 : 126) + Math.sin(i * 0.41 + 0.55) * (compact ? 42 : 62) + (Math.floor(i / 5) % 2 ? -30 : 30);
    return { x: Math.round(clamp(W / 2 + drift, W * 0.2, W * 0.8)), y: pad + i * gap };
  };
  const pts = Array.from({ length: total }, (_, i) => pt(i));
  const curvePath = points => {
    if (!points.length) return '';
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], dy = (b.y - a.y) * 0.46;
      d += ` C${a.x} ${Math.round(a.y + dy)} ${b.x} ${Math.round(b.y - dy)} ${b.x} ${b.y}`;
    }
    return d;
  };
  let path = '', circles = '', bossLines = '', bossNodes = '';
  path = curvePath(pts);
  const donePath = curvePath(pts.slice(0, Math.max(1, Math.min(meta.maxLevel, total))));
  const H = pad + (total-1)*gap + pad;
  let stageBackdrops = '';
  for (let stg = 1, guard = 0; guard < 30; stg++, guard++) {
    const start = defaultStageStartLevel(stg);
    if (start > total) break;
    const len = Math.max(1, stageMinLevels(stg) || 5);
    const end = Math.min(total, start + len - 1);
    const seg = pts.slice(start - 1, end);
    if (!seg.length) continue;
    const y1 = Math.max(10, seg[0].y - (compact ? 34 : 48));
    const y2 = Math.min(H - 10, seg[seg.length - 1].y + (compact ? 34 : 48));
    const isActive = meta.maxLevel >= start && meta.maxLevel <= end;
    const isDone = meta.maxLevel > end;
    const fill = stg % 2 ? '#0f2230' : '#10251f';
    const stroke = isActive ? '#31516a' : isDone ? '#1d4b3e' : '#26384a';
    const opacity = isActive ? .68 : isDone ? .54 : .38;
    const labelX = stg % 2 ? W - 116 : 116;
    const contourX = stg % 2 ? 88 : W - 246;
    stageBackdrops += `<g opacity="${opacity}">
      <rect x="76" y="${Math.round(y1)}" width="${W - 152}" height="${Math.round(y2 - y1)}" rx="30" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <path d="M${contourX} ${Math.round(y1 + 34)} C${contourX + 54} ${Math.round(y1 + 16)} ${contourX + 132} ${Math.round(y1 + 22)} ${contourX + 184} ${Math.round(y1 + 4)}" fill="none" stroke="#6f8398" stroke-width="2" opacity=".22"/>
      <path d="M${contourX - 24} ${Math.round(y2 - 34)} C${contourX + 44} ${Math.round(y2 - 66)} ${contourX + 116} ${Math.round(y2 - 42)} ${contourX + 194} ${Math.round(y2 - 72)}" fill="none" stroke="#6f8398" stroke-width="2" opacity=".18"/>
      <circle cx="${labelX}" cy="${Math.round(y1 + 42)}" r="14" fill="#6f8398" opacity=".12"/>
      <path d="M${labelX - 18} ${Math.round(y1 + 60)}h36" stroke="#6f8398" stroke-width="3" stroke-linecap="round" opacity=".18"/>
      <path d="M108 ${Math.round(y2)}H612" stroke="#6f8398" stroke-width="1.5" stroke-dasharray="2 12" stroke-linecap="round" opacity=".16"/>
    </g>`;
  }
  for (let i = 0; i < total; i++) {
    const lv = i + 1, p = pts[i];
    const st = lv < meta.maxLevel ? 'done' : lv === meta.maxLevel ? 'cur' : 'lock';
    const fill = st==='done'?'#0e2a1f':st==='cur'?'#2563eb':'#16202c';
    const stroke = st==='done'?'#2ecc8f':st==='cur'?'#5aa9ff':'#2c3e52';
    const tc = st==='lock'?'#5f7488':st==='cur'?'#fff':'#6ee7a8';
    const r = st==='cur'?38:32, cur = st==='lock'?'default':'pointer';
    circles += `<circle class="mapnode" data-lv="${lv}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3.5" style="cursor:${cur}"/>`
      + `<text x="${p.x}" y="${p.y+10}" text-anchor="middle" font-size="27" font-weight="700" fill="${tc}" style="pointer-events:none">${lv}</text>`;
  }
  for (let stage = 1; stage <= latestChallengeStage(); stage++) {
    const cleared = challengeCleared(stage);
    const lv = bossLevelForStage(stage);
    if (lv > total) continue;
    const p = pts[lv - 1];
    const bx = p.x < W / 2 ? p.x + 92 : p.x - 92;
    const by = p.y;
    const fill = cleared ? '#172713' : '#2a0e12';
    const stroke = cleared ? '#f7c948' : '#e35b6a';
    const tc = cleared ? '#ffe08a' : '#ffd0d6';
    bossLines += `<line x1="${p.x}" y1="${p.y}" x2="${bx}" y2="${by}" stroke="${stroke}" stroke-width="3" stroke-dasharray="3 8" stroke-linecap="round" opacity=".75"/>`;
    bossNodes += `<circle class="mapboss" data-boss-stage="${stage}" data-cleared="${cleared ? 1 : 0}" cx="${bx}" cy="${by}" r="28" fill="${fill}" stroke="${stroke}" stroke-width="3.5" style="cursor:pointer"/>`
      + `<text x="${bx}" y="${by+9}" text-anchor="middle" font-size="${cleared ? 22 : 18}" font-weight="800" fill="${tc}" style="pointer-events:none">${cleared ? '✓' : '挑'}</text>`;
  }
  const mapBgId = `mapgrid-${total}-${meta.maxLevel}`;
  const trail = `<defs>
      <pattern id="${mapBgId}" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M64 0H0V64" fill="none" stroke="#243343" stroke-width="1" opacity=".42"/>
      </pattern>
    </defs>
    <rect x="34" y="18" width="${W - 68}" height="${H - 36}" rx="34" fill="url(#${mapBgId})" opacity=".08"/>
    ${stageBackdrops}
    <path d="${path}" fill="none" stroke="#23384d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>
    ${meta.maxLevel > 1 ? `<path d="${donePath}" fill="none" stroke="#155946" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".68"/>` : ''}
    <path d="${path}" fill="none" stroke="#48637e" stroke-width="4" stroke-dasharray="3 16" stroke-linecap="round" opacity=".72"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${trail}${bossLines}${circles}${bossNodes}</svg>`;
}
function showHome() {
  inTraining = false;                    // 從任何地方回主畫面都結束特訓
  normalizeBossGate();
  const homeInfo = homeStageSummary();
  const challengeText = latestChallengeStage() ? `第 ${latestChallengeStage()} 階可回看` : '本階完成後開放';
  const trainText = homeInfo.weak ? `${homeInfo.weak} 個字待加強` : (homeInfo.touched ? '目前沒有弱字' : (homeInfo.lv > 1 ? '可自選複習' : '先開始第一關'));
  const derivText = meta.coins >= 30 ? '金幣足夠' : `還差 ${Math.max(0, 30 - (meta.coins || 0))} 枚`;
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen', 'start-screen');
  screen.hidden = true; homeEl.hidden = false;
  screen.innerHTML = '';
  homeEl.innerHTML = `
    <div class="topbar">
      <div class="logo">讓英文有道理</div>
      <div style="display:flex;align-items:center;gap:10px">
        <button id="settingsbtn" aria-label="設定" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 12px;cursor:pointer;font-size:16px;display:inline-flex;align-items:center">${ICON.gear}</button>
        <button id="bgmtoggle" aria-label="靜音開關" title="靜音開關" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 12px;cursor:pointer;font-size:16px;display:inline-flex;align-items:center">${bgm.isOn() ? ICON.play : ICON.mute}</button>
        <button id="musicbtn" title="背景音樂" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 13px;cursor:pointer;display:inline-flex;align-items:center"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z"/></svg></button>
        <button id="reset" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 15px;cursor:pointer;font-size:14px;display:inline-flex;align-items:center">${ICON.refresh}重來</button>
        <div class="coin">${ICON.coin}${meta.coins}</div>
      </div>
    </div>
    <div class="homebody">
      <div class="side">
        <div class="cat" id="catChallenge"><div class="cati">${ICON.flag}</div><div class="cat-title">小遊戲</div><div class="catcoin">${challengeText}</div><div class="catnote">⚔ 王戰挑戰 · 純娛樂</div></div>
        <div class="cat" id="catTrain"><div class="cati">${ICON.target}</div><div class="cat-title">單字特訓</div><div class="catcoin">${trainText}</div><div class="catnote">${homeInfo.learned}/${homeInfo.wordTotal} 字穩了</div></div>
        <div class="cat" id="catDeriv"><div class="cati">${ICON.lock}</div><div class="cat-title">衍生</div><div class="catcoin">${derivText}</div><div class="catnote">需 30 ${ICON.coin}</div></div>
        <div class="cat ph"><div class="cati">⋯</div><div class="cat-title">之後</div><div class="catnote">新模式預留</div></div>
      </div>
      <div class="map">
        <div class="map-brief">
          <div>
            <div class="maptitle">${homeInfo.trackSub}</div>
            <div class="maptopic">第 ${homeInfo.stage} 階・${homeInfo.topic}</div>
          </div>
          <div class="map-progress">
            <div class="map-progress-row"><span>本階 ${homeInfo.step}/${homeInfo.stageSize}</span><b>${homeInfo.pct}%</b></div>
            <div class="map-progress-bar"><i style="width:${homeInfo.pct}%"></i></div>
          </div>
        </div>
        <div class="mapjump" id="mapjump">
          <div class="branch-tabs">
            <button class="branch-tab ${currentTrack === 'work' ? '' : 'cur'}" id="dailybranch">${ICON.book}日常單字</button>
            <button class="branch-tab ${currentTrack === 'work' ? 'cur' : ''}" id="workbranch">${ICON.briefcase}工作英文</button>
          </div>
          <div class="map-lesson-meta">
            <span>${homeInfo.nextLabel}</span>
            <span>第 ${homeInfo.lv} 關</span>
            <span>${homeInfo.learned}/${homeInfo.wordTotal} 字穩定</span>
          </div>
          <div class="map-status-row" id="mapstatus"></div>
        </div>
        <div class="mapscroll" id="mapscroll" style="--map-levels:${meta.maxLevel + 2}">${mapSVG()}</div>
        <button class="map-float-jump" id="mapfloatjump" aria-label="回到目前關" title="回到目前關" hidden>${ICON.arrowDown}</button>
      </div>
    </div>`;
  document.getElementById('bgmtoggle').innerHTML = bgm.isOn() ? ICON.play : ICON.mute;
  document.getElementById('settingsbtn').onclick = showSettings;
  document.getElementById('musicbtn').onclick = showMusic;
  document.getElementById('bgmtoggle').onclick = () => { const playing = bgm.toggle(); meta.bgm = playing; saveMeta(); document.getElementById('bgmtoggle').innerHTML = playing ? ICON.play : ICON.mute; };
  document.getElementById('reset').onclick = () => {
    if (confirm('清掉所有學習進度(日常 + 工作),從第 1 關重新開始?')) {
      for (const k in store) delete store[k]; localStorage.removeItem('eng_progress_v2');
      localStorage.removeItem('work_progress_v1'); localStorage.removeItem('work_clock_v1');   // 順手清掉舊工作引擎殘留
      meta.coins = 0; meta.skills = {}; meta.tracks = {};                                       // 清所有軌進度
      currentTrack = 'daily'; applyTrackContent('daily');                                       // 回日常軌內容
      meta.maxLevel = 1; meta.stage = 1; meta.stageStartLevel = 1; meta.clock = 0; meta.bossReady = false; meta.bossCleared = false; meta.challengeCleared = {};
      saveMeta(); level = 1; showHome();
    }
  };
  document.getElementById('catChallenge').onclick = showMinigames;   // 側欄「小遊戲」→ 開小遊戲 hub(王戰挑戰);原本捲地圖到王節點的行為由 hub 取代
  document.getElementById('catTrain').onclick = showTrainPicker;
  document.getElementById('catDeriv').onclick = () => { homeEl.querySelector('#catDeriv .catcoin').textContent = '金幣不夠,之後開放'; };
  homeEl.querySelectorAll('.mapnode').forEach(c => { const lv = +c.dataset.lv; if (lv <= meta.maxLevel) c.onclick = () => enterLevel(lv); });
  homeEl.querySelectorAll('.mapboss').forEach(c => {
    const stage = +c.dataset.bossStage;
    const cleared = c.dataset.cleared === '1';
    c.onclick = () => startChallenge(stage);
  });
  // 關卡鏡頭:固定視窗 + 進場置中在目前關 + 滑鼠/觸控捲動 + 王快捷
  const mapscroll = document.getElementById('mapscroll'), mapsvg = mapscroll && mapscroll.querySelector('svg');
  const mapFloatJump = document.getElementById('mapfloatjump');
  const currentMapY = () => {
    const node = mapsvg && mapsvg.querySelector(`.mapnode[data-lv="${meta.maxLevel}"]`);
    if (!mapscroll || !mapsvg || !node) return null;
    const scale = mapsvg.getBoundingClientRect().height / (mapsvg.viewBox.baseVal.height || 1);
    return (+node.getAttribute('cy')) * scale;
  };
  const updateMapFloatJump = () => {
    if (!mapscroll || !mapFloatJump) return;
    const y = currentMapY();
    if (y === null) { mapFloatJump.hidden = true; return; }
    const top = mapscroll.scrollTop, bottom = top + mapscroll.clientHeight;
    const pad = Math.min(88, Math.max(42, mapscroll.clientHeight * .16));
    const dir = y < top + pad ? 'up' : (y > bottom - pad ? 'down' : '');
    mapFloatJump.hidden = !dir;
    if (!dir) return;
    mapFloatJump.dataset.dir = dir;
    mapFloatJump.innerHTML = dir === 'up' ? ICON.arrowUp : ICON.arrowDown;
    const label = dir === 'up' ? '回到上方的目前關' : '回到下方的目前關';
    mapFloatJump.setAttribute('aria-label', label);
    mapFloatJump.title = label;
  };
  const scrollToLv = (lv, smooth) => {
    const node = mapsvg && mapsvg.querySelector(`.mapnode[data-lv="${lv}"]`);
    if (!mapscroll || !node) return;
    const scale = mapsvg.getBoundingClientRect().height / (mapsvg.viewBox.baseVal.height || 1);
    mapscroll.scrollTo({ top: Math.max(0, (+node.getAttribute('cy')) * scale - mapscroll.clientHeight / 2), behavior: smooth ? 'smooth' : 'auto' });
    requestAnimationFrame(updateMapFloatJump);
  };
  if (mapFloatJump) mapFloatJump.onclick = () => scrollToLv(meta.maxLevel, true);
  if (mapscroll) mapscroll.addEventListener('scroll', updateMapFloatJump, { passive: true });
  scrollToLv(meta.maxLevel, false);                                  // 同步置中(讀 getBoundingClientRect 會強制排版,拿得到真實尺寸)
  requestAnimationFrame(() => { scrollToLv(meta.maxLevel, false); updateMapFloatJump(); });     // 保險:萬一同步時尺寸還沒到位,下一幀再置中
  const jump = document.getElementById('mapjump');
  if (jump) {
    const status = $('mapstatus');
    let h = `<button class="cur map-primary-start" data-start="${meta.maxLevel}">開始 · 第 ${meta.maxLevel} 關</button>`;
    if (latestChallengeStage()) h += `<button id="jumpboss">挑戰關 · 第 ${latestChallengeStage()} 階</button>`;
    if (status) status.innerHTML = h;
    $('dailybranch').onclick = () => { setTrack('daily'); showHome(); };
    $('workbranch').onclick = () => { setTrack('work'); showHome(); };
    jump.querySelectorAll('button[data-start]').forEach(btn => btn.onclick = () => enterLevel(+btn.dataset.start));
    jump.querySelectorAll('button[data-jump]').forEach(btn => btn.onclick = () => scrollToLv(+btn.dataset.jump, true));
    if ($('jumpboss')) $('jumpboss').onclick = () => scrollToLv(bossLevelForStage(latestChallengeStage()), true);
  }
}
function enterLevel(lv) {
  level = lv; homeEl.hidden = true; screen.hidden = false;
  showStart();
}
// 🎯 單字特訓:自選教過的字 → 聽說讀寫混合練。兩模式:「還不會」練到會(滿100畢業)/「已學會」複習(不畢業,靠「移除」退出)。見 js/08 trainNext / startTraining。
function showTrainPicker() {
  inTraining = false;
  homeEl.hidden = true; screen.hidden = false;
  screen.className = 'card'; screen.innerHTML = '';
  const review = trainMode === 'review';
  const words = review
    ? BANK.filter(w => w.pos !== 'function' && wordIsTaught(w) && isLearned(w)).sort((a, b) => (rec(a).due || 0) - (rec(b).due || 0))    // 已學會:最該複習(due 最早/最過期)的排前面
    : BANK.filter(w => w.pos !== 'function' && wordIsTaught(w) && !isLearned(w)).sort((a, b) => pOf(a) - pOf(b));                          // 還不會:弱的排前面
  const pill = (m, label) => `<button class="tmode" data-m="${m}" style="padding:6px 18px;border-radius:16px;border:1px solid #2c3e52;font-weight:700;color:#e8eef5;background:${(trainMode === m) ? '#2b6cb0' : 'transparent'}">${label}</button>`;
  const modeTabs = `<div id="tmodes" style="display:flex;gap:8px;justify-content:center;margin:8px 0 4px">${pill('weak', '還不會')}${pill('review', '已學會')}</div>`;
  const wireModes = () => $('tmodes').querySelectorAll('.tmode').forEach(b => b.onclick = () => { trainMode = b.dataset.m; showTrainPicker(); });
  if (!words.length) {
    screen.innerHTML = `<main class="train-pick"><div style="text-align:center;font-size:40px">🎯</div>
      <h2 style="text-align:center">單字特訓</h2>${modeTabs}
      <div class="sub" style="text-align:center;margin-top:8px">${review ? '還沒有「學會」的字可以複習 —— 先把字練到 100% 再回來這裡保持手感。' : '目前沒有需要加強的字 —— 教過的都 100% 了(去「已學會」可以複習),弱掉的字之後也會出現在這。'}</div>
      <button class="btn" id="tback" style="margin-top:14px;background:#1d2c3a;border-color:#2c3e52">← 回主畫面</button></main>`;
    wireModes(); $('tback').onclick = showHome; return;
  }
  const sel = new Set();
  const SKILLS = [['all','混合'],['listen','聽'],['read','讀'],['speak','說'],['write','寫']];
  screen.innerHTML = `<main class="train-pick">
    <div style="text-align:center;font-size:40px">🎯</div>
    <h2 style="text-align:center">單字特訓</h2>${modeTabs}
    <div class="sub" style="text-align:center">${review ? '挑學會但想保持/常搞混的字(該複習的排前面)+ 技能 → 練夠了點「✓ 移除」。' : '挑想加強的字(弱的排前面)+ 想練的技能 → 練到會了點「✓ 學會」移除。'}</div>
    <div class="train-skills" id="tskills">${SKILLS.map(([sk,label]) => `<button class="tskill" data-sk="${sk}">${label}</button>`).join('')}</div>
    <div class="train-words" id="twords"></div>
    <button class="btn train-start" id="tstart" disabled>先選幾個字</button>
    <button class="btn" id="tback" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回主畫面</button>
  </main>`;
  wireModes();
  // 技能可複選:「混合」= 清空(= 全部);點各技能 toggle 加入/移除。空集合視為混合。
  const syncSkills = () => $('tskills').querySelectorAll('.tskill').forEach(b => b.classList.toggle('sel', b.dataset.sk === 'all' ? trainSkills.size === 0 : trainSkills.has(b.dataset.sk)));
  $('tskills').querySelectorAll('.tskill').forEach(btn => btn.onclick = () => {
    const sk = btn.dataset.sk;
    if (sk === 'all') trainSkills.clear();
    else if (trainSkills.has(sk)) trainSkills.delete(sk); else trainSkills.add(sk);
    syncSkills();
  });
  syncSkills();
  const box = $('twords');
  words.forEach(w => {
    const el = document.createElement('button');
    el.className = 'twordchip'; el.dataset.id = w.id;
    el.innerHTML = `<b>${w.en}</b> <span class="tzh">${w.zh}</span> ${review ? '<span class="tpct">會</span>' : `<span class="tpct">${pOf(w)}%</span>`}`;
    el.onclick = () => {
      if (sel.has(w)) { sel.delete(w); el.classList.remove('sel'); }
      else { sel.add(w); el.classList.add('sel'); }
      const n = sel.size;
      $('tstart').disabled = !n;
      $('tstart').textContent = n ? `開始${review ? '複習' : '特訓'} ${n} 個字 →` : '先選幾個字';
    };
    box.appendChild(el);
  });
  $('tstart').onclick = () => { if (sel.size) startTraining([...sel], trainMode); };
  $('tback').onclick = showHome;
}

// 🎮 小遊戲:用學過的字玩的可選挑戰(不影響學習進度)。第一款=王戰(挑完成過的任一階);之後可再加別的遊戲。
function showMinigames() {
  inTraining = false;
  homeEl.hidden = true; screen.hidden = false;
  screen.className = 'card'; screen.innerHTML = '';
  const maxStage = latestChallengeStage();
  const stages = []; for (let s = 1; s <= maxStage; s++) stages.push(s);
  const bossList = stages.length
    ? stages.map(s => `<button class="mgstage" data-stage="${s}" style="width:100%;text-align:left;padding:12px 16px;border-radius:12px;border:1px solid #3a2c1d;background:#1d1710;color:#e8eef5;font-size:17px;font-weight:600">⚔ 第 ${s} 階王戰${challengeCleared(s) ? ' <span style="color:#6ee7a8;font-weight:400">✓ 已通關</span>' : ''}</button>`).join('')
    : `<div class="sub2" style="text-align:center;color:#9fb4c8;padding:10px">先完成第 1 階(把那批字學會)→ 王戰就會開放。</div>`;
  screen.innerHTML = `<main class="train-pick">
    <div style="text-align:center;font-size:40px">🎮</div>
    <h2 style="text-align:center">小遊戲</h2>
    <div class="sub" style="text-align:center">用學過的字玩的挑戰 —— 純娛樂 + 賺金幣,不影響學習進度。</div>
    <div style="background:#14202e;border:1px solid #26384a;border-radius:14px;padding:14px 16px;margin-top:6px">
      <div style="font-weight:800;font-size:18px">⚔ 王戰挑戰</div>
      <div class="sub2" style="margin:2px 0 12px">限時答題打倒關主,挑你完成過的任一階。</div>
      <div id="mgstages" style="display:grid;gap:8px">${bossList}</div>
    </div>
    <div style="text-align:center;color:#5f7488;margin-top:14px;font-size:15px">更多小遊戲開發中…</div>
    <button class="btn" id="mgback" style="margin-top:14px;background:#1d2c3a;border-color:#2c3e52">← 回主畫面</button>
  </main>`;
  screen.querySelectorAll('.mgstage').forEach(b => b.onclick = () => startChallenge(+b.dataset.stage));
  $('mgback').onclick = showHome;
}
function showSettings() {
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen', 'start-screen');
  homeEl.hidden = true; screen.hidden = false;
  const sk = meta.skills || {};
  const row = (key, label, desc) => `
    <div class="cat" style="display:flex;justify-content:space-between;align-items:center;margin:0" data-skill="${key}">
      <div><div style="font-weight:500;font-size:16px">${label}</div><div style="font-size:12px;color:#9fb4c8;margin-top:2px">${desc}</div></div>
      <div style="font-size:24px">${sk[key] === false ? '⬜' : '✅'}</div>
    </div>`;
  screen.innerHTML = `<h2>設定</h2>
    <div class="sub">要練哪些(關掉的技能對應題型就不出現,預設全開)</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${row('listen','聽','聽發音 → 選 / 拼')}
      ${row('read','讀','看字 / 圖 → 選')}
      ${row('speak','說','開口念(要麥克風)')}
      ${row('write','寫','聽寫 / 默寫 / 音節填空')}
    </div>
    <button class="btn" id="setback" style="margin-top:16px">← 回主畫面</button>`;
  screen.querySelectorAll('[data-skill]').forEach(el => {
    el.onclick = () => { const k = el.dataset.skill; meta.skills = meta.skills || {}; meta.skills[k] = meta.skills[k] === false; saveMeta(); showSettings(); };
  });
  $('setback').onclick = showHome;
}
// 背景音樂選曲(從設定獨立出來,主畫面那顆音符按鈕進來)
function showMusic() {
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen', 'start-screen');
  homeEl.hidden = true; screen.hidden = false;
  const bt = meta.bgmTrack || 0;
  const trackRows = BGM_TRACKS.map((t, idx) => `
    <div class="cat" style="display:flex;justify-content:space-between;align-items:center;margin:0" data-track="${idx}">
      <span>${t.name}</span><span style="font-size:20px">${idx === bt ? '🔘' : '⚪'}</span>
    </div>`).join('');
  screen.innerHTML = `<h2>背景音樂</h2>
    <div class="sub">選一首你放在 audio/ 的 mp3。音檔不存在就不播放,不再用合成音頂替。開關在主畫面的 🔊。</div>
    <div style="display:flex;flex-direction:column;gap:8px">${trackRows}</div>
    <button class="btn" id="musicback" style="margin-top:16px">← 回主畫面</button>`;
  screen.querySelectorAll('[data-track]').forEach(el => {
    el.onclick = () => { bgm.setTrack(+el.dataset.track); showMusic(); };
  });
  $('musicback').onclick = showHome;
}

// 點任何按鈕 / 選項都來個輕「嗒」聲(UI 回饋;事件委派,不用每個按鈕手動接)
document.addEventListener('click', e => { if (e.target.closest('button, .opt, .cat, .mapnode, .mapboss')) sfx.tap(); }, true);
