"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import {
  Film,
  Tv,
  Music,
  Gamepad2,
  BookOpen,
  ShoppingBag,
  Heart,
  Play,
  CheckCircle,
  User,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export interface MediaItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  creator: string | null;
  release_date: string | null;
  genre: string | null;
  platform: string | null;
  status: string;
  rating: number | null;
  cover_image_url: string | null;
  notes: string | null;
  ai_summary: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

interface MediaCardProps {
  item: MediaItem;
  onStatusChange?: () => void;
  showOwner?: boolean;
  ownerName?: string;
  ownerUsername?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  movie: Film,
  tv_show: Tv,
  music: Music,
  game: Gamepad2,
  book: BookOpen,
};

const typeLabels: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
  music: "Music",
  game: "Game",
  book: "Book",
};

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  owned: { icon: ShoppingBag, label: "Owned", color: "text-blue-500", bg: "bg-blue-500" },
  wishlist: { icon: Heart, label: "Wishlist", color: "text-pink-500", bg: "bg-pink-500" },
  currently_using: { icon: Play, label: "In Progress", color: "text-yellow-500", bg: "bg-yellow-500" },
  completed: { icon: CheckCircle, label: "Completed", color: "text-green-500", bg: "bg-green-500" },
};

export function MediaCard({ item, onStatusChange, showOwner, ownerName, ownerUsername }: MediaCardProps) {
  const { toast } = useToast();
  const supabase = createClient();

  const cycleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const statuses = ["owned", "wishlist", "currently_using", "completed"];
    const currentIdx = statuses.indexOf(item.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];

    const { error } = await supabase
      .from("media_items")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      toast("Failed to update status", "error");
    } else {
      toast(`Marked as ${statusConfig[nextStatus]?.label}`);
      onStatusChange?.();
    }
  };

  const TypeIcon = typeIcons[item.type] || Film;
  const StatusIcon = statusConfig[item.status]?.icon || ShoppingBag;
  const statusBg = statusConfig[item.status]?.bg || "bg-slate-500";

  // ===== POSTER CARD — when cover image exists =====
  // Completely custom structure — NO Card/CardHeader/CardContent wrappers
  if (item.cover_image_url) {
    return (
      <div>
        <Link href={`/media/${item.id}`} className="group block">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/5 hover:shadow-xl hover:ring-indigo-500/20 transition-all">
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Status indicator — colored top bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${statusBg}`} />

            {/* Type icon chip — top left */}
            <div className="absolute top-3 left-2">
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded px-1.5 py-0.5">
                <TypeIcon className="h-2.5 w-2.5" />
                {typeLabels[item.type]}
              </div>
            </div>

            {/* Status button — top right */}
            <button
              className="absolute top-2.5 right-2 h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
              onClick={cycleStatus}
              title={`Status: ${statusConfig[item.status]?.label}`}
            >
              <StatusIcon className="h-3.5 w-3.5 text-white" />
            </button>

            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-3 px-3">
              <h3 className="font-bold text-sm leading-tight line-clamp-2 text-white drop-shadow-sm">
                {item.title}
              </h3>
              {item.creator && (
                <p className="text-[11px] text-white/60 mt-0.5 truncate">{item.creator}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {item.genre && (
                  <span className="text-[10px] bg-white/15 text-white/90 rounded px-1.5 py-0.5">{item.genre}</span>
                )}
                {item.rating && (
                  <span className="text-[10px] text-amber-300 flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-amber-300" /> {item.rating}
                  </span>
                )}
              </div>
            </div>

            {/* Progress overlay at very bottom */}
            {item.status === "currently_using" && item.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                <div className="h-full bg-indigo-400" style={{ width: `${item.progress}%` }} />
              </div>
            )}
          </div>
        </Link>
        {/* Owner below the card — outside the Link to avoid nested <a> */}
        {showOwner && ownerName && (
          <div className="mt-1.5 text-xs text-muted-foreground truncate">
            {ownerUsername ? (
              <Link
                href={`/shared/${ownerUsername}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <User className="h-3 w-3" />
                {ownerName}
              </Link>
            ) : (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {ownerName}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ===== PLACEHOLDER CARD — no cover image =====
  // Vertical card with colored placeholder area matching the poster grid
  const typeGradients: Record<string, string> = {
    movie: "from-blue-600 to-blue-800",
    tv_show: "from-purple-600 to-purple-800",
    music: "from-pink-600 to-pink-800",
    game: "from-emerald-600 to-emerald-800",
    book: "from-amber-600 to-amber-800",
  };

  const gradient = typeGradients[item.type] || "from-slate-600 to-slate-800";

  return (
    <div>
      <Link href={`/media/${item.id}`} className="group block">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/5 hover:shadow-xl hover:ring-indigo-500/20 transition-all">
          {/* Colored gradient background as poster placeholder */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

          {/* Status indicator — colored top bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${statusBg}`} />

          {/* Centered type icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center -mt-6">
            <TypeIcon className="h-12 w-12 text-white/20" />
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest mt-2">{typeLabels[item.type]}</span>
          </div>

          {/* Status button — top right */}
          <button
            className="absolute top-2.5 right-2 h-7 w-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            onClick={cycleStatus}
            title={`Status: ${statusConfig[item.status]?.label}`}
          >
            <StatusIcon className="h-3.5 w-3.5 text-white" />
          </button>

          {/* Bottom info overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-3">
            <h3 className="font-bold text-sm leading-tight line-clamp-2 text-white drop-shadow-sm">
              {item.title}
            </h3>
            {item.creator && (
              <p className="text-[11px] text-white/60 mt-0.5 truncate">{item.creator}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {item.genre && (
                <span className="text-[10px] bg-white/15 text-white/90 rounded px-1.5 py-0.5">{item.genre}</span>
              )}
              {item.platform && (
                <span className="text-[10px] bg-white/10 text-white/70 rounded px-1.5 py-0.5">{item.platform}</span>
              )}
              {item.rating && (
                <span className="text-[10px] text-amber-300 flex items-center gap-0.5 ml-auto">
                  <Star className="h-2.5 w-2.5 fill-amber-300" /> {item.rating}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {item.status === "currently_using" && item.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div className="h-full bg-indigo-400" style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>
      </Link>
      {/* Owner below the card — outside the Link to avoid nested <a> */}
      {showOwner && ownerName && (
        <div className="mt-1.5 text-xs text-muted-foreground truncate">
          {ownerUsername ? (
            <Link
              href={`/shared/${ownerUsername}`}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <User className="h-3 w-3" />
              {ownerName}
            </Link>
          ) : (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ownerName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 animate-pulse">
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300 dark:bg-slate-600" />
      <div className="absolute top-3 left-2 w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-1.5" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}
