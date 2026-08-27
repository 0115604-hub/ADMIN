import React, { useRef } from "react";
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Sparkles
} from "lucide-react";
import { MASTER_SALES_SUMMARY, MASTER_PROCESS_BREAKDOWN } from "../data/masterSalesData";
import { MASTER_PURCHASE_CATEGORIES, MASTER_PURCHASE_SUMMARY } from "../data/masterPurchaseData";
import { useCurrency } from "../context/CurrencyContext";

export const PnLStatement = () => {
  const { formatAmount } = useCurrency();
  const printRef = useRef();

  const totalSales = MASTER_SALES_SUMMARY.totalSales; // 2,873,777,826

  // COGS (매출원가: 원자재, 임가공비, 부자재, 포장부자재)
  const rawMaterial = 1848089555;
  const processingCost = 966480256;
  const subMaterial = 85659438;
  const packagingCost = 14910770;
  const totalCOGS = rawMaterial + processingCost + subMaterial + packagingCost; // 2,915,140,019
  const grossProfit = totalSales - totalCOGS;

  // SG&A (판매비와 관리비)
  const powerCost = 79940633;
  const logisticsCost = 24421221;
  const welfareCost = 12863180;
  const rentCost = 12217340;
  const repairCost = 7018000;
  const feeCost = 6317614;
  const wasteCost = 3045280;
  const suppliesCost = 1850720;
  const totalSGA = powerCost + logisticsCost + welfareCost + rentCost + repairCost + feeCost + wasteCost + suppliesCost; // 147,673,988

  const operatingProfit = grossProfit - totalSGA;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              2026년 07월 제조업 표준 손익계산서
            </h2>
            <p className="text-xs text-slate-400">
              K-IFRS 제조업 표준 회계기준 기반 월간 손익 정산서
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄 / PDF 저장</span>
          </button>
        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div
        ref={printRef}
        className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg text-slate-900 dark:text-slate-100 max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="text-center space-y-2 border-b-2 border-slate-900 dark:border-white pb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
            손 익 계 산 서
          </h1>
          <p className="text-xs text-slate-500">
            당기: 2026년 07월 01일 부터 2026년 07월 31일 까지 (단위: 원)
          </p>
        </div>

        {/* Financial Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 text-left">과 목 (Account Title)</th>
                <th className="py-3 px-4 text-right">세부 금액</th>
                <th className="py-3 px-4 text-right">합계 금액</th>
                <th className="py-3 px-4 text-right">구성비 (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* I. 매출액 */}
              <tr className="font-extrabold bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-white">
                <td className="py-3.5 px-4 text-base">Ⅰ. 매출액 (Gross Revenue)</td>
                <td></td>
                <td className="py-3.5 px-4 text-right text-base text-blue-600 dark:text-blue-400">
                  {formatAmount(totalSales)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold">100.0%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">1. 내수 상품매출 (9BQC, NX4, JA, PU 등 51종)</td>
                <td className="py-2 px-4 text-right">{formatAmount(1096027550)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">38.14%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">2. PCM 압출/가공 매출 (PCM 라인 전체)</td>
                <td className="py-2 px-4 text-right">{formatAmount(934505308)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">32.52%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">3. 수출 상품매출 (DT, DS, NX4a, NE1a 등 15종)</td>
                <td className="py-2 px-4 text-right">{formatAmount(842048746)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">29.30%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">4. A/S 및 EPDM 부품매출 (14종)</td>
                <td className="py-2 px-4 text-right">{formatAmount(1196222)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.04%</td>
              </tr>

              {/* II. 매출원가 */}
              <tr className="font-extrabold bg-rose-50/40 dark:bg-rose-950/20 text-slate-900 dark:text-white">
                <td className="py-3.5 px-4 text-base">Ⅱ. 매출원가 (Cost of Goods Sold)</td>
                <td></td>
                <td className="py-3.5 px-4 text-right text-base text-rose-600 dark:text-rose-400">
                  {formatAmount(totalCOGS)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold">101.4%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">1. 원자재비 (해동무역, 화승알앤에이, 화승코퍼레이션 등)</td>
                <td className="py-2 px-4 text-right">{formatAmount(rawMaterial)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">64.31%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">2. 외주 임가공비 (조영산업, 한울, 오륙공사, 부림텍 등)</td>
                <td className="py-2 px-4 text-right">{formatAmount(processingCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">33.63%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">3. 부자재비 (화승네트웍스, 효신산업, 삼도산업 등)</td>
                <td className="py-2 px-4 text-right">{formatAmount(subMaterial)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">2.98%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">4. 포장 부자재비 (광진포장, 성환패키지 등)</td>
                <td className="py-2 px-4 text-right">{formatAmount(packagingCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.52%</td>
              </tr>

              {/* III. 매출총이익 */}
              <tr className="font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                <td className="py-3 px-4 font-black">Ⅲ. 매출총이익 (Gross Profit)</td>
                <td></td>
                <td className={`py-3 px-4 text-right font-black ${grossProfit >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {formatAmount(grossProfit)}
                </td>
                <td className="py-3 px-4 text-right font-bold">{((grossProfit / totalSales) * 100).toFixed(1)}%</td>
              </tr>

              {/* IV. 판매비와 관리비 */}
              <tr className="font-extrabold bg-amber-50/40 dark:bg-amber-950/20 text-slate-900 dark:text-white">
                <td className="py-3.5 px-4 text-base">Ⅳ. 판매비와 관리비 (SG&A Expenses)</td>
                <td></td>
                <td className="py-3.5 px-4 text-right text-base text-amber-600 dark:text-amber-400">
                  {formatAmount(totalSGA)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold">5.14%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">1. 공장 전력비 (한국전력공사 등 19건)</td>
                <td className="py-2 px-4 text-right">{formatAmount(powerCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">2.78%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">2. 물류 및 운송비 (용진운수, 제이엠로지스 등 19건)</td>
                <td className="py-2 px-4 text-right">{formatAmount(logisticsCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.85%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">3. 복리후생비 및 식대 (큰상웰빙푸드 등 6건)</td>
                <td className="py-2 px-4 text-right">{formatAmount(welfareCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.45%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">4. 설비 및 공장 임대료 (화승알앤에이 설비임대 등)</td>
                <td className="py-2 px-4 text-right">{formatAmount(rentCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.43%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">5. 수선비 및 설비공사비 (조은건설, 건영전기)</td>
                <td className="py-2 px-4 text-right">{formatAmount(repairCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.24%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">6. 지급수수료 (세무/노무/전기/안전관리 등 27건)</td>
                <td className="py-2 px-4 text-right">{formatAmount(feeCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.22%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">7. 산업폐기물 처리비 (한국알앤티 등 5건)</td>
                <td className="py-2 px-4 text-right">{formatAmount(wasteCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.11%</td>
              </tr>
              <tr className="text-slate-600 dark:text-slate-400">
                <td className="py-2 px-8">8. 소모품 및 공구비 (김해종합가스 등 3건)</td>
                <td className="py-2 px-4 text-right">{formatAmount(suppliesCost)}</td>
                <td></td>
                <td className="py-2 px-4 text-right">0.06%</td>
              </tr>

              {/* V. 영업이익 */}
              <tr className="font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-base sm:text-lg">
                <td className="py-4 px-4">Ⅴ. 영업이익 (Operating Profit)</td>
                <td></td>
                <td className="py-4 px-4 text-right">
                  {formatAmount(operatingProfit)}
                </td>
                <td className="py-4 px-4 text-right font-black">
                  {((operatingProfit / totalSales) * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>* 본 손익계산서는 2026년 07월 매입·매출 마감 원장 기준 자동 산출되었습니다.</span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">작성일: 2026-08-27</span>
        </div>
      </div>
    </div>
  );
};
