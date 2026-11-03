import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, FileText, Download, Search, Eye } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/StateBlocks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_authenticated/call-transcripts")({
  component: CallTranscriptsPage,
  head: () => ({
    meta: [
      { title: "Call Transcripts — Awaaz AI" },
      { name: "description", content: "Manage call transcripts" },
      { property: "og:title", content: "Call Transcripts — Awaaz AI" },
      {
        property: "og:description",
        content: "Manage call transcripts",
      },
    ],
  }),
});

function CallTranscriptsPage() {
  const [search, setSearch] = useState("");

  // Query for call transcripts
  const transcripts = useQuery({
    queryKey: ["call-transcripts", search],
    queryFn: async () => {
      let query = supabase
        .from("calls")
        .select("id,customer_number,customer_name,started_at,duration_seconds,transcript,messages,summary,status")
        .not("transcript", "is", null)
        .order("started_at", { ascending: false });

      if (search.trim()) {
        query = query.or(`customer_name.ilike.%${search}%,customer_number.ilike.%${search}%,transcript.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleCopyTranscript = (call: any) => {
    const transcript = call.transcript || 
      (Array.isArray(call.messages) ? call.messages.map((m: any) => `${m.role}: ${m.message}`).join('\n') : '');
    navigator.clipboard.writeText(transcript);
    toast.success("Transcript copied to clipboard!");
  };

  const handleDownloadTranscript = (call: any) => {
    const transcript = call.transcript || 
      (Array.isArray(call.messages) ? call.messages.map((m: any) => `${m.role}: ${m.message}`).join('\n') : '');
    
    const content = `Call Transcript
Date: ${formatDateTime(call.started_at)}
Caller: ${call.customer_name || call.customer_number || 'Unknown'}
Duration: ${call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : 'Unknown'}

${call.summary ? `Summary: ${call.summary}\n\n` : ''}Transcript:
${transcript}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${call.customer_number || call.id}-${new Date(call.started_at).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Call Transcripts</h1>
      </div>

      <p className="text-muted-foreground">
        Manage call transcripts from Twilio.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transcripts by caller, number, or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transcripts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Available Transcripts
          </CardTitle>
          <CardDescription>
            {transcripts.data?.length || 0} call transcripts available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transcripts.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : transcripts.isError ? (
            <ErrorState message="Could not load transcripts" onRetry={() => transcripts.refetch()} />
          ) : !transcripts.data?.length ? (
            <EmptyState icon={FileText} title="No transcripts available">
              Call transcripts will appear here once calls are completed with Twilio.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {transcripts.data.map((call) => (
                <div key={call.id} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {call.customer_name || call.customer_number || 'Unknown Caller'}
                        </h4>
                        <Badge variant="outline">
                          {formatDateTime(call.started_at)}
                        </Badge>
                        {call.duration_seconds && (
                          <Badge variant="secondary">
                            {Math.floor(call.duration_seconds / 60)}m {call.duration_seconds % 60}s
                          </Badge>
                        )}
                        <Badge 
                          className={
                            call.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : call.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }
                        >
                          {call.status}
                        </Badge>
                      </div>
                      
                      {call.summary && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          <strong>Summary:</strong> {call.summary}
                        </p>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        <strong>Transcript:</strong> {
                          call.transcript || 
                          (Array.isArray(call.messages) ? call.messages.map((m: any) => m.message).join(' ') : 'No transcript available')
                        }
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* View Full Transcript */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>
                              Call Transcript - {call.customer_name || call.customer_number || 'Unknown'}
                            </DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] mt-4">
                            <div className="space-y-4">
                              {/* Call Info */}
                              <div className="rounded-lg border bg-muted/50 p-4">
                                <h3 className="font-semibold mb-2">Call Information</h3>
                                <div className="grid gap-1 text-sm">
                                  <div><strong>Date:</strong> {formatDateTime(call.started_at)}</div>
                                  <div><strong>Caller:</strong> {call.customer_name || call.customer_number || 'Unknown'}</div>
                                  <div><strong>Duration:</strong> {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : 'Unknown'}</div>
                                  <div><strong>Status:</strong> {call.status}</div>
                                </div>
                              </div>

                              {/* Summary */}
                              {call.summary && (
                                <div className="rounded-lg border bg-primary/5 p-4">
                                  <h3 className="font-semibold mb-2">AI Summary</h3>
                                  <p className="text-sm">{call.summary}</p>
                                </div>
                              )}

                              {/* Full Transcript */}
                              <div className="rounded-lg border p-4">
                                <h3 className="font-semibold mb-2">Full Transcript</h3>
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {call.transcript || 
                                    (Array.isArray(call.messages) ? call.messages.map((m: any) => `${m.role}: ${m.message}`).join('\n') : 'No transcript available')}
                                </pre>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      {/* Copy */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTranscript(call)}
                      >
                        <FileText className="size-4" />
                      </Button>

                      {/* Download */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadTranscript(call)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Twilio Integration</CardTitle>
          <CardDescription>
            How call transcripts are processed and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Automatic Processing</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time transcription during calls</li>
                <li>• AI-generated call summaries</li>
                <li>• Speaker identification and timestamps</li>
                <li>• Automatic saving to database</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Management Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Search through all transcripts</li>
                <li>• Export transcripts as text files</li>
                <li>• Copy transcript content easily</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}