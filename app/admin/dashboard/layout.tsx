import { ReactNode } from "react";

function layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="px-2 py-2 flex-1 overflow-y-auto">{children}</div>
    </>
  );
}

export default layout;
