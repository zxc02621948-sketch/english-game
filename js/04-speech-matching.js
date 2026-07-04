const SPEAK_AS = { word_a: 'uh' };
const SPEECH_ALIASES = {
  word_hear: ["here"],
  word_this: ["these"],
  word_i: ["eye"],
  word_a: ["uh", "ay"],
  word_or: ["are"],
};
const normalizeSpeechText = text => text.toLowerCase().replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ').trim();
const speechTokens = text => normalizeSpeechText(text).split(' ').filter(Boolean);
function speechForms(w) {
  return [w.en, ...asList(SPEECH_ALIASES[wordKey(w)])].map(normalizeSpeechText).filter(Boolean);
}
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return dp[m][n];
}
// 寬鬆辨識:辨識結果跟目標字「開頭字母相符 + 整體夠接近」就算過 —— 只擋明顯錯誤,
// 大幅降低 Web Speech 對單字的誤判(apple → able/appel/a po 過;ball、b 開頭直接擋掉)。
function looseMatch(heard, target) {
  const h = heard.replace(/\s/g, '');
  if (!h || !target || h[0] !== target[0]) return false;
  return editDistance(h, target) <= Math.max(1, Math.ceil(target.length * 0.45));
}
// ---- 打字默寫的「拼寫容錯」(Duolingo 式 typo tolerance)----
// 現實工作是「打字 + autocorrect」,手滑漏/錯一兩個字母不該跟「不會」同罰。但守兩條:
//  ① 你打出的錯字剛好是「別的真字」→ 判錯(cat≠cut、their≠there),不然等於沒分清楚。
//  ② 只放長字;短字要求精準(短字錯一個字母多半是不會,不是手滑)。
// 逐字指定可接受的同音/變體寫法(預設空,要放才放;別跟語音的 SPEECH_ALIASES 混用 —— 那是給辨識誤判的,不是同音)。
const TYPED_ALIASES = {};
const normTyped = s => (s || '').normalize('NFKC').trim().toLowerCase().replace(/[^a-z']/g, '');
// Levenshtein + 相鄰換位算 1 步(recieve→receive 這種最常見的手滑只算 1 個差距)
function typoDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) dp[i][j] = Math.min(dp[i][j], dp[i-2][j-2] + 1);
  }
  return dp[m][n];
}
const spellTolerance = len => len <= 4 ? 0 : len <= 7 ? 1 : 2;   // 短字精準、越長越寬(≤4 字要全對,5~7 放 1、8+ 放 2)
// 回傳 'exact' | 'typo' | false —— 讓題型知道要不要提示「差一點」。key 選填(有 word 就傳 wordKey(w) 才吃得到同音別名)。
function spellCheck(typed, target, key) {
  const a = normTyped(typed), b = normTyped(target);
  if (a === b) return a ? 'exact' : false;
  if (!a || !b) return false;
  if (key && asList(TYPED_ALIASES[key]).some(x => normTyped(x) === a)) return 'exact';
  const tol = spellTolerance(b.length);
  if (!tol) return false;
  // 守衛:錯字剛好是「別的真字」(當前軌字庫)→ 不放
  if (typeof BANK !== 'undefined' && BANK.some(x => normTyped(x.en) === a && normTyped(x.en) !== b)) return false;
  return typoDistance(a, b) <= tol ? 'typo' : false;
}
const isCloseEnough = (typed, target, key) => spellCheck(typed, target, key) !== false;

function speechMatches(w, transcript) {
  const normalized = normalizeSpeechText(transcript);
  const tokens = speechTokens(transcript);
  // 1) 嚴格:辨識結果包含正確字 / 別名
  if (speechForms(w).some(form => form.includes(' ') ? normalized.includes(form) : tokens.includes(form))) return true;
  // 2) 寬鬆:整串、或任一個詞跟目標夠像就算過
  const target = normalizeSpeechText(w.en);
  return looseMatch(normalized, target) || tokens.some(t => looseMatch(t, target));
}
function sentenceSpeechMatches(targetText, transcript) {
  const target = normalizeSpeechText(targetText);
  const heard = normalizeSpeechText(transcript);
  if (!target || !heard) return false;
  if (heard.includes(target) || target.includes(heard)) return true;
  const heardTokens = speechTokens(heard);
  const targetTokens = speechTokens(target);
  if (!targetTokens.length || !heardTokens.length) return false;
  let matched = 0;
  targetTokens.forEach(tok => {
    const w = BANK.find(x => x.en.toLowerCase() === tok);
    const forms = w ? speechForms(w) : [tok];
    const ok = forms.some(form => heardTokens.includes(form)) || heardTokens.some(h => looseMatch(h, tok));
    if (ok) matched++;
  });
  const need = targetTokens.length <= 2 ? targetTokens.length : Math.ceil(targetTokens.length * 0.72);
  return matched >= need;
}

/* ---- 題型們 ---- */

// 1. 聽 → 選意思
