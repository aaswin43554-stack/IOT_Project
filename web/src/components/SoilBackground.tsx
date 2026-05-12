import React, { useMemo } from 'react';
import './SoilBackground.css';

const SoilBackground: React.FC = () => {
    // Generate abstract data nodes
    const nodes = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 3 + 1}px`,
        animationDuration: `${10 + Math.random() * 20}s`,
        animationDelay: `-${Math.random() * 20}s`
    })), []);

    return (
        <div className="tech-background">
            <div className="grid-overlay"></div>
            
            <div className="nodes-container">
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        className="data-node"
                        style={{
                            left: node.left,
                            top: node.top,
                            width: node.size,
                            height: node.size,
                            animationDuration: node.animationDuration,
                            animationDelay: node.animationDelay
                        }}
                    ></div>
                ))}
            </div>

            <div className="glow-orb orb-1"></div>
            <div className="glow-orb orb-2"></div>
        </div>
    );
};

export default SoilBackground;
