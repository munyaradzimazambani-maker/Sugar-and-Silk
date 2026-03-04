# GitHub Copilot: Project Instructions

This file provides context to GitHub Copilot to ensure it generates code that aligns with the **Digital Strategy Portal** architecture and design standards.

## 🛠 Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Database/Auth**: Supabase (via `@supabase/ssr`)
- **Styling**: Vanilla CSS + Tailwind-like utility classes (`lib/utils.ts` for `cn` helper)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 🎨 Design System (The "Aesthetic")
- **Theme**: High-end Dark Mode (Slate-based).
- **Colors**: Deep slates (`#020617`), indigo accents (`indigo-500/600`), and emerald for success/active states.
- **Glassmorphism**: Use `backdrop-blur-sm` and `bg-slate-900/80` for overlays and modals.
- **Typography**: Bold, uppercase tracking-widest for headers and labels.

## 🔒 Security & Data
- **Supabase RLS**: Always ensure queries are compatible with Row Level Security.
- **Data Fetching**: Use standard Supabase client patterns. Do not hardcode credentials.
- **Server Components**: Prefer Server Components for data fetching where possible, but use `'use client'` for interactive modules.

## 📐 Component Guidelines
- **Modals**: Follow the unified modal pattern used in `app/(portal)/admin/clients/[id]/page.tsx`.
- **Buttons**: Use the custom utility classes for "high-end" shadows and rounded-xl corners.
- **Consistency**: Keep the sidebar and topbar structure intact.

## 🚀 Key Patterns
- **Real-time**: Utilize Supabase realism for KPI and Task updates.
- **Error Handling**: Always destructure `{ data, error }` from Supabase calls and handle errors gracefully.
