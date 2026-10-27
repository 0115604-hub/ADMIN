// ============================================================================
// 🌐 제조현장 작업일보 다국어(12개국어) 번역 서비스 (Work Log Multi-Language i18n Service)
// 지원 언어: 한국어, 영어, 베트남어, 필리핀(타갈로그), 태국어, 스리랑카(싱할라), 우즈베크어,
//          인도네시아어, 미얀마(버마어), 네팔어, 캄보디아(크메르), 몽골어
// ============================================================================
import { getWorkerPersonnelCard, getNationalityMeta } from "./personnelCardService.js";

export const SUPPORTED_LANGUAGES = [
  { code: "ko", name: "한국어", nativeName: "한국어", flag: "🇰🇷", country: "대한민국" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", country: "English / 미국" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭", country: "태국" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", country: "인도네시아" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", country: "베트남" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာစာ", flag: "🇲🇲", country: "미얀마" },
  { code: "tl", name: "Filipino", nativeName: "Tagalog", flag: "🇵🇭", country: "필리핀" },
  { code: "uz", name: "Uzbek", nativeName: "O'zbekcha", flag: "🇺🇿", country: "우즈벡" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰", country: "스리랑카" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵", country: "네팔" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭", country: "캄보디아" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол", flag: "🇲🇳", country: "몽골" }
];

export const WORK_LOG_TRANSLATIONS = {
  // 공통 및 상단 헤더
  select_language: {
    ko: "언어 선택",
    en: "Select Language",
    vi: "Chọn ngôn ngữ",
    tl: "Pumili ng Wika",
    th: "เลือกภาษา",
    si: "භාෂාව තෝරන්න",
    uz: "Tilni tanlang",
    id: "Pilih Bahasa",
    ne: "भाषा चयन गर्नुहोस्",
    km: "ជ្រើសរើសភាសា",
    mn: "Хэл сонгох"
  },
  work_log_title: {
    ko: "일일 작업일보 작성",
    en: "Daily Work Log",
    vi: "Báo cáo công việc hàng ngày",
    tl: "Ulat sa Araw-araw na Trabaho",
    th: "บันทึกรายงานการทำงานประจำวัน",
    si: "දෛනික වැඩ වාර්තාව",
    uz: "Kunlik ish hisoboti",
    id: "Laporan Kerja Harian",
    ne: "दैनिक कार्य विवरण",
    km: "របាយការណ៍ការងារប្រចាំថ្ងៃ",
    mn: "Өдрийн ажлын тайлан"
  },
  extrusion_shop: {
    ko: "압출동 작업자",
    en: "Extrusion Shop Worker",
    vi: "Công nhân xưởng đùn ép",
    tl: "Manggagawa sa Extrusion",
    th: "พนักงานแผนกอัดรีด",
    si: "Extrusion සේවකයා",
    uz: "Ekstruziya sexi ishchisi",
    id: "Pekerja Bagian Ekstrusi",
    ne: "एक्सट्रूज़न कामदार",
    km: "កម្មកររោងចក្រពុម្ព",
    mn: "Шахалтын цехийн ажилтан"
  },
  machining_shop: {
    ko: "가공동 작업자",
    en: "Processing Shop Worker",
    vi: "Công nhân xưởng gia công",
    tl: "Manggagawa sa Machining",
    th: "พนักงานแผนกแปรรูป",
    si: "සැකසුම් අංශ සේවකයා",
    uz: "Qayta ishlash sexi ishchisi",
    id: "Pekerja Bagian Pemrosesan",
    ne: "प्रसंस्करण कामदार",
    km: "កម្មកររោងចក្រកែច្នៃ",
    mn: "Боловсруулах цехийн ажилтан"
  },
  safety_first: {
    ko: "안전제일: 보호구 착용 및 안전수칙 준수",
    en: "Safety First: Wear PPE & Follow Rules",
    vi: "An toàn là trên hết: Đeo đồ bảo hộ & Tuân thủ nội quy",
    tl: "Kaligtasan Una: Magsuot ng PPE at Sumunod sa Patakaran",
    th: "ปลอดภัยไว้ก่อน: สวมอุปกรณ์ป้องกันและปฏิบัติตามกฎ",
    si: "ආරක්ෂාව ප්‍රථම: ආරක්ෂිත ඇඳුම් අඳින්න සහ නීති පිළිපදින්න",
    uz: "Xavfsizlik birinchi: Himoya kiyimi va qoidalarga rioya qiling",
    id: "Utamakan Keselamatan: Gunakan APD & Patuhi Aturan",
    ne: "सुरक्षा पहिलो: सुरक्षात्मक उपकरण लगाउनुहोस् र नियम पालना गर्नुहोस्",
    km: "សុវត្ថិភាពជាចម្បង៖ ពាក់ឧបករណ៍ការពារ និងអនុវត្តតាមបទបញ្ជា",
    mn: "Нэн тэргүүнд аюулгүй байдал: Хамгаалах хэрэгсэл өмсөж, дүрмийг баримтал"
  },

  // 단계 (Steps)
  step_1_tpm: {
    ko: "1단계: TPM 일상점검",
    en: "Step 1: Daily TPM Check",
    vi: "Bước 1: Kiểm tra TPM hàng ngày",
    tl: "Hakbang 1: Araw-araw na TPM Check",
    th: "ขั้นตอนที่ 1: ตรวจเช็ค TPM ประจำวัน",
    si: "පියවර 1: TPM දෛනික පරීක්ෂාව",
    uz: "1-bosqich: TPM kunlik tekshiruvi",
    id: "Langkah 1: Pemeriksaan TPM Harian",
    ne: "चरण १: TPM दैनिक निरीक्षण",
    km: "ជំហានទី 1៖ ការត្រួតពិនិត្យ TPM ប្រចាំថ្ងៃ",
    mn: "Алхам 1: TPM өдөр тутмын үзлэг"
  },
  step_2_production: {
    ko: "2단계: 생산실적 및 작업일보",
    en: "Step 2: Production Log & Report",
    vi: "Bước 2: Báo cáo sản xuất",
    tl: "Hakbang 2: Ulat sa Produksyon",
    th: "ขั้นตอนที่ 2: บันทึกการผลิตและรายงาน",
    si: "පියවර 2: නිෂ්පාදන වාර්තාව",
    uz: "2-bosqich: Ishlab chiqarish hisoboti",
    id: "Langkah 2: Laporan Produksi & Kerja",
    ne: "चरण २: उत्पादन र कार्य विवरण",
    km: "ជំហានទី 2៖ កំណត់ត្រាផលិតកម្ម និងរបាយការណ៍",
    mn: "Алхам 2: Үйлдвэрлэлийн бүртгэл ба тайлан"
  },

  // 폼 필드 라벨
  work_date: {
    ko: "작업일자",
    en: "Work Date",
    vi: "Ngày làm việc",
    tl: "Petsa ng Trabaho",
    th: "วันที่ทำงาน",
    si: "වැඩ කළ දිනය",
    uz: "Ish sanasi",
    id: "Tanggal Kerja",
    ne: "काम गरेको मिति",
    km: "កាលបរិច្ឆេទការងារ",
    mn: "Ажилласан огноо"
  },
  shift: {
    ko: "근무구분 (주간/야간)",
    en: "Shift (Day / Night)",
    vi: "Ca làm việc (Ngày / Đêm)",
    tl: "Shift (Araw / Gabi)",
    th: "กะทำงาน (กลางวัน / กลางคืน)",
    si: "වැඩ මුරය (දිවා / රාත්‍රී)",
    uz: "Smena (Kunduzgi / Tungi)",
    id: "Shift (Siang / Malam)",
    ne: "शिफ्ट (दिन / रात)",
    km: "វេនការងារ (ថ្ងៃ / យប់)",
    mn: "Ээлж (Өдөр / Шөнө)"
  },
  day_shift: {
    ko: "주간",
    en: "Day Shift",
    vi: "Ca ngày",
    tl: "Pang-araw",
    th: "กะกลางวัน",
    si: "දිවා මුරය",
    uz: "Kunduzgi",
    id: "Siang",
    ne: "दिउँसो",
    km: "វេនថ្ងៃ",
    mn: "Өдрийн ээлж"
  },
  night_shift: {
    ko: "야간",
    en: "Night Shift",
    vi: "Ca đêm",
    tl: "Panggabi",
    th: "กะกลางคืน",
    si: "රාත්‍රී මුරය",
    uz: "Tungi",
    id: "Malam",
    ne: "राती",
    km: "វេនយប់",
    mn: "Шөнийн ээлж"
  },
  worker_name: {
    ko: "작업자 성명",
    en: "Worker Name",
    vi: "Tên công nhân",
    tl: "Pangalan ng Manggagawa",
    th: "ชื่อพนักงาน",
    si: "සේවකයාගේ නම",
    uz: "Ishchi ismi",
    id: "Nama Pekerja",
    ne: "कामदारको नाम",
    km: "ឈ្មោះកម្មករ",
    mn: "Ажилтны нэр"
  },
  line_name: {
    ko: "라인 / 호기",
    en: "Line / Machine",
    vi: "Dây chuyền / Máy",
    tl: "Linya / Makina",
    th: "สายการผลิต / เครื่องจักร",
    si: "පෙළ / යන්ත්‍රය",
    uz: "Liniya / Stanok",
    id: "Lini / Mesin",
    ne: "लाइन / मेसिन",
    km: "ខ្សែសង្វាក់ / ម៉ាស៊ីន",
    mn: "Шугам / Төхөөрөмж"
  },
  process_name: {
    ko: "작업 공정",
    en: "Work Process",
    vi: "Công đoạn làm việc",
    tl: "Proseso ng Trabaho",
    th: "กระบวนการทำงาน",
    si: "ක්‍රියාවලිය",
    uz: "Ish jarayoni",
    id: "Proses Kerja",
    ne: "कार्य प्रक्रिया",
    km: "ដំណើរការការងារ",
    mn: "Ажлын процесс"
  },
  vehicle_type: {
    ko: "차종 (Vehicle)",
    en: "Vehicle Model",
    vi: "Loại xe (Model)",
    tl: "Uri ng Sasakyan",
    th: "รุ่นรถยนต์",
    si: "වාහන මාදිලිය",
    uz: "Avtomobil modeli",
    id: "Model Kendaraan",
    ne: "गाडीको मोडल",
    km: "ប្រភេទរថយន្ត",
    mn: "Машины загвар"
  },
  item_name: {
    ko: "품명 (Item Name)",
    en: "Item Name",
    vi: "Tên sản phẩm",
    tl: "Pangalan ng Item",
    th: "ชื่อชิ้นงาน",
    si: "භාණ්ඩයේ නම",
    uz: "Mahsulot nomi",
    id: "Nama Barang",
    ne: "सामानको नाम",
    km: "ឈ្មោះទំនិញ",
    mn: "Бүтээгдэхүүний нэр"
  },

  // 수량 및 실적
  target_qty: {
    ko: "목표수량",
    en: "Target Qty",
    vi: "Số lượng mục tiêu",
    tl: "Target na Dami",
    th: "เป้าหมาย (จำนวน)",
    si: "ඉලක්කගත ප්‍රමාණය",
    uz: "Rejadagi miqdor",
    id: "Target Jumlah",
    ne: "लक्ष्य मात्रा",
    km: "បរិមាណគោលដៅ",
    mn: "Зорилтот тоо"
  },
  actual_qty: {
    ko: "생산수량",
    en: "Actual Qty",
    vi: "Số lượng sản xuất",
    tl: "Aktwal na Dami",
    th: "ผลิตได้จริง (จำนวน)",
    si: "නිෂ්පාදිත ප්‍රමාණය",
    uz: "Ishlab chiqarilgan",
    id: "Jumlah Aktual",
    ne: "वास्तविक उत्पादन",
    km: "បរិមាណជាក់ស្តែង",
    mn: "Бодит үйлдвэрлэл"
  },
  good_qty: {
    ko: "양품수량",
    en: "Good Qty (OK)",
    vi: "Số lượng đạt chuẩn (OK)",
    tl: "Magandang Dami (OK)",
    th: "งานดี (OK)",
    si: "සාර්ථක ප්‍රමාණය (OK)",
    uz: "Yaxshi mahsulot (OK)",
    id: "Jumlah Bagus (OK)",
    ne: "राम्रो सामान (OK)",
    km: "ទំនិញល្អ (OK)",
    mn: "Чанартай гарц (OK)"
  },
  defect_qty: {
    ko: "불량수량",
    en: "Defect Qty (NG)",
    vi: "Số lượng phế phẩm (NG)",
    tl: "May Depekto (NG)",
    th: "งานเสีย (NG)",
    si: "දෝෂ සහිත ප්‍රමාණය (NG)",
    uz: "Yaroqsiz miqdor (NG)",
    id: "Jumlah Cacat (NG)",
    ne: "खराब सामान (NG)",
    km: "ទំនិញខូច (NG)",
    mn: "Гологдол гарц (NG)"
  },
  scrap_kg: {
    ko: "스크랩 중량 (kg)",
    en: "Scrap Weight (kg)",
    vi: "Trọng lượng phế liệu (kg)",
    tl: "Timbang ng Scrap (kg)",
    th: "น้ำหนักเศษสูญเสีย (กก.)",
    si: "Scrap බර (kg)",
    uz: "Chiqindi og'irligi (kg)",
    id: "Berat Scrap (kg)",
    ne: "स्क्र्याप वजन (kg)",
    km: "ទម្ងន់សំណល់ (kg)",
    mn: "Хаягдал жин (кг)"
  },
  yield_rate: {
    ko: "수율",
    en: "Yield Rate",
    vi: "Tỷ lệ đạt chuẩn",
    tl: "Rate ng Yield",
    th: "อัตรางานดี",
    si: "ඵලදායිතා අනුපාතය",
    uz: "Chiqish foizi",
    id: "Tingkat Hasil",
    ne: "उत्पादन दर",
    km: "អត្រាទិន្នផល",
    mn: "Гарцын хувь"
  },

  // 내용 및 비가동
  work_content: {
    ko: "작업내용 및 세부 진행사항",
    en: "Work Details & Progress",
    vi: "Nội dung & Tiến độ công việc",
    tl: "Mga Detalye ng Trabaho",
    th: "รายละเอียดและความคืบหน้างาน",
    si: "වැඩ විස්තර සහ ප්‍රගතිය",
    uz: "Ish tafsilotlari va jarayoni",
    id: "Detail Pekerjaan & Progres",
    ne: "कामको विवरण र प्रगति",
    km: "ព័ត៌មានលម្អិត និងដំណើរការការងារ",
    mn: "Ажлын дэлгэрэнгүй ба явц"
  },
  work_content_placeholder: {
    ko: "당일 생산 작업 내용, 공정 진행 현황, 특이사항을 입력하세요.",
    en: "Enter daily production details, process progress, and special notes.",
    vi: "Nhập chi tiết sản xuất trong ngày, tiến độ công đoạn và lưu ý đặc biệt.",
    tl: "Ilagay ang mga detalye ng produksyon, progreso, at mga espesyal na tala.",
    th: "กรอกรายละเอียดการผลิตประจำวัน ความคืบหน้า และข้อสังเกตพิเศษ",
    si: "දෛනික නිෂ්පාදන විස්තර, ප්‍රගතිය සහ විශේෂ සටහන් ඇතුළත් කරන්න.",
    uz: "Kunlik ishlab chiqarish tafsilotlari, jarayon va maxsus eslatmalarni kiriting.",
    id: "Masukkan detail produksi harian, progres proses, dan catatan khusus.",
    ne: "दैनिक उत्पादन विवरण, प्रक्रिया प्रगति, र विशेष नोटहरू प्रविष्ट गर्नुहोस्।",
    km: "បញ្ចូលព័ត៌មានលម្អិតអំពីការផលិតប្រចាំថ្ងៃ ដំណើរការ និងចំណាំពិសេស។",
    mn: "Өдрийн үйлдвэрлэлийн дэлгэрэнгүй, явц болон онцлох зүйлийг оруулна уу."
  },
  downtime_issues: {
    ko: "비가동 및 설비 트러블",
    en: "Downtime & Machine Issues",
    vi: "Dừng máy & Sự cố thiết bị",
    tl: "Downtime at Problema sa Makina",
    th: "เวลาหยุดเครื่องและปัญหาเครื่องจักร",
    si: "අක්‍රිය කාලය සහ යන්ත්‍ර ගැටලු",
    uz: "To'xtab qolish va uskuna nosozliklari",
    id: "Downtime & Masalah Mesin",
    ne: "डाउनटाइम र मेसिन समस्याहरू",
    km: "ពេលអសកម្ម និងបញ្ហាម៉ាស៊ីន",
    mn: "Сул зогсолт ба төхөөрөмжийн гэмтэл"
  },
  downtime_minutes: {
    ko: "비가동 시간 (분)",
    en: "Downtime (min)",
    vi: "Thời gian dừng (phút)",
    tl: "Oras ng Downtime (min)",
    th: "เวลาหยุด (นาที)",
    si: "අක්‍රිය කාලය (මිනි)",
    uz: "To'xtash vaqti (daq)",
    id: "Waktu Downtime (menit)",
    ne: "डाउनटाइम समय (मिनेट)",
    km: "ពេលអសកម្ម (នាទី)",
    mn: "Сул зогссон хугацаа (мин)"
  },
  downtime_cause: {
    ko: "비가동 사유 (압개시/금형교체/원자재/청소 등)",
    en: "Downtime Cause (Setup / Mold Change / Material / Cleaning)",
    vi: "Lý do dừng máy (Khởi động / Đổi khuôn / Nguyên liệu / Vệ sinh)",
    tl: "Dahilan ng Downtime (Setup / Palit Mold / Materyales / Linis)",
    th: "สาเหตุที่หยุด (เริ่มเครื่อง / เปลี่ยนแม่พิมพ์ / วัตถุดิบ / ทำความสะอาด)",
    si: "අක්‍රිය වීමට හේතුව (ආරම්භය / අච්චුව මාරු කිරීම / අමුද්‍රව්‍ය / පිරිසිදු කිරීම)",
    uz: "To'xtash sababi (Boshlash / Qolip almashtirish / Xomashyo / Tozalash)",
    id: "Penyebab Downtime (Persiapan / Ganti Cetakan / Bahan / Pembersihan)",
    ne: "डाउनटाइमको कारण (सुरुवात / मोल्ड परिवर्तन / कच्चा पदार्थ / सरसफाई)",
    km: "មូលហេតុអសកម្ម (ការចាប់ផ្តើម / ប្តូរពុម្ព / វត្ថុធាតុដើម / សម្អាត)",
    mn: "Сул зогсолтын шалтгаан (Эхлүүлэх / Хэв солих / Түүхий эд / Цэвэрлэгээ)"
  },

  // 버튼 및 액션
  save_work_log: {
    ko: "작업일보 저장 및 등록",
    en: "Save & Submit Work Log",
    vi: "Lưu & Gửi báo cáo công việc",
    tl: "I-save at Isumite ang Ulat",
    th: "บันทึกและส่งรายงานการทำงาน",
    si: "වාර්තාව සුරකින්න සහ ඉදිරිපත් කරන්න",
    uz: "Hisobotni saqlash va topshirish",
    id: "Simpan & Kirim Laporan Kerja",
    ne: "कार्य विवरण सुरक्षित गर्नुहोस्",
    km: "រក្សាទុក និងបញ្ជូនរបាយការណ៍",
    mn: "Ажлын тайланг хадгалах ба илгээх"
  },
  saving: {
    ko: "저장 중...",
    en: "Saving...",
    vi: "Đang lưu...",
    tl: "Ina-save...",
    th: "กำลังบันทึก...",
    si: "සුරකිමින් පවතී...",
    uz: "Saqlanmoqda...",
    id: "Menyimpan...",
    ne: "सुरक्षित गर्दै...",
    km: "កំពុងរក្សាទុក...",
    mn: "Хадгалж байна..."
  },
  take_photo: {
    ko: "사진 촬영 / 파일 첨부",
    en: "Take Photo / Attach File",
    vi: "Chụp ảnh / Đính kèm tệp",
    tl: "Kumuha ng Larawan / Mag-attach",
    th: "ถ่ายรูป / แนบไฟล์",
    si: "ඡායාරූපයක් ගන්න / ගොනුව අමුණන්න",
    uz: "Rasmga olish / Fayl biriktirish",
    id: "Ambil Foto / Lampirkan File",
    ne: "फोटो खिच्नुहोस् / फाइल संलग्न गर्नुहोस्",
    km: "ថតរូប / ភ្ជាប់ឯកសារ",
    mn: "Зураг авах / Файл хавсаргах"
  },
  tpm_all_ok: {
    ko: "전 항목 정상 (All OK)",
    en: "All Items OK",
    vi: "Tất cả bình thường (OK)",
    tl: "Lahat ay Maayos (All OK)",
    th: "ทุกรายการปกติ (All OK)",
    si: "සියල්ල සාමාන්‍යයි (All OK)",
    uz: "Barchasi joyida (All OK)",
    id: "Semua Normal (All OK)",
    ne: "सबै ठीक छ (All OK)",
    km: "គ្រប់ផ្នែកទាំងអស់ធម្មតា (All OK)",
    mn: "Бүх үзүүлэлт хэвийн (All OK)"
  },
  cancel: {
    ko: "취소",
    en: "Cancel",
    vi: "Hủy",
    tl: "Kanselahin",
    th: "ยกเลิก",
    si: "අවලංගු කරන්න",
    uz: "Bekor qilish",
    id: "Batal",
    ne: "रद्द गर्नुहोस्",
    km: "បោះបង់",
    mn: "Цуцлах"
  },
  close: {
    ko: "닫기",
    en: "Close",
    vi: "Đóng",
    tl: "Isara",
    th: "ปิด",
    si: "වසන්න",
    uz: "Yopish",
    id: "Tutup",
    ne: "बन्द गर्नुहोस्",
    km: "បិទ",
    mn: "Хаах",
    my: "ပိတ်မည်"
  },

  // =========================================================================
  // 🌟 [한울 & 5대 공정] TPM 설비일상 점검 시트 전용 번역 (4개국어 + 영어)
  // =========================================================================
  tpm_sheet_title: {
    ko: "설비일상 점검 시트 (TPM 자주보전)",
    en: "Daily Equipment Inspection Sheet (TPM)",
    th: "ใบตรวจเช็คเครื่องจักรประจำวัน (TPM)",
    id: "Lembar Pemeriksaan Mesin Harian (TPM)",
    vi: "Phiếu kiểm tra máy móc hàng ngày (TPM)",
    my: "စက်ပစ္စည်း နေ့စဉ်စစ်ဆေးမှုဇယား (TPM)"
  },
  tpm_sheet_subtitle: {
    ko: "소재준비 라인 절단/단컷팅 6대 설비 7대 일상점검 (작업 전 필수 점검)",
    en: "Preparation Line 6 Cutting/Trimming Machines 7 Daily Checks (Mandatory)",
    th: "ตรวจเช็ค 7 รายการของเครื่องตัด 6 เครื่องในสายเตรียมวัตถุดิบ (ก่อนเริ่มงาน)",
    id: "Pemeriksaan 7 butir pada 6 mesin pemotong lini persiapan (Wajib sebelum kerja)",
    vi: "7 hạng mục kiểm tra cho 6 máy cắt dây chuyền chuẩn bị (Bắt buộc trước ca)",
    my: "ပစ္စည်းပြင်ဆင်ရေးလိုင်း ဖြတ်စက် ၆ လုံးအတွက် နေ့စဉ်စစ်ဆေးမှု ၇ ချက် (မဖြစ်မနေ)"
  },
  tpm_check_items_title: {
    ko: "TPM 7대 일상 점검 항목",
    en: "7 Daily TPM Check Items",
    th: "รายการตรวจเช็คประจำวัน 7 ข้อ (TPM)",
    id: "7 Butir Pemeriksaan Harian TPM",
    vi: "7 hạng mục kiểm tra TPM hàng ngày",
    my: "TPM နေ့စဉ်စစ်ဆေးရမည့် အချက် ၇ ချက်"
  },
  tpm_mach_cut_a: {
    ko: "1. 정치 절단기 (A단면)",
    en: "1. Precision Cutter (Section A)",
    th: "1. เครื่องตัดกำหนดความยาว (หน้าตัด A)",
    id: "1. Mesin Potong Presisi (Bagian A)",
    vi: "1. Máy cắt định hình (Mặt cắt A)",
    my: "၁။ အတိအကျ ဖြတ်စက် (အပိုင်း A)"
  },
  tpm_mach_cut_b: {
    ko: "2. 정치 절단기 (B단면)",
    en: "2. Precision Cutter (Section B)",
    th: "2. เครื่องตัดกำหนดความยาว (หน้าตัด B)",
    id: "2. Mesin Potong Presisi (Bagian B)",
    vi: "2. Máy cắt định hình (Mặt cắt B)",
    my: "၂။ အတိအကျ ဖြတ်စက် (အပိုင်း B)"
  },
  tpm_mach_edge_frt_a: {
    ko: "3. 단컷팅 FRT A",
    en: "3. Edge Cutter FRT A",
    th: "3. เครื่องตัดขอบ FRT A",
    id: "3. Pemotong Ujung FRT A",
    vi: "3. Máy cắt mép FRT A",
    my: "၃။ အစွန်းဖြတ်စက် FRT A"
  },
  tpm_mach_edge_frt_b: {
    ko: "4. 단컷팅 FRT B",
    en: "4. Edge Cutter FRT B",
    th: "4. เครื่องตัดขอบ FRT B",
    id: "4. Pemotong Ujung FRT B",
    vi: "4. Máy cắt mép FRT B",
    my: "၄။ အစွန်းဖြတ်စက် FRT B"
  },
  tpm_mach_edge_rr_b: {
    ko: "5. 단컷팅 RR B",
    en: "5. Edge Cutter RR B",
    th: "5. เครื่องตัดขอบ RR B",
    id: "5. Pemotong Ujung RR B",
    vi: "5. Máy cắt mép RR B",
    my: "၅။ အစွန်းဖြတ်စက် RR B"
  },
  tpm_mach_edge_rr_a: {
    ko: "6. 단컷팅 RR A",
    en: "6. Edge Cutter RR A",
    th: "6. เครื่องตัดขอบ RR A",
    id: "6. Pemotong Ujung RR A",
    vi: "6. Máy cắt mép RR A",
    my: "၆။ အစွန်းဖြတ်စက် RR A"
  },
  tpm_item_1: {
    ko: "1. 작동상태는 양호한가?",
    en: "1. Is operating condition normal?",
    th: "1. สภาพการทำงานของเครื่องจักรปกติหรือไม่?",
    id: "1. Apakah kondisi operasional mesin normal?",
    vi: "1. Máy hoạt động có bình thường không?",
    my: "၁။ စက်လည်ပတ်မှု ပုံမှန်ကောင်းမွန်ပါသလား။"
  },
  tpm_item_2: {
    ko: "2. 칼날 교환 주기 확인",
    en: "2. Check blade replacement cycle",
    th: "2. ตรวจสอบรอบการเปลี่ยนใบมีด (50,000 ชิ้น)",
    id: "2. Periksa siklus penggantian pisau (50.000)",
    vi: "2. Kiểm tra chu kỳ thay lưỡi dao (50.000 cái)",
    my: "၂။ ဓားသွားလဲလှယ်ချိန် စစ်ဆေးရန် (၅ သောင်းပြည့်)"
  },
  tpm_item_3: {
    ko: "3. 제단판 상태는 청결한가?",
    en: "3. Is cutting plate clean?",
    th: "3. โต๊ะตัดและแท่นรองสะอาดหรือไม่?",
    id: "3. Apakah pelat meja potong bersih?",
    vi: "3. Mặt bàn cắt có sạch sẽ không?",
    my: "၃။ ဖြတ်စက်ခုံ သန့်ရှင်းမှု ရှိပါသလား။"
  },
  tpm_item_4: {
    ko: "4. 비상버튼은 제대로 작동하는가?",
    en: "4. Does emergency button work properly?",
    th: "4. ปุ่มหยุดฉุกเฉินทำงานปกติหรือไม่?",
    id: "4. Apakah tombol darurat berfungsi baik?",
    vi: "4. Nút dừng khẩn cấp có hoạt động tốt không?",
    my: "၄။ အရေးပေါ်ခလုတ် ပုံမှန်အလုပ်လုပ်ပါသလား။"
  },
  tpm_item_5: {
    ko: "5. 안전장치는 제대로 작동하는가?",
    en: "5. Do safety devices work properly?",
    th: "5. อุปกรณ์ความปลอดภัยทำงานปกติหรือไม่?",
    id: "5. Apakah pengaman sensor berfungsi baik?",
    vi: "5. Thiết bị an toàn có hoạt động tốt không?",
    my: "၅။ ဘေးကင်းရေးအကာအကွယ် ပုံမှန်အလုပ်လုပ်ပါသလား။"
  },
  tpm_item_6: {
    ko: "6. 컷팅 면은 깨끗한가?",
    en: "6. Is cutting surface clean & smooth?",
    th: "6. ผิวรอยตัดเรียบและสะอาดหรือไม่?",
    id: "6. Apakah permukaan potongan bersih và halus?",
    vi: "6. Bề mặt vết cắt có sạch và mịn không?",
    my: "၆။ ဖြတ်ထားသောမျက်နှာပြင် သန့်ရှင်းညီညာပါသလား။"
  },
  tpm_item_7: {
    ko: "7. 치수확인 지그와 일치하는가?",
    en: "7. Does it match dimensional inspection jig?",
    th: "7. ขนาดตรงตามจิ๊กตรวจสอบหรือไม่?",
    id: "7. Apakah cocok dengan jig pemeriksa ukuran?",
    vi: "7. Kích thước có khớp đồ gá kiểm tra không?",
    my: "၇။ တိုင်းတာမှု ဂျစ် (Jig) နှင့် ကိုက်ညီပါသလား။"
  },
  tpm_status_ok: {
    ko: "양호 (OK)",
    en: "Normal (OK)",
    th: "ปกติ (OK)",
    id: "Baik (OK)",
    vi: "Đạt (OK)",
    my: "ကောင်း (OK)"
  },
  tpm_status_ng: {
    ko: "이상 (NG)",
    en: "Abnormal (NG)",
    th: "ผิดปกติ (NG)",
    id: "Rusak (NG)",
    vi: "Lỗi (NG)",
    my: "မကောင်း (NG)"
  },
  tpm_save_and_next: {
    ko: "TPM 점검 저장하고 작업일보 작성 ➔",
    en: "Save TPM Check & Proceed to Work Report ➔",
    th: "บันทึกการตรวจเช็ค TPM แล้วไปบันทึกรายงาน ➔",
    id: "Simpan Pemeriksaan TPM & Lanjut ke Laporan ➔",
    vi: "Lưu kiểm tra TPM & Tiếp tục viết báo cáo ➔",
    my: "TPM စစ်ဆေးမှုကို သိမ်းဆည်းပြီး အလုပ်မှတ်တမ်းသို့ သွားမည် ➔"
  },

  // =========================================================================
  // 🌟 [한울 가공/협력업체 & 작업일보] 전용 번역 키
  // =========================================================================
  hanul_plant_title: {
    ko: "한림공장 (주)한울 협력업체",
    en: "Hallim Plant Hanul Co. Processing",
    th: "โรงงานฮันลิม บริษัท ฮันอุล แปรรูปภายนอก",
    id: "Pabrik Hallim PT Hanul Pengolahan Luar",
    vi: "Nhà máy Hallim Công ty Hanul Gia công ngoài",
    my: "ဟန်လင်စက်ရုံ (ဟန်အူလ်) အပြင်အပ်ထုတ်လုပ်မှု"
  },
  quality_issues_board: {
    ko: "한울 관리자 품질이슈 공유판",
    en: "Hanul Manager Quality Issue Board",
    th: "บอร์ดแจ้งเตือนคุณภาพจากผู้จัดการ",
    id: "Papan Informasi Masalah Kualitas",
    vi: "Bảng thông tin chất lượng từ Quản lý",
    my: "ဟန်အူလ် မန်နေဂျာ အရည်အသွေး ပြဿနာ မျှဝေရေးဘုတ်"
  },
  work_report_records: {
    ko: "작업일보 등록 내역",
    en: "Work Report Records",
    th: "ประวัติการบันทึกรายงานการทำงาน",
    id: "Riwayat Pendaftaran Laporan Kerja",
    vi: "Lịch sử đăng ký báo cáo công việc",
    my: "အလုပ်မှတ်တမ်း မှတ်ပုံတင်စာရင်း"
  },
  write_9bqc_report: {
    ko: "🚗 9BQC 작업일보 작성 / TPM 점검",
    en: "🚗 9BQC Work Report / TPM Check",
    th: "🚗 เขียนรายงาน 9BQC / ตรวจเช็ค TPM",
    id: "🚗 Tulis Laporan 9BQC / Periksa TPM",
    vi: "🚗 Viết báo cáo 9BQC / Kiểm tra TPM",
    my: "🚗 9BQC အလုပ်မှတ်တမ်းရေးရန် / TPM စစ်ဆေးရန်"
  },
  write_lq2_report: {
    ko: "⚡ LQ2 협력업체 작업일보 작성",
    en: "⚡ LQ2 Work Report",
    th: "⚡ เขียนรายงานการแปรรูป LQ2",
    id: "⚡ Tulis Laporan Pengolahan LQ2",
    vi: "⚡ Viết báo cáo gia công LQ2",
    my: "⚡ LQ2 အပြင်အပ် အလုပ်မှတ်တမ်းရေးရန်"
  },
  first_piece: {
    ko: "초물 (작업 시작)",
    en: "First Piece (Start)",
    th: "ชิ้นแรก (เริ่มงาน)",
    id: "Awal (Mulai Kerja)",
    vi: "Đầu ca (Bắt đầu)",
    my: "ပထမထုတ်ကုန် (အလုပ်စချိန်)"
  },
  middle_piece: {
    ko: "중물 (작업 중간)",
    en: "Middle Piece (Mid)",
    th: "ชิ้นกลาง (ระหว่างงาน)",
    id: "Tengah (Tengah Kerja)",
    vi: "Giữa ca (Giữa giờ)",
    my: "အလယ်ထုတ်ကုန် (အလုပ်အလယ်)"
  },
  final_piece: {
    ko: "종물 (작업 종료)",
    en: "Final Piece (Finish)",
    th: "ชิ้นสุดท้าย (เลิกงาน)",
    id: "Akhir (Selesai Kerja)",
    vi: "Cuối ca (Kết thúc)",
    my: "နောက်ဆုံးထုတ်ကုန် (အလုပ်သိမ်းချိန်)"
  },
  sample_complete: {
    ko: "초·중·종물 기록 완료",
    en: "Sample Check Complete",
    th: "บันทึกตัวอย่างครบถ้วน",
    id: "Catatan Sampel Lengkap",
    vi: "Đã hoàn thành kiểm tra mẫu",
    my: "နမူနာစစ်ဆေးမှု ပြီးစီးပါပြီ"
  },
  sample_pending: {
    ko: "초·중·종물 기록 진행중 (종물 대기)",
    en: "Sample Check In Progress",
    th: "กำลังบันทึกตัวอย่าง (รอชิ้นสุดท้าย)",
    id: "Pencatatan Sampel Berlangsung",
    vi: "Đang kiểm tra mẫu (Đợi cuối ca)",
    my: "နမူနာစစ်ဆေးနေဆဲ (နောက်ဆုံးထုတ်ကုန် စောင့်ဆိုင်း)"
  },
  blade_change_time: {
    ko: "칼날교체시간",
    en: "Blade Replacement Time",
    th: "เวลาเปลี่ยนใบมีด",
    id: "Waktu Ganti Pisau",
    vi: "Thời gian thay dao",
    my: "ဓားသွားလဲလှယ်ချိန်"
  },
  machine_trouble: {
    ko: "설비이상조치",
    en: "Machine Trouble Action",
    th: "การแก้ไขปัญหาเครื่องจักร",
    id: "Tindakan Masalah Mesin",
    vi: "Xử lý sự cố máy móc",
    my: "စက်ချို့ယွင်းမှု ဖြေရှင်းချက်"
  },
  defect_summary_title: {
    ko: "불량 집계표",
    en: "Defect Summary Table",
    th: "ตารางสรุปงานเสีย",
    id: "Tabel Rekapitulasi Cacat",
    vi: "Bảng tổng hợp phế phẩm",
    my: "အပျက်အစီး စာရင်းဇယား"
  },
  auto_translated_notice: {
    ko: "국적에 따라 모국어로 자동 번역되어 표시됩니다.",
    en: "Automatically translated into English based on your profile.",
    th: "แปลเป็นภาษาไทยโดยอัตโนมัติตามสัญชาติของคุณ",
    id: "Diterjemahkan secara otomatis berdasarkan kewarganegaraan Anda.",
    vi: "Được tự동 dịch dựa trên quốc tịch của bạn.",
    my: "သင်၏နိုင်ငံသားအလိုက် မြန်မာဘာသာစကားဖြင့် အလိုအလျောက် ပြသထားပါသည်။"
  },
  auto_translated_badge: {
    ko: "모국어 자동 번역",
    en: "Auto English",
    th: "แปลภาษาไทยอัตโนมัติ",
    id: "Terjemahan Otomatis",
    vi: "Tự động dịch",
    my: "အလိုအလျောက် ပြန်ဆိုထားသည်"
  },
  my_reports: {
    ko: "내 일보만",
    en: "My Reports",
    th: "รายงานของฉัน",
    id: "Laporan Saya",
    vi: "Báo cáo của tôi",
    my: "မိမိမှတ်တမ်းသာ"
  },
  all_reports: {
    ko: "한울 전체",
    en: "All Hanul",
    th: "ฮันอุลทั้งหมด",
    id: "Semua Hanul",
    vi: "Toàn bộ Hanul",
    my: "ဟန်အူလ်အားလုံး"
  },
  status_in_progress: {
    ko: "진행중 (조치중)",
    en: "In Progress",
    th: "กำลังดำเนินการ",
    id: "Sedang Berjalan",
    vi: "Đang xử lý",
    my: "လုပ်ဆောင်နေဆဲ"
  },
  status_resolved: {
    ko: "조치완료",
    en: "Resolved",
    th: "แก้ไขเรียบร้อย",
    id: "Selesai Ditangani",
    vi: "Đã xử lý xong",
    my: "ဖြေရှင်းပြီးပါပြီ"
  },
  view_all: {
    ko: "전체보기",
    en: "View All",
    th: "ดูทั้งหมด",
    id: "Lihat Semua",
    vi: "Xem tất cả",
    my: "အားလုံးကြည့်မည်"
  },
  mark_as_read: {
    ko: "숙지 완료",
    en: "Understood",
    th: "รับทราบแล้ว",
    id: "Sudah Paham",
    vi: "Đã nắm rõ",
    my: "နားလည်သဘောပေါက်ပါပြီ"
  },
  marked_as_read: {
    ko: "✓ 숙지완료",
    en: "✓ Understood",
    th: "✓ รับทราบแล้ว",
    id: "✓ Sudah Paham",
    vi: "✓ Đã nắm rõ",
    my: "✓ နားလည်ပြီး"
  },
  all_ok: {
    ko: "전체 양호(○)",
    en: "All Normal (○)",
    th: "ปกติทั้งหมด (○)",
    id: "Semua Baik (○)",
    vi: "Tất cả Đạt (○)",
    my: "အားလုံးကောင်း (○)"
  },
  machine_ok: {
    ko: "설비 양호",
    en: "Machine OK",
    th: "เครื่องจักรปกติ",
    id: "Mesin Baik",
    vi: "Máy Đạt",
    my: "စက်ကောင်း"
  },
  process: {
    ko: "공정",
    en: "Process",
    th: "ขั้นตอน",
    id: "Proses",
    vi: "Công đoạn",
    my: "လုပ်ငန်းစဉ်"
  },
  dimension_inspection: {
    ko: "초·중·종물 검사",
    en: "Sample Inspection",
    th: "ตรวจตัวอย่าง ต้น-กลาง-ท้าย",
    id: "Pemeriksaan Sampel (Awal-Tengah-Akhir)",
    vi: "Kiểm tra mẫu (Đầu-Giữa-Cuối)",
    my: "နမူနာစစ်ဆေးမှု (အစ-အလယ်-အဆုံး)"
  },
  save_report: {
    ko: "작업일보 저장",
    en: "Save Work Report",
    th: "บันทึกรายงานการทำงาน",
    id: "Simpan Laporan Kerja",
    vi: "Lưu báo cáo công việc",
    my: "အလုပ်မှတ်တမ်း သိမ်းဆည်းရန်"
  },
  abnormality_note: {
    ko: "이상 발생시 조치사항 (Abnormality Action)",
    en: "Abnormality Action Note",
    th: "การดำเนินการเมื่อเกิดความผิดปกติ",
    id: "Tindakan Bila Terjadi Masalah",
    vi: "Biện pháp khi có bất thường",
    my: "ချို့ယွင်းချက်ဖြစ်ပေါ်ပါက ဖြေရှင်းချက်"
  },
  abnormality_placeholder: {
    ko: "설비 이상(작동 불량, 칼날 마모, 비상버튼 미작동, 컷팅면 불량 등) 발생 시 발견 내용 및 조치결과를 기록해 주십시오.",
    en: "In case of equipment abnormality, record findings and action taken.",
    th: "กรณีเครื่องจักรผิดปกติ โปรดบันทึกสิ่งที่พบและผลการแก้ไข",
    id: "Jika terjadi masalah mesin, catat temuan dan tindakan.",
    vi: "Khi xảy ra sự cố máy, vui lòng ghi lại nội dung phát hiện và kết quả xử lý.",
    my: "စက်ချို့ယွင်းမှုဖြစ်ပါက တွေ့ရှိချက်နှင့် ဖြေရှင်းချက်ကို မှတ်တမ်းတင်ပါ။"
  },
  back_to_tpm: {
    ko: "⬅️ TPM 점검표 다시보기",
    en: "⬅️ View TPM Check Sheet",
    th: "⬅️ ดูใบตรวจเช็ค TPM อีกครั้ง",
    id: "⬅️ Lihat Lembar TPM Lagi",
    vi: "⬅️ Xem lại phiếu TPM",
    my: "⬅️ TPM စစ်ဆေးမှု ပြန်ကြည့်မည်"
  },
  special_notes: {
    ko: "특이사항",
    en: "Special Notes",
    th: "หมายเหตุพิเศษ",
    id: "Catatan Khusus",
    vi: "Ghi chú đặc biệt",
    my: "ထူးခြားချက်မှတ်ချက်"
  },
  action_management: {
    ko: "관리",
    en: "Action",
    th: "จัดการ",
    id: "Kelola",
    vi: "Quản lý",
    my: "စီမံခန့်ခွဲမှု"
  },
  delete_report: {
    ko: "일보 삭제",
    en: "Delete Report",
    th: "ลบรายงาน",
    id: "Hapus Laporan",
    vi: "Xóa báo cáo",
    my: "မှတ်တမ်းဖျက်မည်"
  },
  excel_download: {
    ko: "엑셀 다운로드",
    en: "Excel Download",
    th: "ดาวน์โหลด Excel",
    id: "Unduh Excel",
    vi: "Tải xuống Excel",
    my: "Excel ဒေါင်းလုဒ်"
  }
};

// ⚡ 자주 쓰이는 키 별칭(Alias) 등록으로 번역 누락 및 조회 지연 원천 차단
WORK_LOG_TRANSLATIONS.date = WORK_LOG_TRANSLATIONS.work_date;
WORK_LOG_TRANSLATIONS.worker = WORK_LOG_TRANSLATIONS.worker_name;
WORK_LOG_TRANSLATIONS.production_qty = WORK_LOG_TRANSLATIONS.actual_qty;

const LOCAL_STORAGE_LANG_KEY = "factory_worker_language_v1";

// 🚀 인메모리 언어 캐시 (매 렌더링/라벨 조회마다 수백 번의 LocalStorage 동기 I/O 발생 원천 차단)
let memoryCurrentLang = null;
const SUPPORTED_LANG_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

// 현재 언어 가져오기 (인메모리 O(1) 우선 조회, 기본값: 'ko')
export const getCurrentWorkLogLanguage = () => {
  if (memoryCurrentLang) return memoryCurrentLang;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (saved && SUPPORTED_LANG_CODES.has(saved)) {
        memoryCurrentLang = saved;
        return saved;
      }
    }
  } catch (e) {
    console.warn("Failed to get current work log language:", e);
  }
  memoryCurrentLang = "ko";
  return "ko";
};

// 언어 변경 및 저장 (동일 언어 중복 호출 시 불필요한 스토리지 쓰기 및 커스텀 이벤트 버블링 차단)
export const setWorkLogLanguage = (langCode) => {
  const target = SUPPORTED_LANG_CODES.has(langCode) ? langCode : "ko";
  if (memoryCurrentLang === target) {
    return target;
  }
  memoryCurrentLang = target;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, target);
      window.dispatchEvent(new CustomEvent("factory_language_changed", { detail: { lang: target } }));
    }
  } catch (e) {
    console.warn("Failed to set work log language:", e);
  }
  return target;
};

// 번역 텍스트 조회 헬퍼 (초고속 O(1) 인메모리 조회)
export const getWorkLogText = (key, lang = null) => {
  if (!key) return "";
  const currentLang = lang || memoryCurrentLang || getCurrentWorkLogLanguage();
  const entry = WORK_LOG_TRANSLATIONS[key];
  if (!entry) return key;
  return entry[currentLang] || entry["ko"] || entry["en"] || key;
};

// ============================================================================
// 🌍 국적(Nationality) ➔ 지원 언어 코드 자동 매핑 (캐시 기반 최적화)
// ⭐ 규칙:
// 1) 한국 / 대한민국 ➔ "ko" (한국어)
// 2) 4대 주요 국적:
//    - 태국 ➔ "th" (태국어)
//    - 인도네시아 ➔ "id" (인도네시아어)
//    - 베트남 ➔ "vi" (베트남어)
//    - 미얀마 ➔ "my" (미얀마/버마어)
// 3) 🌟 4개 국적 이외의 모든 외국인 작업자 (필리핀, 우즈벡, 스리랑카, 네팔, 캄보디아, 몽골, 기타 등)
//    ➔ 영어가 기본으로 보여지도록 "en" 적용
// ============================================================================
const nationalityLangMap = new Map();

export const getLanguageForNationality = (nationality) => {
  if (!nationality) return "ko";
  const nat = String(nationality).trim().toLowerCase();
  const cached = nationalityLangMap.get(nat);
  if (cached) return cached;

  let result = "en";

  // 1. 한국 / 대한민국 ➔ 한국어 (ko)
  if (
    nat.includes("대한민국") ||
    nat.includes("한국") ||
    nat.includes("korea") ||
    nat.includes("korean") ||
    nat === "ko" ||
    nat === "kr"
  ) {
    result = "ko";
  }
  // 2. 4대 주요 국적: 태국, 인도네시아, 베트남, 미얀마
  else if (nat.includes("태국") || nat.includes("thailand") || nat.includes("thai") || nat === "th") {
    result = "th";
  } else if (nat.includes("인도네시아") || nat.includes("indonesia") || nat === "id") {
    result = "id";
  } else if (nat.includes("베트남") || nat.includes("vietnam") || nat.includes("viet") || nat === "vi") {
    result = "vi";
  } else if (nat.includes("미얀마") || nat.includes("myanmar") || nat.includes("burma") || nat.includes("burmese") || nat === "my") {
    result = "my";
  } else {
    // 3. 그 외 외국인 ➔ 영어 기본
    result = "en";
  }

  nationalityLangMap.set(nat, result);
  return result;
};

// ============================================================================
// 👤 근로자 인사카드 기반 국적 및 자동 언어 메타 조회 (Map 캐싱으로 가비지 제거)
// ============================================================================
const workerLangInfoCache = new Map();

export const getWorkerLanguageInfo = (workerOrProfile) => {
  if (!workerOrProfile) {
    return {
      code: "ko",
      name: "Korean",
      nativeName: "한국어",
      flag: "🇰🇷",
      country: "대한민국",
      nationality: "대한민국",
      nationalityFlag: "🇰🇷",
      isAutoTranslated: false
    };
  }

  const cacheKey = `${workerOrProfile.company || ""}_${workerOrProfile.name || ""}_${workerOrProfile.nationality || ""}_${workerOrProfile.nationalityOther || ""}`;
  if (workerLangInfoCache.has(cacheKey)) {
    return workerLangInfoCache.get(cacheKey);
  }

  let nationality = workerOrProfile.nationality;
  let nationalityOther = workerOrProfile.nationalityOther;

  // 인사카드 데이터 조회 보완
  if (!nationality) {
    try {
      const card = getWorkerPersonnelCard(workerOrProfile);
      if (card) {
        nationality = card.nationality;
        nationalityOther = card.nationalityOther;
      }
    } catch (e) {
      console.warn("getWorkerPersonnelCard lookup warning:", e);
    }
  }

  const effectiveNationality = (nationality === "기타" ? (nationalityOther || nationality) : nationality) || "대한민국";
  const langCode = getLanguageForNationality(effectiveNationality);
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[1];
  const natMeta = typeof getNationalityMeta === "function" ? getNationalityMeta(effectiveNationality) : null;

  const result = {
    ...langMeta,
    nationality: effectiveNationality,
    nationalityFlag: natMeta?.flag || langMeta.flag,
    isAutoTranslated: langCode !== "ko"
  };

  workerLangInfoCache.set(cacheKey, result);
  return result;
};

// ============================================================================
// 🏭 작업일보 & 5대 공정 레고 블록 실시간 다국어 사전 (Work Report Live Translation Dictionary)
// 지원: ko (한국어), en (English), vi (Tiếng Việt), th (ภาษาไทย), id (Bahasa Indonesia), my (မြန်မာစာ)
// ============================================================================
export const WORK_REPORT_DICTIONARY = {
  // --- 결재 및 기본 헤더 ---
  "양식번호": { ko: "양식번호", en: "Form No.", vi: "Số biểu mẫu", th: "หมายเลขแบบฟอร์ม", id: "No. Formulir", my: "ပုံစံနံပါတ်" },
  "소재준비작업일보": { ko: "소재준비작업일보", en: "Material Prep Work Log", vi: "Báo cáo chuẩn bị nguyên liệu", th: "บันทึกเตรียมวัตถุดิบ", id: "Laporan Persiapan Material", my: "ကုန်ကြမ်းပြင်ဆင်မှု အလုပ်မှတ်တမ်း" },
  "결재": { ko: "결재", en: "Approval", vi: "Phê duyệt", th: "อนุมัติ", id: "Persetujuan", my: "အတည်ပြုချက်" },
  "작 성": { ko: "작 성", en: "Prepared by", vi: "Người lập", th: "ผู้จัดทำ", id: "Dibuat", my: "ရေးသွင်းသူ" },
  "작성": { ko: "작성", en: "Prepared by", vi: "Người lập", th: "ผู้จัดทำ", id: "Dibuat", my: "ရေးသွင်းသူ" },
  "검 토": { ko: "검 토", en: "Reviewed by", vi: "Kiểm tra", th: "ผู้ตรวจสอบ", id: "Diperiksa", my: "စစ်ဆေးသူ" },
  "검토": { ko: "검토", en: "Reviewed by", vi: "Kiểm tra", th: "ผู้ตรวจสอบ", id: "Diperiksa", my: "စစ်ဆေးသူ" },
  "승 인": { ko: "승 인", en: "Approved by", vi: "Phê duyệt", th: "ผู้อนุมัติ", id: "Disetujui", my: "အတည်ပြုသူ" },
  "승인": { ko: "승인", en: "Approved by", vi: "Phê duyệt", th: "ผู้อนุมัติ", id: "Disetujui", my: "အတည်ပြုသူ" },

  // --- 블록 8: 작업 기본 정보 ---
  "[블록 8] 작업 기본 정보 헤더": {
    ko: "[블록 8] 작업 기본 정보 헤더",
    en: "[Block 8] Basic Work Info",
    vi: "[Khối 8] Thông tin cơ bản",
    th: "[บล็อก 8] ข้อมูลการทำงานพื้นฐาน",
    id: "[Blok 8] Info Dasar Pekerjaan",
    my: "[အကွက် ၈] အခြေခံအလုပ်အချက်အလက်"
  },
  "(차종 · 품명 · 공정명 · 작업자 · 근무시간)": {
    ko: "(차종 · 품명 · 공정명 · 작업자 · 근무시간)",
    en: "(Car · Part · Process · Worker · Shift)",
    vi: "(Dòng xe · Phụ tùng · Công đoạn · Công nhân · Giờ làm)",
    th: "(รุ่นรถ · ชิ้นงาน · กระบวนการ · พนักงาน · เวลา)",
    id: "(Model · Barang · Proses · Pekerja · Jam)",
    my: "(ကားမော်ဒယ် · ပစ္စည်းအမည် · လုပ်ငန်းစဉ် · အလုပ်သမား · အချိန်)"
  },
  "차종 (Car model)": { ko: "차종 (Car model)", en: "Car Model", vi: "Dòng xe (Car model)", th: "รุ่นรถ (Car model)", id: "Model Mobil (Car model)", my: "ကားမော်ဒယ် (Car model)" },
  "차종명 (Car model)": { ko: "차종명 (Car model)", en: "Car Model", vi: "Dòng xe (Car model)", th: "รุ่นรถ (Car model)", id: "Model Mobil (Car model)", my: "ကားမော်ဒယ် (Car model)" },
  "차종": { ko: "차종", en: "Car Model", vi: "Dòng xe", th: "รุ่นรถ", id: "Model Mobil", my: "ကားမော်ဒယ်" },
  "품 명 (Part name)": { ko: "품 명 (Part name)", en: "Part Name", vi: "Tên phụ tùng (Part name)", th: "ชื่อชิ้นงาน (Part name)", id: "Nama Barang (Part name)", my: "ပစ္စည်းအမည် (Part name)" },
  "품명 (Part name)": { ko: "품명 (Part name)", en: "Part Name", vi: "Tên phụ tùng (Part name)", th: "ชื่อชิ้นงาน (Part name)", id: "Nama Barang (Part name)", my: "ပစ္စည်းအမည် (Part name)" },
  "품명": { ko: "품명", en: "Part Name", vi: "Tên phụ tùng", th: "ชื่อชิ้นงาน", id: "Nama Barang", my: "ပစ္စည်းအမည်" },
  "공정명 (Process)": { ko: "공정명 (Process)", en: "Process", vi: "Công đoạn (Process)", th: "กระบวนการ (Process)", id: "Proses (Process)", my: "လုပ်ငန်းစဉ် (Process)" },
  "공정명 (Process name)": { ko: "공정명 (Process name)", en: "Process Name", vi: "Tên công đoạn", th: "ชื่อกระบวนการ", id: "Nama Proses", my: "လုပ်ငန်းစဉ်အမည်" },
  "공정명": { ko: "공정명", en: "Process", vi: "Công đoạn", th: "กระบวนการ", id: "Proses", my: "လုပ်ငန်းစဉ်" },
  "작업자 (Worker)": { ko: "작업자 (Worker)", en: "Worker", vi: "Công nhân (Worker)", th: "พนักงาน (Worker)", id: "Pekerja (Worker)", my: "အလုပ်သမား (Worker)" },
  "작업자": { ko: "작업자", en: "Worker", vi: "Công nhân", th: "พนักงาน", id: "Pekerja", my: "အလုပ်သမား" },
  "근무 시간": { ko: "근무 시간", en: "Work Hours", vi: "Giờ làm việc", th: "เวลาทำงาน", id: "Jam Kerja", my: "အလုပ်ချိန်" },
  "근무시간": { ko: "근무시간", en: "Work Hours", vi: "Giờ làm việc", th: "เวลาทำงาน", id: "Jam Kerja", my: "အလုပ်ချိန်" },
  "작업시간": { ko: "작업시간", en: "Work Time", vi: "Thời gian làm việc", th: "เวลาทำงาน", id: "Waktu Kerja", my: "အလုပ်ချိန်" },
  "근무조": { ko: "근무조", en: "Shift", vi: "Ca làm việc", th: "กะทำงาน", id: "Shift Kerja", my: "အလုပ်ဆိုင်း" },
  "주간": { ko: "주간", en: "Day Shift", vi: "Ca ngày", th: "กะกลางวัน", id: "Shift Siang", my: "နေ့ဆိုင်း" },
  "야간": { ko: "야간", en: "Night Shift", vi: "Ca đêm", th: "กะกลางคืน", id: "Shift Malam", my: "ညဆိုင်း" },
  "주간 (Day)": { ko: "주간 (Day)", en: "Day Shift", vi: "Ca ngày (Day)", th: "กะกลางวัน (Day)", id: "Shift Siang (Day)", my: "နေ့ဆိုင်း (Day)" },
  "야간 (Night)": { ko: "야간 (Night)", en: "Night Shift", vi: "Ca đêm (Night)", th: "กะกลางคืน (Night)", id: "Shift Malam (Night)", my: "ညဆိုင်း (Night)" },
  "작업일자": { ko: "작업일자", en: "Work Date", vi: "Ngày làm việc", th: "วันที่ทำงาน", id: "Tanggal Kerja", my: "အလုပ်ရက်စွဲ" },
  "소재준비": { ko: "소재준비", en: "Material Prep", vi: "Chuẩn bị nguyên liệu", th: "เตรียมวัตถุดิบ", id: "Persiapan Material", my: "ကုန်ကြမ်းပြင်ဆင်မှု" },

  // --- 블록 9 & 블록 1: 작업시간 및 생산실적 ---
  "[블록 9] 작업시간 및 생산실적 테이블": {
    ko: "[블록 9] 작업시간 및 생산실적 테이블",
    en: "[Block 9] Work Time & Production Table",
    vi: "[Khối 9] Bảng giờ làm & Sản lượng",
    th: "[บล็อก 9] ตารางเวลาทำงานและผลผลิต",
    id: "[Blok 9] Tabel Jam Kerja & Output",
    my: "[အကွက် ၉] အလုပ်ချိန်နှင့် ထုတ်လုပ်မှုစာရင်း"
  },
  "구 분(Division)": { ko: "구 분(Division)", en: "Division", vi: "Phân loại (Division)", th: "ประเภท (Division)", id: "Divisi (Division)", my: "အပိုင်းခွဲ (Division)" },
  "구 분 (Division)": { ko: "구 분 (Division)", en: "Division", vi: "Phân loại (Division)", th: "ประเภท (Division)", id: "Divisi (Division)", my: "အပိုင်းခွဲ (Division)" },
  "구 분": { ko: "구 분", en: "Division", vi: "Phân loại", th: "ประเภท", id: "Divisi", my: "အပိုင်းခွဲ" },
  "구분": { ko: "구분", en: "Division", vi: "Phân loại", th: "ประเภท", id: "Divisi", my: "အပိုင်းခွဲ" },
  "A단면 실적": { ko: "A단면 실적", en: "Section A Output", vi: "Sản lượng mặt A", th: "ผลผลิตหน้าตัด A", id: "Output Bagian A", my: "အပိုင်း A ထုတ်လုပ်မှု" },
  "B단면 실적": { ko: "B단면 실적", en: "Section B Output", vi: "Sản lượng mặt B", th: "ผลผลิตหน้าตัด B", id: "Output Bagian B", my: "အပိုင်း B ထုတ်လုပ်မှု" },
  "C단면 실적": { ko: "C단면 실적", en: "Section C Output", vi: "Sản lượng mặt C", th: "ผลผลิตหน้าตัด C", id: "Output Bagian C", my: "အပိုင်း C ထုတ်လုပ်မှု" },
  "시작시간": { ko: "시작시간", en: "Start Time", vi: "Giờ bắt đầu", th: "เวลาเริ่ม", id: "Jam Mulai", my: "စတင်ချိန်" },
  "시작 시간": { ko: "시작 시간", en: "Start Time", vi: "Giờ bắt đầu", th: "เวลาเริ่ม", id: "Jam Mulai", my: "စတင်ချိန်" },
  "종료시간": { ko: "종료시간", en: "Finish Time", vi: "Giờ kết thúc", th: "เวลาเสร็จ", id: "Jam Selesai", my: "ပြီးဆုံးချိန်" },
  "종료 시간": { ko: "종료 시간", en: "Finish Time", vi: "Giờ kết thúc", th: "เวลาเสร็จ", id: "Jam Selesai", my: "ပြီးဆုံးချိန်" },
  "생산수량": { ko: "생산수량", en: "Production Qty", vi: "Số lượng sản xuất", th: "จำนวนผลิต", id: "Jumlah Produksi", my: "ထုတ်လုပ်မှုပမာဏ" },
  "정품수량": { ko: "정품수량", en: "Good Qty (OK)", vi: "Số lượng đạt (OK)", th: "จำนวนงานดี (OK)", id: "Jumlah Bagus (OK)", my: "ကောင်းမွန်သော ပမာဏ (OK)" },
  "정품": { ko: "정품", en: "Good (OK)", vi: "Hàng đạt (OK)", th: "งานดี (OK)", id: "Produk Bagus (OK)", my: "ကောင်း (OK)" },
  "정 품": { ko: "정 품", en: "Good (OK)", vi: "Hàng đạt (OK)", th: "งานดี (OK)", id: "Produk Bagus (OK)", my: "ကောင်း (OK)" },
  "불량수량": { ko: "불량수량", en: "Defect Qty (NG)", vi: "Số lượng lỗi (NG)", th: "จำนวนงานเสีย (NG)", id: "Jumlah Cacat (NG)", my: "ချို့ယွင်းချက် ပမာဏ (NG)" },
  "불량": { ko: "불량", en: "Defect (NG)", vi: "Hàng lỗi (NG)", th: "งานเสีย (NG)", id: "Produk Cacat (NG)", my: "မကောင်း (NG)" },
  "재조인트": { ko: "재조인트", en: "Re-joint", vi: "Nối lại (Re-joint)", th: "ต่อซ้ำ (Re-joint)", id: "Sambung Ulang", my: "ပြန်ဆက်ခြင်း" },
  "가동시간": { ko: "가동시간", en: "Operating Hours", vi: "Thời gian chạy máy", th: "เวลาเดินเครื่อง", id: "Jam Operasi", my: "စက်လည်ပတ်ချိန်" },

  // --- 초물 / 중물 / 종물 / 규격 / 판정 ---
  "초물(Start)": { ko: "초물(Start)", en: "Initial (Start)", vi: "Đầu ca (Start)", th: "ชิ้นแรก (Start)", id: "Awal (Start)", my: "အစနမူနာ (Start)" },
  "초물 (Start)": { ko: "초물 (Start)", en: "Initial (Start)", vi: "Đầu ca (Start)", th: "ชิ้นแรก (Start)", id: "Awal (Start)", my: "အစနမူနာ (Start)" },
  "초물": { ko: "초물", en: "Initial (Start)", vi: "Đầu ca (Start)", th: "ชิ้นแรก (Start)", id: "Awal (Start)", my: "အစနမူနာ (Start)" },
  "중물(Half)": { ko: "중물(Half)", en: "Middle (Half)", vi: "Giữa ca (Half)", th: "ชิ้นกลาง (Half)", id: "Tengah (Half)", my: "အလယ်နမူနာ (Half)" },
  "중물 (Half)": { ko: "중물 (Half)", en: "Middle (Half)", vi: "Giữa ca (Half)", th: "ชิ้นกลาง (Half)", id: "Tengah (Half)", my: "အလယ်နမူနာ (Half)" },
  "중물": { ko: "중물", en: "Middle (Half)", vi: "Giữa ca (Half)", th: "ชิ้นกลาง (Half)", id: "Tengah (Half)", my: "အလယ်နမူနာ (Half)" },
  "종물(Finish)": { ko: "종물(Finish)", en: "Final (Finish)", vi: "Cuối ca (Finish)", th: "ชิ้นท้าย (Finish)", id: "Akhir (Finish)", my: "အဆုံးနမူနာ (Finish)" },
  "종물 (Finish)": { ko: "종물 (Finish)", en: "Final (Finish)", vi: "Cuối ca (Finish)", th: "ชิ้นท้าย (Finish)", id: "Akhir (Finish)", my: "အဆုံးနမူနာ (Finish)" },
  "종물": { ko: "종물", en: "Final (Finish)", vi: "Cuối ca (Finish)", th: "ชิ้นท้าย (Finish)", id: "Akhir (Finish)", my: "အဆုံးနမူနာ (Finish)" },
  "초/중/종": { ko: "초/중/종", en: "Start/Half/Finish", vi: "Đầu/Giữa/Cuối", th: "แรก/กลาง/ท้าย", id: "Awal/Tengah/Akhir", my: "အစ/အလယ်/အဆုံး" },
  "규격(Spec)": { ko: "규격(Spec)", en: "Spec", vi: "Quy cách (Spec)", th: "สเปก (Spec)", id: "Spesifikasi (Spec)", my: "စံသတ်မှတ်ချက် (Spec)" },
  "규격": { ko: "규격", en: "Spec", vi: "Quy cách", th: "สเปก", id: "Spesifikasi", my: "စံသတ်မှတ်ချက်" },
  "SPEC": { ko: "SPEC", en: "SPEC", vi: "SPEC", th: "สเปก (SPEC)", id: "SPEC", my: "SPEC" },
  "실측치": { ko: "실측치", en: "Actual Value", vi: "Giá trị đo thực", th: "ค่าที่วัดได้จริง", id: "Nilai Terukur", my: "လက်တွေ့တိုင်းတာချက်" },
  "실 측 치": { ko: "실 측 치", en: "Actual Value", vi: "Giá trị đo thực", th: "ค่าที่วัดได้จริง", id: "Nilai Terukur", my: "လက်တွေ့တိုင်းတာချက်" },
  "판정": { ko: "판정", en: "Judgement", vi: "Đánh giá", th: "การตัดสิน", id: "Keputusan", my: "ဆုံးဖြတ်ချက်" },
  "합격": { ko: "합격", en: "Pass (OK)", vi: "Đạt (OK)", th: "ผ่าน (OK)", id: "Lolos (OK)", my: "အောင်မြင် (OK)" },
  "불합격": { ko: "불합격", en: "Fail (NG)", vi: "Không đạt (NG)", th: "ไม่ผ่าน (NG)", id: "Gagal (NG)", my: "မအောင်မြင် (NG)" },
  "양호": { ko: "양호", en: "Normal / OK", vi: "Tốt (OK)", th: "ปกติ (OK)", id: "Baik (OK)", my: "ပုံမှန်ကောင်းမွန် (OK)" },
  "적합": { ko: "적합", en: "Conforming (OK)", vi: "Phù hợp (OK)", th: "ถูกต้อง (OK)", id: "Sesuai (OK)", my: "ကိုက်ညီ (OK)" },
  "비고": { ko: "비고", en: "Note", vi: "Ghi chú", th: "หมายเหตุ", id: "Keterangan", my: "မှတ်ချက်" },
  "관리": { ko: "관리", en: "Manage", vi: "Quản lý", th: "จัดการ", id: "Kelola", my: "စီမံမှု" },

  // --- 블록 15: 정치 절단 길이 & LOT NO. ---
  "[블록 15] 정치 절단 길이 (Spec cutting) & LOT NO.": {
    ko: "[블록 15] 정치 절단 길이 & LOT NO.",
    en: "[Block 15] Spec Cutting Length & LOT NO.",
    vi: "[Khối 15] Chiều dài cắt chính xác & Số LOT",
    th: "[บล็อก 15] ความยาวตัดตามสเปก & LOT NO.",
    id: "[Blok 15] Panjang Potong Presisi & No. LOT",
    my: "[အကွက် ၁၅] အတိအကျဖြတ်တောက်မှု အရှည်နှင့် LOT နံပါတ်"
  },
  "정치 절단 길이": { ko: "정치 절단 길이", en: "Spec Cutting Length", vi: "Chiều dài cắt chuẩn", th: "ความยาวตัดตามสเปก", id: "Panjang Potong Presisi", my: "အတိအကျဖြတ်တောက်မှု အရှည်" },
  "정치절단": { ko: "정치절단", en: "Spec Cutting", vi: "Cắt chuẩn kích thước", th: "ตัดตามขนาด", id: "Potong Presisi", my: "အတိအကျဖြတ်တောက်ခြင်း" },
  "압출 LOT NO.": { ko: "압출 LOT NO.", en: "Extrusion LOT No.", vi: "Số LOT đùn ép", th: "LOT อัดรีด", id: "No. LOT Ekstrusi", my: "အပူပေးပုံသွင်း LOT နံပါတ်" },
  "초물 LOT": { ko: "초물 LOT", en: "Start LOT", vi: "LOT đầu ca", th: "LOT ชิ้นแรก", id: "LOT Awal", my: "အစ LOT" },
  "중물 LOT": { ko: "중물 LOT", en: "Half LOT", vi: "LOT giữa ca", th: "LOT ชิ้นกลาง", id: "LOT Tengah", my: "အလယ် LOT" },
  "종물 LOT": { ko: "종물 LOT", en: "Finish LOT", vi: "LOT cuối ca", th: "LOT ชิ้นท้าย", id: "LOT Akhir", my: "အဆုံး LOT" },

  // --- 블록 2 & 3: 단컷팅 치수 ---
  "[블록 2] 단컷팅 FRT 구간 치수 (49/45mm)": {
    ko: "[블록 2] 단컷팅 FRT 구간 치수",
    en: "[Block 2] Step Cutting FRT Dimensions",
    vi: "[Khối 2] Kích thước cắt bậc FRT",
    th: "[บล็อก 2] ขนาดตัดสเต็ป FRT",
    id: "[Blok 2] Dimensi Potong Bertingkat FRT",
    my: "[အကွက် ၂] FRT အဆင့်လိုက်ဖြတ်တောက်မှု တိုင်းတာချက်"
  },
  "[블록 3] 단컷팅 RR 구간 치수 (40/39mm)": {
    ko: "[블록 3] 단컷팅 RR 구간 치수",
    en: "[Block 3] Step Cutting RR Dimensions",
    vi: "[Khối 3] Kích thước cắt bậc RR",
    th: "[บล็อก 3] ขนาดตัดสเต็ป RR",
    id: "[Blok 3] Dimensi Potong Bertingkat RR",
    my: "[အကွက် ၃] RR အဆင့်လိုက်ဖြတ်တောက်မှု တိုင်းတာချက်"
  },
  "단컷팅 치수": { ko: "단컷팅 치수", en: "Step Cutting Dimensions", vi: "Kích thước cắt bậc", th: "ขนาดตัดสเต็ป", id: "Dimensi Potong Bertingkat", my: "အဆင့်လိုက်ဖြတ်တောက်မှု တိုင်းတာချက်" },

  // --- 블록 10 & 16: 불량소재구분 ---
  "[블록 10] 불량소재구분 8열 매트릭스": {
    ko: "[블록 10] 불량소재구분 8열 매트릭스",
    en: "[Block 10] Defect Material 8-Col Matrix",
    vi: "[Khối 10] Ma trận phân loại lỗi 8 cột",
    th: "[บล็อก 10] เมทริกซ์จำแนกวัสดุเสีย 8 คอลัมน์",
    id: "[Blok 10] Matriks Material Cacat 8 Kolom",
    my: "[အကွက် ၁၀] ချို့ယွင်းချက်ပစ္စည်း ၈ ကော်လံ မက်ထရစ်"
  },
  "불량소재구분": { ko: "불량소재구분", en: "Defect Material Category", vi: "Phân loại vật liệu lỗi", th: "จำแนกวัสดุเสีย", id: "Klasifikasi Material Cacat", my: "ချို့ယွင်းချက်ပစ္စည်း ခွဲခြားမှု" },
  "압출소재불량": { ko: "압출소재불량", en: "Extrusion Material Defect", vi: "Lỗi phôi đùn ép", th: "ข้อบกพร่องจากงานอัดรีด", id: "Cacat Material Ekstrusi", my: "အပူပေးပုံသွင်း ချို့ယွင်းချက်" },
  "공정간불량": { ko: "공정간불량", en: "In-Process Defect", vi: "Lỗi trong công đoạn", th: "ของเสียระหว่างกระบวนการ", id: "Cacat Antar Proses", my: "လုပ်ငန်းစဉ်အတွင်း ချို့ယွင်းချက်" },
  "[블록 16] 불량소재구분 (Section A / B / C 3단면)": {
    ko: "[블록 16] 불량소재구분 (3단면)",
    en: "[Block 16] Defect Material (Section A/B/C)",
    vi: "[Khối 16] Lỗi vật liệu (Mặt A/B/C)",
    th: "[บล็อก 16] วัสดุเสีย (หน้าตัด A/B/C)",
    id: "[Blok 16] Material Cacat (Bagian A/B/C)",
    my: "[အကွက် ၁၆] ချို့ယွင်းချက်ပစ္စည်း (အပိုင်း A/B/C)"
  },

  // --- 불량 항목 명칭 ---
  "찍힘": { ko: "찍힘", en: "Dent / Ding", vi: "Vết cấn / Móp", th: "รอยบุบ/รอยกระแทก", id: "Penyok", my: "ချိုင့်ခွက်ခြင်း" },
  "찢어짐": { ko: "찢어짐", en: "Tear / Rip", vi: "Rách", th: "ฉีกขาด", id: "Robek", my: "ပြဲစုတ်ခြင်း" },
  "미성형": { ko: "미성형", en: "Underfilling / Short Shot", vi: "Đúc thiếu (Thiếu thịt)", th: "ขึ้นรูปไม่เต็ม", id: "Cetakan Kurang", my: "ပုံသွင်းမပြည့်ခြင်း" },
  "미압착": { ko: "미압착", en: "Uncompressed", vi: "Chưa ép chặt", th: "อัดไม่แน่น", id: "Kurang Tekan", my: "ဖိသိပ်မှု မပြည့်ခြင်း" },
  "기포": { ko: "기포", en: "Bubble / Void", vi: "Bọt khí", th: "ฟองอากาศ", id: "Gelembung Udara", my: "လေပူဖောင်းဖြစ်ခြင်း" },
  "치수불량": { ko: "치수불량", en: "Dimension Defect", vi: "Sai kích thước", th: "ขนาดไม่ได้มาตรฐาน", id: "Ukuran Tidak Sesuai", my: "အရွယ်အစား ချို့ယွင်းခြင်း" },
  "이물질": { ko: "이물질", en: "Foreign Matter", vi: "Dị vật", th: "สิ่งแปลกปลอม", id: "Benda Asing", my: "အညစ်အကြေး/ပြင်ပပစ္စည်း" },
  "스크래치": { ko: "스크래치", en: "Scratch", vi: "Trầy xước", th: "รอยขีดข่วน", id: "Goresan", my: "ခြစ်ရာဖြစ်ခြင်း" },
  "긁힘": { ko: "긁힘", en: "Scuff / Scratch", vi: "Cào xước", th: "รอยถลอก", id: "Lecet", my: "ပွန်းရာဖြစ်ခြင်း" },
  "변형": { ko: "변형", en: "Deformation / Warp", vi: "Biến dạng", th: "บิดเบี้ยว/เสียรูป", id: "Deformasi", my: "ပုံပျက်ခြင်း" },
  "수축": { ko: "수축", en: "Shrinkage", vi: "Co rút", th: "การหดตัว", id: "Penyusutan", my: "ကျုံ့ဝင်ခြင်း" },
  "크랙": { ko: "크랙", en: "Crack", vi: "Nứt vỡ", th: "รอยร้าว", id: "Retak", my: "အက်ကွဲခြင်း" },
  "플래시(바리)": { ko: "플래시(바리)", en: "Flash (Burr)", vi: "Bavia (Ba-via)", th: "ครีบส่วนเกิน (Burr)", id: "Burr", my: "အစွန်းထွက်စက်ရုပ်အကြွင်း" },
  "가스": { ko: "가스", en: "Gas Mark", vi: "Vết khí gas", th: "รอยก๊าซ", id: "Bekas Gas", my: "ဓာတ်ငွေ့အမှတ်အသား" },
  "탄화": { ko: "탄화", en: "Burn / Carbonization", vi: "Cháy khét", th: "ไหม้เกรียม", id: "Gosong", my: "မီးလောင်ကျွမ်းခြင်း" },
  "흑점": { ko: "흑점", en: "Black Speck", vi: "Đốm đen", th: "จุดดำ", id: "Bintik Hitam", my: "အမည်းစက်ဖြစ်ခြင်း" },
  "립컷팅": { ko: "립컷팅", en: "Lip Cutting Defect", vi: "Lỗi cắt viền (Lip)", th: "ตัดขอบบกพร่อง", id: "Cacat Potong Bibir", my: "နှုတ်ခမ်းသားဖြတ်တောက်မှု ချို့ယွင်းချက်" },
  "패드누락": { ko: "패드누락", en: "Missing Pad", vi: "Thiếu đệm lót (Pad)", th: "แผ่นรองหลุดหาย", id: "Pad Hilang", my: "အခံပြား မပါရှိခြင်း" },
  "단차": { ko: "단차", en: "Step / Misalignment", vi: "Lệch bậc (Độ chênh)", th: "ระดับไม่เท่ากัน", id: "Perbedaan Ketinggian", my: "အဆင့်မညီခြင်း" },
  "홀막힘": { ko: "홀막힘", en: "Clogged Hole", vi: "Tắc lỗ", th: "รูตัน", id: "Lubang Tersumbat", my: "အပေါက်ပိတ်ဆို့ခြင်း" },
  "탈락": { ko: "탈락", en: "Detachment / Fall off", vi: "Bong tróc / Rơi ra", th: "หลุดร่วง", id: "Terlepas", my: "ပြုတ်ကျခြင်း" },
  "오염": { ko: "오염", en: "Contamination / Stain", vi: "Bị ố / Nhiễm bẩn", th: "เปื้อน/ปนเปื้อน", id: "Terkontaminasi", my: "ညစ်ညမ်းခြင်း" },

  // --- 블록 1, 4, 5, 6, 7: 조인트 공정 ---
  "[블록 1] 조인트 작업자 / 시간 / 생산수량": {
    ko: "[블록 1] 조인트 작업자/시간/생산수량",
    en: "[Block 1] Joint Worker / Time / Output",
    vi: "[Khối 1] Công nhân / Giờ / Sản lượng Joint",
    th: "[บล็อก 1] คนงาน / เวลา / ผลผลิตต่อชิ้นงาน",
    id: "[Blok 1] Pekerja / Waktu / Output Sambungan",
    my: "[အကွက် ၁] ဆက်စပ်လုပ်သား / အချိန် / ထုတ်လုပ်မှု"
  },
  "[블록 4] 3. 조인트 재료 (Joint Material)": {
    ko: "[블록 4] 조인트 재료",
    en: "[Block 4] Joint Material",
    vi: "[Khối 4] Vật liệu nối (Joint)",
    th: "[บล็อก 4] วัสดุต่อเชื่อม",
    id: "[Blok 4] Bahan Sambungan",
    my: "[အကွက် ၄] ဆက်စပ်ကုန်ကြမ်း"
  },
  "조인트 재료명 (Joint grade name)": { ko: "조인트 재료명", en: "Joint Grade Name", vi: "Tên loại vật liệu Joint", th: "ชื่อเกรดวัสดุ", id: "Nama Grade Bahan", my: "ဆက်စပ်ကုန်ကြမ်း အဆင့်အမည်" },
  "조인트 재료일자 (Joint material lot no)": { ko: "조인트 재료 LOT", en: "Joint Material LOT", vi: "Số LOT vật liệu Joint", th: "LOT วัสดุต่อ", id: "No. LOT Bahan Sambungan", my: "ဆက်စပ်ကုန်ကြမ်း LOT နံပါတ်" },
  "[블록 5] 4. 사출온도 (Temperature)": {
    ko: "[블록 5] 사출온도",
    en: "[Block 5] Injection Temperature",
    vi: "[Khối 5] Nhiệt độ ép phun",
    th: "[บล็อก 5] อุณหภูมิการฉีด",
    id: "[Blok 5] Suhu Injeksi",
    my: "[အကွက် ၅] ပုံသွင်းအပူချိန်"
  },
  "사출온도": { ko: "사출온도", en: "Injection Temperature", vi: "Nhiệt độ ép phun", th: "อุณหภูมิการฉีด", id: "Suhu Injeksi", my: "ပုံသွင်းအပူချိန်" },
  "노즐(Nozzle)": { ko: "노즐(Nozzle)", en: "Nozzle", vi: "Đầu phun (Nozzle)", th: "หัวฉีด (Nozzle)", id: "Nozel (Nozzle)", my: "ခေါင်းထွက်ပေါက် (Nozzle)" },
  "실린더 1(N2)": { ko: "실린더 1(N2)", en: "Cylinder 1 (N2)", vi: "Xy lanh 1 (N2)", th: "กระบอกสูบ 1 (N2)", id: "Silinder 1 (N2)", my: "ဆလင်ဒါ ၁ (N2)" },
  "실린더 2(H3)": { ko: "실린더 2(H3)", en: "Cylinder 2 (H3)", vi: "Xy lanh 2 (H3)", th: "กระบอกสูบ 2 (H3)", id: "Silinder 2 (H3)", my: "ဆလင်ဒါ ၂ (H3)" },
  "실린더 3(H4)": { ko: "실린더 3(H4)", en: "Cylinder 3 (H4)", vi: "Xy lanh 3 (H4)", th: "กระบอกสูบ 3 (H4)", id: "Silinder 3 (H4)", my: "ဆလင်ဒါ ၃ (H4)" },
  "[블록 6] 5. 사출조건 (Injection Condition)": {
    ko: "[블록 6] 사출조건",
    en: "[Block 6] Injection Conditions",
    vi: "[Khối 6] Điều kiện ép phun",
    th: "[บล็อก 6] เงื่อนไขการฉีด",
    id: "[Blok 6] Kondisi Injeksi",
    my: "[အကွက် ၆] ပုံသွင်းသတ်မှတ်ချက်များ"
  },
  "사출조건": { ko: "사출조건", en: "Injection Conditions", vi: "Điều kiện ép phun", th: "เงื่อนไขการฉีด", id: "Kondisi Injeksi", my: "ပုံသွင်းသတ်မှတ်ချက်များ" },
  "[블록 7] 6. 공정불량 종합 매트릭스": {
    ko: "[블록 7] 공정불량 종합 매트릭스",
    en: "[Block 7] Process Defect Matrix",
    vi: "[Khối 7] Ma trận lỗi công đoạn",
    th: "[บล็อก 7] เมทริกซ์ของเสียในกระบวนการ",
    id: "[Blok 7] Matriks Cacat Proses",
    my: "[အကွက် ၇] လုပ်ငန်းစဉ် ချို့ယွင်းချက် မက်ထရစ်"
  },
  "폐기불량(Disposal) - 조인트작업시": {
    ko: "폐기불량(Disposal) - 조인트작업시",
    en: "Scrap / Disposal (During Joint)",
    vi: "Phế liệu bỏ (Khi làm Joint)",
    th: "ทิ้งเป็นเศษ (ขณะต่อเชื่อม)",
    id: "Bahan Dibuang (Saat Sambung)",
    my: "စွန့်ပစ်ပစ္စည်း (ဆက်စပ်စဉ်)"
  },
  "재조인트수량(Rework)": { ko: "재조인트수량(Rework)", en: "Re-joint Qty (Rework)", vi: "Số lượng nối lại (Rework)", th: "จำนวนต่อซ้ำ (Rework)", id: "Jumlah Sambung Ulang (Rework)", my: "ပြန်ဆက်သည့်ပမာဏ (Rework)" },
  "공정간불량(재조인트 불량포함)": { ko: "공정간불량(재조인트 불량포함)", en: "In-Process Defect (Incl. Re-joint)", vi: "Lỗi trong công đoạn (Gồm cả lỗi nối lại)", th: "ของเสียในกระบวนการ (รวมต่อซ้ำ)", id: "Cacat Antar Proses (Termasuk Sambung Ulang)", my: "လုပ်ငန်းစဉ်အတွင်း ချို့ယွင်းချက် (ပြန်ဆက်ချို့ယွင်းချက် အပါအဝင်)" },

  // --- 블록 12, 14, 17: 검사 공정 ---
  "[블록 12] 도면 치수 & 중요 검사 현황": {
    ko: "[블록 12] 도면 치수 & 검사 현황",
    en: "[Block 12] Drawing Specs & Inspection",
    vi: "[Khối 12] Kích thước bản vẽ & Kiểm tra",
    th: "[บล็อก 12] ขนาดตามแบบและการตรวจสอบ",
    id: "[Blok 12] Dimensi Gambar & Inspeksi",
    my: "[အကွက် ၁၂] ပုံဆွဲအတိုင်းအတာနှင့် စစ်ဆေးမှု"
  },
  "항 목": { ko: "항 목", en: "Item", vi: "Hạng mục", th: "รายการ", id: "Item", my: "အချက်အလက်" },
  "항목": { ko: "항목", en: "Item", vi: "Hạng mục", th: "รายการ", id: "Item", my: "အချက်အလက်" },
  "[블록 14] 완제품 직각검사 종합 매트릭스": {
    ko: "[블록 14] 완제품 직각검사 종합 매트릭스",
    en: "[Block 14] Finished Right-Angle Inspection Matrix",
    vi: "[Khối 14] Ma trận kiểm tra góc vuông thành phẩm",
    th: "[บล็อก 14] เมทริกซ์ตรวจมุมฉากสินค้าสำเร็จรูป",
    id: "[Blok 14] Matriks Inspeksi Siku Produk Jadi",
    my: "[အကွက် ၁၄] ထောင့်မှန်စစ်ဆေးမှု ပြီးပြည့်စုံသော မက်ထရစ်"
  },
  "제품수량": { ko: "제품수량", en: "Product Qty", vi: "Số lượng sản phẩm", th: "จำนวนผลิตภัณฑ์", id: "Jumlah Produk", my: "ထုတ်ကုန်ပမာဏ" },
  "검 사": { ko: "검 사", en: "Inspection", vi: "Kiểm tra", th: "ตรวจสอบ", id: "Pemeriksaan", my: "စစ်ဆေးမှု" },
  "검사": { ko: "검사", en: "Inspection", vi: "Kiểm tra", th: "ตรวจสอบ", id: "Pemeriksaan", my: "စစ်ဆေးမှု" },
  "공정불량(리워크)": { ko: "공정불량(리워크)", en: "Process Defect (Rework)", vi: "Lỗi công đoạn (Rework)", th: "ของเสียในกระบวนการ (Rework)", id: "Cacat Proses (Rework)", my: "လုပ်ငန်းစဉ် ချို့ယွင်းချက် (Rework)" },
  "완전불량(폐기)": { ko: "완전불량(폐기)", en: "Complete Defect (Scrap)", vi: "Hỏng hoàn toàn (Bỏ)", th: "เสียสมบูรณ์ (ทิ้ง)", id: "Cacat Total (Scrap)", my: "လုံးဝပျက်စီးမှု (စွန့်ပစ်)" },
  "압출불량": { ko: "압출불량", en: "Extrusion Defect", vi: "Lỗi đùn ép", th: "ของเสียจากการอัดรีด", id: "Cacat Ekstrusi", my: "အပူပေးပုံသွင်း ချို့ယွင်းချက်" },
  "후가공불량": { ko: "후가공불량", en: "Post-Processing Defect", vi: "Lỗi sau gia công", th: "ของเสียหลังการแปรรูป", id: "Cacat Pasca Pemrosesan", my: "နောက်ဆက်တွဲပြုပြင်မှု ချို့ယွင်းချက်" },
  "[블록 17] FRT 직각검사 불량 집계표": {
    ko: "[블록 17] FRT 직각검사 불량 집계표",
    en: "[Block 17] FRT Right-Angle Defect Summary",
    vi: "[Khối 17] Bảng tổng hợp lỗi góc vuông FRT",
    th: "[บล็อก 17] ตารางสรุปของเสียมุมฉาก FRT",
    id: "[Blok 17] Ringkasan Cacat Siku FRT",
    my: "[အကွက် ၁၇] FRT ထောင့်မှန်စစ်ဆေးမှု ချို့ယွင်းချက်စာရင်း"
  },
  "불량 항목 (Defect item)": { ko: "불량 항목 (Defect item)", en: "Defect Item", vi: "Mục lỗi (Defect item)", th: "รายการของเสีย (Defect item)", id: "Item Cacat (Defect item)", my: "ချို့ယွင်းချက်အချက်အလက် (Defect item)" },
  "합 계": { ko: "합 계", en: "Total", vi: "Tổng cộng", th: "รวม", id: "Total", my: "စုစုပေါင်း" },

  // --- 부자재 LOT 및 특기사항 ---
  "[블록 11] 부자재 LOT NO. (패드 5T)": {
    ko: "[블록 11] 부자재 LOT NO. (패드 5T)",
    en: "[Block 11] Sub-material LOT NO. (Pad 5T)",
    vi: "[Khối 11] Số LOT phụ liệu (Đệm 5T)",
    th: "[บล็อก 11] LOT NO. วัสดุรอง (แผ่นรอง 5T)",
    id: "[Blok 11] No. LOT Material Tambahan (Pad 5T)",
    my: "[အကွက် ၁၁] အရန်ပစ္စည်း LOT နံပါတ် (Pad 5T)"
  },
  "패드 5T 입고일자 및 LOT 번호 입력": {
    ko: "패드 5T 입고일자 및 LOT 번호 입력",
    en: "Enter Pad 5T date & LOT",
    vi: "Nhập ngày & số LOT đệm 5T",
    th: "กรอกวันที่และ LOT ของแผ่นรอง 5T",
    id: "Masukkan tanggal & LOT Pad 5T",
    my: "Pad 5T ရက်စွဲနှင့် LOT ထည့်ပါ"
  },
  "특기 사항 및 조치사항": {
    ko: "특기 사항 및 조치사항",
    en: "Remarks & Actions",
    vi: "Lưu ý & Biện pháp xử lý",
    th: "หมายเหตุและการปฏิบัติการ",
    id: "Catatan & Tindakan",
    my: "ထူးခြားချက်မှတ်ချက်နှင့် ဖြေရှင်းချက်"
  },
  "■ 특기 사항 (조치사항)": {
    ko: "■ 특기 사항 (조치사항)",
    en: "■ Remarks (Corrective Actions)",
    vi: "■ Lưu ý (Biện pháp xử lý)",
    th: "■ ข้อสังเกต (การแก้ไข)",
    id: "■ Catatan (Tindakan)",
    my: "■ အထူးမှတ်ချက် (ဖြေရှင်းချက်)"
  },
  "설비 이상, 원부자재 교체, 조치사항 등 입력": {
    ko: "설비 이상, 원부자재 교체, 조치사항 등 입력",
    en: "Enter machine abnormality, material replacement, actions taken, etc.",
    vi: "Nhập sự cố máy móc, thay thế nguyên vật liệu, biện pháp xử lý...",
    th: "กรอกความผิดปกติของเครื่องจักร การเปลี่ยนวัตถุดิบ การแก้ไข ฯลฯ",
    id: "Masukkan kerusakan mesin, penggantian bahan, tindakan yang diambil, dll.",
    my: "စက်ချို့ယွင်းမှု၊ ကုန်ကြမ်းလဲလှယ်မှု၊ ဖြေရှင်းချက်များကို ထည့်သွင်းပါ"
  },

  // --- 수명주기 블록 ---
  "칼날교체주기 관리 블록 (횟수설정 / 교체 리셋)": {
    ko: "칼날교체주기 관리 블록",
    en: "Blade Replacement Cycle Management",
    vi: "Quản lý chu kỳ thay lưỡi dao",
    th: "การจัดการรอบการเปลี่ยนใบมีด",
    id: "Manajemen Siklus Penggantian Pisau",
    my: "ဓားသွားလဲလှယ်ချိန် စီမံမှု အကွက်"
  },
  "금형숏트수관리 블록 (습합·검증완료 / 리셋)": {
    ko: "금형 숏트수 관리 블록",
    en: "Mold Shot Count Management",
    vi: "Quản lý số lần ép khuôn",
    th: "การจัดการจำนวนช็อตแม่พิมพ์",
    id: "Manajemen Jumlah Shot Cetakan",
    my: "ပုံစံခွက် အကြိမ်ရေ စီမံမှု အကွက်"
  },
  "비가동 및 부적합품 발생내역 (조치전·후 사진)": {
    ko: "비가동 및 부적합품 발생내역",
    en: "Downtime & Defect Log (Photos)",
    vi: "Nhật ký dừng máy & Hàng lỗi",
    th: "บันทึกเครื่องหยุดและของเสีย",
    id: "Riwayat Downtime & Produk Cacat",
    my: "စက်ရပ်နားမှုနှင့် ချို့ယွင်းချက် မှတ်တမ်း"
  },
  "비가동 및 부적합품 발생내역": {
    ko: "비가동 및 부적합품 발생내역",
    en: "Downtime & Defect Log",
    vi: "Nhật ký dừng máy & Hàng lỗi",
    th: "บันทึกเครื่องหยุดและของเสีย",
    id: "Riwayat Downtime & Produk Cacat",
    my: "စက်ရပ်နားမှုနှင့် ချို့ယွင်းချက် မှတ်တမ်း"
  },

  // --- 액션 버튼 ---
  "+ 단면 행 추가": { ko: "+ 단면 행 추가", en: "+ Add Section Row", vi: "+ Thêm dòng mặt cắt", th: "+ เพิ่มแถวหน้าตัด", id: "+ Tambah Baris Penampang", my: "+ အပိုင်းသစ် ထည့်မည်" },
  "+ 행 추가": { ko: "+ 행 추가", en: "+ Add Row", vi: "+ Thêm dòng", th: "+ เพิ่มแถว", id: "+ Tambah Baris", my: "+ အတန်းသစ် ထည့်မည်" },
  "+ 항목 추가": { ko: "+ 항목 추가", en: "+ Add Item", vi: "+ Thêm mục", th: "+ เพิ่มรายการ", id: "+ Tambah Item", my: "+ အချက်သစ် ထည့်မည်" },
  "+ 불량 항목 추가": { ko: "+ 불량 항목 추가", en: "+ Add Defect Item", vi: "+ Thêm lỗi mới", th: "+ เพิ่มรายการของเสีย", id: "+ Tambah Item Cacat", my: "+ ချို့ယွင်းချက်သစ် ထည့်မည်" },
  "+ 치수 행 추가": { ko: "+ 치수 행 추가", en: "+ Add Dimension Row", vi: "+ Thêm dòng kích thước", th: "+ เพิ่มแถวขนาด", id: "+ Tambah Baris Dimensi", my: "+ အတိုင်းအတာသစ် ထည့်မည်" },
  "+ 호기 라인 추가": { ko: "+ 호기 라인 추가", en: "+ Add Machine Line", vi: "+ Thêm dòng máy", th: "+ เพิ่มสายเครื่องจักร", id: "+ Tambah Jalur Mesin", my: "+ စက်လိုင်းသစ် ထည့်မည်" },
  "일보 삭제": { ko: "일보 삭제", en: "Delete Report", vi: "Xóa báo cáo", th: "ลบรายงาน", id: "Hapus Laporan", my: "မှတ်တမ်းဖျက်မည်" },
  "작업일보 공식 등록 (DB 저장)": {
    ko: "작업일보 공식 등록 (DB 저장)",
    en: "Save Work Report (DB)",
    vi: "Lưu báo cáo công việc (DB)",
    th: "บันทึกรายงานการทำงาน (DB)",
    id: "Simpan Laporan Kerja (DB)",
    my: "အလုပ်မှတ်တမ်း သိမ်းဆည်းမည် (DB)"
  },
  "💾 작업일보 기록 저장 (DB 등록)": {
    ko: "💾 작업일보 기록 저장 (DB 등록)",
    en: "💾 Save Work Log (DB)",
    vi: "💾 Lưu báo cáo công việc (DB)",
    th: "💾 บันทึกรายงานการทำงาน (DB)",
    id: "💾 Simpan Laporan Kerja (DB)",
    my: "💾 အလုပ်မှတ်တမ်း သိမ်းဆည်းမည် (DB)"
  },
  "데이터베이스 저장 중...": {
    ko: "데이터베이스 저장 중...",
    en: "Saving to database...",
    vi: "Đang lưu vào cơ sở dữ liệu...",
    th: "กำลังบันทึกลงฐานข้อมูล...",
    id: "Menyimpan ke database...",
    my: "ဒေတာဘေ့စ်တွင် သိမ်းဆည်းနေပါသည်..."
  },
  "💡 작성된 모든 치수 및 수량은 데이터베이스에 안전하게 영구 저장됩니다.": {
    ko: "💡 작성된 모든 치수 및 수량은 데이터베이스에 안전하게 영구 저장됩니다.",
    en: "💡 All entered dimensions and quantities are safely stored in the database.",
    vi: "💡 Mọi kích thước và số lượng đã nhập đều được lưu trữ an toàn trong cơ sở dữ liệu.",
    th: "💡 ขนาดและจำนวนทั้งหมดที่กรอกจะถูกบันทึกลงฐานข้อมูลอย่างปลอดภัย",
    id: "💡 Semua dimensi dan jumlah yang dimasukkan disimpan dengan aman di database.",
    my: "💡 ရေးသွင်းထားသော အတိုင်းအတာနှင့် ပမာဏအားလုံးကို ဒေတာဘေ့စ်တွင် လုံခြုံစွာ သိမ်းဆည်းထားပါသည်။"
  },
  "작성 중인 일보 불러옴": {
    ko: "작성 중인 일보 불러옴",
    en: "Draft Report Loaded",
    vi: "Đã tải báo cáo nháp",
    th: "โหลดฉบับร่างแล้ว",
    id: "Draf Laporan Dimuat",
    my: "ရေးလက်စမှတ်တမ်း ပြန်ဖွင့်ထားသည်"
  },
  "초·중·종물 이어서 입력 가능": {
    ko: "초·중·종물 이어서 입력 가능",
    en: "Continue Start/Half/Finish entries",
    vi: "Tiếp tục nhập Đầu/Giữa/Cuối",
    th: "กรอกต่อ แรก/กลาง/ท้าย",
    id: "Lanjutkan input Awal/Tengah/Akhir",
    my: "အစ/အလယ်/အဆုံး ဆက်လက်ရေးသွင်းနိုင်ပါသည်"
  },
  "개별 신규 일보 작성": {
    ko: "개별 신규 일보 작성",
    en: "New Individual Work Log",
    vi: "Tạo báo cáo cá nhân mới",
    th: "สร้างรายงานใหม่รายบุคคล",
    id: "Buat Laporan Baru Individu",
    my: "တစ်ဦးချင်း အလုပ်မှတ်တမ်းအသစ် ရေးသွင်းမည်"
  },
  "같은 공정이라도 작업자 개개인별로 독립된 일보가 기록되며, 초물·중물·종물 측정 시 하루 3회 이상 접속하여도 이전 측정값이 보존됩니다.": {
    ko: "같은 공정이라도 작업자 개개인별로 독립된 일보가 기록되며, 초물·중물·종물 측정 시 하루 3회 이상 접속하여도 이전 측정값이 보존됩니다.",
    en: "Individual reports are recorded independently for each worker. Previous Start/Half/Finish measurements are preserved when logging in multiple times a day.",
    vi: "Mỗi công nhân có báo cáo riêng biệt. Các số liệu đo Đầu ca, Giữa ca, Cuối ca sẽ được lưu giữ nguyên vẹn dù đăng nhập nhiều lần trong ngày.",
    th: "รายงานจะถูกบันทึกแยกรายบุคคล ค่าที่วัดได้ช่วงแรก/กลาง/ท้ายจะได้รับการเก็บรักษาไว้แม้จะเข้าสู่ระบบหลายครั้งต่อวัน",
    id: "Laporan dicatat secara independen untuk tiap pekerja. Data pengukuran Awal/Tengah/Akhir tetap tersimpan aman saat login berkali-kali.",
    my: "အလုပ်သမားတစ်ဦးချင်းစီအတွက် သီးခြားမှတ်တမ်းများ သိမ်းဆည်းပြီး တစ်နေ့လျှင် အကြိမ်ကြိမ် ဝင်ရောက်သော်လည်း အစ/အလယ်/အဆုံး တိုင်းတာမှုများကို သိမ်းဆည်းထားမည်ဖြစ်ပါသည်။"
  },
  "작업자:": { ko: "작업자:", en: "Worker:", vi: "Công nhân:", th: "พนักงาน:", id: "Pekerja:", my: "အလုပ်သမား:" },
  "부적합품 발생 등록 (조치전·후 사진)": {
    ko: "부적합품 발생 등록 (조치전·후 사진)",
    en: "Defect Report (Before/After Photos)",
    vi: "Đăng ký hàng lỗi (Ảnh trước/sau)",
    th: "บันทึกของเสีย (รูปก่อน/หลัง)",
    id: "Pendaftaran Cacat (Foto Sebelum/Sesudah)",
    my: "ချို့ယွင်းချက် မှတ်တမ်း (ဓာတ်ပုံ)"
  },
  "🚨 부적합품 발생 등록 (조치전·후 사진)": {
    ko: "🚨 부적합품 발생 등록 (조치전·후 사진)",
    en: "🚨 Defect Report (Before/After Photos)",
    vi: "🚨 Đăng ký hàng lỗi (Ảnh trước/sau)",
    th: "🚨 บันทึกของเสีย (รูปก่อน/หลัง)",
    id: "🚨 Pendaftaran Cacat (Foto)",
    my: "🚨 ချို့ယွင်းချက် မှတ်တမ်း (ဓာတ်ပုံ)"
  },
  "부적합품 발생 등록": { ko: "부적합품 발생 등록", en: "Register Defect", vi: "Đăng ký hàng lỗi", th: "ลงทะเบียนของเสีย", id: "Daftar Cacat", my: "ချို့ယွင်းချက် မှတ်ပုံတင်ရန်" },
  "부적합품 등록": { ko: "부적합품 등록", en: "Register Defect", vi: "Đăng ký hàng lỗi", th: "ลงทะเบียนของเสีย", id: "Daftar Cacat", my: "ချို့ယွင်းချက် မှတ်ပုံတင်ရန်" },
  "일반 비가동 등록": { ko: "일반 비가동 등록", en: "Register Downtime", vi: "Đăng ký dừng máy", th: "ลงทะเบียนเวลาหยุดทำงาน", id: "Daftar Downtime", my: "စက်ရပ်ချိန် မှတ်ပုံတင်ရန်" },
  "비가동 등록": { ko: "비가동 등록", en: "Register Downtime", vi: "Đăng ký dừng máy", th: "ลงทะเบียนเวลาหยุดทำงาน", id: "Daftar Downtime", my: "စက်ရပ်ချိန် မှတ်ပုံတင်ရန်" },
  "⏱️ 일반 비가동 등록": { ko: "⏱️ 일반 비가동 등록", en: "⏱️ Register Downtime", vi: "⏱️ Đăng ký dừng máy", th: "⏱️ บันทึกหยุดทำงาน", id: "⏱️ Daftar Downtime", my: "⏱️ စက်ရပ်ချိန် မှတ်တမ်း" },
  "부적합품 발생 시 조치 전 · 조치 후 사진을 함께 첨부하여 등록할 수 있습니다.": {
    ko: "부적합품 발생 시 조치 전 · 조치 후 사진을 함께 첨부하여 등록할 수 있습니다.",
    en: "When a defect occurs, attach before and after photos with the report.",
    vi: "Khi phát sinh hàng lỗi, có thể đính kèm ảnh trước và sau khi xử lý.",
    th: "เมื่อเกิดของเสีย สามารถแนบภาพก่อนและหลังแก้ไขเพื่อบันทึกได้",
    id: "Saat terjadi cacat, lampirkan foto sebelum dan sesudah tindakan.",
    my: "ချို့ယွင်းချက်ဖြစ်ပေါ်ပါက လုပ်ဆောင်မှု မတိုင်မီနှင့် ပြီးနောက် ဓာတ်ပုံများကို ပူးတွဲတင်ပြနိုင်ပါသည်။"
  },
  "부적합품/비가동 항목": { ko: "부적합품/비가동 항목", en: "Defect / Downtime Item", vi: "Mục lỗi / Dừng máy", th: "รายการของเสีย/หยุดงาน", id: "Item Cacat/Downtime", my: "ချို့ယွင်းချက်/စက်ရပ် ပစ္စည်း" },
  "시작 ~ 종료 시간": { ko: "시작 ~ 종료 시간", en: "Start ~ End Time", vi: "Thời gian bắt đầu ~ kết thúc", th: "เวลาเริ่ม ~ สิ้นสุด", id: "Waktu Mulai ~ Selesai", my: "စတင် ~ ပြီးဆုံးချိန်" },
  "소요시간 (분)": { ko: "소요시간 (분)", en: "Duration (min)", vi: "Thời gian (phút)", th: "เวลาที่ใช้ (นาที)", id: "Durasi (menit)", my: "ကြာချိန် (မိနစ်)" },
  "조치 전 (Before)": { ko: "조치 전 (Before)", en: "Before Action", vi: "Trước xử lý (Before)", th: "ก่อนดำเนินการ (Before)", id: "Sebelum (Before)", my: "မလုပ်ဆောင်မီ (Before)" },
  "조치 후 (After)": { ko: "조치 후 (After)", en: "After Action", vi: "Sau xử lý (After)", th: "หลังดำเนินการ (After)", id: "Sesudah (After)", my: "လုပ်ဆောင်ပြီးနောက် (After)" },
  "조치전": { ko: "조치전", en: "Before", vi: "Trước", th: "ก่อน", id: "Sebelum", my: "မလုပ်မီ" },
  "조치후": { ko: "조치후", en: "After", vi: "Sau", th: "หลัง", id: "Sesudah", my: "ပြီးနောက်" },
  "촬영/파일선택": { ko: "촬영/파일선택", en: "Camera / File", vi: "Chụp ảnh / Tệp", th: "กล้อง / เลือกไฟล์", id: "Kamera / File", my: "ဓာတ်ပုံရိုက် / ဖိုင်ရွေး" },
  "✓ 사진 첨부됨": { ko: "✓ 사진 첨부됨", en: "✓ Photo Attached", vi: "✓ Đã đính kèm ảnh", th: "✓ แนบรูปแล้ว", id: "✓ Foto Terlampir", my: "✓ ဓာတ်ပုံတွဲပြီး" },
  "부적합 현상 사진": { ko: "부적합 현상 사진", en: "Defect Photo", vi: "Ảnh hiện tượng lỗi", th: "รูปภาพของเสีย", id: "Foto Gejala Cacat", my: "ချို့ယွင်းချက် ဓာတ်ပုံ" },
  "개선 조치 완료 사진": { ko: "개선 조치 완료 사진", en: "Action Photo", vi: "Ảnh xử lý hoàn tất", th: "รูปแก้ไขแล้ว", id: "Foto Selesai Perbaikan", my: "ပြုပြင်ပြီး ဓာတ်ပုံ" },
  "부적합량(EA/kg)": { ko: "부적합량(EA/kg)", en: "Defect Qty (EA/kg)", vi: "SL lỗi (EA/kg)", th: "จน.ของเสีย (EA/กก.)", id: "Jumlah Cacat (EA/kg)", my: "ချို့ယွင်းချက် ပမာဏ (ခု/ကီလို)" },
  "폐기량/수량": { ko: "폐기량/수량", en: "Scrap / Defect Qty", vi: "SL phế phẩm / Hàng lỗi", th: "ปริมาณขยะ / จำนวน", id: "Jumlah Scrap / Cacat", my: "စွန့်ပစ် / ပမာဏ" },
  "발생 내역 및 조치 내용을 입력하세요 (직접 입력 또는 자동 문구 수정)": {
    ko: "발생 내역 및 조치 내용을 입력하세요 (직접 입력 또는 자동 문구 수정)",
    en: "Enter details and action taken (or edit text)",
    vi: "Nhập chi tiết lỗi và biện pháp xử lý",
    th: "กรอกรายละเอียดและมาตรการแก้ไข",
    id: "Masukkan rincian dan tindakan yang diambil",
    my: "ဖြစ်ပွားမှုအသေးစိတ်နှင့် ပြုပြင်မှုလုပ်ဆောင်ချက်များကို ရေးသွင်းပါ"
  },
  "기준 교체주기": { ko: "기준 교체주기", en: "Standard Replacement Cycle", vi: "Chu kỳ thay chuẩn", th: "รอบการเปลี่ยนมาตรฐาน", id: "Standar Siklus Ganti", my: "စံ ပြောင်းလဲမှု စက်ဝန်း" },
  "현재 누적 컷팅": { ko: "현재 누적 컷팅", en: "Current Cumulative Cuts", vi: "Tổng số lần cắt hiện tại", th: "ยอดตัดสะสมปัจจุบัน", id: "Total Pemotongan Saat Ini", my: "လက်ရှိ စုဆောင်းထားသော ဖြတ်တောက်မှုများ" },
  "잔여 컷팅 가능": { ko: "잔여 컷팅 가능", en: "Remaining Cuts", vi: "Số lần cắt còn lại", th: "การตัดที่เหลือ", id: "Sisa Pemotongan", my: "ကျန်ရှိသော ဖြတ်တောက်မှုများ" },
  "칼날 신품 교체 완료": { ko: "칼날 신품 교체 완료", en: "New Blade Replaced", vi: "Đã thay dao mới", th: "เปลี่ยนใบมีดใหม่แล้ว", id: "Ganti Pisau Baru Selesai", my: "ဓားအသစ် အစားထိုးပြီးပါပြီ" },
  "칼날 연마·교체 및 초물합격": { ko: "칼날 연마·교체 및 초물합격", en: "Blade Sharpened & Start Sample OK", vi: "Mài/thay dao & Đầu ca đạt", th: "ลับ/เปลี่ยนใบมีดและชิ้นแรกผ่าน", id: "Asah Pisau & Sampel Awal Lolos", my: "ဓားသွေး/အစားထိုးခြင်းနှင့် စတင်နမူနာ အောင်မြင်သည်" },
  "칼날 교체 & 0 리셋": { ko: "칼날 교체 & 0 리셋", en: "Replace Blade & Reset 0", vi: "Thay dao & Đặt lại 0", th: "เปลี่ยนใบมีด & รีเซ็ต 0", id: "Ganti Pisau & Reset 0", my: "ဓားအစားထိုး & 0 သို့ ပြန်လည်သတ်မှတ်" },
  "금형 숏트수 리셋": { ko: "금형 숏트수 리셋", en: "Reset Mold Shots", vi: "Đặt lại số lần dập khuôn", th: "รีเซ็ตช็อตแม่พิมพ์", id: "Reset Shot Cetakan", my: "မှိုရိုက်ချက် အရေအတွက်ကို ပြန်လည်သတ်မှတ်ပါ" },
  "습합 및 검증완료": { ko: "습합 및 검증완료", en: "Fitting & Verification OK", vi: "Khớp khuôn & Đã kiểm chứng", th: "ประกบแม่พิมพ์และตรวจสอบเรียบร้อย", id: "Fitting & Verifikasi Selesai", my: "မှိုတပ်ဆင်ခြင်းနှင့် အတည်ပြုခြင်း ပြီးပါပြီ" },
  "습합": { ko: "습합", en: "Mold Fitting", vi: "Khớp khuôn", th: "ประกบแม่พิมพ์", id: "Fitting Cetakan", my: "မှိုတပ်ဆင်ခြင်း" },
  "검증완료": { ko: "검증완료", en: "Verification OK", vi: "Đã kiểm chứng", th: "ตรวจสอบเสร็จสิ้น", id: "Verifikasi Selesai", my: "အတည်ပြုပြီးပါပြီ" },
  "교체 이력": { ko: "교체 이력", en: "Replacement History", vi: "Lịch sử thay", th: "ประวัติการเปลี่ยน", id: "Riwayat Penggantian", my: "အစားထိုး မှတ်တမ်း" },
  "정치절단 일보": { ko: "정치절단 일보", en: "Fixed Cutting Log", vi: "Nhật ký cắt định hình", th: "รายงานการตัดตามขนาด", id: "Laporan Pemotongan Presisi", my: "သတ်မှတ်အလျားဖြတ်တောက်မှု မှတ်တမ်း" },
  "단컷팅 일보": { ko: "단컷팅 일보", en: "End Cutting Log", vi: "Nhật ký cắt đoạn", th: "รายงานการตัดปลาย", id: "Laporan Pemotongan Ujung", my: "ထိပ်ဖျားဖြတ်တောက်မှု မှတ်တမ်း" },
  "소재 준비 작업 일보 (G/RUN)": { ko: "소재 준비 작업 일보 (G/RUN)", en: "Material Prep Work Log (G/RUN)", vi: "Nhật ký chuẩn bị vật liệu (G/RUN)", th: "รายงานเตรียมวัสดุ (G/RUN)", id: "Laporan Penyiapan Material (G/RUN)", my: "ပစ္စည်းပြင်ဆင်မှု မှတ်တမ်း (G/RUN)" },
  "조인트 일보 (G/RUN)": { ko: "조인트 일보 (G/RUN)", en: "Joint Work Log (G/RUN)", vi: "Nhật ký Joint (G/RUN)", th: "รายงานข้อต่อ Joint (G/RUN)", id: "Laporan Joint (G/RUN)", my: "အဆစ်ဆက်ခြင်း မှတ်တမ်း (G/RUN)" }
};

// 정규화된 룩업 인덱스 (공백·대소문자 무관 초고속 매칭)
const NORMALIZED_REPORT_DICTIONARY = {};
Object.keys(WORK_REPORT_DICTIONARY).forEach((k) => {
  const normKey = k.replace(/\s+/g, " ").trim().toLowerCase();
  NORMALIZED_REPORT_DICTIONARY[normKey] = WORK_REPORT_DICTIONARY[k];
});

// ============================================================================
// 🌍 용어 번역 조회 함수 (초고속 O(1) 매칭)
// langCode: "ko", "en", "vi", "th", "id", "my" 등
// ============================================================================
export const translateTerm = (term, lang = null) => {
  if (!term || typeof term !== "string") return term;
  const currentLang = lang || getCurrentWorkLogLanguage();
  if (currentLang === "ko") return term; // 한국어면 원본 그대로 반환

  const trimmed = term.trim();
  // 1. 정확한 키 직접 일치
  if (WORK_REPORT_DICTIONARY[trimmed]) {
    const entry = WORK_REPORT_DICTIONARY[trimmed];
    return entry[currentLang] || entry["en"] || trimmed;
  }

  // 2. 공백·대소문자 정규화 일치
  const norm = trimmed.replace(/\s+/g, " ").toLowerCase();
  if (NORMALIZED_REPORT_DICTIONARY[norm]) {
    const entry = NORMALIZED_REPORT_DICTIONARY[norm];
    return entry[currentLang] || entry["en"] || trimmed;
  }

  // 3. WORK_LOG_TRANSLATIONS 기본 사전 일치
  const fallback = getWorkLogText(trimmed, currentLang);
  if (fallback && fallback !== trimmed) {
    return fallback;
  }

  return term;
};

// ============================================================================
// 🔄 근로자 프로필/작업자 변경 시 해당 모국어로 언어 자동 동기화
// ============================================================================
export const syncWorkerLanguage = (workerOrProfile) => {
  try {
    const langInfo = getWorkerLanguageInfo(workerOrProfile);
    if (langInfo?.code) {
      return setWorkLogLanguage(langInfo.code);
    }
  } catch (e) {
    console.warn("syncWorkerLanguage error:", e);
  }
  return "ko";
};
