import { Link } from 'react-router-dom';
import type { LessonDto } from '../types';

interface LessonBodyProps {
  lesson: LessonDto;
}

const ALL_LAB_SLUGS: string[] = [
  "01-os-linux-basics",
  "02-linux-filesystem-hierarchy",
  "03-cli-fundamentals",
  "04-package-management-vim",
  "05-users-groups-permissions",
  "06-pipes-redirection-shell-scripting",
  "07-networking-ssh-security",
  "m06-lab01-ephemeral-environment",
  "m06-lab02-network-bridging-env",
  "m06-lab03-diagnostics-telemetry",
  "m06-lab04-immutable-blueprint-dockerfile",
  "m06-lab05-data-persistence-volumes",
  "m06-lab06-docker-compose-orchestration",
  "m06-lab07-private-registry-gateway",
  "m06-lab08-deploying-nexus",
  "m09-lab01-control-plane-mechanics",
  "m09-lab02-declarative-topologies-services",
  "m09-lab03-state-secrets-volumes",
  "m09-lab04-namespaces-ingress-routing",
  "m09-lab05-api-security-rbac",
  "m09-lab06-production-hardening-probes",
  "m09-lab07-custom-helm-chart",
  "m09-lab08-helmfile-orchestration",
  "m12-lab01-execution-environment",
  "m12-lab02-deterministic-control-flow",
  "m12-lab03-structural-aggregation",
  "m12-lab04-iteration-functional-abstraction",
  "m12-lab05-anticipating-catastrophe",
  "m12-lab06-os-interface",
  "m12-lab07-data-serialization-json",
  "m12-lab08-architectural-modularity",
  "m12-lab09-object-oriented-infrastructure",
  "m12-lab10-advanced-execution-control",
  "m12-lab11-remote-api-gateway",
  "m12-lab12-infrastructure-as-a-service"
];

const MODULE_1_LAB_SLUGS: Record<number, string> = {
  1: '01-os-linux-basics',
  2: '02-linux-filesystem-hierarchy',
  3: '03-cli-fundamentals',
  4: '04-package-management-vim',
  5: '05-users-groups-permissions',
  6: '06-pipes-redirection-shell-scripting',
  7: '07-networking-ssh-security',
};

function resolveLabSlugForLesson(lesson: LessonDto): string {
  const text = `${lesson.title} ${lesson.content ?? ''}`.toLowerCase();
  for (const slug of ALL_LAB_SLUGS) {
    if (text.includes(slug)) {
      return slug;
    }
  }
  if (text.includes('filesystem') || text.includes('fhs')) {
    return '02-linux-filesystem-hierarchy';
  }
  if (text.includes('cli') || text.includes('file operations')) {
    return '03-cli-fundamentals';
  }
  if (text.includes('package') || text.includes('vim') || text.includes('nano')) {
    return '04-package-management-vim';
  }
  if (text.includes('users') || text.includes('groups') || text.includes('permissions')) {
    return '05-users-groups-permissions';
  }
  if (text.includes('pipes') || text.includes('redirection') || text.includes('scripting')) {
    return '06-pipes-redirection-shell-scripting';
  }
  if (text.includes('networking') || text.includes('ssh') || text.includes('security')) {
    return '07-networking-ssh-security';
  }
  return MODULE_1_LAB_SLUGS[lesson.lessonOrder] ?? '01-os-linux-basics';
}

/** F4 SCR-F4-06: renders text, video, or the DataCamp-style lab/interactive launcher. */
export function LessonBody({ lesson }: LessonBodyProps) {
  if (lesson.contentType === 'video') {
    return lesson.videoUrl ? (
      <video
        controls
        preload="metadata"
        className="w-full rounded-lg border border-border bg-black"
        aria-label={`Video: ${lesson.title}`}
      >
        <source src={lesson.videoUrl} />
        Your browser does not support the video tag.
      </video>
    ) : (
      <p className="text-sm text-muted">No video attached to this lesson yet.</p>
    );
  }

  if (lesson.contentType === 'lab' || lesson.contentType === 'interactive') {
    const labSlug = resolveLabSlugForLesson(lesson);
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded border border-border bg-paper-dim px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
              Hands-on Lab Exercise
            </span>
            <span className="font-mono text-xs text-muted-foreground">· Live Sandbox Environment</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">Estimated: ~45 min</span>
        </div>

        <div className="mt-4 space-y-3">
          <h3 className="text-base font-semibold text-card-foreground">{lesson.title}</h3>
          <p className="text-xs leading-relaxed text-muted">
            {lesson.content ??
              'Launch your isolated, full-root Linux container to practice guided exploration, unguided operational tasks, and break-fix incident remediation in real time.'}
          </p>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-paper p-3 space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phase 1
              </span>
              <p className="text-xs font-medium text-card-foreground">Guided System Exploration</p>
            </div>
            <div className="rounded-md border border-border bg-paper p-3 space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phase 2
              </span>
              <p className="text-xs font-medium text-card-foreground">Unguided Operational Tasks</p>
            </div>
            <div className="rounded-md border border-border bg-paper p-3 space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Phase 3
              </span>
              <p className="text-xs font-medium text-card-foreground">Break-Fix Remediation</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Interactive Web Terminal &amp; Automated Verification (/{labSlug})</span>
          </div>
          <Link
            to={`/labs/${labSlug}`}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-xs font-medium text-pearl-100 transition-opacity hover:opacity-90"
          >
            <span>Launch Lab Workspace</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="space-y-4 text-card-foreground">
      {lesson.content
        ?.split('\n')
        .filter((line) => line.trim())
        .map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {paragraph}
          </p>
        )) ?? <p className="text-sm text-muted">This lesson has no content yet.</p>}
    </article>
  );
}

export default LessonBody;
