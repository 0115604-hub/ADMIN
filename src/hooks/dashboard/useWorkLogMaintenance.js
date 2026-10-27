import { useState } from "react";
import { compressImage } from "../../utils/imageCompressor";
import {
  JAEYUL_CATEGORY_EQUIPMENT_MAP,
  JAEYUL_EQUIPMENT_OPTIONS
} from "./workLogConstants.js";

export function useWorkLogMaintenance({
  setIsProcessingImages,
  setIsEditProcessingImages
}) {
  // Maintenance Items for Jaeyul (Write mode)
  const [maintenanceItems, setMaintenanceItems] = useState([
    {
      id: 1,
      category: "압출기",
      equipmentName: "PCM 1호",
      customEquipmentName: "",
      content: "",
      imagesBefore: [],
      imagesAfter: []
    }
  ]);

  // Maintenance Items for Jaeyul (Edit mode)
  const [editMaintenanceItems, setEditMaintenanceItems] = useState([]);

  // --- Write Mode Handlers ---
  const handleAddMaintenanceItem = () => {
    setMaintenanceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        category: "압출기",
        equipmentName: "PCM 1호",
        customEquipmentName: "",
        content: "",
        imagesBefore: [],
        imagesAfter: []
      }
    ]);
  };

  const handleRemoveMaintenanceItem = (id) => {
    if (maintenanceItems.length <= 1) {
      alert("최소 1개 이상의 설비보전 항목이 필요합니다.");
      return;
    }
    setMaintenanceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateMaintenanceItem = (id, field, value) => {
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          const defaultEquips = JAEYUL_CATEGORY_EQUIPMENT_MAP[value] || JAEYUL_EQUIPMENT_OPTIONS;
          return {
            ...item,
            category: value,
            equipmentName: defaultEquips[0] || "PCM 1호",
            customEquipmentName: ""
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleMaintenanceItemImageFiles = async (itemId, files, type = "before") => {
    if (!files || files.length === 0) return;
    const targetItem = maintenanceItems.find((it) => it.id === itemId);
    if (!targetItem) return;
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    const currentImgs = targetItem[key] || [];
    if (currentImgs.length >= 3) {
      alert(`${type === "before" ? "개선 전" : "개선 후"} 사진은 항목당 최대 3장까지 등록 가능합니다.`);
      return;
    }
    const remainingSlots = 3 - currentImgs.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    if (typeof setIsProcessingImages === "function") setIsProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setMaintenanceItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            [key]: [...(item[key] || []), ...processed].slice(0, 3)
          };
        })
      );
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      if (typeof setIsProcessingImages === "function") setIsProcessingImages(false);
    }
  };

  const handleRemoveMaintenanceItemImage = (itemId, imgIdx, type = "before") => {
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    setMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [key]: (item[key] || []).filter((_, i) => i !== imgIdx)
        };
      })
    );
  };

  // --- Edit Mode Handlers ---
  const handleAddEditMaintenanceItem = () => {
    setEditMaintenanceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        category: "압출기",
        equipmentName: "PCM 1호",
        customEquipmentName: "",
        content: "",
        imagesBefore: [],
        imagesAfter: []
      }
    ]);
  };

  const handleRemoveEditMaintenanceItem = (id) => {
    if (editMaintenanceItems.length <= 1) {
      alert("최소 1개 이상의 설비보전 항목이 필요합니다.");
      return;
    }
    setEditMaintenanceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateEditMaintenanceItem = (id, field, value) => {
    setEditMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          const defaultEquips = JAEYUL_CATEGORY_EQUIPMENT_MAP[value] || JAEYUL_EQUIPMENT_OPTIONS;
          return {
            ...item,
            category: value,
            equipmentName: defaultEquips[0] || "PCM 1호",
            customEquipmentName: ""
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleEditMaintenanceItemImageFiles = async (itemId, files, type = "before") => {
    if (!files || files.length === 0) return;
    const targetItem = editMaintenanceItems.find((it) => it.id === itemId);
    if (!targetItem) return;
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    const currentImgs = targetItem[key] || [];
    if (currentImgs.length >= 3) {
      alert(`${type === "before" ? "개선 전" : "개선 후"} 사진은 항목당 최대 3장까지 등록 가능합니다.`);
      return;
    }
    const remainingSlots = 3 - currentImgs.length;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (validFiles.length === 0) return;

    if (typeof setIsEditProcessingImages === "function") setIsEditProcessingImages(true);
    try {
      const processed = await Promise.all(validFiles.map((f) => compressImage(f)));
      setEditMaintenanceItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            [key]: [...(item[key] || []), ...processed].slice(0, 3)
          };
        })
      );
    } catch (err) {
      console.error("사진 처리 오류:", err);
      alert("사진을 불러오거나 압축하는 중 오류가 발생했습니다.");
    } finally {
      if (typeof setIsEditProcessingImages === "function") setIsEditProcessingImages(false);
    }
  };

  const handleRemoveEditMaintenanceItemImage = (itemId, imgIdx, type = "before") => {
    const key = type === "before" ? "imagesBefore" : "imagesAfter";
    setEditMaintenanceItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [key]: (item[key] || []).filter((_, i) => i !== imgIdx)
        };
      })
    );
  };

  return {
    maintenanceItems,
    setMaintenanceItems,
    editMaintenanceItems,
    setEditMaintenanceItems,
    handleAddMaintenanceItem,
    handleRemoveMaintenanceItem,
    handleUpdateMaintenanceItem,
    handleMaintenanceItemImageFiles,
    handleRemoveMaintenanceItemImage,
    handleAddEditMaintenanceItem,
    handleRemoveEditMaintenanceItem,
    handleUpdateEditMaintenanceItem,
    handleEditMaintenanceItemImageFiles,
    handleRemoveEditMaintenanceItemImage
  };
}

export default useWorkLogMaintenance;
