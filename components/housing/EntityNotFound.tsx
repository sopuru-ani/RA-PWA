import { Button } from "@/components/ui/button";
import EmptyState from "@/components/housing/EmptyState";

type Props = {
  message: string;
  description?: string;
  backHref: string;
  backLabel: string;
};

export default function EntityNotFound({
  message,
  description,
  backHref,
  backLabel,
}: Props) {
  return (
    <EmptyState
      message={message}
      description={description}
      action={{ label: backLabel, href: backHref }}
    />
  );
}
