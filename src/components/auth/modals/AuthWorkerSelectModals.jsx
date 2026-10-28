import React from "react";
import { Cpu, Factory, Building2, X } from "lucide-react";

/**
 * AuthWorkerSelectModals
 * Renders the 6 factory / company worker selection modals:
 * 1. 삼랑진공장 압출동 작업자 모달
 * 2. 삼랑진공장 가공동 작업자 모달
 * 3. 한림공장 (주)한울 가공/협력업체 모달
 * 4. 한림공장 (주)부림텍 가공/협력업체 모달
 * 5. (주)유성 가공/협력업체 모달
 * 6. 한림공장 (주)조영 현장작업자 모달
 */
export const AuthWorkerSelectModals = ({
  isExtrusionModalOpen,
  setIsExtrusionModalOpen,
  EXTRUSION_WORKERS = [],

  isMachiningModalOpen,
  setIsMachiningModalOpen,
  machiningWorkers = [],

  isHanulModalOpen,
  setIsHanulModalOpen,
  hanulWorkers = [],
  hanulUser,

  isBulimtechModalOpen,
  setIsBulimtechModalOpen,
  bulimtechWorkers = [],
  bulimtechUser,

  isYuseongModalOpen,
  setIsYuseongModalOpen,
  yuseongWorkers = [],
  yuseongUser,

  isJoyoungModalOpen,
  setIsJoyoungModalOpen,
  joyoungWorkers = [],

  handleUserClick,
}) => {
  return (
    <>
      {/* 🏭 1. 삼랑진공장 압출동 작업자 전용 팝업 선택 모달 */}
      {isExtrusionModalOpen && (
        <div
          onClick={() => setIsExtrusionModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border-2 border-teal-400 dark:border-teal-700 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    삼랑진공장 압출동 작업자 ({EXTRUSION_WORKERS.length}명)
                  </h3>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    안전·품질 확인 후 압출 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtrusionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 압출 생산관리 화면으로 바로 연결됩니다.
            </p>

            <div className="grid grid-cols-4 gap-1.5">
              {EXTRUSION_WORKERS.map((worker) => {
                const isLead =
                  worker.title === "반장" ||
                  worker.title === "대리" ||
                  worker.name === "공영국" ||
                  worker.name === "심임대" ||
                  worker.name === "이상은";
                return (
                  <button
                    key={worker.id}
                    onClick={() => {
                      setIsExtrusionModalOpen(false);
                      handleUserClick({
                        ...worker,
                        portalType: "extrusion",
                        building: "압출동",
                        plant: "삼랑진공장",
                        company: "오륙",
                        assignedProcess: "압출동",
                        isFieldWorker: true
                      });
                    }}
                    className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                      isLead
                        ? "border-teal-500 bg-teal-700 text-white shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-teal-400"
                    }`}
                  >
                    <div className={`${worker.title ? "w-[45%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                      isLead ? "bg-teal-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}>
                      <span className="font-black text-xs tracking-tight truncate">
                        {worker.name}
                      </span>
                    </div>
                    {worker.title && (
                      <div className={`w-[55%] flex items-center justify-center text-center px-1 py-0.5 ${
                        isLead ? "bg-teal-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        <span className="text-[11px] font-bold">{worker.title}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🏭 2. 삼랑진공장 가공동 작업자 전용 팝업 선택 모달 */}
      {isMachiningModalOpen && (
        <div
          onClick={() => setIsMachiningModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-amber-400 dark:border-amber-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>삼랑진공장 가공동 작업자</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      총원 {machiningWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    안전·품질 확인 후 가공 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMachiningModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 가공 생산관리 화면으로 바로 연결됩니다.
            </p>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {machiningWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장";
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsMachiningModalOpen(false);
                        handleUserClick({
                          id: `mach_${worker.no || idx}`,
                          name: worker.name,
                          title: worker.position || "사원",
                          position: worker.position || "사원",
                          dept: worker.dept || "가공동",
                          building: "가공동",
                          plant: "삼랑진공장",
                          company: "오륙",
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 가공` : "가공",
                          portalType: "machining",
                          isFieldWorker: true
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-amber-400 bg-amber-600 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-amber-400"
                      }`}
                    >
                      <div className="w-[55%] flex items-center justify-center px-1 text-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      <div className="w-[45%] flex items-center justify-center text-center px-1 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] font-bold truncate">{worker.line || worker.position || "가공"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 3. 한림공장 한울 가공/협력업체 전용 팝업 선택 모달 */}
      {isHanulModalOpen && (
        <div
          onClick={() => setIsHanulModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-indigo-400 dark:border-indigo-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>한림공장 가공/협력업체 한울</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                      총원 {hanulWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    안전·품질 확인 후 한울 가공/협력업체 및 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHanulModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 한울 가공/협력업체 및 생산관리 화면으로 바로 연결됩니다.
            </p>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {hanulWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장" || worker.name === "박종미";
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsHanulModalOpen(false);
                        handleUserClick({
                          ...hanulUser,
                          id: `hal_hu_${worker.no || idx}`,
                          name: worker.name,
                          title: worker.position || "사원",
                          position: worker.position || "사원",
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 가공/협력업체` : "가공/협력업체",
                          plant: "한림공장",
                          company: "한울",
                          portalType: "hanul",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-indigo-400 bg-indigo-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-indigo-400"
                      }`}
                    >
                      <div className={`${worker.position ? "w-[50%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-indigo-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      {worker.position && (
                        <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                          isLeader ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <span className="text-[10px] font-bold truncate">{worker.position}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 4. 한림공장 부림텍 가공/협력업체 전용 팝업 선택 모달 */}
      {isBulimtechModalOpen && (
        <div
          onClick={() => setIsBulimtechModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border-2 border-teal-400 dark:border-teal-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>한림공장 가공/협력업체 부림텍</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                      총원 {bulimtechWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    안전·품질 확인 후 부림텍 가공/협력업체 및 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulimtechModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 확인하신 후 부림텍 가공/협력업체 및 생산관리 화면으로 연결됩니다.
            </p>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bulimtechWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장" || worker.name === "최현영";
                  const displayPos = worker.name === "최현영" ? "반장" : (worker.position || "사원");
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsBulimtechModalOpen(false);
                        handleUserClick({
                          ...bulimtechUser,
                          id: `hal_br_${worker.no || idx}`,
                          name: worker.name,
                          title: displayPos,
                          position: displayPos,
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 가공/협력업체` : "가공/협력업체",
                          plant: "한림공장",
                          company: "부림텍",
                          portalType: "bulimtech",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[48px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-teal-400 bg-teal-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-teal-400"
                      }`}
                    >
                      <div className={`w-[50%] flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-teal-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                        isLeader ? "bg-teal-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        <span className="text-[10px] font-bold truncate">{displayPos}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 5. 삼랑진공장 가공/협력업체 (주)유성 전용 팝업 선택 모달 */}
      {isYuseongModalOpen && (
        <div
          onClick={() => setIsYuseongModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-blue-400 dark:border-blue-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>삼랑진공장 가공/협력업체 유성</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                      총원 {yuseongWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    안전·품질 확인 후 JK1 • CE1 • DT Hood 작업일보 및 대시보드 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsYuseongModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 필수 공지를 꼭 확인하신 후 (주)유성 작업일보 및 생산관리 화면으로 바로 연결됩니다.
            </p>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {yuseongWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "기사" || worker.position === "반장" || worker.position === "조장" || worker.name === "이성기";
                  const displayPos = worker.position || (isLeader ? "기사" : "사원");
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsYuseongModalOpen(false);
                        handleUserClick({
                          ...yuseongUser,
                          id: `ys_${worker.no || idx}`,
                          name: worker.name,
                          title: displayPos,
                          position: displayPos,
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 가공/협력업체` : "가공/협력업체",
                          plant: "삼랑진공장",
                          company: "유성",
                          portalType: "yuseong",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-blue-400 bg-blue-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-blue-400"
                      }`}
                    >
                      <div className={`${displayPos ? "w-[50%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-blue-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      {displayPos && (
                        <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                          isLeader ? "bg-blue-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <span className="text-[10px] font-bold truncate">{displayPos}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏭 6. 한림공장 (주)조영 현장작업자 전용 팝업 선택 모달 */}
      {isJoyoungModalOpen && (
        <div
          onClick={() => setIsJoyoungModalOpen(false)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border-2 border-emerald-400 dark:border-emerald-600 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-scaleUp relative max-h-[90vh] flex flex-col text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>한림공장 (주)조영 현장작업자</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      총원 {joyoungWorkers.length}명
                    </span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    안전·품질 확인 후 한림공장 조영 생산관리 입장
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJoyoungModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium shrink-0">
              본인 이름을 터치하시면 안전알림판과 김동욱 책임의 품질이슈/긴급공지를 확인하신 후 생산관리 화면으로 바로 연결됩니다.
            </p>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {joyoungWorkers.map((worker, idx) => {
                  const isLeader = worker.position === "반장" || worker.position === "조장" || worker.position === "기사";
                  const displayPos = worker.position || "사원";
                  return (
                    <button
                      key={worker.no || idx}
                      type="button"
                      onClick={() => {
                        setIsJoyoungModalOpen(false);
                        handleUserClick({
                          id: `jy_${worker.no || idx}`,
                          name: worker.name,
                          title: displayPos,
                          position: displayPos,
                          line: worker.line,
                          assignedProcess: worker.line ? `${worker.line} 가공` : "한림공장 조영",
                          plant: "한림공장",
                          company: "조영",
                          portalType: "joyoung",
                          pin: "11",
                          isFieldWorker: true,
                          isPartner: false
                        });
                      }}
                      className={`min-h-[44px] rounded-xl border-2 overflow-hidden flex items-stretch shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left min-w-0 transition-all cursor-pointer p-0 ${
                        isLeader
                          ? "border-emerald-400 bg-emerald-700 text-white shadow-xs"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:border-emerald-400"
                      }`}
                    >
                      <div className={`${displayPos ? "w-[50%]" : "w-full"} flex items-center justify-center px-1 text-center shrink-0 ${
                        isLeader ? "bg-emerald-800 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}>
                        <span className="font-black text-xs tracking-tight truncate">
                          {worker.name}
                        </span>
                      </div>
                      {displayPos && (
                        <div className={`w-[50%] flex items-center justify-center text-center px-1 py-0.5 ${
                          isLeader ? "bg-emerald-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <span className="text-[10px] font-bold truncate">{displayPos}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthWorkerSelectModals;
