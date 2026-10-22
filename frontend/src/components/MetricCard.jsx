import React from 'react';

export default function MetricCard({ title, value, icon, subtitle }) {
    return (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/20 backdrop-blur-sm flex flex-col justify-between transition-all duration-200 hover:border-slate-700/80 hover:bg-slate-900/90 group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {title}
                </span>
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform">
                    {icon}
                </div>
            </div>

            <div>
                <div className="text-3xl font-bold text-white tracking-tight font-mono">
                    {value}
                </div>
                {subtitle && (
                    <div className="text-xs text-slate-400 mt-2 font-normal leading-relaxed">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}
