# 更新日誌

這份檔案給使用者、GPT、Codex 交接用。重點記「實際改了什麼、為什麼改、下一步要注意什麼」。

## 2026-06-26

> 注意: 本日誌前半段保留上一輪歷史紀錄；後面的「瘦資料與句型模板基礎」已取代 `near/confuse` 方向。

### 已改
- 將 `BANK` 從 `{ en, zh, why }` 擴成 `{ en, zh, why, near, confuse }`。
- 先放入 30 個高頻日常字，作為第一批讓使用者審 `why / confuse` 風格的樣本。
- 選擇題選項改為優先混入 `near` 指到的近義/易混字，不足再用一般字補滿。
- 答錯補教改為優先顯示 `confuse`；如果選到 `near` 字，提示會用「差別」口吻說明。

### 沒動
- 沒改 SRS 引擎: `rungOf`、`buildLevel`、`chooseRung`、`onCorrect`、`onWrong` 的學習節奏都維持原樣。
- 沒做衍生關、扣分制、造句。
- 沒改主畫面地圖外殼。

### 待審
- 30 個字的 `why` 是否符合「只講這個詞本身、不要硬塞衍生」的風格。
- `confuse` 的說明是否夠短、夠像答錯時該出現的補教。
- `near` 是否真的適合當誘答選項；不適合的要刪，不要為了填欄位硬放。

### 下一步建議
- 先玩一輪前幾關，專門看答錯補教和近義誘答是否有教育意義。
- 使用者確認內容風格後，再擴字庫，不要先大量生產。

### 本輪追加: 瘦資料與句型模板基礎
- 將上一輪的 `near/confuse` 實驗收掉，避免單字資料變肥。
- `BANK` 改為瘦 schema: `id`, `en`, `zh`, `pos`, `flags`, `syl`, `why`。
- 新增 `PATTERNS` 最小句型模板: `This is a {x}.`, `This is my {x}.`, `I drink {x}.`, `I read {x}.`, `I am {x}.`
- 新增模板工具函式: `wordMatchesSlot`, `getEligibleWords`, `buildSentenceFromPattern`。
- `sylOf(w)` 改為優先讀 `w.syl`，舊 `SYL` map 只作 fallback。
- 新增 `CONTENT_RULES.md`，規範 id、pos、flags、單字欄位、句型新增規則與禁止事項。

### 本輪測試結果
- JS 語法檢查通過。
- `BANK` 共有 30 個字，所有字都有必填欄位。
- 單字 id 無重複，且符合 `word_...` 命名。
- `sylOf(cat)` 可從 `w.syl` 回傳 `["cat"]`。
- 第 1 關新字仍會走 `chooseRung(...) === 0`，也就是先 teach。
- `pat_this_is_a_noun` 可用 `cat/book`，不可用 `water/happy`。
- `pat_i_drink_noun` 可用 `water`，不可用 `book/cat`。

### 本輪追加: 最小組句關
- `rec(w)` 的儲存 key 從 `w.en` 改為 `w.id`，並保留舊 `w.en` key 的自動 migration。
- 新增 function words: `this`, `is`, `a`, `my`, `and`, `or`，`pos` 都是 `function`。
- 新增 `presentable` flag，並讓 `pat_this_is_a_noun` 使用 `countable + presentable`。
- `buildSentenceFromPattern` 現在會從指定 `sourceWords` 中抽字，且不固定拿第一個候選。
- 新增組句工具: `sentenceSourceWords`, `pickBuildSentence`, `learnedByRecord`。
- 新增玩法層題型 `askBuildSentence`，目前支援 `This is a {x}.` / `This is my {x}.` / `I am {x}.`
- 組句入口掛在過關畫面；有可用句型才顯示「組句小練習」，沒有就跳過。

### 本輪測試結果
- 舊 `eng_progress_v2` 內以 `cat` 為 key 的資料可 migration 到 `word_cat`。
- 新字仍會先進 teach: `chooseRung(cat) === 0`。
- 原本單字題型函式仍存在: `askListenPick`, `askReadPick`, `askListenWord`, `askSpeak`, `askType`, `askFlashType`。
- `This is a {x}.` 的候選包含 `cat/book`，不包含 `water/happy`。
- 組句題可用本單元字產生 `This is a cat.` 或同類合理句。

### 本輪修正: 句型 requires
- 每個 `PATTERNS` 項目新增 `requires`，列出固定詞的 word id。
- `buildSentenceFromPattern()` 會先檢查 requires；固定詞沒有 taught 時回傳 `null`，不出句。
- 新增 `wordById`, `savedRec`, `wordIsTaught`, `patternRequirementsMet`。
- 為了支援 `I am {x}.` 的 requires，補入 function words `I` 和 `am`。

### 本輪測試結果
- `this/is/a` 未 taught 時，`pat_this_is_a_noun` 不會產生句子。
- `this/is/a` taught 後，`pat_this_is_a_noun` 可用 `cat` 產生 `This is a cat.`。
- `This is a {x}.` 仍不會抽到 `water/happy`。
- `pickBuildSentence()` 只會挑 requires 已 taught 的句型。

### 本輪修正: 麥克風辨識卡死
- 修正 `askSpeak()` 在 SpeechRecognition 沒有回傳結果時，麥克風按鈕保持 disabled 導致卡死的問題。
- 新增 `onend` / `onnomatch` / `onerror` / `start()` 失敗 / 6.5 秒 timeout 的 fallback。
- 沒收到聲音時會算一次未命中，未滿 3 次會重新開放「我念」按鈕；第 3 次仍沒過則進入原本補考流程。

### 本輪修正: 麥克風權限暖機
- 新增 `ensureMicAccess()`，在 SpeechRecognition.start 前先用 `getUserMedia({ audio:true })` 取得麥克風權限。
- 成功後保留同一頁 session 的 mic stream，降低每次說話都重新跳權限的機率。
- 權限失敗時不扣說話嘗試次數，改顯示 localhost / Chrome 權限提示並重新開放按鈕。
- 開始辨識前會先 `speechSynthesis.cancel()`，避免剛播放的 TTS 干擾收音。

### 本輪修正: 語音辨識短字/同音字
- 新增玩法層 `SPEECH_ALIASES`，不塞進 `BANK`。
- `hear` 允許 Web Speech 常見辨識結果 `here`。
- `this` 允許 Web Speech 常見辨識結果 `these`。
- 語音比對改成 token-based，不再用單純字串 `includes`。
- 說話失敗時會顯示「瀏覽器聽到什麼」，方便後續調整別名。

### 本輪追加(Claude): 近義誘答教差別 + 功能詞封頂在認
- 新增玩法層 `CONFUSE_PAIRS`(**不放進 BANK**，跟 `SPEECH_ALIASES` 同層): 列易混近義對 + 選錯時教的差別(home/house、look/see、listen/hear、speak/say、make/do、bring/take、come/go)。這不是重啟上一輪收掉的 BANK `near/confuse` 欄位，是玩法層 map，請勿誤刪或搬回單字資料。
- `fourOptions()` 對有近義對的字，保證把近義字放進選項當誘答。
- `wrongHint()` 選到近義字時，優先顯示兩者差別(取代單純 why)。
- 新增 `maxRungOf(w)`: 功能詞(`pos === 'function'`)最高只到階 1(認)，不考開口說 / 默寫(虛詞念/寫不自然)；實詞維持階 3。`rungOf` / `pOf` / `chooseRung` 都改吃 `maxRung`。

### 本輪測試結果(console)
- 功能詞 `is`: 教 → 認 → 認 → 學會(不出現說/寫)；認過即 `pOf=100% / isLearned=true`。
- 實詞 `home`: 教 → 認認 → 說說 → 寫寫 → 學會(維持原樣)。
- `fourOptions(home)` 必含 `house`；選到 `house` 的答錯提示會教 home/house 差別。
- 引擎(計次 / 分級 / 批次鞏固 / 間隔)未動。

### 本輪追加(Claude): 說題先示範 + 配對題
- `askSpeak()` 進場先 `speak()` 示範念一次(prompt 改「先聽我念一次，再換你念」)，新增「🔊 聽示範」鈕，mic 改「🎤 換我念」。對應使用者要的「他念一次、我念一次」。
- 新增認階題型 `askMatch()`: 一次 5 組英↔中配對(點英再點中，全對才過)，掛進 `RUNGS[1]`。配對夥伴優先抓 `!isFresh` 的已教字，避免出現沒教過的字。新增 CSS `.opt.sel`(配對選中高亮)。
- 注意: 配對題一次擺 5 字，但只 `onCorrect(current)` 記主角一個，其餘 4 字僅視覺複習(沿用引擎「一題記一字」模型)。若要 5 字都計分需另改記分邏輯。

### 本輪測試結果(console)
- `RUNGS[1]` 認階 = 聽選意思 / 看中選英 / 聽選字 / 配對，共 4 種。
- `askMatch` 渲染 5 英 + 5 中；全部配對成功後 `onCorrect` 記主角認對一次(reps 0→1)。
- `askSpeak` 進場有「🔊 聽示範」鈕、mic 文字為「🎤 換我念」、prompt 為示範引導。

### 本輪追加(Claude): 說題分難度 + 盲聽念
- `askSpeak()` 改為 dispatcher: 說階第 1 次(`reps[2] === 0`)→ `shadow` 跟讀(先示範念 +「換我念」); 第 2 次起 → `direct`(看字直接念) / `blind`(盲聽念) 隨機。
- 新增 `renderSpeak(w, mode)` 處理三種呈現; 語音辨識邏輯抽成共用 `attachSpeechMic(w)`(權限 / 同音別名 / timeout 那套原封不動)。
- `blind` 模式: bigen 顯示 `＿ ＿ ＿`、只給中文, 進場 speak 一次, 念到結算才由 `speakResult` 揭曉正確字。
- 註: 上一輪「進場一律示範」被這輪取代; 示範只在第 1 次跟讀出現。

### 本輪測試結果(console)
- `reps[2]=0` → `askSpeak` 走 shadow(看得到字 + 有示範鈕)。
- `renderSpeak` 三模式: shadow(字 + 示範 + 換我念) / direct(字 + 我念) / blind(＿＿＿ + 再聽 + 我念)。
- blind 的 `＿ ＿ ＿` 經 `speakResult` 後揭曉成正確字。

### 本輪追加(Claude): emoji 看圖選詞題(參考 Duolingo)
- 新增玩法層 `EMOJI` map(不進 BANK，跟 `SPEECH_ALIASES` / `CONFUSE_PAIRS` 同層): 具體字 → emoji。
- 新增認階題型 `askPicture(w)`: 看 emoji 選英文字; 沒 emoji 的字自動 fallback 成 `askReadPick`，不硬出圖。掛進 `RUNGS[1]`。
- 對照 Duolingo 學習 app 玩法盤點: 單字題型(教 / 認 5 種 / 說 3 種 / 寫 2 種 / 配對 / 組句)已大致覆蓋; 仍缺「句中挖空填詞」與「對話 / 故事」兩類，建議下一步先做填空、對話放最後。

### 本輪測試結果(console)
- `RUNGS[1]` 認階 = 聽選意思 / 看中選英 / 聽選字 / 配對 / 看圖，共 5 種。
- `askPicture(cat)` 顯示 🐱 + 英文選項; `askPicture(experience)`(無 emoji)fallback 成「看中文選英文」。

### 本輪追加(Claude): 挖空填詞 + 說題音節分塊
- 新增認階題型 `askClozePick(w)`(Duolingo「complete the translation」): 用 `PATTERNS` 生句、挖掉 w 那格、4 選 1。新增 `patternsForWord(w)` 找「w 能當 slot 且 requires 已教」的句型; 沒有就 fallback `askReadPick`，不出空句。掛進 `RUNGS[1]`。
- `renderSpeak()`(跟讀 / 直接說)的字改用音節分塊(`.syllables` + `.syl`)顯示，進場 / 示範改 `speakSyllables` 逐塊高亮(跟教卡同款); 盲聽 `speakResult` 揭曉時也用音節分塊。新增 CSS `.syllables.ok/.bad .syl`。

### 本輪測試結果(console)
- `RUNGS[1]` 認階 = 聽選意思 / 看中選英 / 聽選字 / 配對 / 看圖 / 句中填空，共 6 種。
- this/is/a + cat 教過 → `askClozePick(cat)` 出「這是一個貓 / This is a ＿＿」、選項含 cat; 功能詞沒教 → fallback 看中選英。
- `renderSpeak(beautiful,'shadow')` 顯示 beau·ti·ful 3 音節塊; 盲聽揭曉後也是 3 塊。

### 本輪追加(Claude): Web Audio 合成音效(零素材)
- 新增玩法層 `sfx` 模組: 純 Web Audio oscillator 即時合成，**不需任何音檔素材**(維持單檔)。`correct`(叮↗) / `wrong`(嗯↘) / `coin`(叮噹) / `done`(過關小旋律)。
- 觸發點: `finish` 對 / 錯、`speakResult` 對 / 錯、`askMatch` 全配對成功、`showDone`(過關旋律 +「有新學會字」再播金幣)。
- 音高 / 音色 / 音量 / 時長全是 `tone(freq, dur, type, vol, delay)` 參數; 第一次使用者互動後才出聲(瀏覽器政策)。尚無靜音開關(要的話加 `meta.muted` + topbar 切換)。

### 本輪測試結果(console)
- `sfx.correct/wrong/coin/done` 皆為 function，連續呼叫無錯(headless 無輸出但不丟例外)，AudioContext available。
- 觸發點(finish 對錯 / showDone / 配對 / speakResult)皆已接上 sfx。

### 本輪追加(Claude): 點按鈕音效
- `sfx` 加 `tap`(輕「嗒」)。用一條全域 `click` 事件委派，對 `button / .opt / .cat / .mapnode` 播 tap; 新加的按鈕自動涵蓋、不必逐一接。
- 測試: `sfx.tap` 為 function、呼叫無錯; 委派 listener 已接上，模擬點按鈕不報錯。

### 本輪追加(Claude): 音節填空(長字寫階鷹架)
- 新增寫階題型 `askSylFill(w)`: 聽整個字、音節塊挖掉一塊(`? · pe · ri · ence`)，從 4 個音節塊(正確 + 別字音節干擾)選出缺的。單音節字 fallback 整字聽寫。
- 新增寫階 dispatcher `askWrite(w)`: 多音節字寫階第 1 次(`reps[3] === 0`)→ `askSylFill`(鷹架); 之後 / 短字 → `askType` / `askFlashType`。`RUNGS[3]` 改為 `[askWrite]`。
- 設計動機: 使用者實測 `friend = fri + end`，拆音節塊比默寫整串字母容易記; 長字尤其友善。

### 本輪測試結果(console)
- `RUNGS[3]` = `[askWrite]`。
- experience 寫階第 1 次 → 音節填空(顯示 `? · pe · ri · ence`、4 選項); 第 2 次 → 整字輸入。
- cat(單音節)→ 直接整字(askType / askFlashType)。

### 本輪追加(Claude): 扣分制 + 金幣防刷
- `onWrong(w)`: 答錯 → 該階 `reps[currentRung]` 退一格(下限 0); 掉回未過就自動降階補練。教階(`currentRung === 0`)不扣。
- `onCorrect` 金幣改為「每字一次」: 加 `rec(w).coined` 標記，扣分後重新學會不重複給幣。
- 測試(console): 說階學會(reps[2]=2)答錯 → reps[2]=1、rungOf 回 2、isLearned=false; reps 退到 0 為地板; 教階不扣; 金幣首次學會 +1 並標 coined，扣分後再學會不再 +1。
- 待拍板(使用者): 學習節奏想改「滑動視窗(常駐 5 個在學、學會一個補一個)」——與現行「批次鞏固 + 關卡 topRung 天花板」二選一，使用者傾向放掉 topRung 改純滑動(A)。組句其實已做(過關後 `askBuildSentence` + 認階 `askClozePick`)但觸發隱蔽，待決定是否拉成固定關卡。

### 本輪追加(Claude): 說題辨識自評 + 扣分輕量化
- 說題辨識 2 次抓不到 → `offerSelfAssess(w)`: 顯示「你自己聽,念對了嗎?」+「✅ 念對了,過(→ `onCorrect`,不扣)」/「🎤 再試(→ `renderSpeak` shadow)」。理由: Web Speech 對單字辨識天生弱(為整句設計),別硬判失敗硬扣分。`finishAttempt` 改 `tries < 2` 重念、`>= 2` 自評(不再走 `speakResult(false)`)。
- 扣分輕量化: `onWrong` 改「連錯 2 次才退一格」(`rec.miss` 累積，>=2 退一格並歸零); `onCorrect` 答對清 `miss`。單次失誤不罰、對辨識誤判友善。
- 測試(console): 連錯第 1 次不退(miss=1)、第 2 次退一格(miss=0); 答對清 miss; 自評面板 `selfok` → reps++(不經 onWrong)。

### 規劃(待做): Boss 戰考試關(使用者設計;複雜,分階段做)
- **觸發**: 每 5 關一隻王; 要該批字全 100% 才解鎖挑戰,沒滿則提示重刷第 5 關衝熟練度。
- **雙方/回合**: 玩家 HP 5、王 HP 100。王限時出題 → 答對打王(傷害 = 答案字數,上限 10); 沒答出 → 玩家 −1。
- **題庫**: 學過的字、可組合(`bad cat`)。組合題用「王剩血」當觸發(血越低越常出、越複雜傷害越高,有單回合傷害上限)。
- **20% 臨死反撲**: 超級組合(3~4 字)。**後期王**(解鎖句子後): 連續多句,混填空 / 回答 / 寫整句。
- **待定數值**: 限時秒數、「沒答出」扣幾命、組合傷害公式 + 單回合上限。
- **定位**: 獨立玩法關,SRS 引擎不動,用學過的字當題庫。

### 本輪追加(Claude): 寬鬆語音辨識
- 新增 `editDistance` + `looseMatch(heard, target)`: 辨識結果「**開頭字母相符 + 編輯距離 ≤ ceil(目標長度 × 0.45)**」就算過。`speechMatches` 先嚴格(含別名)再寬鬆。
- console 測: apple → apple/able/appel/a po 過; ball/b po 擋。cat → cap 過/bat 擋。friend → frend 過/brand 擋。
- 目的: Web Speech 對單字誤判嚴重，寬鬆只擋明顯錯誤; 自評 `offerSelfAssess` 保留當「完全沒收到聲音」的最後退路。

### 規劃補充: Boss 戰數值(使用者拍板) + 前置依賴
- **限時** = 看題目字數 / 長度動態算(長題給多時間;第一關要寬鬆,別一開始測極限)。
- **我方固定扣 1**(不論一般 / 高級組合)。**超級組合**(臨死反撲)答錯 → 刷新題庫重頭答,到過或死為止。
- **組合傷害 = 字數**; **單回合傷害上限 = 王總血 10%**(=10)。
- **觸發不是固定每 5 關**: 看學習進度、關卡階級需訂製、後期有特殊關卡(不全一樣)。
- ★ **前置依賴**: 現在關卡只是「無限遞增的第 N 關」、無章節結構。王觸發(章末)與後期特殊關,需先訂「**關卡 / 章節骨架**(怎麼分章、每章哪些字、哪裡插王 / 特殊關)」。建議順序: 先訂章節結構 → 再掛王與特殊關; 戰鬥雛形可先獨立做。

### 本輪追加(Claude): 第一支 Boss 戰(實作)
- 新增 `boss` / `bossPool` / `bossQuestion` / `startBoss` / `bossTurn` / `bossEnd`。獨立玩法關,引擎不動,題庫 = 學過的字(`!isFresh`)。
- **觸發**: `showDone` 在 `level === 5 && !meta.bossCleared` 時,「下一關」按鈕變「⚔ 挑戰第一支王」→ `startBoss`。觸發點之後可移到任何章末(改一行)。
- **規格**: 王 HP100 / 玩家 HP5; 限時 = `round(字母數 × 1.2 + 2.5)` 秒(第一支王寬鬆); 答對傷害 = 字母數(上限 10 = 王血 10%); 答錯 / 超時玩家 −1。
- **出題**: 滿血單字; hp ≤ 60 一半機率 2 字組合; hp ≤ 20 臨死反撲超級組合(3~4 字),超級組合答錯 → 刷新題庫重打(不扣血)。勝 → `meta.bossCleared = true`。
- 測試(console): 出題分級(100→1字 / 45→可 2 字 / 15→super 3 字); 答對 cat → 王 100→97; 勝敗畫面; 第 5 關 showDone 按鈕為「挑戰王」。限時倒數 / 手感需真實瀏覽器。
- 可調: `limit` 公式、傷害上限、組合機率門檻、HP 數值。待擴: 全 100% 才解鎖挑戰、章節結構、後期王(句子題)。
- 修: `startBoss` 進場先 `homeEl.hidden = true; screen.hidden = false`(否則從主畫面 / console 直接呼叫會畫到隱藏的 `#screen`、看不到)。注: 說題語音辨識在 `file://` 被瀏覽器擋(需 localhost); Boss 戰(打字)在 `file://` 可玩。

### 本輪追加(Claude): 第一支王降血 + 字庫音節分級
- 第一支王 HP 100 → 30(`startBoss`)。
- `buildLevel` 引入新字改規則: **前 5 關只收 1~2 音節短字**;3 音節以上(beautiful/experience)留到 `level >= 6`;同為新字「短的先學」(依 `w.syl.length` 排序,讀 schema、不依賴玩法層 `sylOf`)。
- 效果: 第一支王題庫(=學過的短字)不再冒長字,降低初期挫折。
- 測試(console): level 3 跑 30 次 buildLevel 無 3+ 音節字; 短字學完後 level 6 引入 beautiful/experience; 王血 = 30。
- 註: 此規則用全域 `level` 當門檻; 待章節結構出來後,「3+ 音節留到第幾關」應改綁章節而非寫死 level 6。

### 本輪修正(Claude): Boss HP 顯示寫死 100 → 跟著 maxHp
- bug: 王血改 30 後,血條 `width:${hp}%` 與文字 `${hp}/100` 仍寫死 100,30 血被畫成「30/100」+ 條 30% 寬(看似殘血開場)。臨死/組合門檻也寫死 20/60。
- 修: `boss.maxHp` 記初始血; 血條 `width: round(hp/maxHp*100)%`、文字 `hp/maxHp`、臨死(20%)/組合(60%)門檻全改 `maxHp × 比例`。
- 測試(console): 30 血開場顯示「王 30/30」、條 100%; 剩 5(<6)觸發臨死超級組合、剩 25 不觸發。
- 提醒: 王題庫 = 學過的字; 既有殘留進度(早學過長字)需「🔄 重來」清掉,前期王才不會冒長字。

### 本輪修正(Claude): bossPool fallback 撈到長字
- bug: 重來後(沒學過任何字)直接 `startBoss()`(console 測試),`bossPool` fallback 用 `BANK.slice(0,8)` —— 而 BANK 前 8 筆含 experience/beautiful,於是王冒長字。
- 修: fallback 改 `BANK.filter(音節 ≤ 2).slice(0,8)`,只撈短字。
- 測試(console): 空進度 `bossPool` = cat/happy/water/friend/book/project/home/house(全 ≤ 2 音節); 跑 20 題王題零長字。

### 本輪追加(Claude): 分批解鎖 — 打贏王才進階(使用者拍板,定案學習節奏)
- 取代「批次鞏固學完自動換批」: 新字改「**階段解鎖**」。新增 `BATCH = 5` / `LEARN_ORDER`(實詞按音節短→長、功能詞排最後) / `learnIndex` / `meta.stage`(初始 1)。
- `buildLevel` 的 fresh 只引入 `learnIndex(w) < meta.stage * BATCH` 的字; `bossEnd(win)` → `meta.stage++`(打贏王才解鎖下一批); 重來 reset `meta.stage = 1`。取代舊的 `level >= 6` 長字門檻(音節順序 + 階段已自然涵蓋長字延後)。
- 測試(console): 階段 1 只引入前 5 字(cat/friend/book/home/house),學完不漏第 6 字; 打贏王 stage 1→2,解鎖第 6~10 字。
- ★ **學習節奏定案**: 先前糾結的「滑動視窗 A/B」由此拍板 = **「批次 + 王守門」**(一階段一批 5 字、王守在階段末、過了才進階加新字)。待擴: 「該批全 100% 才解鎖挑戰王」尚未做; `meta.stage` 之後可對應章節 / 多支王。

### 本輪修正(Claude): 過關解鎖時機 + 配對念英文
- bug: 「解鎖下一關(`maxLevel++`)」原本只在按「下一關」時發生,按「回地圖」會漏掉 → 下關鎖住進不去。
- 修: `showDone` 進場就 `meta.maxLevel = level + 1`(回地圖也算完成); 第 5 關王關除外(改由 `bossEnd(win)` 設 `maxLevel = max(_, 6)`)。
- `askMatch` 的 `selEn`: 點英文塊時 `speak(o.en)`,邊配邊練聽。
- 測試(console): 第 2 關過 → maxLevel 3; 第 5 關過 → 維持 5(待打王); 打贏王 → 6; `selEn` 含 `speak`。

### 本輪追加(Claude): 背景音樂 + 跳過說題
- `bgm` 模組: 純 Web Audio 合成的循環琶音(不用素材); 主畫面 topbar `#bgmtoggle`(🎵/🔇)開關、存 `meta.bgm`、`showHome` 還原狀態。用途之一: 一直有聲音可避免「靜音 ~10 秒就斷線」的藍牙耳機掉麥克風。
- 跳過說題: `renderSpeak` 加「沒麥克風/不想出聲?跳過說題」→「只跳這題(`onCorrect`)」/「以後都跳過(`meta.skipSpeak = true`)」。`askSpeak` 開頭 `if (meta.skipSpeak)` 自動 `onCorrect` 帶過。重來 reset `meta.skipSpeak = false`。
- 測試(console): `bgm.toggle/isOn` 為 function; home 有 `#bgmtoggle`; `skipSpeak=true` → `askSpeak` 不渲染說題、reps[說]++; 說題畫面有跳過鈕。
- 待擴: Boss 未來若加「說」的組合題,需檢查 `meta.skills.speak` 跳過。

### 本輪追加(Claude): 聽說讀寫技能開關(設定面板)
- `meta.skills = {listen, speak, read, write}`(預設全開,缺值視為開)。主畫面 topbar `#settingsbtn`(⚙)→ `showSettings()` 面板、4 個 toggle。
- `ask()` 過濾: 認階(rung1)依 `SKILL` map 濾掉關掉的聽 / 讀題型; 說階(rung2)/寫階(rung3)若關 → `passRung`(自動帶過、不出題)。
- 整合: **移除 `meta.skipSpeak`**,「永久跳過說題」改為 `meta.skills.speak = false`(說題畫面「以後都跳過」鈕、或設定裡關說)。重來 reset `meta.skills = {}`。
- 測試(console): 設定面板 4 row; 關 speak → 說階 passRung(reps[說]++、無 mic UI); 關 listen → 認階只出 read 題(askReadPick/askPicture/askMatch/askClozePick)。
- (已做,見下) BGM 音檔 + 多首清單。

### 本輪追加(Claude): BGM 音檔 + 多首音樂清單
- `bgm` 改支援音檔: `BGM_TRACKS`(🎹 合成琶音 + `bgm1/2/3.mp3`); `playTrack()` 播 `meta.bgmTrack` 指的檔,`file: null` 或載入失敗 → fallback 合成琶音。`bgm.setTrack(idx)` 換歌(播放中即時切)、存 `meta.bgmTrack`。
- `showSettings` 加「🎵 背景音樂」清單(點選 radio); `#bgmtoggle`(🎵)仍負責播 / 停。
- 檔案放法(使用者決定: 獨立檔 + 專屬資料夾): Suno 生好的 mp3 改名 `bgm1/2/3.mp3` 放 **`audio/` 資料夾**(`BGM_TRACKS` 路徑為 `audio/bgmN.mp3`); `audio/README.md` 內有檔名對照表 + 三段 Suno prompt + 用法。**不內嵌**(base64 會讓單檔肥數 MB)。`file://` 載媒體若被擋就用 localhost。
- 測試(console): `BGM_TRACKS` 4 項; 設定面板 4 技能 + 4 音樂 row; `setTrack(1)` 不報錯、`meta.bgmTrack=1`、① 標 🔘。
- 擴充: 要更多首加 `BGM_TRACKS` 即可。

### 本輪追加(Claude): BGM 擴 5 首 + Boss 戰鬥曲隨機
- `BGM_TRACKS` 擴到 5 首(`audio/bgm1~5.mp3`)+ 合成。新增 `BOSS_TRACKS`(`audio/boss1~3.mp3`)。
- `bgm.boss()` 打王進場隨機播一首戰鬥曲、`bgm.normal()` 結束回一般 BGM(`startBoss` / `bossEnd` 呼叫); 沒放 boss 音檔 → fallback 合成。新增 `playFile()` 共用播放。
- 測試(console): `BGM_TRACKS` 6 / `BOSS_TRACKS` 3; `bgm.boss`/`normal` 為 function; `startBoss` / `bossEnd` 不報錯、Boss 正常渲染。`audio/README.md` 已更新(5 首 + boss + Suno prompt)。

### 本輪追加(Claude): 臨死反撲音樂(同曲加速)+ 全音樂音量上限 20%
- **臨死暴走不換第四首**: 王血跌破 20% 那回合,把**當下正在播的 boss 曲**設 `playbackRate = 1.3` + `preservesPitch = false`(8-bit chiptune 加速→同時升調=暴走感)。新增 `bgm.panic()`; `bossTurn` 用 `boss.panicked` 旗標保證只觸發一次; `startBoss` 初始 `panicked:false`; 打完 `bgm.normal()` 重開 `<audio>` 自然歸位(`playbackRate` 回 1)。
- mp3 與合成兩條路徑都重置: `playTrack`/`playFile` 進場 `panicMode = false`。合成 fallback(沒載到 mp3 時)走 `panicMode`: `synthTick` 間隔 850→520、音高 ×1.5。
- **全音樂音量上限 20%**: `playTrack`/`playFile` 的 mp3 `volume` 0.4 → 0.2(不蓋過學習語音/TTS)。一般 BGM 與 Boss 同層都吃。**`sfx` 音效未動**(短音效非背景音樂)。合成 `master`(0.6)未動: 每音 gain 0.045 × master 實際輸出已 <20%,降它只會讓 fallback 過小聲。
- 驗(preview console): 無錯誤; `bgm.panic` 為 function 且可呼叫; `bossTurn.toString()` 確認守衛 `!boss.panicked && boss.hp <= boss.maxHp*0.2 → bgm.panic()` 已編進 live 函式; 靜音實測 `normalVol`/`bossVol` 皆 0.2。
- **可調**: panic 的 `playbackRate`(1.3,嫌不夠燃→1.4~1.5、太尖→1.2)、合成 ×1.5 / 520ms; 音量 0.2。
- **待**: ① 臨死「漸進加速(winding up)」選項待使用者拍板(目前瞬間切); ② 聽感(1.3x 對不對)要 localhost + BGM 開 + 打到 ≤6 血 playtest; ③ Boss 音檔 `audio/boss1~3.mp3` 待放(放滿 3 首,或只放部分就改 `BOSS_TRACKS` 只列實有,免得隨機抽到沒放的掉回合成)。

### 本輪追加(Claude): 合成琶音退出選單(改當 fallback)+ 釐清音量誤會
- 使用者放好 5 首 bgm + 3 首 boss mp3 後,把 `BGM_TRACKS` 的 `{ file: null }`(🎹 合成琶音)從**選單**移除,只留 5 首實體 mp3。`startSynth`/`synthTick` 程式碼**保留**,只當「某首 mp3 載入失敗 / `file://` 擋媒體」時的 fallback(不變死寂、藍牙耳機不掉線),選單看不到。
- 連帶釐清誤會: 使用者反映「20% 音量沒變小」,實為 `meta.bgmTrack = 0` 一直指到合成琶音(那首刻意沒降),**根本還沒聽到任何 mp3**。移除後 index 0 自動變 `bgm1.mp3`,主頁預設落在真 mp3、吃 0.2 音量。
- ⚠ 已告知使用者: Suno mp3 母帶較響,**0.2 的 mp3 可能反而比剛剛聽的合成琶音大聲**;嫌吵再往下調(0.15 / 0.1)。
- 驗(preview console): 無錯誤; `BGM_TRACKS` 5 首全 mp3、選單無 synth; 預設解析到 `audio/bgm1.mp3`; 靜音實測預設曲 + boss 音量皆 0.2。
- 註: `meta.bgmTrack` 索引整體 -1(原 0=synth 已移除)。使用者現在 0 → 自然對到 bgm1、無痛;若曾選過 ③~⑤,重整後會差一首,設定裡重選即可。

### 本輪修正(Claude): 音樂音量 20% → 10%
- 使用者實聽 20% mp3 仍太大(會蓋到學習語音),`playTrack`(一般 BGM)與 `playFile`(Boss)的 `volume` 0.2 → 0.1。
- 註: `playFile` 只服務 Boss(`boss()` 呼叫);`normal()`/`setTrack`/`toggle` 都走 `playTrack`。Boss 與一般 BGM 可各自給音量;目前都 0.1,Boss 想更有戰鬥感可單獨拉 `playFile`、不動 BGM。
- 驗(preview console): 靜音實測一般 + boss 音量皆 0.1。

### 本輪修正(Claude): 看圖題 home/house、listen/hear 同圖無解 bug
- bug(使用者實測截圖): `askPicture` 出 🏠 問選哪個字,但 `home`/`house` 在 `EMOJI` 都是 🏠、又被 `CONFUSE_PAIRS` 強制湊成選項 → 看圖根本分不出「家 / 房子」。`listen`/`hear` 同樣都 👂、同一個坑。
- 修(玩法層通則,引擎不碰): `askPicture` 出圖前檢查——**若有別的選項跟正解共用同一個 emoji,該圖無法唯一指向正解 → 退回 `askReadPick`(看中選英)**。那題公平,選錯還能用 `wrongHint` 教差別。`fourOptions(w)` 改成算一次,守衛與渲染共用同一份選項(免得檢查的跟畫出來的不一致)。
- 效果: home/house/listen/hear 這類「同圖近義對」不再出圖、改出文字題; cat/book/water 等獨佔 emoji 的字圖題照常。
- 驗(preview console): 無錯誤; 守衛已編進 live `askPicture`; home/house 同🏠、listen/hear 同👂 確認; home 選項恆含 house(8 次抽樣)→ 必退回看中選英; 對照 cat(無碰撞)圖題照常。

### 本輪修正(Claude): 王關可從主畫面挑戰 + 上方進度條改逐題進
- bug①(王關回地圖就鎖死): 第 5 關過、若沒在過關畫面按「挑戰王」而是回地圖,就只能重玩第 5 關才能再觸發(地圖無王節點)。修: 第 5 關過設 `meta.bossReady`,`showHome` 左欄常駐「⚔ 挑戰第一支王」入口(`bossReady && !bossCleared` 才顯示、`onclick=startBoss`),`bossEnd(win)` / 重來清旗標。另補: 「🔄 重來」原本沒清 `meta.bossCleared`,一併補 `bossReady=false; bossCleared=false`(否則重來後王關狀態殘留)。
- bug②(進度條卡 0%): `updateBar` 上方那條原本算「整個字練完數 / 字數」——每字要 `NEED_RUNG=2` 次才算完成,5 字關卡前 5 題等於每字各 1 次、一個都沒「完成」→ 條卡 0%(使用者實測「答 5~6 題沒動」)。修: 改成「已答對次數 / 該關總需求次數」= `Σmin(lgot,quota) / Σquota`,每答對一題就前進、整關 100%;標籤改顯示 `%`。**只動顯示,沒動 SRS 計次邏輯。**
- 驗(preview console): 王關入口在 `bossReady && !bossCleared` 顯示、`onclick===startBoss`、`bossCleared` 後消失; 進度條 2字×2次 逐題餵答對 → 0/25/50/75/100%。
- 待答(使用者): 使用者對 `NEED_RUNG=2`(每階對 2 次才算熟)表示困惑/不記得 → 下輪確認「保留 / 調數字 / 換判準」。釐清: 這是 SRS 學習判準,**與上方進度條已脫鉤**。前述「出題重複降權重」「混合比例」也待這條釐清後再處理。

### 本輪(Claude): 熟練度改版規格定案 → 寫成 DESIGN_MASTERY.md
- 經多輪和使用者對齊,學習核心要從「計次(`NEED_RUNG=2`)」改成「**連續累積 %**」:答對 +25 / 答錯 −20、100% = 學會、答錯只扣 % 無額外罰、教不加不扣、學會後掉破會回練、說題辨識誤判保留寬鬆不扣。
- 兩條熟練度軌:**單字 %**(每字一條總 %,不分認/說/寫)+ **句型 %**(每個 `PATTERN` 一條,記排序邏輯)。**難度跟 % 走**(單字軌:看圖/聽選→說→默寫;句型軌:排詞→填空→整句默寫)。
- 句子**錯點歸因**:用錯/拼錯字 → 扣該字;字對順序錯 → 扣該句型(不連坐)。答錯 → **回顧重答回合**(主回合跑完,錯題先重看再答,永不卡死;解掉 Duolingo 卡關痛點)。
- 盤點:排詞(`askBuildSentence`)、填空(`askClozePick`)已有半成品、待接系統;整句默寫待新做;計次那套(`reps`/`rungOf`/`pOf`/`quota`…)待換。
- 規格全文見 `DESIGN_MASTERY.md`;`HANDOFF.md` 頂部加了 ⚠ 指標。**本輪尚未動 code**,實作分步進行。

### 本輪(Claude): 熟練度改版 step 1 —— 計次 → 連續 %(實作 + 驗證)
- **schema**: `store[id]` `{taught, reps[], coined, miss}` → `{taught, mastery(0~100), coined}`。`rec()` 自癒:讀到舊 `reps` 自動用舊 `pOf` 公式換算成 `mastery`、刪掉 `reps`/`miss`(玩家進度不歸零)。
- **加減**: `onCorrect` 答對 `mastery += 25`(`MASTERY_OK`;封頂 100;首次滿 100 給金幣);`onWrong` 答錯 `mastery -= 20`(`MASTERY_BAD`;地板 0);拔掉舊 `miss` 連錯機制。教階(rung 0)不加不扣。
- **難度跟 % 走(step 3 一起做了)**: `rungOf` 改用 `tierOfMastery`(<34 認 / <67 說 / 其餘 寫),功能詞仍封頂認。`pOf` 直接回 `mastery`;`isLearned` = `mastery≥100`。`levelPlan` 的 `topRung` 固定 3(關卡不再封頂難度,改由 mastery 決定)。`askSpeak`/`askWrite` 的「第一次給鷹架」改吃 mastery(說<50 跟讀、寫<84 音節填空)。
- **暫留(step 2 處理)**: `LEVEL_QUOTA=2`(一關每字仍問 2 次)、答錯仍即時回佇列(還沒改成「主回合跑完再回顧重答」)。
- **驗(preview console,獨立 8183 不碰玩家 8182 存檔)**: 生命週期 教→25→50→75→100(+金幣)→答錯 80,階級轉換全對;功能詞 @90 仍封頂認;舊 `reps[0,2,2,2]`→`mastery=100` migration;`buildLevel`+`chooseRung` 不丟錯;無 console error。
- 註: 驗證用在 `.claude/launch.json` 加了 `english-game-verify`(8183)config,不影響玩家自跑的 8182。

### 本輪修正(Claude): BGM 還原後圖示沒同步(音樂在播卻顯示 🔇)
- bug(使用者實測): 重整後 `meta.bgm` 自動還原播放,但 `showHome` 的 `#bgmtoggle` 圖示在 innerHTML 當下用 `bgm.isOn()`(那時還 false)算成 🔇,還原 `bgm.toggle()` 在之後才跑 → 音樂在響、按鈕卻顯示靜音。
- 修: 還原 toggle 後補一行同步圖示。驗(8183): `meta.bgm=true` 進 `showHome` → `isOn=true` 且圖示=🎵、一致;無 console error。
- 使用者回饋(待排): 「後期好玩、前期無聊」—— 早期 = 同一批 5 字、低難度、低刺激,屬「關卡骨架 / 節奏」議題,建議排在 step 2(回顧重答)之後一起做結構 pass。

### 本輪(Claude): 熟練度改版 step 2 —— 答錯回顧重答回合(實作 + 驗證)
- 答錯不再馬上重考: `onWrong` 改 push 到新的 `reviewQueue`(延後),不回主佇列。`nextQuestion` 改三段:主佇列 →(空)回顧佇列 →(空)`showDone`。
- 新增 `reviewThenAsk(w)`: 回顧回合每題先「重看一次」(字 + 音節 + 中文 + 🔊念 + 字根 `why`)→ 按「再試一次」才 `ask(w)` 重答。答對清掉(`onCorrect` 在 `inReview` 時把 `lgot` 設到 `quota` = 本關完成);又錯 → 回 `reviewQueue` 重新回顧,**永不卡死**。
- quota 規則順手調: 新字 `2`(教 + 馬上考一次,治「整關只看教卡」的悶)、複習字 `1`(一次,治複習字一直重複)。移除 step 1 暫留的 `LEVEL_QUOTA`。
- 進度條: 沿用 `Σmin(lgot,quota)/Σquota`,回顧清題時 `lgot=quota` → 全清完到 100%(主回合 + 補練都算)。
- 驗(preview 8183, console): 主回合答對 `lgot+1`/不誤入 review;答錯→進 `reviewQueue`、mastery −20、不回主佇列;主空→`nextQuestion` 進回顧(`inReview=true`);回顧答對→清題、bar 100%;回顧再錯→重新延後;無 console error。
- 待玩家實測: 真正點擊跑一關(故意答錯)看回顧回合手感;`reviewThenAsk` 的重看畫面文案 / 要不要顯示「還剩幾題回顧」可再調。

### 本輪(Claude): 看圖題支援自製圖 + home/house 重新出圖
- 新增 `img/` 資料夾 + `IMG` map(`word_id→png`)+ `visualOf`(圖優先、其次 emoji)。`askPicture` 改渲染 `<img>`(載不到 `onerror` fallback 回 emoji);唯一性守衛改吃「視覺」(不是只比 emoji)。
- 使用者給的兩張合併圖(大小、房子/家)用 Pillow 切開 + 去背 → 4 張透明 PNG:`big`/`small`(同尺寸畫布、保留大小對比)、`house`/`home`(各自裁緊)。去背 = 從邊框 flood-fill 白色轉透明(只去背景、不挖物件)。
- 效果: home/house 現在是**不同的圖** → 看圖題重新打開(先前因同 🏠 被守衛擋成文字題);listen/hear 仍同 👂 → 維持退回文字題。
- 驗(preview 8183): `visualOf` 對(home/house 不同路徑、listen=👂、cat=🐱);`askPicture(home)` 渲染 `<img src=img/home.png>`;`askPicture(listen)` 退回文字;無 console error。截圖工具逾時(headless 渲染器無回應、非 code 問題),`raw_*.png`→4 張成品已逐張開檔確認去背乾淨。
- 工作流定案(與使用者): 不規則圖 → **單張一字一圖、透明背景**;要批次再用「每格同尺寸的規則網格」sprite。`img/README.md` 已記。

### 本輪(Claude): 看圖說 / 看圖寫 + 前期單調修正(實作 + 驗證)
- **圖不只拿來選字**:新增 `picHTML`(渲染視覺,圖/emoji 共用)。`askPicType`(看圖 → 打出英文)掛進 `askWrite` 池;`renderSpeak` 加 `pic` 模式(看圖 → 說),`askSpeak` 熟一點時隨機抽 direct/blind/**pic**。沒視覺的字不會抽到圖模式。
- **破前期單調**:① `ask` 加全域 `lastFormat` —— 除了「同字不連續同題型」,再加「**跨題不連續同一種形式**」,認階 6 種題不會連著出一樣。② `onCorrect`:剛教完的字(rung 0)re-queue 改 `splice` 到佇列前段(隔 ~2 題),不再「整關先把每個字教一遍才開始考」。
- 驗(preview 8183): 無 console error;`picHTML`/`askPicType` 為 function;教完 re-queue 落 index 2(非最後);`ask` 連跑 20 次用滿 6 種認題、連續重複 = 0。
- 待玩家實測: 看圖說 / 看圖寫實際手感;前期節奏有沒有變不悶。**圖模式只在字升到「說/寫」階才出現**(早期低 % 仍是認階)。`big/small` 的 🐘/🐜 已被自製方塊圖蓋過(`visualOf` 圖優先)。

### 本輪修正(Claude): 前期「整關同一階」根治 —— 錯開新字引入
- 使用者澄清: 前期無聊 = 「第 1~4 關每關整關同一階」(L2 全認 / L3 全說 / L4 全寫),不是題型小變化。上一輪的 `lastFormat` / 教完隔題只修了「同階裡的小變化」,沒治這個。
- 根因: 第一階段 5 個字「**一起前進**」(同時 +25 熟練度)→ 永遠同 %→ 同階;要到第 4 關後字群進度錯開才混階(= 使用者說的「4 關後才有東西」)。
- 修: `buildLevel` 從「複習填不滿才一次倒進全部新字」改成「**一關最多引入 `NEW_PER_LEVEL=2` 個新字**」。字群進度自然錯開 → 同一關同時有「剛教的(教/認)+ 早學的(說/寫)+ 回鍋」= 混階。
- 驗(8183): fresh 開局 L1 只引入 2 字(都 rung0);混階情境(cat/friend@60、book/home fresh、house@100)→ 同一關出現 rung 0/2/4;無 console error。
- 可調 `NEW_PER_LEVEL`(現 2)。提醒: 既有存檔字群已同步,要看新開局的混階效果建議「🔄 重來」。

### 本輪(Claude): 出題模型重做 —— 關卡解鎖 × 熟練度頻率(兩軸並行)
- 使用者定案: **關卡 = 解鎖進度**(哪些題型可出)、**熟練度 = 出現頻率**(池子裡哪種題出現多),**兩個一起跑、不是二選一**(我一度做成「用關卡取代熟練度」,被糾正)。
- 把舊的 `RUNGS`(吃熟練度階選題)換成 `FORMATS` 表: 每個題型格式標 `lv`(第幾關解鎖)/ `skill`(設定可關)/ `ok`(該字適用)/ `run`(怎麼出)。`ask` 改:
  - **向下取**: 題型池 = 所有 `lv ≤ 當前關` 的格式(濾掉技能關的 / 字不適用的)→ 關卡越高池越大越豐富,同一關也混多種。
  - **新字一律先教**(`isFresh` → `teach`)。
  - **熟練度當權重(不是 gate)**: `tierOfMastery` 取目標難度,池子裡靠近的題型權重高、遠的低(d=0→3 / d=1→1 / d≥2→0.3)→ 難題不消失只變少;字越熟難題越多。
- 解鎖表(可調,在 `FORMATS`): L1 看中選英/配對/跟讀說 → L2 +聽選意思/看圖選 → L3 +聽選字/句中填空/直接說/盲聽說/看圖說 → L4 +音節填空/聽寫/看圖寫 → L5 +默寫。
- 驗(8183): 池 L1(3)⊂L3(9)⊂L5(13); 200 抽樣 @L5 熟練 10→t1 75% / 50→t2 61% / 90→t3 68%(低偏簡單、高偏難、皆非 0); 新字走 teach; 無 console error。
- 註: 舊 `chooseRung`/`RUNGS`/`SKILL`/`passRung`/`askSpeak`/`askWrite` 已不被 `ask` 用(留著未刪,之後清)。stage 2+ 新字在高關會直接吃大池(可能偏難),待觀察是否要讓新字「緩進」。

### 本輪(Claude): 後期字頻明確化 —— 學會的字定期抽考
- 使用者定案: **還在學的字 = 主力(常出)、學會的字 = 抽考(偶爾回驗,答錯掉 %→退回主力)**。
- 漏洞(修前): `buildLevel` 原是「還在學的優先、學會的補空檔」,後期若還在學的 ≥ size,學會的被完全擠掉、永不抽考 → 等於沒複習(熟練度只在答錯掉、不隨時間衰退,不抽就永遠以為會)。
- 修: `buildLevel` 每關固定保留 `SPOTCHECK=1` 個學會的字當抽考(`learned` 已 shuffle → 隨機輪到),主力仍是 review(還在學的)+ 少量新字。與題型頻率組合: 被抽考的字熟練度高 → 自動偏難題型 → 抽考天然是硬 retention 測試。
- 驗(8183): 模擬 4 學會 / 5 學中 / 其餘新,跑 10 關 → 學中 40、學會抽考 10(每關 1);無 console error。
- 待做(輕量 SRS): 抽考目前隨機輪,還沒做「優先抽最久沒考到的」間隔排程;`SPOTCHECK` 可調。

### 本輪(Claude): 課程結構定案(CURRICULUM.md)+ 字分批重排
- 使用者定案章節骨架: **學字 ↔ 用字交替** —— L1-5 實詞 → L6-10 膠水詞(this/is/a)+ 造句 → L11-15 新實詞 + 套用 → L16-20 新句型 / 變體(this is ↔ is this 重排教文法)→…;每階段一支 themed 王(拼字考 / 句子考)。膠水詞當「解鎖造句的鑰匙」、登場自帶 aha。寫進 `CURRICULUM.md`。
- 字分批: `LEARN_ORDER` 從「實詞按音節 + 功能詞最後」改成明確 `BATCHES`(批1 cat/book/friend/happy/water、批2 this/is/a/my/I/am、其餘暫附後)。新增 `batchOf`;`buildLevel` 的 fresh 改吃 `batchOf(w) < meta.stage`(移除 `BATCH`/`sylCount`)。
- 效果(靠現有 boss→stage++): stage 1=實詞批、stage 2(打贏 Boss 1 後)=膠水批解鎖 → 句子靠 `requires` 自動冒出。**L1→造句鏈結構已通**。
- 驗(8183): `batchOf` cat=0 / is=1 / drink=2; stage1 fresh=批1(5 字)、stage2=批1+2(11 字); this/is/a 教過 + cat → `buildSentenceFromPattern` 吐「This is a cat.」; 無 console error。
- 待續(CURRICULUM 實作 2-4): 句子題拉進主出題流(DESIGN_MASTERY step 4 句型 %)、變體句型(問句)、Boss 2 句子考。`water` 要等 `drink`(後面批)才有句;批 3+ 待擴字庫時編。

### 本輪修正(Claude): 配對 / 選擇題會拉進沒教過的字(含別批膠水詞)
- bug(使用者實測截圖): 第一關只教 cat+book(`NEW_PER_LEVEL=2`),配對題卻硬湊 5 組 → 把沒教的 water/happy/friend、甚至批 2 才解鎖的 `my` 拉進來叫人配對。
- 根因: `askMatch` 湊不滿 5 個教過的字時,第三層 fallback `BANK.filter(id!=w)` 不管教沒教;`fourOptions`(選擇題誘答)同樣從全 `BANK` 抓。
- 修: ① `askMatch` 拔掉「抓任何字」那層,只用 `!isFresh`;不夠 5 就少幾組。② `fourOptions` 誘答全改 `!isFresh`(近義對也要教過才放),不夠就少選項、不硬塞。③ `FORMATS` 的 match `ok` 加門檻:≥4 個其他教過的字(≥5 總)才出。
- 驗(8183): 只教 cat+book → match `ok=false`、`fourOptions` 只回 [cat,book]; 教滿 5 → match `ok=true`、誘答全教過; 無 console error。補上「沒教過的字絕不出現」在配對/選擇的破口。
- 追加(使用者回饋「配對做自由一點、組數浮動」): match `ok` 門檻從「≥4 其他教過的字」降到「**≥2**(≥3 總)」→ 組數隨教過的字**浮動 3~5**(`askMatch` 拔掉沒教 fallback 後本來就會自然縮),不再硬性 5。驗: 教 2→不出、3→3 組、6→上限 5 組。min 3 / max 5 可調。

### 本輪(Claude): 關卡地圖鏡頭(固定視窗 + 跟著目前關 + 王快捷)
- 使用者回饋: 關卡無限往下延伸,10 關後地圖拖很長、很遙遠。
- 改: 地圖 SVG 放進固定高視窗(`.mapscroll`,`height:min(60vh,520px)`、`overflow-y:auto`)→ 滑鼠滾輪 / 手機觸控原生捲動。進場**自動置中在目前關**(`scrollToLv`:節點 cy × 渲染縮放比 → 設 scrollTop)。**同步呼叫**(讀 `getBoundingClientRect` 會強制排版拿真實尺寸,避開「rAF 在排版前觸發 / headless 背景節流」的坑),再加一個 rAF 當保險。
- 快捷列 `.mapjump`: 「📍 目前 · 第 N 關」+ 每 5 關一支王「⚔ 第 N 王」(只列 ≤ maxLevel),點了平滑捲到該關。
- 驗(8183): maxLevel=12 → 視窗可視 438 / 內容 787(會捲);同步置中 scrollTop=349(置中第 12 關);跳第 1 王(第 5 關)→ scrollTop=34;快捷列=目前/第1王/第2王;無 console error。截圖工具逾時,視覺待玩家看。可調: 視窗高 `min(60vh,520px)`。

### 本輪修正(Claude): 說題結算後兩個聽力鈕重複
- bug(使用者截圖): 說題(shadow/blind)答對後,題目原本的「🔊 聽示範」沒收掉,跟結算新增的「🔊 再聽」並存 = 功能一樣、多餘;「跳過說題」也還掛著(答完不需要跳過了)。
- 修: `speakResult` / `offerSelfAssess` 結算時把原本的 `demo`(聽示範)+ `skipspeak`(跳過)隱藏,留結算的「再聽」。
- 驗(8183): `renderSpeak` shadow → demo/skip 在;`speakResult(對)` → demo/skip 隱藏、剩「再聽」+「繼續」;無 console error。

### 本輪(Claude): 間隔複習(SRS)+ 浮動關卡(核心脊椎)
- 使用者點破: ① 固定 5 字 → 學越多越記不住(複習量不夠);② 句子 / 主題需要多字同場(「我叫大衛我來自中國」破 5)。→ 關卡大小改**浮動、由內容決定**。設計寫進 `DESIGN_MASTERY.md §6`。
- SRS 排程(每字 `due`/`ivl` + 全域 `meta.clock` 每開一關 +1): 剛學會 `ivl=1`;複習答對 `ivl×2`(封頂 30)、`due` 往後拉;答錯 `ivl=1`、`due=clock+1`、`mastery −20`(退回 active)。寫進 `onCorrect`/`onWrong`。
- `buildLevel` 重寫: 沒固定 5 字,依序填到 `MAX≈10` —— 新字(`NEW=2`)+ 學習中(`active`,cap 5)+ 到期複習(`due≤clock`、最逾期先)。`startLevel` 每關 `meta.clock++`。舊的 `size`/`SPOTCHECK`/`ok`/`learned` 回鍋那套移除。
- 驗(8183): SRS 生命週期 學會→ivl 1/2/4、答錯→ivl 歸 1 + mastery 掉 + lapse;浮動 8 到期+2 學中→size 10(封頂)、只 2 學中→size 4(縮下去);無 console error。
- 待續(DESIGN_MASTERY §6): 拿掉 `showStart` 預覽、惡補關(打輸王 → 收集拼錯字組關 → 再解鎖)、打王入場不擋。`MAX/NEW/ACTIVE_CAP/ivl×2/封頂30` 皆可調。

### 本輪(Claude): step 4 第一刀 —— 排詞造句進主流程 + 句型 % 第二軌
- 句子題不再只掛過關後選配: 新增 FORMATS `sentence_build`(排詞造句)。`ok` = 現在湊得出句(`pickBuildSentence` 非空 = 膠水詞 + slot 字都學會),`tier:3`(`fmtTier` 改支援 `f.tier` 覆寫 → 偏高熟練度的字才常抽到)。`run` = `askBuildSentence` + main-flow done(`onCorrect`→`updateBar`→`nextQuestion`)。
- **句型 % 第二軌**: `bumpPat`/`patMastery`(存同一個 store,pattern id `pat_xxx` 不撞 `word_xxx`)。`askBuildSentence` 排對 → 句型 % +25;順序錯 → 句型 % −20、**不扣單字**(排詞錯點是順序 → 歸句型,字是給你的)。
- 驗(8183): `bumpPat` +25/−10 → 25/15;`sentence_build` 在 FORMATS、tier 3;this/is/a/cat 學會 → ok=true、組「This is a cat.」;抽掉 is → ok=false;無 console error。
- 待續(step 4 後半): cloze 接句型 %、整句默寫(字 + 順序都歸因)、主題化、句子階段關卡組成。

### 本輪修正(Claude): 句子變課程一環(不再可有可無)+ 教句型結構
- 使用者實測(L12)回饋: 句子只有「過關後選配」才練、感覺可有可無;且教了所有字、沒教「怎麼排列」。→ step 4 第一刀太縮。
- ① **句子常態出現**: `ask` 的權重 `wt` 給 `sentence_build` 特例 **= 7**(不再靠單字熟練度的 tier-3 才偶爾出)→ 可組句時約 24~38% 的題是句子。可調。
- ② **教句型結構**: 新增 `teachPattern`(中文 + 英文照順序排好的詞塊 + 「記住了換我排」)。`askBuildSentence` 包成「句型 %=0(沒教過)→ 先 `teachPattern` → 再排」;教過直接排。
- 驗(8183): `teachPattern` 為 function;句型 %0 → 顯示「先學這句怎麼排」+ bump 到 10;%>0 → 直接「排出英文」;weight 7 → 句子頻率 38%(100% 字);無 console error。

### 本輪(Claude): 流程合理性檢視 → 修掉一批問題
- 🔴 **致命:課程不再卡在 11 字**。`stage` 只在打王 +1、而王只有第 5 關 → stage 卡 2 → 其餘 27 字(batchOf=2)永不解鎖、玩到沒新東西。修: ① 未編批的字**每 5 個自動切一批**(`batchOf` 0~7,共 8 批);② **多王**:王在第 `5×stage` 關(5/10/15…),`bossEnd(win)` `stage++` + `maxLevel=level+1` 解鎖下一批;`showDone` 改用 `bossDue = level===5×stage`。
- 🟡 **打輸王 → 惡補關**(取代硬刷):`bossTurn` 記 `boss.missed`(拼錯的字);`bossEnd(lose)` → 那些字 `mastery −30` + `due=now` →「回去惡補」按鈕用 `remedialWords`/`inRemedial` 組一關只練那些字 → 清完 `showDone(inRemedial)` 出「再挑戰王」。入場不擋(過王關就能打)。
- 🟡 **拿掉關卡預覽**:`showStart` 改極簡「第 N 關 / 開始」(原預覽是舊模型、且假設固定小關卡)。
- 🟡 **功能詞封頂**:`ask` 的 pool 加 `tier ≤ maxRungOf(w)` → `is`/`a` 只出認題,不再被叫去說/默寫。
- 驗(8183): `batchOf` cat=0/is=1/beautiful=2、maxBatch=7;王關 5/10/15;`is` pool tier 只 [1];`showStart` 無「一階一階」;remedial globals 在;無 console error。
- 待(小): 主題化的句子王(偶數階段)、dead code(`chooseRung`/`plan`/`levelPlan`)清理。

### 本輪修正(Claude): 玩家 L12 實測的幾個問題
- **配對/選擇「兩個是」**(is/am 中文都「是」→ 無法配對/選對): `fourOptions` 誘答加 `o.zh !== w.zh`;`askMatch` pool 改「中文不重複」。→ 同義字(is/am)不再同框,差異交給句子練。
- **單字母不練寫**: `type`/`flashtype` 的 `ok` 加 `w.en.length > 1`。
- **功能詞單獨聽沒意義 + 念法問題**: `listenpick`/`listenword` 的 `ok` 加 `w.pos !== 'function'`(不出聽題);新增 `SPEAK_AS = {word_a:'uh'}` 念法覆寫 + `speakSyllables` 用它 → 冠詞 a 念 schwa /ə/、不是字母名。
- 驗(8183): fourOptions(is)/askMatch 中文皆唯一(無兩個是);`type`/`flash` ok(a)=false、ok(cat)=true;`listenpick` ok(is)=false;`SPEAK_AS.word_a='uh'`;無 console error。
- 「玩到 L12 沒打王」: 研判跨版本存檔錯亂(stage/王邏輯改過數次)→ 建議 🔄 重來;王關數學(5/10/15)已驗,新開局第 5 關必擋打王。

### 本輪(Claude): 音樂 UI —— 靜音鈕純喇叭 + 選曲獨立成按鈕
- 使用者邊玩邊調: 主畫面靜音鈕改「單純喇叭」、旁邊加一顆「音符+列表」按鈕、把設定裡的背景音樂選擇搬過去。
- 改: ① `bgmtoggle` 圖示 🎵/🔇 → **🔊/🔇**(純喇叭;三處同步: 初始 render / 還原上次開關 / toggle onclick)。② 新增 `musicbtn`(queue_music SVG 圖示,放靜音鈕右邊)→ 點開新函式 `showMusic`(選曲清單,沿用 `BGM_TRACKS` + `bgm.setTrack`,選了即時換)。③ `showSettings` 拿掉背景音樂那段(`bt`/`trackRows`/兩個 div/`[data-track]` handler),只剩聽說讀寫技能開關。
- 驗(preview 8183): showHome → 🔊/🔇 喇叭 + musicbtn(有 SVG path、有 onclick);showMusic → h2「背景音樂」+ 5 軌 + 返回鈕;showSettings → 0 軌、4 技能、返回鈕;無 console error;截圖確認兩鈕並排同style。

### 本輪(Claude): 王臨死反撲重做 —— 多題聯合組合技 + 修「答錯不扣血」
- 使用者實測抓到: ① **bug** —— 臨死「超級組合」答錯走的是「題庫刷新、不扣血」,沒代價。② 想要的「多段」不是一次擠多字,是「**一樣多字一題、但多題聯合成一組**」,且每題收斂 **2~3 字**(原 3~4 壓力太大)。
- 重做: 拆出 `renderBossQ`(共用渲染一題,可多字)+ `bossCombo`(臨死組合技)。`bossTurn` 改純調度: 血 >20% 走一般單題(原邏輯不變: 傷害 letters cap 10、答錯 −1 命);血 ≤20% 走 `bossCombo`。
- `bossCombo`: 連著出 `PANIC_HITS=2` 題、每題 `bossQuestion(2~3)` 字 → **全對才一次灌整組傷害(最後一擊)**;中途答錯/逾時 → 你 −1 ❤、整組作廢、回 `bossTurn` 重來一組。→ 一次修掉「答錯不扣血」+ 換成「組合連續題」。`bossQuestion(nWords)` 改吃參數(移除內建 hp→字數 + `superCombo`)。
- 驗(preview 8183, async 驅動): 臨死出「連段 1/2」多字題 → 連對 hp 5→中途仍 5(不中途扣)→0(全對灌傷、王倒、出擊敗畫面);臨死答錯 you 5→4 + missed 記錄;一般回合無臨死字樣/單字;池子夠時 `bossQuestion(2/3)`=2/3 字;無 console error。可調 `PANIC_HITS`(現 2)。

### 本輪(Claude): 修惡補連坐 —— 多字題答錯只記真的拼錯的字
- 使用者實測: 惡補關複習「王會出的全部字」而不是答錯的。根因: 多字題(尤其臨死組合)整句不對時 `q.ids.forEach(add)` 把那題所有字全丟進 `boss.missed` → 惡補複習一堆已會的字。
- 修: 新增 `bossWrongIds(q, input)` 逐格(空格分隔)比對 typed vs 期望、只回真的錯的字 id;`renderBossQ` 的 cb 多帶 `input`;`bossTurn`/`bossCombo` 答錯改用 `bossWrongIds` 歸因(timeout/空輸入 → 全算錯,合理)。
- 驗(8183): 2 字題「第一對二錯」→ wrong=1(對的不連坐)、空輸入→全錯、全對→0;臨死組合最後一字亂打 → `boss.missed` 只進 1、you −1;無 console error。

### 本輪(Claude): 王戰加出題花樣 —— 看中文 / 聽英文 / 看圖 / 中文四選一
- 使用者: 打王只考拼字太單調。決定: 保留「拼字才造成傷害」核心,單字題隨機換提示方式。
- `renderBossQ(q, combo, mode, cb)` 加 `mode`: `zh` 看中文拼 / `listen` 聽英文拼(純聽不給中文)/ `pic` 看圖拼 / `choice` 中文四選一。`pickBossMode`: 單字題隨機挑(沒圖不出 pic、功能詞不出 listen、`fourOptions`<3 不出 choice);**多字題與臨死組合一律 `zh`**。傷害: 拼字=字母數(cap10),choice 固定 `CHOICE_DMG=3`。重用 `speak`/`picHTML`/`fourOptions`/`visualOf`。
- 驗(8183): 4 mode 渲染正確(listen 純聽無中文+🔊、pic 有圖、choice 4 選含正解無輸入框);`pickBossMode` 240 抽四種都出;choice 正解 −3(30→27)、錯誤歸因到該字;臨死組合回歸正常(連段 1/2→2/2、全對王倒);無 console error。可調 `BOSS_MODES`/`CHOICE_DMG`。

### 本輪(Claude): 排詞造句結算修三點 —— 檢查後收按鈕 / 答錯不再綠色 / 過沒過都唸整句
- 使用者實測(排詞題)抓到: ① 檢查後「退一格 / 檢查」還留著(沒用了);② 老 bug 還在 —— `.why` 結算框 CSS 寫死綠底(`#0e2a1f`),**答錯也顯示綠色**(誤導成過關);③ 缺整句語音。
- 修(`askBuildSentence`): ① buildactions 加 `id="bactions"`,check 後 `hidden=true`、再排一次還原。② check 依對錯設 `why.className`('why' 綠 / 'why bad' 紅);新增 `.why.bad` CSS(紅底紅框)。③ check 時 `speak(sentence.text)` 過/沒過都唸,why 面板加「🔊 再聽整句 / 聽正解」鈕。
- 驗(8183): 排對 → ✅對 / why 綠 / 按鈕收掉 / 有🔊 / 唸了;排錯 → 順序不對 / `why bad` 紅(computed bg rgb(46,20,22))/ 按鈕收掉 / 有🔊 / 也唸;再排一次 → 按鈕回來 + why 回綠;無 console error。
- 註: `.why` 綠框是**所有題型共用**的結算/解說區;這次只把排詞題改成依對錯上色。其它題型答錯也是綠框(但 prompt 另有 ❌ 較不誤導),要全域統一再說。

### 本輪(Claude): 王戰平衡重做 —— 傷害改「按題型給總血 %」、刪字數 cap、王血縮放
- 先釐清爭點(使用者點破我沒查仔細): 全檔搜過 —— **「10% 總血」傷害 cap 從來沒實作進去**,`maxHp` 只用在臨死(20%)/2 字(60%)門檻 + 血條;傷害只有 `Math.min(letters,10)`(絕對值)+ 臨死組合裸加總(沒封頂)。使用者設計的 10% cap 是掉了 / 沒接上,**不是記錯**。
- 共識: 字數算傷害後期會爆(一句話一堆字母),cap 只是擦屁股。改成**按題型給固定傷害、寫成總血 %**(不看字數 → 不爆、自動隨王血縮放、超肉王也不變苦工)。兩個 cap 直接不需要。
- 改: ① `BOSS_DMG = {choice:.05, spell:.08, two:.12, combo:.25}`(占總血比例);`bossTurn` 命中依題型給傷害、`bossCombo` 收尾 = 25% maxHp。② 刪 `Math.min(letters,10)` + `CHOICE_DMG` + 組合裸加總。③ 王血縮放 `bossMaxHp = 50 + (stage-1)×30`(50/80/110…),`startBoss` 吃它。④ 時間放寬: 拼字 `letters×1.5+4`(原 ×1.2+2.5)、臨死組合再 ×1.4。⑤ 功能詞(my/I/is…)不進王戰題庫(膠水留句子練,免「我 / 我的」混淆)。
- 驗(8183): `bossMaxHp` 50/80/110;@maxHp100 → 單字 −8 / 四選一 −5 / 組合收尾 −25 王倒;time 13s、組合 21s;pool 無功能詞;無 console error。皆可調(`BOSS_DMG` / `BOSS_HP_*`)。
- 待(使用者提的「句子階段」一坨,之後開): 6-10 關句子題頻率拉高、學會的字混進句子練(不再單字小考)、偶數階段王改「句子排列王」。

### 本輪(Claude): 修盲聽說題遮罩 —— 寫死「3 底線」改成照音節分塊
- 使用者實測: 盲聽(blind)說題把字遮起來,但遮罩**不管什麼字都固定 `＿ ＿ ＿`(3 塊)**,2 音節字也不照音節顯示,只有過關才一次揭曉。
- 根因: `renderSpeak` 的 `#bigen` 在 blind 模式硬寫 `'＿ ＿ ＿'`,沒看 `sylOf(w)`;但揭曉(`speakResult`/`offerSelfAssess`)本來就用音節分塊填回 → 遮罩跟揭曉結構對不上。
- 修: 新增 `blindHTML = sylOf(w).map(s => 底線×s.length).join('·')` → 遮罩照音節分塊、每塊長度=該音節字母數;blind 模式改用它。揭曉邏輯不動(同結構填回真音節)。
- 驗(8183): cat `＿＿＿`(1塊)/ happy `＿＿＿·＿＿`(2塊)/ water `＿＿·＿＿＿`(2塊)/ experience 4塊;過關 `＿＿＿·＿＿`→`hap·py` 無底線;無 console error。

### 本輪(Claude): 句子階段 step 1+2 —— 排對句子連帶練字 + 句子頻率拉到主軸
- 使用者定案「句子階段」: 6-10 關句子當主軸;組成句子的字(尤其膠水)不要單獨刷太兇,靠排詞自然學會。
- 抓到斷點: 原本排對句子只 `bumpPat`(句型%),**完全沒給組成的字加分** → 「靠句子練字」是斷的(排對句子字%/SRS 都不動)。
- **Step 1(地基)**: 抽 `creditWord`(mastery +25 + 學會排 SRS + 金幣,不碰本關佇列/quota)+ `creditSentence`(拆句子文字 → 對回 BANK → 每個字 `creditWord`)。`askBuildSentence` 排對時 `bumpPat` 後呼叫。→ 排對一句,組成的字 % 跟著漲、學會的字 SRS 往後推(自然少被單獨刷)。
- **Step 2**: `ask` 的 `sentence_build` 權重 phase-aware: stage≥2(膠水解鎖)= 40(原 7)→ 句子約占 **44%**(受 `lastFormat` 防連續壓著,~50% 是實際上限)。
- 驗(8183): `creditSentence` → this/is/a/cat 各 +25;實際排對「This is my cat」→ cat/is 60→85、prompt ✅對、綠框;頻率 stage2 44% vs 原 ~24%;無 console error。weight 可調。
- 待(句子階段 step 3/4): ③ 學會的字更積極退出單獨刷(目前靠 Step 1 的 SRS 推遠自然減少,玩過看夠不夠)④ 偶數階段王改「句子排列王」。

### 本輪(Claude): 排詞造句改拖曳排序 + 「檢查」→「確定」
- 使用者要求: 字卡用滑鼠/手指拖曳重排(不要「退一格」);按鈕改「確定」;確定後只留解釋區 + 繼續。
- 順手修舊坑: 上次 `$('bactions').hidden=true` 藏不掉按鈕,因 `.buildactions{display:grid}` 優先級蓋過 `[hidden]` → 改用 `style.display='none'`。
- 重寫 `arrange()`: 單排 `#arrange`(初始打散)、pointer events 拖曳重排(`pointerdown` 拿起 + 自身 `pointer-events:none` 讓 `elementFromPoint` 看到底下卡 → `pointermove` 用 `insertBefore` 插位 → `pointerup` 從 DOM 重建順序);滑鼠/觸控通吃(`#arrange .chunk{touch-action:none}` 防捲動)。拿掉 picked/退一格;按鈕「確定」讀 DOM 順序判對錯,結算流程(綠/紅、`creditSentence`、🔊、再排一次 reshuffle)沿用。
- 驗(8183): 結構(單排/確定/無退一格)、確定排對 → ✅+綠+cat 60→85、確定後 bactions `display:none`、拖曳接線(pointerdown→drag class+pe:none、pointerup→清理)皆過;無 console error。⚠ 真正的「拖一張卡插位重排」靠 `elementFromPoint` 命中測試,無頭預覽版面測不準 → **待玩家在真瀏覽器試手感**。

### 本輪(Claude): 內嵌 favicon —— 消掉終端機一堆 favicon.ico 404
- 使用者看 server log 一堆 `code 404 / GET /favicon.ico 404`。研判: 純瀏覽器自動討分頁圖示、沒檔案 → 無害噪音,遊戲正常(200/304 才是真服務)。
- 修: `<head>` 加內嵌 emoji favicon(📚 的 SVG data URI)→ 瀏覽器不再去要 `/favicon.ico`,log 乾淨 + 分頁有圖示。驗(8183): `link[rel=icon]` 在、含 📚、無 console error。

### 本輪(Claude): 排詞拖曳改「卡片跟著指標浮起」(float + placeholder)
- 使用者實測: 能拖能重排,但視覺上卡片不動(只有別張讓位)→ 看起來不像能拖。
- 改 `arrange()` 拖曳: pointerdown 量偏移 + 在原位放虛線占位符 `.chunk-ph`、卡片轉 `position:fixed` 浮起;pointermove 卡片 `left/top = 指標−偏移`(真的跟手)+ 占位符插到指標所在格;pointerup 卡片落到占位符位置、還原。`.chunk.drag` 改純陰影(拿掉 scale 免 fixed 定位偏移)。
- 驗(8183): pointerdown → 卡 `position:fixed`+`pe:none`+`z1000`、生 1 個占位符;pointermove(300,500)偏移(10,8)→ 卡 `left:290/top:492`(跟手);pointerup → 還原、占位符移除、卡回 box(4 張);無 console error。重排命中測試無頭測不準,但使用者已實測會重排。

### 本輪(Claude): 語音挑最好的那顆 + 句子加慢速聽
- 使用者: 句子語音有時不標準、想加慢速聽。
- **語音**: `speak()` 改會挑最佳英文語音(`pickBestVoice`: Google > 微軟 Natural/Aria/Jenny > en-US > en),`voiceschanged` 事件補挑(getVoices 常初始為空);設 voice 包 `try/catch`(失敗退回預設,別讓 speak 整個 throw 連累呼叫端 —— 測試時就因壞語音把確定流程弄爆過)。**Web Speech 上限=裝了哪些語音;真人級要雲端 TTS(API key/連網/錢,之後再談)。**
- **慢速**: 句子結算(對/錯)的 🔊 旁加「🐢 慢速」鈕 = `speak(text, 0.5)`(跟既有單字慢念一致)。
- 驗(8183): `pickBestVoice` 灌假清單 → 選到 Google US English;`speak` 帶壞語音不 throw;確定排對 → 🔊 再聽整句 + 🐢 慢速 兩鈕在、prompt ✅;無 console error。⚠ 無頭預覽沒裝語音,**實際音質要玩家在自己 Chrome 聽**。

### 本輪(Claude): 修句子裡的冠詞 a 被念成字母「A」
- 使用者聽到新語音把「This is a cat」的 a 念成字母 A。根因: 單字的 a 有 `SPEAK_AS={word_a:'uh'}` 念 schwa,但**整句是直接念 `sentence.text` 字串、沒套覆寫**。
- 修: 新增 `speakSentence(sentence, rate)` —— 念整句前把有 `SPEAK_AS` 覆寫的字逐字換掉(a→uh)再念;`askBuildSentence` 所有句子發音(確定時自動念 / 再聽整句 / 慢速,對錯兩支)改走它。
- 驗(8183): 攔截 speak →「This is a cat.」送出「This is **uh** cat.」;「This is my book.」「I am happy.」不動;慢速 rate 0.5 帶到;無漏改的 `speak(sentence.text)`;無 console error。

### 本輪(Claude): 功能詞退出單獨刷(step 3 功能詞半)—— 修「是 → 選 is」的歧義
- 使用者實測: 看中選英出「**是** → happy / a / this / is」。問題: 中文「是」同時是 yes / is / am,且 is/am 中文都「是」→ 功能詞沒有乾淨的單獨意思,單獨考本來就難又會互撞。
- 修(跟「功能詞=膠水」的設計一致): 功能詞(`pos==='function'`)只「教」一次(教卡有例句),之後**不再出單獨題,只在排詞造句裡練**(`creditSentence` 幫它加分學會)。
  - `buildLevel`: `active` 與 `due` 都加 `w.pos !== 'function'` → 功能詞不被撈進關卡單獨刷。
  - `startLevel` quota: 功能詞新字 quota=1(只教、不馬上考);實詞維持 2。
- 驗(8183): buildLevel active/due 都不含功能詞、實詞照常(cat 學會到期仍回來複習);fresh 功能詞 quota=1 / 實詞 2;無 console error。即用即生效,不必重來。
- 註: 這是 step 3 的「功能詞半」。學會的**實詞**退出單獨刷目前仍靠 step 1 的 SRS 自然推遠(玩過看夠不夠)。step 4(句子排列王)仍待開。

### 本輪(Claude): 王戰/課程重構定案 + step 1(加權選字「現學多舊少」)
- 使用者 15 關實測一坨(多半指向「課程結構還沒做」): ① 王亂抽全部歷史字(一直考 batch1 cat/book)② 貓圖刷屏(看圖題只有有圖的字、又抽舊字)③ **[查證]答錯沒補考 = 不是 bug** —— 單字題答錯確實會回顧重答(實測 `review_round_fired:true`);句子題是當場「再排一次」、不進補考(設計如此)④ 5 關太短、字沒練到「寫」就被王要求拼 ⑤ 想要彈性階段 + phase ⑥ beautiful/project 缺圖。
- **使用者定案課程設計**: 每階長度**彈性**(內容決定,非固定);每隻王**綜合考但偏重「現正學的」、舊字少量帶到**;一階 1-5 學新字打基礎、6-10 練默寫+句子;王考當前階段的字/句(句子階段=句子默寫)。
- **做了 step 1**: `bossPickWords` 加權抽字 —— 當前批次(`batchOf === stage-1`)權重 `BOSS_CUR_WEIGHT=4`、舊字 1 → 王偏重現學的。`bossQuestion` 改用它。驗(8183): 2 現學字 + 3 舊字 → 現學佔 **74%**、舊 26%;無 console error。可調。
- 待(接著做,大坨): ② 王加「**句子默寫**」變綜合考(目前只加權單字)④⑤ **phase-aware buildLevel + 彈性階段**(前半引新字、後半零新字只練寫+句子 → 字練到會寫才上王;王關改內容驅動觸發,非固定 5×stage)⑥ 補 emoji 圖(抽象字沒圖就不出圖題)。

### 本輪(Claude): 補考改「同題型再考」+ 王加句子默寫(綜合考 step 2)
- **補考 bug**(使用者重測抓準): `reviewThenAsk` 重答是重跑 `ask(w)` 重挑題型,但答錯後 mastery 已掉 → 挑到更簡單的認題,**不是你錯的默寫**。修: `onWrong` 連 `lastAsked[k]`(剛剛的題型)一起進 reviewQueue(改存 `{w, run}`);`reviewThenAsk(w, run)` 重答時 `run(w)`(同題型)+ `currentRung=1`。驗(8183): 默寫錯 mastery 70→50,補考仍出 askType(「🔊 聽,把它拼出來」),非認題。
- **句子默寫王**(學過句子才有): `bossSentenceQuestion`(看中文默寫整句;`pickBuildSentence` 湊不出句 → null → 自動退回單字)。`bossTurn` 有 `BOSS_SENTENCE_PROB=0.3` 機率出(mode zh);傷害 `BOSS_DMG.sentence=0.2`(總血 20%);`bossWrongIds` 逐字歸因照用。驗(8183): 產題 ids 對齊、沒句子時 gating 回 null、渲染「限時默寫整句」、答對 −20;無 console error。可調。
- 待: ④⑤ phase-aware buildLevel + 彈性階段(治「字沒練到寫就上王」)、⑥ 補 emoji 圖。

### 本輪(Claude): 新題型「音節克漏字(打字版)」+ 逐節錯誤追蹤 + 記憶法提示
- 使用者構想: 長字(experience/beautiful)別逼一次拼全 → 拆音節、遮 1~3 節讓你「打」缺的;記哪節常錯、之後針對性多遮;最難的節上記憶法輔助(台灣向、可諧音/圖像,如 ence 念法、呆腦獸精神)。
- 做: `askSylType(w)` —— 顯示音節、遮 1~2 節為 `<input>`(size=音節長度給長度提示)、打缺的。逐節對錯記 `store[w.id].sylMiss[i]++`;遮哪節「加權偏向常錯的」(`wt = 1 + miss×2`)→ 弱點自動多練;答錯時該節有 `SYL_HINT[syl]` 就上記憶法。掛 FORMATS `syltype`(lv4/write)+ `.sylinp` CSS + `SYL_HINT` map(玩法層,先放 ence/ful/ti/ri)。補考同題型相容(`lastAsked`→重跑 askSylType)。
- 驗(8183): experience 渲染 2 input+2 給定;全對→✅綠、全錯→紅+`sylMiss` 逐節+1;ence 設常錯 → 95% 遮 ence;遮 ence 答錯 → 上「💡 ence:…」;無 console error。可擴 `SYL_HINT`/調權重。
- 待(適應性下一層,使用者構想): 連錯某節 N 次 → 退回該字一輪「聽·看·選」;擴 `SYL_HINT`(AI 生使用者審)。

### 本輪(Claude): phase-aware 彈性階段 + 內容驅動王觸發(主線)
- 治使用者 15 關痛點「字只練到看/念就被王要求拼」+「5 關太短」。
- 發現: `buildLevel` 的「引完新字 → 進鞏固」本來就自動發生(fresh 來自 `batchOf<stage`,當前批引完就空)→ 真正的洞是王在固定第 5×stage 關插進來、不等鞏固。
- 改: ① `buildLevel` 補洞 —— 鞏固期(`picked<4`,沒新字也沒到期)補學會的實詞回鍋,別出空關 + 讓句子題有字可組。② `stageReady()`: 當前批(`batchOf===stage-1`)字都教過 + mastery ≥ `BOSS_READY_MASTERY(67=進寫階)`。③ `showDone` 王觸發改 `stageReady()`(取代 `level===5×stage`)、**非強制**:會寫了同時給「⚔ 挑戰王」+「再練一關」,關卡照常往下解。④ 地圖快捷拿掉固定「第N王」標記 → `bossReady` 才出一顆「⚔ 挑戰王」鈕。
- 驗(8183): stageReady 一字低/fresh→false、全≥67→true;鞏固期 buildLevel size 10(不空);showDone ready→#boss+「再練一關」、not ready→「下一關」;mapjump ready→#jumpboss、無固定標記;無 console error。可調 `BOSS_READY_MASTERY`。
- ⚠ 吃現有存檔(無狀態),但跨舊結構存檔建議 🔄 乾淨跑才看得到完整弧。待: 適應性(音節連錯退聽看選)、補 emoji 圖。

### 本輪(Claude): 答題頁版面放大(治「太小氣」)
- 使用者貼 Duolingo 對比: 答題頁 `.card` 只 440px、首頁 `.wrap` 卻 1040px → 一進題目就變小氣。
- 改 CSS: `.card`(#screen) 440 → `min(680px,94vw)`、加 `min-height min(86vh,720px)` + `padding 26/30` + `flex column` + `justify-content:center`(非 shell 畫面內容垂直置中、不擠頂);`#screen #body` `flex:1` + `max-width:480` 置中(內容欄不拉爆、垂直填中段);`.why` 整條寬沉底(像 Duo 結算列)。`prompt` 15→18、`h2` 22→26。
- 驗(8183, 1280×820, 靠 eval 量尺寸—截圖逾時): card 440×459 → **680×705**;body 480 置中;shell 題 bar 在頂(27)、非 shell(showStart)內容上下留白 278/244 ≈ 垂直置中;why 寬 618 沉底;無 console error。可再調寬/高。

### 本輪(Claude): 答題頁再改「滿版、拿掉卡框」(Duo 式)
- 使用者: 放大後還是「鎖在卡裡、周圍空空」→ 要整個滿版。
- 改 CSS: `.card`(#screen) 拿掉背景/邊框/陰影/圓角 → 滿版(`width:100%`、`min-height:calc(100vh-32px)`、`justify-content:safe center`);`#screen > *` 全部收進置中欄 `max-width:560`(進度條/題目/王戰都對齊);`#screen #body` `flex:1` 垂直填中段;`.why` 改**滿版底部固定列**(`position:fixed;bottom:0`,左右 padding 把內容置中 560)。`safe center` 讓高內容(過關/設定)能往上對齊可捲、不被裁。
- 驗(8183,1280×820): #screen 1248 滿版、進度條在頂(22)、內容欄 560、結算列 1280 滿版釘底(fixed/bottom_gap 0)、王戰血條 560(沒拉爆);無 console error。
- 註: 結算列目前「內容置中、繼續鈕 560 寬」,還不是 Duo 的「左訊息+右大鈕」(那要動每題 `.why` 結構),要的話再做。

### 本輪(Claude): 答題頁元素放大 + 內容上移(接滿版)
- 使用者: 滿版了但元素還原本大小、擠中間一坨,空。給自由重排。
- 改 CSS: 內容欄 560→**720**;元素放大(`.inp` 75px高/25px字、`.btn` 65px、`.replay` 語音鈕 129×99/40px、`.opt` 22px、`.bigzh` 40px、`.prompt` 22px 粗);`#screen #body` 改 `justify-content:flex-start` + `padding-top:clamp(12,8vh,80)` → 內容放**上半部**(語音鈕從 ~50% 提到 **26%**),下半留白 + 底部結算列(Duo 式上重下空)。`.why` 內容置中也跟著改 720。
- 驗(8183,1280×820): 欄 720、inp 75/btn 65/replay 129×99、prompt 11%/audio 26%;無 console error。可再調大小/位置。

### 本輪(Claude): 固定 UI 區塊 —— 主要動作鈕釘死底部(治「按鈕飄來飄去」)
- 使用者 UX 批評(中肯,點名 AI 通病): 每樣東西都在內容流裡自己亂跑,按鈕跟著題目長短飄,沒有固定的 UI 點 → 每題按鈕/題目飄來飄去。
- 改: `#submit`/`#check`/`#mic`(送出/確定/說)CSS 釘成 `position:fixed; bottom:22px` 置中 720 → **每題同一位置**;`#body` 加 `padding-bottom:120px` 預留;`finish()` 答完 `#submit` `display:none` → 換結算列(也在底部),不重疊。
- 驗(8183): 送出鈕 fixed/bottom 22/置中;askType 與 askSylType 送出鈕**同位置**;答錯 → 送出收掉 + 結算列出;無 console error。
- 待: 其餘區塊(提示/內容/選項)再規範成固定帶;結算列做成 Duo「左訊息+右大鈕」。

### 本輪(Claude): 統一所有動作鈕到「同一個固定底部點」
- 使用者: 教卡「我記住了」跟「送出」位置不一樣;要分區共用(舞台/輸入/動作各有固定區,不要每題各做各的)。
- 改: 所有主要動作鈕(送出/確定/記住了/換我排/說/繼續/再排/再試一次)統一加 `.act` class → `position:fixed; bottom:22px; 置中 720` 一個固定點;結算 `.why` 從「固定底部列」改回「內容區訊息」(訊息在內容、鈕在底部固定點);`#body` 改 `safe center`(輸入落中間)+ `padding-bottom:140` 預留;`finish` 答完收 `#submit`(換 `#cont`,同位置)。
- 驗(8183): 記住了/送出/再試一次 全 `fixed`/`bottom 22`/`cx 640`(all_same);答錯 → 送出收掉、繼續鈕同位置 22、訊息回內容;無 console error。
- 待(完整分區,下一步): 固定高度「舞台帶」+ 固定「輸入帶」(輸入永遠同位置、不隨舞台內容高度跳)→ 要把每題拆成 stage/answer 兩個共用容器(較大)。

### 本輪(Claude): 修 `.replay` 設太大撐爆版面(我上一輪的回歸)
- 使用者: 「再聽整句」超大、句子結算框被撐爆、跟釘底的繼續重疊衝出螢幕。
- 根因: 上一輪放大時把 `.replay` 設 40px,但這 class 也用在「念/慢念/再聽整句/慢速」等文字鈕 → 全變超大、結算框過高 → 跟固定的 `.act` 繼續鈕重疊溢出。
- 修: `.replay` 改 `display:inline-block` + `font-size:19px`(適中、緊湊、各發音鈕一致);只把主播放鈕 `#replay`(聽力題那顆 🔊,純圖示)設 `display:block; 30px` 大一點。
- 驗(8183): 再聽整句 19px;句子結算 why 底 664 < 繼續頂 733(不重疊)、不溢出螢幕(-156);無 console error。

### 本輪(Claude): 功能詞不出教卡 —— 自動 taught、只在句子學
- 使用者: 「am」的教卡多餘(說明自己都寫「只跟 I 搭配」)→ 膠水沒單獨意義,該直接在句子裡學,不該有「先認識 am」這張卡。
- 改 `buildLevel`: ① `fresh` 加 `w.pos !== 'function'`(功能詞不進新字 → 不出「先認識這個字」教卡)② 批次解鎖(`batchOf<stage`)的功能詞**靜默標 `taught`**(讓句子組得出),意義交給句子 + `teachPattern`。
- 驗(8183): stage2 → 膠水自動 taught(`glue_taught_after:true`)、`levelWords` 無功能詞、句子組得出(`can_build:true`);無 console error。reload race 提醒: 改 buildLevel 後務必確認 `buildLevel.toString()` 已是新碼再測。

### 本輪(Codex): 文件/架構對照 + 修 `pat_i_read_noun` requires 斷點
- 讀完全部 MD 後對照 `index.html`:整體符合「單檔主體、瘦 `BANK`、`PATTERNS` + `requires`、`FORMATS` 玩法層、SRS 引擎分離」。
- schema 檢查抓到唯一資料斷點:`pat_i_read_noun` 的 `requires:["word_i","word_read"]`,但 `BANK` 沒有 `word_read` → 該句型永遠解鎖不了。
- 修:新增 `word_read`(verb, zh=讀, syl=["read"], why 必填)到 `BANK` 尾端,避免插入中段造成既有 `_rest` 自動分批整體位移。`HANDOFF.md` 字數同步 38→39。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個;所有 pattern requires 都能對到既有 word id;無 schema issues。

### 本輪(Codex): 說題 UI 改成寬版舞台 + Duo 式底部操作列
- 使用者指出說題畫面醜、空間浪費,且「沒麥克風 / 不想出聲?跳過說題」太小幾乎看不到。
- 改 CSS:題目舞台加寬到 960/760 欄、prompt/單字/音節/發音鈕放大;`#screen::after` 畫出底部固定 action bar。
- `.act` 改成右下高對比綠色主按鈕;新增 `.sideact` 左下次要按鈕。說題的跳過改成左下「跳過說題」大按鈕,不再是小字連結;點後在舞台中顯示「只跳這題 / 以後都跳過說題」兩個清楚選項。
- 同步修說題結算時的控制項收合邏輯,避免新的跳過按鈕 wrapper 被錯誤隱藏。
- 驗(Node/browser):`index.html` script syntax ok;pattern requires schema ok;桌面 1280×720 說題 prompt 44px、單字列 46px、主麥克風 300×70、跳過 220×70、無水平溢出;手機 390×844 主/次按鈕上下排列 354×70、無水平溢出。

### 本輪(Codex): 固定題目帶 / 作答帶
- 接續 UI 調整:把 `shell()` 共用外殼改成 `.lesson` 骨架,上方 `.lesson-stage` 放題目(`#prompt`),下方 `.lesson-answer` 放作答內容(`#body`)。目標是每種題型都吃同一套「題目區 / 作答區 / 底部操作列」,不要靠各題型自己亂塞 margin。
- CSS 新增 `.lesson`, `.lesson-stage`, `.lesson-answer`;答案帶固定 `max-width:760px`、`min-height:clamp(280px,42vh,420px)` 並置中內容。手機版改為按鈕上下排列、答案帶至少 330px。
- 底部 action bar 改成只在 `screen.classList.contains('lesson-screen')` 時出現;`shell()` 會加 `lesson-screen`,非題目頁(`showStart`/`showDone`/Boss/設定/音樂)會移除,避免過關頁或設定頁被底部欄蓋住。
- 驗(Node):`index.html` script syntax ok;靜態檢查可看到 `.lesson-stage`/`.lesson-answer`/`.lesson-screen` 都已接上。瀏覽器控制層這輪連不到 shell 起的 localhost(工具隔離),未做完整截圖驗。

### 本輪(Codex): 修教卡被底部操作列切掉
- 使用者截圖回報:教卡的「念 / 慢念」被底部 action bar 切掉;關卡內應一頁完整顯示,不需要往下滾。
- 修 CSS:`#screen.lesson-screen` 改固定 `height:100vh; overflow:hidden`;`.lesson` 改成真正吃剩餘空間(`grid-template-rows:auto minmax(0,1fr)`,縮小 gap/padding),`.lesson-answer` 移除硬 `min-height` 並限制 overflow,讓內容留在底部操作列上方。
- 修教卡:單音節字不再重複顯示音節列與「音節分隔」提示;例如 `book` 只顯示一次 `book`,多音節字才顯示 `hap·py` 這類音節分塊。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。

### 本輪(Codex): 教卡改專用版面 + 答題回饋不再擠動畫面
- 使用者連續截圖回報:教卡 `why` 仍被底部欄吃掉;選擇題答完後 `#why` 進入 flex flow,把題目/選項整個擠走;「再聽」區塊也太浪費空間。
- 修教卡:新增 `.teach-layout` / `.teach-answer` / `.teach-tools` / `.teach-why`;標題置中,字與音節在中間,「念 / 慢念」移到側邊(手機改橫排),`why` 成為教卡版面的一部分,不再用直排硬塞。
- 修答題回饋:`#screen.lesson-screen > .why` 改成固定 feedback tray,釘在底部 action bar 上方,不進 lesson flex flow;`finish()` 不再把 `#prompt` 改成大型「答對了 / 沒關係」,保持題目和選項位置穩定。
- 精簡回饋內容:新增 `.result-head` / `.result-mark` / `.result-copy`;單字、中文、短說明、再聽按鈕同列呈現,取代原本大字 + 置中再聽的大綠框。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。瀏覽器測試改由使用者實測較快;本輪未做完整截圖驗收。

### 本輪(Codex): 底部回饋列正式吃掉 action bar
- 使用者截圖回報:「繼續」仍疊到 `cat = 貓` 回饋框上;底部整條操作區只放一顆繼續也太浪費。
- 修 CSS:`#screen.lesson-screen > .why` 改成 full-width bottom bar,直接佔用 `--action-bar-h`;左側放 `.result-head`(狀態、單字中文、短說明、再聽),右側放繼續。
- 修 `.why .act`:在回饋列中覆蓋成 `position:static`,不再用全域 fixed 定位,避免繼續鈕浮到回饋框上方。手機版回饋列改上下排列,繼續鈕吃滿寬。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。

### 本輪(Codex): 教卡三段式高度分配
- 使用者截圖回報:「先認識這個字」畫面仍然全部擠在上方,下半部空很大。
- 修 CSS:新增 `.lesson.teach-lesson`;`.lesson-answer.teach-answer` 改 stretch;`.teach-layout` 改 `height:100%` 並用 `grid-template-rows:minmax(0,1fr) auto`,讓字/按鈕在上半作答區置中,`.teach-why` 貼近 action bar 上方。
- 修 JS:`teach()` 與 `reviewThenAsk()` 都替 `.lesson` 加 `.teach-lesson`,讓這套高度分配只套教卡/回顧卡,不影響其他題型。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。

### 本輪(Codex): 選擇題不切底 + 配對完成不顯示單字 why
- 使用者截圖回報:配對題完成後顯示 `happy = 開心` 的說明很怪;看中選英四個選項被底部 action bar 切掉。
- 修 CSS:新增 `.choice-answer` 緊湊四選一版面,壓縮 `.bigzh`、`.opts` gap、`.opt` 高度/內距,讓四個選項保留在 action bar 上方。新增 `.match-answer` / `.match-grid`,配對題用自己的兩欄高度規則。
- 修 JS:四選一類題型(`askListenPick`/`askReadPick`/`askListenWord`/`askPicture`)加 `.choice-answer`;`askMatch` 加 `.match-answer`。
- 修回饋:新增 `finishGroupSuccess(title, copy, onContinue)`;配對全對時改顯示「配對完成」與組數,不再呼叫 `finish(true, w)` 顯示某個單字的 why。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。

### 本輪(Codex): Boss 版面三段式分配 + 避免連續同答案
- 使用者截圖回報:王戰/王結算內容幾乎都擠在上方,畫面下半大空白;另外王戰會連續出同樣答案。
- 修 CSS:新增/接上 `.boss-screen`、`.boss-layout`、`.boss-status`、`.boss-arena`、`.boss-answer`、`.boss-result`;Boss 題目頁拆成狀態/題目舞台/作答區三段,結算頁用 `.boss-result` 置中,不再靠自然流塞在上方。
- 修 JS:`startBoss` 初始化 `lastAnswerKey`;新增 `bossAnswerKey`;`bossPickWords` 可吃指定候選池;`bossQuestion` 單字題會排除上一題答案,句子題與臨死連段用 avoid set 重抽;`renderBossQ` 輸出 `.boss-layout`;`bossEnd` 輸出 `.boss-result`;`shell`/`showHome`/設定/音樂頁會清掉 `.boss-screen`。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點;Boss 單字題 no-repeat 連跑 50 題不連續同答案。

### 本輪(Codex): 教卡說明卡放大 + 修 hidden 被 display 覆蓋
- 使用者截圖回報:教卡說明卡太小;打完王回首頁後,獎盃/回首頁結果區會殘留在首頁下方佔版面。
- 修 CSS:新增全域 `[hidden] { display:none !important; }`,避免 `.card { display:flex }` 蓋掉 hidden 狀態。這也修掉 Boss 結果頁回首頁後仍佔位的問題。
- 修教卡:`.teach-why` 改成大說明卡,增加 min-height、padding、font-size、line-height,並用 flex 垂直置中;手機與低高度桌面各有較緊湊尺寸。
- 修 JS:`showHome()` 會清空 `screen.innerHTML`,避免任何舊結果頁 DOM 留在首頁後面。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。

### 本輪(Codex): Lesson 標題統一置中 + 短回饋 compact
- 使用者截圖回報:只有某一張教卡標題置中,其他題型標題仍偏左;音節打字成功時底部綠色列只有短句卻硬拆成兩行,視覺歪掉。
- 修 CSS:`.lesson-stage` 統一置中,`.lesson-stage .prompt` 統一 `text-align:center`,讓所有 `shell()` 題型標題同規則處理,不是逐題補 `.center`。
- 修 CSS:新增 `.result-head.compact` 與 lesson feedback 覆蓋規則,短回饋會把 icon + title + copy 當成一組置中,不再硬走兩行說明版。
- 修 JS:`askSylType` 成功/失敗回饋改成 `result-head` 結構,成功用 compact 單行;`finishGroupSuccess` 改用 compact;`askBuildSentence` 的成功/失敗回饋也改成統一 result bar,不再改大標題造成畫面漂移。
- 驗(Node):`index.html` script syntax ok;`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點。

### 本輪(Codex): JS 拆檔第一步 —— 從單檔 index 拆成責任區塊
- 使用者指出單檔過肥導致「改一壞一」;決定先做架構整理,為未來大量擴字、Boss、關卡、UI、題型擴充鋪路。
- 機械拆分:保留原執行順序,把原本 inline script 拆成 `js/00-content.js` 到 `js/11-main.js`;`index.html` 目前保留 HTML/CSS 與 script 載入順序。
- 新檔責任:內容資料、引擎、runtime/audio、UI shell/feedback、speech matching、基礎題型、句型題、寫作/音節題、lesson flow、Boss、首頁設定、啟動入口。
- 這輪不改 SRS / mastery / save / buildLevel / reward / startLevel / onCorrect / onWrong / nextQuestion 的行為,只搬移位置。
- 驗(Node):合併 JS 語法 OK(12 files);`BANK` 39 字、`PATTERNS` 5 個、requires 無斷點;逐檔順序載入 OK(11 files);完整啟動 `showHome()` 假 DOM 測試 OK(12 files)。

### 本輪(Codex): CSS 拆檔 —— index 只留 HTML shell
- 拆分:`index.html` 移除 inline `<style>`,改依序載入 `css/00-foundation.css` 到 `css/07-responsive.css`。
- 新檔責任:foundation / lesson shell / shared components / question modes / boss / teach-build / home-map / responsive。
- 更新:`HANDOFF.md` 的「一句話、檔案結構、UI 待辦」改成當前狀態,不是在交接檔尾端重複堆疊。
- 驗(Node):8 個 CSS 檔 link 順序正確、每檔大括號平衡;12 個 JS 檔 script 順序正確且可合併解析。

### 本輪(Codex): Boss 句子題改排列,爆發可混句子
- 使用者實測第二支王:臨死反撲兩輪都只抽單字;一般句子題又直接要求整句默寫,但前面沒有對應「整句默寫」練習,學習落差太大。
- 修 Boss 句子策略:`bossSentenceQuestion()` 只抽 `patMastery(patternId) > 0` 的已練句型,避免王突然考沒練過的句型。
- 修 Boss 句子題型:句子題目前一律用 `arrange` 排詞造句,不再用 input 整句默寫。整句默寫之後要等課程先加入句子克漏字/整句默寫練習後再開。
- 修臨死反撲:`bossCombo()` 從第 2 支王起,若有已練句型,第一段優先出句子排列;後續段落也有機率混入句子,否則退回多單字。
- 驗(Node):`node --check js/09-boss.js` OK。

### 本輪(Codex): 二王後新增句子克漏字
- 使用者要求「開始補」二王後的一般關卡句子新題型,不要讓王先考前面沒練過的整句默寫。
- 新增 `askSentenceCloze(w)`:看中文句子 + 英文句子空一格,只打空格裡的字。這是排句子之後、整句默寫之前的中間階。
- 接入 `FORMATS`:新增 `sentence_cloze`,只在 `meta.stage >= 3` 且該字能套入已練過句型(`patMastery > 0`)時出現,技能算 `write`,答對可標記該字 `wrote`。
- 新增形容詞句型 `pat_this_is_adj`: `This is {x}.` / `這很{x}。`;新增 `descriptive` flag,目前給 `beautiful/big/small/good/bad`,不給 `happy` 以避免 `This is happy.`。
- 更新 `CONTENT_RULES.md`:補 `descriptive` flag 與 `This is {x}.` 規則。
- 驗(Node):語法檢查 `00-content/03-ui-shell-feedback/06-modes-sentence/08-lesson-flow` OK;假存檔模擬 stage3,`beautiful/project/home/house` 可進句子克漏字,`experience` 不硬湊。

### 本輪(Codex): 句子克漏字改多洞 + experience 接自然句
- 使用者實測第三階段沒遇到 `beautiful/experience` 克漏字,且指出克漏字不應只漏一個單字,句子的其他骨架也要練。
- 修 `experience`:加 `ownable` flag,可自然套 `This is my experience.` / `這是我的經驗。`
- 修 `sentenceClozeForWord`:不再只挖目標單字,改成至少挖「目標單字 + 一個句子骨架詞」(例如 `This/is/my/a/I/am`)。玩家要補多個洞,更像句子練習。
- 修形容詞中文:新增 `wordZhForSlot()`,`descriptive` 形容詞放進 `This is {x}.` 時會去掉尾巴「的」,避免 `這很美麗的`,改顯示 `這很美麗。`
- 驗(Node):`00-content/03-ui-shell-feedback/06-modes-sentence` 語法 OK;假存檔 stage3 檢查 `beautiful → This is beautiful.`、`experience → This is my experience.` 都能產生多洞克漏字。

### 本輪(Codex): 選詞克漏字版面與誘答修正
- 使用者截圖回報:選詞克漏字標題/中文疊在一起,第四個選項又被底部 action bar 切到;且 `This is ___` 會混進 `happy` 這種不自然選項。
- 修 `askClozePick`:加入 `choice-answer` / `cloze-choice-answer` 版面 class,讓它吃到 2x2 選項與緊湊排版。
- 修誘答池:選詞克漏字不再用一般 `fourOptions()`,改成同一個句型 slot 的候選字優先。例如 `This is ___` 只會出 `descriptive` 形容詞,不再出 `happy`。
- 修中文顯示:選詞克漏字也改用 `wordZhForSlot()`,避免 `這很大的。`
- 修 CSS:新增 `.cloze-pick-screen` / `.cloze-choice-answer` / `.cloze-choice-line`,縮標題、拉開文字間距、降低選項高度,避免底部切字。
- 驗(Node):`js/05-modes-basic.js` 語法 OK;假資料檢查 `pat_this_is_adj` 候選為 `beautiful,big,small`,不含 `happy`。

### 本輪(Codex): 多洞句子克漏字輸入框依字長伸縮
- 使用者截圖回報:`experience` 太長,填空框固定寬導致顯示成 `experien` 被裁掉。
- 修 `sentenceClozeForWord`:每個 `.clozeinp` 依答案長度加 `--chars:N`。
- 修 CSS:`.sentence-cloze-line .clozeinp` 用 `clamp(... calc(var(--chars) * 1ch + 42px) ...)` 算寬,短字不會太窄、長字會自動展開。
- 驗(Node):`js/06-modes-sentence.js` 語法 OK;假資料 `experience` 產生 `style="--chars:10"`。

### 本輪(Codex): 多洞句子克漏字答錯不再把紅框改成正解
- 使用者截圖回報:看起來填了 `experience`,但系統判錯;原因是答錯時程式會把錯格 value 改成正解再標紅,造成「紅框裡是正解」的誤導。
- 修 `askSentenceCloze`:錯格保留玩家原本輸入,正解只顯示在下方 `正解: ...`。
- 順手加輸入 normalize:用 `NFKC + trim + lowercase` 比對,處理大小寫與全形/半形差異,但不放寬真正拼錯。
- 驗(Node):`js/06-modes-sentence.js` 語法 OK。

### 本輪(Claude Opus): 看圖題視覺去重 + 動詞句進句子系統
- 使用者實測後期回報兩個問題:① 看圖題出眼睛圖卻 look/see 都在選項;② 學到的動詞(do/look/see…)從來沒有進過句子,後期沒有新的句子應用。
- 修看圖歧義:同視覺守衛原本比 emoji 字串,👀(look)≠👁️(see) 抓不到。加 `VISUAL_ALIAS`(👁️→👀)+ `visualKey()`,守衛改比視覺概念。look 的 confuse 夥伴 see 一定在選項 → look/see 不再出看圖題;cat/house/book 等不受影響(驗 40/40 照常出圖)。
- 診斷句子系統:PATTERNS 只有 6 個,動詞只能當 `requires` 固定詞、永遠進不了 slot;排句主流程只吃 4 個名詞/形容詞句型;`I drink/I read` 句型是孤兒(沒掛進排句、也觸發不了克漏字)→ 動詞零句子覆蓋。
- 加動詞句(用現有字):新增 `pat_i_see_a_noun`(I see a {visible})、`pat_i_buy_a_noun`(I buy a {buyable}),修 `pat_i_read_noun` 補回漏的 a(I read a {x}),把 see/buy/read/drink 四個動詞句掛進 `BUILD_SENTENCE_PATTERN_IDS`。
- 新增 flag `visible`(cat/book/friend/house)、`buyable`(cat/book/house),避免出 "I buy a friend / I see a project" 這種怪句;更新 CONTENT_RULES。
- 排對動詞句 → `creditSentence` 連帶幫動詞加熟練度(動詞靠句子自然學會)。
- 驗(瀏覽器):4 句全進排句流程、受詞池正確(see 無 project、buy 無 friend/project)、creditSentence 給 see/buy/cat 各 +25;`node --check` 三個改檔語法 OK。

### 本輪(Claude Opus): 招牌轉換題 this is ↔ is this
- 使用者點出:招牌口號「重排同一批字自己懂(this is ↔ is this)」其實從沒做出來——整個專案沒有任何疑問句句型、沒有轉換邏輯,排句題永遠只出直述句。
- 確認句子系統是「模板填空、非寫死」(`PATTERNS` + `buildSentenceFromPattern` 從學過的字填 slot),缺的是內容/題型不是引擎。
- 抽共用拖曳引擎 `mountArrange`(js/06):cards + 正解 token 順序 → slots/bank + 拖曳/點擊 + 判對錯回 callback;`sentence_build` 改用它(零行為改變,重構後驗過排對→過、繼續→done),拖曳邏輯不再重寫。
- 句型加 `q`/`qzh` 問句模板欄位;`buildSentenceFromPattern` 用同一批選字順便回傳 `question`/`questionZh`。給 `pat_this_is_a_noun`/`pat_this_is_my_noun`/`pat_this_is_adj` 三句加問句形。
- 新題型 `askTransform`(`sentence_transform`):上面顯示練過的直述句(This is a cat. / 這是一隻貓),下面把「同一批卡片」重排成問句(Is this a cat?),排對給 aha 說明「把 is 移到最前面就變問句」。`caseInsensitive` 比對(This↔this 只大小寫、重點在順序)。
- 掛進 FORMATS(lv3/read/tier3),`canTransform` 守(直述句 `patMastery>0` 才出 → 先會直述再轉問句);出題權重 stage≥2 = 20。只用 be 動詞 This is 家族(I see a cat 變問句要 do,不純重排 → 不放)。
- 更新 CONTENT_RULES(q/qzh 欄位)、HANDOFF(題型 + mountArrange + 句子系統說明)。
- 驗(瀏覽器):問句形正確(含形容詞去「的」)、patMastery gate 對、模擬點擊排問句序→判對+出 aha、排錯→紅框+重排歸位、排句題 regression 過;`node --check` 四檔 OK;零 console error。

### 本輪(Claude Opus): 轉換題加 I am → Am I
- 接續轉換題:把 I am 家族也納入(使用者要求)。注意自然問句「Are you happy?」換了字(am→are、I→you)不是純重排、不符機制 → 加的是純重排的 Am I happy?(把 am 提到句首,跟 This is → Is this 同一條規則)。
- pat_i_am_adj 加 q:"Am I {x}?" / qzh:"我{x}嗎?";掛進 TRANSFORM_PATTERN_IDS。
- askTransform 的 aha 文案改動態抓 be 動詞(stmt[1]):This is 顯示「把 is 移到最前面」、I am 顯示「把 am 移到最前面」。
- 更新 CONTENT_RULES(be 動詞句才加 q;不要寫 Are you 這種非純重排)。
- 驗(瀏覽器):I am happy → Am I happy?(我開心嗎?)、模擬重排 am/I/happy 判對、文案顯示 am;This is 仍顯示 is;node --check OK;零 console error。

### 本輪(Claude Opus): 前期縮短 + 學會的字改用句子複習
- 使用者實測:前期 1~6 關太長、太多重複純單字題很無聊;且主軸已轉句子,後期不該一直出已學會單字的單獨練習,複習要把舊字塞進句子。
- 第一階段王門檻 BOSS_READY_MIN_LEVELS 6 → 5。
- ask() 加複習路由(出題層,不動引擎 buildLevel):isLearned(w) && wrote 的字不再單獨刷,改抽「含該字的句子」(sentenceWithWord)複習,creditSentence 推 SRS;orphan 動詞(還沒句型:make/do/look/listen/hear/speak/say/eat/go/come/bring/take/get)退一般句子;完全組不出句子(stage1 功能詞未解鎖)才退單字。
- 還沒學會 / 還沒默寫過的字照常走單字題(要靠單字學起來 + 補默寫門檻);功能詞不受影響(本來就不進關卡)。
- 新增 sentenceWithWord(w)(js/06):組保證含 w 的句子(w 當 slot 或當 requires 動詞)。buildSentenceFromPattern 加 mustInclude 參數強制把字塞進 slot。askBuildSentence 加 forced 參數吃指定句子。
- 驗(瀏覽器):cat(學會+默寫)16/16 走句子且每句含 cat;make(orphan)16/16 走句子;friend(還在學)16/16 單字;cat(沒默寫)16/16 單字;stage1 組不出句子→退單字不當機;BOSS_READY_MIN_LEVELS=5;node --check 四檔 OK;零 console error。
- ⚠ 殘留:orphan 動詞目前靠「一般句子(不含該字)」複習=軟複習。要讓它們真的進句子,得補動詞句型(之前 deferred 的擴字/擴句)。

### 本輪(Claude Opus): 補考改「先考、複習當可選」
- 使用者:補考前強制看完整重看卡太煩;有人只是手滑打錯(water→wster),應該直接讓他重答,想複習才複習。
- reviewThenAsk 反過來:先直接補考(同題型),畫面下方加一顆可選「📖 我要複習」鈕(injectReviewButton);點了才出重看卡 showReviewCard(字+音節+念+字根),看完按「回去答題」回補考。重看卡本身不再有複習鈕(避免循環)。
- CSS:.lesson-stage 由橫排改直排(對單一 prompt 視覺不變),讓「我要複習」鈕乾淨落在題目下方;新增 .reviewlink 樣式(細框 pill,非固定操作列)。
- 驗(瀏覽器,DOM 狀態):補考直接出題型(非重看卡)+ 我要複習鈕在;點鈕→重看卡(cat+音節+字根+回去答題)、複習鈕消失;回去→補考+鈕回來;答對→消題到過關;node --check OK;零 console error。
- ⚠ 版面幾何/截圖:此環境 preview 視窗回報 0×0 且截圖逾時,無法量按鈕座標——版面靠 CSS 直排堆疊判斷(低風險),請玩家在 8182 目視。

### 本輪(Claude Opus): 防句子重複(一關連出三次 I am happy)
- 使用者截圖:一關 4 題出現 3 次「I am happy → Am I happy?」。根因:句子隨機抽、沒擋最近出過的;且 I am 家族只有 happy 一個字,抽到 I-am 永遠是同一句。
- 加防重複:recentSentences(記最近 3 句)+ pickFresh(優先沒最近出過的,真沒得選才回退)。pickBuildSentence / pickTransformSentence / sentenceWithWord 都套;askBuildSentence / askTransform 實際出句時 rememberSentence。
- 驗(瀏覽器):連抽 10 轉換句 + 12 排句,最多連續 1 次、任意 3 句窗內無重複、各 9~10 種不同;I am happy 兩次出現間隔 ≥7;render 正常、零 console error。
- 註:真正多樣性還是要靠擴句型/擴字(I am 只有 happy);這版先把「短時間內重複」擋掉。
