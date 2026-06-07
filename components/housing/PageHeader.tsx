import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  className,
}: Props) {
  return (
    <div className={cn("mb-2 space-y-1", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      ) : null}
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
