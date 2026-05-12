import React, { useMemo } from 'react';
import './SoilBackground.css';

const SoilBackground: React.FC = () => {
    // Generate rain drops with varying properties for a natural effect
    const drops = useMemo(() => Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDuration: `${0.5 + Math.random() * 1}s`,
        animationDelay: `${Math.random() * 2}s`
    })), []);

    return (
        <div className="soil-background">
            <div className="rain-container">
                {drops.map((drop) => (
                    <div
                        key={drop.id}
                        className="drop"
                        style={{
                            left: drop.left,
                            animationDuration: drop.animationDuration,
                            animationDelay: drop.animationDelay
                        }}
                    ></div>
                ))}
            </div>

            <div className="scenery">
                {/* Hills */}
                <div className="hill hill-bg"></div>
                <div className="hill hill-fg"></div>

                {/* Trees */}
                <div className="tree-container tree-1">
                    <svg viewBox="0 0 100 150" className="tree" preserveAspectRatio="none">
                        <path className="trunk" d="M45,150 Q50,100 50,50 L55,50 Q50,100 55,150 Z" fill="#5c4033" />
                        <path className="leaves" d="M50,10 Q20,60 10,90 Q50,100 90,90 Q80,60 50,10 Z" fill="#228b22" />
                        <path className="leaves" d="M50,30 Q10,80 5,110 Q50,120 95,110 Q90,80 50,30 Z" fill="#2e8b57" opacity="0.9" />
                    </svg>
                </div>
                <div className="tree-container tree-2">
                    <svg viewBox="0 0 100 150" className="tree" preserveAspectRatio="none">
                        <path className="trunk" d="M48,150 Q50,90 50,40 L54,40 Q50,90 54,150 Z" fill="#4a3219" />
                        <path className="leaves" d="M50,0 Q15,50 5,80 Q50,90 95,80 Q85,50 50,0 Z" fill="#1e7332" />
                    </svg>
                </div>
                <div className="tree-container tree-3">
                    <svg viewBox="0 0 100 150" className="tree" preserveAspectRatio="none">
                        <path className="trunk" d="M45,150 Q50,100 50,50 L55,50 Q50,100 55,150 Z" fill="#5c4033" />
                        <path className="leaves" d="M50,10 Q20,60 10,90 Q50,100 90,90 Q80,60 50,10 Z" fill="#32cd32" />
                    </svg>
                </div>
            </div>

            <div className="glow-overlay"></div>
        </div>
    );
};

export default SoilBackground;
