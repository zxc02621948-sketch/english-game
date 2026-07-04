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

/* ── 拼讀規則(phonics):用正則自動偵測字裡任何位置,reusable,不必逐字建。
   規則:{ id, re(對到要標的那段,含^/$錨點), label, note, say?, exclude?(這些字不套), only?(只套這些字) } ── */
const PHONICS = [
  // 子音串(字首)
  { id:'dr',   re:/^dr/i,   label:'dr → 念「j」音',   note:'d 黏著 r 會發成 juice 的 j 音。drink 聽起來像「jrink」;dream / drive / drop 都是。', say:'jr' },
  { id:'tr',   re:/^tr/i,   label:'tr → 念「ch」音',  note:'t 黏著 r 會發成 ch 音。tree 像「chree」、truck 像「chruck」、train 像「chrain」。', say:'chr' },
  { id:'kn',   re:/^kn/i,   label:'kn → k 不發音',    note:'字首 kn 的 k 靜音,只念 n。know / knee / knife / knock。', say:'n' },
  { id:'wr',   re:/^wr/i,   label:'wr → w 不發音',    note:'字首 wr 的 w 靜音,只念 r。write / wrong / wrist。', say:'r' },
  // 字尾
  { id:'tion', re:/tion$/i, label:'-tion → 念「shun」', note:'字尾 tion 念「shun」。nation / action / station / question 一次全解鎖。', say:'shun' },
  { id:'ck',   re:/ck$/i,   label:'ck → 念一個「k」',  note:'ck 就是一個 k 音。back / duck / rock。', say:'k' },
  // 母音組合(字中任何位置)
  { id:'ee',   re:/ee/i,    label:'ee → 長音「i」',    note:'兩個 e 疊在一起念長音 i(像「衣」)。see / coffee / tree / meet。' },
  { id:'ea',   re:/ea/i,    label:'ea → 多念長音「i」', note:'ea 常念長音 i:eat / read / tea / speak;少數念短音 e:bread / head。' },
  { id:'oo',   re:/oo/i,    label:'oo → 兩種音',       note:'oo 有兩種音:短音(book / good / look)、長音(moon / food)。' },
  // 字尾 -y(子音後)念 i;用 lookbehind 只標那個 y,避開 my / buy / say(母音+y)
  { id:'y_i',  re:/(?<=[bcdfghjklmnpqrstvwxz])y$/i, label:'字尾 -y → 念「i」音', note:'子音後面的字尾 y 念 i:happy / hungry / thirsty / baby。(不是 my / buy 那種母音+y)' },
  // magic e:字尾 e 不發音 + 讓前面母音念本音;排除常見例外
  { id:'magic_e', re:/(?<=[aeiou][bcdfghjklmnpqrstvwxz])e$/i, exclude:['come','house','have','give','live','some','done','gone','none','one','are','were'],
    label:'結尾 e 不發音(magic e)', note:'字尾這個 e 不發音,而且讓前面的母音念「字母本音」:make 的 a 念 A、rice 的 i 念 I、home 的 o 念 O。' },
  // 逐字發音例外(如 friend 的 ie=frend)先不放進標註 —— 會跟拼字記法 SPELL_HINT 打架、也不是通用規則。之後若要做,再想怎麼跟拼字記法共存。
];
function phonicsMarks(en) {
  const low = en.toLowerCase(), out = [];
  for (const p of PHONICS) {
    if (p.only && !p.only.includes(low)) continue;
    if (p.exclude && p.exclude.includes(low)) continue;
    const m = en.match(p.re);
    if (!m) continue;
    out.push({ start: m.index, end: m.index + m[0].length, kind:'phonics', label:p.label, note:p.note, say:p.say });
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

/* ── 渲染層:低調色帶 + hover note + 答錯提示(資料/邏輯層不動)── */
function _annotEscape(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}
function _annotWordText(word) { return (word && word.en) || ''; }
function _annotWordForText(text) {
  const raw = String(text || '');
  const key = raw.replace(/[^a-z]/gi, '').toLowerCase();
  if (!key || typeof BANK === 'undefined') return null;
  const w = BANK.find(x => x && x.en && x.en.toLowerCase() === key);
  return w ? { ...w, en: raw.replace(/[^a-z]/gi, '') || w.en } : null;  // 保留句首 This 這類大小寫顯示
}
function annotatedWordHTML(word, opts = {}) {
  const en = _annotWordText(word);
  const wordAttr = _annotEscape(en);
  const on = showAnnotations(word, !!opts.force);
  const segs = on ? annotateSegments(word) : [{ text: en, mark: null }];
  const body = segs.map(seg => {
    if (!seg.mark) return _annotEscape(seg.text);
    const m = seg.mark;
    return `<span class="annot-mark annot-${_annotEscape(m.kind)}" tabindex="0" data-kind="${_annotEscape(m.kind)}" data-label="${_annotEscape(m.label)}" data-note="${_annotEscape(m.note)}" data-say="${_annotEscape(m.say || en)}" data-word="${wordAttr}">${_annotEscape(seg.text)}</span>`;
  }).join('');
  return `<span class="annot-word" data-word="${wordAttr}">${body}</span>`;
}
function annotatedTokenHTML(text, opts = {}) {
  const raw = String(text || '');
  const m = raw.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
  if (!m) return _annotEscape(raw);
  const w = _annotWordForText(m[2]);
  return `${_annotEscape(m[1])}${w ? annotatedWordHTML(w, opts) : _annotEscape(m[2])}${_annotEscape(m[3])}`;
}

let _annotTip;
function _annotTipEl() {
  if (!_annotTip) {
    _annotTip = document.createElement('div');
    _annotTip.id = 'annottip';
    _annotTip.innerHTML = '<b></b><div></div>';
    document.body.appendChild(_annotTip);
  }
  return _annotTip;
}
function _annotShowTip(el) {
  const t = _annotTipEl();
  t.querySelector('b').textContent = el.dataset.label || '';
  t.querySelector('div').textContent = el.dataset.note || '';
  t.style.display = 'block';
  const r = el.getBoundingClientRect(), tr = t.getBoundingClientRect();
  t.style.left = Math.max(6, Math.min(r.left, window.innerWidth - tr.width - 6)) + 'px';
  t.style.top = (r.bottom + 6) + 'px';
}
function _annotHideTip() { if (_annotTip) _annotTip.style.display = 'none'; }
function _annotSpeak(el) {
  const text = el.dataset.say || el.dataset.word || el.textContent;
  if (typeof speakWordText === 'function') speakWordText(text);
  else if (typeof speak === 'function') speak(text);
}

// 回傳一個 <span class="annot-word">:單字切段,有標記的段落=色帶+hover看註解+點擊念標記音。
function renderAnnotatedWord(word, opts = {}) {
  const t = document.createElement('template');
  t.innerHTML = annotatedWordHTML(word, opts).trim();
  return t.content.firstElementChild || document.createTextNode(_annotWordText(word));
}

function annotationErrorHTML(word, typed) {
  if (!word || !(typeof isLearned === 'function' && isLearned(word))) return '';
  const marks = marksForError(word, typed);
  if (!marks.length) return '';
  const m = marks[0];
  return `<div class="annot-error-note"><b>${_annotEscape(m.label)}</b><span>${_annotEscape(m.note)}</span></div>`;
}
let _annotLastErrorHTML = '';
function rememberAnnotationError(word, typed) {
  _annotLastErrorHTML = annotationErrorHTML(word, typed);
  return _annotLastErrorHTML;
}
function takeAnnotationErrorHTML() {
  const html = _annotLastErrorHTML;
  _annotLastErrorHTML = '';
  return html;
}
function clearAnnotationErrorHTML() { _annotLastErrorHTML = ''; }

if (typeof document !== 'undefined') {
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('.annot-mark');
    if (el) _annotShowTip(el);
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest && e.target.closest('.annot-mark')) _annotHideTip();
  });
  document.addEventListener('focusin', e => {
    const el = e.target.closest && e.target.closest('.annot-mark');
    if (el) _annotShowTip(el);
  });
  document.addEventListener('focusout', e => {
    if (e.target.closest && e.target.closest('.annot-mark')) _annotHideTip();
  });
  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('.annot-mark');
    if (!el || el.closest('button, .opt')) return;  // 選項本身已有點擊/念字行為,避免同時觸發兩次聲音
    _annotSpeak(el);
  });
}
