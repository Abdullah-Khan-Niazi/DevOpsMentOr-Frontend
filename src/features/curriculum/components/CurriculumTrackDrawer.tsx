import { useState } from 'react';
import { Button, ErrorState, Input, toast } from '@/shared/components';
import { CurriculumDrawerShell } from './CurriculumDrawerShell';
import { useAdminTrackMutations } from '../hooks/useAdminTrackMutations';
import type { AdminTrackDto } from '@/features/labs/types';

interface CurriculumTrackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** A create drawer only creates; an edit drawer only edits. */
  mode: 'create' | 'edit';
  track: AdminTrackDto | null;
}

/**
 * Reusable track create/edit drawer, extracted from the admin tracks page so
 * the curriculum Tracks tab and `/admin/tracks` share one form. On success the
 * drawer closes and the form state resets (the shell is keyed per task).
 */
export function CurriculumTrackDrawer({
  isOpen,
  onClose,
  mode,
  track,
}: CurriculumTrackDrawerProps) {
  return (
    <CurriculumDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={mode === 'create' ? 'CREATE · TRACK' : 'EDIT · TRACK'}
      title={mode === 'create' ? 'New Track' : 'Edit Track'}
    >
      <TrackForm
        key={mode === 'create' ? 'track-create' : `track-edit-${track?.trackId ?? 0}`}
        mode={mode}
        track={track}
        onClose={onClose}
      />
    </CurriculumDrawerShell>
  );
}

function TrackForm({
  mode,
  track,
  onClose,
}: {
  mode: 'create' | 'edit';
  track: AdminTrackDto | null;
  onClose: () => void;
}) {
  const mutations = useAdminTrackMutations();

  const [trackName, setTrackName] = useState(track?.trackName ?? '');
  const [slug, setSlug] = useState(track?.slug ?? '');
  const [description, setDescription] = useState(track?.description ?? '');
  const [difficultyId, setDifficultyId] = useState(
    track?.difficultyId != null ? String(track.difficultyId) : '',
  );
  const [totalLabs, setTotalLabs] = useState('0');
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  if (mode === 'edit' && !track) {
    return (
      <ErrorState
        title="Track unavailable"
        message="No track was selected for editing. Close this drawer and pick a track from the list."
        onRetry={onClose}
      />
    );
  }

  const saving = mutations.create.isPending || mutations.update.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = trackName.trim();
    const trimmedSlug = slug.trim();
    let valid = true;

    if (trimmedName.length < 3) {
      setNameError('Track name must be at least 3 characters.');
      valid = false;
    }
    if (trimmedSlug.length < 3 || !/^[a-z0-9-]+$/.test(trimmedSlug)) {
      setSlugError(
        'Slug must be at least 3 characters and use lowercase letters, numbers or dashes.',
      );
      valid = false;
    }
    if (!valid) return;

    if (mode === 'create') {
      mutations.create.mutate(
        {
          trackName: trimmedName,
          slug: trimmedSlug,
          description: description.trim() || undefined,
          difficultyId: difficultyId ? Number(difficultyId) : undefined,
          totalLabs: Number(totalLabs) || 0,
          content: [],
        },
        {
          onSuccess: () => {
            toast.success('Track created.');
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    if (!track) return;

    // The backend treats a provided `content`/`totalLabs` as a full replacement
    // and would wipe the track's linked items. Update payloads deliberately
    // omit both so the edit form only touches metadata.
    mutations.update.mutate(
      {
        trackId: track.trackId,
        payload: {
          trackName: trimmedName,
          slug: trimmedSlug,
          description: description.trim() || undefined,
          difficultyId: difficultyId ? Number(difficultyId) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Track updated.');
          onClose();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      <Input
        label="Track Name"
        value={trackName}
        error={nameError ?? undefined}
        onChange={(event) => {
          setTrackName(event.target.value);
          if (nameError) setNameError(null);
        }}
        placeholder="e.g. DevOps Engineer: Production Path"
        minLength={3}
        required
      />

      <Input
        label="Slug"
        value={slug}
        error={slugError ?? undefined}
        onChange={(event) => {
          setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'));
          if (slugError) setSlugError(null);
        }}
        placeholder="devops-engineer-production-path"
        required
      />

      <div>
        <label htmlFor="track-description" className="input-label mb-1 block">
          Description
        </label>
        <textarea
          id="track-description"
          rows={3}
          className="input-field w-full text-xs leading-relaxed"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What learners walk through in this ordered track."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Difficulty ID (optional)"
          type="number"
          min={1}
          value={difficultyId}
          onChange={(event) => setDifficultyId(event.target.value)}
          placeholder="e.g. 3"
        />
        {mode === 'create' ? (
          <Input
            label="Total Labs (counter)"
            type="number"
            min={0}
            value={totalLabs}
            onChange={(event) => setTotalLabs(event.target.value)}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" isLoading={saving}>
          {mode === 'create' ? 'Create Track' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

export default CurriculumTrackDrawer;
