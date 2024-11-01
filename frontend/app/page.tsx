"use client";
import { useState, useEffect } from "react";
import styles from "./upload.module.css";
import dynamic from "next/dynamic";
import { FileData } from "./types/files";
import FileDropZone from "./components/fileDropZone/fileDropZone";
import FileList from "./components/fileList/fileList";
import UploadedFiles from "./components/uploadedFiles/uploadedFiles";
import { useFileUpload } from "./hooks/useFileUpload";

const PreviewModal = dynamic(
  () => import("./components/previewModal/previewModal"),
  {
    ssr: false,
  }
);

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [previewData, setPreviewData] = useState<{
    data: string;
    filename: string;
  } | null>(null);

  const {
    files,
    setFiles,
    uploading,
    failedUploads,
    activeUploads,
    handleRemoveFile,
    handleUpload,
    handleResumeUpload,
  } = useFileUpload();

  const fetchFiles = async () => {
    const response = await fetch("http://localhost:8000/files");
    const data = await response.json();
    setUploadedFiles(
      data.sort(
        (a: FileData, b: FileData) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
  };

  const handlePreview = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "text/csv",
          Accept: "text/csv, text/plain",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      setPreviewData({ data: text, filename });
    } catch (error) {
      console.error("Error fetching CSV:", error);
      alert("Failed to load the CSV file for preview");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadComplete = async () => {
    try {
      await handleUpload();
      await fetchFiles();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleResumeAndRefresh = async (fileId: string) => {
    try {
      await handleResumeUpload(fileId);
      await fetchFiles();
    } catch (error) {
      console.error("Resume upload failed:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <h1 className={styles.title}>Multi-File Upload System</h1>

          <FileDropZone
            onFileSelect={(newFiles) =>
              setFiles((prev) => [...prev, ...newFiles])
            }
            isDragging={isDragging}
            setIsDragging={setIsDragging}
          />

          {files.length > 0 && (
            <FileList
              files={files}
              uploading={uploading}
              failedUploads={failedUploads}
              activeUploads={activeUploads}
              onRemoveFile={handleRemoveFile}
              onResumeUpload={(file: File) => handleResumeAndRefresh(file.name)}
              onUploadComplete={handleUploadComplete}
            />
          )}

          <button
            onClick={handleUploadComplete}
            disabled={files.length === 0}
            className={`${styles.uploadButton} ${
              files.length === 0 ? styles.disabled : ""
            }`}
          >
            Upload Files
          </button>

          <UploadedFiles files={uploadedFiles} onPreview={handlePreview} />
        </div>
      </div>

      {previewData && (
        <PreviewModal
          data={previewData.data}
          filename={previewData.filename}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}
