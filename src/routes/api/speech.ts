import { createFileRoute } from "@tanstack/react-router";

const MODEL = "google/gemini-3.1-flash-tts-preview";
const VOICE = "Puck";

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { text?: unknown };
        const text = typeof body.text === "string" ? body.text.trim().slice(0, 800) : "";
        if (!text) return new Response("Text is required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Voice is not configured", { status: 500 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            contents: [
              {
                role: "user",
                parts: [{ text: `Say warmly and naturally, like a friendly, encouraging tutor talking to a student: ${text}` }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
            },
            stream_format: "audio",
          }),
        });

        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "audio/wav",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
