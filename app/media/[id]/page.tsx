"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StarRating } from "@/components/star-rating";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Film,
  Tv,
  Music,
  Gamepad2,
  BookOpen,
  ShoppingBag,
  Heart,
  Play,
  CheckCircle,
  Calendar,
  User,
  Monitor,
  Sparkles,
  Tag,
} from "lucide-react";

interface MediaItem {
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

interface TagItem {
  tag_id: string;
  tags: { name: string };
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

const statusConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  owned: { icon: ShoppingBag, label: "Owned", color: "text-blue-500" },
  wishlist: { icon: Heart, label: "Wishlist", color: "text-pink-500" },
  currently_using: { icon: Play, label: "In Progress", color: "text-yellow-500" },
  completed: { icon: CheckCircle, label: "Completed", color: "text-green-500" },
};

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [item, setItem] = useState<MediaItem | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchItem = useCallback(async () => {
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      toast("Item not found", "error");
      router.push("/dashboard");
      return;
    }

    setItem(data);

    // Fetch tags
    const { data: tagData } = await supabase
      .from("media_tags")
      .select("tag_id, tags(name)")
      .eq("media_item_id", data.id);

    if (tagData) {
      setTags((tagData as unknown as TagItem[]).map((t) => t.tags.name));
    }

    const { data: { user } } = await supabase.auth.getUser();
    setIsOwner(user?.id === data.user_id);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleDelete = async () => {
    const { error } = await supabase.from("media_items").delete().eq("id", item!.id);
    if (error) {
      toast("Failed to delete item", "error");
    } else {
      toast("Item deleted");
      router.push("/dashboard");
    }
  };

  const cycleStatus = async () => {
    if (!item) return;
    const statuses = ["owned", "wishlist", "currently_using", "completed"];
    const currentIdx = statuses.indexOf(item.status);
    const nextStatus = statuses[(currentIdx + 1) % statuses.length];

    const { error } = await supabase
      .from("media_items")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (!error) {
      setItem({ ...item, status: nextStatus });
      toast(`Marked as ${statusConfig[nextStatus]?.label}`);
    }
  };

  if (loading) {
    return (
      <div className="container py-6 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!item) return null;

  const TypeIcon = typeIcons[item.type] || Film;
  const StatusIcon = statusConfig[item.status]?.icon || ShoppingBag;
  const statusColor = statusConfig[item.status]?.color || "";

  return (
    <>
      {/* Hero cover banner */}
      {item.cover_image_url && (
        <div className="relative h-64 md:h-80 overflow-hidden bg-muted">
          <img
            src={item.cover_image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container max-w-4xl pb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{item.title}</h1>
              {item.creator && (
                <p className="text-lg text-white/80 mt-1 drop-shadow">{item.creator}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container py-6 max-w-4xl space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            {isOwner && (
              <>
                <Button variant="ghost" size="icon" onClick={cycleStatus} title="Change status">
                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                </Button>
                <Link href={`/media/${item.id}/edit`}>
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="icon" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title section (only if no cover image, since hero shows it) */}
        {!item.cover_image_url && (
          <div className="flex items-start gap-5">
            <div className="w-20 h-28 rounded-md bg-muted flex items-center justify-center shrink-0">
              <TypeIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{item.title}</h1>
              {item.creator && (
                <p className="text-lg text-muted-foreground mt-1">{item.creator}</p>
              )}
            </div>
          </div>
        )}

        {/* Metadata bar */}
        <div className="flex flex-wrap gap-2">
          <Badge className="gap-1">
            <TypeIcon className="h-3 w-3" />
            {typeLabels[item.type]}
          </Badge>
          <Badge variant="outline" className={`gap-1 ${statusColor}`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig[item.status]?.label}
          </Badge>
          {item.genre && <Badge variant="secondary">{item.genre}</Badge>}
          {item.platform && (
            <Badge variant="outline" className="gap-1">
              <Monitor className="h-3 w-3" />
              {item.platform}
            </Badge>
          )}
        </div>

        {/* Stats row */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center divide-x divide-border">
              {item.rating && (
                <div className="flex items-center gap-2 px-5 py-4">
                  <span className="text-sm font-medium">Rating:</span>
                  <StarRating value={item.rating} readOnly size="md" />
                  <span className="text-sm text-muted-foreground">{item.rating}/5</span>
                </div>
              )}
              {item.release_date && (
                <div className="flex items-center gap-1.5 px-5 py-4 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {item.release_date}
                </div>
              )}
              <div className="flex items-center gap-1.5 px-5 py-4 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Added {formatDate(item.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>

        {item.status === "currently_using" && (
          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-3" />
            </CardContent>
          </Card>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="h-4 w-4 text-muted-foreground mr-1" />
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
        {item.ai_summary && (
          <Card className="bg-primary/5 ring-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{item.ai_summary}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{item.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
