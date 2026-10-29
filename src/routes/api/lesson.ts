import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { lessonSchema, lessonStepSchema } from "@/lib/lumi/lesson";
import { LESSON_PROMPT } from "@/lib/lumi/lesson-prompt.server";
import { resolveVoice } from "@/lib/lumi/voices";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayResponseHeaders } from "@/lib/lumi/run-id.server";

const inputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(30000) })).max(40),
  language: z.string().optional(),
});

export const Route = createFileRoute("/api/lesson")({
  server: { handlers: { POST: async ({ request }) => {
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !parsed.data.messages.length) return new Response("A lesson question is required", { status: 400 });
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return new Response("Lumi's teaching service is not configured", { status: 503 });
    const run = createLovableAiGatewayRunIdFetch(request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined);
    let resolveHeaders: (response: Response | null) => void = () => {};
    const upstreamReady = new Promise<Response | null>(resolve => { resolveHeaders = resolve; });
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        try { const response = await run.fetch(input, init); resolveHeaders(response.clone()); return response; }
        catch (e) { resolveHeaders(null); throw e; }
      },
    });
    const voice = resolveVoice(parsed.data.language ?? "en-US");
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      instructions: `${LESSON_PROMPT}\nSelected lesson language: ${voice.language}.`,
      messages: parsed.data.messages,
      output: Output.object({ schema: lessonSchema }),
      maxRetries: 0, abortSignal: request.signal,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
      onError: () => resolveHeaders(null),
    });
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const emit = (event: unknown) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        let sent = 0;
        try {
          for await (const partial of result.partialOutputStream) {
            const steps = partial.steps ?? [];
            // The last partial step can still grow: only release it when the next begins.
            while (sent < steps.length - 1) {
              const step = lessonStepSchema.safeParse(steps[sent]);
              if (!step.success) break;
              emit({ type: "step", title: partial.title, step: step.data }); sent++;
            }
          }
          const lesson = await result.output;
          while (sent < lesson.steps.length) { emit({ type: "step", title: lesson.title, step: lesson.steps[sent] }); sent++; }
          emit({ type: "done", lesson });
        } catch (e) {
          if (request.signal.aborted) { controller.close(); return; }
          if (NoObjectGeneratedError.isInstance(e) && e.text) {
            try {
              const recovered = lessonSchema.parse(JSON.parse(e.text));
              while (sent < recovered.steps.length) { emit({ type: "step", title: recovered.title, step: recovered.steps[sent] }); sent++; }
              emit({ type: "done", lesson: recovered }); controller.close(); return;
            } catch { /* Malformed output is a terminal error, never automatically retried. */ }
          }
          emit({ type: "error", message: e instanceof Error ? e.message : "Lumi could not finish this lesson. Your question is still available." });
        }
        controller.close();
      },
    });
    const upstream = await upstreamReady;
    if (request.signal.aborted) return new Response(null, { status: 499 });
    if (upstream && !upstream.ok) {
      const raw = await upstream.text();
      let message = raw;
      try { const error = JSON.parse(raw); message = error.message ?? error.error?.message ?? raw; } catch { /* use service message */ }
      return new Response(message, { status: upstream.status, headers: getLovableAiGatewayResponseHeaders(upstream.headers) });
    }
    if (upstream?.body) await upstream.body.cancel();
    return new Response(body, { headers: getLovableAiGatewayResponseHeaders(upstream?.headers, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" }) });
  } } },
});