import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { SiteLayout } from './components/SiteLayout';
import { Button } from '@/shared/components';
import { ProductFrame } from './components/ProductFrame';
import { SiteAccordion } from './components/SiteAccordion';
import { FAQ_CATEGORIES } from './siteData';
import {
  useInView,
  useReducedMotion,
  useScrollReveal,
} from './hooks';
import './HomePage.css';
import loopSvg from '@/assets/hero/loop.svg';
import serverSvg from '@/assets/hero/server.svg';
import terminalSvg from '@/assets/hero/terminal.svg';
import containersSvg from '@/assets/hero/containers.svg';
import k8Svg from '@/assets/hero/k8.svg';
import cloud1Svg from '@/assets/hero/cloud-1.svg';
import cloud2Svg from '@/assets/hero/cloud-2.svg';
import cloud3Svg from '@/assets/hero/cloud-3.svg';

// 3D Isometric Module Icons
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

// ─── 15 Module Roadmap Checkpoints (3-Row Serpentine Path) ───────────────────
export interface RoadmapModule {
  num: string;
  name: string;
  condensedName: string;
  icon: string;
  slide: number;
  xPct: number;
  yPct: number;
}

export const ROADMAP_MODULES: RoadmapModule[] = [
  // Row 1: Left -> Right (y = 16.67%)
  { num: '01', name: 'Operating Systems and Linux Fundamentals', condensedName: 'Linux', icon: linux3d, slide: 1, xPct: 10.71, yPct: 16.67 },
  { num: '02', name: 'Version Control Systems and Git', condensedName: 'Git', icon: git3d, slide: 2, xPct: 29.17, yPct: 16.67 },
  { num: '03', name: 'Build Tools and Package Managers', condensedName: 'Package Managers', icon: apt3d, slide: 3, xPct: 47.62, yPct: 16.67 },
  { num: '04', name: 'Artifact Repository Management', condensedName: 'Repo Manager', icon: repo3d, slide: 4, xPct: 66.07, yPct: 16.67 },
  { num: '05', name: 'Cloud Computing and IaaS', condensedName: 'DigitalOcean', icon: droplet3d, slide: 5, xPct: 84.52, yPct: 16.67 },

  // Row 2: Right -> Left (y = 50.00%)
  { num: '06', name: 'Containers with Docker', condensedName: 'Docker', icon: docker3d, slide: 6, xPct: 84.52, yPct: 50.00 },
  { num: '07', name: 'Jenkins Pipelines and Build Automation', condensedName: 'Jenkins', icon: jenkins3d, slide: 7, xPct: 66.07, yPct: 50.00 },
  { num: '08', name: 'AWS Services', condensedName: 'AWS Services', icon: aws3d, slide: 8, xPct: 47.62, yPct: 50.00 },
  { num: '09', name: 'Core Kubernetes Container Orchestration', condensedName: 'Kubernetes', icon: k8s3d, slide: 9, xPct: 29.17, yPct: 50.00 },
  { num: '10', name: 'Kubernetes on AWS (EKS)', condensedName: 'AWS EKS', icon: eks3d, slide: 10, xPct: 10.71, yPct: 50.00 },

  // Row 3: Left -> Right (y = 83.33%)
  { num: '11', name: 'Infrastructure as Code with Terraform', condensedName: 'Terraform', icon: terraform3d, slide: 11, xPct: 10.71, yPct: 83.33 },
  { num: '12', name: 'Programming with Python', condensedName: 'Python', icon: python3d, slide: 12, xPct: 29.17, yPct: 83.33 },
  { num: '13', name: 'Python Automation', condensedName: 'Automation', icon: pythonAuto3d, slide: 13, xPct: 47.62, yPct: 83.33 },
  { num: '14', name: 'Configuration Management with Ansible', condensedName: 'Ansible', icon: ansible3d, slide: 14, xPct: 66.07, yPct: 83.33 },
  { num: '15', name: 'Enterprise Observability with Prometheus', condensedName: 'Observability', icon: prometheus3d, slide: 15, xPct: 84.52, yPct: 83.33 },
];

// Module 01 Lab 00: Linux "Hello There!" Simulation Data
const LINUX_SUDO_CMD = 'sudo';
const LINUX_SUDO_INTRO =
  'We trust you have received the usual lecture from the local System Administrator. It usually boils down to these three things:';
const LINUX_SUDO_RULES = [
  '#1) Respect the privacy of others.',
  '#2) Think before you type.',
  '#3) With great power comes great responsibility.',
];
const LINUX_SUDO_AUTH = '[sudo] password for mentor: [authorized: uid=0(root) gid=0(root)]';

const OB1_MENTOR_HINT =
  'You have taken your first step into a larger world. But remember: with root privilege, the line between configuring a cluster and vaporizing it is remarkably thin. Think before you type.';

// ─── Section 2: Hero — Isometric Illustrated Canvas ──────────────────────────
function HeroSection() {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [clickedAsset, setClickedAsset] = useState<string | null>(null);

  const triggerClick = (id: string) => {
    setClickedAsset(id);
    setTimeout(() => setClickedAsset(null), 350);
  };

  return (
    <section className="hp-hero" aria-labelledby="hp-hero-title">
      <div className="hp-hero__inner">
        {/* Left Column: Headlines, copy, CTAs */}
        <div className="hp-hero__text">
          <h1 id="hp-hero-title" className="hp-hero__title">
            <span className="hp-hero__title-line">Master DevOps</span>
            <span className="hp-hero__title-line">Interactively.</span>
          </h1>
          <p className="hp-hero__sub">
            Hands-on labs. Real environments. Build your DevOps skills, step by step.
          </p>
          <div className="hp-hero__ctas">
            <Link to={ROUTES.SIGNUP} className="hp-hero__cta-link">
              <Button variant="primary" size="lg">
                Start Learning
              </Button>
            </Link>
            <Link to={ROUTES.CURRICULUM} className="hp-hero__cta-link">
              <Button variant="secondary" size="lg">
                Explore Labs
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Isometric visual cluster */}
        <div className="hp-hero__visual">
          <div className="hp-hero__stage">
            {/* Ambient Floor Shadows */}
            <div className="hp-hero__shadows" aria-hidden="true">
              <div
                className={`hp-hero__shadow hp-hero__shadow--cloud-3 ${
                  hoveredAsset === 'cloud-3' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--cloud-1 ${
                  hoveredAsset === 'cloud-1' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--cloud-2 ${
                  hoveredAsset === 'cloud-2' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--server ${
                  hoveredAsset === 'server' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--loop-dev ${
                  hoveredAsset === 'loop' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--loop-ops ${
                  hoveredAsset === 'loop' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--terminal ${
                  hoveredAsset === 'terminal' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--k8 ${
                  hoveredAsset === 'k8' ? 'hp-hero__shadow--active' : ''
                }`}
              />
              <div
                className={`hp-hero__shadow hp-hero__shadow--containers ${
                  hoveredAsset === 'containers' ? 'hp-hero__shadow--active' : ''
                }`}
              />
            </div>

            {/* Cloud 3 — Top Left */}
            <div
              className={`hp-hero__asset hp-hero__asset--cloud-3 ${
                hoveredAsset === 'cloud-3' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'cloud-3' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('cloud-3')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('cloud-3')}
              role="button"
              tabIndex={0}
              aria-label="Multi-Cloud Infrastructure"
            >
              <img src={cloud3Svg} alt="" className="hp-hero__drift hp-hero__drift--cloud-3" />
            </div>

            {/* Cloud 1 — Top Right (Above Server) */}
            <div
              className={`hp-hero__asset hp-hero__asset--cloud-1 ${
                hoveredAsset === 'cloud-1' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'cloud-1' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('cloud-1')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('cloud-1')}
              role="button"
              tabIndex={0}
              aria-label="Edge Mesh Infrastructure"
            >
              <img src={cloud1Svg} alt="" className="hp-hero__drift hp-hero__drift--cloud-1" />
            </div>

            {/* Cloud 2 — Mid Right */}
            <div
              className={`hp-hero__asset hp-hero__asset--cloud-2 ${
                hoveredAsset === 'cloud-2' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'cloud-2' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('cloud-2')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('cloud-2')}
              role="button"
              tabIndex={0}
              aria-label="Serverless Cloud"
            >
              <img src={cloud2Svg} alt="" className="hp-hero__drift hp-hero__drift--cloud-2" />
            </div>

            {/* Server Rack — Upper Right behind Loop */}
            <div
              className={`hp-hero__asset hp-hero__asset--server ${
                hoveredAsset === 'server' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'server' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('server')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('server')}
              role="button"
              tabIndex={0}
              aria-label="Production Bare-Metal Server Cluster"
            >
              <img src={serverSvg} alt="" className="hp-hero__drift hp-hero__drift--server" />
            </div>

            {/* DEV/OPS Infinity Loop — Center Anchor */}
            <div
              className={`hp-hero__asset hp-hero__asset--loop ${
                hoveredAsset === 'loop' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'loop' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('loop')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('loop')}
              role="button"
              tabIndex={0}
              aria-label="Continuous DevOps Delivery Loop"
            >
              <img src={loopSvg} alt="" className="hp-hero__drift hp-hero__drift--loop" />
            </div>

            {/* Terminal Panel — Lower Left in front of Loop */}
            <div
              className={`hp-hero__asset hp-hero__asset--terminal ${
                hoveredAsset === 'terminal' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'terminal' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('terminal')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('terminal')}
              role="button"
              tabIndex={0}
              aria-label="Interactive Kubernetes Terminal Lab"
            >
              <img src={terminalSvg} alt="" className="hp-hero__drift hp-hero__drift--terminal" />
            </div>

            {/* Containers Plinth — Lower Right */}
            <div
              className={`hp-hero__asset hp-hero__asset--containers ${
                hoveredAsset === 'containers' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'containers' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('containers')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('containers')}
              role="button"
              tabIndex={0}
              aria-label="Docker Containerized Microservices"
            >
              <img src={containersSvg} alt="" className="hp-hero__drift hp-hero__drift--containers" />
            </div>

            {/* Kubernetes Pedestal — Lower Center */}
            <div
              className={`hp-hero__asset hp-hero__asset--k8 ${
                hoveredAsset === 'k8' ? 'hp-hero__asset--hovered' : ''
              } ${clickedAsset === 'k8' ? 'hp-hero__asset--active' : ''}`}
              onMouseEnter={() => setHoveredAsset('k8')}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => triggerClick('k8')}
              role="button"
              tabIndex={0}
              aria-label="Kubernetes Cluster Control Plane"
            >
              <img src={k8Svg} alt="" className="hp-hero__drift hp-hero__drift--k8" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Your Learning Dashboard (Module 01 Lab 00 Linux Mockup) ───────
function LearningDashboardSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.05);
  const revealRef = useScrollReveal<HTMLDivElement>();
  const reduced = useReducedMotion();

  // Collapsible panel states
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [aiMentorCollapsed, setAiMentorCollapsed] = useState(false);

  // Animation playback state: 0 = typing sudo, 1 = lecture output, 2 = mentor hint stream
  const [animStep, setAnimStep] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setAnimStep(2);
      setCharIndex(OB1_MENTOR_HINT.length);
      return;
    }

    let timer: number;
    if (animStep === 0) {
      // Type 'sudo' with slower, deliberate pace
      if (charIndex < LINUX_SUDO_CMD.length) {
        timer = window.setTimeout(() => setCharIndex((c) => c + 1), 140);
      } else {
        timer = window.setTimeout(() => {
          setAnimStep(1);
          setCharIndex(0);
        }, 500);
      }
    } else if (animStep === 1) {
      // Display classic lecture, pause, then stream OB-1 mentor guidance
      timer = window.setTimeout(() => {
        setAnimStep(2);
        setCharIndex(0);
      }, 750);
    } else if (animStep === 2) {
      // Stream mentor hint tokens
      if (charIndex < OB1_MENTOR_HINT.length) {
        timer = window.setTimeout(() => setCharIndex((c) => c + 2), 18);
      } else {
        // Automatically replay every 5 seconds
        timer = window.setTimeout(() => {
          setAnimStep(0);
          setCharIndex(0);
        }, 5000);
      }
    }

    return () => window.clearTimeout(timer);
  }, [inView, animStep, charIndex, reduced]);

  return (
    <section className="hp-ld site-section--dim" id="dashboard" aria-labelledby="hp-ld-title" ref={ref}>
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <div className="hp-ld__heading-wrap">
            <h2 id="hp-ld-title" className="hp-ld__title">
              Your Learning Dashboard.
            </h2>
          </div>

          {/* Authentic Browser Window Mockup */}
          <div className="hp-ld__browser">
            {/* Browser Window Titlebar (Three dots + Address Bar) */}
            <div className="hp-ld__browser-bar">
              <div className="hp-ld__browser-dots">
                <span className="hp-ld__browser-dot hp-ld__browser-dot--red" />
                <span className="hp-ld__browser-dot hp-ld__browser-dot--yellow" />
                <span className="hp-ld__browser-dot hp-ld__browser-dot--green" />
              </div>
              <div className="hp-ld__browser-address">
                <span className="hp-ld__browser-sec">https://</span>app.devopsmentor.io/labs/linux/00
              </div>
              <div className="hp-ld__browser-actions" aria-hidden="true" />
            </div>

            {/* Main Window Body: 3-column Architecture */}
            <div className={`hp-ld__layout ${rightRailCollapsed ? 'hp-ld__layout--right-collapsed' : ''}`}>
              {/* Left Column: Clean Specs (Separated through whitespace and color, no pills) */}
              <aside className="hp-ld__col hp-ld__col--left">
                <div className="hp-ld__left-inner">
                  {/* Lab Identity (Rendered once, no repetition) */}
                  <div className="hp-ld__left-header">
                    <h3 className="hp-ld__left-title">Lab 00: Hello There!</h3>
                    <p className="hp-ld__left-sub">Module 01: Linux Fundamentals</p>
                  </div>

                  {/* Objective */}
                  <div className="hp-ld__left-group">
                    <span className="hp-ld__group-label">Objective</span>
                    <p className="hp-ld__group-text">
                      Initialize superuser privileges and acknowledge administrative security boundaries in an isolated sandbox.
                    </p>
                  </div>

                  {/* Scenario */}
                  <div className="hp-ld__left-group">
                    <span className="hp-ld__group-label">Scenario</span>
                    <p className="hp-ld__group-text">
                      Inspect system administrator access policy on a provisioned Ubuntu node before executing elevated tasks.
                    </p>
                  </div>

                  {/* Core Commands */}
                  <div className="hp-ld__left-group">
                    <span className="hp-ld__group-label">Core Commands</span>
                    <div className="hp-ld__cmd-rows">
                      <div className="hp-ld__cmd-row">
                        <code>sudo</code>
                        <span>execute as superuser</span>
                      </div>
                      <div className="hp-ld__cmd-row">
                        <code>whoami</code>
                        <span>print effective UID</span>
                      </div>
                      <div className="hp-ld__cmd-row">
                        <code>id</code>
                        <span>display user groups</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Assertions */}
                  <div className="hp-ld__left-group hp-ld__left-group--assertions">
                    <div className="hp-ld__assertion-head">
                      <span className="hp-ld__group-label">Assertions</span>
                      <span className="hp-ld__assertion-status">
                        {animStep >= 1 ? '2 of 2 Passed' : '0 of 2'}
                      </span>
                    </div>
                    <div className="hp-ld__assertion-list">
                      <div className={`hp-ld__assertion-item ${animStep >= 1 ? 'hp-ld__assertion-item--pass' : ''}`}>
                        <span className="hp-ld__assertion-icon">{animStep >= 1 ? '✓' : '○'}</span>
                        <span>Invoke superuser elevation (sudo)</span>
                      </div>
                      <div className={`hp-ld__assertion-item ${animStep >= 1 ? 'hp-ld__assertion-item--pass' : ''}`}>
                        <span className="hp-ld__assertion-icon">{animStep >= 1 ? '✓' : '○'}</span>
                        <span>Acknowledge security lecture triad</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Center Column: Frosted Glass Terminal + OB-1 Systems Mentor */}
              <main className="hp-ld__col hp-ld__col--center">
                {/* Frosted Glass Terminal Pane */}
                <div className="hp-ld__terminal">
                  <div className="hp-ld__term-header">
                    <span className="hp-ld__term-title">mentor@lab-vm:~/workspace</span>
                    {rightRailCollapsed && (
                      <button
                        type="button"
                        className="hp-ld__expand-companion-btn"
                        onClick={() => setRightRailCollapsed(false)}
                        title="Open slides and walkthrough companion"
                      >
                        ⇤ Companion
                      </button>
                    )}
                  </div>

                  <div
                    className="hp-ld__term-body"
                    role="region"
                    aria-label="Simulated Linux terminal output"
                  >
                    {/* Command: sudo with Word Smash Drop animation */}
                    <div className="hp-ld__term-block">
                      <p className="hp-ld__term-prompt-line">
                        <span className="hp-ld__term-user">mentor@lab</span>
                        <span className="hp-ld__term-sep">:</span>
                        <span className="hp-ld__term-path">~</span>
                        <span className="hp-ld__term-sym">$</span>{' '}
                        <span className="hp-ld__term-cmd">
                          {animStep === 0
                            ? LINUX_SUDO_CMD.slice(0, charIndex).split('').map((ch, idx) => (
                                <span key={idx} className="hp-ld__char-drop">{ch}</span>
                              ))
                            : LINUX_SUDO_CMD}
                        </span>
                        {animStep === 0 && <span className="hp-ld__term-cursor">█</span>}
                      </p>
                      {animStep >= 1 && (
                        <div className="hp-ld__term-output">
                          <p className="hp-ld__term-lecture-text">{LINUX_SUDO_INTRO}</p>
                          <div className="hp-ld__term-lecture-rules">
                            {LINUX_SUDO_RULES.map((rule, idx) => (
                              <p key={idx} className="hp-ld__term-lecture-rule">
                                &nbsp;&nbsp;{rule}
                              </p>
                            ))}
                          </div>
                          <p className="hp-ld__term-auth">{LINUX_SUDO_AUTH}</p>
                          <p className="hp-ld__term-pass">
                            ✓ assertion 2/2 passed: superuser security boundary verified
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* OB-1 Systems Mentor Panel */}
                <div
                  className={`hp-ld__mentor ${aiMentorCollapsed ? 'hp-ld__mentor--collapsed' : ''}`}
                >
                  <div className="hp-ld__mentor-head">
                    <div className="hp-ld__mentor-identity">
                      <span className="hp-ld__mentor-name">OB-1</span>
                      <span className="hp-ld__mentor-role">AI Mentor</span>
                    </div>
                    <button
                      type="button"
                      className="hp-ld__panel-toggle"
                      onClick={() => setAiMentorCollapsed(!aiMentorCollapsed)}
                      aria-label={aiMentorCollapsed ? 'Expand mentor panel' : 'Collapse mentor panel'}
                    >
                      {aiMentorCollapsed ? '▲' : '▼'}
                    </button>
                  </div>
                  {!aiMentorCollapsed && (
                    <div className="hp-ld__mentor-body">
                      <p className="hp-ld__mentor-text">
                        {animStep >= 2
                          ? OB1_MENTOR_HINT.slice(0, charIndex)
                          : reduced
                            ? OB1_MENTOR_HINT
                            : 'Awaiting command execution...'}
                        {animStep === 2 && charIndex < OB1_MENTOR_HINT.length && (
                          <span className="hp-ld__term-cursor">█</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </main>

              {/* Right Column: Slide (Upper) & Walkthrough (Lower) */}
              <aside
                className={`hp-ld__col hp-ld__col--right ${
                  rightRailCollapsed ? 'hp-ld__col--right-collapsed' : ''
                }`}
              >
                <div className="hp-ld__right-header">
                  <span className="hp-ld__side-title">Lab Companion</span>
                  <button
                    type="button"
                    className="hp-ld__collapse-btn"
                    onClick={() => setRightRailCollapsed(true)}
                    title="Collapse companion panel to the right"
                  >
                    Collapse ⇥
                  </button>
                </div>

                <div className="hp-ld__right-content">
                  {/* Upper Portion: Slide */}
                  <div className="hp-ld__slide-section">
                    <span className="hp-ld__group-label">Slide 01/04: Privilege Model</span>
                    <div className="hp-ld__priv-model">
                      <div className="hp-ld__priv-node">
                        <span className="hp-ld__priv-title">mentor</span>
                        <span className="hp-ld__priv-sub">UID 1000</span>
                      </div>
                      <div className="hp-ld__priv-arrow">
                        <span className="hp-ld__priv-arrow-line" />
                        <span className="hp-ld__priv-gate">sudoers</span>
                        <span className="hp-ld__priv-arrow-line" />
                      </div>
                      <div className="hp-ld__priv-node hp-ld__priv-node--root">
                        <span className="hp-ld__priv-title">root</span>
                        <span className="hp-ld__priv-sub">UID 0</span>
                      </div>
                    </div>
                    <p className="hp-ld__priv-note">
                      <strong>Least Privilege:</strong> Processes run restricted until elevated via the sudoers gate.
                    </p>
                  </div>

                  {/* Lower Portion: Walkthrough Step-by-Step Guide */}
                  <div className="hp-ld__walkthrough-section">
                    <span className="hp-ld__group-label">Step-by-Step Walkthrough</span>
                    <ol className="hp-ld__walkthrough-list">
                      <li className="hp-ld__walkthrough-item hp-ld__walkthrough-item--done">
                        <span className="hp-ld__step-badge">1</span>
                        <div className="hp-ld__step-text">
                          <span className="hp-ld__step-title">Inspect Session</span>
                          <span className="hp-ld__step-desc">Identify unprivileged UID 1000 context</span>
                        </div>
                      </li>
                      <li className={`hp-ld__walkthrough-item ${animStep >= 1 ? 'hp-ld__walkthrough-item--done' : 'hp-ld__walkthrough-item--active'}`}>
                        <span className="hp-ld__step-badge">2</span>
                        <div className="hp-ld__step-text">
                          <span className="hp-ld__step-title">Request Elevation</span>
                          <span className="hp-ld__step-desc">Execute <code>sudo</code> to invoke policy</span>
                        </div>
                      </li>
                      <li className={`hp-ld__walkthrough-item ${animStep >= 1 ? 'hp-ld__walkthrough-item--done' : ''}`}>
                        <span className="hp-ld__step-badge">3</span>
                        <div className="hp-ld__step-text">
                          <span className="hp-ld__step-title">Confirm Access</span>
                          <span className="hp-ld__step-desc">Acknowledge triad to obtain UID 0</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* CTA beneath Mockup */}
          <div className="hp-ld__cta-wrap">
            <Link to={ROUTES.CURRICULUM} className="hp-ld__cta-link">
              <Button variant="primary" size="lg">
                Open the Learning Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Module Catalog & Serpentine Learning Path ────────────────────
function ModuleCatalogTeaserSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hp-catalog-teaser site-section--paper" aria-labelledby="hp-cat-title">
      <div className="site-container">
        <div className="site-reveal hp-catalog-teaser__grid" ref={revealRef}>
          {/* Left Column: Headlines, concise copy, CTA */}
          <div className="hp-catalog-teaser__text">
            <h2 id="hp-cat-title" className="hp-catalog-teaser__title">
              End-to-End DevOps Mastery
            </h2>
            <p className="hp-catalog-teaser__sub">
              Follow a verified, structured learning path engineered for end-to-end DevOps mastery. Progress seamlessly from Linux fundamentals to multi-cluster orchestration with evaluated live infrastructure in browser sandboxes for a hassle-free learning experience.
            </p>
            <div className="hp-catalog-teaser__cta">
              <Link to={ROUTES.CURRICULUM}>
                <Button variant="primary" size="md">
                  Explore the Curriculum →
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Serpentine Road with Numbered Platforms and Floating 3D Icons */}
          <div className="hp-catalog-teaser__road-stage" aria-label="Winding learning path with checkpoints">
            <div className="hp-road-grid-wrap">
              <svg
                className="hp-road-svg"
                viewBox="0 0 840 540"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {/* Outer roadway underlay */}
                <path
                  d="M 90 90 L 710 90 C 815 90, 815 270, 710 270 L 90 270 C -15 270, -15 450, 90 450 L 710 450"
                  className="hp-road__bed"
                />
                {/* Road surface */}
                <path
                  d="M 90 90 L 710 90 C 815 90, 815 270, 710 270 L 90 270 C -15 270, -15 450, 90 450 L 710 450"
                  className="hp-road__surface"
                />
                {/* Centerline track */}
                <path
                  d="M 90 90 L 710 90 C 815 90, 815 270, 710 270 L 90 270 C -15 270, -15 450, 90 450 L 710 450"
                  className="hp-road__divider"
                />
              </svg>

              {/* Checkpoint Nodes: Floating 3D Icons over Numbered Platforms */}
              <div className="hp-road-nodes" role="list">
                {ROADMAP_MODULES.map((mod, idx) => (
                  <Link
                    key={mod.num}
                    to={`${ROUTES.CURRICULUM}?slide=${mod.slide}`}
                    className="hp-road-node"
                    style={{
                      left: `${mod.xPct}%`,
                      top: `${mod.yPct}%`,
                      '--i': idx,
                    } as React.CSSProperties}
                    title={`Module ${mod.num}: ${mod.name} (View in Module Catalog)`}
                    aria-label={`Module ${mod.num}: ${mod.name}`}
                    role="listitem"
                  >
                    {/* Floating 3D Icon above Platform */}
                    <div className="hp-road-node__icon-wrap">
                      <img
                        src={mod.icon}
                        alt={mod.condensedName}
                        className="hp-road-node__img"
                        loading="lazy"
                      />
                    </div>

                    {/* Numbered Platform ON the road */}
                    <div className="hp-road-node__platform">
                      <span className="hp-road-node__platform-num">{mod.num}</span>
                    </div>

                    {/* Module Name below Platform */}
                    <div className="hp-road-node__meta">
                      <span className="hp-road-node__name">{mod.condensedName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Fallback: Vertical Timeline */}
            <div className="hp-road-mobile" aria-label="Mobile module path">
              <div className="hp-road-mobile__spine" aria-hidden="true" />
              {ROADMAP_MODULES.map((mod, idx) => (
                <Link
                  key={mod.num}
                  to={`${ROUTES.CURRICULUM}?slide=${mod.slide}`}
                  className="hp-road-mobile__item"
                  style={{ '--i': idx } as React.CSSProperties}
                  title={`Module ${mod.num}: ${mod.name}`}
                >
                  <div className="hp-road-mobile__platform">
                    <span className="hp-road-mobile__platform-num">{mod.num}</span>
                  </div>
                  <div className="hp-road-mobile__icon-wrap">
                    <img
                      src={mod.icon}
                      alt={mod.condensedName}
                      className="hp-road-mobile__img"
                      loading="lazy"
                    />
                  </div>
                  <div className="hp-road-mobile__info">
                    <span className="hp-road-mobile__badge">MODULE {mod.num}</span>
                    <span className="hp-road-mobile__name">{mod.condensedName}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Every Lab Is Graded (§5.4) ────────────────────────────────────
function FeatureGradingSection() {
  const textRef = useScrollReveal<HTMLDivElement>();
  const visualRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hp-fm site-section--dim" aria-labelledby="hp-fm1-title">
      <div className="site-container hp-fm__grid">
        <div className="site-reveal hp-fm__text hp-fm__text--left" ref={textRef}>
          <h2 id="hp-fm1-title" className="hp-fm__title">
            Every lab is graded, not just run.
          </h2>
          <p className="hp-fm__body">
            Each lab ships with an automated evaluation sidecar that watches container state in
            real time. Assertions evaluate live infrastructure as you work. Labs pass or fail
            within seconds of your action with zero manual review queue.
          </p>
        </div>
        <div className="site-reveal hp-fm__visual hp-fm__visual--right" ref={visualRef}>
          <ProductFrame variant="app" label="evaluator: devopsmentor">
            <div className="hp-terminal">
              <p className="hp-terminal__line">
                <span className="hp-terminal__prompt">$</span> kubectl apply -f pod-affinity.yaml
              </p>
              <p className="hp-terminal__line hp-terminal__output">
                deployment.apps/pod-affinity-demo created
              </p>
              <p className="hp-terminal__line">
                <span className="hp-terminal__prompt">$</span> kubectl rollout status deploy/pod-affinity-demo
              </p>
              <p className="hp-terminal__line hp-terminal__output">
                deployment &quot;pod-affinity-demo&quot; successfully rolled out
              </p>
              <p className="hp-terminal__line hp-terminal__pass">
                ✓ assertion 5/5 passed: live cluster verified
              </p>
            </div>
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: How It Works (§5.7) ───────────────────────────────────────────
const HIW_STEPS = [
  {
    num: '01',
    title: 'Launch a lab in your browser',
    body: 'No local Docker, no port conflicts. Ephemeral environment provisioned in 90 seconds.',
  },
  {
    num: '02',
    title: 'Work in a real terminal environment',
    body: 'Every command runs against actual Linux containers and live cluster APIs.',
  },
  {
    num: '03',
    title: 'Get instant, guardrailed feedback',
    body: 'Automated sidecars evaluate state live. AI Mentor gives hints without spoiling answers.',
  },
] as const;

function HowItWorksSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hp-hiw site-section--paper" aria-labelledby="hp-hiw-title">
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <div className="hp-hiw__flow-wrap" aria-hidden="true">
            <svg className="hp-hiw__flow" preserveAspectRatio="none" viewBox="0 0 100 2">
              <line className="hp-hiw__flow-track" x1="0" y1="1" x2="100" y2="1" />
              <line className="hp-hiw__flow-line" x1="0" y1="1" x2="100" y2="1" />
            </svg>
          </div>
          <div className="hp-hiw__steps">
            {HIW_STEPS.map((step) => (
              <div key={step.num} className="hp-hiw__step">
                <span className="hp-hiw__num">{step.num}</span>
                <h3 className="hp-hiw__title">{step.title}</h3>
                <p className="hp-hiw__body">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="hp-hiw__link">
            <Link to={ROUTES.HOW_IT_WORKS}>
              <Button variant="secondary" size="md">
                See the full 7-step lifecycle →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 8: Why We Built This (§5.8) ──────────────────────────────────────
const MECHANISMS = [
  {
    title: 'No local setup',
    body: 'Every lab runs in isolated cloud containers. Zero dependency conflicts or machine overhead.',
  },
  {
    title: 'Real infrastructure',
    body: 'Production Linux and Kubernetes, not toy simulations. Everything transfers to live clusters.',
  },
  {
    title: 'Instant feedback',
    body: 'Assertions evaluate the second you act. No waiting on instructor queues to know you passed.',
  },
] as const;

function MechanismSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-mech site-section--dim" aria-labelledby="hp-mech-title">
      <div className="site-container">
        <div className="site-reveal" ref={revealRef}>
          <h2 id="hp-mech-title" className="hp-mech__title">
            Why we built this
          </h2>
          <div className="hp-mech__grid">
            {MECHANISMS.map((m) => (
              <div key={m.title} className="hp-mech__item">
                <h3 className="hp-mech__item-title">{m.title}</h3>
                <p className="hp-mech__item-body">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: For Institutions Teaser (§5.9) ────────────────────────────────
function InstitutionsTeaserSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-inst site-section--paper" aria-labelledby="hp-inst-title">
      <div className="site-container">
        <div className="site-reveal hp-inst__inner" ref={revealRef}>
          <h2 id="hp-inst-title" className="hp-inst__title">
            Every cohort in its own namespace.
          </h2>
          <p className="hp-inst__body">
            Cohorts run on shared clusters, isolated cleanly by Kubernetes namespaces without
            duplicated infrastructure overhead. Faculty manage students, assignments, and telemetry
            in one dashboard.
          </p>
          <div className="hp-inst__cta">
            <Link to={ROUTES.FOR_INSTITUTIONS}>
              <Button variant="secondary" size="md">
                Explore institutional access →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 10: FAQ (§5.10) ──────────────────────────────────────────────────
const HOME_FAQ_ITEMS = FAQ_CATEGORIES.flatMap((cat) => cat.items).slice(0, 5);

function FaqSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-faq site-section--dim" aria-labelledby="hp-faq-title">
      <div className="site-container hp-faq__container">
        <div className="site-reveal" ref={revealRef}>
          <h2 id="hp-faq-title" className="hp-faq__title">
            Frequently asked questions
          </h2>
          <p className="hp-faq__sub">
            Quick answers on access, lab sessions, and institutional deployment.
          </p>
          <div className="hp-faq__accordion">
            <SiteAccordion items={HOME_FAQ_ITEMS} allowMultiple={false} />
          </div>
          <div className="hp-faq__more">
            <Link to={ROUTES.FAQ} className="hp-faq__link">
              See all FAQs →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 11: Final CTA (§5.11) ───────────────────────────────────────────
function FinalCtaSection() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  return (
    <section className="hp-final site-section--paper" aria-labelledby="hp-final-title">
      <div className="site-container">
        <div className="site-reveal hp-final__inner" ref={revealRef}>
          <h2 id="hp-final-title" className="hp-final__title">
            Run your first container lab in the next 90 seconds.
          </h2>
          <div className="hp-final__cta">
            <Link to={ROUTES.SIGNUP}>
              <Button variant="primary" size="lg">
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Homepage Composition ────────────────────────────────────────────────
export default function HomePage() {
  return (
    <SiteLayout>
      <HeroSection />
      <LearningDashboardSection />
      <ModuleCatalogTeaserSection />
      <FeatureGradingSection />
      <HowItWorksSection />
      <MechanismSection />
      <InstitutionsTeaserSection />
      <FaqSection />
      <FinalCtaSection />
    </SiteLayout>
  );
}
