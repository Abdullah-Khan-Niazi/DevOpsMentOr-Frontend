export type ThemeMode = 'light' | 'dark' | 'system';

export interface SelectOption<T extends string | number = string> {
  label: string;
  value: T;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
