import React from "react";
import { FileSpreadsheet, Settings } from "lucide-react";

export const MachiningTableHeader = ({
  filteredReportsCount,
  handleOpenTemplateSetting
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-teal-600 text-white shadow-md shrink-0">
          <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h3 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <span>(주)오륙 삼랑진공장 가공동 작업일보 실시간 현황</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-black">
              {filteredReportsCount}건
            </span>
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            HR • JA (G/RUN) · NX5a (PTR) 가공 4대 공정 실시간 보고서 관리
          </span>
        </div>
      </div>

      {/* 5대 공정 양식 설정 버튼 3종 (HR / JA / NX5a) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => handleOpenTemplateSetting("HR")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          title="탭하면 5대 공정 양식 리스트를 열어 HR 적용 양식을 설정합니다"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>🚚 HR 양식설정</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpenTemplateSetting("JA")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          title="탭하면 5대 공정 양식 리스트를 열어 JA 적용 양식을 설정합니다"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>🚗 JA 양식설정</span>
        </button>
        <button
          type="button"
          onClick={() => handleOpenTemplateSetting("NX5A")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition cursor-pointer"
          title="탭하면 5대 공정 양식 리스트를 열어 NX5a 적용 양식을 설정합니다"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>⚡ NX5a 양식설정</span>
        </button>
      </div>
    </div>
  );
};

export default MachiningTableHeader;
