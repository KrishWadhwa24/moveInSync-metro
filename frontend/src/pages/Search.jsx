import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStops, searchRoute, createBooking } from '../services/api';
import RouteDisplay from '../components/RouteDisplay';
import MetroMap from '../components/MetroMap';

export default function Search() {
    const [stops, setStops] = useState([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [strategy, setStrategy] = useState('fastest');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        getAllStops().then((res) => setStops(res.data.stops)).catch(() => { });
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setShowMap(false);
        if (!from || !to) return setError('Please select both stops');
        if (from === to) return setError('Source and destination cannot be the same');
        setLoading(true);
        try {
            const res = await searchRoute(from, to, strategy);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'No route found');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        setBookingLoading(true);
        try {
            const res = await createBooking({
                source_stop_id: from,
                destination_stop_id: to,
                strategy,
            });
            navigate(`/booking/${res.data.booking.id}`, { state: { booking: res.data.booking } });
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={styles.page}>
            {/* Navbar */}
            <div style={styles.nav}>
                <div style={styles.navBrand}>
                    <div style={styles.navLogo}>M</div>
                    <span style={styles.navTitle}>MetroBook</span>
                </div>
                <div style={styles.navRight}>
                    <span style={styles.navUser}>{user.email}</span>
                    {user.role === 'admin' && (
                        <button onClick={() => navigate('/admin')} style={styles.adminBtn}>
                            Admin Panel
                        </button>
                    )}
                    <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                </div>
            </div>

            <div style={styles.body}>
                {/* Left: Search panel */}
                <div style={styles.sidebar}>
                    <h2 style={styles.heading}>Plan Your Journey</h2>

                    <form onSubmit={handleSearch} style={styles.form}>
                        <div style={styles.field}>
                            <label style={styles.label}>From</label>
                            <select value={from} onChange={(e) => setFrom(e.target.value)} style={styles.select}>
                                <option value="">Select source stop</option>
                                {stops.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>To</label>
                            <select value={to} onChange={(e) => setTo(e.target.value)} style={styles.select}>
                                <option value="">Select destination stop</option>
                                {stops.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Strategy</label>
                            <div style={styles.strategyRow}>
                                <button
                                    type="button"
                                    onClick={() => setStrategy('fastest')}
                                    style={{ ...styles.strategyBtn, ...(strategy === 'fastest' ? styles.strategyActive : {}) }}
                                >
                                    ⚡ Fastest
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStrategy('least_transfers')}
                                    style={{ ...styles.strategyBtn, ...(strategy === 'least_transfers' ? styles.strategyActive : {}) }}
                                >
                                    ↔ Least Transfers
                                </button>
                            </div>
                        </div>

                        {error && <div style={styles.error}>{error}</div>}

                        <button type="submit" style={styles.searchBtn} disabled={loading}>
                            {loading ? 'Searching...' : 'Search Route'}
                        </button>
                    </form>

                    {/* Route result */}
                    {result && (
                        <div style={styles.resultSection}>
                            <RouteDisplay path={result.path} source={result.source} destination={result.destination} />

                            <div style={styles.actionRow}>
                                <button
                                    onClick={() => setShowMap(!showMap)}
                                    style={styles.mapBtn}
                                >
                                    {showMap ? 'Hide Map' : '🗺 Show on Map'}
                                </button>
                                <button
                                    onClick={handleBooking}
                                    style={styles.bookBtn}
                                    disabled={bookingLoading}
                                >
                                    {bookingLoading ? 'Booking...' : 'Book Ticket →'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Map panel */}
                <div style={styles.mapPanel}>
                    {showMap && result ? (
                        <MetroMap path={result.path} />
                    ) : (
                        <div style={styles.mapPlaceholder}>
                            <div style={styles.placeholderIcon}>🚇</div>
                            <p style={styles.placeholderText}>Search a route to see it on the map</p>
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
    navBrand: { display: 'flex', alignItems: 'center', gap: 10 },
    navLogo: {
        width: 32, height: 32, background: '#FFD700', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 16, color: '#0a0a0a',
    },
    navTitle: { color: '#fff', fontWeight: 700, fontSize: 18 },
    navRight: { display: 'flex', alignItems: 'center', gap: 16 },
    navUser: { color: '#666', fontSize: 13 },
    logoutBtn: {
        padding: '6px 14px', background: 'transparent', border: '1px solid #333',
        borderRadius: 6, color: '#888', cursor: 'pointer', fontSize: 13,
    },
    body: { display: 'flex', height: 'calc(100vh - 57px)' },
    sidebar: {
        width: 380, padding: 24, overflowY: 'auto',
        borderRight: '1px solid #1a1a1a', background: '#0f0f0f',
    },
    heading: { color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 24px' },
    form: { display: 'flex', flexDirection: 'column', gap: 18 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { color: '#888', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 },
    select: {
        padding: '10px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
    },
    strategyRow: { display: 'flex', gap: 8 },
    strategyBtn: {
        flex: 1, padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: 13,
    },
    strategyActive: { background: '#1f1a00', border: '1px solid #FFD700', color: '#FFD700' },
    error: {
        background: '#1a0a0a', border: '1px solid #ff4444',
        color: '#ff6666', padding: '10px 14px', borderRadius: 8, fontSize: 13,
    },
    searchBtn: {
        padding: '12px', background: '#FFD700', color: '#0a0a0a',
        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 15,
    },
    resultSection: { marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 },
    actionRow: { display: 'flex', gap: 10 },
    mapBtn: {
        flex: 1, padding: '10px', background: '#1a1a1a', border: '1px solid #2a2a2a',
        borderRadius: 8, color: '#aaa', cursor: 'pointer', fontSize: 13,
    },
    bookBtn: {
        flex: 1, padding: '10px', background: '#FFD700', border: 'none',
        borderRadius: 8, color: '#0a0a0a', fontWeight: 700, cursor: 'pointer', fontSize: 13,
    },
    mapPanel: {
        flex: 1, padding: 24, overflowY: 'auto', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    mapPlaceholder: { textAlign: 'center' },
    placeholderIcon: { fontSize: 64, marginBottom: 16 },
    placeholderText: { color: '#444', fontSize: 15 },
    adminBtn: {
        padding: '6px 14px', background: '#1a1a00', border: '1px solid #FFD700',
        borderRadius: 6, color: '#FFD700', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    },
};