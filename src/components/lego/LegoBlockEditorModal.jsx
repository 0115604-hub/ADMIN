import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Edit3,
  Image as ImageIcon,
  Sparkles
} from "lucide-react";
import { BLOCK_METADATA_MAP } from "./blockEditors/legoBlockMetadata.js";
import { HeaderInfoBlockEditor } from "./blockEditors/HeaderInfoBlockEditor.jsx";
import { CuttingSpecBlockEditor } from "./blockEditors/CuttingSpecBlockEditor.jsx";
import { JointProcessBlockEditor } from "./blockEditors/JointProcessBlockEditor.jsx";
import { InspectionQualityBlockEditor } from "./blockEditors/InspectionQualityBlockEditor.jsx";
import { CustomBlockTableEditor } from "./blockEditors/CustomBlockTableEditor.jsx";

export { BLOCK_METADATA_MAP };

export const LegoBlockEditorModal = ({
  isOpen,
  onClose,
  blockKey,
  currentReport,
  onUpdateReport,
  onShowToast
}) => {
  const [draftReport, setDraftReport] = useState(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [rightAngleTab, setRightAngleTab] = useState("machines");

  useEffect(() => {
    if (isOpen && currentReport) {
      setDraftReport(JSON.parse(JSON.stringify(currentReport)));
      setShowPhotoPreview(false);
    }
  }, [isOpen, currentReport, blockKey]);

  if (!isOpen || !draftReport || !blockKey) return null;

  const meta = BLOCK_METADATA_MAP[blockKey] || {
    number: "블록",
    title: "블록 편집",
    desc: "블록의 세부 속성을 수정합니다.",
    imgFile: null
  };

  const handleApplyChanges = () => {
    onUpdateReport(draftReport);
    if (onShowToast) {
      onShowToast(`✅ [${meta.title}] 블록 변경사항이 양식에 반영되었습니다.`);
    }
    onClose();
  };

  const inputBaseCls =
    "bg-slate-800 text-white border border-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 rounded-3xl border-2 border-indigo-500/50 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/90 bg-gradient-to-r from-slate-950 via-indigo-950/90 to-slate-950 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-400/50">
              <Edit3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {meta.number}
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {meta.title} 편집
                </h2>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {meta.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {meta.imgFile && (
              <button
                type="button"
                onClick={() => setShowPhotoPreview(!showPhotoPreview)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                  showPhotoPreview
                    ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                    : "bg-slate-800 text-amber-300 border-amber-500/50 hover:bg-slate-700"
                }`}
                title="Excel '레고 양식.xlsx' 원본 실물 사진 대조"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">실물 사진 대조</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Reference Preview */}
        {showPhotoPreview && meta.imgFile && (
          <div className="p-3 bg-slate-950 border-b border-amber-500/40 flex flex-col items-center animate-fadeIn">
            <div className="flex items-center justify-between w-full mb-1.5 px-1">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>엑셀 '레고 양식.xlsx' 실물 원본 캡처 ({meta.number})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPhotoPreview(false)}
                className="text-xs font-bold text-amber-300 hover:underline cursor-pointer"
              >
                접기 ✕
              </button>
            </div>
            <div className="max-h-60 overflow-auto rounded-xl border border-amber-500/40 bg-white p-1.5">
              <img
                src={meta.imgFile}
                alt={meta.title}
                className="max-h-56 object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-left text-xs bg-slate-900 [&_input]:bg-slate-800 [&_input]:text-white [&_input]:border-slate-600 [&_input]:focus:border-cyan-400 [&_select]:bg-slate-800 [&_select]:text-white [&_select]:border-slate-600 [&_textarea]:bg-slate-800 [&_textarea]:text-white [&_textarea]:border-slate-600">
          {["timeAndOutput", "basicInfo", "remarks"].includes(blockKey) && (
            <HeaderInfoBlockEditor
              blockKey={blockKey}
              draftReport={draftReport}
              setDraftReport={setDraftReport}
              inputBaseCls={inputBaseCls}
            />
          )}

          {["workTimeOutput", "specsCutting", "stepCuttingFrt", "stepCuttingRr", "subMaterialLot"].includes(blockKey) && (
            <CuttingSpecBlockEditor
              blockKey={blockKey}
              draftReport={draftReport}
              setDraftReport={setDraftReport}
              inputBaseCls={inputBaseCls}
            />
          )}

          {["jointMaterial", "injectionTemp", "injectionCondition", "jointDefectMatrix"].includes(blockKey) && (
            <JointProcessBlockEditor
              blockKey={blockKey}
              draftReport={draftReport}
              setDraftReport={setDraftReport}
            />
          )}

          {["defectMaterialMatrix", "defectSectionAbc", "drawingSpecCheck", "rightAngleMatrix", "frtRightAngleDefects"].includes(blockKey) && (
            <InspectionQualityBlockEditor
              blockKey={blockKey}
              draftReport={draftReport}
              setDraftReport={setDraftReport}
              rightAngleTab={rightAngleTab}
              setRightAngleTab={setRightAngleTab}
            />
          )}

          {!["timeAndOutput", "basicInfo", "remarks", "workTimeOutput", "specsCutting", "stepCuttingFrt", "stepCuttingRr", "subMaterialLot", "jointMaterial", "injectionTemp", "injectionCondition", "jointDefectMatrix", "defectMaterialMatrix", "defectSectionAbc", "drawingSpecCheck", "rightAngleMatrix", "frtRightAngleDefects"].includes(blockKey) && (
            <CustomBlockTableEditor
              blockKey={blockKey}
              draftReport={draftReport}
              setDraftReport={setDraftReport}
            />
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-700/90 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs transition cursor-pointer"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleApplyChanges}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>이 블록 변경사항 적용</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LegoBlockEditorModal;
