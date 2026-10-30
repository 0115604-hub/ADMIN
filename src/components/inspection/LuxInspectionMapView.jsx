import React, { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * 엑셀 원본 평면도(1504 x 1046)에 실제 인쇄된 1~16번 빨간색 원형 번호의 100% 일치 좌표 (백분율 %)
 * 원본 이미지의 픽셀 직경(71px)과 정확한 중심점을 추출하여 일치시킴
 */
export const LUX_MAP_POINTS = {
  1: { x: 22.34, y: 27.15, zone: "압출동", defaultName: "PCM #1 라인 인취기 작업대", specLux: 300 },
  2: { x: 36.64, y: 27.15, zone: "압출동", defaultName: "PCM #1 라인 다이스 압출구", specLux: 300 },
  3: { x: 16.69, y: 33.46, zone: "압출동", defaultName: "PCM #3 라인 인취기 작업대", specLux: 300 },
  4: { x: 34.91, y: 37.86, zone: "압출동", defaultName: "PCM #3 라인 후단 검사대", specLux: 300 },
  5: { x: 15.63, y: 52.20, zone: "압출동", defaultName: "PVC 라인 원료 투입구", specLux: 150 },
  6: { x: 32.05, y: 52.29, zone: "압출동", defaultName: "PVC 라인 인취기 및 커팅부", specLux: 300 },
  7: { x: 49.14, y: 39.96, zone: "가공동", defaultName: "TPE 라인 성형 및 권취대", specLux: 300 },
  8: { x: 56.85, y: 39.48, zone: "가공동", defaultName: "가공동 HR 1호 프레스 작업대", specLux: 300 },
  9: { x: 68.62, y: 39.58, zone: "가공동", defaultName: "가공동 HR 2호 프레스 작업대", specLux: 300 },
  10: { x: 76.80, y: 39.58, zone: "가공동", defaultName: "가공동 JA G-RUN 조립대", specLux: 300 },
  11: { x: 49.20, y: 50.38, zone: "가공동", defaultName: "가공동 NX4 부품 검사대", specLux: 300 },
  12: { x: 57.58, y: 50.48, zone: "원자재장", defaultName: "원재료 입고 보관장", specLux: 150 },
  13: { x: 68.82, y: 50.10, zone: "출하장", defaultName: "완제품 포장 및 출하장", specLux: 150 },
  14: { x: 77.39, y: 51.24, zone: "금형/사상", defaultName: "금형 보관대 및 사상대", specLux: 300 },
  15: { x: 47.61, y: 70.27, zone: "통로", defaultName: "압출동 메인 복도 및 통로", specLux: 75 },
  16: { x: 55.19, y: 71.13, zone: "통로", defaultName: "가공동 메인 복도 및 통로", specLux: 75 }
};

export const LuxInspectionMapView = ({
  items = [],
  selectedPointId = null,
  onSelectPoint = null
}) => {
  const [hoveredPointId, setHoveredPointId] = useState(null);

  // 부적합 포인트 목록 계산
  const failedItems = items.filter((it) => it.judgment === "부적합");
  const failedCount = failedItems.length;

  return (
    <div className="space-y-2">
      {/* 도면 상단 상태 안내 바 */}
      <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <span>🗺️ 공장 평면도 (1~16번 측정 위치도)</span>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">
            도면의 번호와 100% 동일한 위치에서 부적합 번호만 깜빡입니다.
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {failedCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 font-black animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>부적합 {failedCount}개소 감지</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>전 구역 조도 적합 (정상)</span>
            </div>
          )}
        </div>
      </div>

      {/* 평면도 도면 뷰어 컨테이너 (종횡비 1504:1046 고정으로 % 위치 오차 0%) */}
      <div className="w-full flex justify-center bg-slate-950 rounded-2xl p-1 border border-slate-800">
        <div className="relative inline-block w-full max-w-[960px] aspect-[1504/1046] overflow-hidden rounded-xl bg-white shadow-2xl select-none group">
          {/* 원본 도면 이미지 (1504 x 1046) */}
          <img
            src="/lux_inspection_map.png"
            alt="조도 측정 평면도 (압출동·가공동 1~16번)"
            className="w-full h-full block object-contain filter brightness-[1.0] contrast-[1.02]"
            loading="eager"
          />

          {/* 1~16번 정밀 위치 오버레이: 도면의 기존 번호 원형과 크기·위치가 100% 일치하도록 원본 비례(4.7% x 6.8%)로 매핑 */}
          {Object.entries(LUX_MAP_POINTS).map(([numStr, pointCoord]) => {
            const pointNo = Number(numStr);
            const item = items[pointNo - 1] || items.find((i) => (i.id === pointNo || i.no === pointNo));
            const isFailed = item?.judgment === "부적합";
            const isSelected = selectedPointId === pointNo;
            const isHovered = hoveredPointId === pointNo;
            const hasMeasurement = item && item.measuredLux !== "" && item.measuredLux !== undefined && item.measuredLux !== null;

            return (
              <div
                key={pointNo}
                style={{
                  left: `${pointCoord.x}%`,
                  top: `${pointCoord.y}%`,
                  width: "4.7%",
                  height: "6.8%",
                  transform: "translate(-50%, -50%)"
                }}
                className="absolute z-10 cursor-pointer"
                onClick={() => onSelectPoint && onSelectPoint(pointNo)}
                onMouseEnter={() => setHoveredPointId(pointNo)}
                onMouseLeave={() => setHoveredPointId(null)}
                title={`${pointNo}번 ${item?.name || pointCoord.defaultName}: ${
                  hasMeasurement ? `${item.measuredLux}lx (${item.judgment})` : "측정치 없음"
                }`}
              >
                {/* 🚨 [부적합 시에만 작동] 도면의 빨간 원 테두리와 정확히 일치하여 깜빡이는 펄스 애니메이션 */}
                {isFailed && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-rose-600/50 animate-ping pointer-events-none" />
                    <div className="absolute inset-0 rounded-full border-2 border-rose-600 bg-rose-600/30 animate-pulse pointer-events-none" />
                  </>
                )}

                {/* 클릭으로 선택되었을 때만 파란 테두리 링 */}
                {isSelected && !isFailed && (
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500 bg-cyan-500/20 ring-2 ring-cyan-400 pointer-events-none" />
                )}

                {/* 평소 투명 히트박스 */}
                {!isFailed && !isSelected && (
                  <div className="w-full h-full rounded-full hover:bg-slate-900/10 transition" />
                )}

                {/* 🚨 부적합 시 측정치와 기준치 배지 */}
                {isFailed && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/95 border border-rose-500 text-[10px] text-rose-300 font-mono font-black whitespace-nowrap shadow-2xl pointer-events-none flex items-center gap-1 z-30">
                    <span className="text-rose-400">🚨 {item?.measuredLux || 0}lx</span>
                    <span className="text-[9px] text-slate-400">(기준{item?.specLux || pointCoord.specLux})</span>
                  </div>
                )}

                {/* 마우스 호버 시 상세 툴팁 */}
                {(isHovered || isSelected) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 text-[11px] text-white whitespace-nowrap shadow-2xl z-40 pointer-events-none animate-fadeIn">
                    <div className="font-bold text-amber-300">
                      {pointNo}. {item?.name || pointCoord.defaultName}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-2 font-mono">
                      <span>기준: {item?.specLux || pointCoord.specLux}lx</span>
                      <span>실측: {hasMeasurement ? `${item.measuredLux}lx` : "미입력"}</span>
                      <span className={isFailed ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        [{item?.judgment || "대기"}]
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 도면 우측 상단 간결한 안내 */}
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700 text-[10px] text-slate-300 flex items-center gap-2 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-400 font-bold">부적합 위치 깜빡임</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
