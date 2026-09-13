/** type: component — Empty state placeholder with icon, message, and optional action button. */
"use client";

interface EmptyStateProps {
  icon?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "📭", message = "Nothing here yet.", action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
