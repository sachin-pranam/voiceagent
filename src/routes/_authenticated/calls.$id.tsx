import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Copy,
  FileText,
  MicOff,
  PhoneOff,
  Sparkles,
  User,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/StateBlocks";
import { StatusBadge } from "@/components/calls/StatusBadge";
import { AudioPlayer } from "@/components/calls/AudioPlayer";
import { LiveTranscript } from "@/components/calls/LiveTranscript";
import { formatCallType, formatCost, formatDateTime, formatDuration } from "@/lib/format";
import { useCallsRealtime } from "@/hooks/use-calls-realtime";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/calls/$id")({
  component: CallDetails,
  head: () => ({
    meta: [
      { title: "Call details — Awaaz AI" },
      { name: "description", content: "Recording, transcript and AI summary for a single call." },
      { property: "og:title", content: "Call details — Awaaz AI" },
      {
        property: "og:description",
        content: "Recording, transcript and AI summary for a single call.",
      },
    ],
  }),
});

type Msg = { role: "customer" | "assistant"; message: string; secondsFromStart: number | null };

function CallDetails() {
  useCallsRealtime();
  const { id } = Route.useParams();
  const call = useQuery({
    queryKey: ["call", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select(
          "id,vapi_call_id,assistant_id,customer_name,customer_number,call_type,status,started_at,ended_at,duration_seconds,cost_usd,ended_reason,summary,transcript,messages,recording_url,stereo_recording_url,analysis,raw_payload,created_at",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
      <Link to="/calls">
        <ArrowLeft className="size-4" /> All calls
      </Link>
    </Button>
  );

  if (call.isLoading) {
    return (
      <>
        {back}
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </>
    );
  }
  if (call.isError)
    return (
      <>
        {back}
        <div className="rounded-xl border bg-card">
          <ErrorState onRetry={() => call.refetch()} />
        </div>
      </>
    );
  const c = call.data;
  if (!c)
    return (
      <>
        {back}
        <div className="rounded-xl border bg-card">
          <EmptyState icon={PhoneOff} title="Call not found">
            This call doesn't exist or you don't have access to it.
          </EmptyState>
        </div>
      </>
    );

  const messages = (Array.isArray(c.messages) ? c.messages : []) as Msg[];
  const transcriptText =
    c.transcript ||
    messages.map((m) => `${m.role === "customer" ? "Customer" : "AI"}: ${m.message}`).join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(transcriptText);
    toast.success("Transcript copied");
  };

  const info: [string, React.ReactNode][] = [
    ["SIP call ID", <span className="break-all font-mono text-xs">{c.vapi_call_id}</span>],
    ["Assistant ID", <span className="break-all font-mono text-xs">{c.assistant_id ?? "—"}</span>],
    ["Call type", formatCallType(c.call_type)],
    ["Started", formatDateTime(c.started_at)],
    ["Ended", formatDateTime(c.ended_at)],
    ["Duration", formatDuration(c.duration_seconds)],
    ["Cost", formatCost(c.cost_usd)],
    ["End reason", c.ended_reason?.replaceAll("-", " ") ?? "—"],
    ["Status", <StatusBadge status={c.status} />],
  ];

  // Extract call response data if available
  const callResponse = c.analysis || c.raw_payload;

  return (
    <>
      {back}
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-xl font-semibold">
                {c.customer_number ?? "Unknown caller"}
              </h1>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {c.customer_name ? `${c.customer_name} · ` : ""}
              {formatCallType(c.call_type)} · {formatDateTime(c.started_at ?? c.created_at)}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="tabular text-lg font-semibold">
                {formatDuration(c.duration_seconds)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cost</div>
              <div className="tabular text-lg font-semibold">{formatCost(c.cost_usd)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-medium">Recording</h2>
            {c.recording_url ? (
              <AudioPlayer src={c.recording_url} />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MicOff className="size-4" /> No recording is available for this call.
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="font-medium">Transcript</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={copy} disabled={!transcriptText}>
                  <Copy className="size-4" /> Copy
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="size-4" /> Live View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Live Transcript & Chat</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <LiveTranscript 
                        callId={c.id}
                        isActive={c.status === 'in-progress' || c.status === 'ringing'}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            {messages.length ? (
              <div className="max-h-[560px] space-y-3 overflow-y-auto p-5">
                {messages.map((m, i) => {
                  const ai = m.role === "assistant";
                  return (
                    <div key={i} className={cn("flex gap-2.5", !ai && "flex-row-reverse")}>
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full",
                          ai
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {ai ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                      </div>
                      <div className={cn("max-w-[80%]", !ai && "text-right")}>
                        <div className="mb-0.5 text-[11px] text-muted-foreground">
                          {ai ? "AI assistant" : "Customer"}
                          {m.secondsFromStart !== null &&
                            ` · ${formatDuration(Math.floor(m.secondsFromStart))}`}
                        </div>
                        <div
                          className={cn(
                            "inline-block rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed",
                            ai ? "rounded-tl-sm bg-bubble-ai" : "rounded-tr-sm bg-bubble-user",
                          )}
                        >
                          {m.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : c.transcript ? (
              <pre className="max-h-[560px] overflow-y-auto whitespace-pre-wrap p-5 font-sans text-sm leading-relaxed">
                {c.transcript}
              </pre>
            ) : (
              <EmptyState icon={FileText} title="No transcript">
                A transcript will appear once the call has ended and Twilio has processed it.
              </EmptyState>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-primary" /> AI summary
            </h2>
            {c.summary ? (
              <p className="text-sm leading-relaxed">{c.summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No summary is available for this call.
              </p>
            )}
          </section>
          <section className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-3 font-medium">Call information</h2>
            <dl className="space-y-2.5 text-sm">
              {info.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="text-right capitalize-first">{v}</dd>
                </div>
              ))}
            </dl>

            {/* View Call Response Button */}
            {callResponse && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-4 w-full">
                    <MessageSquare className="size-4" />
                    View Call Response
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Call Details & Response</DialogTitle>
                  </DialogHeader>

                  <div className="mt-4 space-y-6">
                    {/* Call Information Summary */}
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <h3 className="mb-3 font-semibold">Call Information</h3>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Caller Number:</span>
                          <span className="font-mono font-medium">
                            {c.customer_number || "Unknown"}
                          </span>
                        </div>
                        {c.customer_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer Name:</span>
                            <span className="font-medium">{c.customer_name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Call Type:</span>
                          <span className="font-medium">{formatCallType(c.call_type)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{formatDuration(c.duration_seconds)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    </div>

                    {/* Conversation Transcript */}
                    {messages.length > 0 && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-3 font-semibold">Conversation Transcript</h3>
                        <div className="max-h-96 space-y-3 overflow-y-auto">
                          {messages.map((m, i) => {
                            const isAI = m.role === "assistant";
                            return (
                              <div key={i} className={`flex gap-3 ${!isAI && "flex-row-reverse"}`}>
                                <div
                                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                                    isAI
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-secondary text-secondary-foreground"
                                  }`}
                                >
                                  {isAI ? <Bot className="size-4" /> : <User className="size-4" />}
                                </div>
                                <div className={`flex-1 ${!isAI && "text-right"}`}>
                                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-medium">
                                      {isAI ? "AI Assistant" : "Customer"}
                                    </span>
                                    {m.secondsFromStart !== null && (
                                      <span>
                                        • {formatDuration(Math.floor(m.secondsFromStart))}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className={`inline-block rounded-lg px-3 py-2 text-sm ${
                                      isAI ? "bg-bubble-ai text-left" : "bg-bubble-user text-left"
                                    }`}
                                  >
                                    {m.message}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* AI Summary */}
                    {c.summary && (
                      <div className="rounded-lg border bg-primary/5 p-4">
                        <h3 className="mb-2 flex items-center gap-2 font-semibold">
                          <Sparkles className="size-4 text-primary" />
                          AI Summary
                        </h3>
                        <p className="text-sm leading-relaxed">{c.summary}</p>
                      </div>
                    )}

                    {/* Analysis Data */}
                    {c.analysis && (
                      <div className="rounded-lg border p-4">
                        <h3 className="mb-3 font-semibold">Call Analysis</h3>
                        <pre className="rounded-lg bg-muted p-3 text-xs">
                          {JSON.stringify(c.analysis, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Raw Response Data */}
                    <div className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold">Raw Response Data</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(callResponse, null, 2));
                            toast.success("Response data copied!");
                          }}
                        >
                          <Copy className="size-4" />
                          Copy
                        </Button>
                      </div>
                      <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
                        {JSON.stringify(callResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
