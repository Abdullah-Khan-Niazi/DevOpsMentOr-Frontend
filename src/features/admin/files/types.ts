/** F8 §05 admin file-library contracts (OPS-43/44, SCR-F8-17). */

export interface AdminFileDto {
  fileId: number;
  fileName: string;
  filePath: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  storageType: 'local' | 's3' | 'azure' | 'gcs';
  isPublic: boolean;
  downloadsCount: number;
  uploadedBy: number;
  createdAt: string;
}

export interface AdminFileListDto {
  data: AdminFileDto[];
  total: number;
  page: number;
}
