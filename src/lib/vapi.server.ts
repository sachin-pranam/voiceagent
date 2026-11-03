// Server-only helpers for normalizing Vapi call data and upserting into the calls table.
/* eslint-disable @typescript-eslint/no-explicit-any */

export const VAPI_BASE = "https://api.vapi.ai";

const STATUS_RANK: Record<string, number> = {
  scheduled: 0,
  queued: 1,
  ringing: 2,
  "in-progress": 3,
  forwarding: 4,
  ended: 5,
};

export function rank(status?: string | null) {
  return status ? (STATUS_RANK[status] ?? 0) : -1;
}

export type CallRow = {
  vapi_call_id: string;
  assistant_id?: string | null;
  customer_name?: string | null;
  customer_number?: string | null;
  call_type?: string | null;
  status?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  cost_usd?: number | null;
  ended_reason?: string | null;
  summary?: string | null;
  transcript?: string | null;
  messages?: any;
  recording_url?: string | null;
  stereo_recording_url?: string | null;
  analysis?: any;
  raw_payload?: any;
};

function cleanMessages(msgs: any): any {
  if (!Array.isArray(msgs)) return null;
  const out = msgs
    .filter((m) => m && (m.role === "user" || m.role === "bot" || m.role === "assistant"))
    .map((m) => ({
      role: m.role === "user" ? "customer" : "assistant",
      message: String(m.message ?? m.content ?? ""),
      time: typeof m.time === "number" ? m.time : null,
      secondsFromStart: typeof m.secondsFromStart === "number" ? m.secondsFromStart : null,
    }))
    .filter((m) => m.message.trim().length > 0);
  return out.length ? out : null;
}

function durationFrom(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null;
  const d = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return Number.isFinite(d) && d >= 0 ? d : null;
}

/** Normalize a Vapi Call object (from REST API or webhook `message.call`). */
export function normalizeCall(call: any, extra: any = {}): CallRow | null {
  const id = call?.id ?? extra?.callId;
  if (!id || typeof id !== "string") {
    console.log("Skipping call - no valid ID:", { callId: call?.id, extraCallId: extra?.callId, call: call });
    return null;
  }
  
  console.log("Normalizing call:", {
    id,
    status: extra?.status ?? call?.status,
    type: call?.type,
    customerNumber: call?.customer?.number,
    startedAt: extra?.startedAt ?? call?.startedAt
  });
  
  const artifact = { ...(call?.artifact ?? {}), ...(extra?.artifact ?? {}) };
  const analysis = extra?.analysis ?? call?.analysis ?? null;
  const startedAt = extra?.startedAt ?? call?.startedAt ?? null;
  const endedAt = extra?.endedAt ?? call?.endedAt ?? null;
  const cost = extra?.cost ?? call?.cost;
  const dur =
    typeof extra?.durationSeconds === "number"
      ? Math.round(extra.durationSeconds)
      : durationFrom(startedAt, endedAt);

  const normalized = {
    vapi_call_id: id,
    assistant_id: call?.assistantId ?? null,
    customer_name: call?.customer?.name ?? null,
    customer_number: call?.customer?.number ?? null,
    call_type: call?.type ?? null,
    status: extra?.status ?? call?.status ?? null,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: dur,
    cost_usd: typeof cost === "number" ? cost : null,
    ended_reason: extra?.endedReason ?? call?.endedReason ?? null,
    summary: analysis?.summary ?? extra?.summary ?? call?.summary ?? null,
    transcript: artifact?.transcript ?? extra?.transcript ?? call?.transcript ?? null,
    messages: cleanMessages(artifact?.messages ?? extra?.messages ?? call?.messages),
    recording_url:
      artifact?.recordingUrl ??
      artifact?.recording?.mono?.combinedUrl ??
      extra?.recordingUrl ??
      call?.recordingUrl ??
      null,
    stereo_recording_url:
      artifact?.stereoRecordingUrl ??
      artifact?.recording?.stereoUrl ??
      extra?.stereoRecordingUrl ??
      call?.stereoRecordingUrl ??
      null,
    analysis: analysis
      ? {
          successEvaluation: analysis.successEvaluation ?? null,
          structuredData: analysis.structuredData ?? null,
        }
      : null,
    raw_payload: null,
  };
  
  console.log("Normalized call result:", normalized);
  return normalized;
}

/** Merge incoming partial data with existing row without regressing final data. */
export function mergeCall(existing: any | null, incoming: CallRow, isFinal: boolean): CallRow {
  if (!existing) return incoming;
  const merged: any = { vapi_call_id: incoming.vapi_call_id };
  const existingFinal = existing.status === "ended" && existing.ended_at;
  for (const [k, v] of Object.entries(incoming)) {
    if (k === "vapi_call_id") continue;
    const cur = existing[k];
    if (k === "status") {
      merged.status = rank(v as string) >= rank(cur) ? v : cur;
      continue;
    }
    if (v === null || v === undefined) {
      merged[k] = cur ?? null;
    } else if (existingFinal && !isFinal && cur !== null && cur !== undefined) {
      merged[k] = cur; // never overwrite final data with older/incomplete events
    } else {
      merged[k] = v;
    }
  }
  return merged;
}

export async function upsertCall(admin: any, row: CallRow, isFinal: boolean) {
  const { data: existing } = await admin
    .from("calls")
    .select("*")
    .eq("vapi_call_id", row.vapi_call_id)
    .maybeSingle();
  const merged = mergeCall(existing, row, isFinal);
  const { error } = await admin.from("calls").upsert(merged, { onConflict: "vapi_call_id" });
  if (error) throw new Error(`DB upsert failed: ${error.message}`);
}

export async function setSetting(admin: any, key: string, value: unknown) {
  await admin.from("app_settings").upsert({ key, value }, { onConflict: "key" });
}

export async function vapiFetch(path: string, key: string) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  return res;
}
