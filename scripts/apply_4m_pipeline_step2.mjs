import fs from "fs";

console.log("🚀 Starting Step 2: Canonical 4M Pipeline replacement in UI components...");

// 1. Update src/components/dashboard/UnifiedAbnormalityControlPanel.jsx
{
  const filePath = "src/components/dashboard/UnifiedAbnormalityControlPanel.jsx";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  // Ensure getCore4MId, getNormalizedTitleKey, mergeUnified4MRecords are imported
  if (!content.includes("getCore4MId")) {
    content = content.replace(
      `import {\n  subscribeFourMChangePoints,`,
      `import {\n  getCore4MId,\n  getNormalizedTitleKey,\n  mergeUnified4MRecords,\n  subscribeFourMChangePoints,`
    );
  }

  // Fix lines 649, 697, 745: alert.status !== "ACTIVE" condition bug
  content = content.replace(
    `const isResolved = alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && alert.actionResult.trim()));`,
    `const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));`
  );
  content = content.replace(
    `const isResolved = alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && alert.actionResult.trim()));`,
    `const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));`
  );
  content = content.replace(
    `const isResolved = alert.status === "RESOLVED" || (alert.status !== "ACTIVE" && Boolean(alert.actionResult && alert.actionResult.trim()));`,
    `const isResolved = Boolean(alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.isResolved || (alert.actionResult && alert.actionResult.trim().length > 0));`
  );

  // Replace section 6 and the return mapping with Canonical 4M Pipeline
  const oldSection6Target = `    // -----------------------------------------------------------------------
    // 6. [4M Ledger] 공식 4M 변동점 관리대장(four_m_change_points) 등록 건 직접 수합
    // -----------------------------------------------------------------------
    (fourMLedgerRecords || []).forEach((rec) => {
      if (!rec) return;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      if (
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      ) {
        return;
      }

      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");

      const existingIdx = unified.findIndex((u) => {
        const uId = String(u.id || "");
        const uOrig = String(u.originalId || "");
        const uRaw = String(u.raw?.id || "");
        return (
          uId === recId ||
          uId === origId ||
          uId === \`urg_\${origId}\` ||
          uId === \`urg_\${recId}\` ||
          (origId && (uOrig === origId || uId === origId || uRaw === origId)) ||
          (rawId && (uRaw === rawId || uId === rawId || uOrig === rawId)) ||
          (origId && uId.includes(origId))
        );
      });

      if (existingIdx >= 0) {
        // 공식 대장에 지정된 4M 분류가 있다면 취합된 항목에 최우선 적용
        if (rec.fourM && ["Machine", "Man", "Material", "Method"].includes(rec.fourM)) {
          unified[existingIdx] = {
            ...unified[existingIdx],
            fourM: rec.fourM,
            isManualFourM: true,
            badgeColor: rec.badgeColor || getFourMBadgeColor(rec.fourM)
          };
        }
      } else {
        unified.push({
          id: recId.startsWith("ledger_") ? recId : \`ledger_\${recId}\`,
          originalId: origId || recId,
          rawId: rawId,
          fourM: rec.fourM || determineFourMCategory(rec),
          origin: rec.origin || "변동점대장",
          sourceType: rec.sourceType || "OFFICIAL_LEDGER",
          badgeColor: rec.badgeColor || getFourMBadgeColor(rec.fourM || "Method"),
          plant: rec.plant || "삼랑진공장",
          line: rec.line || "생산/품질",
          writer: rec.writer || rec.registeredBy || "관리자",
          title: rec.title || "(변동점)",
          date: rec.date || todayStr,
          time: rec.time || "",
          content: rec.content || "",
          actionResult: rec.actionResult || "",
          actionAuthor: rec.actionAuthor || "",
          actionAt: rec.actionAt || "",
          images: Array.isArray(rec.images) ? rec.images : [],
          actionImages: Array.isArray(rec.actionImages) ? rec.actionImages : [],
          replies: Array.isArray(rec.replies) ? rec.replies : [],
          isResolved: Boolean(rec.isResolved),
          validation: rec.validation || (rec.isResolved ? "조치 및 유효성 확인 완료" : "유효성 검증 대기중"),
          severity: rec.severity || "NORMAL",
          downtimeMinutes: Number(rec.downtimeMinutes) || 0,
          scrapKg: Number(rec.scrapKg) || 0,
          raw: rec,
          isOfficialLedger: true
        });
      }
    });

    const ledgerSet = new Set(
      (fourMLedgerRecords || []).flatMap((r) => [r.originalId, r.id, r.rawId, \`ledger_\${r.originalId}\`, \`ledger_\${r.id}\`].filter(Boolean))
    );

    // 최신 발생일자 DESC, ID DESC 정렬 및 대장 등록 여부 매핑
    return unified
      .map((item) => ({
        ...item,
        isRegisteredInLedger:
          ledgerSet.has(item.id) ||
          ledgerSet.has(\`ledger_\${item.id}\`) ||
          Boolean(item.raw?.id && ledgerSet.has(item.raw.id)) ||
          item.origin === "부적합경보" ||
          item.sourceType === "QUALITY_ALERT"
      }))
      .sort((a, b) => {
        if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
        if (b.time !== a.time) return (b.time || "").localeCompare(a.time || "");
        return String(b.id || "").localeCompare(String(a.id || ""));
      });`;

  const newCanonicalSection = `    // -----------------------------------------------------------------------
    // 6. [Canonical 4M Pipeline] 공식 4M 변동점 관리대장(four_m_change_points) 및 전 소스 단일 원천 통합
    // -----------------------------------------------------------------------
    const rawLedgerItems = (fourMLedgerRecords || []).filter((rec) => {
      if (!rec) return false;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      return !(
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      );
    }).map((rec) => {
      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");
      return {
        id: recId.startsWith("ledger_") ? recId : \`ledger_\${recId}\`,
        originalId: origId || recId,
        rawId: rawId,
        fourM: rec.fourM || determineFourMCategory(rec),
        origin: rec.origin || "변동점대장",
        sourceType: rec.sourceType || "OFFICIAL_LEDGER",
        badgeColor: rec.badgeColor || getFourMBadgeColor(rec.fourM || "Method"),
        plant: rec.plant || "삼랑진공장",
        line: rec.line || "생산/품질",
        writer: rec.writer || rec.registeredBy || "관리자",
        title: rec.title || "(변동점)",
        date: rec.date || todayStr,
        time: rec.time || "",
        content: rec.content || "",
        actionResult: rec.actionResult || "",
        actionAuthor: rec.actionAuthor || "",
        actionAt: rec.actionAt || "",
        images: Array.isArray(rec.images) ? rec.images : [],
        actionImages: Array.isArray(rec.actionImages) ? rec.actionImages : [],
        replies: Array.isArray(rec.replies) ? rec.replies : [],
        isResolved: Boolean(rec.isResolved),
        validation: rec.validation || (rec.isResolved ? "조치 및 유효성 확인 완료" : "유효성 검증 대기중"),
        severity: rec.severity || "NORMAL",
        downtimeMinutes: Number(rec.downtimeMinutes) || 0,
        scrapKg: Number(rec.scrapKg) || 0,
        raw: rec,
        isOfficialLedger: true
      };
    });

    // 🔒 Canonical Single Source of Truth Pipeline: 중복 레코드 원천 차단 및 단일화
    const canonicalMap = new Map();
    const titleIndexMap = new Map();

    [...unified, ...rawLedgerItems].forEach((item) => {
      if (!item) return;
      const coreId = getCore4MId(item);
      const titleKey = getNormalizedTitleKey(item);

      let matchedKey = null;
      if (coreId && coreId.length >= 8 && canonicalMap.has(\`core_\${coreId}\`)) {
        matchedKey = \`core_\${coreId}\`;
      } else if (titleKey && titleIndexMap.has(titleKey)) {
        matchedKey = titleIndexMap.get(titleKey);
      }

      if (matchedKey && canonicalMap.has(matchedKey)) {
        const existing = canonicalMap.get(matchedKey);
        canonicalMap.set(matchedKey, mergeUnified4MRecords(existing, item));
      } else {
        const primaryKey = (coreId && coreId.length >= 8) ? \`core_\${coreId}\` : \`item_\${item.id || Math.random()}\`;
        canonicalMap.set(primaryKey, item);
        if (titleKey) {
          titleIndexMap.set(titleKey, primaryKey);
        }
      }
    });

    const dedupedUnified = Array.from(canonicalMap.values());

    const ledgerSet = new Set(
      (fourMLedgerRecords || []).flatMap((r) => [
        r.originalId,
        r.id,
        r.rawId,
        \`ledger_\${r.originalId}\`,
        \`ledger_\${r.id}\`,
        getCore4MId(r)
      ].filter(Boolean))
    );

    // 최신 발생일자 DESC, ID DESC 정렬 및 대장 등록 여부 매핑
    return dedupedUnified
      .map((item) => {
        const coreId = getCore4MId(item);
        const isReg =
          ledgerSet.has(item.id) ||
          ledgerSet.has(\`ledger_\${item.id}\`) ||
          (coreId && ledgerSet.has(coreId)) ||
          Boolean(item.raw?.id && ledgerSet.has(item.raw.id)) ||
          item.isOfficialLedger ||
          item.origin === "부적합경보" ||
          item.sourceType === "QUALITY_ALERT";

        return {
          ...item,
          isRegisteredInLedger: isReg
        };
      })
      .sort((a, b) => {
        if (b.date !== a.date) return (b.date || "").localeCompare(a.date || "");
        if (b.time !== a.time) return (b.time || "").localeCompare(a.time || "");
        return String(b.id || "").localeCompare(String(a.id || ""));
      });`;

  if (content.includes(oldSection6Target)) {
    content = content.replace(oldSection6Target, newCanonicalSection);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("  ✅ UnifiedAbnormalityControlPanel.jsx updated with Canonical 4M Pipeline!");
  } else {
    console.warn("  ⚠️ oldSection6Target not found in UnifiedAbnormalityControlPanel.jsx");
  }
}

// 2. Update src/components/auth/WorkerPinModal.jsx
{
  const filePath = "src/components/auth/WorkerPinModal.jsx";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  // Ensure getCore4MId, getNormalizedTitleKey, mergeUnified4MRecords are imported
  if (!content.includes("getCore4MId")) {
    content = content.replace(
      `import {\n  subscribeFourMChangePoints,`,
      `import {\n  getCore4MId,\n  getNormalizedTitleKey,\n  mergeUnified4MRecords,\n  subscribeFourMChangePoints,`
    );
  }

  // Replace section 1-6 in WorkerPinModal.jsx
  const pinSection6Target = `    // 1-6. 공식 4M 관리대장(four_m_change_points) 등록 건 직접 수합
    (fourMLedgerRecords || []).forEach((rec) => {
      if (!rec) return;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      if (
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      ) {
        return;
      }

      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");

      const existingIdx = unified.findIndex((u) => {
        const uId = String(u.id || "");
        const uOrig = String(u.originalId || "");
        const uRaw = String(u.raw?.id || "");
        return (
          uId === recId ||
          uId === origId ||
          uId === \`urg_\${origId}\` ||
          uId === \`urg_\${recId}\` ||
          (origId && (uOrig === origId || uId === origId || uRaw === origId)) ||
          (rawId && (uRaw === rawId || uId === rawId || uOrig === rawId)) ||
          (origId && uId.includes(origId))
        );
      });

      if (existingIdx >= 0) {
        if (rec.fourM && ["Machine", "Man", "Material", "Method"].includes(rec.fourM)) {
          unified[existingIdx] = {
            ...unified[existingIdx],
            fourM: rec.fourM
          };
        }
      } else {
        const lineStr = String(rec.line || "").trim();
        const isExt = lineStr.includes("압출") || lineStr.includes("PCM") || lineStr.includes("PVC") || lineStr.includes("TPE");
        unified.push({
          id: recId.startsWith("ledger_") ? recId : \`ledger_\${recId}\`,
          fourM: rec.fourM || determineFourMCategory(rec),
          origin: rec.origin || "변동점대장",
          plant: rec.plant || "삼랑진공장",
          line: rec.line || (isExt ? "압출라인" : "가공/품질"),
          title: rec.title || "(변동점)",
          content: rec.content || "",
          actionResult: rec.actionResult || "",
          date: rec.date || todayKst,
          isResolved: Boolean(rec.isResolved),
          isExtrusion: isExt
        });
      }
    });

    return unified.sort((a, b) => (b.date || "").localeCompare(a.date || ""));`;

  const newPinSection = `    // 1-6. [Canonical 4M Pipeline] 공식 4M 변동점 관리대장 등록 건 직접 수합 및 완전 단일화
    const rawLedgerItems = (fourMLedgerRecords || []).filter((rec) => {
      if (!rec) return false;
      const cat = String(rec.category || rec.sourceCategory || rec.raw?.category || "").trim();
      const origin = String(rec.origin || "").trim();
      return !(
        cat === "오픈이슈" ||
        cat === "open_issue" ||
        cat.includes("오픈이슈") ||
        origin === "오픈이슈" ||
        cat === "회의일정" ||
        cat.includes("회의") ||
        cat === "공지사항" ||
        cat === "사내공지"
      );
    }).map((rec) => {
      const recId = String(rec.id || "");
      const origId = String(rec.originalId || "");
      const rawId = String(rec.rawId || "");
      const lineStr = String(rec.line || "").trim();
      const isExt = lineStr.includes("압출") || lineStr.includes("PCM") || lineStr.includes("PVC") || lineStr.includes("TPE");
      return {
        id: recId.startsWith("ledger_") ? recId : \`ledger_\${recId}\`,
        originalId: origId || recId,
        rawId: rawId,
        fourM: rec.fourM || determineFourMCategory(rec),
        origin: rec.origin || "변동점대장",
        plant: rec.plant || "삼랑진공장",
        line: rec.line || (isExt ? "압출라인" : "가공/품질"),
        title: rec.title || "(변동점)",
        content: rec.content || "",
        actionResult: rec.actionResult || "",
        date: rec.date || todayKst,
        isResolved: Boolean(rec.isResolved),
        isExtrusion: isExt,
        isOfficialLedger: true
      };
    });

    // 🔒 Canonical Single Source of Truth Pipeline
    const canonicalMap = new Map();
    const titleIndexMap = new Map();

    [...unified, ...rawLedgerItems].forEach((item) => {
      if (!item) return;
      const coreId = getCore4MId(item);
      const titleKey = getNormalizedTitleKey(item);

      let matchedKey = null;
      if (coreId && coreId.length >= 8 && canonicalMap.has(\`core_\${coreId}\`)) {
        matchedKey = \`core_\${coreId}\`;
      } else if (titleKey && titleIndexMap.has(titleKey)) {
        matchedKey = titleIndexMap.get(titleKey);
      }

      if (matchedKey && canonicalMap.has(matchedKey)) {
        const existing = canonicalMap.get(matchedKey);
        canonicalMap.set(matchedKey, mergeUnified4MRecords(existing, item));
      } else {
        const primaryKey = (coreId && coreId.length >= 8) ? \`core_\${coreId}\` : \`item_\${item.id || Math.random()}\`;
        canonicalMap.set(primaryKey, item);
        if (titleKey) {
          titleIndexMap.set(titleKey, primaryKey);
        }
      }
    });

    return Array.from(canonicalMap.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));`;

  if (content.includes(pinSection6Target)) {
    content = content.replace(pinSection6Target, newPinSection);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("  ✅ WorkerPinModal.jsx updated with Canonical 4M Pipeline!");
  } else {
    console.warn("  ⚠️ pinSection6Target not found in WorkerPinModal.jsx");
  }
}

console.log("🎉 Step 2 Complete!");
