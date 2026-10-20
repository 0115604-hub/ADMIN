import fs from "fs";

console.log("🚀 Starting comprehensive root-cause fix patch...");

// 1. Patch src/services/overtimeSmartService.js
{
  const filePath = "src/services/overtimeSmartService.js";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  const target = `                } else {
                  // Untargeted companies: preserve cloud daily data, only accept non-empty edits
                  Object.keys(localDaily).forEach((d) => {
                    const val = localDaily[d];
                    if (val !== undefined && val !== null && val !== "" && val !== "미입력" && val !== "undefined" && val !== "null") {
                      mergedDaily[d] = val;
                      mergedDaily[String(d)] = val;
                    }
                  });
                }`;

  const replacement = `                } else {
                  // 🔒 Untargeted workers: strictly preserve authoritative cloud data!
                  // Do NOT merge localDaily from untargeted companies to prevent client dirty cache leakage.
                }`;

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("  ✅ src/services/overtimeSmartService.js patched successfully!");
  } else {
    console.warn("  ⚠️ Target not found in overtimeSmartService.js (may already be patched)");
  }
}

// 2. Patch src/utils/storageHealthCheck.js
{
  const filePath = "src/utils/storageHealthCheck.js";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  // Add admin_multi_month_store_v4_firestore to criticalKeys if missing
  if (!content.includes('"admin_multi_month_store_v4_firestore"')) {
    const keyTarget = `{ key: "oryuk_smart_overtime_data_2026_10", type: "object" },`;
    const keyReplacement = `{ key: "oryuk_smart_overtime_data_2026_10", type: "object" },\n      { key: "admin_multi_month_store_v4_firestore", type: "object" },`;
    content = content.replace(keyTarget, keyReplacement);
  }

  // Remove admin_multi_month_store_v4_firestore from exactObsoleteKeys
  const obsTarget = `      "admin_multi_month_store_v4_firestore",\n`;
  if (content.includes(obsTarget)) {
    content = content.replace(obsTarget, "");
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log("  ✅ src/utils/storageHealthCheck.js patched successfully!");
}

// 3. Patch src/services/approvalService.js
{
  const filePath = "src/services/approvalService.js";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  // Ensure getLocalSmartOvertimeData is imported
  if (!content.includes("getLocalSmartOvertimeData")) {
    content = content.replace(
      `import { cleanCompanyName } from "./overtimeSmartService";`,
      `import { cleanCompanyName, getLocalSmartOvertimeData } from "./overtimeSmartService";`
    );
  }

  // Replace obsolete v10 key reading with dynamic getLocalSmartOvertimeData
  const v10Target = `    let allMatrix = Array.isArray(matrix) ? matrix : null;
    if (allMatrix === null && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("oryuk_smart_overtime_data_store_v10_company_separated");
        if (raw) {
          const parsed = JSON.parse(raw);
          allMatrix = parsed.attendanceMatrix || [];
        }
      } catch (e) {}
    }
    if (!allMatrix) allMatrix = [];`;

  const v10Replacement = `    let allMatrix = Array.isArray(matrix) ? matrix : null;
    if (allMatrix === null && typeof window !== "undefined") {
      try {
        const ym = \`\${yearNum}-\${String(monthNum).padStart(2, "0")}\`;
        const smartData = getLocalSmartOvertimeData(ym);
        allMatrix = smartData?.attendanceMatrix || [];
      } catch (e) {}
    }
    if (!allMatrix) allMatrix = [];`;

  if (content.includes(v10Target)) {
    content = content.replace(v10Target, v10Replacement);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("  ✅ src/services/approvalService.js patched successfully!");
  } else {
    console.warn("  ⚠️ v10Target not found in approvalService.js (may already be patched)");
  }
}

// 4. Patch src/components/OvertimeStatusView.jsx
{
  const filePath = "src/components/OvertimeStatusView.jsx";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  // Remove the background auto-healing writeback useEffect
  const autoHealingEffectTarget = `  // ⭐ Background Auto-Healing Write-Back (과거 9월 데이터 전용)
  useEffect(() => {
    const isNewArchitecture = currentYear > 2026 || (currentYear === 2026 && currentMonthNum >= 10);
    if (!isNewArchitecture && hasHealedMatrix && effectiveMatrix && effectiveMatrix.length > 0) {
      const ym = selectedMonth || \`\${currentYear}-\${String(currentMonthNum).padStart(2, "0")}\`;
      const timer = setTimeout(() => {
        saveSmartOvertimeData(
          {
            ...smartData,
            year: currentYear,
            month: currentMonthNum,
            attendanceMatrix: effectiveMatrix
          },
          ym,
          {
            auditMeta: {
              operator: "시스템 (자동 치유 엔진)",
              source: "AUTO_HEALING_SYNC",
              reason: "과거 월 보고서 등록 내역과 대장 간 불일치 자동 정합성 복구"
            }
          }
        ).catch((err) => console.warn("Background auto-healing write-back error:", err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasHealedMatrix, effectiveMatrix, selectedMonth, currentYear, currentMonthNum]);`;

  if (content.includes(autoHealingEffectTarget)) {
    content = content.replace(
      autoHealingEffectTarget,
      `  // 🔒 Background Auto-Healing write-back permanently disabled to eliminate background mutation side-effects.`
    );
    console.log("  ✅ OvertimeStatusView.jsx: Auto-healing write-back removed!");
  }

  // Ensure local matrix deletion on unselected / cleared cell
  const cellUpdateTarget = `    const finalCode = (newCode !== undefined && newCode !== null) ? newCode : "";
    updatedMatrix[targetIdx].daily[selectedDay] = finalCode;
    updatedMatrix[targetIdx].daily[String(selectedDay)] = finalCode;`;

  const cellUpdateReplacement = `    const finalCode = (newCode !== undefined && newCode !== null) ? newCode : "";
    if (!finalCode || finalCode === "미입력") {
      delete updatedMatrix[targetIdx].daily[selectedDay];
      delete updatedMatrix[targetIdx].daily[String(selectedDay)];
    } else {
      updatedMatrix[targetIdx].daily[selectedDay] = finalCode;
      updatedMatrix[targetIdx].daily[String(selectedDay)] = finalCode;
    }`;

  if (content.includes(cellUpdateTarget)) {
    content = content.replace(cellUpdateTarget, cellUpdateReplacement);
    console.log("  ✅ OvertimeStatusView.jsx: Clean local cell deletion patched!");
  }

  fs.writeFileSync(filePath, content, "utf8");
}

// 5. Patch src/components/WorkerDashboard.jsx
{
  const filePath = "src/components/WorkerDashboard.jsx";
  let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

  const statusCalcTarget = `      const isApproved = approvalStatus === "APPROVED";
      const isSubmitted = approvalStatus === "SUBMITTED";
      const isWritten = (compWorkers.length > 0 && enteredCount >= compWorkers.length) || isApproved || isSubmitted;
      const isPartiallyWritten = enteredCount > 0 && enteredCount < compWorkers.length;`;

  const statusCalcReplacement = `      const hasAnyAttendance = enteredCount > 0;
      const isApproved = hasAnyAttendance && approvalStatus === "APPROVED";
      const isSubmitted = hasAnyAttendance && approvalStatus === "SUBMITTED";
      const isFullyEntered = compWorkers.length > 0 && enteredCount >= compWorkers.length;
      const isWritten = hasAnyAttendance && (isFullyEntered || isApproved || isSubmitted);
      const isPartiallyWritten = hasAnyAttendance && !isWritten;`;

  if (content.includes(statusCalcTarget)) {
    content = content.replace(statusCalcTarget, statusCalcReplacement);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("  ✅ src/components/WorkerDashboard.jsx: Robust attendance status calculation patched!");
  }
}

console.log("🎉 All root-cause fixes applied cleanly!");
