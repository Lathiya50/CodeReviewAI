import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "success" | "warning" | "error" | "info" | "processing";
  className?: string;
}

const statusStyles = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-danger",
  info: "bg-info",
  processing: "bg-info animate-pulse",
};

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      {status === "processing" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          statusStyles[status]
        )}
      />
    </span>
  );
}
