import type { Variants } from "framer-motion"

export const ease = [0.22, 1, 0.36, 1] as const

export const viewportOnce = { once: true, amount: 0.3 }

export const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease, delay },
  },
})

export const fadeIn = (delay = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease, delay },
  },
})

export const stagger = (staggerChildren = 0.12, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})
