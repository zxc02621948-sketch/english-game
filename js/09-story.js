/* ============================================================
 * 📖 情境故事關(玩法層)—— 階段收尾的「用出來」時刻。
 * 從 proto-respond.js 的 protoStory 轉正(2026-07-08):逐句點開 + hover 查生字(橘虛線=沒教過)
 * + 讀懂測驗 + 重組題 + 結算。字量刻意低、靠 hover 撐生字 → 零基礎讀得完一個有反轉的故事。
 * 掛法:STORIES 登錄表(id/stage/title/script);階段完成的情境卡出「讀收尾故事」鈕;小遊戲 hub 可重讀。
 * 完成記 meta.storiesDone[id](第一次 +2 🪙)。加新故事 = 往 STORIES 加一筆,引擎不動。
 * script 格式:{type:'line', who, side?, words:[[en,zh,{fresh?,why?}]...]} / {type:'ask', q, options:[{t,ok?}]} / {type:'reorder', answer, tiles}
 * ============================================================ */

// ★ 彩蛋設定:那隻狗(🐶)是貫穿全季的角色 —— 階1 上錯飲料的店員 → 階4 偷吃蛋糕嫁禍寶寶 → 階6 背上藏了貓 → 階8 開口說話嚇跑路人。
const STORIES = [
  {
    id: 'story_drink', stage: 1, title: '狗狗咖啡店', icon: '☕',
    intro: '用你剛學的字讀第一個故事 —— 不會的字有橘色虛線,游標移上去看中文。',
    script: [
      { type: 'line', who: 'N', words: [['Sam', '山姆(人名)', { fresh: 1 }], ['is', '是', { fresh: 1 }], ['thirsty', '口渴', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: 'S', side: 'L', words: [['Coffee', '咖啡'], [',', ''], ['please', '請'], ['.', '']] },
      { type: 'line', who: 'N', words: [['The', '那隻', { fresh: 1 }], ['dog', '狗', { fresh: 1 }], ['gives', '端來', { fresh: 1 }], ['tea', '茶'], ['.', '']] },
      { type: 'ask', q: 'Sam 拿到了什麼?', options: [{ t: '茶', ok: true }, { t: '咖啡' }, { t: '水' }] },
      { type: 'line', who: 'S', side: 'L', words: [['Tea', '茶'], ['?', ''], ['No', '不', { fresh: 1 }], ['.', ''], ['Coffee', '咖啡'], [',', ''], ['please', '請'], ['.', '']] },
      { type: 'line', who: 'N', words: [['The', '那隻'], ['dog', '狗', { fresh: 1 }], ['gives', '端來', { fresh: 1 }], ['water', '水'], ['.', '']] },
      { type: 'line', who: 'S', side: 'L', words: [['Water', '水'], ['?!', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['Sorry', '對不起', { fresh: 1 }], ['!', '']] },
      { type: 'line', who: 'S', side: 'L', words: [['Coffee', '咖啡'], ['with', '加'], ['sugar', '糖'], [',', ''], ['please', '請'], ['.', '']] },
      { type: 'reorder', answer: 'Coffee with sugar', tiles: ['Coffee', 'with', 'sugar'] },
      { type: 'line', who: 'N', words: [['The', '那隻'], ['dog', '狗', { fresh: 1 }], ['gives', '端來', { fresh: 1 }], ['coffee', '咖啡'], ['with', '加'], ['salt', '鹽', { fresh: 1, why: 'salt(鹽)跟 sugar(糖)長得像,店員最怕拿錯的兩罐' }], ['!', '']] },
      { type: 'line', who: 'S', side: 'L', words: [['...', ''], ['Water', '水'], [',', ''], ['please', '請'], ['.', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['OK', '好', { fresh: 1 }], ['!', '']] },
      { type: 'line', who: 'N', words: [['The', '那隻'], ['dog', '狗', { fresh: 1 }], ['gives', '端來', { fresh: 1 }], ['tea', '茶'], ['.', '']] },
      { type: 'line', who: 'S', side: 'L', words: [['...', '']] },
      { type: 'ask', q: '這間店最大的問題是?', options: [{ t: '店員永遠上錯飲料', ok: true }, { t: '咖啡太貴' }, { t: '沒有位子' }] },
    ],
  },
  {
    id: 'story_cake', stage: 4, title: '誰吃了蛋糕?', icon: '🍰',
    intro: '用你會的字讀一個真的故事 —— 不會的字有橘色虛線,游標移上去看中文。',
    script: [
      { type: 'line', who: 'N', words: [['Bea', '貝雅(人名)', { fresh: 1 }], ['has', '有', { fresh: 1 }], ['a', '一個'], ['big', '大的'], ['cake', '蛋糕', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: 'B', side: 'L', words: [['I', '我'], ['love', '愛', { fresh: 1 }], ['it', '它'], ['!', '']] },
      { type: 'line', who: 'B', side: 'L', words: [['I', '我'], ['eat', '吃'], ['it', '它'], ['later', '等一下', { fresh: 1, why: 'late(晚)+r → 晚一點、等等' }], ['.', '']] },
      { type: 'line', who: 'N', words: [['Bea', '貝雅'], ['goes', '去', { fresh: 1 }], ['out', '外面', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: 'N', words: [['Bea', '貝雅'], ['comes', '回到', { fresh: 1 }], ['home', '家'], ['.', '']] },
      { type: 'line', who: 'N', words: [['The', '那個'], ['cake', '蛋糕', { fresh: 1 }], ['is', '是'], ['gone', '不見了', { fresh: 1, why: 'go(走)+ne → 走掉了=不見了' }], ['!', '']] },
      { type: 'ask', q: '蛋糕怎麼了?', options: [{ t: '不見了', ok: true }, { t: '變大了' }, { t: '還在桌上' }] },
      { type: 'line', who: 'B', side: 'L', words: [['Who', '誰', { fresh: 1 }], ['ate', '吃了', { fresh: 1, why: 'eat 的過去式 → ate,「吃了」' }], ['my', '我的'], ['cake', '蛋糕', { fresh: 1 }], ['?', '']] },
      { type: 'reorder', answer: 'Who ate my cake', tiles: ['Who', 'ate', 'my cake'] },
      { type: 'line', who: 'N', words: [['The', '那隻'], ['dog', '狗'], ['has', '有', { fresh: 1 }], ['cake', '蛋糕', { fresh: 1 }], ['on', '在', { fresh: 1 }], ['its', '牠的', { fresh: 1 }], ['face', '臉上', { fresh: 1 }], ['!', '']] },
      { type: 'line', who: 'B', side: 'L', words: [['Bad', '壞'], ['dog', '狗'], ['!', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['No', '不'], ['!', ''], ['Look', '看'], ['at', '看向'], ['the', '那個'], ['baby', '寶寶', { fresh: 1 }], ['!', '']] },
      { type: 'ask', q: '狗說是誰吃的?', options: [{ t: '寶寶', ok: true }, { t: '貓' }, { t: 'Bea 自己' }] },
      { type: 'line', who: 'N', words: [['The', '那個'], ['baby', '寶寶', { fresh: 1 }], ['is', '是'], ['happy', '開心'], ['.', '']] },
      { type: 'line', who: 'N', words: [['Cake', '蛋糕', { fresh: 1 }], ['is', '是'], ['everywhere', '到處都是', { fresh: 1, why: 'every(每個)+where(哪裡) → 到處' }], ['!', '']] },
      { type: 'line', who: 'B', side: 'L', words: [['Oh', '喔'], ['!', ''], ['The', '那個'], ['baby', '寶寶', { fresh: 1 }], ['ate', '吃了', { fresh: 1 }], ['it', '它'], ['.', '']] },
      { type: 'line', who: 'B', side: 'L', words: [['And', '而且', { fresh: 1 }], ['you', '你'], [',', ''], ['dog', '狗'], ['.', ''], ['You', '你'], ['ate', '吃了', { fresh: 1 }], ['some', '一些', { fresh: 1 }], ['too', '也', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['...', ''], ['Sorry', '對不起', { fresh: 1 }], ['.', '']] },
      { type: 'ask', q: '真相是?(要懂整個故事)', options: [
        { t: '寶寶吃掉大半,狗也偷吃了一點,還想賴給寶寶', ok: true },
        { t: '只有寶寶吃,狗是無辜的' },
        { t: '蛋糕自己不見了' },
      ] },
    ],
  },
  {
    id: 'story_home', stage: 6, title: '貓不見了', icon: '🐱',
    intro: '用這階的句型讀一個找貓的故事 —— 橘色虛線的字,游標移上去看中文。',
    script: [
      { type: 'line', who: 'N', words: [['Mia', '米亞(人名)', { fresh: 1 }], ['has', '有', { fresh: 1 }], ['a', '一隻'], ['cat', '貓'], ['.', '']] },
      { type: 'line', who: 'N', words: [['The', '那隻', { fresh: 1 }], ['cat', '貓'], ['is', '是'], ['small', '小的'], ['.', ''], ['The', '那棟', { fresh: 1 }], ['house', '房子'], ['is', '是'], ['big', '大的'], ['.', '']] },
      { type: 'line', who: 'M', side: 'L', words: [['Where', '哪裡'], ['is', '是'], ['my', '我的'], ['cat', '貓'], ['?', '']] },
      { type: 'reorder', answer: 'Where is my cat', tiles: ['Where', 'is', 'my cat'] },
      { type: 'line', who: 'N', words: [['Mia', '米亞'], ['looks', '看', { fresh: 1 }], ['at', '向'], ['the', '那棟', { fresh: 1 }], ['big', '大的'], ['house', '房子'], ['.', '']] },
      { type: 'line', who: 'M', side: 'L', words: [['Cat', '貓'], ['?', ''], ['Cat', '貓'], ['!', '']] },
      { type: 'line', who: 'N', words: [['The', '那隻'], ['dog', '狗', { fresh: 1 }], ['comes', '走過來', { fresh: 1, why: 'come=往這裡來;go=往別處去,方向相反' }], ['.', '']] },
      { type: 'line', who: 'M', side: 'L', words: [['You', '你'], ['!', ''], ['Where', '哪裡'], ['is', '是'], ['my', '我的'], ['cat', '貓'], ['?', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['Look', '看'], ['!', '']] },
      { type: 'ask', q: '狗要米亞做什麼?', options: [{ t: '看某個地方', ok: true }, { t: '回家' }, { t: '給牠點心' }] },
      { type: 'line', who: 'N', words: [['The', '那隻'], ['cat', '貓'], ['is', '在'], ['on', '在...上面', { fresh: 1 }], ['the', '那隻'], ['dog', '狗', { fresh: 1 }], ['!', '']] },
      { type: 'line', who: 'M', side: 'L', words: [['Bad', '壞'], ['cat', '貓'], ['!', ''], ['Good', '好'], ['dog', '狗', { fresh: 1 }], ['!', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['...!', '(第一次被稱讚,嚇到)']] },
      { type: 'ask', q: '貓到底在哪裡?', options: [{ t: '在狗的背上', ok: true }, { t: '在大房子外面' }, { t: '真的不見了' }] },
    ],
  },
  {
    id: 'story_speak', stage: 8, title: '會說話的狗', icon: '🗣️',
    intro: '用這階的句型讀一個問路的故事 —— 橘色虛線的字,游標移上去看中文。',
    script: [
      { type: 'line', who: 'N', words: [['A', '一個'], ['man', '男人', { fresh: 1 }], ['comes', '走向', { fresh: 1 }], ['Bea', '貝雅(蛋糕故事的主人)', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: 'M', side: 'L', words: [['Do', '(發問)'], ['you', '你'], ['speak', '說'], ['English', '英文'], ['?', '']] },
      { type: 'line', who: 'B', side: 'R', words: [['Yes', '會', { fresh: 1 }], ['!', ''], ['...a', '一', { fresh: 1 }], ['little', '點點', { fresh: 1, why: 'little=小;a little=一點點' }], ['.', '']] },
      { type: 'line', who: 'N', words: [['The', '那個'], ['man', '男人', { fresh: 1 }], ['speaks', '說話', { fresh: 1 }], ['fast', '很快', { fresh: 1 }], ['!', '']] },
      { type: 'line', who: 'B', side: 'R', words: [['...', '']] },
      { type: 'ask', q: 'Bea 聽得懂嗎?', options: [{ t: '聽不太懂,他講太快了', ok: true }, { t: '全部聽懂' }, { t: '她不會英文' }] },
      { type: 'line', who: 'B', side: 'R', words: [['Sorry', '對不起', { fresh: 1 }], ['.', ''], ['I', '我'], ['do', '(否定用)'], ['not', '不'], ['speak', '說'], ['fast', '很快的', { fresh: 1 }], ['English', '英文'], ['!', '']] },
      { type: 'reorder', answer: 'Do you speak English', tiles: ['Do you', 'speak', 'English'] },
      { type: 'line', who: 'N', words: [['The', '那個'], ['man', '男人', { fresh: 1 }], ['looks', '看', { fresh: 1 }], ['at', '向'], ['the', '那隻'], ['dog', '狗', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: 'M', side: 'L', words: [['Do', '(發問)'], ['YOU', '你(對狗開玩笑)'], ['speak', '說'], ['English', '英文'], ['?', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['Hello', '哈囉'], ['!', '']] },
      { type: 'line', who: 'N', words: [['The', '那個'], ['man', '男人', { fresh: 1 }], ['goes', '跑', { fresh: 1 }], ['home', '回家'], ['!', '']] },
      { type: 'ask', q: '那個人為什麼跑走了?', options: [{ t: '狗真的開口說話了', ok: true }, { t: 'Bea 罵他' }, { t: '他趕時間' }] },
      { type: 'line', who: 'B', side: 'R', words: [['Good', '好'], ['dog', '狗', { fresh: 1 }], ['.', '']] },
      { type: 'line', who: '🐶', side: 'R', words: [['I', '我'], ['speak', '會說'], ['English', '英文'], ['!', '']] },
    ],
  },
];
const storyForStage = stage => STORIES.find(s => s.stage === stage) || null;
const storyDone = id => !!(meta.storiesDone && meta.storiesDone[id]);

(() => {
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

  let story = null, i = 0, score = { ok: 0, total: 0 }, onDone = null;
  const scrollDown = () => { const sc = document.getElementById('dlgscroll'); if (sc) sc.scrollTop = sc.scrollHeight; };

  function start() {
    const scr = document.getElementById('screen'), home = document.getElementById('home');
    if (home) home.hidden = true;
    if (scr) scr.hidden = false;
    hideTip();
    i = 0; score = { ok: 0, total: 0 };
    shell(`${story.icon} ${story.title}<div style="font-size:14px;color:#9fb4c8;font-weight:400;margin-top:6px">${story.intro}</div>`, `
      <div id="dlgscroll" style="max-height:100%;min-height:0;overflow-y:auto;width:100%;max-width:760px;margin:0 auto;padding:2px 6px 20px">
        <div id="dlgbox" style="display:grid;gap:12px"></div>
        <div id="dlgctrl" style="margin-top:16px;display:grid;gap:10px"></div>
      </div>`);
    const body = document.getElementById('body'); if (body) body.style.justifyContent = 'flex-start';   // 故事從頂端往下長
    step();
  }

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
    if (item.who === 'N') {
      const p = document.createElement('div');
      p.style.cssText = 'text-align:center;color:#9fb4c8;font-style:italic;font-size:18px;line-height:1.6;padding:2px 10px';
      appendWords(p, item.words);
      box.appendChild(p);
    } else {
      const right = item.side === 'R';
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
    if (i >= story.script.length) return finish();
    const item = story.script[i];
    if (item.type === 'line') {
      appendLine(item); i++;
      controlButton(i >= story.script.length ? '看結果 →' : '繼續 →', step);
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
    shuffle(item.options.slice()).forEach(o => {
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
        btn.className = 'btn act'; btn.textContent = (i >= story.script.length ? '看結果 →' : '繼續 →'); btn.style.marginTop = '4px';
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
    let bank = shuffle(item.tiles.slice());
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
      cont.className = 'btn act'; cont.textContent = i >= story.script.length ? '看結果 →' : '繼續 →'; cont.style.marginTop = '4px';
      cont.onclick = step;
      ctrl.appendChild(cont);
      scrollDown();
    };
    ctrl.appendChild(chk);
    scrollDown();
  }

  function finish() {
    const ctrl = document.getElementById('dlgctrl'); if (ctrl) ctrl.innerHTML = '';   // 清掉殘留的「看結果」鈕,結局只留 why 的完成鈕
    const first = !storyDone(story.id);
    if (first) {
      meta.storiesDone = meta.storiesDone || {};
      meta.storiesDone[story.id] = true;
      meta.coins += 2; saveMeta();
      if (typeof sfx !== 'undefined') setTimeout(() => sfx.coin(), 500);
    }
    const why = document.getElementById('why');
    why.hidden = false;
    why.className = score.ok === score.total ? 'why good' : 'why bad';
    why.innerHTML = `<div class="result-head compact">📖 讀完了 · 讀懂 ${score.ok}/${score.total} 題${first ? ' · 故事獎勵 +2 🪙' : ''}</div>
      <button class="act" id="dlgnext">完成 →</button>`;
    document.getElementById('dlgnext').onclick = () => { if (onDone) onDone(); else showHome(); };
  }

  window.startStory = (s, done) => { story = s; onDone = done || null; start(); };
})();
