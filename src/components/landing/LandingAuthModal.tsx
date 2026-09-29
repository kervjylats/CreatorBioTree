/**
 * LandingAuthModal — landing nav "Sign in" button that opens the real
 * LoginForm in a dialog so visitors authenticate without leaving `/`
 * (landing.md Phase 4). Sign-UP stays a link to /onboarding (multi-step flow).
 */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";

export function LandingAuthModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-colors shadow-sm"
      >
        Sign in
      </button>
      <DialogContent className="max-w-[28rem] border-border bg-card p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-left text-2xl font-serif font-bold tracking-tight">
            Welcome back
          </DialogTitle>
        </DialogHeader>
        <LoginForm next="/dashboard" />
      </DialogContent>
    </Dialog>
  );
}
