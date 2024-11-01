export interface FileData {
    id: number;
    filename: string;
    url: string;
    created_at: string;
}

export interface UploadProgress {
    [key: string]: number;
}