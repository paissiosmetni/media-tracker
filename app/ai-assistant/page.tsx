"use client";

import { AIChat } from "@/components/ai-chat";
import { Bot } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Page header banner */}
      <div className="bg-muted/40 border-b-2 border-primary/10">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Get recommendations, insights, and media info</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-6 flex-1">
        <AIChat />
      </div>
    </div>
  );
}
