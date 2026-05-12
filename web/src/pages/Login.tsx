import React, { useState } from 'react';
import { Leaf, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import SoilBackground from '../components/SoilBackground';
import axios from 'axios';

interface LoginProps {
    onLogin: (user: { name: string; email: string }) => void;
    onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            onLogin(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Leaf size={32} color="#10b981" />
                    </div>
                    <h2>Welcome to Soil Health Intelligence</h2>
                    <p>Enter your credentials to access your dashboard</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Signing in...' : <> Sign In <ArrowRight size={18} /> </>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <button className="text-link" onClick={onSwitchToSignup}>Sign up</button></p>
                </div>
            </div>

            <SoilBackground />
        </div>
    );
};

export default Login;
