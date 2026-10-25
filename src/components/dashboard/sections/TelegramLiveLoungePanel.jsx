import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import {
  Send,
  RefreshCw,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Minimize2,
  Maximize2,
  ArrowUpDown
} from "lucide-react";
import { db } from "../../../firebase";
import {
  getLocalTelegramConfig,
  sendTelegramMessage
} from "../../../services/telegramService";

const LOUNGE_STORAGE_KEY = "oryuk_live_chat_lounge_v1";
const LOUNGE_DELETED_KEY = "oryuk_live_chat_deleted_ids_v1";
const LOUNGE_DOC_PATH = ["system_config", "live_chat_lounge"];
const ORYUK_MAIN_CHAT_ID = "-1004367600406"; // 오륙 통합방 슈퍼그룹 ID (구 -4186792536에서 관리자 지정 시 자동 승격됨)
const ORYUK_LEGACY_CHAT_ID = "-4186792536";

const INITIAL_DEMO_MESSAGES = [
  {
    id: "msg_init_1",
    room: "all",
    author: "권태형 대표이사",
    authorRole: "대표이사",
    source: "telegram",
    text: "오늘 삼랑진 압출 2호기 금형교체 일정 및 한울·조영 잔업 투입 인원 확인해서 공유 바랍니다.",
    createdAt: "08:45",
    createdAtMs: 1700000001000,
    checkedBy: ["김동욱", "이명재"]
  },
  {
    id: "msg_init_2",
    room: "all",
    author: "이명재 이사",
    authorRole: "삼랑진총괄",
    source: "both",
    text: "네 대표님! 압출 2호기 10시 교체 완료 예정이며, 오늘 평일 잔업은 오륙 6명·조영 4명 확정되었습니다.",
    createdAt: "08:48",
    createdAtMs: 1700000002000,
    checkedBy: ["권태형"]
  },
  {
    id: "msg_init_3",
    room: "hal",
    author: "김동욱 책임",
    authorRole: "한림총괄",
    source: "app",
    text: "[한림] 조영·한울·부림텍 당일 근태 및 특근/잔업 인원 점검 완료했습니다.",
    createdAt: "08:52",
    createdAtMs: 1700000003000,
    checkedBy: []
  }
];

const getLocalDeletedIds = () => {
  try {
    const raw = localStorage.getItem(LOUNGE_DELETED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveLocalDeletedIds = (ids) => {
  try {
    localStorage.setItem(LOUNGE_DELETED_KEY, JSON.stringify(ids.slice(-200)));
  } catch (e) {}
};

const getLocalMessages = () => {
  try {
    const raw = localStorage.getItem(LOUNGE_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_DEMO_MESSAGES;
};

const saveLocalMessages = (list) => {
  try {
    localStorage.setItem(LOUNGE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
};

const getMessageSortTimeMs = (item, fallbackIdx = 0) => {
  if (!item) return 0;
  if (item.createdAtMs && Number(item.createdAtMs) > 1700000100000) {
    return Number(item.createdAtMs);
  }
  const idMatch = String(item.id || "").match(/^msg_(\d{13})/);
  if (idMatch) {
    return Number(idMatch[1]);
  }
  const timeMatch = String(item.createdAt || "").match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(timeMatch[1], 10),
      parseInt(timeMatch[2], 10),
      0,
      fallbackIdx
    );
    return d.getTime();
  }
  return (Number(item.createdAtMs) || 1700000000000) + fallbackIdx;
};

/**
 * 여러 메시지 배열을 ID 기준으로 무손실 병합 및 시간순 정렬
 */
const mergeMessageLists = (lists = [], deletedIds = []) => {
  const deletedSet = new Set(deletedIds || []);
  const map = new Map();

  lists.forEach((arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((item, idx) => {
      if (!item || !item.id || deletedSet.has(item.id)) return;
      const existing = map.get(item.id);
      const inferredMs = getMessageSortTimeMs(item, idx);
      if (!existing) {
        map.set(item.id, {
          ...item,
          createdAtMs: inferredMs,
          checkedBy: Array.isArray(item.checkedBy) ? item.checkedBy : []
        });
      } else {
        const nextChecked = Array.isArray(item.checkedBy)
          ? item.checkedBy
          : existing.checkedBy || [];
        map.set(item.id, {
          ...existing,
          ...item,
          createdAtMs: getMessageSortTimeMs(existing, idx) || inferredMs,
          checkedBy: nextChecked
        });
      }
    });
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => getMessageSortTimeMs(a) - getMessageSortTimeMs(b));
  return merged.slice(-150);
};

export const TelegramLiveLoungePanel = ({ currentProfile }) => {
  const [messages, setMessages] = useState(() => getLocalMessages());
  const [inputText, setInputText] = useState("");
  const [selectedSender, setSelectedSender] = useState(
    currentProfile?.name && currentProfile?.name !== "TEST"
      ? `${currentProfile.name}`.trim()
      : "권태형"
  );
  const [isSending, setIsSending] = useState(false);
  const [isSyncingTg, setIsSyncingTg] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' (과거➔최신 시간순) | 'desc' (최신➔과거)
  const [syncToast, setSyncToast] = useState("");
  const [botGroupAdminStatus, setBotGroupAdminStatus] = useState(null); // 'administrator' | 'member' | null
  const feedRef = useRef(null);
  const hasLoadedCloudRef = useRef(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const showToast = (msg) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(""), 3500);
  };

  // 무손실 저장 함수: 로컬 + 클라우드 기존 데이터를 먼저 병합한 뒤 저장
  const persistMessages = async (candidateList, options = {}) => {
    const addDeletedId = options.addDeletedId || null;
    const addDeletedIds = options.addDeletedIds || [];
    const explicitUpdateItem = options.explicitUpdateItem || null;
    const clearAll = Boolean(options.clearAll);

    const localDeleted = getLocalDeletedIds();
    const idsToAdd = [
      ...(addDeletedId ? [addDeletedId] : []),
      ...(Array.isArray(addDeletedIds) ? addDeletedIds : [])
    ];
    const nextDeleted = idsToAdd.length > 0
      ? Array.from(new Set([...localDeleted, ...idsToAdd]))
      : localDeleted;
    if (idsToAdd.length > 0) {
      saveLocalDeletedIds(nextDeleted);
    }

    const localCurrent = getLocalMessages();
    let immediateMerged = clearAll
      ? []
      : mergeMessageLists(
          [localCurrent, messagesRef.current, candidateList],
          nextDeleted
        );
    if (explicitUpdateItem && !clearAll) {
      immediateMerged = immediateMerged.map((m) =>
        m.id === explicitUpdateItem.id ? explicitUpdateItem : m
      );
    }

    setMessages(immediateMerged);
    messagesRef.current = immediateMerged;
    saveLocalMessages(immediateMerged);

    try {
      const ref = doc(db, ...LOUNGE_DOC_PATH);
      let cloudMessages = [];
      let cloudDeleted = [];

      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.messages)) cloudMessages = data.messages;
          if (Array.isArray(data?.deletedIds)) cloudDeleted = data.deletedIds;
        }
      } catch (readErr) {}

      const cloudIdsOnClear = clearAll ? cloudMessages.map((m) => m?.id).filter(Boolean) : [];
      const finalDeleted = Array.from(
        new Set([...cloudDeleted, ...nextDeleted, ...cloudIdsOnClear])
      ).slice(-200);
      saveLocalDeletedIds(finalDeleted);

      let finalMerged = clearAll
        ? []
        : mergeMessageLists(
            [cloudMessages, immediateMerged],
            finalDeleted
          );
      if (explicitUpdateItem && !clearAll) {
        finalMerged = finalMerged.map((m) =>
          m.id === explicitUpdateItem.id ? explicitUpdateItem : m
        );
      }

      setMessages(finalMerged);
      messagesRef.current = finalMerged;
      saveLocalMessages(finalMerged);

      await setDoc(
        ref,
        {
          messages: finalMerged,
          deletedIds: finalDeleted,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[LiveLounge] Firestore save warning:", e);
    }
  };

  // 1. Firestore 실시간 구독
  useEffect(() => {
    const ref = doc(db, ...LOUNGE_DOC_PATH);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        hasLoadedCloudRef.current = true;
        if (snap.exists()) {
          const data = snap.data();
          const cloudList = Array.isArray(data?.messages) ? data.messages : [];
          const cloudDeleted = Array.isArray(data?.deletedIds) ? data.deletedIds : [];
          const localDeleted = getLocalDeletedIds();
          const mergedDeleted = Array.from(new Set([...localDeleted, ...cloudDeleted])).slice(-200);
          saveLocalDeletedIds(mergedDeleted);

          const localList = getLocalMessages();
          const merged = mergeMessageLists([localList, cloudList], mergedDeleted);
          setMessages(merged);
          messagesRef.current = merged;
          saveLocalMessages(merged);

          const cloudIds = new Set(cloudList.map((m) => m.id));
          const hasUnsyncedLocal = merged.some(
            (m) => !cloudIds.has(m.id) && !String(m.id).startsWith("msg_init_")
          );
          if (hasUnsyncedLocal) {
            setDoc(
              ref,
              {
                messages: merged,
                deletedIds: mergedDeleted,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            ).catch(() => {});
          }
        }
      },
      (err) => {
        hasLoadedCloudRef.current = true;
        console.warn("[LiveLounge] Firestore subscribe error:", err);
      }
    );
    return () => unsub();
  }, []);

  // 새 메시지 도착 시 하단 스크롤
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length, isCollapsed]);

  // 2. 텔레그램 오륙 통합방 수신 메시지 동기화 (텔레그램 ➔ 앱)
  // ※ 주의: offset으로 즉시 큐를 삭제하지 않고 최근 30건을 안전 조회하여 타 기기/재접속 시에도 누락 방지
  const pollTelegramUpdates = async (manual = false) => {
    if (!manual && !hasLoadedCloudRef.current) return;

    const cfg = getLocalTelegramConfig();
    if (!cfg?.botToken) return;
    const rawCfgId = String(cfg.chatId || "").trim();
    const mainChatId =
      !rawCfgId || rawCfgId === ORYUK_LEGACY_CHAT_ID
        ? ORYUK_MAIN_CHAT_ID
        : rawCfgId;

    if (manual) setIsSyncingTg(true);

    try {
      // 오륙 통합방 봇 관리자 권한 상태 점검 (-1004367600406 슈퍼그룹 기준)
      if (manual || botGroupAdminStatus === null) {
        try {
          const botId = String(cfg.botToken).split(":")[0];
          const memberRes = await fetch(
            `https://api.telegram.org/bot${cfg.botToken}/getChatMember?chat_id=${mainChatId}&user_id=${botId}`,
            { cache: "no-store" }
          );
          const memberData = await memberRes.json();
          if (memberData?.ok && memberData?.result?.status) {
            setBotGroupAdminStatus(memberData.result.status);
          }
        } catch (e) {}
      }

      // offset으로 큐를 즉시 소거하지 않고 최근 업데이트를 조회 (메시지 유실 방지)
      const url = `https://api.telegram.org/bot${cfg.botToken}/getUpdates?offset=-30&limit=30`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!data?.ok || !Array.isArray(data.result)) {
        if (manual) showToast("✈️ 텔레그램 최신 상태입니다.");
        return;
      }

      const incoming = [];

      for (const upd of data.result) {
        const msg = upd.message || upd.edited_message || upd.channel_post;
        if (!msg || msg.from?.is_bot) continue;

        // 오륙 통합방(-1004367600406 및 구 -4186792536)에서 온 메시지만 수신 (경영총괄방 등 타 방 혼입 차단)
        const msgChatId = String(msg.chat?.id || "");
        const isOryukMainRoom =
          msgChatId === mainChatId ||
          msgChatId === ORYUK_MAIN_CHAT_ID ||
          msgChatId === ORYUK_LEGACY_CHAT_ID ||
          String(msg.chat?.title || "").includes("오륙 통합방");
        if (!isOryukMainRoom) continue;

        const textContent = (msg.text || msg.caption || "").trim();
        if (!textContent) continue;

        const tgMsgId = `tg_${msgChatId}_${msg.message_id}`;
        const senderName =
          [msg.from?.last_name, msg.from?.first_name].filter(Boolean).join("") ||
          msg.from?.username ||
          "텔레그램 사용자";
        const dateMs = msg.date ? msg.date * 1000 : Date.now();
        const dateObj = new Date(dateMs);
        const timeStr = dateObj.toTimeString().slice(0, 5);

        incoming.push({
          id: tgMsgId,
          room: "all",
          author: senderName,
          authorRole: "오륙 통합방",
          source: "telegram",
          text: textContent,
          createdAt: timeStr,
          createdAtMs: dateMs,
          checkedBy: []
        });
      }

      if (incoming.length > 0) {
        const deletedSet = new Set(getLocalDeletedIds());
        const currentList = messagesRef.current || getLocalMessages();
        const existingIds = new Set(currentList.map((m) => m.id));
        const newOnes = incoming.filter(
          (m) => !existingIds.has(m.id) && !deletedSet.has(m.id)
        );
        if (newOnes.length > 0) {
          await persistMessages([...currentList, ...newOnes]);
          showToast(`✈️ 오륙 통합방 새 메시지 ${newOnes.length}건 수신 완료!`);
        } else if (manual) {
          showToast("✈️ 오륙 통합방 동기화 완료 (모든 최신 메시지 반영됨)");
        }
      } else if (manual) {
        if (botGroupAdminStatus === "member") {
          showToast("💡 텔레그램에서 봇 메시지에 [답장]하거나 봇을 [방 관리자]로 지정하면 수신됩니다.");
        } else {
          showToast("✈️ 오륙 통합방 동기화 완료 (새 수신 메시지 없음)");
        }
      }
    } catch (e) {
      if (manual) showToast("⚠️ 텔레그램 수신 확인 중 일시적 네트워크 지연");
    } finally {
      if (manual) setIsSyncingTg(false);
    }
  };

  useEffect(() => {
    const initTimer = setTimeout(() => {
      pollTelegramUpdates(false);
    }, 1200);
    const timer = setInterval(() => {
      pollTelegramUpdates(false);
    }, 8000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, []);

  // 3. 메시지 전송 핸들러 (앱 + 오륙 통합방 단독 즉시 발송)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    const nowMs = Date.now();
    const nowStr = new Date(nowMs).toTimeString().slice(0, 5);

    const newMsg = {
      id: `msg_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      room: "all",
      author: selectedSender,
      authorRole: currentProfile?.plant || "현장소통",
      source: "both",
      text,
      createdAt: nowStr,
      createdAtMs: nowMs,
      checkedBy: []
    };

    setInputText("");
    const nextList = [...(messagesRef.current || messages), newMsg];
    await persistMessages(nextList);

    try {
      const baseCfg = getLocalTelegramConfig();
      const rawCfgId = String(baseCfg.chatId || "").trim();
      const mainChatId =
        !rawCfgId || rawCfgId === ORYUK_LEGACY_CHAT_ID
          ? ORYUK_MAIN_CHAT_ID
          : rawCfgId;
      const tgText = `<b>[${selectedSender}]</b> ${text}`;

      const res = await sendTelegramMessage(tgText, {
        ...baseCfg,
        enabled: true,
        chatId: mainChatId
      });
      if (res && res.success) {
        showToast("✈️ 오륙 통합방으로 전송 완료!");
      } else {
        showToast("⚠️ 텔레그램 발송 실패: " + (res?.error || res?.reason || "연결 확인 필요"));
      }
    } catch (err) {
      showToast("⚠️ 앱에는 등록되었으나 텔레그램 전송이 지연되었습니다.");
    }
    setIsSending(false);
  };

  // 4. 확인 체크 토글
  const handleToggleCheck = async (msgId) => {
    const checkerName = (selectedSender || "TEST").split(" ")[0];
    let updatedItem = null;
    const nextList = (messagesRef.current || messages).map((m) => {
      if (m.id !== msgId) return m;
      const list = Array.isArray(m.checkedBy) ? [...m.checkedBy] : [];
      const exists = list.includes(checkerName);
      const updatedChecked = exists
        ? list.filter((n) => n !== checkerName)
        : [...list, checkerName];
      updatedItem = { ...m, checkedBy: updatedChecked };
      return updatedItem;
    });
    await persistMessages(nextList, { explicitUpdateItem: updatedItem });
  };

  // 5. 개별 메시지 삭제
  const handleDeleteMessage = async (msgId) => {
    const nextList = (messagesRef.current || messages).filter((m) => m.id !== msgId);
    await persistMessages(nextList, { addDeletedId: msgId });
    showToast("🗑️ 메시지가 삭제되었습니다.");
  };

  // 6. 대화창 내용 전체 삭제
  const handleClearAllMessages = async () => {
    const currentList = messagesRef.current || messages || [];
    if (currentList.length === 0) {
      showToast("비울 대화 내용이 없습니다.");
      return;
    }
    if (!window.confirm("대화창의 모든 메시지 내용을 삭제하시겠습니까?")) return;

    const allIds = [
      ...currentList.map((m) => m.id),
      ...INITIAL_DEMO_MESSAGES.map((m) => m.id)
    ].filter(Boolean);

    await persistMessages([], { addDeletedIds: allIds, clearAll: true });
    showToast("🗑️ 대화창 내용이 모두 삭제되었습니다.");
  };

  // 시간대순 정렬된 표시 목록
  const sortedMessages = [...messages].sort((a, b) => {
    const diff = getMessageSortTimeMs(a) - getMessageSortTimeMs(b);
    return sortOrder === "asc" ? diff : -diff;
  });

  return (
    <div className="bg-slate-950 text-white border-2 border-cyan-500/50 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
      {/* Top Header Bar (현장소통방 헤더 + 시간순 정렬 + 내용삭제 + 수신동기화) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 px-3.5 sm:px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-black text-xs sm:text-sm text-white">
            ✈️ 현장소통방
          </span>
          {syncToast && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 animate-pulse">
              {syncToast}
            </span>
          )}
        </div>

        {/* Right Controls: Time Sort, Clear All, Sync & Collapse */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold cursor-pointer transition active:scale-95"
            title="대화창 메시지를 시간대순(과거➔최신 / 최신➔과거)으로 정렬합니다"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === "asc" ? "시간대순 ▲" : "최신순 ▼"}</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllMessages}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 text-xs font-bold cursor-pointer transition active:scale-95"
            title="대화창의 모든 내용을 전체 삭제합니다"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>내용삭제</span>
          </button>

          <button
            type="button"
            onClick={() => pollTelegramUpdates(true)}
            disabled={isSyncingTg}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold cursor-pointer transition active:scale-95"
            title="오륙 통합방 텔레그램의 최신 대화를 즉시 불러옵니다"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTg ? "animate-spin" : ""}`} />
            <span>수신동기화</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition"
            title={isCollapsed ? "소통창 펼치기" : "소통창 접기"}
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 텔레그램 단톡방 수신 안내 배너 (봇이 아직 일반 멤버일 때 1줄 안내) */}
      {!isCollapsed && botGroupAdminStatus === "member" && (
        <div className="bg-sky-950/60 border-b border-sky-800/60 px-3.5 py-1.5 text-[11px] text-sky-200 flex items-center justify-between gap-2 flex-wrap">
          <span>
            💡 <strong>텔레그램 ➔ 앱 수신 안내:</strong> 텔레그램 오륙 통합방에서 봇 메시지에 <strong>[답장(Reply)]</strong>으로 작성하시거나, 단톡방에서 <strong>[경영 알림 봇]을 관리자로 지정</strong>하시면 모든 일반 대화가 자동 수신됩니다.
          </span>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Chat Feed Area (간결한 1줄 인라인 메시지 표시) */}
          <div
            ref={feedRef}
            className="p-2 sm:p-2.5 space-y-1.5 max-h-[260px] overflow-y-auto bg-slate-950/90 custom-scrollbar"
          >
            {sortedMessages.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-bold">
                등록된 대화가 없습니다. 첫 메시지를 입력해 보세요!
              </div>
            ) : (
              sortedMessages.map((msg) => {
                const isMine =
                  msg.author === selectedSender ||
                  msg.author === "TEST 관리자" ||
                  msg.author?.startsWith((selectedSender || "").split(" ")[0]);
                const checkedList = Array.isArray(msg.checkedBy) ? msg.checkedBy : [];
                const isTelegramIn = msg.source === "telegram";
                const shortAuthor =
                  msg.author === "TEST 관리자"
                    ? "관리자"
                    : (msg.author || "현장").replace(/\s*(대표이사|이사|책임|담당자|현장관리|관리자)$/, "");

                return (
                  <div
                    key={msg.id}
                    className={`flex items-center ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs flex items-center justify-between gap-2 border ${
                        isMine
                          ? "bg-cyan-600/20 border-cyan-500/40 text-white"
                          : isTelegramIn
                          ? "bg-slate-900/95 border-sky-500/40 text-slate-100"
                          : "bg-slate-900/95 border-slate-700 text-slate-100"
                      }`}
                    >
                      {/* 발신자 + 본문 (1줄 간결 표시) */}
                      <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                        <span
                          className={`font-black shrink-0 ${
                            isTelegramIn
                              ? "text-sky-300"
                              : isMine
                              ? "text-cyan-300"
                              : "text-purple-300"
                          }`}
                          title={isTelegramIn ? "텔레그램 수신" : "현장소통방 발신"}
                        >
                          {isTelegramIn ? "✈️" : "💬"}{shortAuthor}:
                        </span>
                        <span className="text-left break-words leading-snug text-white font-medium">
                          {msg.text}
                        </span>
                      </div>

                      {/* 시간 + 간결한 확인/삭제 버튼 */}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.createdAt}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleCheck(msg.id)}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 ${
                            checkedList.length > 0
                              ? "bg-emerald-600 text-white font-black"
                              : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30"
                          }`}
                          title={
                            checkedList.length > 0
                              ? `확인자: ${checkedList.join(", ")}`
                              : "확인 체크"
                          }
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {checkedList.length > 0 && <span>{checkedList.length}</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Input Bar (방 선택 드롭다운 제거 & 오륙 통합방 직결) */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            {/* Sender Selector */}
            <select
              value={selectedSender}
              onChange={(e) => setSelectedSender(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer shrink-0"
              title="발신자 선택"
            >
              <option value="권태형">👤 권태형</option>
              <option value="이명재">👤 이명재 (삼랑진)</option>
              <option value="김동욱">👤 김동욱 (한림)</option>
              <option value="오륙">👤 오륙</option>
              <option value="유성">👤 유성</option>
              <option value="조영">👤 조영</option>
              <option value="한울">👤 한울</option>
              <option value="부림텍">👤 부림텍</option>
              <option value="관리자">👤 관리자</option>
            </select>

            {/* Message Input */}
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="메시지 입력 (엔터 시 오륙 통합방으로 즉시 전송)..."
                className="w-full px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder:text-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs shrink-0 transition cursor-pointer shadow-md flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>전송</span>
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default TelegramLiveLoungePanel;
