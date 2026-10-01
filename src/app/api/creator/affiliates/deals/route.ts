/**
 * GET/POST /api/creator/affiliates/deals — list affiliate deals where the
 * authenticated creator is owner or promoter (each row flagged `is_owner`),
 * and create new deals (network.md §7, monetization/creators.md Part 2).
 * `owner_id` is optional on create and defaults to the session user.
 * Deals are immutable after creation; status updates go through PATCH
 * /deals/[id].
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, handleAuthError } from "@/lib/requireAuth";

const createDealSchema = z.object({
  owner_id: z.string().min(1).optional(),
  promoter_id: z.string().min(1),
  scope: z.enum(["item", "creator"]),
  item_id: z.string().min(1).optional(),
  deal_type: z.enum(["percentage", "fixed", "free", "tiered", "custom"]),
  trigger: z.enum(["purchase", "follow", "subscribe", "tip", "signup", "any"]),
  rate: z.number().min(0).optional(),
  custom_terms: z.string().max(2000).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

export async function GET() {
  try {
    const { user, supabase } = await requireAuth();

    const { data: owned } = await supabase
      .from("affiliate_deals")
      .select("*")
      .eq("owner_id", user.id);

    const { data: promoted } = await supabase
      .from("affiliate_deals")
      .select("*")
      .eq("promoter_id", user.id)
      .neq("owner_id", user.id);

    const deals = [...(owned ?? []), ...(promoted ?? [])].map((d) => ({
      ...d,
      is_owner: d.owner_id === user.id,
    }));
    deals.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    return NextResponse.json({ deals });
  } catch (err) {
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to load deals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuth();
    const body = await req.json();
    const validation = createDealSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid deal data", details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;
    const ownerId = data.owner_id || user.id;
    if (data.scope === "item" && !data.item_id) {
      return NextResponse.json({ error: "item_id is required for per-item deals" }, { status: 400 });
    }
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "You can only create deals where you are the owner" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const { data: deal, error } = await supabase
      .from("affiliate_deals")
      .insert({
        ...data,
        owner_id: ownerId,
        status: "active",
        created_at: now,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[affiliates/deals] insert failed:", error);
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
    }
    return NextResponse.json({ deal }, { status: 201 });
  } catch (err) {
    console.error("[affiliates/deals] POST:", err);
    return handleAuthError(err) ?? NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
