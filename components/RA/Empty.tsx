import React from "react";
import { Inbox } from "lucide-react";

type EmptyProps = {
  message: string;
  description?: string;
  icon?: React.ReactNode;
};

function Empty({ message, description, icon }: EmptyProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 text-center text-muted-foreground">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>

      <h2 className="text-lg font-semibold text-foreground">{message}</h2>

      {description && <p className="mt-1 max-w-sm text-sm">{description}</p>}
    </div>
  );
}

export default Empty;
