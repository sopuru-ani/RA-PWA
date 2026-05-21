import { motion } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  msg: string;

  // appearance
  type?: "error" | "success" | "neutral";

  // behavior
  closable?: boolean;
  duration?: number | null;

  onClose?: () => void;
}

function Notifications({
  msg,
  closable = false,
  type = "neutral",
  onClose,
}: Props) {
  const typeStyles = {
    error: "bg-red-500/15 border-red-500 text-red-200",

    success: "bg-green-500/15 border-green-500 text-green-200",

    neutral: "bg-secondary border-secondary-muted text-white",
  };

  return (
    <div className="fixed top-0 left-0 w-dvw p-4 flex justify-center pointer-events-none z-50 text-sm">
      <motion.div
        layout
        initial={{
          opacity: 0,
          y: -20,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -20,
          scale: 0.95,
        }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        className={`
          w-full max-w-[400px]
          rounded-t-lg border-b-2
          p-3 font-semibold
          shadow-[0_-2px_8px_rgba(0,0,0,0.10)]
          pointer-events-auto
          flex items-center justify-between gap-3
          backdrop-blur-md
          ${typeStyles[type]}
        `}
      >
        <p className="flex-1 wrap-break-words">{msg}</p>

        {closable && (
          <button
            type="button"
            aria-label="Close notification"
            onClick={onClose}
            className="
              shrink-0 rounded-full p-1
              transition-colors
              hover:bg-white/10
              active:scale-95
              cursor-pointer
            "
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default Notifications;
