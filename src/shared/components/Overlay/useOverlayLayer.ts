import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { pushOverlayLayer, removeOverlayLayer, updateOverlayLayer } from './overlayStack';

/**
 * Registers an open overlay in the shared stack. Escape calls `onEscape` only
 * when this overlay is the top-most one. Pass the overlay root element ref so
 * lower layers (and `#root`) become `inert` while it is on top.
 */
export function useOverlayLayer(
  open: boolean,
  onEscape: () => void,
  elementRef?: RefObject<HTMLElement | null>,
): void {
  const onEscapeRef = useRef(onEscape);
  const layerIdRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!open) return;
    const id = pushOverlayLayer(() => onEscapeRef.current(), elementRef?.current ?? null);
    layerIdRef.current = id;
    return () => {
      removeOverlayLayer(id);
      layerIdRef.current = null;
    };
  }, [open, elementRef]);

  // The element can mount after the layer is pushed (portal render order).
  useEffect(() => {
    const id = layerIdRef.current;
    if (id === null || !elementRef) return;
    updateOverlayLayer(id, { element: elementRef.current });
  });
}
