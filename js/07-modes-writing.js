function askSylFill(w) {
  const syls = sylOf(w);
  if (syls.length < 2) return askType(w);                                   // 單音節沒得挖 → 直接整字聽寫
  const blankIdx = Math.floor(Math.random() * syls.length);
  const answer = syls[blankIdx];
  const otherSyls = [...new Set(BANK.flatMap(x => sylOf(x)).filter(s => s !== answer && s.length >= 2))];
  const opts = shuffle([answer, ...shuffle(otherSyls).slice(0, 3)]);
  const shown = syls.map((s, i) => i === blankIdx
    ? `<span class="syl" id="blank" style="background:#1d3450;color:#5f7488;min-width:48px">?</span>`
    : `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  shell('🔊 聽,選出缺的那一塊', `
    <button class="replay" id="replay">🔊</button>
    <div class="syllables" id="syls" style="font-size:34px">${shown}</div>
    <div class="sub2">${w.zh}</div>
    <div class="opts" id="opts" style="grid-template-columns:1fr 1fr"></div>`);
  speak(w.en);
  $('replay').onclick = () => speak(w.en);
  const box = $('opts');
  opts.forEach(o => {
    const el = document.createElement('div'); el.className = 'opt'; el.textContent = o;
    el.onclick = () => {
      if (box.classList.contains('locked')) return;
      const right = o === answer;
      box.classList.add('locked');
      if ($('blank')) { $('blank').textContent = answer; $('blank').style.color = right ? '#6ee7a8' : '#e35b6a'; }
      el.classList.add(right ? 'right' : 'wrong');
      if (!right) [...box.children].forEach(c => { if (c.textContent === answer) c.classList.add('right'); });
      finish(right, w);
    };
    box.appendChild(el);
  });
}
// 音節克漏字(寫階,長字友善):顯示音節、遮 1~2 節讓你「打」出來(不是選)。逐節對錯 → 記哪節常錯(sylMiss),之後多遮那節;最難的節有記憶法提示。
function askSylType(w) {
  const syls = sylOf(w);
  if (syls.length < 3) return askType(w);                          // 只長字(3+ 音節)才分段練;短字直接整字聽寫(治 happy 被拆 hap·py 的混亂)
  const miss = rec(w).sylMiss || {};
  const nBlank = syls.length >= 4 && Math.random() < 0.5 ? 2 : 1;  // 4+ 音節有時遮 2 節
  const wt = i => 1 + (miss[i] || 0) * 2;                          // 常錯的節權重高 → 多練那裡
  const pool = syls.map((_, i) => i), blanks = [];
  while (blanks.length < nBlank && pool.length) {
    let r = Math.random() * pool.reduce((s, i) => s + wt(i), 0), pick = pool[0];
    for (const i of pool) { r -= wt(i); if (r <= 0) { pick = i; break; } }
    blanks.push(pick); pool.splice(pool.indexOf(pick), 1);
  }
  const blank = new Set(blanks);
  const shown = syls.map((s, i) => blank.has(i)
    ? `<input class="sylinp" data-i="${i}" size="${s.length + 1}" autocomplete="off" autocapitalize="off" placeholder="?">`
    : `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  shell('長字分段練 —— 打出缺的音節', `
    <div class="syllables" id="syls" style="font-size:30px">${shown}</div>
    <div class="sub2" style="margin-top:8px">${w.zh}　<button class="replay" id="hear" style="font-size:14px;padding:6px 12px">🔊 念</button></div>
    <button class="btn act" id="submit" style="margin-top:14px">送出</button>`);
  speakSyllables(w, 0.9);
  $('hear').onclick = () => speakSyllables(w, 0.9);
  const inputs = [...document.querySelectorAll('.sylinp')];
  if (inputs[0]) inputs[0].focus();
  const go = () => {
    if (!inputs.length || inputs[0].disabled) return;
    const wrong = [];
    const clean = s => (s || '').normalize('NFKC').replace(/[^a-z]/gi, '').toLowerCase();   // 去空白/全形/非字母再比
    inputs.forEach(inp => {
      const i = +inp.dataset.i, typed = clean(inp.value);
      const ok = typed === clean(syls[i]) || (inputs.length === 1 && typed === clean(w.en));  // 打對那一節算對;只挖 1 節時「直接打整個字」也算對(治「打 happy 卻說錯」)
      inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrong');
      if (!ok) { inp.value = syls[i]; wrong.push(i); }              // 錯 → 填回正解
    });
    const c = rec(w); c.sylMiss = c.sylMiss || {};
    wrong.forEach(i => c.sylMiss[i] = (c.sylMiss[i] || 0) + 1);     // 記逐節錯誤
    save();
    clearBottomActions();   // 收掉送出 + 特訓學會鈕,別跟結算列重疊
    const allOk = !wrong.length;
    const hi = wrong.map(i => syls[i].toLowerCase()).find(s => SYL_HINT[s]);   // 常錯節有記憶法就上
    const why = $('why'); why.className = allOk ? 'why' : 'why bad';
    why.innerHTML = allOk
      ? `<div class="result-head compact">
          <div class="result-mark">✓</div>
          <div class="result-main">
            <div class="result-word">${w.en}</div>
            <div class="result-copy">整段拼對了。</div>
          </div>
        </div>
        <button class="btn act" id="cont">繼續 →</button>`
      : `<div class="result-head">
          <div class="result-mark">!</div>
          <div class="result-main">
            <div class="result-word">${w.en}<span class="result-eq"> = ${w.zh}</span></div>
            <div class="result-copy">差一點: ${syls.join(' · ')}${hi ? ` · ${hi}: ${SYL_HINT[hi]}` : ''}</div>
          </div>
        </div>
        <button class="btn act" id="cont">繼續 →</button>`;
    why.hidden = false;
    $('cont').onclick = () => { allOk ? onCorrect(w) : onWrong(w); updateBar(); nextQuestion(); };
  };
  $('submit').onclick = go;
  inputs.forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter') go(); });
}
// 寫階 dispatcher:長字第 1 次 → 音節填空(鷹架);之後 / 短字 → 整字聽寫 / 默寫
function askWrite(w) {
  if ((rec(w).mastery || 0) < 84 && sylOf(w).length >= 3) return askSylFill(w);   // 寫階低 % + 長字(3+ 音節)→ 音節填空鷹架;短字 / 高 % → 整字聽寫 / 默寫 / 看圖寫
  const pool = visualOf(w) ? [askType, askFlashType, askPicType] : [askType, askFlashType];
  return pool[Math.floor(Math.random() * pool.length)](w);
}

// 拼錯 → 把正解逐字母標出來(綠=對 紅=錯/漏)
function markLetters(target, typed) {
  let html = '正解:';
  for (let i = 0; i < target.length; i++) {
    const ok = typed[i] && typed[i].toLowerCase() === target[i].toLowerCase();
    html += `<span class="${ok ? 'ok' : 'bad'}">${target[i]}</span>`;
  }
  $('letters').innerHTML = html;
}

/* 音節表 —— 給教卡的逐塊高亮用。加新字的音節就加在這;沒加 → 整個字當一塊。 */
const SYL = {
  happy:["hap","py"], water:["wa","ter"], beautiful:["beau","ti","ful"],
  project:["pro","ject"], experience:["ex","pe","ri","ence"],
};
const sylOf = w => w.syl || SYL[w.en] || [w.en];
// 音節記憶法 / 提示(台灣學習者向,可諧音/圖像、不必正統)。長字最難背的那節答錯時上提示。key = 音節(小寫),可複用。
const SYL_HINT = {
  ence: "名詞常見尾巴,念「-ㄣ斯」:experi-ence、sci-ence、differ-ence。",
  ful: "= full 充滿(少一個 l):beauti-ful = 充滿美。",
  ti: "這裡念「踢」:beau-ti-ful。",
  ri: "念「瑞」:expe-ri-ence。",
};

// 念的同時,音節一塊一塊亮起+放大。時間是「估」的(TTS 不給精確逐音節時間)。
function speakSyllables(w, rate) {
  speak(SPEAK_AS[w.id] || w.en, rate);   // 念法覆寫(如 a → uh)
  const blocks = [...document.querySelectorAll('.syl')];
  const total = (w.en.length * 95) / rate;            // 估計總時長 ms
  let t = 0;
  blocks.forEach(b => b.classList.remove('lit'));
  sylOf(w).forEach((s, i) => {
    setTimeout(() => { blocks.forEach(b => b.classList.remove('lit')); if (blocks[i]) blocks[i].classList.add('lit'); }, t);
    t += (s.length / w.en.length) * total;
  });
  setTimeout(() => blocks.forEach(b => b.classList.remove('lit')), t + 200);
}

function teach(w) {
  const syls = sylOf(w);
  const sylHTML = syls.map(s => `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  const sylBlock = syls.length > 1
    ? `<div class="syllables teach-syllables" id="syls">${sylHTML}</div><div class="syltip teach-tip">「·」只是音節分隔,拼字沒有點</div>`
    : `<div class="syllables teach-syllables" id="syls" hidden>${sylHTML}</div>`;
  shell('先認識這個字 👀', `
    <div class="teach-layout">
      <div class="teach-main">
        <div class="fullword teach-word">${w.en}</div>
        ${sylBlock}
        <div class="sub2 teach-zh">${w.zh}</div>
      </div>
      <div class="teach-tools">
        <button class="replay" id="play">${ICON.play}念</button>
        <button class="replay" id="slow">慢念</button>
      </div>
      <div class="teach-why">${w.why}</div>
    </div>
    <button class="btn act" id="known" style="margin-top:14px">我記住了 →</button>
    <button class="btn sideact" id="iknow">這個我已經會了 →</button>`);
  $('prompt').classList.add('center');
  $('body').classList.add('teach-answer');
  document.querySelector('.lesson').classList.add('teach-lesson');
  speakSyllables(w, 0.9);                              // 進來自動念一次(帶高亮)
  $('play').onclick = () => speakSyllables(w, 0.9);
  $('slow').onclick = () => speakSyllables(w, 0.5);
  $('known').onclick = () => { onCorrect(w); updateBar(); nextQuestion(); };
  $('iknow').onclick = () => { markWordKnown(w); updateBar(); nextQuestion(); };   // 已經會了 → 標學會、跳過、不再考(整階都跳 → 直接可打王)
}
// 階梯題型池:由淺到深。階 0 教 → 1 認 → 2 說 → 3 寫。(題型本身在上面,這裡只把皮掛上階梯。)
// ★ 題型按關卡「向下取」解鎖:一關的題型池 = 所有 lv ≤ 當前關 解鎖的格式;越高關越豐富、同一關也混多種。新字一律先教。
// 每個格式: lv=第幾關解鎖 / skill=對應技能(設定可關)/ ok=該字適不適用 / run=怎麼出。
