import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { useUrlSearch, useUrlState } from '@/shared/hooks';
import type { PublishFilter } from '../../types/admin';

/**
 * URL state of the staff curriculum control panel (FE§3.1):
 * `?tab=`, `?q=`, `?status=`, `?course=` (modules tab) and `?drawer=<kind>:<id>`.
 * Exactly one drawer is open at a time.
 */

export const CURRICULUM_TABS = ['tracks', 'courses', 'modules'] as const;
export type CurriculumTab = (typeof CURRICULUM_TABS)[number];

const STATUS_VALUES = ['all', 'published', 'draft'] as const satisfies readonly PublishFilter[];

/**
 * Drawer kinds and the id each one carries:
 * - `track`, `course`, `module`, `lesson`, `lab-item`, `quiz`, `questions`, `lab-spec`: the entity id.
 * - `attach-course`: the track id.
 * - `course-new`: `0` (no parent).
 * - `module-new`: the course id.
 * - `lesson-new`, `lab-item-new`, `quiz-new`: the module id.
 */
export const CURRICULUM_DRAWER_KINDS = [
  'track',
  'attach-course',
  'course',
  'course-new',
  'module',
  'module-new',
  'lesson',
  'lesson-new',
  'lab-item',
  'lab-item-new',
  'quiz',
  'quiz-new',
  'questions',
  'lab-spec',
] as const;
export type CurriculumDrawerKind = (typeof CURRICULUM_DRAWER_KINDS)[number];

export interface CurriculumDrawer {
  kind: CurriculumDrawerKind;
  id: number;
}

const DRAWER_KIND_SET: ReadonlySet<string> = new Set(CURRICULUM_DRAWER_KINDS);
const ID_PATTERN = /^\d+$/;

/** Positive integer from a URL value, else null. */
function parseId(raw: string | null): number | null {
  if (raw === null || !ID_PATTERN.test(raw)) return null;
  const value = Number(raw);
  return value > 0 ? value : null;
}

/** Parses `kind:id`; unknown kinds and malformed ids yield null. */
export function parseCurriculumDrawer(raw: string | null): CurriculumDrawer | null {
  if (!raw) return null;
  const separator = raw.indexOf(':');
  if (separator < 0) return null;
  const kind = raw.slice(0, separator);
  const idText = raw.slice(separator + 1);
  if (!DRAWER_KIND_SET.has(kind) || !ID_PATTERN.test(idText)) return null;
  const id = Number(idText);
  if (id === 0 && kind !== 'course-new') return null;
  return { kind: kind as CurriculumDrawerKind, id };
}

/**
 * Legacy deep links (`?moduleId=`, `?lessonId=`, `?quizId=`, `?create=`,
 * `?edit=course`) mapped to the drawer param. Returns null when no legacy key
 * is present.
 */
export function translateLegacyCurriculumParams(params: URLSearchParams): URLSearchParams | null {
  const legacyKeys = ['moduleId', 'lessonId', 'quizId', 'create', 'edit'];
  if (!legacyKeys.some((key) => params.has(key))) return null;

  const moduleId = parseId(params.get('moduleId'));
  const lessonId = parseId(params.get('lessonId'));
  const quizId = parseId(params.get('quizId'));
  const courseId = parseId(params.get('course'));
  const create = params.get('create');

  let drawer: string | null = null;
  if (create === 'module' && courseId) {
    drawer = `module-new:${courseId}`;
  } else if ((create === 'lesson' || create === 'lab' || create === 'quiz') && moduleId) {
    const kind =
      create === 'lesson' ? 'lesson-new' : create === 'lab' ? 'lab-item-new' : 'quiz-new';
    drawer = `${kind}:${moduleId}`;
  } else if (lessonId) {
    drawer = params.get('type') === 'lab' ? `lab-item:${lessonId}` : `lesson:${lessonId}`;
  } else if (quizId) {
    drawer = `quiz:${quizId}`;
  } else if (moduleId) {
    drawer = `module:${moduleId}`;
  } else if (params.get('edit') === 'course' && courseId) {
    drawer = `course:${courseId}`;
  }

  const next = new URLSearchParams(params);
  ['moduleId', 'lessonId', 'quizId', 'create', 'edit', 'type', 'track'].forEach((key) =>
    next.delete(key),
  );
  if (drawer) next.set('drawer', drawer);
  return next;
}

/**
 * Legacy entity paths (`ADMIN_CURRICULUM_MODULE|LESSON|QUIZ`, rendered by the same
 * page) mapped to the drawer param. Returns null on the plain control panel path.
 */
export function legacyPathDrawer(
  routeParams: Readonly<Partial<Record<string, string>>>,
  params: URLSearchParams,
): string | null {
  const moduleId = parseId(routeParams.moduleId ?? null);
  const lessonId = parseId(routeParams.lessonId ?? null);
  const quizId = parseId(routeParams.quizId ?? null);
  if (lessonId) return params.get('type') === 'lab' ? `lab-item:${lessonId}` : `lesson:${lessonId}`;
  if (quizId) return `quiz:${quizId}`;
  if (moduleId) return `module:${moduleId}`;
  return null;
}

export function useCurriculumUrlState() {
  const routeParams = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useUrlState<CurriculumTab>('tab', CURRICULUM_TABS, 'tracks');
  const [status, setStatus] = useUrlState<PublishFilter>('status', STATUS_VALUES, 'all');
  const search = useUrlSearch('q');

  const courseId = parseId(searchParams.get('course'));
  const drawer = parseCurriculumDrawer(searchParams.get('drawer'));

  // Legacy paths and params are translated once per mount (replace, so Back never
  // returns to them). Entity paths move to the control panel path.
  const legacyChecked = useRef(false);
  useEffect(() => {
    if (legacyChecked.current) return;
    legacyChecked.current = true;
    const translated = translateLegacyCurriculumParams(searchParams);
    const pathDrawer = legacyPathDrawer(routeParams, searchParams);
    if (pathDrawer) {
      const next = translated ?? new URLSearchParams(searchParams);
      next.delete('type');
      next.set('drawer', pathDrawer);
      navigate(
        { pathname: ROUTES.ADMIN_CURRICULUM, search: `?${next.toString()}` },
        { replace: true },
      );
      return;
    }
    if (translated) setSearchParams(translated, { replace: true });
  }, [navigate, routeParams, searchParams, setSearchParams]);

  const openDrawer = useCallback(
    (kind: CurriculumDrawerKind, id: number) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set('drawer', `${kind}:${id}`);
        return params;
      });
    },
    [setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.delete('drawer');
      return params;
    });
  }, [setSearchParams]);

  const setCourseId = useCallback(
    (next: number | null) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next && next > 0) params.set('course', String(next));
        else params.delete('course');
        return params;
      });
    },
    [setSearchParams],
  );

  return {
    tab,
    setTab,
    status,
    setStatus,
    /** Live input value of the search field. */
    searchValue: search.value,
    setSearchValue: search.setValue,
    /** Debounced, trimmed search text the tree filters and queries with. */
    debouncedSearch: search.debouncedValue,
    courseId,
    setCourseId,
    drawer,
    openDrawer,
    closeDrawer,
  };
}
