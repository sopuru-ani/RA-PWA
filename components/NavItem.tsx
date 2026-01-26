import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType[];
}

export function NavItem({ href, label, icon: [Icon1, Icon2] }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

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
