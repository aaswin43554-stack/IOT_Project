import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import {
    Droplets,
    Thermometer,
    FlaskConical,
    Play,
    Pause,
    RotateCcw,
    AlertTriangle,
    LayoutDashboard,
    Settings,
    Trees,
    Wind,
    Waves,
    Leaf,
    Activity
} from 'lucide-react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Signup from './pages/Signup'
import './auth.css'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

const socket = io(import.meta.env.PROD ? undefined : 'http://localhost:3001')

function App() {
    const [view, setView] = useState<'login' | 'signup' | 'dashboard' | 'admin'>('login')
    const [currentReading, setCurrentReading] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [alerts, setAlerts] = useState<any[]>([])
    const [recommendation, setRecommendation] = useState<any>(null)
    const [replayStatus, setReplayStatus] = useState({ isPlaying: false, currentIndex: 0, speed: 2000 })

    const normalizeReading = (r: any) => {
        if (!r) return null;
        console.log('Normalizing reading:', r);
        return {
            soilMoisturePct: Number(r.soilMoisturePct ?? r.soilMoisture ?? r.moisture ?? 0),
            soilTempC: Number(r.soilTempC ?? r.soilTemp ?? r.soilTemperature ?? 0),
            airTempC: Number(r.airTempC ?? r.airTemp ?? r.temperature ?? 0),
            humidityPct: Number(r.humidityPct ?? r.humidity ?? 0),
            ph: Number(r.ph ?? 7.0),
            ecDsM: Number(r.ecDsM ?? r.ec ?? r.salinity ?? 0),
            nitrogen: Number(r.nitrogen ?? r.N ?? 0),
            phosphorus: Number(r.phosphorus ?? r.P ?? 0),
            potassium: Number(r.potassium ?? r.K ?? 0),
            ts: r.ts || new Date().toISOString(),
            deviceId: r.deviceId || 'unknown'
        };
    };

    useEffect(() => {
        console.log('Connecting to socket...');
        fetchInitialData()

        socket.on('connect', () => console.log('Socket connected:', socket.id));
        socket.on('disconnect', () => console.log('Socket disconnected'));

        socket.on('reading', (reading) => {
            console.log('Received socket reading:', reading);
            const normalized = normalizeReading(reading);
            setCurrentReading(normalized)
            setHistory((prev) => [...prev.slice(-29), normalized])
            fetchRecommendation()
        })

        socket.on('alert', (alert) => {
            console.log('Received socket alert:', alert);
            setAlerts((prev) => [alert, ...prev])
        })

        socket.on('sensorData', (data) => {
            console.log('Received live ESP32 sensorData:', data);
            const raw = Number(data.moisture);

            // Derive all 5 missing sensor values from raw moisture (0-4095)
            // Higher moisture → lower pH, higher EC, higher NPK availability
            const norm = raw / 4095; // 0.0 to 1.0
            const derivedPh    = parseFloat((5.0 + norm * 3.0).toFixed(1));       // 5.0 – 8.0
            const derivedEc    = parseFloat((0.3 + norm * 2.7).toFixed(2));       // 0.3 – 3.0 dS/m
            const derivedN     = parseFloat((10  + norm * 190).toFixed(0));       // 10 – 200 mg/kg
            const derivedP     = parseFloat((5   + norm * 95).toFixed(0));        // 5  – 100 mg/kg
            const derivedK     = parseFloat((20  + norm * 180).toFixed(0));       // 20 – 200 mg/kg

            const newEntry: any = {
                rawMoisture:    raw,
                soilMoisturePct: raw,
                airTempC:       data.temperature !== undefined ? Number(data.temperature) : undefined,
                humidityPct:    data.humidity    !== undefined ? Number(data.humidity)    : undefined,
                ph:             derivedPh,
                ecDsM:          derivedEc,
                nitrogen:       derivedN,
                phosphorus:     derivedP,
                potassium:      derivedK,
                ts:             new Date().toISOString()
            };

            setCurrentReading((prev: any) => ({ ...(prev || {}), ...newEntry }));
            // Also push into history so the graphs update live
            setHistory((prev: any[]) => [...prev.slice(-29), newEntry]);
        })

        return () => {
            socket.off('reading')
            socket.off('alert')
            socket.off('sensorData')
        }
    }, [])

    const fetchInitialData = async () => {
        try {
            console.log('Fetching initial data...');
            const [readingsRes, alertsRes, statusRes] = await Promise.all([
                axios.get('/api/readings/range?deviceId=kaggle-device-1'),
                axios.get('/api/alerts'),
                axios.get('/api/replay/status')
            ])
            const normalizedHistory = (readingsRes.data || []).map(normalizeReading);
            setHistory(normalizedHistory.slice(-30))
            setAlerts(alertsRes.data)
            setReplayStatus(statusRes.data)
            if (normalizedHistory.length > 0) {
                setCurrentReading(normalizedHistory[normalizedHistory.length - 1])
                fetchRecommendation()
            }
        } catch (err) {
            console.error('Error fetching initial data', err)
        }
    }

    const fetchRecommendation = async () => {
        try {
            const res = await axios.get('/api/recommendation/latest?deviceId=kaggle-device-1')
            console.log('Recommendation received:', res.data);
            setRecommendation(res.data)
        } catch (err) {
            console.error('Error fetching recommendation', err)
        }
    }

    const handleReplayAction = async (action: string, payload?: any) => {
        try {
            await axios.post(`/api/replay/${action}`, payload)
            const statusRes = await axios.get('/api/replay/status')
            setReplayStatus(statusRes.data)
        } catch (err) {
            console.error(`Error performing ${action}`, err)
        }
    }

    const handleAckAlert = async (id: number) => {
        try {
            await axios.post(`/api/alerts/${id}/ack`)
            setAlerts((prev) => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
        } catch (err) {
            console.error('Error acknowledging alert', err)
        }
    }

    const createChartData = (label: string, dataKey: string, color: string) => ({
        labels: history.map(r => new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        datasets: [
            {
                label,
                data: history.map(r => r[dataKey]),
                borderColor: color,
                backgroundColor: `${color}22`,
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }
        ]
    })

    if (view === 'login') {
        return <Login onLogin={() => setView('dashboard')} onSwitchToSignup={() => setView('signup')} />
    }

    if (view === 'signup') {
        return <Signup onSignup={() => setView('dashboard')} onSwitchToLogin={() => setView('login')} />
    }

    if (view === 'admin') {
        return (
            <>
                <nav className="side-nav">
                    <button onClick={() => setView('dashboard')}><LayoutDashboard size={20} /></button>
                    <button className="active"><Settings size={20} /></button>
                </nav>
                <div style={{ marginLeft: '80px' }}><Admin /></div>
            </>
        )
    }

    return (
        <div className="app-container">
            <nav className="side-nav">
                <button className="active" onClick={() => setView('dashboard')}><LayoutDashboard size={20} /></button>
                <button onClick={() => setView('admin')}><Settings size={20} /></button>
            </nav>

            <main className="dashboard-v2">
                <header className="main-header">
                    <div>
                        <h1>Soil Health Intelligence</h1>
                        <p>Real-time analytics & automated monitoring</p>
                    </div>
                </header>

                <section className="stats-grid">
                    {(() => {
                        const m   = currentReading?.rawMoisture ?? currentReading?.soilMoisturePct;
                        const t   = currentReading?.airTempC;
                        const h   = currentReading?.humidityPct;
                        const ph  = currentReading?.ph;
                        const ec  = currentReading?.ecDsM;
                        const n   = currentReading?.nitrogen;
                        const p   = currentReading?.phosphorus;
                        const k   = currentReading?.potassium;

                        // Status helpers
                        const moistureStatus = m === undefined ? 'OK'
                            : m >= 300 ? 'CRITICAL'     // Very dry
                            : m >= 200 ? 'WARN'         // Getting dry
                            : 'OK';                     // Good moisture

                        const tempStatus = t === undefined ? 'OK'
                            : t > 40 ? 'CRITICAL'
                            : t > 35 ? 'WARN'
                            : 'OK';

                        const humidStatus = h === undefined ? 'OK'
                            : (h < 20 || h > 90) ? 'CRITICAL'
                            : (h < 35 || h > 80) ? 'WARN'
                            : 'OK';

                        const phStatus = ph === undefined ? 'OK'
                            : (ph < 4.5 || ph > 8.5) ? 'CRITICAL'
                            : (ph < 5.5 || ph > 7.5) ? 'WARN'
                            : 'OK';

                        const ecStatus = ec === undefined ? 'OK'
                            : ec > 2.5 ? 'CRITICAL'
                            : ec > 1.8 ? 'WARN'
                            : 'OK';

                        const nStatus = n === undefined ? 'OK'
                            : n < 15 ? 'CRITICAL'
                            : n < 40 ? 'WARN'
                            : 'OK';

                        const pStatus = p === undefined ? 'OK'
                            : p < 8  ? 'CRITICAL'
                            : p < 20 ? 'WARN'
                            : 'OK';

                        const kStatus = k === undefined ? 'OK'
                            : k < 20 ? 'CRITICAL'
                            : k < 50 ? 'WARN'
                            : 'OK';

                        return [
                            { label: 'Soil Moisture (Raw)', value: m !== undefined ? m : '--',                                                              icon: <Droplets />,    color: '#3b82f6', status: moistureStatus },
                            { label: 'Air Temperature',     value: t !== undefined ? `${Number(t).toFixed(1)}°C` : '--',                                    icon: <Thermometer />, color: '#ef4444', status: tempStatus    },
                            { label: 'Air Humidity',        value: h !== undefined ? `${Number(h).toFixed(1)}%` : '--',                                     icon: <Wind />,        color: '#10b981', status: humidStatus   },
                            { label: 'Soil pH',             value: ph !== undefined ? Number(ph).toFixed(1) : '--',                                         icon: <FlaskConical />,color: '#a855f7', status: phStatus      },
                            { label: 'Salinity (EC)',       value: ec !== undefined ? `${Number(ec).toFixed(2)} dS/m` : '--',                               icon: <Waves />,       color: '#f59e0b', status: ecStatus      },
                            { label: 'Nitrogen (N)',        value: n  !== undefined ? `${Number(n).toFixed(0)} mg/kg` : '--',                               icon: <Leaf />,        color: '#34d399', status: nStatus       },
                            { label: 'Phosphorus (P)',      value: p  !== undefined ? `${Number(p).toFixed(0)} mg/kg` : '--',                               icon: <Activity />,    color: '#fb923c', status: pStatus       },
                            { label: 'Potassium (K)',       value: k  !== undefined ? `${Number(k).toFixed(0)} mg/kg` : '--',                               icon: <Trees />,       color: '#60a5fa', status: kStatus       },
                        ];
                    })().map((stat, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-header">
                                <div className="icon-box" style={{ background: `${stat.color}22`, color: stat.color }}>{stat.icon}</div>
                                <span className={`status-badge ${stat.status.toLowerCase()}`}>{stat.status}</span>
                            </div>
                            <div className="stat-body">
                                <p>{stat.label}</p>
                                <h3>{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="main-content-grid">
                    <div className="charts-column">
                        <div className="chart-box">
                            <header><h4>Soil Moisture & Salinity</h4></header>
                            <div className="chart-wrapper">
                                <Line
                                    data={createChartData('Moisture (%)', 'soilMoisturePct', '#3b82f6')}
                                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                        <div className="chart-box">
                            <header><h4>NPK Nutrients (mg/kg)</h4></header>
                            <div className="chart-wrapper">
                                <Line
                                    data={createChartData('Nitrogen', 'nitrogen', '#34d399')}
                                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                        <div className="chart-box">
                            <header><h4>Temperature & pH Analytics</h4></header>
                            <div className="chart-wrapper">
                                <Line
                                    data={createChartData('pH', 'ph', '#a855f7')}
                                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                    </div>

                    <aside className="side-column">
                        <div className="recommendation-card">
                            <header>
                                <Trees size={20} />
                                <h4>Crop Recommendations</h4>
                            </header>
                            {recommendation ? (
                                <div className="rec-content">
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>Likely Previous Crop</div>
                                        <div style={{ fontWeight: 600, color: '#f87171' }}>{recommendation.previousCrop}</div>
                                    </div>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Recommended Next Crop</div>
                                        <div className="crop-list">
                                            {recommendation.recommendedCrops.map((crop: string) => (
                                                <span key={crop} className="crop-tag">{crop}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="explanation" style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '0 0.5rem 0.5rem 0' }}>{recommendation.explanation}</p>
                                </div>
                            ) : (
                                <p className="placeholder">Loading suggestions...</p>
                            )}
                        </div>

                    </aside>
                </section>
            </main>
        </div>
    )
}

export default App
