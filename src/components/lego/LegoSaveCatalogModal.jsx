import React from "react";
import { FolderPlus, Database, Save } from "lucide-react";

export const LegoSaveCatalogModal = ({
  isOpen = false,
  onClose,
  catalogMeta = {},
  setCatalogMeta,
  REPORT_MAJOR_CATEGORIES = [],
  handleConfirmSaveCatalog
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 text-white border-2 border-indigo-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">5대 공정 템플릿 보관함 저장</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1">
                  <Database className="w-3 h-3 text-cyan-300" />
                  <span>DB 보관함 공식등록</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                현재 구성한 레고블록 양식을 템플릿 카탈로그에 공식 등록합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block font-black text-cyan-300 mb-1">5대 공정 대분류 선택</label>
            <select
              value={catalogMeta.categoryId}
              onChange={(e) => setCatalogMeta?.({ ...catalogMeta, categoryId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
            >
              {REPORT_MAJOR_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name} ({cat.desc})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-black text-cyan-300 mb-1">템플릿 양식명</label>
            <input
              type="text"
              value={catalogMeta.title}
              onChange={(e) => setCatalogMeta?.({ ...catalogMeta, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
              placeholder="예: JA G/RUN 표준 정밀가공 작업일보"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-cyan-300 mb-1">적용 차종</label>
              <input
                type="text"
                value={catalogMeta.carModel}
                onChange={(e) => setCatalogMeta?.({ ...catalogMeta, carModel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-amber-300 font-black outline-none focus:border-cyan-400"
                placeholder="예: JA, DL3, EV6"
              />
            </div>
            <div>
              <label className="block font-black text-cyan-300 mb-1">품명</label>
              <input
                type="text"
                value={catalogMeta.partName}
                onChange={(e) => setCatalogMeta?.({ ...catalogMeta, partName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
                placeholder="예: G/RUN, W/STRIP"
              />
            </div>
          </div>

          <div>
            <label className="block font-black text-cyan-300 mb-1">세부 공정명</label>
            <input
              type="text"
              value={catalogMeta.processName}
              onChange={(e) => setCatalogMeta?.({ ...catalogMeta, processName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-cyan-400"
              placeholder="예: 정치절단 및 사출 가공"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirmSaveCatalog}
            className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>보관함에 저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default LegoSaveCatalogModal;
