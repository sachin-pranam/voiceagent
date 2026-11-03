import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  ended: "bg-success-soft text-success",
  "in-progress": "bg-info-soft text-info",
  ringing: "bg-warning-soft text-warning",
  queued: "bg-muted text-muted-foreground",
  forwarding: "bg-accent text-accent-foreground",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? "unknown";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        styles[s] ?? "bg-muted text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {s.replace("-", " ")}
    </span>
  );
}
