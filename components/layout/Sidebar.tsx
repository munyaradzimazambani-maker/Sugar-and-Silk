'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    LineChart,
    Map,
    FileText,
    CheckSquare,
    Clock,
    User as UserIcon,
    ShieldCheck,
    Briefcase,
    LogOut
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Maturity Score', href: '/dashboard/maturity', icon: ShieldCheck },
    { name: 'Strategy Roadmap', href: '/dashboard/roadmap', icon: Map },
    { name: 'KPIs', href: '/dashboard/kpis', icon: LineChart },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Activity', href: '/dashboard/activity', icon: Clock },
];

const ADMIN_ITEMS = [
    { name: 'Client Manager', href: '/admin', icon: Briefcase },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        }
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <div className="flex flex-col h-screen w-64 bg-slate-950 border-r border-slate-800 text-slate-300">
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                        AG
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Portal</span>
                </div>

                <nav className="space-y-1">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Strategy</p>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group",
                                    isActive ? "text-white bg-slate-900" : "hover:text-white hover:bg-slate-900"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                                    />
                                )}
                                <item.icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {isAdmin && (
                    <nav className="mt-8 space-y-1">
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
                        {ADMIN_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group",
                                        isActive ? "text-white bg-slate-900" : "hover:text-white hover:bg-slate-900"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav-admin"
                                            className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                                        />
                                    )}
                                    <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>

            <div className="mt-auto p-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-3 px-2 py-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 border border-slate-700">
                        {profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || <UserIcon className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{profile?.full_name || (loading ? 'Loading...' : 'User')}</p>
                        <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-tight">{profile?.company_name || 'Strategic Client'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/10 transition-colors group"
                >
                    <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400" />
                    Logout
                </button>
            </div>
        </div>
    );
}
