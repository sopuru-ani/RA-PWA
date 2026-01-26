export default function DebugHydration({ label }: { label: string }) {
  if (typeof window === "undefined") {
    console.log(`[SERVER] ${label}`);
  } else {
    console.log(`[CLIENT] ${label}`);
  }

  return null; // important: renders nothing
}
