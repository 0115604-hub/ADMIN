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

export { NORMALIZED_REPORT_DICTIONARY };
export default WORK_REPORT_DICTIONARY;
