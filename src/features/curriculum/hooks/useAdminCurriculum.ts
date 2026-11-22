import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { useOptimisticMutation, type UseOptimisticMutationOptions } from '@/shared/hooks';
import { adminCurriculumService } from '../services';
import type {
  AdminCourseDetailDto,
  AdminCourseDto,
  AdminCourseListItemDto,
  AdminCourseListParams,
  AdminLessonDto,
  AdminModuleDetailDto,
  AdminModuleDto,
  AdminModuleItemDto,
  AdminModuleListParams,
  AdminQuestionDto,
  AdminQuizDetailDto,
  CreateCoursePayload,
  CreateModuleItemPayload,
  CreateModulePayload,
  CreateQuestionPayload,
  UpdateCoursePayload,
  UpdateLessonPayload,
  UpdateModulePayload,
  UpdateQuestionPayload,
  UpdateQuizPayload,
} from '../types/admin';

/**
 * Stable string form of list params, used as the cache key segment. Key order,
 * empty values and `status: 'all'` (the server default) do not change it, so an
 * optimistic write lands on the same entry the list query reads.
 */
function paramsKey(params: object | undefined): string {
  const entries = Object.entries(params ?? {})
    .filter(
      ([key, value]) =>
        value !== undefined && value !== '' && !(key === 'status' && value === 'all'),
    )
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(entries));
}

function courseModulesKey(courseId: number, params?: AdminModuleListParams) {
  return [...QUERY_KEYS.curriculumAdmin.courseModules(courseId), paramsKey(params)] as const;
}

/**
 * Prefix of every staff track query (list and details). Course publish, delete
 * and module changes alter the track content rows (title, isPublished, counts).
 */
const ADMIN_TRACKS_ROOT = QUERY_KEYS.adminLabs.trackList.slice(0, 2);

/**
 * Error feedback for a publish switch. Default: the server message as a toast.
 * Pass `errorMessage: false` plus `onError` to render `COURSE_EMPTY`,
 * `PUBLISH_PARENT_FIRST`, `LAB_NOT_READY` or `QUIZ_EMPTY` inline instead.
 */
export type PublishFeedback<TVars> = Pick<
  UseOptimisticMutationOptions<TVars, unknown, unknown>,
  'errorMessage' | 'onError'
>;

/**
 * Which cached module list an optimistic module change writes to:
 * `{ list: params }` is the Modules tab list queried with those exact params;
 * omitted, the course detail `modules` (Courses/Tracks tab tree and the course
 * drawer). The other one is refetched after the mutation settles.
 */
export interface ModuleCacheTarget {
  list?: AdminModuleListParams;
}

function applyToModules(
  apply: (modules: AdminModuleDto[]) => AdminModuleDto[],
): (old: AdminModuleDto[] | AdminCourseDetailDto | undefined) => typeof old {
  return (old) => {
    if (!old) return old;
    return Array.isArray(old) ? apply(old) : { ...old, modules: apply(old.modules) };
  };
}

function moduleCacheKey(courseId: number, target: ModuleCacheTarget) {
  return target.list
    ? courseModulesKey(courseId, target.list)
    : QUERY_KEYS.curriculumAdmin.course(courseId);
}

/** Reorders `items` to the id sequence `ids` (ids are the exact full set). */
function orderByIds<T>(items: T[], ids: number[], idOf: (item: T) => number): T[] {
  const byId = new Map(items.map((item) => [idOf(item), item] as const));
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

/* ── Queries ───────────────────────────────────────────────────────────── */

export function useAdminCourses(params: AdminCourseListParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.courses(paramsKey(params)),
    queryFn: () => adminCurriculumService.listCourses(params),
    retry: false,
  });
}

/** Course detail: the course plus its modules (`{ course, modules }`). */
export function useAdminCourse(courseId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.course(courseId),
    queryFn: () => adminCurriculumService.getCourse(courseId),
    enabled: enabled && Boolean(courseId),
    retry: false,
  });
}

export function useAdminCourseModules(
  courseId: number,
  params: AdminModuleListParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: courseModulesKey(courseId, params),
    queryFn: () => adminCurriculumService.listCourseModules(courseId, params),
    enabled: enabled && Boolean(courseId),
    retry: false,
  });
}

/** Module detail: `{ module, items }`. */
export function useAdminModule(moduleId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.module(moduleId),
    queryFn: () => adminCurriculumService.getModule(moduleId),
    enabled: enabled && Boolean(moduleId),
    retry: false,
  });
}

export function useAdminLesson(lessonId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.lesson(lessonId),
    queryFn: () => adminCurriculumService.getLesson(lessonId),
    enabled: enabled && Boolean(lessonId),
    retry: false,
  });
}

export function useAdminQuiz(quizId: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.quiz(quizId),
    queryFn: () => adminCurriculumService.getQuiz(quizId),
    enabled: enabled && Boolean(quizId),
    retry: false,
  });
}

const REFERENCE_STALE_MS = 10 * 60 * 1000;

/** Lesson tags (`GET /admin/curriculum/tags`). */
export function useAdminTags() {
  return useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.tags,
    queryFn: () => adminCurriculumService.listTags(),
    retry: false,
    staleTime: REFERENCE_STALE_MS,
  });
}

/** Tags, difficulties and categories for the staff drawers. */
export function useCurriculumReferenceData() {
  const tags = useAdminTags();
  const difficulties = useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.difficulties,
    queryFn: () => adminCurriculumService.listDifficulties(),
    retry: false,
    staleTime: REFERENCE_STALE_MS,
  });
  const categories = useQuery({
    queryKey: QUERY_KEYS.curriculumAdmin.categories,
    queryFn: () => adminCurriculumService.listCategories(),
    retry: false,
    staleTime: REFERENCE_STALE_MS,
  });

  return { tags, difficulties, categories };
}

/* ── Courses ───────────────────────────────────────────────────────────── */

/** Creates a DRAFT course; not optimistic (the id comes from the server). */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => adminCurriculumService.createCourse(payload),
    onSuccess: (course) => {
      queryClient.setQueryData<AdminCourseDetailDto>(
        QUERY_KEYS.curriculumAdmin.course(course.courseId),
        { course, modules: [] },
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculumAdmin.all });
    },
  });
}

/** Course field save. The detail cache takes the response; lists and tracks refetch. */
export function useUpdateCourse(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoursePayload) =>
      adminCurriculumService.updateCourse(courseId, payload),
    onSuccess: (course) => {
      queryClient.setQueryData<AdminCourseDetailDto>(
        QUERY_KEYS.curriculumAdmin.course(courseId),
        (old) => (old ? { ...old, course } : old),
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculumAdmin.all });
      void queryClient.invalidateQueries({ queryKey: ADMIN_TRACKS_ROOT });
    },
  });
}

/**
 * Publish switch for a course. `true` publishes (409 `COURSE_EMPTY` without a
 * published module), `false` archives (unpublishes). Optimistic on the course
 * list cache queried with `listParams`.
 */
export function useSetCoursePublished(
  courseId: number,
  listParams: AdminCourseListParams = {},
  feedback: PublishFeedback<boolean> = {},
) {
  return useOptimisticMutation<boolean, AdminCourseDto, AdminCourseListItemDto[]>({
    mutationFn: (isPublished) =>
      isPublished
        ? adminCurriculumService.updateCourse(courseId, { isPublished: true })
        : adminCurriculumService.archiveCourse(courseId),
    queryKey: QUERY_KEYS.curriculumAdmin.courses(paramsKey(listParams)),
    apply: (old, isPublished) =>
      old?.map((course) => (course.courseId === courseId ? { ...course, isPublished } : course)),
    invalidate: [QUERY_KEYS.curriculumAdmin.course(courseId), ADMIN_TRACKS_ROOT],
    ...feedback,
  });
}

/**
 * Deletes a course; optimistic on the course list queried with `listParams`.
 * Errors are not toasted: `DeleteEntityDialog` shows 409
 * `COURSE_HAS_LEARNER_DATA` / `COURSE_ASSIGNED` inline and toasts the rest.
 */
export function useDeleteCourse(listParams: AdminCourseListParams = {}) {
  return useOptimisticMutation<number, void, AdminCourseListItemDto[]>({
    mutationFn: (courseId) => adminCurriculumService.deleteCourse(courseId),
    queryKey: QUERY_KEYS.curriculumAdmin.courses(paramsKey(listParams)),
    apply: (old, courseId) => old?.filter((course) => course.courseId !== courseId),
    invalidate: [QUERY_KEYS.curriculumAdmin.all, ADMIN_TRACKS_ROOT],
    errorMessage: false,
  });
}

/* ── Modules ───────────────────────────────────────────────────────────── */

/** Appends a module to the course; not optimistic. */
export function useCreateModule(courseId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateModulePayload) =>
      adminCurriculumService.createModule(courseId, payload),
    onSuccess: (module) => {
      queryClient.setQueryData<AdminCourseDetailDto>(
        QUERY_KEYS.curriculumAdmin.course(courseId),
        (old) => (old ? { ...old, modules: [...old.modules, module] } : old),
      );
      // Course detail, the course's module lists and the course list counts.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculumAdmin.all });
      void queryClient.invalidateQueries({ queryKey: ADMIN_TRACKS_ROOT });
    },
  });
}

/** Module field save. The detail cache takes the response; the course's lists refetch. */
export function useUpdateModule(moduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateModulePayload) =>
      adminCurriculumService.updateModule(moduleId, payload),
    onSuccess: (module) => {
      queryClient.setQueryData<AdminModuleDetailDto>(
        QUERY_KEYS.curriculumAdmin.module(moduleId),
        (old) => (old ? { ...old, module } : old),
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.curriculumAdmin.course(module.courseId),
      });
    },
  });
}

/**
 * Publish switch for a module. `true` publishes, `false` archives (unpublishes
 * the module and its items). Optimistic on the module list named by `target`.
 */
export function useSetModulePublished(
  courseId: number,
  moduleId: number,
  target: ModuleCacheTarget = {},
  feedback: PublishFeedback<boolean> = {},
) {
  return useOptimisticMutation<boolean, AdminModuleDto, AdminModuleDto[] | AdminCourseDetailDto>({
    mutationFn: (isPublished) =>
      isPublished
        ? adminCurriculumService.publishModule(moduleId)
        : adminCurriculumService.archiveModule(moduleId),
    queryKey: moduleCacheKey(courseId, target),
    apply: (old, isPublished) =>
      applyToModules((modules) =>
        modules.map((module) =>
          module.moduleId === moduleId ? { ...module, isPublished } : module,
        ),
      )(old),
    invalidate: [
      QUERY_KEYS.curriculumAdmin.course(courseId),
      QUERY_KEYS.curriculumAdmin.module(moduleId),
    ],
    ...feedback,
  });
}

/**
 * Reorders the course's modules (exact full set, else 422
 * `REORDER_SET_MISMATCH`). Optimistic on the list named by `target` (default:
 * the course detail `modules` that the course drawer edits).
 */
export function useReorderModules(courseId: number, target: ModuleCacheTarget = {}) {
  return useOptimisticMutation<number[], AdminModuleDto[], AdminModuleDto[] | AdminCourseDetailDto>(
    {
      mutationFn: (moduleIds) => adminCurriculumService.reorderModules(courseId, moduleIds),
      queryKey: moduleCacheKey(courseId, target),
      apply: (old, moduleIds) =>
        applyToModules((modules) =>
          orderByIds(modules, moduleIds, (module) => module.moduleId).map((module, index) => ({
            ...module,
            moduleOrder: index + 1,
          })),
        )(old),
      invalidate: [QUERY_KEYS.curriculumAdmin.course(courseId), ADMIN_TRACKS_ROOT],
    },
  );
}

/**
 * Deletes a module; optimistic on the list named by `target`. Errors are not
 * toasted: `DeleteEntityDialog` shows 409 `MODULE_HAS_LEARNER_DATA` inline.
 */
export function useDeleteModule(courseId: number, target: ModuleCacheTarget = {}) {
  return useOptimisticMutation<number, void, AdminModuleDto[] | AdminCourseDetailDto>({
    mutationFn: (moduleId) => adminCurriculumService.deleteModule(moduleId),
    queryKey: moduleCacheKey(courseId, target),
    apply: (old, moduleId) =>
      applyToModules((modules) => modules.filter((module) => module.moduleId !== moduleId))(old),
    invalidate: [QUERY_KEYS.curriculumAdmin.all, ADMIN_TRACKS_ROOT],
    errorMessage: false,
  });
}

/* ── Module items (lesson / lab / quiz spine rows) ─────────────────────── */

/** Creates a draft item (lesson, lab or quiz) and appends it; not optimistic. */
export function useCreateItem(moduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateModuleItemPayload) =>
      adminCurriculumService.createItem(moduleId, payload),
    onSuccess: (item) => {
      queryClient.setQueryData<AdminModuleDetailDto>(
        QUERY_KEYS.curriculumAdmin.module(moduleId),
        (old) => (old ? { ...old, items: [...old.items, item] } : old),
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculumAdmin.all });
      void queryClient.invalidateQueries({ queryKey: ADMIN_TRACKS_ROOT });
    },
  });
}

/**
 * Writes the item title (the only edit for lab items; for quiz items the
 * server also renames the quiz). The module cache takes the response.
 */
export function useUpdateItemTitle(moduleId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, title }: { itemId: number; title: string }) =>
      adminCurriculumService.updateItemTitle(itemId, title),
    onSuccess: (item) => {
      queryClient.setQueryData<AdminModuleDetailDto>(
        QUERY_KEYS.curriculumAdmin.module(moduleId),
        (old) =>
          old && {
            ...old,
            items: old.items.map((existing) => (existing.itemId === item.itemId ? item : existing)),
          },
      );
      if (item.quiz) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.curriculumAdmin.quiz(item.quiz.quizId),
        });
      }
    },
  });
}

/**
 * Publish switch for an item. Optimistic on the module detail cache. Refusals:
 * 409 `PUBLISH_PARENT_FIRST`, `LAB_NOT_READY` (lab items), `QUIZ_EMPTY` (quiz items).
 */
export function useSetItemPublished(
  moduleId: number,
  feedback: PublishFeedback<{ itemId: number; isPublished: boolean }> = {},
) {
  return useOptimisticMutation<
    { itemId: number; isPublished: boolean },
    AdminModuleItemDto,
    AdminModuleDetailDto
  >({
    mutationFn: ({ itemId, isPublished }) =>
      adminCurriculumService.publishItem(itemId, isPublished),
    queryKey: QUERY_KEYS.curriculumAdmin.module(moduleId),
    apply: (old, { itemId, isPublished }) =>
      old && {
        ...old,
        items: old.items.map((item) => (item.itemId === itemId ? { ...item, isPublished } : item)),
      },
    invalidate: [QUERY_KEYS.curriculumAdmin.all],
    ...feedback,
  });
}

/** Reorders the module's items (exact full set). Item slugs are recomputed server side. */
export function useReorderItems(moduleId: number) {
  return useOptimisticMutation<number[], AdminModuleItemDto[], AdminModuleDetailDto>({
    mutationFn: (itemIds) => adminCurriculumService.reorderItems(moduleId, itemIds),
    queryKey: QUERY_KEYS.curriculumAdmin.module(moduleId),
    apply: (old, itemIds) =>
      old && {
        ...old,
        items: orderByIds(old.items, itemIds, (item) => item.itemId).map((item, index) => ({
          ...item,
          position: index + 1,
        })),
      },
  });
}

/**
 * Deletes an item: a lesson row, a lab item (spine row) or a quiz (with its
 * questions). Errors are not toasted: `DeleteEntityDialog` shows 409
 * `ITEM_HAS_LEARNER_DATA` inline.
 */
export function useDeleteItem(moduleId: number) {
  return useOptimisticMutation<number, void, AdminModuleDetailDto>({
    mutationFn: (itemId) => adminCurriculumService.deleteItem(itemId),
    queryKey: QUERY_KEYS.curriculumAdmin.module(moduleId),
    apply: (old, itemId) =>
      old && { ...old, items: old.items.filter((item) => item.itemId !== itemId) },
    invalidate: [QUERY_KEYS.curriculumAdmin.all, ADMIN_TRACKS_ROOT],
    errorMessage: false,
  });
}

/* ── Lessons ───────────────────────────────────────────────────────────── */

export function useUpdateLesson(lessonId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLessonPayload) =>
      adminCurriculumService.updateLesson(lessonId, payload),
    onSuccess: (lesson) => {
      queryClient.setQueryData<AdminLessonDto>(QUERY_KEYS.curriculumAdmin.lesson(lessonId), lesson);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.curriculumAdmin.module(lesson.moduleId),
      });
    },
  });
}

/* ── Quizzes and questions ─────────────────────────────────────────────── */

/** Quiz title/settings save. A title change also renames the module item. */
export function useUpdateQuiz(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateQuizPayload) => adminCurriculumService.updateQuiz(quizId, payload),
    onSuccess: (quiz) => {
      queryClient.setQueryData<AdminQuizDetailDto>(QUERY_KEYS.curriculumAdmin.quiz(quizId), quiz);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.curriculumAdmin.module(quiz.moduleId),
      });
    },
  });
}

/**
 * Deletes a quiz and its module item (409 `QUIZ_HAS_ATTEMPTS` rolls back).
 * The control panel deletes quizzes through `useDeleteItem`; errors are left
 * to `DeleteEntityDialog`.
 */
export function useDeleteQuiz(moduleId: number) {
  return useOptimisticMutation<number, void, AdminModuleDetailDto>({
    mutationFn: (quizId) => adminCurriculumService.deleteQuiz(quizId),
    queryKey: QUERY_KEYS.curriculumAdmin.module(moduleId),
    apply: (old, quizId) =>
      old && { ...old, items: old.items.filter((item) => item.quiz?.quizId !== quizId) },
    invalidate: [QUERY_KEYS.curriculumAdmin.all, ADMIN_TRACKS_ROOT],
    errorMessage: false,
  });
}

/** Appends a question to the quiz; not optimistic. */
export function useCreateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      adminCurriculumService.createQuestion(quizId, payload),
    onSuccess: (question) => {
      queryClient.setQueryData<AdminQuizDetailDto>(
        QUERY_KEYS.curriculumAdmin.quiz(quizId),
        (old) =>
          old && {
            ...old,
            questions: [...old.questions, question],
            questionCount: old.questionCount + 1,
          },
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculumAdmin.all });
    },
  });
}

/** Question save. Cache updated from the response. */
export function useUpdateQuestion(quizId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: number; payload: UpdateQuestionPayload }) =>
      adminCurriculumService.updateQuestion(questionId, payload),
    onSuccess: (question: AdminQuestionDto) => {
      queryClient.setQueryData<AdminQuizDetailDto>(
        QUERY_KEYS.curriculumAdmin.quiz(quizId),
        (old) =>
          old && {
            ...old,
            questions: old.questions.map((existing) =>
              existing.questionId === question.questionId ? question : existing,
            ),
          },
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculumAdmin.all });
    },
  });
}

/**
 * Deletes a question (409 `QUESTION_HAS_ANSWERS` rolls back; staff deactivate
 * instead). Errors are left to `DeleteEntityDialog`.
 */
export function useDeleteQuestion(quizId: number) {
  return useOptimisticMutation<number, void, AdminQuizDetailDto>({
    mutationFn: (questionId) => adminCurriculumService.deleteQuestion(questionId),
    queryKey: QUERY_KEYS.curriculumAdmin.quiz(quizId),
    apply: (old, questionId) => {
      if (!old) return old;
      const questions = old.questions.filter((question) => question.questionId !== questionId);
      const removed = questions.length !== old.questions.length;
      return { ...old, questions, questionCount: old.questionCount - (removed ? 1 : 0) };
    },
    invalidate: [QUERY_KEYS.curriculumAdmin.all],
    errorMessage: false,
  });
}

export function useReorderQuestions(quizId: number) {
  return useOptimisticMutation<number[], AdminQuestionDto[], AdminQuizDetailDto>({
    mutationFn: (questionIds) => adminCurriculumService.reorderQuestions(quizId, questionIds),
    queryKey: QUERY_KEYS.curriculumAdmin.quiz(quizId),
    apply: (old, questionIds) =>
      old && {
        ...old,
        questions: orderByIds(old.questions, questionIds, (question) => question.questionId).map(
          (question, index) => ({ ...question, questionOrder: index + 1 }),
        ),
      },
  });
}
