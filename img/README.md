# 看圖題的字圖(picture questions）

放「看圖選字」題用的圖。對應在 `index.html` 的 `IMG` map(`word_id → 路徑`)。

## 慣例(定案)
- **一個字一張、透明背景的 png**,用 word id 命名:`house.png` / `home.png` / `big.png` / `small.png`。
- 加一個字:把 `<name>.png` 丟這裡 + 在 `index.html` 的 `IMG` 加一行 `word_xxx:'img/xxx.png'`。
- **沒放也不會壞**:`visualOf` 找不到圖 → 退回 emoji(`EMOJI` map)→ 再沒有就退回看中文選英。`<img>` 載入失敗也會 `onerror` fallback 回 emoji。

## 重點
- **要去背**(透明)。白底會在深色介面變成一張白卡。給白底圖的話用下面的 helper 去背。
- **big/small 是相對的**:`small` 的圖要「小物件擺在跟 big 同尺寸的框裡」才看得出小 —— 別把 small 裁緊(裁緊就跟 big 一樣大、對比沒了)。
- **不規則圖就一字一張**;要批次,輸出「**每格同尺寸的規則網格**」才好用程式指定格子。

## 來源圖 / 切圖
- `raw_*.png` 是使用者給的「合併圖」(一張兩物),已用 Pillow 切成上面的單張 + 去背。可留可刪。
- 切法:找物件間的白色空隙切開 → `house/home` 各自裁緊;`big/small` 用同尺寸畫布置中(保留大小比例)。去背:從邊框 flood-fill 白色 → 透明(只去背景、不挖物件內部)。
