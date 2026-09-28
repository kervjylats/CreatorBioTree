/**
 * /dashboard/circle/messages — the creator's full messaging screen (messaging.md
 * Part 1 "Open full"): conversation list, threads, requests, privacy toggle
 * and group creation. Server wrapper over the client ChatShell.
 */
import { ChatShell } from "@/components/messages/ChatShell";

export default function MessagesPage() {
  return <ChatShell />;
}