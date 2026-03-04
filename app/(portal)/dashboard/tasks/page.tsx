'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckSquare,
    Plus,
    Calendar,
    User,
    AlertCircle,
    Clock,
    CheckCircle2,
    Circle,
    ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function TaskTrackerPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        async function fetchTasks() {
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
                    .from('tasks')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('due_date', { ascending: true });
                setTasks(data || []);
            }
            setLoading(false);
        }
        fetchTasks();
    }, []);

    const filteredTasks = tasks.filter(task => filter === 'all' || task.priority === filter);

    const columns = [
        { title: 'To Do', status: 'todo', color: 'bg-slate-800' },
        { title: 'In Progress', status: 'in_progress', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
        { title: 'Completed', status: 'done', color: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-400 bg-red-400/10 border-red-500/20';
            case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
            case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
            default: return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
        }
    };

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
                        <CheckSquare className="w-8 h-8 text-blue-500" />
                        <h2 className="text-3xl font-bold text-white tracking-tight">Task Tracker</h2>
                    </div>
                    <p className="text-slate-400 mt-2">Implementation items and strategic action steps.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        {['all', 'high', 'medium', 'low'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilter(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                    filter === p
                                        ? "bg-slate-800 text-white"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    {/* Admin only feature in future, or client can add requests */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 opacity-50 cursor-not-allowed">
                        <Plus className="w-4 h-4" />
                        New Task
                    </button>
                </div>
            </section>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {columns.map((column) => (
                    <div key={column.status} className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    column.status === 'todo' ? "bg-slate-600" :
                                        column.status === 'in_progress' ? "bg-blue-500" : "bg-emerald-500"
                                )} />
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">{column.title}</h3>
                                <span className="bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">
                                    {filteredTasks.filter(t => t.status === column.status).length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 min-h-[500px] p-2 rounded-2xl bg-slate-950/20 border border-dashed border-slate-800/50">
                            <AnimatePresence mode="popLayout">
                                {filteredTasks
                                    .filter(task => task.status === column.status)
                                    .map((task) => (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            variants={item}
                                            initial="hidden"
                                            animate="show"
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            whileHover={{ y: -2 }}
                                            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-default group shadow-sm"
                                        >
                                            <div className="flex justify-between items-start gap-3 mb-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                                                    getPriorityColor(task.priority)
                                                )}>
                                                    {task.priority}
                                                </span>
                                                <div className="flex text-slate-700 group-hover:text-slate-500 transition-colors">
                                                    {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500/50" /> : <Circle className="w-4 h-4" />}
                                                </div>
                                            </div>

                                            <h4 className={cn(
                                                "font-semibold leading-snug group-hover:text-blue-400 transition-colors",
                                                task.status === 'done' ? "text-slate-500 line-through" : "text-white"
                                            )}>
                                                {task.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                {task.description}
                                            </p>

                                            <div className="mt-6 pt-5 border-t border-slate-800/50 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-medium">{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center -space-x-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                                                        {task.assignee ? task.assignee[0] : 'U'}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                            {filteredTasks.filter(t => t.status === column.status).length === 0 && (
                                <div className="flex items-center justify-center h-40">
                                    <p className="text-slate-700 text-xs italic">No tasks in this column.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
