// ============================================================================
// 🌐 제조현장 작업일보 다국어(11개국어) 번역 서비스 (Work Log Multi-Language i18n Service)
// 지원 언어: 한국어, 영어, 베트남어, 필리핀(타갈로그), 태국어, 스리랑카(싱할라), 우즈베크어,
//          인도네시아어, 네팔어, 캄보디아(크메르), 몽골어
// ============================================================================

export const SUPPORTED_LANGUAGES = [
  { code: "ko", name: "한국어", nativeName: "한국어", flag: "🇰🇷", country: "대한민국" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", country: "United States" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", country: "Việt Nam" },
  { code: "tl", name: "Filipino", nativeName: "Tagalog", flag: "🇵🇭", country: "Philippines" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭", country: "Thailand" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰", country: "Sri Lanka" },
  { code: "uz", name: "Uzbek", nativeName: "O'zbekcha", flag: "🇺🇿", country: "Uzbekistan" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", country: "Indonesia" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵", country: "Nepal" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭", country: "Cambodia" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол", flag: "🇲🇳", country: "Mongolia" }
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
    mn: "Хаах"
  }
};

const LOCAL_STORAGE_LANG_KEY = "factory_worker_language_v1";

// 현재 언어 가져오기 (기본값: 'ko')
export const getCurrentWorkLogLanguage = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    }
  } catch (e) {
    console.warn("Failed to get current work log language:", e);
  }
  return "ko";
};

// 언어 변경 및 저장
export const setWorkLogLanguage = (langCode) => {
  try {
    const valid = SUPPORTED_LANGUAGES.some((l) => l.code === langCode);
    const target = valid ? langCode : "ko";
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, target);
      window.dispatchEvent(new CustomEvent("factory_language_changed", { detail: { lang: target } }));
    }
    return target;
  } catch (e) {
    console.warn("Failed to set work log language:", e);
    return "ko";
  }
};

// 번역 텍스트 조회 헬퍼
export const getWorkLogText = (key, lang = null) => {
  const currentLang = lang || getCurrentWorkLogLanguage();
  const entry = WORK_LOG_TRANSLATIONS[key];
  if (!entry) return key;
  return entry[currentLang] || entry["ko"] || entry["en"] || key;
};
