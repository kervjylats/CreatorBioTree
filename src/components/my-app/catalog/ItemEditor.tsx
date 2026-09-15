/**
 * ItemEditor — generic editor for ALL 16 catalog item types (my-app.md Part
 * 2c; the 9 deferred types landed 2026-08-13): title/description, per-type
 * fields (URL, file, course lessons, session slots, membership benefits,
 * bundle contents, physical/product variants + stock, live stream, page body),
 * PricingEditor, publishing + scheduling. Every change emits `patch`; Save
 * persists via PATCH /api/creator/catalog/[itemId] in CatalogTab.
 */
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ContentItem, BookingSlot } from "@/types";
import { TYPE_ICONS } from "@/types/contentTypes";
import { PricingEditor } from "./PricingEditor";
import { FileUploadField } from "./FileUploadField";

interface ItemEditorProps {
  item: ContentItem;
  /** The creator's other catalog items — needed by the bundle picker. */
  catalogItems?: ContentItem[];
  onSave: (item: ContentItem) => Promise<void>;
  onClose: () => void;
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LESSON_TYPES = ["video", "pdf", "audio"] as const;

const LIVE_PLATFORMS = ["YouTube", "Twitch", "TikTok Live", "Kick", "Other"];

const inputClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";

export function ItemEditor({ item, catalogItems, onSave, onClose }: ItemEditorProps) {
  const [draft, setDraft] = useState<ContentItem>(() => ({ ...item, metadata: { ...item.metadata } }));
  const [saving, setSaving] = useState(false);

  const patch = (partial: Partial<ContentItem>) => setDraft((prev) => ({ ...prev, ...partial }));

  const patchMetadata = (key: string, value: unknown) =>
    setDraft((prev) => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }));

  const lessons = (draft.metadata.lessons as ContentItem["metadata"]["lessons"]) ?? [];
  const benefits = (draft.metadata.benefits as string[] | undefined) ?? [];
  const includedIds = (draft.metadata.item_ids as string[] | undefined) ?? [];
  const slots = draft.booking_slots ?? [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-tl="ItemEditor" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Edit {item.type}</h3>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.is_published}
              onChange={(e) => patch({ is_published: e.target.checked })}
            />
            Published
          </label>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Title</label>
            <input
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</label>
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {item.type === "link" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destination URL</label>
              <input
                type="url"
                value={draft.external_url ?? ""}
                onChange={(e) => patch({ external_url: e.target.value })}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          {item.type === "video" && (
            <>
              <FileUploadField kind="video" label="Video file" value={draft.file_url} onChange={(url) => patch({ file_url: url })} />
              <FileUploadField kind="image" label="Cover image" value={draft.cover_image_url} onChange={(url) => patch({ cover_image_url: url })} />
            </>
          )}

          {item.type === "image" && (
            <>
              <FileUploadField kind="image" label="Image file" value={draft.file_url} onChange={(url) => patch({ file_url: url })} />
              <FileUploadField kind="image" label="Cover image" value={draft.cover_image_url} onChange={(url) => patch({ cover_image_url: url })} />
            </>
          )}

          {item.type === "audio" && (
            <>
              <FileUploadField kind="audio" label="Audio file" value={draft.file_url} onChange={(url) => patch({ file_url: url })} />
              <FileUploadField kind="image" label="Cover image" value={draft.cover_image_url} onChange={(url) => patch({ cover_image_url: url })} />
            </>
          )}

          {item.type === "pdf" && (
            <>
              <FileUploadField kind="pdf" label="PDF file" value={draft.file_url} onChange={(url) => patch({ file_url: url })} />
              <FileUploadField kind="image" label="Cover image" value={draft.cover_image_url} onChange={(url) => patch({ cover_image_url: url })} />
            </>
          )}

          {item.type === "product" && (
            <FileUploadField kind="image" label="Cover image" value={draft.cover_image_url} onChange={(url) => patch({ cover_image_url: url })} />
          )}

          {/* Page — rich text body (rendered on the fan card) */}
          {item.type === "page" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Page content</label>
              <textarea
                value={(draft.metadata.body as string) ?? ""}
                onChange={(e) => patchMetadata("body", e.target.value)}
                rows={8}
                placeholder="Write your page…"
                className={inputClass}
              />
            </div>
          )}

          {/* Course — multi-module lessons */}
          {item.type === "course" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Lessons ({lessons.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    patchMetadata("lessons", [
                      ...lessons,
                      { id: crypto.randomUUID(), title: "New lesson", type: "video", url: "" },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-caption font-semibold text-foreground"
                >
                  <Plus size={12} /> Add lesson
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="rounded-xl border border-input bg-background p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={lesson.title}
                        onChange={(e) =>
                          patchMetadata(
                            "lessons",
                            lessons.map((l, i) => (i === idx ? { ...l, title: e.target.value } : l)),
                          )
                        }
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm"
                      />
                      <select
                        value={lesson.type}
                        onChange={(e) =>
                          patchMetadata(
                            "lessons",
                            lessons.map((l, i) => (i === idx ? { ...l, type: e.target.value as (typeof LESSON_TYPES)[number] } : l)),
                          )
                        }
                        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                      >
                        {LESSON_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label="Remove lesson"
                        onClick={() => patchMetadata("lessons", lessons.filter((_, i) => i !== idx))}
                        className="rounded-full p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="mt-1.5">
                      <FileUploadField
                        kind={lesson.type}
                        label=""
                        value={lesson.url}
                        onChange={(url) =>
                          patchMetadata(
                            "lessons",
                            lessons.map((l, i) => (i === idx ? { ...l, url } : l)),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session — 1:1 booking slots */}
          {item.type === "session" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Booking slots ({slots.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    patch({ booking_slots: [...slots, { day: 1, start: "10:00", end: "10:30", duration: 30, max_bookings: 1 }] })
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-caption font-semibold text-foreground"
                >
                  <Plus size={12} /> Add slot
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {slots.map((slot, idx) => (
                  <div key={idx} className="rounded-xl border border-input bg-background p-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={slot.day}
                        onChange={(e) =>
                          patch({
                            booking_slots: slots.map((s, i) => (i === idx ? { ...s, day: Number(e.target.value) } : s)),
                          })
                        }
                        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                      >
                        {DAY_LABELS.map((label, d) => (
                          <option key={d} value={d}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            patch({
                              booking_slots: slots.map((s, i) => (i === idx ? { ...s, start: e.target.value } : s)),
                            })
                          }
                          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">→</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            patch({
                              booking_slots: slots.map((s, i) => (i === idx ? { ...s, end: e.target.value } : s)),
                            })
                          }
                          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-micro font-semibold uppercase text-muted-foreground">Minutes</label>
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={slot.duration}
                          onChange={(e) =>
                            patch({
                              booking_slots: slots.map((s, i) =>
                                i === idx ? { ...s, duration: Math.max(5, Number(e.target.value)) } : s,
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-micro font-semibold uppercase text-muted-foreground">Max bookings</label>
                        <input
                          type="number"
                          min={1}
                          value={slot.max_bookings}
                          onChange={(e) =>
                            patch({
                              booking_slots: slots.map((s, i) =>
                                i === idx ? { ...s, max_bookings: Math.max(1, Number(e.target.value)) } : s,
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => patch({ booking_slots: slots.filter((_, i) => i !== idx) })}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-caption font-semibold text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={12} /> Remove slot
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membership — benefits list */}
          {item.type === "membership" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Benefits (one per line)
              </label>
              <textarea
                value={benefits.join("\n")}
                onChange={(e) => patchMetadata("benefits", e.target.value.split("\n").map((b) => b.trim()).filter(Boolean))}
                rows={4}
                placeholder={"Exclusive posts\nMonthly Q&A call\nEarly access"}
                className={inputClass}
              />
            </div>
          )}

          {/* Physical + product — variants + stock */}
          {(item.type === "physical" || item.type === "product") && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Variants (name: option1, option2)
                </label>
                <div className="mt-1 flex flex-col gap-2">
                  {(draft.variants ?? []).map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={variant.name}
                        onChange={(e) =>
                          patch({
                            variants: (draft.variants ?? []).map((v, i) => (i === idx ? { ...v, name: e.target.value } : v)),
                          })
                        }
                        placeholder="Size"
                        className="w-24 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs"
                      />
                      <input
                        value={variant.options.join(", ")}
                        onChange={(e) =>
                          patch({
                            variants: (draft.variants ?? []).map((v, i) =>
                              i === idx ? { ...v, options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) } : v,
                            ),
                          })
                        }
                        placeholder="S, M, L"
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        aria-label="Remove variant"
                        onClick={() => patch({ variants: (draft.variants ?? []).filter((_, i) => i !== idx) })}
                        className="rounded-full p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => patch({ variants: [...(draft.variants ?? []), { name: "Option", options: [] }] })}
                    className="inline-flex items-center gap-1 self-start rounded-full border border-input px-2.5 py-1 text-caption font-semibold text-foreground"
                  >
                    <Plus size={12} /> Add variant
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Stock quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.stock_quantity ?? 0}
                    onChange={(e) => patch({ stock_quantity: Math.max(0, Number(e.target.value)) })}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.is_physical)}
                      onChange={(e) => patch({ is_physical: e.target.checked })}
                    />
                    Physical item (shipping)
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Bundle — pick items to include */}
          {item.type === "bundle" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Included items ({includedIds.length})
              </label>
              <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto">
                {(catalogItems ?? []).map((cand) =>
                  cand.id === item.id ? null : (
                    <label
                      key={cand.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${
                        includedIds.includes(cand.id) ? "border-foreground bg-accent/20" : "border-input"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includedIds.includes(cand.id)}
                        onChange={(e) =>
                          patchMetadata(
                            "item_ids",
                            e.target.checked
                              ? [...includedIds, cand.id]
                              : includedIds.filter((id) => id !== cand.id),
                          )
                        }
                      />
                      <span className="truncate text-foreground">
                        {TYPE_ICONS[cand.type]} {cand.title}
                      </span>
                    </label>
                  ),
                )}
                {(catalogItems ?? []).length <= 1 && (
                  <p className="rounded-lg border border-dashed border-input p-3 text-center text-xs text-muted-foreground">
                    Add other items to your catalog first, then bundle them here.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Live — stream link + platform */}
          {item.type === "live" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Stream platform</label>
                <select
                  value={draft.platform ?? "YouTube"}
                  onChange={(e) => patch({ platform: e.target.value })}
                  className={inputClass}
                >
                  {LIVE_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Stream link</label>
                <input
                  type="url"
                  value={draft.external_url ?? ""}
                  onChange={(e) => patch({ external_url: e.target.value })}
                  placeholder="https://youtube.com/live/…"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {item.type === "tip_jar" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Suggested amounts (comma-separated)
                </label>
                <input
                  value={((draft.metadata.suggested_amounts as number[]) ?? []).join(", ")}
                  onChange={(e) =>
                    patchMetadata(
                      "suggested_amounts",
                      e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => n > 0),
                    )
                  }
                  placeholder="5, 10, 25"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Support message</label>
                <input
                  value={(draft.metadata.support_message as string) ?? ""}
                  onChange={(e) => patchMetadata("support_message", e.target.value)}
                  placeholder="Fuel the channel — every tip counts"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {item.type === "newsletter" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Welcome message</label>
              <input
                value={(draft.metadata.welcome_email as string) ?? ""}
                onChange={(e) => patchMetadata("welcome_email", e.target.value)}
                placeholder="Thanks for subscribing!"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          {item.type === "messaging" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Auto-reply</label>
              <input
                value={(draft.metadata.auto_response as string) ?? ""}
                onChange={(e) => patchMetadata("auto_response", e.target.value)}
                placeholder="Hi! I reply within a day — chat arrives post-launch."
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          )}

          <PricingEditor item={draft} patch={patch} />

          {/* Scheduling (my-app.md — link scheduling) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Publish at (optional)</label>
              <input
                type="datetime-local"
                value={draft.scheduled_publish_at ? draft.scheduled_publish_at.slice(0, 16) : ""}
                onChange={(e) => patch({ scheduled_publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Unpublish at (optional)</label>
              <input
                type="datetime-local"
                value={draft.scheduled_unpublish_at ? draft.scheduled_unpublish_at.slice(0, 16) : ""}
                onChange={(e) =>
                  patch({ scheduled_unpublish_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-input py-2.5 text-sm font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !draft.title.trim()}
            onClick={handleSave}
            className="flex-1 rounded-full bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save item"}
          </button>
        </div>
      </div>
    </div>
  );
}