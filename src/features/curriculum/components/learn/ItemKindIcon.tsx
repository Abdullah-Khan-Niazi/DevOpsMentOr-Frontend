import { Icon, type IconName } from '@/shared/components';
import type { ContentType, ModuleItemKind } from '@/features/curriculum/types';

interface ItemKindIconProps {
  kind: ModuleItemKind;
  /** Lesson content type; picks the icon for lesson items (text, video or slides). */
  contentType?: ContentType;
  selected?: boolean;
  size?: number;
}

function iconFor(kind: ModuleItemKind, contentType?: ContentType): IconName {
  if (kind === 'lab') return 'lab';
  if (kind === 'quiz') return 'quiz';
  if (contentType === 'video') return 'video';
  if (contentType === 'interactive') return 'slides';
  return 'lesson';
}

/** Icon for a module item (lesson text, video, slides, lab or quiz). Decorative: the row carries the name. */
export function ItemKindIcon({
  kind,
  contentType,
  selected = false,
  size = 20,
}: ItemKindIconProps) {
  return (
    <Icon name={iconFor(kind, contentType)} size={size} selected={selected} className="shrink-0" />
  );
}
