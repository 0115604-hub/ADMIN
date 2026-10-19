import ExcelJS from 'exceljs';

const excelPath = 'C:/Users/k0115/OneDrive/바탕 화면/anti/레고 양식.xlsx';
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(excelPath);

console.log('Worksheets:', workbook.worksheets.map(w => w.name));
const ws = workbook.worksheets[0];
const images = ws.getImages();
images.forEach((img, i) => {
  const r = img.range;
  const tl = r ? (r.tl ? `${r.tl.nativeCol || r.tl.col},${r.tl.nativeRow || r.tl.row}` : '') : '';
  const br = r ? (r.br ? `${r.br.nativeCol || r.br.col},${r.br.nativeRow || r.br.row}` : '') : '';
  console.log(`Image ${i + 1}: id=${img.imageId}, tl=(${tl}), br=(${br})`);
});
