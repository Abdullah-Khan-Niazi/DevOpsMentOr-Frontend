import { useState } from 'react';
import { Button } from '@/shared/components';
import type { ProfessorDto } from '../types';

interface ProfessorAssignmentSelectorProps {
  professors: ProfessorDto[];
  currentProfessorUserId: number;
  submitting: boolean;
  onAssign: (professorUserId: number) => void;
}

/** F3 contract §09 SCR-F3-09: assign a professor to the class (CLS-05). */
export function ProfessorAssignmentSelector({
  professors,
  currentProfessorUserId,
  submitting,
  onAssign,
}: ProfessorAssignmentSelectorProps) {
  const [selected, setSelected] = useState<string>(
    currentProfessorUserId ? String(currentProfessorUserId) : '',
  );

  if (professors.length === 0) {
    return <p className="py-6 text-sm text-slate-500">Invite a professor first.</p>;
  }

  const handleAssign = () => {
    const id = Number(selected);
    if (!Number.isFinite(id) || id <= 0) return;
    onAssign(id);
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="professor-select" className="input-label">
          Professor
        </label>
        <select
          id="professor-select"
          className="input-field w-full"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select a professor…</option>
          {professors.map((professor) => (
            <option key={professor.userId} value={professor.userId}>
              {professor.fullName ?? professor.email} · {professor.email}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleAssign} isLoading={submitting} disabled={!selected}>
          Assign professor
        </Button>
      </div>
    </div>
  );
}

export default ProfessorAssignmentSelector;
