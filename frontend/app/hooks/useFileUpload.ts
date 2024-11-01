import { useState } from 'react';
import { FailedUpload } from '../types/files';

export function useFileUpload() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState<Record<string, number>>({});
    const [failedUploads, setFailedUploads] = useState<Record<string, FailedUpload>>({});
    const [activeUploads, setActiveUploads] = useState<Record<string, boolean>>({});

    const handleRemoveFile = (fileToRemove: File) => {
        setFiles((prev) => prev.filter((file) => file !== fileToRemove));
        setUploading((prev) => {
            const updated = { ...prev };
            delete updated[fileToRemove.name];
            return updated;
        });
    };

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

                        // Clear states for this file
                        setFailedUploads((prev) => {
                            const updated = { ...prev };
                            delete updated[file.name];
                            return updated;
                        });

                        setActiveUploads((prev) => {
                            const updated = { ...prev };
                            delete updated[file.name];
                            return updated;
                        });

                        setUploading((prev) => {
                            const updated = { ...prev };
                            delete updated[file.name];
                            return updated;
                        });

                        // Remove the file from the files list
                        setFiles((prev) => prev.filter(f => f !== file));

                    } catch (error) {
                        console.error(`Error uploading ${file.name}:`, error);
                        alert(`Failed to upload ${file.name}`);
                    }
                })
            );
        } catch (error) {
            console.error("Error during upload:", error);
        }
    };

    const handleResumeUpload = async (fileId: string | File) => {
        const fileName = typeof fileId === 'string' ? fileId : fileId.name;
        const resumeData = failedUploads[fileName];
        if (resumeData) {
            // Find the file object if fileId is a string
            const fileToResume = typeof fileId === 'string'
                ? files.find(f => f.name === fileId)
                : fileId;

            if (!fileToResume) return; // Exit if file not found

            setFailedUploads((prev) => {
                const updated = { ...prev };
                delete updated[fileName];
                return updated;
            });

            setActiveUploads((prev) => ({
                ...prev,
                [fileName]: true,
            }));

            handleUpload(fileToResume, {
                key: resumeData.key!,
                upload_id: resumeData.upload_id!,
                completedChunks: resumeData.completedChunks,
                urls: resumeData.urls,
                chunk_size: resumeData.chunk_size,
                etags: resumeData.etags,
            });
        }
    };

    return {
        files,
        setFiles,
        uploading,
        failedUploads,
        activeUploads,
        handleRemoveFile,
        handleUpload,
        handleResumeUpload,
    };
} 