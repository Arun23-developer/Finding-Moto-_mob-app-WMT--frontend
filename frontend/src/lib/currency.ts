const wholeNumberFormatter = new Intl.NumberFormat("en-LK", {
  maximumFractionDigits: 0,
});

export function formatLkr(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "LKR 0";
  }

  return `LKR ${wholeNumberFormatter.format(value)}`;
}