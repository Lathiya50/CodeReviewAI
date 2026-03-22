import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "success" | "warning" | "error" | "info" | "processing";
  className?: string;
}

const statusStyles = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  processing: "bg-blue-500 animate-pulse",
};

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      {status === "processing" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
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
