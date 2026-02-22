"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Loader2, User, Globe, Link as LinkIcon, Settings, ImageIcon, FileText } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
            display_name: user.user_metadata?.full_name || null,
          })
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
        }
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_public: profile.is_public,
      })
      .eq("id", profile.id);

    if (error) {
      toast(`Error saving profile: ${error.message}`, "error");
    } else {
      toast("Profile updated!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="container py-6 max-w-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-6 max-w-2xl text-center space-y-4">
        <User className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">Unable to load profile</h2>
        <p className="text-muted-foreground">
          Your profile could not be loaded. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Page header banner */}
      <div className="bg-muted/40 border-b-2 border-primary/10">
        <div className="container py-8 max-w-2xl">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-16 h-16 rounded-md object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-2xl space-y-6">
        {/* Identity section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Settings className="h-4 w-4" />
              Account
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={profile.username} disabled />
              <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={profile.display_name || ""}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Your display name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <ImageIcon className="h-4 w-4" />
              Appearance
            </div>
            <div>
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url || ""}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell others about your media taste..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Visibility section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <Globe className="h-4 w-4" />
              Visibility
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.is_public}
                onChange={(e) => setProfile({ ...profile, is_public: e.target.checked })}
                className="rounded border-input h-5 w-5"
              />
              <div>
                <span className="text-sm font-medium">Public Profile</span>
                <p className="text-xs text-muted-foreground">
                  Allow others to view your profile and media collection
                </p>
              </div>
            </label>
            {profile.is_public && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-md">
                <LinkIcon className="h-4 w-4 text-primary" />
                <span>Your public profile: </span>
                <code className="text-primary font-semibold">/shared/{profile.username}</code>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
