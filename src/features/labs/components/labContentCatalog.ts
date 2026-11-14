export interface Checkpoint {
  id: string;
  name: string;
  hint: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GuidedCommand {
  label: string;
  command: string;
}

export interface UnguidedTask {
  title: string;
  description: string;
  hintCommand: string;
}

export interface BreakFixChallenge {
  title: string;
  description: string;
  steps: Array<{ label: string; detail: string }>;
  remediationCommand: string;
}

export interface LabContentDefinition {
  summary: string;
  phase1Description: string;
  guidedCommands: GuidedCommand[];
  unguidedTasks: UnguidedTask[];
  breakFix: BreakFixChallenge;
  checkpoints: Checkpoint[];
  quiz: QuizQuestion[];
}

export const LAB_CONTENT_BY_SLUG: Record<string, LabContentDefinition> = {
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

  "m06-lab01-ephemeral-environment": {
    "summary": "Pull OCI images, distinguish attached vs detached container execution, audit running and exited containers with docker ps -a, stop and remove containers cleanly, and eliminate a rogue workload.",
    "phase1Description": "Inspect the local Docker engine version, pull nginx:1.25-alpine explicitly, and observe attached vs detached container lifecycles:",
    "guidedCommands": [
      {
        "label": "1. PULL & INSPECT LOCAL IMAGE CACHE",
        "command": "docker --version && docker pull nginx:1.25-alpine && docker images"
      },
      {
        "label": "2. LAUNCH DETACHED CONTAINER & LIST PROCESSES",
        "command": "docker run -d --name nginx-bg nginx:1.25-alpine && docker ps -a"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Audit & Capture Container Lifecycle",
        "description": "Pull nginx:1.25-alpine, run a detached container named nginx-bg, stop it gracefully, and save the full output of docker ps -a into /workspace/container_lifecycle.txt.",
        "hintCommand": "docker stop nginx-bg && docker ps -a > /workspace/container_lifecycle.txt"
      },
      {
        "title": "Task 2.2 — Eliminate Rogue Container",
        "description": "An unauthorized container named rogue-miner is consuming cluster resources. Force-remove rogue-miner using docker rm -f.",
        "hintCommand": "docker rm -f rogue-miner"
      }
    ],
    "breakFix": {
      "title": "Incident: Deploy Replacement Production Container",
      "description": "After removing rogue-miner and auditing nginx-bg, provision the authorized detached production web container named web-prod using nginx:1.25-alpine.",
      "steps": [
        {
          "label": "Audit",
          "detail": "Check docker ps -a to verify rogue-miner is absent and nginx-bg is recorded."
        },
        {
          "label": "Launch",
          "detail": "Run docker run -d --name web-prod nginx:1.25-alpine and confirm Status is Up."
        }
      ],
      "remediationCommand": "docker run -d --name web-prod nginx:1.25-alpine"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_pull",
        "name": "nginx:1.25-alpine Image Pulled",
        "hint": "Pull the pinned image with: docker pull nginx:1.25-alpine"
      },
      {
        "id": "checkpoint_2_detached",
        "name": "Detached Container nginx-bg Provisioned",
        "hint": "Create a container named nginx-bg from nginx:1.25-alpine using docker run -d --name nginx-bg nginx:1.25-alpine."
      },
      {
        "id": "checkpoint_3_lifecycle_audit",
        "name": "Lifecycle Audit Recorded",
        "hint": "Export container state to /workspace/container_lifecycle.txt with docker ps -a > /workspace/container_lifecycle.txt."
      },
      {
        "id": "checkpoint_4_cleanup_remediate",
        "name": "Rogue Container Removed & web-prod Active",
        "hint": "Remove rogue-miner (docker rm -f rogue-miner) and start web-prod (docker run -d --name web-prod nginx:1.25-alpine)."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Which flag runs a Docker container in the background and prints its container ID?",
        "options": [
          "-d (--detach)",
          "-i (--interactive)",
          "-v (--volume)",
          "--rm"
        ],
        "correctIndex": 0,
        "explanation": "The -d flag detaches the container from your terminal and keeps it running in the background."
      },
      {
        "id": 2,
        "question": "Which command displays both running and stopped containers?",
        "options": [
          "docker ps -a",
          "docker ps",
          "docker images",
          "docker top"
        ],
        "correctIndex": 0,
        "explanation": "docker ps only shows active containers, whereas docker ps -a includes exited/stopped containers."
      },
      {
        "id": 3,
        "question": "Why should production deployments pin explicit image tags such as nginx:1.25-alpine instead of nginx:latest?",
        "options": [
          "To guarantee deterministic, reproducible builds without unexpected upstream breaking changes",
          "Because latest tags cannot run in detached mode",
          "To bypass Docker Hub pull limits",
          "Because Alpine images ignore ENTRYPOINT directives"
        ],
        "correctIndex": 0,
        "explanation": "Mutable latest tags drift over time; pinned tags guarantee consistency across environments."
      },
      {
        "id": 4,
        "question": "Which command immediately terminates and deletes a running container in one step?",
        "options": [
          "docker rm -f <container>",
          "docker stop <container>",
          "docker prune <container>",
          "docker image rm <container>"
        ],
        "correctIndex": 0,
        "explanation": "docker rm -f sends SIGKILL if needed and removes the stopped container metadata and writable layer."
      }
    ]
  },

  "m06-lab02-network-bridging-env": {
    "summary": "Publish isolated container ports onto host interfaces with -p 8080:80, pass runtime secrets and configuration cleanly with -e, and remediate a crashing MySQL container.",
    "phase1Description": "Expose a bridged Nginx container on host port 8080 and inspect why mysql-broken exited during initialization:",
    "guidedCommands": [
      {
        "label": "1. START BRIDGED WEB CONTAINER & CURL HOST PORT",
        "command": "docker run -d --name web-bridge -p 8080:80 nginx:1.25-alpine && curl -s http://localhost:8080 | head -n 5"
      },
      {
        "label": "2. INSPECT CRASHED DATABASE LOGS",
        "command": "docker ps -a && docker logs mysql-broken"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Capture Bridged HTTP Response",
        "description": "Ensure web-bridge serves Nginx on port 8080 and save curl -s http://localhost:8080 into /workspace/bridge_response.html.",
        "hintCommand": "curl -s http://localhost:8080 > /workspace/bridge_response.html"
      },
      {
        "title": "Task 2.2 — Launch Stateful MySQL with Environment Injection",
        "description": "Start a detached mysql:8.0 container named mysql-secure mapping port 3306:3306 with MYSQL_ROOT_PASSWORD=SithLord2026.",
        "hintCommand": "docker run -d --name mysql-secure -e MYSQL_ROOT_PASSWORD=SithLord2026 -p 3306:3306 mysql:8.0"
      }
    ],
    "breakFix": {
      "title": "Incident: Remediate Failing mysql-broken Container",
      "description": "mysql-broken exited with code 1 because MYSQL_ROOT_PASSWORD was omitted at launch. Remove the failed container and deploy a healthy replacement named mysql-prod with MYSQL_ROOT_PASSWORD=SithLord2026.",
      "steps": [
        {
          "label": "Remove crashed instance",
          "detail": "Delete mysql-broken using docker rm -f mysql-broken."
        },
        {
          "label": "Relaunch with env injection",
          "detail": "Launch mysql-prod with -e MYSQL_ROOT_PASSWORD=SithLord2026."
        }
      ],
      "remediationCommand": "docker rm -f mysql-broken && docker run -d --name mysql-prod -e MYSQL_ROOT_PASSWORD=SithLord2026 mysql:8.0"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_web_bridge",
        "name": "web-bridge Listening on 8080:80",
        "hint": "Run: docker run -d --name web-bridge -p 8080:80 nginx:1.25-alpine"
      },
      {
        "id": "checkpoint_2_curl_verify",
        "name": "HTTP Response Captured to bridge_response.html",
        "hint": "Run: curl -s http://localhost:8080 > /workspace/bridge_response.html"
      },
      {
        "id": "checkpoint_3_mysql_secure",
        "name": "mysql-secure Initialized with Root Password",
        "hint": "Launch mysql-secure on 3306:3306 with -e MYSQL_ROOT_PASSWORD=SithLord2026."
      },
      {
        "id": "checkpoint_4_fix_broken_db",
        "name": "mysql-broken Removed & mysql-prod Running",
        "hint": "Remove mysql-broken and launch mysql-prod with MYSQL_ROOT_PASSWORD=SithLord2026."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "In docker run -p 8080:80, which port listens on the Docker host machine?",
        "options": [
          "8080",
          "80",
          "Both 8080 and 80 on the host",
          "Neither; Docker creates a UNIX socket"
        ],
        "correctIndex": 0,
        "explanation": "-p uses <host_port>:<container_port> syntax, mapping host port 8080 to container port 80."
      },
      {
        "id": 2,
        "question": "Why did the official mysql:8.0 container immediately exit with code 1 when launched without flags?",
        "options": [
          "It requires MYSQL_ROOT_PASSWORD, MYSQL_ALLOW_EMPTY_PASSWORD, or MYSQL_RANDOM_ROOT_PASSWORD via -e",
          "MySQL requires --privileged mode to allocate memory",
          "Port 3306 must be mapped before initdb runs",
          "The MySQL image defaults to dry-run mode"
        ],
        "correctIndex": 0,
        "explanation": "The entrypoint refuses to initialize an unauthenticated root database unless an env var explicitly authorizes it."
      },
      {
        "id": 3,
        "question": "How do you inject multiple runtime environment variables cleanly into a container?",
        "options": [
          "Pass multiple -e KEY=VALUE flags or supply --env-file",
          "Edit /etc/environment on the host OS",
          "Use -p KEY=VALUE for each variable",
          "Mount /etc/passwd read-only"
        ],
        "correctIndex": 0,
        "explanation": "Each -e flag injects a key-value pair into the container process environment."
      },
      {
        "id": 4,
        "question": "Without -p port publishing on bridge networking, who can reach port 80 inside the container?",
        "options": [
          "Only processes on the Docker bridge/container host network namespace, not external clients",
          "Any internet client over HTTP",
          "Only root user over SSH",
          "No traffic including loopback works"
        ],
        "correctIndex": 0,
        "explanation": "Bridge containers reside on an isolated virtual subnet; explicit NAT rules via -p expose ports externally."
      }
    ]
  },

  "m06-lab03-diagnostics-telemetry": {
    "summary": "Extract container standard output streams with docker logs, inspect internal nginx configuration using docker exec, export telemetry metadata, and diagnose a crashing Node microservice.",
    "phase1Description": "Stream recent logs from web-bridge and inspect internal filesystem configuration via docker exec:",
    "guidedCommands": [
      {
        "label": "1. READ CONTAINER LOG TAIL",
        "command": "docker logs --tail 50 web-bridge"
      },
      {
        "label": "2. INSPECT CONTAINER FILESYSTEM",
        "command": "docker exec web-bridge cat /etc/nginx/conf.d/default.conf"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Capture Logs & Nginx Config",
        "description": "Save docker logs --tail 50 web-bridge into /workspace/web_bridge_logs.txt and extract /etc/nginx/conf.d/default.conf from web-bridge into /workspace/default.conf.",
        "hintCommand": "docker logs --tail 50 web-bridge > /workspace/web_bridge_logs.txt && docker exec web-bridge cat /etc/nginx/conf.d/default.conf > /workspace/default.conf"
      },
      {
        "title": "Task 2.2 — Export Telemetry Audit",
        "description": "Capture detailed container inspection metadata of web-bridge using docker inspect into /workspace/telemetry_audit.txt.",
        "hintCommand": "docker inspect web-bridge > /workspace/telemetry_audit.txt"
      }
    ],
    "breakFix": {
      "title": "Incident: Diagnose and Relaunch Crashing app-crash",
      "description": "Container app-crash exited immediately on startup. Inspect docker logs app-crash to discover missing variables, remove app-crash, and run app-healthy with APP_PORT=8080 and DB_HOST=localhost.",
      "steps": [
        {
          "label": "Inspect logs",
          "detail": "Run docker logs app-crash to see which environment variables are required."
        },
        {
          "label": "Recreate cleanly",
          "detail": "Remove app-crash and run app-healthy with -e APP_PORT=8080 -e DB_HOST=localhost."
        }
      ],
      "remediationCommand": "docker rm -f app-crash && docker run -d --name app-healthy -e APP_PORT=8080 -e DB_HOST=localhost node:20-alpine"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_logs_capture",
        "name": "Web Bridge Logs Captured",
        "hint": "Save docker logs --tail 50 web-bridge to /workspace/web_bridge_logs.txt."
      },
      {
        "id": "checkpoint_2_nginx_conf_extract",
        "name": "Nginx Config Extracted via Exec",
        "hint": "Extract /etc/nginx/conf.d/default.conf from web-bridge into /workspace/default.conf."
      },
      {
        "id": "checkpoint_3_telemetry_audit",
        "name": "Container Telemetry Saved",
        "hint": "Run: docker inspect web-bridge > /workspace/telemetry_audit.txt"
      },
      {
        "id": "checkpoint_4_remediate_crash",
        "name": "app-healthy Running with Required Env",
        "hint": "Inspect app-crash logs, then start app-healthy with -e APP_PORT=8080 -e DB_HOST=localhost."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Which command streams real-time stdout and stderr output from a running container?",
        "options": [
          "docker logs -f <container>",
          "docker exec <container> dmesg",
          "docker ps -f <container>",
          "docker stats --tail"
        ],
        "correctIndex": 0,
        "explanation": "docker logs -f follows live stdout/stderr streams collected by the logging driver."
      },
      {
        "id": 2,
        "question": "What do the -i and -t flags in docker exec -it web-bridge /bin/sh provide?",
        "options": [
          "Interactive STDIN stream attachment (-i) and a pseudo-TTY terminal (-t)",
          "Internal network isolation and TLS handshake",
          "Image pull and tag creation",
          "Immutable rootfs locking"
        ],
        "correctIndex": 0,
        "explanation": "Combining -i and -t provides an interactive shell prompt inside the container namespace."
      },
      {
        "id": 3,
        "question": "Why does the nginx Alpine container use /bin/sh instead of /bin/bash?",
        "options": [
          "Minimal Alpine images omit bash to reduce footprint and attack surface, providing BusyBox sh",
          "Docker forbids /bin/bash inside Alpine containers",
          "nginx compiles its own shell",
          "BusyBox is only used on host port 8080"
        ],
        "correctIndex": 0,
        "explanation": "Alpine Linux ships BusyBox ash at /bin/sh for minimal container size (~5 MB base)."
      },
      {
        "id": 4,
        "question": "Which command outputs low-level JSON metadata including env vars, port bindings, and mounts?",
        "options": [
          "docker inspect <container>",
          "docker ps -q",
          "docker logs --all",
          "docker top <container>"
        ],
        "correctIndex": 0,
        "explanation": "docker inspect dumps the daemon JSON object describing container config, networking, and state."
      }
    ]
  },

  "m06-lab04-immutable-blueprint-dockerfile": {
    "summary": "Author an optimized layered Dockerfile with FROM node:20-alpine, cache-friendly package*.json dependency installation, build image devopsmentor/node-app:1.0, and deploy node-app-prod.",
    "phase1Description": "Inspect the application source and broken draft Dockerfile.broken inside /workspace before authoring /workspace/Dockerfile:",
    "guidedCommands": [
      {
        "label": "1. INSPECT APPLICATION ARTIFACTS",
        "command": "ls -la /workspace && cat /workspace/package.json && cat /workspace/Dockerfile.broken"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Author Production Dockerfile Base & Env",
        "description": "Create /workspace/Dockerfile starting FROM node:20-alpine, setting ENV NODE_ENV=production, ENV PORT=3000, and WORKDIR /app.",
        "hintCommand": "printf \"FROM node:20-alpine\\nENV NODE_ENV=production\\nENV PORT=3000\\nWORKDIR /app\\n\" > /workspace/Dockerfile"
      },
      {
        "title": "Task 2.2 — Add Layer-Cached Dependencies & Runtime CMD",
        "description": "Extend /workspace/Dockerfile to COPY package*.json ./, RUN npm install --omit=dev, COPY . ., EXPOSE 3000, and CMD [\"node\", \"server.js\"].",
        "hintCommand": "printf \"COPY package*.json ./\\nRUN npm install --omit=dev\\nCOPY . .\\nEXPOSE 3000\\nCMD [\\\"node\\\", \\\"server.js\\\"]\\n\" >> /workspace/Dockerfile"
      }
    ],
    "breakFix": {
      "title": "Incident: Build & Deploy Immutable Node Service",
      "description": "Build devopsmentor/node-app:1.0 from /workspace/Dockerfile, then launch container node-app-prod mapping port 3000:3000 and verify HTTP 200.",
      "steps": [
        {
          "label": "Build image",
          "detail": "Run docker build -t devopsmentor/node-app:1.0 /workspace."
        },
        {
          "label": "Run & verify",
          "detail": "Run docker run -d --name node-app-prod -p 3000:3000 devopsmentor/node-app:1.0 and curl localhost:3000."
        }
      ],
      "remediationCommand": "docker build -t devopsmentor/node-app:1.0 /workspace && docker run -d --name node-app-prod -p 3000:3000 devopsmentor/node-app:1.0"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_dockerfile_base",
        "name": "Dockerfile Base & Production ENV Configured",
        "hint": "Ensure /workspace/Dockerfile specifies FROM node:20-alpine, ENV NODE_ENV=production, and WORKDIR /app."
      },
      {
        "id": "checkpoint_2_dockerfile_layers",
        "name": "Layer Caching, EXPOSE 3000 & Exec CMD Set",
        "hint": "Copy package*.json before full source, run npm install --omit=dev, EXPOSE 3000, and use CMD [\"node\", \"server.js\"]."
      },
      {
        "id": "checkpoint_3_image_built",
        "name": "devopsmentor/node-app:1.0 Built",
        "hint": "Build the image using: docker build -t devopsmentor/node-app:1.0 /workspace"
      },
      {
        "id": "checkpoint_4_container_running",
        "name": "node-app-prod Running & Healthy on :3000",
        "hint": "Start node-app-prod on -p 3000:3000 from devopsmentor/node-app:1.0."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why copy package*.json and run npm install BEFORE copying the rest of your source files?",
        "options": [
          "Docker reuses the cached dependency layer when only application source files change",
          "Docker forbids copying JavaScript files before package.json",
          "npm install deletes application source files otherwise",
          "EXPOSE 3000 requires package.json first"
        ],
        "correctIndex": 0,
        "explanation": "Build layer cache invalidation cascades downward; placing dependency install above source copy speeds up rebuilds."
      },
      {
        "id": 2,
        "question": "What is the advantage of exec-form CMD [\"node\", \"server.js\"] over shell-form CMD node server.js?",
        "options": [
          "Node runs directly as PID 1 and receives termination signals such as SIGTERM cleanly",
          "It compiles JavaScript into native machine code",
          "It automatically opens firewall port 3000",
          "It skips ENV variable expansion cleanly"
        ],
        "correctIndex": 0,
        "explanation": "Shell form wraps the process in /bin/sh -c, which can swallow SIGTERM during graceful container shutdown."
      },
      {
        "id": 3,
        "question": "Which instruction sets the working directory inside the container image for subsequent RUN and CMD steps?",
        "options": [
          "WORKDIR /app",
          "ENV PWD=/app",
          "CD /app",
          "VOLUME /app"
        ],
        "correctIndex": 0,
        "explanation": "WORKDIR creates the directory if missing and sets the working directory for subsequent Dockerfile instructions."
      },
      {
        "id": 4,
        "question": "What does EXPOSE 3000 do in a Dockerfile?",
        "options": [
          "Documents the container listening port in image metadata (you still publish with -p at runtime)",
          "Automatically binds host port 3000 on all interfaces",
          "Starts an internal reverse proxy",
          "Disables container networking"
        ],
        "correctIndex": 0,
        "explanation": "EXPOSE acts as port metadata documentation and supports -P random port publishing, not automatic -p binding."
      }
    ]
  },

  "m06-lab05-data-persistence-volumes": {
    "summary": "Manage persistent storage decoupled from ephemeral container lifecycles by provisioning named volume nexus-data, writing critical state, replacing containers, and verifying survival.",
    "phase1Description": "Create a Docker-managed named volume nexus-data and verify its host storage mountpoint:",
    "guidedCommands": [
      {
        "label": "1. PROVISION NAMED VOLUME",
        "command": "docker volume create nexus-data && docker volume ls && docker volume inspect nexus-data"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Write Persistent Record to Volume",
        "description": "Launch db-durable mounting nexus-data:/data with MYSQL_ROOT_PASSWORD=SithLord2026 and write critical_record into /data/note.txt via docker exec.",
        "hintCommand": "docker run -d --name db-durable -e MYSQL_ROOT_PASSWORD=SithLord2026 -v nexus-data:/data mysql:8.0 && docker exec db-durable sh -c \"echo critical_record > /data/note.txt\""
      }
    ],
    "breakFix": {
      "title": "Incident: Survive Container Replacement Without Data Loss",
      "description": "Destroy db-durable completely with docker rm -f db-durable, provision replacement container db-durable-2 attaching nexus-data:/data, and verify critical_record persists into /workspace/volume_verified.txt.",
      "steps": [
        {
          "label": "Destroy original container",
          "detail": "Run docker rm -f db-durable."
        },
        {
          "label": "Mount existing volume on db-durable-2",
          "detail": "Launch db-durable-2 with -v nexus-data:/data and MYSQL_ROOT_PASSWORD=SithLord2026."
        },
        {
          "label": "Verify content",
          "detail": "Read /data/note.txt from db-durable-2 into /workspace/volume_verified.txt."
        }
      ],
      "remediationCommand": "docker rm -f db-durable && docker run -d --name db-durable-2 -e MYSQL_ROOT_PASSWORD=SithLord2026 -v nexus-data:/data mysql:8.0 && docker exec db-durable-2 cat /data/note.txt > /workspace/volume_verified.txt"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_volume_create",
        "name": "Named Volume nexus-data Created",
        "hint": "Run: docker volume create nexus-data"
      },
      {
        "id": "checkpoint_2_persist_record",
        "name": "Critical Record Persisted Inside Volume",
        "hint": "Write critical_record to /data/note.txt inside the container mounting nexus-data."
      },
      {
        "id": "checkpoint_3_survivability",
        "name": "db-durable Replaced by db-durable-2 with Volume Attached",
        "hint": "Remove db-durable and start db-durable-2 mounting nexus-data:/data."
      },
      {
        "id": "checkpoint_4_backup_verify",
        "name": "Survived Data Verified in /workspace/volume_verified.txt",
        "hint": "Run: docker exec db-durable-2 cat /data/note.txt > /workspace/volume_verified.txt"
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What happens to files written inside a container writable layer (outside volumes) when docker rm runs?",
        "options": [
          "They are permanently deleted along with the container writable layer",
          "They automatically copy into a named volume",
          "They persist inside /tmp on the host",
          "They convert into an image layer"
        ],
        "correctIndex": 0,
        "explanation": "Container writable layers are ephemeral and bound to container lifetime; volumes persist independently."
      },
      {
        "id": 2,
        "question": "What is the syntax to attach a named Docker volume nexus-data to /nexus-data inside a container?",
        "options": [
          "-v nexus-data:/nexus-data",
          "-p nexus-data:/nexus-data",
          "-e VOLUME=nexus-data",
          "--data nexus-data"
        ],
        "correctIndex": 0,
        "explanation": "The -v flag maps <volume_name>:<container_mount_path>."
      },
      {
        "id": 3,
        "question": "Why are Docker named volumes generally preferred over host bind mounts for production databases?",
        "options": [
          "Docker manages permissions, isolation, and portability independently of host directory layout",
          "Named volumes never consume disk space",
          "Bind mounts cannot hold binary files",
          "Named volumes encrypt tables with TLS automatically"
        ],
        "correctIndex": 0,
        "explanation": "Docker-managed volumes decouple storage lifecycle and permissions from arbitrary host filesystem paths."
      },
      {
        "id": 4,
        "question": "Which command displays the host storage path and driver of a named volume?",
        "options": [
          "docker volume inspect <name>",
          "docker volume logs <name>",
          "docker ps --volumes-only",
          "docker stat <name>"
        ],
        "correctIndex": 0,
        "explanation": "docker volume inspect outputs driver, name, labels, and host mountpoint JSON."
      }
    ]
  },

  "m06-lab06-docker-compose-orchestration": {
    "summary": "Repair a broken multi-tier docker-compose.yml stack, launch frontend, backend, and database tiers together on an isolated bridge network, and verify service discovery DNS.",
    "phase1Description": "Inspect the pre-staged broken /workspace/docker-compose.yml and API context directory before repairing the multi-tier manifest:",
    "guidedCommands": [
      {
        "label": "1. INSPECT STAGED COMPOSE STACK",
        "command": "ls -la /workspace && cat /workspace/docker-compose.yml"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Repair Multi-Tier docker-compose.yml",
        "description": "Update /workspace/docker-compose.yml so frontend exposes 8080:80, backend builds ./api on 5000:5000, database sets MYSQL_ROOT_PASSWORD: SithLord2026 and mounts nexus-data:/var/lib/mysql with top-level volumes.",
        "hintCommand": "Fix port 8080:80 on frontend, add MYSQL_ROOT_PASSWORD: SithLord2026 and volumes nexus-data:/var/lib/mysql on database."
      },
      {
        "title": "Task 2.2 — Launch Stack & Verify Service DNS",
        "description": "Run docker compose up -d inside /workspace, verify docker compose ps, and ping database from backend saving output into /workspace/dns_ping.txt.",
        "hintCommand": "cd /workspace && docker compose up -d && docker compose exec backend ping -c 2 database > /workspace/dns_ping.txt"
      }
    ],
    "breakFix": {
      "title": "Incident: Verify End-to-End Frontend Serving on :8080",
      "description": "After bringing up the repaired Compose stack, confirm curl -s http://localhost:8080 returns the Nginx greeting rather than connection refused.",
      "steps": [
        {
          "label": "Verify running containers",
          "detail": "Check docker compose ps shows frontend, backend, and database Up."
        },
        {
          "label": "Curl frontend gateway",
          "detail": "Run curl -s http://localhost:8080 and confirm Welcome to nginx!"
        }
      ],
      "remediationCommand": "curl -s http://localhost:8080 | grep \"Welcome to nginx\""
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_compose_manifest",
        "name": "docker-compose.yml Fixed & Valid",
        "hint": "Ensure /workspace/docker-compose.yml exposes 8080:80, 5000:5000, MYSQL_ROOT_PASSWORD=SithLord2026, and nexus-data volume."
      },
      {
        "id": "checkpoint_2_compose_up",
        "name": "All 3 Compose Services Running",
        "hint": "Run cd /workspace && docker compose up -d and verify frontend, backend, database are Up."
      },
      {
        "id": "checkpoint_3_service_dns",
        "name": "Internal Compose Service DNS Verified",
        "hint": "Run: cd /workspace && docker compose exec backend ping -c 2 database > /workspace/dns_ping.txt"
      },
      {
        "id": "checkpoint_4_compose_health",
        "name": "Frontend Responding on Port 8080",
        "hint": "Ensure frontend maps 8080:80 and responds to curl -s http://localhost:8080."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "How do services inside the same docker-compose.yml reach one another over TCP/IP?",
        "options": [
          "Docker Compose creates an isolated bridge network with automatic DNS resolving each service name",
          "By hardcoding 127.0.0.1 in every container",
          "Through host /etc/passwd lookups",
          "Only over public internet IP addresses"
        ],
        "correctIndex": 0,
        "explanation": "Compose creates a user-defined bridge network with embedded DNS mapping service names (e.g., database) to container IPs."
      },
      {
        "id": 2,
        "question": "Which command builds/starts all services defined in docker-compose.yml in the background?",
        "options": [
          "docker compose up -d",
          "docker compose ps",
          "docker build --all",
          "docker swarm init"
        ],
        "correctIndex": 0,
        "explanation": "docker compose up -d creates networks/volumes and launches all services detached."
      },
      {
        "id": 3,
        "question": "What is the purpose of top-level volumes: nexus-data: in docker-compose.yml?",
        "options": [
          "Declares a Compose-managed named volume that services can reference in their volumes list",
          "Exposes port 8081 automatically",
          "Sets Docker Hub push credentials",
          "Limits RAM usage per container"
        ],
        "correctIndex": 0,
        "explanation": "Named volumes must be declared under top-level volumes: so services can mount them consistently."
      },
      {
        "id": 4,
        "question": "Which command tears down containers and the Compose network without deleting named volumes?",
        "options": [
          "docker compose down",
          "docker compose down -v",
          "docker system prune --volumes",
          "docker stop *"
        ],
        "correctIndex": 0,
        "explanation": "docker compose down removes containers and networks while preserving named volumes unless -v is passed."
      }
    ]
  },

  "m06-lab07-private-registry-gateway": {
    "summary": "Configure insecure-registries in /etc/docker/daemon.json, authenticate to internal registry registry.internal.local:8082, retag application images with registry coordinates, and push.",
    "phase1Description": "Attempt to log in to registry.internal.local:8082 before configuring /etc/docker/daemon.json to observe the TLS rejection error:",
    "guidedCommands": [
      {
        "label": "1. OBSERVE INSECURE REGISTRY REJECTION & LOCAL IMAGES",
        "command": "docker images && (docker login registry.internal.local:8082 -u admin -p admin123 || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Whitelist Insecure Internal Registry",
        "description": "Configure /etc/docker/daemon.json containing {\"insecure-registries\": [\"registry.internal.local:8082\"]} and verify authentication succeeds via docker login.",
        "hintCommand": "printf '{\\n  \"insecure-registries\": [\"registry.internal.local:8082\"]\\n}\\n' > /etc/docker/daemon.json && docker login registry.internal.local:8082 -u admin"
      },
      {
        "title": "Task 2.2 — Retag Image with Registry FQDN",
        "description": "Tag devopsmentor/node-app:1.0 as registry.internal.local:8082/devopsmentor/node-app:1.0.",
        "hintCommand": "docker tag devopsmentor/node-app:1.0 registry.internal.local:8082/devopsmentor/node-app:1.0"
      }
    ],
    "breakFix": {
      "title": "Incident: Complete Artifact Push to Private Registry",
      "description": "Push the retagged image registry.internal.local:8082/devopsmentor/node-app:1.0 to the private registry and confirm upload succeeds.",
      "steps": [
        {
          "label": "Verify auth",
          "detail": "Check /root/.docker/config.json contains registry.internal.local:8082."
        },
        {
          "label": "Push image",
          "detail": "Run docker push registry.internal.local:8082/devopsmentor/node-app:1.0."
        }
      ],
      "remediationCommand": "docker push registry.internal.local:8082/devopsmentor/node-app:1.0"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_daemon_json",
        "name": "/etc/docker/daemon.json Configured",
        "hint": "Add {\"insecure-registries\": [\"registry.internal.local:8082\"]} to /etc/docker/daemon.json."
      },
      {
        "id": "checkpoint_2_registry_login",
        "name": "Authenticated to registry.internal.local:8082",
        "hint": "Run: docker login registry.internal.local:8082 -u admin"
      },
      {
        "id": "checkpoint_3_image_tagged",
        "name": "Image Tagged with Private Registry URI",
        "hint": "Tag with: docker tag devopsmentor/node-app:1.0 registry.internal.local:8082/devopsmentor/node-app:1.0"
      },
      {
        "id": "checkpoint_4_image_pushed",
        "name": "Image Pushed to Private Registry",
        "hint": "Push with: docker push registry.internal.local:8082/devopsmentor/node-app:1.0"
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why does docker push devopsmentor/node-app:1.0 attempt to upload to Docker Hub instead of an internal registry?",
        "options": [
          "Without a registry hostname prefix (host:port/), Docker defaults to docker.io",
          "docker push only reads /etc/hosts",
          "Tags with 1.0 are reserved for Docker Hub",
          "Docker daemon rejects lowercase repositories locally"
        ],
        "correctIndex": 0,
        "explanation": "A registry host and optional port must prefix the repository name to override the default docker.io registry."
      },
      {
        "id": 2,
        "question": "Which daemon configuration file allows HTTP push/pull against an internal non-TLS test registry?",
        "options": [
          "/etc/docker/daemon.json",
          "/etc/docker/hosts.conf",
          "/root/.docker/registry.env",
          "/etc/systemd/docker.ini"
        ],
        "correctIndex": 0,
        "explanation": "The insecure-registries array in /etc/docker/daemon.json configures HTTP fallback for specified registry hosts."
      },
      {
        "id": 3,
        "question": "Where does docker login store encoded registry authentication tokens by default?",
        "options": [
          "/root/.docker/config.json (or ~/.docker/config.json)",
          "/etc/passwd",
          "/var/log/docker-auth.log",
          "/etc/docker/daemon.json"
        ],
        "correctIndex": 0,
        "explanation": "Docker CLI saves registry credential entries under ~/.docker/config.json."
      },
      {
        "id": 4,
        "question": "Does docker tag duplicate image filesystem layers on disk?",
        "options": [
          "No, it adds a lightweight pointer/reference to the existing immutable image ID",
          "Yes, it copies all layers twice",
          "Only if the registry is remote",
          "Only on Alpine images"
        ],
        "correctIndex": 0,
        "explanation": "Docker tags are named pointers to content-addressable image manifests; no layer data is duplicated."
      }
    ]
  },

  "m06-lab08-deploying-nexus": {
    "summary": "Provision persistent repository storage nexus-repo-data, deploy Sonatype Nexus 3 on port 8081:8081, monitor JVM startup telemetry logs, and confirm live HTTP 200 readiness.",
    "phase1Description": "Audit existing containers/images and provision the persistent storage volume nexus-repo-data:",
    "guidedCommands": [
      {
        "label": "1. CHECK VOLUME & MISCONFIGURED STATE",
        "command": "docker ps -a && docker volume create nexus-repo-data"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Launch Stateful Nexus Container",
        "description": "Deploy sonatype/nexus3:latest detached as container nexus mapping port 8081:8081 and mounting nexus-repo-data:/nexus-data.",
        "hintCommand": "docker run -d --name nexus -p 8081:8081 -v nexus-repo-data:/nexus-data sonatype/nexus3:latest"
      },
      {
        "title": "Task 2.2 — Monitor JVM Boot Logs",
        "description": "Verify Started Sonatype Nexus appears in docker logs nexus and save the log output to /workspace/nexus_boot.log.",
        "hintCommand": "docker logs nexus > /workspace/nexus_boot.log"
      }
    ],
    "breakFix": {
      "title": "Incident: Verify Artifact Manager HTTP Endpoint on :8081",
      "description": "Ensure old nexus-misconfigured is cleaned up, confirm Nexus responds with HTTP 200 OK on localhost:8081, and save headers to /workspace/nexus_headers.txt.",
      "steps": [
        {
          "label": "Clean legacy container",
          "detail": "Remove nexus-misconfigured with docker rm -f nexus-misconfigured."
        },
        {
          "label": "Verify HTTP readiness",
          "detail": "Run curl -sI http://localhost:8081 > /workspace/nexus_headers.txt."
        }
      ],
      "remediationCommand": "docker rm -f nexus-misconfigured && curl -sI http://localhost:8081 > /workspace/nexus_headers.txt"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_nexus_volume",
        "name": "Volume nexus-repo-data Created",
        "hint": "Run: docker volume create nexus-repo-data"
      },
      {
        "id": "checkpoint_2_nexus_container",
        "name": "Nexus Container Running on 8081:8081 with Volume",
        "hint": "Launch nexus with -p 8081:8081 -v nexus-repo-data:/nexus-data sonatype/nexus3:latest."
      },
      {
        "id": "checkpoint_3_nexus_startup_logs",
        "name": "Nexus Startup Logs Verified",
        "hint": "Save docker logs nexus into /workspace/nexus_boot.log."
      },
      {
        "id": "checkpoint_4_nexus_http_ready",
        "name": "Nexus Serving HTTP 200 on Port 8081",
        "hint": "Run: curl -sI http://localhost:8081 > /workspace/nexus_headers.txt"
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Inside the official sonatype/nexus3 container, which internal path holds artifact blobs and databases?",
        "options": [
          "/nexus-data",
          "/var/lib/nexus",
          "/opt/sonatype/artifacts",
          "/data/registry"
        ],
        "correctIndex": 0,
        "explanation": "Sonatype Nexus 3 stores configuration, OrientDB metadata, and blob stores inside /nexus-data."
      },
      {
        "id": 2,
        "question": "Why must a production Nexus container mount a persistent volume before launch?",
        "options": [
          "Without an external volume, stored artifacts and repository configuration disappear if the container is recreated",
          "Because Nexus refuses to bind port 8081 without /nexus-data mounted",
          "Volumes automatically configure HTTPS certificates",
          "Volumes bypass JVM heap limits"
        ],
        "correctIndex": 0,
        "explanation": "Mounting nexus-repo-data:/nexus-data protects artifacts across image upgrades and container replacements."
      },
      {
        "id": 3,
        "question": "Which curl flag fetches only HTTP response headers (useful for quick readiness checks)?",
        "options": [
          "-I",
          "-X POST",
          "-o /dev/null",
          "-k"
        ],
        "correctIndex": 0,
        "explanation": "curl -I issues a HEAD request and outputs response status and HTTP headers cleanly."
      },
      {
        "id": 4,
        "question": "Which log line confirms the Nexus Jetty web interface is ready to accept traffic?",
        "options": [
          "Started Sonatype Nexus OSS",
          "Container layer mounted",
          "systemd target reached",
          "PULL_COMPLETE_8081"
        ],
        "correctIndex": 0,
        "explanation": "Nexus logs Started Sonatype Nexus OSS once Felix bundles and Jetty listeners finish booting."
      }
    ]
  },

  "m09-lab01-control-plane-mechanics": {
    "summary": "Initialize a local single-node Kubernetes cluster with minikube, audit control plane health and node telemetry, execute an imperative Python probe Pod, inspect logs, and clean up ephemeral Pods.",
    "phase1Description": "Initialize the Minikube Kubernetes cluster using the docker driver and audit control plane components and node readiness:",
    "guidedCommands": [
      {
        "label": "1. START MINIKUBE CONTROL PLANE",
        "command": "minikube start --driver=docker"
      },
      {
        "label": "2. AUDIT CLUSTER HEALTH & NODES",
        "command": "kubectl get componentstatuses && kubectl cluster-info && kubectl get nodes -o wide"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Capture Cluster Identity & Node Topology",
        "description": "Save the output of kubectl cluster-info and kubectl get nodes -o wide into /workspace/cluster_status.txt.",
        "hintCommand": "{ kubectl cluster-info; kubectl get nodes -o wide; } > /workspace/cluster_status.txt"
      },
      {
        "title": "Task 2.2 — Execute Imperative Python Probe Pod",
        "description": "Create an imperative Pod named py-probe using python:3.11-slim with --restart=Never running python -c \"import sys; print(sys.version)\", save its logs to /workspace/py_probe.log, and delete py-probe.",
        "hintCommand": "kubectl run py-probe --image=python:3.11-slim --restart=Never --command -- python -c \"import sys; print(sys.version)\" && kubectl logs py-probe > /workspace/py_probe.log"
      }
    ],
    "breakFix": {
      "title": "Incident: Clean Up Completed Probe Pod & Verify System Pods",
      "description": "After capturing /workspace/py_probe.log, clean up the imperative py-probe Pod and confirm kube-apiserver-minikube is Running in kube-system.",
      "steps": [
        {
          "label": "Delete ephemeral Pod",
          "detail": "Run kubectl delete pod py-probe."
        },
        {
          "label": "Verify control plane pods",
          "detail": "Run kubectl get pods -n kube-system and confirm kube-apiserver-minikube is Running."
        }
      ],
      "remediationCommand": "kubectl delete pod py-probe && kubectl get pods -n kube-system"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_minikube_ready",
        "name": "Minikube Cluster Started & Node Ready",
        "hint": "Initialize the cluster with: minikube start --driver=docker"
      },
      {
        "id": "checkpoint_2_control_plane_audit",
        "name": "Control Plane Status Saved to /workspace/cluster_status.txt",
        "hint": "Save kubectl cluster-info and kubectl get nodes -o wide into /workspace/cluster_status.txt."
      },
      {
        "id": "checkpoint_3_py_probe_pod",
        "name": "Imperative py-probe Python Version Captured",
        "hint": "Run kubectl run py-probe and save kubectl logs py-probe into /workspace/py_probe.log."
      },
      {
        "id": "checkpoint_4_cleanup_broken_pod",
        "name": "Ephemeral py-probe Deleted & Control Plane Healthy",
        "hint": "Delete py-probe with kubectl delete pod py-probe and verify kube-apiserver-minikube is Running."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Which command checks the API server endpoint and CoreDNS cluster status?",
        "options": [
          "kubectl cluster-info",
          "kubectl describe pod all",
          "minikube addons list",
          "docker inspect minikube"
        ],
        "correctIndex": 0,
        "explanation": "kubectl cluster-info prints control plane API URLs and core add-on proxy endpoints."
      },
      {
        "id": 2,
        "question": "Why pass --restart=Never when running a one-shot diagnostic Pod via kubectl run?",
        "options": [
          "So Kubernetes creates a bare Pod that transitions to Completed instead of restarting on exit",
          "So the Pod runs directly on the host without containers",
          "To skip image pull checks permanently",
          "To bind host port 8080 automatically"
        ],
        "correctIndex": 0,
        "explanation": "A default Pod restartPolicy is Always; --restart=Never allows one-off probes to exit cleanly."
      },
      {
        "id": 3,
        "question": "In kube-system, which component serves as the cluster distributed key-value backing store?",
        "options": [
          "etcd-minikube",
          "coredns",
          "kube-proxy",
          "storage-provisioner"
        ],
        "correctIndex": 0,
        "explanation": "etcd persists all Kubernetes API objects, cluster topology, and state transitions."
      },
      {
        "id": 4,
        "question": "Which command reveals detailed Scheduling events and container exit codes for a Pod?",
        "options": [
          "kubectl describe pod <name>",
          "kubectl version",
          "kubectl top node",
          "minikube ip"
        ],
        "correctIndex": 0,
        "explanation": "kubectl describe displays Conditions, Events, Volume mounts, and detailed container state transitions."
      }
    ]
  },

  "m09-lab02-declarative-topologies-services": {
    "summary": "Author declarative YAML manifests for a 3-replica FastAPI Deployment, expose internal DNS load balancing with ClusterIP, configure NodePort 30080 external routing, and execute a zero-downtime rollout rollback.",
    "phase1Description": "Inspect the pre-staged /workspace/deployment.yaml containing replicas: 1 and a broken image tag before scaling to 3 replicas with Services:",
    "guidedCommands": [
      {
        "label": "1. CHECK CLUSTER & BROKEN MANIFEST DRAFT",
        "command": "kubectl get nodes && cat /workspace/deployment.yaml"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Author Valid 3-Replica FastAPI Deployment",
        "description": "Update /workspace/deployment.yaml with replicas: 3 and image: tiangolo/uvicorn-gunicorn-fastapi:python3.11 (port 80, env APP_ENV=production) and apply it.",
        "hintCommand": "Edit /workspace/deployment.yaml with replicas: 3 & python3.11 tag, then run kubectl apply -f /workspace/deployment.yaml."
      },
      {
        "title": "Task 2.2 — Expose ClusterIP & NodePort 30080 Services",
        "description": "Author /workspace/service-clusterip.yaml (name fastapi-clusterip, port 80) and /workspace/service-nodeport.yaml (name fastapi-nodeport, nodePort 30080) targeting app: fastapi, and apply both.",
        "hintCommand": "kubectl apply -f /workspace/service-clusterip.yaml -f /workspace/service-nodeport.yaml"
      }
    ],
    "breakFix": {
      "title": "Incident: Simulate Bad Image Rollout & Execute Rollback",
      "description": "Test Deployment revision resilience by setting image fastapi=tiangolo/uvicorn-gunicorn-fastapi:broken-v9, observing the failing rollout, and restoring healthy state via kubectl rollout undo deployment/fastapi-deployment.",
      "steps": [
        {
          "label": "Trigger faulty rollout",
          "detail": "Run kubectl set image deployment/fastapi-deployment fastapi=tiangolo/uvicorn-gunicorn-fastapi:broken-v9."
        },
        {
          "label": "Rollback safely",
          "detail": "Run kubectl rollout undo deployment/fastapi-deployment and verify kubectl rollout status deployment/fastapi-deployment."
        }
      ],
      "remediationCommand": "kubectl set image deployment/fastapi-deployment fastapi=tiangolo/uvicorn-gunicorn-fastapi:broken-v9 && kubectl rollout undo deployment/fastapi-deployment && kubectl rollout status deployment/fastapi-deployment"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_fastapi_deployment",
        "name": "3-Replica FastAPI Deployment Healthy",
        "hint": "Apply /workspace/deployment.yaml with replicas: 3 and image tiangolo/uvicorn-gunicorn-fastapi:python3.11."
      },
      {
        "id": "checkpoint_2_clusterip_service",
        "name": "ClusterIP Service & 3 Pod Endpoints Linked",
        "hint": "Apply /workspace/service-clusterip.yaml creating fastapi-clusterip targeting app: fastapi."
      },
      {
        "id": "checkpoint_3_nodeport_service",
        "name": "NodePort Service Exposed on 30080",
        "hint": "Apply /workspace/service-nodeport.yaml creating fastapi-nodeport with nodePort: 30080."
      },
      {
        "id": "checkpoint_4_rollout_recovery",
        "name": "Rollout History Verified & Clean Status",
        "hint": "Test rollout undo and confirm kubectl rollout status deployment/fastapi-deployment succeeds."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "How does a Kubernetes Service discover which Pods should receive traffic?",
        "options": [
          "By matching spec.selector labels against Pod metadata.labels to populate Endpoints",
          "By scanning container hostnames in /etc/hosts",
          "By reading Dockerfile EXPOSE lines directly",
          "By hardcoding Pod IPs in ClusterIP manifests"
        ],
        "correctIndex": 0,
        "explanation": "Services maintain Endpoints dynamically based on selector label matching across Pod metadata."
      },
      {
        "id": 2,
        "question": "What is the valid port range for Kubernetes NodePort services by default?",
        "options": [
          "30000-32767",
          "80-443",
          "1024-65535",
          "8000-9000"
        ],
        "correctIndex": 0,
        "explanation": "Kubernetes allocates NodePorts within 30000-32767 to avoid conflicts with standard node services."
      },
      {
        "id": 3,
        "question": "Which command reverts a Deployment to its immediately preceding healthy ReplicaSet revision?",
        "options": [
          "kubectl rollout undo deployment/<name>",
          "kubectl delete pods --all",
          "kubectl apply --revert",
          "kubectl cluster-info restore"
        ],
        "correctIndex": 0,
        "explanation": "kubectl rollout undo restores the prior ReplicaSet template without manual YAML editing."
      },
      {
        "id": 4,
        "question": "In a ClusterIP Service, what occurs when one of the 3 backend Pods crashes?",
        "options": [
          "The Service removes that Pod IP from Endpoints and routes traffic to the remaining healthy Pods while ReplicaSet recreates it",
          "The ClusterIP virtual IP address changes",
          "The entire Deployment terminates",
          "NodePort 30080 shuts down permanently"
        ],
        "correctIndex": 0,
        "explanation": "ClusterIP remains stable while Endpoint controllers dynamically update active backend IPs."
      }
    ]
  },

  "m09-lab03-state-secrets-volumes": {
    "summary": "Decouple sensitive database passwords in Secrets and runtime keys in ConfigMaps, provision PersistentVolume + PersistentVolumeClaim storage, deploy stateful Redis, and verify data survives Pod deletion.",
    "phase1Description": "Verify cluster storage provisioner status and encode the Redis password string with base64 for your Secret manifest:",
    "guidedCommands": [
      {
        "label": "1. GENERATE BASE64 SECRET PAYLOAD",
        "command": "kubectl get pods -n kube-system && echo -n \"SuperSecretRedisPass!\" | base64"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Author Secret, ConfigMap & PV/PVC Storage",
        "description": "Create /workspace/secret.yaml (redis-secret), /workspace/configmap.yaml (app-config with REDIS_HOST=redis-service, REDIS_PORT=6379), and /workspace/pv-pvc.yaml (redis-pv & redis-pvc 1Gi), and apply them.",
        "hintCommand": "kubectl apply -f /workspace/secret.yaml -f /workspace/configmap.yaml -f /workspace/pv-pvc.yaml && kubectl get pv,pvc"
      },
      {
        "title": "Task 2.2 — Deploy Stateful Redis Mounted to redis-pvc",
        "description": "Author /workspace/redis-deployment.yaml running redis:7.2-alpine mounting redis-pvc at /data and injecting redis-secret, then apply it.",
        "hintCommand": "kubectl apply -f /workspace/redis-deployment.yaml && kubectl get pods"
      }
    ],
    "breakFix": {
      "title": "Incident: Prove Data Survivability Across Pod Eviction",
      "description": "Write test_key=\"persistence_verified\" via kubectl exec redis-cli, delete the Redis Pod forcibly so Deployment replaces it, and verify the key survives in the new Pod.",
      "steps": [
        {
          "label": "Write state",
          "detail": "Execute SET test_key \"persistence_verified\" inside the running Redis Pod."
        },
        {
          "label": "Destroy Pod",
          "detail": "Run kubectl delete pod <redis-pod-name> and allow replacement Pod to boot."
        },
        {
          "label": "Verify key survived",
          "detail": "Query GET test_key on the newly scheduled Pod."
        }
      ],
      "remediationCommand": "POD=$(kubectl get pods -l app=redis -o jsonpath=\"{.items[0].name}\" 2>/dev/null || kubectl get pods | awk \"/redis-deployment/{print \\$1; exit}\") && kubectl exec $POD -- redis-cli SET test_key persistence_verified && kubectl delete pod $POD && NPOD=$(kubectl get pods | awk \"/redis-deployment/{print \\$1; exit}\") && kubectl exec $NPOD -- redis-cli GET test_key"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_secret_configmap",
        "name": "redis-secret & app-config Applied",
        "hint": "Apply secret.yaml (redis-secret) and configmap.yaml (app-config)."
      },
      {
        "id": "checkpoint_2_pv_pvc_bound",
        "name": "redis-pv & redis-pvc Bound",
        "hint": "Apply /workspace/pv-pvc.yaml and verify kubectl get pv,pvc shows Bound."
      },
      {
        "id": "checkpoint_3_redis_deployment",
        "name": "redis-deployment Running with PVC Mount",
        "hint": "Apply /workspace/redis-deployment.yaml mounting redis-pvc at /data."
      },
      {
        "id": "checkpoint_4_redis_persistence",
        "name": "Redis Persistence Verified Across Pod Deletion",
        "hint": "Use kubectl exec <pod> -- redis-cli SET test_key \"persistence_verified\", delete pod, and confirm persistence."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Does base64 encoding inside a Kubernetes Secret encrypt the secret value cryptographically?",
        "options": [
          "No; base64 is merely reversible encoding — encryption at rest in etcd and RBAC protect Secrets",
          "Yes; Kubernetes uses AES-256 base64 cipher",
          "Only inside alpine containers",
          "Only when paired with ConfigMap"
        ],
        "correctIndex": 0,
        "explanation": "Base64 encodes binary-safe text, not secrecy; clusters require etcd encryption and strict RBAC."
      },
      {
        "id": 2,
        "question": "What is the lifecycle relationship between a PersistentVolume (PV) and PersistentVolumeClaim (PVC)?",
        "options": [
          "A PVC requests storage capacity and access modes that bind to an available matching PV independently of Pod restarts",
          "PVs are deleted whenever a Pod is deleted",
          "PVCs only exist inside container images",
          "PVs replace Kubernetes Secrets for TLS"
        ],
        "correctIndex": 0,
        "explanation": "Separating PV provisioning from PVC consumption lets stateful data outlive ephemeral Pod scheduling."
      },
      {
        "id": 3,
        "question": "What does persistentVolumeReclaimPolicy: Retain prevent?",
        "options": [
          "Automatic erasure of underlying storage data when a PVC is accidentally deleted",
          "Mounting a volume read-write by a Pod",
          "Updating ConfigMap keys",
          "Scheduling Pods on the control-plane node"
        ],
        "correctIndex": 0,
        "explanation": "Retain keeps the PV and its data intact for manual inspection/recovery after claim deletion."
      },
      {
        "id": 4,
        "question": "Which object should store non-sensitive settings like REDIS_HOST and APP_LOG_LEVEL?",
        "options": [
          "ConfigMap",
          "ClusterRole",
          "Ingress",
          "PersistentVolume"
        ],
        "correctIndex": 0,
        "explanation": "ConfigMaps decouple plain-text operational configuration from container images."
      }
    ]
  },

  "m09-lab04-namespaces-ingress-routing": {
    "summary": "Partition a shared Kubernetes cluster into staging and production Namespaces, enable the NGINX Ingress controller addon, configure host/path HTTP routing rules, and test Layer-7 ingress traffic.",
    "phase1Description": "Audit existing cluster Namespaces and switch context namespace safely:",
    "guidedCommands": [
      {
        "label": "1. INSPECT NAMESPACES & CONTEXT",
        "command": "kubectl get namespaces && kubens"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Provision staging & production Namespaces + Workload",
        "description": "Author /workspace/namespace.yaml defining staging and production Namespaces, apply it, switch to staging with kubens staging, and deploy fastapi-deployment + fastapi-clusterip into staging.",
        "hintCommand": "kubectl apply -f /workspace/namespace.yaml && kubens staging && kubectl apply -f /workspace/deployment.yaml -f /workspace/service-clusterip.yaml -n staging"
      },
      {
        "title": "Task 2.2 — Enable NGINX Ingress Addon & Apply Host Rules",
        "description": "Enable Minikube ingress (minikube addons enable ingress) and apply /workspace/ingress.yaml (fastapi-ingress in staging) routing api.devopsmentor.local (/api & /health) to fastapi-clusterip:80.",
        "hintCommand": "minikube addons enable ingress && kubectl apply -f /workspace/ingress.yaml"
      }
    ],
    "breakFix": {
      "title": "Incident: Verify Layer-7 Ingress HTTP Routing",
      "description": "Test live ingress routing for api.devopsmentor.local using the Host header against minikube ip and record response into /workspace/ingress_verify.txt.",
      "steps": [
        {
          "label": "Inspect ingress address",
          "detail": "Run kubectl get ingress -n staging to verify host api.devopsmentor.local."
        },
        {
          "label": "Verify HTTP route",
          "detail": "Run curl -s -H \"Host: api.devopsmentor.local\" http://$(minikube ip)/api > /workspace/ingress_verify.txt."
        }
      ],
      "remediationCommand": "curl -s -H \"Host: api.devopsmentor.local\" \"http://$(minikube ip)/api\" > /workspace/ingress_verify.txt"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_namespaces",
        "name": "staging & production Namespaces Active",
        "hint": "Create staging and production Namespaces via /workspace/namespace.yaml."
      },
      {
        "id": "checkpoint_2_staging_workload",
        "name": "FastAPI Deployment & Service Running in staging",
        "hint": "Deploy fastapi-deployment and fastapi-clusterip inside the staging namespace."
      },
      {
        "id": "checkpoint_3_ingress_addon",
        "name": "NGINX Ingress Enabled & Rule Applied",
        "hint": "Run minikube addons enable ingress and apply /workspace/ingress.yaml in staging."
      },
      {
        "id": "checkpoint_4_ingress_route_test",
        "name": "Layer-7 Ingress Traffic Verified",
        "hint": "Save curl -H \"Host: api.devopsmentor.local\" http://$(minikube ip)/api into /workspace/ingress_verify.txt."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What is the full cluster-internal DNS name of fastapi-clusterip residing in namespace staging?",
        "options": [
          "fastapi-clusterip.staging.svc.cluster.local",
          "staging.fastapi-clusterip.kube",
          "localhost/staging/fastapi-clusterip",
          "fastapi-clusterip.default.internal"
        ],
        "correctIndex": 0,
        "explanation": "Kubernetes Service DNS uses <service>.<namespace>.svc.cluster.local."
      },
      {
        "id": 2,
        "question": "Which layer of the OSI model does a standard Kubernetes Ingress controller operate on?",
        "options": [
          "Layer 7 (HTTP/HTTPS Host & Path routing)",
          "Layer 2 (MAC switching)",
          "Layer 1 (Physical links)",
          "Layer 3 only"
        ],
        "correctIndex": 0,
        "explanation": "Ingress inspects HTTP Host headers, TLS SNI, and URI paths to multiplex multiple services through one load balancer."
      },
      {
        "id": 3,
        "question": "What must be running inside the cluster for an Ingress YAML resource to actually route requests?",
        "options": [
          "An Ingress Controller (such as ingress-nginx)",
          "NodePort 30000 on every worker",
          "Host SSH agent forwarding",
          "A privileged daemonset running firewalld"
        ],
        "correctIndex": 0,
        "explanation": "Ingress objects are merely routing rules until an Ingress Controller watches and reconciles them."
      },
      {
        "id": 4,
        "question": "Which utility quickly changes your active kubeconfig default namespace without retyping -n?",
        "options": [
          "kubens <namespace>",
          "kubectl top ns",
          "minikube cd <namespace>",
          "helm switch"
        ],
        "correctIndex": 0,
        "explanation": "kubens updates the active context namespace in kubeconfig cleanly."
      }
    ]
  },

  "m09-lab05-api-security-rbac": {
    "summary": "Enforce least-privilege access control by creating ServiceAccount developer-sa in staging, binding a namespaced read-only Role, binding a cluster-wide Node auditor ClusterRole, and auditing permissions with kubectl auth can-i.",
    "phase1Description": "Provision the ServiceAccount identity developer-sa inside the staging namespace:",
    "guidedCommands": [
      {
        "label": "1. CREATE SERVICEACCOUNT",
        "command": "kubectl create serviceaccount developer-sa -n staging && kubectl get sa -n staging"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Author & Bind Read-Only Staging Role",
        "description": "Author /workspace/role.yaml (developer-role in staging allowing get, list, watch on pods, pods/log, deployments) and /workspace/rolebinding.yaml binding developer-sa to developer-role, then apply both.",
        "hintCommand": "kubectl apply -f /workspace/role.yaml -f /workspace/rolebinding.yaml"
      },
      {
        "title": "Task 2.2 — Author Cluster-Wide Node Auditor RBAC",
        "description": "Author /workspace/clusterrole.yaml (node-auditor-role allowing get, list on nodes) and /workspace/clusterrolebinding.yaml (developer-node-auditor binding staging:developer-sa), then apply both.",
        "hintCommand": "kubectl apply -f /workspace/clusterrole.yaml -f /workspace/clusterrolebinding.yaml"
      }
    ],
    "breakFix": {
      "title": "Incident: Audit Permissions via Impersonation & Mint JWT Token",
      "description": "Verify developer-sa can list pods & nodes but CANNOT delete pods in staging via kubectl auth can-i, then generate a short-lived token saved into /workspace/developer_token.jwt.",
      "steps": [
        {
          "label": "Verify least privilege",
          "detail": "Run kubectl auth can-i list pods --as=system:serviceaccount:staging:developer-sa -n staging and verify delete pods returns no."
        },
        {
          "label": "Mint service account token",
          "detail": "Run kubectl create token developer-sa -n staging > /workspace/developer_token.jwt."
        }
      ],
      "remediationCommand": "kubectl create token developer-sa -n staging > /workspace/developer_token.jwt"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_service_account",
        "name": "developer-sa Created in staging",
        "hint": "Run: kubectl create serviceaccount developer-sa -n staging"
      },
      {
        "id": "checkpoint_2_role_binding",
        "name": "Namespaced Least-Privilege Role Enforced",
        "hint": "Bind developer-role (get/list/watch pods, deployments) to developer-sa in staging."
      },
      {
        "id": "checkpoint_3_cluster_role_binding",
        "name": "ClusterRole Node Auditor Active",
        "hint": "Apply node-auditor-role ClusterRole & developer-node-auditor ClusterRoleBinding."
      },
      {
        "id": "checkpoint_4_rbac_audit_token",
        "name": "ServiceAccount JWT Token Exported",
        "hint": "Run: kubectl create token developer-sa -n staging > /workspace/developer_token.jwt"
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "When must you use a ClusterRole + ClusterRoleBinding instead of a Role + RoleBinding?",
        "options": [
          "For non-namespaced cluster resources such as nodes, PersistentVolumes, or cluster-wide access",
          "Whenever granting read-only access to Pods inside a single namespace",
          "For encrypting ConfigMaps",
          "Only on Minikube Docker driver"
        ],
        "correctIndex": 0,
        "explanation": "Roles are strictly bound to one namespace, whereas ClusterRoles cover cluster-scoped resources or all namespaces."
      },
      {
        "id": 2,
        "question": "How does Kubernetes evaluate RBAC rules when no explicit permission rule matches an action?",
        "options": [
          "Deny by default (zero trust)",
          "Allow read-only automatically",
          "Prompt interactively",
          "Allow within default namespace"
        ],
        "correctIndex": 0,
        "explanation": "Kubernetes RBAC is purely additive and default-deny until a matching RoleBinding authorizes the verb/resource."
      },
      {
        "id": 3,
        "question": "Which command tests whether a specific ServiceAccount is authorized to delete deployments without performing the action?",
        "options": [
          "kubectl auth can-i delete deployments --as=system:serviceaccount:staging:developer-sa -n staging",
          "kubectl get rbac --test",
          "kubectl describe secret developer-sa",
          "kubectl apply --audit"
        ],
        "correctIndex": 0,
        "explanation": "kubectl auth can-i with --as impersonates the identity cleanly against the API server SubjectAccessReview."
      },
      {
        "id": 4,
        "question": "What does kubectl create token developer-sa -n staging produce?",
        "options": [
          "A short-lived signed JWT bearer token bound to that ServiceAccount",
          "An SSH private key for worker nodes",
          "A base64-encoded Deployment YAML",
          "An ingress TLS wildcard certificate"
        ],
        "correctIndex": 0,
        "explanation": "Modern Kubernetes (TokenRequest API) mints time-bounded JWT credentials via kubectl create token."
      }
    ]
  },

  "m09-lab06-production-hardening-probes": {
    "summary": "Harden Deployment manifests with CPU/Memory requests and limits, readiness and liveness HTTP probes on /healthz, graceful termination preStop hooks, and metrics-server telemetry.",
    "phase1Description": "Inspect the unhardened fastapi-deployment manifest in /workspace/deployment.yaml missing resource quotas, probes, and graceful drain hooks:",
    "guidedCommands": [
      {
        "label": "1. INSPECT UNHARDENED WORKLOAD",
        "command": "cat /workspace/deployment.yaml && kubectl get pods -n staging"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Add Resource Requests, Limits & Health Probes",
        "description": "Update /workspace/deployment.yaml with resources (requests: cpu 250m, memory 256Mi; limits: cpu 500m, memory 512Mi) and both readinessProbe and livenessProbe performing httpGet on /healthz port 80.",
        "hintCommand": "Add resources and readinessProbe/livenessProbe to /workspace/deployment.yaml and run kubectl apply -f /workspace/deployment.yaml."
      },
      {
        "title": "Task 2.2 — Configure Zero-Downtime Graceful Shutdown",
        "description": "Set terminationGracePeriodSeconds: 30 and lifecycle.preStop exec command [\"/bin/sh\", \"-c\", \"sleep 5\"] in /workspace/deployment.yaml and apply.",
        "hintCommand": "Add terminationGracePeriodSeconds: 30 and preStop sleep 5 hook, then run kubectl apply -f /workspace/deployment.yaml."
      }
    ],
    "breakFix": {
      "title": "Incident: Enable Metrics Server & Capture Live Pod Utilization",
      "description": "Enable the metrics-server Minikube addon because kubectl top currently fails with Metrics API unavailable, then capture kubectl top pods -n staging into /workspace/pod_metrics.txt.",
      "steps": [
        {
          "label": "Enable metrics-server",
          "detail": "Run minikube addons enable metrics-server."
        },
        {
          "label": "Record metrics",
          "detail": "Run kubectl top pods -n staging > /workspace/pod_metrics.txt."
        }
      ],
      "remediationCommand": "minikube addons enable metrics-server && kubectl top pods -n staging > /workspace/pod_metrics.txt"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_resource_quotas",
        "name": "CPU & Memory Requests/Limits Configured",
        "hint": "Set requests (250m/256Mi) and limits (500m/512Mi) on fastapi-deployment in staging."
      },
      {
        "id": "checkpoint_2_health_probes",
        "name": "Readiness & Liveness Probes Set on /healthz",
        "hint": "Configure httpGet readinessProbe and livenessProbe on path /healthz port 80."
      },
      {
        "id": "checkpoint_3_graceful_shutdown",
        "name": "Graceful Shutdown preStop Hook & 30s Grace Set",
        "hint": "Set terminationGracePeriodSeconds: 30 and preStop sleep 5 in fastapi-deployment."
      },
      {
        "id": "checkpoint_4_metrics_top",
        "name": "Metrics Server Enabled & Pod Telemetry Captured",
        "hint": "Run minikube addons enable metrics-server and save kubectl top pods -n staging to /workspace/pod_metrics.txt."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What happens differently when a Pod fails its readinessProbe vs its livenessProbe?",
        "options": [
          "Failing readiness removes the Pod IP from Service Endpoints (no new traffic); failing liveness restarts the container",
          "Failing readiness terminates the worker node",
          "Failing liveness deletes the PersistentVolumeClaim",
          "Both behave identically by scaling replicas to 0"
        ],
        "correctIndex": 0,
        "explanation": "Readiness gates traffic routing without restarting the Pod; liveness detects deadlocks and triggers kubelet restarts."
      },
      {
        "id": 2,
        "question": "How does the Kubernetes scheduler use resources.requests vs resources.limits?",
        "options": [
          "requests reserve capacity for Pod placement decisions; limits enforce cgroup hard caps and OOMKill thresholds",
          "limits decide scheduling; requests are ignored",
          "Both only control disk IOPS",
          "requests scale replicas automatically without HPA"
        ],
        "correctIndex": 0,
        "explanation": "kube-scheduler sums requests to ensure node fit, while containerd/cgroups enforce runtime limits."
      },
      {
        "id": 3,
        "question": "Why combine a preStop sleep 5 hook with terminationGracePeriodSeconds: 30?",
        "options": [
          "To give Service Endpoints/kube-proxy time to stop routing new requests before the app shuts down its listener",
          "To delay container startup during boot",
          "To compress pod logs before deletion",
          "To persist ConfigMaps to disk"
        ],
        "correctIndex": 0,
        "explanation": "Pod termination and Endpoints propagation happen asynchronously; preStop absorbs in-flight requests cleanly."
      },
      {
        "id": 4,
        "question": "Which cluster component supplies live CPU and memory readings to kubectl top?",
        "options": [
          "metrics-server",
          "coredns",
          "ingress-nginx",
          "kube-scheduler"
        ],
        "correctIndex": 0,
        "explanation": "metrics-server scrapes kubelet summary metrics and serves the Kubernetes Metrics API."
      }
    ]
  },

  "m09-lab07-custom-helm-chart": {
    "summary": "Scaffold a custom Helm v3 chart microservice-chart, parameterize Go templates with range .Values.env loops, lint and dry-run render templates, and execute stateful helm install & helm upgrade.",
    "phase1Description": "Verify Helm CLI version and scaffold microservice-chart inside /workspace:",
    "guidedCommands": [
      {
        "label": "1. SCAFFOLD HELM CHART BLUEPRINT",
        "command": "cd /workspace && helm version && helm create microservice-chart && ls -la microservice-chart"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Parameterize values.yaml & Deployment Env Loop",
        "description": "Update /workspace/microservice-chart/values.yaml (repository: tiangolo/uvicorn-gunicorn-fastapi, tag: python3.11, replicaCount: 2, env list) and add {{- range .Values.env }} iteration into templates/deployment.yaml, then run helm lint.",
        "hintCommand": "cd /workspace && helm lint ./microservice-chart"
      },
      {
        "title": "Task 2.2 — Install Release into staging",
        "description": "Render manifests with helm template and install release fast-api-release into staging namespace using helm install.",
        "hintCommand": "cd /workspace && helm install fast-api-release ./microservice-chart -n staging --create-namespace"
      }
    ],
    "breakFix": {
      "title": "Incident: Zero-Downtime Scale Upgrade via helm upgrade",
      "description": "Scale fast-api-release cleanly to 3 replicas via helm upgrade --set replicaCount=3 and confirm revision 2 history.",
      "steps": [
        {
          "label": "Upgrade release",
          "detail": "Run helm upgrade fast-api-release ./microservice-chart -n staging --set replicaCount=3."
        },
        {
          "label": "Inspect revision history",
          "detail": "Run helm history fast-api-release -n staging and verify Revision 2 deployed."
        }
      ],
      "remediationCommand": "cd /workspace && helm upgrade fast-api-release ./microservice-chart -n staging --set replicaCount=3 && helm history fast-api-release -n staging"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_chart_scaffold",
        "name": "microservice-chart & values.yaml Configured",
        "hint": "Create /workspace/microservice-chart with tiangolo/uvicorn-gunicorn-fastapi in values.yaml."
      },
      {
        "id": "checkpoint_2_template_env_loop",
        "name": "Deployment Parameterized & helm lint Passes",
        "hint": "Use range .Values.env in templates/deployment.yaml and run helm lint /workspace/microservice-chart."
      },
      {
        "id": "checkpoint_3_helm_install",
        "name": "fast-api-release Deployed in staging",
        "hint": "Install release with helm install fast-api-release /workspace/microservice-chart -n staging --create-namespace."
      },
      {
        "id": "checkpoint_4_helm_upgrade",
        "name": "Release Upgraded to Revision 2 (3 Replicas)",
        "hint": "Run helm upgrade fast-api-release /workspace/microservice-chart -n staging --set replicaCount=3."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Which command renders all Go templates into standard Kubernetes YAML locally without contacting an API server?",
        "options": [
          "helm template <release> <chart>",
          "helm list --all",
          "helm pull --dry",
          "kubectl render"
        ],
        "correctIndex": 0,
        "explanation": "helm template evaluates Chart templates against values locally to catch YAML/indentation bugs early."
      },
      {
        "id": 2,
        "question": "What does Chart.yaml specify versus values.yaml?",
        "options": [
          "Chart.yaml defines chart metadata & versioning; values.yaml defines default configurable template inputs",
          "Chart.yaml defines cluster nodes; values.yaml stores Docker passwords",
          "Both files contain identical YAML schemas",
          "values.yaml is only read by kubectl"
        ],
        "correctIndex": 0,
        "explanation": "Chart.yaml holds package identity/version while values.yaml exposes parameter defaults."
      },
      {
        "id": 3,
        "question": "Which Go template directive trims whitespace and iterates over an environment list in .Values.env?",
        "options": [
          "{{- range .Values.env }}",
          "{{ foreach env }}",
          "{{#each .Values.env}}",
          "{% for env in values %}"
        ],
        "correctIndex": 0,
        "explanation": "{{- range .Values.env }} opens a Helm/Go template loop and chomps preceding whitespace."
      },
      {
        "id": 4,
        "question": "Which flag overrides a single nested YAML key directly from CLI during helm install/upgrade?",
        "options": [
          "--set key=value",
          "--env key=value",
          "--patch-var key=value",
          "-o override"
        ],
        "correctIndex": 0,
        "explanation": "--set injects CLI overrides directly onto the chart values tree without modifying files."
      }
    ]
  },

  "m09-lab08-helmfile-orchestration": {
    "summary": "Construct an environment-matrix repository layout with per-environment override files, declare multi-namespace releases in helmfile.yaml, synchronize all stacks with helmfile sync, and perform disaster rollback.",
    "phase1Description": "Inspect the base microservice-chart and scaffold environment values overrides inside /workspace/values/:",
    "guidedCommands": [
      {
        "label": "1. CHECK CLUSTER & CHART DIRECTORY",
        "command": "ls -la /workspace /workspace/microservice-chart && kubectl get ns"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Author Environment Values Matrix & helmfile.yaml",
        "description": "Create api-staging.yaml, redis-staging.yaml, api-production.yaml, and redis-production.yaml under /workspace/values/, then create /workspace/helmfile.yaml defining releases fastapi-staging, redis-staging, fastapi-production, and redis-production.",
        "hintCommand": "Author /workspace/values/*.yaml and /workspace/helmfile.yaml covering staging & production namespaces."
      },
      {
        "title": "Task 2.2 — Converge Multi-Environment Releases with helmfile sync",
        "description": "Preview changes with helmfile diff and synchronize all 4 releases across staging and production using helmfile sync.",
        "hintCommand": "cd /workspace && helmfile diff && helmfile sync"
      }
    ],
    "breakFix": {
      "title": "Incident: Rollback Staging Release & Record Helmfile Audit",
      "description": "Execute a controlled upgrade + rollback on fastapi-staging (helm rollback fastapi-staging 1 -n staging) and capture helmfile status into /workspace/helmfile_status.txt.",
      "steps": [
        {
          "label": "Upgrade & Rollback",
          "detail": "Upgrade fastapi-staging then run helm rollback fastapi-staging 1 -n staging."
        },
        {
          "label": "Verify status",
          "detail": "Run helmfile status > /workspace/helmfile_status.txt."
        }
      ],
      "remediationCommand": "cd /workspace && helm upgrade fastapi-staging ./microservice-chart -n staging --set replicaCount=4 && helm rollback fastapi-staging 1 -n staging && helmfile status > /workspace/helmfile_status.txt"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_values_matrix",
        "name": "Per-Environment Values Matrix Authored",
        "hint": "Create api-staging.yaml, redis-staging.yaml, api-production.yaml, redis-production.yaml under /workspace/values/."
      },
      {
        "id": "checkpoint_2_helmfile_manifest",
        "name": "Declarative helmfile.yaml Configured",
        "hint": "Define fastapi-staging, redis-staging, fastapi-production, and redis-production in /workspace/helmfile.yaml."
      },
      {
        "id": "checkpoint_3_helmfile_sync",
        "name": "All 4 Releases Synchronized Across Namespaces",
        "hint": "Run cd /workspace && helmfile sync and confirm all 4 releases appear in helm list -A."
      },
      {
        "id": "checkpoint_4_helm_rollback",
        "name": "Staging Rollback & Status Captured",
        "hint": "Verify fastapi-staging rollback history and save helmfile status into /workspace/helmfile_status.txt."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What primary operational problem does Helmfile solve on top of standard Helm v3?",
        "options": [
          "Declarative GitOps orchestration of multiple Helm charts, repositories, namespaces, and environment values files in a single spec",
          "Replacing Docker Engine on worker nodes",
          "Compiling YAML files into Go binaries",
          "Providing kernel firewall rules directly"
        ],
        "correctIndex": 0,
        "explanation": "Helmfile turns imperative multi-release helm install commands into one declarative state-of-world file."
      },
      {
        "id": 2,
        "question": "Which command lets operators preview release changes before applying them with helmfile sync?",
        "options": [
          "helmfile diff",
          "helmfile watch",
          "kubectl explain",
          "helm check"
        ],
        "correctIndex": 0,
        "explanation": "helmfile diff compares the desired state against live cluster releases before mutating anything."
      },
      {
        "id": 3,
        "question": "Why isolate override files into values/api-staging.yaml vs values/api-production.yaml?",
        "options": [
          "To reuse one shared chart template while tuning replica counts, secrets, and quotas per environment",
          "Because Helm refuses to deploy two charts with different tags otherwise",
          "To avoid creating Kubernetes Namespaces",
          "To bypass Kubernetes RBAC"
        ],
        "correctIndex": 0,
        "explanation": "Separating templates from environment override files enforces DRY configuration management."
      },
      {
        "id": 4,
        "question": "Which command reverts a deployed Helm release without touching unrelated releases managed by the same helmfile?",
        "options": [
          "helm rollback <release> <revision> -n <namespace>",
          "helmfile destroy",
          "kubectl delete ns staging",
          "docker compose down"
        ],
        "correctIndex": 0,
        "explanation": "helm rollback restores an individual release to a known-good revision."
      }
    ]
  },

  "m12-lab01-execution-environment": {
    "summary": "Audit Python 3 execution environment, prevent string-to-integer TypeErrors with explicit int() casting in strict_port_check.py, read and mask environment credentials safely, and repair a broken port validator.",
    "phase1Description": "Verify the installed Python 3 binary and inspect the broken /workspace/port_validator.py script:",
    "guidedCommands": [
      {
        "label": "1. CHECK PYTHON RUNTIME & OBSERVE TYPEERROR",
        "command": "python3 --version && (python3 /workspace/port_validator.py || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Explicit Port Casting (strict_port_check.py)",
        "description": "Write /workspace/strict_port_check.py parsing raw_port = \"8080\" with int(), adding 1 to get 8081, and printing type() and formatted f-string output.",
        "hintCommand": "python3 /workspace/strict_port_check.py"
      },
      {
        "title": "Task 2.2 — Environment Credential Reader & Secret Masking",
        "description": "Write /workspace/env_credential_check.py reading DEVOPSMENTOR_API_KEY and DEPLOY_REGION (defaulting to \"us-east-1\") with os.environ.get(), masking API keys to prefix + \"****\" (e.g. dm_l****).",
        "hintCommand": "DEVOPSMENTOR_API_KEY=\"dm_live_98a76b54c321\" python3 /workspace/env_credential_check.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Repair TypeError in /workspace/port_validator.py",
      "description": "Fix /workspace/port_validator.py by explicitly casting raw_port = int(raw_port) before incrementing so it outputs 8081 without raising TypeError.",
      "steps": [
        {
          "label": "Cast raw_port",
          "detail": "Convert raw_port with int(raw_port) before + 1."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/port_validator.py and confirm Next bound port: 8081."
        }
      ],
      "remediationCommand": "sed -i 's/raw_port + 1/int(raw_port) + 1/' /workspace/port_validator.py && python3 /workspace/port_validator.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_strict_port",
        "name": "strict_port_check.py Calculates Port 8081",
        "hint": "Write /workspace/strict_port_check.py casting \"8080\" to int() and printing 8081."
      },
      {
        "id": "checkpoint_2_env_credentials",
        "name": "env_credential_check.py Defaults Region Safely",
        "hint": "Ensure /workspace/env_credential_check.py uses os.environ.get(\"DEPLOY_REGION\", \"us-east-1\")."
      },
      {
        "id": "checkpoint_3_secret_masking",
        "name": "API Secret Properly Masked (dm_l****)",
        "hint": "Mask api_key as f\"{api_key[:4]}****\" in /workspace/env_credential_check.py."
      },
      {
        "id": "checkpoint_4_fix_type_bug",
        "name": "port_validator.py Remediated",
        "hint": "Fix the TypeError in /workspace/port_validator.py so python3 /workspace/port_validator.py prints 8081."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What happens in Python when you run \"8080\" + 1 without explicit casting?",
        "options": [
          "Python raises a TypeError because it refuses implicit coercion between str and int",
          "Python evaluates it to \"80801\"",
          "Python evaluates it to 8081",
          "Python sets the result to None"
        ],
        "correctIndex": 0,
        "explanation": "Python is strongly typed and raises TypeError rather than silently concatenating integers onto strings."
      },
      {
        "id": 2,
        "question": "Why prefer os.environ.get(\"DEPLOY_REGION\", \"us-east-1\") over os.environ[\"DEPLOY_REGION\"]?",
        "options": [
          "It avoids crashing with KeyError when optional environment variables are unset by supplying a safe default",
          "It automatically writes values back to .bashrc",
          "It encrypts environment variables",
          "It runs faster by skipping OS syscalls"
        ],
        "correctIndex": 0,
        "explanation": ".get(key, default) returns the fallback cleanly when an environment key is missing."
      },
      {
        "id": 3,
        "question": "Why mask credentials (e.g., api_key[:4] + \"****\") before logging configuration in CI/CD pipelines?",
        "options": [
          "To aid debugging which key prefix was loaded without leaking secrets into immutable CI logs",
          "Because Python cannot print strings longer than 8 characters cleanly",
          "To convert strings into ints",
          "To satisfy YAML syntax rules"
        ],
        "correctIndex": 0,
        "explanation": "Printing full secrets to stdout/CI logs creates credential leaks; prefix masking safely aids verification."
      },
      {
        "id": 4,
        "question": "Which Python feature formats variables cleanly inside strings such as f\"Target Port: {next_port}\"?",
        "options": [
          "f-strings (formatted string literals)",
          "tuple casting",
          "raw regex blocks",
          "bit shifting"
        ],
        "correctIndex": 0,
        "explanation": "f-strings evaluate embedded expressions directly inside string literals."
      }
    ]
  },

  "m12-lab02-deterministic-control-flow": {
    "summary": "Build Boolean pre-deployment validation gates enforcing CPU utilization thresholds (< 80.0%) and disk capacity minimums (>= 5.0 GB), and fix a broken Boolean logic bug in rollout_guard.py.",
    "phase1Description": "Inspect /workspace/rollout_guard.py to observe how using \"or\" instead of \"and\" permits unsafe deployments:",
    "guidedCommands": [
      {
        "label": "1. INSPECT FAULTY ROLLOUT GUARD",
        "command": "cat /workspace/rollout_guard.py && python3 /workspace/rollout_guard.py"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Single-Metric CPU Gate (cpu_gate.py)",
        "description": "Write /workspace/cpu_gate.py defining CPU_THRESHOLD = 80.0 and evaluating current_cpu = 85.4 to print [CRITICAL] when threshold exceeded.",
        "hintCommand": "python3 /workspace/cpu_gate.py"
      },
      {
        "title": "Task 2.2 — Multi-Metric Preflight Gate (multi_metric_gate.py)",
        "description": "Write /workspace/multi_metric_gate.py checking cpu_utilization = 45.2 (< 80.0) and disk_free_gb = 12.5 (>= 5.0) using if/elif/else so it prints \"[PASS] All pre-deployment checks succeeded. Proceeding with rollout.\".",
        "hintCommand": "python3 /workspace/multi_metric_gate.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Repair Unsafe OR Logic in rollout_guard.py",
      "description": "Change the condition in /workspace/rollout_guard.py from \"or\" to \"and\" so cpu=92.5 prints \"[ABORT] Unsafe node metrics\".",
      "steps": [
        {
          "label": "Edit condition",
          "detail": "Replace \"or\" with \"and\" in /workspace/rollout_guard.py."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/rollout_guard.py and confirm [ABORT]."
        }
      ],
      "remediationCommand": "sed -i 's/ or / and /' /workspace/rollout_guard.py && python3 /workspace/rollout_guard.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_cpu_gate",
        "name": "cpu_gate.py Triggers [CRITICAL] Above 80%",
        "hint": "Write /workspace/cpu_gate.py evaluating CPU_THRESHOLD = 80.0."
      },
      {
        "id": "checkpoint_2_multi_metric",
        "name": "multi_metric_gate.py Uses Combined if/elif/else",
        "hint": "Use if, elif, and \"and\" boolean conjunction inside /workspace/multi_metric_gate.py."
      },
      {
        "id": "checkpoint_3_pass_branch",
        "name": "multi_metric_gate.py Passes Valid Metrics",
        "hint": "Set disk_free_gb = 12.5 in /workspace/multi_metric_gate.py so [PASS] is printed."
      },
      {
        "id": "checkpoint_4_fix_gate_logic",
        "name": "rollout_guard.py Boolean Bug Fixed",
        "hint": "Change \"or\" to \"and\" in /workspace/rollout_guard.py so CPU 92.5 aborts rollout."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "In a strict safety gate requiring BOTH healthy CPU and sufficient free disk space, which Boolean operator is required?",
        "options": [
          "and",
          "or",
          "not",
          "xor"
        ],
        "correctIndex": 0,
        "explanation": "Logical \"and\" ensures the deployment proceeds only when every invariant is satisfied."
      },
      {
        "id": 2,
        "question": "In an if / elif / else chain, how many branches execute for a given set of inputs?",
        "options": [
          "At most one (the first matching condition)",
          "All matching elif branches",
          "Both if and else",
          "Every branch sequentially"
        ],
        "correctIndex": 0,
        "explanation": "Python evaluates if/elif conditions top-down and executes only the first truthy block."
      },
      {
        "id": 3,
        "question": "What evaluates as truthy vs falsy in a Python Boolean check like if raw_list:?",
        "options": [
          "Empty collections ([], {}, \"\") evaluate False; non-empty collections evaluate True",
          "Empty lists evaluate True",
          "Only strings evaluate True",
          "Numbers always raise TypeError in if statements"
        ],
        "correctIndex": 0,
        "explanation": "Python checks truthiness cleanly via emptiness/zero rules."
      },
      {
        "id": 4,
        "question": "Why define CPU_THRESHOLD = 80.0 in UPPER_SNAKE_CASE at the top of a script?",
        "options": [
          "PEP 8 convention indicating a module-level constant threshold",
          "Python refuses lowercase floats in if blocks",
          "Upper-case constants run twice as fast",
          "It exports the variable to bash automatically"
        ],
        "correctIndex": 0,
        "explanation": "UPPER_SNAKE_CASE signals to engineers that the threshold is an immutable configuration constant."
      }
    ]
  },

  "m12-lab03-structural-aggregation": {
    "summary": "Deduplicate IP inventories with sets, manage host-role lookup dictionaries, navigate nested environment topology structures, and filter outdated server versions with dictionary comprehensions.",
    "phase1Description": "Verify Python 3 interactive capabilities for sets and dictionaries:",
    "guidedCommands": [
      {
        "label": "1. QUICK SET DEDUPLICATION TEST",
        "command": "python3 -c 'raw=[\"10.0.0.1\",\"10.0.0.1\",\"10.0.0.2\"]; print(sorted(set(raw)))'"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Set Deduplication & Dictionary Role Mapping",
        "description": "Create /workspace/dedupe_ips.py deduplicating 6 IPs down to \"Unique servers (4): ...\" and /workspace/hostname_roles.py updating db-prod-01 role to \"replica-db\".",
        "hintCommand": "python3 /workspace/dedupe_ips.py && python3 /workspace/hostname_roles.py"
      },
      {
        "title": "Task 2.2 — Nested Environment Topology",
        "description": "Create /workspace/environment_topology.py modeling staging/production web_tiers, appending \"10.0.1.12\" to production, and printing the updated list.",
        "hintCommand": "python3 /workspace/environment_topology.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Filter Non-Compliant Servers via Dictionary Comprehension",
      "description": "Create /workspace/filter_outdated_servers.py containing fleet_versions {\"web-01\": \"2.6.0\", \"web-02\": \"2.4.1\", \"api-01\": \"2.5.9\", \"db-01\": \"2.6.0\"} and build outdated_fleet where version != \"2.6.0\".",
      "steps": [
        {
          "label": "Write comprehension",
          "detail": "Use {host: ver for host, ver in fleet_versions.items() if ver != \"2.6.0\"}."
        },
        {
          "label": "Verify output",
          "detail": "Run python3 /workspace/filter_outdated_servers.py confirming web-02 and api-01 appear without web-01."
        }
      ],
      "remediationCommand": "python3 /workspace/filter_outdated_servers.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_dedupe_ips",
        "name": "dedupe_ips.py Outputs 4 Unique Servers",
        "hint": "Deduplicate IPs in /workspace/dedupe_ips.py using set()."
      },
      {
        "id": "checkpoint_2_hostname_roles",
        "name": "hostname_roles.py Mutates Role to replica-db",
        "hint": "Update db-prod-01 role to \"replica-db\" in /workspace/hostname_roles.py."
      },
      {
        "id": "checkpoint_3_env_topology",
        "name": "environment_topology.py Appends 10.0.1.12",
        "hint": "Append \"10.0.1.12\" to production web_tiers in /workspace/environment_topology.py."
      },
      {
        "id": "checkpoint_4_filter_outdated",
        "name": "Dictionary Comprehension Filters Outdated Hosts",
        "hint": "Filter versions != \"2.6.0\" in /workspace/filter_outdated_servers.py."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Which Python data structure automatically removes duplicate elements and supports O(1) average membership checks?",
        "options": [
          "set",
          "list",
          "tuple",
          "str"
        ],
        "correctIndex": 0,
        "explanation": "Sets store unique hashable items backed by a hash table."
      },
      {
        "id": 2,
        "question": "How should you safely read key \"db-03\" from dict host_roles when it might not exist?",
        "options": [
          "host_roles.get(\"db-03\", \"unknown\")",
          "host_roles[\"db-03\"]",
          "host_roles.pop()",
          "host_roles.values(0)"
        ],
        "correctIndex": 0,
        "explanation": "dict.get() avoids raising KeyError on missing keys."
      },
      {
        "id": 3,
        "question": "What does {k: v for k, v in d.items() if v != \"2.6.0\"} produce?",
        "options": [
          "A new filtered dictionary containing only entries matching the predicate",
          "A list of strings",
          "In-place deletion on d returning None",
          "A tuple of tuples"
        ],
        "correctIndex": 0,
        "explanation": "Dictionary comprehensions construct a new dict cleanly without mutating the source while iterating."
      },
      {
        "id": 4,
        "question": "Why sort(list(set(raw_ips))) before iterating for deployment diffs?",
        "options": [
          "Because Python sets have unordered/randomized hash ordering across runs, and sorting ensures deterministic order",
          "Sets cannot hold strings without sorting",
          "sorted() converts strings to ints",
          "To compress memory usage by 50%"
        ],
        "correctIndex": 0,
        "explanation": "Sorting gives repeatable deterministic output across pipeline executions."
      }
    ]
  },

  "m12-lab04-iteration-functional-abstraction": {
    "summary": "Automate server fleet loops with def functions, engineer bounded while health-polling loops with MAX_RETRIES, enforce Python type hints (ip: str) -> bool, and break out of a stalled retry worker loop.",
    "phase1Description": "Observe the runaway while-loop failure inside /workspace/retry_worker.py before writing clean bounded loops and functions:",
    "guidedCommands": [
      {
        "label": "1. OBSERVE STALLED WHILE LOOP",
        "command": "cat /workspace/retry_worker.py && (python3 /workspace/retry_worker.py || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Server Provisioning Loop & Bounded Health Polling",
        "description": "Write /workspace/provision_servers.py provisioning 10.0.1.10..10.0.1.12 via provision_server() and /workspace/health_poll.py using MAX_RETRIES = 5 polling until \"Service passed health check\".",
        "hintCommand": "python3 /workspace/provision_servers.py && python3 /workspace/health_poll.py"
      },
      {
        "title": "Task 2.2 — Type-Annotated Provisioner",
        "description": "Write /workspace/provision_typed.py defining def provision(ip: str) -> bool and tracking results: list[bool] to output \"3/3 servers healthy\".",
        "hintCommand": "python3 /workspace/provision_typed.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Repair Missing Counter Increment in retry_worker.py",
      "description": "Add attempt += 1 inside the while loop of /workspace/retry_worker.py so it completes cleanly printing \"Worker completed cleanly\".",
      "steps": [
        {
          "label": "Fix counter",
          "detail": "Add attempt += 1 inside the while loop in /workspace/retry_worker.py."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/retry_worker.py and confirm clean exit."
        }
      ],
      "remediationCommand": "sed -i 's/# BUG: missing attempt += 1/attempt += 1/' /workspace/retry_worker.py && python3 /workspace/retry_worker.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_provision_loop",
        "name": "provision_servers.py Provisions Fleet Loop",
        "hint": "Define provision_server() in /workspace/provision_servers.py and iterate target_ips including 10.0.1.12."
      },
      {
        "id": "checkpoint_2_health_poll",
        "name": "health_poll.py Implements Bounded While Retry",
        "hint": "Write /workspace/health_poll.py polling until \"Service passed health check\"."
      },
      {
        "id": "checkpoint_3_typed_provision",
        "name": "provision_typed.py Uses Type Hints & Reports 3/3 Healthy",
        "hint": "Write /workspace/provision_typed.py with (ip: str) -> bool printing 3/3 servers healthy."
      },
      {
        "id": "checkpoint_4_fix_infinite_loop",
        "name": "retry_worker.py Infinite Loop Remediated",
        "hint": "Add attempt += 1 inside the loop in /workspace/retry_worker.py."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why must every infrastructure polling while loop maintain a MAX_RETRIES or timeout exit condition?",
        "options": [
          "So permanently unhealthy downstream dependencies fail fast instead of hanging CI/CD runners indefinitely",
          "Because Python forbids while loops longer than 3 iterations",
          "To skip type annotations",
          "To parallelize iterations onto multiple CPUs automatically"
        ],
        "correctIndex": 0,
        "explanation": "Bounded retries enforce timeouts and deterministic failure handling in automation scripts."
      },
      {
        "id": 2,
        "question": "What does -> bool signify in def provision(ip: str) -> bool:?",
        "options": [
          "A Python type annotation documenting that the function expects a str and returns a bool",
          "A runtime firewall conversion rule",
          "A decorator restricting root execution",
          "An automatic try/except wrapper"
        ],
        "correctIndex": 0,
        "explanation": "Type hints improve static readability and enable mypy/IDE validation without changing runtime behavior."
      },
      {
        "id": 3,
        "question": "When should a DevOps script prefer a for loop over a while loop?",
        "options": [
          "When iterating over a known collection of hosts, files, or pods",
          "Only when polling indefinitely",
          "Never inside functions",
          "Only for integers"
        ],
        "correctIndex": 0,
        "explanation": "for loops naturally bound iteration over finite collections cleanly."
      },
      {
        "id": 4,
        "question": "Which statement immediately exits the enclosing loop upon a successful health probe?",
        "options": [
          "break",
          "continue",
          "pass",
          "yield"
        ],
        "correctIndex": 0,
        "explanation": "break terminates the innermost loop immediately."
      }
    ]
  },

  "m12-lab05-anticipating-catastrophe": {
    "summary": "Defend automation scripts against malformed inputs using try/except/finally, author domain-specific DeploymentError custom exceptions with strict guard clauses, and fix an unhandled KeyError crash.",
    "phase1Description": "Run the unhandled KeyError crash in /workspace/config_loader.py to inspect its Python stack trace:",
    "guidedCommands": [
      {
        "label": "1. OBSERVE UNHANDLED KEYERROR CRASH",
        "command": "cat /workspace/config_loader.py && (python3 /workspace/config_loader.py || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Resilient Numeric Casting with Finally Cleanup",
        "description": "Write /workspace/resilient_capacity_input.py attempting int(\"five\"), catching ValueError to print \"Invalid numeric input\", and running a finally cleanup block.",
        "hintCommand": "python3 /workspace/resilient_capacity_input.py"
      },
      {
        "title": "Task 2.2 — Custom DeploymentError & Guard Clauses",
        "description": "Write /workspace/deployment_error.py defining class DeploymentError(Exception) and request_capacity(replicas: int) -> int enforcing 1 <= replicas <= 10, handling replicas=25 gracefully (\"Deployment aborted\") and succeeding on replicas=4.",
        "hintCommand": "python3 /workspace/deployment_error.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Wrap Unhandled KeyError in config_loader.py",
      "description": "Update /workspace/config_loader.py to catch KeyError (or provide default 1) cleanly and output \"replicas=1\".",
      "steps": [
        {
          "label": "Handle KeyError",
          "detail": "Wrap cfg[\"replicas\"] in try/except KeyError assigning replicas = 1."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/config_loader.py and confirm replicas=1."
        }
      ],
      "remediationCommand": "python3 /workspace/config_loader.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_resilient_cast",
        "name": "resilient_capacity_input.py Handles ValueError Safely",
        "hint": "Catch ValueError in /workspace/resilient_capacity_input.py and print Invalid numeric input."
      },
      {
        "id": "checkpoint_2_custom_exception",
        "name": "DeploymentError Custom Exception Defined",
        "hint": "Define class DeploymentError(Exception) and def request_capacity in /workspace/deployment_error.py."
      },
      {
        "id": "checkpoint_3_guard_clauses",
        "name": "Guard Clauses Block Excess & Allow Valid Capacity",
        "hint": "Verify deployment_error.py prints Deployment aborted for 25 and handles 4 replicas cleanly."
      },
      {
        "id": "checkpoint_4_fix_unhandled_crash",
        "name": "config_loader.py Handles Missing Key Cleanly",
        "hint": "Handle missing replicas key in /workspace/config_loader.py so it prints replicas=1."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why avoid bare except: clauses in production Python scripts?",
        "options": [
          "Bare except catches SystemExit and KeyboardInterrupt too, masking bugs and blocking clean Ctrl+C exits",
          "Bare except causes SyntaxError in Python 3",
          "Bare except disables finally blocks",
          "Bare except converts exceptions to JSON automatically"
        ],
        "correctIndex": 0,
        "explanation": "Always catch specific exception classes (e.g., ValueError, KeyError, DeploymentError) so bugs surface accurately."
      },
      {
        "id": 2,
        "question": "When does a finally: block run relative to try and except?",
        "options": [
          "Always — whether try succeeded, raised an expected exception, or returned early",
          "Only when an exception occurred",
          "Only if no except block matched",
          "Never after a return statement"
        ],
        "correctIndex": 0,
        "explanation": "finally guarantees resource cleanup (locks, temp files, handles) on every execution path."
      },
      {
        "id": 3,
        "question": "How do you define a custom semantic domain exception in Python?",
        "options": [
          "class DeploymentError(Exception): pass",
          "def DeploymentError(): raise",
          "exception DeploymentError {}",
          "import DeploymentError from sys"
        ],
        "correctIndex": 0,
        "explanation": "Custom exceptions subclass built-in Exception (never BaseException directly)."
      },
      {
        "id": 4,
        "question": "What is the purpose of guard clauses (early raise/return on invalid arguments)?",
        "options": [
          "Fail fast with clear context before mutating external infrastructure state",
          "To skip unit tests",
          "To retry failed HTTP calls forever",
          "To hide errors silently"
        ],
        "correctIndex": 0,
        "explanation": "Guard clauses validate preconditions upfront and keep nesting shallow."
      }
    ]
  },

  "m12-lab06-os-interface": {
    "summary": "Provision release trees idempotently with os.makedirs(..., exist_ok=True), execute shell commands safely via subprocess.run without shell=True, append audit logs via context managers, and repair a broken audit runner.",
    "phase1Description": "Inspect /workspace/audit_runner.py to observe how omitting capture_output=True leaves res.stdout as None:",
    "guidedCommands": [
      {
        "label": "1. OBSERVE SUBPROCESS CAPTURE BUG",
        "command": "cat /workspace/audit_runner.py && (python3 /workspace/audit_runner.py || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Idempotent Release Directories & Safe Subprocess df",
        "description": "Write /workspace/create_deploy_dirs.py creating /opt/devopsmentor/releases/v1.4.2 idempotently (exist_ok=True) and /workspace/disk_usage_check.py capturing subprocess.run([\"df\", \"-h\"], capture_output=True, text=True, check=True).",
        "hintCommand": "python3 /workspace/create_deploy_dirs.py && python3 /workspace/disk_usage_check.py"
      },
      {
        "title": "Task 2.2 — Context-Manager Audit Logging",
        "description": "Write /workspace/log_disk_usage.py running df -h and appending \"--- DISK USAGE SNAPSHOT ---\" plus stdout into /workspace/disk_usage.log using with open(..., \"a\").",
        "hintCommand": "python3 /workspace/log_disk_usage.py && cat /workspace/disk_usage.log"
      }
    ],
    "breakFix": {
      "title": "Incident: Repair stdout Capture in audit_runner.py",
      "description": "Add capture_output=True, text=True, check=True in /workspace/audit_runner.py so res.stdout.strip() prints Captured:AUDIT_OK.",
      "steps": [
        {
          "label": "Update subprocess.run",
          "detail": "Pass capture_output=True, text=True, check=True to subprocess.run."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/audit_runner.py and confirm Captured:AUDIT_OK."
        }
      ],
      "remediationCommand": "python3 /workspace/audit_runner.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_makedirs",
        "name": "create_deploy_dirs.py Creates Release Path Idempotently",
        "hint": "Write /workspace/create_deploy_dirs.py calling os.makedirs(\"/opt/devopsmentor/releases/v1.4.2\", exist_ok=True)."
      },
      {
        "id": "checkpoint_2_subprocess_df",
        "name": "disk_usage_check.py Captures df -h Cleanly",
        "hint": "Run subprocess.run([\"df\", \"-h\"], capture_output=True, text=True, check=True) in /workspace/disk_usage_check.py."
      },
      {
        "id": "checkpoint_3_log_context_mgr",
        "name": "log_disk_usage.py Appends Snapshot via Context Manager",
        "hint": "Write /workspace/log_disk_usage.py saving DISK USAGE SNAPSHOT into /workspace/disk_usage.log."
      },
      {
        "id": "checkpoint_4_cleanup_broken_script",
        "name": "audit_runner.py Fixed Cleanly",
        "hint": "Add capture_output=True, text=True to subprocess.run inside /workspace/audit_runner.py."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why pass argument lists like [\"df\", \"-h\"] to subprocess.run() instead of shell=True with formatted strings?",
        "options": [
          "Argument arrays bypass shell parsing, completely eliminating command-injection vulnerabilities",
          "shell=True is deprecated in Linux kernels",
          "Lists automatically run commands as root",
          "shell=True cannot return stdout"
        ],
        "correctIndex": 0,
        "explanation": "Passing argv lists directly to execve avoids shell metacharacter injection bugs."
      },
      {
        "id": 2,
        "question": "What does check=True in subprocess.run(..., check=True) enforce?",
        "options": [
          "Raises CalledProcessError automatically if the OS command exits with a non-zero exit code",
          "Prints stdout twice",
          "Creates missing directories automatically",
          "Runs syntax check without executing the binary"
        ],
        "correctIndex": 0,
        "explanation": "check=True prevents silent failures when subprocesses exit non-zero."
      },
      {
        "id": 3,
        "question": "What is the primary benefit of with open(\"file.log\", \"a\") as f:?",
        "options": [
          "Guarantees Python flushes and closes the OS file descriptor automatically when leaving the block, even on exceptions",
          "Automatically uploads logs to S3",
          "Converts binary buffers into JSON",
          "Applies chmod 600 automatically"
        ],
        "correctIndex": 0,
        "explanation": "Context managers implement __enter__/__exit__ to prevent leaked file descriptors."
      },
      {
        "id": 4,
        "question": "Which flag makes os.makedirs() safe to re-run across repeated CI/CD runs without crashing?",
        "options": [
          "exist_ok=True",
          "force=True",
          "recursive=True",
          "mkdir_p=1"
        ],
        "correctIndex": 0,
        "explanation": "exist_ok=True makes nested directory creation idempotent."
      }
    ]
  },

  "m12-lab07-data-serialization-json": {
    "summary": "Deserialize structured JSON configuration strings with json.loads(), mutate and pretty-print JSON objects with json.dumps(indent=4), perform file-backed config.json roundtrips, and repair malformed JSON.",
    "phase1Description": "Inspect /workspace/config.json and test python3 -m json.tool against /workspace/broken_payload.json:",
    "guidedCommands": [
      {
        "label": "1. INSPECT STAGED JSON FILES & PARSE ERROR",
        "command": "cat /workspace/config.json && (python3 -m json.tool /workspace/broken_payload.json || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — String Deserialization & Pretty Serialization",
        "description": "Write /workspace/ingest_config.py using json.loads() to print \"Replicas: 2\", and /workspace/mutate_and_serialize.py setting replicas=5, deployed_by=\"devopsmentor-ci\" via json.dumps(indent=4).",
        "hintCommand": "python3 /workspace/ingest_config.py && python3 /workspace/mutate_and_serialize.py"
      },
      {
        "title": "Task 2.2 — Stateful config.json Roundtrip Increment",
        "description": "Write /workspace/config_file_roundtrip.py loading /workspace/config.json with json.load(), setting replicas = 3 (incrementing +1), and persisting with json.dump(indent=4).",
        "hintCommand": "python3 /workspace/config_file_roundtrip.py && cat /workspace/config.json"
      }
    ],
    "breakFix": {
      "title": "Incident: Repair Syntax Errors in broken_payload.json",
      "description": "Fix the single quotes and trailing comma in /workspace/broken_payload.json so python3 -m json.tool /workspace/broken_payload.json validates with exit code 0.",
      "steps": [
        {
          "label": "Fix quotes & trailing comma",
          "detail": "Use strict double quotes and remove trailing comma after 3."
        },
        {
          "label": "Validate",
          "detail": "Run python3 -m json.tool /workspace/broken_payload.json."
        }
      ],
      "remediationCommand": "python3 -m json.tool /workspace/broken_payload.json"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_json_loads",
        "name": "ingest_config.py Parses JSON String",
        "hint": "Write /workspace/ingest_config.py using json.loads() and printing Replicas: 2."
      },
      {
        "id": "checkpoint_2_json_dumps",
        "name": "mutate_and_serialize.py Outputs Pretty JSON",
        "hint": "Include \"deployed_by\": \"devopsmentor-ci\" via json.dumps(..., indent=4)."
      },
      {
        "id": "checkpoint_3_file_roundtrip",
        "name": "config_file_roundtrip.py Increments Replicas to 3",
        "hint": "Run /workspace/config_file_roundtrip.py to update /workspace/config.json replicas to 3."
      },
      {
        "id": "checkpoint_4_fix_corrupt_json",
        "name": "broken_payload.json Passes Strict JSON Validation",
        "hint": "Fix single quotes & trailing comma in /workspace/broken_payload.json."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What is the difference between json.loads() and json.load()?",
        "options": [
          "loads() parses a JSON-formatted string (load string); load() reads from an open file-like stream",
          "load() works on strings; loads() writes files",
          "loads() validates XML schemas too",
          "They are identical aliases"
        ],
        "correctIndex": 0,
        "explanation": "The \"s\" suffix in loads/dumps always denotes Python string I/O rather than file streams."
      },
      {
        "id": 2,
        "question": "Which two formatting issues most frequently break hand-edited JSON files compared to Python dicts?",
        "options": [
          "Single-quoted keys/strings and trailing commas after the final element",
          "Double quotes and indentation",
          "Boolean true/false lowercase literals",
          "Nested dictionaries"
        ],
        "correctIndex": 0,
        "explanation": "RFC 8259 JSON strictly mandates double quotes and disallows trailing commas."
      },
      {
        "id": 3,
        "question": "Why pass indent=4 when serializing configuration files with json.dump()?",
        "options": [
          "Generates clean multi-line diffs in Git instead of a single minified line",
          "Makes the JSON file execute directly as Python",
          "Compresses binary size by 4x",
          "Adds comments cleanly"
        ],
        "correctIndex": 0,
        "explanation": "Pretty-printing formatted JSON keeps configuration commits readable during code review."
      },
      {
        "id": 4,
        "question": "Which standard library CLI command quickly formats and syntax-checks a JSON file?",
        "options": [
          "python3 -m json.tool <file.json>",
          "python3 -c json <file.json>",
          "pip check <file.json>",
          "cat <file.json> | sort"
        ],
        "correctIndex": 0,
        "explanation": "python3 -m json.tool validates strict JSON grammar cleanly."
      }
    ]
  },

  "m12-lab08-architectural-modularity": {
    "summary": "Refactor infrastructure utilities into reusable network_utils.py modules imported cleanly by main.py, verify external PyPI package resolution with requests, and resolve an ImportError in service_runner.py.",
    "phase1Description": "Observe how /workspace/service_runner.py fails with ModuleNotFoundError until /workspace/network_utils.py exists:",
    "guidedCommands": [
      {
        "label": "1. CHECK MISSING MODULE IMPORT",
        "command": "cat /workspace/service_runner.py && (python3 /workspace/service_runner.py || true)"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Author Reusable network_utils Module & main Entrypoint",
        "description": "Create /workspace/network_utils.py defining build_connection_string(host: str, port: int, database: str) -> str returning f\"postgresql://{host}:{port}/{database}\", and /workspace/main.py printing postgresql://db-prod-01.internal:5432/devopsmentor_prod.",
        "hintCommand": "python3 /workspace/main.py"
      },
      {
        "title": "Task 2.2 — Verify External Package Environment (requests)",
        "description": "Write /workspace/verify_requests_install.py importing requests and printing \"Requests library version: {requests.__version__}\".",
        "hintCommand": "python3 /workspace/verify_requests_install.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Verify service_runner.py Resolves Shared Utility Cleanly",
      "description": "After implementing /workspace/network_utils.py, confirm /workspace/service_runner.py imports build_connection_string cleanly and outputs RUNNER_OK.",
      "steps": [
        {
          "label": "Execute runner",
          "detail": "Run python3 /workspace/service_runner.py and verify RUNNER_OK appears."
        }
      ],
      "remediationCommand": "python3 /workspace/service_runner.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_network_utils",
        "name": "network_utils.py Module Export Defined",
        "hint": "Create /workspace/network_utils.py with def build_connection_string(host, port, database)."
      },
      {
        "id": "checkpoint_2_main_import",
        "name": "main.py Imports & Builds Connection URI",
        "hint": "Create /workspace/main.py outputting postgresql://db-prod-01.internal:5432/devopsmentor_prod."
      },
      {
        "id": "checkpoint_3_requests_verify",
        "name": "Requests Library Version Verified",
        "hint": "Write /workspace/verify_requests_install.py printing Requests library version."
      },
      {
        "id": "checkpoint_4_fix_circular_import",
        "name": "service_runner.py Imports & Runs Cleanly",
        "hint": "Run python3 /workspace/service_runner.py after network_utils.py exists."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why put executable driver code behind if __name__ == \"__main__\": in reusable Python modules?",
        "options": [
          "So importing the module exposes its helper functions without accidentally running script side effects during import",
          "Python refuses to define functions outside main blocks",
          "It compiles bytecode automatically",
          "It hides private variables from dir()"
        ],
        "correctIndex": 0,
        "explanation": "When imported, __name__ equals the module name, whereas direct CLI execution sets __name__ == \"__main__\"."
      },
      {
        "id": 2,
        "question": "Why isolate per-project Python dependencies inside virtual environments (python3 -m venv .venv)?",
        "options": [
          "To prevent library version conflicts between projects and keep OS system packages untouched",
          "Virtual environments accelerate CPU clock speeds",
          "OS packages cannot run Flask",
          "venv skips HTTPS TLS verification"
        ],
        "correctIndex": 0,
        "explanation": "Virtual environments isolate site-packages trees per project cleanly."
      },
      {
        "id": 3,
        "question": "Which file pins exact installed PyPI versions cleanly for deterministic CI builds?",
        "options": [
          "requirements.txt (pip freeze > requirements.txt)",
          "package.json",
          "Dockerfile.env",
          "venv.log"
        ],
        "correctIndex": 0,
        "explanation": "requirements.txt lists exact pinned dependency versions installed via pip install -r requirements.txt."
      },
      {
        "id": 4,
        "question": "Where does Python search first when executing import network_utils inside /workspace/main.py?",
        "options": [
          "The directory containing the entry script (/workspace), followed by PYTHONPATH and site-packages",
          "/usr/bin",
          "/etc/python",
          "PyPI over HTTPS directly"
        ],
        "correctIndex": 0,
        "explanation": "sys.path[0] starts at the executing script directory."
      }
    ]
  },

  "m12-lab09-object-oriented-infrastructure": {
    "summary": "Model fleet compute resources using Python classes, encapsulate boot/shutdown state transitions, subclass DatabaseServer(Server) with super().__init__ and backup_data(), and implement __str__.",
    "phase1Description": "Review object instantiation semantics before implementing your Server hierarchy under /workspace:",
    "guidedCommands": [
      {
        "label": "1. INSPECT WORKSPACE DIRECTORY",
        "command": "ls -la /workspace && python3 --version"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Server Base Model & Lifecycle Methods",
        "description": "Create /workspace/server.py defining Server(hostname, ip_address, role) with default status=\"offline\" (printing web-prod-01), and /workspace/server_lifecycle.py with boot() & shutdown() transitions.",
        "hintCommand": "python3 /workspace/server.py && python3 /workspace/server_lifecycle.py"
      },
      {
        "title": "Task 2.2 — Specialized DatabaseServer Subclass",
        "description": "Create /workspace/database_server.py implementing DatabaseServer(Server) calling super().__init__(...) and adding backup_data() printing \"Backup completed\".",
        "hintCommand": "python3 /workspace/database_server.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Human-Readable __str__ Telemetry Formatting",
      "description": "Create /workspace/server_str.py overriding __str__(self) so print(web) renders \"<Server hostname=web-prod-01 ip=10.0.1.10 role=frontend status=online>\".",
      "steps": [
        {
          "label": "Implement __str__",
          "detail": "Return formatted <Server hostname=... ip=... role=... status=...> string."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/server_str.py."
        }
      ],
      "remediationCommand": "python3 /workspace/server_str.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_server_class",
        "name": "server.py Defines Server Class",
        "hint": "Write /workspace/server.py instantiating web-prod-01."
      },
      {
        "id": "checkpoint_2_lifecycle_methods",
        "name": "server_lifecycle.py Transitions Boot & Shutdown",
        "hint": "Implement boot() and shutdown() methods in /workspace/server_lifecycle.py."
      },
      {
        "id": "checkpoint_3_inheritance_db",
        "name": "DatabaseServer Subclass Runs backup_data()",
        "hint": "Subclass Server with super().__init__ in /workspace/database_server.py."
      },
      {
        "id": "checkpoint_4_dunder_str",
        "name": "server_str.py Implements Clean __str__",
        "hint": "Return <Server hostname=web-prod-01 ...> from __str__ in /workspace/server_str.py."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "What does self represent inside a Python class instance method?",
        "options": [
          "The specific object instance invoking the method, giving access to its bound attributes",
          "A global singleton shared by all classes",
          "The parent base class exclusively",
          "An automatic dictionary converter"
        ],
        "correctIndex": 0,
        "explanation": "Python passes the bound instance explicitly as the first parameter self."
      },
      {
        "id": 2,
        "question": "Why call super().__init__(...) in DatabaseServer.__init__?",
        "options": [
          "To run Server base initialization cleanly so inherited attributes like hostname, ip_address, and status are properly initialized",
          "Because Python forbids child attributes otherwise",
          "To destroy the base class memory",
          "To invoke __str__ automatically"
        ],
        "correctIndex": 0,
        "explanation": "super() delegates parent constructor initialization cleanly without duplicating setup code."
      },
      {
        "id": 3,
        "question": "Which dunder method governs what print(obj) and str(obj) display cleanly for logs?",
        "options": [
          "__str__",
          "__init__",
          "__call__",
          "__del__"
        ],
        "correctIndex": 0,
        "explanation": "__str__ defines readable string representation used by print() and f-strings."
      },
      {
        "id": 4,
        "question": "Why encapsulate boot() and shutdown() on Server instead of mutating attributes arbitrarily from outside?",
        "options": [
          "Methods co-locate state validation and side-effect logging alongside the state invariants",
          "Python forbids external attribute assignment on dicts",
          "Encapsulation doubles RAM speed",
          "To avoid importing os"
        ],
        "correctIndex": 0,
        "explanation": "Behavioral methods preserve domain invariants during state transitions."
      }
    ]
  },

  "m12-lab10-advanced-execution-control": {
    "summary": "Construct higher-order Python function decorators for audit logging, high-precision @timed performance telemetry with functools.wraps, parameterized @retry(max_attempts=3) fault tolerance, and fix a value-swallowing decorator.",
    "phase1Description": "Run /workspace/broken_decorator.py to observe how omitting \"return\" in a decorator wrapper swallows return values (printing None):",
    "guidedCommands": [
      {
        "label": "1. OBSERVE DECORATOR RETURN-VALUE BUG",
        "command": "cat /workspace/broken_decorator.py && python3 /workspace/broken_decorator.py"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Logging & Precision Timer Decorators",
        "description": "Write /workspace/basic_wrapper.py implementing @logging_wrapper (\"Starting execution\"), and /workspace/timer_decorator.py implementing @timed with @functools.wraps and time.perf_counter() (\"Duration:\").",
        "hintCommand": "python3 /workspace/basic_wrapper.py && python3 /workspace/timer_decorator.py"
      },
      {
        "title": "Task 2.2 — Parameterized Fault-Tolerant @retry Decorator",
        "description": "Write /workspace/retry_decorator.py defining NetworkError(Exception) and @retry(max_attempts=3, delay_seconds=0.05) failing twice then returning \"Pipeline succeeded\".",
        "hintCommand": "python3 /workspace/retry_decorator.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Preserve Return Value in broken_decorator.py",
      "description": "Fix wrapper in /workspace/broken_decorator.py by adding return before func(*args, **kwargs) so get_version() outputs DEPLOY_VERSION=2.6.0.",
      "steps": [
        {
          "label": "Return inner call",
          "detail": "Update func(*args, **kwargs) to return func(*args, **kwargs)."
        },
        {
          "label": "Verify",
          "detail": "Run python3 /workspace/broken_decorator.py."
        }
      ],
      "remediationCommand": "sed -i 's/^        func(\\*args, \\*\\*kwargs)/        return func(*args, **kwargs)/' /workspace/broken_decorator.py && python3 /workspace/broken_decorator.py"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_basic_wrapper",
        "name": "basic_wrapper.py Executes Logged Wrapper",
        "hint": "Write /workspace/basic_wrapper.py with @logging_wrapper printing Starting execution."
      },
      {
        "id": "checkpoint_2_timer_decorator",
        "name": "timer_decorator.py Preserves Metadata & Prints Duration",
        "hint": "Write /workspace/timer_decorator.py using functools.wraps and time.perf_counter."
      },
      {
        "id": "checkpoint_3_retry_decorator",
        "name": "retry_decorator.py Recovers Transient Failures",
        "hint": "Implement @retry(max_attempts=3) in /workspace/retry_decorator.py printing Pipeline succeeded."
      },
      {
        "id": "checkpoint_4_fix_wrapper_return",
        "name": "broken_decorator.py Return Value Preserved",
        "hint": "Add return before func(*args, **kwargs) in /workspace/broken_decorator.py."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why decorate inner wrapper functions with @functools.wraps(func)?",
        "options": [
          "It preserves the wrapped function __name__, __doc__, and introspection signature",
          "It caches return values on disk",
          "It speeds up time.perf_counter()",
          "It enables async execution"
        ],
        "correctIndex": 0,
        "explanation": "Without @functools.wraps, help(fn) and fn.__name__ report \"wrapper\" instead of the original function."
      },
      {
        "id": 2,
        "question": "Why must a parameterized decorator like @retry(max_attempts=3) have 3 nested functions?",
        "options": [
          "Outer accepts decorator parameters, middle receives func, inner executes *args/**kwargs at call time",
          "Python forbids 2-level closures",
          "To handle syntax errors cleanly",
          "Because decorators run during exit only"
        ],
        "correctIndex": 0,
        "explanation": "@retry(3) evaluates first to return the actual decorator(func) -> wrapper."
      },
      {
        "id": 3,
        "question": "Why use time.perf_counter() rather than time.time() for execution duration benchmarking?",
        "options": [
          "perf_counter() provides monotonic high-resolution elapsed timing immune to NTP/wall-clock jumps",
          "time.time() returns strings",
          "perf_counter() measures CPU temperature",
          "time.time() only works on Windows"
        ],
        "correctIndex": 0,
        "explanation": "Monotonic clocks prevent negative or skewed intervals if OS system time adjusts mid-run."
      },
      {
        "id": 4,
        "question": "What happens if a wrapper invokes func(*args, **kwargs) without return?",
        "options": [
          "Callers always receive None even when the decorated function returns a value",
          "Python automatically returns the last expression",
          "The function runs twice",
          "A SyntaxError is thrown"
        ],
        "correctIndex": 0,
        "explanation": "Decorators must explicitly return the underlying call result to stay transparent."
      }
    ]
  },

  "m12-lab11-remote-api-gateway": {
    "summary": "Consume REST endpoints over HTTPS with Python requests, decode JSON API status responses, trigger CI/CD deployments via authenticated POST payloads, enforce strict HTTPError handling with raise_for_status(), and persist audit telemetry.",
    "phase1Description": "Verify requests is available and inspect GET https://api.devopsmentor.io/v1/status directly from Python:",
    "guidedCommands": [
      {
        "label": "1. PROBE GATEWAY STATUS ENDPOINT",
        "command": "python3 -c 'import requests; r=requests.get(\"https://api.devopsmentor.io/v1/status\"); print(r.status_code, r.json())'"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Query Status & Trigger Pipeline (GET & POST)",
        "description": "Write /workspace/parse_status.py (GET https://api.devopsmentor.io/v1/status printing \"operational\") and /workspace/trigger_pipeline.py (POST https://api.devopsmentor.io/v1/pipelines/trigger with Bearer header and JSON payload printing run_884201f).",
        "hintCommand": "python3 /workspace/parse_status.py && python3 /workspace/trigger_pipeline.py"
      },
      {
        "title": "Task 2.2 — Strict HTTP Error Guard",
        "description": "Write /workspace/safe_pipeline_check.py querying https://api.devopsmentor.io/v1/pipelines/nonexistent with response.raise_for_status() inside try/except requests.exceptions.HTTPError printing status code 404.",
        "hintCommand": "python3 /workspace/safe_pipeline_check.py"
      }
    ],
    "breakFix": {
      "title": "Incident: Export Verified API Audit Snapshot",
      "description": "Combine live GET status and POST trigger outputs into /workspace/api_gateway_audit.json containing run_884201f and operational status.",
      "steps": [
        {
          "label": "Save audit JSON",
          "detail": "Write the gateway response object to /workspace/api_gateway_audit.json."
        }
      ],
      "remediationCommand": "python3 -c 'import json, requests; st=requests.get(\"https://api.devopsmentor.io/v1/status\").json(); tr=requests.post(\"https://api.devopsmentor.io/v1/pipelines/trigger\", json={\"pipeline_id\":\"pip_99281a\"}).json(); json.dump({\"status\": st, \"trigger\": tr}, open(\"/workspace/api_gateway_audit.json\",\"w\"), indent=2)'"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_get_status",
        "name": "parse_status.py Parses Remote Gateway Health",
        "hint": "Write /workspace/parse_status.py fetching https://api.devopsmentor.io/v1/status."
      },
      {
        "id": "checkpoint_2_post_trigger",
        "name": "trigger_pipeline.py Receives Run ID via POST",
        "hint": "Send authenticated POST in /workspace/trigger_pipeline.py returning run_884201f."
      },
      {
        "id": "checkpoint_3_raise_for_status",
        "name": "safe_pipeline_check.py Enforces raise_for_status()",
        "hint": "Catch requests.exceptions.HTTPError on /v1/pipelines/nonexistent in /workspace/safe_pipeline_check.py."
      },
      {
        "id": "checkpoint_4_save_api_audit",
        "name": "API Audit Captured in /workspace/api_gateway_audit.json",
        "hint": "Save API telemetry containing run_884201f into /workspace/api_gateway_audit.json."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Does requests.get() raise an exception automatically when the server returns HTTP 404 or 500?",
        "options": [
          "No; you must call response.raise_for_status() to raise HTTPError on 4xx/5xx responses",
          "Yes; all non-200 status codes automatically raise IOError",
          "Only for POST requests",
          "Only when headers are omitted"
        ],
        "correctIndex": 0,
        "explanation": "Requests considers a received HTTP response successful at transport level; raise_for_status() enforces HTTP status assertions."
      },
      {
        "id": 2,
        "question": "Which requests parameter automatically serializes a Python dict and sets Content-Type: application/json?",
        "options": [
          "json=payload",
          "params=payload",
          "files=payload",
          "text=payload"
        ],
        "correctIndex": 0,
        "explanation": "Passing json=dict serializes JSON cleanly and populates the appropriate Content-Type header."
      },
      {
        "id": 3,
        "question": "How do you pass a Bearer API token according to RFC 6750 HTTP authorization headers?",
        "options": [
          "headers={\"Authorization\": f\"Bearer {token}\"}",
          "headers={\"Token\": token}",
          "url=\"?password=\" + token",
          "cookies={\"ssh\": token}"
        ],
        "correctIndex": 0,
        "explanation": "Bearer authentication uses the Authorization: Bearer <token> header."
      },
      {
        "id": 4,
        "question": "Which method decodes the HTTP response body directly from JSON text into native Python dicts/lists?",
        "options": [
          "response.json()",
          "response.text()",
          "json.dump(response)",
          "response.headers()"
        ],
        "correctIndex": 0,
        "explanation": "response.json() parses the JSON payload body cleanly."
      }
    ]
  },

  "m12-lab12-infrastructure-as-a-service": {
    "summary": "Build a RESTful DevOps webhook microservice in Python with Flask exposing GET /health and POST /deploy JSON handlers, repair a broken route stub, launch it on port 5000, and test webhook delivery.",
    "phase1Description": "Verify Flask is installed and inspect the broken /workspace/app.py webhook draft:",
    "guidedCommands": [
      {
        "label": "1. INSPECT FLASK VERSION & BROKEN APP DRAFT",
        "command": "python3 -c \"import flask; print(flask.__version__)\" && cat /workspace/app.py"
      }
    ],
    "unguidedTasks": [
      {
        "title": "Task 2.1 — Verify Flask & Implement GET /health + POST /deploy",
        "description": "Write /workspace/verify_flask_install.py printing Flask version and fix /workspace/app.py so GET /health returns {\"status\":\"ok\",\"service\":\"devopsmentor-webhook\"} and POST /deploy reads request.get_json() returning HTTP 201 {\"received\":True,\"target\":target}.",
        "hintCommand": "python3 /workspace/verify_flask_install.py"
      },
      {
        "title": "Task 2.2 — Launch Flask Webhook Service in Background",
        "description": "Start python3 /workspace/app.py in the background binding 0.0.0.0:5000 and verify curl -s http://127.0.0.1:5000/health.",
        "hintCommand": "nohup python3 /workspace/app.py >/var/log/flask-webhook.log 2>&1 & sleep 1 && curl -s http://127.0.0.1:5000/health"
      }
    ],
    "breakFix": {
      "title": "Incident: Test Authenticated Deployment Webhook POST Delivery",
      "description": "Send a POST JSON payload {\"target\":\"production\",\"version\":\"2.6.0\"} to http://127.0.0.1:5000/deploy and capture the JSON response into /workspace/webhook_response.json.",
      "steps": [
        {
          "label": "POST JSON webhook",
          "detail": "Run curl -s -X POST -H \"Content-Type: application/json\" -d '{\"target\":\"production\",\"version\":\"2.6.0\"}' http://127.0.0.1:5000/deploy > /workspace/webhook_response.json."
        }
      ],
      "remediationCommand": "curl -s -X POST -H \"Content-Type: application/json\" -d '{\"target\":\"production\",\"version\":\"2.6.0\"}' http://127.0.0.1:5000/deploy > /workspace/webhook_response.json && cat /workspace/webhook_response.json"
    },
    "checkpoints": [
      {
        "id": "checkpoint_1_flask_verify",
        "name": "verify_flask_install.py Confirms Flask Runtime",
        "hint": "Write /workspace/verify_flask_install.py printing Flask version."
      },
      {
        "id": "checkpoint_2_flask_app_code",
        "name": "Flask /health & /deploy Routes Authored",
        "hint": "Implement GET /health and POST /deploy inside /workspace/app.py."
      },
      {
        "id": "checkpoint_3_flask_daemon_up",
        "name": "Webhook Service Healthy on Port 5000",
        "hint": "Launch python3 /workspace/app.py on port 5000 and verify GET /health returns devopsmentor-webhook."
      },
      {
        "id": "checkpoint_4_webhook_post_test",
        "name": "POST /deploy Webhook Response Saved",
        "hint": "POST {\"target\":\"production\"} to http://127.0.0.1:5000/deploy > /workspace/webhook_response.json."
      }
    ],
    "quiz": [
      {
        "id": 1,
        "question": "Why must containerized Flask web services bind to host=\"0.0.0.0\" instead of \"127.0.0.1\"?",
        "options": [
          "127.0.0.1 only accepts loopback inside the container namespace; 0.0.0.0 accepts traffic bridged from host or Kubernetes Services",
          "127.0.0.1 is invalid in Python 3",
          "0.0.0.0 enables HTTPS encryption automatically",
          "127.0.0.1 disables POST routes"
        ],
        "correctIndex": 0,
        "explanation": "Binding 0.0.0.0 exposes the socket across container veth interfaces so port forwarding and Services can reach it."
      },
      {
        "id": 2,
        "question": "How does Flask parse an incoming JSON request body into a Python dictionary?",
        "options": [
          "request.get_json()",
          "flask.loads()",
          "jsonify(request)",
          "os.environ.get_json()"
        ],
        "correctIndex": 0,
        "explanation": "request.get_json() deserializes JSON payloads cleanly inside Flask view handlers."
      },
      {
        "id": 3,
        "question": "What HTTP status code convention signals that an asynchronous deployment job or webhook trigger succeeded in creating work?",
        "options": [
          "201 Created (or 202 Accepted)",
          "404 Not Found",
          "301 Moved Permanently",
          "503 Service Unavailable"
        ],
        "correctIndex": 0,
        "explanation": "201/202 communicates creation/acceptance cleanly to webhook callers."
      },
      {
        "id": 4,
        "question": "Why expose a dedicated lightweight GET /health endpoint on DevOps microservices?",
        "options": [
          "So container orchestrators (Kubernetes readiness/liveness probes) and load balancers can verify service health automatically",
          "To store database backups in HTTP headers",
          "Because Flask crashes without /health",
          "To replace Python exceptions"
        ],
        "correctIndex": 0,
        "explanation": "/health provides a fast, side-effect-free signal for orchestrators and load balancers."
      }
    ]
  },
};
