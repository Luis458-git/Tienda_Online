import React from 'react';

export default function MetricCard({ title, value, icon, subtitle, color = 'purple' }) {
    return (
        <div className="bg-[#10131c] border border-[#1e2333] rounded-2xl p-4.5 sm:p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {title}
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#141724] border border-[#22283a] flex items-center justify-center text-sm">
                    {icon}
                </div>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-white my-1 tracking-tight">
                {value}
            </div>
            {subtitle && (
                <div className="text-[11px] text-slate-400 mt-1">
                    {subtitle}
                </div>
            )}
        </div>
    );
}
