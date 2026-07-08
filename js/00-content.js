/* ============================================================================
   單字庫
   ============================================================================ */
let BANK = [
  { id:"word_cat",        en:"cat",        zh:"貓",     pos:"noun", flags:["countable","ownable","presentable","visible","buyable","audible"], syl:["cat"], why:"短字先暖身:cat 就是貓。" },
  { id:"word_happy",      en:"happy",      zh:"開心",   pos:"adj",  flags:["emotion"], syl:["hap","py"], why:"happy 是心情好、覺得開心。" },
  { id:"word_water",      en:"water",      zh:"水",     pos:"noun", flags:["drinkable"], syl:["wa","ter"], why:"water 當名詞是水;也能當動詞,表示澆水。" },
  { id:"word_coffee",     en:"coffee",     zh:"咖啡",   pos:"noun", flags:["drinkable","sweetenable","makeable"], syl:["cof","fee"], why:"coffee 是咖啡,日常點飲料很常用。" },
  { id:"word_sugar",      en:"sugar",      zh:"糖",     pos:"noun", flags:["sweetener"], syl:["su","gar"], why:"sugar 是糖,常用在飲料或甜食裡。" },
  { id:"word_friend",     en:"friend",     zh:"朋友",   pos:"noun", flags:["countable","ownable","presentable","visible"], syl:["friend"], why:"friend 是你認識、信任、會來往的人。" },
  { id:"word_book",       en:"book",       zh:"書",     pos:"noun", flags:["countable","ownable","readable","presentable","visible","buyable"], syl:["book"], why:"book 是書;生活裡也能當動詞,表示預訂。" },
  { id:"word_beautiful",  en:"beautiful",  zh:"美麗的", pos:"adj",  flags:["descriptive"], syl:["beau","ti","ful"], why:"beauty 是美;-ful 有『充滿』的味道,beautiful 就是充滿美。" },
  { id:"word_home",       en:"home",       zh:"家",     pos:"noun", flags:["ownable"], syl:["home"], why:"home 重點是『歸屬感』:你回去的地方。" },
  { id:"word_house",      en:"house",      zh:"房子",   pos:"noun", flags:["countable","ownable","presentable","visible","buyable"], syl:["house"], why:"house 重點是建築物:一棟可以住人的房子。" },
  { id:"word_big",        en:"big",        zh:"大的",   pos:"adj",  flags:["descriptive"], syl:["big"], why:"big 表示尺寸、程度或影響很大。" },
  { id:"word_small",      en:"small",      zh:"小的",   pos:"adj",  flags:["descriptive"], syl:["small"], why:"small 表示尺寸、數量或程度小。" },
  { id:"word_good",       en:"good",       zh:"好的",   pos:"adj",  flags:["descriptive"], syl:["good"], why:"good 是最常用的『好』,可以說品質好、狀態好。" },
  { id:"word_bad",        en:"bad",        zh:"壞的",   pos:"adj",  flags:["descriptive"], syl:["bad"], why:"bad 是不好、壞、糟糕。" },
  { id:"word_make",       en:"make",       zh:"製作",   pos:"verb", flags:[], syl:["make"], why:"make 重點是『做出一個結果』。" },
  { id:"word_look",       en:"look",       zh:"看",     pos:"verb", flags:[], syl:["look"], why:"look 是把眼睛轉過去看,有主動看的動作。" },
  { id:"word_see",        en:"see",        zh:"看見",   pos:"verb", flags:[], syl:["see"], why:"see 是看見,重點是結果:你有看到。" },
  { id:"word_listen",     en:"listen",     zh:"聽",     pos:"verb", flags:[], syl:["lis","ten"], why:"listen 是專心聽,有主動注意。" },
  { id:"word_hear",       en:"hear",       zh:"聽見",   pos:"verb", flags:[], syl:["hear"], why:"hear 是耳朵接收到聲音,重點是有聽見。" },
  { id:"word_speak",      en:"speak",      zh:"說話",   pos:"verb", flags:[], syl:["speak"], why:"speak 重點是開口說話或使用某種語言。" },
  { id:"word_say",        en:"say",        zh:"說",     pos:"verb", flags:[], syl:["say"], why:"say 重點是『說出某句話或內容』。" },
  { id:"word_eat",        en:"eat",        zh:"吃",     pos:"verb", flags:[], syl:["eat"], why:"eat 是吃東西,把食物吃下去。" },
  { id:"word_drink",      en:"drink",      zh:"喝",     pos:"verb", flags:[], syl:["drink"], why:"drink 是喝,也可以當名詞表示飲料。" },
  { id:"word_go",         en:"go",         zh:"去",     pos:"verb", flags:[], syl:["go"], why:"go 是離開現在的位置,往別處去。I go home 就是我回家。" },
  { id:"word_buy",        en:"buy",        zh:"買",     pos:"verb", flags:[], syl:["buy"], why:"buy 是花錢把東西買下來。" },
  { id:"word_get",        en:"get",        zh:"得到",   pos:"verb", flags:[], syl:["get"], why:"get 是得到、拿到,很常用。" },
  { id:"word_i",          en:"I",          zh:"我",     pos:"function", flags:[], syl:["I"], why:"I 是說話的人自己,英文句子裡永遠大寫。" },
  { id:"word_am",         en:"am",         zh:"是",     pos:"function", flags:[], syl:["am"], why:"am 只跟 I 搭配:I am happy." },
  { id:"word_this",       en:"this",       zh:"這個",   pos:"function", flags:[], syl:["this"], why:"this 指現在正在說、正在看的『這個』。" },
  { id:"word_is",         en:"is",         zh:"是",     pos:"function", flags:[], syl:["is"], why:"is 用來連接主詞和狀態:This is a cat." },
  { id:"word_a",          en:"a",          zh:"一個",   pos:"function", flags:[], syl:["a"], why:"a 放在單數可數名詞前面,表示一個。" },
  { id:"word_my",         en:"my",         zh:"我的",   pos:"function", flags:[], syl:["my"], why:"my 表示我的,後面接名詞:my book。" },
  { id:"word_to",         en:"to",         zh:"向",     pos:"function", flags:[], syl:["to"], why:"to 把動作指向目標:listen to music 就是把耳朵對準音樂。" },
  { id:"word_or",         en:"or",         zh:"或",     pos:"function", flags:[], syl:["or"], why:"or 表示二選一:water or tea 是水還是茶。" },
  { id:"word_with",       en:"with",       zh:"加",     pos:"function", flags:[], syl:["with"], why:"with 表示和某個東西一起;coffee with sugar 是咖啡加糖。" },
  { id:"word_please",     en:"please",     zh:"請",     pos:"function", flags:[], syl:["please"], why:"please 放在請求裡,讓語氣更有禮貌。" },
  { id:"word_read",       en:"read",       zh:"讀",     pos:"verb", flags:[], syl:["read"], why:"read 是讀文字、書或訊息,重點是看懂內容。" },
  // 批3「吃喝與感受」:感受形容詞(I am ___)+ 吃喝動詞與食物飲料(I eat/drink ___)
  { id:"word_hungry",     en:"hungry",     zh:"餓",     pos:"adj",  flags:["emotion"], syl:["hun","gry"], why:"hungry 是肚子餓,想吃東西。" },
  { id:"word_thirsty",    en:"thirsty",    zh:"渴",     pos:"adj",  flags:["emotion"], syl:["thirs","ty"], why:"thirsty 是口渴,想喝東西。" },
  { id:"word_tired",      en:"tired",      zh:"累",     pos:"adj",  flags:["emotion"], syl:["tired"], why:"tired 是累了、沒力氣、想休息。" },
  { id:"word_sad",        en:"sad",        zh:"難過",   pos:"adj",  flags:["emotion"], syl:["sad"], why:"sad 是難過、不開心,跟 happy 相反。" },
  { id:"word_rice",       en:"rice",       zh:"飯",     pos:"noun", flags:["eatable","makeable"], syl:["rice"], why:"rice 是米飯,亞洲的主食。" },
  { id:"word_bread",      en:"bread",      zh:"麵包",   pos:"noun", flags:["eatable","makeable"], syl:["bread"], why:"bread 是麵包。" },
  { id:"word_tea",        en:"tea",        zh:"茶",     pos:"noun", flags:["drinkable","sweetenable","makeable"], syl:["tea"], why:"tea 是茶。" },
  { id:"word_milk",       en:"milk",       zh:"牛奶",   pos:"noun", flags:["drinkable","sweetenable"], syl:["milk"], why:"milk 是牛奶。" },
  // 救活孤兒動詞:look at(視線對準)/ speak 語言。at 是介係詞,English/Chinese 是語言名(開頭大寫)
  { id:"word_at",         en:"at",         zh:"朝",     pos:"function", flags:[], syl:["at"], why:"at 把動作釘在一個點上:look at 就是把視線『對準』那個東西。" },
  { id:"word_english",    en:"English",    zh:"英文",   pos:"noun", flags:["language"], syl:["Eng","lish"], why:"English = 英文。語言的名字開頭一定大寫(English、Chinese、Japanese)。" },
  { id:"word_chinese",    en:"Chinese",    zh:"中文",   pos:"noun", flags:["language"], syl:["Chi","nese"], why:"Chinese = 中文,也指中國的。跟 English 一樣,語言名開頭要大寫。" },
  // 批8「開口說」/ 批9「用耳朵」的材料:救活孤兒動詞 say(說 hello)/ listen(聽 music)/ hear(聽見貓叫)
  { id:"word_hello",      en:"hello",      zh:"哈囉",   pos:"noun", flags:[], syl:["hel","lo"], why:"hello 是最常用的打招呼,見面說一聲 hello 就對了。" },
  { id:"word_music",      en:"music",      zh:"音樂",   pos:"noun", flags:["listenable"], syl:["mu","sic"], why:"music 來自希臘的繆思女神(Muse),掌管藝術;音樂就是繆思的禮物。" },
];

let PATTERNS = [
  {
    id: "pat_this_is_a_noun",
    text: "This is a {x}.",
    zh: "這是一個{x}。",
    q: "Is this a {x}?",
    qzh: "這是一個{x}嗎?",
    requires: ["word_this", "word_is", "word_a"],
    slots: { x: { pos: "noun", flags: ["countable", "presentable"] } }
  },
  {
    id: "pat_this_is_my_noun",
    text: "This is my {x}.",
    zh: "這是我的{x}。",
    q: "Is this my {x}?",
    qzh: "這是我的{x}嗎?",
    requires: ["word_this", "word_is", "word_my"],
    slots: { x: { pos: "noun", flags: ["ownable"] } }
  },
  {
    id: "pat_drink_or_drink",
    text: "{x} or {y}?",
    zh: "{x}還是{y}?",
    requires: ["word_or"],
    slots: { x: { pos: "noun", flags: ["drinkable"] }, y: { pos: "noun", flags: ["drinkable"] } }
  },
  {
    id: "pat_drink_please",
    text: "{x}, please.",
    zh: "請給我{x}。",
    requires: ["word_please"],
    slots: { x: { pos: "noun", flags: ["drinkable"] } }
  },
  {
    id: "pat_drink_with_sugar",
    text: "{x} with {y}.",
    zh: "{x}加{y}。",
    requires: ["word_with"],
    slots: { x: { pos: "noun", flags: ["sweetenable"] }, y: { pos: "noun", flags: ["sweetener"] } }
  },
  {
    id: "pat_i_drink_noun",
    text: "I drink {x}.",
    zh: "我喝{x}。",
    requires: ["word_i", "word_drink"],
    slots: { x: { pos: "noun", flags: ["drinkable"] } }
  },
  {
    id: "pat_i_see_a_noun",
    text: "I see a {x}.",
    zh: "我看見一個{x}。",
    requires: ["word_i", "word_see"],
    slots: { x: { pos: "noun", flags: ["visible"] } }
  },
  {
    id: "pat_i_buy_a_noun",
    text: "I buy a {x}.",
    zh: "我買一個{x}。",
    requires: ["word_i", "word_buy"],
    slots: { x: { pos: "noun", flags: ["buyable"] } }
  },
  {
    id: "pat_i_read_noun",
    text: "I read a {x}.",
    zh: "我讀一本{x}。",
    requires: ["word_i", "word_read"],
    slots: { x: { pos: "noun", flags: ["readable"] } }
  },
  {
    id: "pat_i_eat_noun",
    text: "I eat {x}.",
    zh: "我吃{x}。",
    requires: ["word_i", "word_eat"],
    slots: { x: { pos: "noun", flags: ["eatable"] } }
  },
  {
    id: "pat_this_is_adj",
    text: "This is {x}.",
    zh: "這很{x}。",
    q: "Is this {x}?",
    qzh: "這很{x}嗎?",
    requires: ["word_this", "word_is"],
    slots: { x: { pos: "adj", flags: ["descriptive"] } }
  },
  {
    id: "pat_i_am_adj",
    text: "I am {x}.",
    zh: "我很{x}。",
    q: "Am I {x}?",
    qzh: "我{x}嗎?",
    requires: ["word_i", "word_am"],
    slots: { x: { pos: "adj", flags: ["emotion"] } }
  },
  {
    id: "pat_i_look_at_noun",
    text: "I look at a {x}.",
    zh: "我看著一個{x}。",
    requires: ["word_i", "word_look", "word_at"],
    slots: { x: { pos: "noun", flags: ["visible"] } }
  },
  {
    id: "pat_i_make_noun",
    text: "I make {x}.",
    zh: "我做{x}。",
    requires: ["word_i", "word_make"],
    slots: { x: { pos: "noun", flags: ["makeable"] } }
  },
  {
    id: "pat_i_get_noun",
    text: "I get a {x}.",
    zh: "我拿到一個{x}。",
    requires: ["word_i", "word_get"],
    slots: { x: { pos: "noun", flags: ["buyable"] } }
  },
  {
    id: "pat_i_speak_language",
    text: "I speak {x}.",
    zh: "我會說{x}。",
    requires: ["word_i", "word_speak"],
    slots: { x: { pos: "noun", flags: ["language"] } }
  },
  // 救活孤兒動詞:go / say / listen / hear。固定句(slots 空)跟工作軌同機制。
  {
    id: "pat_i_go_home",
    text: "I go home.",
    zh: "我回家。",
    requires: ["word_i", "word_go", "word_home"],
    slots: {}
  },
  {
    id: "pat_i_say_hello",
    text: "I say hello.",
    zh: "我打招呼。",
    requires: ["word_i", "word_say", "word_hello"],
    slots: {}
  },
  {
    id: "pat_i_listen_to_music",
    text: "I listen to {x}.",
    zh: "我聽{x}。",
    requires: ["word_i", "word_listen", "word_to"],
    slots: { x: { pos: "noun", flags: ["listenable"] } }
  },
  {
    id: "pat_i_hear_a_noun",
    text: "I hear a {x}.",
    zh: "我聽見{x}的聲音。",
    requires: ["word_i", "word_hear"],
    slots: { x: { pos: "noun", flags: ["audible"] } }
  },
  // 複合句(兩子句)—— 給「你呢?」回應題(sentence_respond)用。用現有的 感受+喝/吃 就組得出,不必加新字。
  // ★ 感受固定配對到合理的動作(渴→喝 / 餓→吃),句子才講得通;tired/sad 不自然接吃喝,不放進來。
  {
    id: "pat_resp_feel_drink",
    text: "I am thirsty. I drink {d}.",
    zh: "我很渴,我喝{d}。",
    requires: ["word_i", "word_am", "word_thirsty", "word_drink"],
    slots: { d: { pos: "noun", flags: ["drinkable"] } }
  },
  {
    id: "pat_resp_feel_eat",
    text: "I am hungry. I eat {f}.",
    zh: "我很餓,我吃{f}。",
    requires: ["word_i", "word_am", "word_hungry", "word_eat"],
    slots: { f: { pos: "noun", flags: ["eatable"] } }
  }
];

/* ============================================================================
   ★ 學習引擎 ★ —— 地基,不管長相。計次熟練度 + 關卡分級 + 批次鞏固 + 間隔重複(詳見 HANDOFF.md)。
   ============================================================================ */
