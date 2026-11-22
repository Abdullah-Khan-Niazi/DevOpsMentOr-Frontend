import { useState, useRef } from 'react';
import { Button, Drawer, toast, Icon } from '@/shared/components';
import { cn } from '@/shared/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOrgClasses, useOrgProfessors } from '../hooks';
import { classService, orgService } from '../services';

interface OrgInviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRole?: 'student' | 'professor';
  defaultClassId?: number;
}

/**
 * Drawer wrapper: the form is mounted only while the drawer is open, so the
 * draft and role/cohort presets are rebuilt from props on every opening
 * without a state-resetting effect.
 */
export function OrgInviteDrawer({
  isOpen,
  onClose,
  onSuccess,
  defaultRole = 'student',
  defaultClassId,
}: OrgInviteDrawerProps) {
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setSession((n) => n + 1);
  }
  return (
    <OrgInviteDrawerForm
      key={session}
      open={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      defaultRole={defaultRole}
      defaultClassId={defaultClassId}
    />
  );
}

function OrgInviteDrawerForm({
  open,
  onClose,
  onSuccess,
  defaultRole,
  defaultClassId,
}: Omit<OrgInviteDrawerProps, 'isOpen'> & { open: boolean; defaultRole: 'student' | 'professor' }) {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canInviteProfessors = permissions.includes('org:professors:invite');

  const [role, setRole] = useState<'student' | 'professor'>(
    defaultRole === 'professor' && !canInviteProfessors ? 'student' : defaultRole,
  );
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    defaultClassId ? String(defaultClassId) : '',
  );
  const [assignedCohortIds, setAssignedCohortIds] = useState<number[]>(
    defaultClassId ? [defaultClassId] : [],
  );
  const [emailsInput, setEmailsInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [cohortError, setCohortError] = useState<string | null>(null);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [csvParsedCount, setCsvParsedCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classesQuery = useOrgClasses();
  // Faculty invitations require the org-level invite permission. Professors
  // can still invite students to their own cohorts, but must never see the
  // faculty option or fetch the professor directory.
  const professorsQuery = useOrgProfessors(canInviteProfessors);
  const cohorts = classesQuery.data?.data ?? [];
  // Cohorts load asynchronously; fall back to the first one until the user
  // chooses explicitly so the required selector is never left empty.
  const resolvedCohortId = selectedCohortId || (cohorts[0] ? String(cohorts[0].classId) : '');

  const dirty = emailsInput.trim() !== '' || csvParsedCount !== null;

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
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
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
    setEmailError(null);
    setCohortError(null);

    const emails = emailsInput
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(e));

    let hasError = false;
    if (emails.length === 0) {
      setEmailError('Please enter or upload at least one valid email address.');
      hasError = true;
    }

    if (role === 'professor' && !canInviteProfessors) {
      toast.error('You do not have permission to invite faculty members.');
      hasError = true;
    }

    if (role === 'student' && !resolvedCohortId) {
      setCohortError('Please select a target cohort for student enrollment.');
      hasError = true;
    }

    if (hasError) {
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
              assignedCohortIds.length > 0
                ? ` with ${assignedCohortIds.length} cohort(s) assigned`
                : ''
            }.`,
          );
        } else {
          toast.info(
            `Dispatched ${successCount} professor invitation(s); ${failCount} failed or were duplicates.`,
          );
        }
      } else {
        const res = await classService.inviteStudents(Number(resolvedCohortId), { emails });
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
    <Drawer
      open={open}
      onClose={onClose}
      title={role === 'professor' ? 'Invite a Professor' : 'Invite Students'}
      dirty={dirty}
      busy={isSubmitting}
      footer={(requestClose) => (
        <>
          <Button variant="secondary" onClick={requestClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="org-invite-form"
            isLoading={isSubmitting}
            disabled={role === 'student' && !resolvedCohortId}
          >
            Send invitation
          </Button>
        </>
      )}
    >
      <form id="org-invite-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection (strictly student or professor - no admin) */}
        <div>
          <label className="input-label">Member Role</label>
          <div
            className={cn('grid gap-2 mt-1', canInviteProfessors ? 'grid-cols-2' : 'grid-cols-1')}
          >
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`border p-3 text-left transition-colors rounded-md cursor-pointer ${
                role === 'student'
                  ? 'border-brand-600 bg-brand-50/10 text-brand-600 font-semibold'
                  : 'border-border bg-surface text-card-foreground hover:bg-surface/80'
              }`}
            >
              <div className="text-sm font-medium">Student Learner</div>
            </button>

            {canInviteProfessors && (
              <button
                type="button"
                onClick={() => setRole('professor')}
                className={`border p-3 text-left transition-colors rounded-md cursor-pointer ${
                  role === 'professor'
                    ? 'border-brand-600 bg-brand-50/10 text-brand-600 font-semibold'
                    : 'border-border bg-surface text-card-foreground hover:bg-surface/80'
                }`}
              >
                <div className="text-sm font-medium">Faculty / Professor</div>
              </button>
            )}
          </div>
        </div>

        {/* Cohort Picker for Students */}
        {role === 'student' && (
          <div>
            <label htmlFor="target-cohort-select" className="input-label">
              Target Cohort <span className="text-signal ml-0.5">*</span>
            </label>
            {cohorts.length === 0 ? (
              <div className="border border-border p-3 text-xs text-muted font-mono rounded-md">
                No cohorts provisioned yet. Please create a cohort first.
              </div>
            ) : (
              <>
                <select
                  id="target-cohort-select"
                  className={cn(
                    'input-field w-full mt-1',
                    cohortError && 'border-signal outline-signal focus:border-signal bg-signal/5',
                  )}
                  value={resolvedCohortId}
                  onChange={(e) => {
                    setSelectedCohortId(e.target.value);
                    if (cohortError) setCohortError(null);
                  }}
                  required
                >
                  <option value="">Select a cohort…</option>
                  {cohorts.map((c) => (
                    <option key={c.classId} value={String(c.classId)}>
                      {c.className} ({c.studentCount} / {c.maxStudents} enrolled)
                    </option>
                  ))}
                </select>
                {cohortError ? (
                  <p className="mt-1.5 text-xs text-signal font-medium flex items-center gap-1">
                    <Icon name="warning" size={14} className="shrink-0" />
                    {cohortError}
                  </p>
                ) : null}
              </>
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
            {cohorts.length === 0 ? (
              <div className="border border-border p-3 text-xs text-muted font-mono rounded-md">
                No cohorts provisioned yet.
              </div>
            ) : (
              <div className="border border-border/80 max-h-36 overflow-y-auto bg-surface/30 rounded-md">
                {cohorts.map((c) => (
                  <label
                    key={c.classId}
                    className="flex items-center gap-2.5 p-2.5 hover:bg-surface/60 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={assignedCohortIds.includes(c.classId)}
                      onChange={() => toggleCohortAssignment(c.classId)}
                      className="rounded-xs border-border"
                    />
                    <span className="font-medium text-card-foreground">{c.className}</span>
                    <span className="text-muted font-mono text-xs">
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
              Email Address(es) <span className="text-signal ml-0.5">*</span>
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
            className={cn(
              'input-field w-full font-mono text-xs mt-1',
              emailError && 'border-signal outline-signal focus:border-signal bg-signal/5',
            )}
            placeholder={
              role === 'professor'
                ? 'professor@example.com'
                : 'alice@university.edu\nbob@university.edu'
            }
            value={emailsInput}
            onChange={(e) => {
              setEmailsInput(e.target.value);
              if (emailError) setEmailError(null);
            }}
            required
          />
          {emailError ? (
            <p className="mt-1.5 text-xs text-signal font-medium flex items-center gap-1">
              <Icon name="warning" size={14} className="shrink-0" />
              {emailError}
            </p>
          ) : null}
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
            className={`mt-1 border-2 border-dashed p-3.5 text-center transition-colors rounded-md cursor-pointer ${
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
              <p className="text-xs text-muted font-mono">Format: email, role, fullName</p>
              {csvParsedCount !== null && (
                <p className="text-xs font-mono text-brand-600 font-semibold mt-1">
                  &check; {csvParsedCount} email(s) loaded from CSV
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleDownloadSampleCsv}>
              Download Sample CSV
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
