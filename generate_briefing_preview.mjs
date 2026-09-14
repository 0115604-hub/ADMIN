import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/firebase.js";

async function main() {
  const todayStr = "2026-09-14";
  
  // 1. Leaves
  let leaves = [];
  try {
    const leavesSnap = await getDocs(collection(db, "annual_leaves"));
    leavesSnap.forEach(d => leaves.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("Leaves read err:", e.message);
  }

  const activeLeaves = leaves.filter((l) => {
    if (!l.startDate) return false;
    const start = l.startDate;
    const end = l.endDate || l.startDate;
    return start <= todayStr && todayStr <= end;
  });
  const samLeaves = activeLeaves.filter((l) => !l.plant?.includes("한림"));
  const hanLeaves = activeLeaves.filter((l) => l.plant?.includes("한림"));

  const samStr = samLeaves.length > 0
    ? samLeaves.map((l) => `${l.userName} ${l.title || "선임"}(${l.leaveType || "연차"})`).join(", ")
    : "전원 정상 출근";
  const hanStr = hanLeaves.length > 0
    ? hanLeaves.map((l) => `${l.userName} ${l.title || "선임"}(${l.leaveType || "연차"})`).join(", ")
    : "전원 정상 출근";

  // 2. Approvals
  let apps = [];
  try {
    const appSnap = await getDocs(collection(db, "approval_docs"));
    appSnap.forEach(d => apps.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("App docs read err:", e.message);
  }
  const pendingDocs = apps.filter((d) => d.status === "IN_PROGRESS" || d.status === "HOLD");

  let approvalDocLines = "• 없음 (전건 결재완료)";
  if (pendingDocs.length > 0) {
    const lines = pendingDocs.slice(0, 5).map((d) => {
      const nextApprover = d.approvers?.find((a) => a.status === "PENDING")?.name || "결재자";
      return `• ${d.title} (기안: ${d.drafter || "작성자"} ➜ 결재대기: ${nextApprover})`;
    });
    const more = pendingDocs.length > 5 ? `\n• 외 ${pendingDocs.length - 5}건` : "";
    approvalDocLines = lines.join("\n") + more;
  }

  // 3. Work logs
  let works = [];
  try {
    const workSnap = await getDocs(collection(db, "work_logs"));
    workSnap.forEach(d => works.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("Work logs read err:", e.message);
  }
  const pendingLogs = works.filter((l) => l.approvalStatus !== "결재완료" && l.approvalStatus !== "반려");

  let workLogLines = "• 없음 (전건 승인완료)";
  if (pendingLogs.length > 0) {
    const lines = pendingLogs.slice(0, 5).map((l) => {
      const plantShort = l.plant?.includes("한림") ? "한림" : "삼랑진";
      return `• ${plantShort} ${l.writer || "작업자"} (${l.process || "생산"}일지 ➜ 결재대기: ${l.approverName || "관리자"})`;
    });
    const more = pendingLogs.length > 5 ? `\n• 외 ${pendingLogs.length - 5}건` : "";
    workLogLines = lines.join("\n") + more;
  }

  // 4. Urgent Issues
  let urgentIssues = [];
  try {
    const urgentSnap = await getDocs(collection(db, "urgent_issues"));
    urgentSnap.forEach(d => urgentIssues.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("Urgent issues read err:", e.message);
  }

  const activeOpenIssues = urgentIssues.filter(
    (i) => !i.isDeleted && !i.isResolved && (i.category === "오픈이슈" || i.category === "open_issue")
  );
  let openIssueLines = "• 진행중인 오픈이슈 없음";
  if (activeOpenIssues.length > 0) {
    const oLines = activeOpenIssues.map((o) => {
      const d = o.expireDate || o.targetDate || "";
      const dText = d ? `(~${d.slice(5)}) ` : "";
      const replyCount = o.replies?.length || 0;
      const replyBadge = replyCount > 0 ? ` [의견 ${replyCount}건]` : "";
      return `• [오픈이슈] ${dText}${o.title || o.content} (${o.plant?.replace("공장", "") || "삼랑진"})${replyBadge}`;
    });
    openIssueLines = oLines.slice(0, 5).join("\n");
    if (oLines.length > 5) {
      openIssueLines += `\n• 외 ${oLines.length - 5}건`;
    }
  }

  // 5. Meetings & Notices
  const upcomingMeetings = urgentIssues.filter((i) => !i.isDeleted && i.category === "회의일정" && (i.expireDate || i.targetDate || i.createdAt?.slice(0, 10)) >= todayStr);
  const activeNotices = urgentIssues.filter((i) => !i.isDeleted && (i.category === "공지사항" || i.category === "사내공지" || i.category === "공유사항") && (!i.expireDate || i.expireDate >= todayStr));

  let noticeMeetingLines = "• 예정된 회의 및 공지사항 없음";
  const combined = [];
  upcomingMeetings.forEach((m) => {
    const d = m.expireDate || m.targetDate || "";
    const t = m.meetingTime ? ` ${m.meetingTime}` : "";
    const dText = d ? `${d.slice(5)}${t} ` : "";
    combined.push(`• [회의] ${dText}${m.title || m.content} (${m.plant?.replace("공장", "") || "삼랑진"})`);
  });
  activeNotices.forEach((n) => {
    const d = n.expireDate || n.targetDate || "";
    const dText = d ? `~${d.slice(5)} ` : "";
    combined.push(`• [공지] ${dText}${n.title || n.content}`);
  });

  if (combined.length > 0) {
    noticeMeetingLines = combined.slice(0, 5).join("\n");
    if (combined.length > 5) {
      noticeMeetingLines += `\n• 외 ${combined.length - 5}건`;
    }
  }

  const dateFormatted = "2026-09-14 (월) 07:30";

  const message = `
⬛ [오륙 생산관리] 일일 모닝 브리핑
${dateFormatted} 기준
━━━━━━━━━━━━━━━━━━━━━
👥 [1] 금일 근태 / 휴가 현황
• 삼랑진: ${samStr}
• 한림: ${hanStr}

📑 [2] 전일 전자결재 미결 ${pendingDocs.length > 0 ? `(${pendingDocs.length}건)` : ""}
${approvalDocLines}

📝 [3] 전일 업무일지 미결 ${pendingLogs.length > 0 ? `(${pendingLogs.length}건)` : ""}
${workLogLines}

📌 [4] 진행중인 오픈이슈 ${activeOpenIssues.length > 0 ? `(${activeOpenIssues.length}건)` : ""}
${openIssueLines}

📅 [5] 회의 & 사내공지
${noticeMeetingLines}
━━━━━━━━━━━━━━━━━━━━━
※ 미결된 결재 및 일지는 금일 오전 중 확인 부탁드립니다.
생산관리시스템: https://profit-and-loss-7d09b.web.app
`.trim();

  console.log("=== BRIEFING PREVIEW ===");
  console.log(message);
  process.exit(0);
}

main().catch(err => {
  console.error("Main error:", err);
  process.exit(1);
});
