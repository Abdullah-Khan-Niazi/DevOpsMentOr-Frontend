// Overlay stack: a single Escape handler and `inert` management for every
// modal surface (Drawer, Modal, ConfirmDialog). Only the top-most layer reacts
// to Escape, so Esc in a dialog opened over a drawer closes only the dialog.
// While any layer is open, `#root` and every lower layer are made `inert`; the
// toast viewport is its own body-level root and stays interactive.

interface OverlayLayer {
  id: number;
  onEscape: () => void;
  element: HTMLElement | null;
}

const layers: OverlayLayer[] = [];
let nextId = 1;
let listening = false;

function appRoot(): HTMLElement | null {
  return document.getElementById('root');
}

function syncInert() {
  const root = appRoot();
  if (root) {
    if (layers.length > 0) root.setAttribute('inert', '');
    else root.removeAttribute('inert');
  }
  layers.forEach((layer, index) => {
    if (!layer.element) return;
    if (index === layers.length - 1) layer.element.removeAttribute('inert');
    else layer.element.setAttribute('inert', '');
  });
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.defaultPrevented) return;
  const top = layers[layers.length - 1];
  if (!top) return;
  // A foreign popup (menu, listbox) that holds focus outside the layer handles its own Escape.
  const active = document.activeElement;
  if (top.element && active && active !== document.body && !top.element.contains(active)) {
    return;
  }
  event.preventDefault();
  top.onEscape();
}

function ensureListener() {
  if (listening || layers.length === 0) return;
  document.addEventListener('keydown', handleKeyDown);
  listening = true;
}

function releaseListener() {
  if (!listening || layers.length > 0) return;
  document.removeEventListener('keydown', handleKeyDown);
  listening = false;
}

export function pushOverlayLayer(onEscape: () => void, element: HTMLElement | null): number {
  const id = nextId++;
  layers.push({ id, onEscape, element });
  ensureListener();
  syncInert();
  return id;
}

export function updateOverlayLayer(
  id: number,
  patch: Partial<Pick<OverlayLayer, 'onEscape' | 'element'>>,
): void {
  const layer = layers.find((entry) => entry.id === id);
  if (!layer) return;
  Object.assign(layer, patch);
  syncInert();
}

export function removeOverlayLayer(id: number): void {
  const index = layers.findIndex((entry) => entry.id === id);
  if (index === -1) return;
  const [removed] = layers.splice(index, 1);
  removed.element?.removeAttribute('inert');
  syncInert();
  releaseListener();
}

export function isTopOverlayLayer(id: number): boolean {
  return layers[layers.length - 1]?.id === id;
}

export function hasOpenOverlay(): boolean {
  return layers.length > 0;
}
