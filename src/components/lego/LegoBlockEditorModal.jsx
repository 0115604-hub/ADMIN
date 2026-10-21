import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Save,
  RotateCcw,
  HelpCircle,
  Info,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import { LEGO_IMAGE_REFERENCES } from "./LegoWorkReportBuilder.jsx";

// Block Metadata for labels and descriptions
export const BLOCK_METADATA_MAP = {
  timeAndOutput: {
    number: "블록 1",
    title: "조인트 작업자 / 시간 / 생산수량",
    desc: "구분(FRT LH/RH, RR LH/RH), 작업자, 작업시간 및 정품/불량/재조인트 수량 관리",
    imgFile: "/lego_images/lego_block_1.png"
  },
  basicInfo: {
    number: "블록 8",
    title: "공정명 & 차종/품명 표준 헤더",
    desc: "공정명, 차종(Car model), 품명(Part name), 작업자, 근무조, 시작/종료 시간 등 기본 메타데이터",
    imgFile: "/lego_images/lego_block_8.png"
  },
  workTimeOutput: {
    number: "블록 9",
    title: "작업시간 및 생산량(실적) 테이블",
    desc: "구분(FRT LH/RH, RR LH/RH)별 A단면/B단면 작업시간(시작/종료) 및 생산수량",
    imgFile: "/lego_images/lego_block_9.png"
  },
  specsCutting: {
    number: "블록 15",
    title: "정치 절단 길이 (Spec cutting) & LOT NO.",
    desc: "단면(A, B, C...) x 규격1(881±3 등) 및 규격2(488±3 가절단 등) 초물/중물/종물 실측치 & LOT NO.",
    imgFile: "/lego_images/lego_block_15.png"
  },
  stepCuttingFrt: {
    number: "블록 2",
    title: "2. 단컷팅 - FRT 구간 치수",
    desc: "FRT 구분 A(49mm), B(45mm) x SPEC 및 초물/중물/종물 실측치 관리",
    imgFile: "/lego_images/lego_block_2.png"
  },
  stepCuttingRr: {
    number: "블록 3",
    title: "2. 단컷팅 - RR 구간 치수",
    desc: "RR 구분 A(40mm), B(39mm) x SPEC 및 초물/중물/종물 실측치 관리",
    imgFile: "/lego_images/lego_block_3.png"
  },
  subMaterialLot: {
    number: "블록 11",
    title: "부자재 LOT NO. (패드 5T)",
    desc: "스폰지 패드 5T 입고일자 및 LOT 번호 관리 (도면 5T*5W*60L)",
    imgFile: "/lego_images/lego_block_11.png"
  },
  defectMaterialMatrix: {
    number: "블록 10",
    title: "불량소재구분 (8열 매트릭스)",
    desc: "FRT LH/RH A/B, RR LH/RH A/B (총 8열) x 압출소재불량(외면흠/오염/코팅/단면) 및 공정간불량",
    imgFile: "/lego_images/lego_block_10.png"
  },
  defectSectionAbc: {
    number: "블록 16",
    title: "불량소재구분 (Section A / B / C 3단면)",
    desc: "Section A, B, C 단면별 길이 미달, 와이어 노출, 단컷팅 불량 집계표",
    imgFile: "/lego_images/lego_block_16.png"
  },
  jointMaterial: {
    number: "블록 4",
    title: "3. 조인트 재료 (Joint Material)",
    desc: "조인트 재료명 (Grade name: SJ-4004B EPDM) & LOT NO 관리",
    imgFile: "/lego_images/lego_block_4.png"
  },
  injectionTemp: {
    number: "블록 5",
    title: "4. 사출온도 (Temperature)",
    desc: "Sett'g / Actual x Injection A, B, RR x 노즐, N2, H3, H4 온도 관리",
    imgFile: "/lego_images/lego_block_5.png"
  },
  injectionCondition: {
    number: "블록 6",
    title: "5. 사출조건 (Injection Condition)",
    desc: "거리(125mm), 속도(45mm/s), 압력(140bar), 시간(18.5s) x 초물/중물/종물 조건 관리",
    imgFile: "/lego_images/lego_block_6.png"
  },
  jointDefectMatrix: {
    number: "블록 7",
    title: "6. 조인트 공정불량 종합 매트릭스",
    desc: "10대 불량 항목 x 폐기불량(FRT/RR), 재조인트수량, 공정간불량 관리",
    imgFile: "/lego_images/lego_block_7.png"
  },
  drawingSpecCheck: {
    number: "블록 12",
    title: "도면 치수 & 중요 검사 현황 LH",
    desc: "부품 도면 다이어그램 A, B, D 위치 대조 및 실측 검사 (482±3, 658±5, 패드 5T)",
    imgFile: "/lego_images/lego_block_12.png"
  },
  rightAngleMatrix: {
    number: "블록 13, 14",
    title: "완제품 직각검사 일보 종합 매트릭스",
    desc: "LH/RH 2/3호기 라인 x 생산수량, 압출불량, 조인트불량, 후가공불량 3대 집계",
    imgFile: "/lego_images/lego_block_14.png"
  },
  frtRightAngleDefects: {
    number: "블록 17",
    title: "FRT 직각검사 불량 집계표 (FRT LH / RH)",
    desc: "립컷팅 누락, 패드 누락, 외면 오염, 미사상, 과사상, 조인트 씹힘 등 (17번째 실물 블록)",
    imgFile: "/lego_images/lego_block_17.png"
  },
  remarks: {
    number: "블록 16+",
    title: "특기 사항 및 조치 사항 (Remarks)",
    desc: "칼날 교체, 이상 발생 시 조치 이력 및 특별 공지사항 기록",
    imgFile: null
  }
};

export const LegoBlockEditorModal = ({
  isOpen,
  onClose,
  blockKey,
  currentReport,
  onUpdateReport,
  onShowToast
}) => {
  // Local state clone of current report for editing
  const [draftReport, setDraftReport] = useState(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [rightAngleTab, setRightAngleTab] = useState("machines"); // 'machines' | 'extrusion' | 'joint' | 'post'

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

  // Save handler
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
        
        {/* =================================================================== */}
        {/* Modal Header (고시인성 다크 네이비 헤더) */}
        {/* =================================================================== */}
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

        {/* =================================================================== */}
        {/* Photo Reference Preview (Toggleable) */}
        {/* =================================================================== */}
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

        {/* =================================================================== */}
        {/* Modal Scrollable Body (다크 슬레이트 배경 + 고대비 입력창) */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-left text-xs bg-slate-900 [&_input]:bg-slate-800 [&_input]:text-white [&_input]:border-slate-600 [&_input]:focus:border-cyan-400 [&_select]:bg-slate-800 [&_select]:text-white [&_select]:border-slate-600 [&_textarea]:bg-slate-800 [&_textarea]:text-white [&_textarea]:border-slate-600">
          
          {/* 0. TIME AND OUTPUT BLOCK 1 */}
          {blockKey === "timeAndOutput" && (
            <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
              <span className="font-black text-sm text-cyan-300 block">
                조인트 작업자 및 근무시간 기본 설정 (블록 1)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">작업자 성명</label>
                  <input
                    type="text"
                    value={draftReport.workerName || ""}
                    onChange={(e) => setDraftReport({ ...draftReport, workerName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">시작 시간</label>
                  <input
                    type="time"
                    value={draftReport.startTime || "08:00"}
                    onChange={(e) => setDraftReport({ ...draftReport, startTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">종료 시간</label>
                  <input
                    type="time"
                    value={draftReport.finishTime || "17:00"}
                    onChange={(e) => setDraftReport({ ...draftReport, finishTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 1. BASIC INFO BLOCK 8 */}
          {blockKey === "basicInfo" && (
            <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-cyan-300 block mb-1">일보 전체 제목 (한 줄 통일)</label>
                  <input
                    type="text"
                    value={draftReport.title || "소재준비작업일보"}
                    onChange={(e) => setDraftReport({ ...draftReport, title: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">1. 차종 (Car Model)</label>
                  <input
                    type="text"
                    value={draftReport.carModel || ""}
                    onChange={(e) => setDraftReport({ ...draftReport, carModel: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-black text-amber-300 ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">2. 품명 (Part Name)</label>
                  <input
                    type="text"
                    value={draftReport.partName || ""}
                    onChange={(e) => setDraftReport({ ...draftReport, partName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">3. 공정명 (Process Name)</label>
                  <input
                    type="text"
                    value={draftReport.processName || "소재준비"}
                    onChange={(e) => setDraftReport({ ...draftReport, processName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-bold text-cyan-300 ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">작업자 성명</label>
                  <input
                    type="text"
                    value={draftReport.workerName || ""}
                    onChange={(e) => setDraftReport({ ...draftReport, workerName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">양식 번호 (Form No)</label>
                  <input
                    type="text"
                    value={draftReport.formNo || ""}
                    onChange={(e) => setDraftReport({ ...draftReport, formNo: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">근무 시작 시간</label>
                  <input
                    type="time"
                    value={draftReport.startTime || "08:00"}
                    onChange={(e) => setDraftReport({ ...draftReport, startTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-cyan-300 block mb-1">근무 종료 시간</label>
                  <input
                    type="time"
                    value={draftReport.finishTime || "17:00"}
                    onChange={(e) => setDraftReport({ ...draftReport, finishTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold ${inputBaseCls}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. WORK TIME OUTPUT (BLOCK 9) */}
          {blockKey === "workTimeOutput" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-cyan-300">구분별 작업시간 및 실적 행 관리:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextId = `wto_${Date.now()}`;
                    const newRow = {
                      id: nextId,
                      division: `구분 ${draftReport.workTimeOutput?.length + 1 || 1}`,
                      startA: "08:00",
                      finishA: "12:00",
                      qtyA: 180,
                      startB: "13:00",
                      finishB: "17:00",
                      qtyB: 175
                    };
                    setDraftReport({
                      ...draftReport,
                      workTimeOutput: [...(draftReport.workTimeOutput || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>행 추가</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-700 rounded-2xl bg-slate-950/80">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-cyan-300 text-[11px] font-black">
                    <tr className="border-b border-slate-700">
                      <th className="p-2.5">구분 명칭</th>
                      <th className="p-2.5">A단면 시작</th>
                      <th className="p-2.5">A단면 종료</th>
                      <th className="p-2.5">A단면 수량</th>
                      <th className="p-2.5">B단면 시작</th>
                      <th className="p-2.5">B단면 종료</th>
                      <th className="p-2.5">B단면 수량</th>
                      <th className="p-2.5">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(draftReport.workTimeOutput || []).map((row, idx) => (
                      <tr key={row.id || idx} className="border-b border-slate-800">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.division || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, division: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-24 px-2 py-1 rounded-lg border text-center font-bold"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.startA || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, startA: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.finishA || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, finishA: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            value={row.qtyA || 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, qtyA: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono font-bold text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.startB || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, startB: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.finishB || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, finishB: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            value={row.qtyB || 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = draftReport.workTimeOutput.map((r, i) => i === idx ? { ...r, qtyB: val } : r);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono font-bold text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draftReport.workTimeOutput.filter((_, i) => i !== idx);
                              setDraftReport({ ...draftReport, workTimeOutput: updated });
                            }}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. SPECS CUTTING (BLOCK 15) */}
          {blockKey === "specsCutting" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-black text-sm text-cyan-300">정치 절단 단면별 규격 & 허용공차 설정</span>
                  <span className="text-[11px] text-slate-300 block mt-0.5">사진 15 실물 데이터 (A: 881±3 / 488±3 가절단, B: 608±5 / 658±5, C: 582±5 / 658±6)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const count = draftReport.specsCutting?.length || 0;
                    const nextChar = String.fromCharCode(65 + count);
                    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
                    const newRow = {
                      id: `c_${Date.now()}`,
                      section: nextChar,
                      spec1: "600 ± 5mm",
                      start1: "600.0",
                      half1: "600.0",
                      finish1: "600.0",
                      lotStart: `${datePrefix}-${nextChar}01`,
                      lotHalf: `${datePrefix}-${nextChar}01`,
                      lotFinish: `${datePrefix}-${nextChar}01`,
                      lotNo: `${datePrefix}-${nextChar}01`
                    };
                    setDraftReport({
                      ...draftReport,
                      specsCutting: [...(draftReport.specsCutting || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>단면 행 추가</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(draftReport.specsCutting || []).map((row, idx) => (
                  <div key={row.id || idx} className="p-3.5 rounded-2xl border border-slate-700 bg-slate-950/90 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center text-xs">
                          {row.section}
                        </span>
                        <span className="font-black text-white">
                          {row.section} 단면 규격 정의
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draftReport.specsCutting.filter((_, i) => i !== idx);
                          setDraftReport({ ...draftReport, specsCutting: updated });
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">단면 명칭</label>
                        <input
                          type="text"
                          value={row.section || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, section: val } : r);
                            setDraftReport({ ...draftReport, specsCutting: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-center font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">SPEC (절단 길이 / 공차)</label>
                        <input
                          type="text"
                          value={row.spec1 || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, spec1: val } : r);
                            setDraftReport({ ...draftReport, specsCutting: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border font-black text-cyan-300 text-center"
                          placeholder="예: 881 ± 3mm"
                        />
                      </div>
                    </div>

                    {/* LOT NO. 3개 입력 칸 (초물 / 중물 / 종물) */}
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[11px] font-black text-amber-300 block mb-1.5">
                        📦 LOT NO. (초물 • 중물 • 종물 3개 칸)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">초물 LOT</label>
                          <input
                            type="text"
                            value={row.lotStart ?? row.lotNo ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, lotStart: val, lotNo: val } : r);
                              setDraftReport({ ...draftReport, specsCutting: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border font-mono text-xs text-center"
                            placeholder="초물 LOT"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">중물 LOT</label>
                          <input
                            type="text"
                            value={row.lotHalf ?? row.lotNo ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, lotHalf: val } : r);
                              setDraftReport({ ...draftReport, specsCutting: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border font-mono text-xs text-center"
                            placeholder="중물 LOT"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">종물 LOT</label>
                          <input
                            type="text"
                            value={row.lotFinish ?? row.lotNo ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.specsCutting.map((r, i) => i === idx ? { ...r, lotFinish: val } : r);
                              setDraftReport({ ...draftReport, specsCutting: updated });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border font-mono text-xs text-center"
                            placeholder="종물 LOT"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. STEP CUTTING FRT (BLOCK 2) & RR (BLOCK 3) */}
          {(blockKey === "stepCuttingFrt" || blockKey === "stepCuttingRr") && (
            <div className="space-y-3">
              {(() => {
                const isFrt = blockKey === "stepCuttingFrt";
                const listKey = isFrt ? "stepCuttingFrt" : "stepCuttingRr";
                const list = draftReport[listKey] || [];

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-cyan-300">
                        {isFrt ? "FRT 단컷팅 구간 치수 행 관리" : "RR 단컷팅 구간 치수 행 관리"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextChar = String.fromCharCode(65 + list.length);
                          const newRow = {
                            id: `sc_${isFrt ? "frt" : "rr"}_${Date.now()}`,
                            section: nextChar,
                            spec: isFrt ? "45mm" : "39mm",
                            startVal: "",
                            halfVal: "",
                            finishVal: ""
                          };
                          setDraftReport({
                            ...draftReport,
                            [listKey]: [...list, newRow]
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>구간 추가</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-700 rounded-2xl bg-slate-950/80">
                      <table className="w-full text-center border-collapse">
                        <thead className="bg-slate-800 text-cyan-300 text-[11px] font-black">
                          <tr className="border-b border-slate-700">
                            <th className="p-2.5">구간 명칭</th>
                            <th className="p-2.5">기준 SPEC (치수)</th>
                            <th className="p-2.5">초물 실측</th>
                            <th className="p-2.5">중물 실측</th>
                            <th className="p-2.5">종물 실측</th>
                            <th className="p-2.5">삭제</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((row, idx) => (
                            <tr key={row.id || idx} className="border-b border-slate-800">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.section || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = list.map((r, i) => i === idx ? { ...r, section: val } : r);
                                    setDraftReport({ ...draftReport, [listKey]: updated });
                                  }}
                                  className="w-16 px-2 py-1 rounded border text-center font-bold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.spec || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = list.map((r, i) => i === idx ? { ...r, spec: val } : r);
                                    setDraftReport({ ...draftReport, [listKey]: updated });
                                  }}
                                  className="w-24 px-2 py-1 rounded border text-center font-black text-cyan-300"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.startVal || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = list.map((r, i) => i === idx ? { ...r, startVal: val } : r);
                                    setDraftReport({ ...draftReport, [listKey]: updated });
                                  }}
                                  className="w-16 px-1 py-1 rounded border text-center font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.halfVal || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = list.map((r, i) => i === idx ? { ...r, halfVal: val } : r);
                                    setDraftReport({ ...draftReport, [listKey]: updated });
                                  }}
                                  className="w-16 px-1 py-1 rounded border text-center font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.finishVal || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = list.map((r, i) => i === idx ? { ...r, finishVal: val } : r);
                                    setDraftReport({ ...draftReport, [listKey]: updated });
                                  }}
                                  className="w-16 px-1 py-1 rounded border text-center font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = list.filter((_, i) => i !== idx);
                                    setDraftReport({ ...draftReport, [listKey]: updated });
                                  }}
                                  className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* 5. SUB MATERIAL LOT (BLOCK 11) */}
          {blockKey === "subMaterialLot" && (
            <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
              <label className="text-xs font-black text-cyan-300 block">
                부자재 LOT 명칭 및 기본 번호
              </label>
              <input
                type="text"
                value={draftReport.subMaterialLot || ""}
                onChange={(e) => setDraftReport({ ...draftReport, subMaterialLot: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold text-sm"
                placeholder="예: 패드 5T: 2026.10.19-01"
              />
              <p className="text-xs text-slate-300">
                💡 '레고 양식.xlsx' 사진 11 실물 규격: <strong className="text-amber-300">패드 5T 입고일자 및 LOT</strong> (부품 도면 규격: 5T*5W*60L)
              </p>
            </div>
          )}

          {/* 6. DEFECT MATERIAL MATRIX (BLOCK 10) */}
          {blockKey === "defectMaterialMatrix" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-cyan-300">
                  불량소재 항목 목록 (압출소재불량 / 공정간불량)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newRow = {
                      id: `dm_${Date.now()}`,
                      category: "압출소재불량",
                      name: "신규 불량 항목",
                      frtLhA: 0,
                      frtRhA: 0,
                      frtLhB: 0,
                      frtRhB: 0,
                      rrLhA: 0,
                      rrRhA: 0,
                      rrLhB: 0,
                      rrRhB: 0
                    };
                    setDraftReport({
                      ...draftReport,
                      defectMaterialMatrix: [...(draftReport.defectMaterialMatrix || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>불량 항목 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {(draftReport.defectMaterialMatrix || []).map((row, idx) => (
                  <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                    <select
                      value={row.category || "압출소재불량"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.defectMaterialMatrix.map((r, i) => i === idx ? { ...r, category: val } : r);
                        setDraftReport({ ...draftReport, defectMaterialMatrix: updated });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-slate-800 text-cyan-300"
                    >
                      <option value="압출소재불량">압출소재불량</option>
                      <option value="공정간불량">공정간불량</option>
                      <option value="기타불량">기타불량</option>
                    </select>

                    <input
                      type="text"
                      value={row.name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.defectMaterialMatrix.map((r, i) => i === idx ? { ...r, name: val } : r);
                        setDraftReport({ ...draftReport, defectMaterialMatrix: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                      placeholder="불량명 (예: 외면 흠, 오염 등)"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = draftReport.defectMaterialMatrix.filter((_, i) => i !== idx);
                        setDraftReport({ ...draftReport, defectMaterialMatrix: updated });
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. DEFECT SECTION ABC (BLOCK 16) */}
          {blockKey === "defectSectionAbc" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-cyan-300">
                  Section A / B / C 단면별 불량소재구분 항목
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newRow = {
                      id: `dsabc_${Date.now()}`,
                      name: "신규 단면 불량",
                      secA: 0,
                      secB: 0,
                      secC: 0
                    };
                    setDraftReport({
                      ...draftReport,
                      defectSectionAbc: [...(draftReport.defectSectionAbc || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>항목 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {(draftReport.defectSectionAbc || []).map((row, idx) => (
                  <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                    <input
                      type="text"
                      value={row.name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.defectSectionAbc.map((r, i) => i === idx ? { ...r, name: val } : r);
                        setDraftReport({ ...draftReport, defectSectionAbc: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                      placeholder="불량명 (예: 길이 미달, 와이어 노출, 단컷팅 등)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draftReport.defectSectionAbc.filter((_, i) => i !== idx);
                        setDraftReport({ ...draftReport, defectSectionAbc: updated });
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. JOINT MATERIAL (BLOCK 4) */}
          {blockKey === "jointMaterial" && (
            <div className="space-y-4 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
              <div>
                <label className="text-xs font-black text-cyan-300 block mb-1">
                  조인트 재료명 (Joint grade name)
                </label>
                <input
                  type="text"
                  value={draftReport.jointMaterial?.gradeName || ""}
                  onChange={(e) => setDraftReport({
                    ...draftReport,
                    jointMaterial: { ...draftReport.jointMaterial, gradeName: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold"
                  placeholder="예: SJ-4004B (EPDM)"
                />
              </div>
              <div>
                <label className="text-xs font-black text-cyan-300 block mb-1">
                  조인트 재료일자 및 LOT (Joint material lot no)
                </label>
                <input
                  type="text"
                  value={draftReport.jointMaterial?.lotNo || ""}
                  onChange={(e) => setDraftReport({
                    ...draftReport,
                    jointMaterial: { ...draftReport.jointMaterial, lotNo: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-600 bg-slate-800 text-white font-mono font-bold"
                  placeholder="예: 2026.10.15-M02"
                />
              </div>
            </div>
          )}

          {/* 9. INJECTION TEMP (BLOCK 5) */}
          {blockKey === "injectionTemp" && (
            <div className="space-y-3">
              <span className="font-black text-sm text-cyan-300 block">
                사출 온도 기준 행 관리 (Sett'g / Actual x 호기별 노즐/실린더 온도)
              </span>

              <div className="overflow-x-auto border border-slate-700 rounded-2xl bg-slate-950/80">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-800 text-cyan-300 text-[11px] font-black">
                    <tr className="border-b border-slate-700">
                      <th className="p-2.5">구분</th>
                      <th className="p-2.5">라인 / 설비명</th>
                      <th className="p-2.5">노즐 (Nozzle)</th>
                      <th className="p-2.5">실린더 1 (N2)</th>
                      <th className="p-2.5">실린더 2 (H3)</th>
                      <th className="p-2.5">실린더 3 (H4)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(draftReport.injectionTemps || []).map((t, idx) => (
                      <tr key={t.id || idx} className="border-b border-slate-800">
                        <td className="p-1.5 font-black text-[11px] bg-slate-900 text-amber-300">{t.lineType}</td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={t.machine || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, machine: val } : r);
                              setDraftReport({ ...draftReport, injectionTemps: updated });
                            }}
                            className="w-24 px-2 py-1 rounded border text-center font-bold text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={t.nozzle || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, nozzle: val } : r);
                              setDraftReport({ ...draftReport, injectionTemps: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={t.cyl1 || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, cyl1: val } : r);
                              setDraftReport({ ...draftReport, injectionTemps: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={t.cyl2 || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, cyl2: val } : r);
                              setDraftReport({ ...draftReport, injectionTemps: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={t.cyl3 || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = draftReport.injectionTemps.map((r, i) => i === idx ? { ...r, cyl3: val } : r);
                              setDraftReport({ ...draftReport, injectionTemps: updated });
                            }}
                            className="w-16 px-1 py-1 rounded border text-center font-mono text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. INJECTION CONDITION (BLOCK 6) */}
          {blockKey === "injectionCondition" && (
            <div className="space-y-3">
              <span className="font-black text-sm text-cyan-300 block">
                사출 조건 항목 및 기준 SPEC 관리 (거리/속도/압력/시간)
              </span>

              <div className="space-y-2">
                {(draftReport.injectionConditions || []).map((c, idx) => (
                  <div key={c.id || idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90 items-center">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">조건 명칭</label>
                      <input
                        type="text"
                        value={c.name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, name: val } : r);
                          setDraftReport({ ...draftReport, injectionConditions: updated });
                        }}
                        className="w-full px-2 py-1 rounded border font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">SPEC 기준</label>
                      <input
                        type="text"
                        value={c.spec || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, spec: val } : r);
                          setDraftReport({ ...draftReport, injectionConditions: updated });
                        }}
                        className="w-full px-2 py-1 rounded border font-black text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">초물 (Start)</label>
                      <input
                        type="text"
                        value={c.startVal || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, startVal: val } : r);
                          setDraftReport({ ...draftReport, injectionConditions: updated });
                        }}
                        className="w-full px-2 py-1 rounded border font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">중물 (Half)</label>
                      <input
                        type="text"
                        value={c.halfVal || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, halfVal: val } : r);
                          setDraftReport({ ...draftReport, injectionConditions: updated });
                        }}
                        className="w-full px-2 py-1 rounded border font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">종물 (Finish)</label>
                      <input
                        type="text"
                        value={c.finishVal || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.injectionConditions.map((r, i) => i === idx ? { ...r, finishVal: val } : r);
                          setDraftReport({ ...draftReport, injectionConditions: updated });
                        }}
                        className="w-full px-2 py-1 rounded border font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. JOINT DEFECT MATRIX (BLOCK 7) */}
          {blockKey === "jointDefectMatrix" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-cyan-300">
                  조인트 10대 공정불량 항목 관리
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newRow = {
                      name: "신규 조인트 불량",
                      frtA: 0,
                      frtB: 0,
                      frtC: 0,
                      rrA: 0,
                      rrB: 0,
                      reworkFrt: 0,
                      reworkRr: 0,
                      processFrt: 0,
                      processRr: 0
                    };
                    setDraftReport({
                      ...draftReport,
                      jointDefects: [...(draftReport.jointDefects || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>불량 항목 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {(draftReport.jointDefects || []).map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                    <span className="w-6 text-center font-black text-cyan-300">{idx + 1}</span>
                    <input
                      type="text"
                      value={row.name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.jointDefects.map((r, i) => i === idx ? { ...r, name: val } : r);
                        setDraftReport({ ...draftReport, jointDefects: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                      placeholder="불량명 (예: 떨어짐, 양부족, 밀림 등)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draftReport.jointDefects.filter((_, i) => i !== idx);
                        setDraftReport({ ...draftReport, jointDefects: updated });
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. DRAWING SPEC CHECK (BLOCK 12) */}
          {blockKey === "drawingSpecCheck" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-cyan-300">
                  도면 중요 치수 및 검사 포인트 설정 (사진 12)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newRow = {
                      id: `ds_${Date.now()}`,
                      section: "신규 측정 포인트",
                      spec: "500 ± 3 mm",
                      startVal: "",
                      halfVal: "",
                      finishVal: ""
                    };
                    setDraftReport({
                      ...draftReport,
                      drawingSpecs: [...(draftReport.drawingSpecs || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>포인트 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {(draftReport.drawingSpecs || []).map((row, idx) => (
                  <div key={row.id || idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl border border-slate-700 bg-slate-950/90 items-center">
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">포인트 / 단면명</label>
                      <input
                        type="text"
                        value={row.section || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.drawingSpecs.map((r, i) => i === idx ? { ...r, section: val } : r);
                          setDraftReport({ ...draftReport, drawingSpecs: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-300 block mb-0.5">SPEC 기준 규격</label>
                      <input
                        type="text"
                        value={row.spec || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = draftReport.drawingSpecs.map((r, i) => i === idx ? { ...r, spec: val } : r);
                          setDraftReport({ ...draftReport, drawingSpecs: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border font-black text-cyan-300 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draftReport.drawingSpecs.filter((_, i) => i !== idx);
                          setDraftReport({ ...draftReport, drawingSpecs: updated });
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/20 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 13. RIGHT ANGLE MATRIX (BLOCK 13, 14) */}
          {blockKey === "rightAngleMatrix" && (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-700 rounded-xl w-fit flex-wrap">
                <button
                  type="button"
                  onClick={() => setRightAngleTab("machines")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rightAngleTab === "machines" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  호기 라인 ({draftReport.machines?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRightAngleTab("extrusion")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rightAngleTab === "extrusion" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  압출불량 ({draftReport.extrusionDefects?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRightAngleTab("joint")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rightAngleTab === "joint" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  조인트불량 ({draftReport.jointDefectsList?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRightAngleTab("post")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    rightAngleTab === "post" ? "bg-indigo-600 text-white shadow-xs font-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  후가공불량 ({draftReport.postDefectsList?.length || 0})
                </button>
              </div>

              {/* Sub-tab 1: Machines */}
              {rightAngleTab === "machines" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-cyan-300">검사 호기 라인 등록</span>
                    <button
                      type="button"
                      onClick={() => {
                        const count = (draftReport.machines?.length || 0) + 1;
                        const newMachine = {
                          id: `m_${Date.now()}`,
                          name: `호기 ${count}`,
                          workTime: "08:00 ~ 17:00",
                          inspectQty: 0,
                          goodQty: 0,
                          reworkQty: 0,
                          scrapQty: 0
                        };
                        setDraftReport({
                          ...draftReport,
                          machines: [...(draftReport.machines || []), newMachine]
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>호기 추가</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(draftReport.machines || []).map((m, idx) => (
                      <div key={m.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                        <input
                          type="text"
                          value={m.name || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = draftReport.machines.map((r, i) => i === idx ? { ...r, name: val } : r);
                            setDraftReport({ ...draftReport, machines: updated });
                          }}
                          className="w-32 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                          placeholder="호기명"
                        />
                        <input
                          type="text"
                          value={m.workTime || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = draftReport.machines.map((r, i) => i === idx ? { ...r, workTime: val } : r);
                            setDraftReport({ ...draftReport, machines: updated });
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border font-mono text-xs"
                          placeholder="작업시간"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = draftReport.machines.filter((_, i) => i !== idx);
                            setDraftReport({ ...draftReport, machines: updated });
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tabs 2, 3, 4: Defect lists */}
              {(rightAngleTab === "extrusion" || rightAngleTab === "joint" || rightAngleTab === "post") && (
                <div className="space-y-3">
                  {(() => {
                    const listKey = rightAngleTab === "extrusion" ? "extrusionDefects" : rightAngleTab === "joint" ? "jointDefectsList" : "postDefectsList";
                    const list = draftReport[listKey] || [];

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-cyan-300">
                            {rightAngleTab === "extrusion" ? "압출 불량 항목" : rightAngleTab === "joint" ? "조인트 불량 항목" : "후가공 불량 항목"} 목록
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newRow = {
                                id: `d_${rightAngleTab}_${Date.now()}`,
                                name: "신규 불량",
                                lh2: 0,
                                lh3: 0,
                                rh2: 0,
                                rh3: 0
                              };
                              setDraftReport({
                                ...draftReport,
                                [listKey]: [...list, newRow]
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>항목 추가</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {list.map((row, idx) => (
                            <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                              <span className="w-6 text-center font-black text-cyan-300">{idx + 1}</span>
                              <input
                                type="text"
                                value={row.name || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = list.map((r, i) => i === idx ? { ...r, name: val } : r);
                                  setDraftReport({ ...draftReport, [listKey]: updated });
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = list.filter((_, i) => i !== idx);
                                  setDraftReport({ ...draftReport, [listKey]: updated });
                                }}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 14. FRT RIGHT ANGLE DEFECTS (BLOCK 17) */}
          {blockKey === "frtRightAngleDefects" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-cyan-300">
                  FRT 직각검사 불량 집계 항목 (사진 17 실물 매핑)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newRow = {
                      id: `frt_d_${Date.now()}`,
                      name: "신규 검사 불량",
                      frtLh: 0,
                      frtRh: 0
                    };
                    setDraftReport({
                      ...draftReport,
                      frtRightAngleDefects: [...(draftReport.frtRightAngleDefects || []), newRow]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>항목 추가</span>
                </button>
              </div>

              <div className="space-y-2">
                {(draftReport.frtRightAngleDefects || []).map((row, idx) => (
                  <div key={row.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/90">
                    <span className="w-6 text-center font-black text-cyan-300">{idx + 1}</span>
                    <input
                      type="text"
                      value={row.name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = draftReport.frtRightAngleDefects.map((r, i) => i === idx ? { ...r, name: val } : r);
                        setDraftReport({ ...draftReport, frtRightAngleDefects: updated });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border font-bold text-xs"
                      placeholder="불량명 (예: 립컷팅 누락, 패드 누락 등)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = draftReport.frtRightAngleDefects.filter((_, i) => i !== idx);
                        setDraftReport({ ...draftReport, frtRightAngleDefects: updated });
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. REMARKS (BLOCK 16+) */}
          {blockKey === "remarks" && (
            <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
              <label className="text-xs font-black text-cyan-300 block">
                특기 사항 및 조치 사항 기본 문구
              </label>
              <textarea
                rows={4}
                value={draftReport.remarks || ""}
                onChange={(e) => setDraftReport({ ...draftReport, remarks: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-600 bg-slate-800 text-white font-medium text-xs leading-relaxed"
                placeholder="칼날 교체 주기, 설비 이상 조치 이력 등을 입력하세요."
              />
            </div>
          )}

          {/* 16. CUSTOM BLOCKS (custom_block_*) */}
          {!BLOCK_METADATA_MAP[blockKey] && blockKey !== "downtimeDefectPanel" && (() => {
            const tbl = draftReport.customBlockTables?.[blockKey] || {
              columns: ["항목 1", "항목 2", "항목 3"],
              rows: [["", "", ""]]
            };
            const cols = Array.isArray(tbl.columns) && tbl.columns.length > 0 ? tbl.columns : ["항목 1", "항목 2", "항목 3"];
            const rows = Array.isArray(tbl.rows) && tbl.rows.length > 0 ? tbl.rows : [cols.map(() => "")];
            const updateCustomTbl = (nextCols, nextRows) => {
              setDraftReport({
                ...draftReport,
                customBlockTables: {
                  ...(draftReport.customBlockTables || {}),
                  [blockKey]: {
                    columns: nextCols,
                    rows: nextRows
                  }
                }
              });
            };
            return (
              <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-black text-sm text-cyan-300">커스텀 블록 열(Column) 및 행(Row) 편집</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCustomTbl([...cols, `항목 ${cols.length + 1}`], rows.map((r) => [...r, ""]))}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                    >
                      + 열 추가
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCustomTbl(cols, [...rows, cols.map((_, i) => (i === 0 ? `구간 ${rows.length + 1}` : ""))])}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                    >
                      + 행 추가
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-700 text-xs text-center">
                    <thead>
                      <tr className="bg-slate-800">
                        {cols.map((col, cIdx) => (
                          <th key={cIdx} className="border border-slate-700 p-1.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={col}
                                onChange={(e) => {
                                  const nextCols = cols.map((c, i) => (i === cIdx ? e.target.value : c));
                                  updateCustomTbl(nextCols, rows);
                                }}
                                className="w-full px-1.5 py-1 rounded text-center font-black"
                              />
                              {cols.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCustomTbl(
                                      cols.filter((_, i) => i !== cIdx),
                                      rows.map((r) => r.filter((_, i) => i !== cIdx))
                                    )
                                  }
                                  className="text-rose-400 hover:text-rose-300 font-black px-1 cursor-pointer"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="border border-slate-700 p-1 w-10">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {cols.map((_, cIdx) => (
                            <td key={cIdx} className="border border-slate-700 p-1">
                              <input
                                type="text"
                                value={row?.[cIdx] ?? ""}
                                onChange={(e) => {
                                  const nextRows = rows.map((r, ri) =>
                                    ri === rIdx ? r.map((cell, ci) => (ci === cIdx ? e.target.value : cell)) : r
                                  );
                                  updateCustomTbl(cols, nextRows);
                                }}
                                className="w-full px-1.5 py-1 rounded text-center font-bold"
                              />
                            </td>
                          ))}
                          <td className="border border-slate-700 p-1">
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => updateCustomTbl(cols, rows.filter((_, i) => i !== rIdx))}
                                className="text-rose-400 hover:text-rose-300 font-black px-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>

        {/* =================================================================== */}
        {/* Modal Footer Actions (다크 푸터) */}
        {/* =================================================================== */}
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
