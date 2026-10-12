import XLSX from "xlsx";
import fs from "fs";

const files = [
  { name: "9BQC 단면 확인 체크시트", path: "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 단면 확인 체크시트.xlsx" },
  { name: "9BQC 본드작업일보", path: "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 본드작업일보.xlsx" },
  { name: "9BQC 완제품체크시트", path: "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 완제품체크시트.xlsx" },
  { name: "9BQC 작업일보", path: "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\9BQC 작업일보.xlsx" },
  { name: "LQ2a 작업일보", path: "C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\한울자료\\LQ2a 작업일보.xlsx" }
];

let report = "";

for (const f of files) {
  report += `\n=======================================================\n`;
  report += `### FILE: ${f.name}\n`;
  report += `=======================================================\n`;
  const buf = fs.readFileSync(f.path);
  const wb = XLSX.read(buf, { type: "buffer" });
  report += `Sheets: ${wb.SheetNames.join(", ")}\n\n`;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    report += `#### Sheet: [${sheetName}] (Total Rows: ${data.length})\n`;
    data.forEach((row, rIdx) => {
      // Clean row: compact cells
      const cells = row ? row.map((c, cIdx) => (c !== undefined && c !== null && String(c).trim() !== "" ? `[C${cIdx}:${String(c).replace(/\r?\n/g, " ")}]` : null)).filter(Boolean) : [];
      if (cells.length > 0) {
        report += `R${rIdx + 1}: ${cells.join(" ")}\n`;
      }
    });
    report += `\n`;
  }
}

fs.writeFileSync("scripts/hanul_files_summary.txt", report, "utf-8");
console.log("Written summary to scripts/hanul_files_summary.txt (Length:", report.length, ")");
