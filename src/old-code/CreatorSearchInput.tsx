/** TODO: Add purpose docstring. */
"use client";

import { Input } from "@/components/ui/input";

interface CreatorSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CreatorSearchInput({ value, onChange, placeholder = "Search by name or username…" }: CreatorSearchInputProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}
