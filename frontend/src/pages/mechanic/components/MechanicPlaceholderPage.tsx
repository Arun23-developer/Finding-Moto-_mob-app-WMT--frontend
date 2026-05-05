import type { ReactNode } from "react";

interface MechanicPlaceholderPageProps {
  title: string;
  description: string;
  summary?: { label: string; value: string }[];
  children: ReactNode;
}

export function MechanicPlaceholderPage({
  title,
  description,
  children,
}: MechanicPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
