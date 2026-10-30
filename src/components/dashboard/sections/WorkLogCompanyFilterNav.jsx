import React from "react";
import { Factory, Building2, Check } from "lucide-react";
import { resolveWorkLogAffiliation } from "../../../utils/workLogCompanyMapping.js";

/**
 * WorkLogCompanyFilterNav.jsx
 * 5개사(오륙, 유성, 조영, 한울, 부림텍) 및 본사 독립 작업일보 탭 네비게이션
 * (100줄 이하 초경량 모듈)
 */
export const WorkLogCompanyFilterNav = ({
  filterPlant,
  setFilterPlant,
  workLogs = []
}) => {
  // 5개사별 실시간 건수 계산
  const counts = React.useMemo(() => {
    const map = { all: (workLogs || []).length, 본사: 0, 오륙: 0, 유성: 0, 조영: 0, 한울: 0, 부림텍: 0, 삼랑진공장: 0, 한림공장: 0 };
    (workLogs || []).forEach((l) => {
      const { company, plant } = resolveWorkLogAffiliation(l);
      if (map[company] !== undefined) map[company]++;
      if (plant === "삼랑진공장") map.삼랑진공장++;
      if (plant === "한림공장") map.한림공장++;
    });
    return map;
  }, [workLogs]);

  const samrangjinComps = [
    { key: "오륙", label: "오륙", color: "hover:border-blue-500 text-blue-300" },
    { key: "유성", label: "유성", color: "hover:border-cyan-500 text-cyan-300" }
  ];

  const hallimComps = [
    { key: "조영", label: "조영", color: "hover:border-teal-500 text-teal-300" },
    { key: "한울", label: "한울", color: "hover:border-purple-500 text-purple-300" },
    { key: "부림텍", label: "부림텍", color: "hover:border-amber-500 text-amber-300" }
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap p-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
      {/* 전체 */}
      <button
        type="button"
        onClick={() => setFilterPlant("all")}
        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
          filterPlant === "all" ? "bg-slate-700 text-white font-black shadow-xs" : "text-slate-400 hover:text-white"
        }`}
      >
        전체 ({counts.all})
      </button>

      {/* 삼랑진공장 (오륙 / 유성) */}
      <div className="flex items-center gap-0.5 p-0.5 bg-amber-950/40 border border-amber-800/60 rounded-lg">
        <button
          type="button"
          onClick={() => setFilterPlant("삼랑진공장")}
          className={`px-2 py-0.5 rounded-md font-black flex items-center gap-1 transition-all cursor-pointer ${
            filterPlant === "삼랑진공장" ? "bg-amber-500 text-slate-950" : "text-amber-400 hover:text-amber-200"
          }`}
          title="삼랑진공장 전체 (오륙+유성)"
        >
          <Factory className="w-3 h-3" />
          <span>삼랑진({counts.삼랑진공장})</span>
        </button>
        {samrangjinComps.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilterPlant(c.key)}
            className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
              filterPlant === c.key ? "bg-amber-400 text-slate-950 font-black" : "text-amber-300/80 hover:text-amber-100"
            }`}
          >
            {c.label}({counts[c.key] || 0})
          </button>
        ))}
      </div>

      {/* 한림공장 (조영 / 한울 / 부림텍) */}
      <div className="flex items-center gap-0.5 p-0.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
        <button
          type="button"
          onClick={() => setFilterPlant("한림공장")}
          className={`px-2 py-0.5 rounded-md font-black flex items-center gap-1 transition-all cursor-pointer ${
            filterPlant === "한림공장" ? "bg-emerald-500 text-slate-950" : "text-emerald-400 hover:text-emerald-200"
          }`}
          title="한림공장 전체 (조영+한울+부림텍)"
        >
          <Building2 className="w-3 h-3" />
          <span>한림({counts.한림공장})</span>
        </button>
        {hallimComps.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilterPlant(c.key)}
            className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
              filterPlant === c.key ? "bg-emerald-400 text-slate-950 font-black" : "text-emerald-300/80 hover:text-emerald-100"
            }`}
          >
            {c.label}({counts[c.key] || 0})
          </button>
        ))}
      </div>

      {/* 본사 */}
      <button
        type="button"
        onClick={() => setFilterPlant("본사")}
        className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
          filterPlant === "본사" ? "bg-indigo-600 text-white font-black" : "text-indigo-400 hover:text-indigo-200"
        }`}
      >
        본사 ({counts.본사 || 0})
      </button>
    </div>
  );
};
