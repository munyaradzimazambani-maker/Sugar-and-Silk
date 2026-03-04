'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { ShieldCheck, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function MaturityScorePage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState<any[]>([]);

    useEffect(() => {
        async function fetchMaturityData() {
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
                    .from('maturity_scores')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('dimension', { ascending: true });
                setScores(data || []);
            }
            setLoading(false);
        }
        fetchMaturityData();
    }, []);

    // Transform data for Recharts
    const chartData = scores.map(score => ({
        subject: score.dimension,
        A: score.score,
        fullMark: 5,
    }));

    const avgScore = scores.length
        ? (scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length).toFixed(1)
        : '0.0';

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
            <section>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                    <h2 className="text-3xl font-bold text-white tracking-tight">Digital Maturity Score</h2>
                </div>
                <p className="text-slate-400 mt-2">A data-driven assessment of your current digital capabilities and performance systems.</p>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Radar Chart Card */}
                <motion.div variants={item} className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
                    <h3 className="text-xl font-semibold text-white mb-8">Capability Overview</h3>
                    <div className="h-[400px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Radar
                                    name="Maturity"
                                    dataKey="A"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Aggregate Score</p>
                            <p className="text-3xl font-bold text-white mt-1">{avgScore}/5</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Industry Average</p>
                            <p className="text-3xl font-bold text-slate-300 mt-1">2.4/5</p>
                        </div>
                    </div>
                </motion.div>

                {/* Breakdown & Analysis */}
                <motion.div variants={item} className="space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-400" />
                            Strategic Analysis
                        </h3>
                        <p className="text-slate-400 leading-relaxed">
                            {parseFloat(avgScore) > 2.4
                                ? "Your overall maturity is above the SME average. We are seeing strong returns on your current digital infrastructure, though specific bottlenecks remain."
                                : "Your overall maturity is currently inline with or below industry averages. Significant growth opportunities exist by addressing foundational data silos and manual processes."}
                        </p>
                        <div className="mt-6 space-y-4">
                            {scores.filter(s => s.score >= 4).slice(0, 1).map(s => (
                                <div key={s.id} className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                    <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Strength: {s.dimension}</p>
                                        <p className="text-xs text-slate-400 mt-1">Your high performance here is a competitive advantage. Leverage this to support weaker dimensions.</p>
                                    </div>
                                </div>
                            ))}
                            {scores.filter(s => s.score <= 2).slice(0, 1).map(s => (
                                <div key={s.id} className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">Focus Area: {s.dimension}</p>
                                        <p className="text-xs text-slate-400 mt-1">Limited capability in this area is impacting overall ROI. High priority for upcoming implementation phases.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Detailed Dimension Scoring</h3>
                        <div className="space-y-4">
                            {scores.map((s) => (
                                <div key={s.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">{s.dimension}</span>
                                        <span className="text-white font-bold">{s.score}/5</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(s.score / 5) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                s.score >= 4 ? "bg-blue-500" : s.score >= 2 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                            {scores.length === 0 && (
                                <div className="text-center py-6">
                                    <p className="text-slate-600 text-sm italic">No dimension scores recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
