/**
 * cn — the universal class combiner. Merges conditional Tailwind classes
 * (clsx) and resolves conflicts so the LAST conflicting utility wins
 * (tailwind-merge, e.g. "px-2 px-4" → only px-4 survives).
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
