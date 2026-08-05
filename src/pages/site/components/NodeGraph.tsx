import { useMemo } from 'react';
import './NodeGraph.css';

// §3.5 — Abstract Node-Graph System
// Procedurally varied SVG line-graphs. Deterministic seed-driven generator.
// Tokens: --node-stroke, --node-stroke-dim, --node-fill-dot, --node-canvas-bg.

export type NodeGraphPreset = 'diverging' | 'mesh' | 'chain' | 'hub-and-spoke' | 'scatter';

export interface NodeGraphProps {
  seed?: string;
  preset?: NodeGraphPreset;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

interface Node {
  id: number;
  x: number;
  y: number;
  r: number;
  isFilled: boolean;
  label?: string;
}

interface Edge {
  from: number;
  to: number;
  curved?: boolean;
  controlX?: number;
  controlY?: number;
  dim?: boolean;
}

// Simple Mulberry32 PRNG for deterministic seed-based layout generation
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 12345;
}

export function NodeGraph({
  seed = 'contact-paths',
  preset = 'diverging',
  width = 360,
  height = 200,
  className = '',
  ariaLabel = 'Abstract network topology diagram',
}: NodeGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const prng = mulberry32(stringToSeed(seed));
    const nList: Node[] = [];
    const eList: Edge[] = [];

    if (preset === 'diverging') {
      // 1 origin node branching out to 2 target paths (Contact page §3.5 canonical visual)
      nList.push({
        id: 0,
        x: width * 0.15,
        y: height * 0.5,
        r: 8,
        isFilled: true,
        label: 'Origin',
      });
      nList.push({ id: 1, x: width * 0.5, y: height * 0.28, r: 6, isFilled: false });
      nList.push({ id: 2, x: width * 0.5, y: height * 0.72, r: 6, isFilled: false });
      nList.push({
        id: 3,
        x: width * 0.85,
        y: height * 0.22,
        r: 7,
        isFilled: true,
        label: 'Institutions',
      });
      nList.push({
        id: 4,
        x: width * 0.85,
        y: height * 0.78,
        r: 7,
        isFilled: true,
        label: 'Individuals',
      });

      // Curved upper path
      eList.push({ from: 0, to: 1, curved: true, controlX: width * 0.3, controlY: height * 0.35 });
      eList.push({ from: 1, to: 3, curved: true, controlX: width * 0.68, controlY: height * 0.2 });

      // Curved lower path
      eList.push({ from: 0, to: 2, curved: true, controlX: width * 0.3, controlY: height * 0.65 });
      eList.push({ from: 2, to: 4, curved: true, controlX: width * 0.68, controlY: height * 0.8 });

      // Subtle cross-connection
      eList.push({ from: 1, to: 2, dim: true });
    } else if (preset === 'hub-and-spoke') {
      const nodeCount = 5 + Math.floor(prng() * 3); // 5 to 7
      nList.push({ id: 0, x: width * 0.5, y: height * 0.5, r: 8, isFilled: true });
      for (let i = 1; i < nodeCount; i++) {
        const angle = ((i - 1) / (nodeCount - 1)) * Math.PI * 2;
        const dist = 50 + prng() * 30;
        const x = width * 0.5 + Math.cos(angle) * dist;
        const y = height * 0.5 + Math.sin(angle) * dist;
        nList.push({ id: i, x, y, r: 5, isFilled: prng() > 0.5 });
        eList.push({ from: 0, to: i, dim: prng() > 0.6 });
      }
    } else if (preset === 'chain') {
      const nodeCount = 4 + Math.floor(prng() * 3);
      for (let i = 0; i < nodeCount; i++) {
        const x = width * 0.15 + (i / (nodeCount - 1)) * (width * 0.7);
        const y = height * 0.5 + (prng() - 0.5) * 40;
        nList.push({
          id: i,
          x,
          y,
          r: i === 0 || i === nodeCount - 1 ? 7 : 5,
          isFilled: prng() > 0.4,
        });
        if (i > 0) {
          eList.push({ from: i - 1, to: i });
        }
      }
    } else {
      // Mesh / Scatter default
      const nodeCount = 4 + Math.floor(prng() * 3);
      for (let i = 0; i < nodeCount; i++) {
        const x = width * 0.15 + prng() * (width * 0.7);
        const y = height * 0.2 + prng() * (height * 0.6);
        nList.push({ id: i, x, y, r: 5 + Math.floor(prng() * 4), isFilled: prng() > 0.4 });
      }
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          if (prng() > 0.55) {
            eList.push({ from: i, to: j, dim: prng() > 0.5 });
          }
        }
      }
    }

    return { nodes: nList, edges: eList };
  }, [seed, preset, width, height]);

  return (
    <div className={`node-graph-wrapper ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="node-graph-svg"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Render edges */}
        {edges.map((e, idx) => {
          const start = nodes.find((n) => n.id === e.from);
          const end = nodes.find((n) => n.id === e.to);
          if (!start || !end) return null;

          const strokeColor = e.dim ? 'var(--node-stroke-dim)' : 'var(--node-stroke)';

          if (e.curved && e.controlX !== undefined && e.controlY !== undefined) {
            const pathData = `M ${start.x} ${start.y} Q ${e.controlX} ${e.controlY} ${end.x} ${end.y}`;
            return (
              <path
                key={idx}
                d={pathData}
                stroke={strokeColor}
                strokeWidth="1.5"
                fill="none"
                className="node-graph-edge"
              />
            );
          }

          return (
            <line
              key={idx}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={strokeColor}
              strokeWidth="1.5"
              className="node-graph-edge"
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((n) => (
          <g key={n.id} className="node-graph-node-group">
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="var(--node-canvas-bg)"
              stroke="var(--node-stroke)"
              strokeWidth="1.5"
            />
            {n.isFilled && (
              <circle cx={n.x} cy={n.y} r={Math.max(2.5, n.r * 0.45)} fill="var(--node-fill-dot)" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
