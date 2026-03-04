'use client';

import { Bell, Search, Settings, HelpCircle } from 'lucide-react';

export default function Topbar() {
    return (
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <h1 className="text-lg font-semibold text-white">Client Command Portal</h1>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                    <Search className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950"></span>
                </button>
                <div className="h-6 w-px bg-slate-800 mx-2"></div>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                    <HelpCircle className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
