import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStops, createStop, createRoute, getMapData } from '../services/api';

export default function Admin() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Redirect non-admins
  useEffect(() => {
    if (user.role !== 'admin') navigate('/search');
  }, []);

  const [activeTab, setActiveTab] = useState('stops'); // 'stops' | 'routes' | 'lines'
  const [mapData, setMapData] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);

  // ── Stop form state ──
  const [stopForm, setStopForm] = useState({ name: '', code: '' });
  const [stopMsg, setStopMsg]   = useState({ text: '', error: false });
  const [stopLoading, setStopLoading] = useState(false);

  // ── Route form state ──
  const [allStops, setAllStops]       = useState([]);
  const [routeForm, setRouteForm]     = useState({ name: '', color: '#FFD700' });
  const [routeStops, setRouteStops]   = useState([{ stop_id: '', travel_time_to_next: 3 }]);
  const [routeMsg, setRouteMsg]       = useState({ text: '', error: false });
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    getAllStops().then(res => setAllStops(res.data.stops)).catch(() => {});
    getMapData().then(res => setMapData(res.data.routes)).catch(() => {});
  }, []);

  // ── Add Stop ──
  const handleAddStop = async (e) => {
    e.preventDefault();
    setStopMsg({ text: '', error: false });
    if (!stopForm.name || !stopForm.code) return setStopMsg({ text: 'Both fields are required', error: true });
    setStopLoading(true);
    try {
      await createStop(stopForm);
      setStopMsg({ text: `✅ Stop "${stopForm.name}" added successfully!`, error: false });
      setStopForm({ name: '', code: '' });
      const res = await getAllStops();
      setAllStops(res.data.stops);
    } catch (err) {
      setStopMsg({ text: err.response?.data?.message || 'Failed to add stop', error: true });
    } finally {
      setStopLoading(false);
    }
  };

  // ── Route stops management ──
  const addRouteStop = () =>
    setRouteStops([...routeStops, { stop_id: '', travel_time_to_next: 3 }]);

  const removeRouteStop = (index) =>
    setRouteStops(routeStops.filter((_, i) => i !== index));

  const updateRouteStop = (index, field, value) => {
    const updated = [...routeStops];
    updated[index][field] = value;
    setRouteStops(updated);
  };

  // ── Add Route ──
  const handleAddRoute = async (e) => {
    e.preventDefault();
    setRouteMsg({ text: '', error: false });

    if (!routeForm.name || !routeForm.color) return setRouteMsg({ text: 'Route name and color are required', error: true });
    if (routeStops.length < 2) return setRouteMsg({ text: 'At least 2 stops are required', error: true });
    if (routeStops.some(s => !s.stop_id)) return setRouteMsg({ text: 'Please select all stops', error: true });

    const stopsPayload = routeStops.map((s, i) => ({
      stop_id: s.stop_id,
      stop_order: i + 1,
      travel_time_to_next: i < routeStops.length - 1 ? parseInt(s.travel_time_to_next) : null,
    }));

    setRouteLoading(true);
    try {
      await createRoute({ ...routeForm, stops: stopsPayload });
      setRouteMsg({ text: `✅ Route "${routeForm.name}" created successfully!`, error: false });
      setRouteForm({ name: '', color: '#FFD700' });
      setRouteStops([{ stop_id: '', travel_time_to_next: 3 }]);
      // Refresh map data so new route appears in View Lines
      const res = await getMapData();
      setMapData(res.data.routes);
    } catch (err) {
      setRouteMsg({ text: err.response?.data?.message || 'Failed to create route', error: true });
    } finally {
      setRouteLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const LINE_COLORS = [
    { label: 'Yellow', value: '#FFD700' },
    { label: 'Blue',   value: '#1565C0' },
    { label: 'Pink',   value: '#E91E8C' },
    { label: 'Violet', value: '#7B1FA2' },
    { label: 'Red',    value: '#e53935' },
    { label: 'Green',  value: '#43a047' },
    { label: 'Orange', value: '#FF6D00' },
    { label: 'Magenta',value: '#AD1457' },
  ];

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <div style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.navLogo}>M</div>
          <span style={styles.navTitle}>MetroBook</span>
          <span style={styles.adminBadge}>Admin Panel</span>
        </div>
        <div style={styles.navRight}>
          <button onClick={() => navigate('/search')} style={styles.navBtn}>← Back to Search</button>
          <button onClick={handleLogout} style={styles.navBtn}>Logout</button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('stops')}
            style={{ ...styles.tab, ...(activeTab === 'stops' ? styles.tabActive : {}) }}
          >
            + Add Stop
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            style={{ ...styles.tab, ...(activeTab === 'routes' ? styles.tabActive : {}) }}
          >
            + Add Route
          </button>
          <button
            onClick={() => setActiveTab('lines')}
            style={{ ...styles.tab, ...(activeTab === 'lines' ? styles.tabActive : {}) }}
          >
            🚇 View Lines
          </button>
        </div>

        <div style={styles.content}>

          {/* ── Add Stop Tab ── */}
          {activeTab === 'stops' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Add New Stop</h2>
              <p style={styles.cardDesc}>Add a new metro station to the network. The graph will automatically rebuild after adding.</p>

              <form onSubmit={handleAddStop} style={styles.form}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Station Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Connaught Place"
                      value={stopForm.name}
                      onChange={e => setStopForm({ ...stopForm, name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Station Code</label>
                    <input
                      type="text"
                      placeholder="e.g. YL14"
                      value={stopForm.code}
                      onChange={e => setStopForm({ ...stopForm, code: e.target.value.toUpperCase() })}
                      style={styles.input}
                      maxLength={6}
                    />
                    <span style={styles.hint}>Unique code, max 6 characters</span>
                  </div>
                </div>

                {stopMsg.text && (
                  <div style={{ ...styles.msg, ...(stopMsg.error ? styles.msgError : styles.msgSuccess) }}>
                    {stopMsg.text}
                  </div>
                )}

                <button type="submit" style={styles.btn} disabled={stopLoading}>
                  {stopLoading ? 'Adding...' : 'Add Stop'}
                </button>
              </form>

              {/* Existing stops list */}
              <div style={styles.existingSection}>
                <h3 style={styles.existingTitle}>Existing Stops ({allStops.length})</h3>
                <div style={styles.stopGrid}>
                  {allStops.map(s => (
                    <div key={s.id} style={styles.stopChip}>
                      <span style={styles.chipCode}>{s.code}</span>
                      <span style={styles.chipName}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Add Route Tab ── */}
          {activeTab === 'routes' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Add New Route</h2>
              <p style={styles.cardDesc}>Create a new metro line. Select stops in order and set travel time between each consecutive stop.</p>

              <form onSubmit={handleAddRoute} style={styles.form}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Route Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Green Line"
                      value={routeForm.name}
                      onChange={e => setRouteForm({ ...routeForm, name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Line Color</label>
                    <div style={styles.colorRow}>
                      {LINE_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setRouteForm({ ...routeForm, color: c.value })}
                          style={{
                            ...styles.colorBtn,
                            background: c.value,
                            border: routeForm.color === c.value ? '3px solid #fff' : '3px solid transparent',
                          }}
                          title={c.label}
                        />
                      ))}
                      <input
                        type="color"
                        value={routeForm.color}
                        onChange={e => setRouteForm({ ...routeForm, color: e.target.value })}
                        style={styles.colorPicker}
                        title="Custom color"
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <div style={{ width: 40, height: 6, background: routeForm.color, borderRadius: 3 }} />
                      <span style={{ color: '#888', fontSize: 12 }}>{routeForm.color}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Stops (in order)</label>
                  <div style={styles.stopsList}>
                    {routeStops.map((rs, index) => (
                      <div key={index} style={styles.stopRow}>
                        <div style={styles.stopNumber}>{index + 1}</div>
                        <select
                          value={rs.stop_id}
                          onChange={e => updateRouteStop(index, 'stop_id', e.target.value)}
                          style={styles.stopSelect}
                        >
                          <option value="">Select stop...</option>
                          {allStops.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                        {index < routeStops.length - 1 && (
                          <div style={styles.timeField}>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={rs.travel_time_to_next}
                              onChange={e => updateRouteStop(index, 'travel_time_to_next', e.target.value)}
                              style={styles.timeInput}
                            />
                            <span style={styles.timeLabel}>min</span>
                          </div>
                        )}
                        {index === routeStops.length - 1 && (
                          <span style={styles.lastStopLabel}>Last Stop</span>
                        )}
                        {routeStops.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeRouteStop(index)}
                            style={styles.removeBtn}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addRouteStop} style={styles.addStopBtn}>
                    + Add Stop to Route
                  </button>
                </div>

                {routeMsg.text && (
                  <div style={{ ...styles.msg, ...(routeMsg.error ? styles.msgError : styles.msgSuccess) }}>
                    {routeMsg.text}
                  </div>
                )}

                <button type="submit" style={styles.btn} disabled={routeLoading}>
                  {routeLoading ? 'Creating...' : 'Create Route'}
                </button>
              </form>
            </div>
          )}

          {/* ── View Lines Tab ── */}
          {activeTab === 'lines' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Metro Lines</h2>
              <p style={styles.cardDesc}>Select a line to view all its stations in order.</p>

              {/* Line selector buttons */}
              <div style={styles.lineButtons}>
                {mapData.map(route => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedLine(selectedLine?.id === route.id ? null : route)}
                    style={{
                      ...styles.lineBtn,
                      border: `2px solid ${selectedLine?.id === route.id ? route.color : '#2a2a2a'}`,
                      background: selectedLine?.id === route.id ? `${route.color}22` : '#1a1a1a',
                    }}
                  >
                    <div style={{ ...styles.lineDot, background: route.color }} />
                    <span style={{ color: selectedLine?.id === route.id ? route.color : '#888', fontWeight: 600 }}>
                      {route.name}
                    </span>
                    <span style={styles.lineStopCount}>{route.stops?.length} stops</span>
                  </button>
                ))}
              </div>

              {/* Station list for selected line */}
              {selectedLine && (
                <div style={styles.stationList}>
                  <div style={styles.stationListHeader}>
                    <div style={{ ...styles.lineDot, background: selectedLine.color, width: 14, height: 14 }} />
                    <span style={{ color: selectedLine.color, fontWeight: 700, fontSize: 16 }}>
                      {selectedLine.name}
                    </span>
                    <span style={{ color: '#555', fontSize: 13, marginLeft: 4 }}>
                      {selectedLine.stops?.length} stations
                    </span>
                  </div>

                  <div style={styles.stationsContainer}>
                    {selectedLine.stops?.map((stop, index) => {
                      const isFirst = index === 0;
                      const isLast  = index === selectedLine.stops.length - 1;
                      return (
                        <div key={stop.id} style={styles.stationRow}>
                          {/* Line connector */}
                          <div style={styles.connectorCol}>
                            <div style={{
                              ...styles.connectorLine,
                              background: isFirst ? 'transparent' : selectedLine.color,
                            }} />
                            <div style={{
                              ...styles.stationDot,
                              background: isFirst || isLast ? selectedLine.color : '#333',
                              border: `2px solid ${selectedLine.color}`,
                              width: isFirst || isLast ? 14 : 10,
                              height: isFirst || isLast ? 14 : 10,
                            }} />
                            <div style={{
                              ...styles.connectorLine,
                              background: isLast ? 'transparent' : selectedLine.color,
                            }} />
                          </div>

                          {/* Station info */}
                          <div style={styles.stationInfo}>
                            <span style={{
                              ...styles.stationName,
                              color: isFirst || isLast ? '#fff' : '#aaa',
                              fontWeight: isFirst || isLast ? 700 : 400,
                            }}>
                              {stop.name}
                            </span>
                            <span style={styles.stationCode}>{stop.code}</span>
                            {(isFirst || isLast) && (
                              <span style={{
                                ...styles.terminalBadge,
                                background: `${selectedLine.color}20`,
                                color: selectedLine.color,
                                border: `1px solid ${selectedLine.color}40`,
                              }}>
                                {isFirst ? 'Start' : 'End'}
                              </span>
                            )}
                          </div>

                          {/* Order number */}
                          <span style={styles.stationOrder}>{index + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0a', fontFamily: "'Segoe UI', sans-serif" },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px', background: '#111', borderBottom: '1px solid #222',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  navLogo: {
    width: 32, height: 32, background: '#FFD700', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 900, fontSize: 16, color: '#0a0a0a',
  },
  navTitle: { color: '#fff', fontWeight: 700, fontSize: 18 },
  adminBadge: {
    background: '#1a1a00', color: '#FFD700', fontSize: 11,
    padding: '3px 10px', borderRadius: 20, fontWeight: 600,
    border: '1px solid #3a3a00',
  },
  navRight: { display: 'flex', gap: 10 },
  navBtn: {
    padding: '6px 14px', background: 'transparent', border: '1px solid #333',
    borderRadius: 6, color: '#888', cursor: 'pointer', fontSize: 13,
  },
  body: { maxWidth: 860, margin: '0 auto', padding: '32px 24px' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#111', borderRadius: 10, padding: 4 },
  tab: {
    flex: 1, padding: '10px', background: 'transparent', border: 'none',
    borderRadius: 8, color: '#666', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  tabActive: { background: '#1a1a1a', color: '#FFD700' },
  content: {},
  card: {
    background: '#111', borderRadius: 12, padding: 28,
    border: '1px solid #1e1e1e',
  },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 6px' },
  cardDesc: { color: '#555', fontSize: 13, margin: '0 0 28px' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  row: { display: 'flex', gap: 16 },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    padding: '11px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
  },
  hint: { color: '#444', fontSize: 11 },
  msg: { padding: '10px 14px', borderRadius: 8, fontSize: 13 },
  msgError: { background: '#1a0a0a', border: '1px solid #ff4444', color: '#ff6666' },
  msgSuccess: { background: '#0a1a0a', border: '1px solid #00aa44', color: '#00cc55' },
  btn: {
    padding: '12px', background: '#FFD700', color: '#0a0a0a',
    border: 'none', borderRadius: 8, fontWeight: 700,
    cursor: 'pointer', fontSize: 15, alignSelf: 'flex-start',
    minWidth: 160,
  },
  existingSection: { marginTop: 32, borderTop: '1px solid #1e1e1e', paddingTop: 24 },
  existingTitle: { color: '#666', fontSize: 13, fontWeight: 600, margin: '0 0 14px' },
  stopGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  stopChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 6, padding: '5px 10px',
  },
  chipCode: { color: '#FFD700', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 },
  chipName: { color: '#888', fontSize: 11 },
  colorRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  colorBtn: { width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' },
  colorPicker: { width: 28, height: 28, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'none' },
  stopsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  stopRow: { display: 'flex', alignItems: 'center', gap: 10 },
  stopNumber: {
    width: 24, height: 24, background: '#1a1a1a', border: '1px solid #333',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#FFD700', fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  stopSelect: {
    flex: 1, padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none',
  },
  timeField: { display: 'flex', alignItems: 'center', gap: 4 },
  timeInput: {
    width: 52, padding: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none', textAlign: 'center',
  },
  timeLabel: { color: '#555', fontSize: 12 },
  lastStopLabel: { color: '#444', fontSize: 11, fontStyle: 'italic' },
  removeBtn: {
    width: 28, height: 28, background: '#1a0a0a', border: '1px solid #330000',
    borderRadius: 6, color: '#ff4444', cursor: 'pointer', fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addStopBtn: {
    padding: '9px 16px', background: 'transparent', border: '1px dashed #333',
    borderRadius: 8, color: '#666', cursor: 'pointer', fontSize: 13,
    marginTop: 4, width: '100%',
  },
  // View Lines styles
  lineButtons: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  lineBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
  lineDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  lineStopCount: { color: '#555', fontSize: 12, marginLeft: 4 },
  stationList: {
    background: '#0f0f0f', borderRadius: 10,
    border: '1px solid #222', overflow: 'hidden',
  },
  stationListHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 20px', background: '#1a1a1a',
    borderBottom: '1px solid #222',
  },
  stationsContainer: { padding: '8px 20px', maxHeight: 500, overflowY: 'auto' },
  stationRow: { display: 'flex', alignItems: 'center', gap: 14, minHeight: 44 },
  connectorCol: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', width: 14, flexShrink: 0,
  },
  connectorLine: { width: 2, flex: 1, minHeight: 12 },
  stationDot: { borderRadius: '50%', flexShrink: 0 },
  stationInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  stationName: { fontSize: 14 },
  stationCode: {
    color: '#444', fontSize: 11, fontFamily: 'monospace',
    background: '#1a1a1a', padding: '2px 6px', borderRadius: 4,
  },
  terminalBadge: { fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700 },
  stationOrder: { color: '#333', fontSize: 11, fontFamily: 'monospace', minWidth: 24, textAlign: 'right' },
};