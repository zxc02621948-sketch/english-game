# 背景音樂 / 音檔資料夾

mp3 都放這個 `audio/` 資料夾，檔名對應遊戲。

## 一般背景音樂（主畫面 ⚙ 設定 →「🎵 背景音樂」選一首循環）
- `bgm1.mp3` → ① 第 1 首
- `bgm2.mp3` → ② 第 2 首
- `bgm3.mp3` → ③ 第 3 首
- `bgm4.mp3` → ④ 第 4 首
- `bgm5.mp3` → ⑤ 第 5 首

選單只列這些 mp3（放幾首算幾首）；某首載入失敗（或 `file://` 擋媒體）才自動 fallback 內建合成琶音、不會變死寂。**內建合成已不在選單裡**，只當保險。想改顯示名稱：改 `index.html` 裡 `BGM_TRACKS` 的 `name`。

## Boss 戰鬥音樂（打王進場隨機一首，打完贏／輸都自動回一般 BGM）
- `boss1.mp3` / `boss2.mp3` / `boss3.mp3`

沒放就 fallback 合成。

## Suno prompt 參考（記得開 Instrumental）
- 一般學習向 lo-fi：`lo-fi chillhop, cozy study beats, warm vinyl, soft piano, mellow marimba, instrumental, no vocals, seamless loop, 75 bpm`
- 鋼琴 ambient：`calm ambient piano, soft warm pads, peaceful, minimal, instrumental, no vocals, seamless loop, slow`
- Boss 戰鬥：`energetic chiptune battle theme, driving drums, intense and playful, 8-bit, instrumental, no vocals, seamless loop, fast`

## 用法
1. Suno 生成 → 下載 → 改成上面的檔名 → 放進這個 `audio/` 資料夾。
2. 遊戲 F5 重整 → 主畫面 ⚙ 設定 → 🎵 背景音樂 選一首；打王時自動換戰鬥曲。

## 要加更多一般曲
在 `index.html` 的 `BGM_TRACKS` 加一行：`{ file: 'audio/bgm6.mp3', name: '⑥ 你的名稱' }`。Boss 曲同理加進 `BOSS_TRACKS`。

> 用獨立檔、不內嵌（base64 內嵌會讓單檔肥好幾 MB）。`file://` 載不到媒體就改用 `python -m http.server 8182 --directory E:/english-game` + Chrome 開 localhost:8182。
