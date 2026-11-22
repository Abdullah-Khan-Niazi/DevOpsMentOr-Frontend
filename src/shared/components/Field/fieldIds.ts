/** Ids for a field's error and hint elements (same scheme as `Input`). */
export function fieldIds(fieldId: string | undefined) {
  return {
    errorId: fieldId ? `${fieldId}-error` : undefined,
    hintId: fieldId ? `${fieldId}-hint` : undefined,
  };
}
