import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { normalizeCall, upsertCall, setSetting } from "@/lib/vapi.server";

const PayloadSchema = z.object({
  message: z
    .object({
      type: z.string().min(1).max(100),
      call: z.any().optional(),
      timestamp: z.union([z.number(), z.string()]).optional(),
    })
    .passthrough(),
});

const HANDLED = new Set(["status-update", "end-of-call-report", "hang", "conversation-update"]);

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/public/vapi-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["VAPI_SERVER_SECRET"];
        if (!secret) return json({ error: "Webhook not configured" }, 503);

        const provided =
          request.headers.get("x-vapi-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!provided || !safeEqual(provided, secret)) return json({ error: "Unauthorized" }, 401);

        let parsed;
        try {
          parsed = PayloadSchema.safeParse(await request.json());
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        if (!parsed.success) return json({ error: "Invalid payload" }, 400);

        const msg = parsed.data.message as Record<string, unknown> & {
          type: string;
          call?: Record<string, unknown>;
        };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          await setSetting(supabaseAdmin, "last_webhook_at", new Date().toISOString());
          if (!HANDLED.has(msg.type)) return json({ ok: true, ignored: msg.type });

          const callId: string | undefined =
            typeof msg.call?.["id"] === "string" ? msg.call["id"] : undefined;
          if (!callId) return json({ ok: true, ignored: "no call id" });

          // Deduplicate discrete events (conversation-update is frequent and naturally idempotent)
          if (msg.type !== "conversation-update") {
            const eventId = `${msg.type}:${callId}:${msg["timestamp"] ?? msg["status"] ?? ""}`;
            const { error: dupErr } = await supabaseAdmin
              .from("webhook_events")
              .insert({ event_id: eventId, vapi_call_id: callId, event_type: msg.type });
            if (dupErr?.code === "23505") return json({ ok: true, duplicate: true });
          }

          const isFinal = msg.type === "end-of-call-report";
          const extra: Record<string, unknown> = { ...msg };
          if (isFinal) extra["status"] = "ended";
          if (msg.type === "hang") delete extra["status"];
          const row = normalizeCall(msg.call, extra);
          if (!row) return json({ ok: true, ignored: "unparseable call" });
          await upsertCall(supabaseAdmin, row, isFinal);

          if (msg.type !== "conversation-update") {
            await supabaseAdmin
              .from("webhook_events")
              .update({ processed_at: new Date().toISOString() })
              .eq("vapi_call_id", callId)
              .eq("event_type", msg.type)
              .is("processed_at", null);
          }
          return json({ ok: true });
        } catch (e) {
          console.error("vapi-webhook error:", e instanceof Error ? e.message : "unknown");
          return json({ error: "Processing failed" }, 500);
        }
      },
    },
  },
});
