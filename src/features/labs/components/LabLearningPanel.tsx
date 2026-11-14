import { useState } from 'react';
import { Button } from '@/shared/components';
import { LAB_CONTENT_BY_SLUG } from './labContentCatalog';

interface LabLearningPanelProps {
  labSlug: string;
  labName: string;
  assertions: Array<{ name: string; passed: boolean; message: string | null }>;
  isChecking: boolean;
  hasRunChecks: boolean;
  onRunChecks: () => void;
}

const DEFAULT_LAB_SLUG = '01-os-linux-basics';

export function LabLearningPanel({
  labSlug,
  labName,
  assertions,
  isChecking,
  hasRunChecks,
  onRunChecks,
}: LabLearningPanelProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'objectives' | 'quiz'>('tasks');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const labContent = LAB_CONTENT_BY_SLUG[labSlug] ?? LAB_CONTENT_BY_SLUG[DEFAULT_LAB_SLUG];

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1600);
  };

  // Checkpoint evaluation — matches either checkpoint id or human-readable name
  const evaluatedCheckpoints = labContent.checkpoints.map((cp) => {
    const match = assertions.find(
      (a) =>
        a.name.toLowerCase() === cp.id.toLowerCase() ||
        a.name.toLowerCase() === cp.name.toLowerCase(),
    );
    return {
      ...cp,
      passed: match?.passed ?? false,
      message: match?.message ?? null,
    };
  });

  const passedCount = evaluatedCheckpoints.filter((cp) => cp.passed).length;
  const totalCount = labContent.checkpoints.length;
  const progressPct = hasRunChecks ? Math.round((passedCount / totalCount) * 100) : 0;

  // Quiz score
  const correctQuizCount = labContent.quiz.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex,
  ).length;
  const quizScorePct = Math.round((correctQuizCount / labContent.quiz.length) * 100);

  return (
    <div className="flex h-full flex-col bg-paper text-card-foreground">
      {/* Subheader with Universal Tab Switcher */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-paper-dim/60 px-4 py-2.5">
        <div className="tab-switcher" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tasks'}
            className={`tab-switcher__tab ${activeTab === 'tasks' ? 'tab-switcher__tab--active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Instructions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'objectives'}
            className={`tab-switcher__tab ${activeTab === 'objectives' ? 'tab-switcher__tab--active' : ''}`}
            onClick={() => setActiveTab('objectives')}
          >
            Objectives {hasRunChecks ? `(${passedCount}/${totalCount})` : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quiz'}
            className={`tab-switcher__tab ${activeTab === 'quiz' ? 'tab-switcher__tab--active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            Quiz {quizSubmitted ? `(${quizScorePct}%)` : ''}
          </button>
        </div>

        <span className="font-mono text-[11px] text-muted-foreground">
          {activeTab === 'tasks' && 'Scenario Guide'}
          {activeTab === 'objectives' && `${progressPct}% Verified`}
          {activeTab === 'quiz' && `${labContent.quiz.length} Questions`}
        </span>
      </div>

      {/* Scrollable Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: INSTRUCTIONS & TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {labSlug.startsWith('m06-') ? 'Docker Sandbox' : labSlug.startsWith('m09-') ? 'Kubernetes Cluster' : labSlug.startsWith('m12-') ? 'Python Runtime' : 'Linux Workstation'}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-xs text-muted-foreground">/{labSlug}</span>
              </div>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-card-foreground">
                {labName}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{labContent.summary}</p>
            </div>

            {/* PHASE 1: GUIDED TASKS */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-1.5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-card-foreground">
                  Phase 1 · Guided Exploration
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{labContent.phase1Description}</p>

              {labContent.guidedCommands.map((cmdItem) => (
                <div
                  key={cmdItem.label}
                  className="rounded-md border border-border bg-[#141512] p-3 font-mono text-xs text-[#E8E6DF]"
                >
                  <div className="flex items-center justify-between pb-1 text-[10px] text-[#8C8B82]">
                    <span>{cmdItem.label}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cmdItem.command)}
                      className="rounded border border-[#30312B] bg-[#1E201B] px-1.5 py-0.5 text-[10px] text-[#C4C2B8] hover:bg-[#2B2D26] hover:text-white transition-colors"
                    >
                      {copiedCmd === cmdItem.command ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block select-all whitespace-pre-wrap break-all">
                    {cmdItem.command}
                  </code>
                </div>
              ))}
            </section>

            {/* PHASE 2: UNGUIDED TASKS */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-1.5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-card-foreground">
                  Phase 2 · Unguided Operational Tasks
                </span>
              </div>

              {labContent.unguidedTasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-md border border-border bg-card p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-card-foreground">{task.title}</h4>
                    <span className="font-mono text-[10px] text-muted">Unguided</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{task.description}</p>
                  <details className="group rounded-md border border-border bg-paper-dim/40">
                    <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-xs font-mono font-medium text-muted hover:text-card-foreground">
                      <span>Need a hint? Click to reveal</span>
                      <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="border-t border-border px-3 py-2 text-xs text-muted leading-relaxed space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span>Suggested command:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(task.hintCommand)}
                          className="rounded border border-border bg-paper px-1.5 py-0.5 font-mono text-[10px] text-card-foreground hover:bg-paper-dim"
                        >
                          {copiedCmd === task.hintCommand ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <code className="block rounded bg-paper-dim px-2 py-1 font-mono text-[11px] text-card-foreground whitespace-pre-wrap break-all">
                        {task.hintCommand}
                      </code>
                    </div>
                  </details>
                </div>
              ))}
            </section>

            {/* PHASE 3: BREAK-FIX CHALLENGE */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-1.5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-card-foreground">
                  Phase 3 · Break-Fix &amp; Verification Challenge
                </span>
              </div>

              <div className="rounded-md border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-card-foreground">
                    {labContent.breakFix.title}
                  </h4>
                  <span className="font-mono text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                    Break-Fix
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {labContent.breakFix.description}
                </p>

                <ol className="list-decimal pl-4 text-xs text-muted space-y-2 leading-relaxed">
                  {labContent.breakFix.steps.map((step) => (
                    <li key={step.label}>
                      <strong className="text-card-foreground">{step.label}:</strong> {step.detail}
                    </li>
                  ))}
                </ol>

                <div className="rounded-md border border-border bg-[#141512] p-3 font-mono text-xs text-[#E8E6DF]">
                  <div className="flex items-center justify-between pb-1 text-[10px] text-[#8C8B82]">
                    <span>REMEDIATION COMMAND</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(labContent.breakFix.remediationCommand)}
                      className="rounded border border-[#30312B] bg-[#1E201B] px-1.5 py-0.5 text-[10px] text-[#C4C2B8] hover:bg-[#2B2D26] hover:text-white transition-colors"
                    >
                      {copiedCmd === labContent.breakFix.remediationCommand ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <code className="block select-all whitespace-pre-wrap break-all text-[11px]">
                    {labContent.breakFix.remediationCommand}
                  </code>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: OBJECTIVES CHECKLIST */}
        {activeTab === 'objectives' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">
                Checkpoint Verification
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Automated tests execute live against your container instance to verify system state, files, permissions, and services.
              </p>
            </div>

            {/* Score & Progress banner */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold text-card-foreground">
                    {passedCount} of {totalCount} Objectives Complete
                  </span>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {progressPct === 100
                      ? '✓ All checkpoints passed! Lab complete.'
                      : 'Run checks anytime to test your progress.'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-bold tabular-nums text-card-foreground">
                    {progressPct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-dim">
                <div
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onRunChecks}
                  isLoading={isChecking}
                  className="w-full justify-center"
                >
                  {hasRunChecks ? 'Re-run Checkpoint Checks' : 'Run Checkpoint Checks'}
                </Button>
              </div>
            </div>

            {/* Checkpoint list */}
            <div className="space-y-3">
              {evaluatedCheckpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className="rounded-md border border-border bg-card p-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                        !hasRunChecks
                          ? 'border border-border text-muted-foreground'
                          : cp.passed
                            ? 'bg-emerald-700 text-white'
                            : 'bg-red-700 text-white'
                      }`}
                    >
                      {!hasRunChecks ? idx + 1 : cp.passed ? '✓' : '✕'}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-card-foreground">
                          {cp.name}
                        </span>
                        {hasRunChecks && (
                          <span
                            className={`font-mono text-[10px] uppercase font-semibold ${
                              cp.passed ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {cp.passed ? 'Passed' : 'Failed'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {hasRunChecks && !cp.passed && cp.message ? cp.message : cp.hint}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INTERACTIVE QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">
                Knowledge Check Quiz
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Test your understanding of core Linux engineering concepts covered in this lab.
              </p>
            </div>

            {/* Quiz Result Card */}
            {quizSubmitted && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-card-foreground">
                      Quiz Evaluation Result
                    </h4>
                    <p className="text-xs text-muted">
                      {correctQuizCount} of {labContent.quiz.length} questions answered correctly.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xl font-bold tabular-nums text-card-foreground">
                      {quizScorePct}%
                    </span>
                    <p
                      className={`font-mono text-[10px] font-bold ${
                        quizScorePct >= 75 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {quizScorePct >= 75 ? 'Passed (>=75%)' : 'Needs Review'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setSelectedAnswers({});
                    }}
                  >
                    Retake Quiz
                  </Button>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {labContent.quiz.map((q, qIndex) => {
                const selected = selectedAnswers[q.id];
                const isCorrect = selected === q.correctIndex;

                return (
                  <div key={q.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-xs font-semibold text-card-foreground">
                        {qIndex + 1}. {q.question}
                      </h4>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        1 pt
                      </span>
                    </div>

                    <fieldset className="space-y-2">
                      <legend className="sr-only">Options</legend>
                      {q.options.map((optText, optIdx) => {
                        const isThisSelected = selected === optIdx;
                        const inputId = `quiz-${q.id}-opt-${optIdx}`;

                        let optionStyle = 'border-border hover:bg-paper-dim/60';
                        if (quizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            optionStyle =
                              'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium';
                          } else if (isThisSelected && !isCorrect) {
                            optionStyle = 'border-red-500 bg-red-50/50 text-red-950';
                          }
                        } else if (isThisSelected) {
                          optionStyle = 'border-brand-600 bg-brand-50';
                        }

                        return (
                          <label
                            key={optIdx}
                            htmlFor={inputId}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-xs transition-colors ${optionStyle}`}
                          >
                            <input
                              id={inputId}
                              type="radio"
                              name={`question-${q.id}`}
                              checked={isThisSelected}
                              disabled={quizSubmitted}
                              onChange={() =>
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className="mt-0.5 h-3.5 w-3.5 accent-brand-600"
                            />
                            <span className="text-card-foreground leading-snug">{optText}</span>
                          </label>
                        );
                      })}
                    </fieldset>

                    {/* Explanation */}
                    {quizSubmitted && (
                      <div
                        className={`rounded-md border p-2.5 text-[11px] leading-relaxed ${
                          isCorrect
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-red-200 bg-red-50 text-red-900'
                        }`}
                      >
                        <p className="font-semibold">{isCorrect ? '✓ Correct' : '✕ Incorrect'}</p>
                        <p className="mt-0.5">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Submit button */}
            {!quizSubmitted && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  disabled={Object.keys(selectedAnswers).length < labContent.quiz.length}
                  onClick={() => setQuizSubmitted(true)}
                  className="w-full justify-center"
                >
                  Submit Quiz Answers
                </Button>
                {Object.keys(selectedAnswers).length < labContent.quiz.length && (
                  <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                    Answer all {labContent.quiz.length} questions to submit.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LabLearningPanel;
