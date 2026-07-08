const homeEl = document.getElementById('home');
const bossLevelForStage = stage => defaultStageStartLevel(stage) + stageMinLevels(stage) - 1;
const challengeCleared = stage => !!(meta.challengeCleared && meta.challengeCleared[stage]);
const latestChallengeStage = () => Math.max(0, (meta.stage || 1) - 1);
const homeEsc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
function homeStageWords(stage) {
  const orderedStageWords = (Array.isArray(LEARN_ORDER) && typeof batchOf === 'function')
    ? LEARN_ORDER.filter(w => w && w.pos !== 'function' && batchOf(w) === stage - 1)
    : [];
  return (orderedStageWords.length ? orderedStageWords : (typeof stageWordsFor === 'function' ? stageWordsFor(stage) : BANK))
    .filter(w => w && w.pos !== 'function');
}
function homeTopicType(w) {
  const raw = `${w?.id || ''} ${w?.en || w || ''} ${w?.zh || ''}`.toLowerCase();
  if (/water|水/.test(raw)) return 'water';
  if (/coffee|咖啡/.test(raw)) return 'coffee';
  if (/tea|茶/.test(raw)) return 'tea';
  if (/sugar|糖/.test(raw)) return 'sugar';
  if (/home|house|家|房/.test(raw)) return 'home';
  return 'word';
}
function homeTopicIcon(type) {
  const icon = {
    water: '<path d="M12 3.5C8.7 7.6 6.4 10.7 6.4 14a5.6 5.6 0 0 0 11.2 0C17.6 10.7 15.3 7.6 12 3.5Z"/><path d="M9.4 14.4c.4 1.4 1.5 2.2 3 2.2"/>',
    tea: '<path d="M6.8 9.2h9.1v4.2a4 4 0 0 1-4 4H9.8a3 3 0 0 1-3-3V9.2Z"/><path d="M15.9 10.6h1.3a1.7 1.7 0 0 1 0 3.4h-1.3"/><path d="M8.8 5.3c-.8.8-.8 1.6 0 2.4M12 4.8c-.8.8-.8 1.7 0 2.5M15.1 5.3c-.8.8-.8 1.6 0 2.4"/>',
    coffee: '<path d="M5.8 8.8h10.4v4.6a4.4 4.4 0 0 1-4.4 4.4H10a4.2 4.2 0 0 1-4.2-4.2V8.8Z"/><path d="M16.2 10.3h1.2a1.9 1.9 0 0 1 0 3.8h-1.2"/><path d="M7.3 19h9.1M9 5.1c-.6.7-.6 1.3 0 2M12 4.6c-.6.7-.6 1.5 0 2.1"/>',
    sugar: '<path d="M12 4.4 18 8v8l-6 3.6L6 16V8l6-3.6Z"/><path d="m6.5 8.2 5.5 3.2 5.5-3.2M12 11.4v7.5"/>',
    home: '<path d="M4.5 11.2 12 5l7.5 6.2"/><path d="M6.7 10.2v8.3h10.6v-8.3"/><path d="M10 18.5v-4.4h4v4.4"/>',
    word: '<path d="M6 7.5h12M6 12h9M6 16.5h7"/>',
  }[type] || '';
  return `<svg class="unit-ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
}
function homeTopicChips(words) {
  const count = words.length;
  if (!count) return '';
  const zhPreview = words.slice(0, 6).map(w => w.zh || w.en).filter(Boolean).join('、');
  const glueText = count > 4 ? '混合應用組' : '基礎主題組';
  return `<span class="unit-chip unit-summary" title="${homeEsc(zhPreview)}">${ICON.target}<span>${count} 個主題字</span></span>
    <span class="unit-chip unit-summary unit-summary-soft"><span>${homeEsc(glueText)}</span></span>`;
}
function mapThemeIcon(type, x, y, label, dim, width = 174, height = 48) {
  const stroke = { water:'#77cdf2', tea:'#d9b56b', coffee:'#b98561', sugar:'#eee4bf', home:'#9ed0a3', word:'#8fa5b9' }[type] || '#8fa5b9';
  const fill = { water:'#12364b', tea:'#332813', coffee:'#352315', sugar:'#343120', home:'#1d3426', word:'#18293a' }[type] || '#18293a';
  const name = homeEsc(label);
  const left = Math.round(-width / 2);
  const top = Math.round(-height / 2);
  const fontSize = height >= 48 ? 16 : 15;
  return `<g class="map-theme map-theme-${type}" transform="translate(${Math.round(x)} ${Math.round(y)})" opacity="${dim ? .54 : .96}">
    <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="${Math.round(height / 2)}" fill="${fill}" stroke="${stroke}" stroke-width="1.7"/>
    <g color="${stroke}" transform="translate(${left + 13} ${top + 10}) scale(1.02)">${homeTopicIcon(type).replace('class="unit-ico"', 'class="unit-ico map-unit-ico"')}</g>
    <text x="${left + 50}" y="7" text-anchor="start" font-size="${fontSize}" font-weight="900" fill="${stroke}" opacity=".94">${name}</text>
  </g>`;
}
function mapTopicCluster(words, x, y, dim, ax, ay, accent, compact, side = 1) {
  const items = words.slice(0, 6).filter(Boolean);
  if (!items.length) return '';
  const badgeH = compact ? 48 : 50;
  const baseW = compact ? 168 : 184;
  const rows = Math.ceil(items.length / 2);
  const rowGap = compact ? 56 : 58;
  const colGap = compact ? 186 : 208;
  const nearOffset = items.length > 4 ? (compact ? 160 : 172) : (compact ? 92 : 106);
  const topY = -((rows - 1) * rowGap) / 2;
  const loose = items.map((_, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const inner = side * (nearOffset + col * colGap);
    return { x: inner, y: topY + row * rowGap + (col ? 12 : -8) };
  });
  const stem = Number.isFinite(ax) && Number.isFinite(ay)
    ? `<path d="M${Math.round(ax)} ${Math.round(ay)} C${Math.round((ax + x) / 2)} ${Math.round(ay)} ${Math.round((ax + x) / 2)} ${Math.round(y)} ${Math.round(x)} ${Math.round(y)}" fill="none" stroke="${accent}" stroke-width="2.2" stroke-dasharray="4 10" stroke-linecap="round" opacity="${dim ? .18 : .3}"/>
       <circle cx="${Math.round(ax)}" cy="${Math.round(ay)}" r="5" fill="${accent}" opacity="${dim ? .18 : .32}"/>`
    : '';
  const badges = items.map((w, idx) => {
    const label = `${w.zh || ''}${w.zh && w.en ? ' ' : ''}${w.en || ''}` || (w.id || '');
    const type = homeTopicType(w);
    const badgeW = baseW + (type === 'coffee' ? 22 : type === 'sugar' ? 10 : 0);
    const p = loose[idx] || { x:0, y:idx * (badgeH + 8) };
    return mapThemeIcon(type, x + p.x, y + p.y, label, dim, badgeW, badgeH);
  }).join('');
  return `<g class="map-topic-cluster">${stem}${badges}</g>`;
}
function homeStageSummary() {
  const lv = Math.max(1, meta.maxLevel || 1);
  const stage = typeof stageOfLevel === 'function' ? stageOfLevel(lv) : (meta.stage || 1);
  const stageStart = defaultStageStartLevel(stage);
  const stageSize = Math.max(1, stageMinLevels(stage) || 5);
  const stageEnd = stageStart + stageSize - 1;
  const step = Math.max(1, Math.min(stageSize, lv - stageStart + 1));
  const pct = Math.round(step / stageSize * 100);
  const recipe = typeof lessonRecipeForLevel === 'function' ? lessonRecipeForLevel(lv) : null;
  const words = homeStageWords(stage);
  const topic = words.slice(0, 6).map(w => w.zh || w.en).join('・') || (currentTrack === 'work' ? '職場高頻' : '高頻日常');
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
    topicWords: words.slice(0, 6),
    trackLabel: currentTrack === 'work' ? '工作英文' : '日常單字',
    trackSub: currentTrack === 'work' ? '工作英文・職場高頻' : '日常單字・高頻日常',
    touched, learned, weak, wordTotal: allWords.length
  };
}
function mapSVG() {
  const total = meta.maxLevel + 2;                       // 已解鎖 + 下一關 + 2 個鎖著
  const W = 960, compact = total <= 8, mid = total <= 14;
  const pad = compact ? 44 : mid ? 54 : 70;
  let gap = compact ? 86 : mid ? 86 : 100;
  if (compact && total > 1) {
    const fitH = total <= 4 ? 420 : total <= 6 ? 500 : 560;
    gap = Math.max(78, Math.round((fitH - pad * 2) / (total - 1)));
  }
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const pt = i => {
    const drift = Math.sin(i * 0.94 - 1.05) * (compact ? 170 : 190) + Math.sin(i * 0.41 + 0.55) * (compact ? 78 : 88) + (Math.floor(i / 5) % 2 ? -42 : 42);
    return { x: Math.round(clamp(W / 2 + drift, W * 0.18, W * 0.82)), y: pad + i * gap };
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
  let path = '', circles = '';
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
    const opacity = isActive ? .84 : isDone ? .58 : .34;
    const accent = stg % 2 ? '#f0b86e' : '#77cdf2';
    const contourX = stg % 2 ? 110 : W - 350;
    const showTopicBadges = isActive || isDone;
    const topicWords = showTopicBadges ? homeStageWords(stg).slice(0, 6) : [];
    const routePin = seg.reduce((acc, p) => ({ x: acc.x + p.x / seg.length, y: acc.y + p.y / seg.length }), { x: 0, y: 0 });
    const side = routePin.x < W * .52 ? 1 : -1;
    const clusterHalfW = topicWords.length > 4 ? (compact ? 392 : 432) : (compact ? 318 : 356);
    const clusterHalfH = topicWords.length > 4 ? (compact ? 178 : 194) : (compact ? 132 : 144);
    const badgeAnchorOffset = topicWords.length > 4 ? (compact ? 76 : 88) : (compact ? 58 : 68);
    const clusterX = clamp(routePin.x + side * (compact ? 320 : 370), clusterHalfW + 24, W - clusterHalfW - 24) - side * badgeAnchorOffset;
    const clusterMinY = Math.min(H - clusterHalfH - 18, y1 + clusterHalfH + 18);
    const clusterMaxY = Math.max(clusterMinY, Math.min(H - clusterHalfH - 18, y2 - clusterHalfH - 18));
    let clusterY = clamp(routePin.y, clusterMinY, clusterMaxY);
    const currentPt = pts[Math.max(0, Math.min(total - 1, (meta.maxLevel || 1) - 1))];
    if (isActive && currentPt && topicWords.length > 4) {
      clusterY = clamp(Math.min(clusterY, currentPt.y - (compact ? 132 : 146)), clusterMinY, clusterMaxY);
    }
    // Topic badges describe the whole stage, not one word per level.
    const themeIcons = showTopicBadges ? mapTopicCluster(topicWords, clusterX, clusterY, false, routePin.x, routePin.y, accent, compact, side) : '';
    stageBackdrops += `<g opacity="${opacity}">
      <path d="M${contourX} ${Math.round(y1 + 34)} C${contourX + 96} ${Math.round(y1 + 10)} ${contourX + 206} ${Math.round(y1 + 34)} ${contourX + 318} ${Math.round(y1 + 2)}" fill="none" stroke="${accent}" stroke-width="2.2" opacity=".2"/>
      <path d="M${contourX - 34} ${Math.round(y2 - 34)} C${contourX + 70} ${Math.round(y2 - 76)} ${contourX + 184} ${Math.round(y2 - 42)} ${contourX + 318} ${Math.round(y2 - 82)}" fill="none" stroke="#8fa5b9" stroke-width="2" opacity=".13"/>
      ${themeIcons}
    </g>`;
  }
  for (let i = 0; i < total; i++) {
    const lv = i + 1, p = pts[i];
    const st = lv < meta.maxLevel ? 'done' : lv === meta.maxLevel ? 'cur' : 'lock';
    const fill = st==='done'?'#0e3a2a':st==='cur'?'#2f6af2':'#16202c';
    const stroke = st==='done'?'#43df9b':st==='cur'?'#77b7ff':'#38506a';
    const tc = st==='lock'?'#5f7488':st==='cur'?'#fff':'#6ee7a8';
    const r = st==='cur' ? (compact ? 48 : 52) : (compact ? 38 : 42), cur = st==='lock'?'default':'pointer';
    const halo = st==='cur' ? `<circle cx="${p.x}" cy="${p.y}" r="${r + 10}" fill="#5aa9ff" opacity=".18"/>` : '';
    circles += `<g class="mapstage mapstage-${st}">
        ${halo}
        <circle cx="${p.x}" cy="${p.y + 6}" r="${r}" fill="#06131f" opacity=".42"/>
        <circle class="mapnode" data-lv="${lv}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${st==='cur'?5:4}" style="cursor:${cur}"/>
        <circle cx="${p.x}" cy="${p.y - 6}" r="${Math.max(8, r - 12)}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2" style="pointer-events:none"/>
        <text x="${p.x}" y="${p.y+12}" text-anchor="middle" font-size="${st==='cur'?34:30}" font-weight="900" fill="${tc}" style="pointer-events:none">${lv}</text>
      </g>`;
  }
  const mapBgId = `mapgrid-${total}-${meta.maxLevel}`;
  const trail = `<defs>
      <pattern id="${mapBgId}" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M64 0H0V64" fill="none" stroke="#243343" stroke-width="1" opacity=".42"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${mapBgId})" opacity=".045"/>
    ${stageBackdrops}
    <path d="${path}" fill="none" stroke="#173047" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity=".76"/>
    <path d="${path}" fill="none" stroke="#2a4963" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity=".76"/>
    ${meta.maxLevel > 1 ? `<path d="${donePath}" fill="none" stroke="#1f8b6c" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity=".76"/>` : ''}
    <path d="${path}" fill="none" stroke="#87a8c7" stroke-width="3.4" stroke-dasharray="3 18" stroke-linecap="round" opacity=".58"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin meet">${trail}${circles}</svg>`;
}
function showHome() {
  inTraining = false;                    // 從任何地方回主畫面都結束特訓
  normalizeBossGate();
  const homeInfo = homeStageSummary();
  const challengeText = latestChallengeStage() ? `第 ${latestChallengeStage()} 階可遊玩` : '完成第 1 階開放';
  const trainText = homeInfo.weak ? `${homeInfo.weak} 個字待加強` : (homeInfo.touched ? '目前沒有弱字' : (homeInfo.lv > 1 ? '可自選複習' : '先開始第一關'));
  const derivText = meta.coins >= 30 ? '金幣足夠' : `還差 ${Math.max(0, 30 - (meta.coins || 0))} 枚`;
  const unitChips = homeTopicChips(homeInfo.topicWords);
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen', 'start-screen');
  screen.hidden = true; homeEl.hidden = false;
  screen.innerHTML = '';
  homeEl.innerHTML = `
    <div class="topbar">
      <div class="brand-lockup">
        <div class="logo">讓英文有道理</div>
        <div class="brand-sub">Daily learning path</div>
      </div>
      <div class="home-controls">
        <button id="settingsbtn" class="home-icon-btn" aria-label="設定" title="設定">${ICON.gear}</button>
        <button id="bgmtoggle" class="home-icon-btn" aria-label="靜音開關" title="靜音開關">${bgm.isOn() ? ICON.play : ICON.mute}</button>
        <button id="musicbtn" class="home-icon-btn" title="背景音樂" aria-label="背景音樂"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z"/></svg></button>
        <button id="reset" class="home-reset">${ICON.refresh}重來</button>
        <div class="coin">${ICON.coin}${meta.coins}</div>
      </div>
    </div>
    <div class="homebody">
      <div class="side">
        <div class="mission-card">
          <div class="mission-kicker">目前任務</div>
          <div class="mission-title">第 ${homeInfo.lv} 關</div>
          <div class="mission-sub">${homeInfo.nextLabel}</div>
          <div class="mission-progress">
            <div class="map-progress-row"><span>本階 ${homeInfo.step}/${homeInfo.stageSize}</span><b>${homeInfo.pct}%</b></div>
            <div class="map-progress-bar"><i style="width:${homeInfo.pct}%"></i></div>
          </div>
          <button class="mission-start map-primary-start" data-start="${homeInfo.lv}">開始 · 第 ${homeInfo.lv} 關</button>
        </div>
        <div class="cat" id="catChallenge"><div class="cati">${ICON.flag}</div><div class="cat-copy"><div class="cat-title">小遊戲</div><div class="catcoin">${challengeText}</div><div class="catnote">王戰挑戰 · 純娛樂</div></div><div class="cat-arrow">›</div></div>
        <div class="cat" id="catTrain"><div class="cati">${ICON.target}</div><div class="cat-copy"><div class="cat-title">單字特訓</div><div class="catcoin">${trainText}</div><div class="catnote">${homeInfo.learned}/${homeInfo.wordTotal} 字穩了</div></div><div class="cat-arrow">›</div></div>
        <div class="cat" id="catDeriv"><div class="cati">${ICON.lock}</div><div class="cat-copy"><div class="cat-title">衍生</div><div class="catcoin">${derivText}</div><div class="catnote">需 30 ${ICON.coin}</div></div><div class="cat-arrow">›</div></div>
      </div>
      <div class="map">
        <div class="map-brief">
          <div class="map-stage-copy">
            <div class="maptitle"><span>${homeInfo.trackLabel}</span><span>${currentTrack === 'work' ? '職場高頻' : '高頻日常'}</span></div>
            <div class="maptopic">第 ${homeInfo.stage} 階・${homeInfo.topic}</div>
            <div class="unit-chips">${unitChips}</div>
          </div>
        </div>
        <div class="mapjump" id="mapjump">
          <div class="branch-tabs">
            <button class="branch-tab ${currentTrack === 'work' ? '' : 'cur'}" id="dailybranch">${ICON.book}日常單字</button>
            <button class="branch-tab ${currentTrack === 'work' ? 'cur' : ''}" id="workbranch">${ICON.briefcase}工作英文</button>
          </div>
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
  // 關卡鏡頭:固定視窗 + 進場置中在目前關 + 滑鼠/觸控捲動 + 回目前關定位鈕
  const mapscroll = document.getElementById('mapscroll'), mapsvg = mapscroll && mapscroll.querySelector('svg');
  const mapFloatJump = document.getElementById('mapfloatjump');
  const currentMapY = () => {
    const node = mapsvg && mapsvg.querySelector(`.mapnode[data-lv="${meta.maxLevel}"]`);
    if (!mapscroll || !mapsvg || !node) return null;
    const nr = node.getBoundingClientRect();
    const sr = mapscroll.getBoundingClientRect();
    return mapscroll.scrollTop + (nr.top + nr.height / 2 - sr.top);
  };
  const updateMapFloatJump = () => {
    if (!mapscroll || !mapFloatJump) return;
    if (mapscroll.scrollHeight <= mapscroll.clientHeight + 2) { mapFloatJump.hidden = true; return; }
    const y = currentMapY();
    if (y === null) { mapFloatJump.hidden = true; return; }
    const top = mapscroll.scrollTop, bottom = top + mapscroll.clientHeight;
    const margin = Math.min(28, Math.max(14, mapscroll.clientHeight * .04));
    const dir = y < top - margin ? 'up' : (y > bottom + margin ? 'down' : '');
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
    const nr = node.getBoundingClientRect();
    const sr = mapscroll.getBoundingClientRect();
    const delta = (nr.top + nr.height / 2) - (sr.top + sr.height / 2);
    mapscroll.scrollTo({ top: Math.max(0, mapscroll.scrollTop + delta), behavior: smooth ? 'smooth' : 'auto' });
    requestAnimationFrame(updateMapFloatJump);
  };
  if (mapFloatJump) mapFloatJump.onclick = () => scrollToLv(meta.maxLevel, true);
  if (mapscroll) mapscroll.addEventListener('scroll', updateMapFloatJump, { passive: true });
  scrollToLv(meta.maxLevel, false);                                  // 同步置中(讀 getBoundingClientRect 會強制排版,拿得到真實尺寸)
  requestAnimationFrame(() => { scrollToLv(meta.maxLevel, false); updateMapFloatJump(); });     // 保險:萬一同步時尺寸還沒到位,下一幀再置中
  const jump = document.getElementById('mapjump');
  if (jump) {
    $('dailybranch').onclick = () => { setTrack('daily'); showHome(); };
    $('workbranch').onclick = () => { setTrack('work'); showHome(); };
  }
  homeEl.querySelectorAll('button[data-start]').forEach(btn => btn.onclick = () => enterLevel(+btn.dataset.start));
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
  const amode = typeof annotMode === 'function' ? annotMode() : (meta.annotMode || 'learned-hide');
  const annotLabels = {
    'learned-hide': { label:'學會後隱藏', desc:'新字顯示重點,學會後收掉' },
    always: { label:'永遠顯示', desc:'複習時也保留拼讀 / 字根提示' },
    off: { label:'關閉', desc:'完全不顯示劃重點提示' },
  };
  const annot = annotLabels[amode] || annotLabels['learned-hide'];
  const row = (key, label, desc) => `
    <div class="cat" style="display:flex;justify-content:space-between;align-items:center;margin:0" data-skill="${key}">
      <div><div style="font-weight:500;font-size:16px">${label}</div><div style="font-size:12px;color:#9fb4c8;margin-top:2px">${desc}</div></div>
      <div style="font-size:24px">${sk[key] === false ? '⬜' : '✅'}</div>
    </div>`;
  const annotRow = `
    <div class="cat" style="display:flex;justify-content:space-between;align-items:center;margin:0" data-annot-mode>
      <div><div style="font-weight:500;font-size:16px">劃重點單字</div><div style="font-size:12px;color:#9fb4c8;margin-top:2px">${annot.desc}</div></div>
      <div style="font-size:15px;font-weight:800;color:#9bd2ff">${annot.label}</div>
    </div>`;
  screen.innerHTML = `<h2>設定</h2>
    <div class="sub">要練哪些(關掉的技能對應題型就不出現,預設全開)</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${row('listen','聽','聽發音 → 選 / 拼')}
      ${row('read','讀','看字 / 圖 → 選')}
      ${row('speak','說','開口念(要麥克風)')}
      ${row('write','寫','聽寫 / 默寫 / 音節填空')}
      ${annotRow}
    </div>
    <button class="btn" id="setback" style="margin-top:16px">← 回主畫面</button>`;
  screen.querySelectorAll('[data-skill]').forEach(el => {
    el.onclick = () => { const k = el.dataset.skill; meta.skills = meta.skills || {}; meta.skills[k] = meta.skills[k] === false; saveMeta(); showSettings(); };
  });
  const annotToggle = screen.querySelector('[data-annot-mode]');
  if (annotToggle) annotToggle.onclick = () => {
    const modes = ['learned-hide', 'always', 'off'];
    const cur = modes.indexOf(meta.annotMode || 'learned-hide');
    meta.annotMode = modes[(cur + 1) % modes.length];
    saveMeta(); showSettings();
  };
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
document.addEventListener('click', e => { if (e.target.closest('button, .opt, .cat, .mapnode')) sfx.tap(); }, true);
