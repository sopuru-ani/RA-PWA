import { ReactNode } from "react";

function layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh">
      <p>This is the main layout ig</p>
      {children}
    </div>
  );
}

export default layout;
