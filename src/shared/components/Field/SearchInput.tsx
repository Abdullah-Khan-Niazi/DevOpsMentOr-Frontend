import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { Icon } from '@/shared/components/Icon';
import { IconButton } from '@/shared/components/IconButton';
import { cn } from '@/shared/utils';
import './Field.css';

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'size'
> {
  value: string;
  onValueChange: (next: string) => void;
  /** Accessible name (also the default placeholder). */
  label: string;
  /** Pressing `/` anywhere outside a text field focuses this input. */
  shortcut?: boolean;
  size?: 'sm' | 'md';
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.getAttribute('role') === 'textbox'
  );
}

/** Search field: leading icon, clear button, Esc clears, optional `/` shortcut. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      label,
      shortcut = false,
      size = 'md',
      className,
      placeholder,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    useEffect(() => {
      if (!shortcut) return;
      function handleKeyDown(event: globalThis.KeyboardEvent) {
        if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
        if (isTypingTarget(event.target)) return;
        const input = innerRef.current;
        if (!input || input.closest('[inert]')) return;
        event.preventDefault();
        input.focus();
        input.select();
      }
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcut]);

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'Escape' && value) {
        // Clearing consumes Esc so an enclosing drawer stays open.
        event.preventDefault();
        event.stopPropagation();
        onValueChange('');
      }
    }

    return (
      <div className={cn('field-search', size === 'sm' && 'field-search--sm', className)}>
        <Icon name="search" size={18} className="field-search__icon" />
        <input
          ref={innerRef}
          type="search"
          role="searchbox"
          aria-label={label}
          placeholder={placeholder ?? label}
          className="input-field"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          {...props}
        />
        {value ? (
          <IconButton
            icon="x"
            label="Clear search"
            size="sm"
            showTooltip={false}
            className="field-search__clear"
            onClick={() => {
              onValueChange('');
              innerRef.current?.focus();
            }}
          />
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
