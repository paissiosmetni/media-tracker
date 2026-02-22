"use client";

import { MediaForm } from "@/components/media-form";
import { Plus } from "lucide-react";

export default function NewMediaPage() {
  return (
    <div className="flex flex-col">
      {/* Page header banner */}
      <div className="bg-muted/40 border-b-2 border-primary/10">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Add to Collection</h1>
          </div>
        </div>
      </div>
      <div className="container py-6">
        <MediaForm mode="create" />
      </div>
    </div>
  );
}
