import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

type AIAction = "cleanup" | "expand" | "summarize" | "flashcard";

// Use a dedicated key for AI actions.
// Set with: supabase secrets set GEMINI_API_KEY_ACTIONS=your_key
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY_ACTIONS");
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  if (!GEMINI_KEY) {
    return new Response("GEMINI_API_KEY_ACTIONS is not set", { status: 500, headers: corsHeaders });
  }

  try {
    const { action, text, context } = await req.json() as {
      action?: AIAction;
      text?: string;
      context?: NoteContextInput;
    };

    if (!action || !["cleanup", "expand", "summarize", "flashcard"].includes(action)) {
      return new Response("Invalid action", { status: 400, headers: corsHeaders });
    }
    if (!text || typeof text !== "string") {
      return new Response("Missing text", { status: 400, headers: corsHeaders });
    }

    const systemPrompt = buildSystemPrompt(action);
    const userContent = buildUserContent(action, text, context);

    const payload = {
      systemInstruction: {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      contents: [
        { role: "user", parts: [{ text: userContent }] },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    };

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("Gemini error", aiRes.status, err);
      return new Response("AI request failed", { status: 500, headers: corsHeaders });
    }

    const data = await aiRes.json();
    const content: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";

    if (action === "flashcard") {
      const parsed = parseFlashcard(content);
      return new Response(JSON.stringify({ flashcard: parsed, raw: content }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ text: content }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("ai-actions error", err);
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }
});

function buildSystemPrompt(action: AIAction): string {
  switch (action) {
    case "cleanup":
      return [
        "You clean up short notes for readability.",
        "Use book context only to disambiguate terms; do not add new claims or facts.",
        "No hallucinations: avoid names, frameworks, or details not implied by the note/highlight/context.",
        "If the note is ambiguous, choose the most likely interpretation and add a single line: Assumption: ...",
        "Keep it concise and practical; no motivational filler.",
        "Make the note directly usable later; avoid vague references like \"this/that\" when a concept can be named.",
        "Output only the cleaned note, plus an optional Assumption line.",
      ].join(" ");
    case "expand":
      return [
        "You expand a short note into a fuller explanation.",
        "Use book context only to disambiguate terms; do not add new claims or facts.",
        "No hallucinations: avoid names, frameworks, or details not implied by the note/highlight/context.",
        "If the note is ambiguous, choose the most likely interpretation and add a single line: Assumption: ...",
        "Keep it concise and practical; no motivational filler.",
        "Make the note directly usable later; avoid vague references like \"this/that\" when a concept can be named.",
        "Output 2-4 short sentences OR at most 2 bullets. Output only the expanded note, plus an optional Assumption line.",
      ].join(" ");
    case "summarize":
      return [
        "You summarize notes into a concise, clear single-paragraph summary.",
        "Use book context only to disambiguate terms; do not add new claims or facts.",
        "No hallucinations: avoid names, frameworks, or details not implied by the note/highlight/context.",
        "If the note is ambiguous, choose the most likely interpretation and add a single line: Assumption: ...",
        "Keep it concise and practical; no motivational filler.",
        "Make the note directly usable later; avoid vague references like \"this/that\" when a concept can be named.",
        "Output 2-4 sentences max, one paragraph.",
      ].join(" ");
    case "flashcard":
      return [
        "You turn a note into a simple Q&A flashcard.",
        "Use book context only to disambiguate terms; do not add new claims or facts.",
        "No hallucinations: avoid names, frameworks, or details not implied by the note/highlight/context.",
        "If the note is ambiguous, choose the most likely interpretation and add a single line: Assumption: ...",
        "Keep it concise and practical; no motivational filler.",
        "Make the card directly usable later; avoid vague references like \"this/that\" when a concept can be named.",
        "Output exactly one card in this format:",
        "Q: ...",
        "A: ...",
        "(Assumption: ... optional)",
      ].join(" ");
  }
}

type NoteContextInput = {
  bookTitle?: string;
  bookAuthor?: string;
  chapterOrSection?: string;
  page?: string;
  highlight?: string;
} | string;

function buildUserContent(_action: AIAction, text: string, context?: NoteContextInput): string {
  return buildNoteContext({
    bookTitle: typeof context === "object" && context ? context.bookTitle : undefined,
    bookAuthor: typeof context === "object" && context ? context.bookAuthor : undefined,
    chapterOrSection: typeof context === "object" && context ? context.chapterOrSection : undefined,
    page: typeof context === "object" && context ? context.page : undefined,
    highlight: typeof context === "object" && context ? context.highlight : undefined,
    noteText: text,
    extraContext: typeof context === "string" ? context : undefined,
  });
}

function buildNoteContext(input: {
  bookTitle?: string;
  bookAuthor?: string;
  chapterOrSection?: string;
  page?: string;
  highlight?: string;
  noteText: string;
  extraContext?: string;
}): string {
  const lines: string[] = ["Context:"];

  if (input.bookTitle) lines.push(`Book Title: ${input.bookTitle}`);
  if (input.bookAuthor) lines.push(`Book Author: ${input.bookAuthor}`);
  if (input.chapterOrSection) lines.push(`Chapter/Section: ${input.chapterOrSection}`);
  if (input.page) lines.push(`Page: ${input.page}`);
  if (input.highlight) lines.push(`Highlight: ${input.highlight}`);
  if (input.extraContext) lines.push(`Additional Context: ${input.extraContext}`);

  lines.push(`Note Text: ${input.noteText}`);

  return lines.join("\n");
}

function parseFlashcard(content: string): { question: string; answer: string } {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  let question = "";
  let answer = "";

  for (const line of lines) {
    if (!question && /^q(uestion)?:/i.test(line)) {
      question = line.replace(/^q(uestion)?:/i, "").trim();
      continue;
    }
    if (!answer && /^a(nswer)?:/i.test(line)) {
      answer = line.replace(/^a(nswer)?:/i, "").trim();
      continue;
    }
  }

  if (!question && lines.length > 0) {
    question = lines[0];
  }
  if (!answer && lines.length > 1) {
    answer = lines.slice(1).join(" ");
  }

  return { question: question || "Question unavailable", answer: answer || content };
}
