/** type: lib — Query building helpers and constants for creator search. */

export const CREATOR_SEARCH_FIELDS = "id, username, display_name, avatar_url, tags, is_featured";

export function buildSearchFilter(query: string): string | null {
  if (!query) return null;
  return `display_name.ilike.%${query}%,username.ilike.%${query}%`;
}

export function filterCreators(
  creators: Array<{ display_name?: string | null; username: string }>,
  query: string,
) {
  const q = query.toLowerCase().trim();
  if (!q) return creators;
  return creators.filter(
    (c) =>
      (c.display_name || "").toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q),
  );
}
