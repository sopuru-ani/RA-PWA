"use client";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full w-full overflow-hidden">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />

        {/* Optional text */}
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export default Spinner;
