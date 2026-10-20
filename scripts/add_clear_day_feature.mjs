import fs from "fs";

const file = "src/components/OvertimeStatusView.jsx";
let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// Ensure Trash2 is imported from lucide-react
if (!content.includes("Trash2,")) {
  content = content.replace("Trash,", "Trash, Trash2,");
}

// 1. Add handleClearCurrentDayAttendance
const targetFn = `    await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
      targetCompany: selectedCompanyFilter,
      auditMeta: {
        operator: currentProfile?.name || "현장관리자",
        source: "BULK_SET_ALL_REGULAR",
        reason: \`\${currentMonthNum}월 \${selectedDay}일 전체 인원 정시 채우기 (\${updatedCount}명)\`
      }
    });
  };`;

const handlerCode = `    await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
      targetCompany: selectedCompanyFilter,
      auditMeta: {
        operator: currentProfile?.name || "현장관리자",
        source: "BULK_SET_ALL_REGULAR",
        reason: \`\${currentMonthNum}월 \${selectedDay}일 전체 인원 정시 채우기 (\${updatedCount}명)\`
      }
    });
  };

  // 🗑️ 당일 근태 전체 비우기 (선택된 협력사 또는 전체의 선택된 날짜 근태 초기화)
  const handleClearCurrentDayAttendance = async () => {
    if (isDayLocked) {
      triggerToast(\`🔒 \${currentMonthNum}월 \${selectedDay}일은 전자결재 승인 완료(마감) 상태입니다. 먼저 [마감 해제]를 눌러주세요.\`);
      return;
    }
    const compLabel = selectedCompanyFilter === "전체" ? "전사 5개사" : selectedCompanyFilter;
    const confirmMsg = \`🗑️ [\${compLabel} \${currentMonthNum}월 \${selectedDay}일 근태 초기화]\\n\\n해당 일자의 모든 입력 데이터를 비우시겠습니까?\\n(입력된 근태가 삭제되고 미작성 상태로 돌아갑니다)\`;
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      const currentMatrix = smartData.attendanceMatrix || [];
      const updatedMatrix = currentMatrix.map((w) => {
        const wComp = cleanCompanyName(w.company);
        const isTarget = selectedCompanyFilter === "전체" || wComp === cleanCompanyName(selectedCompanyFilter);
        if (!isTarget) return w;
        const newDaily = { ...(w.daily || {}) };
        delete newDaily[selectedDay];
        delete newDaily[String(selectedDay)];
        return {
          ...w,
          daily: newDaily
        };
      });

      const updatedApprovalStatus = { ...(smartData.companyApprovalStatus || {}) };
      if (selectedCompanyFilter === "전체") {
        COMPANIES.forEach((c) => {
          delete updatedApprovalStatus[\`\${cleanCompanyName(c)}_\${selectedDay}\`];
        });
      } else {
        delete updatedApprovalStatus[\`\${cleanCompanyName(selectedCompanyFilter)}_\${selectedDay}\`];
      }

      const newLedger = {
        ...smartData,
        year: currentYear,
        month: currentMonthNum,
        attendanceMatrix: updatedMatrix,
        companyApprovalStatus: updatedApprovalStatus
      };

      setSmartData(newLedger);
      setHasUnsavedChanges(true);

      await saveSmartOvertimeData(newLedger, selectedMonth || "2026-10", {
        targetCompany: selectedCompanyFilter,
        clearedDay: selectedDay,
        auditMeta: {
          operator: currentProfile?.name || "현장관리자",
          source: "DAY_CLEAR_ACTION",
          reason: \`\${compLabel} Day \${selectedDay} 근태 전체 초기화 (미작성 전환)\`
        }
      });
      triggerToast(\`🗑️ [\${compLabel}] \${currentMonthNum}월 \${selectedDay}일 근태가 초기화(미작성)되었습니다.\`);
    } catch (err) {
      console.error(err);
      alert("초기화 중 오류가 발생했습니다: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };`;

if (content.includes(targetFn)) {
  content = content.replace(targetFn, handlerCode);
  console.log("✅ Added handleClearCurrentDayAttendance");
} else {
  console.warn("⚠️ targetFn not found");
}

// 2. Add button in toolbar
const targetBtn = `                    {(() => {
                      const hInfo = getKoreanHolidayInfo(selectedDay, currentYear, currentMonthNum);
                      if (hInfo.isHoliday) return \`🔴 \${hInfo.holidayName} 특근전체\`;
                      if (hInfo.isWeekend) return "🌙 특근전체선택";
                      return "🟢 정시전체선택";
                    })()}
                  </span>
                </button>
              </div>`;

const newBtn = `                    {(() => {
                      const hInfo = getKoreanHolidayInfo(selectedDay, currentYear, currentMonthNum);
                      if (hInfo.isHoliday) return \`🔴 \${hInfo.holidayName} 특근전체\`;
                      if (hInfo.isWeekend) return "🌙 특근전체선택";
                      return "🟢 정시전체선택";
                    })()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleClearCurrentDayAttendance}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer border border-slate-700 hover:border-rose-700"
                  title={\`\${selectedCompanyFilter === "전체" ? "5개사 전원" : selectedCompanyFilter}의 \${currentMonthNum}월 \${selectedDay}일 근태를 완전히 비우고 미작성 상태로 초기화합니다\`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>당일비우기</span>
                </button>
              </div>`;

if (content.includes(targetBtn)) {
  content = content.replace(targetBtn, newBtn);
  console.log("✅ Added clear day button");
} else {
  console.warn("⚠️ targetBtn not found");
}

fs.writeFileSync(file, content, "utf8");
