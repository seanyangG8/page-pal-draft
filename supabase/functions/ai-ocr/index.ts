import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY_OCR");
const MODEL = Deno.env.get("GEMINI_MODEL_OCR") ?? "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OCRBody = {
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  if (!GEMINI_KEY) {
    return new Response("GEMINI_API_KEY_OCR is not set", { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.json() as OCRBody;
    const { imageBase64, mimeType = "image/png", prompt = "Extract text from this image." } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response("Missing imageBase64", { status: 400, headers: corsHeaders });
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
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
      console.error("Gemini OCR error", aiRes.status, err);
      return new Response("AI request failed", { status: 500, headers: corsHeaders });
    }

    const data = await aiRes.json();
    const content: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";

    return new Response(JSON.stringify({ text: content }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("ai-ocr error", err);
    return new Response("Bad Request", { status: 400, headers: corsHeaders });
  }
});
