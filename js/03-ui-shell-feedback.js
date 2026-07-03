function shell(promptText, bodyHTML) {
  screen.classList.remove('boss-screen', 'done-screen', 'start-screen');
  screen.classList.add('lesson-screen');
  screen.innerHTML = `
    <div class="toprow"><button class="xexit" id="xexit" aria-label="離開">✕</button><div class="bar"><i id="bar"></i></div></div>
    <div class="count" id="count"></div>
    <main class="lesson">
      <section class="lesson-stage"><div class="prompt" id="prompt">${promptText}</div></section>
      <section class="lesson-answer" id="body">${bodyHTML}</section>
    </main>
    <div class="why" id="why" hidden></div>`;
  $('xexit').onclick = confirmExit;
  updateBar();
}
// 中途按 X:確認後回主畫面(本關沒完成 → 不過關、不解王;已答對的字熟練度本來就即時存,不動)
function confirmExit() {
  const ov = document.createElement('div');
  ov.className = 'ovl';
  ov.innerHTML = `<div class="ovlbox">
    <div class="ovltitle">確定要離開?</div>
    <div class="ovlsub">這一關還沒完成,離開後要重新開始。</div>
    <button class="btn" id="ovlquit" style="background:#2a0e12;border-color:#e35b6a">離開本關</button>
    <button class="btn" id="ovlstay" style="margin-top:10px;background:#1d2c3a;border-color:#2c3e52">繼續練習</button>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });   // 點黑底空白處 = 取消
  $('ovlstay').onclick = () => ov.remove();
  $('ovlquit').onclick = () => { ov.remove(); speechSynthesis && speechSynthesis.cancel(); showHome(); };
}
function updateBar() {
  // 上方進度條 = 這關「已答對題數 / 總共要答的題數」,每答對一題就前進一格;答完整關 = 100%(不再等整個字練完才跳一大格)
  const need = levelWords.reduce((s, w) => s + (quota[wordKey(w)] || 0), 0);
  const got  = levelWords.reduce((s, w) => s + Math.min(lgot[wordKey(w)] || 0, quota[wordKey(w)] || 0), 0);
  const pct = need ? Math.round(got / need * 100) : 0;
  const bar = $('bar'); if (bar) bar.style.width = pct + '%';
  const c = $('count'); if (c) c.textContent = `${pct}%`;
}
