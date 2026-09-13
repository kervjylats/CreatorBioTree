/** type: component — Animated loading spinner, optional full-screen mode. */
"use client";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ fullScreen = false, className = "" }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin ${className}`} />
  );
  if (fullScreen) {
    return <div className="flex h-screen items-center justify-center">{spinner}</div>;
  }
  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}
