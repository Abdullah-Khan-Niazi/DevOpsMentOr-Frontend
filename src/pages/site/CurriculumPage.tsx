import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLayout } from './components/SiteLayout';
import { Button } from '@/shared/components';
import { LEARNING_PATH_MODULES } from './learningPathData';
import './CurriculumPage.css';

// 3D Isometric SVG Icons
import linux3d from '@/assets/3D-icons/linux.svg';
import git3d from '@/assets/3D-icons/git.svg';
import apt3d from '@/assets/3D-icons/apt.svg';
import droplet3d from '@/assets/3D-icons/droplet.svg';
import repo3d from '@/assets/3D-icons/repository-manager.svg';
import docker3d from '@/assets/3D-icons/docker.svg';
import jenkins3d from '@/assets/3D-icons/jenkins.svg';
import aws3d from '@/assets/3D-icons/aws.svg';
import k8s3d from '@/assets/3D-icons/kubernetes.svg';
import eks3d from '@/assets/3D-icons/eks.svg';
import terraform3d from '@/assets/3D-icons/terraform.svg';
import python3d from '@/assets/3D-icons/python.svg';
import pythonAuto3d from '@/assets/3D-icons/automation-with-python.svg';
import ansible3d from '@/assets/3D-icons/ansible.svg';
import prometheus3d from '@/assets/3D-icons/prometheus.svg';

// ─── Module Catalog Data Model ────────────────────────────────────────────────
export interface CoverageOutcomeItem {
  label: string;
  text: string;
}

export interface CatalogModule {
  num: string;
  title: string;
  desc: string;
  difficulty: 'Foundational' | 'Core' | 'Advanced' | 'Enterprise' | 'Professional';
  labsCount: number;
  techName: string;
  icon: string;
  coverageOutcomes: CoverageOutcomeItem[];
}

export const CATALOG_MODULES: CatalogModule[] = [
  {
    num: '01',
    title: 'Operating Systems and Linux Fundamentals',
    desc: 'Master core Linux server administration, shell navigation, package management, user security, Bash scripting, and SSH hardening to build secure production servers. Transforms a raw, unconfigured virtual system into a hardened, production-ready Linux server through hands-on terminal mastery and fundamental OS principles.',
    difficulty: 'Foundational',
    labsCount: 7,
    techName: 'Linux OS',
    icon: linux3d,
    coverageOutcomes: [
      {
        label: 'Filesystem & Operations',
        text: 'Navigate Linux FHS directory layouts, audit hardware resources, and manage software lifecycles via APT and Vim modal editing without a GUI.',
      },
      {
        label: 'Process & Shell Scripting',
        text: 'Automate operational workflows using standard I/O redirection, text processing pipelines (awk, grep, sort), and parameterized Bash scripts.',
      },
      {
        label: 'User & Permission Isolation',
        text: 'Enforce the principle of least privilege across multi-user servers using numeric and symbolic permission triads, ownership controls, and group isolation.',
      },
      {
        label: 'Network & SSH Hardening',
        text: 'Lock down network exposure with UFW firewalls and establish hardened, passwordless remote server access using cryptographic SSH keypairs.',
      },
    ],
  },
  {
    num: '02',
    title: 'Version Control Systems and Git',
    desc: 'Master distributed version control using Git, covering repository mechanics, history forensics, branch isolation strategies, three-way conflict resolution, destructive state recovery, and GitHub collaboration workflows. Eliminates source code chaos, unversioned file archives, and deployment collisions.',
    difficulty: 'Core',
    labsCount: 6,
    techName: 'Git VCS',
    icon: git3d,
    coverageOutcomes: [
      {
        label: 'Repository Architecture',
        text: 'Track code mutations using Git Directed Acyclic Graph (DAG) object models, SHA commits, and interactive patch staging.',
      },
      {
        label: 'Branching & Worktree Isolation',
        text: 'Isolate parallel feature development with lightweight branches and manage concurrent workspaces using git worktree.',
      },
      {
        label: 'Integration & Conflict Resolution',
        text: 'Unify divergent codebases through three-way merges, linear rebase history rewriting, and cherry-picking without data loss.',
      },
      {
        label: 'State Recovery & Collaboration',
        text: 'Resurrect lost commits and branches via git reflog, safely erase accidental secrets, and execute GitHub Pull Request reviews.',
      },
    ],
  },
  {
    num: '03',
    title: 'Build Tools and Package Managers',
    desc: 'Master software build automation, multi-ecosystem dependency management (Maven, Gradle, npm, Yarn), artifact publishing, multi-stage Docker builds, and CI/CD pipeline integration. Eliminates manual compilation variances, unversioned software distribution, and environment drift.',
    difficulty: 'Core',
    labsCount: 9,
    techName: 'Package Managers',
    icon: apt3d,
    coverageOutcomes: [
      {
        label: 'Build Node Provisioning',
        text: 'Configure standardized, repeatable build runtimes across Java OpenJDK 21, Maven, Gradle, Node.js, and npm toolchains.',
      },
      {
        label: 'Lifecycle Automation & Packaging',
        text: 'Compile, execute automated test suites, and package production-ready deployable binaries (JAR, WAR, and minified client bundles).',
      },
      {
        label: 'Dependency & Version Governance',
        text: 'Resolve direct and transitive dependencies via GAV coordinates and lockfile manifests adhering to Semantic Versioning.',
      },
      {
        label: 'Multi-Stage Container Builds',
        text: 'Construct minimal, hardened multi-stage Docker build images and publish immutable release artifacts to central registries.',
      },
    ],
  },
  {
    num: '04',
    title: 'Artifact Repository Management',
    desc: 'Master binary lifecycle management and immutable supply chains using Sonatype Nexus Repository Manager OSS. Eliminates pipeline failure risks from external registry outages and ensures release reproducibility by implementing the Repository Triad, RBAC, REST API integration, and automated storage governance.',
    difficulty: 'Core',
    labsCount: 7,
    techName: 'Nexus Repository',
    icon: repo3d,
    coverageOutcomes: [
      {
        label: 'Repository Triad Topology',
        text: 'Partition storage into Proxy caches, Hosted proprietary repositories, and unified Group endpoints under a single URL.',
      },
      {
        label: 'Role-Based Access Control',
        text: 'Enforce least privilege security by provisioning scoped CI/CD service accounts with token-based publishing privileges.',
      },
      {
        label: 'Package Ingestion & REST Queries',
        text: 'Publish versioned Python wheels via twine and programmatically query component metadata using the Nexus REST API and jq.',
      },
      {
        label: 'Data Governance & Compaction',
        text: 'Configure automated retention cleanup policies and execute Blob Store compaction tasks to reclaim physical storage.',
      },
    ],
  },
  {
    num: '05',
    title: 'Cloud Computing and IaaS',
    desc: 'Master the core principles of Infrastructure as a Service (IaaS) by transforming raw cloud virtual machines into hardened, production-ready web servers. Provision compute nodes, secure network perimeters with UFW, enforce key-based SSH access, configure Nginx reverse proxies, deploy React applications, and execute CLI-driven infrastructure teardowns.',
    difficulty: 'Core',
    labsCount: 6,
    techName: 'DigitalOcean',
    icon: droplet3d,
    coverageOutcomes: [
      {
        label: 'IaaS Provisioning & Lifecycle',
        text: 'Deploy public cloud virtual machines (Droplets) via web console and doctl CLI, embracing Cattle vs Pets architecture.',
      },
      {
        label: 'Perimeter & SSH Hardening',
        text: 'Enforce defense-in-depth security with UFW packet filtering, non-root users, and passwordless cryptographic SSH keypairs.',
      },
      {
        label: 'Web Server & Reverse Proxy',
        text: 'Configure Nginx to serve production React Single Page Applications with client-side routing and optimized asset delivery.',
      },
      {
        label: 'Ephemeral State & Teardown',
        text: 'Bootstrap instances via Cloud-Init metadata scripts and execute automated, scripted teardowns to prevent cloud cost sprawl.',
      },
    ],
  },
  {
    num: '06',
    title: 'Containers with Docker',
    desc: 'Master containerization with Docker. Learn container lifecycle management, custom Dockerfile construction, persistent storage with volumes, multi-tier orchestration using Docker Compose, and artifact distribution via private registries. Eradicates environmental drift and the "it works on my machine" syndrome.',
    difficulty: 'Core',
    labsCount: 8,
    techName: 'Docker',
    icon: docker3d,
    coverageOutcomes: [
      {
        label: 'Container Lifecycle & Isolation',
        text: 'Manage running and detached containers leveraging Linux namespaces, cgroups, port bindings, and custom bridge networks.',
      },
      {
        label: 'Layered Dockerfile Optimization',
        text: 'Construct immutable, lightweight container images using layered caching, multi-stage builds, and unprivileged user execution.',
      },
      {
        label: 'Persistent Storage & Volumes',
        text: 'Safeguard stateful database workloads against container destruction using Docker managed volumes and host bind mounts.',
      },
      {
        label: 'Multi-Container Orchestration',
        text: 'Deploy integrated multi-tier stacks (web, API, database) via Docker Compose and distribute tagged images to private registries.',
      },
    ],
  },
  {
    num: '07',
    title: 'Jenkins Pipelines and Build Automation',
    desc: 'Master production-grade build automation and CI/CD with Jenkins, progressing from headless server setup and security hardening to Declarative Pipelines, GitHub Webhooks, Groovy Shared Libraries, and dynamic Semantic Versioning. Eliminates fragile manual deployments by engineering automated, version-controlled, and secure pipeline assembly lines.',
    difficulty: 'Advanced',
    labsCount: 6,
    techName: 'Jenkins',
    icon: jenkins3d,
    coverageOutcomes: [
      {
        label: 'Controller Architecture & Hardening',
        text: 'Provision and secure Linux Jenkins controllers, isolate workspaces, and safely configure unprivileged Docker socket execution.',
      },
      {
        label: 'Declarative Pipeline-as-Code',
        text: 'Author modular, version-controlled Jenkinsfile definitions specifying deterministic checkout, test, build, and packaging stages.',
      },
      {
        label: 'Event-Driven Webhook Triggers',
        text: 'Connect GitHub webhooks for automatic pipeline execution across pull requests and dynamic multibranch branch discoveries.',
      },
      {
        label: 'Enterprise Vaults & SemVer Releases',
        text: 'Protect pipeline secrets with Credential Vaults, share logic across repositories with Groovy libraries, and publish SemVer images.',
      },
    ],
  },
  {
    num: '08',
    title: 'AWS Services',
    desc: 'Architect secure AWS cloud networks, enforce IAM security policies, provision elastic EC2 virtual servers, and extend Jenkins CI/CD pipelines to automate container deployments to the AWS public cloud. Bridges local build automation and public cloud infrastructure by mastering AWS networking, identity security, programmatic CLI automation, and continuous cloud deployment pipelines.',
    difficulty: 'Core',
    labsCount: 6,
    techName: 'AWS Services',
    icon: aws3d,
    coverageOutcomes: [
      {
        label: 'Identity & Access Management (IAM)',
        text: 'Enforce least privilege access using granular IAM users, groups, custom JSON policies, and EC2 Assume-Role service trust.',
      },
      {
        label: 'VPC Networking & Subnetting',
        text: 'Architect isolated multi-tier VPC networks with public and private subnets, Internet Gateways, and Security Group firewalls.',
      },
      {
        label: 'Elastic Compute & CLI Automation',
        text: 'Provision secure EC2 instances, attach Elastic IPs for stable ingress routing, and interrogate cloud APIs via AWS CLI v2.',
      },
      {
        label: 'Continuous Deployment Pipeline',
        text: 'Automate remote container deployments to AWS EC2 over SSH by orchestrating Jenkins sshagent pipeline stages.',
      },
    ],
  },
  {
    num: '09',
    title: 'Core Kubernetes Container Orchestration',
    desc: 'Master core Kubernetes orchestration mechanics by moving from imperative control plane queries to declarative multi-service automation using YAML, Helm, and Helmfile. Eliminates host-level fragility and manual container management by building self-healing, stateful, and secure microservice topologies.',
    difficulty: 'Advanced',
    labsCount: 8,
    techName: 'Kubernetes',
    icon: k8s3d,
    coverageOutcomes: [
      {
        label: 'Control Plane & Declarative Topologies',
        text: 'Model desired microservice topologies using declarative manifests for Pods, ReplicaSets, Deployments, and rolling updates.',
      },
      {
        label: 'Service Discovery & Ingress',
        text: 'Route network traffic dynamically using ClusterIP, NodePort, and Layer 7 path-based NGINX Ingress Controller routing rules.',
      },
      {
        label: 'State Decoupling & Persistent Storage',
        text: 'Isolate environment variables via ConfigMaps and Secrets, and guarantee storage persistence with PersistentVolumeClaims.',
      },
      {
        label: 'Helm Packaging & Helmfile Releases',
        text: 'Package applications into parameterized Helm charts with Go templates and synchronize multi-environment releases via Helmfile.',
      },
    ],
  },
  {
    num: '10',
    title: 'Kubernetes on AWS (EKS)',
    desc: 'Master enterprise AWS Elastic Kubernetes Service (EKS) management using declarative IaC (eksctl), serverless compute (Fargate), sub-second autoscaling (Karpenter), zero-trust pod security (IRSA and RBAC), private artifact repositories (ECR), and automated token-scoped Jenkins deployment pipelines.',
    difficulty: 'Enterprise',
    labsCount: 6,
    techName: 'AWS EKS',
    icon: eks3d,
    coverageOutcomes: [
      {
        label: 'Multi-AZ Cluster Architecture',
        text: 'Provision highly available managed Kubernetes control planes and node groups declaratively using eksctl and OIDC federation.',
      },
      {
        label: 'Serverless & Just-In-Time Autoscaling',
        text: 'Route bursty workloads to AWS Fargate profiles and configure Karpenter for sub-second, right-sized node provisioning.',
      },
      {
        label: 'Zero-Trust IRSA & Kubernetes RBAC',
        text: 'Eliminate node-level IAM credentials by binding fine-grained AWS IAM roles directly to Kubernetes ServiceAccounts (IRSA).',
      },
      {
        label: 'Private Supply Chain & Automated Rollouts',
        text: 'Secure container supply chains using AWS ECR private image repositories and execute token-authenticated rollouts in Jenkins.',
      },
    ],
  },
  {
    num: '11',
    title: 'Terraform',
    desc: 'Master declarative Infrastructure as Code using Terraform to automate, scale, parameterize, secure, and continuously deploy AWS cloud infrastructure and EKS Kubernetes clusters. Eliminates manual console configuration, resource drift, and undocumented cloud sprawl by transforming infrastructure into version-controlled, auditable, and repeatable code.',
    difficulty: 'Advanced',
    labsCount: 16,
    techName: 'Terraform',
    icon: terraform3d,
    coverageOutcomes: [
      {
        label: 'Declarative HCL & Core Lifecycle',
        text: 'Author modular HashiCorp Configuration Language (HCL) and execute the complete init, validate, plan, apply, destroy lifecycle.',
      },
      {
        label: 'State Management & S3 Locking',
        text: 'Inspect state files, detect out-of-band configuration drift, and centralize state in Amazon S3 with DynamoDB distributed locking.',
      },
      {
        label: 'Variables, Outputs & Custom Modules',
        text: 'Refactor infrastructure into reusable, parameterized Root and Child module architectures supporting multiple environments.',
      },
      {
        label: 'EKS Automation & GitHub Actions',
        text: 'Automate production Kubernetes cluster provisioning and enforce automated IaC validation and planning in GitHub Actions.',
      },
    ],
  },
  {
    num: '12',
    title: 'Programming with Python',
    desc: 'Master production-grade Python automation, object-oriented infrastructure modeling, error trapping, secure OS interactions, REST API integration, and webhook microservices. Eliminates fragile shell scripts and dangerous copy-pasted code by teaching resilient, error-trapping Python automation that safely interacts with operating systems, network endpoints, and cloud APIs.',
    difficulty: 'Professional',
    labsCount: 12,
    techName: 'Python',
    icon: python3d,
    coverageOutcomes: [
      {
        label: 'Strict Typing & Control Flow',
        text: 'Construct resilient automation scripts with type hints (PEP 484), environment variable extraction, and deterministic metric gating.',
      },
      {
        label: 'Secure OS Interfacing & Logging',
        text: 'Execute Linux commands safely using subprocess.run to prevent shell injection, handle file I/O, and maintain audit logs.',
      },
      {
        label: 'Object-Oriented Asset Modeling',
        text: 'Model infrastructure assets using object-oriented classes, inheritance, custom exception classes, and execution retry decorators.',
      },
      {
        label: 'REST API Clients & Flask Webhooks',
        text: 'Query and mutate remote cloud APIs with requests and build lightweight Flask microservices to ingest automated webhooks.',
      },
    ],
  },
  {
    num: '13',
    title: 'Python Automation (AWS Boto3)',
    desc: 'Master programmatic AWS infrastructure control using Python and Boto3. Build automated auditors, governance enforcers, EBS snapshot lifecycles, disaster recovery protocols, and self-healing watchdog daemons. Eradicates manual, error-prone console clicks ("ClickOps") and operational toil by engineering robust, self-healing Python scripts that automate complex cloud workflows at scale.',
    difficulty: 'Advanced',
    labsCount: 10,
    techName: 'Python Automation',
    icon: pythonAuto3d,
    coverageOutcomes: [
      {
        label: 'Boto3 Architecture & Authentication',
        text: 'Differentiate low-level Clients from high-level Resources and authenticate sessions through SDK credential provider chains.',
      },
      {
        label: 'Fleet Health Auditing & Tagging',
        text: 'Audit EC2 fleet health checks programmatically and enforce compliance policies using bulk API tagging mutations.',
      },
      {
        label: 'Automated Backup & Disaster Recovery',
        text: 'Automate EBS snapshot creation, prune stale snapshots based on retention policies, and rebuild degraded volumes programmatically.',
      },
      {
        label: 'Self-Healing Watchdog Daemons',
        text: 'Build resilient monitoring loops with Waiters, Botocore error handling, automated Amazon SNS alerts, and EC2 reboot triggers.',
      },
    ],
  },
  {
    num: '14',
    title: 'Ansible',
    desc: 'Master declarative configuration management and cross-cloud fleet orchestration using Ansible. Build agentless, idempotent automation pipelines connecting Terraform, Docker, AWS EC2, Kubernetes, and Jenkins into production-grade CI/CD workflows. Eliminates manual system administration, configuration drift, and unrepeatable deployments.',
    difficulty: 'Professional',
    labsCount: 16,
    techName: 'Ansible',
    icon: ansible3d,
    coverageOutcomes: [
      {
        label: 'Agentless Idempotent Architecture',
        text: 'Manage remote Linux fleets over secure, passwordless SSH connections without installing proprietary agents on target nodes.',
      },
      {
        label: 'Playbooks, Variables & Jinja2',
        text: 'Author declarative YAML Playbooks using variables, conditional handlers, loops, and Jinja2 templates for dynamic configuration.',
      },
      {
        label: 'Dynamic Inventory & Cloud Collections',
        text: 'Auto-discover running AWS EC2 instances via the amazon.aws plugin and orchestrate Docker containers and Kubernetes clusters.',
      },
      {
        label: 'Reusable Roles & CI/CD Integration',
        text: 'Structure portable automation logic into standard Ansible Roles (tasks, handlers, templates) and trigger playbooks from Jenkins.',
      },
    ],
  },
  {
    num: '15',
    title: 'Enterprise Monitoring with Prometheus and Grafana',
    desc: 'Master enterprise-grade Kubernetes observability by deploying the Prometheus Operator stack, writing declarative alerting rules, routing alerts via Alertmanager, integrating third-party exporters, instrumenting custom microservices with client libraries, and crafting real-time PromQL dashboards in Grafana. Eliminates blind spots in microservice architectures by transitioning from reactive log-guessing to programmatic, pull-based metric scraping and sub-minute alerting.',
    difficulty: 'Enterprise',
    labsCount: 8,
    techName: 'Prometheus & Grafana',
    icon: prometheus3d,
    coverageOutcomes: [
      {
        label: 'Prometheus Operator Deployment',
        text: 'Deploy the kube-prometheus-stack Helm chart to provision Prometheus, Alertmanager, Node Exporter, and Grafana via CRDs.',
      },
      {
        label: 'Declarative Alerting via PrometheusRule',
        text: 'Author PromQL alerting rules with dynamic Go-template value interpolation and validate alert transitions through CPU stress testing.',
      },
      {
        label: 'Alertmanager Notification Routing',
        text: 'Configure deduplication, grouping, and severity matching pipelines to deliver notifications to downstream channels reliably.',
      },
      {
        label: 'Telemetry Dashboards & App Metrics',
        text: 'Expose datastore metrics via sidecar exporters, instrument Node.js code with prom-client, and design real-time Grafana dashboards.',
      },
    ],
  },
];

// ─── 15 Floating Technology Icons on Slide 1 ──────────────────────────────────
export const CURRICULUM_ICONS = [
  { name: 'Linux', icon: linux3d, targetSlide: 1 },
  { name: 'Git', icon: git3d, targetSlide: 2 },
  { name: 'Package Managers', icon: apt3d, targetSlide: 3 },
  { name: 'Repo Manager', icon: repo3d, targetSlide: 4 },
  { name: 'DigitalOcean', icon: droplet3d, targetSlide: 5 },
  { name: 'Docker', icon: docker3d, targetSlide: 6 },
  { name: 'Jenkins', icon: jenkins3d, targetSlide: 7 },
  { name: 'AWS Services', icon: aws3d, targetSlide: 8 },
  { name: 'Kubernetes', icon: k8s3d, targetSlide: 9 },
  { name: 'AWS EKS', icon: eks3d, targetSlide: 10 },
  { name: 'Terraform', icon: terraform3d, targetSlide: 11 },
  { name: 'Python', icon: python3d, targetSlide: 12 },
  { name: 'Automation', icon: pythonAuto3d, targetSlide: 13 },
  { name: 'Ansible', icon: ansible3d, targetSlide: 14 },
  { name: 'Observability', icon: prometheus3d, targetSlide: 15 },
] as const;

const TOTAL_SLIDES = 17; // 1 overview + 15 module slides + 1 closing CTA

export default function CurriculumPage() {
  const [searchParams] = useSearchParams();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'labs'>('overview');
  const lastScrollTime = useRef<number>(0);
  const isNavigating = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync with search parameter (?slide=N or ?module=N)
  useEffect(() => {
    const param = searchParams.get('slide') || searchParams.get('module');
    if (param !== null) {
      const parsed = parseInt(param, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < TOTAL_SLIDES) {
        setActiveSlide(parsed);
      }
    }
  }, [searchParams]);

  // Suppress document-level scrollbar while on the slide deck
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Slide navigation handlers with URL state synchronization
  const goToSlide = useCallback((index: number) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const clamped = Math.max(0, Math.min(index, TOTAL_SLIDES - 1));
    setActiveSlide(clamped);
    const newUrl = clamped === 0 ? window.location.pathname : `${window.location.pathname}?slide=${clamped}`;
    window.history.replaceState(null, '', newUrl);
  }, []);

  const nextSlide = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveSlide((prev) => {
      const next = Math.min(prev + 1, TOTAL_SLIDES - 1);
      const newUrl = next === 0 ? window.location.pathname : `${window.location.pathname}?slide=${next}`;
      window.history.replaceState(null, '', newUrl);
      return next;
    });
  }, []);

  const prevSlide = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveSlide((prev) => {
      const p = Math.max(prev - 1, 0);
      const newUrl = p === 0 ? window.location.pathname : `${window.location.pathname}?slide=${p}`;
      window.history.replaceState(null, '', newUrl);
      return p;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        nextSlide();
      } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(TOTAL_SLIDES - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide]);

  // Wheel scroll handler: scroll down -> next slide, scroll up -> previous slide
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      const now = Date.now();
      if (now - lastScrollTime.current < 450 || isNavigating.current) return;

      if (Math.abs(e.deltaY) > 18) {
        lastScrollTime.current = now;
        isNavigating.current = true;
        setTimeout(() => {
          isNavigating.current = false;
        }, 400);

        if (e.deltaY > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [nextSlide, prevSlide]);

  // Touch navigation
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diffY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diffY) > 40) {
        if (diffY > 0) nextSlide();
        else prevSlide();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  return (
    <SiteLayout showFooter={false}>
      <main
        className="cur-slideshow"
        ref={containerRef}
        role="region"
        aria-label="Module Catalog Slideshow"
        aria-roledescription="carousel"
      >
        {/* Vertical Dot Navigation in the middle at right side */}
        <nav className="cur-dots-nav" aria-label="Slide navigation">
          {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => {
            const label =
              idx === 0
                ? 'Curriculum Overview'
                : idx === TOTAL_SLIDES - 1
                ? 'Start Building'
                : `Module ${CATALOG_MODULES[idx - 1]?.num}: ${CATALOG_MODULES[idx - 1]?.title}`;

            return (
              <button
                key={idx}
                type="button"
                className={`cur-dot ${activeSlide === idx ? 'cur-dot--active' : ''}`}
                onClick={() => goToSlide(idx)}
                aria-label={label}
                title={label}
              />
            );
          })}
        </nav>

        {/* ── Slide 1: Curriculum Overview ────────────────────────────────────── */}
        <article
          className={`cur-slide cur-slide--overview ${
            activeSlide === 0 ? 'cur-slide--active' : ''
          }`}
          aria-hidden={activeSlide !== 0}
        >
          <div className="cur-slide__inner site-container">
            <div className="cur-slide__grid cur-slide__grid--overview">
              {/* Left Column */}
              <div className="cur-slide__text">
                <h1 className="cur-slide__title">
                  End-to-End DevOps Mastery
                </h1>
                <p className="cur-slide__body">
                  A verified sequential path of 131 hands-on labs engineering end-to-end DevOps mastery from Linux fundamentals through multi-cluster orchestration, evaluated live in isolated browser sandboxes.
                </p>
                <div className="cur-slide__action">
                  <Button variant="primary" size="md" onClick={() => goToSlide(1)}>
                    Start Exploring (Module 01) →
                  </Button>
                </div>
              </div>

              {/* Right Column: 15 Floating Icons in 4x4 Grid directly on dotted canvas */}
              <div className="cur-slide__visual">
                <div className="cur-floating-grid" aria-label="Technologies taught across curriculum">
                  {CURRICULUM_ICONS.map((tech, i) => (
                    <button
                      key={tech.name}
                      type="button"
                      className="cur-floating-tile"
                      style={{ '--i': i } as React.CSSProperties}
                      onClick={() => goToSlide(tech.targetSlide)}
                      title={`Jump to Module: ${tech.name}`}
                    >
                      <img src={tech.icon} alt={tech.name} className="cur-floating-tile__img" />
                      <span className="cur-floating-tile__name">{tech.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* ── Slides 2–16: 15 Individual Module Slides with Segmented Tabs ────────────────────────── */}
        {CATALOG_MODULES.map((mod, index) => {
          const slideIndex = index + 1;
          const isActive = activeSlide === slideIndex;
          const pathMod = LEARNING_PATH_MODULES.find((m) => m.num === mod.num);
          const totalLabs = pathMod?.labs.length || mod.labsCount;

          return (
            <article
              key={mod.num}
              className={`cur-slide cur-slide--module ${isActive ? 'cur-slide--active' : ''}`}
              aria-hidden={!isActive}
            >
              <div className="cur-slide__inner site-container">
                {/* Header Row: Title on Left, Tab Switcher on Right (Same Horizontal Level) */}
                <div className="cur-slide__head-row">
                  <h2 className="cur-slide__title">{mod.title}</h2>

                  {/* Interactive Tab Navigation — Exactly 2 Tabs: Overview and Labs */}
                  <div className="cur-slide__tabs" role="tablist" aria-label={`Module ${mod.num} sections`}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'overview'}
                      className={`cur-slide__tab ${activeTab === 'overview' ? 'cur-slide__tab--active' : ''}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'labs'}
                      className={`cur-slide__tab ${activeTab === 'labs' ? 'cur-slide__tab--active' : ''}`}
                      onClick={() => setActiveTab('labs')}
                    >
                      Labs
                    </button>
                  </div>
                </div>

                <div className="cur-slide__grid cur-slide__grid--module">
                  {/* Left Column: Tab Panel Content */}
                  <div className="cur-slide__text">
                    {/* Tab 1: Overview */}
                    {activeTab === 'overview' && (
                      <div className="cur-tab-pane cur-tab-pane--overview" role="tabpanel">
                        <p className="cur-slide__desc">{mod.desc}</p>

                        <div className="cur-slide__coverage">
                          <span className="cur-slide__coverage-heading">Coverage & Outcomes</span>
                          <ul className="cur-slide__coverage-list">
                            {mod.coverageOutcomes.map((item, tidx) => (
                              <li key={tidx} className="cur-slide__coverage-item">
                                <span className="cur-slide__coverage-bullet">›</span>
                                <span className="cur-slide__coverage-text">
                                  <strong className="cur-slide__coverage-label">{item.label}:</strong> {item.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Hands-On Labs (Whitespace-separated, no cards, no badges, all visible) */}
                    {activeTab === 'labs' && (
                      <div className="cur-tab-pane cur-tab-pane--labs" role="tabpanel">
                        <div className="cur-labs-grid" aria-label={`Labs for Module ${mod.num}`}>
                          {(() => {
                            const labs = pathMod?.labs || [];
                            const mid = Math.ceil(labs.length / 2);
                            const col1 = labs.slice(0, mid);
                            const col2 = labs.slice(mid);

                            const renderLabRow = (lab: (typeof labs)[0], globalIdx: number) => {
                              return (
                                <div
                                  key={lab.id}
                                  className="cur-lab-row"
                                  title={lab.tools ? `Commands: ${lab.tools}` : undefined}
                                >
                                  <span className="cur-lab-row__num">
                                    {String(globalIdx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="cur-lab-row__main">
                                    <span className="cur-lab-row__title">{lab.title}</span>
                                    {lab.scenario && (
                                      <span className="cur-lab-row__desc">{lab.scenario}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <>
                                <div className="cur-labs-col">
                                  {col1.map((lab, idx) => renderLabRow(lab, idx))}
                                </div>
                                <div className="cur-labs-col">
                                  {col2.map((lab, idx) => renderLabRow(lab, mid + idx))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Floating 3D Showcase */}
                  <div className="cur-slide__visual">
                    <div className="cur-solo-stage">
                      <div className="cur-solo-icon-wrap">
                        <img
                          src={mod.icon}
                          alt={`${mod.techName} icon`}
                          className="cur-solo-icon"
                        />
                      </div>
                      <div className="cur-solo-caption">
                        <span className="cur-solo-caption__name">{mod.techName}</span>
                        <span className="cur-solo-caption__sub">
                          {mod.difficulty} · {totalLabs} Labs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {/* ── Slide 17: Closing CTA-Only Slide ─────────────────────────────────── */}
        <article
          className={`cur-slide cur-slide--closing ${
            activeSlide === 16 ? 'cur-slide--active' : ''
          }`}
          aria-hidden={activeSlide !== 16}
        >
          <div className="cur-slide__inner site-container">
            <div className="cur-closing-box">
              <h2 className="cur-closing-box__title">
                Fifteen modules. Your browser is your sandbox.
              </h2>
              <p className="cur-closing-box__desc">
                No local Docker configurations. No port collisions. Every lab boots an isolated
                container workspace verified by automated assertions.
              </p>
              <div className="cur-closing-box__ctas">
                <Link to={ROUTES.SIGNUP}>
                  <Button variant="primary" size="lg">
                    Start Module 01 →
                  </Button>
                </Link>
                <Button variant="secondary" size="lg" onClick={() => goToSlide(0)}>
                  Explore Modules Overview ↑
                </Button>
              </div>
            </div>
          </div>
        </article>
      </main>
    </SiteLayout>
  );
}
