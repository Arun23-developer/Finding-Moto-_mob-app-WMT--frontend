interface StatusFilterBarProps {
  activeFilter: string;
  counts: Record<string, number>;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function StatusFilterBar({ activeFilter, counts, onChange, options }: StatusFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={[
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            activeFilter === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted",
          ].join(" ")}
        >
          {option.label} ({counts[option.value] ?? 0})
        </button>
      ))}
    </div>
  );
}