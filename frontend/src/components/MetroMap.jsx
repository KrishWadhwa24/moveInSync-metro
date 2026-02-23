import { useEffect, useState } from 'react';
import { getMapData } from '../services/api';

// Line layout config — tells the map HOW to draw each line
// orientation: 'vertical' or 'horizontal'
// x/y: fixed axis value, spacing: pixels between stops
const LINE_CONFIG = {
  'Yellow Line': { orientation: 'vertical',   x: 300,  startY: 40,  spacing: 40, color: '#FFD700' },
  'Blue Line':   { orientation: 'horizontal', y: 560,  startX: 900, spacing: -60, color: '#1565C0' },
  'Pink Line':   { orientation: 'horizontal', y: 200,  startX: 40,  spacing: 55,  color: '#E91E8C' },
  'Violet Line': { orientation: 'vertical',   x: 550,  startY: 40,  spacing: 40, color: '#7B1FA2' },
};

// Default config for any future lines not in config above
function defaultConfig(lineName, index) {
  return {
    orientation: index % 2 === 0 ? 'vertical' : 'horizontal',
    x: 700 + index * 120,
    y: 100 + index * 80,
    startX: 40,
    startY: 40,
    spacing: 50,
    color: '#888',
  };
}

// Build stop position map from fetched routes
function buildPositions(routes) {
  const positions = {}; // stopId → { x, y, name, code, color, lines[] }

  routes.forEach((route, routeIndex) => {
    const config = LINE_CONFIG[route.name] || defaultConfig(route.name, routeIndex);
    const color  = config.color || route.color;

    route.stops.forEach((stop, i) => {
      let x, y;
      if (config.orientation === 'vertical') {
        x = config.x;
        y = config.startY + i * config.spacing;
      } else {
        x = config.startX + i * config.spacing;
        y = config.y;
      }

      if (!positions[stop.id]) {
        positions[stop.id] = { x, y, name: stop.name, code: stop.code, lines: [] };
      }
      // A stop that already exists (interchange) keeps its first position
      positions[stop.id].lines.push({ routeName: route.name, color });
    });
  });

  return positions;
}

export default function MetroMap({ path }) {
  const [routes, setRoutes]       = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getMapData()
      .then((res) => {
        const fetched = res.data.routes;
        setRoutes(fetched);
        setPositions(buildPositions(fetched));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build path sets from the selected route
  const pathStopIds      = new Set();
  const interchangeIds   = new Set();
  const pathLineNames    = new Set();

  if (path && path.segments) {
    path.segments.forEach((seg, idx) => {
      pathLineNames.add(seg.line);
      seg.stops.forEach(s => pathStopIds.add(s.id));
      if (idx < path.segments.length - 1) {
        const last = seg.stops[seg.stops.length - 1];
        if (last) interchangeIds.add(last.id);
      }
    });
  }

  const hasPath = pathStopIds.size > 0;

  // Get display color for a stop circle
  const getStopColor = (stopId, defaultColor) => {
    if (interchangeIds.has(stopId)) return '#FF8C00';
    if (!hasPath) return defaultColor;
    if (pathStopIds.has(stopId)) return defaultColor;
    return '#1e1e1e';
  };

  // Get edge color between two stops on a line
  const getEdgeColor = (fromId, toId, lineColor, lineName) => {
    if (!hasPath) return lineColor;
    if (!pathLineNames.has(lineName)) return '#1e1e1e';
    if (pathStopIds.has(fromId) && pathStopIds.has(toId)) return lineColor;
    return '#1e1e1e';
  };

  const getStopRadius = (stopId) => {
    const pos = positions[stopId];
    const isInterchange = pos?.lines?.length > 1;
    if (interchangeIds.has(stopId)) return 10;
    if (isInterchange) return 8;
    if (!hasPath || pathStopIds.has(stopId)) return 5;
    return 3;
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loading}>Loading metro map...</div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>🚇 Delhi Metro Network</span>
        <div style={styles.legend}>
          {routes.map(r => (
            <span key={r.id} style={styles.legendItem}>
              <span style={{ ...styles.ldot, background: (LINE_CONFIG[r.name]?.color || r.color) }} />
              {r.name}
            </span>
          ))}
          {hasPath && (
            <span style={styles.legendItem}>
              <span style={{ ...styles.ldot, background: '#FF8C00' }} /> Interchange
            </span>
          )}
        </div>
      </div>

      {/* SVG Map */}
      <div style={styles.mapScroll}>
        <svg
          viewBox="-60 0 1200 1400"
          style={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Draw edges for each route ── */}
          {routes.map((route) => {
            const color = LINE_CONFIG[route.name]?.color || route.color;
            return route.stops.slice(0, -1).map((stop, i) => {
              const next   = route.stops[i + 1];
              const fromPos = positions[stop.id];
              const toPos   = positions[next.id];
              if (!fromPos || !toPos) return null;

              const edgeColor = getEdgeColor(stop.id, next.id, color, route.name);
              const isActive  = hasPath && pathStopIds.has(stop.id) && pathStopIds.has(next.id);

              return (
                <line
                  key={`${route.id}-edge-${i}`}
                  x1={fromPos.x} y1={fromPos.y}
                  x2={toPos.x}   y2={toPos.y}
                  stroke={edgeColor}
                  strokeWidth={isActive ? 5 : hasPath ? 2 : 3}
                  opacity={!hasPath || isActive ? 1 : 0.3}
                />
              );
            });
          })}

          {/* ── Draw stops and labels ── */}
          {Object.entries(positions).map(([stopId, pos]) => {
            const isInterchange = pos.lines.length > 1;
            const isOnPath      = pathStopIds.has(stopId);
            const isInter       = interchangeIds.has(stopId);
            const primaryColor  = pos.lines[0]?.color || '#888';
            const displayColor  = getStopColor(stopId, primaryColor);
            const radius        = getStopRadius(stopId);
            const showLabel     = !hasPath || isOnPath || isInter || isInterchange;

            // Determine label rotation based on line orientation
            const lineName    = pos.lines[0]?.routeName;
            const lineConfig  = LINE_CONFIG[lineName];
            const isVertLine  = lineConfig?.orientation === 'vertical';

            return (
              <g key={stopId}>
                {/* Glow for active stops */}
                {(isOnPath || !hasPath) && (
                  <circle cx={pos.x} cy={pos.y} r={radius + 5}
                    fill={displayColor} opacity={0.12} />
                )}

                {/* Interchange diamond shape */}
                {isInterchange ? (
                  <rect
                    x={pos.x - radius} y={pos.y - radius}
                    width={radius * 2} height={radius * 2}
                    fill={isInter ? '#FF8C00' : !hasPath ? '#FF8C00' : isOnPath ? '#FF8C00' : '#1e1e1e'}
                    stroke="#0a0a0a" strokeWidth={2}
                    transform={`rotate(45, ${pos.x}, ${pos.y})`}
                  />
                ) : (
                  <circle
                    cx={pos.x} cy={pos.y} r={radius}
                    fill={displayColor}
                    stroke="#0a0a0a" strokeWidth={1.5}
                  />
                )}

                {/* Station name label */}
                {showLabel && (
                  <text
                    x={isVertLine ? pos.x + 14 : pos.x}
                    y={isVertLine ? pos.y + 4  : pos.y + 16}
                    fill={isOnPath || isInter || !hasPath ? displayColor : '#2a2a2a'}
                    fontSize={isInterchange || isOnPath ? 10 : 9}
                    fontWeight={isInterchange || isOnPath || isInter ? '700' : '400'}
                    textAnchor={isVertLine ? 'start' : 'middle'}
                    transform={
                      isVertLine
                        ? `rotate(-55, ${pos.x + 14}, ${pos.y + 4})`
                        : `rotate(90, ${pos.x}, ${pos.y + 16})`
                    }
                    fontFamily="'Segoe UI', sans-serif"
                  >
                    {pos.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Line name labels ── */}
          {routes.map((route) => {
            const config = LINE_CONFIG[route.name];
            if (!config) return null;
            const color  = config.color || route.color;
            const dimmed = hasPath && !pathLineNames.has(route.name);
            if (config.orientation === 'vertical') {
              return (
                <text key={route.id}
                  x={config.x + 15} y={20}
                  fill={dimmed ? '#2a2a2a' : color}
                  fontSize={12} fontWeight="800"
                  fontFamily="'Segoe UI', sans-serif"
                >
                  {route.name.toUpperCase()} ↓
                </text>
              );
            } else {
              const lastStop = route.stops[route.stops.length - 1];
              const lastPos  = lastStop ? positions[lastStop.id] : null;
              if (!lastPos) return null;
              return (
                <text key={route.id}
                  x={lastPos.x + 10} y={config.y + 5}
                  fill={dimmed ? '#2a2a2a' : color}
                  fontSize={12} fontWeight="800"
                  fontFamily="'Segoe UI', sans-serif"
                >
                  {route.name.toUpperCase()} →
                </text>
              );
            }
          })}
        </svg>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    background: '#0a0a0a',
    borderRadius: 12,
    border: '1px solid #222',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    color: '#666', textAlign: 'center',
    padding: 40, fontSize: 14,
  },
  header: {
    padding: '14px 20px',
    background: '#111',
    borderBottom: '1px solid #222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    flexShrink: 0,
  },
  title: { color: '#fff', fontWeight: 700, fontSize: 15 },
  legend: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12 },
  ldot: { display: 'inline-block', width: 10, height: 10, borderRadius: '50%' },
  mapScroll: {
    flex: 1,
    overflow: 'auto',        // scroll if needed
    padding: '8px',
  },
  svg: {
    display: 'block',
    width: '100%',           // fills available width
    height: 'auto',          // scales height proportionally
    maxHeight: '75vh',       // never taller than 75% of screen
  },
};