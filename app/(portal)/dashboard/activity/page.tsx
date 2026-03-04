'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    MessageSquare,
    Milestone,
    PenTool,
    Search,
    ChevronDown,
    User,
    ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function ActivityTimelinePage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchActivity() {
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
                    .from('activity_log')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('occurred_at', { ascending: false });
                setActivity(data || []);
            }
            setLoading(false);
        }
        fetchActivity();
    }, []);

    const filteredActivity = activity.filter(log =>
        log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.body?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'meeting': return { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' };
            case 'milestone': return { icon: Milestone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
            case 'note': return { icon: PenTool, color: 'text-amber-400', bg: 'bg-amber-500/10' };
            default: return { icon: Calendar, color: 'text-slate-400', bg: 'bg-slate-500/10' };
        }
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
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-blue-500" />
                        <h2 className="text-3xl font-bold text-white tracking-tight">Activity & Meeting Notes</h2>
                    </div>
                    <p className="text-slate-400 mt-2">Chronological record of our strategic engagement and key decisions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search activity..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-[240px] transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <div className="relative max-w-4xl mx-auto">
                {/* Central Vertical Line */}
                <div className="absolute left-0 h-full w-px bg-slate-800 ml-[18px]" />

                <div className="space-y-12">
                    {filteredActivity.map((log) => {
                        const styles = getTypeStyles(log.type);
                        return (
                            <motion.div
                                key={log.id}
                                variants={item}
                                className="relative pl-12 group"
                            >
                                {/* Timeline Dot/Icon */}
                                <div className={cn(
                                    "absolute left-0 top-1 w-9 h-9 rounded-full border-4 border-slate-950 z-10 flex items-center justify-center transition-all duration-300",
                                    styles.bg
                                )}>
                                    <styles.icon className={cn("w-4 h-4", styles.color)} />
                                </div>

                                {/* Entry Card */}
                                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-current",
                                                styles.color,
                                                "bg-transparent"
                                            )}>
                                                {log.type}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-950/50 px-2 py-1 rounded-md text-[10px] font-medium border border-slate-800/50">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.occurred_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                        {log.title}
                                    </h3>

                                    <p className="text-slate-400 mt-4 leading-relaxed text-sm">
                                        {log.body}
                                    </p>

                                    <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Recorded By</p>
                                                <p className="text-xs text-slate-400 font-medium">{log.author || 'PCM Strategist'}</p>
                                            </div>
                                        </div>

                                        {log.type === 'meeting' && (
                                            <div className="flex gap-2">
                                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-400 text-xs font-bold border border-blue-500/20 hover:bg-blue-600/20 transition-all cursor-pointer opacity-50">
                                                    View Minutes
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {filteredActivity.length === 0 && (
                        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                            <p className="text-slate-500 font-medium italic">No activity recorded for this criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
