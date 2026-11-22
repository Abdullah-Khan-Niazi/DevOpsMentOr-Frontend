import type { ReactNode } from 'react';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  action?: ToastAction;
  durationMs?: number;
  /** Dedupe key: a toast with the same id replaces the visible one. */
  id?: string;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: ReactNode;
  action?: ToastAction;
  durationMs: number;
  createdAt: number;
  exiting: boolean;
}

const MAX_VISIBLE = 3;
const DEDUPE_WINDOW_MS = 1000;
const EXIT_MS = 180;
const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  success: 4500,
  info: 4500,
  warning: 6000,
  error: 7000,
};

interface ToastState {
  items: ToastItem[];
  push: (type: ToastType, message: ReactNode, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (type, message, options = {}) => {
    const now = Date.now();
    const items = get().items;

    // Identical text within 1 s (double submits, parallel failures) shows once.
    if (!options.id && typeof message === 'string') {
      const duplicate = items.find(
        (item) =>
          !item.exiting &&
          item.type === type &&
          item.message === message &&
          now - item.createdAt < DEDUPE_WINDOW_MS,
      );
      if (duplicate) return duplicate.id;
    }

    const id = options.id ?? `toast-${nextId++}`;
    const item: ToastItem = {
      id,
      type,
      message,
      action: options.action,
      durationMs: options.durationMs ?? (options.action ? 8000 : DEFAULT_DURATION_MS[type]),
      createdAt: now,
      exiting: false,
    };

    const next = [...items.filter((entry) => entry.id !== id), item];
    // Keep at most MAX_VISIBLE live toasts; the oldest leave first (with the exit fade).
    const live = next.filter((entry) => !entry.exiting);
    const evicted = new Set(
      live.slice(0, Math.max(0, live.length - MAX_VISIBLE)).map((entry) => entry.id),
    );
    set({
      items: next.map((entry) => (evicted.has(entry.id) ? { ...entry, exiting: true } : entry)),
    });
    evicted.forEach((evictedId) => window.setTimeout(() => get().remove(evictedId), EXIT_MS));

    return id;
  },
  dismiss: (id) => {
    const target = get().items.find((item) => item.id === id);
    if (!target || target.exiting) return;
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, exiting: true } : item)),
    }));
    window.setTimeout(() => get().remove(id), EXIT_MS);
  },
  // Only exiting entries are removed, so a toast re-pushed with the same id survives an old timer.
  remove: (id) =>
    set((state) => ({ items: state.items.filter((item) => !(item.id === id && item.exiting)) })),
}));
