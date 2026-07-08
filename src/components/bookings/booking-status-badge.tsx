const COLORS: Record<string, string> = {
  CONFIRMED: "#22c55e",
  CANCELLED: "#ef4444",
};

export function BookingStatusBadge({ status }: { status: "CONFIRMED" | "CANCELLED" }) {
  const color = COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status === "CONFIRMED" ? "Confirmed" : "Cancelled"}
    </span>
  );
}
