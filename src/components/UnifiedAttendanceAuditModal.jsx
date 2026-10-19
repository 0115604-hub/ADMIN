import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Building2,
  Users,
  Clock,
  DollarSign,
  FileText,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { cleanCompanyName, calculateWorkerDailyHours } from "../services/overtimeSmartService.js";
import { useModalHistory } from "../utils/modalHistory";

const COMPANIES = ["오륙", "유성", "조영", "한울", "부림텍"];
const EXPECTED_HEADCOUNTS = {
  "오륙": 53,
  "유성": 14,
  "조영": 44,
  "한울": 26,
  "부림텍": 6
};

const COMPANY_THEMES = {
  "오륙": { badge: "bg-blue-500/20 text-blue-300 border-blue-500/40", border: "border-blue-500/30", text: "text-blue-400" },
  "유성": { badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", border: "border-emerald-500/30", text: "text-emerald-400" },
  "조영": { badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", border: "border-purple-500/30", text: "text-purple-400" },
  "한울": { badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", border: "border-amber-500/30", text: "text-amber-400" },
  "부림텍": { badge: "bg-slate-500/20 text-slate-300 border-slate-500/40", border: "border-slate-500/30", text: "text-slate-400" }
};

export default function UnifiedAttendanceAuditModal({
  isOpen,
  onClose,
  selectedDay = 12,
  currentYear = 2026,
  currentMonthNum = 10,
  attendanceMatrix = [],
  legacyReports = [],
  onSelectCompany
}) {
  useModalHistory(isOpen, onClose, "unifiedAttendanceAuditModal");
  const [copied, setCopied] = useState(false);

  const dateStr = useMemo(() => {
    return `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  }, [currentYear, currentMonthNum, selectedDay]);

  // Compute live unified audit results for all 5 companies
  const auditData = useMemo(() => {
    let grandExpected = 0;
    let grandMatrix = 0;
    let grandAttended = 0;
    let grandAbsence = 0;
    let grandMissing = 0;
    let grandManHours = 0;
    let grandOtHours = 0;
    let grandLaborCost = 0;
    let allPass = true;

    const companyResults = COMPANIES.map((comp) => {
      const expected = EXPECTED_HEADCOUNTS[comp] || 0;
      grandExpected += expected;

      const compWorkers = (attendanceMatrix || []).filter(
        (w) => cleanCompanyName(w.company) === comp
      );
      const workerCount = compWorkers.length;
      grandMatrix += workerCount;

      let attended = 0;
      let totalHours = 0;
      let otHours = 0;
      const absences = [];
      const missingWorkers = [];
      const distribution = { regular: 0, h19: 0, h21: 0, h22: 0, night: 0, special: 0 };

      compWorkers.forEach((w) => {
        const code = w.daily?.[selectedDay] ?? w.daily?.[String(selectedDay)] ?? "";
        const strCode = String(code).trim();
        const { isAttended, weekdayOt, weekendOt, workHours } = calculateWorkerDailyHours(code);

        if (!strCode || strCode === "미입력" || strCode === "undefined" || strCode === "null") {
          missingWorkers.push(w.name);
        } else if (strCode === "-") {
          absences.push(`${w.name}(휴무)`);
        } else if (["결근", "병결", "사결", "공결", "연차", "휴가", "병가", "휴무"].includes(strCode)) {
          absences.push(`${w.name}(${strCode})`);
        } else {
          attended++;
          totalHours += workHours;
          const ot = weekdayOt + weekendOt;
          otHours += ot;

          if (strCode.includes("19")) distribution.h19++;
          else if (strCode.includes("21")) distribution.h21++;
          else if (strCode.includes("22")) distribution.h22++;
          else if (strCode.includes("야간")) distribution.night++;
          else if (strCode.includes("특근")) distribution.special++;
          else distribution.regular++;
        }
      });

      grandAttended += attended;
      grandAbsence += absences.length;
      grandMissing += missingWorkers.length;
      grandManHours += totalHours;
      grandOtHours += otHours;
      const laborCost = totalHours * 15000;
      grandLaborCost += laborCost;

      // Find matching report in legacyReports
      const rep = (legacyReports || []).find((r) => {
        const rComp = cleanCompanyName(r.company);
        return rComp === comp && r.workDate === dateStr;
      });

      const issues = [];
      if (workerCount !== expected) {
        issues.push(`원장 인원(${workerCount}명) != 기준(${expected}명)`);
      }
      if (missingWorkers.length > 0) {
        issues.push(`미선택 근태 ${missingWorkers.length}명`);
      }
      if (!rep) {
        issues.push("보고서 미생성");
      } else {
        if (rep.items && rep.items.length !== expected) {
          issues.push(`보고서 인원(${rep.items.length}건) 불일치`);
        }
        if (typeof rep.totalOtHours === "number" && rep.totalOtHours !== otHours) {
          issues.push(`잔업시간 불일치 (원장:${otHours}H vs 보고서:${rep.totalOtHours}H)`);
        }
      }

      const isPass = issues.length === 0;
      if (!isPass) allPass = false;

      return {
        company: comp,
        expected,
        workerCount,
        attended,
        absences,
        missingWorkers,
        distribution,
        totalHours,
        otHours,
        laborCost,
        report: rep,
        isPass,
        issues
      };
    });

    return {
      dateStr,
      grandExpected,
      grandMatrix,
      grandAttended,
      grandAbsence,
      grandMissing,
      grandManHours,
      grandOtHours,
      grandLaborCost,
      allPass,
      companies: companyResults
    };
  }, [attendanceMatrix, legacyReports, selectedDay, dateStr]);

  if (!isOpen) return null;

  // Handle copy text briefing
  const handleCopyBriefing = () => {
    let text = `========================================================\n`;
    text += `🔍 [전사 5개사 일괄 정합성 검증 브리핑] 기준일자: ${dateStr}\n`;
    text += `========================================================\n\n`;

    auditData.companies.forEach((c) => {
      text += `[${c.company}] ${c.isPass ? "✅ [통과 PASS]" : "⚠️ [확인 필요]"}\n`;
      text += ` • 총원: ${c.workerCount}/${c.expected}명 | 출근: ${c.attended}명 | 미출근: ${c.absences.length > 0 ? c.absences.join(", ") : "없음(전원출근)"}\n`;
      text += ` • 공수: ${c.totalHours} M/H (잔업 ${c.otHours}H) | 노무비: ₩${c.laborCost.toLocaleString()}\n`;
      text += ` • 분포: 정시 ${c.distribution.regular}명, 19시 ${c.distribution.h19}명, 21시 ${c.distribution.h21}명, 22시 ${c.distribution.h22}명, 야간 ${c.distribution.night}명\n`;
      if (c.report) {
        text += ` • 보고서: 등록완료 (${c.report.id}) - items: ${c.report.items?.length || 0}건, ot: ${c.report.totalOtHours || 0}H\n`;
      } else {
        text += ` • 보고서: ⚠️ 미등록\n`;
      }
      if (c.issues.length > 0) {
        text += ` • 특이사항: ${c.issues.join(" | ")}\n`;
      }
      text += `--------------------------------------------------------\n`;
    });

    text += `\n📊 [전사 5개사 일괄 정합성 최종 총계]\n`;
    text += ` • 전사 기준 총원: ${auditData.grandExpected}명 | 원장 총원: ${auditData.grandMatrix}명\n`;
    text += ` • 전사 실제 출근: ${auditData.grandAttended}명 / 미출근: ${auditData.grandAbsence}명 / 미선택: ${auditData.grandMissing}명\n`;
    text += ` • 전사 총 투입공수: ${auditData.grandManHours.toLocaleString()} M/H (기본 ${(auditData.grandAttended * 8).toLocaleString()}H + 잔업 ${auditData.grandOtHours}H)\n`;
    text += ` • 전사 총 산출노무비: ₩${auditData.grandLaborCost.toLocaleString()}\n`;
    text += ` • 전사 5개사 종합판정: ${auditData.allPass ? "🎉 전사 100% 정상 일치 (ALL PASSED)" : "⚠️ 점검 필요 항목 존재"}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  전사 5개사 일괄 정합성 단일 검증 엔진
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  auditData.allPass
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                    : "bg-rose-500/20 text-rose-300 border-rose-400/50"
                }`}>
                  {auditData.allPass ? "🎉 5개사 100% 정상 (ALL PASS)" : "⚠️ 점검 필요"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                기준일자: <strong className="text-cyan-300 font-mono">{dateStr}</strong> (Day {selectedDay}) | 오륙 · 조영 · 한울 · 유성 · 부림텍 전수 검증
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                전사 기준 총원
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {auditData.grandMatrix}명
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  기준 {auditData.grandExpected}명 일치
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                실제 출근 / 미출근
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {auditData.grandAttended}명
                </span>
                <span className="text-xs font-bold text-slate-400">
                  미출근 <strong className="text-amber-400">{auditData.grandAbsence}</strong>명
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                총 투입공수 (M/H)
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                  {auditData.grandManHours.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-indigo-300 font-mono">
                  잔업 {auditData.grandOtHours}H
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                총 산출노무비
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                  ₩{auditData.grandLaborCost.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  @15,000원
                </span>
              </div>
            </div>
          </div>

          {/* 5 Companies Detailed Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>5개 협력사별 정합성 상세 검증 내역</span>
            </h4>

            <div className="space-y-3">
              {auditData.companies.map((c) => {
                const theme = COMPANY_THEMES[c.company] || COMPANY_THEMES["부림텍"];
                return (
                  <div
                    key={c.company}
                    className={`bg-slate-950/90 rounded-2xl p-4 border transition-all ${
                      c.isPass ? "border-slate-800 hover:border-emerald-500/50" : "border-rose-500/60 bg-rose-950/10"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${theme.badge}`}>
                          {c.company}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          총원: <strong className="text-white font-mono">{c.workerCount}/{c.expected}명</strong>
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-xs text-emerald-400 font-bold">
                          출근: <strong className="font-mono">{c.attended}명</strong>
                        </span>
                        {c.absences.length > 0 && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span className="text-xs text-rose-300 font-bold">
                              미출근: {c.absences.join(", ")}
                            </span>
                          </>
                        )}
                        {c.missingWorkers.length > 0 && (
                          <>
                            <span className="text-slate-600">|</span>
                            <span className="text-xs text-amber-300 font-bold animate-pulse">
                              미선택: {c.missingWorkers.length}명
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-cyan-300 font-bold">
                          {c.totalHours} M/H
                        </span>
                        <span className="text-xs font-mono text-slate-500 font-bold">
                          (잔업 {c.otHours}H)
                        </span>
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          ₩{c.laborCost.toLocaleString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black border flex items-center gap-1 ${
                          c.isPass
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                        }`}>
                          {c.isPass ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>정상 PASS</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>점검 필요</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown & Report status row */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Work hours distribution */}
                      <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 font-bold text-[11px]">근무분포:</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold text-[11px] border border-emerald-800/60">
                          정시 {c.distribution.regular}명
                        </span>
                        {c.distribution.h19 > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-bold text-[11px] border border-cyan-800/60">
                            19시 {c.distribution.h19}명
                          </span>
                        )}
                        {c.distribution.h21 > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[11px] border border-indigo-800/60">
                            21시 {c.distribution.h21}명
                          </span>
                        )}
                        {c.distribution.h22 > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 font-bold text-[11px] border border-purple-800/60">
                            22시 {c.distribution.h22}명
                          </span>
                        )}
                        {c.distribution.night > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold text-[11px] border border-rose-800/60">
                            야간 {c.distribution.night}명
                          </span>
                        )}
                        {c.distribution.special > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 font-bold text-[11px] border border-amber-800/60">
                            특근 {c.distribution.special}명
                          </span>
                        )}
                      </div>

                      {/* Report matching status */}
                      <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400 font-bold text-[11px]">전자결재 보고서:</span>
                          {c.report ? (
                            <span className="text-emerald-400 font-mono text-[11px] font-bold">
                              등록완료 ({c.report.items?.length || 0}건 / {c.report.totalOtHours || 0}H)
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold text-[11px]">
                              미등록
                            </span>
                          )}
                        </div>

                        {onSelectCompany && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCompany(c.company);
                              onClose();
                            }}
                            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>상세보기</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Specific Issues / Warnings */}
                    {c.issues.length > 0 && (
                      <div className="mt-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>확인 필요: {c.issues.join(" · ")}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>단일 검증 엔진: 5개사 총원 143명 1:1 전수 일치 기준</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBriefing}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "복사 완료!" : "📋 검증 브리핑 복사"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
