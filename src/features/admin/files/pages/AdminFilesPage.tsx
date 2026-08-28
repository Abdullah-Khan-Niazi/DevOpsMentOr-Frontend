import '../styles/files-admin.css';
import { useRef, useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  EmptyState,
  LoadingState,
  PageHeader,
  Pagination,
  toast,
} from '@/shared/components';
import { useAdminFiles } from '../hooks/useAdminFiles';
import { useFileDownload } from '@/features/operations';

// SCR-F8-17: platform file library — upload (multipart, 25 MB server limit)
// and browse files with public/private visibility. SCR-F8-08: each row has
// a download action resolving a signed URL via OPS-20.

const PAGE_SIZE = 25;

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminFilesPage() {
  const [page, setPage] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { query, upload } = useAdminFiles(page);
  const download = useFileDownload();

  const handleDownload = (fileId: number) => {
    download.mutate(fileId, {
      onSuccess: (result) => {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      },
      onError: () => toast.error('Could not resolve the download link.'),
    });
  };

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    upload.mutate(
      { file, isPublic },
      {
        onSuccess: () => {
          toast.success(`Uploaded ${file.name}.`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: () => toast.error('Could not upload the file.'),
      },
    );
  };

  return (
    <div className="files-admin-page">
      <PageHeader
        title="File library"
        description="Upload and manage platform files (course assets, syllabi, etc.)."
      />

      <Card className="files-admin-page__upload">
        <label className="files-admin-page__check">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          <span>Public (no entitlement required)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          className="files-admin-page__file-input"
          onChange={(event) => handleUpload(event.target.files?.[0])}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          isLoading={upload.isPending}
          disabled={upload.isPending}
        >
          Upload file
        </Button>
      </Card>

      {query.isError ? (
        <ErrorState title="Could not load files" message="Please try again later." />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.data && query.data.data.length > 0 ? (
        <>
          <div className="files-admin-page__list">
            {query.data.data.map((file) => (
              <Card key={file.fileId} className="files-admin-page__item">
                <div className="files-admin-page__item-head">
                  <h3 className="files-admin-page__item-title">{file.fileName}</h3>
                  <span className="files-admin-page__item-visibility" data-public={file.isPublic}>
                    {file.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="files-admin-page__item-meta">
                  {formatBytes(file.fileSizeBytes)} · {file.mimeType ?? 'unknown type'} ·{' '}
                  {file.downloadsCount} downloads · Uploaded{' '}
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(file.fileId)}
                  isLoading={download.isPending}
                >
                  Download
                </Button>
              </Card>
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={query.data.total}
            totalPages={Math.max(1, Math.ceil(query.data.total / PAGE_SIZE))}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No files uploaded yet."
          description="Upload course assets and syllabi for learners to download."
        />
      )}
    </div>
  );
}

export default AdminFilesPage;
