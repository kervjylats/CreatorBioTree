/**
 * Spinner — the shared `<Loader2 animate-spin>` indicator (written 14× across
 * 10 files — duplication audit 2026-09-29 trivial sweep). Neutral muted color
 * by default; pass `className` to recolor per surface.
 */
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 16, className = "" }: SpinnerProps) {
  return <Loader2 size={size} className={`animate-spin text-muted-foreground ${className}`} />;
}
