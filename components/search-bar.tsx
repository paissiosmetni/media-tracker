"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface SearchFilters {
  query: string;
  type: string;
  genre: string;
  status: string;
  platform: string;
}

interface SearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  showStatus?: boolean;
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

export function SearchBar({ filters, onFiltersChange, showStatus = true }: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ query: "", type: "", genre: "", status: "", platform: "" });
  };

  const hasActiveFilters = filters.type || filters.genre || filters.status || filters.platform;

  return (
    <div className="space-y-3 w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or creator..."
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-md bg-muted/40 ring-1 ring-black/5 dark:ring-white/5">
          <Select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="movie">Movies</option>
            <option value="tv_show">TV Shows</option>
            <option value="music">Music</option>
            <option value="game">Games</option>
            <option value="book">Books</option>
          </Select>
          <Select
            value={filters.genre}
            onChange={(e) => updateFilter("genre", e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
          {showStatus && (
            <Select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="owned">Owned</option>
              <option value="wishlist">Wishlist</option>
              <option value="currently_using">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          )}
          <Select
            value={filters.platform}
            onChange={(e) => updateFilter("platform", e.target.value)}
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
