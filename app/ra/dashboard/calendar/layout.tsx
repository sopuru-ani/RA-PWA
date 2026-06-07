import type { ReactNode } from "react";

export default function RACalendarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
}
