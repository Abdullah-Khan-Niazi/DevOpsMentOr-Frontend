import { StringListField, type StringListFieldProps } from './StringListField';

// Shell commands (setup scripts, command lists): StringListField rows as monospace
// textareas, so multi-line commands stay readable and editable.

export type CommandListFieldProps = Omit<StringListFieldProps, 'multiline' | 'mono'>;

export function CommandListField(props: CommandListFieldProps) {
  return <StringListField {...props} multiline mono />;
}
