# 給 Codex 的版面收尾清單

> Claude(負責引擎/內容)這台的瀏覽器視窗是壞的(**寬只有 2px、截圖逾時**),所以下面這些**版面 / 像素 / 地圖**的活它做不了,交給你(你的環境看得到真螢幕)。
>
> **功能都已做完並用 console 驗過**,你只需要處理「長相 / 排版 / 樣式」。完整背景見 [`HANDOFF.md`](HANDOFF.md) 最上面那則快照。
>
> 原則:別退回小卡框、沿用現有設計語言(`.lesson` / `.cat` / `.tskill` / `.twordchip` 等,見 `css/*.css`);新加的東西 Claude 大多用 **inline style** 先搭起來,請幫忙收進對應的 `css/` 檔並順版面。

---

## 1.（高）移除地圖上的「王節點」——讓地圖 = 純學習路線
- **為什麼**:王已改成「小遊戲」裡的娛樂關(側欄「小遊戲」→ `showMinigames()`,挑完成過的任一階打、不影響進度),不該再掛在主學習地圖上。
- **哪裡**:`js/10-home-settings.js`
  - `mapSVG()` 裡畫王節點的部分
  - 綁定的地方:`homeEl.querySelectorAll('.mapboss') ... c.onclick = () => startChallenge(stage)`
  - 地圖浮動快捷「挑戰關」:`jumpboss` / `mapfloatjump` 相關
- **要什麼**:地圖只留**學習關**節點,不畫王節點;王只從側欄「小遊戲」進。
- **順帶**:過關結算頁(`js/08-lesson-flow.js` 的 `showDone`)那顆「🎮 玩第 X 階挑戰關」鈕,你決定要留(當過關獎勵提示)還是改成「→ 去小遊戲」。

## 2.（高）小遊戲 hub 版面 —— `showMinigames()`
- **狀態**:Claude 用 **inline style** 搭的(`js/10-home-settings.js` 的 `showMinigames()`)。功能對(側欄「小遊戲」點進去 → 列各階王戰 → 點了 `startChallenge`),但**賣相陽春**。
- **要什麼**:inline style 收進 `css/06-home-map.css`(給 `.mgstage`、hub 卡片之類正式 class),卡片/清單間距順一下,跟 `showTrainPicker`(單字特訓)的風格一致。

## 3.（中）單字特訓新加的 UI —— 收 inline style
- **狀態**:Claude 在挑字頁加了「**還不會 / 已學會**」模式切換(`.tmode` pill,inline style)+ 已學會字卡顯示「會」(`.tpct`)。功能對,樣式是 inline。
- **要什麼**:給 `.tmode` 正式 CSS(選中/未選狀態),跟旁邊的 `.tskill` 技能鈕視覺一致(技能鈕現在也改成**可複選**了)。

## 4.（中）回應題情境卡 —— `sentence_respond`
- **狀態**:`js/06-modes-sentence.js` 的 `askRespond()` 裡「朋友說一句 + And you? 你呢?」情境卡(class `.respond-scenario`)是 inline style。它走 `mountArrange`(現成關卡 UI)所以主體 OK,只有那張 intro 卡是自訂。
- **要什麼**:看那張卡在關卡頁排得順不順(stage4+ 才會自然出;或 console 直接 `askRespond(currentSentenceSourceWords(), ()=>{}, ()=>{})` 看),要的話給 `.respond-scenario` 正式 CSS。

## 5.（之後）沉浸 / 故事關版面 —— 等 B 正式做進遊戲時
- 目前還是**原型**(`js/proto-respond.js`,console 叫 `protoStory()` / `protoImmerse()`),完全隔離、不在正式流程裡。等 B 正式做進遊戲(當階段收尾)再處理版面。你可以先玩原型感受方向(單欄捲動 + hover 看中文/aha + 重組 + 選擇)。

---

## 6.（新，資料層已備好）劃重點單字標註系統 —— 接 rendering
- **狀態**:Claude 已做好**資料/邏輯層**並 console 驗過(`js/04-annotate.js`;目前 **inert、沒接進正式流程 → 不影響現在遊戲**)。契約都定好:
  - `annotateSegments(word)` → `[{text, mark|null}]`(mark 有 `kind:'phonics'|'root'`、`label`、`note`、`say`)
  - `showAnnotations(word, force?)` → 淡出式鷹架(吃 `meta.annotMode`:`learned-hide`(預設)/`always`/`off` + `isLearned`;`force`=答錯回饋強制顯示)
  - `marksForError(word, typed)` → 答錯時「你錯的那個點」那條(給 `.why`)
  - `renderAnnotatedWord(word,{force})` → **陽春 placeholder**(底線+hover看註解+點念)
- **要什麼(Codex)**:
  1. 把 `renderAnnotatedWord` 的陽春樣式**換成真的染色/色帶**(phonics 一色、root 一色;★ **別用螢光**,螢幕上會刺眼)+ 定 `.annot-mark` / `.annot-phonics` / `.annot-root` 的 CSS。
  2. **插進所有顯示單字的地方**(教卡、題目、排詞塊…):本來直接印 `w.en` 的地方改用 `renderAnnotatedWord(w)`。
  3. **設定頁三態開關**(寫 `meta.annotMode`),跟聽說讀寫技能開關同排。
  4. **答錯回饋**:`.why` 面板把 `marksForError(w, 輸入)` 那條註解顯示出來(學會的字答錯才跳)。
- 完整設計見 [`HANDOFF.md`](HANDOFF.md)「★ 設計規格:劃重點單字標註系統」。

---

*寫於 2026-07-04(Claude Opus 4.8)。做完可刪本檔。*
