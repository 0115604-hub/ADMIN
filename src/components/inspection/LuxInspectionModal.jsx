import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  User,
  MapPin,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  Map,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { saveLuxReport } from "../../services/luxInspectionService";
import { LuxInspectionMapView } from "./LuxInspectionMapView";

export const LuxInspectionModal = ({
  isOpen,
  onClose,
  initialData = null,
  config = null,
  currentProfile = null
}) => {
  const [formData, setFormData] = useState({
    measureDate: new Date().toISOString().slice(0, 10),
    measureTime: "10:00 ~ 11:30",
    plantLocation: "삼랑진공장 전 구역 (압출동·가공동)",
    inspector: config?.assignedInspector || currentProfile?.name || "설유철 책임",
    deviceInfo: config?.measuringDevice || "디지털 조도계 LX-1010B (#LX-02)",
    weatherLight: "맑음 / 작업 주조명 및 국부조명 점등",
    checkMethodNote: "작업면 높이(85cm) 측정, 측정 전 조명 점등 상태 및 측정기기 영점·교정 상태 확인",
    summaryNotes: "",
    items: []
  });

  const [selectedPointId, setSelectedPointId] = useState(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        items: initialData.items || []
      });
      // 조회/수정 모드로 열릴 때는 평면도가 기본 펼쳐져 있도록 설정
      setShowMap(true);
    } else {
      const locations = config?.locationItems && config.locationItems.length > 0
        ? config.locationItems
        : [];
      setFormData({
        measureDate: new Date().toISOString().slice(0, 10),
        measureTime: "10:00 ~ 11:30",
        plantLocation: "삼랑진공장 전 구역 (압출동·가공동)",
        inspector: config?.assignedInspector || currentProfile?.name || "설유철 책임",
        deviceInfo: config?.measuringDevice || "디지털 조도계 LX-1010B (#LX-02)",
        weatherLight: "맑음 / 작업 주조명 및 국부조명 점등",
        checkMethodNote: "작업면 높이(85cm) 측정, 측정 전 조명 점등 상태 및 측정기기 영점·교정 상태 확인",
        summaryNotes: "",
        items: locations.map((loc, idx) => ({
          id: loc.id || idx + 1,
          name: loc.name,
          specLux: loc.specLux || 300,
          measuredLux: "",
          judgment: "대기",
          actionNeeded: "",
          actionCompletedDate: "",
          note: loc.note || ""
        }))
      });
      setShowMap(true);
    }
  }, [isOpen, initialData, config]);

  if (!isOpen) return null;

  const handleItemValueChange = (index, field, value) => {
    const nextItems = [...formData.items];
    const target = { ...nextItems[index], [field]: value };

    // 측정값 변경 시 실시간 판정
    if (field === "measuredLux") {
      const val = Number(value);
      if (value === "" || isNaN(val)) {
        target.judgment = "대기";
      } else {
        const spec = Number(target.specLux || 300);
        target.judgment = val >= spec ? "적합" : "부적합";
      }
    }
    nextItems[index] = target;
    setFormData({ ...formData, items: nextItems });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveLuxReport(formData);
    onClose();
  };

  const passCount = formData.items.filter((i) => i.judgment === "적합").length;
  const failCount = formData.items.filter((i) => i.judgment === "부적합").length;
  const totalCount = formData.items.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* 모달 헤더 */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500 text-black font-black text-sm">💡</span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>조도측정일보 {initialData ? "(조회 / 수정)" : "(신규 작성)"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  전담: {formData.inspector}
                </span>
                {failCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 font-black animate-pulse">
                    부적합 {failCount}개소
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                1~16번 측정 위치별 조도(lx) 측정 및 산업안전보건 기준 적합 여부 판정
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 border border-slate-700 transition"
              title="평면도 접기/펼치기"
            >
              <Map className="w-3.5 h-3.5" />
              <span>{showMap ? "평면도 접기" : "평면도 보기"}</span>
              {showMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* 기본 메타데이터 카드 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] font-bold mb-1">측정일자 *</label>
              <input
                type="date"
                required
                value={formData.measureDate}
                onChange={(e) => setFormData({ ...formData, measureDate: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] font-bold mb-1">측정시간</label>
              <input
                type="text"
                value={formData.measureTime}
                onChange={(e) => setFormData({ ...formData, measureTime: e.target.value })}
                placeholder="예: 10:00 ~ 11:30"
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] font-bold mb-1">측정장소 / 대상구역 *</label>
              <input
                type="text"
                required
                value={formData.plantLocation}
                onChange={(e) => setFormData({ ...formData, plantLocation: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] font-bold mb-1">전담 측정자 *</label>
              <input
                type="text"
                required
                value={formData.inspector}
                onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 text-[11px] font-bold mb-1">측정기기 / 관리번호</label>
              <input
                type="text"
                value={formData.deviceInfo}
                onChange={(e) => setFormData({ ...formData, deviceInfo: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 text-[11px] font-bold mb-1">날씨 및 조명상태</label>
              <input
                type="text"
                value={formData.weatherLight}
                onChange={(e) => setFormData({ ...formData, weatherLight: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* 🌟 1. [요청반영] 측정방법 패널 위쪽에 공장 평면도 표시 & 부적합 위치 빨간색 펄스 넘버링 */}
          {showMap && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
              <LuxInspectionMapView
                items={formData.items}
                selectedPointId={selectedPointId}
                onSelectPoint={(pointNo) => {
                  setSelectedPointId(pointNo);
                  // 해당 번호 테이블 행으로 스크롤 이동
                  const targetRow = document.getElementById(`lux-row-${pointNo}`);
                  if (targetRow) {
                    targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              />
            </div>
          )}

          {/* 2. 측정 안내 배너 & 실시간 점검 현황 (측정방법 패널) */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <span>📋 측정방법:</span>
              <span className="font-normal text-slate-300">작업면 높이(85cm) 측정, 측정 전 조명 점등 및 기기 영점 확인</span>
            </span>
            <div className="flex items-center gap-2 font-mono font-bold">
              <span className="text-slate-400">전체 {totalCount}개소:</span>
              <span className="text-emerald-400">적합 {passCount}</span>
              {failCount > 0 && <span className="text-rose-400 font-black animate-pulse">부적합 {failCount}</span>}
            </div>
          </div>

          {/* 3. 1~16번 측정 포인트 테이블 (아래 목록) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-2.5 text-center w-12">No.</th>
                  <th className="p-2.5">측정 위치 (공정 및 작업대)</th>
                  <th className="p-2.5 text-right w-24">기준(lx)</th>
                  <th className="p-2.5 text-right w-28">실측(lx) *</th>
                  <th className="p-2.5 text-center w-20">판정</th>
                  <th className="p-2.5">개선 필요사항 (부적합 시 조치내용)</th>
                  <th className="p-2.5 w-28">조치완료일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {formData.items.map((it, idx) => {
                  const pointNo = it.id || idx + 1;
                  const isFail = it.judgment === "부적합";
                  const isPass = it.judgment === "적합";
                  const isSelected = selectedPointId === pointNo;

                  return (
                    <tr
                      id={`lux-row-${pointNo}`}
                      key={pointNo}
                      onClick={() => setSelectedPointId(pointNo)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 ring-1 ring-amber-400"
                          : isFail
                          ? "bg-rose-950/30 hover:bg-rose-950/40"
                          : isPass
                          ? "bg-emerald-950/10 hover:bg-emerald-950/20"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="p-2.5 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-black ${
                            isFail
                              ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-950"
                              : isPass
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {pointNo}
                        </span>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.name}
                          onChange={(e) => handleItemValueChange(idx, "name", e.target.value)}
                          placeholder="측정 위치명..."
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={it.specLux}
                          onChange={(e) => handleItemValueChange(idx, "specLux", e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right text-slate-400 font-mono text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="lx 입력"
                          value={it.measuredLux}
                          onChange={(e) => handleItemValueChange(idx, "measuredLux", e.target.value)}
                          className={`w-full px-2.5 py-1 rounded-lg border text-right font-mono font-black text-sm outline-none transition ${
                            isFail
                              ? "bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500"
                              : isPass
                              ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                              : "bg-slate-900 border-slate-700 text-white"
                          }`}
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        {isPass && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10.5px]">
                            적합
                          </span>
                        )}
                        {isFail && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-300 border border-rose-500 font-black text-[10.5px] animate-pulse">
                            부적합
                          </span>
                        )}
                        {!isPass && !isFail && (
                          <span className="text-slate-500 text-[10px]">대기</span>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.actionNeeded}
                          onChange={(e) => handleItemValueChange(idx, "actionNeeded", e.target.value)}
                          placeholder={isFail ? "전구 교체, 조명 청소 등 조치사항 입력" : "-"}
                          className={`w-full px-2 py-1 rounded-lg border text-xs outline-none ${
                            isFail
                              ? "bg-rose-950/40 border-rose-500 text-rose-200 placeholder-rose-400/60"
                              : "bg-slate-900 border-slate-700 text-slate-300"
                          }`}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={it.actionCompletedDate}
                          onChange={(e) => handleItemValueChange(idx, "actionCompletedDate", e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px] outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 종합의견란 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-slate-300 font-bold text-xs">종합 판정 및 특이사항</label>
            <textarea
              rows={2}
              value={formData.summaryNotes}
              onChange={(e) => setFormData({ ...formData, summaryNotes: e.target.value })}
              placeholder="예: 전체 16개소 중 15개소 기준 만족. 3번 후단 검사대 상부 LED 1구 단선으로 명일 오전 전구 교체 예정."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* 푸터 액션 */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              ※ 저장 시 조도측정일보 대장에 영구 기록되며 결재선에 등록됩니다.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                닫기
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>조도측정일보 저장</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
