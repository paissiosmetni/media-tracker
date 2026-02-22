import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAIMessage, getSystemPrompt, type AIAction } from "@/lib/ai";

function detectAction(message: string): AIAction {
  const lower = message.toLowerCase();

  if (lower.includes("recommend") || lower.includes("similar to") || lower.includes("if you liked") || lower.includes("like this")) {
    return "smart_recommendations";
  }
  if (lower.includes("look up") || lower.includes("metadata") || lower.includes("tell me about") || lower.includes("info about") || lower.includes("what is")) {
    return "auto_metadata";
  }
  if (lower.includes("insight") || lower.includes("analyze my") || lower.includes("my collection") || lower.includes("my taste") || lower.includes("patterns")) {
    return "collection_insights";
  }
  if (lower.includes("search for") || lower.includes("find me") || lower.includes("looking for") || lower.includes("filter") || lower.includes("show me")) {
    return "natural_search";
  }
  if (lower.includes("mood") || lower.includes("feeling") || lower.includes("tonight") || lower.includes("what should i") || lower.includes("bored") || lower.includes("relaxing") || lower.includes("exciting")) {
    return "mood_suggestions";
  }

  return "general_chat";
}

function tryExtractJSON(text: string): Record<string, unknown> | null {
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch { /* ignore */ }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // Auth check — prevent unauthenticated access to the AI endpoint
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history, collectionData } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const action = detectAction(message);
    let systemPrompt = getSystemPrompt(action);

    // Inject collection data for insights
    if (action === "collection_insights" && collectionData) {
      systemPrompt += `\n\nUser's collection data:\n${JSON.stringify(collectionData)}`;
    }

    // Build chat history
    const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content,
    }));

    const responseText = await sendAIMessage(systemPrompt, chatHistory, message);

    let mediaItem = null;
    let displayText = responseText;

    // --- Action-specific parsing ---

    if (action === "smart_recommendations") {
      const data = tryExtractJSON(responseText);
      if (data?.recommendations) {
        const recs = data.recommendations as Array<{
          title: string; type: string; creator: string; genre: string;
          reason: string; release_date: string;
        }>;
        displayText = `**Here are my recommendations:**\n\n`;
        recs.forEach((r, i) => {
          displayText += `### ${i + 1}. ${r.title}\n`;
          displayText += `**${r.type?.replace("_", " ")}** by ${r.creator} | ${r.genre} | ${r.release_date}\n`;
          displayText += `${r.reason}\n\n`;
        });
        displayText += `Say **"look up [title]"** to auto-fill metadata and add any of these to your collection!`;
      }
    }

    if (action === "auto_metadata") {
      const data = tryExtractJSON(responseText);
      if (data?.title) {
        mediaItem = data;
        displayText = `**${data.title}**\n\n`;
        displayText += `**Type:** ${String(data.type || "").replace("_", " ")}\n`;
        displayText += `**Creator:** ${data.creator}\n`;
        displayText += `**Genre:** ${data.genre}\n`;
        displayText += `**Released:** ${data.release_date}\n`;
        displayText += `**Platform:** ${data.platform}\n\n`;
        if (data.summary) displayText += `${data.summary}\n\n`;
        displayText += `Click **"Add to Collection"** below to save this to your library!`;
      }
    }

    if (action === "collection_insights") {
      const data = tryExtractJSON(responseText);
      if (data?.insights) {
        const insights = data.insights as string[];
        displayText = `**Collection Insights:**\n\n`;
        insights.forEach((insight) => {
          displayText += `- ${insight}\n`;
        });
        if (data.favorite_genre) {
          displayText += `\n**Your top genre:** ${data.favorite_genre}\n`;
        }
        if (data.recommendation) {
          displayText += `\n**Suggestion:** ${data.recommendation}`;
        }
      }
    }

    if (action === "natural_search") {
      const data = tryExtractJSON(responseText);
      if (data?.filters) {
        displayText = `**I understood:** ${data.explanation}\n\n`;
        displayText += `Here are the filters I'd apply:\n`;
        const f = data.filters as Record<string, string>;
        if (f.type) displayText += `- **Type:** ${f.type.replace("_", " ")}\n`;
        if (f.genre) displayText += `- **Genre:** ${f.genre}\n`;
        if (f.status) displayText += `- **Status:** ${f.status}\n`;
        if (f.query) displayText += `- **Search:** "${f.query}"\n`;
        displayText += `\nTry applying these filters on your dashboard!`;
      }
    }

    if (action === "mood_suggestions") {
      const data = tryExtractJSON(responseText);
      if (data?.suggestions) {
        const mood = data.mood || "your mood";
        const suggestions = data.suggestions as Array<{
          title: string; type: string; creator: string; genre: string; why: string;
        }>;
        displayText = `**For your "${mood}" mood, try these:**\n\n`;
        suggestions.forEach((s, i) => {
          displayText += `### ${i + 1}. ${s.title}\n`;
          displayText += `**${s.type?.replace("_", " ")}** by ${s.creator} | ${s.genre}\n`;
          displayText += `${s.why}\n\n`;
        });
      }
    }

    return NextResponse.json({
      text: displayText,
      mediaItem,
      action,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("AI API error:", errorMessage);

    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Too Many Requests")) {
      return NextResponse.json(
        { error: "AI rate limit reached. Please wait a moment and try again.", details: errorMessage },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process AI request", details: errorMessage },
      { status: 500 }
    );
  }
}
