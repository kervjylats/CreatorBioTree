/** Centralized API response helpers — use instead of inline NextResponse.json in route handlers. */
import { NextResponse } from "next/server";
import { NotFoundError, BadRequestError } from "./api-error";

export function notFoundResponse(entity: string, id?: string) {
  const err = new NotFoundError(entity, id);
  return NextResponse.json({ error: err.message }, { status: 404 });
}

export function badRequestResponse(message: string) {
  const err = new BadRequestError(message);
  return NextResponse.json({ error: err.message }, { status: 400 });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function serverErrorResponse(error?: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Wrap try/catch handlers — checks instanceof NotFoundError for 404, else 500. */
export function handleApiError(error: unknown, entity = "Resource") {
  if (error instanceof NotFoundError) return notFoundResponse(entity);
  console.error("API Error:", error);
  return serverErrorResponse(error);
}