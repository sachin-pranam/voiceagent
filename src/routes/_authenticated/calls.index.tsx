import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, PhoneOff, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, PageHeader } from "@/components/StateBlocks";
import { CALL_LIST_COLUMNS, CallsTable, type CallListRow } from "@/components/calls/CallsTable";
import { CALL_STATUSES, CALL_TYPES, errorMessage } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { syncVapiCalls } from "@/lib/admin.functions";
import { useCallsRealtime } from "@/hooks/use-calls-realtime";

export const Route = createFileRoute("/_authenticated/calls/")({
  component: CallsPage,
  head: () => ({
    meta: [
      { title: "Calls — Awaaz AI" },
      { name: "description", content: "Search and filter every AI-handled phone call." },
      { property: "og:title", content: "Calls — Awaaz AI" },
      { property: "og:description", content: "Search and filter every AI-handled phone call." },
    ],
  }),
});

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function CallsPage() {
  useCallsRealtime();
  const { role } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const q = useDebounced(search.trim());

  useEffect(() => setPage(0), [q, status, type, from, to, pageSize]);

  // Add automatic refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Auto-refreshing calls data");
      qc.invalidateQueries({ queryKey: ["calls"] });
      qc.invalidateQueries({ queryKey: ["call-stats"] });
      setLastUpdated(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [qc]);

  const calls = useQuery({
    queryKey: ["calls", "list", { q, status, type, from, to, page, pageSize }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase
        .from("calls")
        .select(CALL_LIST_COLUMNS, { count: "exact" })
        .order("started_at", { ascending: false, nullsFirst: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (q) {
        const safe = q.replace(/[,()*%\\]/g, "").slice(0, 60);
        if (safe) query = query.or(`customer_number.ilike.%${safe}%,customer_name.ilike.%${safe}%`);
      }
      if (status !== "all") query = query.eq("status", status);
      if (type !== "all") query = query.eq("call_type", type);
      if (from) query = query.gte("started_at", new Date(from + "T00:00:00").toISOString());
      if (to) query = query.lte("started_at", new Date(to + "T23:59:59.999").toISOString());
      const { data, error, count } = await query;
      if (error) throw error;
      
      // Update timestamp when data is successfully fetched
      setLastUpdated(new Date());
      
      return { rows: data as CallListRow[], count: count ?? 0 };
    },
  });

  const sync = useServerFn(syncVapiCalls);
  
  const syncMut = useMutation({
    mutationFn: () => sync(),
    onSuccess: (r) => {
      const message = r.errors?.length 
        ? `Synced ${r.synced} of ${r.totalFetched} calls from Twilio (${r.errors.length} errors)`
        : `Synced ${r.synced} call${r.synced === 1 ? "" : "s"} from Twilio`;
      
      if (r.errors?.length) {
        toast.error(`${message}. Check console for details.`);
        console.error("Sync errors:", r.errors);
      } else {
        toast.success(message);
      }
      
      qc.invalidateQueries({ queryKey: ["calls"] });
      qc.invalidateQueries({ queryKey: ["call-stats"] });
    },
    onError: (e) => {
      console.error("Sync mutation error:", e);
      toast.error(errorMessage(e, "Sync failed"));
    },
  });

  const total = calls.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = search || status !== "all" || type !== "all" || from || to;
  const clear = () => {
    setSearch("");
    setStatus("all");
    setType("all");
    setFrom("");
    setTo("");
  };

  return (
    <>
      <PageHeader
        title="Calls"
        description={`Every call handled by your AI assistant. Last updated: ${lastUpdated.toLocaleTimeString()}`}
        actions={
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                🔄 Auto-refresh: 30s
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                calls.refetch();
                setLastUpdated(new Date());
              }}
              disabled={calls.isFetching}
            >
              <RefreshCw className={calls.isFetching ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </Button>
            {role === "admin" && (
              <Button size="sm" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
                {syncMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Sync Twilio calls
              </Button>
            )}
          </>
        }
      />

      <div className="rounded-xl border bg-card shadow-card">
        <div className="flex flex-col gap-2 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by number or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search calls"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace("-", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="sm:w-32" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {CALL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
              className="sm:w-38"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
              className="sm:w-38"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                className="col-span-2 sm:col-span-1"
              >
                <X className="size-4" /> Clear
              </Button>
            )}
          </div>
        </div>

        {calls.isError ? (
          <ErrorState message={errorMessage(calls.error)} onRetry={() => calls.refetch()} />
        ) : !calls.isLoading && total === 0 ? (
          <EmptyState icon={PhoneOff} title={hasFilters ? "No matching calls" : "No calls yet"}>
            {hasFilters
              ? "Try adjusting or clearing your filters."
              : "Calls will appear here once Twilio receives and processes them."}
          </EmptyState>
        ) : (
          <CallsTable rows={calls.data?.rows} loading={calls.isLoading} showName />
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
          <div className="flex items-center gap-2 text-muted-foreground">
            Rows per page
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular text-muted-foreground">
              {total
                ? `${page * pageSize + 1}–${Math.min(total, (page + 1) * pageSize)} of ${total}`
                : "0 results"}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
