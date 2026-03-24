import { motion as Motion } from 'framer-motion';

export default function GlassCard({ children, className = '' }) {
  return (
    <Motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={`rounded-[28px] border border-white/50 bg-white/70 p-6 shadow-soft backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/65 ${className}`}
    >
      {children}
    </Motion.div>
  );
}
