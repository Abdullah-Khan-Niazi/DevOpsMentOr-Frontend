import '../styles/community.css';
import { useId, useState } from 'react';
import { Button, Modal, toast } from '@/shared/components';
import { useCreateReport } from '../hooks/useCommunity';
import { REPORT_REASONS } from '../types';
import type { ReportTargetType } from '../types';

// SCR-F8-07: report-content modal. `reportReason` comes from a fixed
// select (reasons seeded in `system_settings.reports.reason_categories`);
// the reported content is never echoed back (backend never returns it).

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
}

export function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const reasonId = useId();
  const createReport = useCreateReport();
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    createReport.mutate(
      {
        targetType,
        targetId,
        reportReason,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Report filed. Moderators will review it shortly.');
          setDescription('');
          onClose();
        },
        onError: () => toast.error('Could not file the report.'),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Report content">
      <div className="report-modal">
        <label className="report-modal__field" htmlFor={reasonId}>
          <span className="report-modal__label">Reason</span>
          <select
            id={reasonId}
            className="report-modal__select"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
          >
            {REPORT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </label>
        <label className="report-modal__field">
          <span className="report-modal__label">Details (optional)</span>
          <textarea
            className="report-modal__textarea"
            rows={4}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Anything the moderators should know."
          />
        </label>
        <div className="report-modal__actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} isLoading={createReport.isPending}>
            Submit report
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ReportModal;
