import { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Admin() {
    const [formData, setFormData] = useState({
        deviceId: 'kaggle-device-1',
        soilMoisturePct: 45,
        soilTempC: 24,
        airTempC: 28,
        humidityPct: 55,
        ph: 6.5,
        ecDsM: 0.8,
        nitrogen: 65,
        phosphorus: 35,
        potassium: 85
    });
    const [status, setStatus] = useState<null | 'success' | 'error'>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/readings', formData);
            setStatus('success');
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'deviceId' ? value : parseFloat(value)
        }));
    };

    return (
        <div className="dashboard" style={{ maxWidth: '600px' }}>
            <h1>Admin Control Panel</h1>
            <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Manually simulate sensor readings</p>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                    <label>Device ID</label>
                    <input
                        type="text"
                        name="deviceId"
                        value={formData.deviceId}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: 'white' }}
                    />
                </div>

                {[
                    { label: 'Soil Moisture (%)', name: 'soilMoisturePct', min: 0, max: 100, step: 1 },
                    { label: 'Soil Temp (°C)', name: 'soilTempC', min: 0, max: 50, step: 0.5 },
                    { label: 'Air Temp (°C)', name: 'airTempC', min: 0, max: 60, step: 0.5 },
                    { label: 'Humidity (%)', name: 'humidityPct', min: 0, max: 100, step: 1 },
                    { label: 'Soil pH', name: 'ph', min: 0, max: 14, step: 0.1 },
                    { label: 'EC (dS/m)', name: 'ecDsM', min: 0, max: 5, step: 0.1 },
                    { label: 'Nitrogen (mg/kg)', name: 'nitrogen', min: 0, max: 500, step: 1 },
                    { label: 'Phosphorus (mg/kg)', name: 'phosphorus', min: 0, max: 500, step: 1 },
                    { label: 'Potassium (mg/kg)', name: 'potassium', min: 0, max: 500, step: 1 },
                ].map(field => (
                    <div key={field.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label>{field.label}</label>
                            <span>{(formData as any)[field.name]}</span>
                        </div>
                        <input
                            type="range"
                            name={field.name}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={(formData as any)[field.name]}
                            onChange={handleChange}
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                    </div>
                ))}

                <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                    <Send size={18} />
                    Submit Reading
                </button>

                {status === 'success' && (
                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <CheckCircle2 size={18} /> Reading submitted successfully!
                    </div>
                )}
                {status === 'error' && (
                    <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <AlertCircle size={18} /> Failed to submit reading.
                    </div>
                )}
            </form>
        </div>
    );
}
