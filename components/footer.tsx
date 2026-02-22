import Link from "next/link";
import { Library } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 mt-auto">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-indigo-400" />
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                MediaTracker
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Your smart companion for tracking movies, TV shows, music, games, and books.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-12 text-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
              <nav className="flex flex-col gap-2 text-slate-400">
                <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
                <Link href="/ai-assistant" className="hover:text-white transition-colors">AI Assistant</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account</p>
              <nav className="flex flex-col gap-2 text-slate-400">
                <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
                <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
                <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom divider + copyright */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
          &copy; {new Date().getFullYear()} MediaTracker. Built with Next.js, Supabase &amp; AI.
        </div>
      </div>
    </footer>
  );
}
