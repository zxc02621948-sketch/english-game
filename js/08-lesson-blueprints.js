// 固定課程藍圖試驗:只接日常第 1~3 關。
// 藍圖決定「先做什麼」;既有題型仍負責選項、回饋、熟練度與答錯補考。
const LESSON_BLUEPRINTS = {
  daily: {
    1: [
      { type:'teach',      target:'word_cat' },
      { type:'teach',      target:'word_book' },
      { type:'picture',    target:'word_cat' },
      { type:'teach',      target:'word_house' },
      { type:'listenword', target:'word_book' },
      { type:'picture',    target:'word_house' },
      { type:'readpick',   target:'word_cat' },
      { type:'match',      target:'word_house' },
    ],
    2: [
      { type:'sentence_build',   target:'word_cat',   pattern:'pat_this_is_a_noun' },
      { type:'listenpick',       target:'word_book' },
      { type:'sentence_meaning', target:'word_book',  pattern:'pat_this_is_a_noun' },
      { type:'picture',          target:'word_house' },
      { type:'sentence_build',   target:'word_house', pattern:'pat_this_is_a_noun' },
      { type:'listenword',       target:'word_cat' },
      { type:'sentence_meaning', target:'word_cat',   pattern:'pat_this_is_a_noun' },
    ],
    3: [
      { type:'listenword',       target:'word_house' },
      { type:'picture',          target:'word_book' },
      { type:'sentence_meaning', target:'word_house', pattern:'pat_this_is_a_noun' },
      { type:'readpick',         target:'word_cat' },
      { type:'sentence_build',   target:'word_book',  pattern:'pat_this_is_a_noun' },
      { type:'match',            target:'word_cat' },
      { type:'listenpick',       target:'word_house' },
    ],
  },
};

const BLUEPRINT_FORMATS = {
  teach:            { skill:null,     run:w => teach(w) },
  readpick:         { skill:'read',   run:w => askReadPick(w) },
  listenpick:       { skill:'listen', run:w => askListenPick(w) },
  listenword:       { skill:'listen', run:w => askListenWord(w) },
  picture:          { skill:'read',   run:w => askPicture(w) },
  match:            { skill:'read',   run:w => askMatch(w) },
};

function lessonBlueprintFor(track = currentTrack, lv = level) {
  const steps = LESSON_BLUEPRINTS[track] && LESSON_BLUEPRINTS[track][lv];
  return Array.isArray(steps) ? steps.map(step => ({ ...step })) : null;
}

function blueprintWords(steps) {
  const seen = new Set(), out = [];
  (steps || []).forEach(step => {
    const w = wordById(step.target);
    if (w && !seen.has(wordKey(w))) { seen.add(wordKey(w)); out.push(w); }
  });
  return out;
}

function blueprintSentence(step) {
  const pattern = PATTERNS.find(p => p.id === step.pattern);
  const target = wordById(step.target);
  if (!pattern || !target) return null;
  const source = BANK.filter(w => rec(w).taught || w.id === target.id);
  return buildSentenceFromPattern(pattern, source, target);
}

function runBlueprintStep(step) {
  const w = wordById(step && step.target);
  if (!step || !w) return nextQuestion();
  current = w;

  if (step.type === 'sentence_build' || step.type === 'sentence_meaning') {
    const sentence = blueprintSentence(step);
    if (!sentence) return nextQuestion();
    const runner = step.type === 'sentence_build'
      ? () => askBuildSentence(
          currentSentenceSourceWords(levelWords),
          () => { onCorrect(w); updateBar(); nextQuestion(); },
          sentence,
          () => { onWrong(w); updateBar(); nextQuestion(); }
        )
      : () => askSentenceMeaning(w, sentence);
    currentRung = 1;
    currentSkill = 'read';
    currentFormatId = step.type;
    lastAsked[wordKey(w)] = runner;
    lastAskedSkill[wordKey(w)] = currentSkill;
    lastAskedFormatId[wordKey(w)] = currentFormatId;
    lastFormat = runner;
    return runner();
  }

  const format = BLUEPRINT_FORMATS[step.type];
  if (!format) return nextQuestion();
  currentRung = step.type === 'teach' ? 0 : 1;
  currentSkill = format.skill;
  currentFormatId = step.type;
  lastAsked[wordKey(w)] = format.run;
  lastAskedSkill[wordKey(w)] = currentSkill;
  lastAskedFormatId[wordKey(w)] = currentFormatId;
  lastFormat = format.run;
  return format.run(w);
}
