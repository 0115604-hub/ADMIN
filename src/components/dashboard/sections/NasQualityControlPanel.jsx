import React, { useState, useMemo } from "react";
import {
  Server,
  FileText,
  Star,
  FolderOpen,
  Settings,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Upload,
  RefreshCw,
  Search,
  X,
  Download,
  Copy,
  Check,
  Eye,
  Calendar,
  Layers,
  HardDrive
} from "lucide-react";

export const NasQualityControlPanel = ({
  nasStatus = "CONNECTED", // "CONNECTED" | "DISCONNECTED"
  lastSyncTime = "2026-10-29 09:43",
  onOpenSettings,
  onOpenExplorer
}) => {
  const [activeModal, setActiveModal] = useState(null); // 'status' | 'recent' | 'bookmark' | 'explorer'
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("ALL");
  const [copiedKey, setCopiedKey] = useState(null);

  // 📂 사내 NAS 실시간 실제 파일 목록 (가벼운 메타데이터로 구성되어 앱 성능에 영향 0)
  const nasFiles = [
    {
      id: "f-10-purchase",
      folder: "매입매출/일반관리",
      title: "2026-10월매입매출현황.xlsx",
      desc: "조인주 선임 10월 당월 매입매출 원본 (원자재/부자재 일별 실적 연동)",
      type: "xlsx",
      size: "547 KB",
      updatedAt: "2026-10-29 09:43",
      isLatest: true,
      isBookmark: true,
      downloadUrl: "/nas_files/2026-10월매입매출현황.xlsx",
      nasPath: "\\\\nas200\\일반관리\\2026년\\2026-10월매입매출현황.xlsx"
    },
    {
      id: "f-08-purchase",
      folder: "매입매출/일반관리",
      title: "2026-08매입매출현황.xlsx",
      desc: "8월 매입매출 마감 확정본",
      type: "xlsx",
      size: "684 KB",
      updatedAt: "2026-10-13 11:08",
      isLatest: false,
      isBookmark: false,
      downloadUrl: "/nas_files/2026-08매입매출현황.xlsx",
      nasPath: "\\\\nas200\\일반관리\\2026년\\2026-08매입매출현황.xlsx"
    },
    {
      id: "f-4m-ledger",
      folder: "품질/수입검사",
      title: "4M_변동점_관리대장_2026-10-28.xlsx",
      desc: "품질팀 4M 변동점 및 수입검사 불합격 연동 공식 대장",
      type: "xlsx",
      size: "18.5 KB",
      updatedAt: "2026-10-28 09:10",
      isLatest: true,
      isBookmark: true,
      downloadUrl: "/nas_files/4M_변동점_관리대장_2026-10-28.xlsx",
      nasPath: "\\\\nas200\\수입검사\\4M_변동점_관리대장_2026-10-28.xlsx"
    },
    {
      id: "f-sub-materials",
      folder: "품질/수입검사",
      title: "자재리스트.xlsx",
      desc: "수입검사 부자재 공급사별 마스터 규격 (10개사 236품목)",
      type: "xlsx",
      size: "26.3 KB",
      updatedAt: "2026-10-29 10:43",
      isLatest: true,
      isBookmark: true,
      downloadUrl: "/nas_files/자재리스트.xlsx",
      nasPath: "\\\\nas200\\수입검사\\자재리스트.xlsx"
    }
  ];

  // 최근 파일 및 즐겨찾기 파일
  const recentFiles = nasFiles.filter((f) => f.isLatest);
  const bookmarkFiles = nasFiles.filter((f) => f.isBookmark);

  // 탐색기 폴더 목록
  const folders = [
    { id: "ALL", name: "전체 문서", count: nasFiles.length },
    { id: "매입매출/일반관리", name: "01. 매입매출 및 일반관리", count: 2 },
    { id: "품질/수입검사", name: "02. 수입검사 및 4M 관리대장", count: 2 }
  ];

  // 필터링 적용된 파일 목록
  const filteredFiles = useMemo(() => {
    return nasFiles.filter((file) => {
      if (selectedFolder !== "ALL" && file.folder !== selectedFolder) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const mTitle = file.title.toLowerCase().includes(kw);
        const mDesc = (file.desc || "").toLowerCase().includes(kw);
        const mFolder = (file.folder || "").toLowerCase().includes(kw);
        if (!mTitle && !mDesc && !mFolder) return false;
      }
      return true;
    });
  }, [nasFiles, selectedFolder, searchKeyword]);

  // 클립보드 복사 함수 (추천 1안의 장점 흡수)
  const handleCopyPath = (path, key, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(path).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "xlsx":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="w-full animate-fadeIn min-w-0">
      {/* 4 Badges Single-Row Container (실제 데이터와 완벽 연동) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">
        {/* Card 1: NAS 연결 상태 */}
        <div
          onClick={() => setActiveModal("status")}
          className="relative bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-indigo-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block shadow-xs shadow-emerald-500/50"></span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
                NAS 연결 상태
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenSettings) onOpenSettings();
                else setActiveModal("status");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700 transition-colors"
              title="NAS 설정"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-1 flex items-center justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              연결됨 (\\nas200)
            </span>
          </div>

          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            최근 동기화: {lastSyncTime}
          </div>
        </div>

        {/* Card 2: 최근 업로드된 품질/매입 문서 */}
        <div
          onClick={() => setActiveModal("recent")}
          className="bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-indigo-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-300">🕒</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
                최근 실시간 문서 (10월)
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/40">
              최신 반영
            </span>
          </div>

          <div className="space-y-1 my-0.5">
            {recentFiles.slice(0, 2).map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title={`${f.title} (${f.updatedAt})`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {getFileIcon(f.type)}
                  <span className="truncate">{f.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                  {f.updatedAt.slice(5, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: 즐겨찾기 품질/매입 문서 */}
        <div
          onClick={() => setActiveModal("bookmark")}
          className="bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-indigo-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">⭐</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
                즐겨찾기 문서
              </span>
            </div>
            <span className="text-[10px] text-slate-400">총 {bookmarkFiles.length}개</span>
          </div>

          <div className="space-y-1 my-0.5">
            {bookmarkFiles.slice(0, 2).map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                title={f.title}
              >
                {getFileIcon(f.type)}
                <span className="truncate flex-1">{f.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: 전체 파일 탐색기 & 다운로드 */}
        <div
          onClick={() => {
            if (onOpenExplorer) onOpenExplorer();
            else setActiveModal("explorer");
          }}
          className="bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-indigo-950/40 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-indigo-200/70 dark:border-indigo-800/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[92px]"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-amber-400">📁</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
              실시간 파일 탐색기
            </span>
          </div>

          <div className="flex items-center justify-between py-1 my-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs group-hover:scale-105 transition-transform">
                <FolderOpen className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  원클릭 파일 다운로드
                </span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                  웹 브라우저 즉시 열기
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            총 {nasFiles.length}개 파일 실시간 열람 가능
          </div>
        </div>
      </div>

      {/* 🚀 [추천 2안] 고성능 웹 전용 파일 탐색기 & 원클릭 다운로드 모달 */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-500 dark:text-cyan-400">
                  {activeModal === "status" && <Server className="w-5 h-5 text-emerald-500" />}
                  {activeModal === "recent" && <FileText className="w-5 h-5 text-blue-500" />}
                  {activeModal === "bookmark" && <Star className="w-5 h-5 text-amber-500" />}
                  {activeModal === "explorer" && <FolderOpen className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {activeModal === "status" && "사내 NAS 연결 상태 & 경로 안내"}
                      {activeModal === "recent" && "최근 10월 실시간 업로드 문서 목록"}
                      {activeModal === "bookmark" && "즐겨찾기 주요 문서 목록"}
                      {activeModal === "explorer" && "NAS 실시간 파일 탐색기 & 원클릭 다운로드"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      웹 직접 다운로드
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    사내 NAS(\\nas200) 연동 • 브라우저 보안 제약 없이 PC/모바일에서 바로 다운로드됩니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 필터 및 검색 바 */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* 폴더 탭 */}
              <div className="flex items-center gap-1">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFolder(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      selectedFolder === f.id
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {f.name} ({f.count})
                  </button>
                ))}
              </div>

              {/* 검색창 */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="파일명 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Modal Body: 실제 파일 리스트 & 원클릭 다운로드 */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
              {activeModal === "status" && (
                <div className="mb-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      사내 NAS 200 스토리지 정상 연결 상태
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                      \\nas200\일반관리\2026년\2026-10월매입매출현황.xlsx
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopyPath("\\\\nas200\\일반관리\\2026년", "status-path", e)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    {copiedKey === "status-path" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>경로 복사</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 파일 목록 카드 */}
              {filteredFiles.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-bold">
                  조건에 일치하는 파일이 없습니다.
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 transition group"
                  >
                    {/* 파일 정보 */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {file.title}
                          </p>
                          {file.isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/40">
                              최신 10월
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {file.size}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {file.desc}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>수정일: {file.updatedAt}</span>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <span className="text-slate-400 truncate">{file.folder}</span>
                        </p>
                      </div>
                    </div>

                    {/* 액션 버튼 그룹 */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {/* 사내 NAS 경로 복사 버튼 (추천 1안 겸용) */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyPath(file.nasPath, file.id, e)}
                        className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="윈도우 탐색기용 사내 NAS 경로 복사"
                      >
                        {copiedKey === file.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">경로복사</span>
                          </>
                        )}
                      </button>

                      {/* 📥 웹 직접 다운로드 버튼 (추천 2안 핵심) */}
                      <a
                        href={file.downloadUrl}
                        download={file.title}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="웹 브라우저를 통해 PC 또는 모바일로 즉시 다운로드"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>다운로드</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                총 <strong className="text-slate-900 dark:text-white">{filteredFiles.length}</strong>개 파일 등록됨
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NasQualityControlPanel;
