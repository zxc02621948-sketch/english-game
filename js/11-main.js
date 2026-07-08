// 註冊日常軌(此時所有內容全域都已載入)
registerTrack('daily', { bank: BANK, batches: BATCHES, patterns: PATTERNS, buildIds: BUILD_SENTENCE_PATTERN_IDS, transformIds: TRANSFORM_PATTERN_IDS, scenarios: SCENARIOS });
// 註冊工作軌(第 2 階內容 = 主題 1、2;第 3 階再接首頁切換)
registerTrack('work', { bank: WORK_BANK, batches: WORK_BATCHES, patterns: WORK_PATTERNS, buildIds: WORK_BUILD_IDS, transformIds: WORK_TRANSFORM_IDS, skills: { write: false } });   // 工作英文:聽讀說為主、不練默寫(承接原始「先求聽懂能回應、不用默寫」的設計意圖)
showHome();
