import { useState, useMemo } from "react";
import {
  Megaphone,
  Calendar,
  MapPin,
  ListOrdered,
  Users,
  ChevronUp,
  ChevronDown,
  Building2,
  Factory,
  Camera,
  Image as ImageIcon,
  FileSpreadsheet
} from "lucide-react";

export default function MeetingScheduleFields({
  newIssueForm,
  setNewIssueForm,
  todayDateStr,
  allWorkers = [],
  isProcessingIssueImages,
  onIssueFiles,
  onIssueImageFiles,
  onRemoveIssueImage,
  onPreviewImage
}) {
  const [isAttendeeDropdownOpen, setIsAttendeeDropdownOpen] = useState(false);

  // Grouped workers for meeting attendee selection
  const adminWorkers = useMemo(() => (allWorkers || []).filter((w) => w.plantName === "본사"), [allWorkers]);
  const samrangjinWorkers = useMemo(() => (allWorkers || []).filter((w) => w.plantName === "삼랑진공장"), [allWorkers]);
  const hanlimWorkers = useMemo(() => (allWorkers || []).filter((w) => w.plantName === "한림공장"), [allWorkers]);

  const currentAttendees = newIssueForm.attendees || [];

  const isAttendeeSelected = (w) => {
    return currentAttendees.some((a) => (a.id && a.id === w.id) || a.name === w.name || a === w.name);
  };

  const toggleAttendee = (w) => {
    const exists = currentAttendees.some((a) => (a.id && a.id === w.id) || a.name === w.name || a === w.name);
    let updated;
    if (exists) {
      updated = currentAttendees.filter((a) => (a.id ? a.id !== w.id : a.name !== w.name && a !== w.name));
    } else {
      updated = [...currentAttendees, { id: w.id, name: w.name, title: w.title || "", plantName: w.plantName || "" }];
    }
    setNewIssueForm({ ...newIssueForm, attendees: updated });
  };

  const toggleGroupAttendees = (groupWorkers) => {
    const allSelected = groupWorkers.length > 0 && groupWorkers.every((w) => isAttendeeSelected(w));
    let updated;
    if (allSelected) {
      const groupNames = new Set(groupWorkers.map((w) => w.name));
      const groupIds = new Set(groupWorkers.map((w) => w.id));
      updated = currentAttendees.filter((a) => !groupIds.has(a.id) && !groupNames.has(a.name) && !groupNames.has(a));
    } else {
      const toAdd = groupWorkers
        .filter((w) => !isAttendeeSelected(w))
        .map((w) => ({ id: w.id, name: w.name, title: w.title || "", plantName: w.plantName || "" }));
      updated = [...currentAttendees, ...toAdd];
    }
    setNewIssueForm({ ...newIssueForm, attendees: updated });
  };

  const selectAllAttendees = (list) => {
    const updated = list.map((w) => ({ id: w.id, name: w.name, title: w.title || "", plantName: w.plantName || "" }));
    setNewIssueForm({ ...newIssueForm, attendees: updated });
  };

  const clearAllAttendees = () => {
    setNewIssueForm({ ...newIssueForm, attendees: [] });
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800 space-y-3 shadow-xs">
      {/* 1. 회의 제목 */}
      <div>
        <label className="font-black text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5 mb-1">
          <Megaphone className="w-3.5 h-3.5 text-purple-600" />
          <span>회의 제목</span>
        </label>
        <input
          type="text"
          required
          placeholder="예: 9월 2주차 생산성 향상 및 품질 개선 회의"
          value={newIssueForm.title}
          onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
          className="w-full px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs sm:text-sm shadow-2xs focus:ring-2 focus:ring-purple-400 focus:outline-hidden"
        />
      </div>

      {/* 2. 회의 일시 (날짜 + 시간) */}
      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800 space-y-2">
        <label className="font-black text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          <span>① 회의 일시</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">날짜:</span>
            <input
              type="date"
              required
              value={newIssueForm.expireDate || todayDateStr}
              onChange={(e) => setNewIssueForm({ ...newIssueForm, expireDate: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 font-mono font-black text-xs text-slate-900 dark:text-white shadow-2xs text-center cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">시간:</span>
            <select
              value={newIssueForm.meetingTime || "14:00"}
              onChange={(e) => setNewIssueForm({ ...newIssueForm, meetingTime: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 font-mono font-black text-xs text-purple-700 dark:text-purple-300 shadow-2xs text-center cursor-pointer"
            >
              {[
                "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
                "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
                "18:00", "18:30", "19:00", "20:00"
              ].map((t) => (
                <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. 회의 장소 (텍스트 입력 + 3대 장소 퀵 프리셋) */}
      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800 space-y-1.5">
        <label className="font-black text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-600" />
          <span>② 회의 장소</span>
        </label>
        <input
          type="text"
          placeholder="예: 삼랑진회의실, 한림공장회의실, 화상회의(ZOOM)"
          value={newIssueForm.meetingLocation ?? ""}
          onChange={(e) => setNewIssueForm({ ...newIssueForm, meetingLocation: e.target.value })}
          className="w-full px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs shadow-2xs focus:ring-2 focus:ring-purple-400 focus:outline-hidden"
        />
        {/* 회의 장소 3가지 퀵 프리셋 버튼 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10.5px] font-bold text-purple-700 dark:text-purple-300">장소선택:</span>
          {[
            "삼랑진회의실",
            "한림공장회의실",
            "화상회의(ZOOM)"
          ].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setNewIssueForm({ ...newIssueForm, meetingLocation: loc })}
              className="px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-[11px] font-black text-purple-900 dark:text-purple-200 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              +{loc}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 회의 안건 및 상세 내용 (깔끔하고 넓은 6행 입력창) */}
      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800 space-y-1.5">
        <label className="font-black text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5 text-purple-600" />
          <span>③ 회의 주요 안건 및 상세 전달 내용</span>
        </label>
        <textarea
          rows="6"
          required
          placeholder="회의에서 논의할 주요 안건 및 상세 내용을 입력해 주세요.&#10;예:&#10;• 압출 라인 히터 개선 및 불량율 저감 대책&#10;• 9월 생산 계획 및 작업자 배정 협의"
          value={newIssueForm.content}
          onChange={(e) => setNewIssueForm({ ...newIssueForm, content: e.target.value })}
          className="w-full p-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 font-medium leading-relaxed text-slate-900 dark:text-white text-xs sm:text-sm min-h-[140px] focus:ring-2 focus:ring-purple-400 focus:outline-hidden"
        ></textarea>
      </div>

      {/* 5. 회의 참석자 선택 (드롭다운) */}
      <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="font-black text-xs text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>④ 회의 참석자 선택</span>
            <span className="text-[10.5px] font-bold text-purple-600 dark:text-purple-400">
              {currentAttendees.length > 0 ? `(${currentAttendees.length}명 선택됨)` : "(전체 참석/공람)"}
            </span>
          </label>
          <div className="flex items-center gap-1">
            {currentAttendees.length > 0 && (
              <button
                type="button"
                onClick={clearAllAttendees}
                className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold cursor-pointer"
              >
                전체해제
              </button>
            )}
            <button
              type="button"
              onClick={() => selectAllAttendees(allWorkers || [])}
              className="px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 text-[10px] font-bold cursor-pointer"
            >
              전원선택
            </button>
          </div>
        </div>

        {/* 드롭다운 토글 버튼 */}
        <button
          type="button"
          onClick={() => setIsAttendeeDropdownOpen(!isAttendeeDropdownOpen)}
          className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100/70 text-left flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-[0.99] shadow-2xs"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            {currentAttendees.length === 0 ? (
              <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                👥 전체 참석자 (미지정 시 전체 참석 / 공람)
              </span>
            ) : (
              <span className="text-xs font-black text-purple-950 dark:text-purple-100 truncate">
                👥 {currentAttendees.map((a) => a.name || a).join(", ")}
              </span>
            )}
          </div>
          <span className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center gap-0.5 shrink-0">
            <span>{isAttendeeDropdownOpen ? "접기" : "참석자 선택"}</span>
            {isAttendeeDropdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {/* 참석자 드롭다운 패널 */}
        {isAttendeeDropdownOpen && (
          <div className="p-3 rounded-xl bg-slate-900/95 dark:bg-slate-950 text-white border-2 border-purple-400 dark:border-purple-700 space-y-2.5 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-1 border-b border-slate-700 text-xs">
              <span className="font-black text-purple-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>원하는 공유 작업자 / 회의 참석자 선택</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentAttendees.length}/{allWorkers?.length || 0}명
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 no-scrollbar text-xs">
              {/* 1. 본사 / 경영진 */}
              {adminWorkers.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    onClick={() => toggleGroupAttendees(adminWorkers)}
                    className="text-[11px] font-black text-indigo-300 flex items-center justify-between p-1.5 px-2 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-800/80 cursor-pointer transition-all select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>본사 / 경영진</span>
                      <span className="text-[9.5px] font-normal text-slate-400">({adminWorkers.length}명)</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                      adminWorkers.every(isAttendeeSelected)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-indigo-300 border border-indigo-700"
                    }`}>
                      {adminWorkers.every(isAttendeeSelected) ? "✓ 전체해제" : "+ 전체선택"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {adminWorkers.map((w) => {
                      const isSelected = isAttendeeSelected(w);
                      return (
                        <button
                          key={w.id || w.name}
                          type="button"
                          onClick={() => toggleAttendee(w)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-indigo-600/90 border-indigo-400 text-white font-black shadow-xs ring-1 ring-indigo-400"
                              : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500"
                          }`}
                        >
                          <span>{w.name}</span>
                          <span className="text-[10px] opacity-75">{isSelected ? "✓" : w.title || "대표"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. 삼랑진공장 */}
              {samrangjinWorkers.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    onClick={() => toggleGroupAttendees(samrangjinWorkers)}
                    className="text-[11px] font-black text-blue-300 flex items-center justify-between p-1.5 px-2 rounded-lg bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800/80 cursor-pointer transition-all select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Factory className="w-3.5 h-3.5 text-blue-400" />
                      <span>삼랑진공장</span>
                      <span className="text-[9.5px] font-normal text-slate-400">({samrangjinWorkers.length}명)</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                      samrangjinWorkers.every(isAttendeeSelected)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-blue-300 border border-blue-700"
                    }`}>
                      {samrangjinWorkers.every(isAttendeeSelected) ? "✓ 전체해제" : "+ 전체선택"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {samrangjinWorkers.map((w) => {
                      const isSelected = isAttendeeSelected(w);
                      return (
                        <button
                          key={w.id || w.name}
                          type="button"
                          onClick={() => toggleAttendee(w)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-blue-600/90 border-blue-400 text-white font-black shadow-xs ring-1 ring-blue-400"
                              : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500"
                          }`}
                        >
                          <span>{w.name}</span>
                          <span className="text-[10px] opacity-75">{isSelected ? "✓" : w.title || ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. 한림공장 */}
              {hanlimWorkers.length > 0 && (
                <div className="space-y-1.5">
                  <div
                    onClick={() => toggleGroupAttendees(hanlimWorkers)}
                    className="text-[11px] font-black text-emerald-300 flex items-center justify-between p-1.5 px-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 cursor-pointer transition-all select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Factory className="w-3.5 h-3.5 text-emerald-400" />
                      <span>한림공장</span>
                      <span className="text-[9.5px] font-normal text-slate-400">({hanlimWorkers.length}명)</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black transition-all ${
                      hanlimWorkers.every(isAttendeeSelected)
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-emerald-300 border border-emerald-700"
                    }`}>
                      {hanlimWorkers.every(isAttendeeSelected) ? "✓ 전체해제" : "+ 전체선택"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {hanlimWorkers.map((w) => {
                      const isSelected = isAttendeeSelected(w);
                      return (
                        <button
                          key={w.id || w.name}
                          type="button"
                          onClick={() => toggleAttendee(w)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-emerald-600/90 border-emerald-400 text-white font-black shadow-xs ring-1 ring-emerald-400"
                              : "bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-500"
                          }`}
                        >
                          <span>{w.name}</span>
                          <span className="text-[10px] opacity-75">{isSelected ? "✓" : w.title || (w.isPartner ? "협력업체" : "")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Photo & Excel Attachments for 회의일정 */}
      <div className="pt-1 space-y-1.5">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 📸 즉시 촬영 */}
            <label className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="카메라로 즉시 촬영">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isProcessingIssueImages}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    (onIssueFiles || onIssueImageFiles)(e.target.files);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
              <Camera className="w-3.5 h-3.5 text-rose-600" />
              <span>📸 촬영</span>
            </label>

            {/* 📁 앨범 선택 */}
            <label className="px-2.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="갤러리/앨범에서 사진 선택">
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isProcessingIssueImages}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    (onIssueFiles || onIssueImageFiles)(e.target.files);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>📁 앨범</span>
            </label>

            {/* 📊 엑셀 첨부 */}
            <label className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs" title="엑셀 파일 첨부">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                multiple
                disabled={isProcessingIssueImages}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    (onIssueFiles || onIssueImageFiles)(e.target.files);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>📊 엑셀</span>
            </label>
          </div>
          <span className="text-[10.5px] text-slate-400 font-medium">
            {newIssueForm.images?.length || 0}개 파일 첨부됨
          </span>
        </div>

        {/* Previews of attached files in newIssueForm */}
        {newIssueForm.images && newIssueForm.images.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {newIssueForm.images.map((file, idx) => {
              const isImg = file.fileType === "image" || file.dataUrl?.startsWith("data:image/") || (!file.fileType && !file.name?.match(/\.(xlsx|xls|csv)$/i));
              return isImg ? (
                <div key={file.id || idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 w-14 h-14 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs">
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    onClick={() => onPreviewImage({ url: file.dataUrl, name: file.name })}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveIssueImage(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div key={file.id || idx} className="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-2xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="max-w-[130px] truncate text-[11px]" title={file.name}>
                    {file.name || "엑셀파일.xlsx"}
                  </span>
                  <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-mono">({file.size})</span>
                  <button
                    type="button"
                    onClick={() => onRemoveIssueImage(idx)}
                    className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 rounded cursor-pointer font-bold"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
