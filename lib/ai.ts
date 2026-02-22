import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import Groq from "groq-sdk";

// --- Provider config ---

type AIProvider = "gemini" | "groq";

function getProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  if (provider === "gemini" || provider === "groq") return provider;
  return "groq";
}

// --- Gemini setup ---

let _geminiModel: GenerativeModel | null = null;

function getGeminiModel(): GenerativeModel {
  if (!_geminiModel) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    _geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  }
  return _geminiModel;
}

// --- Groq setup ---

let _groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");
    _groqClient = new Groq({ apiKey });
  }
  return _groqClient;
}

// --- Unified send function ---

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendAIMessage(
  systemPrompt: string,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const provider = getProvider();

  if (provider === "gemini") {
    return sendViaGemini(systemPrompt, history, message);
  }
  return sendViaGroq(systemPrompt, history, message);
}

async function sendViaGemini(
  systemPrompt: string,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const model = getGeminiModel();

  const chatHistory = [
    { role: "user" as const, parts: [{ text: `System instructions: ${systemPrompt}` }] },
    { role: "model" as const, parts: [{ text: "Understood. I'll follow these instructions." }] },
    ...history.map((msg) => ({
      role: (msg.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: msg.content }],
    })),
  ];

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(message);
  return result.response.text();
}

async function sendViaGroq(
  systemPrompt: string,
  history: ChatMessage[],
  message: string
): Promise<string> {
  const client = getGroqClient();

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || "";
}

// --- Action types & system prompts (provider-agnostic) ---

export type AIAction =
  | "smart_recommendations"
  | "auto_metadata"
  | "collection_insights"
  | "natural_search"
  | "mood_suggestions"
  | "general_chat";

export function getSystemPrompt(action: AIAction): string {
  const prompts: Record<AIAction, string> = {
    smart_recommendations: `You are a media recommendation expert. Based on the user's mention of media they like, suggest 3-5 similar titles they might enjoy.
Return ONLY valid JSON in this format:
{
  "recommendations": [
    {
      "title": "Media Title",
      "type": "movie|tv_show|music|game|book",
      "creator": "Director/Artist/Author",
      "genre": "Genre",
      "reason": "Why they'd like it based on what they mentioned",
      "release_date": "Year or date"
    }
  ]
}`,
    auto_metadata: `You are a media database expert. The user provides a title (and optionally a type). Fill in all metadata you know about it.
Return ONLY valid JSON:
{
  "title": "Full correct title",
  "type": "movie|tv_show|music|game|book",
  "creator": "Director/Artist/Developer/Author",
  "genre": "Primary genre",
  "release_date": "Year or full date",
  "platform": "Primary platform/service",
  "summary": "A 2-3 sentence description of the media"
}`,
    collection_insights: `You are a media collection analyst. The user shares data about their collection. Analyze it and provide fun insights.
Return ONLY valid JSON:
{
  "insights": [
    "Insight about their collection patterns",
    "Fun fact about their taste",
    "Observation about genres or types they favor"
  ],
  "favorite_genre": "Their most common genre",
  "recommendation": "One thing they should try based on their patterns"
}`,
    natural_search: `You are a search query parser. The user describes what they're looking for in natural language (e.g., "action movies from the 90s" or "relaxing games").
Parse their intent into structured filters.
Return ONLY valid JSON:
{
  "filters": {
    "type": "movie|tv_show|music|game|book or empty string",
    "genre": "genre or empty string",
    "status": "owned|wishlist|currently_using|completed or empty string",
    "query": "title/creator keywords or empty string"
  },
  "explanation": "What you understood from their request"
}`,
    mood_suggestions: `You are a mood-based media recommender. The user describes their mood or what kind of experience they want.
Suggest 3-5 titles from popular well-known media that match their mood.
Return ONLY valid JSON:
{
  "mood": "The mood you detected",
  "suggestions": [
    {
      "title": "Media Title",
      "type": "movie|tv_show|music|game|book",
      "creator": "Creator name",
      "genre": "Genre",
      "why": "Why this matches their mood"
    }
  ]
}`,
    general_chat: `You are a friendly, knowledgeable media assistant called "Media AI".
Help users with any questions about movies, TV shows, music, games, or books.
Be conversational, helpful, and enthusiastic about media.
If the user asks about a specific title, provide useful info about it.
Keep responses concise but informative.`,
  };

  return prompts[action];
}
