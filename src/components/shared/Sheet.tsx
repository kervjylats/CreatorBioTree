/**
 * Sheet — the shared bottom-sheet/dim backdrop shell (duplication audit
 * 2026-09-29 #17: same overlay written 6× with z drifted 50/60/90).
 * Default `z-[60]` sits above the fan bottom nav (z-40) and dialogs (z-50);
 * pass `zClassName` when a sheet must stack higher (e.g. chat's contact sheet
 * over the full-screen chat at z-[70]). Each site keeps its own panel markup
 * via `panelClassName`/children — only the backdrop + click-to-close live here.
 */
interface SheetProps {
  onClose: () => void;
  /** Inner panel element classes (the site's existing panel styling). */
  panelClassName?: string;
  /** Backdrop z-index class. Default `z-[60]`. */
  zClassName?: string;
  /** Full backdrop classes — override when alignment differs (e.g. no sm:center). */
  backdropClassName?: string;
  children: React.ReactNode;
}

export function Sheet({
  onClose,
  panelClassName = "w-full max-w-md",
  zClassName = "z-[60]",
  backdropClassName = "fixed inset-0 flex items-end justify-center bg-black/50 sm:items-center",
  children,
}: SheetProps) {
  return (
    <div className={`${backdropClassName} ${zClassName}`} onClick={onClose}>
      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
