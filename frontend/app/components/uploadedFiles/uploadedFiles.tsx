import styles from "./uploadedFiles.module.css";
import { FileData } from "../../types/files";

interface UploadedFilesProps {
  files: FileData[];
  onPreview: (url: string, filename: string) => void;
}

export default function UploadedFiles({
  files,
  onPreview,
}: UploadedFilesProps) {
  return (
    <div className={styles.uploadedFilesSection}>
      <h2 className={styles.sectionTitle}>Uploaded Files</h2>
      <div className={styles.uploadedFilesGrid}>
        {files.map((file) => (
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
                  onClick={() => onPreview(file.url, file.filename)}
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
  );
}
