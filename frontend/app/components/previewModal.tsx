"use client";

import Papa from "papaparse";
import { useEffect, useState } from "react";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg w-[90vw] h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{filename}</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {parsedData[0]?.map((header, index) => (
                  <th
                    key={index}
                    className="border px-4 py-2 sticky top-0 bg-gray-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
