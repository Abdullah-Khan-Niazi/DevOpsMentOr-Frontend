import { useId } from 'react';
import { FieldError, NumberInput, TabSwitcher, type TabSwitcherItem } from '@/shared/components';
import type { LabMode } from '@/features/labs/types/labSpec';
import { CommandListField } from '../fields/CommandListField';
import { MarkdownField } from '../fields/MarkdownField';
import {
  MAX_INSTRUCTIONS_LENGTH,
  MAX_SCENARIO_SETUP,
  MAX_SETUP_COMMAND_LENGTH,
} from './labSpecSchema';

// Scenario section of the lab spec: mode, intro, scenario setup commands and the
// completion bonus. Controlled; `issues` are messages keyed by full spec path.

export interface ScenarioValue {
  mode: LabMode;
  intro: string;
  setup: string[];
  completionBonus: number;
}

export interface ScenarioEditorProps {
  value: ScenarioValue;
  onChange: (next: ScenarioValue) => void;
  issues: Record<string, string>;
  disabled?: boolean;
}

const MODE_ITEMS: ReadonlyArray<TabSwitcherItem<LabMode>> = [
  { id: 'guided', label: 'Guided' },
  { id: 'break_fix', label: 'Break-fix' },
];

export function ScenarioEditor({ value, onChange, issues, disabled = false }: ScenarioEditorProps) {
  const idPrefix = `scenario-${useId()}`;
  const setupRowErrors = value.setup.map((_, index) => issues[`scenario.setup.${index}`]);

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-base font-semibold text-card-foreground">Scenario</h3>

      <div className="flex flex-col gap-2">
        <span className="input-label">Mode</span>
        <TabSwitcher
          items={MODE_ITEMS}
          value={value.mode}
          ariaLabel="Lab mode"
          onChange={(mode) => onChange({ ...value, mode })}
        />
        <FieldError id={`${idPrefix}-mode-error`} message={issues.mode} />
      </div>

      <MarkdownField
        id={`${idPrefix}-intro`}
        label="Introduction"
        value={value.intro}
        maxLength={MAX_INSTRUCTIONS_LENGTH}
        rows={6}
        disabled={disabled}
        error={issues['scenario.intro']}
        onChange={(intro) => onChange({ ...value, intro })}
      />

      <CommandListField
        id={`${idPrefix}-setup`}
        label="Setup commands"
        values={value.setup}
        maxItems={MAX_SCENARIO_SETUP}
        maxLength={MAX_SETUP_COMMAND_LENGTH}
        addLabel="Add setup command"
        errors={setupRowErrors}
        error={issues['scenario.setup']}
        disabled={disabled}
        onChange={(setup) => onChange({ ...value, setup })}
      />

      <NumberInput
        id={`${idPrefix}-bonus`}
        label="Completion bonus"
        name="completionBonus"
        value={value.completionBonus}
        disabled={disabled}
        error={issues.completionBonus}
        onValueChange={(next) => onChange({ ...value, completionBonus: next ?? Number.NaN })}
      />
    </section>
  );
}
