// ─── DevOpsMentor Learning Path Data ──────────────────────────────────────────
// Complete 15-Module Linear Dependency-Driven Curriculum
// Zero em dashes, 100% token-compatible data structures.

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
import grafana3d from '@/assets/3D-icons/grafana.svg';

export const MODULE_ICONS: Record<string, string> = {
  '01': linux3d,
  '02': git3d,
  '03': apt3d,
  '04': repo3d,
  '05': droplet3d,
  '06': docker3d,
  '07': jenkins3d,
  '08': aws3d,
  '09': k8s3d,
  '10': eks3d,
  '11': terraform3d,
  '12': python3d,
  '13': pythonAuto3d,
  '14': ansible3d,
  '15': grafana3d,
};

export const MODULE_SHORT_TITLES: Record<string, string> = {
  '01': 'Linux',
  '02': 'Git',
  '03': 'Package Managers',
  '04': 'Repo Manager',
  '05': 'DigitalOcean',
  '06': 'Docker',
  '07': 'Jenkins',
  '08': 'AWS Services',
  '09': 'Kubernetes',
  '10': 'AWS EKS',
  '11': 'Terraform',
  '12': 'Python',
  '13': 'Automation',
  '14': 'Ansible',
  '15': 'Observability',
};

export interface LabItem {
  id: string;
  num: string;
  title: string;
  scenario: string;
  tools: string;
}

export interface LearningPathModule {
  num: string;
  title: string;
  shortTitle?: string;
  icon?: string;
  difficulty: string;
  skillLevel: string;
  technologies: string[];
  prerequisites: string[];
  enables: string[];
  description: string;
  keySkills: string[];
  walkthrough: {
    title: string;
    description: string;
  };
  labs: LabItem[];
  certificate: {
    title: string;
    credentialId: string;
  };
}

export const LEARNING_PATH_MODULES: LearningPathModule[] = [
  // ─── Module 01: Operating Systems and Linux Fundamentals ────────────────────
  {
    num: '01',
    title: 'Operating Systems and Linux Fundamentals',
    difficulty: 'Beginner / Foundational',
    skillLevel: 'Level 0 -> Level 1 DevOps Practitioner',
    technologies: ['Ubuntu Linux 24.04 LTS', 'Bash', 'VirtualBox', 'Vim', 'APT', 'UFW', 'OpenSSH'],
    prerequisites: ['None (Foundational Entrypoint)'],
    enables: ['Module 02 (Git)', 'Module 06 (Docker)', 'Module 07 (Jenkins)', 'Downstream Linux Operations'],
    description:
      'Master core Linux server administration, shell navigation, package management, user security, Bash scripting, and SSH hardening to build secure production servers.',
    keySkills: [
      'OS resource monitoring and process control',
      'Linux Filesystem Hierarchy (FHS) navigation',
      'Bash command line and text processing pipelines',
      'Vim modal configuration editing',
      'APT package lifecycle and user permission isolation',
      'Key-based SSH network security and firewall configuration',
    ],
    walkthrough: {
      title: 'Guided Walkthrough and System Architecture Slides',
      description: 'Interactive lecture and slide deck covering OS resources, FHS standards, and SSH key authentication.',
    },
    labs: [
      {
        id: 'm01-prelab',
        num: 'Pre-Lab',
        title: 'Provisioning a Linux Virtual Machine',
        scenario: 'Set up a local virtualized Linux host for foundational exercises.',
        tools: 'Oracle VirtualBox, Ubuntu Desktop ISO',
      },
      {
        id: 'm01-lab1',
        num: 'Lab 1',
        title: 'Introduction to Operating Systems and Virtualization',
        scenario: 'Understand OS resource management and verify VM execution parameters.',
        tools: 'ps aux, top, systemd-detect-virt',
      },
      {
        id: 'm01-lab2',
        num: 'Lab 2',
        title: 'Provisioning and Exploring the Linux Filesystem',
        scenario: 'Audit system identity, resource limits, and root directory structure.',
        tools: 'uname -a, hostnamectl, df -h, free -h, lsblk, tree -L 1 /, ls -la',
      },
      {
        id: 'm01-lab3',
        num: 'Lab 3',
        title: 'Command Line Interface Fundamentals',
        scenario: 'Manage file lifecycles and search content strictly through the terminal CLI.',
        tools: 'pwd, cd, ls, mkdir -p, touch, cp, mv, rm -i, cat, head, tail -f, wc -l, grep, find',
      },
      {
        id: 'm01-lab4',
        num: 'Lab 4',
        title: 'Package Management and the Vim Editor',
        scenario: 'Manage software lifecycle and edit configuration files without a graphical interface.',
        tools: 'apt update, apt install, apt remove, which, dpkg -l, vim',
      },
      {
        id: 'm01-lab5',
        num: 'Lab 5',
        title: 'Users, Groups, and Permissions',
        scenario: 'Secure shared files and isolate administrative and developer accounts.',
        tools: 'groupadd, useradd -m -s, passwd, usermod -aG, id, chmod, chown',
      },
      {
        id: 'm01-lab6',
        num: 'Lab 6',
        title: 'Pipes, Redirection, Shell Scripting, and Environment Variables',
        scenario: 'Eliminate repetitive manual tasks using Unix pipelines, conditionals, loops, and exported variables.',
        tools: '>, >>, pipe |, awk, sort, uniq -c, grep, Bash scripts (if/while/for), export',
      },
      {
        id: 'm01-lab7',
        num: 'Lab 7',
        title: 'Networking and Secure Shell Access',
        scenario: 'Lock down network exposure with UFW firewalls and establish hardened remote key-based administration.',
        tools: 'ip a, ping -c, ss -tulpn, ufw, ssh-keygen, ssh-copy-id, ssh, scp, systemctl restart sshd',
      },
    ],
    certificate: {
      title: 'Linux Systems Administration Specialist',
      credentialId: 'DM-CERT-M01-LNX',
    },
  },

  // ─── Module 02: Version Control Systems and Git ─────────────────────────────
  {
    num: '02',
    title: 'Version Control Systems and Git',
    difficulty: 'Intermediate / Core Operations',
    skillLevel: 'Level 1 -> Level 2 DevOps Practitioner',
    technologies: ['Git CLI', 'GitHub Web GUI', 'SSH Keys'],
    prerequisites: ['Module 01 (Shell navigation, terminal execution, environment variables)'],
    enables: ['Module 03 (Build Tools)', 'Module 06 (Docker)', 'Module 07 (Jenkins)', 'Module 11 (Terraform)', 'Module 14 (Ansible)'],
    description:
      'Master distributed version control using Git, covering repository mechanics, history forensics, branch isolation strategies, three-way conflict resolution, and GitHub collaboration workflows.',
    keySkills: [
      'Repository initialization and identity configuration',
      'Interactive staging and history graph forensics',
      'Branch isolation and worktree context switching',
      'Merging, rebasing, and cherry-picking',
      'Destructive resets vs safe reverts and reflog resurrection',
      'Remote synchronization and GitHub Pull Request workflows',
    ],
    walkthrough: {
      title: 'Directed Git DAG Forensics and Branching Strategy Slides',
      description: 'Interactive lecture and slide deck covering commit DAGs, three-way merge algorithms, and reflog recovery.',
    },
    labs: [
      {
        id: 'm02-lab1',
        num: 'Lab 1',
        title: 'Architecting the Foundation',
        scenario: 'Secure an unversioned source directory and establish baseline repository tracking.',
        tools: 'git config, git init, git status, git add, git add -p, git commit',
      },
      {
        id: 'm02-lab2',
        num: 'Lab 2',
        title: 'Going Back in Time',
        scenario: 'Analyze the historical evolution of the Git genesis repository via log and blame forensics.',
        tools: 'git clone, git log, git show, git diff, git diff --staged, git blame',
      },
      {
        id: 'm02-lab3',
        num: 'Lab 3',
        title: 'Divergent Realities',
        scenario: 'Enforce feature isolation and context switching without corrupting working tree state.',
        tools: 'git branch, git checkout, git switch, git restore, git stash, git worktree',
      },
      {
        id: 'm02-lab4',
        num: 'Lab 4',
        title: 'I Have a Bad Feeling About This',
        scenario: 'Resolve complex code collisions between divergent branches during merge and rebase.',
        tools: 'git merge, git rebase, git cherry-pick',
      },
      {
        id: 'm02-lab5',
        num: 'Lab 5',
        title: 'Here We Go Again',
        scenario: 'Erase accidentally committed secrets, restore deleted commits via reflog, and clean debris.',
        tools: 'git reset, git revert, git reflog, git clean',
      },
      {
        id: 'm02-lab6',
        num: 'Lab 6',
        title: 'The Remote Synchronization',
        scenario: 'Link local repository to remote GitHub, enforce branch protections, and merge PRs.',
        tools: 'git remote, git push, git fetch, git pull, GitHub Web GUI',
      },
    ],
    certificate: {
      title: 'Distributed Version Control and Git Specialist',
      credentialId: 'DM-CERT-M02-GIT',
    },
  },

  // ─── Module 03: Build Tools and Package Managers ────────────────────────────
  {
    num: '03',
    title: 'Build Tools and Package Managers',
    difficulty: 'Intermediate / Core Operations',
    skillLevel: 'Level 1 -> Level 2 DevOps Practitioner',
    technologies: ['Apache Maven', 'Gradle', 'Node.js', 'npm', 'Vite', 'Java OpenJDK 21', 'Docker'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)'],
    enables: ['Module 04 (Artifact Repositories)', 'Module 06 (Docker)', 'Module 07 (Jenkins)'],
    description:
      'Master software build automation, multi-ecosystem dependency management (Maven, Gradle, npm), artifact packaging, multi-stage Docker builds, and CI/CD quality gate enforcement.',
    keySkills: [
      'Standardized build server provisioning',
      'Declarative dependency management (pom.xml, package.json)',
      'Direct vs transitive dependency graph resolution',
      'Production asset compilation and bundling with Vite',
      'Multi-stage Docker build optimization',
      'Automated unit testing and quality gate integration',
    ],
    walkthrough: {
      title: 'Build Lifecycle and Deterministic Packaging Slides',
      description: 'Interactive lecture and slide deck covering the 6-stage build lifecycle, GAV coordinates, and build determinism.',
    },
    labs: [
      {
        id: 'm03-lab1',
        num: 'Lab 1',
        title: 'Understanding Build Automation',
        scenario: 'Evaluate organizational build entropy resulting from manual compilation variance.',
        tools: 'Theoretical and Conceptual Architecture Analysis',
      },
      {
        id: 'm03-lab2',
        num: 'Lab 2',
        title: 'Preparing the Build Environment',
        scenario: 'Provision a fresh Ubuntu server as a standardized build node with full runtimes.',
        tools: 'apt install openjdk-21-jdk, Maven, Gradle, Node.js, npm, export JAVA_HOME',
      },
      {
        id: 'm03-lab3',
        num: 'Lab 3',
        title: 'Generating the First Build Artifact',
        scenario: 'Replace manual compilation with a self-contained deployable Java JAR package.',
        tools: 'mvn clean package, java -jar, tree',
      },
      {
        id: 'm03-lab4',
        num: 'Lab 4',
        title: 'Mastering Dependency Management',
        scenario: 'Standardize third-party library resolution and audit transitive dependencies.',
        tools: 'mvn dependency:tree, mvn dependency:resolve, gradle dependencies',
      },
      {
        id: 'm03-lab5',
        num: 'Lab 5',
        title: 'Building JavaScript Applications',
        scenario: 'Automate React application dependency management and production bundling.',
        tools: 'npm install, npm run build, npm start, Vite',
      },
      {
        id: 'm03-lab6',
        num: 'Lab 6',
        title: 'Comparing Modern Build Tools',
        scenario: 'Assign optimal build tools to diverse organizational software engineering projects.',
        tools: 'Comparative Architectural Matrix Analysis',
      },
      {
        id: 'm03-lab7',
        num: 'Lab 7',
        title: 'Publishing Build Artifacts',
        scenario: 'Centralize software distribution to eliminate single points of failure.',
        tools: 'mvn deploy, gradle publish, curl, Nexus Repository',
      },
      {
        id: 'm03-lab8',
        num: 'Lab 8',
        title: 'Build Tools Inside Docker',
        scenario: 'Containerize the build environment to decouple builds from host machine state.',
        tools: 'docker build, docker images, docker run, multi-stage Dockerfile',
      },
      {
        id: 'm03-lab9',
        num: 'Lab 9',
        title: 'Build Tools in Modern DevOps',
        scenario: 'Connect automated build tools to CI/CD pipelines with mandatory quality gates.',
        tools: 'CI/CD Pipeline Integration (Jenkins, GitHub Actions)',
      },
    ],
    certificate: {
      title: 'Build Automation and Packaging Engineer',
      credentialId: 'DM-CERT-M03-BLD',
    },
  },

  // ─── Module 04: Artifact Repository Management ──────────────────────────────
  {
    num: '04',
    title: 'Artifact Repository Management',
    difficulty: 'Intermediate',
    skillLevel: 'Associate / Intermediate Engineer',
    technologies: ['Sonatype Nexus OSS v3.94', 'OpenJDK 21', 'Python PyPI', 'Twine', 'cURL', 'jq'],
    prerequisites: ['Module 01 (Linux)', 'Module 03 (Build Tools)'],
    enables: ['Module 07 (Jenkins)', 'Module 08 (AWS)', 'Module 10 (EKS)'],
    description:
      'Master binary lifecycle management and immutable supply chains using Sonatype Nexus Repository Manager OSS, implementing the Repository Triad, RBAC, REST API integration, and storage governance.',
    keySkills: [
      'Nexus OSS administration and daemon management',
      'Repository Triad architecture (Proxy, Hosted, Group)',
      'Role-Based Access Control (RBAC) and service accounts',
      'Package publishing with twine and REST API querying',
      'Blob Store filesystem partitioning and compaction',
    ],
    walkthrough: {
      title: 'Repository Triad Topology and Supply Chain Security Slides',
      description: 'Interactive lecture and slide deck covering immutability principles, proxy caching, and garbage collection.',
    },
    labs: [
      {
        id: 'm04-lab1',
        num: 'Lab 1',
        title: 'Daemon Initialization and Core Deployment',
        scenario: 'Install Java 21, extract Nexus 3.94, set nexus.rc, start service, and retrieve admin password.',
        tools: 'apt install openjdk-21-jdk-headless, wget, tar, nexus.rc, ./nexus start',
      },
      {
        id: 'm04-lab2',
        num: 'Lab 2',
        title: 'Physical Storage Allocation',
        scenario: 'Create dedicated File Blob Store to isolate storage faults and manage disk quotas.',
        tools: 'Nexus Web GUI: Administration -> Repository -> Blob Stores',
      },
      {
        id: 'm04-lab3',
        num: 'Lab 3',
        title: 'The Repository Triad Topology',
        scenario: 'Create PyPI Proxy, PyPI Hosted, and PyPI Group repositories under unified endpoint.',
        tools: 'Nexus Web GUI: Repositories configuration',
      },
      {
        id: 'm04-lab4',
        num: 'Lab 4',
        title: 'Principle of Least Privilege',
        scenario: 'Create dedicated CI/CD role and service user with scoped PyPI upload privileges.',
        tools: 'Nexus Web GUI: Security -> Roles and Users',
      },
      {
        id: 'm04-lab5',
        num: 'Lab 5',
        title: 'Pipeline Injection (Publishing)',
        scenario: 'Publish Python wheel packages to PyPI Hosted repository using twine.',
        tools: 'pip install twine, twine upload --repository-url',
      },
      {
        id: 'm04-lab6',
        num: 'Lab 6',
        title: 'Programmatic Retrieval (The REST API)',
        scenario: 'Query component metadata from Nexus REST API programmatically and parse with jq.',
        tools: 'curl, jq, /service/rest/v1/components',
      },
      {
        id: 'm04-lab7',
        num: 'Lab 7',
        title: 'Data Retention and Garbage Collection',
        scenario: 'Create cleanup policies and execute Compact Blob Store maintenance tasks.',
        tools: 'Nexus Web GUI: Cleanup Policies, Tasks -> Compact Blob Store',
      },
    ],
    certificate: {
      title: 'Enterprise Artifact Management Specialist',
      credentialId: 'DM-CERT-M04-REP',
    },
  },

  // ─── Module 05: Cloud Computing and IaaS ────────────────────────────────────
  {
    num: '05',
    title: 'Cloud Computing and IaaS',
    difficulty: 'Intermediate',
    skillLevel: 'Associate DevOps Engineer',
    technologies: ['DigitalOcean Droplets', 'doctl CLI', 'Ubuntu Linux 24.04 LTS', 'OpenSSH', 'UFW', 'Nginx', 'Node.js'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)'],
    enables: ['Module 08 (AWS)', 'Module 11 (Terraform)', 'Module 14 (Ansible)'],
    description:
      'Master the core principles of Infrastructure as a Service (IaaS) by transforming raw cloud virtual machines into hardened, production-ready web servers with Nginx and automated teardowns.',
    keySkills: [
      'Cloud compute provisioning via GUI and doctl CLI',
      'SSH key injection and remote server hardening',
      'Kernel packet filtering with UFW firewalls',
      'Node.js and Nginx reverse proxy configuration',
      'Single Page Application (SPA) production deployment',
      'CLI-driven ephemeral resource teardown',
    ],
    walkthrough: {
      title: 'IaaS Architecture and Cloud Topography Slides',
      description: 'Interactive lecture and slide deck covering hypervisors, VPC topography, Pets vs Cattle, and metered billing.',
    },
    labs: [
      {
        id: 'm05-lab1',
        num: 'Lab 1',
        title: 'The Cloud Console (GUI Provisioning)',
        scenario: 'Provision initial cloud compute node using web dashboard and audit via CLI.',
        tools: 'Cloud Console, doctl compute droplet list',
      },
      {
        id: 'm05-lab2',
        num: 'Lab 2',
        title: 'The Cryptographic Entry (SSH and Remote Execution)',
        scenario: 'Connect to remote VM via SSH and disable password authentication entirely.',
        tools: 'ssh-keygen, ssh, nano /etc/ssh/sshd_config, systemctl restart sshd',
      },
      {
        id: 'm05-lab3',
        num: 'Lab 3',
        title: 'The Virtual Network Perimeter (OS Level Firewalls)',
        scenario: 'Enforce OS-level packet filtering using UFW default-deny and port restrictions.',
        tools: 'ufw status, ufw default deny, ufw allow, ufw enable',
      },
      {
        id: 'm05-lab4',
        num: 'Lab 4',
        title: 'The Compute Foundation (Runtime Installation)',
        scenario: 'Prepare Linux instance to host web applications with NodeSource and Nginx.',
        tools: 'apt update, apt upgrade, curl, apt install nodejs, apt install nginx',
      },
      {
        id: 'm05-lab5',
        num: 'Lab 5',
        title: 'Deploying the JS React Application',
        scenario: 'Clone, compile, and serve a React application via Nginx with client-side routing.',
        tools: 'git clone, npm install, npm run build, nginx -t, systemctl reload nginx',
      },
      {
        id: 'm05-lab6',
        num: 'Lab 6',
        title: 'Ephemeral State (Automated Teardown)',
        scenario: 'Authenticate cloud CLI and destroy cloud infrastructure programmatically.',
        tools: 'doctl auth init, doctl compute droplet list, doctl compute droplet delete --force',
      },
    ],
    certificate: {
      title: 'Cloud Infrastructure and IaaS Engineer',
      credentialId: 'DM-CERT-M05-CLD',
    },
  },

  // ─── Module 06: Containers with Docker ──────────────────────────────────────
  {
    num: '06',
    title: 'Containers with Docker',
    difficulty: 'Intermediate',
    skillLevel: 'Associate / Practitioner',
    technologies: ['Docker Engine', 'Docker CLI', 'Dockerfile', 'Docker Compose', 'Nexus', 'Nginx', 'PostgreSQL'],
    prerequisites: ['Module 01 (Linux)'],
    enables: ['Module 07 (Jenkins)', 'Module 08 (AWS)', 'Module 09 (Kubernetes)', 'Module 10 (EKS)'],
    description:
      'Master containerization with Docker. Learn container lifecycle operations, custom Dockerfile construction, persistent data volumes, multi-tier orchestration with Compose, and private registries.',
    keySkills: [
      'Container lifecycle states and runtime execution flags',
      'Multi-stage Dockerfile layer optimization',
      'Port binding and network isolation',
      'Persistent storage management with named volumes',
      'Multi-container YAML orchestration with Docker Compose',
      'Private registry authentication, tagging, and publishing',
    ],
    walkthrough: {
      title: 'Linux Namespaces, Cgroups, and Container Runtimes Slides',
      description: 'Interactive lecture and slide deck covering namespaces, cgroups, Copy-on-Write storage, and OCI standards.',
    },
    labs: [
      {
        id: 'm06-lab1',
        num: 'Lab 1',
        title: 'The Ephemeral Environment (Core Container Lifecycle)',
        scenario: 'Run isolated web servers without installing binaries directly on the host.',
        tools: 'docker pull, docker run, docker ps, docker ps -a, docker stop',
      },
      {
        id: 'm06-lab2',
        num: 'Lab 2',
        title: 'Network Bridging and Environment Injection',
        scenario: 'Expose isolated container ports to the host and inject dynamic runtime secrets.',
        tools: 'docker run -p, docker run -e, docker run --name, curl, docker rm -f',
      },
      {
        id: 'm06-lab3',
        num: 'Lab 3',
        title: 'Diagnostics and Telemetry',
        scenario: 'Troubleshoot non-responsive services without SSH access using logs and exec.',
        tools: 'docker logs, docker exec -it, docker stats, docker inspect',
      },
      {
        id: 'm06-lab4',
        num: 'Lab 4',
        title: 'The Immutable Blueprint (Dockerfile)',
        scenario: 'Package a custom Node.js application into an optimized, immutable container image.',
        tools: 'FROM, ENV, WORKDIR, RUN, COPY, EXPOSE, CMD, docker build, docker images',
      },
      {
        id: 'm06-lab5',
        num: 'Lab 5',
        title: 'Data Persistence and State (Volumes)',
        scenario: 'Safeguard database state against container destruction using named volumes.',
        tools: 'docker volume create, docker volume ls, docker run -v, docker exec',
      },
      {
        id: 'm06-lab6',
        num: 'Lab 6',
        title: 'Multi-Container Orchestration (Docker Compose)',
        scenario: 'Automate unified deployment of a multi-tier application (frontend, backend, database).',
        tools: 'docker-compose.yml, docker compose up -d, docker compose ps, docker compose down',
      },
      {
        id: 'm06-lab7',
        num: 'Lab 7',
        title: 'The Private Registry Gateway (Pushing Images)',
        scenario: 'Distribute custom container images to an internal deployment registry server.',
        tools: '/etc/docker/daemon.json, docker login, docker tag, docker push',
      },
      {
        id: 'm06-lab8',
        num: 'Lab 8',
        title: 'Infrastructure as a Container (Deploying Nexus)',
        scenario: 'Deploy enterprise repository manager with attached persistent volume storage.',
        tools: 'docker volume create, docker run -v -p, docker logs, curl',
      },
    ],
    certificate: {
      title: 'Certified Docker Container Practitioner',
      credentialId: 'DM-CERT-M06-DCK',
    },
  },

  // ─── Module 07: Jenkins Pipelines and Build Automation ──────────────────────
  {
    num: '07',
    title: 'Jenkins Pipelines and Build Automation',
    difficulty: 'Intermediate to Advanced',
    skillLevel: 'Associate / Professional DevOps Engineer',
    technologies: ['Jenkins Controller', 'Java OpenJDK 17/21', 'Docker', 'Git', 'GitHub Webhooks', 'Groovy'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)', 'Module 06 (Docker)'],
    enables: ['Module 08 (AWS)', 'Module 09 (Kubernetes)', 'Module 10 (EKS)', 'Module 11 (Terraform)', 'Module 14 (Ansible)'],
    description:
      'Master production-grade build automation and CI/CD with Jenkins, progressing from headless server setup and security hardening to Declarative Pipelines, Webhooks, Groovy Shared Libraries, and dynamic SemVer.',
    keySkills: [
      'Jenkins Controller administration and security hardening',
      'Declarative Pipeline-as-Code authoring',
      'Docker daemon socket integration for CI runners',
      'GitHub Webhook event-driven pipeline automation',
      'Credential Vault secret masking and management',
      'Groovy Shared Libraries and dynamic SemVer tagging',
    ],
    walkthrough: {
      title: 'Declarative Pipeline-as-Code and Groovy Libraries Slides',
      description: 'Interactive lecture and slide deck covering Jenkins architecture, JENKINS_HOME, and automated release gates.',
    },
    labs: [
      {
        id: 'm07-lab1',
        num: 'Lab 1',
        title: 'Environment Setup, Jenkins Installation, and System Configuration',
        scenario: 'Provision and secure a dedicated CI/CD controller on Linux with systemd.',
        tools: 'apt install openjdk-17-jre, curl, systemctl enable --now jenkins',
      },
      {
        id: 'm07-lab2',
        num: 'Lab 2',
        title: 'Freestyle Jobs, Build Automation, and Docker Integration',
        scenario: 'Transition from manual CLI to automated UI jobs and containerize builds safely.',
        tools: 'usermod -aG docker jenkins, systemctl restart jenkins, docker build',
      },
      {
        id: 'm07-lab3',
        num: 'Lab 3',
        title: 'Declarative Pipelines and Jenkinsfile Architecture',
        scenario: 'Replace UI-managed jobs with version-controlled Pipeline-as-Code definitions.',
        tools: 'pipeline {}, agent any, stages {}, stage() {}, steps {}, sh',
      },
      {
        id: 'm07-lab4',
        num: 'Lab 4',
        title: 'Multibranch Pipelines and Automated Webhook Triggers',
        scenario: 'Link GitHub push events to dynamic multibranch pipeline discovery and testing.',
        tools: 'GitHub Webhooks, Multibranch Pipeline configuration',
      },
      {
        id: 'm07-lab5',
        num: 'Lab 5',
        title: 'Enterprise Pipeline Security, Credentials, and Shared Libraries',
        scenario: 'Eliminate hardcoded secrets and prevent pipeline code duplication across teams.',
        tools: 'withCredentials(), @Library("shared-lib"), vars/buildDocker.groovy',
      },
      {
        id: 'm07-lab6',
        num: 'Lab 6',
        title: 'Advanced Dynamic Application Versioning in CI/CD',
        scenario: 'Replace latest tags with dynamic SemVer version parsing and registry publishing.',
        tools: 'cat version.txt, docker tag, docker login --password-stdin, docker push',
      },
    ],
    certificate: {
      title: 'Jenkins CI/CD Automation Specialist',
      credentialId: 'DM-CERT-M07-JNK',
    },
  },

  // ─── Module 08: AWS Services ────────────────────────────────────────────────
  {
    num: '08',
    title: 'AWS Services',
    difficulty: 'Intermediate',
    skillLevel: 'Associate / Practitioner',
    technologies: ['AWS IAM', 'AWS VPC', 'AWS EC2', 'Security Groups', 'AWS CLI v2', 'Elastic IP', 'Jenkins sshagent'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)', 'Module 06 (Docker)', 'Module 07 (Jenkins)'],
    enables: ['Module 10 (EKS)', 'Module 11 (Terraform)', 'Module 13 (Python Boto3)'],
    description:
      'Architect secure AWS cloud networks, enforce IAM security policies, provision elastic EC2 virtual servers, and extend Jenkins CI/CD pipelines to automate container deployments to the AWS public cloud.',
    keySkills: [
      'IAM access policy engineering and least-privilege scoping',
      'VPC network design with isolated subnets and route tables',
      'Stateful Security Group firewalling',
      'EC2 provisioning and keypair management',
      'AWS CLI programmatic queries and scripting',
      'Jenkins remote SSH continuous deployment pipelines',
    ],
    walkthrough: {
      title: 'AWS Global Infrastructure, IAM Policies, and VPC Isolation Slides',
      description: 'Interactive lecture and slide deck covering regions, AZs, CIDR allocation, Internet Gateways, and CD pipelines.',
    },
    labs: [
      {
        id: 'm08-prelab',
        num: 'Pre-Lab',
        title: 'Provisioning the AWS Environment and Prerequisites',
        scenario: 'Workstation setup, AWS CLI configuration, and safety billing alarms.',
        tools: 'curl, unzip, aws --version, ssh -V, AWS Console Budgets',
      },
      {
        id: 'm08-lab1',
        num: 'Lab 1',
        title: 'AWS Fundamentals, IAM, and Global Infrastructure',
        scenario: 'Restrict Root Account usage and establish role-based access control policies.',
        tools: 'AWS IAM Console, JSON Policy Editor, Managed Policies',
      },
      {
        id: 'm08-lab2',
        num: 'Lab 2',
        title: 'Virtual Private Cloud (VPC) Architecture and Network Isolation',
        scenario: 'Isolate cloud infrastructure using segregated public and private network tiers.',
        tools: 'AWS VPC Console, Subnet configuration, Route Tables, Internet Gateway',
      },
      {
        id: 'm08-lab3',
        num: 'Lab 3',
        title: 'Provisioning and Securing EC2 Virtual Compute Instances',
        scenario: 'Deploy cloud compute inside custom VPC secured by firewalls and SSH keys.',
        tools: 'chmod 400 key.pem, ssh -i key.pem, apt install nginx, systemctl enable nginx',
      },
      {
        id: 'm08-lab4',
        num: 'Lab 4',
        title: 'AWS Command Line Interface (CLI) and Automation Preview',
        scenario: 'Transition from manual console clicks to programmatic API execution with AWS CLI.',
        tools: 'aws configure, aws ec2 describe-instances, JSON/Table query filtering',
      },
      {
        id: 'm08-lab5',
        num: 'Lab 5',
        title: 'Continuous Deployment to AWS EC2 via Jenkins Pipeline',
        scenario: 'Connect CI/CD automation to cloud compute for automated container deployments.',
        tools: 'Jenkins credentials, sshagent, ssh -o StrictHostKeyChecking=no, docker run',
      },
      {
        id: 'm08-lab6',
        num: 'Lab 6',
        title: 'Production Pipeline Hardening and Container Services Preview',
        scenario: 'Stabilize dynamic server endpoints with Elastic IPs and preview cloud container services.',
        tools: 'AWS EC2 Elastic IP Console, git commit, git push origin main',
      },
    ],
    certificate: {
      title: 'AWS Cloud Deployment Specialist',
      credentialId: 'DM-CERT-M08-AWS',
    },
  },

  // ─── Module 09: Core Kubernetes Container Orchestration ─────────────────────
  {
    num: '09',
    title: 'Core Kubernetes Container Orchestration',
    difficulty: 'Advanced',
    skillLevel: 'Intermediate to Advanced DevOps Engineer',
    technologies: ['Kubernetes', 'Minikube', 'kubectl', 'Helm', 'Helmfile', 'Nginx Ingress', 'Redis', 'FastAPI'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)', 'Module 06 (Docker)'],
    enables: ['Module 10 (EKS)', 'Module 11 (Terraform)', 'Module 15 (Prometheus & Grafana)'],
    description:
      'Master core Kubernetes orchestration mechanics by moving from imperative control plane queries to declarative multi-service automation using YAML, Helm charts, and Helmfile.',
    keySkills: [
      'Control plane introspection and API Server queries',
      'Declarative YAML manifest creation (Deployments, Services, Ingress)',
      'Persistent volume claims (PVCs) and state decoupling',
      'API security and Role-Based Access Control (RBAC)',
      'Liveness/readiness probes and pod lifecycle hooks',
      'Custom Helm chart blueprinting and multi-chart Helmfile orchestration',
    ],
    walkthrough: {
      title: 'Kubernetes Control Plane Architecture and Topologies Slides',
      description: 'Interactive lecture and slide deck covering etcd, Scheduler, kubelet, ClusterIP vs NodePort, and Helm templating.',
    },
    labs: [
      {
        id: 'm09-lab1',
        num: 'Lab 1',
        title: 'Control Plane Initialization and Imperative Mechanics',
        scenario: 'Bootstrap single-node cluster and inspect core control plane components.',
        tools: 'minikube start, kubectl cluster-info, kubectl get nodes, kubectl run, kubectl logs',
      },
      {
        id: 'm09-lab2',
        num: 'Lab 2',
        title: 'Declarative Topologies and Service Discovery',
        scenario: 'Build stable virtual IPs and load balancing for a FastAPI deployment.',
        tools: 'kubectl apply, kubectl get deploy, kubectl rollout status, kubectl rollout undo',
      },
      {
        id: 'm09-lab3',
        num: 'Lab 3',
        title: 'State Decoupling, Secrets, and Volume Persistency',
        scenario: 'Isolate Redis credentials and mount storage claims to survive pod terminations.',
        tools: 'kubectl apply, kubectl get pvc, kubectl delete pod, redis-cli SET/GET',
      },
      {
        id: 'm09-lab4',
        num: 'Lab 4',
        title: 'Multi-Tenancy Isolation and Ingress Routing',
        scenario: 'Partition cluster environments and expose services via Layer 7 Nginx routing rules.',
        tools: 'kubens, minikube addons enable ingress, kubectl apply, curl',
      },
      {
        id: 'm09-lab5',
        num: 'Lab 5',
        title: 'API Security and Role-Based Access Control',
        scenario: 'Restrict API Server access with granular ServiceAccount permissions and tokens.',
        tools: 'kubectl create serviceaccount, kubectl apply, kubectl auth can-i, kubectl create token',
      },
      {
        id: 'm09-lab6',
        num: 'Lab 6',
        title: 'Production Hardening and Pod Lifecycle Probes',
        scenario: 'Enforce resource limits and add self-healing probes and pre-stop lifecycle hooks.',
        tools: 'kubectl top pods, kubectl top nodes, kubectl describe pod, curl',
      },
      {
        id: 'm09-lab7',
        num: 'Lab 7',
        title: 'Custom Helm Chart Blueprinting',
        scenario: 'Convert static manifests into parameterizable Helm packages using Go templates.',
        tools: 'helm create, helm lint, helm template, helm install, helm list, helm upgrade',
      },
      {
        id: 'm09-lab8',
        num: 'Lab 8',
        title: 'Declarative Multi-Service Orchestration via Helmfile',
        scenario: 'Orchestrate multi-tier, multi-environment chart releases using a master declaration.',
        tools: 'helmfile sync, helmfile diff, helmfile status, helmfile destroy, helm rollback',
      },
    ],
    certificate: {
      title: 'Certified Kubernetes Administrator and Orchestration Specialist',
      credentialId: 'DM-CERT-M09-K8S',
    },
  },

  // ─── Module 10: Kubernetes on AWS (EKS) ─────────────────────────────────────
  {
    num: '10',
    title: 'Kubernetes on AWS (EKS)',
    difficulty: 'Advanced / Enterprise',
    skillLevel: 'Senior DevOps Engineer / Cloud Architect',
    technologies: ['AWS EKS', 'eksctl', 'AWS CLI', 'kubectl', 'Helm', 'AWS IAM', 'OIDC', 'AWS Fargate', 'Karpenter', 'AWS ECR'],
    prerequisites: ['Module 01 (Linux)', 'Module 05 (IaaS)', 'Module 06 (Docker)', 'Module 07 (Jenkins)', 'Module 08 (AWS)', 'Module 09 (Kubernetes)'],
    enables: ['Module 11 (Terraform)', 'Module 15 (Observability)', 'Production Cloud Engineering'],
    description:
      'Master enterprise AWS Elastic Kubernetes Service (EKS) management using declarative IaC (eksctl), serverless compute (Fargate), sub-second autoscaling (Karpenter), zero-trust security (IRSA), and Jenkins rollouts.',
    keySkills: [
      'Declarative EKS provisioning via eksctl YAML',
      'Serverless pod routing with AWS Fargate profiles',
      'Sub-second node allocation with Karpenter NodePools',
      'OIDC identity federation and IRSA least-privilege pod roles',
      'Private artifact supply chain isolation with AWS ECR',
      'Token-authenticated Jenkins CI/CD pipeline deployment to EKS',
    ],
    walkthrough: {
      title: 'Enterprise EKS Architecture, OIDC Federation, and Karpenter Slides',
      description: 'Interactive lecture and slide deck covering managed control planes, EC2 vs Fargate trade-offs, and IMDS exploit prevention.',
    },
    labs: [
      {
        id: 'm10-lab1',
        num: 'Lab 1',
        title: 'The Cryptographic Foundation and Cluster Bootstrap',
        scenario: 'Provision HA multi-AZ EKS cluster via IaC and establish OIDC identity trust.',
        tools: 'eksctl create cluster, aws eks update-kubeconfig, kubectl get nodes, OIDC provider',
      },
      {
        id: 'm10-lab2',
        num: 'Lab 2',
        title: 'Compute Models and Serverless Abstraction',
        scenario: 'Route bursty workloads to Fargate profiles while maintaining EC2 worker nodes.',
        tools: 'kubectl create deployment, eksctl create fargateprofile, kubectl create namespace',
      },
      {
        id: 'm10-lab3',
        num: 'Lab 3',
        title: 'Elastic Elasticity: Autoscaling Paradigms',
        scenario: 'Saturate cluster capacity and implement Karpenter JIT sub-second node scaling.',
        tools: 'kubectl scale, helm install cluster-autoscaler, NodePool CRD, EC2NodeClass',
      },
      {
        id: 'm10-lab4',
        num: 'Lab 4',
        title: 'The Principle of Least Privilege: IRSA and RBAC',
        scenario: 'Eliminate node-level IAM exploitation and enforce Kubernetes RBAC boundaries.',
        tools: 'kubectl exec, eksctl create iamserviceaccount, kubectl create role, kubectl create token',
      },
      {
        id: 'm10-lab5',
        num: 'Lab 5',
        title: 'The Secure Artifact Gateway: AWS ECR',
        scenario: 'Replace public image dependencies with private ECR repositories and scanning.',
        tools: 'aws ecr create-repository, aws ecr get-login-password, docker tag/push, kubectl apply',
      },
      {
        id: 'm10-lab6',
        num: 'Lab 6',
        title: 'The Deployment Engine: Jenkins CI/CD Orchestration',
        scenario: 'Build token-authenticated Jenkins pipeline for automated, zero-downtime EKS rollouts.',
        tools: 'Jenkinsfile, envsubst, docker build/push, kubectl apply, kubectl rollout status',
      },
    ],
    certificate: {
      title: 'AWS EKS Enterprise Platform Architect',
      credentialId: 'DM-CERT-M10-EKS',
    },
  },

  // ─── Module 11: Terraform ───────────────────────────────────────────────────
  {
    num: '11',
    title: 'Terraform',
    difficulty: 'Intermediate to Advanced',
    skillLevel: 'Professional DevOps / Infrastructure Engineer',
    technologies: ['Terraform CLI v1.9+', 'HCL', 'AWS (EC2, VPC, EKS, IAM, S3, DynamoDB)', 'Git', 'GitHub Actions'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)', 'Module 05 (Cloud Computing & AWS)'],
    enables: ['Automated Infrastructure Pipelines', 'GitOps Foundations', 'Multi-Environment Deployments'],
    description:
      'Master declarative Infrastructure as Code using Terraform to automate, scale, parameterize, secure, and continuously deploy AWS cloud infrastructure and EKS Kubernetes clusters.',
    keySkills: [
      'HCL declarative syntax and execution graph (DAG)',
      'Provider configuration and resource lifecycle management',
      'State file inspection and out-of-band drift remediation',
      'Infrastructure parameterization (Variables, tfvars, Outputs)',
      'Reusable Root and Child Module architecture',
      'Remote state backends with S3 and DynamoDB concurrency locking',
    ],
    walkthrough: {
      title: 'Declarative Infrastructure as Code and Execution Graph Slides',
      description: 'Interactive lecture and slide deck covering HCL syntax, provider plugins, state locking, and module extraction.',
    },
    labs: [
      {
        id: 'm11-lab1',
        num: 'Lab 1',
        title: 'Understanding Infrastructure as Code',
        scenario: 'Transition manual provisioning to declarative code.',
        tools: 'Conceptual Architecture Analysis, DAG Flowcharts',
      },
      {
        id: 'm11-lab2',
        num: 'Lab 2',
        title: 'Installing Terraform and Preparing the Project',
        scenario: 'Configure workstation tooling and project layout.',
        tools: 'apt-get, terraform init, terraform fmt, terraform validate',
      },
      {
        id: 'm11-lab3',
        num: 'Lab 3',
        title: 'Providers, Resources and Data Sources',
        scenario: 'Interface Terraform with AWS provider APIs.',
        tools: 'terraform init, terraform providers, terraform validate',
      },
      {
        id: 'm11-lab4',
        num: 'Lab 4',
        title: 'Planning, Applying and Destroying Infrastructure',
        scenario: 'Execute core IaC lifecycle for an EC2 instance.',
        tools: 'terraform plan, terraform apply, terraform destroy',
      },
      {
        id: 'm11-lab5',
        num: 'Lab 5',
        title: 'Understanding Terraform State',
        scenario: 'Reconcile state discrepancies and out-of-band drift.',
        tools: 'terraform show, terraform state list, terraform state show',
      },
      {
        id: 'm11-lab6',
        num: 'Lab 6',
        title: 'Working with Output Values',
        scenario: 'Export instance metadata and outputs for pipelines.',
        tools: 'terraform output, variables.tf, outputs.tf',
      },
      {
        id: 'm11-lab7',
        num: 'Lab 7',
        title: 'Variables in Terraform',
        scenario: 'Parameterize environments using input variables.',
        tools: 'terraform plan, terraform apply -var-file',
      },
      {
        id: 'm11-lab8',
        num: 'Lab 8',
        title: 'Environment Variables and Version Control',
        scenario: 'Inject secure secrets and track code in Git.',
        tools: 'export TF_VAR_, git init, git add, git commit',
      },
      {
        id: 'm11-lab9',
        num: 'Lab 9',
        title: 'Automating AWS Infrastructure (EC2)',
        scenario: 'Provision an EC2 server with SSH and security groups.',
        tools: 'terraform init, terraform validate, terraform plan, terraform apply',
      },
      {
        id: 'm11-lab10',
        num: 'Lab 10',
        title: 'Managing Infrastructure Changes',
        scenario: 'Execute in-place updates on live infrastructure.',
        tools: 'terraform plan, terraform apply (in-place updates)',
      },
      {
        id: 'm11-lab11',
        num: 'Lab 11',
        title: 'Destroying Infrastructure Safely',
        scenario: 'Safely deprovision resources and prune dependencies.',
        tools: 'terraform destroy -target, dependency graph pruning',
      },
      {
        id: 'm11-lab12',
        num: 'Lab 12',
        title: 'Terraform Provisioners',
        scenario: 'Bootstrap Docker on EC2 with remote-exec provisioners.',
        tools: 'terraform apply, SSH remote-exec provisioner',
      },
      {
        id: 'm11-lab13',
        num: 'Lab 13',
        title: 'Reusable Infrastructure with Modules',
        scenario: 'Architect reusable Root and Child module hierarchies.',
        tools: 'tree, module blocks, terraform init, terraform validate',
      },
      {
        id: 'm11-lab14',
        num: 'Lab 14',
        title: 'Provisioning an Amazon EKS Cluster',
        scenario: 'Deploy managed AWS EKS clusters with verified modules.',
        tools: 'terraform apply, aws eks update-kubeconfig, kubectl get nodes',
      },
      {
        id: 'm11-lab15',
        num: 'Lab 15',
        title: 'Complete CI/CD Pipeline with Actions',
        scenario: 'Automate linting and speculative plans in CI/CD.',
        tools: 'GitHub Actions, terraform fmt -check, terraform validate, terraform plan',
      },
      {
        id: 'm11-lab16',
        num: 'Lab 16',
        title: 'Remote State & Distributed Locking',
        scenario: 'Configure S3 remote state and DynamoDB locks.',
        tools: 'terraform init -migrate-state, S3 backend, DynamoDB locks',
      },
    ],
    certificate: {
      title: 'Certified Infrastructure as Code and Terraform Specialist',
      credentialId: 'DM-CERT-M11-TFM',
    },
  },

  // ─── Module 12: Programming with Python ─────────────────────────────────────
  {
    num: '12',
    title: 'Programming with Python',
    difficulty: 'Intermediate to Advanced',
    skillLevel: 'Professional / Production-Ready',
    technologies: ['Python 3', 'subprocess', 'requests', 'Flask', 'functools', 'pip', 'JSON', 'cURL'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)'],
    enables: ['Module 13 (Python Automation with Boto3)', 'Module 14 (Ansible)'],
    description:
      'Master production-grade Python automation, object-oriented infrastructure modeling, error trapping, secure OS interactions, REST API integration, and webhook microservices.',
    keySkills: [
      'Strict data typing, type casting, and PEP 484 type hints',
      'Defensive control flow and resource metric gating',
      'Subprocess execution without shell injection vulnerabilities',
      'Object-oriented infrastructure modeling (classes, inheritance, dunder methods)',
      'Custom decorator construction for timing and automated retries',
      'REST API client integration and Flask webhook microservices',
    ],
    walkthrough: {
      title: 'Python System Automation and Defensive Scripting Slides',
      description: 'Interactive lecture and slide deck covering type safety, custom exception hierarchies, and secure subprocess wrappers.',
    },
    labs: [
      {
        id: 'm12-lab1',
        num: 'Lab 1',
        title: 'The Execution Environment',
        scenario: 'Diagnose and fix port type mismatch failures in production automation scripts.',
        tools: 'type(), str(), int(), f-strings, os.environ.get()',
      },
      {
        id: 'm12-lab2',
        num: 'Lab 2',
        title: 'Deterministic Control Flow',
        scenario: 'Prevent blind deployment execution by verifying load and disk thresholds.',
        tools: 'if, elif, else, and, or, not',
      },
      {
        id: 'm12-lab3',
        num: 'Lab 3',
        title: 'Structural Aggregation',
        scenario: 'Refactor loose hardcoded variables into structured collections and dictionary comprehensions.',
        tools: 'list, set, dict, dict comprehensions, len(), sorted()',
      },
      {
        id: 'm12-lab4',
        num: 'Lab 4',
        title: 'Iteration and Functional Abstraction',
        scenario: 'Replace monolithic repetitive loops with typed, reusable polling functions.',
        tools: 'def, for, while, type hints (str, bool, ->)',
      },
      {
        id: 'm12-lab5',
        num: 'Lab 5',
        title: 'Anticipating Catastrophe',
        scenario: 'Prevent raw traceback leaks by engineering custom exception hierarchies.',
        tools: 'try, except, finally, custom Exception classes, raise',
      },
      {
        id: 'm12-lab6',
        num: 'Lab 6',
        title: 'The Operating System Interface',
        scenario: 'Automate directory creation and execute shell commands safely without shell injection.',
        tools: 'os.makedirs, subprocess.run, with open(), datetime',
      },
      {
        id: 'm12-lab7',
        num: 'Lab 7',
        title: 'Data Serialization and Payloads',
        scenario: 'Ingest, mutate, and write back service configuration state without data loss.',
        tools: 'json.loads, json.dumps, json.load, json.dump',
      },
      {
        id: 'm12-lab8',
        num: 'Lab 8',
        title: 'Architectural Modularity',
        scenario: 'Decompose monolithic scripts into reusable packages and manage third-party modules.',
        tools: 'import, from ... import, pip install, requests',
      },
      {
        id: 'm12-lab9',
        num: 'Lab 9',
        title: 'Object Oriented Infrastructure',
        scenario: 'Model cloud assets (servers, databases) using classes, inheritance, and dunder methods.',
        tools: 'class, __init__, self, super(), __str__',
      },
      {
        id: 'm12-lab10',
        num: 'Lab 10',
        title: 'Advanced Execution Control',
        scenario: 'Construct custom decorators for automated API retries and execution profiling.',
        tools: '@decorator, functools.wraps, time.perf_counter()',
      },
      {
        id: 'm12-lab11',
        num: 'Lab 11',
        title: 'The Remote API Gateway',
        scenario: 'Communicate with external REST endpoints to trigger deployment actions.',
        tools: 'requests.get, requests.post, response.json(), raise_for_status()',
      },
      {
        id: 'm12-lab12',
        num: 'Lab 12',
        title: 'Infrastructure as a Service',
        scenario: 'Construct a lightweight Flask microservice to receive upstream deployment webhooks.',
        tools: 'Flask, @app.route, request.get_json(), jsonify, curl',
      },
    ],
    certificate: {
      title: 'Production Python and System Automation Engineer',
      credentialId: 'DM-CERT-M12-PYT',
    },
  },

  // ─── Module 13: Python Automation (AWS Boto3) ───────────────────────────────
  {
    num: '13',
    title: 'Python Automation (AWS Boto3)',
    difficulty: 'Intermediate to Advanced',
    skillLevel: 'Advanced Practitioner / DevOps Engineer',
    technologies: ['Python 3', 'Boto3', 'Botocore', 'AWS EC2', 'AWS EBS', 'AWS EKS', 'AWS SNS', 'Requests', 'Schedule'],
    prerequisites: ['Module 01 (Linux)', 'Module 08 (AWS)', 'Module 12 (Python)'],
    enables: ['Advanced SRE Automation', 'Self-Healing Cloud Infrastructure', 'Serverless Remediation'],
    description:
      'Master programmatic AWS infrastructure control using Python and Boto3. Build automated auditors, governance enforcers, EBS snapshot lifecycles, disaster recovery protocols, and self-healing watchdogs.',
    keySkills: [
      'Boto3 Client and Resource session abstractions',
      'SDK authentication chains without hardcoded credentials',
      'EC2 fleet health auditing and automated tag governance',
      'EBS snapshot lifecycle management and age-based retention',
      'Automated root volume disaster recovery restoration',
      'Botocore error trapping, Waiters, and self-healing reboot daemons',
    ],
    walkthrough: {
      title: 'AWS SDK Architecture, Waiters, and Self-Healing Watchdogs Slides',
      description: 'Interactive lecture and slide deck covering credential provider chains, Client vs Resource models, and DR automation.',
    },
    labs: [
      {
        id: 'm13-lab1',
        num: 'Lab 1',
        title: 'The Cryptographic Handshake (Boto3 Architecture)',
        scenario: 'Eliminate hardcoded credentials and configure profile-based Boto3 sessions.',
        tools: 'boto3.client(), boto3.resource(), ~/.aws/credentials',
      },
      {
        id: 'm13-lab2',
        num: 'Lab 2',
        title: 'Infrastructure Interrogation (EC2 Health Auditing)',
        scenario: 'Audit fleet hardware degradation without opening the AWS Console.',
        tools: 'ec2_client.describe_instance_status()',
      },
      {
        id: 'm13-lab3',
        num: 'Lab 3',
        title: 'The Metadata Enforcer (Automated Tagging)',
        scenario: 'Identify untagged EC2 instances and apply cost-allocation tags in bulk.',
        tools: 'describe_instances(), create_tags()',
      },
      {
        id: 'm13-lab4',
        num: 'Lab 4',
        title: 'The Kubernetes Reconnaissance (EKS Cluster Info)',
        scenario: 'Retrieve dynamic EKS control-plane parameters for CI/CD pipeline integration.',
        tools: 'boto3.client("eks"), describe_cluster()',
      },
      {
        id: 'm13-lab5',
        num: 'Lab 5',
        title: 'Immutable Archives (EBS Snapshot Automation)',
        scenario: 'Automate disaster recovery backups for production EBS storage volumes.',
        tools: 'volumes.filter(), create_snapshot(), ISO timestamp tags',
      },
      {
        id: 'm13-lab6',
        num: 'Lab 6',
        title: 'The Garbage Collector (Snapshot Cleanup)',
        scenario: 'Purge obsolete EBS snapshots older than 30 days safely with dry-run checks.',
        tools: 'timedelta, snapshots.filter(), snapshot.delete()',
      },
      {
        id: 'm13-lab7',
        num: 'Lab 7',
        title: 'The Disaster Recovery Protocol (Automated Restore)',
        scenario: 'Rebuild corrupted root volumes programmatically from archived snapshots.',
        tools: 'detach_volume(), create_volume(), attach_volume()',
      },
      {
        id: 'm13-lab8',
        num: 'Lab 8',
        title: 'Resilience Under Fire (Boto3 Error Trapping)',
        scenario: 'Handle API throttling, rate limits, and eventual consistency delays with Waiters.',
        tools: 'botocore.exceptions.ClientError, get_waiter()',
      },
      {
        id: 'm13-lab9',
        num: 'Lab 9',
        title: 'The Watchdog Daemon (Monitoring and Scheduling)',
        scenario: 'Construct a continuous health check loop independent of AWS tools.',
        tools: 'schedule.every().seconds.do(), requests.get()',
      },
      {
        id: 'm13-lab10',
        num: 'Lab 10',
        title: 'The Self-Healing Infrastructure (Alerting and Automated Reboot)',
        scenario: 'Trigger automated SNS alerts and EC2 reboots on degraded health signals.',
        tools: 'sns_client.publish(), reboot_instances()',
      },
    ],
    certificate: {
      title: 'AWS Python Automation and SRE Specialist',
      credentialId: 'DM-CERT-M13-BT3',
    },
  },

  // ─── Module 14: Ansible ─────────────────────────────────────────────────────
  {
    num: '14',
    title: 'Ansible',
    difficulty: 'Intermediate to Advanced',
    skillLevel: 'Professional DevOps Engineer / Platform Engineer',
    technologies: ['Ansible Core', 'Python 3', 'OpenSSH', 'YAML', 'Jinja2', 'Docker', 'Terraform', 'AWS EC2', 'Kubernetes'],
    prerequisites: ['Module 01 (Linux)', 'Module 02 (Git)', 'Module 05 (IaaS)', 'Module 06 (Docker)', 'Module 08 (AWS)', 'Module 11 (Terraform)'],
    enables: ['Enterprise Fleet Patching', 'Self-Healing Cloud Infrastructure', 'GitOps Operations'],
    description:
      'Master declarative configuration management and cross-cloud fleet orchestration using Ansible. Build agentless, idempotent automation pipelines connecting Terraform, Docker, AWS EC2, Kubernetes, and Jenkins.',
    keySkills: [
      'Agentless architecture and SSH key distribution',
      'Idempotent Playbook and reusable Role engineering',
      'Inventory control (static INI and dynamic AWS EC2 discovery)',
      'Jinja2 templating and dynamic variable parameterization',
      'Multi-cloud integration (Terraform, Docker, Kubernetes, Jenkins)',
    ],
    walkthrough: {
      title: 'Agentless Architecture, Desired State, and Playbooks Slides',
      description: 'Interactive lecture and slide deck covering idempotency, inventory management, and Ansible Galaxy collections.',
    },
    labs: [
      {
        id: 'm14-lab1',
        num: 'Lab 1',
        title: 'Understanding Configuration Management',
        scenario: 'Transition fleet administration to agentless automation.',
        tools: 'Ansible concepts, SSH architecture analysis',
      },
      {
        id: 'm14-lab2',
        num: 'Lab 2',
        title: 'Installing Ansible on the Control Node',
        scenario: 'Provision Control Node and verify Ansible runtime.',
        tools: 'apt update, apt install ansible, ansible --version',
      },
      {
        id: 'm14-lab3',
        num: 'Lab 3',
        title: 'Preparing Managed Servers',
        scenario: 'Configure SSH keys and test managed node reachability.',
        tools: 'ssh-keygen, ssh-copy-id, ssh reachability tests',
      },
      {
        id: 'm14-lab4',
        num: 'Lab 4',
        title: 'Inventory and Ad-hoc Commands',
        scenario: 'Run ad-hoc commands across inventory host groups.',
        tools: 'ansible all -m ping, ansible -m apt -a ... --become',
      },
      {
        id: 'm14-lab5',
        num: 'Lab 5',
        title: 'Introduction to Ansible Playbooks',
        scenario: 'Write declarative playbooks to manage services.',
        tools: 'ansible-playbook install-nginx.yaml',
      },
      {
        id: 'm14-lab6',
        num: 'Lab 6',
        title: 'Managing SSH Keys and Host Key Checking',
        scenario: 'Tune SSH host checking for unattended automation.',
        tools: 'ssh-keygen -t ed25519, ssh-copy-id, ansible.cfg',
      },
      {
        id: 'm14-lab7',
        num: 'Lab 7',
        title: 'Ansible Modules and Collections',
        scenario: 'Install collections for Docker, AWS, and Kubernetes.',
        tools: 'ansible-galaxy collection install community.docker',
      },
      {
        id: 'm14-lab8',
        num: 'Lab 8',
        title: 'Deploying a Node.js Application',
        scenario: 'Deploy Node.js apps with idempotent tasks and curl.',
        tools: 'ansible-playbook deploy-nodejs.yaml --check, curl',
      },
      {
        id: 'm14-lab9',
        num: 'Lab 9',
        title: 'Making Playbooks Reusable with Variables',
        scenario: 'Parameterize playbooks with vars and external inputs.',
        tools: 'ansible-playbook deploy.yaml -e "target_app=..."',
      },
      {
        id: 'm14-lab10',
        num: 'Lab 10',
        title: 'Deploying Nexus Repository Manager',
        scenario: 'Deploy Nexus Manager using Jinja2 and systemd.',
        tools: 'get_url, template, systemd, ansible-playbook --tags',
      },
      {
        id: 'm14-lab11',
        num: 'Lab 11',
        title: 'Managing Docker Applications',
        scenario: 'Orchestrate Docker containers across server fleets.',
        tools: 'ansible-playbook -i inventory.ini docker.yaml, community.docker',
      },
      {
        id: 'm14-lab12',
        num: 'Lab 12',
        title: 'Terraform Provisioning & Ansible Config',
        scenario: 'Pipe Terraform outputs directly into Ansible inventory.',
        tools: 'terraform apply, terraform output -raw, ansible-playbook',
      },
      {
        id: 'm14-lab13',
        num: 'Lab 13',
        title: 'Dynamic Inventory for AWS EC2',
        scenario: 'Auto-discover AWS EC2 instances with dynamic inventory.',
        tools: 'amazon.aws collection, dynamic inventory plugin',
      },
      {
        id: 'm14-lab14',
        num: 'Lab 14',
        title: 'Deploying Applications to Kubernetes',
        scenario: 'Deploy Kubernetes manifests via Ansible collections.',
        tools: 'kubernetes.core collection, ansible-playbook',
      },
      {
        id: 'm14-lab15',
        num: 'Lab 15',
        title: 'Jenkins CI/CD Pipeline Integration',
        scenario: 'Trigger playbooks from Jenkins CI/CD pipeline stages.',
        tools: 'Jenkins pipeline sh ansible-playbook stage',
      },
      {
        id: 'm14-lab16',
        num: 'Lab 16',
        title: 'Reusable Automation with Ansible Roles',
        scenario: 'Package automation into portable, reusable Roles.',
        tools: 'Role directory structure (tasks, defaults, handlers, templates, files)',
      },
    ],
    certificate: {
      title: 'Certified Configuration Management and Ansible Specialist',
      credentialId: 'DM-CERT-M14-ANS',
    },
  },

  // ─── Module 15: Enterprise Cluster Monitoring and Observability ─────────────
  {
    num: '15',
    title: 'Enterprise Cluster Monitoring and Observability with Prometheus and Grafana',
    difficulty: 'Advanced',
    skillLevel: 'Senior DevOps Engineer / Observability Specialist',
    technologies: ['Prometheus Operator', 'Grafana', 'Alertmanager', 'Helm', 'Kubernetes CRDs', 'Node Exporter', 'prom-client', 'PromQL'],
    prerequisites: ['Module 01 (Linux)', 'Module 06 (Docker)', 'Module 09 (Kubernetes)', 'Module 10 (EKS)'],
    enables: ['Enterprise SRE Practice', 'Dynamic Horizontal Pod Autoscaling', 'Incident Response Automation'],
    description:
      'Master enterprise-grade Kubernetes observability by deploying the Prometheus Operator stack, writing declarative alerting rules, routing alerts via Alertmanager, and crafting PromQL dashboards in Grafana.',
    keySkills: [
      'Helm chart deployment of kube-prometheus-stack',
      'Prometheus Operator CRDs (PrometheusRule, ServiceMonitor, AlertmanagerConfig)',
      'PromQL query formulation and rate calculation',
      'Alert lifecycle management (Pending -> Firing -> Resolved)',
      'Sidecar exporter integration and application instrumentation',
      'Production Grafana dashboard engineering',
    ],
    walkthrough: {
      title: 'Prometheus Operator Architecture, PromQL, and Alertmanager Routing Slides',
      description: 'Interactive lecture and slide deck covering pull metrics, time series models, scrape targets, and alert grouping.',
    },
    labs: [
      {
        id: 'm15-lab1',
        num: 'Lab 1',
        title: 'The Operator Pattern (Deploying the Stack)',
        scenario: 'Deploy complete enterprise monitoring stack using Prometheus Operator via Helm.',
        tools: 'helm repo add/update, kubectl create ns, helm install, kubectl get secret',
      },
      {
        id: 'm15-lab2',
        num: 'Lab 2',
        title: 'The Telemetry Grid (Targets, Jobs, and Labels)',
        scenario: 'Expose Prometheus UI to inspect pull-based scraping mechanics and label dimensions.',
        tools: 'kubectl port-forward, Prometheus Status UI, scrape target audits',
      },
      {
        id: 'm15-lab3',
        num: 'Lab 3',
        title: 'The Automated Watchdog (PrometheusRule CRD)',
        scenario: 'Author declarative alerting rules with Go-template interpolation in annotations.',
        tools: 'kubectl apply, PrometheusRule manifest, config-reloader logs',
      },
      {
        id: 'm15-lab4',
        num: 'Lab 4',
        title: 'Infrastructure Stress Testing (Simulating Failure)',
        scenario: 'Spike CPU load to observe alert transitions through Pending and Firing states.',
        tools: 'kubectl run stress pod, curl REST API query, jq, kubectl delete pod',
      },
      {
        id: 'm15-lab5',
        num: 'Lab 5',
        title: 'Alertmanager Routing Trees (Notification Delivery)',
        scenario: 'Configure routing trees to route critical alerts and prevent notification fatigue.',
        tools: 'AlertmanagerConfig manifest, kubectl apply, notification grouping',
      },
      {
        id: 'm15-lab6',
        num: 'Lab 6',
        title: 'Third-Party Integration (Exporters and ServiceMonitors)',
        scenario: 'Deploy Redis with exporter sidecar and configure ServiceMonitor scrape discovery.',
        tools: 'helm install metrics.enabled=true, ServiceMonitor, Grafana import',
      },
      {
        id: 'm15-lab7',
        num: 'Lab 7',
        title: 'Application Instrumentation (Custom In-House Metrics)',
        scenario: 'Instrument Node.js Express server using prom-client and deploy with ServiceMonitor.',
        tools: 'npm install prom-client, docker build, ServiceMonitor, curl traffic loop',
      },
      {
        id: 'm15-lab8',
        num: 'Lab 8',
        title: 'The Custom Telemetry Dashboard (PromQL and Grafana)',
        scenario: 'Build custom Grafana visualization panel using PromQL rate calculations on custom metrics.',
        tools: 'Grafana UI Editor, rate(http_request_operations_total[2m])',
      },
    ],
    certificate: {
      title: 'Enterprise Observability and Site Reliability Engineer',
      credentialId: 'DM-CERT-M15-MON',
    },
  },
];
