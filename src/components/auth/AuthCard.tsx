/** Centered auth card — logo, title, subtitle, and content slot. Used by /login (login.md), onboarding, and fan auth. */
import { Trees } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md w-full p-6 sm:p-10 bg-card border border-border shadow-sm rounded-3xl text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-sm">
          <Trees size={32} />
        </div>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-3 tracking-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="text-muted-foreground mb-8 text-sm font-medium leading-relaxed px-4">
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  );
}