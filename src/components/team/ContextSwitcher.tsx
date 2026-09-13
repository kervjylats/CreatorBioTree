/** TODO: Add purpose docstring. */
/**
 * Dropdown showing own context and team contexts for multi-manage switching
 * (team.md Part 3).
 */
"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Context {
  id: string;
  name: string;
  role: string;
}

interface ContextSwitcherProps {
  currentContextId: string;
  onSwitch: (contextId: string) => void;
}

/** Dropdown showing own context and team contexts for multi-manage switching (team.md Part 3). */
export function ContextSwitcher({
  currentContextId,
  onSwitch,
}: ContextSwitcherProps) {
  const [contexts, setContexts] = useState<Context[]>([]);

  useEffect(() => {
    fetch("/api/creator/team/contexts")
      .then((r) => r.json())
      .then((data) => {
        if (data.contexts) setContexts(data.contexts);
      })
      .catch(() => {});
  }, []);

  if (contexts.length <= 1) return null;

  return (
    <Select value={currentContextId} onValueChange={(v) => { if (v) onSwitch(v); }}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Switch dashboard" />
      </SelectTrigger>
      <SelectContent>
        {contexts.map((ctx) => (
          <SelectItem key={ctx.id} value={ctx.id}>
            {ctx.role === "owner" ? "My dashboard" : ctx.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
