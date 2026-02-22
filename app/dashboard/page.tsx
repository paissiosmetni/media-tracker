"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { MediaCard, MediaCardSkeleton, type MediaItem } from "@/components/media-card";
import { SearchBar, type SearchFilters } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  List,
  Library,
  Heart,
  Play,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Film,
  Tv,
  Music,
  Gamepad2,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#a855f7"];

const typeIcons: Record<string, React.ElementType> = {
  movie: Film,
  tv_show: Tv,
  music: Music,
  game: Gamepad2,
  book: BookOpen,
};

export default function DashboardPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: "",
    genre: "",
    status: "",
    platform: "",
  });
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items.filter((item) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchesTitle = item.title.toLowerCase().includes(q);
      const matchesCreator = item.creator?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesCreator) return false;
    }
    if (filters.type && item.type !== filters.type) return false;
    if (filters.genre && item.genre !== filters.genre) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.platform && item.platform !== filters.platform) return false;
    return true;
  });

  // Analytics data
  const genreData = items.reduce((acc, item) => {
    const key = item.genre || "Uncategorized";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const genreChartData = Object.entries(genreData).map(([name, value]) => ({ name, value }));

  const typeData = [
    { name: "Movies", count: items.filter((i) => i.type === "movie").length },
    { name: "TV Shows", count: items.filter((i) => i.type === "tv_show").length },
    { name: "Music", count: items.filter((i) => i.type === "music").length },
    { name: "Games", count: items.filter((i) => i.type === "game").length },
    { name: "Books", count: items.filter((i) => i.type === "book").length },
  ].filter((d) => d.count > 0);

  const avgRating = items.filter((i) => i.rating).length > 0
    ? (items.filter((i) => i.rating).reduce((sum, i) => sum + (i.rating || 0), 0) /
       items.filter((i) => i.rating).length).toFixed(1)
    : "—";

  const stats = {
    total: items.length,
    wishlist: items.filter((i) => i.status === "wishlist").length,
    inProgress: items.filter((i) => i.status === "currently_using").length,
    completed: items.filter((i) => i.status === "completed").length,
    owned: items.filter((i) => i.status === "owned").length,
    avgRating,
  };

  // Type breakdown for sidebar
  const typeCounts = [
    { type: "movie", label: "Movies", count: items.filter((i) => i.type === "movie").length },
    { type: "tv_show", label: "TV Shows", count: items.filter((i) => i.type === "tv_show").length },
    { type: "music", label: "Music", count: items.filter((i) => i.type === "music").length },
    { type: "game", label: "Games", count: items.filter((i) => i.type === "game").length },
    { type: "book", label: "Books", count: items.filter((i) => i.type === "book").length },
  ];

  return (
    <div className="flex min-h-[calc(100vh-3rem)]">
      {/* ===== LEFT SIDEBAR — stats + type breakdown + filters ===== */}
      <aside className={`hidden lg:flex flex-col border-r bg-slate-50 dark:bg-slate-900/50 transition-all ${sidebarCollapsed ? "w-16" : "w-72"} shrink-0`}>
        {/* Sidebar header */}
        <div className="p-4 border-b flex items-center gap-2">
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">My Collection</h1>
              <p className="text-xs text-muted-foreground">{stats.total} items total</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronDown className="h-4 w-4 rotate-[-90deg]" /> : <ChevronUp className="h-4 w-4 rotate-[-90deg]" />}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Stats grid — 2x2 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-pink-500/10 p-3 text-center">
                <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats.wishlist}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wishlist</p>
              </div>
              <div className="rounded-md bg-yellow-500/10 p-3 text-center">
                <Play className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats.inProgress}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
              </div>
              <div className="rounded-md bg-green-500/10 p-3 text-center">
                <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats.completed}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Done</p>
              </div>
              <div className="rounded-md bg-indigo-500/10 p-3 text-center">
                <Star className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{avgRating}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg</p>
              </div>
            </div>

            {/* Type breakdown — visual bars */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">By Type</h3>
              <div className="space-y-2">
                {typeCounts.map((t) => {
                  const Icon = typeIcons[t.type] || Film;
                  const pct = stats.total > 0 ? (t.count / stats.total) * 100 : 0;
                  return (
                    <button
                      key={t.type}
                      className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors text-sm ${
                        filters.type === t.type
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                          : "hover:bg-muted/60"
                      }`}
                      onClick={() => setFilters(prev => ({ ...prev, type: prev.type === t.type ? "" : t.type }))}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.count}</span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <Link href="/media/new" className="block">
                <Button className="w-full gap-1.5" size="sm">
                  <Plus className="h-3.5 w-3.5" /> Add Media
                </Button>
              </Link>
              <Link href="/ai-assistant" className="block">
                <Button variant="outline" className="w-full gap-1.5" size="sm">
                  Ask AI for Suggestions
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Collapsed state — just icons */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center gap-3 py-4">
            <div className="text-center" title={`${stats.wishlist} wishlist`}>
              <Heart className="h-4 w-4 text-pink-500 mx-auto" />
              <span className="text-xs font-bold">{stats.wishlist}</span>
            </div>
            <div className="text-center" title={`${stats.inProgress} in progress`}>
              <Play className="h-4 w-4 text-yellow-500 mx-auto" />
              <span className="text-xs font-bold">{stats.inProgress}</span>
            </div>
            <div className="text-center" title={`${stats.completed} completed`}>
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
              <span className="text-xs font-bold">{stats.completed}</span>
            </div>
            <div className="border-t w-8 my-1" />
            <Link href="/media/new" title="Add Media">
              <Button size="icon" className="h-8 w-8">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 min-w-0">
        {/* Mobile header — visible on < lg */}
        <div className="lg:hidden bg-slate-50 dark:bg-slate-900/50 border-b p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">My Collection</h1>
              <p className="text-xs text-muted-foreground">{stats.total} items</p>
            </div>
            <Link href="/media/new">
              <Button size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </Link>
          </div>
          {/* Horizontal scrolling stat pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1 shrink-0">
              <Heart className="h-3 w-3 text-pink-500" />
              <span className="text-xs font-semibold">{stats.wishlist}</span>
              <span className="text-[10px] text-muted-foreground">Wishlist</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 shrink-0">
              <Play className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-semibold">{stats.inProgress}</span>
              <span className="text-[10px] text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 shrink-0">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs font-semibold">{stats.completed}</span>
              <span className="text-[10px] text-muted-foreground">Done</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 shrink-0">
              <ShoppingBag className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-semibold">{stats.owned}</span>
              <span className="text-[10px] text-muted-foreground">Owned</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 shrink-0">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-semibold">{avgRating}</span>
              <span className="text-[10px] text-muted-foreground">Avg</span>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 space-y-4">
          {/* Toolbar row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <SearchBar filters={filters} onFiltersChange={setFilters} />
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant={showAnalytics ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowAnalytics(!showAnalytics)}
                title="Toggle analytics"
                className="h-9 w-9"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <div className="flex rounded-md ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
                <button
                  className={`px-2.5 py-2 transition-colors ${viewMode === "grid" ? "bg-indigo-500 text-white" : "hover:bg-muted"}`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  className={`px-2.5 py-2 transition-colors ${viewMode === "list" ? "bg-indigo-500 text-white" : "hover:bg-muted"}`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Analytics — collapsible inline */}
          {showAnalytics && items.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Genre Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPie>
                      <Pie
                        data={genreChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }) => `${name} (${value})`}
                        dataKey="value"
                      >
                        {genreChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Media Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={typeData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Media grid/list */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <MediaCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              {items.length === 0 ? (
                <>
                  <Library className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-semibold mb-2">Your collection is empty</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Start tracking your movies, TV shows, music, games, and books.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/media/new">
                      <Button>Add Your First Item</Button>
                    </Link>
                    <Link href="/ai-assistant">
                      <Button variant="outline">Ask AI</Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">No matching items</h3>
                  <p className="text-muted-foreground text-sm">Try adjusting your filters.</p>
                </>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onStatusChange={fetchItems}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onStatusChange={fetchItems}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
