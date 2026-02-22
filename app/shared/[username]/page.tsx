"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MediaCard, MediaCardSkeleton, type MediaItem } from "@/components/media-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  User,
  Globe,
  Copy,
  Library,
  Film,
  Tv,
  Music,
  Gamepad2,
  BookOpen,
  Star,
  ArrowLeft,
  Search,
  CalendarDays,
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
  music: "Music",
  game: "Game",
  book: "Book",
};

const typeIcons: Record<string, React.ElementType> = {
  movie: Film,
  tv_show: Tv,
  music: Music,
  game: Gamepad2,
  book: BookOpen,
};

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function SharedProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .eq("is_public", true)
      .single();

    if (profileError || !profileData) {
      toast("Profile not found or is private", "error");
      router.push("/explore");
      return;
    }

    setProfile(profileData);

    // Fetch media items
    const { data: itemsData } = await supabase
      .from("media_items")
      .select("*")
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false });

    if (itemsData) {
      setItems(itemsData);
    }
    setLoading(false);
  }, [params.username]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute stats
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const genres = new Set(items.map((i) => i.genre).filter(Boolean));
    const typeCounts = new Map<string, number>();
    let ratingSum = 0;
    let ratingCount = 0;
    items.forEach((item) => {
      typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
      if (item.rating) {
        ratingSum += item.rating;
        ratingCount++;
      }
    });
    const topType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const avgRating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null;
    return {
      total: items.length,
      genres: genres.size,
      topType: topType ? { type: topType[0], count: topType[1] } : null,
      avgRating,
    };
  }, [items]);

  // Get unique types for filter pills
  const types = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.type));
    return Array.from(set).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCreator = item.creator?.toLowerCase().includes(q);
        const matchesGenre = item.genre?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCreator && !matchesGenre) return false;
      }
      if (selectedType && item.type !== selectedType) return false;
      return true;
    });
  }, [items, searchQuery, selectedType]);

  const copyItem = async (item: MediaItem) => {
    if (!currentUserId) {
      toast("You must be logged in to copy items", "error");
      return;
    }

    const { error } = await supabase.from("media_items").insert({
      user_id: currentUserId,
      type: item.type,
      title: item.title,
      creator: item.creator,
      release_date: item.release_date,
      genre: item.genre,
      platform: item.platform,
      cover_image_url: item.cover_image_url,
      notes: item.notes,
      ai_summary: item.ai_summary,
      status: "wishlist",
      rating: null,
      progress: 0,
    });

    if (error) {
      toast("Failed to copy item", "error");
    } else {
      toast("Item copied to your collection as wishlist!");
    }
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-6 max-w-5xl">
        <div className="animate-pulse">
          <div className="rounded-md shadow-md ring-1 ring-black/5 dark:ring-white/5 bg-card p-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 bg-muted rounded-full" />
              <div className="space-y-3 flex-1">
                <div className="h-7 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container py-6 space-y-8 max-w-5xl">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Profile header card */}
      <div className="rounded-md shadow-md ring-1 ring-black/5 dark:ring-white/5 bg-card overflow-hidden">
        <div className="px-6 sm:px-8 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover ring-2 ring-primary/10"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-gradient-to-br from-primary/20 to-blue-100 dark:to-blue-900/30 flex items-center justify-center ring-2 ring-primary/10">
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              </div>
            )}

            {/* Name + meta */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                <Badge className="gap-1 w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                  <Globe className="h-3 w-3" /> Public Profile
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm mt-3 max-w-lg leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatJoinDate(profile.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Library className="h-3.5 w-3.5" />
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Library className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{stats.total === 1 ? "Item" : "Items"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{stats.genres}</p>
                  <p className="text-xs text-muted-foreground">{stats.genres === 1 ? "Genre" : "Genres"}</p>
                </div>
              </div>
              {stats.topType && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    {(() => {
                      const Icon = typeIcons[stats.topType.type] || Film;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-tight">{stats.topType.count}</p>
                    <p className="text-xs text-muted-foreground">{typeLabels[stats.topType.type] || stats.topType.type}</p>
                  </div>
                </div>
              )}
              {stats.avgRating && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-tight">{stats.avgRating}</p>
                    <p className="text-xs text-muted-foreground">Avg. Rating</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collection section */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Library className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">No media items yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            This user hasn&apos;t added any media to their collection yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Collection
              {filteredItems.length !== items.length && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredItems.length} of {items.length})
                </span>
              )}
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Type filter pills */}
          {types.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedType === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedType(null)}
              >
                All
              </Badge>
              {types.map((type) => (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedType(selectedType === type ? null : type)
                  }
                >
                  {typeLabels[type] || type}
                </Badge>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No items match your search.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative">
                  <MediaCard item={item} />
                  {currentUserId && currentUserId !== profile.id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 gap-1 z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyItem(item);
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
