import { useRef, useState } from 'react';
import { Button, Card } from '@/shared/components';
import type { ImportSummaryDto } from '../types';

const TEMPLATE_CSV = 'Email\nstudent1@example.com\nstudent2@example.com\n';

function downloadCsvTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'class-students-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

interface BulkImportPanelProps {
  submitting: boolean;
  onImport: (file: File) => void;
  result: ImportSummaryDto | null;
}

/** F3 contract §09 SCR-F3-07: CSV bulk import panel (CLS-08). */
export function BulkImportPanel({ submitting, onImport, result }: BulkImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    onImport(file);
  };

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h4 className="font-medium text-slate-900">Bulk import students</h4>
        <p className="mt-1 text-sm text-muted">
          Upload a CSV with a single <code className="rounded bg-slate-100 px-1">Email</code> column
          to invite many students at once.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={downloadCsvTemplate}>
          Download template
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          isLoading={submitting}
        >
          {fileName ? `Import ${fileName}` : 'Upload CSV'}
        </Button>
      </div>

      {result ? (
        <div className="rounded-lg border border-border bg-surface/50 p-4 text-sm">
          <p className="font-medium text-slate-900">
            {result.successCount} of {result.totalRows} rows invited
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
              {result.errors.slice(0, 10).map((err) => (
                <li key={`${err.row}-${err.email}`}>
                  Row {err.row} ({err.email}): {err.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

export default BulkImportPanel;
