/** TODO: Add purpose docstring. */
const ALLOWED_FIELDS = new Set([
  "display_name",
  "bio",
  "username",
  "tags",
  "theme_id",
  "metadata",
  "avatar_url",
  "banner_url",
  "custom_theme",
  "social_links",
  "social_screenshots",
  "push_notifications_enabled",
  "is_discoverable",
]);

export async function profileUpdateService(
  supabase: { from: (t: string) => any },
  userId: string,
  fields: Record<string, unknown>,
) {
  const safeFields: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.has(key)) {
      safeFields[key] = value;
    }
  }

  safeFields.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("creators")
    .update(safeFields)
    .eq("id", userId);
  if (error) throw error;
}
