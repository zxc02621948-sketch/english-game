// 玩法層:有圖像感的具體字 → emoji(看圖選詞用;沒列到的字就不出圖像題)。跟 SPEECH_ALIASES 同層,不進 BANK。
const EMOJI = {
  word_cat:"🐱", word_water:"💧", word_coffee:"☕", word_sugar:"🍬", word_book:"📓", word_happy:"😄", word_friend:"👥", word_house:"🏠", word_home:"🏠",
  word_eat:"🍽️", word_drink:"🥤", word_go:"🚶", word_come:"🙋", word_buy:"🛒",
  word_rice:"🍚", word_bread:"🍞", word_tea:"🍵", word_milk:"🥛",
  word_look:"👀", word_see:"👁️", word_listen:"👂", word_hear:"👂", word_speak:"🗣️",
  word_say:"💬", word_big:"🐘", word_small:"🐜", word_good:"👍", word_bad:"👎",
};

// 玩法層:具體字 → 自製圖(放 img/,優先於 emoji;沒檔 onerror 自動 fallback 回 emoji)。跟 EMOJI 同層,不進 BANK。
const IMG = { word_house:'img/house.png', word_home:'img/home.png', word_big:'img/big.png', word_small:'img/small.png', word_beautiful:'img/beautiful.png', word_project:'img/project.png', word_experience:'img/experience.png' };
const visualOf = w => IMG[wordKey(w)] || EMOJI[wordKey(w)] || null;   // 看圖題的視覺:圖優先、其次 emoji

// 視覺「概念」去重:不同 emoji 但畫面上是同一個東西(👀 看 / 👁️ 看見 都是眼睛)→ 看圖題要當成同一視覺,免得圖分不出 look/see。同視覺守衛用這個比,不是比 emoji 字串。
const VISUAL_ALIAS = { '👁️': '👀' };
const visualKey = w => { const v = visualOf(w); return v ? (VISUAL_ALIAS[v] || v) : null; };

const picHTML = (w, size = 130) => {                                  // 把視覺(圖/emoji)渲染出來,看圖說 / 看圖寫共用
  const v = visualOf(w); if (!v) return '';
  return v.endsWith('.png') ? `<img src="${v}" alt="" style="width:${size}px;height:${size}px;object-fit:contain">` : `<div style="font-size:64px">${v}</div>`;
};
