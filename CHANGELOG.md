# 更新日誌

這份檔案給使用者、GPT、Codex 交接用。重點記「實際改了什麼、為什麼改、下一步要注意什麼」。

## 2026-06-30

### 本輪調整(Codex):工作英文改成獨立地圖
- 使用者覺得工作英文值得做成另一個大地圖,同樣有階段/關卡感,但內容與主線分開。
- `startWorkPractice()` 改為進入 `showWorkMap()`,側欄「💼 工作英文」不再直接開單一練習。
- 新增工作英文地圖節點:目前 3 關「不懂就問」「回報狀態」「請求協作」,完成當前關後解鎖下一關。
- 進度存到 `meta.workMaxLevel`,不影響主線地圖、挑戰關或單字熟練度。
- 工作關卡內按叉叉改回工作地圖;完成頁新增「回工作地圖」,讓工作英文像一條獨立課程線。
- 使用者回報工作英文還是太高壓:一次學 4 句再抽考像短期記憶測驗。`buildWorkQueue()` 改成「一句一句教 → 句塊確認 → 讀懂/聽懂 → 再下一句」。
- 工作英文選項池改成只混入目前已教過的句子,不再用還沒看過的句子當選項。
- 使用者進一步定位:工作英文不是附屬小工具,應該是成人真正想學、可幫助自己的主線分支。工作分支從 3 關擴到 13 關、52 句。
- 新增職場主題:安排時間、會議參與、確認需求、進度回報、問題排查、客氣請求、邊界與拒絕、道歉修正、客戶溝通、遠端會議。
- 主畫面入口文案改成「成人工作主線」;重置進度時同步清 `meta.workMaxLevel`。
- 使用者修正設計意圖:不是要工作英文跳到另一個全頁地圖,而是要跟主線共用同一個首頁。`startWorkPractice()` 現改為重新渲染首頁並把右側 `.map` 換成工作分支內容。
- 工作題目按 X、完成頁「回工作地圖」都回到共用首頁框架,並自動選中左側「工作英文」分類。
- 再修正一次「共用頁面」的理解:右側不該塞工作英文標題與列表卡片,而要沿用主線地圖的圓形節點路線。工作分支現在改用 `workMapSVG()` 生成同樣的地圖路線視覺。
- 左側「練習單字」改名「日常單字練習」;點擊只切回日常地圖,不再直接進入目前關。
- 日常/工作分支切換移到右側地圖上方 `mapjump` 區,兩條主線都提供「📚 日常 / 💼 工作」切換鈕。
- UI 收斂:日常/工作分支鈕放大並獨立一行,「目前第幾關」移到第二行,不再跟分支鈕擠在同一排。
- 左側側欄移除重複的日常/工作入口,保留挑戰關、單字特訓、衍生等非主線工具入口。
- BGM 移除 Web Audio 合成背景樂 fallback;音檔不存在就安靜,不再自動改播合成音。首頁也不再因 `meta.bgm` 自動恢復播放。
- 修工作地圖第一關點擊:工作 SVG 節點從單一 circle 改成 `<g class="workmapnode">` 並加透明大圓 hit area,點數字或圓點周圍都能進關。
- 「不懂就問」狀態鈕改成不可點的描述 pill,避免它看起來像另一個進關按鈕;目前關仍由「目前 · 第 X 關」按鈕負責。
- 修嵌入式工作地圖進關只有語音、沒有題目畫面的 bug:`startWorkLevel()` 現在會先 `homeEl.hidden=true` 並 `screen.hidden=false`,再渲染工作題目。
- 補上工作地圖桌機與手機版樣式。

### 本輪調整(Codex):工作英文拆成小關 + 先教句塊
- 使用者回報工作英文第一版太硬核:單字/句塊都沒學就直接猜整句,且看起來只有一關。
- `js/10-work-mode.js` 重做為 3 個工作英文小關:「不懂就問」、「回報狀態」、「請求協作」。
- 每關固定 4 句,先完整教學 4 張卡,每張卡顯示英文、中文、使用情境與句塊拆解;之後才進句塊確認、讀懂、聽懂、情境回應、跟讀。
- 題目池不再一開始全隨機洗牌,避免玩家沒看過句子就被要求作答。
- 完成頁新增「再練這關」與「選其他工作關」,讓工作英文不再只是單輪練習。
- 補工作關卡選單與句塊卡片樣式。
- 驗證:`node --check js/10-work-mode.js js/10-home-settings.js js/00-content.js js/01-engine.js js/08-lesson-flow.js`。

### 本輪新增(Codex):工作英文聽說讀小課
- 使用者覺得現有學習工具常在還沒學熟時要求默寫,但工作用英文短期更需要聽懂、讀懂、能開口回應。
- 新增 `js/10-work-mode.js`:獨立「工作英文」練習,不寫入主線熟練度、不出默寫、不影響地圖進度。
- 主畫面側欄新增「💼 工作英文」入口,點進去可跑一輪約 20 題小課。
- 第一版題庫放入 12 句高頻工作句,例如 `Could you explain it again?`、`Let me check.`、`I fixed the bug.`、`Can you send me the file?`。
- 題型只包含:短句教學、看英文選中文、聽英文選中文、工作情境選英文回應、跟讀自評。跟讀先不做硬語音辨識,避免瀏覽器麥克風誤判卡關。
- 補上工作英文專用樣式與手機版單欄排版。
- 驗證:`node --check js/10-work-mode.js js/10-home-settings.js js/11-main.js js/00-content.js js/01-engine.js js/08-lesson-flow.js`。瀏覽器煙測因本輪 shell 環境缺 `playwright-core` 未跑。

### 本輪追加修正(Codex):挑戰九宮格答對後卡住
- 使用者回報挑戰關九宮格選對後畫面停在 `命中` 狀態,倒數條繼續跑,時間結束仍不進下一題。
- `renderBossQ()` 的 finish 現在會凍結倒數條 CSS transition,避免答題完成後視覺上還像倒數中。
- 答題後切下一題等待從 750ms 縮短為 420ms,減少停在命中畫面的空窗。
- 新增 `scheduleBossTurn()`:下一題生成包 try/catch,若未來遇到題目生成邊界錯誤,會顯示提示並返回地圖,不再卡死在原畫面。
- 驗證:`node --check js/09-boss.js`;Chrome headless 模擬九宮格 `water` 答對後 0.9 秒已切到下一題,console 無錯。

### 本輪追加修正(Codex):分類多選題 prototype
- 新增分類題資料來源:沿用單字 `flags` 組出飲料、可加糖飲料、食物、感受、可介紹物、可擁有物等分類,避免先寫死一堆題庫。
- 主線新增 `category` 題型:至少要有 2 個正解和 2 個誘答才會出,選完後會提示漏選/多選,用來練「哪些字同一類」。
- 課程 recipe 加入 `category` 權重:新字導入低比例、認字/克漏字/句子應用逐步增加、王前整理更常混入。
- 挑戰關新增 `category` mode:限時選出所有符合分類的英文;點到錯誤分類會立刻失敗扣血,答對造成分類題傷害。
- 臨死反撲可少量混入分類題;如果分類題被去重擋掉,會退回一般題,避免空題或卡死。
- 補上主線分類題與挑戰分類題樣式。
- 驗證:`node --check js/01-engine.js js/03-feedback-choices.js js/05-modes-basic.js js/08-lesson-flow.js js/09-boss.js`;Node VM 模擬確認第一階段飲料字可組出 `sweetenable` / `drinkable` 分類題,挑戰關分類題可產生 answer key 與漏選補救 id。

### 本輪追加修正(Codex):挑戰關臨死反撲改成句子混合驗收
- 使用者回報挑戰關最後反撲仍像連續單字刷題,不太像階段驗收。
- `bossCombo()` 改為優先抽句子題:有學過句型時,反撲會混入 `sentence_cloze` 句子克漏字或句子九宮格。
- 保留少量單字題混合,避免反撲完全變成句子單一模式;一王 2 連段會傾向 1 題句子 + 1 題單字,後面階段連段越多句子比例越高。
- 如果目前沒有可用句型,仍會自動退回原本單字反撲,避免卡死。
- 驗證:`node --check js/09-boss.js`;Node VM 模擬一王反撲,確認 `hits=2` 時 `sentenceTarget=1`,樣本為 `sentence_cloze/grid + word` 混合。

### 本輪追加修正(Codex):已會內容自動縮短關卡
- 使用者回報第 2 關大量點「我已經會了」後,仍連續出現 `tea with sugar` 這種重複排句;根因是 `buildLessonQuota()` 仍硬補到 recipe 題數。
- `buildLessonQuota()` 改成「最多題數」:還沒會、缺默寫、到期複習的字才會拉長關卡;已會且已寫過的字通常只回顧一次,不再拿來硬湊 8/10/14 題。
- `sentenceWithWord()` 增加防呆:如果保證含某字的句子只剩上一題同一句,回傳 `null` 讓一般句子池改抽其他句,避免為了含指定字而連續重複。
- 開始說明從「約 X 題」改成「最多約 X 題」,符合現在會依材料自動縮短。
- 驗證:`node --check js/01-engine.js`;`node --check js/06-modes-sentence.js`;`node --check js/08-lesson-flow.js`;Node VM 模擬第 2 關四個飲料字都已會且寫過時,recipe 8 題會縮成實際 quota 4 題。

### 本輪追加修正(Codex):排句題避免連續同一句
- 使用者回報「看中文,排出英文」連續出現同一題,例如 `tea with sugar` 接連重複。
- `sentenceVariants()` / `sentenceCandidates()` 會針對同一句型多抽幾次並去重,讓同一個句型也能產生 `tea with sugar` / `coffee with sugar` 這類變體。
- `sentenceWithWord()` 改用展開後的候選句,強制複習某個字時也會避開上一題的 exact same sentence。
- `pickTransformSentence()` 同步改用展開候選,避免轉換題也卡在單一句子。
- 驗證:`node --check js/03-sentence-utils.js`;`node --check js/06-modes-sentence.js`;Node VM 確認上一題若是 `tea with sugar.`,強制練 `sugar` 會挑 `coffee with sugar.`。

### 本輪追加修正(Codex):整句跟讀題型
- 新增 `askSentenceSpeak()`:主線可出「聽整句,跟著念一次」,顯示英文句子與中文,並提供正常/慢速播放。
- 新增 `sentenceSpeechMatches()`:整句辨識使用 token 覆蓋率判定,比單字辨識寬鬆;兩次抓不到會進入自評,玩家可選「念順了,過」或再試一次。
- 整句跟讀接進 `FORMATS` 的 `sentence_speak`,屬於 `speak` 技能但不作為硬考核;跳過說題仍可沿用「只跳這題 / 以後都跳過說題」。
- 課程 recipe 加入 `sentence_speak` 權重:新字導入低、句子應用與王前整理較高,避免一開始口說整句過量。
- `css/05-teach-build.css`:新增整句跟讀卡片、成功/失敗狀態與瀏覽器聽到內容的顯示樣式。

### 本輪追加修正(Codex):全點我會了不再跳過句型課
- 使用者發現第一關單字全點「我會了」會直接開王;這在舊單字制合理,但現在第一階也有短語/句型,會把句子應用整段跳掉。
- 新增 `stageSentencePatterns()` / `stageSentencesReady()`:提前開王除了本階實詞都 `taught + wrote + learned`,還要本階可組出的核心句型至少碰過一次(`patMastery > 0`)。
- `stageReadyAt()` 改用傳入關卡換算 stage,並把「全會提前打王」改成 `allKnown && stageSentencesReady(stage)`;固定跑到本階最後一關後仍可照原本規則開王。
- `normalizeBossGate()` 現在會重新計算 `meta.bossReady`,可收回舊規則誤開的王關狀態。

### 本輪調整(Codex):王關改為可選挑戰關
- 主線不再要求打王才能進下一階:階段完成後直接解鎖下一階,過關畫面顯示「下一階已解鎖」。
- 原 Boss 戰保留為 `startChallenge(stage)` optional challenge。地圖完成的階段旁會出現「挑」節點,側欄新增「挑戰關」入口。
- 挑戰關輸了不扣熟練度、不擋進度;第一次通過記到 `meta.challengeCleared[stage]` 並給金幣獎勵,之後重打是回顧練習。
- `meta.bossReady` 改為不再作主線門檻;`normalizeBossGate()` 只負責收掉舊狀態與限制當前階段最大關卡。
- 重置進度時同步清掉 `meta.challengeCleared`。

### 本輪追加修正(Codex):關卡說明讀實際階段長度 + 排句字卡中文提示
- 使用者:第一關原型後關卡數/題數變多,但點關卡的開始說明還寫死 `5` 關;並詢問是否要參考別人 hover 英文字顯示中文註解。
- `showStart()`:開始說明從 `本階第 ${idx}/5 關` 改成讀 `stageMinLevels(stageOfLevel(level))`,避免未來階段長度調整後顯示錯誤。
- `askBuildSentence` / `askTransform` / `teachPattern`:英文詞塊新增中文提示資料。排句卡片 hover/focus 會顯示中文,並同步 `title` / `aria-label`。
- `css/05-teach-build.css`:新增 `.word-hint` 浮層樣式,提示不撐開卡片、不影響排句版面。

### 本輪追加修正(Codex):題目英文提示位置修正 + 重玩舊關鎖內容池
- 使用者指出 hover 註解放錯位置:參考 app 是「題目上的英文」可看中文,不是答案英文卡提示。
- 移除排句答案卡上的中文提示;改為克漏字題的題目英文(`This/is/a...`)可 hover/focus 看中文。轉換題的題目直述句也使用同一套提示。
- 新增 `currentSentenceSourceWords()`:句子來源依照玩家點的 `level` 換算 stage,只拿該關卡階段已解鎖的字。
- `buildLevel()` 改用 `stageOfLevel(level)` 而不是 `meta.stage`,並限制 active/due/fallback 都不能拿到該關卡之後的字。修正「打完五關後回第一關,第一關直接教新詞」。
- `askClozePick` / 主線 `sentence_build` / 過關後組句小練習都改吃 `currentSentenceSourceWords`,避免回頭重玩舊關時組出後面階段的句子。

### 本輪追加修正(Codex):Boss 九宮格突襲 prototype
- 新增 Boss 專屬 `grid` 題型,約 28% 機率出現,先做成小遊戲招式而不是新關卡系統。
- 單字九宮格支援錯字陷阱,例如 `cat` 會混 `cot/cit/cut/crt/cet` 這類相近拼字。
- 有圖單字可出「英文找圖」反向圖題,格子會混入近似圖示陷阱(如 cat 混虎/狗/獅、水混油/奶/飲料)。
- 句子九宮格會把已會句子拆成詞塊,玩家要依序點出英文句子,等於打地鼠版排句;目前只作為 Boss 句子招式之一。
- Boss 句子題不再使用教學式拖曳排列;現在以 `sentence_cloze` 克漏字為主,少量混九宮格句子連打。主線練習仍保留拖曳排列。
- `book` 的正式視覺從 `📚` 改成較像單數書本的 `📓`;九宮格陷阱保留非書本類,避免出現兩個都像正解的圖。
- 修正九宮格提示排版:提示內容改用 `.boss-grid-clue` 直向排列,並加上 `boss-grid-mode` 專用行距,避免英文和說明文字擠在一起。
- 修正 Boss 倒數條可能一出現就跳到空條的問題:timebar 改成先渲染滿格,再用雙 `requestAnimationFrame` 啟動縮減動畫。
- 修正 Boss 九宮格過度主導的問題:降低九宮格機率、句子題改成「克漏字優先,少量九宮格」,並加入 `lastMode` 防止九宮格連發。
- 新增 Boss `sentence_cloze` 句子克漏字:顯示中文與英文空格句,玩家輸入缺字;答錯只記缺的那個字進惡補。
- 修正第二階 Boss 過度集中 `home/house`:本階新實詞只有 1-2 個時,自動降低本階權重並提高舊字混入;句子題也不再每題強塞本階字。
- 驗證:`node --check js/09-boss.js`;Node VM 確認可產生單字/句子九宮格,且 `cat` 錯字陷阱為相近拼字。
- 追加驗證:Node VM 確認 Boss 句子題可產生九宮格句子連打,例如 `This is my house` 會要求依序點 `this/is/my/house` 並混入干擾詞。
- 追加驗證:Node VM 模擬二王 150 題,模式分布包含 `grid/zh/listen/pic/sentence_cloze/choice/listen_choice`,且九宮格最大連發數為 1。
- 追加驗證:Node VM 模擬二王 300 題,字詞分布以 `home/house` 為主但會混 `cat/book/friend/water/happy`,句子也會出 `This is a cat/book/friend` 等舊材料。

## 2026-06-29

### 本輪追加修正(Codex):Boss 題型與抽題權重
- 一王血量從通用公式獨立出來,降為 35,避免只有五個單字時戰鬥拖戲;二王以後仍用逐階變肉公式。
- Boss 單字題庫改成本階實詞大幅優先,舊字只少量混入;同一場已出過的字會降權,降低一直抽到 `cat/water/friend` 的機率。
- Boss 句子題會優先把本階新字塞進句子,例如第二階更常出 `home/house` 句子,不是一直回第一階材料。
- 新增 Boss `listen_choice` 題型:聽音後選英文,讓王關有語音元素但不使用不穩定的麥克風語音辨識。
- 驗證:`node --check js/09-boss.js`;Node VM 模擬第二階單字抽題偏向 `home/house`,句子題可穩定產生 `This is my home/house`、`This is a house`。

### 本輪追加修正(Codex):有圖單字優先看圖寫
- `home/house` 本來已經有圖,也符合 `pictype`「看圖寫英文」題型,但它只是在默寫題池中隨機抽,所以可能整輪都沒遇到。
- 現在有圖單字在第一次需要硬默寫(`wrote=false` 且進入寫作階)時,會優先出 `pictype`;通過後才回到一般默寫題型隨機。

### 本輪調整(Codex):固定 5 關 + 王,每關題數變化
- 課程骨架改成**每階固定 5 個主線關 + 王**:`stageMinLevels()` 固定回 5,王關位置回到 5/10/15/20… 旁邊。
- 新增 `LESSON_RECIPES`:第 1 關新字導入(約 6 題)、第 2 關認字聽音(約 8 題)、第 3 關克漏字(約 10 題)、第 4 關句子應用(約 14 題)、第 5 關王前整理(約 10 題)。
- `buildLevel()` 依照本關 recipe 控制新字導入量:前 1-3 關導入新字,第 4-5 關不再塞新字,改做句子/克漏字/默寫整理。
- 舊 micro-batch 不再阻止本階剩餘新字開出;現在只把未穩字排前面多練,避免固定 5 關內只卡在前兩個字。
- 題型抽選權重接上 recipe:句子應用關會更偏排句/轉換/克漏字,王前整理更偏寫作與整合。
- 本關 quota 改由 recipe 題數分配,同一批字會依需求重複練到本關題數,不再每字只問一次就結束。
- Boss 不再因為本階字提早全會就插進階段中間;固定等本階第 5 關後再開。未來「跳過」要做成整階驗收。
- 將原本 10 個字的吃喝/感受批拆成兩個 5 字批,避免固定 5 關教不完而卡王。

### 驗證
- `node --check js/01-engine.js`
- `node --check js/08-lesson-flow.js`
- `node --check js/09-boss.js`
- `node --check js/10-home-settings.js`
- Node VM 確認 stage 長度為 5,起點為 1/6/11/16,王關位置為 5/10/15/20,recipe 題數為 6/8/10/14/10。
- Node VM 模擬前兩階已通過後的第三階:第 11-13 關可導入 hungry/thirsty/tired/sad/eat,第 15 關後 `stageReadyAt(15)=true`。

### 本輪追加修正(Codex):整階已會跳王 + 防說題連發
- 修正固定 5 關後「整階都點我已經會了」不會開王的問題:`stageReadyAt` 現在允許本階所有字 `isLearned + wrote` 時提前開王,視為整階驗收。
- 修正只剩少數弱字時可能連續抽到同一技能(尤其說題)的問題:主線題型抽選會優先避開同一個字連續同技能。
- 驗證:`node --check js/01-engine.js`, `node --check js/08-lesson-flow.js`;VM 確認第一階五字全標會時第 3 關 `stageReadyAt(3)=true`。

### 本輪追加修正(Codex):少量補完模式
- 新增 `stagePendingWords()` / `completionRecipe()`:本階只剩 1-2 個字沒達標時,下一關會變成短補完關,只練這幾個字。
- 補完關題數縮短:只剩 1 字約 3-4 題,只剩 2 字約 5-6 題;如果缺 `wrote`,會提高寫作題權重。
- `buildLevel()` 在補完模式只回傳 pending 字,不再因題數太少塞已會舊字。
- 驗證:四個字已會、cat 缺寫作時,VM 顯示 `words=[cat]`, `quota.word_cat=4`,不會把已會字加回關卡。

### 本輪追加修正(Codex):配對題避免答案順序排好
- `askMatch()` 的英中兩欄若洗牌後剛好同 index 全部對齊,會把中文欄旋轉一格,保證不是開場就排好答案。
- 驗證:`node --check js/05-modes-basic.js`;小模擬確認對齊陣列旋轉後 `aligned=false`。

### 本輪追加修正(Codex):關卡開場可返回地圖
- `showStart()` 開始鈕下方新增「← 回地圖」,點到過去關卡或目前關卡後不會只能開始。
- 驗證:`node --check js/08-lesson-flow.js`。

### 本輪調整(Codex):第二階段加入 home/house
- 判斷第 6-10 關原本只有功能詞,太容易變成同一批舊字的語句重排;將 `home/house` 加進批 2,讓第二階段除了 this/is/a/my/I/am 之外也有新實詞材料。
- `completionRecipe()` 增加防呆:如果某階原本就只有 1-2 個實詞,不會一開始就被當成「少量補完」。
- 驗證:`node --check js/01-engine.js`;VM 模擬第一階通過後進第 6 關,本階字為 `home/house`,配方為 `intro`,實際關卡會抓到 `home/house`。

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

### 本輪(Claude Opus): 擴內容批3「吃喝與感受」(+8 字 + I eat 句型)
- 使用者要擴內容讓後期不重複,照「教新字→組句→應用」的弧。第一批補最常重複的 I am / I drink。
- 新增 8 字:hungry/thirsty/tired/sad(emotion 形容詞)、tea/milk(drinkable)、rice/bread(eatable 新 flag)。
- 新句型 pat_i_eat_noun(I eat {x},requires eat、slot eatable),掛進 BUILD_SENTENCE_PATTERN_IDS。其餘重用 I am / I drink。
- 正式編 BATCHES 批3「吃喝與感受」(感受形容詞先→eat/drink+食物飲料;eat/drink 收進同批讓吃喝句自給自足)。既有未分批字往後挪 1 階(擾動最小)。
- 食物飲料加 EMOJI(🍚🍞🍵🥛)→ 有看圖題;感受抽象不加。
- 效果:I am ___ 1→5 句、I drink ___ 1→3、新增 I eat ___ 2;轉換題 Am I hungry/tired/sad…;配合防重複,後期變化大增。
- 更新 CONTENT_RULES(eatable flag + I eat)、HANDOFF(BANK 47 + 批3 + 快取驗證注意)。
- 驗(瀏覽器):BANK 47、句型全生成、batchOf 正確(吃喝感受=batch2/stage3、舊字+1階)、rice 看圖題出、轉換含新情緒;node --check 四檔 OK;零 console error。
- ⚠ 驗證踩雷:瀏覽器硬快取 js,需 fetch(cache:'reload')重抓才看到新 BANK(已記進 HANDOFF)。

### 本輪(Claude Opus): 教卡「我已經會了」跳過 + 整階全會直接打王
- 使用者(通用向):不該強迫已經會基礎的人從 cat 慢慢爬;但又不能自由選字(會打斷「依賴鏈」=句子組不出)。解法:跳過=標記成已學會(不是移除)。
- 教卡加 .sideact「這個我已經會了」鈕 → markWordKnown(w):標 taught+mastery100+wrote、給金幣、排 SRS、本關消題。字仍在字庫 → 句子照樣組得出、王門檻認帳,鏈不斷。
- stageReadyAt 改:該階字全部 isLearned(含跳過)→ 不必等 stageDeadlineLevel,直接可打王;部分會則仍要跑鞏固關。→「整階都按我會了就直接打王」。
- 驗(瀏覽器):教卡有鈕、點了字變 learned+wrote+消題+金幣;stage1 全標會 → stageReadyAt(1)=true(deadline=5 也放行)、部分會=false;showDone 全標會 → bossReady + 出挑戰王鈕;node --check OK;零 console error。
- 設計討論:確認「自由選字」會打斷依賴鏈不做;「跳過已會」相容。受眾定位=通用。

### 本輪(Claude Opus): 修「跳過已會 → 關卡混亂」
- 使用者點破:整批字大多按「我會了」、只剩 1 個不會時,關卡會混亂——① 剛標會的字下一關又被抓回複習;② 只剩 1 個不會,buildLevel 還硬補已會的字湊到 4 個。
- markWordKnown:跳過字的 SRS due 從 clock+1 改成 ivl=8/due=clock+8(停遠,不下一關馬上複習;之後句子輕度抽查)。
- buildLevel:「picked<4 補學會的字湊數」加 `&& !fresh.length` 守衛 → 還有沒學的新字就專心出新字,純鞏固期(無 fresh)才補。
- 效果:「5 字只剩 1 個不會」→ buildLevel 只出那 1 個 → 學完(+整階已會)直接打王,不混亂。
- 驗(瀏覽器):標 4 會留 cat → buildLevel=[cat](不補已會);純複習期(全會無 fresh)→ 仍補滿不空;跳過字 due=clock+8(停遠);node --check OK;零 console error。

### 本輪(Claude Opus): 句型教卡也加「我已經會了」
- 使用者:句型教學(先看這個句型)也該能跳過,語句現階段很簡單很多人會。第一次出現的教學都要有跳過鈕。
- teachPattern 加 onKnown 參數 + .sideact「這個句型我已經會了」鈕;askBuildSentence 傳 onKnown=()=>{ bumpPat(id, LEARNED); done(); }(句型標滿、跳過排句、直接 continue)。
- patMastery 標滿後,同句型不再出教卡(直接 arrange),與單字「我已經會了」一致。
- 教學是內容驅動(第一次遇到才教),非固定關卡:單字=該字第一次被引入;句型=該句型第一次出題(patMastery===0)。
- 驗(瀏覽器):教卡有鈕、點了 patMastery 10→100、done 觸發推進;標滿後同句型直接排句不再教;node --check OK;零 console error。
- ⚠ 未做:boss 門檻仍是「單字」基準(stageReadyAt 看 word taught+wrote);純句型階段「patterns 都會了→跳王」沒獨立接(句型沒按階分批,難定義「這階的句型」)。要的話另議。

### 本輪(Claude Opus): 選擇題改「點選定 + 確認才判」
- 使用者:選擇題點了就=送出,手滑會誤判。改成點=選定、按確認才判分(Duolingo 式),確認前可改選。
- 新增共用 mountChoices(box, opts, getText, w, correctText):點選項→高亮 .opt.sel(清掉其他)、底部 .act#submit「確認」(沒選 disabled),按確認才 pickAnswer→finish。
- askReadPick / askListenPick / askListenWord / askPicture / askClozePick 全改用 mountChoices(原本各自 el.onclick=pickAnswer 點了就判)。
- CSS:加 #screen .act:disabled 灰掉樣式。Boss 四選一不改(戰鬥保持秒判);配對題 askMatch 不改。
- 驗(瀏覽器):初始確認鈕 disabled;點錯選項只選定不判分;改選 sel 會移動;按確認才判(標對+鎖定+收確認鈕+出結算+繼續);5 種選擇題都有確認鈕;node --check OK;零 console error。

### 本輪(Claude Opus): 修音節克漏字「答對判錯」+ 短字不再拆音節
- 使用者:happy 打對卻判錯;女友覺得音節中間的「·」很奇怪。根因:① 答錯會把輸入覆寫成正解(看到的紅字是正解不是你打的),最可能是打了整個字「happy」但只挖「hap」一節→不符;② 2 音節短字(happy)被拆成 hap·py 出音節題,既confusing又出現那個點。
- askSylType 比對:加 NFKC+去非字母正規化;只挖 1 節時「打整個字」也算對(treat full word 等同)。→ 打 happy 不再被判錯。
- 門檻 2→3:sylfill/syltype 的 FORMATS ok、askWrite dispatcher、askSylType 內部都改成「3+ 音節」才分段。短字(happy/water/project/hungry/thirsty 等 2 音節)走整字拼寫,不再出現音節「·」。只 beautiful(3)/experience(4) 等長字才分段練。
- 驗(瀏覽器):happy 打整個字→判對、打錯→判錯;happy/hungry 的 sylfill/syltype ok=false、beautiful/experience=true;node --check OK;零 console error。

### 本輪(Claude Opus): 修「剛學就默寫句子」跳難度
- 使用者:剛學「餓/hungry」沒練習就被要求句子默寫(sentence_cloze),且一直出卡住(Duolingo 最痛點)。根因:① ask 的「!wrote → 強制只出寫題」一教完就生效 → 跳過認/聽/說直接逼默寫;② 句子題固定高權重(sentence_build 40、sentence_cloze 18)不分該字熟練度 → 剛學的字一直被丟句子。
- 修:難度跟該字 tierOfMastery 爬。① !wrote 強制補寫改成只在 target≥3(寫階)才生效;② 句子題權重吃 target:認階壓低(build 7、transform 4、cloze 0)、說階主打排句(build 40/transform 20)、寫階才出句子默寫(cloze 18)。
- 效果(實測分佈):mastery 0 新字→認/聽 ~60% + 說 + 少量排詞,sentence_cloze=0(不再默寫剛學的字);mastery 50→排句主軸;mastery 80→才強制寫+句子默寫。→ 新字走 認/聽/說→排詞→默寫,不跳級。
- 驗:probe ask 300 次 ×3 mastery 階,分佈如上;node --check OK;零 console error。
- 未動:答錯→補考的「我要複習」仍是可選(之前使用者要求);難度修好後「被不會的硬題卡住」的情況本身大幅減少。複習要不要改強制另議。

### 本輪(Claude Opus): 補考連錯第二次才強制複習
- 使用者:錯了希望有複習一輪(但之前又要求手滑別被罰)。取中間:第一次錯直接補考+可選複習;連錯第二次=真卡住→強制複習卡。
- 新增 reviewMiss[k]「連續答錯次數」:onWrong +1、onCorrect 歸零、startLevel 清空。
- reviewThenAsk:reviewMiss<2 → 直接補考(留可選「我要複習」鈕);≥2 → 強制 showReviewCard(看字+音節+念+字根)再考。
- 驗(瀏覽器):連錯1→直接補考(可選鈕)、連錯2→強制複習卡→看完回補考;計數 錯1→2、對歸零、再錯1;node --check OK;零 console error。

### 本輪(Claude Opus): 修課程節奏「一直解鎖新字、舊字淹掉學習」
- 使用者:認識/學習量比例嚴重失衡——剛教的新字沒怎麼練,一關卻塞一堆舊字複習,而且每關都還在冒新字,一堆字沒真的練到又持續解鎖。
- 模擬證實:一關 = 2 新 + 4 在學 + 4 已會舊字(已 4 個在學還硬加 2 新、4 個舊字灌進來)。
- 修 buildLevel:① NEW 節流 = active.length>=3 ? 0 : 2(在學的字 ≥3 就先別引新字,把在學的練到會再解鎖);② active 提到主力優先;③ needsWrite/due 各只穿插 ≤2(舊字主要靠句子複習,別淹掉學習);④ MAX 10→8。
- 效果(實測):4 個在學時→0 新 + 4 在學 + 2 舊(專心練在學的、不冒新);2 個在學時→2 新回來。新字隨「在學的練完」自然節流。
- 驗:同情境模擬前後對比如上;node --check OK;零 console error。

### 本輪(Claude Opus): 排詞洗牌修正 + 🎯 單字特訓自選關
- 使用者:① 排詞卡常直接是正解順序;② 想要自選單字特訓關(背不起來的字自己加強,練到會了點移除)。
- 洗牌:shuffle 換 Fisher-Yates(舊 sort(()=>random-0.5) 有偏差、短陣列常洗回原序,驗:首位分佈均勻);mountArrange 洗出來等於正解就重洗(驗:30/30 不再是正解序)。
- 新功能 單字特訓:showHome 加「🎯 單字特訓」分類 → showTrainPicker(選教過的實詞,弱的排前、顯示熟練度%)→ startTraining/trainNext/trainAsk(聽說讀寫混合、忽略 lv、排除句子題、避免連續同題型)→ 每題 injectTrainKnown「✓ 我學會了」鈕(markWordKnown + 移出 trainPool)。
- inTraining 旗標:nextQuestion→trainNext;onCorrect/onWrong 只加熟練度/金幣/SRS,不碰主回合 quota/reviewQueue;showHome 進場重置。答對字留著繼續練、清空→trainingDone。
- 驗(瀏覽器):選字頁列教過字/選取啟用開始鈕;訓練出題+學會鈕、答對留池+熟練度升、點學會移除+標會、清空→完成頁;node --check 4 檔 OK;零 console error。

### 本輪(Claude Opus): 補考答對不補熟練度 + 特訓只列沒滿100%的字
- 使用者:① 特訓選字頁只顯示沒 100% 的字;② 答錯後補考(剛看過答案)硬過不該把熟練度補回,要下次主回合真的一次過才補。
- onCorrect:加熟練度/wrote 那段改 else if (!inReview) → 補考(inReview)答對只消題、不加 %、不算 wrote;主回合(inReview=false)才加。trainNext 設 inReview=false(特訓不是補考,答對正常加分)。
- showTrainPicker:濾掉 isLearned(100%)的字,只列 <100% 的;全滿時換訊息「目前沒有需要加強的字」。
- 驗(瀏覽器):補考答對 mastery 留 40、主回合答對 40→65、補考默寫 wrote=false;選字頁濾掉 100% 的 cat、特訓答對仍加分(40→65);node --check OK;零 console error。

### 本輪(Claude Opus): 配對改 4 組 + 特訓「我學會了」移到左下大鈕
- 使用者:① 特訓配對題 5 組被固定不捲版面切到底部(尤其特訓還多一顆鈕);② 特訓「我學會了」放頂部小 pill,不一致也不顯眼——「我已經會了」既有慣例是左下 .sideact 大鈕(教卡那顆)。
- askMatch:5 組 → 4 組(others.slice(0,3)、不足門檻 <3),固定版面放得下(一般關卡的配對題也一起修好短螢幕切字)。
- injectTrainKnown:從頂部 .reviewlink pill 改成左下 .sideact 大鈕(跟教卡 iknow/patknow 一致、顯眼),接到 #screen(fixed);說題左下已有 skipspeak → train-known 疊到它上方(bottom 110px)不重疊。
- 驗(瀏覽器):配對 4 組;train-known 是 .sideact、parent=screen、不在 stage;說題時 bottom=calc(110px) 疊高;點擊→移除+標會+下一題;node --check OK;零 console error。

### 本輪(Claude Opus): 修特訓「我學會了」鈕疊在結算列上
- 使用者:答完題後底部結算列(.why)出現,特訓「我學會了」鈕沒收掉、疊在上面。點破:現成就有「答完收掉送出鈕」的機制,該套同一個。
- 抽 clearBottomActions()(收掉 submit/trainknown/skipspeak),finish 改用它;finishGroupSuccess / speakResult / offerSelfAssess / askSylType 結算也呼叫 → 所有結算路徑統一收掉底部動作鈕。
- 驗(瀏覽器):選擇題(finish)、配對題(finishGroupSuccess)答完後 trainknown 收掉、.why 正常顯示不重疊;node --check OK;零 console error。

### 本輪(Codex): 拆分句型工具、回饋選擇題、圖片 registry
- 使用者同意做低風險結構拆分。保留傳統全域 script 與原函式名稱,只調整檔案責任,不改玩法。
- 新增 `js/03-sentence-utils.js`:從 `03-ui-shell-feedback.js` 搬出 `asList/wordById/savedRec`、句型 slot 檢查、`buildSentenceFromPattern`、句型 mastery、`creditSentence`、`pickBuildSentence` 等。
- 新增 `js/03-feedback-choices.js`:從 `03-ui-shell-feedback.js` 搬出 `CONFUSE_PAIRS`、`wrongHint`、`clearBottomActions`、`finish/finishGroupSuccess`、`mountChoices/fourOptions`。
- 新增 `js/04-visuals.js`:從 `05-modes-basic.js` 搬出 `EMOJI/IMG`、`visualOf/visualKey/picHTML`。`index.html` 已補載入順序。
- 效果:`js/03-ui-shell-feedback.js` 從 256 行降到 38 行,只剩 lesson shell / exit confirm / progress bar。`js/05-modes-basic.js` 移除圖片 registry,專注題型。
- 驗(Node):全 `js/*.js` `node --check` OK。未跑瀏覽器 UI 測,此輪為純拆檔低風險變更。

### 本輪(Codex): 第三階段 micro-batch + 克漏字門檻
- 使用者:第三階段長字/句子應用開始變難,不要一關 2 個新字、下一關又 2 個;長字要廣用克漏字,至少成功填入不同格子兩次以上才觸發默寫。
- `buildLevel`:新增進階 focus group(`batchOf>=2`):已教但未達標的進階字會優先塞回本關;focus 存在時 `NEW=0`,不再開下一組。一次新字仍最多 `MICRO_BATCH_SIZE=2`;focus 達標後才開下一組。
- 新增 `clozeReadyForDictation(w)`:長字/第三階段字若能出句子克漏字,需 `clozeOk>=2` 且 `clozeSlots>=2` 才放出硬寫題(`type/pictype/flashtype`)。`sentence_cloze` 答對只記克漏字進度,不直接設 `wrote`。
- `sentenceClozeForWord`:擴充到「w 是 pattern requires 的動詞」也能出克漏字,所以 `eat/drink` 可出 `I ___ rice/tea` 這類句子,不只名詞/形容詞 slot。
- `ask` / `trainAsk`:克漏字門檻前會過濾硬寫題;主線仍可出句子克漏字、音節鷹架等支架題。`onCorrect` 只有 hard dictation 格式成功才標 `wrote`。
- 驗(Node):全 `js/*.js` `node --check` OK,合併 script parse OK;VM 模擬 stage3 先開 `hungry/thirsty`,未達 `clozeOk>=2 + 2 slots` 不開下一組,達標後開 `tired/sad`;`eat/drink/rice/tea` 可產生句子克漏字。

### 本輪(Codex): 主線排句錯題改回補考 + 第三階段章長跟 micro-batch
- 使用者:轉換題答錯後變成一直重排到對,違反「答錯最後補考」;也擔心第三階段關卡一直推進,還沒練完就撞王。
- `askBuildSentence`:新增 `onMiss` 參數。主線題傳 `onMiss` 時,答錯顯示正解後按「繼續」→ `onWrong` → 主回合結束補考;過關後額外「組句小練習」沒傳 `onMiss`,仍保留「重排一次」。
- `askTransform`:主線轉換題答錯改成「看正解 → 繼續」並呼叫 `onWrong(w); nextQuestion();`,不再原地重排到對。
- `stageMinLevels(stage>=3)`:改成 `max(5, ceil(stageWordCount/2)*2)`,第三階段 10 字 → 第 10~19 關,不會第 13 關就撞章末;第 4 階段若 5 字 → 至少 6 關。
- `normalizeBossGate`:移除舊的「超過 deadline 自動把 taught 字標 wrote」遷移邏輯,避免繞過現在的克漏字/默寫門檻。
- 驗(Node):全 `js/*.js` `node --check` OK,合併 script parse OK;VM 確認 stage3Min=10、stage3Deadline=19、stage4Min=6。

### 本輪(Codex): 第一關飲料短語原型
- 使用者拿參考 app 討論:第一關就應該進入日常短語/情境,不用每個功能詞都先單獨教完。先做第一關原型,不整套大改。
- `BANK`:新增 `coffee/sugar/with/please`,並把 `tea/milk` 補上 `sweetenable`;`or` 文案改成飲料二選一脈絡。`EMOJI` 補 `coffee/sugar`。
- `PATTERNS`:新增 `pat_drink_or_drink`、`pat_drink_please`、`pat_drink_with_sugar`,接進 `BUILD_SENTENCE_PATTERN_IDS`。
- `BATCHES`:第一階改成 `water/tea/coffee/sugar + or/with/please`,第二階接回 `cat/book/friend/happy + this/is/a/my/I/am/home/house`。
- `FIRST_LESSON_RECIPE`:第 1 關獨立拉長到 18 題,一次導入 4 個飲料材料,提高句子應用權重。
- `askClozePick`:改用 `buildSentenceFromPattern` 生成完整句,多 slot 句型也只挖目標 slot,不再把其他 slot 清空成怪句;選項不足時退回認字題。
- `FORMATS`:句子排詞與克漏字允許第 1 關出現,但克漏字需至少有干擾選項。

## 2026-07-02（Claude Opus 4.8):工作英文改成浮動熟練度引擎(大改)

> 使用者實玩工作英文逐點逼出來的:固定關卡 + 一次砸整句 + 選項能用「一個醒目字」猜 → 沒真學到、也不能重組。這輪把工作模式從固定 13 關腳本換成**浮動 + 熟練度% + SRS** 的自帶引擎(對齊主線精神,自成一套、**不碰主線**)。相關:`js/10-work-mode.js`、`js/10-home-settings.js`、`css/06-home-map.css`。

### 過程(依使用者回饋逐步)
- 先修一關內難度斷崖:句子流程改「**拆**(逐塊教)→ **認**(句塊意思)→ **組**(排句 `workBuild`)→ **用**(listen/reply)」,拿掉太送分的 read;reply 固定考本句 + 開頭提示。
- `finishWorkChoice` 改吃 item:顯示「這句/字 = 中文 + `why` 眉角(沒填退回 `scene` 使用時機)」,拿掉被硬塞成玩家文案的內部設計方針(對等主線 `w.why`)。`WORK_WORDS`/句子加 `why` 欄位 + 眉角樣本。
- 使用者點破更根本:應**先學單字再組合**,且選項能靠一個字猜 = 沒學到。先加「單字先學層」→ 使用者再點破:**不該綁死關卡數/一關學多少**,要浮動、循序、確實會了才進、每天一點或衝刺皆可 = 主線引擎的行為。
- **改成浮動引擎**:每字/每句一個 unit(`w_xxx`/`s_xxx`),各有熟練度%+SRS,存獨立 localStorage(`work_progress_v1`/`work_clock_v1`),不碰 `eng_progress_v2`。
  - `buildWorkSession`:到期複習 → 在學中 →(在學 `<3` 才)引新 2;新只教、下段才考;句 unit 前置 = 同關 `wordIds` 都教過;cap 7 題。
  - 題型跟 `workTier`(34/67)爬:字 認→產出;句 認塊→組句→應用。`workCredit`(+25/−20/100%=會)、SRS `ivl×2` 封頂 30、`workClock` 每段 +1。
  - 首頁改成**進度面板 + 進度儀表地圖**(13 主題節點依「學會幾/共幾」上色、學滿 ✓,不再是關卡鎖;`workThemeProgress`/`workMapSVG` 改寫)。`startWorkSession` 進場、`startWorkLevel` 留相容 shim、`buildWorkQueue` 刪除。
- zh→en 單字題中文提示從靠左小字改置中放大(`.work-quiz-cue`);順手 `.work-scene` 一律置中。
- **修真 bug:🔄 重置對工作無效** —— 工作進度在獨立 localStorage + 記憶體 `workRec`,重置只清了主線。加 `resetWorkProgress()`(清 `workRec`+`workClock`+兩個 localStorage key)接進 reset handler。(重置是 `showHome()` 不 reload → 記憶體也要清。)
- 驗(瀏覽器 8183):模擬 8 段確認起步只 2 字、在學滿 3 停引新、熟練度 認→組→應用 爬、學會進 SRS 回來複習、句子在字教過後才解鎖;真實點擊單字題答對 mastery 0→25;真實 🔄 清乾淨日常+工作;`node --check` OK;零 console error。**過程踩到瀏覽器快取舊 JS(reset handler 沒更新)→ 需 `fetch(...,{cache:'reload'})` 再 reload 才驗到**(自己在 8182 測也要硬重新整理)。

### 方向決策(別走回頭路)
- 工作模式定調**用引擎、非固定關卡**;舊「工作模式內加固定單字關」方向否決。
- **AI API 陪練**:結論 = 只做本機自己用(自帶 key)、**可拆選用模組**,核心維持零 AI 依賴(才保純靜態可分享);分享版 = 要後端 + 計費,延後。**現在不動 AI。**
- 死碼待清:`showWorkStart`/`workWordIntro`/`workMaxLevel`/`workLevelScenarios` 不再用;`WORK_LEVELS` 現只當「解鎖順序 + 誘答分組」。

## 2026-07-02（Claude Opus 4.8):工作英文改成主線引擎的第二條「軌」(多軌重構,最終定案)

> 承上:上面那套「工作浮動小引擎」是在旁邊重造主線,一直缺主線早有的功能(補考/音節/句子複習)。使用者點破「主題不同而已,應該通用」。→ 把主線引擎改成**多軌**,工作變第二條軌,直接繼承主線全部。**上面那套工作浮動引擎整段刪除。**

### 引擎多軌化(`js/01-engine.js` 為主,低風險 swap 手法)
- 內容全域改 `const`→`let`,可整組換:`BANK`(js/00)、`PATTERNS`(js/00)、`BATCHES`(js/01)、`BUILD_SENTENCE_PATTERN_IDS`(js/03)、`TRANSFORM_PATTERN_IDS`(js/06)。上百處讀 `BANK`/`meta.stage` 的舊碼**一行不改**。
- 新增 `TRACKS` 登錄 + `currentTrack` + `registerTrack/applyTrackContent/snapshotTrackMeta/loadTrackMeta/setTrack` + `rebuildCurriculum()`。切軌 = 換內容全域 + 把 `level`/`meta.{stage,clock,maxLevel,stageStartLevel,boss旗標}` 存進 `meta.tracks[軌]` / 載回。
- 共用:`store`(id 不撞:`word_*`/`work_*`)、`meta.coins`、`meta.skills`。每軌獨立:內容 + level/stage/clock/maxLevel/王。
- `js/11-main.js` 註冊 `daily` + `work` 兩軌後 `showHome()`。

### 工作內容改成引擎格式(`js/10-work-mode.js` 只剩內容)
- 舊 `WORK_WORDS`/`WORK_ITEMS`/`WORK_LEVELS`/所有 `workXxx` 函式(600+ 行)**整段刪除**(確認零外部引用)。
- 新增 `WORK_BANK`/`WORK_BATCHES`/`WORK_PATTERNS`/`WORK_BUILD_IDS`/`WORK_TRANSFORM_IDS`,格式同主線。功能詞 `pos:"function"`;句型 slot 空 `{}` = 固定句。
- 目前內容 = 主題 1、2(不懂就問 / 回報狀態),8 句、29 字。**主題 3~13 待補(純資料)。**

### 首頁(`js/10-home-settings.js`)
- 分頁鈕改成 `setTrack + showHome`;標題/高亮/地圖隨 `currentTrack`(同一個 `showHome`/`mapSVG` 自動渲染當前軌,因為讀的是 swap 後的 meta)。
- 🔄 重置改成清 `store` + `meta.tracks={}` + 回 daily 軌 → 兩軌一起歸零。

### 驗(瀏覽器 8183,每步驗日常沒壞)
- 地基:`const`→`let` + `rebuildCurriculum` 後日常 `startLevel` 正常出題、BANK/LEARN_ORDER 51、`batchOf(cat)=1`。
- 多軌:`setTrack('work')` → BANK 換 29 工作字、`buildLevel` 用主線浮動選字吐工作字(帶音節)、`buildSentenceFromPattern` 生「I fixed the bug.」;兩軌進度隔離(日常 stage2/關7、工作 stage1/關3);切回日常完整復原。
- 首頁:分頁切換標題/BANK/地圖隨軌換,工作關進得去、音節教學 un·der·stand 出來、重置清兩軌。
- 刪舊引擎後全檔 `node --check` OK、整個 app 重載日常+工作都正常、零 console error。
- ⚠ 驗證途中踩到瀏覽器快取舊 JS → 需 `fetch(...,{cache:'reload'})` 再 reload(自己在 8182 測也要 Ctrl+F5)。

## 2026-07-03（Claude Opus 4.8):工作內容補完 3~13 + 工作不練默寫 + 補考卡死修復 + 極簡線條圖示

> 承多軌重構。這輪鋪完工作 13 主題內容;依「工作原始意圖=不默寫」把工作軌整條改成聽讀說(關卡 + 王都不打字);順手修掉一個補考卡死的潛伏 bug 與時態不一致;最後做 UI 極簡線條圖示。相關:`js/10-work-mode`、`js/01-engine`、`js/08-lesson-flow`、`js/09-boss`、`js/03/06/07`、`js/02`、`js/11`、`css/02/06`。

### 工作內容補完(主題 3~13)
- `WORK_BANK` 補到 **123 字**、`WORK_PATTERNS` **52 句**、`WORK_BATCHES` 13 批(每主題一批 + 該主題新膠水詞)。功能詞 `pos:function`、句型 slot 空 `{}` = 固定句。
- 加了驗證腳本:每個句子的每個字面 token 都要對得到一個 `WORK_BANK.en`(抓時態不一致)。

### fix/fixed 時態一致(內容 bug)
- 練的字要跟句子形態一致:新增 `work_fixed`(fixed);`work_work/report/find` 的 `en` 改成句子用的 **works/reported/found**(這些字只以該形態出現)。`work_fix`(基本形)移到主題 11(I'll fix it now)。
- 效果:`creditSentence` 連帶加分現在對得到字(「I fixed the bug」加到 `work_fixed`)。

### 工作軌 = 不練默寫(承接「先求聽懂能回應、不用默寫」)
- `js/11` 工作軌註冊加 `skills:{write:false}`。
- `js/08` 新增 `trackSkillOn(s)`(該軌是否練此技能)、`wroteOk(w)`(不練默寫的軌視同會寫)。`ask`/`trainAsk` 改用 `trackSkillOn` 濾題型;`!wrote` 強制補寫加 `&& trackSkillOn('write')`。
- `js/01`:`buildLevel` 的 `needsWrite` 在不練寫的軌為空;`stageReadyAt` 的 `allWrote`、`wordReadyForBoss` 改用 `wroteOk`(不卡階段/王門檻)。
- `js/09` 王:不練默寫的軌,句子 → `bossGridSentenceQuestion`(點序排句)、單字 → `bossGridWordQuestion`(挑正確拼法)、`pickBossMode` 只留 `choice/listen_choice`;`bossTurn`/`bossCombo` 都改。→ 王不再考打字默寫,改辨識。
- 驗:工作關卡 100% 熟練度也不出寫題;工作王 60 題全辨識、零打字。

### ★ 補考重問卡死修復(潛伏 bug,日常也中)
- 根因:`ask` 的「句子複習」路徑把 `lastAsked` 存成**原始 `askBuildSentence`**;補考用 `run(w)` 呼叫 → `askBuildSentence(w)` 把單一字當 `sourceWords` → `sourceWords.map is not a function` → 複習卡「回去答題」點了**卡死**。
- 修:句子複習路徑改存「吃單一字」的包裝 `runSentence(ww)`,補考/複習卡 `run(w)` 就能正確重出含該字的句子。工作學會的字更常走句子複習才把這雷踩出來;日常一直也有。

### 遊玩手感
- 選項/排詞加發音:`mountChoices` 選了念 `o.en`、`mountArrange` 放塊念那個字。
- 第一關太長:`FIRST_LESSON_RECIPE`(18 題)改成只給 daily;其他軌第 1 關用一般 intro(6 題)。
- 狂重播同一句:新增 `hasFreshBuildSentence`,`sentence_build`/`sentence_speak` 只在「有沒出過的新句子」時 `ok`;句子複習路徑也加 fresh 守衛。順手修好日常「一關出 3 次 I am happy」。

### 極簡線條圖示(UI,純玩法層)
- `js/02` 新增 `ICON`(內嵌 SVG 線條集:play/mute/gear/refresh/coin/close/lock/target/flag/book/briefcase)+ `.ico` CSS(跟 `currentColor` 與 `em` 走、`flex-shrink:0` 防在 flex 鈕被壓扁)。
- 換掉 emoji:課程音訊鈕(🔊→線條喇叭、🐢慢速→純文字)、首頁上排(設定/靜音/重來/金幣)、側欄(挑戰/特訓/衍生)、分頁(日常=書 / 工作=公事包)、狀態鈕/複習鈕/王音訊鈕。
- 保留:慶祝時刻大 emoji、題庫看圖題的圖(IMG/EMOJI)、音樂鈕(本就 SVG)、✕、⋯。加圖示 = `${ICON.x}`;純文字夠清楚的鈕就不放圖示。

## 2026-07-03(下午 / Claude Opus 4.8)— 拼寫容錯 + 工作王改辨識

### ★ 打字默寫「拼寫容錯」(Duolingo 式 typo tolerance)
- 為什麼:現實工作是「打字 + autocorrect」,母語者自己也常拼錯長字;手滑漏/錯一兩個字母不該跟「不會」同罰。也接上既有的「手滑別罰」哲學。
- `js/04` 新增共用判定 `spellCheck(typed, target, key)` → 回 `'exact' | 'typo' | false`,`isCloseEnough` 是布林版。規則:
  - 容忍量看字長:**≤4 字精準(0)、5~7 放 1、8+ 放 2**(短字錯一個多半是不會,不是手滑)。
  - 距離用 `typoDistance`(Levenshtein + 相鄰換位算 1 步,recieve→receive 只算 1)。
  - **守衛①**:錯字剛好是「別的真字」(當前軌 `BANK`)→ 判錯(cat≠cut、quiet≠quite),不然等於沒分清楚。
  - 同音/變體逐字指定 `TYPED_ALIASES`(預設空;**別跟語音的 `SPEECH_ALIASES` 混用**——那是給辨識誤判的)。
- 接線:`askType`/`askFlashType`/`askPicType`(js/05)、`askSentenceCloze` 逐格(js/06)、王的 `sentence_cloze` 與拼字(逐詞)(js/09)、`bossWrongIds`(容錯內的詞不算拼錯、不冤枉進惡補)。
- `finish(right, w, picked, note)` 加第 4 參 `note`:typo 過關時綠框顯示「差一點!正確拼法是 X」,仍秀正確拼法(工作軌目標之一=看得懂正確寫法)。sentence_cloze 過關但有 typo → `正解:` 行顯示。
- 驗(8183 console):exact/短字精準 false/換位 typo/差2 false/**quite→quiet 被守衛擋(別的真字)**/長字 tol2/同音別名/BANK 熱抽 6 題全對。

### 工作王九宮格:拼寫辨識 → 意義辨識
- 為什麼(使用者點破):工作軌**刻意不練寫**,王卻用「從一堆錯字挑對的拼法」考你 → 考一個你沒訓練的技能,結果要嘛送分(錯字都圍著正解一叢、一看就中)、要嘛靠猜(每個錯字都眼熟)。
- `js/09` `bossGridWordQuestion` 文字模式改**看 `trackSkillOn('write')` 分軌**:
  - 不練寫的軌(工作):誘答改成**別的真字**(bossPool 撈 8 個、`zh` 不撞),提示中文「選出對應的英文」→ 考意義,要真的知道哪個對應才選得出。
  - 練寫的軌(日常):維持原本「挑正確拼法、避開相似錯字」(`bossTypoTraps`),對它才是合理驗收。
- 驗:工作軌 6 題全 recognition(cell 全真字、剛好 1 對);日常軌仍 SPELLING(5 個 typo trap);零 console error。

## 2026-07-03(傍晚 / Claude Opus 4.8)— 轉換題稀有化 + 排句家族防連發(前期手感)

### 問題(使用者實玩回饋)
前期常玩到「一堆位置互換的詞」——轉換題(`sentence_transform`:This is a cat ↔ Is this a cat?)出太頻繁,同一批字反覆搬來搬去,「很沒誠意」。

### 根因(`js/08` ask 出題器)
1. `sentence_transform` 說階權重 20、且**沒有每關上限** → 字一到說階(mastery≥34,前期很快)就變常客。
2. 防連續題型的邏輯把 `sentence_build` / `sentence_transform` 當**不同**題(都 `skill:'read'` 但 `run` 不同)→ 出現 `build→transform→build` 這種「都在重排同批字」的鏈,單調。

### 修法(純節奏,引擎結構不動)
- **轉換題每關上限 1 次**:新增 `transformsThisLevel`(`js/08` 宣告、`js/01` `startLevel` 歸零、ask 選到就 +1);pool 建好後若已達上限就濾掉 `sentence_transform`(留有其他選項才濾,不會清空)。
- **排句「家族」防連發**:`ARRANGE_FAMILY = {sentence_build, sentence_transform, sentence_speak}`(都是「重排/唸同一批字」的體感)+ `formatFamilyOf(id)`;反單調過濾**最前面加兩層**「別跟上一題同家族」,湊不到才退回原本各層(前期只剩句子題時仍有保險、不清空)。
- **轉換題降權** 20→10:就算合格也別急著霸位,搭配上限 → 當偶爾的 aha。

### 驗(8183 console 模擬 ask 選題 3 關×14 題)
- 轉換次數:**每關剛好 1 次**(原本可多次)。
- 排句家族連發:**0**(build/transform 不再連鏈)。
- 真實碼:`formatFamilyOf` 三個句子題型都歸 'arrange'、`transformsThisLevel` 為全域 number、零 console error。

### 誠實備註(沒動、留給之後判斷)
「純功能詞階段」(this is a ___ 膠水批)`sentence_build` 權重刻意 90(該階本來就靠排句學結構),所以**那一階仍會偏排句**——但轉換題不再霸屏。若之後覺得連 `build` 本身前期都太重,那是另一個更大的取捨(擴前期句型變化 / 降 90),要動再喊,不在這輪偷改。

## 2026-07-03(傍晚 2 / Claude Opus 4.8)— 新題型 Q1:整段英文 → 選意思

### 動機
補「排詞造句(產出)」缺的反方向——**看懂整句(理解/辨識)**,直接接使用者擔心的「讀真信件看不懂」;辨識題、不逼拼字、兩軌通用;也順便補前期變化(非排句家族)。屬「第 1 類」低成本:句子和中文引擎現在就在生,誘答還能自動生。

### 做法(`js/06` + `js/08`,引擎不動)
- 新增 `askSentenceMeaning(w)`(js/06):給一句「學過字組成」的英文 → 選中文意思。
  - 取句:`sentenceWithWord(w) || pickBuildSentence`(優先含當前字,接複習)。
  - **誘答**:① `literalConcatZh` = 逐字直翻(把每個字的 `zh` 串起來,跟正解不同才用)—— 治「字都認得、合起來讀錯」的殺手誘答,還自動生;② 其他句子的 `zh`。湊不到誘答 → `askReadPick` 保險。
  - 原生 UI:`.opts`/`.opt`/`.sel`/`.right`/`.wrong` + `#submit .act`(點選定 + 確認才判)+ `.why` 結算;有 🔊 聽整句。
  - 答對:`creditSentence`(推 SRS + 幫組成字加分)+ `onCorrect(w)`(跟排詞造句一致);答錯:`onWrong(w)`。
- `FORMATS` 加 `{ id:'sentence_meaning', lv:2, skill:'read', tier:1, ok:canSentenceMeaning }`(js/08),**不在 ARRANGE_FAMILY** → 兼當破前期單調的辨識口味。

### 驗(8183 console)
- 日常軌:`water or tea?` → 選項含逐字直翻誘答「水或茶」vs 正解「水還是茶?」,4 選項剛好 1 對。
- `tea, please.` → 誘答「茶請」vs 正解「茶,請。」。
- 答對流程:選 → 確認鈕啟用 → ✓、正解格變綠、出繼續鈕;答錯流程:! 、標出正解綠格 + 選錯紅格。
- 工作軌:`I need more time.` 正常生題、兩條答題路徑都對。
- 零 console error。

## 2026-07-03(晚上 / Claude Opus 4.8)— 內容:救活孤兒動詞(日常軌第一批)

### 動機
日常軌 12 個動詞(look/listen/hear/say/go/come/bring/take/get/make/do/speak)沒有句型 → 只能當單字背、進不了句子 = 「後期重複」的根(HANDOFF 待辦 #1)。這批先救 4 個最乾淨的:**look / make / get / speak**(語法自然、幾乎不用加字)。

### 加了什麼(純資料,引擎不動)
- **3 個新字**(`js/00`):`at`(function,look at 用)、`English`/`Chinese`(noun,`language` flag,開頭大寫)。`why` 照台灣向口氣、使用者過目。
- **2 個新 flag**:`makeable`(加到現有 coffee/tea/bread/rice)、`language`(English/Chinese)。已補進 `CONTENT_RULES.md`。
- **4 個新句型**(`js/00` PATTERNS,都掛進 `BUILD_SENTENCE_PATTERN_IDS`@js/03):
  - `pat_i_look_at_noun` I look at a {x}.(visible)—— 順便把 look(主動看)vs see(看見)的差別做進句子。
  - `pat_i_make_noun` I make {x}.(makeable)
  - `pat_i_get_noun` I get a {x}.(buyable)
  - `pat_i_speak_language` I speak {x}.(language)
- **BATCHES 加批5**(`js/01`):`[at, English, Chinese]`。日常軌 51→54 字、4→5 批、build 句型 12→16。

### 驗(8183 console)
- 4 句型都生得出、且被 `pickBuildSentence` 真的抽到:I look at a friend / I make coffee / I get a book / I speak English。
- **token 一致性**:每句每個 token 都對得到一個 `BANK.en`(`creditSentence` 連帶加分 OK)。
- 語言字進不了 `This is a {x}`(無 presentable/countable);`makeable` 只在 coffee/tea/bread/rice(water/milk 沒給)。
- 零 console error。

### 還沒救的孤兒(留第二批,要先加名詞)
listen(→ music/to)、hear、say(→ hello/yes/no)、go/come(→ 地點 + home 特例)、bring/take、do。

## 2026-07-03(晚上 2 / Claude Opus 4.8)— 修:Boss 分類題標題疊字 + 倒數消失

### 現象(使用者實玩截到)
挑戰王的「分類突襲!」題:標題「分類突襲!」跟分類提示「選出所有可以加糖的飲料」**疊在一起**,且**倒數條(boss-timer)不見**。

### 根因(既有 bug,非本輪改動造成)
`css/04-boss.css` 只有 `boss-grid-mode` 的版面覆寫(把 arena 壓成自然高度、答題區吃 1fr),**沒有 `boss-category-mode` 對應規則**。分類題選項最多 8 個(2 欄高陣列),用預設 `.boss-layout`(`auto minmax(0,1fr) auto`)時,中間 arena 那格被高選項擠到趨近 0 → prompt/clue/timer 疊在一起、倒數條被擠掉。

### 修法(純 CSS,鏡像 grid-mode)
`css/04-boss.css` 新增 `#screen.boss-category-mode` 覆寫:`.boss-layout` 改 `auto auto minmax(0,1fr)`(arena 自然高度不再被壓)、arena `justify-content:flex-start`、prompt 縮小、clue `min-height:auto`、timer 加底色邊框、`.boss-answer` `overflow-y:auto`(選項多時可捲)。

### 驗(8183 console)
- 分類題 `.boss-layout` grid-template-rows → `auto auto minmax(0,1fr)`(修好);一般選擇題維持 `auto minmax(0,1fr) auto`(沒被波及,class 只在 category 時加)。
- 零 console error。
- ⚠ 環境限制:headless viewport 為 0×0、截圖逾時,無法像素級量位置;靠「grid 軌結構跟已知正常的 grid-mode 一致」佐證。請在 8182 目視確認。

### 順帶觀察(未修,留給之後)
分類題誘答會混入功能詞(with/or/please)當選項,對「選出可以加糖的飲料」略怪(雖是明顯錯的誘答)。屬內容/題目品質,非版面 bug。

## 2026-07-03(晚上 3 / Claude Opus 4.8)— 新增拼字記法(寫錯/差一點時上鉤子)+ 修容錯吞掉錯拼

### 動機(使用者:記不起來會自己拆,如 fri+end)
把「拆字記憶法」接到寫錯的當下(teachable moment),跟既有 `SYL_HINT`(音節答錯上記憶法)同精神,但針對「整個字」。

### 做法(`js/07` + `js/05`)
- `js/07` 新增 `SPELL_HINT`(word id → 拆字/記法),`markLetters` 秀完逐字母正解後,有記法就接一行藍字「記法:…」。跟 `why` 分開:why=意思(答對秀)、SPELL_HINT=拼字記法(沒拼對時秀)。先種 `word_friend`。
- **拆法可以是「巧合的」記憶鉤子**(friend 其實是 frēon「愛」的字,-end 是巧合),只拿來記、不當真字源規則 —— 呼應「別編會被亂推的假規則」。
- **★ 修一個兩功能打架**:拼字容錯會把 `frend`(friend 最經典錯拼)判成 `'typo'` 算對 → 走「對」的路 → `markLetters` 不觸發 → 記法永遠不會對這個錯拼出現。改成 **`if (res !== 'exact')`**(typo 或全錯都算「沒一字不差」)→ 兩種都秀正解字母 + 記法。呼應早先定的「容錯放過時一定把正確拼法秀出來」。

### 驗(8183 console,friend 三種輸入)
- `friend`(完全對):算對、不出記法。
- `frend`(容錯過的 typo):**算對**、但秀「差一點」+ 記法。
- `frnd`(差 2 個):算錯、秀正解 + 記法。
- 零 console error。

## 2026-07-03(晚上 4 / Claude Opus 4.8)— 修:回舊關學新字 + 分類/選意思題卡片被切

### Bug 1:這階還沒學完時,回去玩舊關卻在學新字(引擎邏輯)
- 根因:`enterLevel(lv)` 只設 `level=lv`,`buildLevel()` 一律照全域熟練度抓 `fresh`(新字),不管這關是不是「回頭玩的舊關」。
- 修(`js/01` buildLevel):`isReplay = level < meta.maxLevel`(不是最前線那關 = 複習)→ `fresh = []`,不引新字;空關保險也改「有新字才給新字,否則給已見過的字複習」。
- 驗:stage 未學完時,回舊關(level 8 < max 12)= 0 新字(只複習在學的字);最前線(level 12)仍導入 2 新字。

### Bug 2:分類題 / 選意思題最下面的卡片被底部操作列切掉(版面)
- 根因:`.lesson-answer` 是 `justify-content:center; overflow:visible`,內容比作答帶高時往上下溢出、被 `.lesson-screen` 的 `overflow:hidden` 切掉。
- 修:
  - **選意思題(`sentence_meaning`,本輪新題型)**:英文句 + 🔊 從「作答帶(body)」搬到「題目帶(stage/prompt)」→ body 只剩 4 選項,像一般四選一一樣塞得下(`js/06`)。
  - **分類題(既有,最多 8 選項)**:`.lesson-answer.category-answer` 改 `justify-content:flex-start; overflow-y:auto`(從上往下排、溢出可捲,不置中切上下)+ 縮小 `.category-title` 與選項高度(`css/03`)。
- 驗:選意思題句子已在 `.lesson-stage .prompt`、body 只剩選項;分類題 computed `justify-content:flex-start` + `overflow-y:auto`。零 console error。
- ⚠ 環境限制:headless viewport 0×0、截圖逾時,無法像素級確認實際塞得下;請在 8182 目視(分類題 8 選項、選意思題)。

## 2026-07-03(晚上 5 / Claude Opus 4.8)— 拿掉「可數/加 a」分類題(交給句型帶)

### 為什麼(使用者實玩點破)
`presentable` 分類題「選出所有可以放進 This is a ___ 的字」考的是英文可數性,但**可數性邊界太模糊**:方糖 = sugar cube、口語 two sugars / a coffee / a water 都成立 → 把 water/sugar/coffee 當「不可數、不算」會冤枉講得通的答案。改標籤也補不完(改過一版「水糖不算」反而更不誠實)。

### 決策(使用者選的第三條路)
不做成分類題,**可數/加 a 的觀念改由句型自然帶**:This is a cat.(加 a)vs I drink water.(不加 a)—— 學的人做句型時就在正確地練,而且句型永遠成立,不會踩到模糊邊界。符合本專案「文法靠造句自己懂、不背抽象規則」的信念。

### 改動(`js/03-feedback-choices.js`)
- 從 `CATEGORY_SETS` 移除 `presentable` 那條(留註解說明為何不做)。`presentable` flag 本身保留(`pat_this_is_a_noun` 的 slot 還在用),只是不再出分類題。
- 其餘乾淨分類保留:drinkable / sweetenable / eatable / emotion / ownable。

### 驗(8183 console)
- 生 30 題分類 → 只出 ownable/sweetenable/drinkable(等乾淨類),再也不出 presentable。
- `This is a cat.` 句型照常生得出(可數觀念沒消失,只是移到句型)。零 console error。

## 2026-07-04(Claude Opus 4.8)— 配對題不再撈功能詞(治「with ↔ 加」脫離語境的錯對照)

### 現象(使用者實玩)
配對題出現「with ↔ 加」。使用者點破:照字面推「1 with 1 = 1+1」不通 —— 中文「加」一詞多用(加糖 vs 1加1),但 with 只有「加糖/附帶」那種、沒有數學相加。標籤「加」其實對「coffee with sugar = 咖啡加糖」的語境是對的,問題在**把功能詞單獨拿出來配對**(脫離語境),違反本專案「功能詞只在句子裡學」的原則。

### 根因(`js/05` askMatch)
配對誘答主池是 `pos === w.pos`(w 一定是實詞 → 已排除功能詞);但**同詞性不夠 3 個時的 fallback** 撈「任何教過的字」,把功能詞(with/is/a/my/or…)拉進配對。

### 修
- `js/05` askMatch fallback 加 `x.pos !== 'function'` → 功能詞永不進配對。
- `js/08` FORMATS `match` 的 ok 一致化:要有 `≥2 個實詞`(排除功能詞)才 offer,免得只剩功能詞時湊出退化的單組配對。
- `with.zh = "加"` 不動 —— 它在唯一用到 with 的句型「coffee with sugar / {x}加{y}」語境裡是對的;錯的是脫離語境展示,不是 gloss。

### 驗(8183 console)
- 逼 fallback 狀態:配對不再出現功能詞。
- 實詞充足時:每題 4 組全實詞(coffee/cat/home/English…)。
- 零 console error。

## 2026-07-04(2 / Claude Opus 4.8)— sugar 拿掉誤導圖示(🍬 是 candy 不是 sugar)

### 現象(使用者實玩)
使用者看到 sugar 的圖示問「sugar 是不是也叫 candy?」。查:`EMOJI.word_sugar = "🍬"` —— 🍬 是**糖果(candy)**,不是**砂糖(sugar)**。中文「糖」同時指原料糖(sugar)和零食糖果(candy),英文分開;圖示畫成 candy → 教錯聯想。

### 修(`js/04-visuals.js`)
- 移除 `word_sugar:"🍬"`。沒有好的「砂糖」emoji(🧂=鹽、🍬=糖果),照「沒好圖的字不出看圖題」原則乾脆不掛圖;sugar 靠「coffee with sugar」語境學。
- 驗:`visualOf(sugar)=null`、picture 題不再出 sugar;coffee/water 等其他 emoji 沒被動。零 console error。

### 備註(內容 backlog)
若之後要教「糖果」,`candy` 是**另一個字**(糖果,eatable),跟 sugar(砂糖,sweetener)分開收 —— 正好也是「一中文(糖)對多英文」的好教材。

## 2026-07-04(3 / Claude Opus 4.8)— 加 get 自製圖 + 補圖檔 fallback

### 使用者提供 get 的 pixel 圖(手接箱子=得到)
- `js/04` IMG 登錄 `word_get:'img/get.png'`。語意準(往手裡收=get),pixel 風對 8-bit 調性。
- ⚠ 註記:之後加 take(拿走)/bring(帶來)的圖要畫「不同方向」,別三個「手+東西」動詞撞視覺。
- **圖檔待放**:使用者要自行存 `img/get.png`(去背透明)。程式碼已登錄,放檔即生效。

### 順手修:picHTML 的「沒檔 fallback」名不副實
- 註解一直寫「沒檔 onerror 自動 fallback 回 emoji」,但 `<img>` 根本沒有 onerror → 缺檔會顯示破圖。
- 補 `imgFallback(el, wid)`:圖檔載入失敗 → 有 emoji 退 emoji、沒有就移除(不留破圖)。picHTML 的 img 加上 `onerror`。→ 以後登錄自製圖即使檔還沒到,也只顯示空白不破圖。
- 驗:visualOf(get)=img/get.png、picture 題會出 get、picHTML 含 onerror、imgFallback 存在、house 等既有圖沒被動;零 console error。

## 2026-07-04(4 / Claude Opus 4.8)— sugar 換成正確自製圖(一碗白方糖)

- 使用者用 GPT 生了一張「一碗白方糖」的 pixel 圖 → 正確表達 sugar(砂糖),取代先前誤導的 🍬(candy)。
- `js/04` IMG 登錄 `word_sugar:'img/sugar.png'`。**圖檔待放**:使用者要存 `img/sugar.png`(去背)。
- 驗:visualOf(sugar)=img/sugar.png、picture 題會出 sugar、get 圖沒被動;零 console error。
- 觀念:圖是 GPT 生的 → 瓶頸從「畫得累」變「清不清楚」。具體字(sugar/sad/tired)划算加;take/bring 卡在「方向要參考點」的字本身問題,生再多也沒用 → 維持不畫、交句子。

## 2026-07-04(5 / Claude Opus 4.8)— 轉換題:標題被卡片蓋 + 「a」念成字母 A

### Bug 1:轉換題標題「改成問句…」被直述句卡片蓋住
- 根因:`mountArrange` 的 body 內容(轉換題多一張 `.transform-intro` 直述句卡 + slots + bank)較高,而 body 是預設 `.lesson-answer`(`justify-content:center; overflow:visible`)→ 太高就往上下溢出,往上蓋到題目帶標題。(跟先前分類/選意思題同類。)
- 修:`js/06` mountArrange 給 body 加 `build-answer` class;`css/05` `.lesson-answer.build-answer { justify-content:flex-start; overflow-y:auto; }` → 從上往下排、溢出可捲,不往上蓋標題。

### Bug 2:排詞塊「a」放上去念成字母 A(應為 schwa「uh」)
- 根因:`js/06:88` 放塊時 `speak(card.text)` 是原始 token,`SPEAK_AS`(a→uh)只有 `speakSentence` 有套。
- 修:`js/03` 新增 `speakWordText(text)`(單 token 也套 SPEAK_AS);mountArrange 放塊改用它;順手把 `mountChoices` 選項發音改 `speak(SPEAK_AS[o.id]||o.en)`(選項若是 a 也不念字母)。
- 驗:speakWordText('a')→'uh'、book/This 不變;轉換題 body computed `justify-content:flex-start`+`overflow-y:auto`+有 build-answer。零 console error。
- ⚠ headless 0×0 量不到像素,標題不疊請在 8182 硬重整目視。

## 2026-07-04(6 / Claude Opus 4.8)— 選句子改「依句型平均」(治九成都 This is a + 漏掉 I am happy)

### 現象(使用者重玩 6~10 關十次)
近九成句子題都是「這是一個 ___」;而「I am happy」幾乎不出現 → 若一路按「我已經會了」打完階段王,就整句沒學到。

### 根因
`pickBuildSentence` / `pickTransformSentence` 都是「把所有句型的變化攤平成一串再隨機抽」。「This is a {noun}」有 cat/book/friend/house 四個可填 → 變化多;「I am happy」只有 happy 一個 → 被稀釋。實測:I am happy 只被抽中 6/100,This is a / my 各 20+。

### 修(`js/03` + `js/06`)
- 新增共用 `pickSentenceByPattern(patterns, sourceWords, filter)`:**先「均勻」挑句型(避開上一題的句型 → 不連發)、再從該句型挑 fresh 句子** → 每個句型機會均等,不被多變化句型稀釋。
- `pickBuildSentence` / `pickTransformSentence` 都改用它。
- 驗(200 抽):build 六句型各 ~30(I am happy 6→30)、同句型連發 1/200;transform 三句型各 ~67(I am happy 拉到與 This is a 齊平)。→ I am happy 不再被埋、不會漏學;This is a 不再霸屏。零 console error。

### 另兩件(本輪未動)
- 轉換題卡片後「會亮+有 tooltip 的框」:確認是「有互動+懸浮提示」的元素(非純視覺),但 headless 0×0 看不到像素;待使用者回報 tooltip 文字即可定位。
- 「我已經會了」skip 讓句型可完全跳過 = 設計上的 skip 本意;但配合本次「I am happy 會正常出現」,已不會「根本沒機會遇到」。

## 2026-07-04(7 / Claude Opus 4.8)— 分類題不用下拉 + 轉換題別稀有到消失

### Bug 1:分類題變成要下拉(承接前面「可捲」修法的副作用)
- 前面把分類題改 `overflow-y:auto` 治「卡片被切」,但選項最多 8 個 → 一頁塞不下、跑出捲軸。
- 修:`js/03` 主線分類題 `categoryQuestionForWord` 傳 `maxOptions:6` → 最多 6 個(2 欄 3 列)一頁塞得下,捲動只當保險。驗:連生 12 題都恰好 6 個。

### Bug 2:「is this」轉換題消失(玩到 12 關沒遇到)
- 根因:前面「轉換題稀有化」調過頭 —— 每關上限 1(對)+ 權重砍半 20→10 + 放進 arrange 家族被 build 壓抑,三個疊起來 → 混合 recipe 下 12 關幾乎抽不到。
- 修(`js/08`):① 轉換題**移出 `ARRANGE_FAMILY`**(它已被「每關上限 1」擋住連發,不需要再被家族壓);② 權重 10→**18**(上限已防霸屏,拉回來讓它「可靠地每關出現一次」)。
- 驗(真 ask() 混合 recipe 跑 12 關):轉換題出現在 **8/12 關**(之前近乎 0)、每關至多 1 次。零 console error。

## 2026-07-04(8 / Claude Opus 4.8)— 單字特訓:卡死 40% 無限練習 + 「我學會了」鈕出框

### Bug 1:特訓卡在 40%、無限練習、不會結束
- 根因:①特訓只有按「我學會了」才移除字,否則永遠循環;②進度條 `updateBar` 算的是「主回合 quota」,特訓不碰它 → 凍在進特訓前的值(40%)不動。
- 修:
  - `js/08` `trainNext` 開頭 `trainPool = trainPool.filter(w => !isLearned(w))` → **練到 100% 的字自動畢業**(特訓本來就是挑「沒滿 100%」的字);清空 → `trainingDone`,不再無限。
  - `js/03` `updateBar` 加 `inTraining` 分支:進度 = (原本選的字 − 剩下的)/ 原本;`js/01` 加 `trainTotal`、`startTraining` 設定、`trainAsk` 每題 `updateBar()`。
- 驗:選 3 字 → 練滿 1 個 bar 0%→33%、練滿全部 → 顯示「特訓完成」、`inTraining=false`。

### Bug 2:特訓「✓ 我學會了,移除」鈕飄出操作列外
- 根因:說題左下已有 `跳過說題`(sideact),特訓再把「我學會了」(sideact)**堆在它上面**(bottom:110px),兩顆 64px 鈕疊起來超過 150px 操作列高 → 上面那顆頂出框。
- 修:`js/08` `injectTrainKnown` 改成**特訓時把「跳過說題」收掉**(它在特訓多餘:答題 / 我學會了 都能往下),「我學會了」回到單顆預設位置(bottom:34px)→ 不疊、不出框。
- 驗:模擬有 skipspeak 時,injectTrainKnown 後 skipline 隱藏、trainknown 無堆疊 bottom。零 console error。

## 2026-07-04(9 / Claude Opus 4.8)— 排詞霸屏 + 跳過說題誤刪 + 特訓自選技能

### Bug 1:排詞造句(4種)霸屏 6~10 關,近乎看不到別的
- 根因:`sentence_build` 說階權重 40,辨識/聽/看圖類只有 1 → 排詞是它們的 40 倍,~九成都排詞。
- 修(`js/08` wt):`sentence_build` 40→16、`sentence_speak` 18→12(要麥克風別過重);辨識類「差一階」floor 1→2.2。
- 驗(混合 recipe 12 關):排詞從 ~90% 降到 **15%**;readpick/listenpick/picture/match/sentence_meaning 都回來了、轉換題也在。

### Bug 2(認錯):上一輪在特訓拿掉「跳過說題」→ 沒麥克風的人卡死
- 「跳過說題」是給沒麥克風玩家的逃生口,不能拿掉。還原它。
- 重疊改用「兩顆都壓矮貼底」:`js/08` injectTrainKnown 把 skipspeak + trainknown 都設 `min-height:46px`、bottom 22 / 76 → 兩顆 top(68 / 122)都 < 150 操作列,不出框也不疊。(⚠ headless 0×0 量不到像素,靠數學;請目視確認。)

### 新功能:特訓自選技能(聽/說/讀/寫/混合)
- 動機(使用者):去特訓是因為關卡要寫、寫不出來,結果特訓混合出題幾乎不給寫題。
- `js/01` 加 `trainSkill`;`js/10` showTrainPicker 加技能選擇列(混合/聽/讀/說/寫,`.tskill` 樣式在 `css/06`);`js/08` trainAsk 依 `trainSkill` 濾題型(該字沒有該技能題型才退回混合)。
- 驗:寫模式 40/40 全是 write 題、聽模式 40/40 全是 listen 題。零 console error。

## 2026-07-04(10 / Claude Opus 4.8)— ★真根因:學會的字被「硬走排字」攔截 → 整階只出排字、轉換題 0

### 現象(使用者玩 20 場)
6~10 關近乎每題都排字造句,之前修好的轉換題「這是一隻貓嗎?」完全不出現;前一輪的權重調整看起來完全沒作用。

### 真根因(`js/08` ask())
`ask()` 對「學會又默寫過的字」有一條**優先攔截**:`if (isLearned(w) && wroteOk(w)) return askBuildSentence(...)` —— **一律排字、完全跳過題型池**。6~10 關(字都學會了)每一題都走這條 → 100% 排字、轉換題/辨識/聽 永遠 0。之前所有「權重」修改都在題型池裡,學會的字**根本到不了那段**,所以無效。

### 修
- 移除該攔截:學會的字也走題型池(句子仍是複習重點,靠 sentence_build/transform/speak 的高權重維持;SRS 由 onCorrect 對學會的字照推;補考用 FORMATS 各自的 run,不會踩舊「sourceWords.map」雷)。
- 配合把寫階句子權重降一點、辨識 floor 拉高:`sentence_cloze` 18→8、default `d===2` 0.4→1.5。

### 驗(對「全學會」的字跑 15 關,mixed recipe)
- 排字 **100% → 16%**;句子類合計 41%(仍是重點、非全部);辨識/聽/看圖 16%;轉換題出現在 **14/15 關**;18 種格式都有。零 console error。

## 2026-07-04(11 / Claude Opus 4.8)— 轉換題排版:原句卡搬上題目帶(不再上下捲)

### 現象
轉換題比別的題型多一張「原句參考卡」(This is a house / 這是一個房子 / ↓改成問句),塞在作答帶 → 內容太高、冒上下捲軸(前面用 overflow-y:auto 擋蓋標題的副作用)。

### 修(`js/06` mountArrange + `css/05`)
- mountArrange 渲染後,把 `.transform-intro`(原句卡)從作答帶(#body)DOM-move 到題目帶(`.lesson-stage`)→ 作答帶只剩「buildzh + 格子 + 字塊 + 確定」,跟一般排詞題**一模一樣**、塞得下、不用捲。(一般排詞沒有 intro 卡 → 此段是 no-op,不影響。)
- `.transform-intro` 限寬 680 + 壓扁 padding,在題目帶不佔太多高。
- 驗:askTransform 後原句卡在 `.lesson-stage`、不在 #body;#body 內容 = buildzh/slots/bank/buildactions(同一般排詞)。零 console error。
- ⚠ headless 0×0 量不到像素;結構已跟一般排詞一致(那個本來就不捲),請目視確認。

## 2026-07-04(12 / Claude Opus 4.8)— 分類題壓緊(不用捲)

### 現象(使用者)
分類題 6 個選項還是要捲;選項格子又寬又高、裝一個短字浪費一堆垂直空間。

### 修(`js/05` + `css/03`)
- 拿掉多餘的 `.category-title`(「可以說我的…的東西」)—— 跟題目「選出所有可以說成 my ___ 的東西」重複,省一整行(~36px)。
- 選項格子壓矮:`min-height` clamp 52~66 → 40~50、gap 縮小、字級略降。短字不需要大格子。
- 兩者共省 ~80px → 6 個選項一頁塞得下,`overflow-y:auto` 只當極矮螢幕的保險。
- 驗:分類題無 .category-title、選項 min-height 40px、≤6 選項。零 console error。⚠ headless 0×0 量不到像素,請目視確認不再捲。

## 2026-07-04(13 / Claude Opus 4.8)— 轉換題原句卡改純文字(拿掉 box)

### 使用者:「完全沒必要放卡,直接寫上去不好嗎?」
對。原句參考卡用了一個有邊框+底色+內距的 box,白佔一堆高度 → 題目帶太高、擠得作答帶還要捲。
- `css/05` `.transform-intro` 拿掉 background/border/padding/max-width → 純文字;`.transform-stmt` 30→26、arrow/zh margin 壓小。
- 驗:transform-intro computed 無底色/無邊框/無內距、在題目帶;作答帶只剩 buildzh/slots/bank(同一般排詞)。零 console error。⚠ headless 量不到像素,請目視確認不再捲。


## 2026-07-08(1 / Claude Opus 4.8)— ★ 日常軌字庫重編:10 個情境批(治學習曲線斷崖 + 孤兒動詞)

### 為什麼(整體檢查抓出的三個結構問題)
1. 54 字只有 31 字有編批,**23 字擠在自動接尾的最後一批** → 第 6 階一次倒出一面牆(定案是每批 ≤5)。
2. **孤兒動詞一堆**(go/come/say/take/bring/hear/do):教了卻沒句子可用,違反「讓英文有道理」初衷;project/experience 會生出「這是一個專案」給零基礎玩家。
3. 動力迴圈太薄(另開 Step 2 處理:情境完成卡)。

### 改了什麼
- **BATCHES(js/01)重編成 10 個情境批**(每批=可完成的生活情境、實詞 ≤5、字進來當下就有句子用):點飲料/這是什麼/我的心情/肚子餓了/口渴了/我的家/上街/開口說/用耳朵/在家的一天。表在 CURRICULUM.md。
- **移出日常軌**:project、experience(工作軌的料)、do/come/bring/take/and(給不出自然句,等有句型再回來)。CONFUSE_PAIRS 死引用一併清(js/03,不然 fourOptions 會拿 undefined 當誘答)。
- **新字**:hello、music + 功能詞 to(EMOJI 掛 👋/🎵)。
- **新句型(js/00)**:I go home. / I say hello.(固定句)+ I listen to {x}.(listenable)+ I hear a {x}.(audible;cat 加 audible flag)。新 flags 記進 CONTENT_RULES.md。
- **中文修正**:「{x}, please.」的 zh「{x},請。」→「請給我{x}。」

### 驗(console,零 error)
- 字庫 50 字、全部編批、無孤兒字(每個實詞在自己的批解鎖當下就有句型可用)。
- 每階都有新句型解鎖(階1~10 各 1~4 條)。
- 50 關全曲線模擬:每階新字都在前 3 關引入、全教到、buildLevel 無爆。
- 新句型生成抽查:I go home./我回家。 I hear a cat./我聽見貓的聲音。 等全對。
- ⚠ BATCHES 變了,舊進度的 stage 對應會亂 → 建議 🔄 重來。

### 下一步(已跟使用者定案)
1. 「學會」門檻改嚴:默寫成功要「隔關再驗」(wroteClock + 下一關 SRS 再考一次寫,過了才算真的會寫)。
2. Step 2 動力迴圈:情境完成卡(「你會點飲料了 ☕」)、結算獎勵動畫、連擊。
3. Step 3 關卡畫面微整:選項配圖、答對回饋動畫、地圖標情境名。


## 2026-07-08(2 / Claude Opus 4.8)— ★ 隔關再驗 + 動力迴圈(情境完成卡/結算動畫/連擊)+ 教卡配圖

### A. 「學會」門檻改嚴:默寫隔關再驗(js/01、js/08)
- 使用者點破:「默寫過一次≠會 —— 失敗 10 次硬過 1 次只是短期記憶,下一題就忘」。
- 規則:第一次整字默寫成功 → 只記 `wrote` + `wroteClock`(當下 SRS 時刻),**不算數**;**下一關以後**(clock 有前進)再寫對一次 → `wrote2` = 「真的會寫」章。
- `wroteOk`(階段門檻/王門檻)改認 `wrote2`;`needsWriteProof()` 進補寫佇列(buildLevel needsWrite / ask 強制補寫 / completionRecipe / quota cap+score 全改吃它);同關剛寫過的不會被馬上重逼(clock 沒走 → false)。
- 補考(inReview)寫對不算的既有防線不動;`markWordKnown`(我已經會了)直接給 wrote2;**舊存檔自癒**:只有 wrote 沒 wroteClock 的老資料視為已驗(別把老玩家整階卡回去)。
- 過關 blocked 文案改「還有字沒寫穩(默寫要隔關再對一次才算真的會)」。
- 驗過:同關第二次寫對不蓋章 → 隔關 needsProof=true → 寫對蓋章;補考不算;自癒;markWordKnown 全對。

### B. 動力迴圈(js/01、js/03、js/08、css/02)
- **SCENARIOS 表**(js/01,跟 BATCHES 一一對應):icon/情境名/完成文案/招牌句;跟軌走(applyTrackContent 換,工作軌空 → 通用文案)。js/11 註冊 daily 帶 scenarios。
- **情境完成卡**:showDone 階段完成(ready)時改出情境卡 —— 大 icon +「第 N 階完成 — 你會點飲料了!」+ 這批招牌句(**點了會念**,speakSentence)+ 情境獎勵 +3 🪙。
- **結算熟練度動畫**:startLevel 快照 levelStartMastery → 過關結算條從舊值**長到**新值(css transition)+ 綠色 +N 漲幅。⚠ 用 setTimeout 不用 rAF(背景分頁 rAF 不跑)。
- **🔥 連擊**:主回合答對(教不算)combo+1、答錯歸零;≥2 顯示徽章(toprow 進度條旁)、每 5 連擊 +1 金幣(徽章帶 +1🪙 彈跳)。
- 驗過:連擊 5 → 徽章「🔥5 +1🪙」+金幣;答錯藏徽章;情境卡 heading/句子/+3 金幣/stage 推進;工作軌 fallback;條 25%→50% 會動。

### C. 關卡畫面微整(js/07、js/10、css/02、css/05)
- **教卡配圖**:有圖的字(visualOf)教卡在單字上方放圖(img 96px / emoji ~51px,比例跟教字走);沒圖不硬放。零基礎靠圖掛意思比中文翻譯黏。
- **答對回饋動畫**:.why 滑入 .26s + 打勾/驚嘆彈跳 .38s(短,每題播不吵)。
- **首頁/任務卡標情境名**:地圖標題「第 1 階・☕ 點飲料」(scenarioOf,沒編情境的軌退回字列表);任務卡副標「☕ 點飲料・飲料短語導入」。

### 沒動的
- 選項卡不配圖(會讓答案用圖猜出來,傷學習)。王戰/小遊戲不變。


## 2026-07-08(3 / Claude Opus 4.8)— 拆掉教假規則的分類題(my ___ / 可以加糖)

### 使用者實玩點破
分類題「選出所有可以說成 my ___ 的東西」把 coffee/tea/sugar 判錯 —— 但 my coffee / my tea 在英文完全成立(Where's my coffee? 再正常不過)。這題在教假文法;而且這種句型考題也沒教過就出。

### 修(js/03 CATEGORY_SETS)
- 定原則:**分類題只准考「真實世界的語意」**(這個字是什麼意思);句型模板的篩選 flag(ownable/sweetenable/countable…)是防怪句的工程手段、不是語言事實,**不得出題**。
- 拆掉 ownable(my ___)與 sweetenable(可以加糖的飲料;water 會被判錯,但糖水明明存在)兩題;留 drinkable/eatable/emotion(考字義,正當)。
- flag 本身不動(This is my {x} 等句型照用)。跟先前拆「可數/加 a」是同一個判例。
- 驗:全字庫抽 60 次分類題,只出 drinkable/eatable/emotion。


## 2026-07-08(4 / Claude Opus 4.8)— bread 拼成 bared 引出的拼讀修正

### 使用者實玩
把 bread 拼成 bared,說「這樣拚念起來也是對的吧🤣」。判錯本身是對的(bared 是真字,spellCheck 的「錯成別的真字判錯」防線正常);但暴露兩個教學洞:
1. **ea 規則會教錯音**:PHONICS 的 ea 標籤寫「多念長音 i」,劃重點畫在 bread 上會先看到錯的音(bread 的 ea 念短音 e)。
2. **br 子音串沒有記憶鉤**:字母順序錯(br vs bar)是零基礎典型錯,沒東西接住。

### 修
- **ea 拆兩條**(js/04-annotate.js):`ea_short`(only:bread/head/dead/ready/heavy/weather/breakfast/sweater)標「ea → 這裡念短音 e(跟 bed 一樣)」;原 ea 規則 exclude 同一批。驗:bread/head 拿短音標籤、eat/tea/read 長音、marksForError(bread,'bared') 挑出短音那條。
- **SPELL_HINT 加 bread**(js/07):「b + read —— 邊吃麵包邊讀書;br 是黏在一起的音,r 一定緊跟著 b(不是 bared)」。順手補 drink(dr+ink)。


## 2026-07-08(5 / Claude Opus 4.8)— 發音積木「第一次見面教一次」(治「拼讀塊沒人教過」)

### 使用者實玩推導出 phonics 本身
「英文不是單獨某一個音怎麼念,是一塊一塊的發音區塊去拼湊的吧?ea 是一組的對吧?」—— 對,這就是自然發音。系統早有規則表+虛線標註,但**從來沒人跟玩家說過這件事**(虛線默默躺著,第一次見 ea 沒人講「這是一塊」)。

### 修(維持「不開課、標註為主」的定案,只補「第一次要教一次」)
- `phonicsMarks` 的 mark 加 `ruleId`(契約相容的新增欄位)。
- 新函式 `firstTimePhonicsFor(w)`(js/04):教卡渲染時查這個字的拼讀塊,有「還沒亮相過」的規則 → 回傳那條並記進 `meta.phonicsSeen[ruleId]`;`annotMode==='off'` 不出。
- 教卡(js/07)在中文下方放一次性說明卡 `.teach-phonics`(🔍 發音積木 + label + note;霧藍色系,css/05);同一條規則之後只剩虛線+hover,不再打擾。
- 驗(五情境):tea 第一次出「ea→長音」/ eat 第二次不出 / bread 出「ea→短音」(不同規則)/ cat 沒拼讀塊不出 / annotMode off 不出。

### 備註
- 使用者說的「開頭只會有什麼、結尾只會有什麼」位置規則,規則表本來就用正則錨點編著(^dr、ck$、tion$),說明文字裡帶到即可。
- meta.phonicsSeen 全域(拼讀不分軌)。


## 2026-07-08(6 / Claude Opus 4.8)— 答錯註解拆掉「只有已學會的字才跳」門檻

### 為什麼
使用者問「答錯會講嗎?」→ 追查發現 `annotationErrorHTML` 有 `isLearned` 門檻:只有已學會(100%)的字答錯才跳「你錯的那點」註解。原設計理由是「學習中的字標記本來就顯示著」——但答題區故意純文字(顯示範圍規則),學習中的字答錯當下**畫面上什麼標記都沒有**,理由不成立。bread 拼成 bared 那次(學習中)就是這樣什麼都沒跳。

### 修(js/04 `annotationErrorHTML`)
- 拆掉 isLearned 門檻:**只要錯的那點有註解就跳**(答錯是最好的教學時機);`annotMode === 'off'` 仍尊重全關。
- 驗:bread(mastery 25,學習中)拼 bared → 跳「ea → 這裡念短音 e」;breag(錯的點沒註解)→ 不跳;annotMode off → 不跳。

### 現在的拼讀教學全貌(給下一個接手的)
1. **教卡第一次**:發音積木說明卡(每條規則一生一次,meta.phonicsSeen)。
2. **平時**:教卡/複習卡虛線 + hover 隨時可查(學會即隱藏,annotMode 三態)。
3. **答錯**:錯的那點有註解就跳那一條(不限學會與否)。


## 2026-07-08(7 / Claude Opus 4.8)— 治「前期一關只有 4 題」:quota caps 補到配方題數

### 使用者重玩點出
「關卡是不是有點固定然後都很短?前期一關只有 4 題?」量測證實:情境批(每批 3~5 字)之後,字少/字都學會的關 sum(caps) 塌掉 —— **句子應用關(配方 14 題)縮到 4 題**、克漏字/王前整理關也只剩 4 題。原因:每字的單關重複上限(caps)在字學會後掉到 1,配方的 questions 根本到不了。

### 修(js/01 buildLessonQuota)
- caps 輪流 +1 補到 recipe 要的題數;每字仍封頂 `HARD_CAP = 5`(單關別拿同一個字磨爛)。句子應用/王前整理「多練幾輪」本來就是那兩關的目的。
- 驗(L1~L15 模擬):L1 18(特製導入關,原樣)/認字聽音 8/克漏字 10/句子應用 14/王前整理 10,單字重複最多 3~4 次;「補完最後一個字」小關維持 4 題(刻意的快速補洞關)。
- 「每關角色固定」(導入→認字→克漏→句子→整理)是 2026-06-29 定案的節奏骨架,不動;變化維持在材料層(題型池/句子/干擾項)。


## 2026-07-08(8 / Claude Opus 4.8)— 治「本階單字練得比回顧少」(第4階狂出請給我茶)

### 使用者實玩(第4階第19關)
「新東西都沒啥練到,一堆舊題一直出(茶+糖/請給我茶),本階單字反而比回顧少。」三個因素疊出來:
1. 上一筆的 quota 補題是「所有字輪流 +1」→ 到期舊字被加到跟本階字一樣多(自己造的)。
2. 句子應用/王前整理關的 buildLevel 沒優先抓本階字 → 本階字學會後不在 active,關卡被到期舊字填滿。
3. `pickSentenceByPattern` 均勻挑句型 → 第4階句型池 8~9 條只有 2~3 條跟本階有關,舊句天然佔七成;挑中句型後 slot 又隨機填(I am ___ 只有 1/4 機率填 hungry)。

### 修
- **buildLevel(js/01)**:sentence/review 角色的關,本階字(含已學會)在補默寫/到期複習**之前**進場 —— 應用關的主角是本階。
- **quota 補題改優先序(js/01)**:本階字先吃滿(封頂 5)→ 學習中舊字(4)→ 已學會舊字最後且**單關最多 2 次**(複習點到為止)。
- **句子挑選偏重本階(js/03)**:`patternTouchesStage`(requires 有本階字 or slot 收得進本階已教字)→ 7 成機率只從本階相關句型挑(3 成照舊,舊句仍回鍋);同句型內再優先「含本階字」的句子(I am ___ 第4階優先填 hungry);pickFresh 避重複照舊。
- 驗(第4階L19模擬):levelWords 本階4字全進場;quota 本階 10 題 vs 舊字 4 題;句子含本階字 40%→**71%**;連續 6 題 = I eat rice/I am hungry/I eat bread 為主、tea with sugar 穿插,無連發。


## 2026-07-08(9 / Claude Opus 4.8)— 治「越後面關卡題目越少」:長度跟字數掛鉤 + 階段加成

### 使用者實玩
「前面一關十幾題一堆重複的,後面到 13 關左右一關十題有時不到。」攤開數字:L1 = 4 個字磨 18 題(單字平均近 5 次 → 狂重複);後期批次小、字學得快 → 第 3 關常變 4 題補完小關 + 導入關固定 6 題 → 體感越玩越短。

### 修(js/01)
- **buildLessonQuota 的 desired**:上限跟字數掛鉤(`字數×3+2`,L1 18→14 單字平均 ~3 次)+ **階段加成**(`+(stage-1)` 封頂 +4、總長封頂 16)→ 後期關卡不再比前期短。
- **buildLevel 到期複習名額**:前期 ≤2 → 隨階段放寬到 ≤4(`2+⌊(stage-1)/2⌋`)。每個舊字單關仍最多 2 題(上一筆的 bumpMax)→ 是「更多不同舊字」不是同字灌爆。
- 驗(L1~L25 模擬):階1 = 14/8/10/14/10,階4 = 9/11/8/16/13,階5 = 10/12/5/16/14 —— 遞增;補完小關(5~8題)維持刻意的短。


## 2026-07-08(10 / Claude Opus 4.8)— 分類題可背 + 寫過沒記錄 + 補寫不平均(L19 實玩三連修)

### 使用者實玩點破三件事
1. **分類題答案固定可背**:「答過一次就知道一定要選滿幾個、而且一定是哪幾個」—— 原本正解=全部符合的字(固定那幾個)、選項總數固定 → 變成背格子數。
2. **明明寫過很多次還說不會寫**:句子克漏字是「精準打出整個字」的產出,但只算鷹架不記 wrote → 一階打完系統還說一堆字要補寫。
3. **補寫不平均**:needsWrite 佇列按 BANK 固定順序取前 2 → 永遠先補同兩個字,其他字排不到。

### 修
- **分類題(js/03)**:正解數隨機(2..4,不再全部正解都上場)、干擾數也隨機 → 總選項數浮動,「數格子」失效。
- **creditWrite(js/01)**:抽成共用函式(wrote→wroteClock→隔關 wrote2);句子克漏字(js/06)整題對+目標字那格**精準**(typo 容錯不算)+不在補考 → 也走 creditWrite。定義回歸「產得出來就算」,不管在哪種題型產出。
- **needsWrite shuffle(js/01)**:補寫佇列洗牌,輪得到每個字。
- 驗:分類題 40 抽=2~4對/4~8選項全分布;克漏字第一次打對 wrote=true、隔關再打對 wrote2=true。

### 記錄:句子重複感(「二十幾關只出我吃什麼/這是我的什麼/我很累」)
機制修完後這是**內容量**問題:每階只解鎖 1~4 條新句型、slot 池小(eatable 只有 rice/bread)。下一個最高槓桿 = 擴 PATTERNS/字(HANDOFF 待辦 #1 的本體),不是再調權重。


## 2026-07-08(11 / Claude Opus 4.8)— ★ 句型大擴充:每階一個新「句子形狀」,生活文法核心一次補齊

### 為什麼(使用者定調「一次擴足」)
玩到 22 關點破:「到第四階句子形狀只有四種(名詞短語/This is/I am/I+動詞),轉換題不算新句型,好沒新意」+「每次擴一點點就要重玩一次太拖」。→ 一次把生活常用句型補齊,塞進現有 10 階(關卡量足夠)。

### 加了什麼(19 → 40 條句型)
- **新形狀按階分佈**:階2 wh 問句+回答(What is this? / It is a {x}.,it 可轉換 Is it…?)/ 階3 be 否定(I am not {x}.)+ 第二人稱(You are {x}. → Are you…? 純調頭可轉換)/ 階4 **do 問句 + do not 否定**(Do you eat {x}? / I do not eat {x}. —— 跟 be 動詞「調頭變問句」的對比是大 aha)/ 階5 do 形狀套 drink / 階6 **形容詞前置**(This is a {a} {x}.,中文語序相同)+ where 問句(Where is my {x}?)/ 階7 want(I want a {x}. / Do you want {x}?)/ 階8 Do you speak {x}? + 否定 / 階9 Do you hear a {x}? + 回應句「累了聽音樂」/ 階10 This is not {x}. + What do you want?(積木合體收尾)。
- **新字**:功能詞 what/it/not/you/are/do/where(靜默教,批2/3/4/6)+ 實詞 want(批7)。do 以功能詞身分回歸(發問引擎,不是動詞「做」)。
- **★ 補掛前次漏洞**:I go home / I say hello / I listen to music / I hear a {x} 四條**當初沒掛進 BUILD_SENTENCE_PATTERN_IDS,從沒出現在排句題**。這次連新句型一起掛齊;轉換清單 +you_are/it_is;回應清單 +resp_feel_music。CURRICULUM 記了「掛新句型的三張清單」防再犯。

### 驗證(console,零 error)
- 結構:52 字全編批、無孤兒字、40 條句型 requires/slot/token 全通、三張清單雙向檢查(掛的都存在、該掛的都掛了)。
- 每階新句型:階1~10 = 3/4/3/4/4/2/7/4/4/2 條(形容詞前置類在批6 slot 齊才浮出,不在此計)。
- 抽樣分布(每階句子應用關 150 抽):可用句型幾乎全抽得到,最大宗 ≤27% 且都是本階新句型(偏重本階生效)。
- 全程 50 關曝光:40 實詞**全部有練到**,中位數 9 題直接曝光(句子題另會帶到);批1 偏高(water 66)= 第一階 4 個字撐 5 關的結構性現象,教學階可接受。
- 新句型生成抽查 15 條全對;轉換 It is a cat. → Is it a cat? ✓。
- ⚠ 模擬時踩的坑記著:`localStorage.clear()` 不清記憶體的 `store`,連續 console 模擬要 `Object.keys(store).forEach(k=>delete store[k])`,不然上一輪的髒狀態會造成假 bug(這次差點誤判成「第5階後新字進不來」)。

### 需要重來
批次動了(膠水詞加入批2/3/4/6、want 進批7)→ 舊進度對應會亂,🔄 重來。
