# 🚀 Digital Strategy Client Command Portal

A high-end, data-driven consulting portal built for strategic oversight and client management.

## 🏛 Architecture Overview
This is a **Next.js 15+** application using the **App Router** and **Supabase** for Backend-as-a-Service.

- **Frontend**: React, Framer Motion (Animations), Lucide React (Icons).
- **Styling**: Vanilla CSS with Tailwind-like utility support via `lib/utils.ts`.
- **Backend**: Supabase Auth (Server-side sessions), PostgreSQL, and Storage.
- **Security**: Row Level Security (RLS) is strictly enforced to ensure multi-tenant isolation.

## 📂 Project Structure
- `app/`: Contains the main routes and layouts.
  - `(auth)/`: Authentication flows (Login).
  - `(portal)/`: Protected dashboard and admin routes.
- `components/`: Shared UI components.
- `lib/`: Utility functions and Supabase clients.
- `supabase_schema.sql`: The source of truth for the database and RLS policies.

## 💅 Design System
The portal uses a **High-End Dark Aesthetic**:
- **Palette**: Deep Slates, Indigo accents, and Emerald for success states.
- **Glassmorphism**: Heavy use of backdrop blurs and semi-transparent overlays.
- **UX**: Professional modal forms instead of native browser prompts.

## 🛠 Setup & Development
1. **Environment**: Copy `.env.example` to `.env.local` and add your Supabase keys.
2. **Database**: Run `supabase_schema.sql` in your Supabase SQL editor.
3. **Run**: `npm run dev`

## 🤖 AI Context
Custom instructions for AI assistants are located in `.github/copilot-instructions.md`.
