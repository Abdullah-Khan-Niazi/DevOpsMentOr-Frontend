import { useMemo, useState } from 'react';
import type { CountryDistributionDto } from '../types';
import { WORLD_COUNTRIES, WORLD_MAP_VIEWBOX } from './worldMapData';

interface RegionalMapProps {
  countries: CountryDistributionDto[];
  className?: string;
}

type MapRegion = 'ALL' | 'ASIA' | 'EUROPE' | 'AMERICAS' | 'OCEANIA';

const REGION_VIEWBOXES: Record<MapRegion, string> = {
  ALL: WORLD_MAP_VIEWBOX, // 30.767 241.591 784.077 458.627
  ASIA: '470 300 320 280',
  EUROPE: '360 270 200 190',
  AMERICAS: '50 250 360 420',
  OCEANIA: '620 440 200 240',
};

// Universal dynamic ISO 3166-1 country name resolution via Intl.DisplayNames (no hardcoding)
const regionNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export function getCountryName(countryCode: string): string {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
}

export function RegionalMap({ countries, className = '' }: RegionalMapProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MapRegion>('ALL');
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);

  const totalUsers = useMemo(
    () => countries.reduce((sum, c) => sum + c.userCount, 0),
    [countries],
  );

  const maxUsers = useMemo(
    () => Math.max(...countries.map((c) => c.userCount), 1),
    [countries],
  );

  const countryStatsMap = useMemo(() => {
    const map = new Map<string, CountryDistributionDto>();
    for (const c of countries) {
      map.set(c.countryCode.toUpperCase(), c);
    }
    return map;
  }, [countries]);

  const hoveredCountry = hoveredCode
    ? countryStatsMap.get(hoveredCode) ?? {
        countryCode: hoveredCode,
        countryName: getCountryName(hoveredCode),
        userCount: 0,
      }
    : null;

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}>
      {/* Map Header with Real Geographic Choropleth status & Viewbox Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-accent animate-pulse" />
          <span className="font-semibold text-card-foreground uppercase text-[11px]">
            Regional Distribution
          </span>
        </div>

        {/* Region Viewport Filters */}
        <div className="flex items-center gap-1 border border-border p-0.5 bg-surface text-[11px]">
          {(['ALL', 'ASIA', 'EUROPE', 'AMERICAS', 'OCEANIA'] as const).map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setSelectedRegion(reg)}
              className={`px-2 py-0.5 transition-colors cursor-pointer ${
                selectedRegion === reg
                  ? 'bg-accent text-accent-foreground font-bold'
                  : 'text-muted hover:text-card-foreground'
              }`}
              style={{ borderRadius: 0 }}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Actual Vector World Map SVG Canvas */}
      <div
        className="relative w-full border border-border bg-surface/80 p-3 overflow-hidden select-none"
        style={{ borderRadius: 0 }}
      >
        <div
          className="relative w-full aspect-[784/458]"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMouseCoords({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
          onMouseLeave={() => {
            setHoveredCode(null);
            setMouseCoords(null);
          }}
        >
          <svg
            viewBox={REGION_VIEWBOXES[selectedRegion]}
            className="w-full h-full overflow-hidden transition-all duration-300"
            aria-label="Real Vector World Choropleth Map"
          >
            <defs>
              {/* Subtle technical lat/long grid pattern */}
              <pattern id="world-carto-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path
                  d="M 30 0 L 0 0 0 30"
                  fill="none"
                  stroke="var(--color-border-subtle)"
                  strokeWidth="0.4"
                  strokeOpacity="0.5"
                />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect x="0" y="200" width="1000" height="600" fill="url(#world-carto-grid)" />

            {/* Latitude Equator reference line */}
            <line
              x1="0"
              y1="470"
              x2="900"
              y2="470"
              stroke="var(--color-border-default)"
              strokeWidth="0.5"
              strokeDasharray="3 3"
              strokeOpacity="0.6"
            />

            {/* All 180 Real Sovereign Geometries from ISO 3166-1 Database */}
            <g className="transition-all duration-150">
              {WORLD_COUNTRIES.map((c) => {
                const code = c.id.toUpperCase();
                const stat = countryStatsMap.get(code);
                const hasUsers = Boolean(stat && stat.userCount > 0);
                const userCount = stat?.userCount ?? 0;
                const ratio = userCount / maxUsers;
                const isHovered = hoveredCode === code;

                // Authentic choropleth coloring: darker/more saturated for higher learner counts
                let fill = 'var(--color-bg-sunken, #17191e)';
                let fillOpacity = 1;

                if (hasUsers) {
                  fill = 'var(--color-accent-500)';
                  // Darker/higher opacity with more learners
                  fillOpacity = Math.min(1, 0.4 + ratio * 0.6);
                }

                if (isHovered) {
                  fill = hasUsers ? 'var(--color-accent-400)' : 'var(--color-surface-hover, #23272e)';
                  fillOpacity = 1;
                }

                return (
                  <g
                    key={c.id}
                    id={`country-${c.id}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCode(code)}
                    onMouseLeave={() => setHoveredCode(null)}
                  >
                    {c.paths.map((p, pIdx) => (
                      <path
                        key={pIdx}
                        d={p}
                        fill={fill}
                        fillOpacity={fillOpacity}
                        stroke={
                          isHovered
                            ? 'var(--color-accent-400)'
                            : hasUsers
                              ? 'var(--color-border-strong)'
                              : 'var(--color-border-subtle)'
                        }
                        strokeWidth={isHovered ? 1.4 : hasUsers ? 0.8 : 0.4}
                        strokeLinejoin="round"
                        className="transition-all duration-100"
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Contextual Tooltip - Dynamically Anchored Near Mouse Cursor */}
          {hoveredCountry && (
            <div
              className="absolute bg-surface border border-accent p-3 shadow-2xl font-mono text-xs z-30 pointer-events-none transition-all duration-75"
              style={{
                borderRadius: 0,
                left: mouseCoords
                  ? mouseCoords.x > 480
                    ? `${Math.max(10, mouseCoords.x - 250)}px`
                    : `${mouseCoords.x + 16}px`
                  : 'auto',
                right: mouseCoords ? 'auto' : '12px',
                top: mouseCoords
                  ? mouseCoords.y > 300
                    ? `${Math.max(10, mouseCoords.y - 130)}px`
                    : `${mouseCoords.y + 16}px`
                  : '12px',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-border/60">
                <span className="px-1.5 py-0.5 bg-accent text-accent-foreground font-bold text-[10px]">
                  {hoveredCountry.countryCode}
                </span>
                <span className="font-semibold text-card-foreground">
                  {hoveredCountry.countryName}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between gap-6 text-muted">
                  <span>Enrolled Learners:</span>
                  <span className="font-bold text-card-foreground">
                    {hoveredCountry.userCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6 text-muted">
                  <span>Global Userbase Share:</span>
                  <span className="font-bold text-accent">
                    {Math.round((hoveredCountry.userCount / Math.max(totalUsers, 1)) * 1000) / 10}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6 text-muted">
                  <span>Density Tier:</span>
                  <span className="text-card-foreground">
                    {hoveredCountry.userCount > 0
                      ? hoveredCountry.userCount >= maxUsers * 0.7
                        ? 'High Density Tier 1'
                        : hoveredCountry.userCount >= maxUsers * 0.3
                          ? 'Active Tier 2'
                          : 'Emerging Tier 3'
                      : 'Zero Enrolled Accounts'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Map Choropleth Legend (Lower Left Corner) */}
          <div
            className="absolute bottom-3 left-3 bg-surface/90 border border-border p-2 font-mono text-[10px] text-muted flex items-center gap-2"
            style={{ borderRadius: 0 }}
          >
            <span>Fewer Learners</span>
            <div className="flex items-center gap-0.5">
              <span className="w-3 h-2 bg-surface-hover border border-border" />
              <span className="w-3 h-2 bg-accent/40" />
              <span className="w-3 h-2 bg-accent/70" />
              <span className="w-3 h-2 bg-accent" />
            </div>
            <span>Darker = More Users</span>
          </div>
        </div>
      </div>

      {/* Ranked Country Breakdown Matrix with Microinteractions */}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 text-xs font-mono">
        {countries.map((c) => {
          const code = c.countryCode.toUpperCase();
          const pct = Math.round((c.userCount / Math.max(totalUsers, 1)) * 1000) / 10;
          const isHovered = hoveredCode === code;

          return (
            <div
              key={c.countryCode}
              className={`p-2.5 border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-1.5 ${
                isHovered
                  ? 'border-accent bg-accent/15 -translate-y-0.5'
                  : 'border-border bg-surface/40 hover:bg-surface/80 hover:border-card-foreground'
              }`}
              style={{ borderRadius: 0 }}
              onMouseEnter={() => setHoveredCode(code)}
              onMouseLeave={() => setHoveredCode(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="px-1 py-0.5 border border-border bg-surface text-[10px] font-bold"
                    style={{ borderRadius: 0 }}
                  >
                    {c.countryCode}
                  </span>
                  <span className="text-card-foreground font-medium truncate text-[11px]">
                    {c.countryName || getCountryName(c.countryCode)}
                  </span>
                </div>
                <span className="font-bold text-card-foreground text-[11px] shrink-0">
                  {c.userCount.toLocaleString()}
                </span>
              </div>

              {/* Proportional Segmented Progress Gauge */}
              <div className="w-full h-1 bg-border-subtle overflow-hidden mt-0.5">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.round((c.userCount / maxUsers) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>Platform Share</span>
                <span className="text-accent">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RegionalMap;
