// 註冊日常軌(此時所有內容全域都已載入)
registerTrack('daily', { bank: BANK, batches: BATCHES, patterns: PATTERNS, buildIds: BUILD_SENTENCE_PATTERN_IDS, transformIds: TRANSFORM_PATTERN_IDS, scenarios: SCENARIOS });
// 註冊工作軌(第 2 階內容 = 主題 1、2;第 3 階再接首頁切換)
registerTrack('work', { bank: WORK_BANK, batches: WORK_BATCHES, patterns: WORK_PATTERNS, buildIds: WORK_BUILD_IDS, transformIds: WORK_TRANSFORM_IDS, skills: { write: false } });   // 工作英文:聽讀說為主、不練默寫(承接原始「先求聽懂能回應、不用默寫」的設計意圖)

// 🔧 開發測試工具(玩家不會開 console 打這個,純開發自用):免得每次微調都要從第 1 關重玩到後段
//   dev.jump(30) → 跳到第 30 關(之前各階的字全標學會,句子組得出,當前階留給正常玩)
//   dev.unlockAll() → 全部字+句型解鎖(一次看遍所有題型/後期內容)
window.dev = {
  jump(lv = 1) {
    const st = stageOfLevel(lv);
    BANK.forEach(w => { if (batchOf(w) < st - 1) { const r = rec(w); r.taught = true; r.mastery = 100; r.wrote = true; r.wrote2 = true; r.clozeOk = 3; r.clozeSlots = { a: true, b: true }; r.due = 999; r.ivl = 8; } });
    meta.stage = st; meta.stageStartLevel = (st - 1) * 5 + 1; meta.maxLevel = Math.max(meta.maxLevel || 1, lv); level = lv; meta.clock = lv;
    saveMeta(); save(); showHome();
    return `跳到第 ${lv} 關(第 ${st} 階)`;
  },
  unlockAll() {
    BANK.forEach(w => { const r = rec(w); r.taught = true; r.mastery = 100; r.wrote = true; r.wrote2 = true; r.clozeOk = 3; r.clozeSlots = { a: true, b: true }; });
    if (typeof PATTERNS !== 'undefined') PATTERNS.forEach(p => bumpPat(p.id, 100));
    saveMeta(); save(); showHome();
    return '全部字 + 句型解鎖';
  },
};

showHome();
