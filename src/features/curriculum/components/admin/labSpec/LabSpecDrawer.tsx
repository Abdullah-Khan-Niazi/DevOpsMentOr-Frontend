import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  Button,
  Drawer,
  DrawerFormSkeleton,
  ErrorState,
  FieldError,
  Icon,
  Switch,
  TabSwitcher,
  Textarea,
  type TabSwitcherItem,
} from '@/shared/components';
import {
  getErrorCode,
  getErrorMessage,
  getStatusCode,
  isApiError,
  isCanceledError,
} from '@/shared/services/apiError';
import {
  useAdminLab,
  useSaveLabSpec,
  useSetLabActive,
  useValidateLabSpec,
} from '@/features/labs/hooks/useAdminLabs';
import type { AdminLabDetailDto } from '@/features/labs/types/admin';
import type { LabSpecIssue, LabStepV2 } from '@/features/labs/types/labSpec';
import { ScenarioEditor, type ScenarioValue } from './ScenarioEditor';
import { SpecIssues } from './SpecIssues';
import { StepEditor } from './StepEditor';
import { StepList } from './StepList';
import {
  clientSpecIssues,
  createStepKey,
  draftToSpec,
  emptySpec,
  emptyStep,
  issuesToRecord,
  MAX_STEPS,
  MAX_TITLE_LENGTH,
  relativeIssues,
  specKey,
  specToDraft,
  STEP_ID_MAX_LENGTH,
  uniqueStepId,
  unrecognizedKeyIssues,
  type SpecDraft,
  type StepDraft,
} from './labSpecSchema';

// Staff editor for a lab's step spec (contract C§2.2 and C§6.2). Form and JSON views
// edit one draft. Client rules block Save at once; the server validates the draft
// (debounced, latest answer wins) and its issues and warnings are listed. Saving
// replaces the lab's `pro_labs.flag_values`; the Active switch publishes the lab.

const LABS_PERMISSION = 'platform.labs.manage';
const VALIDATE_DEBOUNCE_MS = 600;
const NO_ISSUES: LabSpecIssue[] = [];
const NO_WARNINGS: string[] = [];

type EditorMode = 'form' | 'json';

const VIEW_ITEMS: ReadonlyArray<TabSwitcherItem<EditorMode>> = [
  { id: 'form', label: 'Form', icon: 'list' },
  { id: 'json', label: 'JSON', icon: 'code' },
];

/** Editor state for one opening of the drawer. Edits live here until saved or closed. */
interface EditorSession {
  labId: number;
  draft: SpecDraft;
  /** Spec key the editor started from; the draft is dirty when it differs. */
  baselineKey: string;
  selectedKey: string;
  mode: EditorMode;
  jsonText: string;
  jsonError: string | null;
}

interface ServerValidation {
  key: string;
  issues: LabSpecIssue[];
  warnings: string[];
  failed: boolean;
}

interface SaveFailure {
  key: string;
  issues: LabSpecIssue[];
  message: string;
}

export interface LabSpecDrawerProps {
  open: boolean;
  labId: number;
  onClose: () => void;
}

function createSession(lab: AdminLabDetailDto): EditorSession {
  const draft = lab.spec ? specToDraft(lab.spec) : specToDraft(emptySpec(), true);
  return {
    labId: lab.labId,
    draft,
    baselineKey: specKey(draftToSpec(draft)),
    selectedKey: draft.steps[0]?.key ?? '',
    mode: 'form',
    jsonText: '',
    jsonError: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function specIssuesFromError(error: unknown): LabSpecIssue[] {
  if (!isApiError(error)) return [];
  return error.errors.flatMap((detail) =>
    typeof detail.path === 'string' && typeof detail.message === 'string'
      ? [{ path: detail.path, message: detail.message }]
      : [],
  );
}

function activationMessage(error: unknown): string {
  switch (getErrorCode(error)) {
    case 'LAB_NOT_READY':
      return 'Save a valid step spec first.';
    case 'CATALOG_LAB_NOT_FOUND':
      return 'No lab image exists for this slug.';
    case 'CATALOG_UNAVAILABLE':
      return 'The lab catalog is unavailable. Try again.';
    default:
      return getErrorMessage(error);
  }
}

export function LabSpecDrawer({ open, labId, onClose }: LabSpecDrawerProps) {
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(LABS_PERMISSION) ?? false,
  );
  const labQuery = useAdminLab(labId, open && canManage);
  const lab = labQuery.data?.labId === labId ? labQuery.data : undefined;
  const initial = useMemo(() => (lab ? createSession(lab) : null), [lab]);

  const [edit, setEdit] = useState<EditorSession | null>(null);
  const session = edit?.labId === labId ? edit : initial;
  const draft = session?.draft ?? null;
  const steps = draft?.steps ?? [];

  const spec = useMemo(() => (draft ? draftToSpec(draft) : null), [draft]);
  const specText = spec ? specKey(spec) : '';
  const specJson = spec ? JSON.stringify(spec, null, 2) : '';

  const clientIssues = useMemo(() => (spec ? clientSpecIssues(spec) : []), [spec]);
  const clientValid = clientIssues.length === 0;

  const validate = useValidateLabSpec();
  const validateSpec = validate.mutateAsync;
  const [validation, setValidation] = useState<ServerValidation | null>(null);

  // Live validation: 600 ms after the last change, and an older request is aborted.
  useEffect(() => {
    if (!open || !spec) return;
    const key = specText;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      validateSpec({ spec, signal: controller.signal }).then(
        (result) => {
          if (controller.signal.aborted) return;
          setValidation({
            key,
            issues: result.issues,
            warnings: result.warnings,
            failed: false,
          });
        },
        (error: unknown) => {
          if (controller.signal.aborted || isCanceledError(error)) return;
          setValidation({ key, issues: [], warnings: [], failed: true });
        },
      );
    }, VALIDATE_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, spec, specText, validateSpec]);

  const [saveFailure, setSaveFailure] = useState<SaveFailure | null>(null);
  const freshValidation = validation !== null && validation.key === specText ? validation : null;
  const currentSaveFailure =
    saveFailure !== null && saveFailure.key === specText ? saveFailure : null;
  const serverIssues = useMemo<LabSpecIssue[]>(
    () => freshValidation?.issues ?? currentSaveFailure?.issues ?? NO_ISSUES,
    [freshValidation, currentSaveFailure],
  );
  const warnings = freshValidation?.warnings ?? NO_WARNINGS;

  const fieldIssues = useMemo(
    () => ({ ...issuesToRecord(clientIssues), ...issuesToRecord(serverIssues) }),
    [clientIssues, serverIssues],
  );

  const jsonUnapplied =
    session !== null && session.mode === 'json' && session.jsonText !== specJson;
  const dirty = session !== null && (specText !== session.baselineKey || jsonUnapplied);

  const save = useSaveLabSpec(labId);
  const canSave =
    canManage && session !== null && dirty && clientValid && !jsonUnapplied && !save.isPending;

  const setActive = useSetLabActive();
  const [activeError, setActiveError] = useState<string | null>(null);
  const activeChecked =
    setActive.isPending && setActive.variables
      ? setActive.variables.isActive
      : (lab?.isActive ?? false);

  /** Closing drops the unsaved edits (the Drawer asks first when dirty). */
  function handleClose() {
    setEdit(null);
    setSaveFailure(null);
    setActiveError(null);
    onClose();
  }

  function patch(next: Partial<EditorSession>) {
    if (!session) return;
    setEdit({ ...session, ...next });
  }

  function updateDraft(next: SpecDraft, extra?: Partial<EditorSession>) {
    patch({ draft: next, ...extra });
  }

  async function handleSave() {
    if (!spec || !canSave) return;
    const key = specText;
    setSaveFailure(null);
    try {
      await save.mutateAsync(spec);
      // Keep the edits when the author kept typing during the request.
      setEdit((current) =>
        current && specKey(draftToSpec(current.draft)) === key ? null : current,
      );
    } catch (error) {
      setSaveFailure({ key, issues: specIssuesFromError(error), message: getErrorMessage(error) });
    }
  }

  function handleActiveChange(isActive: boolean) {
    setActiveError(null);
    setActive.mutate(
      { labId, isActive },
      { onError: (error) => setActiveError(activationMessage(error)) },
    );
  }

  /* ── Scenario ──────────────────────────────────────────────────────── */

  const scenarioValue: ScenarioValue | null = draft
    ? {
        mode: draft.mode,
        intro: draft.scenario.intro,
        setup: draft.scenario.setup,
        completionBonus: draft.completionBonus,
      }
    : null;

  function changeScenario(next: ScenarioValue) {
    if (!draft) return;
    updateDraft({
      ...draft,
      mode: next.mode,
      scenario: { intro: next.intro, setup: next.setup },
      completionBonus: next.completionBonus,
    });
  }

  /* ── Steps ─────────────────────────────────────────────────────────── */

  const selected = steps.find((entry) => entry.key === session?.selectedKey) ?? steps[0];
  const selectedIndex = selected ? steps.indexOf(selected) : -1;
  const flaggedKeys = new Set(
    steps.flatMap((entry, index) => {
      const prefix = `steps.${index}`;
      const flagged = Object.keys(fieldIssues).some(
        (path) => path === prefix || path.startsWith(`${prefix}.`),
      );
      return flagged ? [entry.key] : [];
    }),
  );

  function selectStep(key: string) {
    patch({ selectedKey: key });
  }

  function reorderSteps(keys: Array<number | string>) {
    if (!draft) return;
    const byKey = new Map(steps.map((entry) => [entry.key, entry]));
    const next = keys.flatMap((key) => {
      const entry = byKey.get(String(key));
      return entry ? [entry] : [];
    });
    updateDraft({ ...draft, steps: next });
  }

  function addStep() {
    if (!draft || steps.length >= MAX_STEPS) return;
    const base = emptyStep(steps.length);
    const entry: StepDraft = {
      key: createStepKey(),
      autoId: true,
      step: {
        ...base,
        id: uniqueStepId(
          base.id,
          steps.map((item) => item.step.id),
        ),
      },
    };
    updateDraft({ ...draft, steps: [...steps, entry] }, { selectedKey: entry.key });
  }

  function duplicateStep(key: string) {
    if (!draft || steps.length >= MAX_STEPS) return;
    const position = steps.findIndex((entry) => entry.key === key);
    const source = steps[position];
    if (!source) return;
    const copy: StepDraft = {
      key: createStepKey(),
      autoId: false,
      step: structuredClone<LabStepV2>(source.step),
    };
    const takenIds = steps.map((entry) => entry.step.id);
    copy.step.id = uniqueStepId(`${source.step.id}-copy`.slice(0, STEP_ID_MAX_LENGTH), takenIds);
    copy.step.title = source.step.title
      ? `${source.step.title} (copy)`.slice(0, MAX_TITLE_LENGTH)
      : '';
    const next = [...steps.slice(0, position + 1), copy, ...steps.slice(position + 1)];
    updateDraft({ ...draft, steps: next }, { selectedKey: copy.key });
  }

  function deleteStep(key: string) {
    if (!draft || steps.length <= 1) return;
    const position = steps.findIndex((entry) => entry.key === key);
    const next = steps.filter((entry) => entry.key !== key);
    const neighbour = next[Math.max(0, Math.min(position, next.length - 1))];
    const nextSelected =
      session?.selectedKey === key ? (neighbour?.key ?? '') : session?.selectedKey;
    updateDraft({ ...draft, steps: next }, { selectedKey: nextSelected });
  }

  function updateStep(next: StepDraft) {
    if (!draft) return;
    updateDraft({
      ...draft,
      steps: steps.map((entry) => (entry.key === next.key ? next : entry)),
    });
  }

  /* ── JSON view ─────────────────────────────────────────────────────── */

  function switchMode(next: EditorMode) {
    if (!session || next === session.mode) return;
    if (next === 'json') {
      patch({ mode: 'json', jsonText: specJson, jsonError: null });
      return;
    }
    if (jsonUnapplied) {
      applyJson();
      return;
    }
    patch({ mode: 'form', jsonError: null });
  }

  function applyJson() {
    if (!session) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(session.jsonText);
    } catch {
      patch({ jsonError: 'The JSON is not valid. Fix it or discard the edits.' });
      return;
    }
    if (!isRecord(parsed) || !Array.isArray(parsed.steps)) {
      patch({ jsonError: 'The spec needs a steps list.' });
      return;
    }
    if (!parsed.steps.every(isRecord)) {
      patch({ jsonError: 'Every step must be a JSON object.' });
      return;
    }
    const unknown = unrecognizedKeyIssues(parsed);
    if (unknown.length > 0) {
      const first = unknown[0];
      patch({
        jsonError: `${first.path ? `${first.path}: ` : ''}${first.message}.`,
      });
      return;
    }
    const nextDraft = specToDraft(parsed as Parameters<typeof specToDraft>[0]);
    patch({
      draft: nextDraft,
      mode: 'form',
      jsonError: null,
      selectedKey: nextDraft.steps[0]?.key ?? '',
    });
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  const footer = (requestClose: () => void) => (
    <>
      <Button variant="ghost" disabled={save.isPending} onClick={requestClose}>
        Cancel
      </Button>
      {session && canManage ? (
        <Button
          variant="primary"
          isLoading={save.isPending}
          isSuccess={save.isSuccess && !save.isPending}
          disabled={!canSave}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
      ) : null}
    </>
  );

  function renderBody() {
    if (!canManage) {
      return <ErrorState title="You do not have access to lab step specs." />;
    }
    if (labId <= 0) {
      return <ErrorState title="No lab selected." />;
    }
    if (!lab || !session || !draft || !scenarioValue) {
      if (labQuery.isError) {
        if (getStatusCode(labQuery.error) === 404) {
          return (
            <div className="flex flex-col items-start gap-4">
              <ErrorState title="This item no longer exists." />
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          );
        }
        return (
          <ErrorState
            title="The step spec could not be loaded."
            error={labQuery.error}
            retrying={labQuery.isFetching}
            onRetry={() => void labQuery.refetch()}
          />
        );
      }
      if (!lab && !labQuery.isPending) {
        return <ErrorState title="The lab could not be loaded." />;
      }
      return <DrawerFormSkeleton fields={4} />;
    }

    const ready = lab.specStatus === 'v2';
    const stepTitles = steps.map((entry) => entry.step.title);
    const otherIds = selected
      ? steps.filter((entry) => entry !== selected).map((entry) => entry.step.id)
      : [];
    const selectedIssues = selected ? relativeIssues(fieldIssues, `steps.${selectedIndex}.`) : {};
    const saveFailureMessage =
      currentSaveFailure && serverIssues.length === 0 ? currentSaveFailure.message : null;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-mono text-sm text-muted">{lab.slug}</span>
            <span
              className="has-tooltip inline-flex shrink-0"
              data-tooltip={ready ? 'Steps configured' : 'Steps not configured'}
            >
              <Icon
                name={ready ? 'verified' : 'warning'}
                size={18}
                title={ready ? 'Steps configured' : 'Steps not configured'}
                className={ready ? 'text-success' : 'text-warning'}
              />
            </span>
          </div>
          <Switch
            label="Active"
            checked={activeChecked}
            isLoading={setActive.isPending}
            error={activeError ?? undefined}
            onCheckedChange={handleActiveChange}
          />
        </div>

        <TabSwitcher
          items={VIEW_ITEMS}
          value={session.mode}
          ariaLabel="Editor view"
          onChange={switchMode}
        />

        <SpecIssues issues={serverIssues} warnings={warnings} stepTitles={stepTitles} />
        {freshValidation?.failed ? (
          <FieldError message="The spec could not be checked. Changes can still be saved." />
        ) : null}
        <FieldError message={saveFailureMessage ?? undefined} />

        {session.mode === 'form' ? (
          <div className="flex flex-col gap-8">
            <ScenarioEditor
              value={scenarioValue}
              issues={fieldIssues}
              disabled={save.isPending}
              onChange={changeScenario}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
              <StepList
                steps={steps}
                selectedKey={selected?.key ?? ''}
                flaggedKeys={flaggedKeys}
                disabled={save.isPending}
                onSelect={selectStep}
                onReorder={reorderSteps}
                onAdd={addStep}
                onDuplicate={duplicateStep}
                onDelete={deleteStep}
              />
              {selected ? (
                <StepEditor
                  key={selected.key}
                  labId={labId}
                  entry={selected}
                  otherIds={otherIds}
                  issues={selectedIssues}
                  disabled={save.isPending}
                  onChange={updateStep}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Textarea
              label="Spec JSON"
              mono
              rows={28}
              spellCheck={false}
              value={session.jsonText}
              error={session.jsonError ?? undefined}
              disabled={save.isPending}
              onChange={(event) => patch({ jsonText: event.target.value, jsonError: null })}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                disabled={!jsonUnapplied}
                onClick={() => patch({ jsonText: specJson, jsonError: null })}
              >
                Discard edits
              </Button>
              <Button variant="secondary" disabled={!jsonUnapplied} onClick={applyJson}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={handleClose}
        title={lab?.labName ?? 'Lab step spec'}
        size="xl"
        dirty={dirty}
        busy={save.isPending}
        footer={footer}
      >
        {renderBody()}
      </Drawer>
    </>
  );
}
