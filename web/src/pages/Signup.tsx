import React, { useState } from 'react';
import { Leaf, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import SoilBackground from '../components/SoilBackground';
import axios from 'axios';

interface SignupProps {
    onSignup: (user: { name: string; email: string }) => void;
    onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/signup', { name, email, password });
            setSuccess('Account created! A welcome email has been sent. Redirecting...');
            setTimeout(() => onSignup(res.data), 2000);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Signup failed. Please try again.');
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
                    <h2>Create an Account</h2>
                    <p>Join us to monitor your soil health in real-time</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="auth-success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Creating account...' : <> Sign Up <ArrowRight size={18} /> </>}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <button className="text-link" onClick={onSwitchToLogin}>Sign in</button></p>
                </div>
            </div>

            <SoilBackground />
        </div>
    );
};

export default Signup;
