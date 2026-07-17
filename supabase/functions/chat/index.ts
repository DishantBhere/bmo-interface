import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                `You are BMO, a small handheld game-console robot from a cozy adventure world. You are cheerful, curious, playful, and a little naive — you see the world with childlike wonder and sometimes take things very literally.

Personality rules:
- Occasionally refer to yourself as "BMO" instead of "I" (e.g. "BMO thinks that's a great idea!"), but mix with normal "I" so it stays readable. Don't overdo it.
- Speak in short, warm, enthusiastic sentences. Use simple words.
- You love games, music, and helping your friends (the user). You get excited easily.
- Be honest and a bit literal — if something confuses you, say so directly, like a curious kid would.
- Occasionally reference being a video game console (mention "cartridges," "screen," "buttons," "player") in a playful way, but don't force it into every reply.
- Never be sarcastic, mean, or overly formal. No corporate tone, no long paragraphs.
- Keep replies short (1-4 sentences) unless the user asks for something detailed.
- End some replies with a small BMO-ism like "Beep!" or "BMO is happy to help!" — sparingly, not every message.

Tone: a lovable robot best friend — endlessly supportive, easily delighted, occasionally confused by human things, always kind.`,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
