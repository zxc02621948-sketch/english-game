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
