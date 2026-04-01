import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { useConnectivity } from '../../hooks/useConnectivity';

const ConnectivityStatus = ({ showBadge = true, minimal = false }) => {
    const { isOnline, latency, status } = useConnectivity();

    const getStatusColor = () => {
        if (!isOnline) return '#ef4444'; // red-500
        if (status === 'Excellent') return '#22c55e'; // green-500
        if (status === 'Good') return '#3b82f6'; // blue-500
        return '#f59e0b'; // amber-500
    };

    const getStatusBg = () => {
        if (!isOnline) return 'rgba(239, 68, 68, 0.1)';
        if (status === 'Excellent') return 'rgba(34, 197, 94, 0.1)';
        if (status === 'Good') return 'rgba(59, 130, 246, 0.1)';
        return 'rgba(245, 158, 11, 0.1)';
    };

    if (minimal) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white/50">
                <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: getStatusColor() }}
                />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">
                    {isOnline ? `${status} (${latency}ms)` : 'OFFLINE'}
                </span>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            background: getStatusBg(),
            border: `1px solid ${getStatusColor()}40`,
            borderRadius: '12px',
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getStatusColor(),
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                {isOnline ? (status === 'Excellent' ? <Wifi size={18} /> : <Activity size={18} />) : <WifiOff size={18} />}
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Network Health
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: getStatusColor() }}>
                        {status}
                    </p>
                    {isOnline && (
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                            {latency}ms
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectivityStatus;
