export interface FileData {
    id: string;
    filename: string;
    url: string;
    created_at: string;
}

export interface FailedUpload {
    key?: string;
    upload_id?: string;
    urls: string[];
    chunk_size: number;
    completedChunks: number;
    totalChunks: number;
    etags?: string[];
}