'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    CheckSquare,
    FileText,
    ArrowUpRight,
    Clock,
    Milestone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [client, setClient] = useState<any>(null);
    const [stats, setStats] = useState({
        avgMaturity: 0,
        activeTasks: 0,
        docCount: 0,
    });
    const [roadmap, setRoadmap] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any[]>([]);

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // 2. Fetch Client Engagement
            const { data: clientData } = await supabase
                .from('clients')
                .select('*')
                .eq('profile_id', user.id)
                .single();

            if (!clientData) {
                setLoading(false);
                return;
            }
            setClient(clientData);

            // 3. Parallel fetching for stats and details
            const [
                { data: maturityData },
                { count: tasksCount },
                { count: docsCount },
                { data: roadmapData },
                { data: activityData },
                { data: kpiData }
            ] = await Promise.all([
                supabase.from('maturity_scores').select('score').eq('client_id', clientData.id),
                supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('client_id', clientData.id).neq('status', 'done'),
                supabase.from('documents').select('*', { count: 'exact', head: true }).eq('client_id', clientData.id),
                supabase.from('roadmap_phases').select('*').eq('client_id', clientData.id).order('phase_number', { ascending: true }),
                supabase.from('activity_log').select('*').eq('client_id', clientData.id).order('occurred_at', { ascending: false }).limit(5),
                supabase.from('kpis').select('*').eq('client_id', clientData.id).limit(4)
            ]);

            const avgMaturity = maturityData?.length
                ? Math.round(maturityData.reduce((acc, curr) => acc + curr.score, 0) / maturityData.length)
                : 0;

            setStats({
                avgMaturity,
                activeTasks: tasksCount || 0,
                docCount: docsCount || 0
            });
            setRoadmap(roadmapData || []);
            setActivity(activityData || []);
            setKpis(kpiData || []);
            setLoading(false);
        }

        fetchDashboardData();
    }, []);

    const currentPhase = roadmap.find(p => p.status === 'in_progress') || roadmap[0];

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
            {/* Welcome Section */}
            <section>
                <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back, {profile?.full_name?.split(' ')[0] || 'Strategic Partner'}</h2>
                <p className="text-slate-400 mt-1">Here is the latest pulse on your digital strategy for {client?.company_name || 'your organization'}.</p>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Avg Maturity', value: `${stats.avgMaturity}/5`, icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Active Tasks', value: stats.activeTasks, icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Docs in Vault', value: stats.docCount, icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Engagement', value: 'Active', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        variants={item}
                        className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4"
                    >
                        <div className={cn("p-2 rounded-lg w-fit", stat.bg)}>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Roadmap Progress */}
                <motion.div variants={item} className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white uppercase tracking-tight">Strategy Roadmap</h3>
                        <ArrowUpRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            {roadmap.map((phase) => (
                                <div key={phase.id} className="flex-1 flex flex-col gap-2">
                                    <div className={cn(
                                        "h-2 rounded-full",
                                        phase.status === 'completed' ? "bg-blue-500" :
                                            phase.status === 'in_progress' ? "bg-blue-400/30 relative overflow-hidden" :
                                                "bg-slate-800"
                                    )}>
                                        {phase.status === 'in_progress' && (
                                            <div className="absolute top-0 left-0 h-full w-1/3 bg-blue-500" />
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        phase.status === 'completed' ? "text-blue-400" :
                                            phase.status === 'in_progress' ? "text-blue-300" :
                                                "text-slate-600"
                                    )}>Phase {phase.phase_number}</p>
                                    <p className="text-xs font-medium text-slate-400 line-clamp-1">{phase.title}</p>
                                </div>
                            ))}
                        </div>

                        {currentPhase && (
                            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 rounded bg-blue-500/10">
                                        <Milestone className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white">Current Focus: {currentPhase.title}</h4>
                                        <p className="text-sm text-slate-400 mt-1">{currentPhase.description}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div variants={item} className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-tight text-sm text-slate-500">Recent Activity</h3>
                    <div className="space-y-6">
                        {activity.map((log) => (
                            <div key={log.id} className="flex gap-4 group">
                                <div className="relative">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 group-hover:scale-110 transition-transform duration-300",
                                        log.type === 'meeting' ? "bg-slate-800" : "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {log.type === 'meeting' ? <Clock className="w-4 h-4 text-slate-400" /> : <Milestone className="w-4 h-4" />}
                                    </div>
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-slate-800/50 group-last:hidden" />
                                </div>
                                <div className="pb-6">
                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{log.title}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-600 tracking-tighter mt-1">{new Date(log.occurred_at).toLocaleDateString()}</p>
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{log.body}</p>
                                </div>
                            </div>
                        ))}
                        {activity.length === 0 && (
                            <div className="py-10 text-center">
                                <p className="text-slate-600 text-sm italic">No recent activity recorded.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* KPI Preview */}
            <motion.div variants={item} className="p-6 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white uppercase tracking-tight">KPI Highlights</h3>
                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi) => (
                        <div key={kpi.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 group hover:border-slate-700 transition-colors">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{kpi.name}</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className="text-2xl font-bold text-white">{kpi.value.toLocaleString()}<span className="text-xs ml-0.5 text-slate-500 font-medium">{kpi.unit}</span></p>
                                {kpi.target && <p className="text-[10px] text-slate-600 font-bold">/ {kpi.target.toLocaleString()}</p>}
                            </div>
                            {kpi.target && (
                                <div className="h-1.5 w-full bg-slate-900 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            (kpi.value / kpi.target) >= 0.9 ? "bg-emerald-500" : "bg-blue-500"
                                        )}
                                        style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {kpis.length === 0 && (
                        <div className="col-span-full py-6 text-center text-slate-600 text-sm italic">
                            No KPIs available for highlight.
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
