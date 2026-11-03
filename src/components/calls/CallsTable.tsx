import { Link } from "@tanstack/react-router";
import { ChevronRight, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./StatusBadge";
import { formatCallType, formatCost, formatDateTime, formatDuration } from "@/lib/format";

export type CallListRow = {
  id: string;
  customer_number: string | null;
  customer_name: string | null;
  call_type: string | null;
  started_at: string | null;
  created_at: string;
  duration_seconds: number | null;
  status: string | null;
  cost_usd: number | null;
};

export const CALL_LIST_COLUMNS =
  "id,customer_number,customer_name,call_type,started_at,created_at,duration_seconds,status,cost_usd";

export function CallsTable({
  rows,
  loading,
  showName,
}: {
  rows?: CallListRow[] | undefined;
  loading?: boolean;
  showName?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caller</TableHead>
              {showName && <TableHead>Name</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Date & time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows?.map((c) => (
              <TableRow key={c.id} className="group">
                <TableCell className="font-mono text-sm">
                  {c.customer_number ?? <span className="text-muted-foreground">Unknown</span>}
                  {!showName && c.customer_name && (
                    <div className="font-sans text-xs text-muted-foreground">{c.customer_name}</div>
                  )}
                </TableCell>
                {showName && <TableCell>{c.customer_name ?? "—"}</TableCell>}
                <TableCell>{formatCallType(c.call_type)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(c.started_at ?? c.created_at)}
                </TableCell>
                <TableCell className="tabular">{formatDuration(c.duration_seconds)}</TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="tabular text-right">{formatCost(c.cost_usd)}</TableCell>
                <TableCell>
                  <Link
                    to="/calls/$id"
                    params={{ id: c.id }}
                    aria-label="View call details"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile */}
      <ul className="divide-y md:hidden">
        {rows?.map((c) => (
          <li key={c.id}>
            <Link
              to="/calls/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 p-4 hover:bg-muted/50"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Phone className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-sm">
                    {c.customer_number ?? "Unknown"}
                  </span>
                  <span className="tabular text-sm">{formatCost(c.cost_usd)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatDateTime(c.started_at ?? c.created_at)} ·{" "}
                    {formatDuration(c.duration_seconds)}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
