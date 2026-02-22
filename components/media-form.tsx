"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/star-rating";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Trash2, Film, Tag as TagIcon, Sparkles, Check, X } from "lucide-react";

interface MediaData {
  id?: string;
  type: string;
  title: string;
  creator: string;
  release_date: string;
  genre: string;
  platform: string;
  status: string;
  rating: number | null;
  cover_image_url: string;
  notes: string;
  progress: number;
}

interface AISuggestion {
  title?: string;
  type?: string;
  creator?: string;
  release_date?: string;
  genre?: string;
  platform?: string;
  summary?: string;
}

interface MediaFormProps {
  initialData?: MediaData;
  initialTags?: string[];
  mode: "create" | "edit";
}

const genres = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi",
  "Thriller", "Western", "Musical", "Biography", "Indie", "Classical",
  "Rock", "Pop", "Hip-Hop", "Electronic", "Jazz", "R&B", "Country",
  "RPG", "FPS", "Strategy", "Puzzle", "Platformer", "Simulation",
  "Sports", "Racing", "Fighting", "Fiction", "Non-Fiction",
  "Self-Help", "History", "Science", "Philosophy", "Other",
];

const platforms = [
  "Netflix", "Disney+", "HBO Max", "Prime Video", "Apple TV+", "Hulu",
  "Spotify", "Apple Music", "YouTube Music", "Tidal",
  "Steam", "PlayStation", "Xbox", "Nintendo Switch", "Epic Games", "GOG",
  "Kindle", "Audible", "Physical", "Theater", "Vinyl", "CD", "Blu-ray",
  "Other",
];

function matchOption(value: string, options: string[]): string {
  if (!value) return "";
  const lower = value.toLowerCase();
  const exact = options.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;
  const partial = options.find((o) => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
  return partial || "";
}

export function MediaForm({ initialData, initialTags, mode }: MediaFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

  const [form, setForm] = useState<MediaData>(
    initialData || {
      type: "movie",
      title: "",
      creator: "",
      release_date: "",
      genre: "",
      platform: "",
      status: "owned",
      rating: null,
      cover_image_url: "",
      notes: "",
      progress: 0,
    }
  );

  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [tagInput, setTagInput] = useState("");

  // Clear highlights after animation
  useEffect(() => {
    if (highlightedFields.size > 0) {
      const timer = setTimeout(() => setHighlightedFields(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFields]);

  const updateField = <K extends keyof MediaData>(key: K, value: MediaData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // --- AI Lookup (fetches suggestion without applying) ---

  const handleAILookup = async () => {
    if (!form.title.trim()) {
      toast("Enter a title first", "error");
      return;
    }

    setAutoFilling(true);
    setAiSuggestion(null);

    try {
      const typeLabel = form.type.replace("_", " ");
      const message = `look up the ${typeLabel} "${form.title.trim()}"`;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: [] }),
      });

      if (!response.ok) {
        toast(response.status === 429 ? "AI rate limited — wait a moment" : "AI request failed", "error");
        return;
      }

      const data = await response.json();

      if (data.mediaItem) {
        const item = data.mediaItem as Record<string, unknown>;
        const suggestion: AISuggestion = {};

        if (item.title) suggestion.title = String(item.title);
        if (item.type) suggestion.type = String(item.type);
        if (item.creator) suggestion.creator = String(item.creator);
        if (item.release_date) suggestion.release_date = String(item.release_date);
        if (item.genre) {
          const matched = matchOption(String(item.genre), genres);
          suggestion.genre = matched || String(item.genre);
        }
        if (item.platform) {
          const matched = matchOption(String(item.platform), platforms);
          suggestion.platform = matched || String(item.platform);
        }
        if (item.summary) suggestion.summary = String(item.summary);

        setAiSuggestion(suggestion);
      } else {
        toast("AI couldn't find metadata for this title", "error");
      }
    } catch {
      toast("Failed to connect to AI", "error");
    } finally {
      setAutoFilling(false);
    }
  };

  // --- Apply all AI suggestions ---

  const applyAllSuggestions = () => {
    if (!aiSuggestion) return;

    const applied = new Set<string>();

    setForm((prev) => {
      const updated = { ...prev };

      if (aiSuggestion.title) {
        updated.title = aiSuggestion.title;
      }
      if (aiSuggestion.creator) {
        updated.creator = aiSuggestion.creator;
        applied.add("creator");
      }
      if (aiSuggestion.release_date) {
        updated.release_date = aiSuggestion.release_date;
        applied.add("release_date");
      }
      if (aiSuggestion.genre) {
        const matched = matchOption(aiSuggestion.genre, genres);
        if (matched) {
          updated.genre = matched;
          applied.add("genre");
        }
      }
      if (aiSuggestion.platform) {
        const matched = matchOption(aiSuggestion.platform, platforms);
        if (matched) {
          updated.platform = matched;
          applied.add("platform");
        }
      }
      if (aiSuggestion.type && !initialData) {
        const validTypes = ["movie", "tv_show", "music", "game", "book"];
        if (validTypes.includes(aiSuggestion.type)) {
          updated.type = aiSuggestion.type;
          applied.add("type");
        }
      }

      return updated;
    });

    if (aiSuggestion.summary) {
      setAiSummary(aiSuggestion.summary);
    }

    setHighlightedFields(applied);
    setAiSuggestion(null);
    toast(`Applied ${applied.size} fields`);
  };

  // --- Apply a single suggestion field ---

  const applySingleField = (field: string, value: string) => {
    if (field === "genre") {
      const matched = matchOption(value, genres);
      if (matched) updateField("genre", matched);
    } else if (field === "platform") {
      const matched = matchOption(value, platforms);
      if (matched) updateField("platform", matched);
    } else if (field === "type") {
      updateField("type", value);
    } else if (field === "creator") {
      updateField("creator", value);
    } else if (field === "release_date") {
      updateField("release_date", value);
    } else if (field === "title") {
      updateField("title", value);
    } else if (field === "summary") {
      setAiSummary(value);
    }

    setHighlightedFields(new Set([field]));

    // Remove this field from suggestion
    setAiSuggestion((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      delete (updated as Record<string, unknown>)[field];
      // If no fields left, close the panel
      const remaining = Object.values(updated).filter(Boolean);
      return remaining.length > 0 ? updated : null;
    });
  };

  const fieldHighlight = (field: string) =>
    highlightedFields.has(field)
      ? "ring-2 ring-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 transition-all duration-500"
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast("You must be logged in", "error");
      setSaving(false);
      return;
    }

    const mediaData = {
      user_id: user.id,
      type: form.type,
      title: form.title.trim(),
      creator: form.creator.trim() || null,
      release_date: form.release_date || null,
      genre: form.genre || null,
      platform: form.platform || null,
      status: form.status,
      rating: form.rating,
      cover_image_url: form.cover_image_url.trim() || null,
      notes: form.notes.trim() || null,
      ai_summary: aiSummary || null,
      progress: form.status === "currently_using" ? form.progress : 0,
    };

    if (mode === "create") {
      const { data, error } = await supabase
        .from("media_items")
        .insert(mediaData)
        .select()
        .single();

      if (error) {
        toast(`Error creating item: ${error.message}`, "error");
        setSaving(false);
        return;
      }

      if (tags.length > 0) {
        await saveTags(user.id, data.id, tags);
      }

      toast("Media item added!");
      router.push(`/media/${data.id}`);
    } else {
      const { error } = await supabase
        .from("media_items")
        .update(mediaData)
        .eq("id", initialData?.id);

      if (error) {
        toast(`Error updating item: ${error.message}`, "error");
        setSaving(false);
        return;
      }

      if (initialData?.id) {
        await supabase.from("media_tags").delete().eq("media_item_id", initialData.id);
        if (tags.length > 0) {
          await saveTags(user.id, initialData.id, tags);
        }
      }

      toast("Media item updated!");
      router.push(`/media/${initialData?.id}`);
    }

    setSaving(false);
  };

  const saveTags = async (userId: string, mediaItemId: string, tagNames: string[]) => {
    for (const name of tagNames) {
      let { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .eq("name", name)
        .single();

      if (!existingTag) {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ user_id: userId, name })
          .select("id")
          .single();
        existingTag = newTag;
      }

      if (existingTag) {
        await supabase.from("media_tags").insert({
          media_item_id: mediaItemId,
          tag_id: existingTag.id,
        });
      }
    }
  };

  // --- Suggestion preview row helper ---

  const suggestionFields = aiSuggestion
    ? [
        aiSuggestion.title && { field: "title", label: "Title", value: aiSuggestion.title },
        aiSuggestion.type && { field: "type", label: "Type", value: aiSuggestion.type.replace("_", " ") },
        aiSuggestion.creator && { field: "creator", label: "Creator", value: aiSuggestion.creator },
        aiSuggestion.release_date && { field: "release_date", label: "Released", value: aiSuggestion.release_date },
        aiSuggestion.genre && { field: "genre", label: "Genre", value: aiSuggestion.genre },
        aiSuggestion.platform && { field: "platform", label: "Platform", value: aiSuggestion.platform },
        aiSuggestion.summary && { field: "summary", label: "Summary", value: aiSuggestion.summary },
      ].filter(Boolean) as { field: string; label: string; value: string }[]
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Film className="h-4 w-4" />
            Media Details
          </div>

          {/* Title with embedded AI button */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <div className="relative">
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    updateField("title", e.target.value);
                    if (aiSuggestion) setAiSuggestion(null);
                  }}
                  placeholder="e.g. The Dark Knight"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={handleAILookup}
                  disabled={autoFilling || !form.title.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Look up with AI"
                >
                  {autoFilling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.title.trim() && !aiSuggestion && !autoFilling && (
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  Click the sparkle to let AI fill details
                </p>
              )}
            </div>
            <div className={fieldHighlight("type")}>
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                <option value="movie">Movie</option>
                <option value="tv_show">TV Show</option>
                <option value="music">Music</option>
                <option value="game">Game</option>
                <option value="book">Book</option>
              </Select>
            </div>
          </div>

          {/* AI Suggestion Preview Panel */}
          {aiSuggestion && suggestionFields.length > 0 && (
            <div className="rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/40 border-b border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                  AI found these details
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={applyAllSuggestions}
                    className="h-7 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  >
                    <Check className="h-3 w-3" />
                    Apply All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiSuggestion(null)}
                    className="h-7 w-7 p-0 text-indigo-500 hover:text-indigo-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-indigo-100 dark:divide-indigo-800/50">
                {suggestionFields.map(({ field, label, value }) => (
                  <div key={field} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400 w-16 shrink-0">{label}</span>
                    <span className="flex-1 text-sm text-foreground truncate">{value}</span>
                    <button
                      type="button"
                      onClick={() => applySingleField(field, field === "type" ? (aiSuggestion?.type || value) : value)}
                      className="h-6 w-6 rounded flex items-center justify-center text-indigo-500 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors shrink-0"
                      title={`Apply ${label}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className={fieldHighlight("creator")}>
              <Label htmlFor="creator">Creator / Artist / Director</Label>
              <Input
                id="creator"
                value={form.creator}
                onChange={(e) => updateField("creator", e.target.value)}
                placeholder="e.g. Christopher Nolan"
              />
            </div>
            <div className={fieldHighlight("release_date")}>
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                value={form.release_date}
                onChange={(e) => updateField("release_date", e.target.value)}
                placeholder="e.g. 2008 or 2008-07-18"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={fieldHighlight("genre")}>
              <Label htmlFor="genre">Genre</Label>
              <Select
                id="genre"
                value={form.genre}
                onChange={(e) => updateField("genre", e.target.value)}
              >
                <option value="">Select genre</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>
            <div className={fieldHighlight("platform")}>
              <Label htmlFor="platform">Platform</Label>
              <Select
                id="platform"
                value={form.platform}
                onChange={(e) => updateField("platform", e.target.value)}
              >
                <option value="">Select platform</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="cover_image_url">Cover Image URL</Label>
            <Input
              id="cover_image_url"
              value={form.cover_image_url}
              onChange={(e) => updateField("cover_image_url", e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="owned">Owned</option>
                <option value="wishlist">Wishlist</option>
                <option value="currently_using">In Progress</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
            <div>
              <Label>Rating</Label>
              <div className="pt-2">
                <StarRating
                  value={form.rating}
                  onChange={(r) => updateField("rating", r || null)}
                />
              </div>
            </div>
          </div>
          {form.status === "currently_using" && (
            <div>
              <Label htmlFor="progress">Progress ({form.progress}%)</Label>
              <input
                id="progress"
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => updateField("progress", parseInt(e.target.value))}
                className="w-full mt-1 accent-primary"
              />
            </div>
          )}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Your thoughts, review, or notes..."
              rows={3}
            />
          </div>

          {/* AI Summary — shown after applying suggestions */}
          {aiSummary && (
            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-3 w-3" />
                  AI Summary
                </div>
                <button
                  type="button"
                  onClick={() => setAiSummary(null)}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <TagIcon className="h-4 w-4" />
            Tags
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded bg-secondary px-2.5 py-0.5 text-xs font-medium"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Add to Collection" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
