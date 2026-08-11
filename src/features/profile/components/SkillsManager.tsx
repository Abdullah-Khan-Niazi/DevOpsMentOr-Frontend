import { useMemo, useState } from 'react';
import { Button, toast } from '@/shared/components';
import { useMySkills, useSkillsCatalog } from '../hooks';
import type { SkillCategory, UserSkill } from '../types';

const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  offensive: 'Offensive security',
  defensive: 'Defensive security',
  forensics: 'Forensics',
  networking: 'Networking',
  web: 'Web',
  mobile: 'Mobile',
  cloud: 'Cloud',
  ai_ml: 'AI/ML',
  governance: 'Governance & compliance',
};

export function SkillsManager() {
  const { list, addSkill, removeSkill } = useMySkills();
  const { data: catalog } = useSkillsCatalog();

  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState<string>('beginner');
  const [years, setYears] = useState('0');

  const mySkillIds = useMemo(() => new Set((list.data ?? []).map((s) => s.skillId)), [list.data]);
  const available = useMemo(
    () => (catalog ?? []).filter((s) => !mySkillIds.has(s.skillId)),
    [catalog, mySkillIds],
  );

  const grouped = useMemo(() => {
    const groups = new Map<SkillCategory, UserSkill[]>();
    for (const skill of list.data ?? []) {
      const arr = groups.get(skill.category) ?? [];
      arr.push(skill);
      groups.set(skill.category, arr);
    }
    return [...groups.entries()];
  }, [list.data]);

  const handleAdd = () => {
    const skillId = Number(selectedSkillId);
    if (!skillId) {
      toast.error('Select a skill from the catalog');
      return;
    }
    addSkill.mutate(
      { skillId, proficiencyLevel: proficiency, yearsExperience: Number(years) },
      {
        onSuccess: () => {
          toast.success('Skill added to your profile');
          setSelectedSkillId('');
          setProficiency('beginner');
          setYears('0');
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleRemove = (skillId: number) => {
    removeSkill.mutate(skillId, {
      onSuccess: () => toast.success('Skill removed'),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_160px_120px_auto]">
        <div>
          <label htmlFor="skill-select" className="input-label">
            Skill
          </label>
          <select
            id="skill-select"
            className="input-field"
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
          >
            <option value="">Choose a skill…</option>
            {available.map((s) => (
              <option key={s.skillId} value={s.skillId}>
                {s.skillName} ({CATEGORY_LABELS[s.category] ?? s.category})
              </option>
            ))}
          </select>
          {available.length === 0 ? (
            <p className="input-hint">All catalog skills are on your profile.</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="skill-proficiency" className="input-label">
            Proficiency
          </label>
          <select
            id="skill-proficiency"
            className="input-field"
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
          >
            {PROFICIENCY_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="skill-years" className="input-label">
            Years
          </label>
          <input
            id="skill-years"
            type="number"
            min={0}
            max={60}
            className="input-field"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleAdd}
            isLoading={addSkill.isPending}
            disabled={!selectedSkillId}
          >
            Add skill
          </Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-muted">No skills added yet — pick from the catalog above.</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(([category, skills]) => (
            <div key={category}>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {CATEGORY_LABELS[category] ?? category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill.skillId}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
                  >
                    {skill.skillName}
                    <span className="text-xs text-muted-foreground">
                      {skill.proficiencyLevel}
                      {skill.yearsExperience > 0 ? ` · ${skill.yearsExperience}y` : ''}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${skill.skillName}`}
                      className="text-muted-foreground transition-colors hover:text-danger"
                      onClick={() => handleRemove(skill.skillId)}
                      disabled={removeSkill.isPending}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SkillsManager;
