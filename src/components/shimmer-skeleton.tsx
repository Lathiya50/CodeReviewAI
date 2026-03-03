import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  circle?: boolean;
}

export function ShimmerSkeleton({
  className,
  circle,
  ...props
}: ShimmerSkeletonProps) {
  return (
    <div
      data-slot="shimmer-skeleton"
      className={cn(
        "relative isolate overflow-hidden bg-muted/60 rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-[shimmer_2s_infinite]",
        "dark:before:via-white/[0.06]",
        "motion-reduce:before:hidden motion-reduce:animate-pulse",
        circle && "rounded-full aspect-square",
        className,
      )}
      {...props}
    />
  );
}

// Skeleton for repo card
export function RepoCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <ShimmerSkeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton className="h-4 w-3/5 rounded-md" />
          <ShimmerSkeleton className="h-3 w-1/4 rounded-md" />
        </div>
        <ShimmerSkeleton className="size-8 rounded-md" />
      </div>
      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <ShimmerSkeleton className="h-3 w-24 rounded-md" />
        <ShimmerSkeleton className="h-6 w-16 rounded-md" />
      </div>
    </div>
  );
}

// Skeleton for GitHub import list item
export function ImportRepoSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <ShimmerSkeleton className="size-4 rounded" />
      <div className="flex-1 space-y-2">
        <ShimmerSkeleton className="h-4 w-2/5 rounded-md" />
        <ShimmerSkeleton className="h-3 w-3/5 rounded-md" />
      </div>
      <ShimmerSkeleton className="h-3 w-10 rounded-md" />
    </div>
  );
}

// Skeleton for review card
export function ReviewCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-start gap-4">
        <ShimmerSkeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton className="h-4 w-4/5 rounded-md" />
          <ShimmerSkeleton className="h-3 w-2/3 rounded-md" />
          <div className="flex items-center gap-3 pt-1">
            <ShimmerSkeleton className="h-3 w-16 rounded-full" />
            <ShimmerSkeleton className="h-3 w-12 rounded-full" />
          </div>
        </div>
        <ShimmerSkeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

// Skeleton for PR detail header
export function PRHeaderSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ShimmerSkeleton className="size-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <ShimmerSkeleton className="h-7 w-96 max-w-full rounded-md" />
          <ShimmerSkeleton className="h-4 w-64 max-w-full rounded-md" />
        </div>
      </div>
      <ShimmerSkeleton className="h-24 w-full rounded-xl" />
      <ShimmerSkeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// Skeleton for repo detail page
export function RepoDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <ShimmerSkeleton className="size-9 rounded-lg" />
        <div className="space-y-2">
          <ShimmerSkeleton className="h-7 w-64 rounded-md" />
          <ShimmerSkeleton className="h-4 w-40 rounded-md" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <PRListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Skeleton for PR list item
export function PRListItemSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-start gap-3">
        <ShimmerSkeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton className="h-5 w-3/4 rounded-md" />
          <div className="flex items-center gap-3">
            <ShimmerSkeleton className="h-3 w-20 rounded-full" />
            <ShimmerSkeleton className="h-3 w-16 rounded-full" />
            <ShimmerSkeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
        <ShimmerSkeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}

// Skeleton for analytics stat card
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-4 w-24 rounded-md" />
        <ShimmerSkeleton className="size-8 rounded-lg" />
      </div>
      <ShimmerSkeleton className="h-8 w-20 rounded-md" />
      <ShimmerSkeleton className="h-3 w-32 rounded-md" />
    </div>
  );
}

// Skeleton for chart area
export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-5 w-32 rounded-md" />
        <ShimmerSkeleton className="h-8 w-24 rounded-md" />
      </div>
      <ShimmerSkeleton className={cn("w-full rounded-lg", height)} />
    </div>
  );
}

// Skeleton for diff file block
export function DiffFileSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/40">
        <ShimmerSkeleton className="size-4 rounded" />
        <ShimmerSkeleton className="h-4 w-48 rounded-md" />
        <div className="ml-auto flex items-center gap-2">
          <ShimmerSkeleton className="h-5 w-12 rounded-full" />
          <ShimmerSkeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="space-y-0.5 p-0">
        {[...Array(6)].map((_, i) => (
          <ShimmerSkeleton key={i} className="h-6 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
