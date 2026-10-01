import React from "react";

export const ExtrusionNotesSection = ({ notes = "", onNotesChange }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
      <label className="block font-black text-slate-900 dark:text-white text-xs sm:text-sm">
        ⑤ 특이사항 및 교대 인수인계 사항
      </label>
      <textarea
        rows={2}
        value={notes || ""}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="교대 작업자에게 전달할 내용이나 설비 이상 조짐, 원료 수급 이슈 등을 자유롭게 기재하세요."
        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden resize-none"
      />
    </div>
  );
};

export default ExtrusionNotesSection;
