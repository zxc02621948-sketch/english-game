# 讓英文有道理 — 開發交接（完整快照）

> 給下一個接手的你(Claude / GPT / Codex):這份是**當前真實狀態**的濃縮,先讀完再動手。逐筆改動歷史在 `CHANGELOG.md`(看尾段抓最新),內容新增規則在 `CONTENT_RULES.md`。
>
> ★ **跟這位使用者合作的心法(最重要,最痛的教訓)**:講**中文**、直白、**別 hype**、**別過度生產/過度解釋**、給**推薦不是清單**、自己錯就乾淨認(別 grovel)、**不確定意圖就問、別腦補**、**動引擎/架構前先想「會不會封死之後的疊加」**、**改完一定用瀏覽器 console 驗過再說「好了」**。他會很仔細地玩、一個個抓出不合理處,你照著修就好。
>
> ★ **讀檔注意**:不要用 PowerShell 讀取/檢查專案檔案,中文常會顯示成亂碼,容易誤判。優先用 Node.js `fs.readFileSync(path, 'utf8')`、瀏覽器 console、或其他明確 UTF-8 的方式讀檔。

---

## 最新交接快照（2026-07-02 深夜 / Claude Opus 4.8）— 工作英文 = 主線引擎的第二條「軌」（多軌重構）

> 這輪的最終定案:**不要幫工作英文另做引擎**。工作英文本質 = 同一套引擎 + 不同內容,所以把主線引擎改成**多軌(track)**,工作變成第二條軌。**先前「工作浮動小引擎(`WORK_WORDS`/`WORK_ITEMS`/`workXxx`/`work_progress_v1`)」整套已刪除、作廢**,別再參考任何舊工作引擎描述。

### 為什麼(使用者一路逼出來的結論)
工作端一直在缺主線早有的東西(補考、音節教學、句子複習…),因為那是「在旁邊重造引擎」。使用者點破:「主題不同而已,應該通用」。→ 引擎多軌化,工作直接繼承主線全部。

### 多軌機制（核心在 `js/01-engine.js`)
- **做法 = 切軌時「整組換全域」,不改任何引用**(引擎對 `BANK`/`meta.stage` 有上百處引用,逐一改是自殺):
  - 內容全域改成可換 `let`:`BANK`(js/00)、`PATTERNS`(js/00)、`BATCHES`(js/01)、`BUILD_SENTENCE_PATTERN_IDS`(js/03)、`TRANSFORM_PATTERN_IDS`(js/06)。`applyTrackContent(name)` 整組換 + `rebuildCurriculum()` 重算衍生表(`_batchIndex`/`LEARN_ORDER`)。
  - 進度用 swap:`setTrack(name)` 把當前軌的 `level` + `meta.{stage,clock,maxLevel,stageStartLevel,boss旗標}` 存進 `meta.tracks[軌]`,再載入目標軌的。舊碼照讀 `meta.stage`,只是讀到當前軌的值。
- **共用(不分軌)**:`store`(單字熟練度,id 不撞:日常 `word_*` / 工作 `work_*`)、`meta.coins`、`meta.skills`、音效/BGM。
- **每軌獨立**:內容(BANK/BATCHES/PATTERNS/句型清單)+ 進度(level/stage/clock/maxLevel/王)。
- `TRACKS` 登錄表 + `currentTrack`;`registerTrack(name, {bank,batches,patterns,buildIds,transformIds})` 在 **js/11-main.js** 註冊(此時內容全載完),再 `showHome()`。

### 工作軌內容（`js/10-work-mode.js` 現在只剩這個)
- `WORK_BANK` / `WORK_BATCHES` / `WORK_PATTERNS` / `WORK_BUILD_IDS` / `WORK_TRANSFORM_IDS`,格式跟主線 BANK/PATTERNS 一模一樣。
- 工作字 id 一律 `work_*`;功能詞(I/you/the/could…)`pos:"function"`(不出教卡、只在句子學);句型 slot 空 `{}` = 固定句(之後可加 slot 變生成式)。
- **擴內容 = 純加資料**:往 `WORK_BANK` 加字(補 `pos`/`syl`/`why`)、`WORK_BATCHES` 加主題批、`WORK_PATTERNS` 加句(`requires` 列出句子用到的 `work_*` id,全教過才生得出)。引擎一行不用動。
- **★ 工作軌不練默寫**(承接「先求聽懂能回應、不用默寫」):`js/11` 註冊帶 `skills:{write:false}`。`js/08` 的 `trackSkillOn(s)` 濾題型、`wroteOk(w)` 免默寫門檻;`js/09` 王對不練寫的軌改**辨識題**(`bossGridWordQuestion` 挑正確拼法 / `bossGridSentenceQuestion` 點序 / `pickBossMode` 只留 choice)。要「工作也練寫」= 拿掉那個 flag。
- **★ 內容時態要一致**:句子字面(fixed/works/reported/found)必須有對應的 `WORK_BANK.en`,否則 `creditSentence` 對不到、練的字跟句子不符。有 node 驗證腳本(每個句子 token 都要對得到一個 `WORK_BANK.en`)——擴內容後跑一下。

### 首頁(`js/10-home-settings.js`)
- `showHome()`/`mapSVG()` 讀的都是 swap 後的 `meta`,所以**同一個 showHome 自動渲染當前軌**。分頁鈕:`dailybranch → setTrack('daily'); showHome()`、`workbranch → setTrack('work'); showHome()`;標題/高亮隨 `currentTrack`。
- 🔄 重置:清 `store` + `meta.tracks={}` + `currentTrack='daily'; applyTrackContent('daily')` + 重設 live meta → 兩軌一起歸零。

### 內容現況（2026-07-03 已補完 13 主題)
- 工作軌 = **13 主題全到齊,123 字 / 52 句**,跑主線引擎(音節教學、SRS、句型、王、`why`),兩軌進度隔離、零 console error。
- **★ 補考潛伏 bug(已修,日常也中過)**:`ask` 的句子複習路徑原本把 `lastAsked` 存成**原始 `askBuildSentence`**;補考 `run(w)` 呼叫它 → `askBuildSentence(w)` 把單一字當 `sourceWords` → `sourceWords.map is not a function` → 複習卡「回去答題」**卡死**。已改存「吃單一字」的 `runSentence(ww)` 包裝。**動這段要維持「run 是 `ww => …`」的呼叫慣例。**
- **手感**:選項/排詞點了會念(`mountChoices`/`mountArrange` 加 `speak`)、非 daily 軌第 1 關用 6 題 intro(`FIRST_LESSON_RECIPE` 只給 daily)、`hasFreshBuildSentence` 讓句子題只在「有沒出過的新句子」時才出(治狂重播同一句)。

### UI 極簡線條圖示（2026-07-03)
- `js/02` 的 `ICON`(內嵌 SVG 線條集)+ `.ico` CSS(跟 `currentColor`/`em` 走、`flex-shrink:0` 防在 flex 鈕被壓扁)。UI 的 emoji 大多換成線條或純文字(音訊鈕/上排/側欄/分頁)。**保留**:慶祝時刻大 emoji、看圖題的圖(IMG/EMOJI)、音樂鈕(本就 SVG)、✕、⋯。加圖示 = `${ICON.x}`;文字夠清楚的鈕就不放。

### 方向決策（別走回頭路)
- **工作 = 主線引擎的一條軌,不是另一套引擎**。要開新主題(旅遊、面試…)= 再註冊一條軌就好。
- **AI API 陪練**:只做**本機自己用**(自帶 key)、**可拆的選用模組**,核心維持**零 AI 依賴**(才保純靜態可分享);分享版=後端+計費,延後。**現在不動 AI。**

---

## 交接快照（2026-07-02 / Codex）— ⚠ 工作英文部分已被上方快照取代

### 使用者偏好與協作方式
- 使用者會自己快速實測 UI。Codex 做低成本檢查即可,不要每次慢慢開瀏覽器。
- **不要用 PowerShell 讀中文檔案內容**。中文容易亂碼。讀檔優先用 `node -e "fs.readFileSync(...,'utf8')"`。
- 手動改檔用 `apply_patch`。
- 使用者如果說「做看看」就是要直接實作;如果在討論設計,先講判斷再動。

### 目前主頁設計
- 主頁右側地圖現在有主線分支:
  - `📚 日常單字`
  - `💼 工作英文`
- 分支切換在右側地圖上方第一行,按鈕較大。
- `目前 · 第 X 關` 在第二行,不要跟分支切換擠在一起。
- 左側側欄已移除重複的日常/工作入口,只保留工具型入口:
  - 挑戰關
  - 單字特訓
  - 衍生
  - 之後
- 相關檔案:
  - `js/10-home-settings.js`
  - `js/10-work-mode.js`
  - `css/06-home-map.css`
  - `css/07-responsive.css`

### 工作英文分支 ⚠ 已整個作廢（見本檔最上方 2026-07-02 深夜快照「多軌重構」)
- **所有舊描述(13 關 SVG 地圖 / 浮動小引擎 / 進度儀表 / `startWorkLevel` / `startWorkSession` / `meta.workMaxLevel`)全部不存在了。** 工作英文現在 = **主線引擎的第二條軌**,分頁鈕走 `setTrack('work') + showHome()`,細節見最上方快照。

### BGM 現況
- 已移除 Web Audio 合成背景音備援。
- 現在只播放實體 mp3:
  - `audio/bgm1.mp3` ~ `audio/bgm5.mp3`
  - `audio/boss1.mp3` ~ `audio/boss3.mp3`
- 音檔不存在就安靜,不要再改播合成音。
- 首頁不再依 `meta.bgm` 自動恢復播放,避免音樂自己響起。
- `sfx` 點擊/答題音效與 `speak()` TTS 不要移除。
- 相關檔案:`js/02-runtime-audio.js`。

### 最近可用檢查
```bash
node --check js/10-home-settings.js
node --check js/10-work-mode.js
node --check js/02-runtime-audio.js
```

也可檢查工作分支資料:
```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('js/10-work-mode.js','utf8'); console.log((s.match(/id:'work_/g)||[]).length)"
```

## ⚠ 動引擎前先讀這兩份設計文件
這個專案在 2026-06 做了一次**核心大重建**(把舊「計次 NEED_RUNG」整套換掉)。動學習引擎前先讀:
- **[`DESIGN_MASTERY.md`](DESIGN_MASTERY.md)** — 熟練度模型 / 出哪種題 / SRS 間隔 / 浮動關卡 / 惡補關 / 句型軌。
- **[`CURRICULUM.md`](CURRICULUM.md)** — 章節骨架(學字↔應用交替)/ 字分批 / 句子階段演化 / 🎮 小遊戲 backlog。

## 一句話
純前端「英文練習遊戲」。`index.html` 現在只保留 HTML 殼與 `css/*.css` / `js/*.js` 載入順序,主要 CSS 已拆到 `css/`,主要 JS 已拆到 `js/`。**「讓英文有道理」**:每個字都戳一個「字根/為什麼」的 aha,文法靠「重排同一批字」自己懂(this is ↔ is this)。一般向、長期經營;使用者自學 + 想分享給朋友。

## 怎麼跑 / 怎麼驗
- **跑**:`python -m http.server 8182 --directory E:/english-game` → Chrome 開 `localhost:8182`(語音/音檔要 localhost,file:// 擋)。
- **驗(別只靠點擊)**:開 DevTools console 直接呼叫函式 —— 灌 `store`/`meta`、跑 `buildLevel()`、模擬 `onCorrect/onWrong`、`startBoss()`。**改引擎那層一定先這樣驗。**
- ⚠ **preview reload race**:改 `index.html` 後 `location.reload()` 有時 eval 會跑到舊碼 → 先 `eval('XXX.toString()')` 確認是新碼再測(踩過坑)。版面驗靠 `getBoundingClientRect`(截圖逾時)。
- preview MCP 驗證另開 **8183**(`.claude/launch.json` 有 `english-game-verify` config),不影響玩家自跑的 8182。截圖工具在這環境常逾時 → 靠 eval 取狀態。

## 檔案結構
- `index.html` — HTML shell + 依序載入 `css/*.css`、`js/*.js`。不要再把新 CSS/JS 功能塞回 inline style/script。
- `css/00-foundation.css` — 全域變數、hidden 修正、body、`#screen` 基礎尺寸。
- `css/01-lesson-shell.css` — 關卡固定一頁、題目/作答分區、底部 action bar、離開/進度列。
- `css/02-shared-components.css` — 共用按鈕、選項、輸入、音節、說明/回饋列、熟練度列。
- `css/03-question-modes.css` — 選擇題與配對題的作答區比例。
- `css/04-boss.css` — Boss 題目、答案、結算頁版面。
- `css/05-teach-build.css` — 教卡、單字說明卡、組句/詞塊題。
- `css/06-home-map.css` — 首頁、分類側欄、地圖、金幣。
- `css/07-responsive.css` — 手機與矮螢幕調整。新增響應式規則放這裡,不要散在各檔。
- `js/00-content.js` — 單字庫 `BANK`、句型 `PATTERNS`。
- `js/01-engine.js` — 進度資料、mastery/SRS、批次、`buildLevel`、`startLevel`、`onCorrect/onWrong/nextQuestion`。
- `js/02-runtime-audio.js` — DOM 入口、TTS、音效、BGM、麥克風權限提示。
- `js/03-sentence-utils.js` — 句型工具、slot eligibility、句子生成、句型熟練度、句子/單字 credit。
- `js/03-ui-shell-feedback.js` — `shell`、離開確認、進度條。
- `js/03-feedback-choices.js` — 共用答題回饋 `finish` / `finishGroupSuccess`、選擇題 `mountChoices` / `fourOptions`、混淆提示。
- `js/04-speech-matching.js` — 語音辨識別名、句子念法覆寫、寬鬆比對。
- `js/04-visuals.js` — 圖片/emoji registry、`visualOf` / `visualKey` / `picHTML`。
- `js/05-modes-basic.js` — 基礎題型:選擇、看圖、配對、說題、聽寫、填空。
- `js/06-modes-sentence.js` — 句型教學與排詞造句。
- `js/07-modes-writing.js` — 音節/寫作題、`SYL`、`SYL_HINT`、`teach`。
- `js/08-lesson-flow.js` — `FORMATS`、`ask` dispatcher、關卡開始/過關。
- `js/09-boss.js` — Boss 狀態、出題、戰鬥、勝敗/惡補。
- `js/10-home-settings.js` — 主畫面、地圖、設定、音樂選單、全域點擊音效。
- `js/11-main.js` — 啟動入口 `showHome()`。
- `DESIGN_MASTERY.md` / `CURRICULUM.md` — 設計文件(見上)。`CHANGELOG.md` 逐筆歷史。`CONTENT_RULES.md` 內容規則。
- `audio/` — `bgm1~5.mp3`、`boss1~3.mp3`、`README.md`(8-bit,使用者已放好;沒檔就安靜,不要再改播合成音)。
- `img/` — 看圖題的字圖(`house/home/big/small.png` 已切好+去背)、`README.md`。

## ★ 架構(命脈,別違背):引擎 vs 玩法層 嚴格分離
- 🔧 **引擎(地基)**:`store`/`rec`/`save`/`rungOf`/`maxRungOf`/`isFresh`/`isLearned`/`pOf`/`buildLevel`/`BATCHES`/`batchOf`/`onCorrect`/`onWrong`/`nextQuestion`/`ask`/`FORMATS`/`meta`。SRS:`meta.clock` + 每字 `due`/`ivl`。
- 🎨 **玩法層(可換的皮)**:所有 `askXxx()` 題型、`teach`/`teachPattern`、`shell`/`finish`/`pickAnswer`、`showStart`/`showDone`/`showHome`/`showSettings`、Boss、`sfx`/`bgm`。
- **加題型 = 多寫一個 `askXxx()` + 掛進 `FORMATS` 表(標 `lv`/`skill`/`ok`/`run`/`tier`),引擎不動。**

## 核心原理(現況 2026-06-27 — 詳見 DESIGN_MASTERY.md)
舊「計次」已全換掉。現在六根支柱:
> 2026-06-29 更新:主線課程節奏改為**每階固定 5 關 + 王**。每關用 `LESSON_RECIPES` 控制題數與題型密度(導入/認字聽音/克漏字/句子應用/王前整理),隨機只做材料與題型變化;不要再把章長改回內容驅動浮動長度。Boss 固定在本階第 5 關後,跳過機制之後要做「整階驗收」,不是階段中間開王。
1. **連續熟練度 %**:每字 `store[id] = { taught, mastery 0~100, coined, due, ivl }`(localStorage `eng_progress_v2`,key=`w.id`)。**答對 +25 / 答錯 −20 / 100% = 學會**;教不加不扣。**★ 補考(`inReview`)答對只消題、不補 %、不算 `wrote`**(剛看過答案的重答不算真的會)→ 要**下次主回合真的一次過**才補(`onCorrect` 的加 % 那段 `else if (!inReview)`)。`rec()` 自癒舊資料。
2. **答錯補考(同題型)**:答錯 → `reviewQueue`(存 `{w, run}` 連題型一起記);主回合跑完進「補考回合」。**`reviewThenAsk`**:**連續答錯 `reviewMiss[k]` < 2(第一次錯)→ 直接補考**(同一種題型,錯默寫補默寫),畫面下方留「📖 我要複習」**可選**鈕(`injectReviewButton`)——手滑打錯的人直接重答即可;**連錯 ≥2 次(真的卡住)→ 強制先走重看卡 `showReviewCard`(字+音節+🔊念+字根)再考**。`reviewMiss`:`onWrong`+1、`onCorrect`歸零、`startLevel`清空。答對才消、又錯再補考,**永不卡死**。
3. **出哪種題 = 關卡解鎖 × 熟練度頻率**:`FORMATS` 每格標 `lv`(第幾關解鎖,**向下取累加**)。一關題型池 = `lv ≤ 當前關`。熟練度當**頻率權重**(靠近該字當前難度的題型抽中機率高,難的不消失只變少)。**功能詞封認**(`tier ≤ maxRungOf`)。**★ 難度跟該字 `tierOfMastery` 爬,別跳級**:`ask` 裡 ① **`!wrote` 強制補寫只在該字已到寫階(target≥3)**才生效(別一教完就逼默寫);② **句子題權重也吃 target**:認階(剛學)句子題壓低(`sentence_build` 7、`sentence_cloze` 0)、說階才主打排句(40)、寫階才出句子默寫(`sentence_cloze` 18)。→ 新字走 認/聽/說 → 排詞 → 默寫,不會剛學就被丟句子默寫。
4. **出哪個字 = 浮動 `buildLevel`(沒固定 5)**:**學習中 `active`(cap 5)為主力** + 新字(`NEW`)+ 少量補默寫/到期複習。★ **新字會節流**:`NEW = active.length >= 3 ? 0 : 2` —— **在學的字 ≥3 就先不引新字**,把在學的練到會再解鎖(治「一直冒新字、堆一堆沒練到的、認識/學習量失衡」)。補默寫 `needsWrite` 跟到期複習 `due` 各只穿插 ≤2(舊字主要靠句子複習帶,別灌一堆已會的淹掉學習);`MAX=8`。純鞏固期(沒新字)才用學會的字補滿。
   - **第三階段後 focus group**:進階實詞(`batchOf>=2`)若已教但還沒穩,會排進 focus group 優先多練;但在固定 5 關制下,focus **不再阻止本階剩餘新字導入**。新字導入由 `LESSON_RECIPES` 控制(第 1/2/3 關約 2/2/1 個,第 4/5 關 0 個)。達標=已教、mastery>=67,且若能出句子克漏字則 `clozeOk>=2` 且 `clozeSlots` 至少 2 種。
   - **克漏字門檻**:長字/第三階段字在 `clozeReadyForDictation(w)` 前不出硬寫題 `type/pictype/flashtype`;`sentence_cloze` 是鷹架,答對只記 `clozeOk/clozeSlots`,不直接算 `wrote`。`wrote` 只由整字聽寫/默寫/看圖寫成功取得。
   - 固定 5 關制下,每批實詞要拆到約 5 個以內;不要再靠 `stageMinLevels` 拉長章節。
5. **SRS 間隔**:學會的字排 `due`/`ivl`;複習答對 `ivl×2`(越拉越久)、答錯歸 1。`meta.clock` 每開一關 +1。**複習主軸=句子**:`ask` 裡「學會 + 已默寫過(`isLearned && wrote`)」的字**不再單獨刷**,改抽**含該字的句子**(`sentenceWithWord`)複習(`creditSentence` 推 SRS);沒句型的 orphan 動詞退一般句子;完全組不出句子(stage1 功能詞未解鎖)才退單字。**還沒學會 / 還沒默寫過的字照常走單字題**(要靠單字題學起來 + 補默寫門檻)。第一階段王在第 `BOSS_READY_MIN_LEVELS=5` 關可開。
6. **句型軌(句型 %)+ 靠句子學字**:排詞造句 `sentence_build` 進主流程(**weight stage≥2 = 40 = 主軸**、前期 7),拖曳排序,湊得出句才出;沒教過先 `teachPattern` 教結構。排對 → 句型 % + **`creditSentence` 連帶幫組成的每個字加熟練度 + 排 SRS**(靠排詞自然學會字);**順序錯 → 扣句型、不扣單字**。句型 % 存 `store[patId]`(`pat_xxx`),`bumpPat`/`patMastery`。
> **鐵律不變:沒教過的字絕不叫他產出 / 也不當誘答**(`isFresh` 守衛)。
> **功能詞(膠水)= 不出教卡、不單獨刷,只在句子裡學**:`buildLevel` 的 `fresh`/`active`/`due` 都排除 `pos==='function'`;批次一解鎖就**靜默標 `taught`**(讓句子組得出)。意義交給 `teachPattern` + 句子;熟練度靠 `creditSentence`。(治「am 只跟 I 搭配卻叫你單獨背」「是=yes/is/am 歧義」。)

## 題型(全在玩法層,掛 `FORMATS`)
教 `teach` / 看中選英 `readpick` / **配對 `askMatch`(中文不重複,避免兩個「是」)** / 聽選意思 `listenpick`(功能詞不出)/ 看圖選 `picture` / 聽選字 `listenword` / 句中填空 `cloze` / 說 `renderSpeak`(shadow跟讀/direct/blind盲聽/**pic看圖說**)/ 音節填空 `sylfill`(選) / **音節克漏字 `syltype`(打字版,逐節記錯 `sylMiss` + 弱點鎖定 + 記憶法 `SYL_HINT`;⚠ 只 **3+ 音節**長字才出 — 短字如 happy 拆 hap·py 反而混亂;打整個字也算對)** / 聽寫 `type` / 看圖寫 `pictype` / **默寫 `flashtype`(單字母不出)** / **排詞造句 `sentence_build`(拖曳排序;排對連帶 `creditSentence` 幫組成字加分)** / **句子克漏字 `sentence_cloze`(打缺字)** / **★轉換題 `sentence_transform`(招牌:把直述句的同一批字重排成問句,this is ↔ is this;只 be 動詞 This is 家族,句型要有 `q`/`qzh`)**。
- 主線 `sentence_build` / `sentence_transform` 答錯要走一般錯題流程:顯示正解後「繼續」→ `onWrong` → 主回合結束補考。只有過關後額外按的「組句小練習」保留「重排一次」。
- **拖曳排序引擎 `mountArrange`**(js/06):給 cards + 正解 token 順序就渲染 slots/bank + 拖曳/點擊 + 判對錯回 callback。`sentence_build` 與 `sentence_transform` 共用,拖曳邏輯不重寫。`caseInsensitive` 給轉換題(This↔this 只大小寫、重點在順序)。
- **句子系統 = 模板填空,非寫死**:`PATTERNS` 是 `{text, zh, q?, qzh?, requires, slots}` 模板;`buildSentenceFromPattern` 從「學過/學會的字」(`sentenceSourceWords`)填 slot,`requires` 沒教過或 slot 湊不到字就不出。擴句子 = 加模板(`BUILD_SENTENCE_PATTERN_IDS` 掛排句、`TRANSFORM_PATTERN_IDS` + `q/qzh` 掛轉換)或加字,引擎不動。動詞句 = 動詞放 `requires`、受詞放 slot(see/buy/read/drink 已加;eat/look/listen/speak/do 等要先擴字才自然)。
- **看圖視覺** = `IMG`(自製圖 `img/*.png`)優先、其次 `EMOJI`;同視覺守衛(home/house 已用不同圖、listen/hear 同👂退文字題)。
- **念法覆寫 `SPEAK_AS`**(`a → uh` schwa);念整句走 `speakSentence`(套 `SPEAK_AS`,免得句子裡的 a 念成字母 A)。辨識別名 `SPEECH_ALIASES`、近義 `CONFUSE_PAIRS`。**這些 map 都不進 BANK。**
- **語音**:`speak` 走 `pickBestVoice`(Google > 微軟 Natural > en-US),設 voice 包 try/catch;句子結算有「🐢 慢速」(rate 0.5)。

## ★ 版面 / UI(2026-06-27 大改 — Duolingo 式滿版 + 固定區塊,別退回小卡)
- **滿版、無卡框**:`.card`(#screen)拿掉 背景/邊框/陰影 → `width:100%`、`min-height:100vh`、`justify-content:flex-start`;內容收進置中欄 `#screen > * { max-width:960px }`。
- **hidden 必須真消失**:全域 `[hidden] { display:none !important; }` 是必要保險,因 `.card { display:flex }` 會蓋掉瀏覽器預設 hidden。不要移除,否則 Boss 結果/設定頁可能殘留在首頁下方。
- **固定分區**:`shell()` 現在輸出 `.lesson` 骨架,上半是 `.lesson-stage` 題目帶(`#prompt`),下半是 `.lesson-answer` 作答帶(`#body`)。關卡題目頁 `.lesson-screen` 固定 `height:100vh; overflow:hidden`,必須一頁完整顯示,不要靠往下滾才看到內容。一般題型內容放進 `bodyHTML` 後會被固定在同一個作答區,不要再每題自己用大 margin 猜位置。
- **標題一律置中**:`.lesson-stage .prompt` 已統一 `text-align:center`;不要只在單一題型加 `.center` 補洞。
- **教卡專用分配**:`teach()` / `reviewThenAsk()` 會加 `.teach-lesson` + `.teach-answer`;`.teach-layout` 吃滿作答區高度,上半置中放字/發音按鈕,`.teach-why` 是大說明卡(有 min-height / 大字 / padding),貼近 action bar 上方。不要讓教卡內容回到全部擠在上半部的自然流,也不要把說明卡縮回細條提示。
- **選擇題 = 點選定 + 確認才判**(治手滑點錯):四選一類(`askReadPick`/`askListenPick`/`askListenWord`/`askPicture`/`askClozePick`)都走共用 `mountChoices(box, opts, getText, w, correctText)` —— 點選項=高亮 `.opt.sel`(可改選)、底部出 `.act#submit`「確認」(沒選時 `disabled`),按了才 `pickAnswer→finish`。**加選擇題就用 `mountChoices`,別自己 `el.onclick=pickAnswer`(那會點了就判)。** Boss 四選一**不走**這套(戰鬥保持秒判)。
- **選擇/配對題專用分配**:四選一類會加 `.choice-answer`,選項高度和間距要用 clamp 壓在 action bar 上方完整顯示。配對題 `askMatch` 會加 `.match-answer` + `.match-grid`;完成後走 `finishGroupSuccess('配對完成', ...)`,不要顯示某一個單字的 `why`。
- **Boss 專用分配**:`startBoss` / `renderBossQ` / `bossEnd` 會加 `.boss-screen`;題目頁用 `.boss-layout` 三段式(status / arena / answer)平均吃滿高度,結算頁用 `.boss-result` 置中。`shell()`、`showHome`、設定、音樂頁都會移除 `.boss-screen`;`showHome()` 也會清空 `screen.innerHTML`,不要讓 Boss 結果殘留在首頁。
- **★ 底部固定操作列**(Duo 式):`#screen::after` 畫出底部 action bar;一般主要動作鈕 `.act` 固定右下、綠色高對比(送出/確定/記住了/換我排/說)。次要動作 `.sideact` 固定左下,目前用在說題「跳過說題」。**加新題型的主按鈕一定要掛 `.act`;跳過/取消類用 `.sideact`,不要再做小字連結。**
- **答題回饋** `.why`:在 `.lesson-screen` 中會直接吃掉底部 action bar,左側顯示結果/說明/再聽,右側放 `.act` 的繼續鈕。這時 `.why .act` 會改成 `position:static`,**不要再讓繼續鈕另外 fixed 疊在回饋列上**。`.why.bad` = 紅色底部列。`finish()` 不再把 `#prompt` 改成大型「答對了」,避免答題後整頁漂移。
- **短回饋用 compact**:單行短訊息(如音節整段拼對、配對完成)用 `.result-head.compact`,不要再手寫 `✅ <b>word</b><br>` 這種會歪掉的雙行底部列。`askSylType`、`finishGroupSuccess` 已接上 compact;造句回饋也已改成 `result-head` 結構。
- **發音鈕** `.replay`:適中 19px(別再設超大,會撐爆結算框);只有主播放鈕 `#replay`(聽力題的 🔊 純圖示)放大 30px。
- 元素已放大:`.inp` 25px、`.btn` 19px、`.opt` 22px、`.bigzh` 40px、`.prompt` 22px 粗。
- 後續 UI 只做逐題型比例微調,不要退回自然流大 margin。新增頁面時先決定它是 `.lesson-screen`、`.boss-screen` 還是一般設定/地圖頁;樣式要放進對應 `css/` 檔,不要塞回 `index.html`。

## Boss(已大改 — 詳見 DESIGN_MASTERY「本階段引擎新規則」/ CURRICULUM「★結構定案」)
- **觸發**:✅ **內容驅動** `stageReady()` —— 當前批(`batchOf===stage-1`)字都練到會寫(mastery≥`BOSS_READY_MASTERY 67`)→ `meta.bossReady`,過關畫面 + 地圖快捷出「⚔ 挑戰王」鈕,**非強制**(可挑戰或再練)。取代舊的固定 5×stage。
- **「我已經會了」跳過(通用向,治「強迫已會的人從基礎爬」)**:第一次出現的教學都有 `.sideact` 跳過鈕——**單字教卡** `teach` 跟 **句型教卡** `teachPattern`(「先看這個句型」第一次出現時,傳 `onKnown` → 點了 `bumpPat(id, LEARNED)` 標滿句型 + 跳過排句 + `done()` 直接 continue;之後同句型不再出教卡)。單字那顆 → `markWordKnown(w)`(標 taught+100%+wrote、給金幣、本關消題、**`due` 停遠 `ivl=8`**=不會下一關馬上又抓回來複習)。字仍在字庫 → **句子照樣組得出(依賴鏈不斷)**。`stageReadyAt`:該階字**全部 `isLearned`**(含跳過的)→ 不必等 `stageDeadlineLevel` 鞏固關,**直接開王**(部分會則仍要跑完鞏固)。所以「整階都按我會了 → 直接打王」。
  - ★ 治「只剩 1 個不會卻關卡混亂」:`buildLevel` 的「<4 補學會的字湊數」**改成只在 `!fresh.length`(沒有新字可學了)才補** → 還有不會的字就專心出那幾個,不塞已會的進來;搭配跳過字停遠,「5 字只有 1 個不會」=乾淨的「只練那 1 個 → 學完直接打王」。
- **血 / 傷害**:HP 隨階段縮放(`bossMaxHp = 50 + (stage-1)×30`);**傷害 = 總血 %、按題型**(四選一 5% / 拼字 8% / 2字 12% / 句子默寫 20% / 臨死組合 25%),舊「字母數 + cap10」已拔。
- **綜合考、偏重現學**:`bossPickWords` 加權現學批次(`BOSS_CUR_WEIGHT 4:1`);題型混 看中 / 聽 / 看圖 / 四選一(`BOSS_MODES`)+ **句子默寫**(`bossSentenceQuestion`,`BOSS_SENTENCE_PROB .3`,學過句子才出);題庫 `bossPool` 排功能詞。
- **不連續同答案**:`boss.lastAnswerKey` + `bossAnswerKey(q)` 追蹤上一題標準英文;`bossQuestion` 單字題會先排除上一題答案,句子題與臨死連段也會用 avoid set 重抽,避免王戰連續出完全相同答案。
- **臨死反撲**:`bossCombo` 多題聯合(`PANIC_HITS`),全對才打出收尾;答錯逐格歸因 `bossWrongIds`(只記真的拼錯的字)。
- **打贏 → `stage++`**;**打輸 → 惡補關**(`boss.missed` 的字 mastery−30 + due=now → 只練那些字 → 再挑戰)。

## 主畫面 / 設定 / 音樂
- **`showHome`**:左分類(練習單字 / **🎯 單字特訓** / 衍生🔒 / 小遊戲 backlog)+ **地圖鏡頭**(固定視窗、進場置中目前關、滑鼠/觸控捲動、王快捷)+ ⚙ / 🎵 / 🔄 / 🪙。
- **🎯 單字特訓**(自選刷,治「補考硬過又忘、想自己加強」):`showTrainPicker`(js/10)選**教過、還沒滿 100%**的實詞(弱的排前面、顯示熟練度%;滿了的不列)→ `startTraining` → `trainNext`/`trainAsk`(js/08)聽說讀寫**混合**出題(忽略關卡 lv、排除句子題)、每題塞「✓ 我學會了」鈕(`injectTrainKnown` → `markWordKnown` + 移出 `trainPool`;**用 `.sideact` 左下固定大鈕,跟教卡「我已經會了」一致**,說題左下已有「跳過說題」時往上疊 `bottom:calc(34px+76px)`)。`inTraining` 旗標:`nextQuestion`→`trainNext`、`onCorrect`/`onWrong` 只加熟練度/金幣/SRS、**不碰主回合 quota/reviewQueue**。答對字留著繼續練、`我學會了`才移除、清空→`trainingDone`。`showHome` 進場一律 `inTraining=false`。
- **洗牌**:`shuffle` 是 Fisher-Yates(舊的 `sort(()=>random)` 有偏差、短陣列常洗回原序);`mountArrange` 還會「洗出來剛好是正解順序就重洗」→ 排詞卡不會直接給正解。
- **`showSettings`**:聽說讀寫技能開關 + BGM 清單。
- `sfx`(合成音效)、`bgm`(`BGM_TRACKS` 5 + `BOSS_TRACKS` 3,音量 10%,臨死加速)。

## 字庫（`BANK` 47 字）
- 每字 `{ id, en, zh, pos, flags, syl, why }`。**why 是靈魂。**
- `BATCHES` 正式編了:**批1(實詞 cat/book/friend/happy/water)+ 批2(膠水 this/is/a/my/I/am + home/house)+ 批3「感受 + eat」(hungry/thirsty/tired/sad/eat)+ 批4「吃喝句子材料」(drink/rice/bread/tea/milk)**;其餘字**每 5 個自動切批**接在後面(`batchOf = BATCHES.length + …`)→ 多王推進 `stage` 就陸續解鎖。**擴字庫時要正式編進 `BATCHES`(主題化)+ 擴 `PATTERNS`**,別讓字隨機亂分;動詞句的動詞放句型 `requires`、受詞放 slot(配 flag:visible/buyable/drinkable/readable/eatable)。先讀 `CONTENT_RULES.md`。
- ⚠ **擴字後驗證注意**:瀏覽器會硬快取 `js/*.js`,改完 `location.reload()` 常跑到舊碼(看到 BANK 沒變多就是中了)→ 先 `fetch('js/00-content.js',{cache:'reload'})` 重抓再 reload,或重啟 preview。

## 待辦(優先序;最新進度見 CHANGELOG 尾段)
> 2026-06-29 這輪(逐筆見 CHANGELOG)主要修「遊玩手感 / 課程節奏 / UX」:退出鈕+答對也出面板、句子系統大擴(動詞句 see/buy/read/drink/eat、★轉換題 this is↔is this / I am↔Am I、防句子重複)、擴字批3「吃喝與感受」、「我已經會了」跳過(教卡+句型卡,整階全會直接打王)、選擇題改「點選定+確認才判」、★**難度跟 mastery 分級**(剛學不默寫句子)、補考強化(連錯2次強制複習、補考答對不補熟練度)、課程節奏節流(在學≥3 不引新字)、🎯 單字特訓自選關、音節題只長字、Fisher-Yates 洗牌。

1. **★ 擴內容(最高槓桿,治後期重複的根)**:① orphan 動詞句型(look/listen→at/to、speak→語言、do/make→受詞、go/come→home…)要先加介係詞/受詞字;② 更多情緒形容詞(angry/scared…)讓 `I am ___` 更多變;③ 可數食物(apple→an)要另開冠詞句型;④ 之後的主題批 + 正式編 `BATCHES`/`PATTERNS`。**先讀 `CONTENT_RULES.md`**;動詞句=動詞放 `requires`、受詞放 slot(配 flag visible/buyable/drinkable/readable/eatable)。
2. **補圖 `EMOJI`**:幫更多具體字掛圖(看圖題才有變化);抽象字沒圖就不出。注意同視覺守衛(`visualKey`,👀/👁️ 已歸一)。
3. **音節題適應性**:某節連錯 N 次 → 退回該字一輪聽·看·選;擴 `SYL_HINT`。
4. **🎮 小遊戲區**(獨立、10 金幣解鎖,見 CURRICULUM);衍生關(左欄佔位)。
5. **dead code 清理**:`chooseRung`/`plan`/`levelPlan`/舊 `askWrite` dispatcher 可能沒用了。
6. **矮螢幕實測**:`.lesson-screen` 固定不捲,極矮螢幕仍可能切版(配對已降 4 組)。玩家 🔄 重來實測整條弧。

## 可調常數
- 熟練度:`MASTERY_OK 25` / `MASTERY_BAD 20` / `LEARNED 100`;`tierOfMastery` 切點 34/67(<34 認 / <67 說 / 餘 寫)。**補考(`inReview`)答對不加 %**。
- 浮動關卡:`MAX 8` / `ACTIVE_CAP 5`;★ **`NEW = active.length >= 3 ? 0 : 2`**(在學的字 ≥3 就先不引新字);`needsWrite`/`due` 各只穿插 ≤2。SRS `ivl×2` 封頂 30;跳過字(`markWordKnown`)`ivl=8`。
- 出題難度跟字 `tierOfMastery` 爬:`!wrote` 強制補寫只在 target≥3;`sentence_build` 認階 7 / 說階以上 40;`sentence_transform` 說階以上 20;`sentence_cloze` 寫階(target≥3)18,否則 0。
- 王:`BOSS_READY_MIN_LEVELS 5`(整階全 `isLearned` 可免鞏固提早開);`BOSS_HP_BASE 50` / `BOSS_HP_PER_STAGE 30` / `BOSS_DMG`(占總血 %) / `BOSS_CUR_WEIGHT 4` / `BOSS_SENTENCE_PROB .3` / `PANIC_HITS 2` / 惡補 mastery−30。
- 句子防重複:`recentSentences` 記最近 3 句、`pickFresh` 避開。配對 `askMatch` 4 組。音樂音量 `.1`、臨死 `playbackRate 1.3`。
- 音節克漏字:`SYL_HINT`(記憶法 map)、遮節權重 `1+miss×2`。語音:`pickBestVoice`、慢速 rate `0.5`。
