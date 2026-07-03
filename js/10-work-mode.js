// ══════════════════════════════════════════════════════════════════════════
// 工作軌內容(多軌引擎):給主線引擎吃的 BANK / BATCHES / PATTERNS。在 js/11 註冊成 'work' 軌。
// 首頁「💼 工作英文」分頁 → setTrack('work') → 主線同一套關卡/題型/王/SRS 直接跑這批內容。
// 目前 = 主題 1、2(不懂就問 / 回報狀態)。擴內容 = 往下加字進 WORK_BANK/WORK_BATCHES、加句進 WORK_PATTERNS。
// (舊的固定 13 關浮動小引擎已於多軌化後整段退役移除;歷史見 CHANGELOG。)
// ══════════════════════════════════════════════════════════════════════════
const WORK_BANK = [
  // 主題 1「不懂就問」實詞
  { id:"work_need",       en:"need",       zh:"需要",        pos:"verb", flags:[],            syl:["need"],             why:"need + 名詞 / need to + 動作:I need help、I need to check。" },
  { id:"work_time",       en:"time",       zh:"時間",        pos:"noun", flags:[],            syl:["time"],             why:"不可數,不加 s:more time、no time。" },
  { id:"work_explain",    en:"explain",    zh:"解釋",        pos:"verb", flags:[],            syl:["ex","plain"],       why:"跟人把一件事說清楚。" },
  { id:"work_understand", en:"understand", zh:"懂 / 理解",   pos:"verb", flags:[],            syl:["un","der","stand"], why:"沒聽懂用 I don't understand,不是 I don't know。" },
  { id:"work_part",       en:"part",       zh:"部分",        pos:"noun", flags:["countable"], syl:["part"],             why:"this part = 這一部分,指其中一段。" },
  { id:"work_check",      en:"check",      zh:"確認 / 檢查", pos:"verb", flags:[],            syl:["check"],            why:"Let me check = 讓我確認一下,先爭取時間。" },
  { id:"work_again",      en:"again",      zh:"再一次",      pos:"adv",  flags:[],            syl:["a","gain"],         why:"放句尾:try again、say it again。" },
  // 主題 2「回報狀態」實詞
  { id:"work_fix",        en:"fix",        zh:"修好 / 解決", pos:"verb", flags:[],            syl:["fix"],              why:"I'll fix it now = 我現在會修好;過去式 fixed。" },
  { id:"work_fixed",      en:"fixed",      zh:"修好了",      pos:"verb", flags:[],            syl:["fixed"],            why:"fix(修好)的過去式;I fixed the bug = 我修好了那個錯誤。" },
  { id:"work_bug",        en:"bug",        zh:"程式錯誤",    pos:"noun", flags:["countable"], syl:["bug"],              why:"軟體的錯就叫 bug;fix the bug = 修好那個錯。" },
  { id:"work_work",       en:"works",      zh:"運作 / 能動", pos:"verb", flags:[],            syl:["works"],            why:"it works = 它可以運作(第三人稱加 s);不是只有「工作」的意思。" },
  { id:"work_computer",   en:"computer",   zh:"電腦",        pos:"noun", flags:["countable"], syl:["com","pu","ter"],   why:"on my computer = 在我的電腦上。" },
  { id:"work_problem",    en:"problem",    zh:"問題 / 故障", pos:"noun", flags:["countable"], syl:["prob","lem"],       why:"比 question(提問)更像「麻煩 / 故障」。" },
  { id:"work_update",     en:"update",     zh:"回報進度",    pos:"verb", flags:[],            syl:["up","date"],        why:"I'll update you = 我會跟你回報最新狀況,不只是軟體更新。" },
  { id:"work_later",      en:"later",      zh:"晚點 / 稍後", pos:"adv",  flags:[],            syl:["la","ter"],         why:"放句尾:update you later、call you later。" },
  { id:"work_here",       en:"here",       zh:"這裡",        pos:"adv",  flags:[],            syl:["here"],             why:"is here = 在這裡,指位置。" },
  // 膠水詞(功能詞:不出教卡、不單獨考,只在句子裡學)
  { id:"work_i",     en:"I",     zh:"我",         pos:"function", flags:[], syl:["I"] },
  { id:"work_you",   en:"you",   zh:"你",         pos:"function", flags:[], syl:["you"] },
  { id:"work_it",    en:"it",    zh:"它",         pos:"function", flags:[], syl:["it"] },
  { id:"work_the",   en:"the",   zh:"這個",       pos:"function", flags:[], syl:["the"] },
  { id:"work_my",    en:"my",    zh:"我的",       pos:"function", flags:[], syl:["my"] },
  { id:"work_me",    en:"me",    zh:"我",         pos:"function", flags:[], syl:["me"] },
  { id:"work_is",    en:"is",    zh:"是",         pos:"function", flags:[], syl:["is"] },
  { id:"work_will",  en:"will",  zh:"會 / 將",    pos:"function", flags:[], syl:["will"] },
  { id:"work_on",    en:"on",    zh:"在⋯上",      pos:"function", flags:[], syl:["on"] },
  { id:"work_let",   en:"Let",   zh:"讓",         pos:"function", flags:[], syl:["let"] },
  { id:"work_could", en:"Could", zh:"可以(客氣)", pos:"function", flags:[], syl:["could"] },
  { id:"work_dont",  en:"don't", zh:"不",         pos:"function", flags:[], syl:["dont"] },
  { id:"work_this",  en:"this",  zh:"這",         pos:"function", flags:[], syl:["this"] },
  { id:"work_more",  en:"more",  zh:"更多",       pos:"function", flags:[], syl:["more"] },
  // ── 主題 3「請求協作」實詞 + 新膠水 ──
  { id:"work_send",  en:"send",  zh:"寄 / 傳送", pos:"verb", flags:[],            syl:["send"],  why:"send + 人 + 東西:send me the file。" },
  { id:"work_file",  en:"file",  zh:"檔案",       pos:"noun", flags:["countable"], syl:["file"],  why:"the file = 那個檔案;open / send the file。" },
  { id:"work_help",  en:"help",  zh:"幫忙",       pos:"noun", flags:[],            syl:["help"],  why:"I need help with this = 這個我需要幫忙。" },
  { id:"work_sure",  en:"sure",  zh:"確定",       pos:"adj",  flags:[],            syl:["sure"],  why:"I'm not sure = 我不確定,比 I don't know 更軟、更禮貌。" },
  { id:"work_try",   en:"try",   zh:"嘗試 / 試",  pos:"verb", flags:[],            syl:["try"],   why:"try + 動作:let's try again。" },
  { id:"work_can",  en:"Can",   zh:"可以嗎",    pos:"function", flags:[], syl:["can"] },
  { id:"work_with", en:"with",  zh:"跟 / 用",   pos:"function", flags:[], syl:["with"] },
  { id:"work_im",   en:"I'm",   zh:"我(I am)",  pos:"function", flags:[], syl:["im"] },
  { id:"work_not",  en:"not",   zh:"不 / 沒",   pos:"function", flags:[], syl:["not"] },
  { id:"work_yet",  en:"yet",   zh:"還(沒)",   pos:"function", flags:[], syl:["yet"] },
  { id:"work_lets", en:"Let's", zh:"我們來",    pos:"function", flags:[], syl:["lets"] },
  // ── 主題 4「安排時間」──
  { id:"work_available", en:"available", zh:"有空的",    pos:"adj",  flags:[],            syl:["a","vail","a","ble"], why:"問對方有沒有空:When are you available?。" },
  { id:"work_meet",      en:"meet",      zh:"開會 / 見面", pos:"verb", flags:[],            syl:["meet"],               why:"meet = 見面 / 開會;Can we meet tomorrow?。" },
  { id:"work_tomorrow",  en:"tomorrow",  zh:"明天",       pos:"noun", flags:[],            syl:["to","mor","row"],     why:"明天;meet tomorrow。" },
  { id:"work_move",      en:"move",      zh:"改時間 / 移動", pos:"verb", flags:[],          syl:["move"],               why:"move the meeting = 改會議時間,不是「搬動」。" },
  { id:"work_meeting",   en:"meeting",   zh:"會議",       pos:"noun", flags:["countable"], syl:["meet","ing"],         why:"the meeting = 那場會議。" },
  { id:"work_call",      en:"call",      zh:"打電話 / 通話", pos:"verb", flags:["countable"], syl:["call"],             why:"call you later = 晚點打給你;the call = 那通電話 / 會議。" },
  { id:"work_when", en:"When", zh:"什麼時候", pos:"function", flags:[], syl:["when"] },
  { id:"work_are",  en:"are",  zh:"是",       pos:"function", flags:[], syl:["are"] },
  { id:"work_we",   en:"we",   zh:"我們",     pos:"function", flags:[], syl:["we"] },
  { id:"work_ill",  en:"I'll", zh:"我會(I will)", pos:"function", flags:[], syl:["ill"] },
  // ── 主題 5「會議參與」──
  { id:"work_agree",    en:"agree",    zh:"同意",   pos:"verb", flags:[],            syl:["a","gree"],   why:"agree with you = 同意你的看法。" },
  { id:"work_question", en:"question", zh:"問題",   pos:"noun", flags:["countable"], syl:["ques","tion"], why:"I have a question = 我有一個問題(想問的)。" },
  { id:"work_next",     en:"next",     zh:"下一個", pos:"adj",  flags:[],            syl:["next"],       why:"the next step = 下一步。" },
  { id:"work_step",     en:"step",     zh:"步驟",   pos:"noun", flags:["countable"], syl:["step"],       why:"the next step = 下一步。" },
  { id:"work_take",     en:"take",     zh:"做 / 記", pos:"verb", flags:[],           syl:["take"],       why:"take notes = 做筆記。" },
  { id:"work_notes",    en:"notes",    zh:"筆記",   pos:"noun", flags:[],            syl:["notes"],      why:"take notes = 做筆記。" },
  { id:"work_have", en:"have", zh:"有",     pos:"function", flags:[], syl:["have"] },
  { id:"work_a",    en:"a",    zh:"一個",   pos:"function", flags:[], syl:["a"] },
  { id:"work_what", en:"What", zh:"什麼",   pos:"function", flags:[], syl:["what"] },
  // ── 主題 6「確認需求」──
  { id:"work_mean",      en:"mean",      zh:"意思是", pos:"verb", flags:[],            syl:["mean"],           why:"What does this mean? = 這是什麼意思?" },
  { id:"work_give",      en:"give",      zh:"給",     pos:"verb", flags:[],            syl:["give"],           why:"give me an example = 給我一個例子。" },
  { id:"work_example",   en:"example",   zh:"例子",   pos:"noun", flags:["countable"], syl:["ex","am","ple"],  why:"抽象時請對方舉例:give me an example。" },
  { id:"work_deadline",  en:"deadline",  zh:"截止時間", pos:"noun", flags:["countable"], syl:["dead","line"],  why:"What is the deadline? = 截止時間是什麼時候?" },
  { id:"work_important", en:"important", zh:"重要的", pos:"adj",  flags:[],            syl:["im","por","tant"], why:"which one is more important = 哪一個比較重要。" },
  { id:"work_does",  en:"does",  zh:"(助動詞)", pos:"function", flags:[], syl:["does"] },
  { id:"work_an",    en:"an",    zh:"一個",     pos:"function", flags:[], syl:["an"] },
  { id:"work_which", en:"Which", zh:"哪一個",   pos:"function", flags:[], syl:["which"] },
  { id:"work_one",   en:"one",   zh:"一個 / 哪個", pos:"function", flags:[], syl:["one"] },
  // ── 主題 7「進度回報」──
  { id:"work_working", en:"working", zh:"處理中", pos:"verb", flags:[],            syl:["work","ing"], why:"I'm working on it = 我正在處理。" },
  { id:"work_almost",  en:"almost",  zh:"快 / 幾乎", pos:"adv", flags:[],          syl:["al","most"],  why:"It's almost done = 快完成了。" },
  { id:"work_done",    en:"done",    zh:"完成的", pos:"adj",  flags:[],            syl:["done"],       why:"done = 做完了;almost done = 快好了。" },
  { id:"work_hour",    en:"hour",    zh:"小時",   pos:"noun", flags:["countable"], syl:["hour"],       why:"one more hour = 再一個小時(h 不發音)。" },
  { id:"work_finish",  en:"finish",  zh:"完成",   pos:"verb", flags:[],            syl:["fin","ish"],  why:"finish it by Friday = 星期五前完成。" },
  { id:"work_friday",  en:"Friday",  zh:"星期五", pos:"noun", flags:[],            syl:["Fri","day"],  why:"by Friday = 在星期五前。" },
  { id:"work_its", en:"It's", zh:"它是(It is)", pos:"function", flags:[], syl:["its"] },
  { id:"work_by",  en:"by",   zh:"在⋯之前 / 用", pos:"function", flags:[], syl:["by"] },
  // ── 主題 8「問題排查」──
  { id:"work_see",     en:"see",     zh:"看到",   pos:"verb", flags:[],            syl:["see"],        why:"I see an error message = 我看到一個錯誤訊息。" },
  { id:"work_error",   en:"error",   zh:"錯誤",   pos:"noun", flags:["countable"], syl:["er","ror"],   why:"an error message = 一個錯誤訊息。" },
  { id:"work_message", en:"message", zh:"訊息",   pos:"noun", flags:["countable"], syl:["mes","sage"], why:"error message = 錯誤訊息。" },
  { id:"work_open",    en:"open",    zh:"打開",   pos:"verb", flags:[],            syl:["o","pen"],    why:"can't open the file = 打不開這個檔案。" },
  { id:"work_system",  en:"system",  zh:"系統",   pos:"noun", flags:["countable"], syl:["sys","tem"],  why:"The system is slow = 系統很慢。" },
  { id:"work_slow",    en:"slow",    zh:"慢的",   pos:"adj",  flags:[],            syl:["slow"],       why:"is slow = 很慢(系統 / 網頁卡)。" },
  { id:"work_find",    en:"found",   zh:"找到了", pos:"verb", flags:[],            syl:["found"],      why:"find(找到)的過去式;I found the reason = 我找到原因了。" },
  { id:"work_reason",  en:"reason",  zh:"原因",   pos:"noun", flags:["countable"], syl:["rea","son"],  why:"I found the reason = 我找到原因了。" },
  { id:"work_cant", en:"can't", zh:"不能 / 沒辦法", pos:"function", flags:[], syl:["cant"] },
  // ── 主題 9「客氣請求」──
  { id:"work_link",    en:"link",    zh:"連結", pos:"noun", flags:["countable"], syl:["link"],       why:"send me the link = 把連結傳給我。" },
  { id:"work_share",   en:"share",   zh:"分享", pos:"verb", flags:[],            syl:["share"],      why:"share your screen = 分享你的畫面。" },
  { id:"work_screen",  en:"screen",  zh:"畫面 / 螢幕", pos:"noun", flags:["countable"], syl:["screen"], why:"share / my screen = 你的 / 我的畫面。" },
  { id:"work_confirm", en:"confirm", zh:"確認", pos:"verb", flags:[],            syl:["con","firm"], why:"confirm by email = 用 email 確認(留正式紀錄)。" },
  { id:"work_email",   en:"email",   zh:"電子郵件", pos:"noun", flags:["countable"], syl:["e","mail"], why:"by email = 用 email。" },
  { id:"work_your",   en:"your",   zh:"你的", pos:"function", flags:[], syl:["your"] },
  { id:"work_please", en:"Please", zh:"請",   pos:"function", flags:[], syl:["please"] },
  // ── 主題 10「邊界與拒絕」──
  { id:"work_do",       en:"do",       zh:"做",     pos:"verb", flags:[],            syl:["do"],           why:"I can't do it today = 我今天沒辦法做。" },
  { id:"work_today",    en:"today",    zh:"今天",   pos:"noun", flags:[],            syl:["to","day"],     why:"can't do it today = 今天排不進去。" },
  { id:"work_approval", en:"approval", zh:"批准",   pos:"noun", flags:[],            syl:["ap","prov","al"], why:"I need approval first = 我需要先取得批准。" },
  { id:"work_scope",    en:"scope",    zh:"範圍",   pos:"noun", flags:[],            syl:["scope"],        why:"out of scope = 超出(原本)範圍,擋額外需求好用。" },
  { id:"work_now",   en:"now",   zh:"現在", pos:"function", flags:[], syl:["now"] },
  { id:"work_first", en:"first", zh:"先",   pos:"function", flags:[], syl:["first"] },
  { id:"work_out",   en:"out",   zh:"出 / 外", pos:"function", flags:[], syl:["out"] },
  { id:"work_of",    en:"of",    zh:"的",   pos:"function", flags:[], syl:["of"] },
  // ── 主題 11「道歉修正」──
  { id:"work_sorry",    en:"Sorry",    zh:"抱歉",   pos:"adj",  flags:[],            syl:["sor","ry"],    why:"Sorry for the delay = 抱歉延誤了。" },
  { id:"work_delay",    en:"delay",    zh:"延誤",   pos:"noun", flags:["countable"], syl:["de","lay"],    why:"Sorry for the delay = 為延誤抱歉。" },
  { id:"work_mistake",  en:"mistake",  zh:"錯誤",   pos:"noun", flags:["countable"], syl:["mis","take"],  why:"That was my mistake = 那是我的錯(承認但不逃避)。" },
  { id:"work_thank",    en:"Thank",    zh:"謝謝",   pos:"verb", flags:[],            syl:["thank"],       why:"Thank you for your patience = 謝謝你的耐心等待。" },
  { id:"work_patience", en:"patience", zh:"耐心",   pos:"noun", flags:[],            syl:["pa","tience"], why:"your patience = 你的耐心(對方等很久時)。" },
  { id:"work_for",  en:"for",  zh:"為了 / 給", pos:"function", flags:[], syl:["for"] },
  { id:"work_that", en:"That", zh:"那",     pos:"function", flags:[], syl:["that"] },
  { id:"work_was",  en:"was",  zh:"是(過去)", pos:"function", flags:[], syl:["was"] },
  // ── 主題 12「客戶溝通」──
  { id:"work_customer", en:"customer", zh:"客戶", pos:"noun", flags:["countable"], syl:["cus","tom","er"], why:"The customer reported a problem = 客戶回報了一個問題。" },
  { id:"work_report",   en:"reported", zh:"回報了", pos:"verb", flags:[],           syl:["re","port","ed"], why:"report(回報)的過去式;reported a problem = 回報了一個問題。" },
  { id:"work_follow",   en:"follow",   zh:"跟進 / 追蹤", pos:"verb", flags:[],      syl:["fol","low"],      why:"follow up with them = 跟他們追蹤後續。" },
  { id:"work_concern",  en:"concern",  zh:"擔心", pos:"noun", flags:["countable"], syl:["con","cern"],     why:"I understand your concern = 我理解你的擔心。" },
  { id:"work_get",      en:"get",      zh:"回覆 / 得到", pos:"verb", flags:[],      syl:["get"],            why:"get back to you = 稍後回覆你(不是「回去」)。" },
  { id:"work_up",   en:"up",   zh:"起來 / 跟進", pos:"function", flags:[], syl:["up"] },
  { id:"work_them", en:"them", zh:"他們",   pos:"function", flags:[], syl:["them"] },
  { id:"work_back", en:"back", zh:"回",     pos:"function", flags:[], syl:["back"] },
  { id:"work_to",   en:"to",   zh:"給 / 去", pos:"function", flags:[], syl:["to"] },
  { id:"work_soon", en:"soon", zh:"很快",   pos:"function", flags:[], syl:["soon"] },
  // ── 主題 13「遠端會議」──
  { id:"work_join",       en:"join",       zh:"加入",       pos:"verb", flags:[],            syl:["join"],              why:"join the call = 加入通話。" },
  { id:"work_microphone", en:"microphone", zh:"麥克風",     pos:"noun", flags:["countable"], syl:["mi","cro","phone"],  why:"My microphone is not working = 我的麥克風不能用。" },
  { id:"work_frozen",     en:"frozen",     zh:"卡住的 / 凍結", pos:"adj", flags:[],           syl:["fro","zen"],         why:"My screen is frozen = 我的畫面卡住了。" },
  { id:"work_rejoin",     en:"rejoin",     zh:"重新加入",   pos:"verb", flags:[],            syl:["re","join"],         why:"re- = 再一次;rejoin the meeting = 重新加入會議。" },
];
const WORK_BATCHES = [
  ['work_need','work_time','work_explain','work_understand','work_part','work_check','work_again',
   'work_i','work_you','work_it','work_the','work_my','work_me','work_is','work_let','work_could','work_dont','work_this','work_more'],   // 主題1 不懂就問
  ['work_fixed','work_bug','work_work','work_computer','work_problem','work_update','work_later','work_here',
   'work_will','work_on'],   // 主題2 回報狀態(用過去式 fixed)
  ['work_send','work_file','work_help','work_sure','work_try','work_can','work_with','work_im','work_not','work_yet','work_lets'],   // 主題3 請求協作
  ['work_available','work_meet','work_tomorrow','work_move','work_meeting','work_call','work_when','work_are','work_we','work_ill'], // 主題4 安排時間
  ['work_agree','work_question','work_next','work_step','work_take','work_notes','work_have','work_a','work_what'],   // 主題5 會議參與
  ['work_mean','work_give','work_example','work_deadline','work_important','work_does','work_an','work_which','work_one'],   // 主題6 確認需求
  ['work_working','work_almost','work_done','work_hour','work_finish','work_friday','work_its','work_by'],   // 主題7 進度回報
  ['work_see','work_error','work_message','work_open','work_system','work_slow','work_find','work_reason','work_cant'],   // 主題8 問題排查
  ['work_link','work_share','work_screen','work_confirm','work_email','work_your','work_please'],   // 主題9 客氣請求
  ['work_do','work_today','work_approval','work_scope','work_now','work_first','work_out','work_of'],   // 主題10 邊界與拒絕
  ['work_sorry','work_delay','work_mistake','work_thank','work_patience','work_for','work_that','work_was','work_fix'],   // 主題11 道歉修正(work_fix 基本形用在 I'll fix it now)
  ['work_customer','work_report','work_follow','work_concern','work_get','work_up','work_them','work_back','work_to','work_soon'],   // 主題12 客戶溝通
  ['work_join','work_microphone','work_frozen','work_rejoin'],   // 主題13 遠端會議
];
const WORK_PATTERNS = [
  { id:"wpat_more_time",    text:"I need more time.",             zh:"我需要更多時間。",       requires:["work_i","work_need","work_more","work_time"],                    slots:{} },
  { id:"wpat_explain",      text:"Could you explain it again?",   zh:"可以再解釋一次嗎?",     requires:["work_could","work_you","work_explain","work_it","work_again"],   slots:{} },
  { id:"wpat_dont_und",     text:"I don't understand this part.", zh:"我不懂這一部分。",       requires:["work_i","work_dont","work_understand","work_this","work_part"],  slots:{} },
  { id:"wpat_check",        text:"Let me check.",                 zh:"讓我確認一下。",         requires:["work_let","work_me","work_check"],                              slots:{} },
  { id:"wpat_fixed_bug",    text:"I fixed the bug.",              zh:"我修好了這個錯誤。",     requires:["work_i","work_fixed","work_the","work_bug"],                    slots:{} },
  { id:"wpat_works_here",   text:"It works on my computer.",      zh:"在我的電腦上可以運作。", requires:["work_it","work_work","work_on","work_my","work_computer"],       slots:{} },
  { id:"wpat_problem_here", text:"The problem is here.",          zh:"問題在這裡。",           requires:["work_the","work_problem","work_is","work_here"],                slots:{} },
  { id:"wpat_update_later", text:"I will update you later.",      zh:"我晚點再跟你更新。",     requires:["work_i","work_will","work_update","work_you","work_later"],      slots:{} },
  // 主題3 請求協作
  { id:"wpat_send_file",       text:"Can you send me the file?",   zh:"可以把檔案寄給我嗎?",   requires:["work_can","work_you","work_send","work_me","work_the","work_file"],   slots:{} },
  { id:"wpat_need_help",       text:"I need help with this.",      zh:"這個我需要幫忙。",       requires:["work_i","work_need","work_help","work_with","work_this"],             slots:{} },
  { id:"wpat_not_sure",        text:"I'm not sure yet.",           zh:"我現在還不確定。",       requires:["work_im","work_not","work_sure","work_yet"],                          slots:{} },
  { id:"wpat_try_again",       text:"Let's try again.",            zh:"我們再試一次。",         requires:["work_lets","work_try","work_again"],                                  slots:{} },
  // 主題4 安排時間
  { id:"wpat_when_available",  text:"When are you available?",     zh:"你什麼時候有空?",       requires:["work_when","work_are","work_you","work_available"],                   slots:{} },
  { id:"wpat_meet_tomorrow",   text:"Can we meet tomorrow?",       zh:"我們明天可以開會嗎?",   requires:["work_can","work_we","work_meet","work_tomorrow"],                     slots:{} },
  { id:"wpat_move_meeting",    text:"Can we move the meeting?",    zh:"我們可以改會議時間嗎?", requires:["work_can","work_we","work_move","work_the","work_meeting"],           slots:{} },
  { id:"wpat_call_later",      text:"I'll call you later.",        zh:"我晚點打給你。",         requires:["work_ill","work_call","work_you","work_later"],                       slots:{} },
  // 主題5 會議參與
  { id:"wpat_agree",           text:"I agree with you.",           zh:"我同意你的看法。",       requires:["work_i","work_agree","work_with","work_you"],                         slots:{} },
  { id:"wpat_have_question",   text:"I have a question.",          zh:"我有一個問題。",         requires:["work_i","work_have","work_a","work_question"],                        slots:{} },
  { id:"wpat_next_step",       text:"What is the next step?",      zh:"下一步是什麼?",         requires:["work_what","work_is","work_the","work_next","work_step"],             slots:{} },
  { id:"wpat_take_notes",      text:"I will take notes.",          zh:"我會做筆記。",           requires:["work_i","work_will","work_take","work_notes"],                        slots:{} },
  // 主題6 確認需求
  { id:"wpat_what_mean",       text:"What does this mean?",        zh:"這是什麼意思?",         requires:["work_what","work_does","work_this","work_mean"],                      slots:{} },
  { id:"wpat_give_example",    text:"Can you give me an example?", zh:"可以給我一個例子嗎?",   requires:["work_can","work_you","work_give","work_me","work_an","work_example"], slots:{} },
  { id:"wpat_deadline",        text:"What is the deadline?",       zh:"截止時間是什麼時候?",   requires:["work_what","work_is","work_the","work_deadline"],                     slots:{} },
  { id:"wpat_priority",        text:"Which one is more important?",zh:"哪一個比較重要?",       requires:["work_which","work_one","work_is","work_more","work_important"],       slots:{} },
  // 主題7 進度回報
  { id:"wpat_working_on",      text:"I'm working on it.",          zh:"我正在處理。",           requires:["work_im","work_working","work_on","work_it"],                         slots:{} },
  { id:"wpat_almost_done",     text:"It's almost done.",           zh:"快完成了。",             requires:["work_its","work_almost","work_done"],                                 slots:{} },
  { id:"wpat_one_hour",        text:"I need one more hour.",       zh:"我還需要一個小時。",     requires:["work_i","work_need","work_one","work_more","work_hour"],              slots:{} },
  { id:"wpat_by_friday",       text:"I can finish it by Friday.",  zh:"我可以在星期五前完成。", requires:["work_i","work_can","work_finish","work_it","work_by","work_friday"],  slots:{} },
  // 主題8 問題排查
  { id:"wpat_error_msg",       text:"I see an error message.",     zh:"我看到一個錯誤訊息。",   requires:["work_i","work_see","work_an","work_error","work_message"],            slots:{} },
  { id:"wpat_cannot_open",     text:"I can't open the file.",      zh:"我打不開這個檔案。",     requires:["work_i","work_cant","work_open","work_the","work_file"],              slots:{} },
  { id:"wpat_system_slow",     text:"The system is slow.",         zh:"系統很慢。",             requires:["work_the","work_system","work_is","work_slow"],                       slots:{} },
  { id:"wpat_found_reason",    text:"I found the reason.",         zh:"我找到原因了。",         requires:["work_i","work_find","work_the","work_reason"],                        slots:{} },
  // 主題9 客氣請求
  { id:"wpat_send_link",       text:"Can you send me the link?",   zh:"可以把連結傳給我嗎?",   requires:["work_can","work_you","work_send","work_me","work_the","work_link"],   slots:{} },
  { id:"wpat_share_screen",    text:"Can you share your screen?",  zh:"你可以分享你的畫面嗎?", requires:["work_can","work_you","work_share","work_your","work_screen"],         slots:{} },
  { id:"wpat_check_this",      text:"Can you check this?",         zh:"你可以檢查這個嗎?",     requires:["work_can","work_you","work_check","work_this"],                       slots:{} },
  { id:"wpat_confirm_email",   text:"Please confirm by email.",    zh:"請用 email 確認。",      requires:["work_please","work_confirm","work_by","work_email"],                  slots:{} },
  // 主題10 邊界與拒絕
  { id:"wpat_not_available",   text:"I'm not available now.",      zh:"我現在沒空。",           requires:["work_im","work_not","work_available","work_now"],                     slots:{} },
  { id:"wpat_cant_today",      text:"I can't do it today.",        zh:"我今天沒辦法做。",       requires:["work_i","work_cant","work_do","work_it","work_today"],                slots:{} },
  { id:"wpat_need_approval",   text:"I need approval first.",      zh:"我需要先取得批准。",     requires:["work_i","work_need","work_approval","work_first"],                    slots:{} },
  { id:"wpat_out_of_scope",    text:"This is out of scope.",       zh:"這超出範圍了。",         requires:["work_this","work_is","work_out","work_of","work_scope"],              slots:{} },
  // 主題11 道歉修正
  { id:"wpat_sorry_delay",     text:"Sorry for the delay.",        zh:"抱歉延誤了。",           requires:["work_sorry","work_for","work_the","work_delay"],                      slots:{} },
  { id:"wpat_my_mistake",      text:"That was my mistake.",        zh:"那是我的錯。",           requires:["work_that","work_was","work_my","work_mistake"],                      slots:{} },
  { id:"wpat_fix_now",         text:"I'll fix it now.",            zh:"我現在會修好它。",       requires:["work_ill","work_fix","work_it","work_now"],                           slots:{} },
  { id:"wpat_thanks_patience", text:"Thank you for your patience.",zh:"謝謝你的耐心等待。",     requires:["work_thank","work_you","work_for","work_your","work_patience"],       slots:{} },
  // 主題12 客戶溝通
  { id:"wpat_customer_report", text:"The customer reported a problem.", zh:"客戶回報了一個問題。", requires:["work_the","work_customer","work_report","work_a","work_problem"],  slots:{} },
  { id:"wpat_follow_up",       text:"I will follow up with them.", zh:"我會跟他們追蹤。",       requires:["work_i","work_will","work_follow","work_up","work_with","work_them"], slots:{} },
  { id:"wpat_understand_concern", text:"I understand your concern.", zh:"我理解你的擔心。",     requires:["work_i","work_understand","work_your","work_concern"],                slots:{} },
  { id:"wpat_get_back",        text:"I'll get back to you soon.",  zh:"我會很快回覆你。",       requires:["work_ill","work_get","work_back","work_to","work_you","work_soon"],   slots:{} },
  // 主題13 遠端會議
  { id:"wpat_join_call",       text:"I will join the call.",       zh:"我會加入通話。",         requires:["work_i","work_will","work_join","work_the","work_call"],              slots:{} },
  { id:"wpat_mic_problem",     text:"My microphone is not working.",zh:"我的麥克風不能用。",    requires:["work_my","work_microphone","work_is","work_not","work_working"],      slots:{} },
  { id:"wpat_screen_frozen",   text:"My screen is frozen.",        zh:"我的畫面卡住了。",       requires:["work_my","work_screen","work_is","work_frozen"],                      slots:{} },
  { id:"wpat_rejoin",          text:"I will rejoin the meeting.",  zh:"我會重新加入會議。",     requires:["work_i","work_will","work_rejoin","work_the","work_meeting"],         slots:{} },
];
const WORK_BUILD_IDS = WORK_PATTERNS.map(p => p.id);
const WORK_TRANSFORM_IDS = [];
