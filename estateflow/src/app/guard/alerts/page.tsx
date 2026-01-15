'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    AlertTriangle,
    Clock,
    Shield,
    Loader2,
    Bell,
    CheckCircle,
    XCircle,
} from 'lucide-react';

// Mock alerts for demonstration - in production, this would come from a database table
const mockAlerts = [
    {
        id: '1',
        type: 'warning',
        title: 'Multiple Failed Attempts',
        message: 'Code ABC123 has been entered incorrectly 3 times',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
    },
    {
        id: '2',
        type: 'info',
        title: 'Shift Reminder',
        message: 'Your shift ends in 1 hour',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
    },
    {
        id: '3',
        type: 'critical',
        title: 'Banned Visitor Detected',
        message: 'John Doe (banned) attempted entry at Main Gate',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        read: false,
    },
];

export default function AlertsPage() {
    const [alerts, setAlerts] = useState(mockAlerts);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');

    const markAsRead = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    };

    const markAllAsRead = () => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical': return <XCircle className="text-red-600" size={20} />;
            case 'warning': return <AlertTriangle className="text-amber-600" size={20} />;
            default: return <Bell className="text-blue-600" size={20} />;
        }
    };

    const getAlertBg = (type: string, read: boolean) => {
        if (read) return 'bg-slate-50';
        switch (type) {
            case 'critical': return 'bg-red-50';
            case 'warning': return 'bg-amber-50';
            default: return 'bg-blue-50';
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !a.read;
        return a.type === filter;
    });

    const unreadCount = alerts.filter(a => !a.read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Security Alerts</h1>
                    <p className="text-slate-600 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts read'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Critical</p>
                            <p className="text-xl font-bold text-slate-900">
                                {alerts.filter(a => a.type === 'critical').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Warnings</p>
                            <p className="text-xl font-bold text-slate-900">
                                {alerts.filter(a => a.type === 'warning').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bell className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Info</p>
                            <p className="text-xl font-bold text-slate-900">
                                {alerts.filter(a => a.type === 'info').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Shield className="text-indigo-600" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Unread</p>
                            <p className="text-xl font-bold text-slate-900">{unreadCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'unread', 'critical', 'warning', 'info'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {filteredAlerts.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle className="mx-auto mb-3 text-green-400" size={40} />
                        <p className="text-slate-500">No alerts to show</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 cursor-pointer transition-colors ${getAlertBg(alert.type, alert.read)}`}
                                onClick={() => markAsRead(alert.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.type === 'critical' ? 'bg-red-100' :
                                            alert.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                                        }`}>
                                        {getAlertIcon(alert.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-medium ${alert.read ? 'text-slate-600' : 'text-slate-900'}`}>
                                                {alert.title}
                                            </p>
                                            {!alert.read && (
                                                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{alert.message}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                            <Clock size={12} />
                                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
