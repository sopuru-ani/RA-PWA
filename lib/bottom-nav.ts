import { cn } from "@/lib/utils";

export function bottomNavClassName(className?: string) {
  return cn(
    "shrink-0 border-t bg-background pb-[max(0.25rem,env(safe-area-inset-bottom))]",
    className,
  );
}

export function bottomNavGridClassName(columns: 5 | 6) {
  return cn("grid w-full", columns === 5 ? "grid-cols-5" : "grid-cols-6");
}

export function bottomNavItemClassName(active?: boolean) {
  return cn(
    "flex w-full min-w-0 flex-col items-center justify-center gap-1 py-2",
    "text-[11px] leading-none sm:text-xs",
    "transition-colors touch-manipulation select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    active ? "text-primary" : "text-muted-foreground hover:text-primary",
  );
}

/** Fixed position for a bar sitting directly above the bottom nav. */
export function stickyAboveBottomNavClassName(className?: string) {
  return cn(
    "bottom-[calc(3.5rem+env(safe-area-inset-bottom))]",
    className,
  );
}

/** Mobile-only padding so list content clears a sticky action bar above the nav. */
export function stickyActionBarClearanceClassName(className?: string) {
  return cn("pb-16 md:pb-0", className);
}
