'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    MoreHorizontal,
    Building2,
    Calendar,
    ShieldCheck,
    ExternalLink,
    X,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function AdminClientListPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState({
        company_name: '',
        industry: '',
        engagement_start: new Date().toISOString().split('T')[0]
    });
    const [isCreating, setIsCreating] = useState(false);

    async function fetchClients() {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('company_name', { ascending: true });

        if (data) {
            setClients(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchClients();
    }, []);

    async function handleCreateClient() {
        if (!newClient.company_name) return;
        setIsCreating(true);

        const { data, error } = await supabase
            .from('clients')
            .insert(newClient)
            .select()
            .single();

        if (error) {
            console.error('Error creating client:', error);
        } else {
            setIsAddModalOpen(false);
            setNewClient({
                company_name: '',
                industry: '',
                engagement_start: new Date().toISOString().split('T')[0]
            });
            fetchClients();
        }
        setIsCreating(false);
    }

    async function handleDeleteClient(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete ${name}? This will remove all associated data.`)) return;

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting client:', error);
        } else {
            fetchClients();
        }
    }

    const filteredClients = clients.filter(c =>
        c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <Users className="w-8 h-8 text-indigo-500" />
                        <h2 className="text-3xl font-bold text-white tracking-tight">Client Portfolio</h2>
                    </div>
                    <p className="text-slate-400 mt-2">Manage all active and past consulting engagements.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-[240px] transition-all"
                        />
                    </div>
                    {/* Admin action placeholder */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Client
                    </button>
                </div>
            </section>

            {/* Client List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Client & Company</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Industry</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Maturity</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Started</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map((client) => (
                            <motion.tr
                                key={client.id}
                                variants={item}
                                className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{client.company_name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 font-medium">PCM Strategic Consulting</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-sm text-slate-400">{client.industry || 'Consulting'}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                                        client.engagement_status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                                    )}>
                                        {client.engagement_status}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-300">Targeting 4/5</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(client.engagement_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/clients/${client.id}`}
                                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 transition-all border border-slate-700"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteClient(client.id, client.company_name)}
                                            className="p-2 rounded-lg bg-slate-800 text-slate-600 hover:text-red-400 transition-all border border-slate-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {filteredClients.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-slate-500 italic font-medium">No clients found matching your search.</p>
                    </div>
                )}

                <div className="p-6 bg-slate-950/20 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <p>Total clients: {clients.length}</p>
                    <div className="flex items-center gap-4">
                        <button className="hover:text-white disabled:opacity-50" disabled>Previous</button>
                        <button className="hover:text-white disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={item} className="p-6 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">Portfolio Value</p>
                    <p className="text-3xl font-bold mt-2">$240,000</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-2 py-1 rounded">
                        <ArrowUpRight className="w-3 h-3" />
                        +12% vs last month
                    </div>
                </motion.div>
                <motion.div variants={item} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Clients</p>
                    <p className="text-3xl font-bold text-white mt-2">{clients.filter(c => c.engagement_status === 'active').length}</p>
                    <p className="text-xs text-slate-500 mt-2 italic font-medium">Strategic ongoing support</p>
                </motion.div>
                <motion.div variants={item} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Pulse</p>
                    <p className="text-3xl font-bold text-white mt-2">Active</p>
                    <p className="text-xs text-indigo-400 mt-2 font-bold cursor-pointer hover:underline">Run Portfolio Audit →</p>
                </motion.div>
            </div>

            {/* Add Client Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Onboard New Client</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acme Digital"
                                        value={newClient.company_name}
                                        onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Industry</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Fintech, Retail"
                                        value={newClient.industry}
                                        onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Engagement Start</label>
                                    <input
                                        type="date"
                                        value={newClient.engagement_start}
                                        onChange={(e) => setNewClient({ ...newClient, engagement_start: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-10 flex gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateClient}
                                    disabled={isCreating || !newClient.company_name}
                                    className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                    Create Engagement
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
