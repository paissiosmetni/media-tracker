"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MediaForm } from "@/components/media-form";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit } from "lucide-react";

interface TagItem {
  tag_id: string;
  tags: { name: string };
}

export default function EditMediaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [initialData, setInitialData] = useState<{
    id: string;
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
  } | null>(null);
  const [initialTags, setInitialTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

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

      if (data.user_id !== user.id) {
        toast("You can only edit your own items", "error");
        router.push(`/media/${params.id}`);
        return;
      }

      setInitialData({
        id: data.id,
        type: data.type,
        title: data.title,
        creator: data.creator || "",
        release_date: data.release_date || "",
        genre: data.genre || "",
        platform: data.platform || "",
        status: data.status,
        rating: data.rating,
        cover_image_url: data.cover_image_url || "",
        notes: data.notes || "",
        progress: data.progress || 0,
      });

      // Fetch tags
      const { data: tagData } = await supabase
        .from("media_tags")
        .select("tag_id, tags(name)")
        .eq("media_item_id", data.id);

      if (tagData) {
        setInitialTags((tagData as unknown as TagItem[]).map((t) => t.tags.name));
      }

      setLoading(false);
    }

    fetchItem();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-6 max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!initialData) return null;

  return (
    <div className="flex flex-col">
      {/* Page header banner */}
      <div className="bg-muted/40 border-b-2 border-primary/10">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Edit Media Item</h1>
              <p className="text-sm text-muted-foreground">{initialData.title}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-6">
        <MediaForm mode="edit" initialData={initialData} initialTags={initialTags} />
      </div>
    </div>
  );
}
