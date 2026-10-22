import { useState } from 'react';
import { Button, Input } from '@/shared/components';
import type { LabType } from '@/features/labs/types';

export interface LabConfigValues {
  title: string;
  slug: string;
  difficultyId: number;
  labType: LabType;
  estimatedHours: number;
  containerImage: string;
  instructions: string;
  assertions: string[];
}

interface LabConfigFormProps {
  initial?: Partial<LabConfigValues> | null;
  moduleId?: number;
  saving: boolean;
  onSubmit: (values: LabConfigValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const DIFFICULTY_OPTIONS = [
  { id: 1, label: 'Beginner' },
  { id: 2, label: 'Intermediate' },
  { id: 3, label: 'Advanced' },
];

const LAB_TYPE_OPTIONS: Array<{
  value: LabType;
  label: string;
  badge: string;
  desc: string;
  icon: 'guided' | 'unguided' | 'breakfix';
}> = [
  {
    value: 'vip_lab',
    label: 'Guided Sandbox',
    badge: 'GUIDED',
    desc: 'Step-by-step mentored instructions, live hints, and interactive companion guide.',
    icon: 'guided',
  },
  {
    value: 'pro_lab',
    label: 'Unguided Production',
    badge: 'UNGUIDED',
    desc: 'Autonomous multi-container cluster environment for production implementation without hints.',
    icon: 'unguided',
  },
  {
    value: 'sherlock',
    label: 'Break-Fix Incident',
    badge: 'BREAK-FIX',
    desc: 'Diagnose broken Kubernetes infrastructure, triage node/CNI failures, and restore cluster state.',
    icon: 'breakfix',
  },
];

function LabTypeIcon({ type }: { type: 'guided' | 'unguided' | 'breakfix' }) {
  if (type === 'guided') {
    return (
      <svg className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  }
  if (type === 'breakfix') {
    return (
      <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function LabConfigForm({
  initial,
  moduleId: _moduleId,
  saving,
  onSubmit,
  onCancel,
  onDelete,
}: LabConfigFormProps) {
  const isEditing = Boolean(initial?.title);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [difficultyId, setDifficultyId] = useState<number>(initial?.difficultyId ?? 2);
  const [labType, setLabType] = useState<LabType>(initial?.labType ?? 'vip_lab');
  const [estimatedHours, setEstimatedHours] = useState(
    initial?.estimatedHours ? String(initial.estimatedHours) : '1',
  );
  const [containerImage, setContainerImage] = useState(
    initial?.containerImage ?? 'devopsmentor/k8s-sandbox:v1',
  );
  const [instructions, setInstructions] = useState(
    initial?.instructions ??
      '## Lab Objectives\n1. Inspect cluster state using `kubectl get nodes`.\n2. Fix the misconfigured Deployment manifest in `/workspace/k8s/`.\n3. Verify all pods are running healthy.',
  );
  const [assertions, setAssertions] = useState<string[]>(
    initial?.assertions && initial.assertions.length > 0
      ? initial.assertions
      : [
          'Verify node readiness in Kubernetes cluster',
          'Deploy web application pod with health checks',
          'Expose NodePort service on port 30080',
        ],
  );
  const [newAssertion, setNewAssertion] = useState('');

  // Field-specific validation states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const addAssertion = () => {
    if (!newAssertion.trim()) return;
    setAssertions((prev) => [...prev, newAssertion.trim()]);
    setNewAssertion('');
  };

  const removeAssertion = (index: number) => {
    setAssertions((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    let isValid = true;
    if (!title.trim() || title.trim().length < 3) {
      setTitleError('Lab title must be at least 3 characters.');
      isValid = false;
    }
    const finalSlug = slug.trim() || autoSlug(title);
    if (!finalSlug || finalSlug.length < 3) {
      setSlugError('URL slug must be at least 3 characters.');
      isValid = false;
    }
    if (!containerImage.trim()) {
      setImageError('Container image is required (e.g. devopsmentor/k8s-sandbox:v1).');
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      slug: slug.trim() || autoSlug(title),
      difficultyId,
      labType,
      estimatedHours: Math.max(1, Number(estimatedHours) || 1),
      containerImage: containerImage.trim(),
      instructions,
      assertions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {/* Title & Slug */}
      <div className="space-y-3">
        <Input
          label="Lab Title"
          value={title}
          error={titleError ?? undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(null);
            if (!slug) setSlug(autoSlug(e.target.value));
          }}
          placeholder="e.g. Debugging Pod CrashLoopBackOff in Kubernetes"
          required
        />

        <Input
          label="URL Identifier (Slug)"
          value={slug}
          error={slugError ?? undefined}
          onChange={(e) => {
            setSlug(e.target.value);
            if (slugError) setSlugError(null);
          }}
          placeholder="debugging-pod-crashloopbackoff"
          hint="Unique lowercase identifier for the lab environment route."
          required
        />
      </div>

      {/* Lab Architecture Type Selection */}
      <div className="space-y-2">
        <label className="input-label block">
          Lab Architecture Type
        </label>
        <div className="grid grid-cols-1 gap-2">
          {LAB_TYPE_OPTIONS.map((opt) => {
            const isSelected = labType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLabType(opt.value)}
                className={`w-full p-3 text-left border rounded-md transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/10 shadow-xs ring-1 ring-brand-600/30'
                    : 'border-border bg-card/40 hover:bg-surface hover:border-card-foreground/30'
                }`}
              >
                <div className="p-1 rounded-xs bg-paper border border-border mt-0.5">
                  <LabTypeIcon type={opt.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-card-foreground">{opt.label}</span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded-xs border font-semibold ${
                        isSelected
                          ? 'border-brand-500/40 bg-brand-50/20 text-brand-600 dark:text-brand-400'
                          : 'border-border text-muted'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty & Estimated Duration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label block mb-1.5">Difficulty Tier</label>
          <div className="grid grid-cols-3 gap-1.5 border border-border rounded-md p-1 bg-paper/40">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficultyId(d.id)}
                className={`py-1 text-xs font-mono text-center rounded-xs transition-colors cursor-pointer ${
                  difficultyId === d.id
                    ? 'bg-ink text-pearl-100 font-semibold shadow-xs'
                    : 'text-muted hover:text-card-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Estimated Duration (Hours)"
          type="number"
          min={1}
          max={24}
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
        />
      </div>

      {/* Container Image */}
      <Input
        label="Container Sandbox Pod Image"
        value={containerImage}
        error={imageError ?? undefined}
        onChange={(e) => {
          setContainerImage(e.target.value);
          if (imageError) setImageError(null);
        }}
        placeholder="devopsmentor/k8s-sandbox:v1"
        hint="Docker image deployed onto the ephemeral Kubernetes learner pod."
        required
      />

      {/* Markdown Instructions */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="lab-instructions" className="input-label">
            Lab Instructions & Objectives (Markdown)
          </label>
          <span className="text-[10px] font-mono text-muted">Supports GitHub Flavored Markdown</span>
        </div>
        <textarea
          id="lab-instructions"
          rows={7}
          className="input-field w-full font-mono text-xs leading-relaxed resize-y"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Detailed step-by-step objectives rendered in the learner workspace instructions drawer."
        />
      </div>

      {/* Evaluation Assertions Checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="input-label">
            Cluster State Verification Checks
          </label>
          <span className="text-[10px] font-mono text-muted">Evaluated on live cluster state</span>
        </div>

        <div className="space-y-1.5">
          {assertions.map((assertion, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-xs border border-border bg-paper/50 text-xs font-mono"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="text-muted text-[10px] shrink-0 font-bold">#{index + 1}</span>
                <span className="text-card-foreground truncate">{assertion}</span>
              </div>
              <button
                type="button"
                onClick={() => removeAssertion(index)}
                className="text-muted hover:text-signal p-1 transition-colors cursor-pointer"
                title="Remove verification check"
                aria-label={`Remove assertion check ${index + 1}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newAssertion}
              onChange={(e) => setNewAssertion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAssertion();
                }
              }}
              placeholder="Add check objective (e.g. Verify deployment nginx healthy)"
              className="input-field flex-1 text-xs font-mono h-8"
            />
            <Button variant="secondary" size="sm" type="button" onClick={addAssertion}>
              + Add Check
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
        {isEditing && onDelete ? (
          <Button variant="danger" size="sm" type="button" onClick={onDelete}>
            Delete Lab
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={saving}>
            {isEditing ? 'Save Lab Configuration' : 'Create Hands-On Lab'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default LabConfigForm;
