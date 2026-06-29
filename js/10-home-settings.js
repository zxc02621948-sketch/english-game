const homeEl = document.getElementById('home');
const bossLevelForStage = stage => defaultStageStartLevel(stage) + stageMinLevels(stage) - 1;
function mapSVG() {
  const total = meta.maxLevel + 2;                       // 已解鎖 + 下一關 + 2 個鎖著
  const W = 720, pad = 58, gap = 98;                     // 大畫布 + 大間距,節點沿正弦蜿蜒散開
  const pt = i => ({ x: i % 2 === 0 ? Math.round(W * 0.28) : Math.round(W * 0.72), y: pad + i * gap });
  let path = '', circles = '', bossLines = '', bossNodes = '';
  for (let i = 0; i < total; i++) { const p = pt(i); path += (i ? ` L${p.x} ${p.y}` : `M${p.x} ${p.y}`); }
  for (let i = 0; i < total; i++) {
    const lv = i + 1, p = pt(i);
    const st = lv < meta.maxLevel ? 'done' : lv === meta.maxLevel ? 'cur' : 'lock';
    const fill = st==='done'?'#0e2a1f':st==='cur'?'#2563eb':'#16202c';
    const stroke = st==='done'?'#2ecc8f':st==='cur'?'#5aa9ff':'#2c3e52';
    const tc = st==='lock'?'#5f7488':st==='cur'?'#fff':'#6ee7a8';
    const r = st==='cur'?38:32, cur = st==='lock'?'default':'pointer';
    circles += `<circle class="mapnode" data-lv="${lv}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3.5" style="cursor:${cur}"/>`
      + `<text x="${p.x}" y="${p.y+10}" text-anchor="middle" font-size="27" font-weight="700" fill="${tc}" style="pointer-events:none">${lv}</text>`;
  }
  for (let stage = 1; stage <= (meta.stage || 1); stage++) {
    const cleared = stage < (meta.stage || 1);
    const pending = stage === (meta.stage || 1) && meta.bossReady;
    if (!cleared && !pending) continue;
    const lv = bossLevelForStage(stage);
    if (lv > total) continue;
    const p = pt(lv - 1);
    const bx = p.x < W / 2 ? p.x + 92 : p.x - 92;
    const by = p.y;
    const fill = pending ? '#2a0e12' : '#16202c';
    const stroke = pending ? '#e35b6a' : '#6ee7a8';
    const tc = pending ? '#ffd0d6' : '#d9f7e5';
    bossLines += `<line x1="${p.x}" y1="${p.y}" x2="${bx}" y2="${by}" stroke="${stroke}" stroke-width="3" stroke-dasharray="3 8" stroke-linecap="round" opacity=".75"/>`;
    bossNodes += `<circle class="mapboss" data-boss-stage="${stage}" data-cleared="${cleared ? 1 : 0}" cx="${bx}" cy="${by}" r="28" fill="${fill}" stroke="${stroke}" stroke-width="3.5" style="cursor:pointer"/>`
      + `<text x="${bx}" y="${by+9}" text-anchor="middle" font-size="22" font-weight="800" fill="${tc}" style="pointer-events:none">${pending ? '王' : '✓'}</text>`;
  }
  const H = pad + (total-1)*gap + pad;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><path d="${path}" fill="none" stroke="#2c3e52" stroke-width="4" stroke-dasharray="2 13" stroke-linecap="round"/>${bossLines}${circles}${bossNodes}</svg>`;
}
function showHome() {
  inTraining = false;                    // 從任何地方回主畫面都結束特訓
  normalizeBossGate();
  screen.classList.remove('lesson-screen', 'boss-screen', 'done-screen', 'start-screen');
  screen.hidden = true; homeEl.hidden = false;
  screen.innerHTML = '';
  homeEl.innerHTML = `
    <div class="topbar">
      <div class="logo">讓英文有道理</div>
      <div style="display:flex;align-items:center;gap:10px">
        <button id="settingsbtn" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 13px;cursor:pointer;font-size:14px">⚙</button>
        <button id="bgmtoggle" title="靜音開關" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 13px;cursor:pointer;font-size:14px">${bgm.isOn() ? '🔊' : '🔇'}</button>
        <button id="musicbtn" title="背景音樂" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 13px;cursor:pointer;display:inline-flex;align-items:center"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z"/></svg></button>
        <button id="reset" style="background:#1d2c3a;border:1px solid #2c3e52;color:#9fb4c8;border-radius:99px;padding:8px 15px;cursor:pointer;font-size:13px">🔄 重來</button>
        <div class="coin">🪙 ${meta.coins}</div>
      </div>
    </div>
    <div class="homebody">
      <div class="side">
        <div class="cat active" id="catPractice"><div class="cati">📚</div>練習單字</div>
        <div class="cat" id="catTrain"><div class="cati">🎯</div>單字特訓<div class="catcoin">自選字加強</div></div>
        <div class="cat" id="catDeriv"><div class="cati">🔒</div>衍生<div class="catcoin">需 30 🪙</div></div>
        <div class="cat ph"><div class="cati">⋯</div>之後</div>
      </div>
      <div class="map">
        <div class="maptitle">第一章 · 高頻日常</div>
        <div class="mapjump" id="mapjump"></div>
        <div class="mapscroll" id="mapscroll">${mapSVG()}</div>
      </div>
    </div>`;
  if (meta.bgm && !bgm.isOn()) bgm.toggle();   // 還原上次的 BGM 開關
  document.getElementById('bgmtoggle').textContent = bgm.isOn() ? '🔊' : '🔇';   // 修:還原後同步圖示(否則音樂在播卻顯示🔇)
  document.getElementById('settingsbtn').onclick = showSettings;
  document.getElementById('musicbtn').onclick = showMusic;
  document.getElementById('bgmtoggle').onclick = () => { const playing = bgm.toggle(); meta.bgm = playing; saveMeta(); document.getElementById('bgmtoggle').textContent = playing ? '🔊' : '🔇'; };
  document.getElementById('reset').onclick = () => {
    if (confirm('清掉所有學習進度,從第 1 關重新開始?')) {
      for (const k in store) delete store[k]; localStorage.removeItem('eng_progress_v2');
      meta.coins = 0; meta.maxLevel = 1; meta.stage = 1; meta.stageStartLevel = 1; meta.bossReady = false; meta.bossCleared = false; meta.skills = {}; saveMeta(); level = 1; showHome();
    }
  };
  document.getElementById('catPractice').onclick = () => enterLevel(meta.maxLevel);
  document.getElementById('catTrain').onclick = showTrainPicker;
  document.getElementById('catDeriv').onclick = () => { homeEl.querySelector('#catDeriv .catcoin').textContent = '金幣不夠,之後開放'; };
  homeEl.querySelectorAll('.mapnode').forEach(c => { const lv = +c.dataset.lv; if (lv <= meta.maxLevel) c.onclick = () => enterLevel(lv); });
  homeEl.querySelectorAll('.mapboss').forEach(c => {
    const stage = +c.dataset.bossStage;
    const cleared = c.dataset.cleared === '1';
    c.onclick = () => startBoss(stage, cleared);
  });
  // 關卡鏡頭:固定視窗 + 進場置中在目前關 + 滑鼠/觸控捲動 + 王快捷
  const mapscroll = document.getElementById('mapscroll'), mapsvg = mapscroll && mapscroll.querySelector('svg');
  const scrollToLv = (lv, smooth) => {
    const node = mapsvg && mapsvg.querySelector(`.mapnode[data-lv="${lv}"]`);
    if (!mapscroll || !node) return;
    const scale = mapsvg.getBoundingClientRect().height / (mapsvg.viewBox.baseVal.height || 1);
    mapscroll.scrollTo({ top: Math.max(0, (+node.getAttribute('cy')) * scale - mapscroll.clientHeight / 2), behavior: smooth ? 'smooth' : 'auto' });
  };
  scrollToLv(meta.maxLevel, false);                                  // 同步置中(讀 getBoundingClientRect 會強制排版,拿得到真實尺寸)
  requestAnimationFrame(() => scrollToLv(meta.maxLevel, false));     // 保險:萬一同步時尺寸還沒到位,下一幀再置中
  const jump = document.getElementById('mapjump');
  if (jump) {
    let h = `<button class="cur" data-jump="${meta.maxLevel}">📍 目前 · 第 ${meta.maxLevel} 關</button>`;
    if (meta.bossReady) h += `<button id="jumpboss" style="border-color:#e35b6a;color:#ffd0d6">⚔ 王關 · 第 ${bossLevelForStage(meta.stage)} 關旁</button>`;
    jump.innerHTML = h;
    jump.querySelectorAll('button[data-jump]').forEach(btn => btn.onclick = () => scrollToLv(+btn.dataset.jump, true));
    if ($('jumpboss')) $('jumpboss').onclick = () => scrollToLv(bossLevelForStage(meta.stage), true);
  }
}
function enterLevel(lv) {
  level = lv; homeEl.hidden = true; screen.hidden = false;
  showStart();
}
// 🎯 單字特訓:自選教過的字 → 各種聽說讀寫混合練 → 每題可「✓ 學會」把字移出特訓題庫(見 js/08 trainNext)。
function showTrainPicker() {
  inTraining = false;
  homeEl.hidden = true; screen.hidden = false;
  screen.className = 'card'; screen.innerHTML = '';
  const words = BANK.filter(w => w.pos !== 'function' && wordIsTaught(w) && !isLearned(w)).sort((a, b) => pOf(a) - pOf(b));   // 教過、還沒滿 100% 的實詞(滿了不用特訓),弱的排前面
  if (!words.length) {
    screen.innerHTML = `<main class="start-panel"><div style="text-align:center;font-size:40px">🎯</div>
      <h2 style="text-align:center">目前沒有需要加強的字</h2>
      <div class="sub" style="text-align:center">教過的字都已經 100% 了 —— 去「練習單字」學新字,弱掉的字之後也會出現在這。</div>
      <button class="btn" id="tback" style="margin-top:14px">← 回主畫面</button></main>`;
    $('tback').onclick = showHome; return;
  }
  const sel = new Set();
  screen.innerHTML = `<main class="train-pick">
    <div style="text-align:center;font-size:40px">🎯</div>
    <h2 style="text-align:center">單字特訓</h2>
    <div class="sub" style="text-align:center">挑想加強的字(弱的排前面)→ 聽說讀寫混合練 → 練到會了點「✓ 學會」移除。</div>
    <div class="train-words" id="twords"></div>
    <button class="btn train-start" id="tstart" disabled>先選幾個字</button>
    <button class="btn" id="tback" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">← 回主畫面</button>
  </main>`;
  const box = $('twords');
  words.forEach(w => {
    const el = document.createElement('button');
    el.className = 'twordchip'; el.dataset.id = w.id;
    el.innerHTML = `<b>${w.en}</b> <span class="tzh">${w.zh}</span> <span class="tpct">${pOf(w)}%</span>`;
    el.onclick = () => {
      if (sel.has(w)) { sel.delete(w); el.classList.remove('sel'); }
      else { sel.add(w); el.classList.add('sel'); }
      const n = sel.size;
      $('tstart').disabled = !n;
      $('tstart').textContent = n ? `開始特訓 ${n} 個字 →` : '先選幾個字';
    };
    box.appendChild(el);
  });
  $('tstart').onclick = () => { if (sel.size) startTraining([...sel]); };
  $('tback').onclick = showHome;
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
    <div class="sub">選一首(放了 mp3 才有那首;沒放的選了用內建合成頂著)。靜音開關在主畫面的 🔊。</div>
    <div style="display:flex;flex-direction:column;gap:8px">${trackRows}</div>
    <button class="btn" id="musicback" style="margin-top:16px">← 回主畫面</button>`;
  screen.querySelectorAll('[data-track]').forEach(el => {
    el.onclick = () => { bgm.setTrack(+el.dataset.track); showMusic(); };
  });
  $('musicback').onclick = showHome;
}

// 點任何按鈕 / 選項都來個輕「嗒」聲(UI 回饋;事件委派,不用每個按鈕手動接)
document.addEventListener('click', e => { if (e.target.closest('button, .opt, .cat, .mapnode, .mapboss')) sfx.tap(); }, true);
