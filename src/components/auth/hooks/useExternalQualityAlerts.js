import { useState, useEffect, useMemo } from "react";
import {
  subscribeExtrusionQualityIssues,
  getLocalExtrusionQualityIssues
} from "../../../services/extrusionQualityIssueService";
import {
  subscribeHanulQualityIssues,
  getLocalHanulQualityIssues
} from "../../../services/hanulQualityIssueService";
import {
  subscribeYuseongQualityIssues,
  getLocalYuseongQualityIssues
} from "../../../services/yuseongQualityIssueService";
import {
  subscribeMachiningQualityIssues,
  getLocalMachiningQualityIssues
} from "../../../services/machiningQualityIssueService";
import { isLegacyDismissedQualityAlert } from "../../../services/urgentIssueService";
import { normalizeDateStr } from "./authIssueConstants";

/**
 * useExternalQualityAlerts
 * Manages subscriptions and unified data normalization for all 4 external manufacturing
 * plant / partner quality alerts:
 * 1. 압출 (Extrusion)
 * 2. 한울 / 조영 (Hanul / Joyoung)
 * 3. 유성 (Yuseong)
 * 4. 오륙 / 가공동 (Machining / Oryuk)
 */
export const useExternalQualityAlerts = ({ todayDateStr }) => {
  const [extrusionQualityAlerts, setExtrusionQualityAlerts] = useState(() => getLocalExtrusionQualityIssues());
  const [hanulQualityIssues, setHanulQualityIssues] = useState(() => getLocalHanulQualityIssues());
  const [yuseongQualityIssues, setYuseongQualityIssues] = useState(() => getLocalYuseongQualityIssues());
  const [machiningQualityIssues, setMachiningQualityIssues] = useState(() => getLocalMachiningQualityIssues());

  useEffect(() => {
    const unsubExt = subscribeExtrusionQualityIssues((alerts) => {
      setExtrusionQualityAlerts(alerts || []);
    });
    const unsubHanul = subscribeHanulQualityIssues((alerts) => {
      setHanulQualityIssues(alerts || []);
    });
    const unsubYs = subscribeYuseongQualityIssues((alerts) => {
      setYuseongQualityIssues(alerts || []);
    });
    const unsubMach = subscribeMachiningQualityIssues((alerts) => {
      setMachiningQualityIssues(alerts || []);
    });
    return () => {
      unsubExt();
      unsubHanul();
      unsubYs();
      unsubMach();
    };
  }, []);

  // 🌟 전 공정(압출, 한울, 유성, 가공동) 부적합경보 실시간 데이터 규격 통일
  const externalQualityAlerts = useMemo(() => {
    const list = [];

    // 1. 압출 부적합경보
    (extrusionQualityAlerts || []).forEach((alert) => {
      if (!alert || alert.id === "ext_qual_demo_1" || alert.id === "ext_qual_demo_2" || String(alert.id).startsWith("demo_")) return;
      if (alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) || isLegacyDismissedQualityAlert({ ...alert, category: "부적합경보" });
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `ext_q_${alert.id}`,
        rawId: alert.id,
        source: "extrusion",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || alert.lineId || "압출라인",
        author: alert.author || "설유철",
        authorTitle: alert.authorTitle || "책임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "압출 부적합경보",
        content: alert.content || alert.details || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || alert.actionGuide || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        origin: "EXTRUSION_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 2. 한울 / 조영 부적합경보 (첫화면 전사등록 뱃지 선택 건에 한하여 첫화면 노출)
    (hanulQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;
      if (alert.isFirstScreenBroadcast !== true) return;

      const dateStr = normalizeDateStr(alert.targetDate || alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) && !alert.isManuallyRestored;
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `hanul_q_${alert.id}`,
        rawId: alert.id,
        source: "hanul",
        category: "부적합경보",
        plant: alert.plant || "한림공장",
        line: alert.line || "가공/협력업체(한울)",
        author: alert.author || "한울 관리자",
        authorTitle: alert.authorTitle || "대표",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "한울 협력업체 부적합경보",
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        isFirstScreenBroadcast: true,
        origin: "HANUL_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 3. 유성 가공/협력업체 부적합경보
    (yuseongQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) || isLegacyDismissedQualityAlert({ ...alert, category: "부적합경보" });
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `ys_q_${alert.id}`,
        rawId: alert.id,
        source: "yuseong",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.project || alert.line || "가공/협력업체(유성)",
        author: alert.author || "유성 관리자",
        authorTitle: alert.authorTitle || "대표",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "유성 협력업체 부적합경보",
        content: alert.content || alert.description || alert.defectType || "",
        actionResult: alert.actionResult || alert.actionNotes || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        origin: "YUSEONG_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    // 4. 오륙 / 가공동 부적합경보 (첫화면 전사등록 뱃지 선택 건에 한하여 첫화면 노출)
    (machiningQualityIssues || []).forEach((alert) => {
      if (!alert || alert.isDeleted === true || alert.isDeleted === "true" || alert.deleted === true || alert.status === "DELETED") return;
      if (alert.isFirstScreenBroadcast !== true) return;

      const dateStr = normalizeDateStr(alert.date || alert.createdAt, todayDateStr);
      const isResolved = Boolean(alert.isResolved) || alert.status === "RESOLVED" || alert.status === "CLOSED" || alert.status === "DONE" || Boolean(alert.actionResult && alert.actionResult.trim());
      const closedByAdmin = Boolean(alert.isClosedByAdmin) && !alert.isManuallyRestored;
      const causeImages = Array.isArray(alert.causeImages) ? alert.causeImages : (Array.isArray(alert.images) ? alert.images : []);
      const actionImages = Array.isArray(alert.actionImages) ? alert.actionImages : [];

      list.push({
        id: `mach_q_${alert.id}`,
        rawId: alert.id,
        source: "machining",
        category: "부적합경보",
        plant: alert.plant || "삼랑진공장",
        line: alert.line || "가공라인",
        author: alert.author || "가공 관리자",
        authorTitle: alert.authorTitle || "책임",
        startDate: dateStr,
        expireDate: dateStr,
        date: dateStr,
        time: alert.time || (alert.createdAt && alert.createdAt.includes(":") ? alert.createdAt.slice(11, 16) : ""),
        title: alert.title || alert.defectType || "오륙 부적합경보",
        content: alert.content || alert.defectType || "",
        actionResult: alert.actionResult || "",
        actionAuthor: alert.actionAuthor || alert.author || "",
        actionImages: actionImages,
        images: causeImages,
        replies: Array.isArray(alert.replies) ? alert.replies : [],
        status: isResolved ? "RESOLVED" : (alert.status || "ACTIVE"),
        isResolved,
        isClosedByAdmin: closedByAdmin,
        deletedBy: alert.deletedBy || "",
        isDeleted: closedByAdmin,
        isFirstScreenOrigin: true,
        isFirstScreenBroadcast: true,
        origin: "MACHINING_QUALITY",
        createdAt: alert.createdAt || dateStr,
        raw: alert
      });
    });

    return list;
  }, [extrusionQualityAlerts, hanulQualityIssues, yuseongQualityIssues, machiningQualityIssues, todayDateStr]);

  return {
    extrusionQualityAlerts,
    setExtrusionQualityAlerts,
    hanulQualityIssues,
    setHanulQualityIssues,
    yuseongQualityIssues,
    setYuseongQualityIssues,
    machiningQualityIssues,
    setMachiningQualityIssues,
    externalQualityAlerts
  };
};
