import { AnimatePresence, motion } from "framer-motion";

export const TypingIndicator = ({ text }: { text: string }) => (
  <AnimatePresence>
    {text && (
      <motion.div
        key="typing"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs text-gray-500 px-2 py-1 bg-gray-50"
      >
        {text}
      </motion.div>
    )}
  </AnimatePresence>
);
