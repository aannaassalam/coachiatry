import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type UploadProgressOverlayProps = {
  progress: number; // 0–100
  onCancel: () => void;
};

export default function UploadProgressOverlay({
  progress,
  onCancel
}: UploadProgressOverlayProps) {
  const radius = 26;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isSpinner = progress <= 0;

  return (
    <AnimatePresence>
      {progress < 100 && (
        <motion.div
          key="progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10"
        >
          <div className="relative flex items-center justify-center">
            <motion.svg
              className={isSpinner ? "animate-spin-slow" : "rotate-[-90deg]"}
              height={radius * 2}
              width={radius * 2}
            >
              {/* background track */}
              <circle
                stroke="rgba(255,255,255,0.3)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />

              {/* spinner or progress */}
              <circle
                stroke="#fff"
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                  strokeDashoffset: isSpinner
                    ? circumference * 0.75 // show only 3/4 ring for spinner
                    : strokeDashoffset
                }}
                className={"transition-all duration-200"}
              />
            </motion.svg>

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="absolute inset-0 flex items-center justify-center text-white hover:text-red-400"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Progress text */}
            {/* {!isSpinner && (
              <span className="absolute text-xs text-white font-medium">
                {progress.toFixed(0)}%
              </span>
            )} */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
