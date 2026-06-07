import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type Props = {
  message: string;
  description?: string;
  icon?: React.ReactNode;
  action?: EmptyStateAction;
};

export default function EmptyState({
  message,
  description,
  icon,
  action,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-3 py-12 text-center text-muted-foreground">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>

      <h2 className="text-lg font-semibold text-foreground">{message}</h2>

      {description ? (
        <p className="mt-1 max-w-sm text-sm">{description}</p>
      ) : null}

      {action ? (
        <div className="mt-4">
          {action.href ? (
            <Button asChild className="text-white">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              type="button"
              className="text-white"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
