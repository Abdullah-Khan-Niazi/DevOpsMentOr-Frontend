import type { AccordionItemData } from './components/SiteAccordion';

// ─── Canonical 15-module curriculum ───────────────────────────────────────────
// Single source of truth — Homepage (§5.1.5/§5.1.8 teasers) and Curriculum
// (§5.2) render the same modules so names/numbers never drift.

export interface CurriculumModule {
  num: string;
  title: string;
  focus: string;
}

export const MODULES: CurriculumModule[] = [
  {
    num: '01',
    title: 'Operating Systems & Linux Fundamentals',
    focus: 'Processes, filesystems, shell',
  },
  { num: '02', title: 'Version Control & Git', focus: 'Branching, remotes, workflows' },
  { num: '03', title: 'Build Tools & Package Managers', focus: 'npm, pip, Makefiles' },
  {
    num: '04',
    title: 'Artifact Repository Management',
    focus: 'Storage, tagging, security scanning',
  },
  {
    num: '05',
    title: 'Cloud Computing & IaaS',
    focus: 'Instances, virtual networking, cloud storage',
  },
  { num: '06', title: 'Docker', focus: 'Images, containers, registries' },
  { num: '07', title: 'Jenkins Pipelines', focus: 'Declarative CI/CD pipelines' },
  { num: '08', title: 'AWS Services', focus: 'Core managed services' },
  { num: '09', title: 'Kubernetes', focus: 'Pods, services, scheduling' },
  { num: '10', title: 'Kubernetes on Amazon EKS', focus: 'Managed control planes' },
  { num: '11', title: 'Terraform', focus: 'Infrastructure as code' },
  { num: '12', title: 'Python Programming', focus: 'Language fundamentals' },
  { num: '13', title: 'Python Automation', focus: 'Scripting operations' },
  { num: '14', title: 'Ansible', focus: 'Configuration management' },
  { num: '15', title: 'Prometheus & Grafana', focus: 'Metrics, alerts, dashboards' },
];

// §5.2 phase grouping — Foundations 01–04 / Build & Ship 05–08 /
// Orchestrate 09–11 / Automate & Observe 12–15.
export const CURRICULUM_PHASES = [
  {
    id: 'foundations',
    label: 'Foundations',
    range: '01–04',
    description: 'Systems, source control, and the build pipeline basics.',
    moduleNums: ['01', '02', '03', '04'],
  },
  {
    id: 'build-ship',
    label: 'Build & Ship',
    range: '05–08',
    description: 'Cloud infrastructure, containerization, and automated delivery.',
    moduleNums: ['05', '06', '07', '08'],
  },
  {
    id: 'orchestrate',
    label: 'Orchestrate',
    range: '09–11',
    description: 'Kubernetes scheduling, managed clusters, and infrastructure as code.',
    moduleNums: ['09', '10', '11'],
  },
  {
    id: 'automate-observe',
    label: 'Automate & Observe',
    range: '12–15',
    description: 'Scripted operations, configuration management, and monitoring.',
    moduleNums: ['12', '13', '14', '15'],
  },
];

export function modulesForPhase(moduleNums: string[]): CurriculumModule[] {
  return MODULES.filter((m) => moduleNums.includes(m.num));
}

// ─── FAQ content (§5.5.3) ─────────────────────────────────────────────────────
// Shared between the Pricing page accordion, the homepage FAQ section, and the
// dedicated FAQ page so answers never drift across surfaces.

export interface FaqCategory {
  id: string;
  label: string;
  items: AccordionItemData[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'access',
    label: 'ACCESS',
    items: [
      {
        id: 'access-1',
        question: 'How are lab environments provisioned?',
        answer:
          'Lab environments are provisioned automatically as ephemeral containers when you initiate a module session.',
      },
      {
        id: 'access-2',
        question: 'Do I need a credit card to get started with individual access?',
        answer:
          'No. Individual access during the platform’s initial release is completely free and requires no credit card.',
      },
      {
        id: 'access-3',
        question: 'When can I start a lab session?',
        answer:
          'Lab sessions start on demand from any supported browser — there are no scheduled slots during the initial release.',
      },
    ],
  },
  {
    id: 'technical',
    label: 'TECHNICAL',
    items: [
      {
        id: 'tech-1',
        question: 'Are environments persistent across sessions?',
        answer:
          'No. Lab environments are ephemeral by design to ensure consistent starting states and resource safety. Progress and assertions are saved to your account.',
      },
      {
        id: 'tech-2',
        question: 'What are the session limits for lab environments?',
        answer:
          'Active lab container sessions have a 2-hour continuous runtime limit before automatic teardown to preserve shared cluster resources. Assertion progress is automatically saved to your account.',
      },
      {
        id: 'tech-3',
        question: 'What prerequisites or tools do I need to install locally?',
        answer:
          'All lab tools, terminal sessions, and automated assertions run directly in your browser. No local tool installation is required.',
      },
    ],
  },
  {
    id: 'institutions',
    label: 'INSTITUTIONS',
    items: [
      {
        id: 'inst-1',
        question: 'How is institutional deployment arranged?',
        answer: 'Institutional onboarding is currently manual — contact us to arrange access.',
      },
      {
        id: 'inst-2',
        question: 'Can custom curriculum modules be integrated for university cohorts?',
        answer:
          'Custom module configuration and cohort dashboard integration are evaluated during institutional onboarding.',
      },
    ],
  },
];
