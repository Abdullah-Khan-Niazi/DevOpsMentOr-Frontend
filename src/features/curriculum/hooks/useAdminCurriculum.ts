import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminCurriculumService } from '../services';
import type {
  CreateLessonPayload,
  CreateModulePayload,
  CreateQuestionPayload,
  CreateQuizPayload,
  LessonOrderInput,
  ModuleOrderInput,
  UpdateCoursePayload,
  UpdateLessonPayload,
  UpdateModulePayload,
  UpdateQuestionPayload,
  UpdateQuizPayload,
} from '../types';

export function useAdminTags() {
  return useQuery({
    queryKey: QUERY_KEYS.curriculum.tags,
    queryFn: () => adminCurriculumService.getTags(),
    retry: false,
  });
}

export function useAdminCourse() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.curriculum.adminCourse,
    queryFn: () => adminCurriculumService.getCourse(),
    retry: false,
  });

  const update = useMutation({
    mutationFn: (payload: UpdateCoursePayload) => adminCurriculumService.updateCourse(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculum.adminCourse });
    },
  });

  return { query, update };
}

export function useAdminModules(params?: { search?: string; isPublished?: boolean }) {
  const queryKey = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: QUERY_KEYS.curriculum.adminModules(queryKey),
    queryFn: () => adminCurriculumService.getModules(params),
    retry: false,
  });
}

export function useAdminModuleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
  };

  const create = useMutation({
    mutationFn: (payload: CreateModulePayload) => adminCurriculumService.createModule(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (payload: { moduleId: number; data: UpdateModulePayload }) =>
      adminCurriculumService.updateModule(payload.moduleId, payload.data),
    onSuccess: invalidate,
  });
  const publish = useMutation({
    mutationFn: (moduleId: number) => adminCurriculumService.publishModule(moduleId),
    onSuccess: invalidate,
  });
  const archive = useMutation({
    mutationFn: (moduleId: number) => adminCurriculumService.archiveModule(moduleId),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (orders: ModuleOrderInput[]) => adminCurriculumService.reorderModules(orders),
    onSuccess: invalidate,
  });

  return { create, update, publish, archive, reorder };
}

export function useAdminModuleEditor(moduleId: string | number, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.curriculum.moduleEditor(moduleId),
    queryFn: () => adminCurriculumService.getModuleEditorData(moduleId),
    enabled: enabled && Boolean(moduleId),
    retry: false,
  });

  const invalidateModule = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculum.moduleEditor(moduleId) });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
  };

  const update = useMutation({
    mutationFn: (data: UpdateModulePayload) => adminCurriculumService.updateModule(moduleId, data),
    onSuccess: invalidateModule,
  });
  const publish = useMutation({
    mutationFn: () => adminCurriculumService.publishModule(moduleId),
    onSuccess: invalidateModule,
  });
  const archive = useMutation({
    mutationFn: () => adminCurriculumService.archiveModule(moduleId),
    onSuccess: invalidateModule,
  });
  const createLesson = useMutation({
    mutationFn: (payload: CreateLessonPayload) =>
      adminCurriculumService.createLesson(moduleId, payload),
    onSuccess: invalidateModule,
  });
  const updateLesson = useMutation({
    mutationFn: (payload: { lessonId: number; data: UpdateLessonPayload }) =>
      adminCurriculumService.updateLesson(payload.lessonId, payload.data),
    onSuccess: invalidateModule,
  });
  const publishLesson = useMutation({
    mutationFn: (lessonId: number) => adminCurriculumService.publishLesson(lessonId),
    onSuccess: invalidateModule,
  });
  const reorderLessons = useMutation({
    mutationFn: (orders: LessonOrderInput[]) =>
      adminCurriculumService.reorderLessons(moduleId, orders),
    onSuccess: invalidateModule,
  });
  const createQuiz = useMutation({
    mutationFn: (payload: CreateQuizPayload) =>
      adminCurriculumService.createQuiz(moduleId, payload),
    onSuccess: invalidateModule,
  });

  return {
    query,
    update,
    publish,
    archive,
    createLesson,
    updateLesson,
    publishLesson,
    reorderLessons,
    createQuiz,
  };
}

export function useAdminLessonEditor(lessonId: string | number, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.curriculum.lessonEditor(lessonId),
    queryFn: () => adminCurriculumService.getLessonEditorData(lessonId),
    enabled: enabled && Boolean(lessonId),
    retry: false,
  });

  const invalidateLesson = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculum.lessonEditor(lessonId) });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
  };

  const update = useMutation({
    mutationFn: (data: UpdateLessonPayload) => adminCurriculumService.updateLesson(lessonId, data),
    onSuccess: invalidateLesson,
  });
  const publish = useMutation({
    mutationFn: () => adminCurriculumService.publishLesson(lessonId),
    onSuccess: invalidateLesson,
  });
  const createForModule = useMutation({
    mutationFn: (payload: { moduleId: number; data: CreateLessonPayload }) =>
      adminCurriculumService.createLesson(payload.moduleId, payload.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
    },
  });

  return { query, update, publish, createForModule };
}

export function useAdminQuizEditor(quizId: string | number, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.curriculum.quizEditor(quizId),
    queryFn: () => adminCurriculumService.getQuizEditorData(quizId),
    enabled: enabled && Boolean(quizId),
    retry: false,
  });

  const invalidateQuiz = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.curriculum.quizEditor(quizId) });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'curriculum'] });
  };

  const update = useMutation({
    mutationFn: (data: UpdateQuizPayload) => adminCurriculumService.updateQuiz(quizId, data),
    onSuccess: invalidateQuiz,
  });
  const createQuestion = useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      adminCurriculumService.createQuestion(quizId, payload),
    onSuccess: invalidateQuiz,
  });
  const updateQuestion = useMutation({
    mutationFn: (payload: { questionId: number; data: UpdateQuestionPayload }) =>
      adminCurriculumService.updateQuestion(payload.questionId, payload.data),
    onSuccess: invalidateQuiz,
  });

  return { query, update, createQuestion, updateQuestion };
}
