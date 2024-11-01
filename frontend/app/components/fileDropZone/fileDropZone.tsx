import styles from "./fileDropZone.module.css";

interface FileDropZoneProps {
  onFileSelect: (files: File[]) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}

export default function FileDropZone({
  onFileSelect,
  isDragging,
  setIsDragging,
}: FileDropZoneProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndAddFiles(selectedFiles);
  };

  const validateAndAddFiles = (files: File[]) => {
    const csvFiles = files.filter(
      (file) =>
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")
    );

    if (files.length !== csvFiles.length) {
      alert("Only CSV files are allowed");
    }

    onFileSelect(csvFiles);
  };

  return (
    <div
      className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        validateAndAddFiles(Array.from(e.dataTransfer.files));
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
  );
}
