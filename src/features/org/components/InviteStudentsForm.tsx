import { useState } from 'react';
import { Button } from '@/shared/components';

interface InviteStudentsFormProps {
  submitting: boolean;
  onSubmit: (emails: string[]) => void;
}

/** F3 contract §09 SCR-F3-07: comma/newline separated email invite form. */
export function InviteStudentsForm({ submitting, onSubmit }: InviteStudentsFormProps) {
  const [value, setValue] = useState('');

  const parseEmails = (raw: string): string[] =>
    raw
      .split(/[,;\n]+/)
      .map((email) => email.trim())
      .filter(Boolean);

  const handleSubmit = () => {
    const emails = parseEmails(value);
    if (emails.length === 0) return;
    onSubmit(emails);
    setValue('');
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="invite-emails" className="input-label">
          Student emails
        </label>
        <textarea
          id="invite-emails"
          rows={4}
          className="input-field w-full"
          placeholder={'student1@example.com, student2@example.com'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={parseEmails(value).length === 0}
        >
          Send invitations
        </Button>
      </div>
    </div>
  );
}

export default InviteStudentsForm;
