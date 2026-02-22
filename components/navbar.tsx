"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import {
  Library,
  LogOut,
  Moon,
  Sun,
  User,
  Compass,
  Bot,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/explore", label: "Explore", icon: Compass },
        { href: "/ai-assistant", label: "AI", icon: Bot },
        { href: "/profile", label: "Profile", icon: User },
      ]
    : [];

  const isActive = (href: string) => pathname.startsWith(href);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* ========== DESKTOP TOP BAR — always dark "cinema" bar ========== */}
      <nav className="sticky top-0 z-40 w-full bg-slate-900 dark:bg-slate-950 text-slate-200">
        <div className="container flex h-12 items-center gap-6">
          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 shrink-0"
          >
            <Library className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              MediaTracker
            </span>
          </Link>

          {/* Desktop tab navigation */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 h-full">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
                {/* Active underline indicator */}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {/* Theme toggle — small pill switch */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative flex items-center w-14 h-7 rounded-full bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 transition-colors p-0.5"
              aria-label="Toggle theme"
            >
              <Sun className="h-3.5 w-3.5 text-amber-400 ml-1" />
              <Moon className="h-3.5 w-3.5 text-slate-400 ml-auto mr-1" />
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-slate-600 dark:bg-slate-400 shadow transition-transform duration-200 ${
                  theme === "dark" ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>

            {user ? (
              <>
                {/* Add Media — desktop only */}
                <Link
                  href="/media/new"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Link>

                {/* User avatar — desktop only */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {userInitial}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 rounded bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile: sign out (small) */}
            {user && (
              <button
                onClick={handleSignOut}
                className="md:hidden text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}

            {/* Mobile: auth links */}
            {!user && (
              <div className="md:hidden flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-slate-300 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-2.5 py-1 rounded bg-indigo-500 text-white text-sm font-semibold"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ========== MOBILE BOTTOM TAB BAR — Spotify/Instagram style ========== */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 dark:bg-slate-950 border-t border-slate-800 safe-area-bottom">
          <div className="flex items-center justify-around h-14 px-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 ${
                  isActive(link.href)
                    ? "text-indigo-400"
                    : "text-slate-500"
                }`}
              >
                <link.icon className={`h-5 w-5 ${isActive(link.href) ? "text-indigo-400" : ""}`} />
                <span className="text-[10px] font-medium truncate">{link.label}</span>
              </Link>
            ))}
            {/* Center "Add" button */}
            <Link
              href="/media/new"
              className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 -mt-3">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-medium text-slate-500">Add</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
