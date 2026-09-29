import React, { useState } from "react";
import { EXTRUSION_LINES } from "../utils/extrusionImageParser";

// Standard Manufacturing Calendar Mapping (Preserved for parser compatibility)
export const WEEK_CALENDAR_MAP = {
  // 7월
  "7월1주": { period: "6/29 ~ 7/05", daysList: ["29일 (월)", "30일 (화)", "01일 (수)", "02일 (목)", "03일 (금)", "04일 (토)", "05일 (일)"] },
  "7월2주": { period: "7/06 ~ 7/12", daysList: ["06일 (월)", "07일 (화)", "08일 (수)", "09일 (목)", "10일 (금)", "11일 (토)", "12일 (일)"] },
  "7월3주": { period: "7/13 ~ 7/19", daysList: ["13일 (월)", "14일 (화)", "15일 (수)", "16일 (목)", "17일 (금)", "18일 (토)", "19일 (일)"] },
  "7월4주": { period: "7/20 ~ 7/26", daysList: ["20일 (월)", "21일 (화)", "22일 (수)", "23일 (목)", "24일 (금)", "25일 (토)", "26일 (일)"] },
  "7월5주": { period: "7/27 ~ 8/02", daysList: ["27일 (월)", "28일 (화)", "29일 (수)", "30일 (목)", "31일 (금)", "01일 (토)", "02일 (일)"] },

  // 8월
  "8월1주": { period: "8/03 ~ 8/09", daysList: ["03일 (월)", "04일 (화)", "05일 (수)", "06일 (목)", "07일 (금)", "08일 (토)", "09일 (일)"] },
  "8월2주": { period: "8/10 ~ 8/16", daysList: ["10일 (월)", "11일 (화)", "12일 (수)", "13일 (목)", "14일 (금)", "15일 (토)", "16일 (일)"] },
  "8월3주": { period: "8/17 ~ 8/23", daysList: ["17일 (월)", "18일 (화)", "19일 (수)", "20일 (목)", "21일 (금)", "22일 (토)", "23일 (일)"] },
  "8월4주": { period: "8/24 ~ 8/30", daysList: ["24일 (월)", "25일 (화)", "26일 (수)", "27일 (목)", "28일 (금)", "29일 (토)", "30일 (일)"] },

  // 9월
  "9월1주": { period: "8/31 ~ 9/06", daysList: ["31일 (월)", "01일 (화)", "02일 (수)", "03일 (목)", "04일 (금)", "05일 (토)", "06일 (일)"] },
  "9월2주": { period: "9/07 ~ 9/13", daysList: ["07일 (월)", "08일 (화)", "09일 (수)", "10일 (목)", "11일 (금)", "12일 (토)", "13일 (일)"] },
  "9월3주": { period: "9/14 ~ 9/18", daysList: ["14일 (월)", "15일 (화)", "16일 (수)", "17일 (목)", "18일 (금)", "19일 (토)", "20일 (일)"] },
  "9월4주": { period: "9/21 ~ 9/27", daysList: ["21일 (월)", "22일 (화)", "23일 (수)", "24일 (목)", "25일 (금)", "26일 (토)", "27일 (일)"] },
  "9월5주": { period: "9/28 ~ 10/04", daysList: ["28일 (월)", "29일 (화)", "30일 (수)", "01일 (목)", "02일 (금)", "03일 (토)", "04일 (일)"] },

  // 10월
  "10월1주": { period: "10/05 ~ 10/11", daysList: ["05일 (월)", "06일 (화)", "07일 (수)", "08일 (목)", "09일 (금)", "10일 (토)", "11일 (일)"] },
  "10월2주": { period: "10/12 ~ 10/18", daysList: ["12일 (월)", "13일 (화)", "14일 (수)", "15일 (목)", "16일 (금)", "17일 (토)", "18일 (일)"] },
  "10월3주": { period: "10/19 ~ 10/25", daysList: ["19일 (월)", "20일 (화)", "21일 (수)", "22일 (목)", "23일 (금)", "24일 (토)", "25일 (일)"] },
  "10월4주": { period: "10/26 ~ 11/01", daysList: ["26일 (월)", "27일 (화)", "28일 (수)", "29일 (목)", "30일 (금)", "31일 (토)", "01일 (일)"] }
};

export const LINE_DISPLAY_NAMES = {
  pcm1: "PCM #1 LINE",
  pcm3: "PCM #3 LINE",
  pvc: "PVC LINE",
  tpe: "TPE LINE"
};

const LINE_THEMES = {
  pcm1: {
    primary: "bg-teal-700 hover:bg-teal-800",
    text: "text-teal-700",
    border: "border-teal-600",
    light: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    accent: "#0f766e"
  },
  pcm3: {
    primary: "bg-blue-700 hover:bg-blue-800",
    text: "text-blue-700",
    border: "border-blue-600",
    light: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    accent: "#1d4ed8"
  },
  pvc: {
    primary: "bg-amber-600 hover:bg-amber-700",
    text: "text-amber-600",
    border: "border-amber-600",
    light: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    accent: "#d97706"
  },
  tpe: {
    primary: "bg-purple-700 hover:bg-purple-800",
    text: "text-purple-700",
    border: "border-purple-600",
    light: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    accent: "#7c3aed"
  }
};

export const ExtrusionDowntimeView = () => {
  const [selectedLineId, setSelectedLineId] = useState("pcm1");

  return (
    <div className="space-y-4 pb-12 animate-fadeIn max-w-[1600px] mx-auto">
      {/* 1. Top 4 Lines Selector Tabs (위 뱃지 4개: PCM #1 LINE, PCM #3 LINE, PVC LINE, TPE LINE) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXTRUSION_LINES.map((lMeta) => {
          const lineKey = lMeta.id;
          const isSelected = selectedLineId === lineKey;
          const lTheme = LINE_THEMES[lineKey] || LINE_THEMES.pcm1;
          const lineLabel = LINE_DISPLAY_NAMES[lineKey] || lMeta.name;

          return (
            <button
              key={lineKey}
              type="button"
              onClick={() => setSelectedLineId(lineKey)}
              className={`py-2.5 px-3 sm:px-4 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                isSelected
                  ? `${lTheme.light} ${lTheme.border} border-2 shadow-xs ring-2 ring-teal-500/20`
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isSelected ? "bg-teal-600 ring-2 ring-teal-300" : "bg-slate-300"
                  }`}
                ></span>
                <span className={`font-black text-xs sm:text-sm tracking-tight truncate ${isSelected ? lTheme.text : "text-slate-800"}`}>
                  {lineLabel}
                </span>
              </div>
              {isSelected ? (
                <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded-md bg-teal-600 text-white shrink-0">
                  선택
                </span>
              ) : (
                <span className="text-[9.5px] font-bold text-slate-400 uppercase shrink-0">
                  {lMeta.code}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExtrusionDowntimeView;
