# 內容新增規則

這份文件規範單字、句型、對話怎麼新增。目標是讓內容能大量擴充，但資料不要變肥。

## 單字 id

- 格式: `word_英文小寫`。
- 只能用小寫英文字母、數字、底線。
- 不要用中文，不要用流水號，不要之後隨便改。
- 例: `word_cat`, `word_water`, `word_project`。

## 句型 id

- 格式: `pat_句型摘要`。
- 用小寫英文與底線描述結構，不描述單一單字。
- 例: `pat_this_is_a_noun`, `pat_i_drink_noun`。

## 對話 id

- 格式: `dlg_主題_用途`。
- 對話還沒實作；先保留命名規則。
- 例: `dlg_cafe_order`, `dlg_school_intro`。

## pos 可用值

- `noun`: 名詞。
- `verb`: 動詞。
- `adj`: 形容詞。
- `function`: 功能詞，例如 is, this, my, a。

先不要新增其他 pos。真的不夠用時，再先改這份文件。

## flags 命名規則

- 用小寫英文與底線。
- flags 只服務句型模板篩選，不是百科分類。
- 目前可用 flags:
  - `countable`: 可數名詞；若要放進 `This is a {x}.`，還要同時有 `presentable`。
  - `presentable`: 適合被介紹為「這是一個...」的具體名詞。
  - `ownable`: 可被擁有，可放進 `This is my {x}.`
  - `drinkable`: 可喝的名詞，可放進 `I drink {x}.`，例如 `water/tea/milk`。
  - `sweetenable`: 適合加糖的飲料，可放進 `{x} with sugar.`，例如 `coffee/tea/milk`。
  - `sweetener`: 可加進飲料的甜味材料，可放進 `{drink} with {x}.`，例如 `sugar`。
  - `readable`: 可讀的名詞，可放進 `I read a {x}.`
  - `eatable`: 可吃的名詞，可放進 `I eat {x}.`，例如 `rice/bread`。先用不可數主食（不接冠詞）；要可數食物（apple→an）再另開句型。
  - `visible`: 看得到的具體東西（含人），可放進 `I see a {x}.`，例如 `cat/book/friend/house`。抽象的（project/experience）不要給。
  - `buyable`: 買得到的東西，可放進 `I buy a {x}.`，例如 `cat/book/house`。不給 `friend`（不買朋友）、不給抽象名詞。
  - `emotion`: 情緒形容詞，可放進 `I am {x}.`
  - `descriptive`: 可描述物件狀態的形容詞，可放進 `This is {x}.`，例如 `beautiful/big/small/good/bad`。不要給 `happy` 這種人/心情狀態，避免出 `This is happy.`

不要新增沒有句型會用到的 flags。

## 新增單字必填欄位

```js
{
  id: "word_cat",
  en: "cat",
  zh: "貓",
  pos: "noun",
  flags: ["countable", "ownable", "presentable"],
  syl: ["cat"],
  why: "短字先暖身:cat 就是貓。"
}
```

- `id`: 穩定識別用。
- `en`: 英文原字。
- `zh`: 中文意思。
- `pos`: 詞性，只用上面列出的值。
- `flags`: 只放目前句型會用到的標籤；沒有就用空陣列。
- `syl`: 音節陣列；不確定就先放整個字。
- `why`: 本遊戲核心，必填。只解釋這個字本身，不要塞衍生字清單。

## function words

目前已收的功能詞:

- `I`
- `am`
- `this`
- `is`
- `a`
- `my`
- `and`
- `or`
- `with`
- `please`

功能詞 `pos` 用 `function`。除非句型模板真的需要，不要替功能詞亂加 flags。

## 新增句型注意事項

- 句型用 `{x}`、`{y}` 這類 slot，不要直接寫死單字。
- 句型必須有 `requires`，列出固定會出現在句子裡、不是 slot 的已收單字 id。
- `requires` 裡的字必須已 taught，句型才能出題。
- 每個 slot 都要寫 `pos` 和必要的 `flags`。
- 句型只能抽符合 `pos + flags` 的字。
- 符合條件的字不夠時，跳過該句型，不要硬組怪句子。
- 組句題目前支援 `This is a {x}.`、`This is my {x}.`、`This is {x}.`、`I am {x}.`、`I see a {x}.`、`I buy a {x}.`、`I read a {x}.`、`I drink {x}.`、`I eat {x}.`(動詞句的動詞放 `requires`,受詞放 slot)
- **問句形(轉換題用)**:**be 動詞句**(`This is …`、`I am …`)可加 `q` / `qzh` 兩個欄位,寫問句模板(例 `q:"Is this a {x}?"`、`qzh:"這是一個{x}嗎?"`;`I am {x}` → `q:"Am I {x}?"`)。有 `q` 的句型才會進「轉換題」(`askTransform`:把直述句的同一批字重排成問句)。
  - 只放「be 動詞提到句首」就成立的:`This is → Is this`、`I am → Am I`。**不要寫 `Are you …?` 這種**——那換了字(am→are、I→you),不是純重排,不符合轉換題機制。
  - `I + 一般動詞` 句(I see / I buy …)**不要加 `q`**(變問句要 do/does,不是純重排)。
- ⚠ 動詞句的受詞 slot 要選對 flag,不然會出怪句:`I buy a {x}` 用 `buyable`(別讓 friend/抽象字進來)、`I see a {x}` 用 `visible`。新增動詞句前先確認受詞池每個字套進去都自然。
- `This is a {x}.` 要用 `countable + presentable`，不要只用 `countable`，避免抽到不自然的字。
- `This is {x}.` 只給 `descriptive` 形容詞，不要把所有 adj 都塞進去。

## 禁止事項

- 不要在單字上手寫 `canUse`, `canDrink`, `canRead` 這類玩法欄位。
- 不要在單字上塞完整例句題庫。
- 不要手寫大量重複完整句子；用 `PATTERNS` 產生。
- 不要新增沒有模板會用到的 flags。
- 不要把對話內容塞進單字資料。
- 不要改 SRS 引擎來配合某個單字或某個句型。
