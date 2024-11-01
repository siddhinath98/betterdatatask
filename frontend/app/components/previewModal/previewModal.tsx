"use client";

import Papa from "papaparse";
import { useEffect, useState } from "react";
import styles from "./previewModal.module.css";

interface PreviewModalProps {
  data: string;
  onClose: () => void;
  filename: string;
}

export default function PreviewModal({
  data,
  onClose,
  filename,
}: PreviewModalProps) {
  const [parsedData, setParsedData] = useState<string[][]>([]);

  useEffect(() => {
    const result = Papa.parse(data);
    setParsedData(result.data as string[][]);
  }, [data]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <div className={styles.content}>
          <h2 className="text-xl font-semibold">{filename}</h2>
          <div className="flex-1 overflow-auto">
            <table className={styles.table}>
              <tbody>
                {parsedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
