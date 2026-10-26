import { create } from 'zustand';

/**
 * Reactive workspace-context store.
 *
 * Replaces the previous pattern where WorkspaceSwitcher, AppChrome and
 * DashboardPage each read `localStorage('stardust_active_workspace')` during
 * render. That made context switches invisible to already-mounted consumers
 * (and to other tabs) until a full reload. This store is the single reactive
 * source of truth: switching updates every subscriber in this tab instantly,
 * persists for reloads, and broadcasts to other tabs via BroadcastChannel.
 */

const WORKSPACE_STORAGE_KEY = 'stardust_active_workspace';
const WORKSPACE_CHANNEL = 'workspace_sync';

export type WorkspaceMode = 'default' | 'personal' | 'org' | 'class' | 'platform';

interface WorkspaceState {
  activeWorkspace: WorkspaceMode;
  /** Switch workspace everywhere: this tab, persisted storage, other tabs. */
  setActiveWorkspace: (mode: WorkspaceMode) => void;
  /** Clear persisted workspace selection (logout / session end). */
  clearWorkspace: () => void;
}

function readStoredWorkspace(): WorkspaceMode {
  try {
    return (localStorage.getItem(WORKSPACE_STORAGE_KEY) as WorkspaceMode) || 'default';
  } catch {
    return 'default';
  }
}

function broadcast(message: {
  type: 'WORKSPACE_CHANGE' | 'WORKSPACE_CLEAR';
  mode?: WorkspaceMode;
}) {
  try {
    const channel = new BroadcastChannel(WORKSPACE_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // BroadcastChannel unavailable in this environment
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: readStoredWorkspace(),
  setActiveWorkspace: (mode) => {
    set({ activeWorkspace: mode });
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, mode);
    } catch {
      // storage quota or private mode
    }
    broadcast({ type: 'WORKSPACE_CHANGE', mode });
  },
  clearWorkspace: () => {
    set({ activeWorkspace: 'default' });
    try {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    broadcast({ type: 'WORKSPACE_CLEAR' });
  },
}));

// ─── Cross-tab / cross-window sync (subscribed once at module load) ──────────
// Inbound updates set state directly (not via the actions) so they never
// re-broadcast and cause loops. The `storage` event is the fallback for
// browsers without BroadcastChannel.
if (typeof window !== 'undefined') {
  try {
    const channel = new BroadcastChannel(WORKSPACE_CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; mode?: WorkspaceMode } | null;
      if (data?.type === 'WORKSPACE_CHANGE' && data.mode) {
        useWorkspaceStore.setState({ activeWorkspace: data.mode });
      } else if (data?.type === 'WORKSPACE_CLEAR') {
        useWorkspaceStore.setState({ activeWorkspace: 'default' });
      }
    };
  } catch {
    // BroadcastChannel unavailable in this environment
  }

  window.addEventListener('storage', (event) => {
    if (event.key === WORKSPACE_STORAGE_KEY) {
      useWorkspaceStore.setState({ activeWorkspace: readStoredWorkspace() });
    }
  });
}
