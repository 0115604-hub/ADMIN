import { Printer, X } from "lucide-react";
import MaterialPrepStandardA4Sheet from "./MaterialPrepStandardA4Sheet";

export const A4PrintPreviewModal = ({ template, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white text-black w-full max-w-4xl max-h-[94vh] rounded-3xl p-5 sm:p-8 overflow-y-auto space-y-4 shadow-2xl text-left">
        <div className="flex items-center justify-between border-b pb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600 text-white">
              <Printer className="w-5 h-5" />
            </span>
            <span className="font-black text-base">A4 표준 실물 서식 인쇄 미리보기</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>A4 인쇄 / PDF 저장</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Container (설계한 모든 블록을 100% 반영하여 출력) */}
        <MaterialPrepStandardA4Sheet template={template} showBlockBadges={false} />
      </div>
    </div>
  );
};

export default A4PrintPreviewModal;
