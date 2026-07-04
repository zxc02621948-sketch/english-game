/* ============================================================
 * 劃重點單字標註系統 —— 資料 / 邏輯層(Claude 做,console 可驗)。
 * 渲染 / 上色 / 插進各處顯示 → 交 Codex(Claude 這台看不到版面)。見 HANDOFF「★ 設計規格」。
 *
 * 契約(Codex 照這個做視覺):
 *   annotateSegments(word) → 把單字切成 [{text, mark|null}] 段落;mark = {kind,label,note,say}。
 *   showAnnotations(word, force?) → 淡出式鷹架:現在該不該顯示標記(吃 meta.annotMode + isLearned)。
 *   marksForError(word, typed) → 答錯時挑「你錯的那個點」那條(給 .why 回饋列)。
 *   renderAnnotatedWord(word, {force}) → 目前是陽春 placeholder(底線+hover+點念);Codex 換成真的染色/色帶(★ 別用螢光色)。
 *
 * 本檔目前「不接進正式流程」(沒被任何題型呼叫)→ 不影響現在的遊戲;等 Codex 接視覺 + 插進顯示單字的地方。
 * ============================================================ */

/* ── 拼讀規則(phonics):用拼法自動偵測,reusable,不必逐字建 ── */
const PHONICS = [
  { id:'dr',   at:'start', re:/^dr/i,   len:2, label:'dr → 念「j」音',   note:'d 黏著 r 會發成 juice 的 j 音。drink 聽起來像「jrink」;dream / drive / drop 都是。', say:'jr' },
  { id:'tr',   at:'start', re:/^tr/i,   len:2, label:'tr → 念「ch」音',  note:'t 黏著 r 會發成 ch 音。tree 像「chree」、truck 像「chruck」、train 像「chrain」。', say:'chr' },
  { id:'kn',   at:'start', re:/^kn/i,   len:2, label:'kn → k 不發音',    note:'字首 kn 的 k 靜音,只念 n。know / knee / knife / knock。', say:'n' },
  { id:'wr',   at:'start', re:/^wr/i,   len:2, label:'wr → w 不發音',    note:'字首 wr 的 w 靜音,只念 r。write / wrong / wrist。', say:'r' },
  { id:'tion', at:'end',   re:/tion$/i, len:4, label:'-tion → 念「shun」', note:'字尾 tion 念「shun」。nation / action / station / question 一次全解鎖。', say:'shun' },
  { id:'ck',   at:'end',   re:/ck$/i,   len:2, label:'ck → 念一個「k」',  note:'ck 就是一個 k 音。back / duck / rock。', say:'k' },
];
function phonicsMarks(en) {
  const out = [];
  for (const p of PHONICS) {
    if (!p.re.test(en)) continue;
    const start = p.at === 'end' ? en.length - p.len : 0;
    out.push({ start, end: start + p.len, kind:'phonics', label:p.label, note:p.note, say:p.say });
  }
  return out;
}

/* ── 字根表(逐字/逐根,漸進補;先放少量示範)──
   格式:小寫 en → [{sub:字根「在這個字裡真正出現的樣子」, label, note}]
   ★ 注意:字根在衍生字裡常變形(beauty→beauti、happy→happi),所以 sub 要存「表面形」,不是原形。*/
const ROOTS = {
  beautiful: [{ sub:'beauti', label:'字根 beauty = 美', note:'beauty(美,y 變 i)+ -ful(充滿)→ 充滿美 = 美麗的。' }],
  // 之後擴:port(攜帶)/ spect(看)/ … —— 每個 sub 對到它在該字裡的實際子字串
};
function rootMarks(en) {
  const list = ROOTS[en.toLowerCase()];
  if (!list) return [];
  const out = [];
  for (const r of list) {
    const i = en.toLowerCase().indexOf(r.sub.toLowerCase());
    if (i < 0) continue;
    out.push({ start:i, end:i + r.sub.length, kind:'root', label:r.label, note:r.note });
  }
  return out;
}

/* ── 一個字的所有標記(拼讀+字根),依起點排序、去重疊(重疊保留先出現的) ── */
function wordMarks(word) {
  const en = (word && word.en) || '';
  const marks = [...phonicsMarks(en), ...rootMarks(en)].sort((a, b) => a.start - b.start);
  const kept = []; let lastEnd = -1;
  for (const m of marks) { if (m.start >= lastEnd) { kept.push(m); lastEnd = m.end; } }
  return kept;
}

/* ── 把單字切成段落 [{text, mark|null}](給渲染用) ── */
function annotateSegments(word) {
  const en = (word && word.en) || '';
  const marks = wordMarks(word);
  const segs = []; let i = 0;
  for (const m of marks) {
    if (m.start > i) segs.push({ text: en.slice(i, m.start), mark: null });
    segs.push({ text: en.slice(m.start, m.end), mark: m });
    i = m.end;
  }
  if (i < en.length) segs.push({ text: en.slice(i), mark: null });
  if (!segs.length) segs.push({ text: en, mark: null });
  return segs;
}

/* ── 淡出式鷹架:現在該不該顯示標記 ──
   meta.annotMode:'learned-hide'(預設,學會即隱藏)/ 'always'(永遠顯示)/ 'off'(完全關) */
const annotMode = () => (typeof meta !== 'undefined' && meta.annotMode) || 'learned-hide';
function showAnnotations(word, force = false) {
  if (force) return true;                                        // 答錯回饋:強制顯示
  const mode = annotMode();
  if (mode === 'off') return false;
  if (mode === 'always') return true;
  return !(typeof isLearned === 'function' && isLearned(word));  // learned-hide:學會就不標
}

/* ── 答錯時挑「你錯的那個點」那條:輸入跟正解逐字比,回落在打錯位置上的標記 ── */
function marksForError(word, typed) {
  const en = (word && word.en) || '', input = (typed || '').toLowerCase();
  const marks = wordMarks(word);
  if (!marks.length) return [];
  const wrongAt = i => (input[i] || '') !== (en[i] || '').toLowerCase();
  return marks.filter(m => { for (let i = m.start; i < m.end; i++) if (wrongAt(i)) return true; return false; });
  // 只回「錯在標記段落上」那幾條;錯在沒標記的地方 → 回空(那個錯跟拼讀/字根無關,不亂跳)。整個拼錯時各標記段落自然也會命中。
}

/* ── 陽春 placeholder 渲染(★ Codex 之後換成真的染色/色帶 + 樣式,別用螢光色)── */
let _annotTip;
function _annotTipEl() {
  if (!_annotTip) {
    _annotTip = document.createElement('div');
    _annotTip.id = 'annottip';
    _annotTip.style.cssText = 'position:fixed;z-index:9999;max-width:280px;background:#0f1a26;border:1px solid #35506b;border-radius:10px;padding:8px 12px;font-size:14px;color:#e8f1fb;box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:none;display:none';
    document.body.appendChild(_annotTip);
  }
  return _annotTip;
}
function _annotShowTip(el, mark) {
  const t = _annotTipEl();
  t.innerHTML = `<b>${mark.label}</b><div style="margin-top:4px;color:#cfe0f0;line-height:1.4">${mark.note}</div>`;
  t.style.display = 'block';
  const r = el.getBoundingClientRect(), tr = t.getBoundingClientRect();
  t.style.left = Math.max(6, Math.min(r.left, window.innerWidth - tr.width - 6)) + 'px';
  t.style.top = (r.bottom + 6) + 'px';
}
function _annotHideTip() { if (_annotTip) _annotTip.style.display = 'none'; }

// 回傳一個 <span class="annot-word">:單字切段,有標記的段落=底線+hover看註解+點擊念整個字。
function renderAnnotatedWord(word, opts = {}) {
  const wrap = document.createElement('span');
  wrap.className = 'annot-word';
  const on = showAnnotations(word, opts.force);
  const segs = on ? annotateSegments(word) : [{ text: (word && word.en) || '', mark: null }];
  segs.forEach(seg => {
    const s = document.createElement('span');
    s.textContent = seg.text;
    if (seg.mark) {
      s.className = 'annot-mark annot-' + seg.mark.kind;   // Codex 用這 class 上色(annot-phonics / annot-root)
      s.dataset.kind = seg.mark.kind;
      s.style.cssText = 'text-decoration:underline dotted;text-underline-offset:3px;cursor:help';   // 陽春,待 Codex 換色帶
      s.onmouseenter = () => _annotShowTip(s, seg.mark);
      s.onmouseleave = _annotHideTip;
      s.onclick = () => { if (typeof speakWordText === 'function') speakWordText(word.en); else if (typeof speak === 'function') speak(word.en); };
    }
    wrap.appendChild(s);
  });
  return wrap;
}
