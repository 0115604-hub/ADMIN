const XLSX = require('xlsx');
const path = require('path');

const srcPath = 'C:\\Users\\k0115\\OneDrive\\바탕 화면\\anti\\260902_[오륙] SQ레벨업 사전점검 진행 현황.xlsx';
const wb = XLSX.readFile(srcPath);
const s = wb.Sheets['평가항목'];
const data = XLSX.utils.sheet_to_json(s, {header: 1});

let currentCategory = '';
let currentNo = '';
let currentDetail = '';

const openItems = [];
for (let i = 6; i < data.length; i++) {
  const row = data[i];
  if (!row || typeof row[0] !== 'number') continue;
  if (row[1]) currentNo = String(row[1]).trim();
  if (row[2]) currentCategory = String(row[2]).trim();
  if (row[3]) currentDetail = String(row[3]).trim();
  
  if (row[11] === 'OPEN') {
    openItems.push({
      seq: row[0],
      no: currentNo,
      category: currentCategory,
      detailReq: currentDetail,
      subItem: row[4] ? String(row[4]).trim() : '',
      statusText: row[5] ? String(row[5]).trim() : '',
      doc: row[8] ? String(row[8]).trim() : '',
      formYn: row[9] ? String(row[9]).trim() : ''
    });
  }
}

console.log('Total OPEN items count:', openItems.length);
openItems.forEach(item => {
  const firstSub = item.subItem.split('\n')[0].replace(/\r/g, '');
  const firstStatus = item.statusText.split('\n')[0].replace(/\r/g, '');
  console.log(`Seq ${item.seq} | [${item.no}] [${item.category}] | ${firstSub} | ${firstStatus}`);
});
