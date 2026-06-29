function askListenPick(w) {
  shell('🔊 聽,選出它的意思', `<button class="replay" id="replay">🔊</button><div class="opts" id="opts"></div>`);
  $('body').classList.add('choice-answer');
  speak(w.en);
  $('replay').onclick = () => speak(w.en);
  mountChoices($('opts'), fourOptions(w), o => o.zh, w, w.zh);
}

// 2. 看中文 → 選英文
function askReadPick(w) {
  shell('看中文,選出英文', `<div class="bigzh">${w.zh}</div><div class="opts" id="opts"></div>`);
  $('body').classList.add('choice-answer');
  mountChoices($('opts'), fourOptions(w), o => o.en, w, w.en);
}

// 2b. 聽發音 → 選英文字(認階:聽音對字形)
function askListenWord(w) {
  shell('🔊 聽,選出正確的字', `<button class="replay" id="replay">🔊</button><div class="opts" id="opts"></div>`);
  $('body').classList.add('choice-answer');
  speak(w.en);
  $('replay').onclick = () => speak(w.en);
  mountChoices($('opts'), fourOptions(w), o => o.en, w, w.en);
}

// 玩法層:有圖像感的具體字 → emoji(看圖選詞用;沒列到的字就不出圖像題)。跟 SPEECH_ALIASES 同層,不進 BANK。
const EMOJI = {
  word_cat:"🐱", word_water:"💧", word_book:"📚", word_happy:"😄", word_friend:"👥", word_house:"🏠", word_home:"🏠",
  word_eat:"🍽️", word_drink:"🥤", word_go:"🚶", word_come:"🙋", word_buy:"🛒",
  word_rice:"🍚", word_bread:"🍞", word_tea:"🍵", word_milk:"🥛",
  word_look:"👀", word_see:"👁️", word_listen:"👂", word_hear:"👂", word_speak:"🗣️",
  word_say:"💬", word_big:"🐘", word_small:"🐜", word_good:"👍", word_bad:"👎",
};
// 玩法層:具體字 → 自製圖(放 img/,優先於 emoji;沒檔 onerror 自動 fallback 回 emoji)。跟 EMOJI 同層,不進 BANK。
const IMG = { word_house:'img/house.png', word_home:'img/home.png', word_big:'img/big.png', word_small:'img/small.png', word_beautiful:'img/beautiful.png', word_project:'img/project.png', word_experience:'img/experience.png' };
const visualOf = w => IMG[wordKey(w)] || EMOJI[wordKey(w)] || null;   // 看圖題的視覺:圖優先、其次 emoji
// 視覺「概念」去重:不同 emoji 但畫面上是同一個東西(👀 看 / 👁️ 看見 都是眼睛)→ 看圖題要當成同一視覺,免得圖分不出 look/see。同視覺守衛用這個比,不是比 emoji 字串。
const VISUAL_ALIAS = { '👁️': '👀' };
const visualKey = w => { const v = visualOf(w); return v ? (VISUAL_ALIAS[v] || v) : null; };
const picHTML = (w, size = 130) => {                                  // 把視覺(圖/emoji)渲染出來,看圖說 / 看圖寫共用
  const v = visualOf(w); if (!v) return '';
  return v.endsWith('.png') ? `<img src="${v}" alt="" style="width:${size}px;height:${size}px;object-fit:contain">` : `<div style="font-size:64px">${v}</div>`;
};
// 2d. 看圖選英文字(認階,Duolingo 經典)。優先用自製圖、其次 emoji;沒視覺 → 退回看中選英,不硬出圖。
function askPicture(w) {
  const v = visualOf(w);
  if (!v) return askReadPick(w);
  const opts = fourOptions(w);
  // 視覺要能唯一指向 w:有別的選項共用同一視覺概念(listen/hear 都👂、look/see 都眼睛)→ 退回看中選英。home/house 是不同的圖,可正常出圖。
  if (opts.some(o => o.en !== w.en && visualKey(o) === visualKey(w))) return askReadPick(w);
  const isImg = v.endsWith('.png');
  const vis = isImg
    ? `<div style="text-align:center;margin:6px 0 14px"><img id="picimg" src="${v}" alt="" style="width:150px;height:150px;object-fit:contain"></div>`
    : `<div style="text-align:center;font-size:72px;margin:6px 0 16px">${v}</div>`;
  shell('這個圖是哪個字?', `${vis}<div class="opts" id="opts"></div>`);
  $('body').classList.add('choice-answer');
  if (isImg) { const im = $('picimg'); if (im) im.onerror = () => { im.outerHTML = `<div style="font-size:72px">${EMOJI[wordKey(w)] || '❓'}</div>`; }; }   // 圖載不到 → fallback emoji
  mountChoices($('opts'), opts, o => o.en, w, w.en);
}

// 2c. 文字配對(認階):一次 5 組英↔中,點英再點中配對,全對才過。配對夥伴優先用「已教過」的字,current 記分、其餘順便複習。
function askMatch(w) {
  const seen = new Set([w.zh]), uniq = x => !seen.has(x.zh) && (seen.add(x.zh), true);   // 中文不重複 → 避免「兩個是」這種無法配對
  let others = shuffle(BANK.filter(x => x.id !== w.id && !isFresh(x) && x.pos === w.pos)).filter(uniq);
  if (others.length < 3) { seen.clear(); seen.add(w.zh); others = shuffle(BANK.filter(x => x.id !== w.id && !isFresh(x))).filter(uniq); }   // 只用教過的、中文不重複;不夠就少幾組
  let pool = [w, ...others.slice(0, 3)];   // 4 組(原 5 組在固定不捲版面 + 特訓那顆鈕會被切到底部)
  const ens = shuffle(pool), zhs = shuffle(pool);
  shell('把英文和中文配對起來', `<div class="match-grid">
    <div class="opts" id="ens" style="flex:1"></div>
    <div class="opts" id="zhs" style="flex:1"></div></div>`);
  $('body').classList.add('match-answer');
  const ensBox = $('ens'), zhsBox = $('zhs');
  let pickedEn = null, matched = 0;
  const mk = (box, o, text, on) => { const el = document.createElement('div'); el.className = 'opt'; el.textContent = text; el.onclick = () => on(el, o); box.appendChild(el); };
  ens.forEach(o => mk(ensBox, o, o.en, selEn));
  zhs.forEach(o => mk(zhsBox, o, o.zh, selZh));
  function selEn(el, o) {
    if (el.classList.contains('right')) return;
    speak(o.en);                                       // 點英文塊 → 念一次(邊配邊練聽)
    [...ensBox.children].forEach(c => c.classList.remove('sel'));
    el.classList.add('sel'); pickedEn = { el, o };
  }
  function selZh(el, o) {
    if (!pickedEn || el.classList.contains('right')) return;
    if (pickedEn.o.id === o.id) {
      pickedEn.el.classList.add('right'); pickedEn.el.classList.remove('sel'); el.classList.add('right');
      pickedEn = null; matched++;
      if (matched === pool.length) {
        onCorrect(w); updateBar();
        finishGroupSuccess('配對完成', `${pool.length} 組英文和中文都配對好了。`, nextQuestion);
      }
    } else {
      const bad = pickedEn.el; el.classList.add('wrong');
      setTimeout(() => { el.classList.remove('wrong'); bad.classList.remove('sel'); }, 450);
      pickedEn = null;
    }
  }
}

// 3. 看英文 → 開口說(語音辨識)。念對→字變藍;判不出→變紅;同字最多 3 次,沒過就丟後面補考。
//    不管對或連錯 3 次,結算都示範一次正確念法。
// 說題 dispatcher:說階第 1 次 → 跟讀(先示範念);夠熟(第 2 次)→ 直接說 / 盲聽念 隨機,提高難度
function askSpeak(w) {
  const early = (rec(w).mastery || 0) < 50;              // 說階低 % → 先跟讀示範;熟一點 → 直接說 / 盲聽 / 看圖說
  if (early) return renderSpeak(w, 'shadow');
  const modes = visualOf(w) ? ['direct','blind','pic'] : ['direct','blind'];
  renderSpeak(w, modes[Math.floor(Math.random() * modes.length)]);
}
function renderSpeak(w, mode) {
  const prompt = mode === 'shadow' ? '先聽我念一次,再換你念 🔊 → 🎤'
               : mode === 'blind'  ? '🔊 聽,然後念出來(念完才看到字)'
               : mode === 'pic'    ? '看圖,說出這個英文字 🎤'
               :                     '看著它,照音節念出來';
  const hearBtn = (mode === 'shadow' || mode === 'blind')
    ? `<div class="speakrow"><button class="replay" id="demo">🔊 ${mode === 'blind' ? '再聽一次' : '聽示範'}</button></div>` : '';
  const sylHTML = sylOf(w).map(s => `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  const blindHTML = sylOf(w).map(s => `<span class="syl">${'＿'.repeat(s.length)}</span>`).join('<span class="sep">·</span>');   // 盲聽遮罩:照音節分塊、每塊長度=該音節字母數(揭曉時同結構填回真音節)
  const zhHint = mode === 'pic' ? '' : `<div class="sub2">${w.zh}</div>`;
  shell(prompt, `
    <div class="syllables" id="bigen" style="margin:6px 0">${mode === 'blind' ? blindHTML : mode === 'pic' ? picHTML(w) : sylHTML}</div>
    ${mode === 'blind' || mode === 'pic' ? '' : '<div class="syltip">念到哪一塊就亮哪一塊</div>'}
    ${zhHint}
    ${hearBtn}
    <button class="btn act" id="mic">🎤 ${mode === 'shadow' ? '換我念' : '我念'}</button>
    <div class="skipline"><button class="btn sideact" id="skipspeak">跳過說題</button></div>`);
  if (mode === 'shadow' || mode === 'blind') speakSyllables(w, 0.9);   // 跟讀 / 盲聽:進場示範念 + 音節逐塊高亮(跟教卡同款)
  if ($('demo')) $('demo').onclick = () => speakSyllables(w, 0.9);
  $('skipspeak').onclick = () => {
    if ($('skipchoices')) return;
    $('skipspeak').style.display = 'none';
    $('prompt').textContent = '要怎麼處理這題說話練習?';
    $('body').insertAdjacentHTML('beforeend',
      `<div class="skipchoices" id="skipchoices">
         <button class="btn" id="skip1">只跳這題</button>
         <button class="btn danger" id="skipall">以後都跳過說題</button>
       </div>`);
    $('skip1').onclick = () => { onCorrect(w); updateBar(); nextQuestion(); };
    $('skipall').onclick = () => { meta.skills = meta.skills || {}; meta.skills.speak = false; saveMeta(); onCorrect(w); updateBar(); nextQuestion(); };
  };
  attachSpeechMic(w);
}
// 說題共用:語音辨識 + 3 次嘗試 + 標色 + 結算(三種說題模式都走這裡)
function attachSpeechMic(w) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {                                  // 非 Chrome:沒語音 → 聽一次正確念法就過
    $('prompt').textContent = '這環境沒語音,聽一次正確念法';
    $('mic').textContent = '🔊 聽念法 → 過';
    $('mic').onclick = () => speakResult(w, true);
    return;
  }
  let tries = 0;
  $('mic').onclick = async () => {
    const mic = $('mic');
    if (!mic || mic.disabled) return;
    mic.disabled = true;
    $('prompt').textContent = '正在確認麥克風權限…';
    const canUseMic = await ensureMicAccess();
    if (!canUseMic) {
      $('prompt').textContent = micPermissionHint();
      mic.disabled = false;
      return;
    }
    speechSynthesis.cancel();
    const r = new SR(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3;
    $('prompt').textContent = '🎤 在聽你念…';
    let settled = false, gotResult = false, timeoutId = null, lastHeard = '';
    const finishAttempt = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (ok) { markSpeak(true); speakResult(w, true); }
      else {
        tries++;
        markSpeak(false);
        if (tries < 2) {
          const heard = lastHeard ? ` 它聽成: ${lastHeard}` : '';
          $('prompt').textContent = `沒抓到「${w.en}」,再念一次${heard}`;
          if ($('mic')) $('mic').disabled = false;
        } else {
          offerSelfAssess(w);   // 辨識 2 次都抓不到 → 改自評(辨識對單字本來就弱),不卡關、不扣分
        }
      }
    };
    const failAttempt = () => {
      try { r.abort(); } catch {}
      finishAttempt(false);
    };
    r.onresult = e => {
      gotResult = true;
      lastHeard = normalizeSpeechText([...e.results].map(result => result[0]?.transcript || '').join(' '));
      finishAttempt(speechMatches(w, lastHeard));
    };
    r.onnomatch = failAttempt;
    r.onerror = failAttempt;
    r.onend = () => { if (!settled && !gotResult) finishAttempt(false); };
    timeoutId = setTimeout(failAttempt, 6500);
    try { r.start(); } catch { failAttempt(); }
  };
}
// 說題:把那個字標成藍(念對)/ 紅(判不出)
function markSpeak(ok) { const el = $('bigen'); if (el) { el.classList.remove('ok','bad'); el.classList.add(ok ? 'ok' : 'bad'); } }
// 說題結算:一律示範一次正確念法 + 🔊 可重聽;對 → 前進,連錯 3 次 → 丟後面補考
function speakResult(w, ok) {
  ok ? sfx.correct() : sfx.wrong();
  const be = $('bigen');
  if (be && be.textContent.includes('＿')) be.innerHTML = sylOf(w).map(s => `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');  // 盲聽:結算時揭曉(用音節分塊)
  speak(w.en);
  if ($('mic')) $('mic').style.display = 'none';
  ['demo', 'skipspeak'].forEach(id => { const el = $(id); if (el) (el.closest('.speakrow') || el.closest('.skipline') || el).style.display = 'none'; });  // 收掉題目原本的「聽示範」+「跳過」,別跟下面的「再聽」重複
  { const sc = $('skipchoices'); if (sc) sc.style.display = 'none'; }
  $('prompt').textContent = ok ? '✅ 念對了!再聽一次正確念法' : '沒抓到,先聽正確念法,這個字等等補考';
  $('body').insertAdjacentHTML('beforeend',
    `<div class="speakrow"><button class="replay" id="again">🔊 再聽</button></div>
     <button class="btn act" id="cont">繼續 →</button>`);
  $('again').onclick = () => speak(w.en);
  $('cont').onclick = () => { ok ? onCorrect(w) : onWrong(w); updateBar(); nextQuestion(); };
}
// 辨識抓不到時的自評:Web Speech 對單字辨識本來就不準,別硬判失敗 → 讓使用者自己確認,過了不扣分
function offerSelfAssess(w) {
  if ($('mic')) $('mic').style.display = 'none';
  ['demo', 'skipspeak'].forEach(id => { const el = $(id); if (el) (el.closest('.speakrow') || el.closest('.skipline') || el).style.display = 'none'; });  // 收掉題目原本的「聽示範」+「跳過」,別跟自評的「再聽正解」重複
  { const sc = $('skipchoices'); if (sc) sc.style.display = 'none'; }
  const be = $('bigen');
  if (be && be.textContent.includes('＿')) be.innerHTML = sylOf(w).map(s => `<span class="syl">${s}</span>`).join('<span class="sep">·</span>');
  speak(w.en);
  $('prompt').textContent = '辨識常抓不準單字發音 —— 你自己聽,念對了嗎?';
  $('body').insertAdjacentHTML('beforeend',
    `<div class="speakrow"><button class="replay" id="again">🔊 再聽正解</button></div>
     <div class="buildactions">
       <button class="btn" id="selfok" style="background:#0e2a1f;border-color:#1f5c3f">✅ 念對了,過</button>
       <button class="btn" id="selfretry" style="background:#1d2c3a;border-color:#2c3e52">🎤 再試一次</button>
     </div>`);
  $('again').onclick = () => speak(w.en);
  $('selfok').onclick = () => { sfx.correct(); onCorrect(w); updateBar(); nextQuestion(); };   // 自評過 → 算對、不扣分
  $('selfretry').onclick = () => renderSpeak(w, 'shadow');                                      // 再試 → 回跟讀重來
}

// 4. 聽 → 拼寫(打字),拼錯標到字母
function askType(w) {
  shell('🔊 聽,把它拼出來', `<button class="replay" id="replay">🔊</button><input class="inp" id="inp" autocomplete="off" autocapitalize="off" placeholder="打出這個字…"><button class="btn act" id="submit">送出</button><div class="letters" id="letters"></div>`);
  speak(w.en);
  $('replay').onclick = () => speak(w.en);
  const inp = $('inp'); inp.focus();
  const go = () => {
    if (inp.disabled) return;
    const typed = inp.value.trim();
    const right = typed.toLowerCase() === w.en.toLowerCase();
    if (!right) markLetters(w.en, typed);
    inp.disabled = true; $('submit').disabled = true;
    finish(right, w);
  };
  $('submit').onclick = go;
  inp.onkeydown = e => { if (e.key === 'Enter') go(); };
}

// 5. 看 2 秒 → 默寫
function askFlashType(w) {
  shell('記住它…', `<div class="bigen" id="flash">${w.en}</div>`);
  setTimeout(() => {
    if (!$('flash')) return;  // 已換頁就不動作
    shell('剛剛那個字,拼出來', `<input class="inp" id="inp" autocomplete="off" autocapitalize="off" placeholder="默寫…"><button class="btn act" id="submit">送出</button><div class="letters" id="letters"></div>`);
    const inp = $('inp'); inp.focus();
    const go = () => {
      if (inp.disabled) return;
      const typed = inp.value.trim();
      const right = typed.toLowerCase() === w.en.toLowerCase();
      if (!right) markLetters(w.en, typed);
      inp.disabled = true; $('submit').disabled = true;
      finish(right, w);
    };
    $('submit').onclick = go;
    inp.onkeydown = e => { if (e.key === 'Enter') go(); };
  }, 2000);
}

// 看圖 → 打出英文(寫階變化:不靠聽,靠圖回想拼字)
function askPicType(w) {
  shell('看圖,打出這個英文字', `<div style="text-align:center;margin:6px 0 22px">${picHTML(w, 150)}</div><input class="inp" id="inp" autocomplete="off" autocapitalize="off" placeholder="打出這個字…"><button class="btn act" id="submit">送出</button><div class="letters" id="letters"></div>`);
  const inp = $('inp'); inp.focus();
  const go = () => {
    if (inp.disabled) return;
    const typed = inp.value.trim();
    const right = typed.toLowerCase() === w.en.toLowerCase();
    if (!right) markLetters(w.en, typed);
    inp.disabled = true; $('submit').disabled = true;
    finish(right, w);
  };
  $('submit').onclick = go;
  inp.onkeydown = e => { if (e.key === 'Enter') go(); };
}

// 找「w 能當 slot 填進去」且固定詞都教過的句型
function patternsForWord(w) {
  return PATTERNS.filter(p => patternRequirementsMet(p) && Object.values(p.slots).some(slot => wordMatchesSlot(w, slot)));
}
// 句中挖空選詞(認階,Duolingo「complete the translation」):用句型生句、挖掉 w 那格、4 選 1。
// w 填不進任何已解鎖句型 → 退回看中選英,不出空句。
function askClozePick(w) {
  const pats = patternsForWord(w);
  if (!pats.length) return askReadPick(w);
  const pat = shuffle(pats)[0];
  const slotName = Object.keys(pat.slots).find(n => wordMatchesSlot(w, pat.slots[n]));
  const blanked = s => s.replace(new RegExp(`\\{${slotName}\\}`), '＿＿').replace(/\{\w+\}/g, '');
  const filledZh = s => s.replace(new RegExp(`\\{${slotName}\\}`), wordZhForSlot(w, pat.slots[slotName])).replace(/\{\w+\}/g, '');
  const slotOptions = () => {
    const opts = [w];
    const push = o => { if (o && o.id !== w.id && !opts.some(x => x.id === o.id)) opts.push(o); };
    shuffle(getEligibleWords(pat.slots[slotName], BANK).filter(o => !isFresh(o))).forEach(push);
    shuffle(BANK.filter(o => o.pos === w.pos && !isFresh(o))).forEach(push);
    return shuffle(opts.slice(0, 4));
  };
  shell('選出空格裡該填的字', `
    <div class="bigzh" style="font-size:22px">${filledZh(pat.zh)}</div>
    <div class="cloze-choice-line">${blanked(pat.text)}</div>
    <div class="opts" id="opts"></div>`);
  screen.classList.add('cloze-pick-screen');
  $('body').classList.add('choice-answer', 'cloze-choice-answer');
  mountChoices($('opts'), slotOptions(), o => o.en, w, w.en);
}

// 教句型結構:沒教過的句型,排詞前先教「英文怎麼排」(不然只學了字、沒學排列)
