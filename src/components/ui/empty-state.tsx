import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className,
}: {
  icon: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        size === "md" ? "py-12" : "py-6",
        className
      )}
    >
      <div
        className={cn(
          "bg-muted text-muted-foreground flex items-center justify-center rounded-full",
          size === "md" ? "mb-1 size-12" : "mb-0.5 size-9"
        )}
      >
        <Icon className={size === "md" ? "size-5.5" : "size-4"} />
      </div>
      <p className={cn("font-medium", size === "sm" && "text-muted-foreground text-sm")}>{title}</p>
      {description && (
        <p className="text-muted-foreground max-w-xs text-sm text-balance">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
