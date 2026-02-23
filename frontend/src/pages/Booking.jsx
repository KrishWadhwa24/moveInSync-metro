import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getBooking } from '../services/api';

export default function Booking() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(state?.booking || null);
  const [loading, setLoading] = useState(!state?.booking);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!state?.booking) {
      getBooking(id)
        .then((res) => setBooking(res.data.booking))
        .catch(() => setError('Booking not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const copyQR = () => {
    navigator.clipboard.writeText(booking.qr_string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={styles.center}><p style={{ color: '#888' }}>Loading...</p></div>;
  if (error)   return <div style={styles.center}><p style={{ color: '#ff6666' }}>{error}</p></div>;
  if (!booking) return null;

  const path = booking.route_path;

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.nav}>
        <button onClick={() => navigate('/search')} style={styles.backBtn}>← Back to Search</button>
        <span style={styles.navTitle}>Booking Confirmed</span>
        <div />
      </div>

      <div style={styles.body}>
        {/* Left: Ticket */}
        <div style={styles.ticketWrapper}>
          <div style={styles.ticket}>
            {/* Ticket header */}
            <div style={styles.ticketHeader}>
              <div style={styles.ticketLogo}>M</div>
              <div>
                <div style={styles.ticketTitle}>Delhi Metro</div>
                <div style={styles.ticketSub}>E-Ticket</div>
              </div>
              <div style={styles.statusBadge}>{booking.status?.toUpperCase()}</div>
            </div>

            <div style={styles.ticketDivider} />

            {/* Journey info */}
            <div style={styles.journey}>
              <div style={styles.journeyStop}>
                <div style={styles.stopLabel}>FROM</div>
                <div style={styles.stopName}>{booking.source?.name || booking.source_name}</div>
                <div style={styles.stopCode}>{booking.source?.code || booking.source_code}</div>
              </div>
              <div style={styles.journeyArrow}>→</div>
              <div style={styles.journeyStop}>
                <div style={styles.stopLabel}>TO</div>
                <div style={styles.stopName}>{booking.destination?.name || booking.dest_name}</div>
                <div style={styles.stopCode}>{booking.destination?.code || booking.dest_code}</div>
              </div>
            </div>

            <div style={styles.ticketDivider} />

            {/* Stats */}
            <div style={styles.stats}>
              <div style={styles.stat}>
                <div style={styles.statVal}>{booking.total_stops}</div>
                <div style={styles.statLabel}>Stops</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statVal}>{booking.total_time} min</div>
                <div style={styles.statLabel}>Duration</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statVal}>{booking.transfers}</div>
                <div style={styles.statLabel}>Transfers</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statVal}>{booking.strategy === 'fastest' ? '⚡' : '↔'}</div>
                <div style={styles.statLabel}>{booking.optimization_strategy || booking.strategy}</div>
              </div>
            </div>

            {/* Dotted divider (ticket tear line) */}
            <div style={styles.tearLine}>
              <div style={styles.tearCircleLeft} />
              <div style={styles.tearDots} />
              <div style={styles.tearCircleRight} />
            </div>

            {/* QR Section */}
            <div style={styles.qrSection}>
              <div style={styles.qrLabel}>QR Code String</div>
              <div style={styles.qrBox}>
                <code style={styles.qrCode}>{booking.qr_string}</code>
              </div>
              <button onClick={copyQR} style={styles.copyBtn}>
                {copied ? '✓ Copied!' : 'Copy QR String'}
              </button>
              <p style={styles.qrNote}>This string can be scanned or validated at metro gates</p>
            </div>

            <div style={styles.bookingId}>
              Booking ID: {booking.id}
            </div>
          </div>
        </div>

        {/* Right: Route breakdown */}
        <div style={styles.routePanel}>
          <h3 style={styles.routeTitle}>Journey Breakdown</h3>
          {path?.segments?.map((seg, idx) => (
            <div key={idx} style={styles.segment}>
              <div style={styles.segHeader}>
                <div style={{ ...styles.segDot, background: seg.color }} />
                <span style={{ ...styles.segLine, color: seg.color }}>{seg.line}</span>
                <span style={styles.segStops}>{seg.stops.length} stops</span>
              </div>
              <div style={styles.segStopList}>
                {seg.stops.map((stop, si) => (
                  <div key={stop.id} style={styles.segStop}>
                    <div style={{ ...styles.segStopDot, background: si === 0 || si === seg.stops.length - 1 ? seg.color : '#333' }} />
                    <span style={{ color: si === 0 || si === seg.stops.length - 1 ? '#fff' : '#666', fontSize: 13 }}>
                      {stop.name}
                    </span>
                  </div>
                ))}
              </div>
              {idx < path.segments.length - 1 && (
                <div style={styles.transferNote}>
                  ⇄ Interchange to {path.segments[idx + 1].line}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Segoe UI', sans-serif" },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px', background: '#111', borderBottom: '1px solid #222',
  },
  backBtn: {
    background: 'transparent', border: '1px solid #333', color: '#888',
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
  },
  navTitle: { color: '#fff', fontWeight: 700, fontSize: 16 },
  body: { display: 'flex', gap: 0, minHeight: 'calc(100vh - 57px)' },
  ticketWrapper: {
    width: 420, padding: 28, background: '#0f0f0f',
    borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column',
  },
  ticket: {
    background: '#161616', borderRadius: 16,
    border: '1px solid #2a2a2a', overflow: 'hidden',
  },
  ticketHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 24px', background: '#1a1a1a',
  },
  ticketLogo: {
    width: 40, height: 40, background: '#FFD700', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontSize: 20, color: '#0a0a0a',
  },
  ticketTitle: { color: '#fff', fontWeight: 700, fontSize: 16 },
  ticketSub: { color: '#666', fontSize: 12 },
  statusBadge: {
    marginLeft: 'auto', background: '#0a2a0a', color: '#00e676',
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  },
  ticketDivider: { height: 1, background: '#222', margin: '0 24px' },
  journey: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', gap: 12,
  },
  journeyStop: { flex: 1 },
  stopLabel: { color: '#555', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  stopName: { color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 2 },
  stopCode: { color: '#FFD700', fontSize: 12, fontFamily: 'monospace' },
  journeyArrow: { color: '#FFD700', fontSize: 22, flexShrink: 0 },
  stats: { display: 'flex', justifyContent: 'space-around', padding: '16px 24px' },
  stat: { textAlign: 'center' },
  statVal: { color: '#FFD700', fontWeight: 700, fontSize: 18 },
  statLabel: { color: '#555', fontSize: 10, textTransform: 'uppercase', marginTop: 2 },
  tearLine: {
    display: 'flex', alignItems: 'center', margin: '0',
    position: 'relative',
  },
  tearCircleLeft: {
    width: 20, height: 20, borderRadius: '50%',
    background: '#0a0a0a', marginLeft: -10, flexShrink: 0,
  },
  tearCircleRight: {
    width: 20, height: 20, borderRadius: '50%',
    background: '#0a0a0a', marginRight: -10, flexShrink: 0,
  },
  tearDots: {
    flex: 1, borderTop: '2px dashed #2a2a2a',
  },
  qrSection: { padding: '20px 24px', textAlign: 'center' },
  qrLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  qrBox: {
    background: '#0f0f0f', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '12px', marginBottom: 12, wordBreak: 'break-all',
  },
  qrCode: { color: '#00e676', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6 },
  copyBtn: {
    padding: '8px 20px', background: '#1a1a1a', border: '1px solid #333',
    borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 13, marginBottom: 8,
  },
  qrNote: { color: '#444', fontSize: 11, margin: 0 },
  bookingId: { color: '#333', fontSize: 10, textAlign: 'center', padding: '12px 24px', fontFamily: 'monospace' },
  routePanel: { flex: 1, padding: 28, overflowY: 'auto' },
  routeTitle: { color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 20px' },
  segment: { marginBottom: 24 },
  segHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  segDot: { width: 12, height: 12, borderRadius: '50%' },
  segLine: { fontWeight: 700, fontSize: 14 },
  segStops: { color: '#555', fontSize: 12, marginLeft: 'auto' },
  segStopList: { paddingLeft: 22, borderLeft: '2px solid #222' },
  segStop: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' },
  segStopDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  transferNote: {
    color: '#FF8C00', fontSize: 13, fontWeight: 600,
    padding: '8px 0 0 22px',
  },
};