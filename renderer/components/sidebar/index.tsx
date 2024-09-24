"use client";
import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  batchModeAtom,
  compressionAtom,
  dontShowCloudModalAtom,
  noImageProcessingAtom,
  savedOutputPathAtom,
  overwriteAtom,
  progressAtom,
  scaleAtom,
  customWidthAtom,
  useCustomWidthAtom,
  tileSizeAtom,
  showSidebarAtom,
} from "../../atoms/userSettingsAtom";
import useLog from "../../components/hooks/useLog";
import {
  BatchUpscaylPayload,
  DoubleUpscaylPayload,
  ImageUpscaylPayload,
} from "@common/types/types";
import { newsAtom, showNewsModalAtom } from "@/atoms/newsAtom";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/icons/Logo";
import { translationAtom } from "@/atoms/translations-atom";
import LeftPaneImageSteps from "../upscayl-tab/config/LeftPaneImageSteps";
import SettingsTab from "../settings-tab";
import Footer from "../Footer";
import { NewsModal } from "../NewsModal";
import Tabs from "../Tabs";
import Header from "../Header";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { logAtom } from "@/atoms/logAtom";
import ELECTRON_COMMANDS from "@common/commands";
import useUpscaylVersion from "../hooks/use-upscayl-version";

const Sidebar = ({
  setUpscaledImagePath,
  batchFolderPath,
  setUpscaledBatchFolderPath,
  dimensions,
  imagePath,
  selectImageHandler,
  selectFolderHandler,
}: {
  setUpscaledImagePath: React.Dispatch<React.SetStateAction<string>>;
  batchFolderPath: string;
  setUpscaledBatchFolderPath: React.Dispatch<React.SetStateAction<string>>;
  dimensions: {
    width: number | null;
    height: number | null;
  };
  imagePath: string;
  selectImageHandler: () => Promise<void>;
  selectFolderHandler: () => Promise<void>;
}) => {
  const t = useAtomValue(translationAtom);
  const { logit } = useLog();
  const { toast } = useToast();
  const version = useUpscaylVersion();

  // LOCAL STATES
  // TODO: Add electron handler for os
  const [os, setOs] = useState<"linux" | "mac" | "win" | undefined>(undefined);
  const [model, setModel] = useState("realesrgan-x4plus");
  const [doubleUpscayl, setDoubleUpscayl] = useState(false);
  const overwrite = useAtomValue(overwriteAtom);
  const [gpuId, setGpuId] = useState("");
  const [saveImageAs, setSaveImageAs] = useState("png");

  const [selectedTab, setSelectedTab] = useState(0);
  const [showCloudModal, setShowCloudModal] = useState(false);

  // ATOMIC STATES
  const outputPath = useAtomValue(savedOutputPathAtom);
  const [compression, setCompression] = useAtom(compressionAtom);
  const setProgress = useSetAtom(progressAtom);
  const [batchMode, setBatchMode] = useAtom(batchModeAtom);
  const logData = useAtomValue(logAtom);
  const [scale] = useAtom(scaleAtom);
  const setDontShowCloudModal = useSetAtom(dontShowCloudModalAtom);
  const noImageProcessing = useAtomValue(noImageProcessingAtom);
  const [news, setNews] = useAtom(newsAtom);
  const [showNewsModal, setShowNewsModal] = useAtom(showNewsModalAtom);
  const customWidth = useAtomValue(customWidthAtom);
  const useCustomWidth = useAtomValue(useCustomWidthAtom);
  const tileSize = useAtomValue(tileSizeAtom);
  const [showSidebar, setShowSidebar] = useAtom(showSidebarAtom);

  const handleModelChange = (e: any) => {
    setModel(e.value);
    logit("🔀 Model changed: ", e.value);
    localStorage.setItem(
      "model",
      JSON.stringify({ label: e.label, value: e.value }),
    );
  };

  const upscaylHandler = async () => {
    logit("🔄 Resetting Upscaled Image Path");
    setUpscaledImagePath("");
    setUpscaledBatchFolderPath("");
    if (imagePath !== "" || batchFolderPath !== "") {
      setProgress(t("APP.PROGRESS.WAIT_TITLE"));
      // Double Upscayl
      if (doubleUpscayl) {
        window.electron.send<DoubleUpscaylPayload>(
          ELECTRON_COMMANDS.DOUBLE_UPSCAYL,
          {
            imagePath,
            outputPath,
            model,
            gpuId: gpuId.length === 0 ? null : gpuId,
            saveImageAs,
            scale,
            noImageProcessing,
            compression: compression.toString(),
            customWidth: customWidth > 0 ? customWidth.toString() : null,
            useCustomWidth,
            tileSize,
          },
        );
        logit("🏁 DOUBLE_UPSCAYL");
      } else if (batchMode) {
        // Batch Upscayl
        setDoubleUpscayl(false);
        window.electron.send<BatchUpscaylPayload>(
          ELECTRON_COMMANDS.FOLDER_UPSCAYL,
          {
            batchFolderPath,
            outputPath,
            model,
            gpuId: gpuId.length === 0 ? null : gpuId,
            saveImageAs,
            scale,
            noImageProcessing,
            compression: compression.toString(),
            customWidth: customWidth > 0 ? customWidth.toString() : null,
            useCustomWidth,
            tileSize,
          },
        );
        logit("🏁 FOLDER_UPSCAYL");
      } else {
        // Single Image Upscayl
        window.electron.send<ImageUpscaylPayload>(ELECTRON_COMMANDS.UPSCAYL, {
          imagePath,
          outputPath,
          model,
          gpuId: gpuId.length === 0 ? null : gpuId,
          saveImageAs,
          scale,
          overwrite,
          noImageProcessing,
          compression: compression.toString(),
          customWidth: customWidth > 0 ? customWidth.toString() : null,
          useCustomWidth,
          tileSize,
        });
        logit("🏁 UPSCAYL");
      }
    } else {
      toast({
        title: t("ERRORS.NO_IMAGE_ERROR.TITLE"),
        description: t("ERRORS.NO_IMAGE_ERROR.DESCRIPTION"),
      });
      logit("🚫 No valid image selected");
    }
  };

  return (
    <>
      {/* TOP LOGO WHEN SIDEBAR IS HIDDEN */}
      {!showSidebar && (
        <div className="fixed right-2 top-2 z-50 flex items-center justify-center gap-2 rounded-[7px] bg-base-300 px-2 py-1 font-medium text-base-content ">
          <Logo className="w-5" />
          {t("TITLE")}
        </div>
      )}

      {/* SIDEBAR BUTTON */}
      <button
        className={cn(
          "fixed left-0 top-1/2 z-[999] -translate-y-1/2 rounded-r-full bg-base-100 p-4 ",
          showSidebar ? "hidden" : "",
        )}
        onClick={() => setShowSidebar((prev) => !prev)}
      >
        <ChevronRightIcon />
      </button>

      {/* LEFT PANE */}
      <div
        className={`relative flex h-screen min-w-[350px] max-w-[350px] flex-col bg-base-100 ${showSidebar ? "" : "hidden"}`}
      >
        <button
          className="absolute -right-0 top-1/2 z-[999] -translate-y-1/2 translate-x-1/2 rounded-full bg-base-100 p-4"
          onClick={() => setShowSidebar((prev) => !prev)}
        >
          <ChevronLeftIcon />
        </button>

        {/* MACOS TITLEBAR */}
        {window.electron.platform === "mac" && (
          <div className="mac-titlebar pt-8"></div>
        )}
        {/* HEADER */}
        <Header version={version} />

        {/* NEWS DIALOG */}
        <NewsModal
          show={showNewsModal}
          setShow={(val: boolean) => {
            setShowNewsModal(val);
            setNews((prev) => ({ ...prev, seen: true }));
          }}
          news={news}
        />

        <Tabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

        {selectedTab === 0 && (
          <LeftPaneImageSteps
            selectImageHandler={selectImageHandler}
            selectFolderHandler={selectFolderHandler}
            handleModelChange={handleModelChange}
            upscaylHandler={upscaylHandler}
            batchMode={batchMode}
            setBatchMode={setBatchMode}
            imagePath={imagePath}
            doubleUpscayl={doubleUpscayl}
            setDoubleUpscayl={setDoubleUpscayl}
            dimensions={dimensions}
            setGpuId={setGpuId}
            model={model}
            setModel={setModel}
            setSaveImageAs={setSaveImageAs}
          />
        )}

        {selectedTab === 1 && (
          <SettingsTab
            batchMode={batchMode}
            setModel={setModel}
            compression={compression}
            setCompression={setCompression}
            gpuId={gpuId}
            setGpuId={setGpuId}
            saveImageAs={saveImageAs}
            setSaveImageAs={setSaveImageAs}
            logData={logData}
            os={os}
            show={showCloudModal}
            setShow={setShowCloudModal}
            setDontShowCloudModal={setDontShowCloudModal}
          />
        )}
        {/* )} */}
        <Footer />
      </div>
    </>
  );
};

export default Sidebar;