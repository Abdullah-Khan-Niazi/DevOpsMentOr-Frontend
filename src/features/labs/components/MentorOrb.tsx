import { useEffect, useRef } from 'react';

export type MentorOrbState =
  | 'rest'
  | 'doodling'
  | 'listening'
  | 'thinking'
  | 'working'
  | 'success'
  | 'error'
  | 'disabled';

interface MentorOrbProps {
  state?: MentorOrbState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface SpherePoint {
  lat: number; // -1 (north) .. +1 (south)
  phi: number; // polar angle 0..PI
  theta: number; // azimuth 0..2PI
  sizeFactor: number; // distinct dot scale per layer and within each layer
  phase: number; // per-dot phase offset for organic size variation
}

/**
 * Build a balanced 7-band spherical dot lattice so upper/lower hemispheres
 * can morph independently while rotating around the vertical dial axis,
 * with distinct dot sizes across layers and within each layer.
 */
function createSphereLattice(): SpherePoint[] {
  const bands: Array<{ phiDeg: number; count: number; layerScale: number }> = [
    { phiDeg: 18, count: 4, layerScale: 0.72 },
    { phiDeg: 42, count: 8, layerScale: 0.9 },
    { phiDeg: 66, count: 10, layerScale: 1.08 },
    { phiDeg: 90, count: 12, layerScale: 1.22 }, // Equator (remains steady when upper/lower expand)
    { phiDeg: 114, count: 10, layerScale: 1.05 },
    { phiDeg: 138, count: 8, layerScale: 0.88 },
    { phiDeg: 162, count: 4, layerScale: 0.7 },
  ];

  const points: SpherePoint[] = [];
  bands.forEach((band, bandIdx) => {
    const phi = (band.phiDeg * Math.PI) / 180;
    const lat = -Math.cos(phi); // -1 near north pole, 0 equator, +1 near south pole
    const offset = (bandIdx % 2) * (Math.PI / band.count);
    for (let i = 0; i < band.count; i++) {
      // Vary dot size distinctly within each layer as well as across layers
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

const SPHERE_POINTS = createSphereLattice();

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

export function MentorOrb({ state = 'rest', size = 'md', className = '' }: MentorOrbProps) {
  const circlesRef = useRef<Array<SVGCircleElement | null>>([]);
  const stateRef = useRef<MentorOrbState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frameId = 0;
    let angle = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now / 1000;
      const motion = getStateMotion(stateRef.current, t);

      if (!prefersReducedMotion) {
        if (motion.dialStep) {
          // Stepped dial ticks for thinking state
          const tick = Math.floor(t * 3.5) * 0.55 + (t * 0.45);
          angle = tick;
        } else {
          angle += dt * motion.dialSpeed;
        }
      }

      const cosTilt = Math.cos(motion.tiltX);
      const sinTilt = Math.sin(motion.tiltX);
      const baseRadius = 11.2;
      const fov = 36;

      for (let i = 0; i < SPHERE_POINTS.length; i++) {
        const el = circlesRef.current[i];
        if (!el) continue;

        const p = SPHERE_POINTS[i];
        // Upper (lat < 0) and lower (lat > 0) hemispheres expand while equator (lat ~ 0) stays steady
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

        // 3D Cartesian coordinates on sphere
        const x0 = rSphere * sinPhi * Math.cos(thetaRot);
        const y0 = -rSphere * cosPhi * (1 + upperWeight * motion.upperExpand * 0.25 + lowerWeight * motion.lowerExpand * 0.25);
        const z0 = rSphere * sinPhi * Math.sin(thetaRot);

        // Apply isometric/3D X-tilt
        const y1 = y0 * cosTilt - z0 * sinTilt;
        const z1 = y0 * sinTilt + z0 * cosTilt;

        // Perspective projection
        const scale = fov / (fov - z1);
        const px = 18 + x0 * scale;
        const py = 18 + y1 * scale;

        // Depth-based + per-layer/intra-layer distinct dot size with live variation
        const depthNorm = Math.max(-1, Math.min(1, z1 / baseRadius));
        const sizePulse =
          stateRef.current === 'disabled'
            ? 1
            : 1 + 0.16 * Math.sin(t * 2.8 + p.phase);
        const dotRadius = (0.48 + (depthNorm + 1) * 0.46) * p.sizeFactor * sizePulse;
        const opacity = 0.14 + Math.pow((depthNorm + 1) * 0.5, 1.35) * 0.86;

        el.setAttribute('cx', px.toFixed(2));
        el.setAttribute('cy', py.toFixed(2));
        el.setAttribute('r', dotRadius.toFixed(2));
        el.style.opacity = opacity.toFixed(2);
      }

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    frameId = window.requestAnimationFrame(renderFrame);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <span
      className={`mentor-orb mentor-orb--${state} mentor-orb--${size} ${className}`.trim()}
      data-orb-state={state}
      aria-hidden="true"
    >
      <svg className="mentor-orb__svg" viewBox="0 0 36 36" fill="none">
        {SPHERE_POINTS.map((_, idx) => (
          <circle
            key={idx}
            ref={(el) => {
              circlesRef.current[idx] = el;
            }}
            cx="18"
            cy="18"
            r="1"
            fill="currentColor"
          />
        ))}
      </svg>
    </span>
  );
}

export default MentorOrb;
