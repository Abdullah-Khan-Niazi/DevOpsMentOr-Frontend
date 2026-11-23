import { useEffect, useRef } from 'react';
import '../styles/labs.css';

export type MentorOrbState =
  'rest' | 'doodling' | 'listening' | 'thinking' | 'working' | 'success' | 'error' | 'disabled';

interface MentorOrbProps {
  state?: MentorOrbState;
  size?: 'sm' | 'md' | 'lg';
  hovered?: boolean;
  className?: string;
}

interface SpherePoint {
  lat: number;
  phi: number;
  theta: number;
  sizeFactor: number;
  phase: number;
}

interface OrbitalRingParticle {
  ringIndex: 0 | 1;
  angle0: number;
  phase: number;
}

function createSphereLattice(): SpherePoint[] {
  const bands: Array<{ phiDeg: number; count: number; layerScale: number }> = [
    { phiDeg: 18, count: 4, layerScale: 0.72 },
    { phiDeg: 42, count: 8, layerScale: 0.9 },
    { phiDeg: 66, count: 10, layerScale: 1.08 },
    { phiDeg: 90, count: 12, layerScale: 1.22 },
    { phiDeg: 114, count: 10, layerScale: 1.05 },
    { phiDeg: 138, count: 8, layerScale: 0.88 },
    { phiDeg: 162, count: 4, layerScale: 0.7 },
  ];

  const points: SpherePoint[] = [];
  bands.forEach((band, bandIdx) => {
    const phi = (band.phiDeg * Math.PI) / 180;
    const lat = -Math.cos(phi);
    const offset = (bandIdx % 2) * (Math.PI / band.count);
    for (let i = 0; i < band.count; i++) {
      const intraLayerWave = (Math.sin(i * 2.35 + bandIdx * 1.65) + 1) * 0.5;
      const sizeFactor = band.layerScale * (0.62 + 0.68 * intraLayerWave);
      points.push({
        lat,
        phi,
        theta: (i / band.count) * Math.PI * 2 + offset,
        sizeFactor,
        phase: i * 0.9 + bandIdx * 1.3,
      });
    }
  });
  return points;
}

const PARTICLES_PER_RING = 20;

interface RingConfig {
  restRadius: number;
  hoverRadius: number;
  restInclination: number;
  hoverInclination: number;
  restRoll: number;
  hoverRoll: number;
  direction: 1 | -1;
}

const RING_CONFIGS: ReadonlyArray<RingConfig> = [
  {
    restRadius: 13.6,
    hoverRadius: 15.8,
    restInclination: 1.24,
    hoverInclination: 1.42,
    restRoll: -0.24,
    hoverRoll: Math.PI / 4,
    direction: 1,
  },
  {
    restRadius: 16.4,
    hoverRadius: 15.8,
    restInclination: 1.24,
    hoverInclination: 1.42,
    restRoll: -0.24,
    hoverRoll: -Math.PI / 4,
    direction: -1,
  },
];

/**
 * Two 3D particle rings: inner & outer concentric Saturn rings in rest state
 * spinning in opposite directions, morphing smoothly into a centered X on hover.
 */
function createRingParticles(): OrbitalRingParticle[] {
  const particles: OrbitalRingParticle[] = [];
  for (let r = 0; r < RING_CONFIGS.length; r++) {
    const ringIndex = r as 0 | 1;
    for (let i = 0; i < PARTICLES_PER_RING; i++) {
      particles.push({
        ringIndex,
        angle0: (i / PARTICLES_PER_RING) * Math.PI * 2 + r * (Math.PI / PARTICLES_PER_RING),
        phase: i * 0.45 + r * 1.1,
      });
    }
  }
  return particles;
}

const SPHERE_POINTS = createSphereLattice();
const RING_PARTICLES = createRingParticles();

const ORB_SIZE_CLASS: Record<NonNullable<MentorOrbProps['size']>, string> = {
  sm: 'size-6',
  md: 'size-12',
  lg: 'size-14',
};

interface StateMotion {
  dialSpeed: number;
  tiltX: number;
  upperExpand: number;
  lowerExpand: number;
  wobbleAmp: number;
  dialStep: boolean;
}

function getStateMotion(state: MentorOrbState, t: number): StateMotion {
  switch (state) {
    case 'doodling':
      return {
        dialSpeed: 0.75,
        tiltX: 0.36 + Math.sin(t * 1.9) * 0.16,
        upperExpand: 0.16 * Math.max(0, Math.sin(t * 2.2)),
        lowerExpand: 0.16 * Math.max(0, -Math.sin(t * 2.2)),
        wobbleAmp: 0.08,
        dialStep: false,
      };
    case 'listening':
      return {
        dialSpeed: 0.45,
        tiltX: 0.24,
        upperExpand: 0.24 + 0.05 * Math.sin(t * 3.2),
        lowerExpand: 0,
        wobbleAmp: 0.03,
        dialStep: false,
      };
    case 'thinking':
      return {
        dialSpeed: 1.35,
        tiltX: 0.32,
        upperExpand: 0.28 + 0.08 * Math.sin(t * 3.8),
        lowerExpand: 0.28 + 0.08 * Math.cos(t * 3.8),
        wobbleAmp: 0.04,
        dialStep: true,
      };
    case 'working':
      return {
        dialSpeed: 2.6,
        tiltX: 0.4 + Math.sin(t * 3.5) * 0.1,
        upperExpand: 0.3 + 0.12 * Math.sin(t * 6),
        lowerExpand: 0.3 + 0.12 * Math.sin(t * 6 + Math.PI),
        wobbleAmp: 0.06,
        dialStep: false,
      };
    case 'success':
      return {
        dialSpeed: 1.1,
        tiltX: 0.28,
        upperExpand: 0.32,
        lowerExpand: 0.32,
        wobbleAmp: 0.02,
        dialStep: false,
      };
    case 'error':
      return {
        dialSpeed: 0.2,
        tiltX: 0.28,
        upperExpand: -0.08,
        lowerExpand: -0.08,
        wobbleAmp: 0.14,
        dialStep: false,
      };
    case 'disabled':
      return {
        dialSpeed: 0,
        tiltX: 0.25,
        upperExpand: 0,
        lowerExpand: 0,
        wobbleAmp: 0,
        dialStep: false,
      };
    case 'rest':
    default:
      return {
        dialSpeed: 0.38,
        tiltX: 0.28,
        upperExpand: 0.04 * Math.sin(t * 1.4),
        lowerExpand: 0.04 * Math.sin(t * 1.4),
        wobbleAmp: 0.02,
        dialStep: false,
      };
  }
}

/**
 * 3D dotted spherical AI Mentor orb across all 8 legacy bot states, ringed by inner & outer
 * counter-spinning Saturn rings at rest that scissor into a centered X whose size breathes
 * in sync with the orb movement on hover.
 */
export function MentorOrb({
  state = 'rest',
  size = 'md',
  hovered = false,
  className = '',
}: MentorOrbProps) {
  const dotsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const ringDotsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const stateRef = useRef<MentorOrbState>(state);
  const hoveredRef = useRef<boolean>(hovered);
  const drawOnceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    hoveredRef.current = hovered;
    drawOnceRef.current?.();
  }, [state, hovered]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frameId = 0;
    let angle = 0;
    let ringAngle = 0;
    let hoverBlend = hoveredRef.current ? 1 : 0;
    let lastTime = performance.now();

    const paintFrame = (now: number, singleStatic: boolean) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = singleStatic ? 0 : now / 1000;
      const currentState = stateRef.current;
      const motion = getStateMotion(currentState, t);

      if (!singleStatic) {
        if (motion.dialStep) {
          angle = Math.floor(t * 3.5) * 0.55 + t * 0.45;
        } else {
          angle += dt * motion.dialSpeed;
        }
        const targetBlend = hoveredRef.current && currentState !== 'disabled' ? 1 : 0;
        const lerp = 1 - Math.exp(-dt * 12);
        hoverBlend += (targetBlend - hoverBlend) * lerp;
        const baseRingSpeed = Math.max(1.8, motion.dialSpeed * 3.0);
        const hoverRingSpeed = Math.max(3.2, motion.dialSpeed * 4.5);
        const ringSpeed =
          currentState === 'disabled'
            ? 0
            : baseRingSpeed + (hoverRingSpeed - baseRingSpeed) * hoverBlend;
        ringAngle += dt * ringSpeed;
      } else {
        hoverBlend = hoveredRef.current && currentState !== 'disabled' ? 1 : 0;
      }

      const cosTilt = Math.cos(motion.tiltX);
      const sinTilt = Math.sin(motion.tiltX);
      const baseRadius = 11.2;
      const fov = 36;
      const coreDim = 1 - 0.14 * hoverBlend;

      for (let i = 0; i < SPHERE_POINTS.length; i++) {
        const el = dotsRef.current[i];
        if (!el) continue;

        const p = SPHERE_POINTS[i];
        const upperWeight = p.lat < 0 ? Math.pow(-p.lat, 1.15) : 0;
        const lowerWeight = p.lat > 0 ? Math.pow(p.lat, 1.15) : 0;
        const radialScale =
          1 +
          upperWeight * motion.upperExpand +
          lowerWeight * motion.lowerExpand +
          Math.sin(t * 2.5 + p.theta * 2) * motion.wobbleAmp;

        const rSphere = baseRadius * radialScale;
        const sinPhi = Math.sin(p.phi);
        const cosPhi = Math.cos(p.phi);
        const thetaRot = p.theta + angle;

        const x0 = rSphere * sinPhi * Math.cos(thetaRot);
        const y0 =
          -rSphere *
          cosPhi *
          (1 + upperWeight * motion.upperExpand * 0.25 + lowerWeight * motion.lowerExpand * 0.25);
        const z0 = rSphere * sinPhi * Math.sin(thetaRot);

        const y1 = y0 * cosTilt - z0 * sinTilt;
        const z1 = y0 * sinTilt + z0 * cosTilt;

        const scale = fov / (fov - z1);
        const px = 18 + x0 * scale;
        const py = 18 + y1 * scale;

        const depthNorm = Math.max(-1, Math.min(1, z1 / baseRadius));
        const sizePulse =
          currentState === 'disabled' || singleStatic ? 1 : 1 + 0.16 * Math.sin(t * 2.8 + p.phase);
        const dotRadius = (0.48 + (depthNorm + 1) * 0.46) * p.sizeFactor * sizePulse;
        const opacity = (0.14 + Math.pow((depthNorm + 1) * 0.5, 1.35) * 0.86) * coreDim;

        const diameterPct = ((dotRadius * 2) / 36) * 100;
        el.style.left = `${((px / 36) * 100).toFixed(3)}%`;
        el.style.top = `${((py / 36) * 100).toFixed(3)}%`;
        el.style.width = `${diameterPct.toFixed(3)}%`;
        el.style.height = `${diameterPct.toFixed(3)}%`;
        el.style.opacity = opacity.toFixed(2);
      }

      const orbExpandAvg = (motion.upperExpand + motion.lowerExpand) * 0.5;
      const orbSwing = motion.upperExpand - motion.lowerExpand;
      const orbTiltDelta = motion.tiltX - 0.28;
      const orbBreath =
        singleStatic || currentState === 'disabled'
          ? 0
          : Math.sin(t * 2.2) * (0.08 + motion.wobbleAmp * 0.7);

      for (let i = 0; i < RING_PARTICLES.length; i++) {
        const el = ringDotsRef.current[i];
        if (!el) continue;

        const rp = RING_PARTICLES[i];
        const cfg = RING_CONFIGS[rp.ringIndex];
        const inclination =
          cfg.restInclination + (cfg.hoverInclination - cfg.restInclination) * hoverBlend;
        const roll = cfg.restRoll + (cfg.hoverRoll - cfg.restRoll) * hoverBlend;
        const baseRingRadius = cfg.restRadius + (cfg.hoverRadius - cfg.restRadius) * hoverBlend;

        const sign = cfg.direction;
        const motionMod =
          orbExpandAvg * 0.7 +
          (orbSwing * 0.55 + orbTiltDelta * 0.45) * sign +
          orbBreath * (rp.ringIndex === 0 ? 1 : -0.85);
        const hoverScale = Math.max(0.8, Math.min(1.25, 1 + motionMod));
        const ringRadius3d = baseRingRadius * (1 + (hoverScale - 1) * hoverBlend);

        const a = rp.angle0 + ringAngle * cfg.direction;
        const cx = ringRadius3d * Math.cos(a);
        const cy = ringRadius3d * Math.sin(a) * Math.cos(inclination);
        const cz = ringRadius3d * Math.sin(a) * Math.sin(inclination);

        const cosRoll = Math.cos(roll);
        const sinRoll = Math.sin(roll);
        const xr = cx * cosRoll - cy * sinRoll;
        const yr = cx * sinRoll + cy * cosRoll;
        const zr = cz;

        const ringScale = fov / (fov - zr);
        const px = 18 + xr * ringScale;
        const py = 18 + yr * ringScale;

        const depthNorm = Math.max(-1, Math.min(1, zr / ringRadius3d));
        const restDot = 0.34 + (depthNorm + 1) * 0.14;
        const hoverDot = (0.42 + (depthNorm + 1) * 0.2) * (0.92 + 0.16 * hoverScale);
        const dotRadius = restDot + (hoverDot - restDot) * hoverBlend;

        const depthAlpha = (depthNorm + 1) * 0.5;
        const restOpacity = (currentState === 'disabled' ? 0.3 : 1) * (0.2 + depthAlpha * 0.54);
        const hoverOpacity = 0.28 + depthAlpha * 0.7;
        const ringOpacity = restOpacity + (hoverOpacity - restOpacity) * hoverBlend;

        const diameterPct = ((dotRadius * 2) / 36) * 100;
        el.style.left = `${((px / 36) * 100).toFixed(3)}%`;
        el.style.top = `${((py / 36) * 100).toFixed(3)}%`;
        el.style.width = `${diameterPct.toFixed(3)}%`;
        el.style.height = `${diameterPct.toFixed(3)}%`;
        el.style.opacity = ringOpacity.toFixed(2);
      }

      if (!singleStatic) {
        frameId = window.requestAnimationFrame((nextNow) => paintFrame(nextNow, false));
      }
    };

    if (prefersReducedMotion) {
      drawOnceRef.current = () => paintFrame(performance.now(), true);
      drawOnceRef.current();
    } else {
      drawOnceRef.current = null;
      frameId = window.requestAnimationFrame((now) => paintFrame(now, false));
    }

    return () => {
      drawOnceRef.current = null;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-visible ${ORB_SIZE_CLASS[size]} mentor-orb mentor-orb--${state} ${className}`.trim()}
      data-orb-state={state}
      data-hovered={hovered ? 'true' : 'false'}
      aria-hidden="true"
    >
      {SPHERE_POINTS.map((_, idx) => (
        <span
          key={idx}
          ref={(el) => {
            dotsRef.current[idx] = el;
          }}
          className="absolute rounded-full bg-current"
          style={{ transform: 'translate(-50%, -50%)' }}
        />
      ))}
      {RING_PARTICLES.map((_, idx) => (
        <span
          key={`ring-${idx}`}
          ref={(el) => {
            ringDotsRef.current[idx] = el;
          }}
          className="absolute rounded-full bg-current"
          style={{ transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </span>
  );
}

export default MentorOrb;
