/**
 * zod-helpers.ts — shared Zod bits for API routes (duplication audit 2026-09-29 #14/#15).
 * `idSchema` replaces the `USE_MOCKS ? z.string().min(1) : z.string().uuid()`
 * line written 4× (mock ids like `mock-test-creator` aren't UUIDs); routes
 * return `{ error: "Invalid request" }` for EVERY schema failure — no route
 * should surface raw `validation.error.format()` internals.
 */
import { z } from "zod";
import { NextResponse } from "next/server";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

/** Entity id: non-empty string in mock mode, UUID in production. */
export const idSchema = USE_MOCKS ? z.string().min(1) : z.string().uuid();

/** Uniform 400 for a failed schema parse. Usage: `if (!parsed.success) return zodErrorResponse();` */
export function zodErrorResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
