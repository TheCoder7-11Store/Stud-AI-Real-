import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type ThreadMessage = { id: string; role: string; parts: Json };

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("id,title,updated_at,exam_focus")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: thread, error: e1 } = await context.supabase
      .from("threads")
      .select("id,title,exam_focus")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!thread) return null;
    const { data: rows, error: e2 } = await context.supabase
      .from("messages")
      .select("id,role,parts,created_at")
      .eq("thread_id", data.id)
      .order("created_at", { ascending: true });
    if (e2) throw new Error(e2.message);
    const messages: ThreadMessage[] = (rows ?? []).map((r) => ({
      id: r.id as string,
      role: r.role as string,
      parts: r.parts as Json,
    }));
    return { thread, messages };
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().default("New chat") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("threads").insert({
      id: data.id,
      user_id: context.userId,
      title: data.title,
    });
    if (error) throw new Error(error.message);
    return { id: data.id };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const syncLocalThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        threads: z
          .array(
            z.object({
              id: z.string().uuid(),
              title: z.string().min(1).max(200),
              messages: z
                .array(
                  z.object({
                    role: z.string(),
                    parts: z.any(),
                  }),
                )
                .max(500),
            }),
          )
          .max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let synced = 0;
    for (const t of data.threads) {
      // Skip if the thread already exists in the cloud (e.g. synced before).
      const { data: existing, error: e1 } = await context.supabase
        .from("threads")
        .select("id")
        .eq("id", t.id)
        .maybeSingle();
      if (e1) throw new Error(e1.message);
      if (existing) continue;

      const { error: e2 } = await context.supabase.from("threads").insert({
        id: t.id,
        user_id: context.userId,
        title: t.title,
      });
      if (e2) throw new Error(e2.message);

      if (t.messages.length > 0) {
        const rows = t.messages.map((m) => ({
          thread_id: t.id,
          user_id: context.userId,
          role: m.role,
          parts: m.parts,
        }));
        const { error: e3 } = await context.supabase.from("messages").insert(rows);
        if (e3) throw new Error(e3.message);
      }
      synced++;
    }
    return { ok: true, synced };
  });

export const saveMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        messages: z.array(
          z.object({
            id: z.string().optional(),
            role: z.string(),
            parts: z.any(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Replace-all strategy: delete then insert. Simple and reliable for chat.
    await context.supabase.from("messages").delete().eq("thread_id", data.threadId);
    if (data.messages.length > 0) {
      const rows = data.messages.map((m) => ({
        thread_id: data.threadId,
        user_id: context.userId,
        role: m.role,
        parts: m.parts,
      }));
      const { error } = await context.supabase.from("messages").insert(rows);
      if (error) throw new Error(error.message);
    }
    // Touch thread
    await context.supabase
      .from("threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.threadId);
    return { ok: true };
  });