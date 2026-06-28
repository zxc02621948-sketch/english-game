const screen = document.getElementById('screen');
const $ = id => document.getElementById(id);

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

// 背景音樂:純 Web Audio 合成的輕柔循環琶音(不用素材;一直有聲音也能讓「沒聲就斷線」的藍牙耳機保持連線)
// 背景音樂清單:選單只列實體 mp3(放在 audio/);某首載入失敗才 fallback 合成琶音(startSynth)。合成只當保險,不再進選單。
const BGM_TRACKS = [
  { file: 'audio/bgm1.mp3', name: '① 第 1 首' },
  { file: 'audio/bgm2.mp3', name: '② 第 2 首' },
  { file: 'audio/bgm3.mp3', name: '③ 第 3 首' },
  { file: 'audio/bgm4.mp3', name: '④ 第 4 首' },
  { file: 'audio/bgm5.mp3', name: '⑤ 第 5 首' },
];
const BOSS_TRACKS = ['audio/boss1.mp3', 'audio/boss2.mp3', 'audio/boss3.mp3'];   // 打王時隨機一首;沒放就 fallback 合成
const bgm = (() => {
  let ctx, master, on = false, timer, i = 0, audio = null, panicMode = false;
  const notes = [392.0, 523.3, 659.3, 523.3, 587.3, 440.0, 523.3, 659.3];
  function synthTick() {
    if (!on || audio) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = 'triangle'; o.frequency.value = notes[i++ % notes.length] * (panicMode ? 1.5 : 1);   // 臨死:升調
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g).connect(master); o.start(t); o.stop(t + 1.7);
    timer = setTimeout(synthTick, panicMode ? 520 : 850);   // 臨死:加速
  }
  function startSynth() {
    if (audio) { audio.pause(); audio = null; }
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    master = master || (() => { const m = ctx.createGain(); m.gain.value = 0.6; m.connect(ctx.destination); return m; })();
    i = 0; synthTick();
  }
  function playTrack() {
    clearTimeout(timer); panicMode = false; if (audio) { audio.pause(); audio = null; }
    const track = BGM_TRACKS[(meta.bgmTrack || 0) % BGM_TRACKS.length];
    if (!track.file) return startSynth();                                    // 內建合成,不需檔案
    audio = Object.assign(new Audio(track.file), { loop: true, volume: 0.1 });   // 一般 BGM,不蓋過學習語音,最大 10%
    audio.play().catch(() => startSynth());                                  // 檔案沒放好 / 載失敗 → fallback 合成
  }
  function playFile(file) {
    clearTimeout(timer); panicMode = false; if (audio) { audio.pause(); audio = null; }
    if (!file) return startSynth();
    audio = Object.assign(new Audio(file), { loop: true, volume: 0.1 });   // Boss 戰鬥曲(playFile 只給 boss),最大 10%
    audio.play().catch(() => startSynth());
  }
  return {
    isOn: () => on,
    setTrack(idx) { meta.bgmTrack = idx; saveMeta(); if (on) playTrack(); },  // 換歌(播放中即時換)
    toggle() { on = !on; if (on) playTrack(); else { if (audio) audio.pause(); clearTimeout(timer); } return on; },
    boss() { if (on) playFile(BOSS_TRACKS[Math.floor(Math.random() * BOSS_TRACKS.length)]); },   // 戰鬥:隨機一首 boss BGM
    normal() { if (on) playTrack(); },                                                            // 回一般 BGM
    panic() {                                                                                      // 臨死反撲:不換曲,把當下這首加速+升調(8-bit 越快越尖越燃)
      panicMode = true;
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
