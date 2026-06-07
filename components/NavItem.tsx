"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItemClassName } from "@/lib/bottom-nav";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType[];
  /** When true, any path under href counts as active */
  matchPrefix?: boolean;
  /** Optional count shown on the icon (e.g. program notifications) */
  badge?: string | number;
}

export function NavItem({
  href,
  label,
  icon: [Icon1, Icon2],
  matchPrefix = false,
  badge,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = matchPrefix
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;

  const Icon = isActive ? Icon1 : Icon2;
  const showBadge = badge != null && badge !== "" && badge !== 0;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={bottomNavItemClassName(isActive)}
    >
      <span className="relative inline-flex shrink-0">
        <Icon className="h-5 w-5" />
        {showBadge ? (
          <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate px-0.5">{label}</span>
    </Link>
  );
}
