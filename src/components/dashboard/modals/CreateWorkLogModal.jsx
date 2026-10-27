import { useState, useEffect } from "react";
import { getAssignedTemplateForWorker } from "../../../services/workReportTemplateService";
import LegoEmbeddedWorkReport from "./createWorkLog/LegoEmbeddedWorkReport";
import InjooWorkLogForm from "./createWorkLog/InjooWorkLogForm";
import JaeyulWorkLogForm from "./createWorkLog/JaeyulWorkLogForm";
import ExtrusionWorkLogForm from "./createWorkLog/ExtrusionWorkLogForm";
import QualityWorkLogForm from "./createWorkLog/QualityWorkLogForm";
import GeneralWorkLogForm from "./createWorkLog/GeneralWorkLogForm";

export default function CreateWorkLogModal({
  isModalOpen,
  setIsModalOpen,
  isInjoo,
  isJaeyul,
  isExtrusionWorker,
  isQualityWorker,
  isAdmin,
  isGeneralManager,
  logout,
  assignedProcess,
  formData,
  setFormData,
  handleSaveLog,
  isSavingLog,
  logSavedToast,
  formatAmount,
  currentProfile,
  workerFullName,
  workerPlant,
  officialTitle,
  workerDept,
  workerPosition,
  isProcessingImages,
  handleWorkLogImageFiles,
  handleRemoveWorkLogImage,
  previewImageModal,
  setPreviewImageModal,
  selectedMonth,
  currentYearMonth,
  availableMonths,
  DEFAULT_MONTH_LIST,
  // Excel / Injoo upload
  parsedResult,
  setParsedResult,
  uploadSuccess,
  setUploadSuccess,
  fileInputRef,
  handleExcelFile,
  handleDrag,
  handleDrop,
  dragActive,
  parsing,
  uploading,
  successMessage,
  handleConfirmExcelUpload,
  // Maintenance items
  maintenanceItems,
  handleAddMaintenanceItem,
  handleRemoveMaintenanceItem,
  handleUpdateMaintenanceItem,
  handleMaintenanceItemImageFiles,
  handleRemoveMaintenanceItemImage,
  // Quality files upload
  qualityFiles,
  setQualityFiles,
  qualityUploadSuccess,
  setQualityUploadSuccess,
  qualityFileInputRef,
  handleQualityFiles,
  handleQualityDrag,
  handleQualityDrop,
  qualityDragActive,
  qualityParsing,
  qualityUploading,
  qualitySuccessMessage,
  handleConfirmQualityUpload
}) {
  const [workLogMode, setWorkLogMode] = useState("STANDARD"); // "STANDARD" | "LEGO"
  const [assignedTemplateData, setAssignedTemplateData] = useState(null);

  useEffect(() => {
    const handleOpenLego = (e) => {
      setIsModalOpen(true);
      setWorkLogMode("LEGO");
      if (e?.detail?.template) {
        setAssignedTemplateData(e.detail.template);
      } else {
        const tpl = getAssignedTemplateForWorker({
          company: e?.detail?.company || "BURIMTECH",
          project: e?.detail?.project || "BURIMTECH"
        });
        if (tpl) setAssignedTemplateData(tpl);
      }
    };
    window.addEventListener("open-lego-work-report", handleOpenLego);
    return () => window.removeEventListener("open-lego-work-report", handleOpenLego);
  }, [setIsModalOpen]);

  // 🌟 부림텍 등 가공/협력업체 공정 작업자 진입 시 관리자가 지정한 5대 공정 양식 자동 로드
  useEffect(() => {
    if (isModalOpen) {
      const comp = String(formData?.company || currentProfile?.company || "").trim();
      const isBurim =
        comp.includes("부림") ||
        currentProfile?.name === "최현영" ||
        currentProfile?.name === "김동훈" ||
        String(currentProfile?.id || "").startsWith("hal_br");
      if (isBurim) {
        const tpl = getAssignedTemplateForWorker({
          company: "BURIMTECH",
          project: "BURIMTECH",
          processId: formData?.assignedProcess || "가공/협력업체"
        }) || getAssignedTemplateForWorker({
          company: "BURIMTECH",
          project: "BURIMTECH",
          processId: "STANDARD"
        });
        if (tpl) {
          setAssignedTemplateData(tpl);
          setWorkLogMode("LEGO");
        }
      }
    }
  }, [isModalOpen, formData?.company, formData?.assignedProcess, currentProfile]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto cursor-default">
      {workLogMode === "LEGO" ? (
        <LegoEmbeddedWorkReport
          setWorkLogMode={setWorkLogMode}
          assignedTemplateData={assignedTemplateData}
          setIsModalOpen={setIsModalOpen}
          workerFullName={workerFullName}
          formData={formData}
          handleSaveLog={handleSaveLog}
        />
      ) : isInjoo ? (
        <InjooWorkLogForm
          setIsModalOpen={setIsModalOpen}
          formData={formData}
          setFormData={setFormData}
          handleSaveLog={handleSaveLog}
          isSavingLog={isSavingLog}
          logSavedToast={logSavedToast}
          workerDept={workerDept}
          workerFullName={workerFullName}
          workerPosition={workerPosition}
          isProcessingImages={isProcessingImages}
          handleWorkLogImageFiles={handleWorkLogImageFiles}
          handleRemoveWorkLogImage={handleRemoveWorkLogImage}
          setPreviewImageModal={setPreviewImageModal}
          selectedMonth={selectedMonth}
          currentYearMonth={currentYearMonth}
          availableMonths={availableMonths}
          DEFAULT_MONTH_LIST={DEFAULT_MONTH_LIST}
          fileInputRef={fileInputRef}
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          handleExcelFile={handleExcelFile}
          parsing={parsing}
          parsedResult={parsedResult}
          setParsedResult={setParsedResult}
          setUploadSuccess={setUploadSuccess}
          formatAmount={formatAmount}
          uploadSuccess={uploadSuccess}
          successMessage={successMessage}
          uploading={uploading}
          handleConfirmExcelUpload={handleConfirmExcelUpload}
        />
      ) : isJaeyul ? (
        <JaeyulWorkLogForm
          setIsModalOpen={setIsModalOpen}
          formData={formData}
          setFormData={setFormData}
          handleSaveLog={handleSaveLog}
          logSavedToast={logSavedToast}
          workerPlant={workerPlant}
          workerFullName={workerFullName}
          officialTitle={officialTitle}
          logout={logout}
          maintenanceItems={maintenanceItems}
          handleAddMaintenanceItem={handleAddMaintenanceItem}
          handleRemoveMaintenanceItem={handleRemoveMaintenanceItem}
          handleUpdateMaintenanceItem={handleUpdateMaintenanceItem}
          handleMaintenanceItemImageFiles={handleMaintenanceItemImageFiles}
          handleRemoveMaintenanceItemImage={handleRemoveMaintenanceItemImage}
          setPreviewImageModal={setPreviewImageModal}
        />
      ) : isExtrusionWorker ? (
        <ExtrusionWorkLogForm
          setIsModalOpen={setIsModalOpen}
          workerPlant={workerPlant}
          workerFullName={workerFullName}
          officialTitle={officialTitle}
          assignedProcess={assignedProcess}
          logout={logout}
          formData={formData}
          setFormData={setFormData}
          workerDept={workerDept}
          workerPosition={workerPosition}
          handleSaveLog={handleSaveLog}
          isSavingLog={isSavingLog}
          logSavedToast={logSavedToast}
          isProcessingImages={isProcessingImages}
          handleWorkLogImageFiles={handleWorkLogImageFiles}
          handleRemoveWorkLogImage={handleRemoveWorkLogImage}
          setPreviewImageModal={setPreviewImageModal}
        />
      ) : isQualityWorker ? (
        <QualityWorkLogForm
          setIsModalOpen={setIsModalOpen}
          workerPlant={workerPlant}
          workerFullName={workerFullName}
          officialTitle={officialTitle}
          formData={formData}
          setFormData={setFormData}
          workerDept={workerDept}
          workerPosition={workerPosition}
          handleSaveLog={handleSaveLog}
          isSavingLog={isSavingLog}
          logSavedToast={logSavedToast}
          isProcessingImages={isProcessingImages}
          handleWorkLogImageFiles={handleWorkLogImageFiles}
          handleRemoveWorkLogImage={handleRemoveWorkLogImage}
          setPreviewImageModal={setPreviewImageModal}
          qualityFiles={qualityFiles}
          setQualityFiles={setQualityFiles}
          qualityUploadSuccess={qualityUploadSuccess}
          setQualityUploadSuccess={setQualityUploadSuccess}
          qualityFileInputRef={qualityFileInputRef}
          qualityDragActive={qualityDragActive}
          handleQualityDrag={handleQualityDrag}
          handleQualityDrop={handleQualityDrop}
          handleQualityFiles={handleQualityFiles}
          qualityParsing={qualityParsing}
          qualityUploading={qualityUploading}
          qualitySuccessMessage={qualitySuccessMessage}
          handleConfirmQualityUpload={handleConfirmQualityUpload}
        />
      ) : (
        <GeneralWorkLogForm
          setIsModalOpen={setIsModalOpen}
          setWorkLogMode={setWorkLogMode}
          handleSaveLog={handleSaveLog}
          isAdmin={isAdmin}
          isGeneralManager={isGeneralManager}
          formData={formData}
          setFormData={setFormData}
          workerPlant={workerPlant}
          workerDept={workerDept}
          workerFullName={workerFullName}
          workerPosition={workerPosition}
          assignedProcess={assignedProcess}
          isProcessingImages={isProcessingImages}
          handleWorkLogImageFiles={handleWorkLogImageFiles}
          handleRemoveWorkLogImage={handleRemoveWorkLogImage}
          setPreviewImageModal={setPreviewImageModal}
          isSavingLog={isSavingLog}
        />
      )}
    </div>
  );
}
