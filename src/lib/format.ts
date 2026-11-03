import { format } from "date-fns";

export function formatDuration(sec?: number | null) {
  if (sec === null || sec === undefined) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatCost(n?: number | string | null) {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  return `$${v.toFixed(v < 1 && v > 0 ? 3 : 2)}`;
}

export function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy · h:mm a");
}

export function formatCallType(t?: string | null) {
  switch (t) {
    case "inboundPhoneCall":
      return "Inbound";
    case "outboundPhoneCall":
      return "Outbound";
    case "webCall":
      return "Web";
    default:
      return t ?? "—";
  }
}

export const CALL_TYPES = [
  { value: "inboundPhoneCall", label: "Inbound" },
  { value: "outboundPhoneCall", label: "Outbound" },
  { value: "webCall", label: "Web" },
];

export const CALL_STATUSES = ["queued", "ringing", "in-progress", "forwarding", "ended"];

export function errorMessage(e: unknown, fallback = "Something went wrong") {
  if (e instanceof Error && e.message && e.message.length < 200) return e.message;
  return fallback;
}
