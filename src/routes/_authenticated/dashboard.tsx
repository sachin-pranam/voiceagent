import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { CalendarClock, Clock, DollarSign, PhoneCall, PhoneOff, RefreshCw, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/StateBlocks";
import { CALL_LIST_COLUMNS, CallsTable, type CallListRow } from "@/components/calls/CallsTable";
import { formatCost, formatDuration } from "@/lib/format";
import { useCallsRealtime } from "@/hooks/use-calls-realtime";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Awaaz AI" },
      { name: "description", content: "Overview of AI call volume, duration and cost." },
      { property: "og:title", content: "Dashboard — Awaaz AI" },
      { property: "og:description", content: "Overview of AI call volume, duration and cost." },
    ],
  }),
});

type Stats = {
  total_calls: number;
  calls_today: number;
  total_duration: number;
  total_cost: number;
  per_day: { day: string; count: number }[];
};

function Dashboard() {
  useCallsRealtime();
  const { role } = useAuth();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const stats = useQuery({
    queryKey: ["call-stats", tz],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("call_stats", { _tz: tz });
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  const recent = useQuery({
    queryKey: ["calls", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select(CALL_LIST_COLUMNS)
        .order("started_at", { ascending: false, nullsFirst: false })
        .limit(10);
      if (error) throw error;
      return data as CallListRow[];
    },
  });

  const users = useQuery({
    queryKey: ["users", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: role === "admin",
  });

  const refresh = () => {
    stats.refetch();
    recent.refetch();
  };

  const kpis = [
    { label: "Total calls", icon: PhoneCall, value: stats.data?.total_calls.toLocaleString() },
    { label: "Calls today", icon: CalendarClock, value: stats.data?.calls_today.toLocaleString() },
    {
      label: "Total duration",
      icon: Clock,
      value: stats.data && formatDuration(Number(stats.data.total_duration)),
    },
    {
      label: "Total cost",
      icon: DollarSign,
      value: stats.data && formatCost(Number(stats.data.total_cost)),
    },
    ...(role === "admin" ? [
      { label: "Total users", icon: Users, value: users.data?.toLocaleString() ?? "0" }
    ] : [])
  ];

  const chartData = (stats.data?.per_day ?? []).map((d) => ({
    day: format(new Date(d.day + "T00:00:00"), "EEE"),
    calls: d.count,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live overview of calls handled by your AI assistant."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={stats.isFetching || recent.isFetching}
          >
            <RefreshCw className={stats.isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      {stats.isError ? (
        <div className="rounded-xl border bg-card shadow-card">
          <ErrorState onRetry={() => stats.refetch()} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border bg-card p-4 shadow-card md:p-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {k.label}
                <k.icon className="size-4" />
              </div>
              {stats.isLoading ? (
                <Skeleton className="mt-3 h-8 w-20" />
              ) : (
                <div className="tabular mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                  {k.value}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-card lg:col-span-1">
          <h2 className="font-medium">Calls per day</h2>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
          <div className="mt-4 h-56">
            {stats.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -24, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="calls" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-medium">Recent calls</h2>
              <p className="text-sm text-muted-foreground">Latest 10 calls</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calls">View all</Link>
            </Button>
          </div>
          {recent.isError ? (
            <ErrorState onRetry={() => recent.refetch()} />
          ) : !recent.isLoading && recent.data?.length === 0 ? (
            <EmptyState icon={PhoneOff} title="No calls yet">
              Calls will appear here automatically once Twilio receives and processes them.
            </EmptyState>
          ) : (
            <CallsTable rows={recent.data} loading={recent.isLoading} />
          )}
        </div>
      </div>
    </>
  );
}
