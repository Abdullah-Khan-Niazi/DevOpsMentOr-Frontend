import { useState } from 'react';
import { Button } from '@/shared/components';

interface Checkpoint {
  id: string;
  name: string;
  hint: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface GuidedCommand {
  label: string;
  command: string;
}

interface UnguidedTask {
  title: string;
  description: string;
  hintCommand: string;
}

interface BreakFixChallenge {
  title: string;
  description: string;
  steps: Array<{ label: string; detail: string }>;
  remediationCommand: string;
}

interface LabContentDefinition {
  summary: string;
  phase1Description: string;
  guidedCommands: GuidedCommand[];
  unguidedTasks: UnguidedTask[];
  breakFix: BreakFixChallenge;
  checkpoints: Checkpoint[];
  quiz: QuizQuestion[];
}

interface LabLearningPanelProps {
  labSlug: string;
  labName: string;
  assertions: Array<{ name: string; passed: boolean; message: string | null }>;
  isChecking: boolean;
  hasRunChecks: boolean;
  onRunChecks: () => void;
}

const LAB_CONTENT_BY_SLUG: Record<string, LabContentDefinition> = {
  '01-os-linux-basics': {
    summary:
      'Audit active processes, generate an OS memory baseline, neutralize a rogue background worker leaking resources, and remediate a broken metrics daemon.',
    phase1Description:
      'Connect to the terminal on the right. Inspect the process hierarchy and determine the virtualization environment:',
    guidedCommands: [
      { label: '1. INSPECT PROCESS TABLE', command: 'ps aux | head -n 15' },
      { label: '2. VIRTUALIZATION & OS IDENTIFICATION', command: 'systemd-detect-virt && uname -a' },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Generate System Memory Baseline',
        description:
          'Create directory /workspace/system_audit/ and write the formatted memory output of free -m into /workspace/system_audit/memory_report.txt.',
        hintCommand: 'mkdir -p /workspace/system_audit && free -m > /workspace/system_audit/memory_report.txt',
      },
      {
        title: 'Task 2.2 — Neutralize Rogue Worker Process',
        description:
          'A rogue background worker (/usr/local/bin/rogue-worker.sh) is continuously consuming CPU cycles and logging garbage. Locate its PID and terminate it cleanly.',
        hintCommand: 'pkill -9 -f rogue-worker.sh',
      },
    ],
    breakFix: {
      title: 'Incident: Remediate Metrics Collector Daemon',
      description:
        'The mission-critical collector script at /opt/services/metrics-collector.sh failed on launch. Investigate and remediate the 4 failure root causes:',
      steps: [
        { label: 'Permissions', detail: 'Restore executable rights (chmod 755 /opt/services/metrics-collector.sh).' },
        { label: 'Configuration', detail: 'Edit /opt/services/config.env to set STATUS=active.' },
        { label: 'Log Authorization', detail: 'Ensure log file /var/log/metrics-collector.log is writable.' },
        { label: 'Background Launch', detail: 'Run the service daemon in the background with nohup.' },
      ],
      remediationCommand:
        "sudo chmod 755 /opt/services/metrics-collector.sh && sudo sed -i 's/STATUS=.*/STATUS=active/' /opt/services/config.env && sudo touch /var/log/metrics-collector.log && sudo chmod 666 /var/log/metrics-collector.log && nohup /opt/services/metrics-collector.sh >> /var/log/metrics-collector.log 2>&1 &",
    },
    checkpoints: [
      {
        id: 'checkpoint_1_ps',
        name: 'Process Table & Init Inspection',
        hint: 'Ensure the process table is accessible and system daemons are running with ps aux.',
      },
      {
        id: 'checkpoint_2_mem',
        name: 'Memory Audit Baseline File',
        hint: 'Save memory baseline from free -m into /workspace/system_audit/memory_report.txt.',
      },
      {
        id: 'checkpoint_3_rogue',
        name: 'Rogue Process Terminated',
        hint: 'Locate and terminate /usr/local/bin/rogue-worker.sh using: pkill -9 -f rogue-worker.sh',
      },
      {
        id: 'checkpoint_4_service',
        name: 'Metrics Collector Service Remediated & Active',
        hint: 'Restore chmod 755 permissions, set STATUS=active in config.env, fix log permissions, and launch in background.',
      },
    ],
    quiz: [
      {
        id: 1,
        question:
          'In a headless Linux environment, which command reliably detects whether the system is running inside a Docker or container runtime?',
        options: ['systemd-detect-virt', 'cat /etc/virtual-machine', 'sudo virt-check --engine', 'lscpu --hardware-only'],
        correctIndex: 0,
        explanation:
          'systemd-detect-virt interrogates virtualization and container flags (such as docker, podman, lxc, or kvm) from kernel interfaces.',
      },
      {
        id: 2,
        question: 'When auditing memory with free -m, what does the "available" column indicate compared to "free"?',
        options: [
          'It represents unused RAM plus reclaimable page cache and buffer memory usable without swapping.',
          'It is pure unallocated physical RAM that has never had any kernel allocations.',
          'It represents memory strictly reserved for the Linux swap partition.',
          'It is simply total RAM minus used RAM, completely ignoring caching.',
        ],
        correctIndex: 0,
        explanation:
          'Linux caches filesystem reads in RAM. The available column estimates memory that can be reclaimed immediately for processes without swapping.',
      },
      {
        id: 3,
        question: 'Why is pkill -9 -f rogue-worker.sh guaranteed to terminate the rogue background worker?',
        options: [
          'Signal 9 (SIGKILL) is enforced directly by the kernel and cannot be caught, ignored, or blocked by the process.',
          'Signal 9 requests the process to gracefully unmount open file descriptors.',
          'The -f flag prompts the operator for interactive confirmation before termination.',
          'Signal 9 only executes if the target script was started via systemd.',
        ],
        correctIndex: 0,
        explanation:
          'SIGKILL (signal 9) bypasses user-space signal handlers and terminates the process immediately at kernel level.',
      },
      {
        id: 4,
        question: 'In Phase 3, why was /opt/services/metrics-collector.sh failing to start prior to remediation?',
        options: [
          'It lacked execute permissions (chmod 755) and its configuration file had STATUS=offline.',
          'Ubuntu requires all service daemons to be compiled into binary C ELF executables.',
          'The /opt directory is protected by immutable read-only flags on server distros.',
          'Shell scripts cannot execute unless launched directly from /usr/bin.',
        ],
        correctIndex: 0,
        explanation:
          'Linux requires execute permission bits (+x or 755) on executable files. The daemon also verifies STATUS=active in /opt/services/config.env.',
      },
    ],
  },

  '02-linux-filesystem-hierarchy': {
    summary:
      'Audit Linux Filesystem Hierarchy Standard (FHS) mounts, reclaim space from bloated log dumps, repair broken release symlinks, and restore the web storage hierarchy.',
    phase1Description:
      'Explore the root filesystem structure (/etc, /var, /opt, /srv) and record mounted filesystems and block devices:',
    guidedCommands: [
      { label: '1. INSPECT FHS MOUNTS & BLOCK DEVICES', command: 'df -hT && lsblk' },
      { label: '2. GENERATE MOUNT AUDIT REPORT', command: 'mkdir -p /workspace/fhs_audit && { df -hT; lsblk; } > /workspace/fhs_audit/mount_report.txt' },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Reclaim Disk Space & Save Log Status',
        description:
          'Remove the corrupted crash dump at /var/log/app/corrupted_dump.bin and write the output of df -h /var/log to /var/backups/disk_status.txt.',
        hintCommand: 'sudo rm -f /var/log/app/corrupted_dump.bin && sudo mkdir -p /var/backups && df -h /var/log | sudo tee /var/backups/disk_status.txt',
      },
      {
        title: 'Task 2.2 — Remediate Webapp Release Symlinks',
        description:
          'Remove the dangling symlink /etc/webapp/legacy.conf and repoint /etc/webapp/active.conf to /opt/webapp/releases/v2.1/app.conf.',
        hintCommand: 'sudo rm -f /etc/webapp/legacy.conf && sudo ln -sfn /opt/webapp/releases/v2.1/app.conf /etc/webapp/active.conf',
      },
    ],
    breakFix: {
      title: 'Incident: Restore Web Storage Hierarchy (/srv/storage)',
      description:
        'The web application storage health check (/opt/webapp/storage-check.sh) is failing because /srv/storage directories and the /var/www/html/uploads symlink are broken:',
      steps: [
        { label: 'Storage Directories', detail: 'Create /srv/storage/uploads and /srv/storage/archive.' },
        { label: 'Web Root Symlink', detail: 'Point /var/www/html/uploads -> /srv/storage/uploads.' },
        { label: 'Health Script', detail: 'Make /opt/webapp/storage-check.sh executable (chmod 755) and verify STORAGE_OK.' },
      ],
      remediationCommand:
        'sudo mkdir -p /srv/storage/uploads /srv/storage/archive && sudo rm -rf /var/www/html/uploads && sudo ln -sfn /srv/storage/uploads /var/www/html/uploads && sudo chmod 755 /opt/webapp/storage-check.sh && /opt/webapp/storage-check.sh',
    },
    checkpoints: [
      {
        id: 'checkpoint_1_fhs_report',
        name: 'FHS Mount & Disk Report Generated',
        hint: 'Save df -hT and lsblk output into /workspace/fhs_audit/mount_report.txt.',
      },
      {
        id: 'checkpoint_2_log_cleanup',
        name: 'Bloated Log Artifact Removed & Disk Status Logged',
        hint: 'Delete /var/log/app/corrupted_dump.bin and save df -h /var/log to /var/backups/disk_status.txt.',
      },
      {
        id: 'checkpoint_3_symlinks',
        name: 'Release Config Symlink Repaired',
        hint: 'Point /etc/webapp/active.conf to /opt/webapp/releases/v2.1/app.conf and remove /etc/webapp/legacy.conf.',
      },
      {
        id: 'checkpoint_4_storage_service',
        name: 'Storage Service Layout Restored',
        hint: 'Create /srv/storage/{uploads,archive}, link /var/www/html/uploads -> /srv/storage/uploads, and chmod 755 /opt/webapp/storage-check.sh.',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'According to the Linux Filesystem Hierarchy Standard (FHS), which directory stores host-specific system configuration files?',
        options: ['/etc', '/opt', '/var', '/usr/local'],
        correctIndex: 0,
        explanation: '/etc contains host-specific system-wide configuration files.',
      },
      {
        id: 2,
        question: 'Which directory is designated for variable data files such as system logs, caches, and spool files that grow during operation?',
        options: ['/var', '/srv', '/bin', '/proc'],
        correctIndex: 0,
        explanation: '/var holds variable data files including /var/log, /var/cache, and /var/spool.',
      },
      {
        id: 3,
        question: 'Which flags with ln safely replace an existing symlink pointing to a directory or file atomically?',
        options: ['ln -sfn', 'ln --hard-overwrite', 'ln -r', 'ln -d'],
        correctIndex: 0,
        explanation: '-s creates a symbolic link, -f forces replacement, and -n treats an existing symlink-to-directory target as a normal file.',
      },
      {
        id: 4,
        question: 'What is the purpose of /opt in the Linux Filesystem Hierarchy Standard?',
        options: [
          'Installing add-on or third-party self-contained application software packages.',
          'Storing temporary kernel swap files during boot.',
          'Holding per-user home directories for non-root operators.',
          'Mounting removable USB and optical media.',
        ],
        correctIndex: 0,
        explanation: '/opt is reserved for the installation of add-on application software packages.',
      },
    ],
  },

  '03-cli-fundamentals': {
    summary:
      'Scaffold a release directory tree, organize messy staging artifacts, purge stale backup files with find, and package a compressed tar.gz release archive.',
    phase1Description:
      'Inspect the unorganized staging workspace at /workspace/staging_mess and scaffold the clean release structure:',
    guidedCommands: [
      { label: '1. INSPECT STAGING DIRECTORY', command: 'ls -la /workspace/staging_mess' },
      { label: '2. SCAFFOLD RELEASE DIRECTORY TREE', command: 'mkdir -p /workspace/release_v1/{bin,conf,logs} && touch /workspace/release_v1/.build_manifest' },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Organize Scripts & Configs from Staging',
        description:
          'Move deploy.sh and healthcheck.sh into /workspace/release_v1/bin/, copy app.conf and db.conf into /workspace/release_v1/conf/, and remove /workspace/staging_mess/debug.tmp.',
        hintCommand:
          'cp -f /workspace/staging_mess/*.sh /workspace/release_v1/bin/ && cp -f /workspace/staging_mess/*.conf /workspace/release_v1/conf/ && rm -f /workspace/staging_mess/debug.tmp',
      },
      {
        title: 'Task 2.2 — Batch Cleanup & Permission Fix with find',
        description:
          'Delete any *.bak files inside /workspace/release_v1 and mark all shell scripts in /workspace/release_v1/bin/ executable (chmod 755).',
        hintCommand:
          "find /workspace/release_v1 -name '*.bak' -delete && chmod 755 /workspace/release_v1/bin/*.sh",
      },
    ],
    breakFix: {
      title: 'Challenge: Package Verified Release Tarball',
      description:
        'Create /workspace/backups/release_v1.tar.gz containing the organized release_v1 contents (bin/deploy.sh, bin/healthcheck.sh, conf/app.conf, conf/db.conf):',
      steps: [
        { label: 'Backup Directory', detail: 'Ensure /workspace/backups exists.' },
        { label: 'Archive Creation', detail: 'Run tar -czf /workspace/backups/release_v1.tar.gz -C /workspace/release_v1 .' },
        { label: 'Archive Verification', detail: 'Verify contents with tar -tzf /workspace/backups/release_v1.tar.gz.' },
      ],
      remediationCommand:
        'mkdir -p /workspace/backups && tar -czf /workspace/backups/release_v1.tar.gz -C /workspace/release_v1 . && tar -tzf /workspace/backups/release_v1.tar.gz',
    },
    checkpoints: [
      {
        id: 'checkpoint_1_scaffold',
        name: 'Release Directory Tree Scaffolded',
        hint: 'Create /workspace/release_v1/{bin,conf,logs} and /workspace/release_v1/.build_manifest.',
      },
      {
        id: 'checkpoint_2_organize',
        name: 'Scripts & Configs Organized from Staging',
        hint: 'Place deploy.sh & healthcheck.sh in bin/, app.conf & db.conf in conf/, and delete debug.tmp.',
      },
      {
        id: 'checkpoint_3_find_exec',
        name: 'Backup Artifacts Purged & Scripts Executable',
        hint: 'Remove all *.bak files under /workspace/release_v1 and chmod 755 bin/*.sh.',
      },
      {
        id: 'checkpoint_4_archive',
        name: 'Compressed Release Tarball Created',
        hint: 'Create /workspace/backups/release_v1.tar.gz containing bin/deploy.sh and conf/app.conf.',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'Which mkdir flag creates parent directories as needed without failing if the directory already exists?',
        options: ['mkdir -p', 'mkdir -r', 'mkdir -f', 'mkdir -a'],
        correctIndex: 0,
        explanation: 'mkdir -p creates intermediate parent directories and succeeds silently if the target already exists.',
      },
      {
        id: 2,
        question: 'Which ls flag combination displays hidden dotfiles in long human-readable format?',
        options: ['ls -la', 'ls -R', 'ls -d', 'ls -i'],
        correctIndex: 0,
        explanation: '-l enables long listing format and -a includes entries starting with a dot (.).',
      },
      {
        id: 3,
        question: 'What does tar -czf archive.tar.gz -C /workspace/release_v1 . do?',
        options: [
          'Changes directory to /workspace/release_v1 before archiving its contents into a gzip-compressed tarball.',
          'Checks the integrity of an existing bzip2 archive.',
          'Copies archive.tar.gz into /workspace/release_v1 without compression.',
          'Deletes /workspace/release_v1 after extracting archive.tar.gz.',
        ],
        correctIndex: 0,
        explanation: '-c creates an archive, -z compresses with gzip, -f specifies the filename, and -C changes to the target directory first.',
      },
      {
        id: 4,
        question: 'Which find command removes all files ending in .bak inside /workspace/release_v1?',
        options: [
          "find /workspace/release_v1 -type f -name '*.bak' -delete",
          "find /workspace/release_v1 --purge '*.bak'",
          "grep -r '*.bak' /workspace/release_v1 | rm",
          "locate '*.bak' --remove",
        ],
        correctIndex: 0,
        explanation: 'find with -type f -name "*.bak" -delete locates matching regular files and unlinks them directly.',
      },
    ],
  },

  '04-package-management-vim': {
    summary:
      'Repair a broken APT repository source list, install essential CLI tools (jq and tree), clean up a stale Vim swap file, and fix broken Nginx configuration syntax.',
    phase1Description:
      'Inspect the APT configuration error in /etc/apt/sources.list.d/ and check Nginx configuration state:',
    guidedCommands: [
      { label: '1. INSPECT APT SOURCES', command: 'ls -la /etc/apt/sources.list.d/ && cat /etc/apt/sources.list.d/broken-mirror.list' },
      { label: '2. TEST NGINX CONFIGURATION', command: 'sudo nginx -t' },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Remove Broken APT Mirror & Install jq + tree',
        description:
          'Remove /etc/apt/sources.list.d/broken-mirror.list, update APT package indexes, and verify or install jq and tree.',
        hintCommand: 'sudo rm -f /etc/apt/sources.list.d/broken-mirror.list && dpkg -s jq tree >/dev/null 2>&1 || (sudo apt-get update && sudo apt-get install -y jq tree)',
      },
      {
        title: 'Task 2.2 — Clean Stale Vim Swap & Fix /etc/nginx/nginx.conf',
        description:
          'Delete the crashed Vim swap file /etc/nginx/.nginx.conf.swp and replace WORKERS_BROKEN with auto in /etc/nginx/nginx.conf.',
        hintCommand: "sudo rm -f /etc/nginx/.nginx.conf.swp && sudo sed -i 's/WORKERS_BROKEN/auto/' /etc/nginx/nginx.conf",
      },
    ],
    breakFix: {
      title: 'Incident: Remediate DevOps Portal Virtual Host Config',
      description:
        'Fix /etc/nginx/sites-available/devops-portal.conf so it listens on port 8080 (with a trailing semicolon) and serves /var/www/devops-portal, enable the site in sites-enabled, and verify nginx -t:',
      steps: [
        { label: 'Directive Syntax', detail: 'Set listen 8080; and root /var/www/devops-portal; in /etc/nginx/sites-available/devops-portal.conf.' },
        { label: 'Enable Site', detail: 'Symlink /etc/nginx/sites-available/devops-portal.conf into /etc/nginx/sites-enabled/.' },
        { label: 'Validate', detail: 'Run sudo nginx -t to confirm valid configuration syntax.' },
      ],
      remediationCommand:
        "sudo tee /etc/nginx/sites-available/devops-portal.conf >/dev/null <<'EOF'\nserver {\n    listen 8080;\n    server_name localhost;\n    root /var/www/devops-portal;\n    index index.html;\n}\nEOF\nsudo ln -sfn /etc/nginx/sites-available/devops-portal.conf /etc/nginx/sites-enabled/devops-portal.conf && sudo nginx -t",
    },
    checkpoints: [
      {
        id: 'checkpoint_1_apt_repo',
        name: 'Broken APT Repository Entry Removed',
        hint: 'Remove /etc/apt/sources.list.d/broken-mirror.list containing broken-mirror.invalid.',
      },
      {
        id: 'checkpoint_2_packages',
        name: 'Required CLI Utilities Installed (jq & tree)',
        hint: 'Ensure both jq and tree packages are installed.',
      },
      {
        id: 'checkpoint_3_vim_cleanup',
        name: 'Stale Vim Swap File Removed & Main Config Fixed',
        hint: 'Delete /etc/nginx/.nginx.conf.swp and replace WORKERS_BROKEN with auto in /etc/nginx/nginx.conf.',
      },
      {
        id: 'checkpoint_4_service_config',
        name: 'DevOps Portal Nginx Site Enabled & Validated',
        hint: 'Configure listen 8080; and root /var/www/devops-portal; in sites-available/devops-portal.conf, symlink to sites-enabled, and pass nginx -t.',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'On Ubuntu/Debian systems, where are additional third-party APT repository files stored?',
        options: ['/etc/apt/sources.list.d/', '/var/lib/apt/mirrors/', '/usr/local/etc/apt/', '/opt/apt/repos/'],
        correctIndex: 0,
        explanation: '/etc/apt/sources.list.d/ holds modular .list and .sources files for additional repositories.',
      },
      {
        id: 2,
        question: 'Why does Vim create a hidden .filename.swp file when editing?',
        options: [
          'It stores unsaved buffer changes so work can be recovered if the editor or SSH session crashes.',
          'It compiles the configuration file into binary bytecode for faster loading.',
          'It permanently locks the file in the Linux kernel even after reboot.',
          'It backs up the user bash history.',
        ],
        correctIndex: 0,
        explanation: 'Vim swap files hold recovery state and detect concurrent edits.',
      },
      {
        id: 3,
        question: 'In Vim command mode, which command saves changes and exits immediately?',
        options: [':wq', ':q!', ':e!', '/exit'],
        correctIndex: 0,
        explanation: ':wq writes the buffer to disk and quits Vim (:x is an equivalent shorthand).',
      },
      {
        id: 4,
        question: 'Which command validates Nginx configuration syntax without restarting the server?',
        options: ['nginx -t', 'nginx --reload-now', 'systemctl status nginx', 'dpkg --configure nginx'],
        correctIndex: 0,
        explanation: 'nginx -t parses and tests all included configuration files for syntax and path validity.',
      },
    ],
  },

  '05-users-groups-permissions': {
    summary:
      'Provision the deployer service account and devops-team group, configure a SetGID shared directory, grant least-privilege sudoers access, and harden exposed SSH keys.',
    phase1Description:
      'Inspect current users, groups, and insecure file permissions on /home/deployer/.ssh and /opt/runner/run.sh:',
    guidedCommands: [
      { label: '1. INSPECT USERS & GROUPS', command: 'tail -n 10 /etc/passwd && tail -n 10 /etc/group' },
      { label: '2. AUDIT SSH & RUNNER PERMISSIONS', command: 'ls -la /home/deployer/.ssh /opt/runner' },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Provision devops-team Group & deployer User',
        description:
          'Ensure group devops-team exists, user deployer has login shell /bin/bash, and deployer is a member of devops-team. Then configure /srv/deployment with owner deployer:devops-team and SetGID mode 2775.',
        hintCommand:
          'sudo groupadd -f devops-team && (id deployer >/dev/null 2>&1 || sudo useradd -m -s /bin/bash deployer) && sudo usermod -s /bin/bash -aG devops-team deployer && sudo mkdir -p /srv/deployment && sudo chown deployer:devops-team /srv/deployment && sudo chmod 2775 /srv/deployment',
      },
      {
        title: 'Task 2.2 — Configure Scoped Sudoers Rule',
        description:
          'Create /etc/sudoers.d/deployer (mode 0440) allowing deployer to run /usr/local/bin/deploy-service.sh as root with NOPASSWD, and validate with visudo -cf.',
        hintCommand:
          "echo 'deployer ALL=(ALL) NOPASSWD: /usr/local/bin/deploy-service.sh' | sudo tee /etc/sudoers.d/deployer >/dev/null && sudo chmod 440 /etc/sudoers.d/deployer && sudo visudo -cf /etc/sudoers.d/deployer",
      },
    ],
    breakFix: {
      title: 'Security Incident: Harden Exposed SSH Private Key & Runner Script',
      description:
        'An automated security scan flagged world-readable SSH private keys and a world-writable runner script. Lock down ownership and permissions:',
      steps: [
        { label: 'SSH Directory', detail: 'Set /home/deployer/.ssh to mode 700.' },
        { label: 'SSH Private Key', detail: 'Set /home/deployer/.ssh/id_ed25519 to mode 600 and owner deployer:deployer.' },
        { label: 'Runner Script', detail: 'Set /opt/runner/run.sh to mode 750.' },
      ],
      remediationCommand:
        'sudo chown -R deployer:deployer /home/deployer/.ssh && sudo chmod 700 /home/deployer/.ssh && sudo chmod 600 /home/deployer/.ssh/id_ed25519 && sudo chmod 750 /opt/runner/run.sh',
    },
    checkpoints: [
      {
        id: 'checkpoint_1_users_groups',
        name: 'Deployer Account & DevOps Group Provisioned',
        hint: 'Create group devops-team and user deployer with /bin/bash shell and membership in devops-team.',
      },
      {
        id: 'checkpoint_2_shared_dir',
        name: 'Shared Deployment Directory Configured with SetGID (2775)',
        hint: 'Set /srv/deployment ownership to deployer:devops-team and permissions to 2775.',
      },
      {
        id: 'checkpoint_3_sudoers',
        name: 'Scoped Sudoers Rule Validated',
        hint: 'Create /etc/sudoers.d/deployer (mode 0440) for /usr/local/bin/deploy-service.sh and verify with visudo -cf.',
      },
      {
        id: 'checkpoint_4_key_audit',
        name: 'SSH Key & Runner Script Permissions Hardened',
        hint: 'Set /home/deployer/.ssh to 700, id_ed25519 to 600 (deployer:deployer), and /opt/runner/run.sh to 750.',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'What does the leading 2 in chmod 2775 /srv/deployment accomplish?',
        options: [
          'It sets the SetGID bit so newly created files inside /srv/deployment automatically inherit the directory group (devops-team).',
          'It makes the directory read-only for the root user.',
          'It encrypts the directory contents with AES-256.',
          'It deletes files older than 2 days automatically.',
        ],
        correctIndex: 0,
        explanation: 'The SetGID bit (2000) on a directory causes new files and subdirectories created within it to inherit the group ID of the directory.',
      },
      {
        id: 2,
        question: 'Why will OpenSSH refuse to use /home/deployer/.ssh/id_ed25519 if its permissions are 0644 or 0777?',
        options: [
          'OpenSSH enforces strict private key confidentiality and rejects private keys readable or writable by group or others (requires 0600 or 0400).',
          'Ed25519 keys must always have execute permissions (0755) to run.',
          'OpenSSH only supports keys owned by root.',
          'Permissions 0644 corrupt the base64 encoding of the key.',
        ],
        correctIndex: 0,
        explanation: 'SSH refuses ("UNPROTECTED PRIVATE KEY FILE!") any private key accessible to other users.',
      },
      {
        id: 3,
        question: 'Why should sudoers drop-in files in /etc/sudoers.d/ always be validated with visudo -cf?',
        options: [
          'A syntax error in sudoers can lock out all administrative sudo access on the host; visudo -cf checks grammar safely.',
          'visudo restarts the Linux kernel after every edit.',
          'visudo automatically generates SSH keys for the user.',
          'sudoers files are binary databases that cannot be read with cat.',
        ],
        correctIndex: 0,
        explanation: 'visudo -cf parses and validates the sudoers file grammar and permissions (0440) before activation.',
      },
      {
        id: 4,
        question: 'Which usermod flags append a user to a supplementary group without removing their existing group memberships?',
        options: ['usermod -aG', 'usermod -G', 'usermod -g', 'usermod -d'],
        correctIndex: 0,
        explanation: '-a (append) combined with -G (supplementary groups) adds the user to the group without overwriting existing supplementary groups.',
      },
    ],
  },

  '06-pipes-redirection-shell-scripting': {
    summary:
      'Build multi-stage grep/awk/sort/uniq pipelines to analyze production access logs, separate stdout and stderr streams, and repair an automated Bash health report script.',
    phase1Description:
      'Inspect the production web access log at /var/log/devops/access.log and test stream redirection:',
    guidedCommands: [
      { label: '1. INSPECT ACCESS LOG', command: 'cat /var/log/devops/access.log' },
      { label: '2. EXTRACT ERROR ENTRIES', command: "mkdir -p /workspace/log_analysis && grep 'ERROR' /var/log/devops/access.log > /workspace/log_analysis/errors_only.log" },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Aggregate Top 3 Client IPs via Pipeline',
        description:
          'Extract client IPs (column 1) from /var/log/devops/access.log, count occurrences, sort descending, and save the top 3 lines to /workspace/log_analysis/top_ips.txt.',
        hintCommand:
          "awk '{print $1}' /var/log/devops/access.log | sort | uniq -c | sort -nr | head -n 3 > /workspace/log_analysis/top_ips.txt",
      },
      {
        title: 'Task 2.2 — Split Standard Output & Standard Error Streams',
        description:
          'Run /opt/scripts/stream-test.sh redirecting stdout (FD 1) to /workspace/log_analysis/diag_stdout.log and stderr (FD 2) to /workspace/log_analysis/diag_stderr.log.',
        hintCommand:
          '/opt/scripts/stream-test.sh > /workspace/log_analysis/diag_stdout.log 2> /workspace/log_analysis/diag_stderr.log',
      },
    ],
    breakFix: {
      title: 'Incident: Repair Automated Log Summary Script (/usr/local/bin/log-summary.sh)',
      description:
        'Fix /usr/local/bin/log-summary.sh so it computes TOTAL_ERRORS=7 and TOP_IP=192.168.10.45 from /var/log/devops/access.log, writes the report to /var/log/log-summary.report, prints it to stdout, and has chmod 755:',
      steps: [
        { label: 'Shebang & Permissions', detail: 'Ensure #!/usr/bin/env bash and chmod 755 /usr/local/bin/log-summary.sh.' },
        { label: 'Pipeline Logic', detail: 'Count ERROR lines and extract top IP from /var/log/devops/access.log.' },
        { label: 'Report Output', detail: 'Write both TOTAL_ERRORS and TOP_IP to /var/log/log-summary.report and stdout.' },
      ],
      remediationCommand:
        "sudo tee /usr/local/bin/log-summary.sh >/dev/null <<'EOF'\n#!/usr/bin/env bash\nset -euo pipefail\nLOG_FILE=\"/var/log/devops/access.log\"\nREPORT_FILE=\"/var/log/log-summary.report\"\nTOTAL_ERRORS=$(grep -c 'ERROR' \"$LOG_FILE\")\nTOP_IP=$(awk '{print $1}' \"$LOG_FILE\" | sort | uniq -c | sort -nr | head -n 1 | awk '{print $2}')\n{\n  echo \"TOTAL_ERRORS=${TOTAL_ERRORS}\"\n  echo \"TOP_IP=${TOP_IP}\"\n} | tee \"$REPORT_FILE\"\nEOF\nsudo chmod 755 /usr/local/bin/log-summary.sh && sudo /usr/local/bin/log-summary.sh",
    },
    checkpoints: [
      {
        id: 'checkpoint_1_error_extract',
        name: 'ERROR Log Lines Filtered',
        hint: 'Save all 7 ERROR lines from /var/log/devops/access.log into /workspace/log_analysis/errors_only.log.',
      },
      {
        id: 'checkpoint_2_top_ips',
        name: 'Top 3 Client IPs Aggregated & Sorted',
        hint: 'Write the top 3 IP counts sorted descending into /workspace/log_analysis/top_ips.txt.',
      },
      {
        id: 'checkpoint_3_redirect_streams',
        name: 'Stdout and Stderr Streams Separated',
        hint: 'Redirect /opt/scripts/stream-test.sh stdout to diag_stdout.log and stderr to diag_stderr.log.',
      },
      {
        id: 'checkpoint_4_health_script',
        name: 'Automated Log Summary Script Repaired & Executed',
        hint: 'Make /usr/local/bin/log-summary.sh executable and ensure it outputs TOTAL_ERRORS=7 and TOP_IP=192.168.10.45 and writes /var/log/log-summary.report.',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'In Linux shell redirection, what do file descriptors 0, 1, and 2 represent?',
        options: [
          '0 = stdin (standard input), 1 = stdout (standard output), 2 = stderr (standard error)',
          '0 = root, 1 = user, 2 = group',
          '0 = network socket, 1 = disk file, 2 = terminal',
          '0 = exit success, 1 = warning, 2 = critical',
        ],
        correctIndex: 0,
        explanation: 'POSIX defines FD 0 as standard input, FD 1 as standard output, and FD 2 as standard error.',
      },
      {
        id: 2,
        question: 'Why must input be sorted before piping into uniq -c when counting total occurrences across a file?',
        options: [
          'uniq only compares adjacent lines, so identical values must be grouped together by sort first.',
          'uniq -c refuses to run unless the sort binary is in the same pipeline.',
          'sort converts ASCII text into binary integers required by uniq.',
          'uniq -c deletes unsorted lines.',
        ],
        correctIndex: 0,
        explanation: 'uniq detects repeated adjacent lines; sorting first guarantees all identical lines are contiguous.',
      },
      {
        id: 3,
        question: 'What is the difference between > and >> in Bash output redirection?',
        options: [
          '> truncates and overwrites the target file, whereas >> appends to the end of the file.',
          '> writes stdout while >> writes stderr.',
          '> requires root privileges while >> does not.',
          'There is no difference.',
        ],
        correctIndex: 0,
        explanation: '> overwrites the destination file from byte 0; >> appends output to the existing file.',
      },
      {
        id: 4,
        question: 'What does set -euo pipefail at the top of a production Bash script enforce?',
        options: [
          'Exits on unhandled command failure (-e), errors on unset variables (-u), and fails a pipeline if any command in it fails (-o pipefail).',
          'Runs every command in the script in parallel background subshells.',
          'Disables all stdout and stderr output from the script.',
          'Automatically retries failed commands 3 times.',
        ],
        correctIndex: 0,
        explanation: 'set -euo pipefail prevents silent failures, uninitialized variable bugs, and masked pipeline errors.',
      },
    ],
  },

  '07-networking-ssh-security': {
    summary:
      'Configure local hostname resolution, audit active listening sockets to kill an unauthorized listener on port 4444, harden OpenSSH daemon settings, and enforce host firewall policy.',
    phase1Description:
      'Inspect active listening TCP ports and test internal hostname resolution:',
    guidedCommands: [
      { label: '1. INSPECT LISTENING SOCKETS & PROCESSES', command: 'ss -tulpn && ps aux | grep python3' },
      { label: '2. MAP INTERNAL HOSTNAME IN /etc/hosts', command: "echo '127.0.0.1 internal-api.devops.local' | sudo tee -a /etc/hosts && getent hosts internal-api.devops.local" },
    ],
    unguidedTasks: [
      {
        title: 'Task 2.1 — Terminate Unauthorized Listener on Port 4444',
        description:
          'Kill the rogue listener process (/usr/local/bin/rogue-listener.py) bound to port 4444 while keeping /usr/local/bin/api-server.py running on port 9090.',
        hintCommand: 'sudo pkill -9 -f rogue-listener.py && curl -s http://internal-api.devops.local:9090/health',
      },
      {
        title: 'Task 2.2 — Harden OpenSSH Daemon Configuration',
        description:
          'Edit /etc/ssh/sshd_config so PermitRootLogin no and PasswordAuthentication no are enforced, then validate with sudo sshd -t.',
        hintCommand:
          "sudo sed -i 's/^[#[:space:]]*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo sed -i 's/^[#[:space:]]*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo sshd -t",
      },
    ],
    breakFix: {
      title: 'Security Incident: Enforce Host Firewall Policy',
      description:
        'Update /etc/network/firewall.conf to allow SSH (22/tcp) and internal API (9090/tcp) while denying port 4444/tcp, make /etc/network/firewall-rules.sh executable, and apply:',
      steps: [
        { label: 'Policy Rules', detail: 'Ensure /etc/network/firewall.conf contains ALLOW 22/tcp, ALLOW 9090/tcp, and DENY 4444/tcp.' },
        { label: 'Executable Guard', detail: 'Set chmod 755 /etc/network/firewall-rules.sh.' },
        { label: 'Apply Policy', detail: 'Execute /etc/network/firewall-rules.sh and verify FIREWALL_ACTIVE.' },
      ],
      remediationCommand:
        "sudo tee /etc/network/firewall.conf >/dev/null <<'EOF'\nALLOW 22/tcp\nALLOW 9090/tcp\nDENY 4444/tcp\nEOF\nsudo chmod 755 /etc/network/firewall-rules.sh && sudo /etc/network/firewall-rules.sh",
    },
    checkpoints: [
      {
        id: 'checkpoint_1_hosts_dns',
        name: 'Internal Hostname Resolution Configured',
        hint: 'Add 127.0.0.1 internal-api.devops.local to /etc/hosts.',
      },
      {
        id: 'checkpoint_2_port_audit',
        name: 'Rogue Listener Terminated & Internal API Healthy',
        hint: 'Terminate rogue-listener.py on port 4444 and keep api-server.py running on port 9090.',
      },
      {
        id: 'checkpoint_3_ssh_hardening',
        name: 'SSH Daemon Hardened (No Root Login, No Password Auth)',
        hint: 'Set PermitRootLogin no and PasswordAuthentication no in /etc/ssh/sshd_config and pass sshd -t.',
      },
      {
        id: 'checkpoint_4_firewall_rules',
        name: 'Firewall Policy Script Enforced',
        hint: 'Configure ALLOW 22/tcp, ALLOW 9090/tcp, DENY 4444/tcp in /etc/network/firewall.conf and run /etc/network/firewall-rules.sh.',
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'Which command displays active listening TCP/UDP sockets along with numeric ports and owning process IDs?',
        options: ['ss -tulpn', 'ping -c 4 localhost', 'traceroute -n', 'arp -a'],
        correctIndex: 0,
        explanation: 'ss -tulpn shows TCP (-t), UDP (-u), listening (-l), process (-p), and numeric port (-n) socket information.',
      },
      {
        id: 2,
        question: 'Which two directives in /etc/ssh/sshd_config disable direct root SSH login and cleartext password authentication?',
        options: [
          'PermitRootLogin no and PasswordAuthentication no',
          'AllowRoot false and DisablePasswords yes',
          'RootSSH off and KeyOnly true',
          'DenyUser root and AuthMode pubkey',
        ],
        correctIndex: 0,
        explanation: 'PermitRootLogin no blocks direct root SSH sessions, and PasswordAuthentication no enforces key-based authentication.',
      },
      {
        id: 3,
        question: 'Which file is consulted locally before DNS servers to map hostnames to IP addresses on Linux?',
        options: ['/etc/hosts', '/etc/hostname', '/etc/network/interfaces', '/var/lib/dhcp/leases'],
        correctIndex: 0,
        explanation: '/etc/hosts provides static local hostname-to-IP mappings resolved via the files NSS module.',
      },
      {
        id: 4,
        question: 'Which command tests /etc/ssh/sshd_config for syntax validity before reloading the SSH daemon?',
        options: ['sshd -t', 'ssh -v localhost', 'ssh-keygen -l', 'scp --check'],
        correctIndex: 0,
        explanation: 'sshd -t runs OpenSSH server in test mode to verify configuration file syntax and keys.',
      },
    ],
  },
};

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
                  Linux Workstation
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
