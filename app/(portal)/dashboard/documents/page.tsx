'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Download,
    Search,
    Filter,
    FilePieChart,
    FileSignature,
    FileCode,
    ExternalLink,
    MoreVertical
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function DocumentVaultPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchDocuments() {
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
                    .from('documents')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('uploaded_at', { ascending: false });
                setDocuments(data || []);
            }
            setLoading(false);
        }
        fetchDocuments();
    }, []);

    const filteredDocs = documents.filter(doc => {
        const matchesFilter = filter === 'all' || doc.category === filter;
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const categories = [
        { id: 'all', label: 'All Files', icon: FileText },
        { id: 'report', label: 'Reports', icon: FilePieChart },
        { id: 'contract', label: 'Contracts', icon: FileSignature },
        { id: 'strategy', label: 'Strategy', icon: FileCode },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
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
                        <FileText className="w-8 h-8 text-blue-500" />
                        <h2 className="text-3xl font-bold text-white tracking-tight">Document Vault</h2>
                    </div>
                    <p className="text-slate-400 mt-2">Centralized library for all strategy assets and governance documents.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-[240px] transition-all"
                        />
                    </div>
                    <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* Categories Bar */}
            <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                            filter === cat.id
                                ? "bg-blue-600/10 border-blue-500 text-blue-400"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        )}
                    >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredDocs.map((doc) => (
                        <motion.div
                            key={doc.id}
                            layout
                            variants={item}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] transition-all duration-300 flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-3 rounded-xl bg-slate-950 border border-slate-800",
                                    doc.category === 'contract' ? "text-amber-400" :
                                        doc.category === 'report' ? "text-emerald-400" : "text-blue-400"
                                )}>
                                    {doc.category === 'contract' ? <FileSignature className="w-6 h-6" /> :
                                        doc.category === 'report' ? <FilePieChart className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                </div>
                                <button className="text-slate-600 hover:text-white transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                {doc.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">{doc.category}</p>

                            <p className="text-sm text-slate-400 mt-4 flex-1 line-clamp-2 leading-relaxed">
                                {doc.description || "No description provided."}
                            </p>

                            <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Added</span>
                                    <span className="text-xs text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-lg bg-slate-950 text-slate-500 hover:text-white hover:bg-slate-800 transition-all border border-slate-800">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!doc.file_url) return;

                                            const { data, error } = await supabase.storage
                                                .from('documents')
                                                .createSignedUrl(doc.file_url, 60);

                                            if (data?.signedUrl) {
                                                window.open(data.signedUrl, '_blank');
                                            } else {
                                                console.error('Error generating signed URL:', error);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/10"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredDocs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto">
                                <FileText className="w-8 h-8 text-slate-700" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold">No documents found</h4>
                                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
