import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Library,
  Sparkles,
  Globe,
  Star,
  Bot,
  ArrowRight,
  Search,
  BarChart3,
  Heart,
  Users,
  Film,
  Tv,
  Music,
  Gamepad2,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: Library,
    title: "Collection Management",
    description: "Track movies, TV shows, music, games, and books. Organize with tags, ratings, and progress tracking.",
    span: "md:col-span-2",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Get personalized recommendations, look up media info, and analyze your collection with AI-powered insights.",
    span: "",
  },
  {
    icon: Star,
    title: "Rate & Review",
    description: "Rate your media with stars, write notes, and track your progress through series and games.",
    span: "",
  },
  {
    icon: Globe,
    title: "Share & Discover",
    description: "Make your profile public to share your collection. Explore what others are watching and playing.",
    span: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Visualize your collection with charts. See genre distribution, media type breakdowns, and rating trends.",
    span: "",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Filter by type, genre, status, and platform. Use natural language with AI to find exactly what you need.",
    span: "",
  },
];

const mediaIcons = [Film, Tv, Music, Gamepad2, BookOpen, Star];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Split Hero */}
      <section className="bg-muted/30">
        <div className="container py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary mb-6">
                <Sparkles className="h-4 w-4" />
                Powered by AI
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Your Smart
                <span className="text-primary"> Media </span>
                Companion
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-lg">
                MediaTracker helps you organize your movies, TV shows, music, games, and books.
                Get AI-powered recommendations and share your collection with the community.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Globe className="h-4 w-4" /> Explore Collections
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Library className="h-4 w-4" /> All Media Types
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> Community
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" /> Free to Use
                </span>
              </div>
            </div>

            {/* Right: Decorative icon grid */}
            <div className="hidden md:grid grid-cols-3 gap-4">
              {mediaIcons.map((Icon, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center rounded-md bg-card shadow-md ring-1 ring-black/5 dark:ring-white/5 p-8 ${
                    i === 0 || i === 4 ? "col-span-1 row-span-1" : ""
                  } ${i === 1 ? "bg-primary/5" : ""}`}
                >
                  <Icon className={`h-10 w-10 ${i === 1 || i === 3 ? "text-primary" : "text-muted-foreground"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bento Feature Grid */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Everything You Need</h2>
          <p className="mt-2 text-muted-foreground">
            A complete toolkit for tracking and discovering media
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-md bg-card shadow-md ring-1 ring-black/5 dark:ring-white/5 p-6 hover:shadow-lg transition-shadow ${feature.span}`}
            >
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Card CTA */}
      <section className="container pb-20">
        <div className="mx-auto max-w-2xl rounded-md bg-primary/5 border border-primary/10 p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Organize Your Media?</h2>
          <p className="text-muted-foreground mb-6">
            Join MediaTracker and take control of your movies, music, games, and more.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
