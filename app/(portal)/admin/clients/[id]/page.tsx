'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2,
    Settings2,
    ArrowLeft,
    Plus,
    Edit3,
    Save,
    Trash2,
    Share2,
    MoreVertical,
    ShieldCheck,
    Target,
    CheckSquare,
    Clock,
    Upload,
    Loader2,
    File as LucideFile,
    FileText,
    Download,
    ArrowRight,
    Milestone,
    Calendar,
    X
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function AdminClientDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'maturity' | 'kpis' | 'tasks' | 'documents' | 'roadmap'>('overview');
    const [client, setClient] = useState<any>(null);
    const [maturityScores, setMaturityScores] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [roadmapPhases, setRoadmapPhases] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Modal states
    const [activeModal, setActiveModal] = useState<'maturity' | 'kpi' | 'task' | 'roadmap' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        async function fetchClientData() {
            setLoading(true);

            // 1. Fetch Client
            const { data: clientData } = await supabase
                .from('clients')
                .select('*')
                .eq('id', params.id)
                .single();

            if (!clientData) {
                setLoading(false);
                return;
            }
            setClient(clientData);

            // 2. Parallel fetching for details
            const [
                { data: maturityData },
                { data: taskData },
                { data: kpiData },
                { data: documentsData },
                { data: roadmapData }
            ] = await Promise.all([
                supabase.from('maturity_scores').select('*').eq('client_id', params.id).order('dimension', { ascending: true }),
                supabase.from('tasks').select('*').eq('client_id', params.id).order('due_date', { ascending: true }),
                supabase.from('kpis').select('*').eq('client_id', params.id),
                supabase.from('documents').select('*').eq('client_id', params.id).order('uploaded_at', { ascending: false }),
                supabase.from('roadmap_phases').select('*').eq('client_id', params.id).order('phase_number', { ascending: true })
            ]);

            setMaturityScores(maturityData || []);
            setTasks(taskData || []);
            setKpis(kpiData || []);
            setDocuments(documentsData || []);
            setRoadmapPhases(roadmapData || []);
            setLoading(false);
        }
        fetchClientData();
    }, [params.id]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'maturity', label: 'Maturity', icon: ShieldCheck },
        { id: 'kpis', label: 'KPIs', icon: Target },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'roadmap', label: 'Roadmap', icon: Milestone },
        { id: 'documents', label: 'Vault', icon: FileText },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-slate-500 font-medium">Client record not found.</p>
                <Link href="/admin" className="text-indigo-400 font-bold hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Portfolio
                </Link>
            </div>
        );
    }

    const avgMaturity = maturityScores.length
        ? (maturityScores.reduce((acc, curr) => acc + curr.score, 0) / maturityScores.length).toFixed(1)
        : '0.0';

    const completedTasks = tasks.filter(t => t.status === 'done').length;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Top Navigation & Actions */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold text-white tracking-tight">{client.company_name}</h2>
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                                client.engagement_status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                            )}>{client.engagement_status}</span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1 font-medium">{client.industry || 'Consulting'} • Engagement started {new Date(client.engagement_start).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm opacity-50 cursor-not-allowed">
                        <Share2 className="w-4 h-4" />
                        Client Portal Link
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 opacity-50 cursor-not-allowed">
                        <Settings2 className="w-4 h-4" />
                        Manage Engagement
                    </button>
                </div>
            </section>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-800 space-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                            activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="admin-tab-active"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Dynamic Content Based on Tab */}
            <div className="grid grid-cols-1 gap-8">
                {activeTab === 'overview' && (
                    <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Strategy Synopsis</h3>
                                    <Edit3 className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed text-sm">
                                    <p>Engagement with {client.company_name} is focused on digital infrastructure modernization and lead generation optimization. Current focus is transitioning past foundational assessment into active implementation of CRM and automation workflows.</p>
                                    <p className="mt-4 font-semibold text-indigo-400">Next Major Milestone: Phase {maturityScores.length > 0 ? 'Review' : 'Initialization'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Maturity Progress</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-white">{avgMaturity} <span className="text-xs text-slate-600">/ 5.0</span></div>
                                        <div className="h-2 flex-1 bg-slate-950 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${(parseFloat(avgMaturity) / 5) * 100}%` }} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 font-medium">Targeting 4.0 average by Q4</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Task Completion</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-white">{completedTasks} <span className="text-xs text-slate-600">/ {tasks.length}</span></div>
                                        <div className="h-2 flex-1 bg-slate-950 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: tasks.length ? `${(completedTasks / tasks.length) * 100}%` : '0%' }} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 font-medium">{tasks.length - completedTasks} active implementation items</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Strategic Assets</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-bold text-white">{documents.length}</div>
                                        <div className="h-2 flex-1 bg-slate-950 rounded-full" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 font-medium">Files in secure vault</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 text-slate-500">Internal Audit Logs</h4>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                                        <p className="text-xs text-slate-400 leading-relaxed italic">"Initial data suggests {client.company_name} has high potential for automation roi. CEO and COO are aligned on the transition."</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Automated Log • By PCM System</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-xs text-slate-600 cursor-not-allowed">
                                        + Add Private Note
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'maturity' && (
                    <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Manage Maturity Matrix</h3>
                            <button
                                onClick={() => {
                                    setFormData({ dimension: '', score: 1 });
                                    setActiveModal('maturity');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                Add Dimension
                            </button>
                        </div>

                        <div className="space-y-6">
                            {maturityScores.map((score) => (
                                <div key={score.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-xl bg-slate-950 border border-slate-800 group">
                                    <div className="md:w-1/4">
                                        <p className="text-sm font-bold text-white uppercase tracking-widest">{score.dimension}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">Historical baseline established</p>
                                    </div>
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((lvl) => (
                                                <button
                                                    key={lvl}
                                                    onClick={async () => {
                                                        const { error } = await supabase
                                                            .from('maturity_scores')
                                                            .update({ score: lvl })
                                                            .eq('id', score.id);

                                                        if (!error) {
                                                            setMaturityScores(prev => prev.map(s => s.id === score.id ? { ...s, score: lvl } : s));
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                                                        lvl <= score.score ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-600 border border-slate-800 hover:border-slate-500"
                                                    )}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="h-1 flex-1 bg-slate-900 rounded-full" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={async () => {
                                                const { error } = await supabase.from('maturity_scores').delete().eq('id', score.id);
                                                if (!error) setMaturityScores(prev => prev.filter(s => s.id !== score.id));
                                            }}
                                            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {maturityScores.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-slate-600 text-sm italic">No maturity dimensions defined yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'kpis' && (
                    <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Manage Performance Metrics</h3>
                            <button
                                onClick={() => {
                                    setFormData({ name: '', value: 0, target: 0, category: 'marketing' });
                                    setActiveModal('kpi');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                Add KPI
                            </button>
                        </div>

                        <div className="space-y-4">
                            {['marketing', 'sales', 'financial'].map((cat) => (
                                <div key={cat} className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-800/50">{cat}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {kpis.filter(k => k.category === cat).map((kpi) => (
                                            <div key={kpi.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-bold text-white uppercase tracking-widest">{kpi.name}</p>
                                                        <button
                                                            onClick={async () => {
                                                                const { error } = await supabase.from('kpis').delete().eq('id', kpi.id);
                                                                if (!error) setKpis(prev => prev.filter(k => k.id !== kpi.id));
                                                            }}
                                                            className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <p className="text-2xl font-bold text-white">{kpi.value}</p>
                                                        <p className="text-xs text-slate-500 mb-1">Target: {kpi.target}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {activeTab === 'roadmap' && (
                    <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Strategy Roadmap Phases</h3>
                            <button
                                onClick={() => {
                                    setFormData({ title: '', phase_number: roadmapPhases.length + 1 });
                                    setActiveModal('roadmap');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                Add Phase
                            </button>
                        </div>

                        <div className="space-y-4">
                            {roadmapPhases.map((phase) => (
                                <div key={phase.id} className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                    <div className="flex items-center gap-4 md:w-1/3">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                                            {phase.phase_number}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{phase.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3 text-slate-600" />
                                                <p className="text-[10px] text-slate-500 uppercase font-medium">
                                                    {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {['not_started', 'in_progress', 'completed'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={async () => {
                                                    const { error } = await supabase.from('roadmap_phases').update({ status }).eq('id', phase.id);
                                                    if (!error) setRoadmapPhases(prev => prev.map(p => p.id === phase.id ? { ...p, status } : p));
                                                }}
                                                className={cn(
                                                    "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-all",
                                                    phase.status === status
                                                        ? "bg-indigo-600 text-white border-indigo-500"
                                                        : "bg-slate-900 text-slate-600 border-slate-800 hover:border-slate-700"
                                                )}
                                            >
                                                {status.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={async () => {
                                            const { error } = await supabase.from('roadmap_phases').delete().eq('id', phase.id);
                                            if (!error) setRoadmapPhases(prev => prev.filter(p => p.id !== phase.id));
                                        }}
                                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tasks' && (
                    <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Implementation Roadmap</h3>
                            <button
                                onClick={() => {
                                    setFormData({ title: '', priority: 'medium' });
                                    setActiveModal('task');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                Add Task
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {['todo', 'in_progress', 'done'].map((status) => (
                                <div key={status} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status.replace('_', ' ')}</h4>
                                        <span className="text-[10px] font-bold text-slate-700 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{tasks.filter(t => t.status === status).length}</span>
                                    </div>
                                    <div className="space-y-3 min-h-[100px] p-2 rounded-xl bg-slate-950/50 border border-dashed border-slate-800/50">
                                        {tasks.filter(t => t.status === status).map((task) => (
                                            <div key={task.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 group hover:border-indigo-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter border",
                                                        task.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                            task.priority === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    )}>{task.priority}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={async () => {
                                                                const nextStatus = status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'done' : 'todo';
                                                                const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
                                                                if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
                                                            }}
                                                            className="p-1 text-slate-600 hover:text-indigo-400"
                                                        >
                                                            <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const { error } = await supabase.from('tasks').delete().eq('id', task.id);
                                                                if (!error) setTasks(prev => prev.filter(t => t.id !== task.id));
                                                            }}
                                                            className="p-1 text-slate-600 hover:text-red-400"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-white mb-1 line-clamp-2">{task.title}</p>
                                                <p className="text-[9px] text-slate-500">Due {new Date(task.due_date).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'documents' && (
                    <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Document Management</h3>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setUploading(true);
                                        const fileExt = file.name.split('.').pop();
                                        const filePath = `${client.id}/${Math.random()}.${fileExt}`;

                                        // 1. Upload to Supabase Storage
                                        const { error: uploadError } = await supabase.storage
                                            .from('documents')
                                            .upload(filePath, file);

                                        if (uploadError) {
                                            console.error('Error uploading file:', uploadError);
                                            setUploading(false);
                                            return;
                                        }

                                        // 2. Add record to documents table
                                        const { error: dbError } = await supabase
                                            .from('documents')
                                            .insert({
                                                client_id: client.id,
                                                title: file.name,
                                                file_url: filePath,
                                                category: 'other',
                                                uploaded_at: new Date().toISOString()
                                            });

                                        if (dbError) {
                                            console.error('Error saving document record:', dbError);
                                        }

                                        // 3. Refresh list
                                        const { data: updatedDocs } = await supabase
                                            .from('documents')
                                            .select('*')
                                            .eq('client_id', client.id)
                                            .order('uploaded_at', { ascending: false });

                                        setDocuments(updatedDocs || []);
                                        setUploading(false);
                                    }}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer",
                                        uploading && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? 'Uploading...' : 'Upload Asset'}
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                                            <LucideFile className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate max-w-[150px]">{doc.title}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={async () => {
                                                const { data, error } = await supabase.storage
                                                    .from('documents')
                                                    .createSignedUrl(doc.file_url, 60);
                                                if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                            }}
                                            className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="md:col-span-2 text-center py-10 opacity-50">
                                    <p className="text-sm italic">No documents uploaded for this client.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'overview' && (
                    <div className="hidden">
                        {/* Placeholder to keep the structure consistent if needed */}
                    </div>
                )}
            </div>

            {/* Added: Document Management Modal or Section */}
            {activeTab === 'overview' && (
                <div className="mt-8 p-8 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">Recent Strategic Assets</h3>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 hover:text-white transition-all">
                                <FileText className="w-3.5 h-3.5" />
                                View Vault
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* We could list few docs here */}
                        <p className="text-slate-500 text-sm italic">Navigate to the Document Vault in the sidebar for full management.</p>
                    </div>
                </div>
            )}
            {/* Unified Form Modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">
                                    {activeModal === 'maturity' && 'Add Maturity Dimension'}
                                    {activeModal === 'kpi' && 'Add Performance Metric'}
                                    {activeModal === 'task' && 'Add Implementation Task'}
                                    {activeModal === 'roadmap' && 'Add Roadmap Phase'}
                                </h3>
                                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {activeModal === 'maturity' && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dimension Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Data Strategy"
                                            value={formData.dimension}
                                            onChange={(e) => setFormData({ ...formData, dimension: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>
                                )}

                                {activeModal === 'kpi' && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Metric Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Response Time"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Current Value</label>
                                                <input
                                                    type="number"
                                                    value={formData.value}
                                                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Target</label>
                                                <input
                                                    type="number"
                                                    value={formData.target}
                                                    onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) })}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                                            >
                                                <option value="marketing">Marketing</option>
                                                <option value="sales">Sales</option>
                                                <option value="financial">Financial</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {activeModal === 'task' && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Setup CRM Integration"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Priority</label>
                                            <div className="flex gap-2">
                                                {['low', 'medium', 'high'].map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setFormData({ ...formData, priority: p })}
                                                        className={cn(
                                                            "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all",
                                                            formData.priority === p
                                                                ? "bg-indigo-600 text-white border-indigo-500"
                                                                : "bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeModal === 'roadmap' && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Phase Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Infrastructure Modernization"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-10 flex gap-3">
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        if (activeModal === 'maturity') {
                                            const { data, error } = await supabase.from('maturity_scores').insert({
                                                client_id: params.id,
                                                dimension: formData.dimension,
                                                score: 1,
                                                assessed_at: new Date().toISOString().split('T')[0]
                                            }).select().single();
                                            if (data) setMaturityScores(prev => [...prev, data]);
                                        } else if (activeModal === 'kpi') {
                                            const { data, error } = await supabase.from('kpis').insert({
                                                client_id: params.id,
                                                name: formData.name,
                                                value: formData.value,
                                                target: formData.target,
                                                category: formData.category,
                                                recorded_at: new Date().toISOString().split('T')[0]
                                            }).select().single();
                                            if (data) setKpis(prev => [...prev, data]);
                                        } else if (activeModal === 'task') {
                                            const { data, error } = await supabase.from('tasks').insert({
                                                client_id: params.id,
                                                title: formData.title,
                                                status: 'todo',
                                                priority: formData.priority,
                                                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                            }).select().single();
                                            if (data) setTasks(prev => [...prev, data]);
                                        } else if (activeModal === 'roadmap') {
                                            const { data, error } = await supabase.from('roadmap_phases').insert({
                                                client_id: params.id,
                                                title: formData.title,
                                                phase_number: formData.phase_number,
                                                status: 'not_started',
                                                start_date: new Date().toISOString().split('T')[0],
                                                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                            }).select().single();
                                            if (data) setRoadmapPhases(prev => [...prev, data]);
                                        }
                                        setIsSubmitting(false);
                                        setActiveModal(null);
                                    }}
                                    disabled={isSubmitting || (activeModal === 'maturity' && !formData.dimension) || (activeModal === 'kpi' && !formData.name) || (activeModal === 'task' && !formData.title) || (activeModal === 'roadmap' && !formData.title)}
                                    className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                    Confirm Action
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
