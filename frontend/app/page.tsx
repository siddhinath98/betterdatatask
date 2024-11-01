"use client";
import { useState, useEffect } from "react";
import styles from "./upload.module.css";
import dynamic from "next/dynamic";
import { FileData } from "./types/files";
const PreviewModal = dynamic(() => import("./components/previewModal"), {
  ssr: false,
});

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [previewData, setPreviewData] = useState<{
    data: string;
    filename: string;
  } | null>(null);
  const [failedUploads, setFailedUploads] = useState<
    Record<
      string,
      {
        key?: string;
        upload_id?: string;
        urls: string[];
        chunk_size: number;
        completedChunks: number;
        totalChunks: number;
        etags?: string[];
      }
    >
  >({});
  const [activeUploads, setActiveUploads] = useState<Record<string, boolean>>(
    {}
  );

  //function to fetch files
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const csvFiles = selectedFiles.filter(
      (file) =>
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")
    );

    if (selectedFiles.length !== csvFiles.length) {
      alert("Only CSV files are allowed");
    }

    setFiles((prev) => [...prev, ...csvFiles]);
  };

  // Handle file removal
  const handleRemoveFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setUploading((prev) => {
      const updated = { ...prev };
      delete updated[fileToRemove.name];
      return updated;
    });
  };

  // Start the upload process
  const handleUpload = async (
    fileToResume?: File,
    resumeData?: {
      key: string;
      upload_id: string;
      completedChunks: number;
      urls: string[];
      chunk_size: number;
      etags?: string[];
    }
  ) => {
    const filesToProcess = fileToResume ? [fileToResume] : files;
    if (filesToProcess.length === 0) return alert("Please select files");

    // Mark files as actively uploading
    filesToProcess.forEach((file) => {
      setActiveUploads((prev) => ({
        ...prev,
        [file.name]: true,
      }));
    });

    try {
      await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            let key: string,
              upload_id: string,
              urls: string[],
              chunk_size: number;

            setUploading((prev) => ({
              ...prev,
              [file.name]: resumeData?.completedChunks
                ? Math.round(
                    (resumeData.completedChunks * 100) /
                      (file.size / chunk_size)
                  )
                : 0,
            }));

            if (!resumeData) {
              const startResponse = await fetch(
                "http://localhost:8000/start-upload",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    file_name: file.name,
                    content_type: file.type,
                    file_size: file.size,
                  }),
                }
              );

              const startData = await startResponse.json();
              ({ key, upload_id, urls, chunk_size } = startData);
            } else {
              // Use existing upload data for resume
              ({ key, upload_id, urls, chunk_size } = resumeData);
            }

            const etags = resumeData?.etags || [];
            const startChunk = resumeData?.completedChunks || 0;

            // Upload file chunks
            for (let i = startChunk; i < urls.length; i++) {
              try {
                const chunk = file.slice(i * chunk_size, (i + 1) * chunk_size);
                const uploadResponse = await fetch(urls[i], {
                  method: "PUT",
                  body: chunk,
                });

                if (!uploadResponse.ok) {
                  throw new Error(
                    `Failed to upload chunk ${i + 1} of ${file.name}`
                  );
                }

                const etag = uploadResponse.headers.get("ETag");
                if (etag) etags[i] = etag;

                setUploading((prev) => ({
                  ...prev,
                  [file.name]: Math.round(((i + 1) / urls.length) * 100),
                }));
              } catch (error) {
                // Store failed upload information
                setFailedUploads((prev) => ({
                  ...prev,
                  [file.name]: {
                    key,
                    upload_id,
                    urls,
                    chunk_size,
                    completedChunks: i,
                    totalChunks: urls.length,
                    etags,
                  },
                }));

                // Remove from active uploads
                setActiveUploads((prev) => {
                  const updated = { ...prev };
                  delete updated[file.name];
                  return updated;
                });

                console.error(`Error uploading ${file.name}:`, error);
                throw error;
              }
            }

            // Complete the upload
            const completeResponse = await fetch(
              "http://localhost:8000/complete-upload",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, upload_id, etags }),
              }
            );

            await completeResponse.json();

            // Clear failed upload state if successful
            setFailedUploads((prev) => {
              const updated = { ...prev };
              delete updated[file.name];
              return updated;
            });

            setTimeout(() => {
              handleRemoveFile(file);
            }, 1000);
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            alert(`Failed to upload ${file.name}`);
          }
        })
      );

      await fetchFiles();
    } catch (error) {
      console.error("Error during upload:", error);
    }
  };

  // Add resume handler
  const handleResumeUpload = (file: File) => {
    const resumeData = failedUploads[file.name];
    if (resumeData) {
      setFailedUploads((prev) => {
        const updated = { ...prev };
        delete updated[file.name];
        return updated;
      });

      setActiveUploads((prev) => ({
        ...prev,
        [file.name]: true,
      }));

      handleUpload(file, {
        key: resumeData.key!,
        upload_id: resumeData.upload_id!,
        completedChunks: resumeData.completedChunks,
        urls: resumeData.urls,
        chunk_size: resumeData.chunk_size,
        etags: resumeData.etags,
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Add the preview handler
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

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          <h1 className={styles.title}>Multi-File Upload System</h1>

          <div
            className={`${styles.dropZone} ${
              isDragging ? styles.dragging : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const droppedFiles = Array.from(e.dataTransfer.files || []);
              const csvFiles = droppedFiles.filter(
                (file) =>
                  file.type === "text/csv" ||
                  file.name.toLowerCase().endsWith(".csv")
              );

              if (droppedFiles.length !== csvFiles.length) {
                alert("Only CSV files are allowed");
              }

              setFiles((prev) => [...prev, ...csvFiles]);
            }}
          >
            <input
              type="file"
              onChange={handleFileChange}
              className={styles.fileInput}
              id="fileInput"
              multiple
              accept=".csv"
            />
            <label htmlFor="fileInput" className={styles.fileLabel}>
              <svg
                className={styles.uploadIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className={styles.dropText}>
                Drop your CSV files here, or click to select
              </span>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  {uploading[file.name] !== undefined && (
                    <div className={styles.fileProgress}>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${uploading[file.name]}%` }}
                        />
                      </div>
                      <span className={styles.progressPercentage}>
                        {uploading[file.name]}%
                      </span>
                      {failedUploads[file.name] &&
                        !activeUploads[file.name] && (
                          <button
                            onClick={() => handleResumeUpload(file)}
                            className={styles.resumeButton}
                          >
                            Resume
                          </button>
                        )}
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveFile(file)}
                    className={styles.removeButton}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => handleUpload()}
            disabled={files.length === 0}
            className={`${styles.uploadButton} ${
              files.length === 0 ? styles.disabled : ""
            }`}
          >
            Upload Files
          </button>

          {/* Uploaded Files */}
          <div className={styles.uploadedFilesSection}>
            <h2 className={styles.sectionTitle}>Uploaded Files</h2>
            <div className={styles.uploadedFilesGrid}>
              {uploadedFiles.map((file) => (
                <div key={file.id} className={styles.fileCard}>
                  <div className={styles.fileCardContent}>
                    <div className={styles.fileCardInfo}>
                      <h3 className={styles.fileCardTitle}>{file.filename}</h3>
                      <p className={styles.fileCardDate}>
                        {new Date(file.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className={styles.fileCardActions}>
                      <button
                        onClick={() => handlePreview(file.url, file.filename)}
                        className={styles.previewButton}
                      >
                        Preview
                      </button>
                      <a
                        href={file.url}
                        download={file.filename}
                        className={styles.downloadButton}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
