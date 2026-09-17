/**
 * ChatShell.tsx — the complete messaging engine (messaging.md Parts 1/2/4):
 * useChat polling hook, the floating ChatInboxPopover,
 * the full ChatShell screen (list + requests + privacy toggle + groups),
 * ChatThread (1-on-1 + groups with announcements mode), MessageList /
 * MessageBubble / MessageComposer / AttachmentPreview, the per-name ChatIcon
 * quick-chat and the GuestContactModal (email capture → Follower → message,
 * fan-shell.md Layer 1b). ONE file per founder request; neutral platform
 * styling — the inbox never takes a creator's theme (branding.md Part 3).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Shared types + fetch helper ─────────────────────────────────────────────

export interface ChatConversation {
  id: string;
  type: "direct" | "group";
  title: string;
  otherKey: string | null;
  otherParty: "creator" | "fan" | null;
  lastMessage: { body: string; created_at: string; deleted: boolean; sender_key: string } | null;
  unread: number;
  muted: boolean;
  pinned: boolean;
  announcementsOnly: boolean;
  myRole: string;
  memberCount: number;
  updatedAt: string;
}

export interface ChatAttachment {
  url: string;
  name: string;
  mime: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  sender_key: string;
  sender_name: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments: ChatAttachment[];
}

export interface ThreadData {
  myKey: string;
  myRole: string;
  conversation: { id: string; type: string; title: string; pinned: boolean; announcementsOnly: boolean; muted: boolean };
  members: { key: string; party: string; role: string; name: string; left: boolean }[];
  messages: ChatMessage[];
}

async function chatApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json?.error === "string" ? json.error : "Request failed");
  return json as T;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string): string {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Polling interval — 30s in mock mode; Supabase Realtime replaces this in prod (messaging.md Part 6). */
const POLL_MS = 30_000;

/** Conversation list + unread total, polling every 30s (mock; realtime in prod — messaging.md Part 6). */
export function useChat(): {
  conversations: ChatConversation[];
  unread: number;
  myParty: "creator" | "fan" | null;
  loading: boolean;
  refresh: () => void;
} {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unread, setUnread] = useState(0);
  const [myParty, setMyParty] = useState<"creator" | "fan" | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [list, unreadRes] = await Promise.all([
        chatApi<{ conversations: ChatConversation[]; myParty: "creator" | "fan" }>("/api/chat/conversations"),
        chatApi<{ unread: number }>("/api/chat/unread"),
      ]);
      setConversations(list.conversations);
      setMyParty(list.myParty);
      setUnread(unreadRes.unread);
    } catch {
      // No identity / transient error — keep the last good state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    const onVis = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [refresh]);

  return { conversations, unread, myParty, loading, refresh };
}

// ─── Conversation list row ───────────────────────────────────────────────────

function ConversationRow({ convo, onClick }: { convo: ChatConversation; onClick: () => void }) {
  const preview = convo.lastMessage
    ? convo.lastMessage.deleted
      ? "Message deleted"
      : convo.lastMessage.body
    : convo.type === "group"
      ? `${convo.memberCount} members`
      : "Start the conversation";
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-bold text-foreground">
        {initials(convo.title)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{convo.title}</span>
          {convo.lastMessage && <span className="shrink-0 text-caption text-muted-foreground">{timeAgo(convo.lastMessage.created_at)}</span>}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">{preview}</span>
          {convo.unread > 0 && (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-micro font-bold text-white">
              {convo.unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

// ─── Floating inbox (Part 1) ─────────────────────────────────────────────────

interface ChatInboxPopoverProps {
  /** Custom "Open full" target. Default: dashboard navigates to /dashboard/messages; elsewhere the full screen expands in place. */
  onOpenFull?: () => void;
}

/** The 💬 floating inbox — bottom-right on every dashboard/fan screen, WhatsApp-style popover + badge. */
export function ChatInboxPopover({ onOpenFull }: ChatInboxPopoverProps) {
  const { conversations, unread, refresh } = useChat();
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleOpenFull = (conversationId?: string) => {
    setOpen(false);
    setSelectedId(conversationId ?? null);
    if (onOpenFull) {
      onOpenFull();
    } else if (pathname?.startsWith("/dashboard")) {
      router.push(conversationId ? `/dashboard/messages?c=${conversationId}` : "/dashboard/messages");
    } else {
      setFull(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
        <button
          type="button"
          aria-label="Messages"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) void refresh();
          }}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle size={22} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-caption font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute bottom-14 right-0 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <span className="text-sm font-bold text-foreground">Messages</span>
              <button type="button" onClick={() => handleOpenFull()} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                Open full
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No conversations yet</p>
              ) : (
                conversations.map((c) => (
                  <ConversationRow key={c.id} convo={c} onClick={() => handleOpenFull(c.id)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {full && <ChatShell initialConversationId={selectedId} onClose={() => setFull(false)} />}
    </>
  );
}

// ─── Full messaging screen (the "Open full" destination) ─────────────────────

interface ChatShellProps {
  onClose?: () => void;
  initialConversationId?: string | null;
}

/** The complete messaging screen — conversation list, thread, requests, privacy toggle, new group (Part 1 "Open full"). */
export function ChatShell({ onClose, initialConversationId }: ChatShellProps) {
  const { conversations, myParty, refresh } = useChat();
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(initialConversationId ?? null);
  const [requests, setRequests] = useState<{ id: string; from_name: string; body: string | null }[]>([]);
  const [allowAnyone, setAllowAnyone] = useState<boolean | null>(null);

  const close = () => (onClose ? onClose() : router.push("/dashboard"));

  useEffect(() => {
    void (async () => {
      try {
        const r = await chatApi<{ requests: { id: string; from_name: string; body: string | null }[] }>("/api/chat/requests");
        setRequests(r.requests);
        const prefs = await chatApi<{ allow_messages_from_anyone: boolean }>("/api/chat/preferences");
        setAllowAnyone(prefs.allow_messages_from_anyone);
      } catch {
        // no identity — list shows empty
      }
    })();
  }, []);

  const handleRequest = async (requestId: string, action: "approve" | "ignore") => {
    try {
      const res = await chatApi<{ status: string; conversation_id?: string }>("/api/chat/requests", {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, action }),
      });
      setRequests((rs) => rs.filter((r) => r.id !== requestId));
      if (res.status === "approved" && res.conversation_id) {
        toast("Request approved — conversation opened");
        setThreadId(res.conversation_id);
      } else {
        toast(action === "approve" ? "Conversation opened" : "Request ignored");
      }
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't handle request");
    }
  };

  const toggleAllowAnyone = async (next: boolean) => {
    setAllowAnyone(next);
    try {
      await chatApi("/api/chat/preferences", {
        method: "PATCH",
        body: JSON.stringify({ allow_messages_from_anyone: next }),
      });
    } catch {
      setAllowAnyone(null);
      toast.error("Couldn't save the setting");
    }
  };

  const createGroup = async () => {
    const title = window.prompt("Group chat name");
    if (!title?.trim()) return;
    try {
      const res = await chatApi<{ conversation_id: string }>("/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ type: "group", title: title.trim() }),
      });
      toast("Group created — add members from the thread");
      setThreadId(res.conversation_id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create group");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Close" onClick={close} className="rounded-full p-1.5 hover:bg-accent">
            <X size={18} className="text-foreground" />
          </button>
          <h2 className="text-base font-bold text-foreground">Messages</h2>
        </div>
        <div className="flex items-center gap-1">
          {myParty === "creator" && (
            <button
              type="button"
              onClick={() => void createGroup()}
              className="inline-flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              <Plus size={12} /> Group
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-input px-2.5 py-1 text-xs font-semibold text-foreground">
            <ShieldCheck size={12} />
            <input
              type="checkbox"
              className="accent-foreground"
              checked={allowAnyone ?? true}
              disabled={allowAnyone === null}
              onChange={(e) => void toggleAllowAnyone(e.target.checked)}
            />
            Allow anyone
          </label>
        </div>
      </div>

      {threadId ? (
        <ChatThread conversationId={threadId} onBack={() => setThreadId(null)} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Requests folder */}
          {requests.length > 0 && (
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Requests</p>
              <div className="mt-2 flex flex-col gap-2">
                {requests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-semibold text-foreground">{r.from_name}</p>
                    {r.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.body}</p>}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRequest(r.id, "approve")}
                        className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRequest(r.id, "ignore")}
                        className="rounded-full border border-input px-3 py-1 text-xs font-semibold text-muted-foreground"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <MessageCircle size={36} className="text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="max-w-xs text-xs text-muted-foreground/70">
                Message buttons across the app — catalog items, fan pages, network — open chats here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {conversations.map((c) => (
                <ConversationRow key={c.id} convo={c} onClick={() => setThreadId(c.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Thread ──────────────────────────────────────────────────────────────────

interface ChatThreadProps {
  conversationId: string;
  onBack: () => void;
  onOpenFull?: () => void;
  /** Compact mode for the quick-chat popover. */
  compact?: boolean;
  accentColor?: string;
}

/** Full conversation view: header + MessageList + MessageComposer, polling every 6s. */
export function ChatThread({ conversationId, onBack, onOpenFull, compact, accentColor }: ChatThreadProps) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const thread = await chatApi<ThreadData>(`/api/chat/conversations/${conversationId}/messages`);
      setData(thread);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load conversation");
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    const onVis = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  // Mark read whenever new messages arrive.
  useEffect(() => {
    if (!data) return;
    void chatApi(`/api/chat/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
  }, [data?.messages.length, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [data?.messages.length]);

  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button type="button" onClick={onBack} className="text-sm font-semibold text-foreground">
          Back to conversations
        </button>
      </div>
    );
  }

  const title = data?.conversation.title ?? "…";
  const isGroup = data?.conversation.type === "group";

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${compact ? "" : "h-full"}`}>
      {/* Thread header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button type="button" aria-label="Back" onClick={onBack} className="rounded-full p-1.5 hover:bg-accent">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-xs font-bold text-foreground">
          {initials(title)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
          {isGroup && data && (
            <p className="text-caption text-muted-foreground">
              {data.members.filter((m) => !m.left).length} members
              {data.conversation.announcementsOnly ? " · only the host posts" : ""}
            </p>
          )}
        </div>
        {onOpenFull && (
          <button type="button" onClick={onOpenFull} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
            Open full
          </button>
        )}
      </div>

      <MessageList
        messages={data?.messages ?? []}
        myKey={data?.myKey ?? ""}
        isGroup={isGroup}
        accentColor={accentColor}
      />

      <MessageComposer
        conversationId={conversationId}
        onSent={() => void load()}
        readOnly={Boolean(data?.conversation.announcementsOnly && data.myRole !== "owner")}
      />
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Message list / bubble / attachments ─────────────────────────────────────

function MessageList({
  messages,
  myKey,
  isGroup,
  accentColor,
}: {
  messages: ChatMessage[];
  myKey: string;
  isGroup: boolean;
  accentColor?: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-center text-sm text-muted-foreground">Say hi — start the conversation.</p>
      </div>
    );
  }
  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} mine={m.sender_key === myKey} showSender={isGroup} accentColor={accentColor} />
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  showSender,
  accentColor,
}: {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  accentColor?: string;
}) {
  const deleted = Boolean(message.deleted_at);
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      {showSender && !mine && !deleted && (
        <span className="mb-0.5 px-1 text-micro font-bold" style={{ color: accentColor ?? undefined }}>
          {message.sender_name}
        </span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          mine ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md bg-muted text-foreground"
        }`}
      >
        {deleted ? (
          <span className="italic opacity-60">Message deleted</span>
        ) : (
          <>
            {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
            {message.attachments.map((a) => (
              <AttachmentPreview key={a.url} attachment={a} />
            ))}
            {message.edited_at && (
              <span className="mt-0.5 block text-right text-micro opacity-50">edited</span>
            )}
          </>
        )}
      </div>
      <span className="px-1 pt-0.5 text-micro text-muted-foreground">{timeAgo(message.created_at)}</span>
    </div>
  );
}

/** Inline image preview or download card (messaging.md Part 4 files). */
export function AttachmentPreview({ attachment }: { attachment: ChatAttachment }) {
  const isImage = attachment.mime.startsWith("image/");
  if (isImage) {
    return (
      <button type="button" onClick={() => window.open(attachment.url, "_blank", "noopener")} className="mt-1.5 block overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={attachment.name} className="max-h-48 w-full object-cover" />
      </button>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex items-center gap-2 rounded-lg bg-black/10 px-2.5 py-2 text-xs font-semibold"
    >
      {attachment.mime.startsWith("video/") ? <ImageIcon size={14} /> : <Download size={14} />}
      <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
      {attachment.size > 0 && <span className="opacity-60">{Math.max(1, Math.round(attachment.size / 1024))} KB</span>}
    </a>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────

function MessageComposer({
  conversationId,
  onSent,
  readOnly,
}: {
  conversationId: string;
  onSent: () => void;
  readOnly: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const send = async (body?: string, attachment?: ChatAttachment) => {
    if ((!body || !body.trim()) && !attachment) return;
    setSending(true);
    try {
      await chatApi(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: (body ?? "").trim(), attachment: attachment ?? null }),
      });
      setText("");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send message");
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8_000_000) {
      toast.error("Max 8MB per file");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const uploaded = await chatApi<ChatAttachment>("/api/chat/upload", {
        method: "POST",
        body: JSON.stringify({ dataUrl, name: file.name }),
      });
      await send(undefined, uploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload file");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (readOnly) {
    return (
      <div className="border-t border-border px-3 py-2.5 text-center text-xs text-muted-foreground">
        Only the host can post in this chat
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 border-t border-border px-3 py-2.5">
      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        aria-label="Attach file"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="rounded-full p-2 text-muted-foreground hover:bg-accent disabled:opacity-40"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>
      <textarea
        rows={1}
        value={text}
        placeholder="Message…"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send(text);
          }
        }}
        className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
      />
      <button
        type="button"
        aria-label="Send"
        disabled={sending || !text.trim()}
        onClick={() => void send(text)}
        className="rounded-full bg-foreground p-2.5 text-background disabled:opacity-40"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </div>
  );
}

// ─── Quick chat icon (Part 2 entry points) ───────────────────────────────────

interface ChatIconProps {
  otherKey: string;
  otherParty: "creator" | "fan";
  name: string;
  accentColor?: string;
  /** Small email-capture contact variant for guests (no chat identity yet). */
  guest?: boolean;
  onGuestContact?: () => void;
}

/** The per-name chat icon — tap for a quick mini thread; "Open full" expands to the full screen. */
export function ChatIcon({ otherKey, otherParty, name, accentColor, guest, onGuestContact }: ChatIconProps) {
  const [open, setOpen] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [starting, setStarting] = useState(false);

  const start = async () => {
    if (guest) {
      onGuestContact?.();
      return;
    }
    setStarting(true);
    try {
      const res = await chatApi<{ conversation_id: string; status: string }>("/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ type: "direct", other_key: otherKey, other_party: otherParty }),
      });
      if (res.status === "requested") setRequested(true);
      else setConvoId(res.conversation_id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start a chat");
    } finally {
      setStarting(false);
    }
  };

  const toggle = () => {
    setOpen((v) => !v);
    if (!open && convoId === null && !requested) void start();
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Message ${name}`}
        onClick={toggle}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/40 transition-colors hover:bg-accent"
        style={{ color: accentColor ?? undefined }}
      >
        <MessageCircle size={17} />
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-md rounded-t-2xl border border-border bg-card shadow-2xl sm:bottom-4 sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-sm font-bold text-foreground">{name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (window.location.pathname.startsWith("/dashboard")) {
                    window.location.href = "/dashboard/messages";
                  } else {
                    onGuestContact?.();
                  }
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Open full
              </button>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-accent">
                <X size={16} className="text-foreground" />
              </button>
            </div>
          </div>
          <div className="h-96">
            {requested ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <ShieldCheck size={28} className="text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground">Request sent</p>
                <p className="text-xs text-muted-foreground">They&apos;ll see it in their Requests folder and can approve it.</p>
              </div>
            ) : convoId ? (
              <ChatThread conversationId={convoId} onBack={() => setOpen(false)} accentColor={accentColor} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Guest contact modal (guest → creator, email capture) ────────────────────

interface GuestContactModalProps {
  creatorId: string;
  creatorUsername: string;
  displayName: string;
  onClose: () => void;
}

/** Guest "Contact" — email capture creates a Follower + fan_session, then the first message opens a chat (fan-shell.md Layer 1b). */
export function GuestContactModal({ creatorId, creatorUsername, displayName, onClose }: GuestContactModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const follow = await chatApi<{ followed: boolean }>("/api/fan/follow-creator", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), creator_username: creatorUsername }),
      });
      if (!follow.followed) throw new Error("Couldn't connect");
      const res = await chatApi<{ status: string }>("/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "direct",
          other_key: creatorId,
          other_party: "creator",
          first_message: message.trim() || "Hi!",
        }),
      });
      toast(res.status === "requested" ? "Message sent — they'll approve it shortly." : "Message sent!");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the message");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground">Contact {displayName}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Your email stays private — it&apos;s how they reply.</p>
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
          />
          <textarea
            rows={4}
            placeholder="Message… (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-input py-2.5 text-sm font-semibold text-foreground">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex-1 rounded-full bg-foreground py-2.5 text-sm font-semibold text-background disabled:opacity-40">
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatShell;