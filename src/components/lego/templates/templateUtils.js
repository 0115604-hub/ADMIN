import { getLocalCustomLegoBlocks } from "../../../services/workReportTemplateService";
import { LEGO_BLOCK_SWITCH_CATALOG } from "../legoPresetData.js";

/**
 * Helper to resolve all catalog items (standard + custom blocks) for a template in exact assembled blockOrder
 */
export const getOrderedBlocksForTemplate = (tpl) => {
  const cfg = tpl?.legoConfig;
  if (!cfg) return [];
  const customMap = new Map();
  getLocalCustomLegoBlocks().forEach((cb) => {
    const k = cb.key || cb.id;
    if (k) customMap.set(k, cb);
  });
  if (Array.isArray(cfg.customBlocks)) {
    cfg.customBlocks.forEach((cb) => {
      const k = cb.key || cb.id;
      if (k) customMap.set(k, cb);
    });
  }
  if (cfg.customBlockTables && typeof cfg.customBlockTables === "object") {
    Object.entries(cfg.customBlockTables).forEach(([k, tbl]) => {
      if (!customMap.has(k)) {
        customMap.set(k, {
          id: k,
          key: k,
          label: `커스텀 블록 (${k})`,
          title: `커스텀 블록`,
          columns: tbl?.columns || [],
          rows: tbl?.rows || []
        });
      }
    });
  }
  const customItems = Array.from(customMap.values()).map((cb, idx) => ({
    key: cb.key || cb.id,
    label: cb.label || cb.title || `사진분석 블록 ${idx + 1}`,
    badge: cb.badge || `사진 ${18 + idx}`,
    isCustom: true,
    customData: cb
  }));
  const allCatalog = [...LEGO_BLOCK_SWITCH_CATALOG, ...customItems];
  const savedOrder = Array.isArray(cfg.blockOrder) ? cfg.blockOrder : [];
  const seen = new Set();
  const ordered = [];
  savedOrder.forEach((key) => {
    const found = allCatalog.find((b) => b.key === key);
    if (found && !seen.has(key)) {
      seen.add(key);
      ordered.push(found);
    }
  });
  allCatalog.forEach((b) => {
    if (!seen.has(b.key)) {
      seen.add(b.key);
      ordered.push(b);
    }
  });
  return ordered;
};
