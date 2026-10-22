import React from 'react';

export default function MetricCard({ title, value, icon, subtitle, color = 'blue' }) {
    return (
        <div className={`metric-card metric-${color}`}>
            <div className="metric-header">
                <span className="metric-title">{title}</span>
                <span className="metric-icon">{icon}</span>
            </div>
            <div className="metric-value">{value}</div>
            {subtitle && <div className="metric-subtitle">{subtitle}</div>}
        </div>
    );
}
