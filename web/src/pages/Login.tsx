import React, { useState } from 'react';
import { Leaf, Lock, Mail, ArrowRight } from 'lucide-react';
import SoilBackground from '../components/SoilBackground';

interface LoginProps {
    onLogin: () => void;
    onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate authentication check
        if (email && password) {
            onLogin();
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

                    <button type="submit" className="auth-submit">
                        Sign In <ArrowRight size={18} />
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
