/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContentItem, ContentType, PricingModel, BillingCycle, PricingTier, FileSubtype } from "@/types";
import type { PricingState } from "./PricingEditor";
import { PricingEditor } from "./PricingEditor";
import { DEFAULTS, TYPE_ICONS } from "@/types/contentTypes";
import { CoverUploader } from "./CoverUploader";
import { FileEditor } from "./FileEditor";
import { LinkEditor } from "./LinkEditor";
import { SessionEditor } from "./SessionEditor";
import { LiveEditor } from "./LiveEditor";
import { MessagingEditor } from "./MessagingEditor";
import { MembershipEditor } from "./MembershipEditor";
import { PhysicalEditor } from "./PhysicalEditor";
import { ProductEditor } from "./ProductEditor";
import { CourseEditor } from "./CourseEditor";
import { AddItemPicker } from "./AddItemPicker";
import { TipJarEditor } from "./TipJarEditor";
import { BundleEditor } from "./BundleEditor";
import { NewsletterEditor } from "./NewsletterEditor";
import { CountdownField } from "./CountdownField";
import type { CourseModule, CourseLesson } from "@/types";

function buildPricingState(item: Partial<ContentItem>): PricingState {
  const defs = DEFAULTS[item.type ?? "link"] ?? {};
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  return {
    pricingModel: (item.pricing_model as PricingModel) ?? defs.pricingModel ?? "free",
    price: item.price ?? defs.price ?? 0,
    currency: item.currency ?? "usd",
    billingCycle: (item.billing_cycle as BillingCycle) ?? defs.billingCycle ?? "monthly",
    pwywMinAmount: typeof meta.pwyw_min_amount === "number" ? meta.pwyw_min_amount : 0,
    perMinuteRate: typeof meta.per_minute_rate === "number" ? meta.per_minute_rate : 0,
    perMessageRate: typeof meta.per_message_rate === "number" ? meta.per_message_rate : 0,
    tieredPricing: Array.isArray(meta.tiered_pricing) ? meta.tiered_pricing as PricingTier[] : [],
    stockQuantity: item.stock_quantity ?? defs.stockQuantity ?? 0,
    isPhysical: item.is_physical ?? defs.isPhysical ?? false,
  };
}

export function CatalogManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/catalog");
      const json = await res.json();
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleCreate = async (type: ContentType) => {
    try {
      const res = await fetch("/api/creator/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: `New ${type}` }),
      });
      const json = await res.json();
      if (json.data) {
        setEditingId(json.data.id);
        await loadItems();
      }
    } catch {
      // non-fatal
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/creator/catalog/${id}`, { method: "DELETE" });
      setEditingId((prev) => (prev === id ? null : prev));
      await loadItems();
    } catch {
      // non-fatal
    }
  };

  const handleSave = async (id: string, patch: Record<string, unknown>) => {
    try {
      await fetch(`/api/creator/catalog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await loadItems();
    } catch {
      // non-fatal
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-400 text-center py-8">Loading catalog...</div>;
  }

  const editingItem = items.find((i) => i.id === editingId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Catalog</h2>
          <p className="text-[10px] text-gray-400">{items.length} items</p>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg"
        >
          + Add item
        </button>
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-400 mb-2">Your catalog is empty</p>
          <button
            onClick={() => setShowPicker(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
          >
            Create your first item
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const isEditing = item.id === editingId;
            return (
              <div key={item.id}>
                <button
                  onClick={() => setEditingId(isEditing ? null : item.id)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    isEditing
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-base">{TYPE_ICONS[item.type] ?? "🔗"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[9px] text-gray-400 truncate">{item.type}{item.is_published ? " · Published" : " · Draft"}</p>
                  </div>
                  {item.price > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 shrink-0">${item.price.toFixed(2)}</span>
                  )}
                  {item.access_type === "free" && (
                    <span className="text-[9px] font-medium text-green-600 shrink-0">Free</span>
                  )}
                </button>

                {/* Expanded editor panel */}
                {isEditing && (
                  <ItemEditor
                    item={item}
                    allItems={items}
                    onSave={(patch) => handleSave(item.id, patch)}
                    onDelete={() => handleDelete(item.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddItemPicker open={showPicker} onClose={() => setShowPicker(false)} onSelect={handleCreate} />
    </div>
  );
}

// ─── Inline editor panel per item ────────────────────────────────────────

function ItemEditor({
  item,
  allItems,
  onSave,
  onDelete,
}: {
  item: ContentItem;
  allItems: ContentItem[];
  onSave: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [pricing, setPricing] = useState<PricingState>(buildPricingState(item));
  const [thumbnailUrl, setThumbnailUrl] = useState(item.thumbnail_url);

  // Type-specific state
  const [subtype, setSubtype] = useState<FileSubtype | null>(item.subtype ?? null);
  const [fileUrl, setFileUrl] = useState(item.file_url ?? null);
  const [externalUrl, setExternalUrl] = useState(item.external_url ?? null);
  const [platform, setPlatform] = useState(item.platform ?? null);

  const initialMeta = item.metadata ?? {};
  const [autoResponse, setAutoResponse] = useState<string>(
    typeof initialMeta.auto_response === "string" ? initialMeta.auto_response : ""
  );
  const [benefits, setBenefits] = useState<string[]>(
    Array.isArray(initialMeta.benefits) ? initialMeta.benefits as string[] : [""]
  );
  const [variants, setVariants] = useState<string[]>(
    Array.isArray(item.variants) ? item.variants.map((v) => (typeof v === "string" ? v : (v as { label?: string }).label ?? "")) : []
  );
  const [stockQuantity, setStockQuantity] = useState(item.stock_quantity ?? 0);

  // Tip jar state
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>(
    Array.isArray(initialMeta.suggested_amounts) ? initialMeta.suggested_amounts as number[] : [5, 10, 25]
  );
  const [supportMessage, setSupportMessage] = useState<string>(
    typeof initialMeta.support_message === "string" ? initialMeta.support_message : ""
  );
  // Bundle state
  const [bundleItemIds, setBundleItemIds] = useState<string[]>(
    Array.isArray(initialMeta.item_ids) ? initialMeta.item_ids as string[] : []
  );
  // Newsletter state
  const [welcomeEmail, setWelcomeEmail] = useState<string>(
    typeof initialMeta.welcome_email === "string" ? initialMeta.welcome_email : ""
  );
  // Countdown (optional, all types)
  const [countdownEndsAt, setCountdownEndsAt] = useState<string | null>(
    typeof initialMeta.countdown_ends_at === "string" ? initialMeta.countdown_ends_at as string : null
  );

  // Course state
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [courseLessons, setCourseLessons] = useState<CourseLesson[]>([]);
  const [courseLoaded, setCourseLoaded] = useState(false);
  const [initialModules, setInitialModules] = useState<CourseModule[]>([]);
  const [initialLessons, setInitialLessons] = useState<CourseLesson[]>([]);

  useEffect(() => {
    if (item.type === "course" && !courseLoaded && item.id) {
      const loadCourse = async () => {
        try {
          const res = await fetch(`/api/creator/catalog/${item.id}/modules`);
          const json = await res.json();
          const modules: CourseModule[] = Array.isArray(json.data) ? json.data : [];
          setCourseModules(modules);
          setInitialModules(modules);

          const lres = await fetch(`/api/creator/catalog/${item.id}/lessons`);
          const ljson = await lres.json();
          const allLessons: CourseLesson[] = Array.isArray(ljson.data) ? ljson.data : [];
          setCourseLessons(allLessons);
          setInitialLessons(allLessons);

          setCourseLoaded(true);
        } catch {
          setCourseLoaded(true);
        }
      };
      loadCourse();
    }
  }, [item.id, item.type, courseLoaded]);

  const buildPatch = (): Record<string, unknown> => {
    const patch: Record<string, unknown> = { title: title.trim() || item.title, description: description || null };
    patch.thumbnail_url = thumbnailUrl || null;
    if (pricing.pricingModel !== (item.pricing_model ?? "free")) patch.pricing_model = pricing.pricingModel;
    if (pricing.price !== (item.price ?? 0)) patch.price = pricing.price;
    if (pricing.currency !== (item.currency ?? "usd")) patch.currency = pricing.currency;
    if (pricing.billingCycle !== (item.billing_cycle ?? "monthly")) patch.billing_cycle = pricing.billingCycle;
    if (pricing.isPhysical !== (item.is_physical ?? false)) patch.is_physical = pricing.isPhysical;
    if (pricing.stockQuantity !== (item.stock_quantity ?? 0)) patch.stock_quantity = pricing.stockQuantity;
    const access = pricing.pricingModel === "free" ? "free" : pricing.price > 0 ? "paid" : "free";
    if (access !== item.access_type) patch.access_type = access;
    return patch;
  };

  const buildMetadataPatch = (): Record<string, unknown> => {
    const m: Record<string, unknown> = {};
    if (pricing.pricingModel === "pwyw")        m.pwyw_min_amount = pricing.pwywMinAmount;
    if (pricing.pricingModel === "per_minute")  m.per_minute_rate = pricing.perMinuteRate;
    if (pricing.pricingModel === "per_message") m.per_message_rate = pricing.perMessageRate;
    if (pricing.pricingModel === "tiered")      m.tiered_pricing   = pricing.tieredPricing;
    if (item.type === "messaging")              m.auto_response    = autoResponse;
    if (item.type === "membership")             m.benefits         = benefits.filter((b) => b.trim() !== "");
    if (item.type === "tip_jar")                { m.suggested_amounts = suggestedAmounts; m.support_message = supportMessage; }
    if (item.type === "bundle")                 m.item_ids          = bundleItemIds;
    if (item.type === "newsletter")             m.welcome_email     = welcomeEmail;
    m.countdown_ends_at = countdownEndsAt;
    return m;
  };

  const handleSave = async () => {
    const patch = buildPatch();
    const metaPatch = buildMetadataPatch();
    if (Object.keys(metaPatch).length > 0) {
      patch.metadata = { ...(item.metadata ?? {}), ...metaPatch };
    }
    // Type-specific patches
    if (item.type === "video" || item.type === "audio" || item.type === "image" || item.type === "pdf") {
      patch.subtype = subtype;
      patch.file_url = fileUrl;
    }
    if (item.type === "link") {
      patch.external_url = externalUrl;
      patch.platform = platform;
    }
    if (item.type === "live") patch.platform = platform;
    if (item.type === "physical" || item.type === "product") {
      patch.variants = variants.filter(Boolean);
      patch.stock_quantity = stockQuantity;
    }
    onSave(patch);

    // Save course data if course type
    const createdModuleIds: Record<string, string> = {};
    if (item.type === "course") {
      // Delete removed modules
      const currentModuleIds = new Set(courseModules.map((m) => m.id));
      for (const old of initialModules) {
        if (!currentModuleIds.has(old.id)) {
          try {
            await fetch(`/api/creator/catalog/${item.id}/modules/${old.id}`, { method: "DELETE" });
          } catch {}
        }
      }
      // Delete removed lessons that still belong to an existing module
      const currentLessonIds = new Set(courseLessons.map((l) => l.id));
      for (const old of initialLessons) {
        if (!currentLessonIds.has(old.id) && currentModuleIds.has(old.module_id)) {
          try {
            await fetch(`/api/creator/catalog/${item.id}/modules/${old.module_id}/lessons/${old.id}`, { method: "DELETE" });
          } catch {}
        }
      }
      for (const mod of courseModules) {
        if (mod.id.startsWith("mock-module-")) {
          const res = await fetch(`/api/creator/catalog/${item.id}/modules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: mod.title, description: mod.description }),
          });
          const json = await res.json();
          if (json.data?.id) {
            createdModuleIds[mod.id] = json.data.id;
          }
        } else {
          await fetch(`/api/creator/catalog/${item.id}/modules/${mod.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: mod.title, description: mod.description, sort_order: mod.sort_order }),
          });
        }
      }
      for (const lesson of courseLessons) {
        const mod = courseModules.find((m) => m.id === lesson.module_id);
        if (!mod) continue;
        const resolvedModId = createdModuleIds[mod.id] ?? mod.id;
        if (lesson.id.startsWith("mock-lesson-")) {
          await fetch(`/api/creator/catalog/${item.id}/modules/${resolvedModId}/lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: lesson.title, description: lesson.description, file_url: lesson.file_url, duration_minutes: lesson.duration_minutes }),
          });
        } else {
          await fetch(`/api/creator/catalog/${item.id}/modules/${resolvedModId}/lessons/${lesson.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: lesson.title, description: lesson.description, file_url: lesson.file_url, duration_minutes: lesson.duration_minutes, sort_order: lesson.sort_order }),
          });
        }
      }
      setCourseLoaded(false); // reload course data on next open
    }
  };

  return (
    <div className="ml-4 mt-1 mb-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
      {/* Title */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      {/* Type-specific editor */}
      {(item.type === "video" || item.type === "audio" || item.type === "image" || item.type === "pdf") && (
        <FileEditor subtype={subtype} fileUrl={fileUrl} thumbnailUrl={thumbnailUrl}
          onChange={(p) => { setSubtype(p.subtype); setFileUrl(p.file_url); setThumbnailUrl(p.thumbnail_url); }} />
      )}

      {item.type === "link" && (
        <LinkEditor externalUrl={externalUrl} platform={platform} thumbnailUrl={thumbnailUrl}
          onChange={(p) => { setExternalUrl(p.external_url); setPlatform(p.platform); setThumbnailUrl(p.thumbnail_url); }} />
      )}

      {item.type === "session" && <SessionEditor price={pricing.price} onChange={(p) => setPricing({ ...pricing, ...p })} />}
      {item.type === "live" && <LiveEditor platform={platform} thumbnailUrl={thumbnailUrl}
        onChange={(p) => { setPlatform(p.platform); setThumbnailUrl(p.thumbnail_url); }} />}
      {item.type === "messaging" && <MessagingEditor autoResponse={autoResponse} onChange={(p) => setAutoResponse(p.autoResponse)} />}
      {item.type === "membership" && <MembershipEditor benefits={benefits} onChange={(p) => setBenefits(p.benefits)} />}
      {item.type === "physical" && <PhysicalEditor variants={variants} stockQuantity={stockQuantity}
        onChange={(p) => { setVariants(p.variants); setStockQuantity(p.stockQuantity); }} />}
      {item.type === "product" && <ProductEditor variants={variants} stockQuantity={stockQuantity}
        onChange={(p) => { setVariants(p.variants); setStockQuantity(p.stockQuantity); }} />}

      {item.type === "tip_jar" && (
        <TipJarEditor suggestedAmounts={suggestedAmounts} supportMessage={supportMessage}
          onChange={(p) => { setSuggestedAmounts(p.suggestedAmounts); setSupportMessage(p.supportMessage); }} />
      )}

      {item.type === "bundle" && (
        <BundleEditor selectedIds={bundleItemIds} allItems={allItems} bundlePrice={pricing.price} bundleId={item.id}
          onChange={setBundleItemIds} />
      )}

      {item.type === "newsletter" && (
        <NewsletterEditor welcomeEmail={welcomeEmail} pricingModel={pricing.pricingModel}
          onChange={(p) => setWelcomeEmail(p.welcomeEmail)} />
      )}

      {/* Cover image (for non-file types) */}
      {!["video","audio","image","pdf","link"].includes(item.type) && (
        <CoverUploader currentUrl={thumbnailUrl} onUpload={(url) => setThumbnailUrl(url || null)} />
      )}

      {/* Pricing */}
      <PricingEditor value={pricing} onChange={setPricing} itemType={item.type as ContentType} />

      {/* Countdown (optional, all types) */}
      <CountdownField value={countdownEndsAt} onChange={setCountdownEndsAt} />

      {/* Course editor */}
      {item.type === "course" && (
        <CourseEditor
          courseId={item.id}
          modules={courseModules}
          lessons={courseLessons}
          onChange={(m, l) => { setCourseModules(m); setCourseLessons(l); }}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded-lg"
        >
          Save
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
