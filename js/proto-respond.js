/* ============================================================
 * 原型(可拋)—— 新關型,給使用者實玩判斷方向。
 *   protoRespond()  A:複合句情境 + 「你呢?」回應題(排出自己的回應)
 *   protoImmerse()  B:情境沉浸關 · 機制示範(逐句 + hover + 重組 + 選擇)
 *   protoStory()    B:情境沉浸關 · 真的小故事(測「初階字量講不講得出勾人的故事」)
 * 特性:自成一格,不進 BANK / PATTERNS / FORMATS,不碰引擎;沒被呼叫就完全不影響正式遊戲。
 * 玩法:8182 → F12 console → 打上面的函式名。✕ 可離開回主畫面。
 * 方向不對 → 刪這檔 + index.html 那行 <script> 即可,乾淨。
 * ============================================================ */

/* ---------- A:複合句 + 「你呢?」回應題 ---------- */
(() => {
  const PROTO_PEOPLE = [
    { name: 'Max',  nameZh: '麥克斯', country: 'France', countryZh: '法國',   pron: 'He',  pronZh: '他', drink: 'tea',    drinkZh: '茶' },
    { name: 'Yuki', nameZh: '由紀',   country: 'Japan',  countryZh: '日本',   pron: 'She', pronZh: '她', drink: 'coffee', drinkZh: '咖啡' },
    { name: 'Sam',  nameZh: '山姆',   country: 'Canada', countryZh: '加拿大', pron: 'He',  pronZh: '他', drink: 'milk',   drinkZh: '牛奶' },
  ];
  const PROTO_YOU = [{ en: 'tea', zh: '茶' }, { en: 'coffee', zh: '咖啡' }, { en: 'water', zh: '水' }];
  let idx = 0;

  function scenario(p, you) {
    const line = `${p.name} is from ${p.country}. ${p.pron} likes ${p.drink}.`;
    const zh = `${p.nameZh}來自${p.countryZh},${p.pronZh}喜歡喝${p.drinkZh}。`;
    shell('先讀懂 / 聽懂這句', `
      <div style="display:grid;gap:16px;justify-items:center;text-align:center;padding-top:8px">
        <div style="font-size:27px;font-weight:700;line-height:1.4">${line}</div>
        <button class="replay" id="protohear">${ICON.play}再聽一次</button>
        <div style="font-size:19px;color:#9fb4c8">${zh}</div>
        <div style="margin-top:14px;font-size:20px;background:#14202e;border:1px solid #26384a;border-radius:12px;padding:12px 18px">👉 <b>And you? 你呢?</b></div>
        <button class="btn act" id="protogo">換我回答 →</button>
      </div>`);
    if (typeof speak === 'function') speak(line);
    $('protohear').onclick = () => speak(line);
    $('protogo').onclick = () => respond(p, you);
  }

  function respond(p, you) {
    const target = ['I', 'am', 'from', 'Taiwan', 'I', 'like', you.en];
    const cards = target.map((t, i) => ({ id: 'p' + i, text: t }));
    mountArrange({ promptText: '你呢?用英文回答', zh: `我來自台灣,我喜歡喝${you.zh}。`, cards, targetTokens: target, caseInsensitive: false, onCheck: (right, ctx) => result(right, ctx, you) });
  }

  function result(right, ctx, you) {
    if (typeof sfx !== 'undefined') (right ? sfx.correct : sfx.wrong)();
    const why = $('why');
    why.hidden = false;
    why.className = right ? 'why good' : 'why bad';
    why.innerHTML = `<div class="result-head compact">${right ? '✅ 回應成功!' : '再排一次看看'}</div>
      <div style="font-size:15px;margin-top:4px;color:#cfe0f0">正解:I am from Taiwan. I like ${you.en}.</div>
      <button class="act" id="protonext">${right ? '下一位 →' : '↺ 再排一次'}</button>`;
    $('protonext').onclick = right ? () => next() : () => { why.hidden = true; ctx.retry(); };
  }

  function next() {
    const scr = document.getElementById('screen'), home = document.getElementById('home');
    if (home) home.hidden = true;
    if (scr) scr.hidden = false;
    const p = PROTO_PEOPLE[idx % PROTO_PEOPLE.length]; const you = PROTO_YOU[idx % PROTO_YOU.length]; idx++;
    scenario(p, you);
  }
  window.protoRespond = next;
})();

/* ---------- B:情境沉浸關(逐句點開 + hover + 就地作答;可放機制示範或真的故事) ---------- */
(() => {
  // ---- 機制示範腳本(Max/France,只為展示題型) ----
  const DEMO_SCRIPT = [
    { type: 'line', who: 'A', words: [['Hi', '嗨', { fresh: 1 }], ['I', '我'], ['am', '是'], ['Max', '麥克斯(人名)'], ['.', '']] },
    { type: 'line', who: 'A', words: [['I', '我'], ['am', '是'], ['from', '來自'], ['France', '法國'], ['.', '']] },
    { type: 'ask', q: 'Max 是哪裡人?', options: [{ t: '法國', ok: true }, { t: '日本' }, { t: '美國' }] },
    { type: 'line', who: 'B', words: [['Would', '(禮貌問句)', { fresh: 1 }], ['you', '你'], ['like', '想要'], ['some', '一些', { fresh: 1 }], ['tea', '茶', { why: '喝的字都短:tea / milk' }], ['?', '']] },
    { type: 'reorder', answer: 'Would you like some tea', tiles: ['Would you', 'like', 'some tea'] },
    { type: 'ask', q: 'B 問 Max 要不要做什麼?', options: [{ t: '喝茶', ok: true }, { t: '吃飯' }, { t: '走了' }] },
  ];

  // ---- 真的小故事:誰吃了蛋糕?(測初階字量能不能講出勾人的故事 + 反轉) ----
  const STORY_SCRIPT = [
    { type: 'line', who: 'N', words: [['Bea', '貝雅(人名)', { fresh: 1 }], ['has', '有'], ['a', '一個'], ['big', '大的'], ['cake', '蛋糕', { fresh: 1 }], ['.', '']] },
    { type: 'line', who: 'B', side: 'L', words: [['I', '我'], ['love', '愛', { fresh: 1 }], ['it', '它'], ['!', '']] },
    { type: 'line', who: 'B', side: 'L', words: [['I', '我'], ['eat', '吃'], ['it', '它'], ['later', '等一下', { fresh: 1, why: 'late(晚)+r → 晚一點、等等' }], ['.', '']] },
    { type: 'line', who: 'N', words: [['Bea', '貝雅'], ['goes', '去', { fresh: 1 }], ['out', '外面', { fresh: 1 }], ['.', '']] },
    { type: 'line', who: 'N', words: [['Bea', '貝雅'], ['comes', '回到', { fresh: 1 }], ['home', '家'], ['.', '']] },
    { type: 'line', who: 'N', words: [['The', '那個'], ['cake', '蛋糕', { fresh: 1 }], ['is', '是'], ['gone', '不見了', { fresh: 1, why: 'go(走)+ne → 走掉了=不見了' }], ['!', '']] },
    { type: 'ask', q: '蛋糕怎麼了?', options: [{ t: '不見了', ok: true }, { t: '變大了' }, { t: '還在桌上' }] },
    { type: 'line', who: 'B', side: 'L', words: [['Who', '誰', { fresh: 1 }], ['ate', '吃了', { fresh: 1, why: 'eat 的過去式 → ate,「吃了」' }], ['my', '我的'], ['cake', '蛋糕', { fresh: 1 }], ['?', '']] },
    { type: 'reorder', answer: 'Who ate my cake', tiles: ['Who', 'ate', 'my cake'] },
    { type: 'line', who: 'N', words: [['The', '那隻'], ['dog', '狗'], ['has', '有'], ['cake', '蛋糕', { fresh: 1 }], ['on', '在'], ['its', '牠的', { fresh: 1 }], ['face', '臉上', { fresh: 1 }], ['!', '']] },
    { type: 'line', who: 'B', side: 'L', words: [['Bad', '壞', { fresh: 1 }], ['dog', '狗'], ['!', '']] },
    { type: 'line', who: '🐶', side: 'R', words: [['No', '不'], ['!', ''], ['Look', '看', { fresh: 1 }], ['at', '看向'], ['the', '那個'], ['baby', '寶寶', { fresh: 1 }], ['!', '']] },
    { type: 'ask', q: '狗說是誰吃的?', options: [{ t: '寶寶', ok: true }, { t: '貓' }, { t: 'Bea 自己' }] },
    { type: 'line', who: 'N', words: [['The', '那個'], ['baby', '寶寶', { fresh: 1 }], ['is', '是'], ['happy', '開心'], ['.', '']] },
    { type: 'line', who: 'N', words: [['Cake', '蛋糕', { fresh: 1 }], ['is', '是'], ['everywhere', '到處都是', { fresh: 1, why: 'every(每個)+where(地方) → 到處' }], ['!', '']] },
    { type: 'line', who: 'B', side: 'L', words: [['Oh', '喔'], ['!', ''], ['The', '那個'], ['baby', '寶寶', { fresh: 1 }], ['ate', '吃了', { fresh: 1 }], ['it', '它'], ['.', '']] },
    { type: 'line', who: 'B', side: 'L', words: [['And', '而且'], ['you', '你'], [',', ''], ['dog', '狗'], ['.', ''], ['You', '你'], ['ate', '吃了', { fresh: 1 }], ['some', '一些', { fresh: 1 }], ['too', '也', { fresh: 1 }], ['.', '']] },
    { type: 'line', who: '🐶', side: 'R', words: [['...', ''], ['Sorry', '對不起', { fresh: 1 }], ['.', '']] },
    { type: 'ask', q: '真相是?(要懂整個故事)', options: [
      { t: '寶寶吃掉大半,狗也偷吃了一點,還想賴給寶寶', ok: true },
      { t: '只有寶寶吃,狗是無辜的' },
      { t: '蛋糕自己不見了' },
    ] },
  ];

  let tip;
  function ensureTip() {
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'dlgtip';
      tip.style.cssText = 'position:fixed;z-index:9999;background:#0f1a26;border:1px solid #35506b;border-radius:10px;padding:8px 12px;font-size:15px;color:#e8f1fb;box-shadow:0 8px 24px rgba(0,0,0,.55);pointer-events:none;max-width:250px;display:none';
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(el, tok) {
    if (!tok.zh && !tok.why) return;
    const t = ensureTip();
    t.innerHTML = `<b style="font-size:16px">${tok.en}</b>${tok.zh ? ' — ' + tok.zh : ''}` + (tok.why ? `<div style="margin-top:5px;color:#9fd9b0;font-size:13px;line-height:1.4">💡 ${tok.why}</div>` : '');
    t.style.display = 'block';
    const r = el.getBoundingClientRect(), tr = t.getBoundingClientRect();
    t.style.left = Math.max(6, Math.min(r.left, window.innerWidth - tr.width - 6)) + 'px';
    t.style.top = (r.bottom + 6) + 'px';
  }
  function hideTip() { if (tip) tip.style.display = 'none'; }

  let active = DEMO_SCRIPT, i = 0, score = { ok: 0, total: 0 };
  function scrollDown() { const sc = document.getElementById('dlgscroll'); if (sc) sc.scrollTop = sc.scrollHeight; }

  function start() {
    const scr = document.getElementById('screen'), home = document.getElementById('home');
    if (home) home.hidden = true;
    if (scr) scr.hidden = false;
    hideTip();
    i = 0; score = { ok: 0, total: 0 };
    shell('讀讀看 —— 他們在說什麼?<div style="font-size:14px;color:#9fb4c8;font-weight:400;margin-top:6px">游標移到字上看中文(橘色虛線=還沒教過,靠 hover 猜)</div>', `
      <div id="dlgscroll" style="max-height:100%;min-height:0;overflow-y:auto;width:100%;max-width:760px;margin:0 auto;padding:2px 6px 20px">
        <div id="dlgbox" style="display:grid;gap:12px"></div>
        <div id="dlgctrl" style="margin-top:16px;display:grid;gap:10px"></div>
      </div>`);
    const body = document.getElementById('body'); if (body) body.style.justifyContent = 'flex-start';   // 答案帶靠上,不置中 → 故事從頂端往下長(內容一短才不會飄在中間/縮頂端)
    step();
  }

  // 把一串 [en,zh,opt] 詞塊,建成可 hover 的 span 放進 container(標點直接放文字)
  function appendWords(container, words) {
    words.forEach(([en, zh, opt]) => {
      const tok = Object.assign({ en, zh }, opt || {});
      if (!/[a-zA-Z]/.test(en)) { container.appendChild(document.createTextNode(en + ' ')); return; }
      const sp = document.createElement('span');
      sp.textContent = en;
      sp.style.cssText = 'cursor:help;padding:1px 3px;border-radius:5px;' + (tok.fresh ? 'text-decoration:underline dotted #f0b86e;text-underline-offset:4px;text-decoration-thickness:2px;' : '');
      sp.onmouseenter = () => { sp.style.background = '#24384d'; showTip(sp, tok); };
      sp.onmouseleave = () => { sp.style.background = ''; hideTip(); };
      sp.onclick = () => showTip(sp, tok);
      container.appendChild(sp);
      container.appendChild(document.createTextNode(' '));
    });
  }

  function appendLine(item) {
    const box = document.getElementById('dlgbox');
    const narration = item.who === 'N' || item.side === 'N';
    if (narration) {
      const p = document.createElement('div');
      p.style.cssText = 'text-align:center;color:#9fb4c8;font-style:italic;font-size:18px;line-height:1.6;padding:2px 10px';
      appendWords(p, item.words);
      box.appendChild(p);
    } else {
      const right = item.side === 'R' || item.who === 'B';
      const row = document.createElement('div');
      row.style.cssText = `display:flex;gap:8px;${right ? 'flex-direction:row-reverse;text-align:right' : ''}`;
      const badge = document.createElement('div');
      badge.textContent = item.who;
      badge.style.cssText = `flex:0 0 28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;background:${right ? '#2a3f57' : '#3a2c1d'};color:#dfe9f3`;
      const bubble = document.createElement('div');
      bubble.style.cssText = `background:${right ? '#14202e' : '#1d1710'};border:1px solid #26384a;border-radius:14px;padding:10px 14px;font-size:20px;line-height:1.7;max-width:80%`;
      appendWords(bubble, item.words);
      row.appendChild(badge); row.appendChild(bubble);
      box.appendChild(row);
    }
    scrollDown();
    const en = item.words.map(w => w[0]).filter(x => /[a-zA-Z]/.test(x)).join(' ');
    if (en && typeof speak === 'function') speak(en);
  }

  function controlButton(label, cb) {
    const ctrl = document.getElementById('dlgctrl');
    ctrl.innerHTML = '';
    const b = document.createElement('button');
    b.className = 'btn act';
    b.textContent = label;
    b.onclick = cb;
    ctrl.appendChild(b);
  }

  function step() {
    hideTip();
    if (i >= active.length) return finish();
    const item = active[i];
    if (item.type === 'line') {
      appendLine(item); i++;
      controlButton(i >= active.length ? '看結果 →' : '繼續 →', step);
    } else if (item.type === 'reorder') {
      renderReorder(item);
    } else {
      renderAsk(item);
    }
  }

  function renderAsk(item) {
    const ctrl = document.getElementById('dlgctrl');
    ctrl.innerHTML = `<div style="font-size:17px;font-weight:700;background:#101d29;border:1px solid #2b4a63;border-radius:12px;padding:12px 14px">❓ ${item.q}</div>
      <div class="opts" id="askopts" style="display:grid;gap:8px"></div>`;
    const box = document.getElementById('askopts');
    let done = false;
    item.options.slice().sort(() => Math.random() - 0.5).forEach(o => {
      const el = document.createElement('button');
      el.className = 'opt'; el.type = 'button'; el.textContent = o.t;
      el.style.cssText = 'text-align:left;font-size:17px;line-height:1.5;padding:11px 14px';
      el.onclick = () => {
        if (done) return; done = true;
        score.total++; if (o.ok) score.ok++;
        [...box.children].forEach(c => { c.style.pointerEvents = 'none'; });
        el.style.borderColor = o.ok ? '#6ee7a8' : '#e35b6a';
        if (!o.ok) { const r = [...box.children].find(c => c.textContent === item.options.find(x => x.ok).t); if (r) r.style.borderColor = '#6ee7a8'; }
        if (typeof sfx !== 'undefined') (o.ok ? sfx.correct : sfx.wrong)();
        i++;
        const btn = document.createElement('button');
        btn.className = 'btn act'; btn.textContent = (i >= active.length ? '看結果 →' : '繼續 →'); btn.style.marginTop = '4px';
        btn.onclick = step;
        document.getElementById('dlgctrl').appendChild(btn);
      };
      box.appendChild(el);
    });
    scrollDown();
  }

  function renderReorder(item) {
    const ctrl = document.getElementById('dlgctrl');
    ctrl.innerHTML = `<div style="font-size:17px;font-weight:700;background:#101d29;border:1px solid #2b4a63;border-radius:12px;padding:12px 14px">🔊 重組聽到的句子</div>
      <div id="rosent" style="font-size:18px;color:#9fb4c8;padding:4px 2px">把字塊排回你聽到的句子</div>
      <div id="roslots" style="min-height:50px;display:flex;flex-wrap:wrap;gap:8px;border-bottom:2px solid #2b4a63;padding:10px 0"></div>
      <div id="robank" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>`;
    if (typeof speak === 'function') speak(item.answer);
    const placed = [];
    let bank = (typeof shuffle === 'function' ? shuffle(item.tiles.slice()) : item.tiles.slice());
    const tile = t => { const b = document.createElement('button'); b.className = 'opt'; b.type = 'button'; b.textContent = t; b.style.cssText = 'font-size:17px;padding:9px 15px'; return b; };
    const draw = () => {
      const slots = document.getElementById('roslots'), bk = document.getElementById('robank');
      slots.innerHTML = ''; bk.innerHTML = '';
      placed.forEach((t, idx) => { const el = tile(t); el.onclick = () => { placed.splice(idx, 1); bank.push(t); draw(); }; slots.appendChild(el); });
      bank.forEach((t, idx) => { const el = tile(t); el.onclick = () => { bank.splice(idx, 1); placed.push(t); if (typeof speak === 'function') speak(t); draw(); }; bk.appendChild(el); });
    };
    draw();
    const chk = document.createElement('button');
    chk.className = 'btn act'; chk.textContent = '確定'; chk.style.marginTop = '4px';
    chk.onclick = () => {
      const ok = placed.join(' ') === item.answer;
      score.total++; if (ok) score.ok++;
      document.getElementById('rosent').innerHTML = ok ? '✅ 排對了!' : `❌ 正解:<b style="color:#cfe0f0">${item.answer}</b>`;
      if (typeof sfx !== 'undefined') (ok ? sfx.correct : sfx.wrong)();
      document.querySelectorAll('#roslots button, #robank button').forEach(b => b.style.pointerEvents = 'none');
      chk.remove();
      i++;
      const cont = document.createElement('button');
      cont.className = 'btn act'; cont.textContent = i >= active.length ? '看結果 →' : '繼續 →'; cont.style.marginTop = '4px';
      cont.onclick = step;
      ctrl.appendChild(cont);
      scrollDown();
    };
    ctrl.appendChild(chk);
    scrollDown();
  }

  function finish() {
    const why = document.getElementById('why');
    why.hidden = false;
    why.className = score.ok === score.total ? 'why good' : 'why bad';
    why.innerHTML = `<div class="result-head compact">讀完了 · 讀懂 ${score.ok}/${score.total} 題</div>
      <button class="act" id="dlgnext">再玩一次 →</button>`;
    document.getElementById('dlgnext').onclick = start;
  }

  window.protoImmerse = () => { active = DEMO_SCRIPT; start(); };
  window.protoStory = () => { active = STORY_SCRIPT; start(); };
})();
