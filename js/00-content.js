/* ============================================================================
   單字庫
   ============================================================================ */
const BANK = [
  { id:"word_cat",        en:"cat",        zh:"貓",     pos:"noun", flags:["countable","ownable","presentable","visible","buyable"], syl:["cat"], why:"短字先暖身:cat 就是貓。" },
  { id:"word_happy",      en:"happy",      zh:"開心",   pos:"adj",  flags:["emotion"], syl:["hap","py"], why:"happy 是心情好、覺得開心。" },
  { id:"word_water",      en:"water",      zh:"水",     pos:"noun", flags:["drinkable"], syl:["wa","ter"], why:"water 當名詞是水;也能當動詞,表示澆水。" },
  { id:"word_friend",     en:"friend",     zh:"朋友",   pos:"noun", flags:["countable","ownable","presentable","visible"], syl:["friend"], why:"friend 是你認識、信任、會來往的人。" },
  { id:"word_book",       en:"book",       zh:"書",     pos:"noun", flags:["countable","ownable","readable","presentable","visible","buyable"], syl:["book"], why:"book 是書;生活裡也能當動詞,表示預訂。" },
  { id:"word_beautiful",  en:"beautiful",  zh:"美麗的", pos:"adj",  flags:["descriptive"], syl:["beau","ti","ful"], why:"beauty 是美;-ful 有『充滿』的味道,beautiful 就是充滿美。" },
  { id:"word_project",    en:"project",    zh:"專案",   pos:"noun", flags:["countable","ownable","presentable"], syl:["pro","ject"], why:"pro 有往前的味道;ject 有丟出去的味道,project 像是被往前推進的一件事。" },
  { id:"word_experience", en:"experience", zh:"經驗",   pos:"noun", flags:["ownable"], syl:["ex","pe","ri","ence"], why:"experience 是你親身經過、做過後留下來的東西。" },
  { id:"word_home",       en:"home",       zh:"家",     pos:"noun", flags:["ownable"], syl:["home"], why:"home 重點是『歸屬感』:你回去的地方。" },
  { id:"word_house",      en:"house",      zh:"房子",   pos:"noun", flags:["countable","ownable","presentable","visible","buyable"], syl:["house"], why:"house 重點是建築物:一棟可以住人的房子。" },
  { id:"word_big",        en:"big",        zh:"大的",   pos:"adj",  flags:["descriptive"], syl:["big"], why:"big 表示尺寸、程度或影響很大。" },
  { id:"word_small",      en:"small",      zh:"小的",   pos:"adj",  flags:["descriptive"], syl:["small"], why:"small 表示尺寸、數量或程度小。" },
  { id:"word_good",       en:"good",       zh:"好的",   pos:"adj",  flags:["descriptive"], syl:["good"], why:"good 是最常用的『好』,可以說品質好、狀態好。" },
  { id:"word_bad",        en:"bad",        zh:"壞的",   pos:"adj",  flags:["descriptive"], syl:["bad"], why:"bad 是不好、壞、糟糕。" },
  { id:"word_make",       en:"make",       zh:"製作",   pos:"verb", flags:[], syl:["make"], why:"make 重點是『做出一個結果』。" },
  { id:"word_do",         en:"do",         zh:"做",     pos:"verb", flags:[], syl:["do"], why:"do 是很通用的做,重點是執行一件事。" },
  { id:"word_look",       en:"look",       zh:"看",     pos:"verb", flags:[], syl:["look"], why:"look 是把眼睛轉過去看,有主動看的動作。" },
  { id:"word_see",        en:"see",        zh:"看見",   pos:"verb", flags:[], syl:["see"], why:"see 是看見,重點是結果:你有看到。" },
  { id:"word_listen",     en:"listen",     zh:"聽",     pos:"verb", flags:[], syl:["lis","ten"], why:"listen 是專心聽,有主動注意。" },
  { id:"word_hear",       en:"hear",       zh:"聽見",   pos:"verb", flags:[], syl:["hear"], why:"hear 是耳朵接收到聲音,重點是有聽見。" },
  { id:"word_speak",      en:"speak",      zh:"說話",   pos:"verb", flags:[], syl:["speak"], why:"speak 重點是開口說話或使用某種語言。" },
  { id:"word_say",        en:"say",        zh:"說",     pos:"verb", flags:[], syl:["say"], why:"say 重點是『說出某句話或內容』。" },
  { id:"word_eat",        en:"eat",        zh:"吃",     pos:"verb", flags:[], syl:["eat"], why:"eat 是吃東西,把食物吃下去。" },
  { id:"word_drink",      en:"drink",      zh:"喝",     pos:"verb", flags:[], syl:["drink"], why:"drink 是喝,也可以當名詞表示飲料。" },
  { id:"word_go",         en:"go",         zh:"去",     pos:"verb", flags:[], syl:["go"], why:"go 是離開現在的位置,往別處去。" },
  { id:"word_come",       en:"come",       zh:"來",     pos:"verb", flags:[], syl:["come"], why:"come 是往這裡來,靠近說話者或目的地。" },
  { id:"word_buy",        en:"buy",        zh:"買",     pos:"verb", flags:[], syl:["buy"], why:"buy 是花錢把東西買下來。" },
  { id:"word_bring",      en:"bring",      zh:"帶來",   pos:"verb", flags:[], syl:["bring"], why:"bring 是把東西帶到這裡來。" },
  { id:"word_take",       en:"take",       zh:"拿走",   pos:"verb", flags:[], syl:["take"], why:"take 是拿、帶走、取走。" },
  { id:"word_get",        en:"get",        zh:"得到",   pos:"verb", flags:[], syl:["get"], why:"get 是得到、拿到,很常用。" },
  { id:"word_i",          en:"I",          zh:"我",     pos:"function", flags:[], syl:["I"], why:"I 是說話的人自己,英文句子裡永遠大寫。" },
  { id:"word_am",         en:"am",         zh:"是",     pos:"function", flags:[], syl:["am"], why:"am 只跟 I 搭配:I am happy." },
  { id:"word_this",       en:"this",       zh:"這個",   pos:"function", flags:[], syl:["this"], why:"this 指現在正在說、正在看的『這個』。" },
  { id:"word_is",         en:"is",         zh:"是",     pos:"function", flags:[], syl:["is"], why:"is 用來連接主詞和狀態:This is a cat." },
  { id:"word_a",          en:"a",          zh:"一個",   pos:"function", flags:[], syl:["a"], why:"a 放在單數可數名詞前面,表示一個。" },
  { id:"word_my",         en:"my",         zh:"我的",   pos:"function", flags:[], syl:["my"], why:"my 表示我的,後面接名詞:my book。" },
  { id:"word_and",        en:"and",        zh:"和",     pos:"function", flags:[], syl:["and"], why:"and 把兩個東西接在一起,意思是和、而且。" },
  { id:"word_or",         en:"or",         zh:"或",     pos:"function", flags:[], syl:["or"], why:"or 表示選一個:cat or dog。" },
  { id:"word_read",       en:"read",       zh:"讀",     pos:"verb", flags:[], syl:["read"], why:"read 是讀文字、書或訊息,重點是看懂內容。" },
  // 批3「吃喝與感受」:感受形容詞(I am ___)+ 吃喝動詞與食物飲料(I eat/drink ___)
  { id:"word_hungry",     en:"hungry",     zh:"餓",     pos:"adj",  flags:["emotion"], syl:["hun","gry"], why:"hungry 是肚子餓,想吃東西。" },
  { id:"word_thirsty",    en:"thirsty",    zh:"渴",     pos:"adj",  flags:["emotion"], syl:["thirs","ty"], why:"thirsty 是口渴,想喝東西。" },
  { id:"word_tired",      en:"tired",      zh:"累",     pos:"adj",  flags:["emotion"], syl:["tired"], why:"tired 是累了、沒力氣、想休息。" },
  { id:"word_sad",        en:"sad",        zh:"難過",   pos:"adj",  flags:["emotion"], syl:["sad"], why:"sad 是難過、不開心,跟 happy 相反。" },
  { id:"word_rice",       en:"rice",       zh:"飯",     pos:"noun", flags:["eatable"], syl:["rice"], why:"rice 是米飯,亞洲的主食。" },
  { id:"word_bread",      en:"bread",      zh:"麵包",   pos:"noun", flags:["eatable"], syl:["bread"], why:"bread 是麵包。" },
  { id:"word_tea",        en:"tea",        zh:"茶",     pos:"noun", flags:["drinkable"], syl:["tea"], why:"tea 是茶。" },
  { id:"word_milk",       en:"milk",       zh:"牛奶",   pos:"noun", flags:["drinkable"], syl:["milk"], why:"milk 是牛奶。" },
];

const PATTERNS = [
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
  }
];

/* ============================================================================
   ★ 學習引擎 ★ —— 地基,不管長相。計次熟練度 + 關卡分級 + 批次鞏固 + 間隔重複(詳見 HANDOFF.md)。
   ============================================================================ */
