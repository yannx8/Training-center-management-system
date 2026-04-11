/**
 * cn() — minimal className joiner
 * Filters falsy values and joins with a space.
 * Compatible with the shadcn/ui import path (@/lib/utils).
 *
 * Usage:
 *   cn('card', 'p-4')              → 'card p-4'
 *   cn('btn', isActive && 'active') → 'btn active'  (or 'btn' if falsy)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
