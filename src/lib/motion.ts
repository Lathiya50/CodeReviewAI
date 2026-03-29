import type { Variants, Transition } from "framer-motion";

// ─── Default transitions ────────────────────────────────────────────────────
export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1],
};

// ─── Common variants ────────────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: smoothTransition },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: smoothTransition },
};

// ─── Stagger container ──────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

// ─── Page transition ────────────────────────────────────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Card hover props ───────────────────────────────────────────────────────
export const cardHover = {
  whileHover: { y: -2, transition: { duration: 0.2 } },
  whileTap: { scale: 0.99 },
};

// ─── Button press props ─────────────────────────────────────────────────────
export const buttonPress = {
  whileTap: { scale: 0.97 },
};
