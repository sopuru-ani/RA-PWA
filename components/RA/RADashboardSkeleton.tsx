import { Skeleton } from "@/components/ui/skeleton";

function RADashboardSkeleton() {
  return (
    <>
      <div className="px-4 py-4 flex flex-col gap-2 h-dvh overflow-hidden">
        <div className="flex flex-col gap-2">
          <Skeleton className="rounded-sm w-full h-4" />
          <Skeleton className="rounded-sm w-full h-6" />
          <Skeleton className="rounded-sm w-full h-4" />
          <Skeleton className="rounded-sm w-full h-4" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 30 }).map((_, skel) => (
            <Skeleton key={skel} className="rounded-md w-full h-24"></Skeleton>
          ))}
        </div>
      </div>
    </>
  );
}

export default RADashboardSkeleton;
