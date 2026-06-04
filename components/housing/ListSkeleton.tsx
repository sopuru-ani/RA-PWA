import { Skeleton } from "@/components/ui/skeleton";

function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="px-4 py-4 flex flex-col gap-2 h-dvh overflow-hidden">
      <div className="flex flex-col gap-2">
        <Skeleton className="rounded-sm w-full h-4" />
        <Skeleton className="rounded-sm w-full h-6" />
        <Skeleton className="rounded-sm w-full h-4" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="rounded-md w-full h-16" />
        ))}
      </div>
    </div>
  );
}

export default ListSkeleton;
