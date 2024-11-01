import { useState } from "react";
import styles from "./fileList.module.css";

interface FileListProps {
  files: File[];
  uploading: Record<string, number>;
  failedUploads: Record<
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
  >;
  activeUploads: Record<string, boolean>;
  onRemoveFile: (file: File) => void;
  onResumeUpload: (file: File) => void;
  onUploadComplete: () => Promise<void>;
}

export default function FileList({
  files,
  uploading,
  failedUploads,
  activeUploads,
  onRemoveFile,
  onResumeUpload,
  onUploadComplete,
}: FileListProps) {
  return (
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
              {failedUploads[file.name] && !activeUploads[file.name] && (
                <button
                  onClick={() => onResumeUpload(file)}
                  className={styles.resumeButton}
                >
                  Resume
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => onRemoveFile(file)}
            className={styles.removeButton}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
