import React from "react";
import { CheckCircle2, Clock, ShieldCheck, UserCheck } from "lucide-react";
import { getSimpleApprovalPermission } from "../../services/approval/simpleApprovalFlow.js";

/**
 * SimpleApprovalPanel.jsx
 * 삼랑진/한림 특근 및 일반 품의 전용 초경량 독립 결재 패널 (100행 이하)
 */
export const SimpleApprovalPanel = ({ doc, currentProfile, isAdmin, onApprove, isProcessing = false }) => {
  if (!doc) return null;
  const steps = Array.isArray(doc.steps) ? doc.steps : [];
  const perm = getSimpleApprovalPermission(steps, currentProfile, isAdmin);
  const isFinalApproved = doc.status === "APPROVED";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-4 shadow-xl">
      {/* 1. 상단 타이틀 및 상태 배지 */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="font-black text-sm text-slate-100">{doc.title || "전자결재 문서"}</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{doc.plant || "삼랑진공장"}</span>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
          isFinalApproved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
        }`}>
          {isFinalApproved ? "✅ 최종 승인 완료" : `🟡 결재 진행중 (${perm.stepRole || "결재"} 대기)`}
        </span>
      </div>

      {/* 2. 결재선 직관 도장/서명 슬롯 (3단계 또는 4단계) */}
      <div className={`grid gap-2 text-center text-xs ${steps.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
        {steps.map((st, idx) => {
          const isDone = st.status === "APPROVED";
          const isPending = st.status === "PENDING";
          return (
            <div key={idx} className={`p-2.5 rounded-xl border flex flex-col items-center justify-between min-h-[90px] ${
              isDone ? "bg-slate-950 border-emerald-500/40" : isPending ? "bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/40" : "bg-slate-950/60 border-slate-800 opacity-60"
            }`}>
              <div className="text-[11px] font-bold text-slate-400">{st.role} ({st.title || "책임"})</div>
              <div className="my-1">
                {isDone ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {st.name}
                  </span>
                ) : isPending ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500 text-amber-300 font-black text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400 animate-spin" /> {st.name}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs font-bold">{st.name}</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{st.date ? st.date.slice(5) : "대기"}</div>
            </div>
          );
        })}
      </div>

      {/* 3. 승인 권한자 전용 액션 버튼 (해당 순번 결재자만 활성화) */}
      {perm.canApprove && !isFinalApproved && (
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onApprove(perm.stepIndex, currentProfile?.name || perm.stepName)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            <span>[{perm.stepRole}: {currentProfile?.name || perm.stepName}] 결재 승인 날인</span>
          </button>
        </div>
      )}
    </div>
  );
};
