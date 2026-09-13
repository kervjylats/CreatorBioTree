/**
 * AuditLog — platform audit log viewer (admin.md Part 3).
 * Placeholder until the admin_activity_log table is populated in mock.
 */
export function AuditLog() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Audit log will record all admin actions.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Actions like account changes, creator edits, and API key generation
        will appear here once the activity log is populated.
      </p>
    </div>
  );
}
