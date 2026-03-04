'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Target,
    PieChart as PieChartIcon,
    Zap,
    DollarSign,
    Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// Sample historical data - in a full implementation, this would be fetched from a history table
const HISTORICAL_DATA = [
    { name: 'Week 1', leads: 85, revenue: 22000 },
    { name: 'Week 2', leads: 110, revenue: 28000 },
    { name: 'Week 3', leads: 95, revenue: 25000 },
    { name: 'Week 4', leads: 130, revenue: 35000 },
    { name: 'Week 5', leads: 120, revenue: 32000 },
    { name: 'Week 6', leads: 160, revenue: 45000 },
];

export default function KPIDashboardPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'marketing' | 'sales' | 'financial'>('marketing');
    const [allKpis, setAllKpis] = useState<any[]>([]);

    useEffect(() => {
        async function fetchKPIData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: clientData } = await supabase
                .from('clients')
                .select('id')
                .eq('profile_id', user.id)
                .single();

            if (clientData) {
                const { data } = await supabase
                    .from('kpis')
                    .select('*')
                    .eq('client_id', clientData.id);
                setAllKpis(data || []);
            }
            setLoading(false);
        }
        fetchKPIData();
    }, []);

    const filteredKPIs = allKpis.filter(kpi => kpi.category === activeTab);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <PieChartIcon className="w-8 h-8 text-blue-500" />
                        <h2 className="text-3xl font-bold text-white tracking-tight">Performance KPI Dashboard</h2>
                    </div>
                    <p className="text-slate-400 mt-2">Real-time indicators across your core digital growth pillars.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
                    {[
                        { id: 'marketing', label: 'Marketing', icon: Zap },
                        { id: 'sales', label: 'Sales', icon: Users },
                        { id: 'financial', label: 'Financial', icon: DollarSign },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredKPIs.map((kpi) => {
                    const progress = kpi.target ? Math.min((kpi.value / kpi.target) * 100, 100) : 100;
                    const isOverTarget = kpi.target ? kpi.value >= kpi.target : true;

                    return (
                        <motion.div
                            key={kpi.id}
                            layout
                            variants={item}
                            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.name}</p>
                                <div className={cn(
                                    "p-1.5 rounded-full bg-slate-950 border border-slate-800",
                                    isOverTarget ? "text-emerald-500" : "text-amber-500"
                                )}>
                                    {isOverTarget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                </div>
                            </div>

                            <div>
                                <p className="text-3xl font-bold text-white">
                                    {kpi.value.toLocaleString()}{kpi.unit === '%' ? '%' : ''}
                                </p>
                                {kpi.target && (
                                    <p className="text-sm text-slate-500 mt-1">
                                        Target: <span className="text-slate-300">{kpi.target.toLocaleString()}{kpi.unit === '%' ? '%' : ''}</span>
                                    </p>
                                )}
                            </div>

                            {kpi.target && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                        <span className="text-slate-600">Progress</span>
                                        <span className={isOverTarget ? "text-emerald-400" : "text-blue-400"}>{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                isOverTarget ? "bg-emerald-500" : "bg-blue-500"
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {filteredKPIs.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                        <p className="text-slate-500 font-medium italic">No {activeTab} metrics tracked yet.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Main Line Chart */}
                <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-semibold text-white">Growth Trend</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>Current Performance</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={HISTORICAL_DATA}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    tickFormatter={(val) => activeTab === 'sales' || activeTab === 'financial' ? `${(val / 1000)}k` : val}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#ffffff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={activeTab === 'marketing' ? 'leads' : 'revenue'}
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#020617' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Secondary Comparison Chart */}
                <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-semibold text-white">Target Achievement</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Target className="w-4 h-4" />
                            <span>Benchmark: High</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredKPIs}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {filteredKPIs.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.target && entry.value >= entry.target ? '#10b981' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Narrative Summary */}
            <motion.div variants={item} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 border-l-4 border-l-blue-500">
                <h3 className="text-lg font-semibold text-white mb-2 uppercase tracking-tight text-sm text-slate-500">Strategic Performance Insight</h3>
                <p className="text-slate-400 text-sm leading-relaxed italic">
                    "Integrated analysis shows {activeTab} trajectories are positively correlating with recent implementation phases. {filteredKPIs.length > 0 ? `Specific focus on ${filteredKPIs[0].name} is recommended to maintain overall velocity.` : 'We recommend initializing tracking for key metrics to establish a baseline for upcoming scaling phases.'}"
                </p>
            </motion.div>
        </motion.div>
    );
}
