import { useState, useRef, useEffect } from 'react';
import { Button, toast } from '@/shared/components';
import { useOrgClasses, useOrgProfessors } from '../hooks';
import { classService, orgService } from '../services';

interface OrgInviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRole?: 'student' | 'professor';
  defaultClassId?: number;
}

export function OrgInviteDrawer({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'student',
  defaultClassId,
}: OrgInviteDrawerProps) {
  const [role, setRole] = useState<'student' | 'professor'>(defaultRole);
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    defaultClassId ? String(defaultClassId) : '',
  );
  const [assignedCohortIds, setAssignedCohortIds] = useState<number[]>(
    defaultClassId ? [defaultClassId] : [],
  );
  const [emailsInput, setEmailsInput] = useState('');
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [csvParsedCount, setCsvParsedCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classesQuery = useOrgClasses();
  const professorsQuery = useOrgProfessors();
  const cohorts = classesQuery.data?.data ?? [];

  // Reset or preset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setRole(defaultRole);
      setSelectedCohortId(
        defaultClassId ? String(defaultClassId) : cohorts[0]?.classId ? String(cohorts[0].classId) : '',
      );
      setAssignedCohortIds(defaultClassId ? [defaultClassId] : []);
      setEmailsInput('');
      setCsvParsedCount(null);
    }
  }, [isOpen, defaultRole, defaultClassId, cohorts]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadSampleCsv = () => {
    const content =
      'email,role,fullName\n' +
      'student1@example.com,student,Alice Johnson\n' +
      'student2@example.com,student,Bob Martinez\n' +
      'prof1@example.com,professor,Dr. Mark Vance\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_cohort_invites.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsedEmails: string[] = [];

      for (const line of lines) {
        if (/^email\s*,/i.test(line)) continue;
        const parts = line.split(',');
        const emailCandidate = parts[0]?.trim();
        if (
          emailCandidate &&
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(emailCandidate)
        ) {
          parsedEmails.push(emailCandidate.toLowerCase());
        } else {
          const matches = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || [];
          for (const m of matches) parsedEmails.push(m.toLowerCase());
        }
      }

      const extracted = Array.from(new Set(parsedEmails));
      if (extracted.length === 0) {
        toast.error('No valid email addresses detected in CSV file.');
        return;
      }

      setEmailsInput((prev) => {
        const existing = prev
          .split(/[\n,]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const combined = Array.from(new Set([...existing, ...extracted]));
        return combined.join('\n');
      });

      setCsvParsedCount(extracted.length);
      toast.success(`Loaded ${extracted.length} valid email address(es) from CSV.`);
    } catch {
      toast.error('Failed to parse CSV file. Ensure it is standard UTF-8 text.');
    }
  };

  const toggleCohortAssignment = (cohortId: number) => {
    setAssignedCohortIds((prev) =>
      prev.includes(cohortId) ? prev.filter((id) => id !== cohortId) : [...prev, cohortId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emails = emailsInput
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(e));

    if (emails.length === 0) {
      toast.error('Please enter or upload at least one valid email address.');
      return;
    }

    if (role === 'student' && !selectedCohortId) {
      toast.error('Please select a target cohort for student enrollment.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === 'professor') {
        let successCount = 0;
        let failCount = 0;
        for (const email of emails) {
          try {
            await orgService.inviteProfessor({ email });
            successCount++;

            // If cohorts were selected to assign this professor to:
            // Check if professor already exists in organization professors list
            const existingProf = professorsQuery.query.data?.find(
              (p) => p.email.toLowerCase() === email.toLowerCase(),
            );
            if (existingProf && assignedCohortIds.length > 0) {
              for (const cId of assignedCohortIds) {
                try {
                  await classService.assignProfessor(cId, existingProf.userId);
                } catch {
                  // Silently continue if already assigned
                }
              }
            }
          } catch {
            failCount++;
          }
        }
        void professorsQuery.query.refetch();
        void classesQuery.refetch();

        if (failCount === 0) {
          toast.success(
            `Dispatched ${successCount} professor invitation(s)${
              assignedCohortIds.length > 0 ? ` with ${assignedCohortIds.length} cohort(s) assigned` : ''
            }.`,
          );
        } else {
          toast.info(
            `Dispatched ${successCount} professor invitation(s); ${failCount} failed or were duplicates.`,
          );
        }
      } else {
        const res = await classService.inviteStudents(Number(selectedCohortId), { emails });
        const invitedCount = res.invited?.length ?? 0;
        const skippedCount = res.skipped?.length ?? 0;
        if (skippedCount > 0) {
          toast.info(
            `Invited ${invitedCount} student(s); skipped ${skippedCount} (already enrolled or pending).`,
          );
        } else {
          toast.success(`Dispatched ${invitedCount} student invitation(s) to cohort.`);
        }
        void classesQuery.refetch();
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch invitations.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-card border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 rounded-none">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">
                  {role === 'professor' ? 'Invite a Professor' : 'Invite Students'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-muted hover:text-card-foreground transition-colors"
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form id="org-invite-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection (strictly student or professor - no admin) */}
              <div>
                <label className="input-label">Member Role</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`border p-3 text-left transition-colors rounded-none ${
                      role === 'student'
                        ? 'border-brand-600 bg-brand-50/10 text-brand-600 font-semibold'
                        : 'border-border bg-surface text-card-foreground hover:bg-surface/80'
                    }`}
                  >
                    <div className="text-sm font-medium">Student Learner</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('professor')}
                    className={`border p-3 text-left transition-colors rounded-none ${
                      role === 'professor'
                        ? 'border-brand-600 bg-brand-50/10 text-brand-600 font-semibold'
                        : 'border-border bg-surface text-card-foreground hover:bg-surface/80'
                    }`}
                  >
                    <div className="text-sm font-medium">Faculty / Professor</div>
                  </button>
                </div>
              </div>

              {/* Cohort Picker for Students */}
              {role === 'student' && (
                <div>
                  <label htmlFor="target-cohort-select" className="input-label">
                    Target Cohort <span className="text-destructive">*</span>
                  </label>
                  {cohorts.length === 0 ? (
                    <div className="border border-border p-3 text-xs text-muted font-mono">
                      No cohorts provisioned yet. Please create a cohort first.
                    </div>
                  ) : (
                    <select
                      id="target-cohort-select"
                      className="input-field w-full mt-1"
                      value={selectedCohortId}
                      onChange={(e) => setSelectedCohortId(e.target.value)}
                      required
                    >
                      <option value="">Select a cohort…</option>
                      {cohorts.map((c) => (
                        <option key={c.classId} value={String(c.classId)}>
                          {c.className} ({c.studentCount} / {c.maxStudents} enrolled)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Multi-Cohort Assignment for Professors */}
              {role === 'professor' && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="input-label">Assign to Cohort(s)</label>
                    <span className="text-xs text-muted font-mono">
                      {assignedCohortIds.length} selected
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mb-1.5 font-mono">
                    Optionally assign this professor to lead one or multiple cohorts.
                  </p>
                  {cohorts.length === 0 ? (
                    <div className="border border-border p-3 text-xs text-muted font-mono">
                      No cohorts provisioned yet.
                    </div>
                  ) : (
                    <div className="border border-border/80 max-h-36 overflow-y-auto divide-y divide-border/60 bg-surface/30">
                      {cohorts.map((c) => (
                        <label
                          key={c.classId}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-surface/60 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={assignedCohortIds.includes(c.classId)}
                            onChange={() => toggleCohortAssignment(c.classId)}
                            className="rounded-none border-border"
                          />
                          <span className="font-medium text-card-foreground">{c.className}</span>
                          <span className="text-muted font-mono text-[10px]">
                            ({c.studentCount}/{c.maxStudents} enrolled)
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Email Addresses Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="invite-emails-area" className="input-label">
                    Email Address(es) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs text-muted font-mono">
                    {
                      emailsInput
                        .split(/[\n,]+/)
                        .map((e) => e.trim())
                        .filter(Boolean).length
                    }{' '}
                    entered
                  </span>
                </div>
                <textarea
                  id="invite-emails-area"
                  rows={role === 'professor' ? 3 : 4}
                  className="input-field w-full font-mono text-xs mt-1"
                  placeholder={
                    role === 'professor'
                      ? 'professor@example.com'
                      : 'alice@university.edu\nbob@university.edu'
                  }
                  value={emailsInput}
                  onChange={(e) => setEmailsInput(e.target.value)}
                  required
                />
              </div>

              {/* Drag & Drop CSV Upload Area */}
              <div>
                <label className="input-label">Or Batch Import via CSV</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingCsv(true);
                  }}
                  onDragLeave={() => setIsDraggingCsv(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingCsv(false);
                    void handleCsvFile(e.dataTransfer.files);
                  }}
                  className={`mt-1 border-2 border-dashed p-3.5 text-center transition-colors rounded-none cursor-pointer ${
                    isDraggingCsv
                      ? 'border-brand-600 bg-brand-50/10'
                      : 'border-border/80 bg-surface/40 hover:bg-surface/70'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => void handleCsvFile(e.target.files)}
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-card-foreground">
                      Click to upload or drag &amp; drop CSV file
                    </p>
                    <p className="text-[11px] text-muted font-mono">
                      Format: email, role, fullName
                    </p>
                    {csvParsedCount !== null && (
                      <p className="text-[11px] font-mono text-brand-600 font-semibold mt-1">
                        &check; {csvParsedCount} email(s) loaded from CSV
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="text-xs text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    &darr; Download Sample CSV
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="org-invite-form"
              isLoading={isSubmitting}
              disabled={role === 'student' && !selectedCohortId}
            >
              Send invitation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
