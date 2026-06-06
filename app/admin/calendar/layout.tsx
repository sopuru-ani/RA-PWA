import type { ReactNode } from "react";

export default function AdminCalendarLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
      {children}
    </div>
  );
}
