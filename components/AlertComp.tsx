import {
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  PopcornIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function AlertComp({
  title,
  description,
  variant,
}: {
  title: string;
  description: string;
  variant: "default" | "destructive" | "success";
}) {
  return (
    // <div className="grid w-full max-w-xl items-start gap-4">
    <div>
      <Alert variant={variant} className="flex flex-col">
        <div className="flex flex-row items-center gap-1">
          {variant === "destructive" && <XCircleIcon className="w-5 h-5" />}
          {variant === "success" && <CheckCircle2Icon className="w-5 h-5" />}
          <AlertTitle>{title}</AlertTitle>
        </div>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      {/* <Alert>
        <PopcornIcon />
        <AlertTitle>
          This Alert has a title and an icon. No description.
        </AlertTitle>
      </Alert> */}
      {/* <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Unable to process your payment.</AlertTitle>
        <AlertDescription>
          <p>Please verify your billing information and try again.</p>
          <ul className="list-inside list-disc text-sm">
            <li>Check your card details</li>
            <li>Ensure sufficient funds</li>
            <li>Verify billing address</li>
          </ul>
        </AlertDescription>
      </Alert> */}
    </div>
  );
}

export default AlertComp;
