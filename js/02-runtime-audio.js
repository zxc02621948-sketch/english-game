const screen = document.getElementById('screen');
const $ = id => document.getElementById(id);

// 極簡線條圖示(內嵌 SVG,stroke 跟著文字顏色/字級走;取代按鈕上的 emoji)。純文字夠清楚的鈕就不放圖示。
const _ico = p => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  play:    _ico('<path d="M4 9.5v5h3.5L12 18V6L8 9.5H4Z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/>'),
  mute:    _ico('<path d="M4 9.5v5h3.5L12 18V6L8 9.5H4Z"/><path d="m16 10 4 4M20 10l-4 4"/>'),
  gear:    _ico('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>'),
  refresh: _ico('<path d="M20 11a8 8 0 1 0-2.4 5.7"/><path d="M20 5v5h-5"/>'),
  coin:    _ico('<circle cx="12" cy="12" r="8.3"/><circle cx="12" cy="12" r="3.4"/>'),
  close:   _ico('<path d="m6 6 12 12M18 6 6 18"/>'),
  lock:    _ico('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>'),
  target:  _ico('<circle cx="12" cy="12" r="8.3"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>'),
  flag:    _ico('<path d="M6 21V4.5"/><path d="M6 5h11l-2.2 3.4L17 12H6"/>'),
  book:    _ico('<path d="M12 6.6C10.5 5.3 8.3 4.8 6 5.1v12c2.3-.3 4.5.2 6 1.5 1.5-1.3 3.7-1.8 6-1.5v-12c-2.3-.3-4.5.2-6 1.5Z"/><path d="M12 6.6v12.4"/>'),
  briefcase: _ico('<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V6.6A1.6 1.6 0 0 1 10.6 5h2.8A1.6 1.6 0 0 1 15 6.6V8"/><path d="M4 13h16"/>'),
};

// 挑最好的英文語音:Chrome 常有「Google US English」自然很多,但不指定就會被隨便挑(常選到死板的微軟 David/Zira)。
let bestVoice = null;
function pickBestVoice() {
  const vs = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => /^en/i.test(v.lang));
  if (!vs.length) return;
  const score = v => (/google/i.test(v.name) ? 10 : 0) + (/natural|aria|jenny|guy|libby/i.test(v.name) ? 6 : 0)
                   + (/en[-_]?US/i.test(v.lang) ? 3 : 0) + (/en[-_]?GB/i.test(v.lang) ? 1 : 0);
  bestVoice = [...vs].sort((a, b) => score(b) - score(a))[0];
}
if (window.speechSynthesis) { pickBestVoice(); speechSynthesis.addEventListener('voiceschanged', pickBestVoice); }   // getVoices 常一開始是空的 → voiceschanged 再補
function speak(text, rate = 0.95) {
  if (!window.speechSynthesis) return;
  if (!bestVoice) pickBestVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = rate;
  if (bestVoice) { try { u.voice = bestVoice; } catch {} }   // 設語音失敗就退回預設,別讓 speak 整個爆掉連累呼叫端
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

// 音效:純 Web Audio 合成,不需任何素材檔(維持單檔)。第一次使用者互動後才會出聲(瀏覽器政策)。
const sfx = (() => {
  let ctx = null;
  const tone = (freq, dur, type, vol, delay) => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  };
  return {
    correct: () => { tone(660, 0.12, 'triangle', 0.22); tone(880, 0.16, 'triangle', 0.22, 0.09); },   // 叮 ↗
    wrong:   () => { tone(196, 0.25, 'sawtooth', 0.16); },                                              // 嗯 ↘
    coin:    () => { tone(988, 0.08, 'square', 0.16); tone(1319, 0.13, 'square', 0.16, 0.07); },        // 叮噹
    done:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.22, i * 0.12)),  // 過關小旋律
    tap:     () => tone(660, 0.035, 'square', 0.08),                                                    // 點按鈕輕「嗒」
  };
})();

// 背景音樂:只播放實體 mp3(放在 audio/)。不再提供合成音 fallback,避免音樂意外自己響起。
const BGM_TRACKS = [
  { file: 'audio/bgm1.mp3', name: '① 第 1 首' },
  { file: 'audio/bgm2.mp3', name: '② 第 2 首' },
  { file: 'audio/bgm3.mp3', name: '③ 第 3 首' },
  { file: 'audio/bgm4.mp3', name: '④ 第 4 首' },
  { file: 'audio/bgm5.mp3', name: '⑤ 第 5 首' },
];
const BOSS_TRACKS = ['audio/boss1.mp3', 'audio/boss2.mp3', 'audio/boss3.mp3'];   // 打王時隨機一首;沒放就安靜
const bgm = (() => {
  let on = false, audio = null;
  function stopAudio() {
    if (audio) { audio.pause(); audio = null; }
  }
  function playPath(file) {
    stopAudio();
    if (!file) return;
    const next = Object.assign(new Audio(file), { loop: true, volume: 0.1 });
    audio = next;
    next.play().catch(() => { if (audio === next) { stopAudio(); on = false; } });
  }
  function playTrack() {
    const track = BGM_TRACKS[(meta.bgmTrack || 0) % BGM_TRACKS.length];
    playPath(track && track.file);
  }
  function playBossTrack() {
    playPath(BOSS_TRACKS[Math.floor(Math.random() * BOSS_TRACKS.length)]);
  }
  return {
    isOn: () => on,
    setTrack(idx) { meta.bgmTrack = idx; saveMeta(); if (on) playTrack(); },  // 換歌(播放中即時換)
    toggle(mode = 'normal') { on = !on; if (on) (mode === 'boss' ? playBossTrack() : playTrack()); else stopAudio(); return on; },
    boss() { if (on) playBossTrack(); },   // 戰鬥:隨機一首 boss BGM
    normal() { if (on) playTrack(); },                                                           // 回一般 BGM
    panic() {
      if (audio) { audio.preservesPitch = false; audio.webkitPreservesPitch = false; audio.playbackRate = 1.3; }
    },
  };
})();
let micStream = null;
function micPermissionHint() {
  if (typeof location !== 'undefined' && location.protocol === 'file:') return '請用 Chrome 開 localhost:8182,不要直接開檔案,麥克風權限才會穩。';
  if (typeof window !== 'undefined' && window.isSecureContext === false) return '這個網址不是安全來源。請用 Chrome 開 http://localhost:8182。';
  return '請確認 Chrome 網址列左側的麥克風權限已允許,再試一次。';
}
async function ensureMicAccess() {
  if (micStream && micStream.active) return true;
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    micStream = null;
    return false;
  }
}

// 每題的共用外殼:進度條 + 題目提示 + body + 答錯解說區(#why)
