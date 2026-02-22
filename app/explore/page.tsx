"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MediaCard, MediaCardSkeleton, type MediaItem } from "@/components/media-card";
import { Input } from "@/components/ui/input";
import {
  Compass,
  Search,
  Film,
  Tv,
  Music,
  Gamepad2,
  BookOpen,
  Layers,
} from "lucide-react";

interface MediaItemWithProfile extends MediaItem {
  profiles: { username: string; display_name: string | null; is_public: boolean } | null;
}

const typeFilters = [
  { value: "", label: "All", icon: Layers },
  { value: "movie", label: "Movies", icon: Film },
  { value: "tv_show", label: "TV", icon: Tv },
  { value: "music", label: "Music", icon: Music },
  { value: "game", label: "Games", icon: Gamepad2 },
  { value: "book", label: "Books", icon: BookOpen },
];

export default function ExplorePage() {
  const [items, setItems] = useState<MediaItemWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("media_items")
      .select("*, profiles!inner(username, display_name, is_public)")
      .eq("profiles.is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setItems(data as unknown as MediaItemWithProfile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesTitle = item.title.toLowerCase().includes(q);
      const matchesCreator = item.creator?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesCreator) return false;
    }
    if (typeFilter && item.type !== typeFilter) return false;
    return true;
  });

  const typeCounts = typeFilters.map((t) => ({
    ...t,
    count: t.value === "" ? items.length : items.filter((i) => i.type === t.value).length,
  }));

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      {/* Hero-style header with search */}
      <div className="bg-gradient-to-b from-slate-100 to-background dark:from-slate-900 dark:to-background">
        <div className="container py-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-4">
            <Compass className="h-3.5 w-3.5" />
            Community
          </div>
          <h1 className="text-3xl font-bold mb-2">Explore Collections</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
            Discover what others are watching, playing, reading, and listening to
          </p>
          {/* Inline search */}
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search community media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Type filter tabs — horizontal pill bar */}
      <div className="border-b bg-background sticky top-12 z-30">
        <div className="container">
          <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
            {typeCounts.map((t) => {
              const Icon = t.icon;
              const isActive = typeFilter === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  <span className={`text-xs ${isActive ? "text-indigo-200" : "text-muted-foreground/60"}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Compass className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nothing here yet</h3>
            <p className="text-muted-foreground text-sm">
              Be the first to share your collection with the community!
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} from the community
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  showOwner
                  ownerName={item.profiles?.display_name || item.profiles?.username || "Unknown"}
                  ownerUsername={item.profiles?.username}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
