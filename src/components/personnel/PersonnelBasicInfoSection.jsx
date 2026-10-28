import React from "react";
import {
  User,
  Camera,
  Upload,
  Trash2,
  X,
  Calendar,
  Clock,
  Briefcase
} from "lucide-react";
import {
  COMPANY_LIST,
  DEPARTMENTS_LIST,
  POSITIONS_LIST,
  NATIONALITY_LIST,
  isPartnerCompany,
  calculateTenureFromJoinDate,
  calculateProcessYearFromJoinDate
} from "../../services/personnelCardService.js";

/**
 * PersonnelBasicInfoSection
 * Employee photo management & basic personal/company/tenure attributes
 */
export default function PersonnelBasicInfoSection({
  formData = {},
  handleChange,
  handleStartCamera,
  fileInputRef,
  mobileCameraInputRef,
  handleFileChange
}) {
  return (
    <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <span className="font-black text-xs sm:text-sm text-purple-300 flex items-center gap-1.5">
          <User className="w-4 h-4 text-purple-400" />
          <span>증명사진 및 기본 인적사항</span>
        </span>
        <span className="text-[11px] text-slate-400 font-mono">사번: {formData.empNo}</span>
      </div>

      {/* 증명사진 촬영 또는 파일 선택 컨트롤 영역 */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
        {/* Photo Thumbnail */}
        <div className="relative group shrink-0">
          {formData.photoUrl ? (
            <img
              src={formData.photoUrl}
              alt={formData.name}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-purple-400 shadow-md shadow-purple-950/60"
            />
          ) : (
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400">
              <User className="w-7 h-7 text-slate-500 mb-0.5" />
              <span className="text-[9.5px] font-bold text-slate-500">사진 미등록</span>
            </div>
          )}

          {formData.photoUrl && (
            <button
              type="button"
              onClick={() => handleChange("photoUrl", "")}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-md cursor-pointer transition-all active:scale-90"
              title="사진 삭제"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Photo Action Buttons */}
        <div className="flex-1 space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-white">근로자 프로필 사진</span>
            <span className="text-[10.5px] text-slate-400">(카메라 촬영 또는 파일 선택)</span>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            {/* 촬영 버튼 */}
            <button
              type="button"
              onClick={handleStartCamera}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40 active:scale-95 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>카메라 촬영</span>
            </button>

            {/* 파일 선택 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>파일 선택</span>
            </button>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={mobileCameraInputRef}
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />

            {formData.photoUrl && (
              <button
                type="button"
                onClick={() => handleChange("photoUrl", "")}
                className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>삭제</span>
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            인사카드에 인쇄 및 표시될 증명 사진을 등록합니다 (자동 압축 최적화).
          </p>
        </div>
      </div>

      {/* 기본 정보 입력 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="text-[11px] font-bold text-slate-400 block pb-1">성명 *</label>
          <input
            type="text"
            required
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block pb-1">사번 (Emp No)</label>
          <input
            type="text"
            value={formData.empNo || ""}
            onChange={(e) => handleChange("empNo", e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-mono font-bold"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block pb-1">소속 업체 (5대 업체)</label>
          <select
            value={formData.company || ""}
            onChange={(e) => handleChange("company", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
          >
            {COMPANY_LIST.map((compName) => (
              <option key={compName} value={compName} className="bg-slate-900 text-white font-bold">{compName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block pb-1">부서</label>
          <select
            value={formData.dept || ""}
            onChange={(e) => handleChange("dept", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
          >
            {isPartnerCompany(formData.company) && (
              <option value={formData.company} className="bg-slate-900 text-purple-300 font-bold">
                {formData.company} (소속업체)
              </option>
            )}
            {DEPARTMENTS_LIST.map((deptName) => (
              <option key={deptName} value={deptName} className="bg-slate-900 text-white font-bold">{deptName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block pb-1">직책/직위/직급</label>
          <select
            value={formData.position || ""}
            onChange={(e) => handleChange("position", e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold"
          >
            {POSITIONS_LIST.map((posName) => (
              <option key={posName} value={posName}>{posName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 block pb-1">국적 (Nationality)</label>
          <div className="space-y-1">
            <select
              value={formData.nationality || "대한민국"}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("nationality", val);
                if (val !== "기타") {
                  handleChange("nationalityOther", "");
                }
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-white text-xs font-bold cursor-pointer"
            >
              {NATIONALITY_LIST.map((nat) => (
                <option key={nat.code} value={nat.code}>{nat.label}</option>
              ))}
            </select>
            {formData.nationality === "기타" && (
              <input
                type="text"
                placeholder="국적 직접 입력 (예: 미얀마, 몽골)"
                value={formData.nationalityOther || ""}
                onChange={(e) => handleChange("nationalityOther", e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/80 focus:border-cyan-400 text-cyan-300 text-xs font-bold placeholder:text-slate-500 animate-fadeIn"
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      {/* 입사일자 입력 시 근속기간 & 공정년차 자동계산 표시 */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block pb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>입사일자 *</span>
            </label>
            <input
              type="date"
              value={formData.joinDate || ""}
              onChange={(e) => handleChange("joinDate", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border-2 border-cyan-500/50 focus:border-cyan-400 text-white text-xs font-bold font-mono shadow-inner"
            />
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>근속기간 (자동계산)</span>
            </span>
            <span className="font-mono font-black text-sm text-emerald-400 pt-0.5">
              {formData.tenure || calculateTenureFromJoinDate(formData.joinDate)}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center">
            <span className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>공정년차 (자동계산)</span>
            </span>
            <span className="font-mono font-black text-sm text-amber-300 pt-0.5">
              {formData.processYear || calculateProcessYearFromJoinDate(formData.joinDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
