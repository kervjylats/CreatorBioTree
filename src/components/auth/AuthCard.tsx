/** Centered auth card — logo, title, subtitle, and content slot. Used by /login (login.md), onboarding, and fan auth. */
import { Logo } from "@/components/shared/Logo";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen-safe flex items-start md:items-center justify-center bg-background px-4 py-12 md:py-0 text-foreground">
      <div className="max-w-md w-full p-6 sm:p-10 bg-card border border-border shadow-sm rounded-3xl text-center">
        <Logo size={32} className="mx-auto mb-6" boxClassName="rounded-2xl" />

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