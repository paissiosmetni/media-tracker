"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Library, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      toast("Username must be at least 3 characters", "error");
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);

    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Check username availability before signup
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", sanitizedUsername)
      .maybeSingle();

    if (existing) {
      toast("Username is already taken", "error");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: sanitizedUsername,
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast(error.message, "error");
    } else if (!data.session) {
      toast("Signup failed. Please try again.", "error");
    } else {
      // Create profile from the app (more reliable than the DB trigger)
      await supabase.from("profiles").upsert(
        {
          id: data.user!.id,
          username: sanitizedUsername,
          display_name: fullName,
        },
        { onConflict: "id" }
      );

      toast("Account created! Welcome to MediaTracker!", "success");
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Library className="h-10 w-10 text-primary mx-auto" />
          <h1 className="text-2xl font-semibold mt-3">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join MediaTracker and start organizing your collection</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="signup-fullname">Full Name</Label>
              <Input
                id="signup-fullname"
                name="signup-fullname"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                name="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-handle">Username</Label>
              <Input
                id="signup-handle"
                name="signup-handle"
                placeholder="media_fan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                name="signup-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
