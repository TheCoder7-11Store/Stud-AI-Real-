import { createFileRoute } from "@tanstack/react-router";
import { resolveVoice, LUMI_VOICES } from "@/lib/lumi/voices";
import { requestSpeech } from "@/lib/lumi/speech-request.server";
import { getLovableAiGatewayResponseHeaders } from "@/lib/lumi/run-id.server";

const MODEL = "google/gemini-3.1-flash-tts-preview";
const VOICE = "Puck";

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { text?: unknown; language?: string; streaming?: boolean };
        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (!text) return new Response("Text is required", { status: 400 });
        if (text.length > 4000) return new Response("Please speak one lesson step at a time", { status: 400 });
        if (body.language && !LUMI_VOICES.some(v => v.id === body.language)) return new Response("This voice preference is unavailable. Choose another language or use text.", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Voice is not configured", { status: 500 });

        const selected = resolveVoice(body.language ?? "en-US");
        try {
          const upstream = await requestSpeech({ baseURL: "https://ai.gateway.lovable.dev", apiKey: key, model: MODEL, format: "gemini", voice: VOICE },
            `Speak in ${selected.language}, with a natural ${selected.accent} accent. Sound warm, clear and encouraging, like a real personal tutor. Read only the following text, not these directions: ${text}`,
            !body.streaming, request.signal);
          return new Response(upstream.body, { status: upstream.status, headers: getLovableAiGatewayResponseHeaders(upstream.headers, {
            "Content-Type": upstream.headers.get("Content-Type") ?? (body.streaming ? "text/event-stream" : "audio/wav"), "Cache-Control": "no-cache",
          }) });
        } catch (e) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          return new Response(e instanceof Error ? e.message : "Voice unavailable", { status: 502 });
        }
      },
    },
  },
});
