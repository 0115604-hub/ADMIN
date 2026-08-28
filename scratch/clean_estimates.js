import fs from "fs";
import path from "path";

const masterPath = path.resolve("src/data/multiMonthMasterData.json");
const masterData = JSON.parse(fs.readFileSync(masterPath, "utf-8"));

// 1. Keep 2026-07 as actual uploaded data from 2026.07 매입매출 내역서.xlsx
// 2. Clean 2026-08 to have 0 estimates - ONLY user uploaded files will populate it
masterData["2026-08"] = {
  yearMonth: "2026-08",
  salesSummary: {
    yearMonth: "2026-08",
    totalSales: 0,
    totalCalculatedSales: 0,
    pcmTotal: 0,
    totalQty: 0,
    itemCount: 0,
    vehicleGroupCount: 0
  },
  vehicleSales: [],
  materialPurchases: [],
  purchasesSummary: {
    totalPurchases: 0,
    itemCount: 0,
    mainCategoryCount: 0
  }
};

fs.writeFileSync(masterPath, JSON.stringify(masterData, null, 2), "utf-8");
console.log("✓ Successfully cleared 2026-08 estimated values from multiMonthMasterData.json");
