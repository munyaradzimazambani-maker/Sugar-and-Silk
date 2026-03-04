'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Clock,
    Calendar,
    ArrowRight,
    Milestone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function RoadmapPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [phases, setPhases] = useState<any[]>([]);

    useEffect(() => {
        async function fetchRoadmapData() {
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
                    .from('roadmap_phases')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('phase_number', { ascending: true });
                setPhases(data || []);
            }
            setLoading(false);
        }
        fetchRoadmapData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
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
            <section>
                <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <h2 className="text-3xl font-bold text-white tracking-tight">Strategy Roadmap</h2>
                </div>
                <p className="text-slate-400 mt-2">The phased execution plan designed to hit your ROI targets.</p>
            </section>

            {/* Timeline Layout */}
            <div className="max-w-4xl">
                <div className="space-y-12">
                    {phases.map((phase, index) => (
                        <motion.div
                            key={phase.id}
                            variants={item}
                            className="relative pl-12"
                        >
                            {/* Vertical Line */}
                            {index !== phases.length - 1 && (
                                <div className="absolute left-6 top-10 bottom-[-48px] w-0.5 bg-slate-800" />
                            )}

                            {/* Status Icon */}
                            <div className={cn(
                                "absolute left-0 top-1 w-12 h-12 rounded-full border-4 border-slate-950 flex items-center justify-center z-10",
                                phase.status === 'completed' ? "bg-blue-500" :
                                    phase.status === 'in_progress' ? "bg-slate-900 border-blue-500/50" :
                                        "bg-slate-900 border-slate-800"
                            )}>
                                {phase.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-white" />}
                                {phase.status === 'in_progress' && <Clock className="w-6 h-6 text-blue-400" />}
                                {phase.status === 'not_started' && <Circle className="w-6 h-6 text-slate-700" />}
                            </div>

                            {/* Content Card */}
                            <div className={cn(
                                "p-6 rounded-2xl bg-slate-900 border transition-all duration-300",
                                phase.status === 'in_progress' ? "border-blue-500/30 ring-1 ring-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]" : "border-slate-800"
                            )}>
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                                            phase.status === 'completed' ? "bg-blue-500/10 text-blue-400" :
                                                phase.status === 'in_progress' ? "bg-emerald-500/10 text-emerald-400" :
                                                    "bg-slate-800 text-slate-500"
                                        )}>
                                            {phase.status === 'completed' ? 'Phase Complete' :
                                                phase.status === 'in_progress' ? 'Active Phase' : 'Upcoming'}
                                        </span>
                                        <h3 className="text-xl font-bold text-white mt-2">Phase {phase.phase_number}: {phase.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/50 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(phase.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                        <ArrowRight className="w-3 h-3" />
                                        <span>{new Date(phase.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>

                                <p className="text-slate-400 mb-6 leading-relaxed">
                                    {phase.description}
                                </p>

                                {/* Progress Mini Bar */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-500 uppercase tracking-wider">Implementation Progress</span>
                                        <span className="text-white">{phase.status === 'completed' ? '100%' : phase.status === 'in_progress' ? '35%' : '0%'}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: phase.status === 'completed' ? '100%' : phase.status === 'in_progress' ? '35%' : '0%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                phase.status === 'completed' ? "bg-blue-500" : "bg-blue-400"
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 text-xs">
                                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 flex items-start gap-3">
                                        <Milestone className="w-5 h-5 text-blue-500/50 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-300">Phase Objectives</p>
                                            <p className="mt-2">Focus on establishing the core infrastructure and initial high-impact implementations designed for immediate ROI visibility.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500/50 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-300">Success Criteria</p>
                                            <p className="mt-2">Completion of all high-priority phase tasks and alignment with strategic roadmap milestones.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {phases.length === 0 && (
                        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                            <p className="text-slate-500 font-medium">No roadmap phases have been initialized for your account yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
