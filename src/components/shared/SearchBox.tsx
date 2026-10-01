/**
 * SearchBox — the shared creator search input (Search icon + field + spinner).
 * Visual shell only; wire it to `useCreatorSearch` for live search.
 * Used by the Network hub Discover center; admin tables can adopt later.
 */
import { Search } from "lucide-react";
import { Spinner } from "@/components/shared/Spinner";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchBox({
  value,
  onChange,
  loading = false,
  placeholder = "Search creators by name or username...",
  className = "",
}: SearchBoxProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-foreground"
      />
      {loading && (
        <Spinner size={16} className="absolute right-3 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
}
