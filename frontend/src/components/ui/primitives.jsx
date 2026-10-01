/**
 * Shared UI components — shadcn-inspired primitives with Tailwind + Lucide.
 * These provide consistent styling across all pages without needing
 * the full shadcn/ui install (which requires Next.js).
 */
import { clsx } from 'clsx';

/* ─────────── Card ─────────── */
export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('px-5 py-4 border-b border-slate-700/50', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-slate-200 flex items-center gap-2', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={clsx('px-5 py-4', className)}>{children}</div>
  );
}

/* ─────────── Badge ─────────── */
export function Badge({ children, variant = 'default', className, ...props }) {
  const variants = {
    default: 'bg-slate-700/60 text-slate-300 border-slate-600',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    info: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/* ─────────── Button ─────────── */
export function Button({ children, variant = 'primary', size = 'md', className, ...props }) {
  const variants = {
    primary: 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={clsx(
        'rounded-lg font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─────────── Separator ─────────── */
export function Separator({ className }) {
  return <div className={clsx('h-px bg-slate-700/50 my-4', className)} />;
}

/* ─────────── Skeleton Loader ─────────── */
export function Skeleton({ className }) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-slate-700/50', className)} />
  );
}
