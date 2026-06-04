import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType[];
  /** When true, any path under href counts as active (except exact /admin/dashboard) */
  matchPrefix?: boolean;
}

export function NavItem({
  href,
  label,
  icon: [Icon1, Icon2],
  matchPrefix = false,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = matchPrefix
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
      )}
    >
      {isActive ? <Icon1 className="h-5 w-5" /> : <Icon2 className="h-5 w-5" />}

      <span>{label}</span>
    </Link>
  );
}
