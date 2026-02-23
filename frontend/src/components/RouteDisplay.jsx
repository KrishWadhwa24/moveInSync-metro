export default function RouteDisplay({ path, source, destination }) {
  if (!path || !path.segments) return null;

  return (
    <div style={styles.container}>
      {/* Summary bar */}
      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{path.totalStops}</span>
          <span style={styles.summaryLabel}>Stops</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{path.totalTime} min</span>
          <span style={styles.summaryLabel}>Duration</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryValue}>{path.transfers}</span>
          <span style={styles.summaryLabel}>Interchange{path.transfers !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Route segments */}
      <div style={styles.segments}>
        {path.segments.map((segment, segIdx) => (
          <div key={segIdx}>
            {/* Line header */}
            <div style={styles.lineHeader}>
              <div style={{ ...styles.lineDot, background: segment.color }} />
              <span style={{ ...styles.lineName, color: segment.color }}>{segment.line}</span>
              <span style={styles.stopCount}>{segment.stops.length} stops</span>
            </div>

            {/* Stops list */}
            <div style={styles.stopsList}>
              {segment.stops.map((stop, stopIdx) => {
                const isFirst = stopIdx === 0;
                const isLast = stopIdx === segment.stops.length - 1;
                const isInterchange = isLast && segIdx < path.segments.length - 1;
                const isStart = segIdx === 0 && isFirst;
                const isEnd = segIdx === path.segments.length - 1 && isLast;

                return (
                  <div key={stop.id} style={styles.stopRow}>
                    {/* Connector line + dot */}
                    <div style={styles.connector}>
                      <div style={{
                        ...styles.connectorLine,
                        background: isLast ? 'transparent' : segment.color,
                        opacity: 0.4,
                      }} />
                      <div style={{
                        ...styles.stopDot,
                        background: isInterchange ? '#FF8C00'
                          : isStart || isEnd ? '#fff'
                          : segment.color,
                        width: isStart || isEnd || isInterchange ? 14 : 10,
                        height: isStart || isEnd || isInterchange ? 14 : 10,
                        border: isStart || isEnd ? '2px solid #fff' : 'none',
                      }} />
                    </div>

                    {/* Stop info */}
                    <div style={styles.stopInfo}>
                      <span style={{
                        ...styles.stopName,
                        color: isInterchange ? '#FF8C00'
                          : isStart || isEnd ? '#fff'
                          : '#bbb',
                        fontWeight: isStart || isEnd || isInterchange ? 700 : 400,
                      }}>
                        {stop.name}
                      </span>
                      <span style={styles.stopCode}>{stop.code}</span>
                      {isInterchange && (
                        <span style={styles.interchangeBadge}>↔ Interchange</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transfer indicator between segments */}
            {segIdx < path.segments.length - 1 && (
              <div style={styles.transferRow}>
                <div style={styles.transferIcon}>⇄</div>
                <span style={styles.transferText}>
                  Change to {path.segments[segIdx + 1].line}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#161616',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #2a2a2a',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '16px 24px',
    background: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
  },
  summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  summaryValue: { color: '#FFD700', fontSize: 20, fontWeight: 700 },
  summaryLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  divider: { width: 1, height: 32, background: '#2a2a2a' },
  segments: { padding: '16px 24px' },
  lineHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  lineDot: { width: 12, height: 12, borderRadius: '50%' },
  lineName: { fontWeight: 700, fontSize: 14 },
  stopCount: { color: '#555', fontSize: 12, marginLeft: 'auto' },
  stopsList: { paddingLeft: 6, marginBottom: 8 },
  stopRow: { display: 'flex', alignItems: 'flex-start', gap: 14, minHeight: 36 },
  connector: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, paddingTop: 4 },
  connectorLine: { width: 2, flex: 1, minHeight: 20 },
  stopDot: { borderRadius: '50%', flexShrink: 0 },
  stopInfo: { display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, flex: 1 },
  stopName: { fontSize: 13 },
  stopCode: { color: '#444', fontSize: 11, fontFamily: 'monospace' },
  interchangeBadge: {
    background: '#2a1800',
    color: '#FF8C00',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 600,
  },
  transferRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0 10px 6px',
    borderTop: '1px dashed #2a2a2a',
    borderBottom: '1px dashed #2a2a2a',
    margin: '4px 0 16px',
  },
  transferIcon: { fontSize: 18, color: '#FF8C00' },
  transferText: { color: '#FF8C00', fontSize: 13, fontWeight: 600 },
};