import { AnimatePresence, motion } from "framer-motion";

export const ScrollToBottomButton = ({
  visible,
  onClick
}: {
  visible: boolean;
  onClick: () => void;
}) => (
  <AnimatePresence>
    {!visible && (
      <motion.button
        key="scroll-btn"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-2 py-0.5 rounded-full shadow-xl cursor-pointer"
        onClick={onClick}
      >
        ↓
      </motion.button>
    )}
  </AnimatePresence>
);
