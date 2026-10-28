import { useState, useEffect } from "react";

/**
 * useHanulLotMeasurements
 * 한울 작업일보의 다중 LOT 엔트리, 실측값(measurements), 부자재 LOT 상태 관리 서브 훅
 */
export const useHanulLotMeasurements = ({
  isOpen,
  editReport,
  processId
}) => {
  const [cuttingPart, setCuttingPart] = useState("FRT");
  const [cuttingLot, setCuttingLot] = useState({
    FRT: {
      a: { start: "", mid: "", end: "" },
      b: { start: "", mid: "", end: "" },
      c: { start: "", mid: "", end: "" }
    },
    RR: {
      a: { start: "", mid: "", end: "" },
      b: { start: "", mid: "", end: "" }
    }
  });

  const [jointGradeName, setJointGradeName] = useState("W60664$OS");
  const [jointGradeLot, setJointGradeLot] = useState("");
  const [subMaterialsLot, setSubMaterialsLot] = useState({
    glass: { start: "", mid: "", end: "" },
    dv: { start: "", mid: "", end: "" },
    bracket: { start: "", mid: "", end: "" }
  });

  const [padLot, setPadLot] = useState("");
  const [dvInspLot, setDvInspLot] = useState({ start: "", mid: "", end: "" });
  const [rrExtLot, setRrExtLot] = useState({
    a: { start: "", mid: "", end: "" },
    b: { start: "", mid: "", end: "" }
  });

  // Lot tracking
  const [materialLot, setMaterialLot] = useState({ start: "", mid: "", end: "" });
  const [jointLot, setJointLot] = useState("");
  const [clipLot, setClipLot] = useState({ start: "", mid: "", end: "" });
  const [dollyNo, setDollyNo] = useState("");
  const [extTimeRange, setExtTimeRange] = useState({ start: "", end: "" });

  const [lotEntries, setLotEntries] = useState(() => [
    {
      id: "lot_1",
      lotNo: "",
      subLotNo: "",
      measurements: {}
    }
  ]);
  const [measurements, setMeasurements] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    if (editReport) {
      if (editReport.cuttingPart) setCuttingPart(editReport.cuttingPart);
      if (editReport.cuttingLot) setCuttingLot(editReport.cuttingLot);
      if (editReport.jointGradeName) setJointGradeName(editReport.jointGradeName);
      if (editReport.jointGradeLot) setJointGradeLot(editReport.jointGradeLot);
      if (editReport.subMaterialsLot) setSubMaterialsLot(editReport.subMaterialsLot);
      if (editReport.padLot) setPadLot(editReport.padLot);
      if (editReport.dvInspLot) setDvInspLot(editReport.dvInspLot);
      if (editReport.rrExtLot) setRrExtLot(editReport.rrExtLot);
      if (editReport.materialLot) setMaterialLot(editReport.materialLot);
      if (editReport.jointLot) setJointLot(editReport.jointLot);
      if (editReport.clipLot) setClipLot(editReport.clipLot);
      if (editReport.dollyNo) setDollyNo(editReport.dollyNo);
      if (editReport.extTimeRange) setExtTimeRange(editReport.extTimeRange);
      if (editReport.measurements) setMeasurements(editReport.measurements);

      if (Array.isArray(editReport.lotEntries) && editReport.lotEntries.length > 0) {
        setLotEntries(editReport.lotEntries);
      } else {
        const initialLotNo =
          editReport.materialLot?.start ||
          (typeof editReport.materialLot === "string" ? editReport.materialLot : "") ||
          Object.values(editReport.measurements || {}).map((m) => m?.lot).filter(Boolean)[0] ||
          "";
        setLotEntries([
          {
            id: "lot_1",
            lotNo: initialLotNo,
            subLotNo: editReport.jointLot || editReport.padLot || editReport.jointGradeLot || "",
            measurements: editReport.measurements || {}
          }
        ]);
      }
    } else {
      setCuttingPart("FRT");
      setCuttingLot({
        FRT: {
          a: { start: "", mid: "", end: "" },
          b: { start: "", mid: "", end: "" },
          c: { start: "", mid: "", end: "" }
        },
        RR: {
          a: { start: "", mid: "", end: "" },
          b: { start: "", mid: "", end: "" }
        }
      });
      setPadLot("");
      setDvInspLot({ start: "", mid: "", end: "" });
      setRrExtLot({
        a: { start: "", mid: "", end: "" },
        b: { start: "", mid: "", end: "" }
      });
      setMaterialLot({ start: "", mid: "", end: "" });
      setJointLot("");
      setClipLot({ start: "", mid: "", end: "" });
      setDollyNo("");
      setExtTimeRange({ start: "", end: "" });
      setLotEntries([
        {
          id: "lot_1",
          lotNo: "",
          subLotNo: "",
          measurements: {}
        }
      ]);
      setMeasurements({});
    }
  }, [isOpen, editReport]);

  const handleAddLot = () => {
    const nextIdx = lotEntries.length + 1;
    const newId = `lot_${Date.now()}_${nextIdx}`;
    setLotEntries((prev) => [
      ...prev,
      {
        id: newId,
        lotNo: "",
        subLotNo: "",
        measurements: {}
      }
    ]);
  };

  const handleRemoveLot = (idToRemove) => {
    setLotEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleUpdateLotField = (lotId, field, val) => {
    setLotEntries((prev) =>
      prev.map((item) => (item.id === lotId ? { ...item, [field]: val } : item))
    );
    if (lotEntries[0]?.id === lotId) {
      if (field === "lotNo") {
        setMaterialLot((prev) => ({ ...prev, start: val }));
      } else if (field === "subLotNo") {
        if (processId === "조인트") setJointLot(val);
        if (processId === "검사") setPadLot(val);
      }
    }
  };

  const handleUpdateLotMeasurement = (lotId, specKey, timing, val) => {
    setLotEntries((prev) =>
      prev.map((item) => {
        if (item.id !== lotId) return item;
        const prevMeas = item.measurements || {};
        const curSpec = prevMeas[specKey] || {};
        return {
          ...item,
          measurements: {
            ...prevMeas,
            [specKey]: {
              ...curSpec,
              [timing]: val
            }
          }
        };
      })
    );
    if (lotEntries[0]?.id === lotId) {
      setMeasurements((prev) => ({
        ...prev,
        [specKey]: {
          ...(prev[specKey] || {}),
          [timing]: val
        }
      }));
    }
  };

  return {
    cuttingPart,
    setCuttingPart,
    cuttingLot,
    setCuttingLot,
    jointGradeName,
    setJointGradeName,
    jointGradeLot,
    setJointGradeLot,
    subMaterialsLot,
    setSubMaterialsLot,
    padLot,
    setPadLot,
    dvInspLot,
    setDvInspLot,
    rrExtLot,
    setRrExtLot,
    materialLot,
    setMaterialLot,
    jointLot,
    setJointLot,
    clipLot,
    setClipLot,
    dollyNo,
    setDollyNo,
    extTimeRange,
    setExtTimeRange,
    lotEntries,
    setLotEntries,
    measurements,
    setMeasurements,
    handleAddLot,
    handleRemoveLot,
    handleUpdateLotField,
    handleUpdateLotMeasurement
  };
};
